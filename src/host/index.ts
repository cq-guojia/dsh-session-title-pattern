import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import { SessionTitleProviderId } from '@deepseek-ai/dsh-session-title';
import type {
  SessionTitleProvider,
  SessionTitleProviderRequest,
  SessionTitleProviderResult,
  SessionTitleUserMessage,
} from '@deepseek-ai/dsh-session-title';
// 下面几个只为拿到类型增强（ctx.commands / ctx.llm / ctx.settings / session 事件），
// 不含运行时值。tsconfig 的 types 是空的，模块增强必须靠显式 import 才会被加载。
import type {} from '@deepseek-ai/dsh-commands';
import type {} from '@deepseek-ai/dsh-llm';
import type { SessionEvent } from '@deepseek-ai/dsh-session';
import type {} from '@deepseek-ai/dsh-settings';

import { callTitleModel, detectMessageLang, parseTitleOutput, toSummary } from './llm';
import type { LlmService, TypeLang } from './llm';
import { DEFAULT_TITLE_TEMPLATE, buildFallbackTitle, composeTitle } from './rules';
import { foldSessionTitle, normalizeSessionTitle } from '@deepseek-ai/dsh-session-title';

export const name = 'dsh-session-title-pattern';

/**
 * 必须声明为数组。cordis 的 `Inject` 是 `(keyof M)[] | { [服务名]: 配置 }`，
 * 写成 `{ required, optional }` 会被当成「需要名为 required / optional 的服务」，
 * entry 永远 pending，而 pending 的 entry 会让整个 dsh 启动失败。
 *
 * `commands` / `llm` 是可选的，绝不能写在这里 —— 用 apply 里的 `ctx.inject()` 延迟等待。
 */
export const inject = ['sessionTitle'] as const;

/**
 * 设置命名空间。必须全小写连字符（否则 `installSection` 抛 `TypeError`）。
 * 客户端半用同一个字面量注册卡片，两边靠它配对。
 */
const SETTINGS_NS = 'session-title-pattern';

/** 手动重算标题的命令名（不含斜杠）。 */
const RETITLE_COMMAND = 'retitle';

/** 手动改名命令：写入「用户」来源的标题，写入即进入锁定态。 */
const RENAME_COMMAND = 'title-rename';

/** 锁定命令：把当前标题以「用户」来源写回（内容不变），停止自动更新。 */
const LOCK_COMMAND = 'title-lock';

/** 解锁命令：恢复自动更新。标题内容保持不变，**不触发重新生成**。 */
const UNLOCK_COMMAND = 'title-unlock';

/** 草稿命令：按当前模式真算一次标题，**只返回文本、不写标题**，给面板的「自动生成」用。 */
const SUGGEST_COMMAND = 'title-suggest';

/**
 * 锁定状态查询命令：面板打开时用它把「到底锁没锁」问回来。
 *
 * 平台的 title 投影只带文本不带来源（wire 类型是 `string | null`），浏览器读不到
 * `source.kind`，所以「当前是否锁定」只能由 host 回答 —— 这就是 v0.6.0 那条
 * 「锁定态只有本地记忆，刷新后按未锁定显示」限制的彻底解法。
 */
const STATE_COMMAND = 'title-state';

/** `title-state` 的回答：已锁定（标题来源是「用户」）。 */
const LOCKED = 'locked';

/** `title-state` 的回答：未锁定。 */
const UNLOCKED = 'unlocked';

/**
 * 同时跟踪的会话上限。
 *
 * 每个会话只留一行摘要与两个计数，代价极小，但这是个长期运行的插件，
 * 不设上限就是内存泄漏。超出后按插入顺序淘汰最旧的（Map 保持插入序）。
 */
const MAX_TRACKED_SESSIONS = 64;

export interface Config {
  /**
   * 标题格式模板。
   *
   * 可用占位符：`{YYYY}` `{MM}` `{DD}` `{HH}` `{mm}` `{ss}` `{type}` `{topic}`，
   * 日期时间部件可任意拼接（`{MMDD}`、`{YYYYMMDD}`、`{HHmmss}`）；
   * **不写 `{type}` 标题里就没有分类**，不写 `{topic}` 就没有主题。
   * 语法与示例见 `./rules` 的 `formatTitle()`。
   */
  template: string;
  /**
   * 标题总长度上限（UTF-8 字节）。
   *
   * 必须 <= `session-title` 行的 `maxTitleBytes`（dsh-base 默认 80），
   * 否则服务在写入前会二次截断，超出部分被静默丢弃。
   */
  maxBytes: number;
  /**
   * 每多少条人类消息重算一次标题。1 表示每轮都重算（最贵）。
   *
   * **0 表示只在新建会话（首条消息）时算一次，之后不再自动更新** ——
   * 想更新时点标题旁的按钮，或敲 `/retitle`。
   */
  retitleEvery: number;
  /** 显式指定的模型 provider；与 `model` 必须成对，留空则跟随会话主模型。 */
  provider: string;
  /** 显式指定的模型 id；与 `provider` 必须成对。 */
  model: string;
  /** 单次模型调用超时（毫秒）。 */
  timeoutMs: number;
  /** 单次模型调用输出 token 上限。 */
  maxOutputTokens: number;
  /** 单次模型调用输入字节上限（滚动摘要的硬预算）。 */
  maxInputBytes: number;
  /**
   * 「隐藏会话」的总开关，默认打开。
   *
   * 关掉后客户端**整套隐藏功能都不执行**（不注入眼睛、不改任何行的显示），
   * 但 `hiddenSessions` / `revealHiddenAll` **原样保留** —— 重新打开时还是原来那批
   * 会话被隐藏着。关掉不是「重置」，只是一段时间内不执行。
   */
  hiddenEnabled: boolean;
  /**
   * 被用户隐藏的会话 id（插件私有，与平台的「归档」无关）。
   *
   * 只影响客户端要不要显示这一行，**不动会话本身**：会话仍在会话列表数据里，
   * 打开、搜索、命令、标题自动生成全部照常。清空这个数组即全部恢复显示。
   */
  hiddenSessions: string[];
  /**
   * 「工作区」区域标题行那只眼睛的总开关：是否把被隐藏的会话显示出来。
   *
   * 只有这一个开关 —— 曾经做过「按工作区分别覆盖」，实机用起来嫌碎，已去掉。
   */
  revealHiddenAll: boolean;
}

