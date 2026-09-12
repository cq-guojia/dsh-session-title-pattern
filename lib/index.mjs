import z from "@deepseek-ai/schemastery";
import { SessionTitleProviderId, normalizeSessionTitle, truncateTitleUtf8 } from "@deepseek-ai/dsh-session-title";
//#region src/host/index.ts
const name = "dsh-session-title-pattern";
const inject = ["sessionTitle"];
/** 兜底类型标签：规则全部未命中时使用。 */
const FALLBACK_TYPE = "其他";
const Config = z.object({
	separator: z.string().default("|"),
	maxBytes: z.number().step(1).min(20).default(80)
});
/** 以本地时区格式化 `YYMMDD`。UTC 会让东八区在 00:00-08:00 之间显示成前一天。 */
function formatPatternDate(now) {
	return `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
}
/** 剥离开头的斜杠命令（`/compact xxx` -> `xxx`），非命令原样返回。 */
function stripLeadingCommand(text) {
	return text.replace(/^\/\S+\s*/, "");
}
function classifyMessage(msg) {
	const text = (msg.text ?? "").trim().toLowerCase();
	if (/^\/|command|指令|命令/.test(text)) return "指令";
	if (/登录|鉴权|auth|login|oauth/.test(text)) return "鉴权";
	if (/接口|api|endpoint|路由/.test(text)) return "接口";
	if (/查询|search|fetch|获取|read|什么|如何|为什么|怎么|哪/.test(text)) return "查询";
	if (/创建|新增|insert|add|write|生成|写|做|建|弄/.test(text)) return "创建";
	if (/更新|修改|update|edit|patch|改|调整|变|换/.test(text)) return "更新";
	if (/删除|delete|remove|drop|删|移除|去|清/.test(text)) return "删除";
	if (/测试|test|单测|集成|验证|检查|跑/.test(text)) return "测试";
	if (/配置|config|setup|设置|装|部署/.test(text)) return "配置";
	if (/错误|bug|异常|fix|报错|问题|错|故障/.test(text)) return "修复";
	if (/文档|doc|readme|说明|帮助|教程/.test(text)) return "文档";
	return FALLBACK_TYPE;
}
/**
* 拼装 `YYMMDD<sep>类型<sep>主题`。
*
* 全程只做一次字节收口：先按整串拼好，再交给 `truncateTitleUtf8` 按字节裁剪，
* 它按 code point 迭代，不会切断代理对（emoji 等）。
*/
function buildTitle(messages, config, now = /* @__PURE__ */ new Date()) {
	const first = messages[0];
	if (!first) return "";
	const raw = (first.text ?? "").trim();
	const head = `${formatPatternDate(now)}${config.separator}${classifyMessage(first)}`;
	const source = stripLeadingCommand(raw) || raw;
	const topic = normalizeSessionTitle(source, config.maxBytes);
	return truncateTitleUtf8(topic ? `${head}${config.separator}${topic}` : head, config.maxBytes);
}
var SessionTitlePatternProvider = class {
	id = SessionTitleProviderId(name);
	automatic = "first-prompt";
	config;
	constructor(config) {
		this.config = config;
	}
	async generate(request) {
		return {
			title: buildTitle(request.messages, this.config),
			messageSeqs: request.messages.map((m) => m.seq)
		};
	}
};
function apply(ctx, config) {
	const provider = new SessionTitlePatternProvider(config);
	const logger = ctx.logger(name);
	let dispose;
	try {
		dispose = ctx.sessionTitle.register(provider);
	} catch (error) {
		logger.warn(`注册标题 provider 失败，会话标题将回退到内置规则。多半是另一个 provider（如 dsh-base 的 session-title-llm）已抢先注册，而 SessionTitleService 全局只允许一个：${String(error)}`);
		return;
	}
	ctx.effect(() => dispose);
}
//#endregion
export { Config, SessionTitlePatternProvider, apply, inject, name };

//# sourceMappingURL=index.mjs.map