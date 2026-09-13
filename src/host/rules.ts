import { normalizeSessionTitle, truncateTitleUtf8 } from '@deepseek-ai/dsh-session-title';
import type { SessionTitleUserMessage } from '@deepseek-ai/dsh-session-title';

/** 兜底类型标签：规则全部未命中时使用。 */
export const FALLBACK_TYPE = '其他';

/** 默认标题格式：日期｜类型｜主题。 */
export const DEFAULT_TITLE_TEMPLATE = '{MMDD}｜{type}｜{topic}';

/** 标题拼装需要的最小配置面。 */
export interface TitleFormat {
  /** 标题格式模板，语法见 formatTitle()。 */
  template: string;
  /** 标题总长度上限（UTF-8 字节）。 */
  maxBytes: number;
}

/**
 * 日期时间部件表。
 *
 * 全部取**本地时区** —— UTC 会让东八区在 00:00-08:00 之间显示成前一天。
 */
function timeParts(now: Date): Record<string, string> {
  const pad = (value: number): string => String(value).padStart(2, '0');
  return {
    YYYY: String(now.getFullYear()),
    MM: pad(now.getMonth() + 1),
    DD: pad(now.getDate()),
    HH: pad(now.getHours()),
    mm: pad(now.getMinutes()),
    ss: pad(now.getSeconds()),
  };
}

/**
 * 展开 `{...}` 里由日期部件拼成的串，如 `YYYYMMDD`、`MMDD`、`HHmmss`。
 *
 * 从左往右逐个部件吃；出现不认识的字母就返回 undefined，由调用方**原样保留**整个
 * 占位符 —— 宁可让它显眼地留在标题里，也不要悄悄吃掉、事后莫名其妙。
 */
function expandTimeTokens(inner: string, parts: Record<string, string>): string | undefined {
  // 先长后短：`YYYY` 优先于任何两位部件，避免长部件被切碎。
  const names = Object.keys(parts).sort((left, right) => right.length - left.length);
  let rest = inner;
  let out = '';
  while (rest.length > 0) {
    const hit = names.find((token) => rest.startsWith(token));
    if (hit === undefined) return undefined;
    out += parts[hit] ?? '';
    rest = rest.slice(hit.length);
  }
  return out;
}

/** 收掉两端残留的空白与分隔符（主题为空时会留下尾巴）。 */
function trimEdgeSeparators(text: string): string {
  return text.replace(/^[\s|｜·,，、/\\–—-]+/, '').replace(/[\s|｜·,，、/\\–—-]+$/, '');
}

/**
 * 按模板拼标题。
 *
 * `{...}` 里可以写：
 * - `type` / `topic`：类型与主题。**不写就不出现**（只想要主题就写 `{topic}`）
 * - 日期时间部件，可任意拼接：`YYYY` `MM` `DD` `HH` `mm` `ss`
 *   （注意 `MM` 是月、`mm` 是分，大小写敏感）
 * - 都不认得的占位符**原样保留**，一眼能看出是模板写错了
 *
 * 例：`{MMDD}｜{type}｜{topic}` → `0913｜修复｜登录失败`；
 *     `{YYYYMMDD} {topic}` → `20260913 登录失败`（不要分类）。
 */
export function formatTitle(template: string, now: Date, type: string, topic: string): string {
  const parts = timeParts(now);
  const filled = template.replace(/\{([^{}]*)\}/g, (whole, inner: string) => {
    if (inner === 'type') return type;
    if (inner === 'topic') return topic;
    return expandTimeTokens(inner, parts) ?? whole;
  });
  return trimEdgeSeparators(filled);
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
 * 拼装标题：先按模板渲染，再只做一次字节收口。
 *
 * `truncateTitleUtf8` 按 code point 迭代，不会切断代理对（emoji 等）。
 * 模板写坏到渲染不出任何内容时逐级回退（主题 → 类型 → 兜底标签），
 * 保证标题永远非空 —— 服务会拒绝空标题。
 */
export function composeTitle(
  now: Date,
  type: string,
  topic: string,
  format: TitleFormat,
): string {
  const clean = normalizeSessionTitle(topic, format.maxBytes);
  const filled = formatTitle(format.template, now, type, clean);
  return truncateTitleUtf8(filled || clean || type || FALLBACK_TYPE, format.maxBytes);
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
  return composeTitle(now, classifyMessage(first), source, format);
}
