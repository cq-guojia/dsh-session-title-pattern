import { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import { SessionTitleProviderId, normalizeSessionTitle } from '@deepseek-ai/dsh-session-title';
import type { SessionTitleProvider, SessionTitleProviderRequest, SessionTitleProviderResult, SessionTitleUserMessage } from '@deepseek-ai/dsh-session-title';

const name = 'dsh-session-title-pattern';

export const inject = ['sessionTitle'] as const;

export const Config = z.object({
  /** Title separator, defaults to `|`. */
  separator: z.string().default('|'),
  /** Maximum total title length in UTF-8 bytes. */
  maxBytes: z.number().default(120),
});

export type Config = z.infer<typeof Config>;


function formatPatternDate(): string {
  const now = new Date();
  const yy = String(now.getUTCFullYear()).slice(-2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
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
  // 默认取第一个词（不含空格/标点）
  const match = text.match(/[^\s\/\\.,，。！？、]+/);
  return match ? match[0].slice(0, 6) : '其他';
}

function truncateToBytes(s: string, maxBytes: number): string {
  let bytes = 0;
  let result = '';
  for (const cp of s) {
    const encoded = new TextEncoder().encode(cp);
    const len = encoded.length;
    if (bytes + len > maxBytes) break;
    bytes += len;
    result += cp;
  }
  return result;
}

function buildTitle(messages: readonly SessionTitleUserMessage[], config: Config): string {
  const first = messages[0];
  if (!first) return '';
  const date = formatPatternDate();
  const type = classifyMessage(first);
  const raw = (first.text ?? '').trim();
  const clean = raw.replace(/^\/\S+\s*/, '').slice(0, 40);
  const topic = normalizeSessionTitle(clean, config.maxBytes) || type;
  const sep = config.separator;
  const pattern = `${date}${sep}${type}${sep}${topic}`;
  return truncateToBytes(pattern, config.maxBytes);
}

export class SessionTitlePatternProvider implements SessionTitleProvider {
  readonly id = SessionTitleProviderId(name);
  readonly automatic = 'first-prompt' as const;
  private readonly config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async generate(request: SessionTitleProviderRequest): Promise<SessionTitleProviderResult> {
    const title = buildTitle(request.messages, this.config);
    return {
      title,
      messageSeqs: request.messages.map((m) => m.seq),
    };
  }
}

interface SessionTitleService {
  register(provider: SessionTitleProvider): () => Promise<void>;
}

export function apply(ctx: Context & { sessionTitle: SessionTitleService }, config: Config): void {
  const provider = new SessionTitlePatternProvider(config);
  ctx.effect(() => {
    const unregister = ctx.sessionTitle.register(provider);
    return unregister;
  });
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    sessionTitle: SessionTitleService;
  }
}
