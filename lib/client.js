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
		* 为什么是图标而不是文字按钮：头部三组右侧容器（actions / utilities / corner）
		* 都是 `flex:none`，而标题所在的 `.titleCluster` 是 `flex:1` —— 标题吃的是
		* 「剩余宽度」。也就是说我们在这里多宽，标题就少多宽。文字按钮约 68px，
		* 图标按钮约 36px，能还给标题 30 多像素。
		*/
		const SLOT = "conversation.session.header.utilities";
		/** 本菜单项在列表中的地址，必须全局唯一。 */
		const ENTRY_ID = "generate-title";
		/** 触发 host 端重算的命令行。 */
		const RETITLE_LINE = "/retitle";
		/** 浏览器控制台前缀，便于排查。 */
		const LOG = "[dsh-session-title-pattern]";
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
		function apply(ctx) {
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