/**
 * 「影响标题生成」的那部分配置的快照。
 *
 * 只有它变化时才该清空滚动摘要（`apply` 里的 `states`）：隐藏 / 显示会话的开关
 * 也写在同一份设置文档里，但它们与标题毫无关系 —— 若照旧一律 `states.clear()`，
 * 用户每点一次眼睛都会把模型逐轮积累的摘要与主线清掉，标题随即被重新归纳一遍。
 */
function titleStateSignature(config: Config): string {
  return [
    config.retitleEvery,
    config.provider,
    config.model,
    config.timeoutMs,
    config.maxOutputTokens,
    config.maxInputBytes,
  ].join('\u0000');
}

export const Config: z<Config> = z.object({
  template: z.string().default(DEFAULT_TITLE_TEMPLATE),
  maxBytes: z.number().step(1).min(20).default(80),
  // min(0)：0 = 不自动重算，只在首条消息时生成一次。
  retitleEvery: z.number().step(1).min(0).default(10),
  provider: z.string().default(''),
  model: z.string().default(''),
  // 90s：推理（thinking）模型的思考计入同一次调用，想完才写标题，本身就可能要
  // 几十秒，再叠加免费档为主会话排队 —— 30s 实测会在「模型其实算得出来」的会话上
  // 超时（TimeoutReason: SESSION_TITLE_TIMEOUT after 30000ms）。
  timeoutMs: z.number().step(1).min(1).default(90_000),
  // 2048：这一层是「保险丝」，不是给用户调的旋钮 —— 它是服务端的硬切断，到点就停。
  // 思考（reasoning）计入同一个预算：512 对推理模型几乎必然不够，想完就一行可见
  // 文本都没有（实测报过 Title model produced no text）。调大不花钱（上限不是
  // 预扣费，模型真写了才计费），因此界面上不暴露这一项。
  maxOutputTokens: z.number().step(1).min(1).default(2048),
  maxInputBytes: z.number().step(1).min(1).default(4096),
  // 隐藏会话：插件私有的显示层开关，与平台「归档」无关（归档是 host 权威且单向的）。
  hiddenEnabled: z.boolean().default(true),
  hiddenSessions: z.array(z.string()).default([]),
  revealHiddenAll: z.boolean().default(false),
});

/**
 * 一个会话的滚动摘要状态。
 *
 * `summary` 与 `seenCount` 就是「只发上次摘要 + 新增几轮」能成立的全部依据：
 * 每次重算只发这一行摘要加新增消息，输入大小与会话总长度无关。
 */
interface SessionState {
  /** 模型维护的「主线」：这段会话从头到尾主要在干什么（抗标题漂移的锚）。 */
  mainLine: string;
  /** 上一次产出的摘要行（`类型|主题`）。 */
  summary: string;
  /** 上一次重算时的人类消息条数。 */
  seenCount: number;
  /** 本会话已见过的人类消息条数，用于判断是否到了重算轮次。 */
  count: number;
  /** 是否已从会话日志恢复过一次（进程重启后内存态归零，首次用到时恢复）。 */
  restored: boolean;
  /**
   * 上一次生成时用的类型语言。
   *
   * 用户换过语言环境后，`summary` 里那个类型是另一种语言，继续喂给模型会把新语言带偏，
   * 所以要能察觉并清掉它（主线是句子、跟对话语言走，不动）。
   */
  lang?: TypeLang;
}

/** 写入并按插入顺序淘汰最旧的一条，避免长期运行内存无界。 */
function remember(map: Map<string, SessionState>, id: string, state: SessionState): void {
  map.delete(id);
  map.set(id, state);
  while (map.size > MAX_TRACKED_SESSIONS) {
    const oldest = map.keys().next();
    if (oldest.done === true) break;
    map.delete(oldest.value);
  }
}

