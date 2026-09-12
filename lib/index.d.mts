import z from "@deepseek-ai/schemastery";
import { SessionTitleProvider, SessionTitleProviderId, SessionTitleProviderRequest, SessionTitleProviderResult } from "@deepseek-ai/dsh-session-title";
import { Context } from "@deepseek-ai/cordis";
//#region src/host/index.d.ts
export declare const inject: readonly ["sessionTitle"];
export declare const Config: z<Schemastery.ObjectS<{
  /** Title separator, defaults to `|`. */
  separator: any;
  /** Maximum total title length in UTF-8 bytes. */
  maxBytes: any;
}>, Schemastery.ObjectT<{
  /** Title separator, defaults to `|`. */
  separator: any;
  /** Maximum total title length in UTF-8 bytes. */
  maxBytes: any;
}>>;
export type Config = z.infer<typeof Config>;
export declare class SessionTitlePatternProvider implements SessionTitleProvider {
  readonly id: SessionTitleProviderId;
  readonly automatic: "first-prompt";
  private readonly config;
  constructor(config: Config);
  generate(request: SessionTitleProviderRequest): Promise<SessionTitleProviderResult>;
}
interface SessionTitleService {
  register(provider: SessionTitleProvider): () => Promise<void>;
}
export declare function apply(ctx: Context & {
  sessionTitle: SessionTitleService;
}, config: Config): void;
declare module '@deepseek-ai/cordis' {
  interface Context {
    sessionTitle: SessionTitleService;
  }
}
//#endregion
//# sourceMappingURL=index.d.mts.map