import { BlockAssembler, createUserMessage } from '@deepseek-ai/dsh-llm';
import type { GenerateOptions } from '@deepseek-ai/dsh-llm';
import { deadline } from '@deepseek-ai/dsh-timeout';
import { truncateTitleUtf8 } from '@deepseek-ai/dsh-session-title';
import type {
  SessionTitleProviderRequest,
  SessionTitleUserMessage,
} from '@deepseek-ai/dsh-session-title';
import type { Context } from '@deepseek-ai/cordis';

/** 超时原因码，自己拥有（服务的 maxTitleBytes / dsh-base 不涉及）。 */
export const TIMEOUT_CODE = 'SESSION_TITLE_TIMEOUT';

/**
 * LLM 运行时服务。
 *
 * 用 `Context['llm']` 而不是从 `dsh-llm` 直接引类型：模块增强已把 `llm` 挂到
 * Context 上，这里只需拿到访问方式。
 */
export type LlmService = Context['llm'];

/**
 * 首条消息在提示里保留的字节数。
 *
 * 它只用来锚住「这段会话最初想干什么」，防止多轮压缩后主题漂移，因此不需要完整。
 */
const FIRST_MESSAGE_MAX_BYTES = 200;

/** 滚动摘要自身的字节上限，防止它逐轮膨胀。 */
const SUMMARY_MAX_BYTES = 300;

/** 单条新增消息的字节上限。 */
const MESSAGE_MAX_BYTES = 400;

/** 类型标签最多保留的汉字数：提示里要求两个汉字，这里放宽到 4 个以免误伤。 */
const MAX_TYPE_CHARS = 4;

/** 拉丁类型只取一个单词，另设字符上限，避免异常长的输出整段变成类型。 */
const MAX_TYPE_WORD_CHARS = 16;

/** 汉字（含扩展 A 与兼容区）。 */
const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

/** 语言探测用的全局匹配器（`g` 标志是有意的：要数个数）。 */
const CJK_ALL = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g;
const LATIN_ALL = /[A-Za-z]/g;

/**
 * 类型标签使用的语言。
 *
 * **由用户的语言环境决定，而不是对话语言**：中文环境下即便对话是英文，类型也用中文；
 * 反之亦然。只有拿不到语言环境时才退回「按对话语言判断」（见 `detectMessageLang`）。
 */
export type TypeLang = 'zh' | 'en';

/** 语言探测读取的字符数上限：只为判断语言，不必读完整个会话。 */
const LANG_SAMPLE_CHARS = 2000;

/**
 * 猜一段会话的语言：汉字比拉丁字母多就算中文，否则算英文。
 *
 * 只用于**用户没显式选过语言环境**时的兜底（那时真实语言由浏览器推导，host 看不到）。
 * 取最近几条消息而不是第一条 —— 会话中途换语言时，最近在说什么才是更准的信号。
 */
export function detectMessageLang(messages: readonly SessionTitleUserMessage[]): TypeLang {
  const sample = messages
    .slice(-3)
    .map((message) => message.text ?? '')
    .join(' ')
    .slice(0, LANG_SAMPLE_CHARS);
  const han = (sample.match(CJK_ALL) ?? []).length;
  const latin = (sample.match(LATIN_ALL) ?? []).length;
  return han > latin ? 'zh' : 'en';
}

/**
 * 规范化模型给出的类型，**形状由目标语言决定**。
 *
 * - `zh`：只留汉字（模型偶尔夹带英文，剥掉），最多 4 个
 * - `en`：只取第一个单词并去掉标点（保留 `+` `#` `.`，免得砍掉 `c++` / `node.js`）
 *
 * **不能按字符数一刀切** —— 英文类型按 4 个字符截断会把 `Debugging` 变成 `Debu`。
 * 模型没按目标语言输出时（例如要中文却给了 `Debug`）**不硬丢弃**，退回「取一个单词」，
 * 宁可留着也不丢信息。
 */
