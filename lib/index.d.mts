import z from "@deepseek-ai/schemastery";
import { SessionTitleProvider, SessionTitleProviderId, SessionTitleProviderRequest, SessionTitleProviderResult } from "@deepseek-ai/dsh-session-title";
import { Context } from "@deepseek-ai/cordis";
//#region src/host/index.d.ts
export declare const name = "dsh-session-title-pattern";
/**
 * 必须声明为数组。cordis 的 `Inject` 是 `(keyof M)[] | { [服务名]: 配置 }`，
 * 写成 `{ required, optional }` 会被当成「需要名为 required / optional 的服务」，
 * entry 永远 pending，而 pending 的 entry 会让整个 dsh 启动失败。
 *
 * `commands` 是可选的，绝不能写在这里 —— 用 apply 里的 `ctx.inject()` 延迟等待。
 */
export declare const inject: readonly ["sessionTitle"];
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
export declare const Config: z<Config>;
export declare class SessionTitlePatternProvider implements SessionTitleProvider {
  readonly id: SessionTitleProviderId;
  readonly automatic: "first-prompt";
  private readonly config;
  constructor(config: Config);
  generate(request: SessionTitleProviderRequest): Promise<SessionTitleProviderResult>;
}
export declare function apply(ctx: Context, config: Config): void;
//#endregion
//# sourceMappingURL=index.d.mts.map