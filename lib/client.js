window.__ModuleLoader__.load({
	id: "@cq-guojia/dsh-session-title-pattern",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/index.tsx
		const name = "dsh-session-title-pattern";
		/**
		* 会话头部右侧的工具区。cardinality 为 list，注册新 id 即增量追加，不会覆盖内置项。
		*
		* 用图标而不是文字按钮，是为了和同排的 `...` 等控件观感统一（约 36px vs 约 68px）。
		*
		* 注意：这**不会**让标题变宽。标题宽度由上游 `.crumb` 的 `max-width:220px` 决定，
		* 只要可用宽度大于 220px，头部控件宽窄就完全不影响标题 —— 多出来的空间只会留在
		* `.titleCluster` 里。标题本身的宽度问题由 installCrumbWidth() 处理。
		*/
		const SLOT = "conversation.session.header.utilities";
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
		* 四个尖角的星形，表示「生成」。
		*
		* 必须内联：`ui-primitives` 只导出文件/链接/引用类图标，没有通用图标集。
		*/
		const SparkleIcon = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
			width: "16",
			height: "16",
			viewBox: "0 0 16 16",
			"aria-hidden": "true",
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
				d: "M8 1.8 9.35 5.6 13.2 6.95 9.35 8.3 8 12.1 6.65 8.3 2.8 6.95 6.65 5.6Z",
				fill: "currentColor"
			})
		});
		function GenerateTitleAction({ useSession, generate }) {
			const running = useSession((snapshot) => snapshot.running);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				variant: "ghost",
				size: "sm",
				icon: SparkleIcon,
				disabled: running,
				onClick: generate,
				title: "生成标题",
				"aria-label": "生成标题"
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
					order: 100,
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
		}
		//#endregion
		exports.apply = apply;
		exports.name = name;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map