/**
 * 是否为「合格的人类消息」事件。
 *
 * 判定条件与服务内部的 `sessionTitleUserMessageOf` 保持一致：类型是
 * `user/message` 且来源是用户（排除工具结果、系统注入等）。
 */
function isEligibleUserMessage(event: SessionEvent): boolean {
  return event.type === 'user/message' && event.data.source.kind === 'user';
}

/**
 * 从会话事件里收集合格的人类消息（含文本），与服务内部提取逻辑同判定。
 *
 * 「自动生成（只出草稿）」命令在 provider 调用之外运行，拿不到服务递来的
 * `request.messages`，只能自己从事件里提 —— 判定条件与服务的
 * `sessionTitleUserMessageOf` 逐条对齐：`user/message` + 用户来源，
 * 取全部 text 块按行拼接，归一化后为空的消息（纯附件、纯空白）跳过。
 */
function collectHumanMessages(events: readonly SessionEvent[]): SessionTitleUserMessage[] {
  const messages: SessionTitleUserMessage[] = [];
  for (const event of events) {
    // 内联判定而不是调用 isEligibleUserMessage：类型收窄需要字面的判别式联合检查。
    if (event.type !== 'user/message' || event.data.source.kind !== 'user') continue;
    const text = event.data.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');
    if (normalizeSessionTitle(text, Number.MAX_SAFE_INTEGER).length === 0) continue;
    messages.push({ seq: event.seq, text });
  }
  return messages;
}

/**
 * 标题里日期时间部件的锚点：**会话创建的瞬间**，不是「生成标题的那一刻」。
 *
 * 原来传 `new Date()`，于是每满 `retitleEvery` 条重算一次、日期就刷新一次：跨零点继续聊，
 * 同一个会话的 `MMDD` 当天就变了；对老会话敲 `/retitle` 也会把前缀跳到今天。
 *
 * `header.createdAt` 是存储层在创建会话时写死的 Unix 毫秒（恢复 / 重启读回同一个值），
 * 所以前缀稳定成「这段对话是哪天开的」，重算多少次都不动。
 */
function sessionStartedAt(session: SessionTitleProviderRequest['session']): Date {
  return new Date(session.header.createdAt);
}

class SessionTitlePatternProvider implements SessionTitleProvider {
  readonly id = SessionTitleProviderId(name);
  /**
   * 保持 `first-prompt`：首条消息由服务的自动调度生成，之后的重算由本插件
   * 在 `session/event` 里按轮次显式调 `refresh()` 驱动。
   *
   * 不改成 `all-prompts` 的原因：那会让**每条用户消息**都触发一次 provider 调用，
   * 非重算轮我们只能返回同一个标题，于是每轮都往会话日志里写一条重复的
   * `session/title` 事件。
   */
  readonly automatic = 'first-prompt' as const;

  constructor(
    private readonly ctx: Context,
    /**
     * 每次读取当前生效的配置。
     *
     * 不能在构造时把 config 冻结进字段：设置服务挂上来之后会把来源换成「解析后的
     * 用户设置」，并在每次提交后替换 —— 冻结了就永远读不到用户在设置页改的值。
     */
    private readonly getConfig: () => Config,
    private readonly states: Map<string, SessionState>,
    /** 延迟注入的 llm 服务；未就绪时返回 undefined。 */
    private readonly getLlm: () => LlmService | undefined,
    /** 本次该用哪种语言的类型标签（语言环境优先，拿不到才看对话语言）。 */
    private readonly resolveTypeLang: (messages: readonly SessionTitleUserMessage[]) => TypeLang,
    ) {}

    /**
     * 待处理的解锁请求（会话 id 集合）。
     *
     * 平台的解锁唯一切入点是 `refresh()`，而 refresh 会驱动一次 provider 调用 ——
     * 用户要求「解锁不重新生成」，所以解锁命令先在这里挂号，随后触发的 generate()
     * 看到挂号就**原样返回当前标题**：文字一个字不变、不调模型，只有来源从
     * 「用户」变回「provider」，自动更新就此恢复。
     */
    private readonly pendingUnlocks = new Set<string>();

    /** 解锁挂号。若 refresh 在调用 generate 前失败，挂号会留到下一次重算时生效（延迟解锁，无害）。 */
    requestUnlock(sessionId: string): void {
      this.pendingUnlocks.add(sessionId);
    }

    private stateOf(id: string): SessionState {
    const existing = this.states.get(id);
    if (existing !== undefined) return existing;
    const created: SessionState = { mainLine: '', summary: '', seenCount: 0, count: 0, restored: false };
    remember(this.states, id, created);
    return created;
  }

