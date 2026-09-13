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
		function SettingsCard({ scope }) {
			const subscribe = (0, react.useCallback)((onChange) => scope.subscribe(onChange), [scope]);
			const getSnapshot = (0, react.useCallback)(() => scope.getSnapshot(), [scope]);
			const snapshot = (0, react.useSyncExternalStore)(subscribe, getSnapshot);
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
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
									value: draftText(desc),
									disabled: !writable,
									"aria-invalid": fieldInvalid || void 0,
									onChange: (event) => stage(desc.field, event.target.value)
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
						}),
						desc.hint === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: hintStyle,
							children: desc.hint
						}),
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
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Switch, {
								checked: draftText(desc) !== "rules",
								disabled: !writable,
								label: desc.label,
								onChange: (next) => stage(desc.field, next ? "llm" : "rules")
							}),
							overridden ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: overriddenBadgeStyle,
								children: "已覆盖"
							}) : null,
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
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
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
			] });
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
			ctx.inject(["slots", "settingsScope"], (sub) => {
				const scope = sub.settingsScope.bind({ namespace: SETTINGS_NS });
				sub.slots.inject("settings.plugin.item", () => sub.slots.register({
					name: "settings.plugin.item",
					key: SETTINGS_NS,
					inject: () => ({ scope })
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