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
/**
 * `Config` 全部字段标 `.volatile()` 之后，dsh 解析出的 config 在运行时的真实形态：
 * 每个字段不是裸值，而是一个**由宿主运行时持有的活性引用**（schemastery 的
 * `createVolatile`：冻结对象 + `get()`），设置文档每次提交后由宿主原位更新——
 * 这正是「修改配置不需要重载 entry」的机制。读取一律走 `currentConfig()`。
 */
type VolatileConfig = { readonly [K in keyof Config]: {
  readonly get: () => Config[K];
}; };
/**
 * 设置 schema。**刻意不带 `z<Config>` 类型标注**：`.volatile()` 会改变 schema 的
 * 推导类型，带上标注反而 TS2322；字段与 `Config` 接口的一致性由人工对齐（8 个字段）。
 *
 * **每个字段都标 `.volatile()`**（依赖 `@deepseek-ai/schemastery ^3.18.4`）：字段不落
 * 用户设置文档的持久层之外还由宿主原位热更新——保存后无需重载 entry，滚动摘要
 * 不丢。也因此读取配置必须逐字段 `.get()`（见 `VolatileConfig` / `currentConfig`）。
 *
 * provider 与 model 不再做「必须成对」的跨字段校验（dsh 0.1.7 的 settings 服务没有
 * validate 钩子）：只填其一时运行时自动整体忽略、跟随会话主模型（`resolveRoute`
 * 的既有降级），初始时打一条 warn 提醒。
 */
export declare const Config: z<Schemastery.ObjectS<NoInfer<{
  template: z<string, string, "volatile-defined">;
  maxBytes: z<number, number, "volatile-defined">;
  retitleEvery: z<number, number, "volatile-defined">;
  provider: z<string, string, "volatile-defined">;
  model: z<string, string, "volatile-defined">;
  timeoutMs: z<number, number, "volatile-defined">;
  maxOutputTokens: z<number, number, "volatile-defined">;
  maxInputBytes: z<number, number, "volatile-defined">;
}>>, Schemastery.ObjectT<NoInfer<{
  template: z<string, string, "volatile-defined">;
  maxBytes: z<number, number, "volatile-defined">;
  retitleEvery: z<number, number, "volatile-defined">;
  provider: z<string, string, "volatile-defined">;
  model: z<string, string, "volatile-defined">;
  timeoutMs: z<number, number, "volatile-defined">;
  maxOutputTokens: z<number, number, "volatile-defined">;
  maxInputBytes: z<number, number, "volatile-defined">;
}>>, "plain">;
export declare function apply(ctx: Context, config: VolatileConfig): void;
//#endregion
//# sourceMappingURL=index.d.mts.map