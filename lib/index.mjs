import z from "@deepseek-ai/schemastery";
import { SessionTitleProviderId, fallbackSessionTitle, foldSessionTitle, normalizeSessionTitle, truncateTitleUtf8 } from "@deepseek-ai/dsh-session-title";
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
/** 类型标签最多保留的汉字数：提示里要求两个汉字，这里放宽到 4 个以免误伤。 */
const MAX_TYPE_CHARS = 4;
/** 拉丁类型只取一个单词，另设字符上限，避免异常长的输出整段变成类型。 */
const MAX_TYPE_WORD_CHARS = 16;
/** 汉字（含扩展 A 与兼容区）。 */
const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
/** 语言探测用的全局匹配器（`g` 标志是有意的：要数个数）。 */
const CJK_ALL = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g;
const LATIN_ALL = /[A-Za-z]/g;
/** 语言探测读取的字符数上限：只为判断语言，不必读完整个会话。 */
const LANG_SAMPLE_CHARS = 2e3;
/**
* 猜一段会话的语言：汉字比拉丁字母多就算中文，否则算英文。
*
* 只用于**用户没显式选过语言环境**时的兜底（那时真实语言由浏览器推导，host 看不到）。
* 取最近几条消息而不是第一条 —— 会话中途换语言时，最近在说什么才是更准的信号。
*/
function detectMessageLang(messages) {
	const sample = messages.slice(-3).map((message) => message.text ?? "").join(" ").slice(0, LANG_SAMPLE_CHARS);
	return (sample.match(CJK_ALL) ?? []).length > (sample.match(LATIN_ALL) ?? []).length ? "zh" : "en";
}
/**
* 规范化模型给出的类型，**形状由目标语言决定**。
*
* - `zh`：只留汉字（模型偶尔夹带英文，剥掉），最多 4 个
* - `en`：只取第一个单词并去掉标点（保留 `+` `#` `.`，免得砍掉 `c++` / `node.js`）
*
* **不能按字符数一刀切** —— 英文类型按 4 个字符截断会把 `Debugging` 变成 `Debu`。
* 模型没按目标语言输出时（例如要中文却给了 `Debug`）**不硬丢弃**，退回「取一个单词」，
* 宁可留着也不丢信息。
*/
function normalizeType(raw, lang) {
	const text = raw.trim();
	if (text.length === 0) return "";
	if (lang === "zh") {
		const han = [...text].filter((char) => CJK.test(char)).join("");
		if (han.length > 0) return [...han].slice(0, MAX_TYPE_CHARS).join("");
	}
	return [...(text.split(/\s+/).find((part) => part.length > 0) ?? "").replace(/[^\p{L}\p{N}+#.]/gu, "")].slice(0, MAX_TYPE_WORD_CHARS).join("");
}
/**
* 系统提示词。
*
* 类型语言**每次现算**（用户随时可能在设置里换语言环境），所以提示词按目标语言生成：
* **类型严格按指定语言**，主线与主题跟随消息本身的语言。
*
* 两段示例里**总有一条是「消息语言 ≠ 类型语言」**的情形 —— 只靠一句文字说明压不住，
* 模型照抄示例比照抄说明可靠得多（v0.5.22 踩过这个坑）。
*/
function systemPrompt(typeLang) {
	return [
		"你是一个会话标题生成器。根据给出的人类消息，为这段会话生成一个标题。",
		"",
		"输出两行，除这两行外不要输出任何内容：",
		"第一行：主线。一句话概括这段会话从头到尾**主要在干什么**，**用消息本身的语言**。",
		"  如果输入里给了 mainLine：会话目标没有变化时**原样返回**，不要改写；",
		"  mainLine 是这段会话**最初的最大目标** —— 解决主线过程中产生的报错、bug、调试，",
		"  都是主线的**子任务**，不属于目标变化。不要因为最近一直在修 bug 就把主线改成「调试×××」；",
		"  只有出现和原目标并列的全新目标时才更新主线。",
		"第二行：类型|主题。",
		typeLang === "zh" ? "  - 类型：**必须用中文**，两个汉字概括（例如「排查」「配置」「文档」），不要用英文单词。" : "  - 类型：**must be one single English word**（例如 Debug / Config / Docs），首字母大写；不要用短语、句子或中文。",
		"  - 主题：对整段会话的凝练总结，提炼关键词，不要照抄某一句话，**用消息本身的语言**。",
		"  - **主线优先**：标题必须与第一行的主线一致。最近几轮可能只是在解决主线下面",
		"    的某个具体问题，不要让它们把标题带偏。",
		"",
		...typeLang === "zh" ? [
			"示例一（消息是中文）：主线「开发登录模块」、类型「排查」、主题「处理登录 401」，输出正好是这两行：",
			"开发登录模块",
			"排查|处理登录 401",
			"示例二（消息是英文、但类型仍然要求中文）：主线 \"Develop the login module\"、类型「排查」、",
			"主题 \"login 401\"，输出正好是这两行：",
			"Develop the login module",
			"排查|login 401"
		] : [
			"示例一（消息是英文）：主线 \"Develop the login module\"、类型 \"Debug\"、主题 \"login 401\"，输出正好是这两行：",
			"Develop the login module",
			"Debug|login 401",
			"示例二（消息是中文、但类型仍然要求英文）：主线「开发登录模块」、类型 \"Debug\"、",
			"主题「处理登录 401」，输出正好是这两行：",
			"开发登录模块",
			"Debug|处理登录 401"
		],
		"",
		"要求：类型严格按上面指定的语言；主线与主题跟随消息本身的语言；行内不要引号、Markdown、编号或解释。"
	].join("\n");
}
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
* 类型缺失时返回空串，标题模板里 `{type}` 那一段会整段消失。
*/
function parseTitleLine(raw, typeLang) {
	const cleaned = (raw.split("\n").map((part) => part.trim()).find((part) => part.length > 0) ?? "").replace(/^[-\s*\d.、]+/, "").replace(/^[「『"'“”`【\[]+/, "").replace(/[」』"'“”`】\]]+$/, "").trim();
	const [head, ...rest] = cleaned.split(/[|｜]/).map((part) => part.trim()).filter((part) => part.length > 0);
	if (head !== void 0 && rest.length > 0) return {
		type: normalizeType(head, typeLang),
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
* **模型经常照抄提示词的措辞**，把行写成 `主线：xxx`、`类型：编程`、`主题：xxx`；
* 英文会话里则会写成 `Main line:` / `Type:` / `Topic:` —— 所以中英标签都要认。
* 实测出过标题被解析成 `其他｜类型：编程` 的事故（「类型：编程」没有竖线，
* 老解析器认不出类型，整行落进了主题）。
*
* 所以这里按**行首标签**归类，而不是死认行序；完全认不出标签才退回老约定
* （两行 = 主线 + 标题行；一行 = 标题行，主线沿用上一次的）。
*/
function parseTitleOutput(raw, typeLang) {
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
		if (/^(主线|main\s*line|mainline)\s*[:：]/i.test(line)) {
			mainLine ||= line.replace(/^(主线|main\s*line|mainline)\s*[:：]\s*/i, "");
			continue;
		}
		if (/^(类型|主题|type|topic)\s*[:：]/i.test(line)) {
			const parts = line.split(/[|｜]/).map((part) => part.replace(BULLET, "").trim()).filter((part) => part.length > 0);
			for (const part of parts) if (/^(类型|type)\s*[:：]/i.test(part)) type ||= part.replace(/^(类型|type)\s*[:：]\s*/i, "");
			else if (/^(主题|topic)\s*[:：]/i.test(part)) topic ||= part.replace(/^(主题|topic)\s*[:：]\s*/i, "");
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
		const cappedType = normalizeType(type, typeLang);
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
			...parseTitleLine(second, typeLang),
			titleLine: second
		};
	}
	const single = bare[0] ?? lines[0];
	return {
		...empty,
		...parseTitleLine(single, typeLang),
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
	throw new Error("No usable model route: the session has not recorded a main request route yet; set both provider and model in this plugin configuration");
}
/**
* 调用一次辅助模型，拿回标题单行。
*
* 服务是**参数传入**而不是从 `ctx` 上取：cordis 的 Context 是受保护的代理，
* 未在 inject 里声明的服务属性一旦访问就抛 `cannot get property "llm" without inject`。
* 调用方通过延迟注入拿到它：组合里没有 llm 时只是标题生成走降级，不影响插件加载。
*
* 与官方 LLM 标题插件同构：`llm.stream` 流式调用 + `BlockAssembler` 组装 +
* `deadline` 组合超时与上游取消。`purpose` 是封闭枚举，辅助调用只能标
* `session-title`。
*
* @param typeLang - 本次「类型」该用哪种语言（提示词按它生成）。
*/
async function callTitleModel(llm, pluginName, settings, request, state, typeLang) {
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
			system: systemPrompt(typeLang),
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
		if (finish.kind !== "stop" && !truncated) throw new Error(`Title model did not finish normally (${finish.kind})`);
		const blocks = assembler.blocks();
		if (blocks.some((block) => block.type === "tool-call")) throw new Error("Title model must not produce tool calls");
		const text = blocks.filter((block) => block.type === "text").map((block) => block.text).join(" ").trim();
		if (text.length === 0) throw new Error("Title model produced no text");
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
/** 默认标题格式：日期｜类型｜主题。 */
const DEFAULT_TITLE_TEMPLATE = "{MMDD}｜{type}｜{topic}";
/**
* 模板渲染不出任何内容时的最后兜底。
*
* 实际不可达：服务只在存在合格人类消息时才调用 provider，主题至少能取到那段正文。
* 留这个常量只是为了保证标题永远非空 —— 服务会拒绝空标题。
*/
const EMPTY_TITLE_FALLBACK = "Untitled";
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
/** 分隔符字符集：两端收边与空段折叠共用同一套。 */
const SEPARATOR_CHARS = /[\s|｜·,，、/\\–—-]/;
/** 收掉两端残留的空白与分隔符（主题为空时会留下尾巴）。 */
function trimEdgeSeparators(text) {
	return text.replace(/^[\s|｜·,，、/\\–—-]+/, "").replace(/[\s|｜·,，、/\\–—-]+$/, "");
}
/**
* 占位符渲染成空串时的内部标记。
*
* 用它把「这个位置本来就没有内容」与「用户模板里自己写的内容」区分开：
* 只有空占位符才触发折叠，绝不整体合并分隔符 —— 否则用户有意写的
* `{YYYY}--{MM}` 会被压成 `2026-09`。
*/
const EMPTY_SEGMENT = "\0";
/**
* 去掉空占位符，并吃掉它一侧紧邻的分隔符串。
*
* 例：`0915｜<空>｜登录失败` → `0915｜登录失败`（类型为空时不留下双竖线）；
*     `<空>｜登录失败` → `登录失败`。
*/
function dropEmptySegments(text) {
	const chars = [...text];
	const kept = [];
	for (let index = 0; index < chars.length; index += 1) {
		const char = chars[index] ?? "";
		if (char !== EMPTY_SEGMENT) {
			kept.push(char);
			continue;
		}
		let removedLeft = 0;
		while (kept.length > 0 && SEPARATOR_CHARS.test(kept[kept.length - 1] ?? "")) {
			kept.pop();
			removedLeft += 1;
		}
		if (removedLeft === 0) {
			let right = index + 1;
			while (right < chars.length && SEPARATOR_CHARS.test(chars[right] ?? "")) right += 1;
			index = right - 1;
		}
	}
	return kept.join("");
}
/**
* 按模板拼标题。
*
* `{...}` 里可以写：
* - `type` / `topic`：类型与主题。**渲染成空串时整段消失**，相邻的分隔符一并收掉
*   —— 所以模型失败、只拿得到日期与正文时，标题是 `0915｜登录失败` 而不是双竖线。
* - 日期时间部件，可任意拼接：`YYYY` `MM` `DD` `HH` `mm` `ss`
*   （注意 `MM` 是月、`mm` 是分，大小写敏感）
* - 都不认得的占位符**原样保留**，一眼能看出是模板写错了
*
* 例：`{MMDD}｜{type}｜{topic}` → `0913｜修复｜登录失败`；
*     `{YYYYMMDD} {topic}` → `20260913 登录失败`（不要分类）。
*/
function formatTitle(template, now, type, topic) {
	const parts = timeParts(now);
	return trimEdgeSeparators(dropEmptySegments(template.replace(/\{([^{}]*)\}/g, (whole, inner) => {
		if (inner === "type") return type.length > 0 ? type : EMPTY_SEGMENT;
		if (inner === "topic") return topic.length > 0 ? topic : EMPTY_SEGMENT;
		return expandTimeTokens(inner, parts) ?? whole;
	})));
}
/** 剥离开头的斜杠命令（`/compact xxx` -> `xxx`），非命令原样返回。 */
function stripLeadingCommand(text) {
	return text.replace(/^\/\S+\s*/, "");
}
/**
* 拼装标题：先按模板渲染，再只做一次字节收口。
*
* `truncateTitleUtf8` 按 code point 迭代，不会切断代理对（emoji 等）。
* 模板写坏到渲染不出任何内容时逐级回退（渲染结果 → 主题原文 → 兜底常量），
* 保证标题永远非空 —— 服务会拒绝空标题。
*/
function composeTitle(now, type, topic, format) {
	const clean = normalizeSessionTitle(topic, format.maxBytes);
	const filled = formatTitle(format.template, now, type, clean);
	return truncateTitleUtf8(filled || clean || EMPTY_TITLE_FALLBACK, format.maxBytes);
}
/**
* 兜底主题的词数上限。
*
* 与 dsh 自带行为对齐：原生 `fallbackSessionTitle(input, maxWords, maxBytes)`
* 取首条消息**前 maxWords 个空格分隔的词**，再按字节上限截断。原生那个 maxWords 来自
* service 的私有配置（`fallbackMaxWords`，由 dsh-base 给值），插件读不到，
* 这里取与官方 README 示例一致的 8。
*
* ⚠️ 中文没有空格，`split(' ')` 下整句就是「一个词」，所以**词数限制对中文不起作用**
* —— 中文只受 `maxBytes` 约束。这与原生行为一致，不是我们的偏差。
*/
const FALLBACK_MAX_WORDS = 8;
/**
* 本地兜底标题：**只在会话还没有标题、且模型调用失败时**使用。
*
* 三段固定：
* - 日期时间部件：本地渲染，不需要模型
* - **类型整个省略**（`{type}` 段消失，相邻分隔符一并收掉）
* - 主题：首条消息正文的前 `FALLBACK_MAX_WORDS` 个词，再按 `maxBytes` 收口
*
* 主题**直接复用官方的 `fallbackSessionTitle()`**，所以截断口径与 dsh 自带的那次
* 首次命名**逐字一致**（前 N 个词 + 字节上限），不是我们另编一套。
*
* 例：模板 `{MMDD}｜{type}｜{topic}` + 首条消息 → `0915｜xxxxxxxxxxx`。
*
* 服务只在存在合格人类消息时才会调用 provider，空数组分支实际上不可达；
* 真走到这里 messageSeqs 也会是空数组，服务会先以 "must identify at least
* one source message seq" 拒绝，这里返回空串只是保持函数纯度。
*/
function buildFallbackTitle(messages, format, now = /* @__PURE__ */ new Date()) {
	const first = messages[0];
	if (!first) return "";
	const raw = (first.text ?? "").trim();
	const source = stripLeadingCommand(raw) || raw;
	return composeTitle(now, "", fallbackSessionTitle(source, FALLBACK_MAX_WORDS, format.maxBytes), format);
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
	retitleEvery: z.number().step(1).min(0).default(10),
	provider: z.string().default(""),
	model: z.string().default(""),
	timeoutMs: z.number().step(1).min(1).default(9e4),
	maxOutputTokens: z.number().step(1).min(1).default(2048),
	maxInputBytes: z.number().step(1).min(1).default(4096),
	hiddenEnabled: z.boolean().default(true),
	hiddenSessions: z.array(z.string()).default([]),
	revealHiddenAll: z.boolean().default(false)
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
	resolveTypeLang;
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
	constructor(ctx, getConfig, states, getLlm, resolveTypeLang) {
		this.ctx = ctx;
		this.getConfig = getConfig;
		this.states = states;
		this.getLlm = getLlm;
		this.resolveTypeLang = resolveTypeLang;
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
		const typeLang = this.resolveTypeLang(request.messages);
		if (state.lang !== void 0 && state.lang !== typeLang) state.summary = "";
		state.lang = typeLang;
		try {
			const llm = this.getLlm();
			if (llm === void 0) throw new Error("The llm service is not ready: this composition has no usable @deepseek-ai/dsh-llm");
			const startedAt = Date.now();
			const { text, route, inputBytes, truncated } = await callTitleModel(llm, name, config, request, state, typeLang);
			const parsed = parseTitleOutput(text, typeLang);
			const title = composeTitle(/* @__PURE__ */ new Date(), parsed.type, parsed.topic, config);
			state.mainLine = parsed.mainLine.length > 0 ? parsed.mainLine : state.mainLine;
			state.summary = toSummary(parsed.titleLine);
			state.seenCount = request.messages.length;
			this.ctx.logger(name).info(`Title generated (message #${request.messages.length}, ${route.provider}/${route.model}, ${inputBytes} bytes in, ${Date.now() - startedAt}ms): ${title}; main line: ${state.mainLine || "(empty)"}`);
			if (truncated) this.ctx.logger(name).warn(`Title model hit the output limit (maxOutputTokens=${config.maxOutputTokens}); using the first line instead. Raise it or switch to a non-reasoning model if this repeats.`);
			return {
				title,
				messageSeqs,
				model: route
			};
		} catch (error) {
			state.seenCount = request.messages.length;
			const current = this.ctx.sessionTitle.get(request.session);
			if (current !== void 0 && current.title.length > 0) {
				this.ctx.logger(name).warn(`Title generation failed after message #${request.messages.length}; keeping the previous title: ${String(error)}`);
				throw error;
			}
			const fallback = buildFallbackTitle(request.messages, config);
			if (fallback.length === 0) {
				this.ctx.logger(name).warn(`Title generation failed after message #${request.messages.length} and no local fallback was possible: ${String(error)}`);
				throw error;
			}
			this.ctx.logger(name).warn(`Title generation failed after message #${request.messages.length}; using a local fallback title: ${fallback} (${String(error)})`);
			return {
				title: fallback,
				messageSeqs
			};
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
		description: "Manually set the session title (locks it and stops automatic updates)",
		handler: ({ agent, rawInput }) => {
			const text = normalizeSessionTitle(rawInput.trim(), getConfig().maxBytes);
			if (text.length === 0) return {
				kind: "error",
				text: "Title is empty; ignored"
			};
			try {
				ctx.sessionTitle.rename(agent.session, text);
				return {
					kind: "success",
					text: "Title updated and locked (automatic updates stopped)"
				};
			} catch (error) {
				return {
					kind: "error",
					text: `Failed to update title: ${String(error)}`
				};
			}
		}
	}));
	ctx.effect(() => ctx.commands.register({
		name: LOCK_COMMAND,
		description: "Lock the current session title (stops automatic updates)",
		handler: ({ agent }) => {
			const snapshot = ctx.sessionTitle.get(agent.session);
			if (snapshot === void 0) return {
				kind: "error",
				text: "This session has no title yet"
			};
			try {
				ctx.sessionTitle.rename(agent.session, snapshot.title);
				return {
					kind: "success",
					text: "Title locked (automatic updates stopped)"
				};
			} catch (error) {
				return {
					kind: "error",
					text: `Failed to lock title: ${String(error)}`
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
	const { getConfig, getLlm, resolveTypeLang, states, provider } = options;
	ctx.effect(() => ctx.commands.register({
		name: SUGGEST_COMMAND,
		description: "Draft a title from the current conversation (returns text only, never writes it)",
		recordInput: false,
		handler: async ({ agent, signal }) => {
			const config = getConfig();
			const messages = collectHumanMessages(agent.session.snapshotEvents());
			if (messages.length === 0) return {
				kind: "error",
				text: "This session has no messages usable for a title yet"
			};
			const current = ctx.sessionTitle.get(agent.session);
			const hasTitle = current !== void 0 && current.title.length > 0;
			try {
				const route = draftRoute(agent.session, config);
				const llm = getLlm();
				if (route !== void 0 && llm !== void 0) {
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
					const typeLang = resolveTypeLang(messages);
					const { text } = await callTitleModel(llm, name, config, request, scratch, typeLang);
					const parsed = parseTitleOutput(text, typeLang);
					return {
						kind: "success",
						text: composeTitle(/* @__PURE__ */ new Date(), parsed.type, parsed.topic, config)
					};
				}
				if (hasTitle) {
					ctx.logger(name).warn("Draft title requested but no usable model route is available for this draft");
					return {
						kind: "error",
						text: "Failed to draft a title: no usable model route (set both provider and model)"
					};
				}
				ctx.logger(name).warn("Draft title: no usable model route; falling back to a local title for a session that has no title yet");
				return {
					kind: "success",
					text: buildFallbackTitle(messages, config)
				};
			} catch (error) {
				if (hasTitle) return {
					kind: "error",
					text: `Failed to draft a title: ${String(error)}`
				};
				const fallback = buildFallbackTitle(messages, config);
				if (fallback.length > 0) {
					ctx.logger(name).warn(`Draft title model call failed; using a local fallback: ${String(error)}`);
					return {
						kind: "success",
						text: fallback
					};
				}
				return {
					kind: "error",
					text: `Failed to draft a title: ${String(error)}`
				};
			}
		}
	}));
	ctx.effect(() => ctx.commands.register({
		name: UNLOCK_COMMAND,
		description: "Unlock the session title (resumes automatic updates; title text unchanged)",
		recordInput: false,
		handler: async ({ agent }) => {
			if (ctx.sessionTitle.get(agent.session) === void 0) return {
				kind: "error",
				text: "This session has no title yet"
			};
			provider.requestUnlock(agent.session.id);
			try {
				await ctx.sessionTitle.refresh(agent.session);
				return {
					kind: "success",
					text: "Unlocked: automatic updates resumed (title text unchanged)"
				};
			} catch (error) {
				return {
					kind: "error",
					text: `Failed to unlock title: ${String(error)}`
				};
			}
		}
	}));
	ctx.effect(() => ctx.commands.register({
		name: STATE_COMMAND,
		description: "Report whether the current session title is locked",
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
		description: "Regenerate the session title from the conversation",
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
					text: "This session has no messages usable for generating a title"
				};
				return {
					kind: "success",
					text: snapshot.title
				};
			} catch (error) {
				return {
					kind: "error",
					text: `Failed to generate title: ${String(error)}`
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
		if (!isEligibleUserMessage(event)) return;
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
		ctx.logger(name).info(`Message #${state.count}; recomputing the title (every ${config.retitleEvery} messages)`);
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
	/**
	* 用户的语言环境（设置里的语言）。
	*
	* host 侧**没有** locale 服务，但 locale 插件把偏好存进了设置文档的 `locale` 命名空间
	* （字段 `preference`），而 `ctx.settings.get()` 是公开读取面 —— 所以这里读得到。
	* 同样走延迟注入，不能直接写 `ctx.settings`（受保护代理会抛）。
	*/
	let settings;
	/**
	* 取用户选的语言环境；读不到返回 undefined。
	*
	* 读不到有两种情况：用户从没显式选过语言（那时真实语言由浏览器推导，host 看不到），
	* 或这份组合里根本没注册 `locale` 命名空间。都由调用方退回「按对话语言判断」。
	*/
	const getUiLocale = () => {
		try {
			const preference = (settings?.get("locale"))?.preference;
			return preference === "zh" || preference === "en" ? preference : void 0;
		} catch {
			return;
		}
	};
	/** 类型标签该用哪种语言：语言环境优先，拿不到才看对话语言。 */
	const resolveTypeLang = (messages) => getUiLocale() ?? detectMessageLang(messages);
	const provider = new SessionTitlePatternProvider(ctx, currentConfig, states, () => llm, resolveTypeLang);
	let dispose;
	try {
		dispose = ctx.sessionTitle.register(provider);
	} catch (error) {
		logger.warn(`Failed to register the title provider; session titles fall back to the built-in rule. Another provider (e.g. dsh-base session-title-llm) most likely registered first, and SessionTitleService allows only one globally: ${String(error)}`);
		return;
	}
	ctx.effect(() => dispose);
	let lastTitleSignature = titleStateSignature(config);
	ctx.inject(["settings"], (settingsCtx) => {
		settings = settingsCtx.settings;
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
				logger.info(`Settings updated: retitleEvery=${next.retitleEvery}, hidden ${next.hiddenSessions.length}`);
			},
			validate: (value) => {
				if (value.provider.length > 0 !== value.model.length > 0) throw new Error("provider and model must be set together, or both left empty");
			}
		});
	});
	const initial = currentConfig();
	if (initial.provider.length > 0 !== initial.model.length > 0) logger.warn(`provider / model must be configured as a pair; currently provider=${JSON.stringify(initial.provider)}, model=${JSON.stringify(initial.model)}. Both are ignored and the session main model is followed instead.`);
	trackRecomputes(ctx, currentConfig, states);
	ctx.inject(["commands"], (commandCtx) => {
		registerRetitleCommand(commandCtx, states);
		registerTitleEditCommands(commandCtx, currentConfig);
		registerPanelCommands(commandCtx, {
			getConfig: currentConfig,
			getLlm: () => llm,
			resolveTypeLang,
			states,
			provider
		});
	});
}
//#endregion
export { Config, apply, inject, name };

//# sourceMappingURL=index.mjs.map