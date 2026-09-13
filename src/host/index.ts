import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import { SessionTitleProviderId } from '@deepseek-ai/dsh-session-title';
import type {
  SessionTitleProvider,
  SessionTitleProviderRequest,
  SessionTitleProviderResult,
} from '@deepseek-ai/dsh-session-title';
// 下面几个只为拿到类型增强（ctx.commands / ctx.llm / ctx.settings / session 事件），
// 不含运行时值。tsconfig 的 types 是空的，模块增强必须靠显式 import 才会被加载。
import type {} from '@deepseek-ai/dsh-commands';
import type {} from '@deepseek-ai/dsh-llm';
import type { SessionEvent } from '@deepseek-ai/dsh-session';
import type {} from '@deepseek-ai/dsh-settings';

import { callTitleModel, parseTitleLine, toSummary } from './llm';
import type { LlmService } from './llm';
import {
  DEFAULT_TITLE_TEMPLATE,
  FALLBACK_TYPE,
  buildRuleTitle,
  classifyMessage,
  composeTitle,
} from './rules';

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
  /** `llm` 用模型总结类型与主题；`rules` 回到零 token 的关键词规则。 */
  mode: 'llm' | 'rules';
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
}

export const Config: z<Config> = z.object({
  template: z.string().default(DEFAULT_TITLE_TEMPLATE),
  maxBytes: z.number().step(1).min(20).default(80),
  mode: z.union([z.const('llm'), z.const('rules')]).default('llm'),
  // min(0)：0 = 不自动重算，只在首条消息时生成一次。
  retitleEvery: z.number().step(1).min(0).default(5),
  provider: z.string().default(''),
  model: z.string().default(''),
  // 30s 而不是 15s：手动重算会重置滚动状态、基于整段对话重来，再叠加免费档
  // 可能正在为主会话排队，15s 实测不够用（TimeoutReason: SESSION_TITLE_TIMEOUT）。
  timeoutMs: z.number().step(1).min(1).default(30_000),
  maxOutputTokens: z.number().step(1).min(1).default(64),
  maxInputBytes: z.number().step(1).min(1).default(4096),
});

/**
 * 一个会话的滚动摘要状态。
 *
 * `summary` 与 `seenCount` 就是「只发上次摘要 + 新增几轮」能成立的全部依据：
 * 每次重算只发这一行摘要加新增消息，输入大小与会话总长度无关。
 */
interface SessionState {
  /** 上一次产出的摘要行（`类型|主题`）。 */
  summary: string;
  /** 上一次重算时的人类消息条数。 */
  seenCount: number;
  /** 本会话已见过的人类消息条数，用于判断是否到了重算轮次。 */
  count: number;
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
  ) {}

  private stateOf(id: string): SessionState {
    const existing = this.states.get(id);
    if (existing !== undefined) return existing;
    const created: SessionState = { summary: '', seenCount: 0, count: 0 };
    remember(this.states, id, created);
    return created;
  }

  async generate(request: SessionTitleProviderRequest): Promise<SessionTitleProviderResult> {
    const messageSeqs = request.messages.map((message) => message.seq);
    // 每次调用都读当前生效的配置，而不是构造时冻结的那份。
    const config = this.getConfig();

    if (config.mode !== 'llm') {
      return { title: buildRuleTitle(request.messages, config), messageSeqs };
    }

    const state = this.stateOf(request.session.id);

    try {
      const llm = this.getLlm();
      if (llm === undefined) {
        throw new Error(
          'llm 服务尚未就绪：当前组合里没有可用的 @deepseek-ai/dsh-llm，' +
            '请安装它，或把本插件的 mode 设为 rules',
        );
      }
      const startedAt = Date.now();
      const { text, route, inputBytes } = await callTitleModel(llm, name, config, request, state);

      const parsed = parseTitleLine(text);
      const first = request.messages[0];
      // 模型没按 `类型|主题` 输出时，类型回退到规则分类，主题照用，
      // 不因为格式问题让整次生成失败。
      const type =
        parsed.type.length > 0
          ? parsed.type
          : first !== undefined
            ? classifyMessage(first)
            : FALLBACK_TYPE;
      const title = composeTitle(new Date(), type, parsed.topic, config);

      state.summary = toSummary(text);
      state.seenCount = request.messages.length;

      // 可观测性：每次真调模型都留一条。出问题时一眼能看出走了哪条路由、
      // 发了多少字节、花了多久 —— 之前正常调用是完全静默的，排查只能靠猜。
      this.ctx.logger(name).info(
        `标题已生成（第 ${request.messages.length} 条消息，${route.provider}/${route.model}，` +
          `输入 ${inputBytes} 字节，耗时 ${Date.now() - startedAt}ms）：${title}`,
      );
      return { title, messageSeqs, model: route };
    } catch (error) {
      // 降级：**不覆盖已有标题**。服务的 runProvider 只在 provider 成功返回后才
      // append 新的 session/title 修订，抛错即可让它保留上一次的标题
      // （首轮失败则没有标题，服务会写入内置 fallback）。
      //
      // 轮次仍然推进：否则失败后每一轮都会重试同一个调用，反而更费 token。
      // 跳过的这几轮会在下一次重算时作为「新增消息」一并补上。
      state.seenCount = request.messages.length;
      this.ctx.logger(name).warn(
        `第 ${request.messages.length} 条消息后生成标题失败，保留上一次标题：${String(error)}`,
      );
      throw error;
    }
  }
}