export function normalizeType(raw: string, lang: TypeLang): string {
  const text = raw.trim();
  if (text.length === 0) return '';
  if (lang === 'zh') {
    const han = [...text].filter((char) => CJK.test(char)).join('');
    if (han.length > 0) return [...han].slice(0, MAX_TYPE_CHARS).join('');
  }
  const word = text.split(/\s+/).find((part) => part.length > 0) ?? '';
  return [...word.replace(/[^\p{L}\p{N}+#.]/gu, '')].slice(0, MAX_TYPE_WORD_CHARS).join('');
}

/**
 * 系统提示词。
 *
 * 类型语言**每次现算**（用户随时可能在设置里换语言环境），所以提示词按目标语言生成：
 * **类型严格按指定语言**，主线与主题跟随消息本身的语言。
 *
 * 两段示例里**总有一条是「消息语言 ≠ 类型语言」**的情形 —— 只靠一句文字说明压不住，
 * 模型照抄示例比照抄说明可靠得多（v0.5.22 踩过这个坑）。
 */
function systemPrompt(typeLang: TypeLang): string {
  const typeRule =
    typeLang === 'zh'
      ? '  - 类型：**必须用中文**，两个汉字概括（例如「排查」「配置」「文档」），不要用英文单词。'
      : '  - 类型：**must be one single English word**（例如 Debug / Config / Docs），首字母大写；' +
        '不要用短语、句子或中文。';
  const examples =
    typeLang === 'zh'
      ? [
          '示例一（消息是中文）：主线「开发登录模块」、类型「排查」、主题「处理登录 401」，输出正好是这两行：',
          '开发登录模块',
          '排查|处理登录 401',
          '示例二（消息是英文、但类型仍然要求中文）：主线 "Develop the login module"、类型「排查」、',
          '主题 "login 401"，输出正好是这两行：',
          'Develop the login module',
          '排查|login 401',
        ]
      : [
          '示例一（消息是英文）：主线 "Develop the login module"、类型 "Debug"、主题 "login 401"，输出正好是这两行：',
          'Develop the login module',
          'Debug|login 401',
          '示例二（消息是中文、但类型仍然要求英文）：主线「开发登录模块」、类型 "Debug"、',
          '主题「处理登录 401」，输出正好是这两行：',
          '开发登录模块',
          'Debug|处理登录 401',
        ];

  return [
    '你是一个会话标题生成器。根据给出的人类消息，为这段会话生成一个标题。',
    '',
    '输出两行，除这两行外不要输出任何内容：',
    '第一行：主线。一句话概括这段会话从头到尾**主要在干什么**，**用消息本身的语言**。',
    '  如果输入里给了 mainLine：会话目标没有变化时**原样返回**，不要改写；',
    '  mainLine 是这段会话**最初的最大目标** —— 解决主线过程中产生的报错、bug、调试，',
    '  都是主线的**子任务**，不属于目标变化。不要因为最近一直在修 bug 就把主线改成「调试×××」；',
    '  只有出现和原目标并列的全新目标时才更新主线。',
    '第二行：类型|主题。',
    typeRule,
    '  - 主题：对整段会话的凝练总结，提炼关键词，不要照抄某一句话，**用消息本身的语言**。',
    '  - **主线优先**：标题必须与第一行的主线一致。最近几轮可能只是在解决主线下面',
    '    的某个具体问题，不要让它们把标题带偏。',
    '',
    ...examples,
    '',
    '要求：类型严格按上面指定的语言；主线与主题跟随消息本身的语言；行内不要引号、Markdown、编号或解释。',
  ].join('\n');
}

/** 一次会话的滚动摘要状态。 */
export interface RollState {
  /**
   * 模型维护的「主线」：这段会话从头到尾主要在干什么。
   *
   * 为什么需要它：**主线不一定出现在开头**（可能聊着聊着才转向），而输入天然偏向
   * 最近几轮（比例约 20:1）—— 只靠首条消息锚不住。让模型逐轮判断并延续主线，
   * 是唯一不依赖「开头正好写着它」的机制。
   */
  mainLine: string;
  /** 上一次产出的标题行（`类型|主题`），同时也是下一次重算的输入之一。 */
  summary: string;
  /** 上一次重算时的人类消息条数，用于切出「新增」部分。 */
  seenCount: number;
}

/** 模型调用相关的配置面。 */
export interface LlmSettings {
  /** 显式指定的 provider；与 model 必须成对，留空则跟随会话主模型。 */
  provider: string;
  /** 显式指定的 model；与 provider 必须成对。 */
  model: string;
  /** 单次调用超时（毫秒）。 */
  timeoutMs: number;
  /** 输出 token 上限。 */
  maxOutputTokens: number;
  /** 输入字节上限。 */
  maxInputBytes: number;
}

/** 实际使用的模型路由。 */
export interface LlmRoute {
  provider: string;
  model: string;
}

const encoder = new TextEncoder();

/**
 * UTF-8 字节数。
 *
 * 用 `TextEncoder` 而不是 `Buffer.byteLength`：tsconfig 的 `types: []` 刻意不引入
 * node 全局类型，而 `TextEncoder` 在 Node 11+ 与浏览器里都是标准全局量
 * （由 `lib: ["DOM"]` 提供类型），不需要为此增加 `@types/node`。
 */
function byteLength(text: string): number {
  return encoder.encode(text).length;
}

/** 折掉换行与连续空白，让每条消息在提示里占一行。 */
function oneLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * 把模型输出折成可复用的摘要行。
 *
 * 摘要就是「模型上一次的输出本身」，不需要额外生成：它既是标题，也是下一次重算
 * 的输入之一。
 */
export function toSummary(text: string): string {
  return oneLine(truncateTitleUtf8(text, SUMMARY_MAX_BYTES));
}

/**
 * 组装本次要发给模型的输入。
 *
 * 固定三段，**输入大小与会话总长度无关**：
 *   1. 首条消息 —— 锚住会话最初的目标，避免多轮压缩后主题漂移
 *   2. 上次摘要 —— 携带历史脉络（只有一行）
 *   3. 上次之后的新增人类消息 —— 正常情况下就是「每 N 轮」那么多条
 *
 * 用 JSON 承载，让消息正文里的任何文本都无法击穿结构分隔符（官方同样的做法）。
 * 超出字节预算时从**最旧**的一条新增消息开始丢，优先保住最近的上下文。
 */
export function buildPromptInput(
  state: RollState,
  messages: readonly SessionTitleUserMessage[],
  maxInputBytes: number,
): string {
  const firstMessage = oneLine(
    truncateTitleUtf8(messages[0]?.text ?? '', FIRST_MESSAGE_MAX_BYTES),
  );
  // 第 0 条已经单独放在 firstMessage 里，新增部分从第 1 条起算，避免重复。
  const fresh = messages.slice(Math.max(state.seenCount, 1));
  const previousSummary = oneLine(truncateTitleUtf8(state.summary, SUMMARY_MAX_BYTES));

  // 等距采样：从「新鲜窗口之前」的历史里抽两条，让模型看到会话怎么演化 ——
  // 长会话归纳、重启后恢复（seenCount 归零、历史全部回到新鲜窗口之外）时尤其重要。
  const history = messages.slice(1, Math.max(state.seenCount, 1));
  const samples: string[] = [];
  if (history.length > 3) {
    const middle = history.length - 1;
    for (const index of new Set([Math.floor(middle / 3), Math.floor((middle * 2) / 3)])) {
      const text = oneLine(truncateTitleUtf8(history[index]?.text ?? '', 200));
      if (text.length > 0) samples.push(text);
    }
  }

  const frame = (newMessages: string[]): string => {
    const payload: Record<string, unknown> = { firstMessage };
    // mainLine 是抗漂移的锚：模型上一轮判断的主线，这一轮原样带回、由它决定要不要改。
    if (state.mainLine.length > 0) payload.mainLine = state.mainLine;
    if (previousSummary.length > 0) payload.previousSummary = previousSummary;
    if (samples.length > 0) payload.sampledHistory = samples;
    payload.newMessages = newMessages;
    return `根据以下 JSON 生成会话标题：\n${JSON.stringify(payload)}`;
  };

  let kept = fresh.map((message) => oneLine(truncateTitleUtf8(message.text ?? '', MESSAGE_MAX_BYTES)));
  // 三段各自有字节上限，正常情况下第一轮就返回；循环只为用户把 maxInputBytes
  // 配得比上限还小时兜底。
  for (;;) {
    const text = frame(kept);
    if (byteLength(text) <= maxInputBytes || kept.length === 0) return text;
    kept = kept.slice(1);
  }
}

/**
 * 解析模型输出的单行 `类型|主题`。
 *
 * 容错优先：多写了行、带了编号或引号、用了全角竖线，都要能救回来。
 * 类型缺失时返回空串，标题模板里 `{type}` 那一段会整段消失。
 */
export function parseTitleLine(raw: string, typeLang: TypeLang): { type: string; topic: string } {
  const line = raw.split('\n').map((part) => part.trim()).find((part) => part.length > 0) ?? '';
  const cleaned = line
    .replace(/^[-\s*\d.、]+/, '')
    .replace(/^[「『"'“”`【\[]+/, '')
    .replace(/[」』"'“”`】\]]+$/, '')
    .trim();

  const [head, ...rest] = cleaned
    .split(/[|｜]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (head !== undefined && rest.length > 0) {
    return { type: normalizeType(head, typeLang), topic: rest.join(' ') };
  }
  return { type: '', topic: cleaned };
}

/** 行首的编号 / 项目符号（`1.`、`-`、`、`…），模型经常顺手加。 */
const BULLET = /^[-\s*\d.、]+/;

/**
 * 解析模型的两行输出：第一行主线，第二行 `类型|主题`。
 *
 * **模型经常照抄提示词的措辞**，把行写成 `主线：xxx`、`类型：编程`、`主题：xxx`；
 * 英文会话里则会写成 `Main line:` / `Type:` / `Topic:` —— 所以中英标签都要认。
 * 实测出过标题被解析成 `其他｜类型：编程` 的事故（「类型：编程」没有竖线，
 * 老解析器认不出类型，整行落进了主题）。
 *
 * 所以这里按**行首标签**归类，而不是死认行序；完全认不出标签才退回老约定
 * （两行 = 主线 + 标题行；一行 = 标题行，主线沿用上一次的）。
 */
export function parseTitleOutput(
  raw: string,
  typeLang: TypeLang,
): { mainLine: string; type: string; topic: string; titleLine: string } {
  const empty = { mainLine: '', type: '', topic: '', titleLine: '' };
  const lines = raw
    .split('\n')
    .map((part) => part.replace(BULLET, '').trim())
    .filter((part) => part.length > 0);
  if (lines.length === 0) return empty;

  let mainLine = '';
  let type = '';
  let topic = '';
  const bare: string[] = [];
  for (const line of lines) {
    if (/^(主线|main\s*line|mainline)\s*[:：]/i.test(line)) {
      mainLine ||= line.replace(/^(主线|main\s*line|mainline)\s*[:：]\s*/i, '');
      continue;
    }
    // 类型 / 主题可能各占一行，也可能挤在同一行里（`类型：编程｜主题：配置损坏`）——
    // 都按段拆开归位，取标签后面的值。
    if (/^(类型|主题|type|topic)\s*[:：]/i.test(line)) {
      const parts = line
        .split(/[|｜]/)
        .map((part) => part.replace(BULLET, '').trim())
        .filter((part) => part.length > 0);
      for (const part of parts) {
        if (/^(类型|type)\s*[:：]/i.test(part)) type ||= part.replace(/^(类型|type)\s*[:：]\s*/i, '');
        else if (/^(主题|topic)\s*[:：]/i.test(part)) {
          topic ||= part.replace(/^(主题|topic)\s*[:：]\s*/i, '');
        }
      }
      continue;
    }
    bare.push(line);
  }

  // 只吐了一行主线：把主线当主题用（类型为空，模板里 `{type}` 段会消失）——
  // 总比把「主线：」原样留在标题里强。
  if (type === '' && topic === '' && mainLine !== '' && bare.length === 0) {
    return { mainLine, type: '', topic: mainLine, titleLine: mainLine };
  }

  if (type !== '' || topic !== '') {
    const cappedType = normalizeType(type, typeLang);
    return {
      mainLine,
      type: cappedType,
      topic,
      titleLine: topic === '' ? cappedType : `${cappedType}|${topic}`,
    };
  }

  // 无标签：两行 = 主线 + 标题行；一行 = 标题行（主线沿用上一次的）。
  if (bare.length >= 2) {
    const [first, second] = bare;
    return { mainLine: mainLine || first, ...parseTitleLine(second, typeLang), titleLine: second };
  }
  const single = bare[0] ?? lines[0];
  return { ...empty, ...parseTitleLine(single, typeLang), titleLine: single };
}

/**
 * 解析本次调用该走哪条路由。
 *
 * 配置优先（两项必须同时给出），否则跟随会话当前记录的主请求路由。
 * 两者都没有时抛错 —— 调用方据此走「保留上一次标题」的降级。
 */
export function resolveRoute(settings: LlmSettings, request: SessionTitleProviderRequest): LlmRoute {
  if (settings.provider.length > 0 && settings.model.length > 0) {
    return { provider: settings.provider, model: settings.model };
  }
  if (request.route !== undefined) {
    return { provider: request.route.provider, model: request.route.model };
  }
  throw new Error(
    'No usable model route: the session has not recorded a main request route yet; ' +
      'set both provider and model in this plugin configuration',
  );
}

/**
 * 调用一次辅助模型，拿回标题单行。
 *
 * 服务是**参数传入**而不是从 `ctx` 上取：cordis 的 Context 是受保护的代理，
 * 未在 inject 里声明的服务属性一旦访问就抛 `cannot get property "llm" without inject`。
 * 调用方通过延迟注入拿到它：组合里没有 llm 时只是标题生成走降级，不影响插件加载。
 *
 * 与官方 LLM 标题插件同构：`llm.stream` 流式调用 + `BlockAssembler` 组装 +
 * `deadline` 组合超时与上游取消。`purpose` 是封闭枚举，辅助调用只能标
 * `session-title`。
 *
 * @param typeLang - 本次「类型」该用哪种语言（提示词按它生成）。
 */
export async function callTitleModel(
  llm: LlmService,
  pluginName: string,
  settings: LlmSettings,
  request: SessionTitleProviderRequest,
  state: RollState,
  typeLang: TypeLang,
): Promise<{ text: string; route: LlmRoute; inputBytes: number; truncated: boolean }> {
  const route = resolveRoute(settings, request);
  const input = buildPromptInput(state, request.messages, settings.maxInputBytes);

  const call = deadline(request.signal, settings.timeoutMs, TIMEOUT_CODE);
  try {
    call.signal.throwIfAborted();

    const options: GenerateOptions = {
      provider: route.provider,
      model: route.model,
      messages: [
        createUserMessage({
          content: [{ type: 'text', text: input }],
          source: { kind: 'plugin', plugin: pluginName },
        }),
      ],
      system: systemPrompt(typeLang),
      maxTokens: settings.maxOutputTokens,
      sessionId: request.session.id,
      purpose: 'session-title',
      signal: call.signal,
    };

    const assembler = new BlockAssembler();
    for await (const chunk of llm.stream(options)) {
      call.signal.throwIfAborted();
      assembler.push(chunk);
    }
    call.signal.throwIfAborted();

    const finish = assembler.finish;
    // `max-tokens` **不算失败**：模型可能写了超出预算的废话，也可能把预算花在了推理上
    // （带 thinking 的模型，思考同样计入 maxTokens）。而**第一行通常已经完整** ——
    // 我们本来就只取第一行，所以放行它比报错有用得多：报错的后果是标题永远不更新，
    // 用户只看到「生成标题失败」，很难联想到是输出预算不够。
    // 其余结束原因（error、被内容策略拦下等）仍然抛错，走「保留上一个标题」的降级。
    const truncated = finish.kind === 'max-tokens';
    if (finish.kind !== 'stop' && !truncated) {
      throw new Error(`Title model did not finish normally (${finish.kind})`);
    }

    const blocks = assembler.blocks();
    if (blocks.some((block) => block.type === 'tool-call')) {
      throw new Error('Title model must not produce tool calls');
    }

    const text = blocks
      .filter(
        (block): block is Extract<(typeof blocks)[number], { type: 'text' }> =>
          block.type === 'text',
      )
      .map((block) => block.text)
      .join(' ')
      .trim();
    if (text.length === 0) throw new Error('Title model produced no text');

    // 顺带把输入字节数与「是否被截断」带回去：调用方用它们记日志。
    return { text, route, inputBytes: byteLength(input), truncated };
  } finally {
    // 不用 `using` 语法：手动释放，避免依赖显式资源管理的编译目标。
    call[Symbol.dispose]();
  }
}
