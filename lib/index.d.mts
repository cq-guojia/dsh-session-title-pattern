import z from "@deepseek-ai/schemastery";
import { Context } from "@deepseek-ai/cordis";
//#region src/host/index.d.ts
export declare const name = "dsh-session-title-pattern";
/**
 * 必须声明为数组。cordis 的 `Inject` 是 `(keyof M)[] | { [服务名]: 配置 }`，
 * 写成 `{ required, optional }` 会被当成「需要名为 required / optional 的服务」，
 * entry 永远 pending，而 pending 的 entry 会让整个 dsh 启动失败。
 *
 * `commands` / `llm` 是可选的，绝不能写在这里 —— 用 apply 里的 `ctx.inject()` 延迟等待。
 */
export declare const inject: readonly ["sessionTitle"];
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
export declare const Config: z<Config>;
export declare function apply(ctx: Context, config: Config): void;
//#endregion
//# sourceMappingURL=index.d.mts.map