  async generate(request: SessionTitleProviderRequest): Promise<SessionTitleProviderResult> {
    // 解锁请求：原样返回当前标题（见 pendingUnlocks 的注释）。零成本解锁的关键路径。
    if (this.pendingUnlocks.delete(request.session.id)) {
      const current = this.ctx.sessionTitle.get(request.session);
      if (current !== undefined && current.title.length > 0) {
        // **用户改名的标题 messageSeqs 是空的** —— 平台语义就如此（手动命名不指认
        // 任何消息），而服务要求 provider 至少指认一条，空数组会被 validateResult
        // 拒掉：`session-title provider must identify at least one source message seq`
        // （实机就是这么失败的：锁定=rename，解锁时拿到的就是空数组）。
        // 用本次 request 收到的消息 seq 顶上：解锁只换来源，指认哪些消息不影响文字。
        const seqs =
          current.messageSeqs.length > 0
            ? current.messageSeqs
            : request.messages.map((message) => message.seq);
        if (seqs.length > 0) return { title: current.title, messageSeqs: seqs };
      }
      // 没有可保留的标题、或连消息都没有：照常生成。
    }
    const messageSeqs = request.messages.map((message) => message.seq);
    // 每次调用都读当前生效的配置，而不是构造时冻结的那份。
    const config = this.getConfig();
    // 日期锚点：会话创建时刻。用 `new Date()` 会让前缀随每次重算漂移（见 sessionStartedAt）。
    const createdAt = sessionStartedAt(request.session);

    const state = this.stateOf(request.session.id);
    // 进程重启后内存态归零：从会话日志把上一次的标题找回来当锚。
    // 标题是「日期｜类型｜主题」，去掉日期段就是上次的 类型|主题；主题同时兼任主线 ——
    // 近似恢复，足够把方向锚住。每个进程生命周期只做一次（restored 标记）。
    if (!state.restored) {
      state.restored = true;
      if (state.summary === '' && state.mainLine === '') {
        const snapshot = foldSessionTitle(request.session.snapshotEvents());
        if (snapshot !== undefined) {
          const parts = snapshot.title.split(/[|｜]/).map((part) => part.trim()).filter((part) => part.length > 0);
          if (parts.length >= 3) {
            state.summary = `${parts[1]}|${parts.slice(2).join('｜')}`;
            state.mainLine = parts.slice(2).join('｜');
          }
        }
      }
    }

    // 类型语言：**用户的语言环境**优先（中文环境下即便对话是英文，类型也用中文）；
    // 读不到语言环境才退回按对话语言判断。
    const typeLang = this.resolveTypeLang(request.messages);
    if (state.lang !== undefined && state.lang !== typeLang) {
      // 语言环境换过：摘要里那个类型是另一种语言，清掉，别让它把这一轮的类型语言带偏
      // （主线是句子、跟对话语言走，保留）。
      state.summary = '';
    }
    state.lang = typeLang;

    try {
      const llm = this.getLlm();
      if (llm === undefined) {
        throw new Error(
          'The llm service is not ready: this composition has no usable @deepseek-ai/dsh-llm',
        );
      }
      const startedAt = Date.now();
      const { text, route, inputBytes, truncated } = await callTitleModel(
        llm,
        name,
        config,
        request,
        state,
        typeLang,
      );

      const parsed = parseTitleOutput(text, typeLang);
      // 模型没按 `类型|主题` 输出时**直接省略类型**：模板里 `{type}` 整段消失、
      // 相邻分隔符一并收掉，主题照用 —— 不因为格式问题让整次生成失败。
      const title = composeTitle(createdAt, parsed.type, parsed.topic, config);

      // 主线：模型给了就更新（它自己判断主线有没有变）；没给就沿用上一次的。
      state.mainLine = parsed.mainLine.length > 0 ? parsed.mainLine : state.mainLine;
      state.summary = toSummary(parsed.titleLine);
      state.seenCount = request.messages.length;

      // 可观测性：每次真调模型都留一条。出问题时一眼能看出走了哪条路由、
      // 发了多少字节、花了多久 —— 之前正常调用是完全静默的，排查只能靠猜。
      this.ctx.logger(name).info(
        `Title generated (message #${request.messages.length}, ${route.provider}/${route.model}, ` +
          `${inputBytes} bytes in, ${Date.now() - startedAt}ms): ${title}` +
          `; main line: ${state.mainLine || '(empty)'}`,
      );
      if (truncated) {
        this.ctx.logger(name).warn(
          `Title model hit the output limit (maxOutputTokens=${config.maxOutputTokens}); ` +
            'using the first line instead. Raise it or switch to a non-reasoning model if this repeats.',
        );
      }
      return { title, messageSeqs, model: route };
    } catch (error) {
      // 轮次仍然推进：否则失败后每一轮都会重试同一个调用，反而更费 token。
      // 跳过的这几轮会在下一次重算时作为「新增消息」一并补上。
      state.seenCount = request.messages.length;

      // **已有标题 → 抛错，保留上一次标题**：服务的 runProvider 只在 provider 成功
      // 返回后才 append 新的 session/title 修订，抛错就是它保留旧标题的机制。
      const current = this.ctx.sessionTitle.get(request.session);
      if (current !== undefined && current.title.length > 0) {
        this.ctx.logger(name).warn(
          `Title generation failed after message #${request.messages.length}; ` +
            `keeping the previous title: ${String(error)}`,
        );
        throw error;
      }

      // **还没有标题 → 本地兜底**（日期 + 首条消息正文，省略类型），别让新会话
      // 停在平台的默认标题上。兜底标题来源仍是 provider，自动更新照常继续。
      const fallback = buildFallbackTitle(request.messages, config, createdAt);
      if (fallback.length === 0) {
        this.ctx.logger(name).warn(
          `Title generation failed after message #${request.messages.length} and no local ` +
            `fallback was possible: ${String(error)}`,
        );
        throw error;
      }
      this.ctx.logger(name).warn(
        `Title generation failed after message #${request.messages.length}; using a local ` +
          `fallback title: ${fallback} (${String(error)})`,
      );
      return { title: fallback, messageSeqs };
    }
  }
}

