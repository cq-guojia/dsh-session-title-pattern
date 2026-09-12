window.__ModuleLoader__.load({
	id: "@cq-guojia/dsh-session-title-pattern",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/index.tsx
		const name = "dsh-session-title-pattern";
		/** 会话头部操作区。cardinality 为 list，注册新 id 即增量追加，不会覆盖内置项。 */
		const SLOT = "conversation.session.header.actions";
		/** 本菜单项在列表中的地址，必须全局唯一。 */
		const ENTRY_ID = "generate-title";
		/** 触发 host 端重算的命令行。 */
		const RETITLE_LINE = "/retitle";
		const inject = {
			required: ["slots"],
			optional: ["remote", "remote.commands"]
		};
		function GenerateTitleAction({ useSession, generate }) {
			const running = useSession((snapshot) => snapshot.running);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: running,
				onClick: generate,
				children: "生成标题"
			});
		}
		function apply(ctx) {
			const commands = ctx.remote?.commands;
			if (!commands) return;
			ctx.slots.inject(SLOT, () => ctx.slots.register({
				name: SLOT,
				id: ENTRY_ID,
				order: -100,
				inject: (sessionId) => ({ generate: () => {
					commands.execute(sessionId, RETITLE_LINE, []).catch(() => void 0);
				} })
			}, GenerateTitleAction));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map