/**
 * 注册 `/retitle` 命令：手动重算一次当前会话标题。
 *
 * `refresh()` 是解除用户 pin 的唯一切入口 —— 用户手动重命名过的会话处于
 * pinned 状态，自动命名会停止调度，只有它能重新接管。
 *
 * 手动重算会重置滚动状态（`seenCount` 归零、摘要清空），让这次调用尽可能基于
 * 全部对话重来，而不是只发增量。
 */
function registerRetitleCommand(ctx: Context, states: Map<string, SessionState>): void {
  ctx.effect(() =>
    ctx.commands.register({
      name: RETITLE_COMMAND,
      description: '根据对话重新生成标题',
      // 命令不接受输入，没必要在会话日志里重复记一条空输入。
      recordInput: false,
      handler: async ({ agent, signal }) => {
        const state = states.get(agent.session.id);
        if (state !== undefined) {
          state.summary = '';
          state.seenCount = 0;
        }
        try {
          const snapshot = await ctx.sessionTitle.refresh(agent.session, signal);
          if (snapshot === undefined) {
            return { kind: 'error', text: '当前会话还没有可用于生成标题的消息' };
          }
          return { kind: 'success', text: snapshot.title };
        } catch (error) {
          return { kind: 'error', text: `生成标题失败：${String(error)}` };
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
    // 模式每次现读：用户可以在设置里随时切回 rules，订阅不能只在 apply 时判断一次。
    const config = getConfig();
    if (config.mode !== 'llm' || !isEligibleUserMessage(event)) return;
    // 只处理顶层会话。fork 出的子会话（子代理）沿用服务的既有行为：不做自动命名、
    // 也不参与重算 —— 否则每次 fork 都要多付一次模型调用。
    if (session.header.parentSession !== undefined) return;

    const state = states.get(session.id) ?? { summary: '', seenCount: 0, count: 0 };
    state.count += 1;
    if (!states.has(session.id)) remember(states, session.id, state);

    // 0 = 不自动重算。显式挡掉而不是靠取模：`x % 0` 是 NaN，靠它挡属于撞运气。
    if (config.retitleEvery <= 0) return;
    // 第 1 条走服务的自动调度，这里不重复触发。
    if (state.count < 2 || state.count % config.retitleEvery !== 0) return;
    // 用户手动重命名过的会话处于 pinned 状态，不再自动接管（与服务的自动调度口径一致）。
    if (ctx.sessionTitle.get(session)?.source.kind === 'user') return;

    ctx.logger(name).info(
      `第 ${state.count} 条消息，触发一次标题重算（每 ${config.retitleEvery} 条一次）`,
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

  // llm 绝不能写进 inject 声明：`mode: rules` 时我们根本不需要它，而声明式依赖
  // 会让本 entry 在缺少该服务的组合里一直 pending。用 ctx.inject 延迟等待：
  // 拿不到就只是「LLM 模式不可用」，rules 模式照常工作。
  //
  // 也不能直接写 `ctx.llm` —— cordis 的 Context 是受保护的代理，未声明的服务
  // 属性一访问就抛 `cannot get property "llm" without inject`。
  let llm: LlmService | undefined;
  ctx.inject(['llm'], (llmCtx) => {
    llm = llmCtx.llm;
  });

  const provider = new SessionTitlePatternProvider(ctx, currentConfig, states, () => llm);

  // SessionTitleService.register() 是全局单例，重复注册直接抛。
  // 正常情况下我们的 bundle patch 会禁用 dsh-base 的 session-title-llm，
  // 但当用户把本包排在 dsh-base 之前、或另有插件抢先注册时仍会冲突。
  // 这里绝不能让异常冒泡：apply() 抛错会让插件 fiber 失败，进而拖垮启动。
  let dispose: () => Promise<void>;
  try {
    dispose = ctx.sessionTitle.register(provider);
  } catch (error) {
    logger.warn(
      '注册标题 provider 失败，会话标题将回退到内置规则。' +
        '多半是另一个 provider（如 dsh-base 的 session-title-llm）已抢先注册，' +
        `而 SessionTitleService 全局只允许一个：${String(error)}`,
    );
    return;
  }

  ctx.effect(() => dispose);

  // 把本插件的 Config 暴露成用户可编辑的 settings section：设置页的「插件」标签页
  // 会遍历 host 提供的命名空间，并按命名空间找到我们在浏览器里注册的那张卡片。
  //
  // 同样不能直接写 `ctx.settings`（受保护代理），走 ctx.inject 延迟等待。
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.installSection(ctx, SETTINGS_NS, Config, config, {
      setSource: (current) => {
        source = current;
      },
      onChange: () => {
        // 配置变了就清空滚动摘要：换了模型或重算间隔之后，旧摘要不再匹配新设置，
        // 让下一次重算按新配置从头开始。
        states.clear();
        const next = currentConfig();
        logger.info(`设置已更新：mode=${next.mode}、retitleEvery=${next.retitleEvery}`);
      },
      validate: (value) => {
        // schema 表达不了的跨字段约束：provider 与 model 必须成对。
        // 抛错会拒绝这次写入，用户在设置页立刻收到失败提示。
        if ((value.provider.length > 0) !== (value.model.length > 0)) {
          throw new Error('provider 与 model 必须同时填写，或同时留空');
        }
      },
    });
  });

  // 组合配置（cordis 配置）里只填了一项的情况走不到 validate，这里补一条提示。
  const initial = currentConfig();
  if ((initial.provider.length > 0) !== (initial.model.length > 0)) {
    logger.warn(
      `provider / model 必须成对配置，当前 provider=${JSON.stringify(initial.provider)}、` +
        `model=${JSON.stringify(initial.model)}，将忽略这两项并跟随会话主模型。`,
    );
  }

  // 不按「当时的模式」决定要不要挂订阅：模式可以在设置里随时切换。
  trackRecomputes(ctx, currentConfig, states);

  // commands 由 dsh-base 提供，但绝不能写进 inject 声明：组合里一旦没有命令服务，
  // 声明式依赖会让本 entry 永远 pending，而 pending 的 entry 会让 dsh 启动失败。
  // 用 ctx.inject 延迟等待：它没出现就只是没有 /retitle，自动生成标题照常工作。
  ctx.inject(['commands'], (commandCtx) => {
    registerRetitleCommand(commandCtx, states);
  });
}