/**
 * 注册改名 / 锁定命令（设置面板与标题旁的面板都走它们）。
 *
 * 锁定的实现：`rename()` 写入的标题来源是「用户」，自动命名随即停止 —— 这是平台的
 * 既有语义，所以「锁定不改字」就是把当前标题原样写回。解锁 = `/retitle`（refresh
 * 会覆盖已固定的用户标题，文档明确这是解锁路径）。
 */
function registerTitleEditCommands(ctx: Context, getConfig: () => Config): void {
  ctx.effect(() =>
    ctx.commands.register({
      name: RENAME_COMMAND,
      description: 'Manually set the session title (locks it and stops automatic updates)',
      handler: ({ agent, rawInput }) => {
        const text = normalizeSessionTitle(rawInput.trim(), getConfig().maxBytes);
        // 空输入与超长（会被 maxBytes 截到空）都直接忽略；截断兜底让 rename 不会因长度抛错。
        if (text.length === 0) return { kind: 'error', text: 'Title is empty; ignored' };
        try {
          ctx.sessionTitle.rename(agent.session, text);
          return { kind: 'success', text: 'Title updated and locked (automatic updates stopped)' };
        } catch (error) {
          return { kind: 'error', text: `Failed to update title: ${String(error)}` };
        }
      },
    }),
  );
  ctx.effect(() =>
    ctx.commands.register({
      name: LOCK_COMMAND,
      description: 'Lock the current session title (stops automatic updates)',
      handler: ({ agent }) => {
        const snapshot = ctx.sessionTitle.get(agent.session);
        if (snapshot === undefined) return { kind: 'error', text: 'This session has no title yet' };
        try {
          // 把当前标题以「用户修改」的名义写回：内容不变，但进入锁定态。
          ctx.sessionTitle.rename(agent.session, snapshot.title);
          return { kind: 'success', text: 'Title locked (automatic updates stopped)' };
        } catch (error) {
          return { kind: 'error', text: `Failed to lock title: ${String(error)}` };
        }
      },
    }),
  );
}

/**
 * 草稿该用哪条模型路由。
 *
 * 服务的自动调度会把「当前主请求路由」塞进 `request.route`（取自
 * `session.requestHeader()?.config`），而草稿命令是**自己拼 request** 的 ——
 * 不补这一条，跟随对话模型时必然落到 `resolveRoute()` 的「没有可用的模型路由」
 * 分支（v0.6.2 实机就是这个错，而 `/retitle` 走服务所以一直是好的）。
 *
 * 取不到就返回 undefined，由调用方退回关键词规则：草稿只是个可编辑的起点，
 * 不值得为它报一个错误。
 */
function draftRoute(
  session: SessionTitleProviderRequest['session'],
  config: Config,
): { provider: string; model: string } | undefined {
  if (config.provider.length > 0 && config.model.length > 0) {
    return { provider: config.provider, model: config.model };
  }
  const header = session.requestHeader();
  if (header === undefined) return undefined;
  return { provider: header.config.provider, model: header.config.model };
}

/**
 * 面板专用命令：`title-suggest`（自动生成的草稿）、`title-unlock`（单纯解锁）
 * 与 `title-state`（查锁定状态）。
 *
 * 两个命令都给设置面板的浮层用，不打算让用户手敲，但注册成命令可以完全复用
 * 命令通道（host 执行、结果随 CommandResult 带回浏览器），不用另开远程接口。
 */
