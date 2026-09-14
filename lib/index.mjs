import z from "@deepseek-ai/schemastery";
import { SessionTitleProviderId, foldSessionTitle, normalizeSessionTitle, truncateTitleUtf8 } from "@deepseek-ai/dsh-session-title";
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
	"输出两行，除这两行外不要输出任何内容：",
	"第一行：主线。一句话概括这段会话从头到尾**主要在干什么**。",
	"  如果输入里给了 mainLine：会话目标没有变化时**原样返回**，不要改写；",
	"  mainLine 是这段会话**最初的最大目标** —— 解决主线过程中产生的报错、bug、调试，",
	"  都是主线的**子任务**，不属于目标变化。不要因为最近一直在修 bug 就把主线改成「调试×××」；",
	"  只有出现和原目标并列的全新目标时才更新主线。",
	"第二行：类型|主题。",
	"  - 类型：两个汉字概括这段会话主要在做什么，例如「编程」「生成」「排查」「咨询」「文档」「配置」。",
	"    这些词只是方向示例，不要被它们限制，可以给出更贴切的类型。",
	"  - 主题：对整段会话的凝练总结，提炼关键词，不要照抄某一句话。",
	"  - **主线优先**：标题必须与第一行的主线一致。最近几轮可能只是在解决主线下面",
	"    的某个具体问题，不要让它们把标题带偏。",
	"",
	"示例（假设主线是「开发登录模块」、类型是「排查」、主题是「处理登录 401」），输出正好是这两行：",
	"开发登录模块",
	"排查|处理登录 401",
	"",
	"要求：跟随消息本身的语言；行内不要引号、Markdown、编号或解释。"
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
	const history = messages.slice(1, Math.max(state.seenCount, 1));
	const samples = [];
	if (history.length > 3) {
		const middle = history.length - 1;
		for (const index of /* @__PURE__ */ new Set([Math.floor(middle / 3), Math.floor(middle * 2 / 3)])) {
			const text = oneLine(truncateTitleUtf8(history[index]?.text ?? "", 200));
			if (text.length > 0) samples.push(text);
		}
	}
	const frame = (newMessages) => {
		const payload = { firstMessage };
		if (state.mainLine.length > 0) payload.mainLine = state.mainLine;
		if (previousSummary.length > 0) payload.previousSummary = previousSummary;
		if (samples.length > 0) payload.sampledHistory = samples;
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
/** 行首的编号 / 项目符号（`1.`、`-`、`、`…），模型经常顺手加。 */
const BULLET = /^[-\s*\d.、]+/;
/**
* 解析模型的两行输出：第一行主线，第二行 `类型|主题`。
*
* **模型经常照抄提示词的措辞**，把行写成 `主线：xxx`、`类型：编程`、`主题：xxx` ——
* 实测出过标题被解析成 `其他｜类型：编程` 的事故（「类型：编程」没有竖线，
* 老解析器认不出类型，整行落进了主题，类型回退到规则的「其他」）。
*
* 所以这里按**行首标签**归类，而不是死认行序；完全认不出标签才退回老约定
* （两行 = 主线 + 标题行；一行 = 标题行，主线沿用上一次的）。
*/
function parseTitleOutput(raw) {
	const empty = {
		mainLine: "",
		type: "",
		topic: "",
		titleLine: ""
	};
	const lines = raw.split("\n").map((part) => part.replace(BULLET, "").trim()).filter((part) => part.length > 0);
	if (lines.length === 0) return empty;
	let mainLine = "";
	let type = "";
	let topic = "";
	const bare = [];
	for (const line of lines) {
		if (/^主线\s*[:：]/.test(line)) {
			mainLine ||= line.replace(/^主线\s*[:：]\s*/, "");
			continue;
		}
		if (/^(类型|主题)\s*[:：]/.test(line)) {
			const parts = line.split(/[|｜]/).map((part) => part.replace(BULLET, "").trim()).filter((part) => part.length > 0);
			for (const part of parts) if (/^类型\s*[:：]/.test(part)) type ||= part.replace(/^类型\s*[:：]\s*/, "");
			else if (/^主题\s*[:：]/.test(part)) topic ||= part.replace(/^主题\s*[:：]\s*/, "");
			continue;
		}
		bare.push(line);
	}
	if (type === "" && topic === "" && mainLine !== "" && bare.length === 0) return {
		mainLine,
		type: "",
		topic: mainLine,
		titleLine: mainLine
	};
	if (type !== "" || topic !== "") {
		const cappedType = [...type].slice(0, MAX_TYPE_CHARS).join("");
		return {
			mainLine,
			type: cappedType,
			topic,
			titleLine: topic === "" ? cappedType : `${cappedType}|${topic}`
		};
	}
	if (bare.length >= 2) {
		const [first, second] = bare;
		return {
			mainLine: mainLine || first,
			...parseTitleLine(second),
			titleLine: second
		};
	}
	const single = bare[0] ?? lines[0];
	return {
		...empty,
		...parseTitleLine(single),
		titleLine: single
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
		const truncated = finish.kind === "max-tokens";
		if (finish.kind !== "stop" && !truncated) throw new Error(`标题模型未正常结束（${finish.kind}）`);
		const blocks = assembler.blocks();
		if (blocks.some((block) => block.type === "tool-call")) throw new Error("标题模型不应产生工具调用");
		const text = blocks.filter((block) => block.type === "text").map((block) => block.text).join(" ").trim();
		if (text.length === 0) throw new Error("标题模型没有输出任何文本");
		return {
			text,
			route,
			inputBytes: byteLength(input),
			truncated
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
/** 手动改名命令：写入「用户」来源的标题，写入即进入锁定态。 */
const RENAME_COMMAND = "title-rename";
/** 锁定命令：把当前标题以「用户」来源写回（内容不变），停止自动更新。 */
const LOCK_COMMAND = "title-lock";
/** 解锁命令：恢复自动更新。标题内容保持不变，**不触发重新生成**。 */
const UNLOCK_COMMAND = "title-unlock";
/** 草稿命令：按当前模式真算一次标题，**只返回文本、不写标题**，给面板的「自动生成」用。 */
const SUGGEST_COMMAND = "title-suggest";
/**
* 锁定状态查询命令：面板打开时用它把「到底锁没锁」问回来。
*
* 平台的 title 投影只带文本不带来源（wire 类型是 `string | null`），浏览器读不到
* `source.kind`，所以「当前是否锁定」只能由 host 回答 —— 这就是 v0.6.0 那条
* 「锁定态只有本地记忆，刷新后按未锁定显示」限制的彻底解法。
*/
const STATE_COMMAND = "title-state";
/** `title-state` 的回答：已锁定（标题来源是「用户」）。 */
const LOCKED = "locked";
/** `title-state` 的回答：未锁定。 */
const UNLOCKED = "unlocked";
/**
* 同时跟踪的会话上限。
*
* 每个会话只留一行摘要与两个计数，代价极小，但这是个长期运行的插件，
* 不设上限就是内存泄漏。超出后按插入顺序淘汰最旧的（Map 保持插入序）。
*/
const MAX_TRACKED_SESSIONS = 64;
/**
* 「影响标题生成」的那部分配置的快照。
*
* 只有它变化时才该清空滚动摘要（`apply` 里的 `states`）：隐藏 / 显示会话的开关
* 也写在同一份设置文档里，但它们与标题毫无关系 —— 若照旧一律 `states.clear()`，
* 用户每点一次眼睛都会把模型逐轮积累的摘要与主线清掉，标题随即被重新归纳一遍。
*/
function titleStateSignature(config) {
	return [
		config.mode,
		config.retitleEvery,
		config.provider,
		config.model,
		config.timeoutMs,
		config.maxOutputTokens,
		config.maxInputBytes
	].join("\0");
}
const Config = z.object({
	template: z.string().default(DEFAULT_TITLE_TEMPLATE),
	maxBytes: z.number().step(1).min(20).default(80),
	mode: z.union([z.const("llm"), z.const("rules")]).default("llm"),
	retitleEvery: z.number().step(1).min(0).default(10),
	provider: z.string().default(""),
	model: z.string().default(""),
	timeoutMs: z.number().step(1).min(1).default(3e4),
	maxOutputTokens: z.number().step(1).min(1).default(512),
	maxInputBytes: z.number().step(1).min(1).default(4096),
	hiddenSessions: z.array(z.string()).default([]),
	revealHiddenAll: z.boolean().default(false),
	revealHiddenWorkspaces: z.dict(z.boolean()).default({})
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
/**
* 从会话事件里收集合格的人类消息（含文本），与服务内部提取逻辑同判定。
*
* 「自动生成（只出草稿）」命令在 provider 调用之外运行，拿不到服务递来的
* `request.messages`，只能自己从事件里提 —— 判定条件与服务的
* `sessionTitleUserMessageOf` 逐条对齐：`user/message` + 用户来源，
* 取全部 text 块按行拼接，归一化后为空的消息（纯附件、纯空白）跳过。
*/
function collectHumanMessages(events) {
	const messages = [];
	for (const event of events) {
		if (event.type !== "user/message" || event.data.source.kind !== "user") continue;
		const text = event.data.content.filter((block) => block.type === "text").map((block) => block.text).join("\n");
		if (normalizeSessionTitle(text, Number.MAX_SAFE_INTEGER).length === 0) continue;
		messages.push({
			seq: event.seq,
			text
		});
	}
	return messages;
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
	/**
	* 待处理的解锁请求（会话 id 集合）。
	*
	* 平台的解锁唯一切入点是 `refresh()`，而 refresh 会驱动一次 provider 调用 ——
	* 用户要求「解锁不重新生成」，所以解锁命令先在这里挂号，随后触发的 generate()
	* 看到挂号就**原样返回当前标题**：文字一个字不变、不调模型，只有来源从
	* 「用户」变回「provider」，自动更新就此恢复。
	*/
	pendingUnlocks = /* @__PURE__ */ new Set();
	/** 解锁挂号。若 refresh 在调用 generate 前失败，挂号会留到下一次重算时生效（延迟解锁，无害）。 */
	requestUnlock(sessionId) {
		this.pendingUnlocks.add(sessionId);
	}
	stateOf(id) {
		const existing = this.states.get(id);
		if (existing !== void 0) return existing;
		const created = {
			mainLine: "",
			summary: "",
			seenCount: 0,
			count: 0,
			restored: false
		};
		remember(this.states, id, created);
		return created;
	}
	async generate(request) {
		if (this.pendingUnlocks.delete(request.session.id)) {
			const current = this.ctx.sessionTitle.get(request.session);
			if (current !== void 0 && current.title.length > 0) {
				const seqs = current.messageSeqs.length > 0 ? current.messageSeqs : request.messages.map((message) => message.seq);
				if (seqs.length > 0) return {
					title: current.title,
					messageSeqs: seqs
				};
			}
		}
		const messageSeqs = request.messages.map((message) => message.seq);
		const config = this.getConfig();
		if (config.mode !== "llm") return {
			title: buildRuleTitle(request.messages, config),
			messageSeqs
		};
		const state = this.stateOf(request.session.id);
		if (!state.restored) {
			state.restored = true;
			if (state.summary === "" && state.mainLine === "") {
				const snapshot = foldSessionTitle(request.session.snapshotEvents());
				if (snapshot !== void 0) {
					const parts = snapshot.title.split(/[|｜]/).map((part) => part.trim()).filter((part) => part.length > 0);
					if (parts.length >= 3) {
						state.summary = `${parts[1]}|${parts.slice(2).join("｜")}`;
						state.mainLine = parts.slice(2).join("｜");
					}
				}
			}
		}
		try {
			const llm = this.getLlm();
			if (llm === void 0) throw new Error("llm 服务尚未就绪：当前组合里没有可用的 @deepseek-ai/dsh-llm，请安装它，或把本插件的 mode 设为 rules");
			const startedAt = Date.now();
			const { text, route, inputBytes, truncated } = await callTitleModel(llm, name, config, request, state);
			const parsed = parseTitleOutput(text);
			const first = request.messages[0];
			const type = parsed.type.length > 0 ? parsed.type : first !== void 0 ? classifyMessage(first) : FALLBACK_TYPE;
			const title = composeTitle(/* @__PURE__ */ new Date(), type, parsed.topic, config);
			state.mainLine = parsed.mainLine.length > 0 ? parsed.mainLine : state.mainLine;
			state.summary = toSummary(parsed.titleLine);
			state.seenCount = request.messages.length;
			this.ctx.logger(name).info(`标题已生成（第 ${request.messages.length} 条消息，${route.provider}/${route.model}，输入 ${inputBytes} 字节，耗时 ${Date.now() - startedAt}ms）：${title}；主线：${state.mainLine || "（空）"}`);
			if (truncated) this.ctx.logger(name).warn(`标题模型触达输出上限（maxOutputTokens=${config.maxOutputTokens}）被截断，已改用首行；经常出现的话把这个值调大，或换成不带推理的模型`);
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
* 注册改名 / 锁定命令（设置面板与标题旁的面板都走它们）。
*
* 锁定的实现：`rename()` 写入的标题来源是「用户」，自动命名随即停止 —— 这是平台的
* 既有语义，所以「锁定不改字」就是把当前标题原样写回。解锁 = `/retitle`（refresh
* 会覆盖已固定的用户标题，文档明确这是解锁路径）。
*/
function registerTitleEditCommands(ctx, getConfig) {
	ctx.effect(() => ctx.commands.register({
		name: RENAME_COMMAND,
		description: "手动修改会话标题（写入后自动锁定，停止自动更新）",
		handler: ({ agent, rawInput }) => {
			const text = normalizeSessionTitle(rawInput.trim(), getConfig().maxBytes);
			if (text.length === 0) return {
				kind: "error",
				text: "标题内容为空，已忽略"
			};
			try {
				ctx.sessionTitle.rename(agent.session, text);
				return {
					kind: "success",
					text: "已更新标题并锁定（自动更新停止）"
				};
			} catch (error) {
				return {
					kind: "error",
					text: `修改标题失败：${String(error)}`
				};
			}
		}
	}));
	ctx.effect(() => ctx.commands.register({
		name: LOCK_COMMAND,
		description: "锁定当前会话标题（停止自动更新）",
		handler: ({ agent }) => {
			const snapshot = ctx.sessionTitle.get(agent.session);
			if (snapshot === void 0) return {
				kind: "error",
				text: "当前会话还没有标题"
			};
			try {
				ctx.sessionTitle.rename(agent.session, snapshot.title);
				return {
					kind: "success",
					text: "已锁定标题（自动更新停止）"
				};
			} catch (error) {
				return {
					kind: "error",
					text: `锁定失败：${String(error)}`
				};
			}
		}
	}));
}
/**
* 草稿该用哪条模型路由。
*
* 服务的自动调度会把「当前主请求路由」塞进 `request.route`（取自
* `session.requestHeader()?.config`），而草稿命令是**自己拼 request** 的 ——
* 不补这一条，跟随对话模型时必然落到 `resolveRoute()` 的「没有可用的模型路由」
* 分支（v0.6.2 实机就是这个错，而 `/retitle` 走服务所以一直是好的）。
*
* 取不到就返回 undefined，由调用方退回关键词规则：草稿只是个可编辑的起点，
* 不值得为它报一个错误。
*/
function draftRoute(session, config) {
	if (config.provider.length > 0 && config.model.length > 0) return {
		provider: config.provider,
		model: config.model
	};
	const header = session.requestHeader();
	if (header === void 0) return void 0;
	return {
		provider: header.config.provider,
		model: header.config.model
	};
}
/**
* 面板专用命令：`title-suggest`（自动生成的草稿）、`title-unlock`（单纯解锁）
* 与 `title-state`（查锁定状态）。
*
* 两个命令都给设置面板的浮层用，不打算让用户手敲，但注册成命令可以完全复用
* 命令通道（host 执行、结果随 CommandResult 带回浏览器），不用另开远程接口。
*/
function registerPanelCommands(ctx, options) {
	const { getConfig, getLlm, states, provider } = options;
	ctx.effect(() => ctx.commands.register({
		name: SUGGEST_COMMAND,
		description: "按当前对话算一版标题草稿（只返回文本，不写入会话标题）",
		recordInput: false,
		handler: async ({ agent, signal }) => {
			const config = getConfig();
			const messages = collectHumanMessages(agent.session.snapshotEvents());
			if (messages.length === 0) return {
				kind: "error",
				text: "会话里还没有可用于起标题的消息"
			};
			try {
				const route = config.mode === "llm" ? draftRoute(agent.session, config) : void 0;
				if (config.mode === "llm") {
					const llm = getLlm();
					if (llm !== void 0 && route !== void 0) {
						const existing = states.get(agent.session.id);
						const scratch = existing ? { ...existing } : {
							mainLine: "",
							summary: "",
							seenCount: 0,
							count: 0,
							restored: true
						};
						const request = {
							session: agent.session,
							messages,
							route,
							signal
						};
						const { text } = await callTitleModel(llm, name, config, request, scratch);
						const parsed = parseTitleOutput(text);
						const first = messages[0];
						const type = parsed.type.length > 0 ? parsed.type : first !== void 0 ? classifyMessage(first) : FALLBACK_TYPE;
						return {
							kind: "success",
							text: composeTitle(/* @__PURE__ */ new Date(), type, parsed.topic, config)
						};
					}
					if (route === void 0) ctx.logger(name).warn("自动生成草稿：会话尚未记录主请求路由，本次改用关键词规则。想让草稿走模型，请在本插件配置里同时指定 provider 与 model");
				}
				return {
					kind: "success",
					text: buildRuleTitle(messages, config)
				};
			} catch (error) {
				return {
					kind: "error",
					text: `生成草稿失败：${String(error)}`
				};
			}
		}
	}));
	ctx.effect(() => ctx.commands.register({
		name: UNLOCK_COMMAND,
		description: "解锁会话标题（恢复自动更新，标题内容保持不变）",
		recordInput: false,
		handler: async ({ agent }) => {
			if (ctx.sessionTitle.get(agent.session) === void 0) return {
				kind: "error",
				text: "当前会话还没有标题"
			};
			provider.requestUnlock(agent.session.id);
			try {
				await ctx.sessionTitle.refresh(agent.session);
				return {
					kind: "success",
					text: "已解锁：标题恢复自动更新（内容不变）"
				};
			} catch (error) {
				return {
					kind: "error",
					text: `解锁失败：${String(error)}`
				};
			}
		}
	}));
	ctx.effect(() => ctx.commands.register({
		name: STATE_COMMAND,
		description: "查询当前会话标题是否处于锁定状态",
		recordInput: false,
		handler: ({ agent }) => {
			return {
				kind: "success",
				text: ctx.sessionTitle.get(agent.session)?.source.kind === "user" ? LOCKED : UNLOCKED
			};
		}
	}));
}
/**
* 注册 `/retitle` 命令：手动重算一次当前会话标题。
*
* `refresh()` 是解除用户 pin 的唯一切入口 —— 用户手动重命名过的会话处于
* pinned 状态，自动命名会停止调度，只有它能重新接管。
*
* 手动重算会重置滚动状态（`seenCount` 归零、摘要清空），让这次调用重新基于
* 「首条 + 最近一批」归纳；**主线保留** —— 那是模型逐轮积累的抗漂移锚，清了就找不回来。
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
			mainLine: "",
			summary: "",
			seenCount: 0,
			count: 0,
			restored: false
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
	let lastTitleSignature = titleStateSignature(config);
	ctx.inject(["settings"], (settingsCtx) => {
		settingsCtx.settings.installSection(ctx, SETTINGS_NS, Config, config, {
			setSource: (current) => {
				source = current;
			},
			onChange: () => {
				const next = currentConfig();
				const signature = titleStateSignature(next);
				if (signature !== lastTitleSignature) {
					lastTitleSignature = signature;
					states.clear();
				}
				logger.info(`设置已更新：mode=${next.mode}、retitleEvery=${next.retitleEvery}、隐藏 ${next.hiddenSessions.length} 条`);
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
		registerTitleEditCommands(commandCtx, currentConfig);
		registerPanelCommands(commandCtx, {
			getConfig: currentConfig,
			getLlm: () => llm,
			states,
			provider
		});
	});
}
//#endregion
export { Config, apply, inject, name };

//# sourceMappingURL=index.mjs.map