import { normalizeSessionTitle, truncateTitleUtf8 } from '@deepseek-ai/dsh-session-title';
import type { SessionTitleUserMessage } from '@deepseek-ai/dsh-session-title';

/** 兜底类型标签：规则全部未命中时使用。 */
export const FALLBACK_TYPE = '其他';

/** 标题拼装需要的最小配置面。 */
export interface TitleFormat {
  /** 各段之间的分隔符。 */
  separator: string;
  /** 标题总长度上限（UTF-8 字节）。 */
  maxBytes: number;
}

/** 以本地时区格式化 `MMDD`。UTC 会让东八区在 00:00-08:00 之间显示成前一天。 */
export function formatPatternDate(now: Date): string {
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${mm}${dd}`;
}

/** 剥离开头的斜杠命令（`/compact xxx` -> `xxx`），非命令原样返回。 */
export function stripLeadingCommand(text: string): string {
  return text.replace(/^\/\S+\s*/, '');
}

/**
 * 规则模式的类型分类：按顺序匹配，先命中先赢，全部未命中为 `其他`。
 *
 * 已知局限：顺序敏感，且 `改`/`去`/`清`/`做` 这类单字关键词误判率高
 * （「去年」命中 `删除`、「清楚」命中 `删除`）。LLM 模式下类型由模型给出，
 * 本函数只作为模型输出不合格式时的回退。
 */
export function classifyMessage(msg: SessionTitleUserMessage): string {
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
 *
 * 主题为空时只留 `日期<sep>类型`，保证标题永远非空（服务会拒绝空标题）。
 */
export function composeTitle(
  date: string,
  type: string,
  topic: string,
  format: TitleFormat,
): string {
  const head = `${date}${format.separator}${type}`;
  const clean = normalizeSessionTitle(topic, format.maxBytes);
  return truncateTitleUtf8(
    clean ? `${head}${format.separator}${clean}` : head,
    format.maxBytes,
  );
}

/**
 * 规则模式：类型与主题都取自首条消息。
 *
 * 服务只在存在合格人类消息时才会调用 provider，空数组分支实际上不可达；
 * 真走到这里 messageSeqs 也会是空数组，服务会先以 "must identify at least
 * one source message seq" 拒绝，这里返回空串只是保持函数纯度。
 */
export function buildRuleTitle(
  messages: readonly SessionTitleUserMessage[],
  format: TitleFormat,
  now: Date = new Date(),
): string {
  const first = messages[0];
  if (!first) return '';

  const raw = (first.text ?? '').trim();
  // 斜杠命令剥离后可能什么都不剩（`/compact`），此时退回原文，避免主题为空。
  const source = stripLeadingCommand(raw) || raw;
  return composeTitle(formatPatternDate(now), classifyMessage(first), source, format);
}