function registerPanelCommands(
  ctx: Context,
  options: {
    getConfig: () => Config;
    getLlm: () => LlmService | undefined;
    /**
     * 本次该用哪种语言的类型标签。
     *
     * 草稿走的是命令通道，拿不到 provider 内部那份「按会话」的状态，所以在这里现算一次。
     */
    resolveTypeLang: (messages: readonly SessionTitleUserMessage[]) => TypeLang;
    states: Map<string, SessionState>;
    provider: SessionTitlePatternProvider;
  },
): void {
  const { getConfig, getLlm, resolveTypeLang, states, provider } = options;

  ctx.effect(() =>
    ctx.commands.register({
      name: SUGGEST_COMMAND,
      description: 'Draft a title from the current conversation (returns text only, never writes it)',
      recordInput: false,
      handler: async ({ agent, signal }) => {
        const config = getConfig();
        // 与自动生成同口径：草稿的日期也用会话创建时刻，否则预览与正式标题会差一天。
        const createdAt = sessionStartedAt(agent.session);
        const messages = collectHumanMessages(agent.session.snapshotEvents());
        if (messages.length === 0) {
          return { kind: 'error', text: 'This session has no messages usable for a title yet' };
        }
        // 会话是否已有标题：有 = 用户在改标题，失败就直接报错；没有 = 首次，失败走本地兜底。
        const current = ctx.sessionTitle.get(agent.session);
        const hasTitle = current !== undefined && current.title.length > 0;
        try {
          // 路由必须自己补：草稿不走服务的自动调度，没人替我们填 request.route。
          const route = draftRoute(agent.session, config);
          const llm = getLlm();
          if (route !== undefined && llm !== undefined) {
            // 草稿是**只读**的旁路：滚动状态传浅拷贝，绝不碰真身的
            // summary / seenCount / mainLine —— 正式重算的增量逻辑不能被预览打扰。
            const existing = states.get(agent.session.id);
            const scratch: SessionState = existing
              ? { ...existing }
              : { mainLine: '', summary: '', seenCount: 0, count: 0, restored: true };
            const request: SessionTitleProviderRequest = {
              session: agent.session,
              messages,
              route,
              signal,
            };
            const typeLang = resolveTypeLang(messages);
            const { text } = await callTitleModel(llm, name, config, request, scratch, typeLang);
            const parsed = parseTitleOutput(text, typeLang);
            return {
              kind: 'success',
              text: composeTitle(createdAt, parsed.type, parsed.topic, config),
            };
          }
          if (hasTitle) {
            // 已有标题 = 用户在改标题：拿不到模型就直接报错，不给他一版假的草稿。
            ctx.logger(name).warn(
              'Draft title requested but no usable model route is available for this draft',
            );
            return {
              kind: 'error',
              text: 'Failed to draft a title: no usable model route (set both provider and model)',
            };
          }
          // 首次（会话还没有标题）：退到本地兜底，按钮永远有反馈。
          ctx.logger(name).warn(
            'Draft title: no usable model route; falling back to a local title for a session ' +
              'that has no title yet',
          );
          return { kind: 'success', text: buildFallbackTitle(messages, config, createdAt) };
        } catch (error) {
          if (hasTitle) return { kind: 'error', text: `Failed to draft a title: ${String(error)}` };
          const fallback = buildFallbackTitle(messages, config, createdAt);
          if (fallback.length > 0) {
            ctx.logger(name).warn(
              `Draft title model call failed; using a local fallback: ${String(error)}`,
            );
            return { kind: 'success', text: fallback };
          }
          return { kind: 'error', text: `Failed to draft a title: ${String(error)}` };
        }
      },
    }),
  );

  ctx.effect(() =>
    ctx.commands.register({
      name: UNLOCK_COMMAND,
      description: 'Unlock the session title (resumes automatic updates; title text unchanged)',
      recordInput: false,
      handler: async ({ agent }) => {
        const current = ctx.sessionTitle.get(agent.session);
        if (current === undefined) return { kind: 'error', text: 'This session has no title yet' };
        // 平台的解锁唯一切入点是 refresh()，而 refresh 会驱动一次 provider 调用；
        // 先挂号，generate() 看到挂号就原样返回当前标题 —— 文字不变、不调模型。
        provider.requestUnlock(agent.session.id);
        try {
          await ctx.sessionTitle.refresh(agent.session);
          return { kind: 'success', text: 'Unlocked: automatic updates resumed (title text unchanged)' };
        } catch (error) {
          return { kind: 'error', text: `Failed to unlock title: ${String(error)}` };
        }
      },
    }),
  );

  ctx.effect(() =>
    ctx.commands.register({
      name: STATE_COMMAND,
      description: 'Report whether the current session title is locked',
      recordInput: false,
      handler: ({ agent }) => {
        // 「锁没锁」就是标题来源是不是「用户」：rename 写入的标题 source 为 user，
        // 自动命名随即停止调度。这个字段只有 host 看得到，面板靠本命令拿它。
        const snapshot = ctx.sessionTitle.get(agent.session);
        return {
          kind: 'success',
          text: snapshot?.source.kind === 'user' ? LOCKED : UNLOCKED,
        };
      },
    }),
  );
}

/**
 * 注册 `/retitle` 命令：手动重算一次当前会话标题。
 *
 * `refresh()` 是解除用户 pin 的唯一切入口 —— 用户手动重命名过的会话处于
 * pinned 状态，自动命名会停止调度，只有它能重新接管。
 *
 * 手动重算会重置滚动状态（`seenCount` 归零、摘要清空），让这次调用重新基于
 * 「首条 + 最近一批」归纳；**主线保留** —— 那是模型逐轮积累的抗漂移锚，清了就找不回来。
 */
