/**
 * 模型目录路由 path：宿主侧 `serveModelCatalog` 与客户端 `connectHost` 必须共用
 * 同一个字符串（核心库硬性要求，错配就拉不到目录）。
 *
 * 按插件名起名，避免与其它插件的模型路由撞车。
 */
export const MODELS_PATH = '/api/dsh-session-title-pattern/models';
