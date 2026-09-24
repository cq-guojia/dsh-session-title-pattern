window.__ModuleLoader__.load({
	id: "dsh-session-title-pattern",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		_deepseek_ai_dsh_client_ui_primitives = __toESM(_deepseek_ai_dsh_client_ui_primitives, 1);
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/model-pair.tsx
		/**
		* 「标题总结大模型」：供应商 + 模型一行两个下拉（实机反馈恢复 v0.7.x 的选择器）。
		*
		* ## 为什么控件是自绘的
		*
		* 官方 settings-form 体系只有文本 / 数字 / 密钥三种字段控件，没有下拉 —— v0.8.0
		* 迁到官方表单时 provider / model 因此退化成了文本框。这里用官方 `Menu` + `Button`
		* 原语组合出下拉：草稿仍经 `edit()` 写进官方 `SettingsFormModel`，状态机（暂存 /
		* 保存 / overridden / 重置）一行都不自己管，只换「产生草稿文本的输入方式」。
		*
		* ## 数据从哪来（0.1.7 仍可用，均已核实类型）
		*
		* - provider 目录：远端 `llm/listProviders`（已注册路由）+ `llm/listConfigurableProviders`
		*   （可配置目录，带 `settingsNs` / `settingsPath`）。
		* - 模型列表：各 provider 设置文档 profile 的 `models` 数组（设置镜像 face 读）。
		* - **0.1.7 的 remote 命名空间表里没有 credentials**（v0.7.6 靠它把「key 只在环境
		*   变量」的供应商也认进来），所以目录只按设置文档判定，界面上用
		*   `credentialsUnknown` 文案说明口径 —— 宁缺勿滥，与 v0.7.6 凭据域读不到时相同。
		*
		* 目录 loading / unavailable 时退回两个文本框（与 v0.7.6 相同的 fail-safe）。
		*/
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
		* 一个节点算不算「用户真的写了东西」。**空对象不算** —— 平台会给内置供应商预置
		* 一个空壳 profile，只判断「不是 undefined」会把没配置过的供应商也混进列表。
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
		/** profile 里指向凭据的引用名（`apiKeyEnv`）。仅用于说明口径，不再参与判定。 */
		function readApiKeyRef(section, path) {
			const profile = walk(section, path);
			if (profile === null || typeof profile !== "object") return void 0;
			const ref = profile.apiKeyEnv;
			return typeof ref === "string" && ref.length > 0 ? ref : void 0;
		}
		/**
		* 组装「供应商 → 已配置模型」目录，**只保留设置文档里真正写过的供应商**。
		*
		* `listProviders()` 返回适配器注册的**全部**内置供应商，直接罗列会出现一大堆
		* 用户根本没配的模型。判定口径（0.1.7 无凭据域）：该 provider 的 profile 必须
		* 在设置文档的**用户层**被写过。
		*/
		async function loadDirectory(llm, describe) {
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
				const routes = [];
				for (const [provider, address] of addresses) {
					if (!activeIds.has(provider)) continue;
					const view = address.settingsNs === void 0 ? void 0 : findView(address.settingsNs);
					if (readApiKeyRef(view?.value, address.settingsPath) !== void 0) {
						if (!isMeaningful(walk(view?.user, address.settingsPath))) continue;
					} else if (!isMeaningful(walk(view?.user, address.settingsPath))) continue;
					routes.push({
						provider,
						displayName: address.displayName,
						models: readModels(view?.value, address.settingsPath)
					});
				}
				routes.sort((left, right) => left.displayName.localeCompare(right.displayName));
				return {
					status: "ready",
					routes
				};
			} catch (error) {
				return {
					status: "unavailable",
					reason: String(error)
				};
			}
		}
		/**
		* 模型目录的 observable store（`hooks` 成员的形状要求：getSnapshot + subscribe）。
		*
		* 依赖两组服务（`remote.llm` 与设置镜像 face），就绪时序不定，所以 `load()`
		* 设计成**两阶段喂参数**：任一次调用补上自己的那份，两组齐了才真正启动一次
		* 加载（幂等）。之后组件挂载多早都只会读到 loading，加载完成自动重渲。
		*/
		var DirectoryStore = class {
			llm;
			describe;
			started = false;
			snapshot = { status: "loading" };
			listeners = /* @__PURE__ */ new Set();
			/** 当前快照（值不变时返回同一引用，满足 observable 的稳定性约定）。 */
			getSnapshot = () => this.snapshot;
			subscribe = (listener) => {
				this.listeners.add(listener);
				return () => {
					this.listeners.delete(listener);
				};
			};
			/** 喂入服务面；两组齐了就启动一次加载。重复调用幂等。 */
			load(llm, describe) {
				if (this.started) return;
				if (llm !== void 0) this.llm = llm;
				if (describe !== void 0) this.describe = describe;
				const { llm: readyLlm, describe: readyDescribe } = this;
				if (readyLlm === void 0 || readyDescribe === void 0) return;
				this.started = true;
				loadDirectory(readyLlm, readyDescribe).then((next) => {
					this.snapshot = next;
					for (const listener of this.listeners) listener();
				});
			}
		};
		/** 下拉框尾部的 chevron（内联 SVG，不赌上游图标名）。 */
		const ChevronDown = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
			width: "14",
			height: "14",
			viewBox: "0 0 16 16",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "1.5",
			strokeLinecap: "round",
			strokeLinejoin: "round",
			"aria-hidden": "true",
			style: {
				flex: "none",
				color: "var(--dsw-alias-label-tertiary)"
			},
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 6.5 8 10.5 12 6.5" })
		});
		/**
		* 供应商 + 模型：**一行两个下拉**。
		*
		* 为什么合并成一行：这本来就是一件事（先挑哪家的、再挑哪个模型），两个框的内容
		* 本身就能说明各自是干什么的，不再各配一个标签。左边第一个选项是「跟随对话模型」；
		* 选中厂家后右边自动落到该家的第一个模型（**只在选择时写草稿**，显示上从不自动
		* 补值 —— 那会让表单一打开就挂着「未保存」，v0.7.6 踩过的坑）。目录读不到才退回
		* 两个文本输入；目录可用时是**只能选**的下拉：手写 provider / model 几乎总是拼错。
		*/
		function ModelPairFields({ directory, provider, model, disabled, overridden, onEdit, onReset, t }) {
			const [openMenu, setOpenMenu] = (0, react.useState)(null);
			const routes = directory.status === "ready" ? directory.routes : void 0;
			const models = routes !== void 0 ? routes.find((route) => route.provider === provider)?.models ?? [] : [];
			const providerKnown = routes?.some((route) => route.provider === provider) ?? true;
			const following = provider === "";
			const blocked = routes !== void 0 && !following && models.length === 0 && model === "";
			const modelKnown = models.some((entry) => entry.id === model);
			const selectProvider = (id) => {
				const first = routes?.find((route) => route.provider === id)?.models[0]?.id ?? "";
				onEdit("provider", id);
				onEdit("model", id === "" ? "" : first);
			};
			const providerDisplay = provider === "" ? t("followMainModel") : routes?.find((route) => route.provider === provider)?.displayName ?? t("notInList", { id: provider });
			const modelDisplay = model === "" ? "" : models.find((entry) => entry.id === model)?.name ?? t("notInList", { id: model });
			const providerItems = [
				{
					id: "",
					label: t("followMainModel")
				},
				...(routes ?? []).map((route) => ({
					id: route.provider,
					label: route.displayName
				})),
				...providerKnown || provider === "" ? [] : [{
					id: provider,
					label: t("notInList", { id: provider })
				}]
			];
			const modelItems = [...models.map((entry) => ({
				id: entry.id,
				label: entry.name ?? entry.id
			})), ...modelKnown || model === "" ? [] : [{
				id: model,
				label: t("notInList", { id: model })
			}]];
			/** 下拉触发按钮：外观对齐文本框（同样的 34px 高度与边框），内容右侧带 chevron。 */
			const trigger = (label, aria, isOpen, onToggle, isDisabled) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "stp-combo",
				disabled: isDisabled,
				"aria-label": t(aria),
				onClick: onToggle,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "stp-comboText",
					"data-empty": label === "" ? "1" : void 0,
					children: label
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "stp-comboChevron",
					"data-open": isOpen ? "1" : void 0,
					children: ChevronDown
				})]
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "stp-pairField",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "stp-pairHead",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "stp-pairLabel",
							children: t("modelPairLabel")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "stp-badges",
							children: [overridden ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "stp-overridden",
								children: t("overridden")
							}) : null, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "stp-reset",
								disabled: disabled || !overridden,
								onClick: onReset,
								children: t("reset")
							})]
						})]
					}),
					routes === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "stp-pair",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							className: "stp-input",
							value: provider,
							disabled,
							placeholder: t("providerPlaceholder"),
							"aria-label": t("providerSelectAria"),
							onChange: (event) => {
								onEdit("provider", event.target.value);
								onEdit("model", "");
							}
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							className: "stp-input",
							value: model,
							disabled,
							placeholder: t("modelPlaceholder"),
							"aria-label": t("modelSelectAria"),
							onChange: (event) => onEdit("model", event.target.value)
						})]
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "stp-pair",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
							open: openMenu === "provider",
							anchor: trigger(providerDisplay, "providerSelectAria", openMenu === "provider", () => setOpenMenu(openMenu === "provider" ? null : "provider"), disabled),
							items: providerItems,
							selectedId: provider,
							onSelect: (id) => {
								setOpenMenu(null);
								selectProvider(id);
							},
							onClose: () => setOpenMenu(null)
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
							open: openMenu === "model",
							anchor: trigger(modelDisplay, "modelSelectAria", openMenu === "model", () => setOpenMenu(openMenu === "model" ? null : "model"), disabled || following || models.length === 0),
							items: modelItems,
							selectedId: model,
							onSelect: (id) => {
								setOpenMenu(null);
								onEdit("model", id);
							},
							onClose: () => setOpenMenu(null)
						})]
					}),
					directory.status === "loading" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "stp-hint",
						children: t("loadingDirectory")
					}) : null,
					directory.status === "unavailable" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "stp-hint",
						children: t("directoryUnavailable", { reason: directory.reason })
					}) : null,
					routes !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "stp-hint",
						children: t("credentialsUnknown")
					}) : null,
					blocked ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "stp-invalid",
						children: t("pairBlocked")
					}) : null
				]
			});
		}
		//#endregion
		//#region src/client/config-panel.tsx
		/**
		* 插件详情页的配置表单（dsh 0.1.7 的 `plugins.bundle.config` 槽位）。
		*
		* dsh 0.1.7 把插件配置入口从「对话侧边栏内嵌卡片」搬到了
		* 「主窗口左侧插件按钮 → 插件列表 → 组合包详情页」，旧的
		* `settings.plugin.item` 槽位与 `settingsScope` 服务都已删除，v0.7.x 那张
		* 300 行的自绘状态机卡片（`settings-card.tsx`）随之退役。
		*
		* ## 组成（全部复用官方件，不自带状态机）
		*
		* - **`SettingsFormModel`**（`@deepseek-ai/dsh-client-ui-primitives`）：草稿 /
		*   dirty / overridden / invalid / saving / failed 全套状态机，stage 在官方共享的
		*   `ConfigForm`（`ctx.configForms.get(ns)`）之上，save 时一次性原子提交。
		* - **`SettingsForm`**：表单框架（只读提示、保存按钮、unavailable 分支、
		*   离开页面自动 discard）。
		* - **`SettingsValueField`**：其余四个字段的控件。provider / model 由
		*   `model-pair.tsx` 渲染成一行两个下拉（官方 `Menu` 原语组合 —— 官方表单本身
		*   没有下拉控件），目录读不到时退回文本输入。
		* - 保存成功的轻提示沿用 v0.7.6 的口径：平台自带 `Toast`（`tone: 'success'`）。
		*   官方 `SettingsForm` 只有 saveFailed 文案、没有成功提示，所以 onSave 由这里
		*   包一层：`save` 动作 resolve 后按结果弹（连存两次按 seq 重启淡出周期）。
		*/
		/**
		* 详情页暴露的可编辑项。`maxOutputTokens` / `maxInputBytes` 刻意不放出来：
		* 内部预算旋钮，调整只影响成本，需要时走 `cordis.patch.yml`。
		*
		* provider / model 不在这里：它们是「标题总结大模型」一排的两个下拉
		* （见 `ModelPairFields`），目录读不到时才退回文本框。
		*/
		const FIELDS_BEFORE_PAIR = [{
			field: "retitleEvery",
			label: "retitleEveryLabel",
			hint: "retitleEveryHint",
			invalid: "invalidNumber",
			numeric: true
		}];
		const FIELDS_AFTER_PAIR = [{
			field: "template",
			label: "templateLabel",
			hint: "templateHint"
		}];
		/** 最下面一排并排的两个：标题长度上限在左、超时在右（实机反馈）。 */
		const FIELDS_BOTTOM_ROW = [{
			field: "maxBytes",
			label: "maxBytesLabel",
			hint: "maxBytesHint",
			invalid: "invalidNumber",
			numeric: true
		}, {
			field: "timeoutMs",
			label: "timeoutLabel",
			hint: "timeoutHint",
			invalid: "invalidNumber",
			numeric: true
		}];
		function ConfigPanel({ view, usePanel, useDirectory, save, edit, resetField, discard, t }) {
			const state = usePanel((s) => s);
			const directory = useDirectory((s) => s);
			const [toast, setToast] = (0, react.useState)(null);
			const toastSeq = (0, react.useRef)(0);
			if (view !== "page") return null;
			const routes = directory.status === "ready" ? directory.routes : void 0;
			const providerText = state.provider.text;
			const modelText = state.model.text;
			const handleSave = () => {
				if (routes !== void 0) {
					if (providerText === "") {
						if (modelText !== "") edit("model", "");
					} else if (modelText === "") {
						const first = routes.find((route) => route.provider === providerText)?.models[0]?.id;
						if (first !== void 0) edit("model", first);
					}
				}
				save().then((landed) => {
					if (!landed) return;
					toastSeq.current += 1;
					setToast({
						seq: toastSeq.current,
						text: t("saveSuccess")
					});
				});
			};
			const dismissToast = () => setToast(null);
			/** 渲染一个普通字段（官方 SettingsValueField）。 */
			const renderField = ({ field, label, hint, placeholder, invalid, numeric }) => {
				const value = state[field];
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.SettingsValueField, {
					id: `stp-config-${field}`,
					label: t(label),
					hint: hint === void 0 ? void 0 : t(hint),
					placeholder: placeholder === void 0 ? void 0 : t(placeholder),
					text: value.text,
					overridden: value.overridden,
					invalid: value.invalid,
					overriddenLabel: t("overridden"),
					resetLabel: t("reset"),
					invalidLabel: invalid === void 0 ? "" : t(invalid),
					disabled: !state.writable,
					onEdit: (text) => edit(field, text),
					onReset: () => resetField(field),
					numeric
				}, field);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.SettingsForm, {
				labels: {
					unavailable: t("unavailable"),
					readOnly: t("readOnly"),
					saveFailed: t("saveFailed"),
					save: t("save"),
					saving: t("saving")
				},
				state,
				onSave: handleSave,
				onDiscard: discard,
				children: [
					FIELDS_BEFORE_PAIR.map(renderField),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ModelPairFields, {
						directory,
						provider: providerText,
						model: modelText,
						disabled: !state.writable,
						overridden: state.provider.overridden || state.model.overridden,
						onEdit: edit,
						onReset: () => {
							resetField("provider");
							resetField("model");
						},
						t
					}),
					FIELDS_AFTER_PAIR.map(renderField),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "stp-pair",
						children: FIELDS_BOTTOM_ROW.map(renderField)
					})
				]
			}), toast !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Toast, {
				text: toast.text,
				tone: "success",
				onDone: dismissToast
			}, toast.seq) : null] });
		}
		//#endregion
		//#region src/client/locales.ts
		/** 词典命名空间。与设置命名空间同名，便于一眼对上。 */
		const LOCALE_NS = "session-title-pattern";
		/** 简体中文词典。 */
		const zh = {
			retitleEveryLabel: "每隔几条对话重算一次",
			retitleEveryHint: "0 = 只在新建会话时算一次，之后不自动更新（可随时点标题旁的按钮手动重算）",
			modelPairLabel: "标题总结大模型",
			followMainModel: "跟随对话模型",
			notInList: "{id}（不在已配置列表）",
			providerSelectAria: "用哪家的模型总结标题",
			modelSelectAria: "用哪个模型总结标题",
			loadingDirectory: "正在读取模型目录…",
			directoryUnavailable: "未能读取已配置的模型列表（{reason}），这两个框已退回手动输入",
			credentialsUnknown: "列表只按设置文档判断，可能多列出没配好的供应商",
			pairBlocked: "这家下面没有可选模型，请换一家，或先到「模型」设置里给它配上模型",
			providerPlaceholder: "供应商 id，如 deepseek；留空跟随对话模型",
			modelPlaceholder: "模型 id；留空用厂家默认",
			timeoutLabel: "超时",
			timeoutHint: "单次模型调用超时（毫秒）。模型慢的时候（比如免费档在排队）就往大调",
			templateLabel: "标题格式",
			templateHint: "占位符：{YYYY} {MM} {DD} {HH} {mm} {ss} {type} {topic}。日期部件可任意拼接（如 {MMDD}、{YYYYMMDD}），日期取会话创建时间；不写 {type} 就没有分类，不写 {topic} 就没有主题",
			maxBytesLabel: "标题长度上限",
			maxBytesHint: "单位字节，必须 ≤ session-title 的 maxTitleBytes（dsh-base 默认 80）",
			overridden: "自定义",
			reset: "恢复默认",
			invalidNumber: "这里需要一个整数",
			unavailable: "当前连接拿不到这份设置",
			readOnly: "当前连接为进程内模式，配置不会写入 Host 文档",
			save: "保存",
			saving: "保存中…",
			saveSuccess: "已保存",
			saveFailed: "保存未落地，Host 拒绝了这次写入（草稿已保留，可修改后重试）",
			renameTitle: "重命名会话",
			renameDisabledHint: "会话回复中，暂不能重命名",
			renamePlaceholder: "输入新的会话标题",
			lockHint: "锁定后，标题不会随对话轮数自动更新；解除锁定即恢复自动更新（标题文字保持不变）",
			lockLabel: "锁定标题",
			lockShort: "锁定",
			cancel: "取消",
			autoGenerate: "自动生成",
			generating: "生成中…",
			confirmSave: "确定保存",
			closeAria: "关闭"
		};
		/** English dictionary. */
		const en = {
			retitleEveryLabel: "Recompute every N messages",
			retitleEveryHint: "0 = compute once when the session is created and never again automatically (use the button next to the title any time to recompute manually)",
			modelPairLabel: "Model for title summaries",
			followMainModel: "Follow the conversation model",
			notInList: "{id} (not in the configured list)",
			providerSelectAria: "Which provider summarizes the title",
			modelSelectAria: "Which model summarizes the title",
			loadingDirectory: "Loading the model directory…",
			directoryUnavailable: "Could not read the configured model list ({reason}); these two fields fall back to manual input",
			credentialsUnknown: "The list is derived from the settings document alone and may include providers that are not configured",
			pairBlocked: "This provider has no selectable models; pick another provider, or add models to it in the Models settings first",
			providerPlaceholder: "Provider id, e.g. deepseek; empty follows the conversation model",
			modelPlaceholder: "Model id; empty uses the provider default",
			timeoutLabel: "Timeout",
			timeoutHint: "Timeout for one model call, in milliseconds. Raise it when the model is slow (for example while a free tier is queueing).",
			templateLabel: "Title format",
			templateHint: "Placeholders: {YYYY} {MM} {DD} {HH} {mm} {ss} {type} {topic}. Date parts can be combined freely (e.g. {MMDD}, {YYYYMMDD}) and come from the session creation time; omit {type} to drop the type, omit {topic} to drop the topic.",
			maxBytesLabel: "Title length limit",
			maxBytesHint: "In bytes; must be ≤ session-title maxTitleBytes (dsh-base default 80)",
			overridden: "Custom",
			reset: "Reset",
			invalidNumber: "An integer is required here",
			unavailable: "This connection cannot see these settings",
			readOnly: "This connection is in-process; configuration is not written to the Host document",
			save: "Save",
			saving: "Saving…",
			saveSuccess: "Saved",
			saveFailed: "Save did not land: the Host rejected this write (your draft is kept — fix it and retry)",
			renameTitle: "Rename session",
			renameDisabledHint: "The session is replying; renaming is unavailable for now",
			renamePlaceholder: "Enter the new session title",
			lockHint: "While locked the title stops updating as the conversation grows; unlocking resumes automatic updates and leaves the title text unchanged",
			lockLabel: "Lock title",
			lockShort: "Lock",
			cancel: "Cancel",
			autoGenerate: "Generate",
			generating: "Generating…",
			confirmSave: "Save",
			closeAria: "Close"
		};
		//#endregion
		//#region src/client/log.ts
		/**
		* 浏览器控制台的前缀。
		*
		* 单独放一个模块而不是各文件各写一份字面量：排查时靠 `grep` 这个前缀捞日志，
		* 一旦某处抄错一个字符，那条日志就再也捞不到了。
		*/
		const LOG = "[dsh-session-title-pattern]";
		//#endregion
		//#region src/client/style.ts
		/**
		* 样式注入的小工具。
		*
		* 原来住在 `hidden/dom.ts` 里；0.8.0 删除隐藏会话功能后，标题宽度覆盖
		* （`installCrumbWidth`）仍需要它，故独立成模块。
		*/
		/** 往 `<head>` 注入一条带 id 的 `<style>`；已存在（按 id 判重）则跳过。 */
		function injectStyle(id, css) {
			if (typeof document === "undefined") return;
			if (document.getElementById(id) !== null) return;
			const style = document.createElement("style");
			style.id = id;
			style.textContent = css;
			document.head.append(style);
		}
		/** 按 id 摘掉注入的 `<style>`；不存在时静默。 */
		function removeStyle(id) {
			if (typeof document === "undefined") return;
			document.getElementById(id)?.remove();
		}
		/** 「供应商 + 模型」一行两个下拉的样式注入 id（判重防叠加）。 */
		const PAIR_STYLE_ID = "dsh-session-title-pattern-pair-css";
		/**
		* 配置表单里「标题总结大模型」一排的样式。
		*
		* 颜色、字号、圆角全部取官方 `--dsw-*` token；控件高度 / 边框对齐
		* `SettingsValueField` 的文本框（34px / 8px 圆角 / l4 边框），排在一列里不突兀。
		*/
		const PAIR_CSS = `
.stp-pairField{display:flex;flex-direction:column;gap:6px;padding:12px 0}
.stp-pairHead{display:flex;align-items:center;gap:8px}
.stp-pairLabel{flex:1;min-width:0;font-size:13px;font-weight:500;line-height:1.5;color:var(--dsw-alias-label-primary)}
.stp-badges{display:inline-flex;align-items:center;gap:8px}
.stp-overridden{font-size:12px;line-height:1.5;color:var(--dsw-alias-state-business-primary)}
.stp-reset{font:inherit;font-size:12px;line-height:1.5;padding:0;border:none;background:none;color:var(--dsw-alias-label-secondary);cursor:pointer}
.stp-reset:hover:not(:disabled){color:var(--dsw-alias-label-primary)}
.stp-reset:disabled{cursor:default;opacity:.5}
.stp-pair{display:flex;gap:8px}
.stp-pair>*{flex:1;min-width:0}
.stp-combo{box-sizing:border-box;width:100%;height:34px;border:.5px solid var(--dsw-alias-border-l4);border-radius:8px;background:var(--dsw-alias-bg-layer-3);font:inherit;font-size:13px;line-height:1.5;color:var(--dsw-alias-label-primary);padding:0 10px;display:inline-flex;align-items:center;justify-content:space-between;gap:6px;cursor:pointer}
.stp-combo:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
.stp-combo:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}
.stp-comboText{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.stp-comboText[data-empty="1"]{color:var(--dsw-alias-label-tertiary)}
.stp-comboChevron{display:inline-flex;transition:transform .15s ease}
.stp-comboChevron[data-open="1"]{transform:rotate(180deg)}
.stp-input{box-sizing:border-box;width:100%;border:.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5;appearance:none}
.stp-input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
.stp-input:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}
.stp-hint{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}
.stp-invalid{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-error)}
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
		* 插件详情页配置槽位（dsh 0.1.7）。keyed 槽位，key 必须与包名逐字相同 ——
		* 插件管理页用 `ledger.bundles.has(pkg.name)` 判断要不要在详情页渲染配置区。
		*/
		const BUNDLE_CONFIG_SLOT = "plugins.bundle.config";
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
		const FallbackEditIcon = ({ size = 16 }) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
			width: size,
			height: size,
			viewBox: "0 0 16 16",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "1.3",
			strokeLinecap: "round",
			strokeLinejoin: "round",
			"aria-hidden": "true",
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M11.13 2.09a1.56 1.56 0 0 1 2.2 2.2L5.4 12.23l-3.02.9.9-3.02 7.85-8.02z" })
		});
		/**
		* 三行兜底链：0.1.7 的 `IconEditOutlineRegular` ?? 旧名 `IconEditOutline16` ?? 内联 SVG。
		* 都没有时只在控制台 warn 一次，按钮照常渲染 —— 宁可图标朴素，绝不整块消失。
		*/
		const EditIcon = _deepseek_ai_dsh_client_ui_primitives.IconEditOutlineRegular ?? _deepseek_ai_dsh_client_ui_primitives.IconEditOutline16 ?? FallbackEditIcon;
		if (EditIcon === FallbackEditIcon) console.warn(`${LOG} 上游图标导出表里没有铅笔图标，已退回内联 SVG`);
		function GenerateTitleAction({ t, useSession, useProjection, suggest, rename, lock, unlock, readState, checkCommands }) {
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
					label: t("renameTitle"),
					side: "bottom",
					delayMs: 500,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: { display: "inline-flex" },
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "ghost",
							size: "sm",
							icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(EditIcon, { size: 16 }),
							disabled: running,
							onClick: () => open ? close() : openPanel(),
							title: running ? t("renameDisabledHint") : void 0,
							"aria-label": t("renameTitle")
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
								children: t("renameTitle")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: close,
								"aria-label": t("closeAria"),
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
							placeholder: t("renamePlaceholder"),
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
								label: t("lockHint"),
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
										label: t("lockLabel"),
										onChange: () => toggleLock()
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: {
											fontSize: 12,
											color: "var(--dsw-alias-label-secondary)"
										},
										children: t("lockShort")
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
										children: t("cancel")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										disabled: busy || running,
										onClick: generateDraft,
										style: ghostButton(busy || running),
										children: busy ? t("generating") : t("autoGenerate")
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
										children: t("confirmSave")
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
		function installCrumbWidth() {
			injectStyle(CRUMB_STYLE_ID, `[class*="_crumbCurrent"]{max-width:${CRUMB_MAX_WIDTH} !important;}`);
		}
		function apply(ctx) {
			ctx.effect(() => {
				installCrumbWidth();
				injectStyle(PAIR_STYLE_ID, PAIR_CSS);
				return () => {
					removeStyle(CRUMB_STYLE_ID);
					removeStyle(PAIR_STYLE_ID);
				};
			});
			/**
			* 模型目录 store（配置表单的 provider / model 下拉数据源）。
			*
			* 两组服务（`remote.llm` 与设置镜像 face）就绪时序不定，DirectoryStore.load()
			* 两阶段喂参数，齐了自动加载一次。0.1.7 没有凭据域远端（remote 命名空间表里
			* 已无 credentials），目录只按设置文档判定，界面文案已说明口径。
			*/
			const directoryStore = new DirectoryStore();
			ctx.inject(["remote", "remote.llm"], (sub) => {
				directoryStore.load(sub.remote.llm);
			});
			/**
			* 界面文案（中英双语）。
			*
			* 词典注册要等 locale 服务，所以用 `ctx.inject` 延迟等待 —— 绝不能写进模块级
			* 注入声明：组合里缺它会让整个客户端 entry 一直 pending。React 组件的 `t` 由
			* 框架经槽位的 `locale: LOCALE_NS` 声明注入，语言切换自动重渲。
			*/
			ctx.inject(["locale"], (localeCtx) => {
				ctx.effect(() => localeCtx.locale.register(LOCALE_NS, {
					zh,
					en
				}));
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
					locale: LOCALE_NS,
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
			ctx.inject([
				"slots",
				"locale",
				"configForms"
			], (sub) => {
				directoryStore.load(void 0, sub.configForms.describe());
				const model = new _deepseek_ai_dsh_client_ui_primitives.SettingsFormModel(sub.configForms.get(LOCALE_NS), [
					(0, _deepseek_ai_dsh_client_ui_primitives.settingsNumberField)("retitleEvery"),
					(0, _deepseek_ai_dsh_client_ui_primitives.settingsTextField)("provider"),
					(0, _deepseek_ai_dsh_client_ui_primitives.settingsTextField)("model"),
					(0, _deepseek_ai_dsh_client_ui_primitives.settingsNumberField)("timeoutMs"),
					(0, _deepseek_ai_dsh_client_ui_primitives.settingsTextField)("template"),
					(0, _deepseek_ai_dsh_client_ui_primitives.settingsNumberField)("maxBytes")
				]);
				/** 卡片级状态 + 六个字段的控件态，一次投影全量发布。 */
				const store = model.bind(() => ({
					...model.shell(),
					retitleEvery: model.field("retitleEvery"),
					provider: model.field("provider"),
					model: model.field("model"),
					timeoutMs: model.field("timeoutMs"),
					template: model.field("template"),
					maxBytes: model.field("maxBytes")
				}));
				const actions = model.actions();
				ctx.effect(() => () => model.dispose());
				ctx.effect(() => sub.configForms.whileServed([LOCALE_NS], () => sub.slots.inject(BUNDLE_CONFIG_SLOT, () => sub.slots.register({
					name: BUNDLE_CONFIG_SLOT,
					key: name,
					locale: LOCALE_NS,
					inject: () => ({
						hooks: {
							panel: store,
							directory: directoryStore
						},
						save: () => model.save().then(() => !model.shell().failed),
						edit: actions.edit,
						resetField: actions.resetField,
						discard: actions.discard
					})
				}, ConfigPanel))));
				console.info(`${LOG} 已注册配置表单到 ${BUNDLE_CONFIG_SLOT}（${LOCALE_NS}）`);
			});
		}
		//#endregion
		exports.apply = apply;
		exports.name = name;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map