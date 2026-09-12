import z from "@deepseek-ai/schemastery";
import { SessionTitleProvider, SessionTitleProviderId, SessionTitleProviderRequest, SessionTitleProviderResult } from "@deepseek-ai/dsh-session-title";
import { Context } from "@deepseek-ai/cordis";
//#region src/host/index.d.ts
export declare const name = "dsh-session-title-pattern";
/**
 * `commands` 由 dsh-base 的 commands 行提供，但设为可选项：
 * 万一组合里没有命令服务，本插件仍然要能正常生成标题，只是少了手动触发入口。
 */
export declare const inject: {
  readonly required: readonly ["sessionTitle"];
  readonly optional: readonly ["commands"];
};
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