function registerRetitleCommand(ctx: Context, states: Map<string, SessionState>): void {
  ctx.effect(() =>
    ctx.commands.register({
      name: RETITLE_COMMAND,
      description: 'Regenerate the session title from the conversation',
      // 命令不接受输入，没必要在会话日志里重复记一条空输入。
      recordInput: false,
      handler: async ({ agent, signal }) => {
        const state = states.get(agent.session.id);
        if (state !== undefined) {
          // 清摘要与计数：让这次调用基于「首条 + 最近一批」重来。
          // **主线刻意保留** —— 它是模型逐轮积累的判断，是抗漂移的锚。手动重算的输入
          // 只有首条和最近一批（maxInputBytes 闸门从旧往新丢），主线若出现在会话中段，
          // 清掉它就再也找不回来了。保留的代价为零（一行、几十字节），而且提示词
          // 允许模型在会话目标真变了时改它，所以「重新归纳」的能力并没有丢。
          state.summary = '';
          state.seenCount = 0;
        }
        try {
          const snapshot = await ctx.sessionTitle.refresh(agent.session, signal);
          if (snapshot === undefined) {
            return {
              kind: 'error',
              text: 'This session has no messages usable for generating a title',
            };
          }
          return { kind: 'success', text: snapshot.title };
        } catch (error) {
          return { kind: 'error', text: `Failed to generate title: ${String(error)}` };
        }
      },
    }),
  );
}

/**
 * 按轮次驱动重算。
 *
 * 服务只会在**首条**人类消息时自动调用 provider（`first-prompt`），后续轮次
 * 需要我们自己在 `session/event` 上数：每满 `retitleEvery` 条就显式 `refresh()`
 * 一次。这样非重算轮根本不会被调用，也不会写重复的标题事件。
 *
 * `retitleEvery` 为 0 时整个自动重算关掉：标题只在首条消息时生成一次，
 * 之后想更新只能手动（`/retitle`，或标题旁的按钮）。
 */
function trackRecomputes(
  ctx: Context,
  getConfig: () => Config,
  states: Map<string, SessionState>,
): void {
  ctx.on('session/event', (session, event) => {
    const config = getConfig();
    if (!isEligibleUserMessage(event)) return;
    // 只处理顶层会话。fork 出的子会话（子代理）沿用服务的既有行为：不做自动命名、
    // 也不参与重算 —— 否则每次 fork 都要多付一次模型调用。
    if (session.header.parentSession !== undefined) return;

    const state =
      states.get(session.id) ?? { mainLine: '', summary: '', seenCount: 0, count: 0, restored: false };
    state.count += 1;
    if (!states.has(session.id)) remember(states, session.id, state);

    // 0 = 不自动重算。显式挡掉而不是靠取模：`x % 0` 是 NaN，靠它挡属于撞运气。
    if (config.retitleEvery <= 0) return;
    // 第 1 条走服务的自动调度，这里不重复触发。
    if (state.count < 2 || state.count % config.retitleEvery !== 0) return;
    // 用户手动重命名过的会话处于 pinned 状态，不再自动接管（与服务的自动调度口径一致）。
    if (ctx.sessionTitle.get(session)?.source.kind === 'user') return;

    ctx.logger(name).info(
      `Message #${state.count}; recomputing the title (every ${config.retitleEvery} messages)`,
    );

    // 事件是 fire-and-forget 的通知，不能阻塞它；失败已由 provider 内部记录。
    void ctx.sessionTitle.refresh(session).catch(() => undefined);
  });

  ctx.on('session/disposed', (session) => {
    states.delete(session.id);
  });
}

