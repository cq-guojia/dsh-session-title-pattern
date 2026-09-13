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

/** 类型标签最多保留的字符数：提示里要求两个汉字，这里放宽到 4 个以免误伤。 */
const MAX_TYPE_CHARS = 4;

const SYSTEM_PROMPT = [
  '你是一个会话标题生成器。根据给出的人类消息，为这段会话生成一个标题。',
  '',
  '只输出一行，格式为：类型|主题',
  '- 类型：用两个汉字概括这段会话主要在做什么，例如「编程」「生成」「排查」「咨询」「文档」「配置」。',
  '  上面的词只是方向示例，不要被它们限制，可以给出更贴切的类型。',
  '- 主题：对整段会话的凝练总结，提炼关键词，不要照抄某一句话。',
  '',
  '要求：跟随消息本身的语言；不要出现引号、Markdown、编号、解释或代码；不要换行。',
].join('\n');

/** 一次会话的滚动摘要状态。 */
export interface RollState {
  /** 上一次产出的摘要行（`类型|主题`），同时也是下一次重算的输入之一。 */
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

  const frame = (newMessages: string[]): string => {
    const payload: Record<string, unknown> = { firstMessage };
    if (previousSummary.length > 0) payload.previousSummary = previousSummary;
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
 * 类型缺失时返回空串，由调用方回退到规则分类。
 */
export function parseTitleLine(raw: string): { type: string; topic: string } {
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
    return { type: [...head].slice(0, MAX_TYPE_CHARS).join(''), topic: rest.join(' ') };
  }
  return { type: '', topic: cleaned };
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
    '没有可用的模型路由：会话尚未记录主请求路由，请在本插件配置里同时指定 provider 与 model',
  );
}

/**
 * 调用一次辅助模型，拿回标题单行。
 *
 * 服务是**参数传入**而不是从 `ctx` 上取：cordis 的 Context 是受保护的代理，
 * 未在 inject 里声明的服务属性一旦访问就抛 `cannot get property "llm" without inject`。
 * 调用方通过延迟注入拿到它，顺便让 `mode: rules` 在没有 llm 的组合里也能正常工作。
 *
 * 与官方 LLM 标题插件同构：`llm.stream` 流式调用 + `BlockAssembler` 组装 +
 * `deadline` 组合超时与上游取消。`purpose` 是封闭枚举，辅助调用只能标
 * `session-title`。
 */
export async function callTitleModel(
  llm: LlmService,
  pluginName: string,
  settings: LlmSettings,
  request: SessionTitleProviderRequest,
  state: RollState,
): Promise<{ text: string; route: LlmRoute; inputBytes: number }> {
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
      system: SYSTEM_PROMPT,
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
    if (finish.kind !== 'stop') throw new Error(`标题模型未正常结束（${finish.kind}）`);

    const blocks = assembler.blocks();
    if (blocks.some((block) => block.type === 'tool-call')) {
      throw new Error('标题模型不应产生工具调用');
    }

    const text = blocks
      .filter(
        (block): block is Extract<(typeof blocks)[number], { type: 'text' }> =>
          block.type === 'text',
      )
      .map((block) => block.text)
      .join(' ')
      .trim();
    if (text.length === 0) throw new Error('标题模型没有输出任何文本');

    // 顺带把输入字节数带回去：调用方用它记一条日志，成本排查全靠这个。
    return { text, route, inputBytes: byteLength(input) };
  } finally {
    // 不用 `using` 语法：手动释放，避免依赖显式资源管理的编译目标。
    call[Symbol.dispose]();
  }
}
