window.__ModuleLoader__.load({
	id: "dsh-session-title-pattern",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/settings-card.tsx
		/**
		* 设置命名空间，必须与 host 侧 `installSection` 用的一模一样。
		*
		* 字面量在这里重写而不是从 host 包导入：客户端包不得依赖 host 包。
		*/
		const SETTINGS_NS = "session-title-pattern";
		/**
		* host 侧 Config 的默认值，客户端留一份镜像。
		*
		* 只在快照的 `base` 层拿不到某字段时兜底 —— `base` 是「清空该字段后会回落到的值」，
		* 正常情况下它就是我们要显示给用户的默认值。
		*/
		const FALLBACK_DEFAULTS = {
			mode: "llm",
			retitleEvery: 10,
			provider: "",
			model: "",
			timeoutMs: 3e4,
			template: "{MMDD}｜{type}｜{topic}",
			maxBytes: 80
		};
		const textField = {
			format: (value) => typeof value === "string" ? value : "",
			parse: (text) => text.trim() === "" ? { kind: "clear" } : {
				kind: "set",
				value: text.trim()
			}
		};
		const numberField = {
			format: (value) => typeof value === "number" && Number.isFinite(value) ? String(value) : "",
			parse: (text) => {
				const trimmed = text.trim();
				if (trimmed === "") return { kind: "clear" };
				const parsed = Number(trimmed);
				return Number.isInteger(parsed) ? {
					kind: "set",
					value: parsed
				} : void 0;
			}
		};
		/**
		* 卡片暴露的 8 项。全部一次展开，不再做二级折叠 —— 一共没几个输入项。
		*
		* `maxInputBytes`（滚动摘要的字节预算）刻意不放出来：它是内部预算，
		* 调整它只会影响成本，需要时走 `cordis.patch.yml`。
		*/
		const FIELDS = [
			{
				field: "mode",
				label: "用模型总结标题",
				hint: "关闭后回到关键词规则分类，不再消耗 token",
				spec: {
					format: (value) => value === "rules" ? "rules" : "llm",
					parse: (text) => ({
						kind: "set",
						value: text === "rules" ? "rules" : "llm"
					})
				}
			},
			{
				field: "retitleEvery",
				label: "每隔几条对话重算一次",
				hint: "0 = 只在新建会话时算一次，之后不自动更新（可随时点标题旁的按钮手动重算）",
				spec: numberField,
				modelOnly: true
			},
			{
				field: "provider",
				label: "标题总结大模型",
				spec: textField,
				modelOnly: true
			},
			{
				field: "model",
				label: "具体模型",
				spec: textField,
				modelOnly: true
			},
			{
				field: "timeoutMs",
				label: "超时",
				hint: "单次模型调用超时（毫秒）。模型慢的时候（比如免费档在排队）就往大调",
				spec: numberField,
				modelOnly: true
			},
			{
				field: "template",
				label: "标题格式",
				hint: "占位符：{YYYY} {MM} {DD} {HH} {mm} {ss} {type} {topic}。日期部件可任意拼接（如 {MMDD}、{YYYYMMDD}）；不写 {type} 就没有分类，不写 {topic} 就没有主题",
				spec: textField
			},
			{
				field: "maxBytes",
				label: "标题长度上限",
				hint: "单位字节，必须 ≤ session-title 的 maxTitleBytes（dsh-base 默认 80）",
				spec: numberField
			}
		];
		const ChevronIcon = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
			width: "16",
			height: "16",
			viewBox: "0 0 16 16",
			"aria-hidden": "true",
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
				d: "M4 6.5 8 10.5 12 6.5",
				stroke: "currentColor",
				strokeWidth: "1.5",
				fill: "none",
				strokeLinecap: "round",
				strokeLinejoin: "round"
			})
		});
		function hasKey(value, key) {
			return Object.prototype.hasOwnProperty.call(value, key);
		}
		/** 这两个字段都是标量，用严格相等即可；留 JSON 比较兜底以防将来出现对象。 */
		function sameValue(left, right) {
			if (left === right) return true;
			if (left === null || right === null) return false;
			if (typeof left !== "object" || typeof right !== "object") return false;
			try {
				return JSON.stringify(left) === JSON.stringify(right);
			} catch {
				return false;
			}
		}
		/** 沿路径走进一层层的对象；任何一步对不上就返回 undefined。 */
		function walk(node, path) {
			let current = node;
			for (const key of path) {
				if (current === null || typeof current !== "object") return void 0;
				current = current[key];
			}
			return current;
		}
		/**
		* 一个节点算不算「用户真的写了东西」。
		*
		* **空对象不算**。这条很关键：`settingsPath` 为空时 `walk(user, [])` 返回 `user` 本身，
		* 而平台会给内置供应商预置一个空壳 profile —— 若只判断「不是 undefined」，
		* 一堆没配置过的供应商（比如没填 key 的 DeepSeek）就会混进列表。
		*/
		function isMeaningful(node) {
			if (node === void 0 || node === null) return false;
			if (typeof node === "object") return Object.keys(node).length > 0;
			return true;
		}
		/** 从某个 provider 的 profile 里读出 `models` 数组。 */
		function readModels(section, path) {
			const profile = walk(section, path);
			if (profile === null || typeof profile !== "object") return [];
			const models = profile.models;
			if (!Array.isArray(models)) return [];
			const result = [];
			for (const entry of models) {
				if (entry === null || typeof entry !== "object") continue;
				const record = entry;
				if (typeof record.id !== "string" || record.id.length === 0) continue;
				result.push(typeof record.name === "string" ? {
					id: record.id,
					name: record.name
				} : { id: record.id });
			}
			return result;
		}
		/** profile 里指向凭据的引用名（`apiKeyEnv`）。 */
		function readApiKeyRef(section, path) {
			const profile = walk(section, path);
			if (profile === null || typeof profile !== "object") return void 0;
			const ref = profile.apiKeyEnv;
			return typeof ref === "string" && ref.length > 0 ? ref : void 0;
		}
		/**
		* 解析凭据域的回答，尽力而为。
		*
		* 期望形状是 `{ ok: true, value: … }`，`value` 可能是 `[{ ref, configured }]`
		* 或 `{ [ref]: { configured } }`。形状不认就返回 undefined，让调用方回退。
		*/
		function parseConfiguredRefs(raw) {
			if (raw === null || typeof raw !== "object") return void 0;
			const envelope = raw;
			if (envelope.ok !== true) return void 0;
			const value = envelope.value;
			const configured = /* @__PURE__ */ new Set();
			if (Array.isArray(value)) {
				for (const entry of value) {
					if (entry === null || typeof entry !== "object") continue;
					const record = entry;
					const ref = typeof record.ref === "string" ? record.ref : typeof record.name === "string" ? record.name : void 0;
					if (ref !== void 0 && record.configured === true) configured.add(ref);
				}
				return configured;
			}
			if (value !== null && typeof value === "object") {
				for (const [ref, entry] of Object.entries(value)) if (entry !== null && typeof entry === "object" && entry.configured === true) configured.add(ref);
				return configured;
			}
		}
		/**
		* 组装「供应商 → 已配置模型」目录，**只保留用户真正配好的供应商**。
		*
		* `listProviders()` 返回的是适配器注册的**全部内置供应商**，直接罗列会出现一大堆
		* 用户根本没配、用不了的模型。所以再加两道闸：路由必须**已注册**，且该 provider 的
		* profile 要么在设置文档的**用户层**被写过、要么它引用的凭据**已配置**。
		*
		* 凭据域拿不到时只用用户层判定，并在界面上说明。
		*/
		async function loadDirectory(llm, describe, getCredentials) {
			try {
				const [registered, declared] = await Promise.all([llm.listProviders(), llm.listConfigurableProviders()]);
				if (registered.ok !== true) return {
					status: "unavailable",
					reason: "无法读取已注册的模型供应商"
				};
				await describe.ensure();
				const views = describe.getSnapshot().view?.namespaces ?? [];
				const findView = (ns) => views.find((candidate) => candidate.ns === ns);
				const activeIds = new Set((registered.value ?? []).map((entry) => entry.id));
				const addresses = /* @__PURE__ */ new Map();
				for (const entry of declared.ok ? declared.value ?? [] : []) addresses.set(entry.provider, {
					displayName: entry.displayName,
					settingsNs: entry.settingsNs,
					settingsPath: entry.settingsPath ?? []
				});
				for (const entry of registered.value ?? []) if (!addresses.has(entry.id)) addresses.set(entry.id, {
					displayName: entry.name,
					settingsPath: []
				});
				const refs = [];
				for (const address of addresses.values()) {
					if (address.settingsNs === void 0) continue;
					const ref = readApiKeyRef(findView(address.settingsNs)?.value, address.settingsPath);
					if (ref !== void 0) refs.push(ref);
				}
				let configuredRefs;
				const credentials = getCredentials();
				if (credentials !== void 0) try {
					configuredRefs = refs.length === 0 ? /* @__PURE__ */ new Set() : parseConfiguredRefs(await credentials.describe([...new Set(refs)]));
				} catch {
					configuredRefs = void 0;
				}
				const routes = [];
				for (const [provider, address] of addresses) {
					if (!activeIds.has(provider)) continue;
					const view = address.settingsNs === void 0 ? void 0 : findView(address.settingsNs);
					const userConfigured = isMeaningful(walk(view?.user, address.settingsPath));
					const ref = readApiKeyRef(view?.value, address.settingsPath);
					if (ref !== void 0) {
						if (!(configuredRefs !== void 0 ? configuredRefs.has(ref) : userConfigured)) continue;
					} else if (!userConfigured) continue;
					routes.push({
						provider,
						displayName: address.displayName,
						models: readModels(view?.value, address.settingsPath)
					});
				}
				routes.sort((left, right) => left.displayName.localeCompare(right.displayName));
				return {
					status: "ready",
					routes,
					credentialsChecked: configuredRefs !== void 0
				};
			} catch (error) {
				return {
					status: "unavailable",
					reason: String(error)
				};
			}
		}
		/**
		* 本插件的设置卡片。
		*
		* 结构、类名与样式对齐官方 `PluginCard` + `fields`（见 `settings-css.ts`）：
		* 收起时是灰底卡片，展开后正文落在同一张卡片内、只隔一条细线；普通字段
		* 「标签在上 / 控件整宽在下 / 说明再下一行」，开关字段「标题与说明在左、开关在右」。
		*
		* 用「暂存 + 保存」而不是改一下就提交：每次写入都是可持久化的、带修订号栅栏的文档变更，
		* 边改边写会把一次输入变成用户没要求、也无法预览的写入（官方 `CardForm` 的同一取舍）。
		*/
		function SettingsCard({ scope, describe, getLlm, getCredentials }) {
			const subscribe = (0, react.useCallback)((onChange) => scope.subscribe(onChange), [scope]);
			const getSnapshot = (0, react.useCallback)(() => scope.getSnapshot(), [scope]);
			const snapshot = (0, react.useSyncExternalStore)(subscribe, getSnapshot);
			const [expanded, setExpanded] = (0, react.useState)(false);
			const [drafts, setDrafts] = (0, react.useState)({});
			const [busy, setBusy] = (0, react.useState)(false);
			const [failed, setFailed] = (0, react.useState)(false);
			const [directory, setDirectory] = (0, react.useState)({ status: "loading" });
			(0, react.useEffect)(() => {
				const llm = getLlm();
				if (llm === void 0) {
					setDirectory({
						status: "unavailable",
						reason: "llm 远端服务不可用"
					});
					return;
				}
				let alive = true;
				loadDirectory(llm, describe, getCredentials).then((next) => {
					if (alive) setDirectory(next);
				});
				return () => {
					alive = false;
				};
			}, [
				describe,
				getCredentials,
				getLlm
			]);
			const section = snapshot.value ?? {};
			const user = snapshot.user ?? {};
			const base = snapshot.base ?? {};
			const writable = snapshot.writable && !busy;
			const ready = snapshot.status === "ready";
			/** 一个字段「清空后回落到」的值，也就是界面上该显示的默认值。 */
			const defaultOf = (field) => base[field] !== void 0 ? base[field] : FALLBACK_DEFAULTS[field];
			const draftText = (desc) => drafts[desc.field] ?? desc.spec.format(section[desc.field]);
			const providerDesc = FIELDS.find((desc) => desc.field === "provider");
			const modelDesc = FIELDS.find((desc) => desc.field === "model");
			/**
			* 「厂家 + 具体模型」这一对的当前取值。
			*
			* - 厂家：草稿优先，否则取已保存的值
			* - 具体模型：草稿优先；**没有值时**自动落到该厂家的第一个模型
			*   （对应用户要求的「必须选一个、不给留空」）；**已存过的值一律原样保留**
			* - 目录读不到（`pairModels === undefined`）→ 原样保留，退回手动输入
			*
			* 注意这里**只算不写**：解析结果不回写草稿。曾经把「自动落到第一个」写进草稿，
			* 后果是卡片一打开就挂着「未保存」—— 草稿值与已存值确实不同，而用户什么都没动过，
			* 之后改任何字段、甚至改回原值，那个标记都不会消失。
			* 那一步挪到了 `save()` 里：保存时按解析值写，界面上看到的仍然等于会存进去的。
			*/
			const pairProvider = providerDesc === void 0 ? "" : draftText(providerDesc);
			const pairModels = directory.status === "ready" ? directory.routes.find((route) => route.provider === pairProvider)?.models ?? [] : void 0;
			const pairModel = modelDesc === void 0 ? "" : draftText(modelDesc);
			const pairModelResolved = pairModels === void 0 || pairModel !== "" ? pairModel : pairModels[0]?.id ?? "";
			/** 厂家已选、这家没有任何模型、而且手上也没有存过的值：无从选起，保存也过不去。 */
			const pairBlocked = pairModels !== void 0 && pairProvider !== "" && pairModels.length === 0 && pairModel === "";
			/**
			* 是否「自定义」过（界面上那个标签）。
			*
			* 与官方「键存在即覆盖」不同：用户要的是「和默认值一样就当没改过」，
			* 所以这里额外比一次默认值 —— 一个恰好等于默认值的取值不算覆盖。
			*/
			const isOverridden = (desc) => {
				const draft = drafts[desc.field];
				if (draft !== void 0) {
					const write = desc.spec.parse(draft);
					if (write === void 0 || write.kind === "clear") return false;
					return !sameValue(write.value, defaultOf(desc.field));
				}
				if (!hasKey(user, desc.field)) return false;
				return !sameValue(user[desc.field], defaultOf(desc.field));
			};
			const isInvalid = (desc) => {
				const draft = drafts[desc.field];
				return draft !== void 0 && desc.spec.parse(draft) === void 0;
			};
			/**
			* 这个字段的草稿和**已经保存的值**不一样吗？
			*
			* 注意判据不是「动过输入框」，而是「值变了」：把 80 改成 90 再改回 80，
			* 不该继续挂着「未保存」。
			*/
			const draftDiffers = (desc) => {
				const draft = drafts[desc.field];
				if (draft === void 0) return false;
				const write = desc.spec.parse(draft);
				if (write === void 0) return true;
				return !sameValue(write.kind === "clear" ? void 0 : write.value, section[desc.field]);
			};
			/** 与已存值不同的项。只可能是用户自己编辑过的字段 —— 不会再被自动补的值污染。 */
			const differing = FIELDS.filter(draftDiffers);
			const dirty = differing.length > 0;
			const invalid = FIELDS.some(isInvalid) || pairBlocked;
			const stage = (field, text) => {
				setFailed(false);
				setDrafts((previous) => ({
					...previous,
					[field]: text
				}));
			};
			const stageMany = (patch) => {
				setFailed(false);
				setDrafts((previous) => ({
					...previous,
					...patch
				}));
			};
			/** 「恢复默认」：把框里填回默认值，而不是留空。 */
			const restoreDefault = (desc) => {
				stage(desc.field, desc.spec.format(defaultOf(desc.field)));
			};
			const save = async () => {
				setBusy(true);
				setFailed(false);
				try {
					for (const desc of FIELDS) {
						if (desc.field === "provider" || desc.field === "model") continue;
						const draft = drafts[desc.field];
						if (draft === void 0) continue;
						const write = desc.spec.parse(draft);
						if (write === void 0) continue;
						const value = write.kind === "clear" ? void 0 : write.value;
						if (value === void 0 || sameValue(value, defaultOf(desc.field))) await scope.unset(desc.field);
						else await scope.set(desc.field, value);
					}
					const pairWrites = [["provider", pairProvider === "" ? void 0 : pairProvider], ["model", pairProvider === "" || pairModelResolved === "" ? void 0 : pairModelResolved]];
					for (const [field, value] of pairWrites) if (value === void 0 || sameValue(value, defaultOf(field))) await scope.unset(field);
					else await scope.set(field, value);
					setDrafts({});
					setExpanded(false);
				} catch {
					setFailed(true);
				} finally {
					setBusy(false);
				}
			};
			/** 普通字段的控件：一个整宽的输入框。 */
			const renderControl = (desc) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
				className: isInvalid(desc) ? "stp-input stp-inputInvalid" : "stp-input",
				value: draftText(desc),
				disabled: !writable,
				onChange: (event) => stage(desc.field, event.target.value)
			});
			/**
			* 供应商 + 模型：**一行两个下拉**，不再拆成两个字段。
			*
			* 为什么合并：这本来就是一件事（先挑哪家的、再挑哪个模型），拆成两行时每行都要一套
			* 「标签 + 自定义 + 恢复默认 + 说明」，读起来非常啰嗦。两个框的内容本身就能说明各自
			* 是干什么的（一边是厂家名、一边是模型名），所以也不再各配一个标签 —— 左边第一个
			* 选项是「跟随对话模型」，右边是该厂家下的具体模型 —— **必须选一个、不给留空**，
			* 选中厂家后自动落到第一个，换厂家时同样自动落到新家的第一个。
			*
			* 目录可用时是**只能选**的下拉：手写 provider / model 几乎总是拼错，而拼错的结果是
			* 运行时调用失败，不如从根上不让输。目录读不到才退回两个文本输入。
			*/
			const renderModelPair = (providerDesc, modelDesc) => {
				const disabled = !writable;
				const routes = directory.status === "ready" ? directory.routes : void 0;
				const provider = pairProvider;
				const model = pairModelResolved;
				const models = pairModels ?? [];
				const providerKnown = routes?.some((route) => route.provider === provider) ?? true;
				const modelKnown = models.some((entry) => entry.id === model);
				const following = provider === "";
				const overridden = isOverridden(providerDesc) || isOverridden(modelDesc);
				/** 两个框是一次选择的两个部分，「恢复默认」自然要一起清。 */
				const restore = () => {
					restoreDefault(providerDesc);
					restoreDefault(modelDesc);
				};
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "stp-field",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "stp-head",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "stp-label",
								children: providerDesc.label
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "stp-badges",
								children: [overridden ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "stp-overridden",
									children: "自定义"
								}) : null, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "stp-reset",
									disabled: !writable || !overridden,
									onClick: restore,
									children: "恢复默认"
								})]
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "stp-pair",
							children: routes === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								className: "stp-input",
								value: provider,
								disabled,
								placeholder: "供应商，如 deepseek",
								onChange: (event) => {
									stageMany({
										provider: event.target.value,
										model: ""
									});
								}
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								className: "stp-input",
								value: model,
								disabled,
								placeholder: "模型 id，留空用厂家默认",
								onChange: (event) => stage(modelDesc.field, event.target.value)
							})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
								className: "stp-input",
								value: provider,
								disabled,
								"aria-label": "用哪家的模型总结标题",
								onChange: (event) => {
									const next = event.target.value;
									const first = routes.find((route) => route.provider === next)?.models[0]?.id ?? "";
									stageMany({
										provider: next,
										model: first
									});
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "",
										children: "跟随对话模型"
									}),
									routes.map((route) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: route.provider,
										children: route.displayName
									}, route.provider)),
									provider !== "" && !providerKnown ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: provider,
										children: `${provider}（不在已配置列表）`
									}) : null
								]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
								className: "stp-input",
								value: model,
								disabled: disabled || following || models.length === 0,
								"aria-label": "用哪个模型总结标题",
								onChange: (event) => stage(modelDesc.field, event.target.value),
								children: [
									models.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", { value: "" }) : null,
									models.map((entry) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: entry.id,
										children: entry.name ?? entry.id
									}, entry.id)),
									model !== "" && !modelKnown ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: model,
										children: `${model}（不在已配置列表）`
									}) : null
								]
							})] })
						}),
						directory.status === "unavailable" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "stp-hint",
							children: `未能读取已配置的模型列表（${directory.reason}），这两个框已退回手动输入`
						}) : null,
						directory.status === "ready" && !directory.credentialsChecked ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "stp-hint",
							children: "未能读取凭据状态，列表只按设置文档判断，可能多列出没配好的供应商"
						}) : null,
						pairBlocked ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "stp-invalid",
							children: "这家下面没有可选模型，请换一家，或先到「模型」设置里给它配上模型"
						}) : null
					]
				}, providerDesc.field);
			};
			/** 开关字段：标题与说明在左，开关在右（对齐官方 MCP / Subagent 卡片的开关行）。 */
			const renderToggle = (desc, notice) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "stp-field",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "stp-toggleRow",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "stp-toggleLabel",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "stp-toggleTitle",
								children: desc.label
							}), desc.hint === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "stp-hint",
								children: desc.hint
							})]
						}),
						isOverridden(desc) ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "stp-overridden",
							children: "自定义"
						}) : null,
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Switch, {
							checked: draftText(desc) !== "rules",
							disabled: !writable,
							label: desc.label,
							onChange: (next) => stage(desc.field, next ? "llm" : "rules")
						})
					]
				}), notice === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: "stp-hint",
					children: notice
				})]
			}, desc.field);
			const renderField = (desc) => {
				const overridden = isOverridden(desc);
				const fieldInvalid = isInvalid(desc);
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "stp-field",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "stp-head",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "stp-label",
								children: desc.label
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "stp-badges",
								children: [overridden ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "stp-overridden",
									children: "自定义"
								}) : null, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "stp-reset",
									disabled: !writable || !overridden,
									onClick: () => restoreDefault(desc),
									children: "恢复默认"
								})]
							})]
						}),
						renderControl(desc),
						desc.hint === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "stp-hint",
							children: desc.hint
						}),
						fieldInvalid ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "stp-invalid",
							children: "这里需要一个整数"
						}) : null
					]
				}, desc.field);
			};
			if (!ready) return null;
			const modeDesc = FIELDS.find((desc) => desc.field === "mode");
			const modelMode = modeDesc === void 0 || draftText(modeDesc) !== "rules";
			const visibleFields = FIELDS.filter((desc) => (desc.modelOnly !== true || modelMode) && desc.field !== "model");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
				className: expanded ? "stp-card stp-cardOpen" : "stp-card",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "stp-header",
					"aria-expanded": expanded,
					onClick: () => setExpanded((value) => !value),
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "stp-headText",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "stp-name",
								children: "会话标题（session-title-pattern）"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "stp-description",
								children: "用模型总结会话标题的类型与主题，也可以退回关键词规则。"
							})]
						}),
						dirty ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "stp-pending",
							title: `未保存：${differing.map((desc) => desc.label).join("、")}`,
							children: "未保存"
						}) : null,
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: expanded ? "stp-chevron stp-chevronOpen" : "stp-chevron",
							children: ChevronIcon
						})
					]
				}), expanded ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "stp-body",
					children: [
						modeDesc === void 0 ? null : renderToggle(modeDesc, modelMode ? void 0 : "已改用关键词规则：类型按关键词匹配得出、主题取首条消息原文，标题不会随对话更新。下面的标题格式与长度上限仍然有效。"),
						visibleFields.filter((desc) => desc.field !== "mode").map((desc) => desc.field === "provider" && modelDesc !== void 0 ? renderModelPair(desc, modelDesc) : renderField(desc)),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "stp-footer",
							children: [
								failed ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: "stp-failed",
									children: "保存未落地，Host 拒绝了这次写入（草稿已保留，可修改后重试）"
								}) : null,
								snapshot.writable ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: "stp-failed",
									children: "当前连接为进程内模式，配置不会写入 Host 文档"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "stp-discard",
									disabled: busy || !dirty,
									onClick: () => {
										setFailed(false);
										setDrafts({});
									},
									children: "放弃修改"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "stp-save",
									disabled: !writable || !dirty || invalid,
									onClick: () => void save(),
									children: "保存"
								})
							]
						})
					]
				}) : null]
			});
		}
		//#endregion
		//#region src/client/settings-css.ts
		/**
		* 设置卡片的样式。
		*
		* 逐条照抄官方 `@deepseek-ai/dsh-client-ui-settings-plugins` 里
		* `PluginCard.module.css` 与 `fields.module.css` 的规则（含卡片收起/展开的底色、
		* 字段的上下布局、保存/放弃按钮），只把类名前缀换成我们自己的 `stp-`。
		*
		* 为什么不直接借官方那几个 hash 类名（`YyYd_a_card` 之类）：它们由上游构建时生成，
		* 上游一改版就会**静默失效**，那时卡片会变成没有任何样式的裸 DOM。
		* 抄规则则只依赖 CSS 变量，而变量是稳定的公开契约。
		*/
		const SETTINGS_STYLE_ID = "dsh-session-title-pattern-settings-css";
		const SETTINGS_CSS = `
/* ---- 卡片壳：收起是灰底，展开切深底（官方 .card / .cardOpen） ---- */
.stp-card{border:.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-3);border-radius:16px;list-style:none;transition:border-color .16s,background .16s}
.stp-card:hover{border-color:var(--dsw-alias-label-dimmed)}
.stp-cardOpen{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}
/* 末尾字段不要顶到页脚的分隔线上。首行**不做**特殊处理：曾经把首行压到 4px，
   结果它和其余各行的间距不一致，看起来像漏了 padding。 */
.stp-body>.stp-field:last-of-type{padding-bottom:4px}
.stp-header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}
.stp-header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
.stp-headText{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}
.stp-name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}
.stp-description{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}
.stp-chevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s;display:inline-flex}
.stp-chevronOpen{transform:rotate(180deg)}
.stp-pending{flex:none;font-size:12px;line-height:18px;padding:0 6px;border-radius:6px;color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-interactive-bg-hover)}
/* ---- body 在卡片内部，只隔一条细线（官方 .body） ---- */
.stp-body{border-top:.5px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}
/* ---- 一个字段：标签在上、控件整宽在下、hint 再下一行（官方 .field） ---- */
.stp-field{flex-direction:column;gap:6px;padding:12px 0;display:flex}
.stp-field+.stp-field{border-top:.5px solid var(--dsw-alias-border-l2)}
/* 一行里并排两个下拉（供应商 + 模型），等宽平分 */
.stp-pair{display:flex;gap:8px}
.stp-pair>*{flex:1;min-width:0}
.stp-head{align-items:center;gap:8px;display:flex}
.stp-label{min-width:0;color:var(--dsw-alias-label-primary);flex:1;font-size:13px;font-weight:500;line-height:1.5}
.stp-badges{align-items:center;gap:8px;display:inline-flex}
.stp-overridden{font-size:12px;line-height:1.5;color:var(--dsw-alias-state-business-primary)}
.stp-reset{font:inherit;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;padding:0;font-size:12px;line-height:1.5}
.stp-reset:hover:not(:disabled){color:var(--dsw-alias-label-primary)}
.stp-reset:disabled{cursor:default;opacity:.5}
.stp-input{box-sizing:border-box;width:100%;border:.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5;appearance:none}
.stp-input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
.stp-input:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}
.stp-inputInvalid{border-color:var(--dsw-alias-label-error)}
.stp-invalid{color:var(--dsw-alias-label-error);margin:0;font-size:12px;line-height:1.5}
.stp-hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}
/* ---- 开关行：标题与说明在左，开关在右（照抄官方 SubagentModelSelectionCard 的 .toggleRow） ---- */
.stp-toggleRow{color:var(--dsw-alias-label-primary);justify-content:space-between;align-items:center;gap:16px;font-size:13px;line-height:1.5;display:flex}
.stp-toggleLabel{flex:1;min-width:0;flex-direction:column;gap:2px;display:flex}
.stp-toggleTitle{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.5}
/* ---- 底部：右对齐的保存/放弃（官方 .footer / .save / .discard） ---- */
.stp-footer{border-top:.5px solid var(--dsw-alias-border-l2);justify-content:flex-end;align-items:center;gap:8px;padding:12px 0 4px;display:flex}
.stp-failed{min-width:0;color:var(--dsw-alias-label-error);flex:1;margin:0;font-size:12px;line-height:1.5}
.stp-discard,.stp-save{appearance:none;font:inherit;cursor:pointer;border:1px solid #0000;border-radius:8px;padding:5px 14px;font-size:13px;line-height:1.5}
.stp-discard{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:0 0}
.stp-discard:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}
.stp-save{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3)}
.stp-discard:disabled,.stp-save:disabled{opacity:.4;cursor:default}
.stp-discard:focus-visible,.stp-save:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
`;
		//#endregion
		//#region src/client/index.tsx
		const name = "dsh-session-title-pattern";
		/**
		* 会话头部的动作区。cardinality 为 list，注册新 id 即增量追加，不会覆盖内置项。
		*
		* 位置依据：上游的头部结构是 `titleCluster > (crumbs, headerActions)`，
		* 即这一组**紧贴标题之后**，截图里那个「标准模式」指示器就是本槽位的占用者。
		*
		* 注意：这里**不会**影响标题宽度。标题宽度由上游 `.crumb` 的 `max-width` 决定
		* （已由 installCrumbWidth() 放宽），只要可用宽度够，头部控件宽窄就与标题无关。
		*/
		const SLOT = "conversation.session.header.actions";
		/**
		* 同区内按 order 升序排列（越小越靠左）。
		*
		* 取一个足够小的负数，保证排在所有占用者之前 —— 即**标题右边第一个**，
		* 内置的「标准模式」落在我们右侧；其他插件后挂的条目同样排在我们右边。
		*/
		const ACTION_ORDER = -1e3;
		/** 本菜单项在列表中的地址，必须全局唯一。 */
		const ENTRY_ID = "generate-title";
		/**
		* 下面四条是**完整的命令行**，必须带前导斜杠。
		*
		* host 端 `CommandRuntime.execute()` 用 `parseCommand()` 解析，正则要求
		* `^\/[a-z][a-z0-9_-]*`：不带斜杠时它直接返回 undefined，而且属于
		* "admission miss"（语法不合规），**连日志都不记** —— 表现就是按钮点了没反应、
		* 控制台一片安静（v0.6.0 起四个按钮全废，根因就在这里）。
		*/
		/** 手动改名命令（host 端注册）：写入「用户」来源的标题，写入即进入锁定态。 */
		const RENAME_LINE = "/title-rename";
		/** 锁定命令：把当前标题以「用户」来源写回，停止自动更新。 */
		const LOCK_LINE = "/title-lock";
		/** 解锁命令：恢复自动更新。标题内容不变，不触发重新生成。 */
		const UNLOCK_LINE = "/title-unlock";
		/** 草稿命令：按当前对话真算一版标题，只返回文本、不写入，给「自动生成」按钮用。 */
		const SUGGEST_LINE = "/title-suggest";
		/** 状态查询命令：问 host「当前标题锁没锁」，回答是 `locked` / `unlocked`。 */
		const STATE_LINE = "/title-state";
		/**
		* 本面板依赖的全部命令（不含斜杠），打开时用来自检。
		*
		* 「点了没反应」最费时间的一处就是猜命令到底注册上没有，直接把缺哪条打出来。
		*/
		const REQUIRED_COMMANDS = [
			RENAME_LINE,
			LOCK_LINE,
			UNLOCK_LINE,
			SUGGEST_LINE,
			STATE_LINE
		].map((line) => line.slice(1));
		/** 浏览器控制台前缀，便于排查。 */
		const LOG = "[dsh-session-title-pattern]";
		/** 注入的样式元素 id。带 id 是为了判重，保证重复激活不会叠加规则。 */
		const CRUMB_STYLE_ID = "dsh-session-title-pattern-crumb-width";
		/**
		* 当前会话标题（面包屑最后一段）的宽度上限。
		*
		* 上游 `.crumb` 把宽度写死成 `max-width:220px`，减掉左右内边距 16px 只剩 204px；
		* 我们的标题前缀「日期｜类型」就吃掉约 94px，留给主题的只有约 110px ——
		* 14px 字号下即七八个中文字，这就是「窗口很大标题却很短」的原因。
		*
		* 这里按标题上限 80 字节（约 40 个中文，约 560px）留足余量，再用 60vw 兜住窄窗口。
		*/
		const CRUMB_MAX_WIDTH = "min(640px, 60vw)";
		/**
		* 锁定开关的悬浮提示。
		*
		* 把两边的行为都讲清楚：锁定 = 不再自动更新；解锁 = 恢复自动更新但**不动当前文字**
		* —— 这是刻意的：用户要求「解锁只是改状态，不要立刻重新生成」。
		*/
		const LOCK_HINT = "锁定后，标题不会随对话轮数自动更新；解除锁定即恢复自动更新（标题文字保持不变）";
		function GenerateTitleAction({ useSession, useProjection, suggest, rename, lock, unlock, readState, checkCommands }) {
			const running = useSession((snapshot) => snapshot.running);
			const currentTitle = typeof useProjection === "function" ? useProjection("title") : void 0;
			const [open, setOpen] = (0, react.useState)(false);
			const [draft, setDraft] = (0, react.useState)("");
			/** 「自动生成」请求在途：期间按钮显示生成中并禁用，防止连点并发调模型。 */
			const [busy, setBusy] = (0, react.useState)(false);
			const [locked, setLocked] = (0, react.useState)(false);
			const wrapRef = (0, react.useRef)(null);
			/**
			* 卡片左缘相对锚点的横向偏移：对齐**会话标题的左缘**，而不是右缘贴着铅笔按钮
			* —— 贴右会让卡片向左伸过标题、左半截压进侧边栏底下（实机反馈）。
			* 标题元素用 `_crumbCurrent` 定位（与 crumbWidth 覆盖同一个识别方式）；
			* 找不到就退回 0（贴着铅笔右对齐的旧定位），宁歪勿丢。
			*/
			const [panelLeft, setPanelLeft] = (0, react.useState)(null);
			const close = () => setOpen(false);
			(0, react.useEffect)(() => {
				if (!open) return;
				const anchor = wrapRef.current;
				if (anchor === null) return;
				const crumb = document.querySelector("[class*=\"_crumbCurrent\"]");
				if (crumb !== null) setPanelLeft(crumb.getBoundingClientRect().left - anchor.getBoundingClientRect().left);
				else setPanelLeft(null);
				const onDown = (event) => {
					if (wrapRef.current !== null && !wrapRef.current.contains(event.target)) setOpen(false);
				};
				document.addEventListener("mousedown", onDown);
				return () => document.removeEventListener("mousedown", onDown);
			}, [open]);
			const openPanel = () => {
				setDraft(typeof currentTitle === "string" ? currentTitle : "");
				setOpen(true);
				readState().then((text) => {
					if (typeof text !== "string") return;
					setLocked(text.trim() === "locked");
				});
				checkCommands();
			};
			/**
			* 自动生成：host 真算一版草稿（按当前模式走 LLM 或规则），**只填进输入框**，
			* 保存与否由用户点「确定保存」决定 —— 这是面板与直接 /retitle 的核心区别。
			*/
			const generateDraft = () => {
				setBusy(true);
				suggest().then((text) => {
					setBusy(false);
					if (typeof text === "string" && text.length > 0) setDraft(text);
				});
			};
			const save = () => {
				const text = draft.trim();
				if (text.length === 0 || busy) return;
				rename(text);
				setLocked(true);
				close();
			};
			const toggleLock = () => {
				if (locked) {
					unlock();
					setLocked(false);
				} else {
					lock();
					setLocked(true);
				}
			};
			const inputStyle = {
				boxSizing: "border-box",
				width: "100%",
				height: 34,
				font: "inherit",
				color: "var(--dsw-alias-label-primary)",
				background: "var(--dsw-alias-bg-layer-3)",
				border: ".5px solid var(--dsw-alias-border-l4)",
				borderRadius: 8,
				padding: "0 10px",
				fontSize: 13
			};
			const ghostButton = (disabled) => ({
				appearance: "none",
				font: "inherit",
				cursor: disabled ? "default" : "pointer",
				background: "transparent",
				border: ".5px solid var(--dsw-alias-border-l4)",
				borderRadius: 8,
				padding: "0 12px",
				height: 30,
				fontSize: 13,
				color: "var(--dsw-alias-label-primary)",
				opacity: disabled ? .4 : 1
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				ref: wrapRef,
				style: {
					position: "relative",
					display: "inline-flex"
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
					label: "重命名会话",
					side: "bottom",
					delayMs: 500,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: { display: "inline-flex" },
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "ghost",
							size: "sm",
							icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutline16, { size: 16 }),
							disabled: running,
							onClick: () => open ? close() : openPanel(),
							title: running ? "会话回复中，暂不能重命名" : void 0,
							"aria-label": "重命名会话"
						})
					})
				}), open ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: {
						position: "absolute",
						top: "calc(100% + 6px)",
						left: panelLeft ?? 0,
						zIndex: 30,
						width: 420,
						maxWidth: "calc(100vw - 48px)",
						padding: 12,
						display: "flex",
						flexDirection: "column",
						gap: 10,
						background: "var(--dsw-alias-bg-layer-2)",
						border: ".5px solid var(--dsw-alias-border-l4)",
						borderRadius: 12,
						boxShadow: "0 8px 24px rgb(0 0 0 / 18%)"
					},
					onKeyDown: (event) => {
						if (event.key === "Escape") close();
					},
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between"
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: {
									fontSize: 14,
									fontWeight: 600,
									color: "var(--dsw-alias-label-primary)"
								},
								children: "重命名会话"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: close,
								"aria-label": "关闭",
								style: {
									appearance: "none",
									font: "inherit",
									cursor: "pointer",
									lineHeight: 1,
									background: "transparent",
									border: "none",
									fontSize: 16,
									color: "var(--dsw-alias-label-secondary)",
									padding: 2
								},
								children: "×"
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							value: draft,
							placeholder: "输入新的会话标题",
							onChange: (event) => setDraft(event.target.value),
							onKeyDown: (event) => {
								if (event.key === "Enter") save();
							},
							style: inputStyle
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between"
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
								label: LOCK_HINT,
								side: "top",
								delayMs: 400,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									style: {
										display: "inline-flex",
										alignItems: "center",
										gap: 6
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Switch, {
										checked: locked,
										label: "锁定标题",
										onChange: () => toggleLock()
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: {
											fontSize: 12,
											color: "var(--dsw-alias-label-secondary)"
										},
										children: "锁定"
									})]
								})
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									gap: 6
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: close,
										style: ghostButton(false),
										children: "取消"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										disabled: busy || running,
										onClick: generateDraft,
										style: ghostButton(busy || running),
										children: busy ? "生成中…" : "自动生成"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										disabled: busy || draft.trim() === "",
										onClick: save,
										style: {
											appearance: "none",
											font: "inherit",
											cursor: draft.trim() === "" || busy ? "default" : "pointer",
											border: "1px solid #0000",
											borderRadius: 8,
											padding: "0 12px",
											height: 30,
											fontSize: 13,
											background: "var(--dsw-alias-label-primary)",
											color: "var(--dsw-alias-bg-layer-3)",
											opacity: draft.trim() === "" || busy ? .4 : 1
										},
										children: "确定保存"
									})
								]
							})]
						})
					]
				}) : null]
			});
		}
		/**
		* 放宽当前会话标题的宽度上限。
		*
		* 为什么只能用 CSS 覆盖：会话标题是头部面包屑的最后一段，上游对它只有
		* `.crumb{max-width:220px}` 这一条宽度约束，而且没有任何槽位能改写它 ——
		* `conversation.session.header.lineage` 的契约是「面包屑标题的可选渲染器」，
		* 但**当前会话的 title 元素由上游无条件原生渲染**，槽位只能作为它后面的兄弟节点。
		*
		* 为什么必须 `!important`：属性选择器与上游 `.wSkVaW_crumb` 特异性相同（都是 0,1,0），
		* 平局按源码顺序决胜，而我们的注入顺序无法保证。
		*
		* 为什么只匹配 `_crumbCurrent`：它只命中最后一个面包屑，即当前会话标题；
		* 祖先会话与子代理的面包屑（只有 `_crumb`）保持 220px，不挤占同一行空间。
		* 宽度不足时也不会溢出 —— `.crumb` 自带 `overflow:hidden`，flex 项的
		* `min-width:auto` 因此解析为 0，会自动收缩并省略。
		*
		* 失效模式：选择器依赖 CSS Modules 生成的局部类名后缀 `_crumbCurrent`。
		* 上游若重命名该类名，本规则会**静默失效**（不报错、不崩溃，只是标题又变短）。
		* 排查方法：DevTools 选中标题元素，看它 class 属性里是否还有 `_crumbCurrent`。
		*/
		/** 按 id 幂等地往页面注入一段样式。重复激活不会叠加。 */
		function injectStyle(id, css) {
			if (typeof document === "undefined") return;
			if (document.getElementById(id) !== null) return;
			const style = document.createElement("style");
			style.id = id;
			style.textContent = css;
			document.head.append(style);
		}
		function removeStyle(id) {
			if (typeof document === "undefined") return;
			document.getElementById(id)?.remove();
		}
		function installCrumbWidth() {
			injectStyle(CRUMB_STYLE_ID, `[class*="_crumbCurrent"]{max-width:${CRUMB_MAX_WIDTH} !important;}`);
		}
		function apply(ctx) {
			ctx.effect(() => {
				installCrumbWidth();
				injectStyle(SETTINGS_STYLE_ID, SETTINGS_CSS);
				return () => {
					removeStyle(CRUMB_STYLE_ID);
					removeStyle(SETTINGS_STYLE_ID);
				};
			});
			let commands;
			ctx.inject(["remote", "remote.commands"], (sub) => {
				commands = sub.remote.commands;
			});
			/**
			* 从远端回答里取出 `CommandResult`。
			*
			* 远端通道**实际**返回什么，本地验证不了：消费 `TYPERT_REMOTE` 的运行时在 dsh
			* 里，不在 node_modules。而实测出现过「host 明明执行了（标题改了 / 会话里出了
			* 命令结果），客户端却拿到一个读不出 `result` 的东西」—— 于是草稿填不进输入框、
			* 锁定态也读不回来。
			*
			* 所以这里按可能的封装逐层剥，认出 `kind` 就算成功：
			*   `{ commandId, result }`  —— 描述符声明的形状
			*   `{ kind, text }`         —— 直接就是 CommandResult
			*   `{ ok, value }` / `{ value }` —— 传输层再包一层
			* 认不出就把原始结构打进控制台，下次不必再猜。
			*/
			const readCommandResult = (raw) => {
				let node = raw;
				for (let depth = 0; depth < 3; depth += 1) {
					if (node === null || typeof node !== "object") return void 0;
					const record = node;
					if (typeof record.kind === "string") return {
						kind: record.kind,
						text: typeof record.text === "string" ? record.text : void 0
					};
					const next = record.result ?? record.value;
					if (next === void 0) return void 0;
					node = next;
				}
			};
			/** 把任意值打成可读的一段，用于「认不出形状」时把真相打出来。 */
			const describe = (raw) => {
				try {
					return JSON.stringify(raw) ?? String(raw);
				} catch {
					return String(raw);
				}
			};
			/**
			* 面板与按钮的所有动作都收敛到这一条：往会话发命令行。
			*
			* 命令成功时把结果文本 resolve 回去（「自动生成」靠它拿草稿标题、
			* 「锁定态」靠它拿 locked/unlocked）；失败记控制台并 resolve undefined ——
			* 界面保持原状，host 侧留有日志。
			*/
			const runLine = (sessionId, line) => {
				if (commands === void 0) {
					console.warn(`${LOG} remote.commands 尚未就绪，无法执行 ${line}`);
					return Promise.resolve(void 0);
				}
				return commands.execute(sessionId, line, []).then((execution) => {
					const result = readCommandResult(execution);
					if (result === void 0) {
						console.warn(`${LOG} ${line} 未取到执行结果（原始返回：${describe(execution)}）`);
						return;
					}
					if (result.kind === "error") {
						console.warn(`${LOG} ${line} 失败：${result.text ?? "（无详情）"}`);
						return;
					}
					return result.text;
				}).catch((error) => {
					console.warn(`${LOG} ${line} 调用失败：${String(error)}`);
				});
			};
			/**
			* 自检：本面板依赖的命令是否都在 host 注册了。
			*
			* `execute()` 对「命令没注册」只回一个 undefined、不留任何痕，表现就是点了没反应。
			* 打开面板时列一次命令表，缺哪条直接写进控制台 —— 不用再靠猜。
			*/
			const checkCommands = (sessionId) => {
				if (commands === void 0) return;
				commands.list(sessionId).then((raw) => {
					const node = raw ?? null;
					const entries = Array.isArray(raw) ? raw : Array.isArray(node?.value) ? node?.value : void 0;
					if (entries === void 0) {
						console.warn(`${LOG} 未能读取命令列表（原始返回：${describe(raw)}）`);
						return;
					}
					const known = new Set(entries.map((entry) => typeof entry?.name === "string" ? entry.name : ""));
					const missing = REQUIRED_COMMANDS.filter((name) => !known.has(name));
					if (missing.length > 0) console.warn(`${LOG} 命令未注册（点了会没反应）：${missing.join("、")}`);
				}).catch(() => void 0);
			};
			ctx.inject(["slots"], (sub) => {
				sub.slots.inject(SLOT, () => sub.slots.register({
					name: SLOT,
					id: ENTRY_ID,
					order: ACTION_ORDER,
					inject: (sessionId) => ({
						suggest: () => runLine(sessionId, SUGGEST_LINE),
						rename: (title) => void runLine(sessionId, `${RENAME_LINE} ${title}`),
						lock: () => void runLine(sessionId, LOCK_LINE),
						unlock: () => void runLine(sessionId, UNLOCK_LINE),
						readState: () => runLine(sessionId, STATE_LINE),
						checkCommands: () => checkCommands(sessionId)
					})
				}, GenerateTitleAction));
				console.info(`${LOG} 已注册重命名面板到 ${SLOT}`);
			});
			let llmDirectory;
			ctx.inject(["remote", "remote.llm"], (sub) => {
				llmDirectory = sub.remote.llm;
			});
			let credentialsFace;
			ctx.inject(["remote", "remote.credentials"], (sub) => {
				credentialsFace = sub.remote.credentials;
			});
			ctx.inject(["slots", "settingsScope"], (sub) => {
				const scope = sub.settingsScope.bind({ namespace: SETTINGS_NS });
				const describe = sub.settingsScope.describe();
				sub.slots.inject("settings.plugin.item", () => sub.slots.register({
					name: "settings.plugin.item",
					key: SETTINGS_NS,
					inject: () => ({
						scope,
						describe,
						getLlm: () => llmDirectory,
						getCredentials: () => credentialsFace
					})
				}, SettingsCard));
				console.info(`${LOG} 已注册设置卡片到 settings.plugin.item（${SETTINGS_NS}）`);
			});
		}
		//#endregion
		exports.apply = apply;
		exports.name = name;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map