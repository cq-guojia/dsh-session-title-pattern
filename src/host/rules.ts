import {
  fallbackSessionTitle,
  normalizeSessionTitle,
  truncateTitleUtf8,
} from '@deepseek-ai/dsh-session-title';
import type { SessionTitleUserMessage } from '@deepseek-ai/dsh-session-title';

/** 默认标题格式：日期｜类型｜主题。 */
export const DEFAULT_TITLE_TEMPLATE = '{MMDD}｜{type}｜{topic}';

/**
 * 模板渲染不出任何内容时的最后兜底。
 *
 * 实际不可达：服务只在存在合格人类消息时才调用 provider，主题至少能取到那段正文。
 * 留这个常量只是为了保证标题永远非空 —— 服务会拒绝空标题。
 */
const EMPTY_TITLE_FALLBACK = 'Untitled';

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

/** 分隔符字符集：两端收边与空段折叠共用同一套。 */
const SEPARATOR_CHARS = /[\s|｜·,，、/\\–—-]/;

/** 收掉两端残留的空白与分隔符（主题为空时会留下尾巴）。 */
function trimEdgeSeparators(text: string): string {
  return text.replace(/^[\s|｜·,，、/\\–—-]+/, '').replace(/[\s|｜·,，、/\\–—-]+$/, '');
}

/**
 * 占位符渲染成空串时的内部标记。
 *
 * 用它把「这个位置本来就没有内容」与「用户模板里自己写的内容」区分开：
 * 只有空占位符才触发折叠，绝不整体合并分隔符 —— 否则用户有意写的
 * `{YYYY}--{MM}` 会被压成 `2026-09`。
 */
const EMPTY_SEGMENT = '\u0000';

/**
 * 去掉空占位符，并吃掉它一侧紧邻的分隔符串。
 *
 * 例：`0915｜<空>｜登录失败` → `0915｜登录失败`（类型为空时不留下双竖线）；
 *     `<空>｜登录失败` → `登录失败`。
 */
function dropEmptySegments(text: string): string {
  const chars = [...text];
  const kept: string[] = [];
  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index] ?? '';
    if (char !== EMPTY_SEGMENT) {
      kept.push(char);
      continue;
    }
    // 先吃左侧紧邻的分隔符（`0915｜<空>｜主题` → `0915｜主题`）。
    let removedLeft = 0;
    while (kept.length > 0 && SEPARATOR_CHARS.test(kept[kept.length - 1] ?? '')) {
      kept.pop();
      removedLeft += 1;
    }
    // 左侧没有分隔符可吃，才去吃右侧的（`<空>｜主题` → `主题`）。
    if (removedLeft === 0) {
      let right = index + 1;
      while (right < chars.length && SEPARATOR_CHARS.test(chars[right] ?? '')) right += 1;
      index = right - 1;
    }
  }
  return kept.join('');
}

/**
 * 按模板拼标题。
 *
 * `{...}` 里可以写：
 * - `type` / `topic`：类型与主题。**渲染成空串时整段消失**，相邻的分隔符一并收掉
 *   —— 所以模型失败、只拿得到日期与正文时，标题是 `0915｜登录失败` 而不是双竖线。
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
    if (inner === 'type') return type.length > 0 ? type : EMPTY_SEGMENT;
    if (inner === 'topic') return topic.length > 0 ? topic : EMPTY_SEGMENT;
    return expandTimeTokens(inner, parts) ?? whole;
  });
  return trimEdgeSeparators(dropEmptySegments(filled));
}

/** 剥离开头的斜杠命令（`/compact xxx` -> `xxx`），非命令原样返回。 */
export function stripLeadingCommand(text: string): string {
  return text.replace(/^\/\S+\s*/, '');
}

/**
 * 拼装标题：先按模板渲染，再只做一次字节收口。
 *
 * `truncateTitleUtf8` 按 code point 迭代，不会切断代理对（emoji 等）。
 * 模板写坏到渲染不出任何内容时逐级回退（渲染结果 → 主题原文 → 兜底常量），
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
  return truncateTitleUtf8(filled || clean || EMPTY_TITLE_FALLBACK, format.maxBytes);
}

/**
 * 兜底主题的词数上限。
 *
 * 与 dsh 自带行为对齐：原生 `fallbackSessionTitle(input, maxWords, maxBytes)`
 * 取首条消息**前 maxWords 个空格分隔的词**，再按字节上限截断。原生那个 maxWords 来自
 * service 的私有配置（`fallbackMaxWords`，由 dsh-base 给值），插件读不到，
 * 这里取与官方 README 示例一致的 8。
 *
 * ⚠️ 中文没有空格，`split(' ')` 下整句就是「一个词」，所以**词数限制对中文不起作用**
 * —— 中文只受 `maxBytes` 约束。这与原生行为一致，不是我们的偏差。
 */
const FALLBACK_MAX_WORDS = 8;

/**
 * 本地兜底标题：**只在会话还没有标题、且模型调用失败时**使用。
 *
 * 三段固定：
 * - 日期时间部件：本地渲染，不需要模型；锚点由调用方经 `now` 传入
 *   （host 传**会话创建时刻**，默认值 `new Date()` 只是纯函数兜底）
 * - **类型整个省略**（`{type}` 段消失，相邻分隔符一并收掉）
 * - 主题：首条消息正文的前 `FALLBACK_MAX_WORDS` 个词，再按 `maxBytes` 收口
 *
 * 主题**直接复用官方的 `fallbackSessionTitle()`**，所以截断口径与 dsh 自带的那次
 * 首次命名**逐字一致**（前 N 个词 + 字节上限），不是我们另编一套。
 *
 * 例：模板 `{MMDD}｜{type}｜{topic}` + 首条消息 → `0915｜xxxxxxxxxxx`。
 *
 * 服务只在存在合格人类消息时才会调用 provider，空数组分支实际上不可达；
 * 真走到这里 messageSeqs 也会是空数组，服务会先以 "must identify at least
 * one source message seq" 拒绝，这里返回空串只是保持函数纯度。
 */
export function buildFallbackTitle(
  messages: readonly SessionTitleUserMessage[],
  format: TitleFormat,
  now: Date = new Date(),
): string {
  const first = messages[0];
  if (!first) return '';

  const raw = (first.text ?? '').trim();
  // 斜杠命令剥离后可能什么都不剩（`/compact`），此时退回原文，避免主题为空。
  const source = stripLeadingCommand(raw) || raw;
  // 与 dsh 原生同款：先取前 N 个词，再按字节收口（`composeTitle` 之后还会按模板再收一次）。
  const topic = fallbackSessionTitle(source, FALLBACK_MAX_WORDS, format.maxBytes);
  return composeTitle(now, '', topic, format);
}
