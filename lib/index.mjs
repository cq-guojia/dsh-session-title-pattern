import z from "@deepseek-ai/schemastery";
import { SessionTitleProviderId, normalizeSessionTitle } from "@deepseek-ai/dsh-session-title";
//#region src/host/index.ts
const name = "session-title-pattern";
const inject = ["sessionTitle"];
const Config = z.object({
	/** Title separator, defaults to `|`. */
	separator: z.string().optional(),
	/** Maximum total title length in UTF-8 bytes. */
	maxBytes: z.number().optional()
});
const DEFAULT_SEPARATOR = "|";
const DEFAULT_MAX_BYTES = 120;
function formatPatternDate() {
	const now = /* @__PURE__ */ new Date();
	return `${String(now.getUTCFullYear()).slice(-2)}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
}
function classifyMessage(msg) {
	const text = (msg.content ?? "").trim().toLowerCase();
	if (/^\/|command|指令|命令/.test(text)) return "指令";
	if (/登录|鉴权|auth|login|oauth/.test(text)) return "鉴权";
	if (/接口|api|endpoint|路由/.test(text)) return "接口";
	if (/查询|search|fetch|获取|read/.test(text)) return "查询";
	if (/创建|新增|insert|add|write/.test(text)) return "创建";
	if (/更新|修改|update|edit|patch/.test(text)) return "更新";
	if (/删除|delete|remove|drop/.test(text)) return "删除";
	if (/测试|test|单测|集成/.test(text)) return "测试";
	if (/配置|config|setup/.test(text)) return "配置";
	if (/错误|bug|异常|fix/.test(text)) return "修复";
	if (/文档|doc|readme/.test(text)) return "文档";
	const match = text.match(/[^\s\/\\]{2,8}/);
	return match ? match[0].slice(0, 4) : "其他";
}
function truncateToBytes(s, maxBytes) {
	let bytes = 0;
	let result = "";
	for (const cp of s) {
		const len = new TextEncoder().encode(cp).length;
		if (bytes + len > maxBytes) break;
		bytes += len;
		result += cp;
	}
	return result;
}
function buildTitle(messages, config) {
	const first = messages[0];
	if (!first) return "";
	const date = formatPatternDate();
	const type = classifyMessage(first);
	const clean = (first.content ?? "").trim().replace(/^\/\S+\s*/, "").slice(0, 40);
	const topic = normalizeSessionTitle(clean) || type;
	const sep = config.separator ?? DEFAULT_SEPARATOR;
	const maxBytes = config.maxBytes ?? DEFAULT_MAX_BYTES;
	return truncateToBytes(`${date}${sep}${type}${sep}${topic}`, maxBytes);
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
	ctx.effect(() => {
		return ctx.sessionTitle.register(provider);
	});
}
//#endregion
export { Config, SessionTitlePatternProvider, apply, inject };

//# sourceMappingURL=index.mjs.map