export function apply(ctx: Context, config: Config): void {
  const states = new Map<string, SessionState>();
  const logger = ctx.logger(name);

  // 当前生效的配置来源。默认是 cordis 组合里的 entry；设置服务挂上来之后会被换成
  // 「解析后的用户设置」，并在每次提交后替换。所以所有读取都必须经过这里，
  // 绝不能把 apply 收到的 config 冻结进闭包。
  let source: () => Config = () => config;
  const currentConfig = (): Config => source();

  // llm 绝不能写进 inject 声明：声明式依赖会让本 entry 在缺少该服务的组合里
  // 一直 pending，而 pending 的 entry 会让整个 dsh 启动失败。用 ctx.inject 延迟等待：
  // 拿不到就只是「模型不可用」，走「保留上一次标题 / 无标题时本地兜底」的降级。
  //
  // 也不能直接写 `ctx.llm` —— cordis 的 Context 是受保护的代理，未声明的服务
  // 属性一访问就抛 `cannot get property "llm" without inject`。
  let llm: LlmService | undefined;
  ctx.inject(['llm'], (llmCtx) => {
    llm = llmCtx.llm;
  });

  /**
   * 用户的语言环境（设置里的语言）。
   *
   * host 侧**没有** locale 服务，但 locale 插件把偏好存进了设置文档的 `locale` 命名空间
   * （字段 `preference`），而 `ctx.settings.get()` 是公开读取面 —— 所以这里读得到。
   * 同样走延迟注入，不能直接写 `ctx.settings`（受保护代理会抛）。
   */
  let settings: Context['settings'] | undefined;

  /**
   * 取用户选的语言环境；读不到返回 undefined。
   *
   * 读不到有两种情况：用户从没显式选过语言（那时真实语言由浏览器推导，host 看不到），
   * 或这份组合里根本没注册 `locale` 命名空间。都由调用方退回「按对话语言判断」。
   */
  const getUiLocale = (): TypeLang | undefined => {
    try {
      const section = settings?.get('locale') as { preference?: unknown } | undefined;
      const preference = section?.preference;
      return preference === 'zh' || preference === 'en' ? preference : undefined;
    } catch {
      // 读不到不该拖垮标题生成（命名空间没注册 / 文档形状意外），退回对话语言。
      return undefined;
    }
  };

  /** 类型标签该用哪种语言：语言环境优先，拿不到才看对话语言。 */
  const resolveTypeLang = (messages: readonly SessionTitleUserMessage[]): TypeLang =>
    getUiLocale() ?? detectMessageLang(messages);

  const provider = new SessionTitlePatternProvider(
    ctx,
    currentConfig,
    states,
    () => llm,
    resolveTypeLang,
  );

  // SessionTitleService.register() 是全局单例，重复注册直接抛。
  // 正常情况下我们的 bundle patch 会禁用 dsh-base 的 session-title-llm，
  // 但当用户把本包排在 dsh-base 之前、或另有插件抢先注册时仍会冲突。
  // 这里绝不能让异常冒泡：apply() 抛错会让插件 fiber 失败，进而拖垮启动。
  let dispose: () => Promise<void>;
  try {
    dispose = ctx.sessionTitle.register(provider);
  } catch (error) {
    logger.warn(
      'Failed to register the title provider; session titles fall back to the built-in rule. ' +
        'Another provider (e.g. dsh-base session-title-llm) most likely registered first, ' +
        `and SessionTitleService allows only one globally: ${String(error)}`,
    );
    return;
  }

  ctx.effect(() => dispose);

  // 把本插件的 Config 暴露成用户可编辑的 settings section：设置页的「插件」标签页
  // 会遍历 host 提供的命名空间，并按命名空间找到我们在浏览器里注册的那张卡片。
  //
  // 同样不能直接写 `ctx.settings`（受保护代理），走 ctx.inject 延迟等待。
  // 上一次「影响标题生成」的配置快照，用来判断这次 onChange 要不要清滚动摘要。
  let lastTitleSignature = titleStateSignature(config);

  ctx.inject(['settings'], (settingsCtx) => {
    settings = settingsCtx.settings;
    settingsCtx.settings.installSection(ctx, SETTINGS_NS, Config, config, {
      setSource: (current) => {
        source = current;
      },
      onChange: () => {
        const next = currentConfig();
        // 只有影响标题生成的字段变了才清空滚动摘要：换了模型或重算间隔之后，旧摘要
        // 不再匹配新设置，让下一次重算按新配置从头开始。
        //
        // 隐藏 / 显示会话也写在同一份文档里，却不该动滚动状态 —— 否则每次点眼睛
        // 都会把摘要与主线清掉，标题被重新归纳一遍（见 titleStateSignature）。
        const signature = titleStateSignature(next);
        if (signature !== lastTitleSignature) {
          lastTitleSignature = signature;
          states.clear();
        }
        logger.info(
          `Settings updated: retitleEvery=${next.retitleEvery}, ` +
            `hidden ${next.hiddenSessions.length}`,
        );
      },
      validate: (value) => {
        // schema 表达不了的跨字段约束：provider 与 model 必须成对。
        // 抛错会拒绝这次写入，用户在设置页立刻收到失败提示。
        if ((value.provider.length > 0) !== (value.model.length > 0)) {
          throw new Error('provider and model must be set together, or both left empty');
        }
      },
    });
  });

  // 组合配置（cordis 配置）里只填了一项的情况走不到 validate，这里补一条提示。
  const initial = currentConfig();
  if ((initial.provider.length > 0) !== (initial.model.length > 0)) {
    logger.warn(
      `provider / model must be configured as a pair; currently provider=` +
        `${JSON.stringify(initial.provider)}, model=${JSON.stringify(initial.model)}. ` +
        'Both are ignored and the session main model is followed instead.',
    );
  }

  // 不按「当时的模式」决定要不要挂订阅：模式可以在设置里随时切换。
  trackRecomputes(ctx, currentConfig, states);

  // commands 由 dsh-base 提供，但绝不能写进 inject 声明：组合里一旦没有命令服务，
  // 声明式依赖会让本 entry 永远 pending，而 pending 的 entry 会让 dsh 启动失败。
  // 用 ctx.inject 延迟等待：它没出现就只是没有 /retitle，自动生成标题照常工作。
  //
  // **注册必须走 inject 给回的 commandCtx**：apply 收到的 ctx 是受保护代理，
  // 未声明就访问 ctx.commands 会同步抛 `cannot get property "commands" without
  // inject`，apply 一抛整个 dsh 都起不来（v0.5.23 的实际事故）。/retitle 一直是
  // 这个写法所以没事，两个新命令照抄它。
  ctx.inject(['commands'], (commandCtx) => {
    registerRetitleCommand(commandCtx, states);
    registerTitleEditCommands(commandCtx, currentConfig);
    registerPanelCommands(commandCtx, {
      getConfig: currentConfig,
      getLlm: () => llm,
      resolveTypeLang,
      states,
      provider,
    });
  });
}
