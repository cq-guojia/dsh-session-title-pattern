import z from "@deepseek-ai/schemastery";
import { SessionTitleProviderId, normalizeSessionTitle, truncateTitleUtf8 } from "@deepseek-ai/dsh-session-title";
import { BlockAssembler, createUserMessage } from "@deepseek-ai/dsh-llm";
import { deadline } from "@deepseek-ai/dsh-timeout";
//#region src/host/llm.ts
/** 超时原因码，自己拥有（服务的 maxTitleBytes / dsh-base 不涉及）。 */
const TIMEOUT_CODE = "SESSION_TITLE_TIMEOUT";
/**
* 首条消息在提示里保留的字节数。
*
* 它只用来锚住「这段会话最初想干什么」，防止多轮压缩后主题漂移，因此不需要完整。
*/
const FIRST_MESSAGE_MAX_BYTES = 200;
/** 滚动摘要自身的字节上限，防止它逐轮膨胀。 */
const SUMMARY_MAX_BYTES = 300;
/** 单条新增消息的字节上限。 */
const MESSAGE_MAX_BYTES = 400;
/** 类型标签最多保留的字符数：提示里要求两个汉字，这里放宽到 4 个以免误伤。 */
const MAX_TYPE_CHARS = 4;
const SYSTEM_PROMPT = [
	"你是一个会话标题生成器。根据给出的人类消息，为这段会话生成一个标题。",
	"",
	"只输出一行，格式为：类型|主题",
	"- 类型：用两个汉字概括这段会话主要在做什么，例如「编程」「生成」「排查」「咨询」「文档」「配置」。",
	"  上面的词只是方向示例，不要被它们限制，可以给出更贴切的类型。",
	"- 主题：对整段会话的凝练总结，提炼关键词，不要照抄某一句话。",
	"",
	"要求：跟随消息本身的语言；不要出现引号、Markdown、编号、解释或代码；不要换行。"
].join("\n");
const encoder = new TextEncoder();
/**
* UTF-8 字节数。
*
* 用 `TextEncoder` 而不是 `Buffer.byteLength`：tsconfig 的 `types: []` 刻意不引入
* node 全局类型，而 `TextEncoder` 在 Node 11+ 与浏览器里都是标准全局量
* （由 `lib: ["DOM"]` 提供类型），不需要为此增加 `@types/node`。
*/
function byteLength(text) {
	return encoder.encode(text).length;
}
/** 折掉换行与连续空白，让每条消息在提示里占一行。 */
function oneLine(text) {
	return text.replace(/\s+/g, " ").trim();
}
/**
* 把模型输出折成可复用的摘要行。
*
* 摘要就是「模型上一次的输出本身」，不需要额外生成：它既是标题，也是下一次重算
* 的输入之一。
*/
function toSummary(text) {
	return oneLine(truncateTitleUtf8(text, SUMMARY_MAX_BYTES));
}
/**
* 组装本次要发给模型的输入。
*
* 固定三段，**输入大小与会话总长度无关**：
*   1. 首条消息 —— 锚住会话最初的目标，避免多轮压缩后主题漂移
*   2. 上次摘要 —— 携带历史脉络（只有一行）
*   3. 上次之后的新增人类消息 —— 正常情况下就是「每 N 轮」那么多条
*
* 用 JSON 承载，让消息正文里的任何文本都无法击穿结构分隔符（官方同样的做法）。
* 超出字节预算时从**最旧**的一条新增消息开始丢，优先保住最近的上下文。
*/
function buildPromptInput(state, messages, maxInputBytes) {
	const firstMessage = oneLine(truncateTitleUtf8(messages[0]?.text ?? "", FIRST_MESSAGE_MAX_BYTES));
	const fresh = messages.slice(Math.max(state.seenCount, 1));
	const previousSummary = oneLine(truncateTitleUtf8(state.summary, SUMMARY_MAX_BYTES));
	const frame = (newMessages) => {
		const payload = { firstMessage };
		if (previousSummary.length > 0) payload.previousSummary = previousSummary;
		payload.newMessages = newMessages;
		return `根据以下 JSON 生成会话标题：\n${JSON.stringify(payload)}`;
	};
	let kept = fresh.map((message) => oneLine(truncateTitleUtf8(message.text ?? "", MESSAGE_MAX_BYTES)));
	for (;;) {
		const text = frame(kept);
		if (byteLength(text) <= maxInputBytes || kept.length === 0) return text;
		kept = kept.slice(1);
	}
}
/**
* 解析模型输出的单行 `类型|主题`。
*
* 容错优先：多写了行、带了编号或引号、用了全角竖线，都要能救回来。
* 类型缺失时返回空串，由调用方回退到规则分类。
*/
function parseTitleLine(raw) {
	const cleaned = (raw.split("\n").map((part) => part.trim()).find((part) => part.length > 0) ?? "").replace(/^[-\s*\d.、]+/, "").replace(/^[「『"'“”`【\[]+/, "").replace(/[」』"'“”`】\]]+$/, "").trim();
	const [head, ...rest] = cleaned.split(/[|｜]/).map((part) => part.trim()).filter((part) => part.length > 0);
	if (head !== void 0 && rest.length > 0) return {
		type: [...head].slice(0, MAX_TYPE_CHARS).join(""),
		topic: rest.join(" ")
	};
	return {
		type: "",
		topic: cleaned
	};
}
/**
* 解析本次调用该走哪条路由。
*
* 配置优先（两项必须同时给出），否则跟随会话当前记录的主请求路由。
* 两者都没有时抛错 —— 调用方据此走「保留上一次标题」的降级。
*/
function resolveRoute(settings, request) {
	if (settings.provider.length > 0 && settings.model.length > 0) return {
		provider: settings.provider,
		model: settings.model
	};
	if (request.route !== void 0) return {
		provider: request.route.provider,
		model: request.route.model
	};
	throw new Error("没有可用的模型路由：会话尚未记录主请求路由，请在本插件配置里同时指定 provider 与 model");
}
/**
* 调用一次辅助模型，拿回标题单行。
*
* 服务是**参数传入**而不是从 `ctx` 上取：cordis 的 Context 是受保护的代理，
* 未在 inject 里声明的服务属性一旦访问就抛 `cannot get property "llm" without inject`。
* 调用方通过延迟注入拿到它，顺便让 `mode: rules` 在没有 llm 的组合里也能正常工作。
*
* 与官方 LLM 标题插件同构：`llm.stream` 流式调用 + `BlockAssembler` 组装 +
* `deadline` 组合超时与上游取消。`purpose` 是封闭枚举，辅助调用只能标
* `session-title`。
*/
async function callTitleModel(llm, pluginName, settings, request, state) {
	const route = resolveRoute(settings, request);
	const input = buildPromptInput(state, request.messages, settings.maxInputBytes);
	const call = deadline(request.signal, settings.timeoutMs, TIMEOUT_CODE);
	try {
		call.signal.throwIfAborted();
		const options = {
			provider: route.provider,
			model: route.model,
			messages: [createUserMessage({
				content: [{
					type: "text",
					text: input
				}],
				source: {
					kind: "plugin",
					plugin: pluginName
				}
			})],
			system: SYSTEM_PROMPT,
			maxTokens: settings.maxOutputTokens,
			sessionId: request.session.id,
			purpose: "session-title",
			signal: call.signal
		};
		const assembler = new BlockAssembler();
		for await (const chunk of llm.stream(options)) {
			call.signal.throwIfAborted();
			assembler.push(chunk);
		}
		call.signal.throwIfAborted();
		const finish = assembler.finish;
		if (finish.kind !== "stop") throw new Error(`标题模型未正常结束（${finish.kind}）`);
		const blocks = assembler.blocks();
		if (blocks.some((block) => block.type === "tool-call")) throw new Error("标题模型不应产生工具调用");
		const text = blocks.filter((block) => block.type === "text").map((block) => block.text).join(" ").trim();
		if (text.length === 0) throw new Error("标题模型没有输出任何文本");
		return {
			text,
			route,
			inputBytes: byteLength(input)
		};
	} finally {
		call[Symbol.dispose]();
	}
}
//#endregion
//#region src/host/rules.ts
/** 兜底类型标签：规则全部未命中时使用。 */
const FALLBACK_TYPE = "其他";
/** 默认标题格式：日期｜类型｜主题。 */
const DEFAULT_TITLE_TEMPLATE = "{MMDD}｜{type}｜{topic}";
/**
* 日期时间部件表。
*
* 全部取**本地时区** —— UTC 会让东八区在 00:00-08:00 之间显示成前一天。
*/
function timeParts(now) {
	const pad = (value) => String(value).padStart(2, "0");
	return {
		YYYY: String(now.getFullYear()),
		MM: pad(now.getMonth() + 1),
		DD: pad(now.getDate()),
		HH: pad(now.getHours()),
		mm: pad(now.getMinutes()),
		ss: pad(now.getSeconds())
	};
}
/**
* 展开 `{...}` 里由日期部件拼成的串，如 `YYYYMMDD`、`MMDD`、`HHmmss`。
*
* 从左往右逐个部件吃；出现不认识的字母就返回 undefined，由调用方**原样保留**整个
* 占位符 —— 宁可让它显眼地留在标题里，也不要悄悄吃掉、事后莫名其妙。
*/
function expandTimeTokens(inner, parts) {
	const names = Object.keys(parts).sort((left, right) => right.length - left.length);
	let rest = inner;
	let out = "";
	while (rest.length > 0) {
		const hit = names.find((token) => rest.startsWith(token));
		if (hit === void 0) return void 0;
		out += parts[hit] ?? "";
		rest = rest.slice(hit.length);
	}
	return out;
}
/** 收掉两端残留的空白与分隔符（主题为空时会留下尾巴）。 */
function trimEdgeSeparators(text) {
	return text.replace(/^[\s|｜·,，、/\\–—-]+/, "").replace(/[\s|｜·,，、/\\–—-]+$/, "");
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
function formatTitle(template, now, type, topic) {
	const parts = timeParts(now);
	return trimEdgeSeparators(template.replace(/\{([^{}]*)\}/g, (whole, inner) => {
		if (inner === "type") return type;
		if (inner === "topic") return topic;
		return expandTimeTokens(inner, parts) ?? whole;
	}));
}
/** 剥离开头的斜杠命令（`/compact xxx` -> `xxx`），非命令原样返回。 */
function stripLeadingCommand(text) {
	return text.replace(/^\/\S+\s*/, "");
}
/**
* 规则模式的类型分类：按顺序匹配，先命中先赢，全部未命中为 `其他`。
*
* 已知局限：顺序敏感，且 `改`/`去`/`清`/`做` 这类单字关键词误判率高
* （「去年」命中 `删除`、「清楚」命中 `删除`）。LLM 模式下类型由模型给出，
* 本函数只作为模型输出不合格式时的回退。
*/
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
* 拼装标题：先按模板渲染，再只做一次字节收口。
*
* `truncateTitleUtf8` 按 code point 迭代，不会切断代理对（emoji 等）。
* 模板写坏到渲染不出任何内容时逐级回退（主题 → 类型 → 兜底标签），
* 保证标题永远非空 —— 服务会拒绝空标题。
*/
function composeTitle(now, type, topic, format) {
	const clean = normalizeSessionTitle(topic, format.maxBytes);
	const filled = formatTitle(format.template, now, type, clean);
	return truncateTitleUtf8(filled || clean || type || "其他", format.maxBytes);
}
/**
* 规则模式：类型与主题都取自首条消息。
*
* 服务只在存在合格人类消息时才会调用 provider，空数组分支实际上不可达；
* 真走到这里 messageSeqs 也会是空数组，服务会先以 "must identify at least
* one source message seq" 拒绝，这里返回空串只是保持函数纯度。
*/
function buildRuleTitle(messages, format, now = /* @__PURE__ */ new Date()) {
	const first = messages[0];
	if (!first) return "";
	const raw = (first.text ?? "").trim();
	const source = stripLeadingCommand(raw) || raw;
	return composeTitle(now, classifyMessage(first), source, format);
}
//#endregion
//#region src/host/index.ts
const name = "dsh-session-title-pattern";
/**
* 必须声明为数组。cordis 的 `Inject` 是 `(keyof M)[] | { [服务名]: 配置 }`，
* 写成 `{ required, optional }` 会被当成「需要名为 required / optional 的服务」，
* entry 永远 pending，而 pending 的 entry 会让整个 dsh 启动失败。
*
* `commands` / `llm` 是可选的，绝不能写在这里 —— 用 apply 里的 `ctx.inject()` 延迟等待。
*/
const inject = ["sessionTitle"];
/**
* 设置命名空间。必须全小写连字符（否则 `installSection` 抛 `TypeError`）。
* 客户端半用同一个字面量注册卡片，两边靠它配对。
*/
const SETTINGS_NS = "session-title-pattern";
/** 手动重算标题的命令名（不含斜杠）。 */
const RETITLE_COMMAND = "retitle";
/**
* 同时跟踪的会话上限。
*
* 每个会话只留一行摘要与两个计数，代价极小，但这是个长期运行的插件，
* 不设上限就是内存泄漏。超出后按插入顺序淘汰最旧的（Map 保持插入序）。
*/
const MAX_TRACKED_SESSIONS = 64;
const Config = z.object({
	template: z.string().default(DEFAULT_TITLE_TEMPLATE),
	maxBytes: z.number().step(1).min(20).default(80),
	mode: z.union([z.const("llm"), z.const("rules")]).default("llm"),
	retitleEvery: z.number().step(1).min(0).default(5),
	provider: z.string().default(""),
	model: z.string().default(""),
	timeoutMs: z.number().step(1).min(1).default(15e3),
	maxOutputTokens: z.number().step(1).min(1).default(64),
	maxInputBytes: z.number().step(1).min(1).default(4096)
});
/** 写入并按插入顺序淘汰最旧的一条，避免长期运行内存无界。 */
function remember(map, id, state) {
	map.delete(id);
	map.set(id, state);
	while (map.size > MAX_TRACKED_SESSIONS) {
		const oldest = map.keys().next();
		if (oldest.done === true) break;
		map.delete(oldest.value);
	}
}
/**
* 是否为「合格的人类消息」事件。
*
* 判定条件与服务内部的 `sessionTitleUserMessageOf` 保持一致：类型是
* `user/message` 且来源是用户（排除工具结果、系统注入等）。
*/
function isEligibleUserMessage(event) {
	return event.type === "user/message" && event.data.source.kind === "user";
}
var SessionTitlePatternProvider = class {
	ctx;
	getConfig;
	states;
	getLlm;
	id = SessionTitleProviderId(name);
	/**
	* 保持 `first-prompt`：首条消息由服务的自动调度生成，之后的重算由本插件
	* 在 `session/event` 里按轮次显式调 `refresh()` 驱动。
	*
	* 不改成 `all-prompts` 的原因：那会让**每条用户消息**都触发一次 provider 调用，
	* 非重算轮我们只能返回同一个标题，于是每轮都往会话日志里写一条重复的
	* `session/title` 事件。
	*/
	automatic = "first-prompt";
	constructor(ctx, getConfig, states, getLlm) {
		this.ctx = ctx;
		this.getConfig = getConfig;
		this.states = states;
		this.getLlm = getLlm;
	}
	stateOf(id) {
		const existing = this.states.get(id);
		if (existing !== void 0) return existing;
		const created = {
			summary: "",
			seenCount: 0,
			count: 0
		};
		remember(this.states, id, created);
		return created;
	}
	async generate(request) {
		const messageSeqs = request.messages.map((message) => message.seq);
		const config = this.getConfig();
		if (config.mode !== "llm") return {
			title: buildRuleTitle(request.messages, config),
			messageSeqs
		};
		const state = this.stateOf(request.session.id);
		try {
			const llm = this.getLlm();
			if (llm === void 0) throw new Error("llm 服务尚未就绪：当前组合里没有可用的 @deepseek-ai/dsh-llm，请安装它，或把本插件的 mode 设为 rules");
			const startedAt = Date.now();
			const { text, route, inputBytes } = await callTitleModel(llm, name, config, request, state);
			const parsed = parseTitleLine(text);
			const first = request.messages[0];
			const type = parsed.type.length > 0 ? parsed.type : first !== void 0 ? classifyMessage(first) : FALLBACK_TYPE;
			const title = composeTitle(/* @__PURE__ */ new Date(), type, parsed.topic, config);
			state.summary = toSummary(text);
			state.seenCount = request.messages.length;
			this.ctx.logger(name).info(`标题已生成（第 ${request.messages.length} 条消息，${route.provider}/${route.model}，输入 ${inputBytes} 字节，耗时 ${Date.now() - startedAt}ms）：${title}`);
			return {
				title,
				messageSeqs,
				model: route
			};
		} catch (error) {
			state.seenCount = request.messages.length;
			this.ctx.logger(name).warn(`第 ${request.messages.length} 条消息后生成标题失败，保留上一次标题：${String(error)}`);
			throw error;
		}
	}
};
/**
* 注册 `/retitle` 命令：手动重算一次当前会话标题。
*
* `refresh()` 是解除用户 pin 的唯一切入口 —— 用户手动重命名过的会话处于
* pinned 状态，自动命名会停止调度，只有它能重新接管。
*
* 手动重算会重置滚动状态（`seenCount` 归零、摘要清空），让这次调用尽可能基于
* 全部对话重来，而不是只发增量。
*/
function registerRetitleCommand(ctx, states) {
	ctx.effect(() => ctx.commands.register({
		name: RETITLE_COMMAND,
		description: "根据对话重新生成标题",
		recordInput: false,
		handler: async ({ agent, signal }) => {
			const state = states.get(agent.session.id);
			if (state !== void 0) {
				state.summary = "";
				state.seenCount = 0;
			}
			try {
				const snapshot = await ctx.sessionTitle.refresh(agent.session, signal);
				if (snapshot === void 0) return {
					kind: "error",
					text: "当前会话还没有可用于生成标题的消息"
				};
				return {
					kind: "success",
					text: snapshot.title
				};
			} catch (error) {
				return {
					kind: "error",
					text: `生成标题失败：${String(error)}`
				};
			}
		}
	}));
}
/**
* 按轮次驱动重算。
*
* 服务只会在**首条**人类消息时自动调用 provider（`first-prompt`），后续轮次
* 需要我们自己在 `session/event` 上数：每满 `retitleEvery` 条就显式 `refresh()`
* 一次。这样非重算轮根本不会被调用，也不会写重复的标题事件。
*
* `retitleEvery` 为 0 时整个自动重算关掉：标题只在首条消息时生成一次，
* 之后想更新只能手动（`/retitle`，或标题旁的按钮）。
*/
function trackRecomputes(ctx, getConfig, states) {
	ctx.on("session/event", (session, event) => {
		const config = getConfig();
		if (config.mode !== "llm" || !isEligibleUserMessage(event)) return;
		if (session.header.parentSession !== void 0) return;
		const state = states.get(session.id) ?? {
			summary: "",
			seenCount: 0,
			count: 0
		};
		state.count += 1;
		if (!states.has(session.id)) remember(states, session.id, state);
		if (config.retitleEvery <= 0) return;
		if (state.count < 2 || state.count % config.retitleEvery !== 0) return;
		if (ctx.sessionTitle.get(session)?.source.kind === "user") return;
		ctx.logger(name).info(`第 ${state.count} 条消息，触发一次标题重算（每 ${config.retitleEvery} 条一次）`);
		ctx.sessionTitle.refresh(session).catch(() => void 0);
	});
	ctx.on("session/disposed", (session) => {
		states.delete(session.id);
	});
}
function apply(ctx, config) {
	const states = /* @__PURE__ */ new Map();
	const logger = ctx.logger(name);
	let source = () => config;
	const currentConfig = () => source();
	let llm;
	ctx.inject(["llm"], (llmCtx) => {
		llm = llmCtx.llm;
	});
	const provider = new SessionTitlePatternProvider(ctx, currentConfig, states, () => llm);
	let dispose;
	try {
		dispose = ctx.sessionTitle.register(provider);
	} catch (error) {
		logger.warn(`注册标题 provider 失败，会话标题将回退到内置规则。多半是另一个 provider（如 dsh-base 的 session-title-llm）已抢先注册，而 SessionTitleService 全局只允许一个：${String(error)}`);
		return;
	}
	ctx.effect(() => dispose);
	ctx.inject(["settings"], (settingsCtx) => {
		settingsCtx.settings.installSection(ctx, SETTINGS_NS, Config, config, {
			setSource: (current) => {
				source = current;
			},
			onChange: () => {
				states.clear();
				const next = currentConfig();
				logger.info(`设置已更新：mode=${next.mode}、retitleEvery=${next.retitleEvery}`);
			},
			validate: (value) => {
				if (value.provider.length > 0 !== value.model.length > 0) throw new Error("provider 与 model 必须同时填写，或同时留空");
			}
		});
	});
	const initial = currentConfig();
	if (initial.provider.length > 0 !== initial.model.length > 0) logger.warn(`provider / model 必须成对配置，当前 provider=${JSON.stringify(initial.provider)}、model=${JSON.stringify(initial.model)}，将忽略这两项并跟随会话主模型。`);
	trackRecomputes(ctx, currentConfig, states);
	ctx.inject(["commands"], (commandCtx) => {
		registerRetitleCommand(commandCtx, states);
	});
}
//#endregion
export { Config, apply, inject, name };

//# sourceMappingURL=index.mjs.map