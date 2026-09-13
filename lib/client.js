window.__ModuleLoader__.load({
	id: "@cq-guojia/dsh-session-title-pattern",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/settings-card.tsx
		/**
		* 设置命名空间，必须与 host 侧 `installSection` 用的一模一样。
		*
		* 字面量在这里重写而不是从 host 包导入：客户端包不得依赖 host 包。
		*/
		const SETTINGS_NS = "session-title-pattern";
		/**
		* 从某个 provider 的 profile 里读出 `models` 数组。
		*
		* profile 的形状由各适配器自己的 schema 决定，所以全程做结构判定：
		* 任何一步对不上就返回空数组，调用方据此把该行退回文本输入。
		*/
		function readModels(section, path) {
			let node = section;
			for (const key of path) {
				if (node === null || typeof node !== "object") return [];
				node = node[key];
			}
			if (node === null || typeof node !== "object") return [];
			const models = node.models;
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
		/**
		* 组装「供应商 → 已配置模型」目录。
		*
		* 两个来源：`listProviders`（当前已注册的路由）与 `listConfigurableProviders`
		* （已声明可配置的路由，带 settingsNs 地址）。模型不在这些接口里，而在每个
		* provider 自己的设置 section 里，所以还要读一次设置镜像。
		*/
		async function loadDirectory(llm, describe) {
			try {
				const [registered, declared] = await Promise.all([llm.listProviders(), llm.listConfigurableProviders()]);
				if (registered.ok !== true && declared.ok !== true) return {
					status: "unavailable",
					reason: "无法读取模型供应商目录"
				};
				await describe.ensure();
				const views = describe.getSnapshot().view?.namespaces ?? [];
				const addresses = /* @__PURE__ */ new Map();
				for (const entry of declared.ok ? declared.value ?? [] : []) addresses.set(entry.provider, {
					displayName: entry.displayName,
					settingsNs: entry.settingsNs,
					settingsPath: entry.settingsPath ?? []
				});
				for (const entry of registered.ok ? registered.value ?? [] : []) if (!addresses.has(entry.id)) addresses.set(entry.id, {
					displayName: entry.name,
					settingsPath: []
				});
				const routes = [];
				for (const [provider, address] of addresses) {
					const view = address.settingsNs === void 0 ? void 0 : views.find((candidate) => candidate.ns === address.settingsNs);
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
		/** 卡片标题行的样式：整行是一个按钮（与官方 `PluginCard` 的头部一致）。 */
		const headerStyle = {
			display: "flex",
			alignItems: "center",
			gap: 8,
			width: "100%",
			padding: "10px 12px",
			textAlign: "left",
			cursor: "pointer",
			background: "0 0",
			border: "1px solid var(--dsw-alias-border-l3)",
			borderRadius: 12,
			color: "var(--dsw-alias-label-primary)"
		};
		const dirtyBadgeStyle = {
			fontSize: 11,
			padding: "0 6px",
			borderRadius: 6,
			color: "var(--dsw-alias-state-business-primary)",
			background: "var(--dsw-alias-interactive-bg-hover)"
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
		* 卡片暴露的 8 项。
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
				},
				group: "top"
			},
			{
				field: "retitleEvery",
				label: "重算间隔",
				hint: "每多少条人类消息重新总结一次标题（条）",
				spec: numberField,
				group: "top"
			},
			{
				field: "provider",
				label: "服务商 provider",
				hint: "与 model 必须成对；两项都留空则跟随会话主模型",
				spec: textField,
				group: "model"
			},
			{
				field: "model",
				label: "模型 model",
				spec: textField,
				group: "model"
			},
			{
				field: "timeoutMs",
				label: "超时",
				hint: "单次模型调用超时（毫秒）",
				spec: numberField,
				group: "model"
			},
			{
				field: "maxOutputTokens",
				label: "输出上限",
				hint: "单次调用输出 token 上限",
				spec: numberField,
				group: "model"
			},
			{
				field: "separator",
				label: "分隔符",
				hint: "标题各段之间的分隔符",
				spec: textField,
				group: "format"
			},
			{
				field: "maxBytes",
				label: "标题长度上限",
				hint: "单位字节，必须 ≤ session-title 的 maxTitleBytes（dsh-base 默认 80）",
				spec: numberField,
				group: "format"
			}
		];
		const COLLAPSIBLE_GROUPS = [{
			key: "model",
			label: "模型"
		}, {
			key: "format",
			label: "标题格式"
		}];
		const labelStyle = {
			flex: `0 0 130px`,
			fontSize: 13,
			color: "var(--dsw-alias-label-secondary)"
		};
		const hintStyle = {
			fontSize: 11,
			lineHeight: "16px",
			color: "var(--dsw-alias-label-tertiary)",
			marginTop: 2
		};
		const overriddenBadgeStyle = {
			marginLeft: 6,
			fontSize: 11,
			color: "var(--dsw-alias-state-business-primary)"
		};
		/** provider / model 下拉的样式。没有 Select 基础组件，用原生 select 配上主题变量。 */
		const selectStyle = {
			flex: 1,
			minWidth: 0,
			height: 32,
			padding: "0 8px",
			fontSize: 13,
			color: "var(--dsw-alias-label-primary)",
			background: "var(--dsw-specific-input-major, var(--dsw-alias-bg-base))",
			border: "1px solid var(--dsw-alias-border-l3)",
			borderRadius: 8,
			cursor: "pointer"
		};
		function hasKey(value, key) {
			return Object.prototype.hasOwnProperty.call(value, key);
		}
		/**
		* 本插件的设置卡片。
		*
		* 用「暂存 + 保存」而不是改一下就提交：每一次写入都是可持久化的、带修订号栅栏的文档变更，
		* 边改边写会把一次输入变成用户没要求、也无法预览的写入（官方 `CardForm` 的同一取舍）。
		*
		* 自己渲染表单是因为客户端纯度闸门禁止复用设置区块自带的卡片外壳，
		* 只能从平台模块（ui-primitives）取控件。
		*/
		function SettingsCard({ scope, describe, getLlm }) {
			const subscribe = (0, react.useCallback)((onChange) => scope.subscribe(onChange), [scope]);
			const getSnapshot = (0, react.useCallback)(() => scope.getSnapshot(), [scope]);
			const snapshot = (0, react.useSyncExternalStore)(subscribe, getSnapshot);
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
				loadDirectory(llm, describe).then((next) => {
					if (alive) setDirectory(next);
				});
				return () => {
					alive = false;
				};
			}, [describe, getLlm]);
			const [expanded, setExpanded] = (0, react.useState)(false);
			const [drafts, setDrafts] = (0, react.useState)({});
			const [busy, setBusy] = (0, react.useState)(false);
			const [failed, setFailed] = (0, react.useState)(false);
			const [openGroups, setOpenGroups] = (0, react.useState)({});
			const section = snapshot.value ?? {};
			const user = snapshot.user ?? {};
			const writable = snapshot.writable && !busy;
			const ready = snapshot.status === "ready";
			const draftText = (desc) => drafts[desc.field] ?? desc.spec.format(section[desc.field]);
			const isOverridden = (desc) => {
				const draft = drafts[desc.field];
				if (draft === void 0) return hasKey(user, desc.field);
				return desc.spec.parse(draft)?.kind === "set";
			};
			const isInvalid = (desc) => {
				const draft = drafts[desc.field];
				return draft !== void 0 && desc.spec.parse(draft) === void 0;
			};
			const dirty = Object.keys(drafts).length > 0;
			const invalid = FIELDS.some(isInvalid);
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
			/**
			* provider / model 的控件。
			*
			* 目录可用时渲染成**只能选**的下拉 —— 手写 provider/model 几乎总是拼错，
			* 而拼错的结果是运行时调用失败，不如从根上不让输。目录读不到就退回文本输入。
			*/
			const renderControl = (desc) => {
				const value = draftText(desc);
				const disabled = !writable;
				if (directory.status === "ready") {
					if (desc.field === "provider") {
						const known = directory.routes.some((route) => route.provider === value);
						return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
							value,
							disabled,
							style: selectStyle,
							onChange: (event) => {
								stageMany({
									provider: event.target.value,
									model: ""
								});
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value: "",
									children: "跟随会话主模型"
								}),
								directory.routes.map((route) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value: route.provider,
									children: route.displayName
								}, route.provider)),
								value !== "" && !known ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value,
									children: `${value}（不在已配置列表）`
								}) : null
							]
						});
					}
					if (desc.field === "model") {
						const providerValue = drafts.provider ?? (typeof section.provider === "string" ? section.provider : "");
						const models = directory.routes.find((route) => route.provider === providerValue)?.models ?? [];
						const known = models.some((model) => model.id === value);
						return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
							value,
							disabled: disabled || providerValue === "",
							style: selectStyle,
							onChange: (event) => stage(desc.field, event.target.value),
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value: "",
									children: providerValue === "" ? "跟随会话主模型" : "该供应商未配模型，跟随其默认"
								}),
								models.map((model) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value: model.id,
									children: model.name ?? model.id
								}, model.id)),
								value !== "" && !known ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value,
									children: `${value}（不在已配置列表）`
								}) : null
							]
						});
					}
				}
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
					value,
					disabled,
					"aria-invalid": isInvalid(desc) || void 0,
					onChange: (event) => stage(desc.field, event.target.value)
				});
			};
			const save = async () => {
				setBusy(true);
				setFailed(false);
				try {
					for (const desc of FIELDS) {
						const draft = drafts[desc.field];
						if (draft === void 0) continue;
						const write = desc.spec.parse(draft);
						if (write === void 0) continue;
						if (write.kind === "clear") await scope.unset(desc.field);
						else await scope.set(desc.field, write.value);
					}
					setDrafts({});
				} catch {
					setFailed(true);
				} finally {
					setBusy(false);
				}
			};
			const renderRow = (desc) => {
				const overridden = isOverridden(desc);
				const fieldInvalid = isInvalid(desc);
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: { marginBottom: 10 },
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: 8
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									style: labelStyle,
									children: [desc.label, overridden ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: overriddenBadgeStyle,
										children: "已覆盖"
									}) : null]
								}),
								renderControl(desc),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "ghost",
									size: "sm",
									disabled: !writable || !overridden,
									title: "清除本字段，恢复继承默认值（保存后生效）",
									onClick: () => stage(desc.field, ""),
									children: "恢复默认"
								})
							]
						}),
						desc.hint === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: hintStyle,
							children: desc.hint
						}),
						desc.field === "provider" && directory.status === "unavailable" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: hintStyle,
							children: `未能读取已配置的模型列表（${directory.reason}），这两行已退回手动输入`
						}) : null,
						fieldInvalid ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: {
								...hintStyle,
								color: "var(--dsw-alias-label-error, #d9534f)"
							},
							children: "这里需要一个整数"
						}) : null
					]
				}, desc.field);
			};
			const renderModeRow = (desc) => {
				const overridden = isOverridden(desc);
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: { marginBottom: 10 },
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 8
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								style: labelStyle,
								children: [desc.label, overridden ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: overriddenBadgeStyle,
									children: "已覆盖"
								}) : null]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Switch, {
								checked: draftText(desc) !== "rules",
								disabled: !writable,
								label: desc.label,
								onChange: (next) => stage(desc.field, next ? "llm" : "rules")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: {
									fontSize: 12,
									color: "var(--dsw-alias-label-tertiary)"
								},
								children: draftText(desc) !== "rules" ? "模型总结" : "关键词规则"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "ghost",
								size: "sm",
								disabled: !writable || !overridden,
								title: "清除本字段，恢复继承默认值（保存后生效）",
								onClick: () => stage(desc.field, ""),
								children: "恢复默认"
							})
						]
					}), desc.hint === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: hintStyle,
						children: desc.hint
					})]
				}, desc.field);
			};
			const renderGroup = (key) => {
				const expanded = openGroups[key] === true;
				const group = COLLAPSIBLE_GROUPS.find((item) => item.key === key);
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: { marginTop: 6 },
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "ghost",
						size: "sm",
						onClick: () => setOpenGroups((previous) => ({
							...previous,
							[key]: !expanded
						})),
						children: `${expanded ? "▾" : "▸"} ${group?.label ?? key}`
					}), expanded ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							paddingLeft: 4,
							marginTop: 8
						},
						children: FIELDS.filter((desc) => desc.group === key).map(renderRow)
					}) : null]
				}, key);
			};
			if (!ready) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				"aria-expanded": expanded,
				onClick: () => setExpanded((value) => !value),
				style: headerStyle,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						style: {
							display: "flex",
							flexDirection: "column",
							gap: 2,
							flex: 1,
							textAlign: "left"
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: {
								fontSize: 14,
								fontWeight: 500,
								color: "var(--dsw-alias-label-primary)"
							},
							children: "会话标题"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: {
								fontSize: 12,
								lineHeight: "18px",
								color: "var(--dsw-alias-label-tertiary)"
							},
							children: "用模型总结会话标题的类型与主题，也可以退回关键词规则。"
						})]
					}),
					dirty ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: dirtyBadgeStyle,
						children: "未保存"
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: {
							fontSize: 12,
							color: "var(--dsw-alias-label-tertiary)"
						},
						children: expanded ? "▲" : "▼"
					})
				]
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					display: expanded ? "block" : "none",
					marginTop: 10
				},
				children: [
					FIELDS.filter((desc) => desc.group === "top").map((desc) => desc.field === "mode" ? renderModeRow(desc) : renderRow(desc)),
					COLLAPSIBLE_GROUPS.map((group) => renderGroup(group.key)),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 8,
							marginTop: 10,
							flexWrap: "wrap"
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "primary",
								size: "sm",
								disabled: !writable || !dirty || invalid,
								onClick: () => void save(),
								children: "保存"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "ghost",
								size: "sm",
								disabled: busy || !dirty,
								onClick: () => {
									setFailed(false);
									setDrafts({});
								},
								children: "放弃"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "ghost",
								size: "sm",
								disabled: !writable,
								title: "把所有字段标记为恢复默认（保存后生效）",
								onClick: () => {
									setFailed(false);
									setDrafts(Object.fromEntries(FIELDS.map((desc) => [desc.field, ""])));
								},
								children: "全部恢复默认"
							}),
							failed ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: {
									fontSize: 12,
									color: "var(--dsw-alias-label-error, #d9534f)"
								},
								children: "保存未落地，Host 拒绝了这次写入（草稿已保留，可修改后重试）"
							}) : null,
							snapshot.writable ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: {
									fontSize: 12,
									color: "var(--dsw-alias-label-tertiary)"
								},
								children: "当前连接为进程内模式，配置不会写入 Host 文档"
							})
						]
					})
				]
			})] });
		}
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
		/** 触发 host 端重算的命令行。 */
		const RETITLE_LINE = "/retitle";
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
		* 悬浮提示与无障碍标签共用的文案。
		*
		* 气泡不占布局空间，所以这里写全一点，把「按什么生成、会覆盖当前标题」讲清楚。
		* 不用「自动生成」——本按钮是手动触发，写「自动」会让人以为它自己会跑。
		*/
		const ACTION_LABEL = "根据对话重新生成标题";
		function GenerateTitleAction({ useSession, generate }) {
			const running = useSession((snapshot) => snapshot.running);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
				label: ACTION_LABEL,
				side: "bottom",
				delayMs: 500,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					style: { display: "inline-flex" },
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "ghost",
						size: "sm",
						icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutline16, { size: 16 }),
						disabled: running,
						onClick: generate,
						title: running ? "会话回复中，暂不能重新生成标题" : void 0,
						"aria-label": ACTION_LABEL
					})
				})
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
			if (typeof document === "undefined") return;
			if (document.getElementById(CRUMB_STYLE_ID) !== null) return;
			const style = document.createElement("style");
			style.id = CRUMB_STYLE_ID;
			style.textContent = `[class*="_crumbCurrent"]{max-width:${CRUMB_MAX_WIDTH} !important;}`;
			document.head.append(style);
		}
		function apply(ctx) {
			ctx.effect(() => {
				installCrumbWidth();
				return () => {
					if (typeof document !== "undefined") document.getElementById(CRUMB_STYLE_ID)?.remove();
				};
			});
			let commands;
			ctx.inject(["remote", "remote.commands"], (sub) => {
				commands = sub.remote.commands;
			});
			ctx.inject(["slots"], (sub) => {
				sub.slots.inject(SLOT, () => sub.slots.register({
					name: SLOT,
					id: ENTRY_ID,
					order: ACTION_ORDER,
					inject: (sessionId) => ({ generate: () => {
						if (commands === void 0) {
							console.warn(`${LOG} remote.commands 尚未就绪，无法执行 ${RETITLE_LINE}`);
							return;
						}
						commands.execute(sessionId, RETITLE_LINE, []).catch(() => void 0);
					} })
				}, GenerateTitleAction));
				console.info(`${LOG} 已注册「生成标题」到 ${SLOT}`);
			});
			let llmDirectory;
			ctx.inject(["remote", "remote.llm"], (sub) => {
				llmDirectory = sub.remote.llm;
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
						getLlm: () => llmDirectory
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