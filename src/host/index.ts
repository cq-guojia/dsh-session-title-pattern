import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import {
  SessionTitleProviderId,
  normalizeSessionTitle,
  truncateTitleUtf8,
} from '@deepseek-ai/dsh-session-title';
import type {
  SessionTitleProvider,
  SessionTitleProviderRequest,
  SessionTitleProviderResult,
  SessionTitleUserMessage,
} from '@deepseek-ai/dsh-session-title';

export const name = 'dsh-session-title-pattern';

export const inject = ['sessionTitle'] as const;

/** 兜底类型标签：规则全部未命中时使用。 */
const FALLBACK_TYPE = '其他';

export interface Config {
  /** 标题各段之间的分隔符。 */
  separator: string;
  /**
   * 标题总长度上限（UTF-8 字节）。
   *
   * 必须 <= `session-title` 行的 `maxTitleBytes`（dsh-base 默认 80），
   * 否则服务在写入前会二次截断，超出部分被静默丢弃。
   */
  maxBytes: number;
}

export const Config: z<Config> = z.object({
  separator: z.string().default('｜'),
  maxBytes: z.number().step(1).min(20).default(80),
});

/** 以本地时区格式化 `MMDD`。UTC 会让东八区在 00:00-08:00 之间显示成前一天。 */
function formatPatternDate(now: Date): string {
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${mm}${dd}`;
}

/** 剥离开头的斜杠命令（`/compact xxx` -> `xxx`），非命令原样返回。 */
function stripLeadingCommand(text: string): string {
  return text.replace(/^\/\S+\s*/, '');
}

function classifyMessage(msg: SessionTitleUserMessage): string {
  const text = (msg.text ?? '').trim().toLowerCase();
  if (/^\/|command|指令|命令/.test(text)) return '指令';
  if (/登录|鉴权|auth|login|oauth/.test(text)) return '鉴权';
  if (/接口|api|endpoint|路由/.test(text)) return '接口';
  if (/查询|search|fetch|获取|read|什么|如何|为什么|怎么|哪/.test(text)) return '查询';
  if (/创建|新增|insert|add|write|生成|写|做|建|弄/.test(text)) return '创建';
  if (/更新|修改|update|edit|patch|改|调整|变|换/.test(text)) return '更新';
  if (/删除|delete|remove|drop|删|移除|去|清/.test(text)) return '删除';
  if (/测试|test|单测|集成|验证|检查|跑/.test(text)) return '测试';
  if (/配置|config|setup|设置|装|部署/.test(text)) return '配置';
  if (/错误|bug|异常|fix|报错|问题|错|故障/.test(text)) return '修复';
  if (/文档|doc|readme|说明|帮助|教程/.test(text)) return '文档';
  return FALLBACK_TYPE;
}

/**
 * 拼装 `MMDD<sep>类型<sep>主题`。
 *
 * 全程只做一次字节收口：先按整串拼好，再交给 `truncateTitleUtf8` 按字节裁剪，
 * 它按 code point 迭代，不会切断代理对（emoji 等）。
 */
function buildTitle(
  messages: readonly SessionTitleUserMessage[],
  config: Config,
  now: Date = new Date(),
): string {
  const first = messages[0];
  // 服务只在存在合格人类消息时才会调用 provider，此分支实际上不可达；
  // 真走到这里 messageSeqs 也会是空数组，服务会先以 "must identify at least
  // one source message seq" 拒绝，这里返回空串只是保持函数纯度。
  if (!first) return '';

  const raw = (first.text ?? '').trim();
  const head = `${formatPatternDate(now)}${config.separator}${classifyMessage(first)}`;

  // 斜杠命令剥离后可能什么都不剩（`/compact`），此时退回原文，避免主题为空。
  const source = stripLeadingCommand(raw) || raw;
  const topic = normalizeSessionTitle(source, config.maxBytes);

  // 主题为空时只留 `日期<sep>类型`，保证标题永远非空（服务会拒绝空标题）。
  return truncateTitleUtf8(
    topic ? `${head}${config.separator}${topic}` : head,
    config.maxBytes,
  );
}

export class SessionTitlePatternProvider implements SessionTitleProvider {
  readonly id = SessionTitleProviderId(name);
  readonly automatic = 'first-prompt' as const;
  private readonly config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async generate(request: SessionTitleProviderRequest): Promise<SessionTitleProviderResult> {
    return {
      title: buildTitle(request.messages, this.config),
      messageSeqs: request.messages.map((m) => m.seq),
    };
  }
}

export function apply(ctx: Context, config: Config): void {
  const provider = new SessionTitlePatternProvider(config);
  const logger = ctx.logger(name);

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
}
