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
		var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
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
		react = __toESM(react, 1);
		let react_dom = require("react-dom");
		react_dom = __toESM(react_dom, 1);
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		_deepseek_ai_dsh_client_ui_primitives = __toESM(_deepseek_ai_dsh_client_ui_primitives, 1);
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region node_modules/dsh-plugin-core/dist/design/tokens-css.generated.js
		const TOKENS_CSS_TEMPLATE = "\n/* ── 文字（宿主 label 四档 + 反色面用字）────────────────────────────── */\nbody{\n  --dshpc-fg:var(--dsw-alias-label-primary,#1f2328);\n  --dshpc-fg-2:var(--dsw-alias-label-secondary,#5c6370);\n  --dshpc-fg-3:var(--dsw-alias-label-tertiary,#767d87);\n  --dshpc-fg-4:var(--dsw-alias-label-caption,#9aa1ab);\n  --dshpc-fg-dim:var(--dsw-alias-label-dimmed,#b9bfc7);\n  /* 反色面上的字（实心钮 / 角标）：暗色下是 bluish-1000，故用 -foreground 而非 -inverted */\n  --dshpc-fg-inverse:var(--dsw-alias-label-primary-foreground,#fff);\n\n  /* ── 面（宿主 bg-layer 三档 + 下沉轨道底）──────────────────────────── */\n  --dshpc-surface-1:var(--dsw-alias-bg-layer-1,#fff);\n  --dshpc-surface-2:var(--dsw-alias-bg-layer-2,#fff);\n  --dshpc-surface-3:var(--dsw-alias-bg-layer-3,#fff);\n  /* 「选中亮片」的底盘色（配 --dshpc-shadow-raised 用） */\n  --dshpc-surface-raised:var(--dsw-alias-bg-layer-1,#fff);\n  /* 轨道 / 下沉底（官方分段控件轨道用的就是这条） */\n  --dshpc-surface-sunken:var(--dsw-alias-interactive-bg-hover,rgba(38,49,72,.06));\n  /* 整页 / 编辑器底（bg-base） */\n  --dshpc-surface-base:var(--dsw-alias-bg-base,#fff);\n  /* 自绘浮层 / 菜单卡的不透明底（= base；不要用半透明的 specific-menu） */\n  --dshpc-surface-menu:var(--dshpc-surface-base);\n  /* markdown 代码块面 / 字体（会话镜像里用到） */\n  --dshpc-code-surface:var(--dsw-alias-markdown-code-block,rgba(128,128,128,.10));\n  --dshpc-code-font:var(--dsw-font-markdown-code-block-small,12px/18px var(--ds-font-family-code,monospace));\n  /* 警告文字色（宿主 state-warn-label） */\n  --dshpc-warning-label:var(--dsw-alias-state-warn-label,#f5a623);\n  /* 固定中性实面（自绘浮层、深色主题下必须自己变的那几个）——只有它需要暗色覆盖 */\n  --dshpc-solid:var(--dsw-static-neutral-00,#fff);\n  --dshpc-on-solid:var(--dsw-alias-label-primary,#1f2328);\n  /* 交付文件卡那种「浅底盘 + hover 加深」两拍 */\n  --dshpc-plate:var(--dsw-static-neutral-50,#fafafa);\n  --dshpc-plate-hover:var(--dsw-static-neutral-100,#f5f5f5);\n  /* ⚠️ 这些**固定中性面一律用 rgba 字面量**（2026-10-19 真机教训）：不要写成\n     「rgba 回退行 + 嵌 --dsw-static-* 的 color-mix 行」两条同名声明——自定义属性**后者恒胜**，\n     哪怕它的值在宿主里算不出来（static 变量 invalid）⇒ 整条 token 作废、rgba 兜底一起被废，\n     0.2.6 里 Segmented 轨道全透明就是这么来的。要跟宿主主题联动的面用 alias token（那些实测有效）。 */\n  --dshpc-icon-plate:rgba(255,255,255,.5);\n  /* 表头底：浅色主题**偏深**，且必须**比斑马纹（--dshpc-plate）再深一档**——\n     两者不能撞色（用户 2026-10-02：表头跟斑马纹一模一样）。 */\n  --dshpc-head-bg:var(--dsw-static-neutral-100,#f5f5f5);\n  /* 表格底 / 行 hover（2026-10-30 用户二次定案：表头与通栏**互换**底色）：\n     表头默认底 = 通栏原来那层灰（--dshpc-surface-sunken，跟着宿主交互面走）；\n     通栏默认底 = 表头原来那色（亮 #f6f8fa / 暗 #151b23，参考图实测，与深色段同源）；\n     行 hover 是「一层极淡的黑」≈1.5%（用户：再浅一半，要特别淡）。 */\n  --dshpc-table-head-bg:var(--dshpc-surface-sunken);\n  --dshpc-table-banner-bg:#f6f8fa;\n  --dshpc-table-row-hover:rgba(15,15,15,.015);\n  /* 图标小底板（产出物）：浅色下要**看得见**（原先取 plate ⇒ 在白底上等于没有）；hover 加倍。 */\n  --dshpc-chip-bg:rgba(15,15,15,.07);\n  --dshpc-chip-bg-hover:rgba(15,15,15,.14);\n  /* 展开行：**带透明度的蓝**——不是灰、也不是纯色，透出卡片底色，一眼看出「这是展开的」\n     （用户 2026-10-02：灰色跟斑马纹分不出来）。内容区再淡一档，形成「行深 / 内容浅」的区隔。 */\n  --dshpc-open-bg:rgba(37,99,235,.10);\n  --dshpc-open-bg-soft:rgba(37,99,235,.05);\n  --dshpc-card-hover:rgba(37,99,235,.07);\n\n  /* ── 描边四档（宿主真值：l1 4% / l2 10% / l3 12% / l4 16%）────────── */\n  --dshpc-border-faint:var(--dsw-alias-border-l1,#0000000a);\n  --dshpc-border:var(--dsw-alias-border-l2,#0000001a);\n  --dshpc-border-strong:var(--dsw-alias-border-l3,#0000001f);\n  --dshpc-border-heavy:var(--dsw-alias-border-l4,#00000029);\n\n  /* ── 品牌 / 语义色 ────────────────────────────────────────────────── */\n  /* 品牌「面」色：明色近黑、暗色近白（官方 Switch 选中态即此），**不是蓝色** */\n  --dshpc-accent:var(--dsw-alias-brand-primary,#0f1115);\n  /* 蓝色：强调 / 选中 / 焦点，一律走这条 */\n  --dshpc-business:var(--dsw-alias-state-business-primary,#3b5bdb);\n  --dshpc-success:var(--dsw-alias-state-success-primary,#22c55e);\n  /* ⚠️ 是 state-warn（不是 state-warning，后者宿主无此定义） */\n  --dshpc-warning:var(--dsw-alias-state-warn-primary,#f59e0b);\n  --dshpc-danger:var(--dsw-alias-state-error-primary,#ec1313);\n  --dshpc-link:var(--dsw-alias-link,#3b5bdb);\n  /* 语义色**实面**上的字（角标 / 实心提示）：宿主红绿黄三色都是中调 ⇒ 白字两个主题都可读，\n     故这是一条与主题无关的常量；不要拿 --dshpc-fg-inverse 顶——它在暗色下是近黑，压在红底上看不清。 */\n  --dshpc-on-signal:#fff;\n  /* 黄底上的字：黄色是中高明度，白字看不清 ⇒ 固定深色（与主题无关）。 */\n  --dshpc-on-warning:#1f2328;\n  /* 告警严重度的圆点底色（2026-11-03 从 feedback.css 收到这里）。\n     与主题无关的一组常量：这几个色要在任意底色上都认得出来，所以**不跟宿主 state 色走**\n     （宿主 state-warn-primary 偏亮，压白 ✕ 看不清）。语义色改动请只改这里。 */\n  --dshpc-sev-info:#2563eb;\n  --dshpc-sev-success:#16a34a;\n  --dshpc-sev-warning:#d97706;\n  --dshpc-sev-error:#dc2626;\n\n  /* ── 实心按钮的 hover / active 派生态（2026-10-19 用户点名）─────────────────\n     原实现是 :hover 直接压 opacity .9：黑底压 10% 几乎看不出来，用户原话「完全感觉不到颜色变了」。\n     ⇒ 改成对底色做**明确的混色**（压 22% / 34%），不用 opacity：\n       · 亮色主题：黑底（--dshpc-accent）掺白提亮；红 / 绿 / 黄 / 蓝底掺黑压深；\n       · 暗色主题：反过来（暗底掺白、亮底掺黑）。\n     混色对象是**固定中性色字面量**（#fff / #000），不依赖宿主 static-neutral 是否存在；\n     旧内核不认 color-mix 时整条声明作废 ⇒ 回落各档原色（可接受：仍可点，只是没有 hover 反馈）。 */\n  --dshpc-accent-hover:color-mix(in srgb,var(--dshpc-accent) 78%,#ffffff);\n  --dshpc-accent-active:color-mix(in srgb,var(--dshpc-accent) 64%,#ffffff);\n  --dshpc-danger-hover:color-mix(in srgb,var(--dshpc-danger) 78%,#000000);\n  --dshpc-danger-active:color-mix(in srgb,var(--dshpc-danger) 64%,#000000);\n  --dshpc-success-hover:color-mix(in srgb,var(--dshpc-success) 78%,#000000);\n  --dshpc-success-active:color-mix(in srgb,var(--dshpc-success) 64%,#000000);\n  --dshpc-warning-hover:color-mix(in srgb,var(--dshpc-warning) 78%,#000000);\n  --dshpc-warning-active:color-mix(in srgb,var(--dshpc-warning) 64%,#000000);\n  --dshpc-business-hover:color-mix(in srgb,var(--dshpc-business) 78%,#000000);\n  --dshpc-business-active:color-mix(in srgb,var(--dshpc-business) 64%,#000000);\n  /* 语义色**浅底**：状态色系的「一块底色」——执行记录页每条流水账的块底就是它\n     （用户 2026-10-04：正常态给同色系很浅的透明底、失败用红底透出来）。\n     用 「color-mix」 现算而不写死 rgba：状态色本身跟随宿主 alias，主题一换自动成立。\n     ⚠️ **深色下要更淡**：用户 2026-10-04「深色风格的绿色和红色好像都有点深」⇒ dark 段\n     把这四条压到 5%（更贴近面板底、存在感更弱）；浅色段维持 8%。两端各自给值，不共用一条曲线。\n     命名收在 tokens.ts 单点（本仓硬规矩：业务文件不许自造 --dshpc-*）。 */\n  --dshpc-success-soft:color-mix(in srgb,var(--dshpc-success) 8%,transparent);\n  --dshpc-warning-soft:color-mix(in srgb,var(--dshpc-warning) 8%,transparent);\n  --dshpc-danger-soft:color-mix(in srgb,var(--dshpc-danger) 8%,transparent);\n  --dshpc-business-soft:color-mix(in srgb,var(--dshpc-business) 8%,transparent);\n\n  /* ── 扩展语义色（2026-10-29 用户拍板：分类 / 图表常用色八支）──────────────\n     宿主无对应 alias ⇒ 写死 hex（不跟随宿主换肤）；实心面字色统一走 --dshpc-on-signal（白），\n     因八支明度都低于黄 / 青柠，白字两主题均 ≥4.5:1 可读。每条自带 hover/active/soft 派生；\n     暗色段只覆盖派生（base 写死、两主题同值）。 */\n  --dshpc-purple:#9333ea;\n  --dshpc-purple-hover:color-mix(in srgb,var(--dshpc-purple) 78%,#000000);\n  --dshpc-purple-active:color-mix(in srgb,var(--dshpc-purple) 64%,#000000);\n  --dshpc-purple-soft:color-mix(in srgb,var(--dshpc-purple) 8%,transparent);\n  --dshpc-pink:#db2777;\n  --dshpc-pink-hover:color-mix(in srgb,var(--dshpc-pink) 78%,#000000);\n  --dshpc-pink-active:color-mix(in srgb,var(--dshpc-pink) 64%,#000000);\n  --dshpc-pink-soft:color-mix(in srgb,var(--dshpc-pink) 8%,transparent);\n  --dshpc-cyan:#0e7490;\n  --dshpc-cyan-hover:color-mix(in srgb,var(--dshpc-cyan) 78%,#000000);\n  --dshpc-cyan-active:color-mix(in srgb,var(--dshpc-cyan) 64%,#000000);\n  --dshpc-cyan-soft:color-mix(in srgb,var(--dshpc-cyan) 8%,transparent);\n  --dshpc-teal:#0f766e;\n  --dshpc-teal-hover:color-mix(in srgb,var(--dshpc-teal) 78%,#000000);\n  --dshpc-teal-active:color-mix(in srgb,var(--dshpc-teal) 64%,#000000);\n  --dshpc-teal-soft:color-mix(in srgb,var(--dshpc-teal) 8%,transparent);\n  --dshpc-orange:#c2410c;\n  --dshpc-orange-hover:color-mix(in srgb,var(--dshpc-orange) 78%,#000000);\n  --dshpc-orange-active:color-mix(in srgb,var(--dshpc-orange) 64%,#000000);\n  --dshpc-orange-soft:color-mix(in srgb,var(--dshpc-orange) 8%,transparent);\n  --dshpc-indigo:#4f46e5;\n  --dshpc-indigo-hover:color-mix(in srgb,var(--dshpc-indigo) 78%,#000000);\n  --dshpc-indigo-active:color-mix(in srgb,var(--dshpc-indigo) 64%,#000000);\n  --dshpc-indigo-soft:color-mix(in srgb,var(--dshpc-indigo) 8%,transparent);\n  --dshpc-rose:#e11d48;\n  --dshpc-rose-hover:color-mix(in srgb,var(--dshpc-rose) 78%,#000000);\n  --dshpc-rose-active:color-mix(in srgb,var(--dshpc-rose) 64%,#000000);\n  --dshpc-rose-soft:color-mix(in srgb,var(--dshpc-rose) 8%,transparent);\n  --dshpc-slate:#475569;\n  --dshpc-slate-hover:color-mix(in srgb,var(--dshpc-slate) 78%,#000000);\n  --dshpc-slate-active:color-mix(in srgb,var(--dshpc-slate) 64%,#000000);\n  --dshpc-slate-soft:color-mix(in srgb,var(--dshpc-slate) 8%,transparent);\n\n  /* ⚠️ 2026-10-18 用户拍板：宿主 alias 的 hover（暗色白 8% / 亮色 6%）**太弱**，\n     「移上去要仔细看才看得出来」⇒ 不再委托宿主 hover 别名，改为自掺中性色并加重：\n     亮色掺黑 10%、暗色掺白 14%（active 再加一档）。按钮 / 分段轨道 / 各类 hover 底同时受益。\n     ⚠️ 必须保留 rgba 兜底行在前（本文件惯例，见 icon-plate 注释）：掺的是**固定中性色**\n     （neutral-900=#0f0f0f / neutral-00=#fff），预计算无损；旧内核不认 color-mix 时走兜底，\n     否则整条 background:var(--seg-track) 作废 ⇒ 分段轨道透明（真踩过：预览站轨道消失）。 */\n  --dshpc-hover:rgba(15,15,15,.10);\n  --dshpc-active:rgba(15,15,15,.18);\n  /* 分段控件轨道底：专用 token（rgba 字面量、不借 --dshpc-hover 中转）——\n     2026-10-19 教训：变量链中间任何一环 invalid ⇒ background 整条作废、轨道全透明。\n     亮色：黑 7%（比 hover 的 10% 淡一档，选中白片才跳得出）。 */\n  --dshpc-seg-track:rgba(15,15,15,.07);\n  --dshpc-mask:var(--dsw-alias-bg-mask-1,#0000003d);\n  /* 弹窗锁定态给**自绘控件**的降透明度档（2026-11-05）。放在 token 里是为了让消费方\n     在自己元素上写 --dshpc-lock-dim: 1 就能退出这条效果，不用 !important 打架。 */\n  --dshpc-lock-dim:.5;\n  /* 「选中面」（2026-10-06，任务日程页首创）= 当前底色**朝更深掺 12% 文字色**：\n     浅色主题下文字色是黑 ⇒ 选中面比常态底色**深一档**。深色分支见 body[data-ds-dark-theme]（朝背景色掺）。\n     语义：标记「正在看的东西」，比常态明显、又不许盖住内容（不许用半透明叠状态色）。 */\n  --dshpc-selected-bg:color-mix(in srgb,var(--dshpc-surface-1) 88%,var(--dshpc-fg));\n  /* ListRow 选中面（2026-11-07 用户定）：slate 的**极浅蓝灰**，不用上面那条通用「选中面」。\n     通用值亮色是掺文字色的中性灰、暗色是两个深色面互掺 ⇒ 深色下选中行发黑（用户实测）。\n     这里从 --dshpc-slate 派生半透明浅色：亮色 14% 叠白 ≈ #e5e7ea，比常态 tone-sunken\n     深一档才看得出「选中」；暗色浓度见 body[data-ds-dark-theme] 段。 */\n  --dshpc-listrow-selected-bg:color-mix(in srgb,var(--dshpc-slate) 14%,transparent);\n  /* ListRow hover（2026-11-07 用户：原来取 --dshpc-active 太夸张，「有一点变化就行」）：\n     常态 tone-sunken 是 6% 蓝灰叠白 ≈ #f0f1f3，这里只加深到 9% 中性黑 ≈ #e8e8e8，\n     能看出移上去了，又不会把整行内容和文字对比度一起改掉。暗色档见 body[data-ds-dark-theme]。 */\n  --dshpc-listrow-hover-bg:rgba(15,15,15,.09);\n  /* 任务日程页本月格默认底（2026-10-06 → 续2）：浅色下给**淡蓝**（business 8% 透白底）——\n     参照用户参考稿里未选中日程块 / Tuesday 列的那种蓝、再浅一点点；\n     相邻月补位格仍走 --dshpc-surface-2（更灰），不受影响。\n     深色段维持 #23262e（用户：深色 UI 已差不多，不动）。 */\n  --dshpc-cal-cell-bg:color-mix(in srgb,var(--dshpc-business) 8%,var(--dshpc-surface-1));\n  /* 任务日程页「点开某天」展开的面板底（2026-10-06 续）：浅色下**无限接近白、只带一丁点灰**\n     （neutral-50 = #fafafa）——面板里装半透明执行记录列表，底再深整片就发糊发灰；\n     深色段沿用原 selected-bg 暗值，保持不动。 */\n  --dshpc-cal-panel-bg:var(--dsw-static-neutral-50,#fafafa);\n  /* 任务日程页本月格 hover 底（浅色段，2026-10-06 续3）：不再走灰色通用交互底——\n     鼠标移上去应是「更亮一点点的蓝」（与深色段同语义：hover = 提亮的蓝，不是灰下去）。\n     浓度**介于**表头蓝（14%）与未选中格蓝（8%）之间、略偏表头一侧：business 12% 透白底\n     （比表头浅一点、比未选中格深一点）。 */\n  --dshpc-cal-cell-hover:color-mix(in srgb,var(--dshpc-business) 12%,var(--dshpc-surface-1));\n\n  /* ── 投影 / 焦点 ──────────────────────────────────────────────────── */\n  --dshpc-shadow-1:var(--dsw-elevation-soft,0 4px 16px 0 #00000008);\n  /* 亮片自带的浮起感（选中态用；与 --dshpc-surface-raised 配对） */\n  --dshpc-shadow-raised:var(--dsw-elevation-soft,0 4px 16px 0 #00000008);\n  --dshpc-shadow-2:var(--dsw-shadow-lv3,0 12px 32px 0 #00000014);\n  /* 键盘焦点环。⚠️ 不用宿主 --dsw-focus-ring-color：它默认值是 transparent（兜底不生效、会隐身） */\n  --dshpc-focus:var(--dsw-alias-state-business-primary,#3b5bdb);\n\n  /* ── 圆角（宿主真值 4 / 8 / 12 / 16 / 20 / 28）─────────────────────── */\n  --dshpc-radius-xs:var(--dsw-radius-xs,4px);\n  --dshpc-radius-sm:var(--dsw-radius-sm,8px);\n  --dshpc-radius-md:var(--dsw-radius-md,12px);\n  --dshpc-radius-lg:var(--dsw-radius-lg,16px);\n  --dshpc-radius-xl:var(--dsw-radius-xl,20px);\n  --dshpc-radius-panel:var(--dsw-radius-panel,28px);\n  /* 全圆（胶囊标签）：宿主的 radius 档最大只有 28px，撑不满 24px 高的 chip */\n  --dshpc-radius-pill:999px;\n\n  /* ── 间距四拍（只许用这四档，不许出现 5 / 7 / 9px）────────────────── */\n  --dshpc-space-1:4px;\n  --dshpc-space-2:8px;\n  --dshpc-space-3:12px;\n  --dshpc-space-4:16px;\n\n  /* ── 控件高度：离散三档（控件用 size=\"sm|md|lg\" 选；调用点不许自定义高度，\n       真不够用才允许在调用点本地覆盖 --dshpc-control-h-*，属例外而非常态）── */\n  --dshpc-control-h-sm:24px;\n  --dshpc-control-h-md:28px;\n  --dshpc-control-h-lg:32px;\n\n  /* ── 字号 / 行高：直绑宿主字号族（宿主真值 11 / 12 / 13 / 14 / 16）───── */\n  --dshpc-font-xs:var(--dsw-font-xxxs-11-font-size,11px);\n  --dshpc-font-sm:var(--dsw-font-xxs-12-font-size,12px);\n  --dshpc-font-md:var(--dsw-font-xs-13-font-size,13px);\n  --dshpc-font-lg:var(--dsw-font-s-14-font-size,14px);\n  --dshpc-font-xl:var(--dsw-font-base-16-font-size,16px);\n  --dshpc-line-xs:var(--dsw-font-xxxs-11-line-height,14px);\n  --dshpc-line-sm:var(--dsw-font-xxs-12-line-height,18px);\n  --dshpc-line-md:var(--dsw-font-xs-13-line-height,20px);\n  --dshpc-line-lg:var(--dsw-font-s-14-line-height,22px);\n  --dshpc-line-xl:var(--dsw-font-base-16-line-height,24px);\n  --dshpc-font-mono:var(--ds-font-family-code,monospace);\n\n  /* ── 细滚动条的让位值（线宽不能放 token，见文件末尾的注释）──────────\n     1px→2px 只改这一行；它用在普通元素上，var() 能正常解析。 */\n  --dshpc-scroll-inset:1px;\n\n  /* ── 层级阶梯（业务文件不许再写裸 z-index）───────────────────────── */\n  /* 页面级预览分栏 → 抽屉（新建/编辑）→ 弹窗/确认框 → 浮层菜单 → 浮层提示 */\n  /* **整条阶梯都必须低于官方浮点 1000 档**（2026-11-06 用户拍板）：官方原语\n     Modal / ImageLightbox 是 z-index 1000（body portal），Menu / Toast 是 1100。\n     我们只是宿主里的一个页面 ⇒ 宿主浮点恒在我们之上；以后弹窗里再开官方模态/预览，\n     不必逐个场景「临时让位」（此前 1070 压住官方原图预览就是这么踩出来的）。 */\n  /* 内容层吸顶（天标签 / 表头这类「跟着滚但压住同层内容」的元素）：只压同层兄弟，\n     必须低于下面所有浮层档 —— 所以它不是「开新浮层档」，而是内容层内部的排序位。 */\n  --dshpc-z-sticky:10;\n  --dshpc-z-dock:900;\n  --dshpc-z-drawer:920;\n  --dshpc-z-modal:940;\n  /* 收起后的耳朵：必须高于弹窗遮罩，否则弹窗一开就点不到它（2026-11-04 用户真机）。\n     只给耳朵用，页面级分栏本体仍是布局成员，不跟着抬高。 */\n  --dshpc-z-ear:950;\n  --dshpc-z-menu:960;\n  --dshpc-z-tip:970;\n  /* 语义别名（2026-11-03 面板皮肤统一）：业务文件只许用这两个说「我要一层浮层」，\n     不再各自写浮层字面量。\n       panel   = 浮层面板本体（picker 弹窗、锚定面板）；\n       popmenu = 叠在面板之上的菜单（▾ 选层、Picker 下拉）与其透明遮罩。 */\n  --dshpc-z-panel:var(--dshpc-z-menu);\n  --dshpc-z-popmenu:var(--dshpc-z-tip);\n\n  /* ── 动效 ─────────────────────────────────────────────────────────── */\n  --dshpc-dur:var(--ds-transition-duration,.2s);\n  --dshpc-dur-fast:var(--ds-transition-duration-fast,.12s);\n  --dshpc-ease:var(--ds-ease-in-out,cubic-bezier(.4,0,.2,1));\n  /* 运行中状态的脉动时长（2026-10-06 统一前后两端：任务配置里的绿呼吸 → 蓝、放慢；\n     执行记录里的蓝闪 → 放慢一点。两者用同一个值，动画形状本就一致）。 */\n  --dshpc-dur-run:500ms;\n}\n\n/* ── 明暗差异的**唯一**落点 ──────────────────────────────────────────────\n   判据 = body[data-ds-dark-theme]（宿主 0.2.0-rc.2 源码核实：启动脚本 toggleAttribute 写入，\n   唯一明暗判据；插件禁止用 prefers-color-scheme —— 它跟的是系统、不是用户在宿主里的选择）。\n   下面只放 alias 表达不了的「固定中性面」；颜色若能靠 alias 自动跟随，一律不要写在这里。 */\nbody[data-ds-dark-theme]{\n  /* 深色段的蓝**刻意不跟随宿主 alias**（唯一例外）：宿主暗色 alias 给的是 #60a5fa 一档的高亮蓝，\n     实心面（Chip / Button info / 日期选中格）压白字会发糊 —— 用户 2026-10-29 实测反馈。\n     ⇒ 深色下改定向浅色状态的蓝（#3b5bdb）靠，只在明度上抬一点点，保证它在暗底上仍看得见：\n     #4c6bd8 对白字 ≈4.8:1（原亮蓝只有 ~2.3:1），对日历格底 ≈3.2:1 仍过 UI 件的 3:1 线。\n     代价：宿主换品牌色时深色不再自动跟着变，需要这里手动同步。 */\n  --dshpc-business:#4c6bd8;\n  --dshpc-solid:var(--dsw-static-neutral-900,#0f0f0f);\n  --dshpc-on-solid:var(--dsw-static-neutral-00,#fff);\n  /* 实心按钮 hover / active（暗色版）：黑底（浅色主题的近黑 → 暗色下的近白）掺黑压深；\n     红 / 绿 / 黄 / 蓝掺白提亮。与亮色段方向相反，保证两种主题下「一眼看出变了」。 */\n  --dshpc-accent-hover:color-mix(in srgb,var(--dshpc-accent) 80%,#000000);\n  --dshpc-accent-active:color-mix(in srgb,var(--dshpc-accent) 66%,#000000);\n  --dshpc-danger-hover:color-mix(in srgb,var(--dshpc-danger) 78%,#ffffff);\n  --dshpc-danger-active:color-mix(in srgb,var(--dshpc-danger) 64%,#ffffff);\n  --dshpc-success-hover:color-mix(in srgb,var(--dshpc-success) 78%,#ffffff);\n  --dshpc-success-active:color-mix(in srgb,var(--dshpc-success) 64%,#ffffff);\n  --dshpc-warning-hover:color-mix(in srgb,var(--dshpc-warning) 78%,#ffffff);\n  --dshpc-warning-active:color-mix(in srgb,var(--dshpc-warning) 64%,#ffffff);\n  /* 同上：掺白比例从 22% / 36% 收到 12% / 22% —— 底色已变深，照旧比例提亮会在 hover 瞬间\n     把白字对比打回 ~3:1（正是用户嫌糊的那一档）；收窄后 hover 仍可感知、字仍清晰。 */\n  --dshpc-business-hover:color-mix(in srgb,var(--dshpc-business) 88%,#ffffff);\n  --dshpc-business-active:color-mix(in srgb,var(--dshpc-business) 78%,#ffffff);\n  /* 暗色 hover 掺白 14% / active 24%（对齐上面 2026-10-18 的加重拍板）。rgba 兜底行同上。 */\n  --dshpc-hover:rgba(255,255,255,.14);\n  --dshpc-active:rgba(255,255,255,.24);\n  /* 分段轨道（暗色版）：白 10%——比 hover 淡一档，选中亮片才跳得出。 */\n  --dshpc-seg-track:rgba(255,255,255,.10);\n  --dshpc-plate:var(--dsw-static-neutral-850,#212123);\n  --dshpc-plate-hover:var(--dsw-static-neutral-800,#292929);\n  --dshpc-icon-plate:rgba(255,255,255,.05);\n  /* 暗色主题**反过来**：表头要比卡片面**亮**、比斑马纹再**浅一档**（用户：纯黑背景没法看）。 */\n  --dshpc-head-bg:var(--dshpc-surface-2);\n  /* 表格（2026-10-30 用户二次定案：与通栏互换底色）：通栏底取表头原来那色 #151b23\n     （亮色段对应 #f6f8fa）；表头默认底沿用亮色段定义的 --dshpc-surface-sunken，不在暗色段重写；\n     行 hover 是「一层极淡的白」≈3% —— 暗底上用黑会越悬越暗，看不出「浅灰」反馈。 */\n  --dshpc-table-banner-bg:#151b23;\n  --dshpc-table-row-hover:rgba(255,255,255,.03);\n  /* 暗色底板**微亮**；hover **更亮**（原先 hover 取 plate-hover 反而更淡 ⇒ 鼠标移上去就没了）。 */\n  --dshpc-chip-bg:rgba(255,255,255,.08);\n  --dshpc-chip-bg-hover:rgba(255,255,255,.16);\n  /* 暗色下蓝色要更亮、透明度略高才压得住深底。 */\n  --dshpc-open-bg:rgba(96,165,250,.18);\n  --dshpc-open-bg-soft:rgba(96,165,250,.08);\n  --dshpc-card-hover:rgba(96,165,250,.13);\n  /* 语义色**浅底**（深色版）：用户嫌深色的绿 / 红「有点深」⇒ 压到 **5%**（浅色段是 8%），\n     更贴近面板底色、存在感更弱；块底与状态色竖条仍同源（竖条是实色，不受这条影响）。 */\n  --dshpc-success-soft:color-mix(in srgb,var(--dshpc-success) 5%,transparent);\n  --dshpc-warning-soft:color-mix(in srgb,var(--dshpc-warning) 5%,transparent);\n  --dshpc-danger-soft:color-mix(in srgb,var(--dshpc-danger) 5%,transparent);\n  --dshpc-business-soft:color-mix(in srgb,var(--dshpc-business) 5%,transparent);\n  /* 扩展色深色派生：底色写死、hover 掺白 12%/22%（同 business，防白字发糊），soft 5%。 */\n  --dshpc-purple-hover:color-mix(in srgb,var(--dshpc-purple) 88%,#ffffff);\n  --dshpc-purple-active:color-mix(in srgb,var(--dshpc-purple) 78%,#ffffff);\n  --dshpc-purple-soft:color-mix(in srgb,var(--dshpc-purple) 5%,transparent);\n  --dshpc-pink-hover:color-mix(in srgb,var(--dshpc-pink) 88%,#ffffff);\n  --dshpc-pink-active:color-mix(in srgb,var(--dshpc-pink) 78%,#ffffff);\n  --dshpc-pink-soft:color-mix(in srgb,var(--dshpc-pink) 5%,transparent);\n  --dshpc-cyan-hover:color-mix(in srgb,var(--dshpc-cyan) 88%,#ffffff);\n  --dshpc-cyan-active:color-mix(in srgb,var(--dshpc-cyan) 78%,#ffffff);\n  --dshpc-cyan-soft:color-mix(in srgb,var(--dshpc-cyan) 5%,transparent);\n  --dshpc-teal-hover:color-mix(in srgb,var(--dshpc-teal) 88%,#ffffff);\n  --dshpc-teal-active:color-mix(in srgb,var(--dshpc-teal) 78%,#ffffff);\n  --dshpc-teal-soft:color-mix(in srgb,var(--dshpc-teal) 5%,transparent);\n  --dshpc-orange-hover:color-mix(in srgb,var(--dshpc-orange) 88%,#ffffff);\n  --dshpc-orange-active:color-mix(in srgb,var(--dshpc-orange) 78%,#ffffff);\n  --dshpc-orange-soft:color-mix(in srgb,var(--dshpc-orange) 5%,transparent);\n  --dshpc-indigo-hover:color-mix(in srgb,var(--dshpc-indigo) 88%,#ffffff);\n  --dshpc-indigo-active:color-mix(in srgb,var(--dshpc-indigo) 78%,#ffffff);\n  --dshpc-indigo-soft:color-mix(in srgb,var(--dshpc-indigo) 5%,transparent);\n  --dshpc-rose-hover:color-mix(in srgb,var(--dshpc-rose) 88%,#ffffff);\n  --dshpc-rose-active:color-mix(in srgb,var(--dshpc-rose) 78%,#ffffff);\n  --dshpc-rose-soft:color-mix(in srgb,var(--dshpc-rose) 5%,transparent);\n  --dshpc-slate-hover:color-mix(in srgb,var(--dshpc-slate) 88%,#ffffff);\n  --dshpc-slate-active:color-mix(in srgb,var(--dshpc-slate) 78%,#ffffff);\n  --dshpc-slate-soft:color-mix(in srgb,var(--dshpc-slate) 5%,transparent);\n  /* 「选中面」（深色版，2026-10-06）：掺 **~40% 背景色**（--dshpc-surface-base）⇒ 无限接近页面背景的黑、\n     只比背景略深一点点（用户：深色下展开区压着任务透明绿会发灰，底色要尽量贴近背景才不显灰）。\n     ⚠️ 深色下不能掺文字色 —— 那是白，会变亮，选中反而比本月日期浅。 */\n  --dshpc-selected-bg:color-mix(in srgb,var(--dshpc-surface-1) 60%,var(--dshpc-surface-base));\n  /* ListRow 选中面（暗色版）：slate 掺到 26% —— 深底上泛蓝灰，绝不退回接近背景的黑。\n     slate 是中明度蓝灰，暗底上要比亮色掺得更浓才看得出（亮色 14% / 暗色 26%）。 */\n  --dshpc-listrow-selected-bg:color-mix(in srgb,var(--dshpc-slate) 26%,transparent);\n  /* 暗色 hover：常态 6% 白 → 10% 白，只提亮一点点（原来是 active 的 24% 白，太跳）。 */\n  --dshpc-listrow-hover-bg:rgba(255,255,255,.10);\n  /* 任务日程页本月格的默认底（深色版，2026-10-06）：深的、带点灰蓝的暗色（用户给的参考图 ≈ #23262e），\n     比原来的卡片面更沉、更偏蓝灰；选中格仍走 --dshpc-selected-bg（更暗一档），层级不变。 */\n  --dshpc-cal-cell-bg:#23262e;\n  /* 任务日程页本月格 hover 底（深色段，2026-10-06）：原先走 --dshpc-hover（宿主浅色叠加）在深底上显得\n     「灰发亮」，不好看 ⇒ 换成更贴底的蓝调微亮（与 open-bg-soft 同族），hover 时不刺眼、又有反馈。 */\n  --dshpc-cal-cell-hover:rgba(96,165,250,.12);\n  /* 任务日程页展开面板底（深色段，2026-10-06 续）：与原 selected-bg 暗值一致，深色 UI 不动 */\n  --dshpc-cal-panel-bg:color-mix(in srgb,var(--dshpc-surface-1) 60%,var(--dshpc-surface-base));\n}\n\n/* ── 细滚动条 + 离边 1px：全库唯一真源 ─────────────────────────────────\n   放在 tokens 域（ensureComponentStyles 每次必注册、且排在所有控件域之前）：\n   任何组件只要给滚动容器挂 .dshpc-scroll-thin 就生效，不必另行注入 panel 域。\n   改线宽 / 让位 / 圆角 / 颜色只改这一处；别在别的 CSS 里再抄一份。\n\n   只用 ::-webkit-scrollbar：一旦写 scrollbar-width，Chrome 会切到规范化滚动条、\n   忽略这里的宽度（2026-11-06 实测：留着 scrollbar-width:thin 时宽度回到 ~10px）。\n   2026-11-06 用户口径：1px 太细 ⇒ 线宽起步 2px、thumb 上下端圆角；现行值见下面三行。\n\n   让位（滚动条与容器可见边缘隔 1px）也由这个类负责：原生滚动条画在 padding box 之外、\n   border 之内，只有 border 能把它推离边缘（加 padding 无效）。挂类即自动让位，\n   容器不必自己再写透明边框。方向档（CSS 没有 :scrollable，推不出滚动方向，须显式声明）：\n     .dshpc-scroll-thin          竖滚（默认）：右让位\n     .dshpc-scroll-thin--x       横滚：底让位，且不叠右\n     .dshpc-scroll-thin--both    双向：右 + 底都让位\n   --x / --both 必须与基类同挂（线宽规则只认基类）。\n\n   挂 .dshpc-panel 的容器本身已有实色边框 ⇒ :not(.dshpc-panel) 跳过让位：滚动条贴那条\n   实色线即算让位，无条件叠透明边框会把实色右边框覆盖成透明。\n   CodeMirror 的 .cm-scroller 由官方生成、挂不上类 ⇒ 后代选择器一并命中线宽与让位；\n   它只让右不让底：给底会改 scroller 高度，CodeMirror 的测量循环会多算一条横滚条。\n   外层若自己不滚（如 CodeViewer），把 --dshpc-scroll-inset-right 设 0px 关掉自身让位，\n   免得外层与 .cm-scroller 两层各 1px 叠成 2px。 */\n/* ⚠️ 下面三行的线宽 / 圆角**必须是字面量**：WebKit 的 ::-webkit-scrollbar 系列伪元素\n   不解析 var()，带变量的声明会被静默丢弃 ⇒ 宽度整条作废、退回默认值。2026-11-06 把\n   width:2px 改成 var(--dshpc-scroll-w) 后真机当场打回（用户发现），故线宽不放 token。\n   改线宽只改这一块的三处数字（三处必须同值）；让位仍走 --dshpc-scroll-inset。 */\n.dshpc-scroll-thin::-webkit-scrollbar,\n.dshpc-scroll-thin .cm-scroller::-webkit-scrollbar{width:3px;height:3px}\n.dshpc-scroll-thin::-webkit-scrollbar-thumb,\n.dshpc-scroll-thin .cm-scroller::-webkit-scrollbar-thumb{background:var(--dshpc-border-heavy);border-radius:3px}\n.dshpc-scroll-thin::-webkit-scrollbar-track,\n.dshpc-scroll-thin .cm-scroller::-webkit-scrollbar-track{background:transparent}\n.dshpc-scroll-thin:not(.dshpc-panel){border-right:var(--dshpc-scroll-inset-right,var(--dshpc-scroll-inset)) solid transparent}\n.dshpc-scroll-thin--x:not(.dshpc-panel){border-right:0;border-bottom:var(--dshpc-scroll-inset) solid transparent}\n.dshpc-scroll-thin--both:not(.dshpc-panel){border-bottom:var(--dshpc-scroll-inset) solid transparent}\n.dshpc-scroll-thin .cm-scroller{border-right:var(--dshpc-scroll-inset) solid transparent}\n";
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/design/style-kit.js
		/** 全生态统一的 CSS 变量前缀。 */
		const CSS_PREFIX = "dshpc";
		/** token 域固定名：变量定义必须先于消费它的规则出现。 */
		const TOKENS_DOMAIN = "tokens";
		/**
		* 领一套本插件专属的样式设施。
		*
		* 为什么是工厂而不是模块级单例：单例只有一个固定 style id，
		* 多个插件同处一页时会抢同一个 `<style>` 标签、后挂载的覆盖先挂载的（见需求文档 §5.2）。
		*/
		function createStyleKit(options) {
			const { id } = options;
			if (id === "") throw new Error("dsh-plugin-core/design: id 不能为空");
			const tokensCss = TOKENS_CSS_TEMPLATE;
			const domains = /* @__PURE__ */ new Map();
			let tag = null;
			let dirty = true;
			const composeCss = () => {
				const entries = [...domains.entries()];
				entries.sort((a, b) => a[0] === TOKENS_DOMAIN ? -1 : b[0] === TOKENS_DOMAIN ? 1 : 0);
				return entries.map(([, css]) => css).join("\n");
			};
			const flush = () => {
				if (tag === null) return;
				tag.textContent = composeCss();
				dirty = false;
			};
			const ensureStyles = () => {
				if (typeof document === "undefined") return;
				if (tag === null || !tag.isConnected) {
					const head = document.head;
					if (head === null) return;
					const found = document.getElementById(id);
					if (found !== null) tag = found;
					else {
						const el = document.createElement("style");
						el.id = id;
						head.appendChild(el);
						tag = el;
					}
					dirty = true;
				}
				if (dirty) flush();
			};
			const registerStyle = (domain, css) => {
				if (domains.get(domain) === css) return;
				domains.set(domain, css);
				dirty = true;
				if (tag?.isConnected === true) flush();
			};
			const dispose = () => {
				if (tag?.isConnected === true) tag.remove();
				tag = null;
				domains.clear();
				dirty = true;
			};
			return {
				id,
				tokensCss,
				cssVar: (name) => `--${CSS_PREFIX}-${name}`,
				registerStyle,
				ensureStyles,
				dispose,
				applyStyle: (domain, css) => {
					registerStyle(domain, css);
					ensureStyles();
				}
			};
		}
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/ui/infra/css.js
		/**
		* 当前插件的样式设施。
		*
		* 为什么是模块级而不是 React Context：core 会被**内联进每个插件各自的 bundle**，
		* 模块级变量天然按插件隔离（不像共享运行时那样会互相踩）。
		* 插件启动时 `setStyleKit(createStyleKit({ id }))` 一次即可；不设就走默认 kit。
		*/
		let current = createStyleKit({ id: "dsh-plugin-core-ui" });
		function setStyleKit(kit) {
			current = kit;
		}
		/**
		* 确保某个控件自己的样式已登记、且 `<style>` 已挂载（幂等，可直接在 render 里调）。
		*
		* 每个控件**只传自己那份 CSS**：把它依赖的那 1~2 份传进来即可，绝不能顺手把别人的拼上去
		* （一拼就又退化成全量，包体省不下来）。同理，若是某份 CSS 里带上下文限定的修饰
		* （如 `.dshpc-split .dshpc-seg`），那份由提供上下文的控件自己负责，消费者不用管。
		*
		* @param domain 本控件的样式域，repo 内唯一。
		* @param css 该控件自己的 CSS 文本。
		* @param kit 样式设施（默认取当前插件的 kit）。
		*/
		function ensureComponentStyles(domain, css, kit = current) {
			kit.registerStyle("tokens", kit.tokensCss);
			kit.applyStyle(domain, css);
		}
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/utils/i18n.js
		/**
		* utils 自带的最小多语言。
		*
		* 原则（需求文档 §5.4）：**核心提供什么，核心就负责它的多语言** —— utils 里要吐文案的函数
		* （如相对时间）自带中英字典；插件**自己界面**的文案仍由插件自己管，这里不提供插件级 i18n 框架。
		* 需要覆盖时传自己的 `t` 进来即可。
		*/
		const DICT = {
			zh: {
				sessionLoading: "加载会话…",
				sessionFailed: "会话加载失败",
				sessionEmpty: "该会话暂无内容",
				explorerLoading: "加载中…",
				loadingDefault: "数据加载中",
				explorerFailed: "加载失败",
				explorerRoot: "工作区",
				explorerTruncated: "条目过多，已截断",
				explorerEmptyDir: "空目录",
				explorerLevels: "选择层级",
				explorerExpand: "展开",
				explorerCollapse: "收起",
				explorerEnter: "进入",
				explorerRootDir: "根目录",
				explorerRootName: "（工作区根目录）",
				explorerCrumbsAria: "目录路径",
				explorerPickFile: "选择此文件",
				explorerPickDir: "选择",
				explorerPickDirAria: "选择此目录（连带其下所有文件）",
				previewClose: "关闭",
				previewCopyPath: "复制路径",
				previewRefresh: "刷新",
				previewRender: "预览",
				previewSource: "源码",
				previewMdSwitchAria: "切换渲染或源码",
				previewHtmlSwitchAria: "切换渲染或源码",
				previewLoadMore: "加载更多",
				previewTruncated: "内容过大，仅显示前 {n}",
				previewOfficeUnavailable: "Office 预览不可用",
				previewOfficeNoSession: "Office 预览不可用（还没有任何会话）",
				previewRenderFailed: "预览渲染失败",
				previewBadPayload: "返回数据不符合预期",
				previewOutside: "路径在工作区之外",
				previewNotFound: "文件不存在",
				previewNotDirectory: "不是文件夹",
				previewNotFile: "暂不支持此类型文件的预览",
				previewTooLarge: "文件过大，无法预览",
				previewNotText: "暂不支持此类型文件的预览",
				previewFailedCode: "加载失败（{code}）",
				mdCopy: "复制",
				mdCopied: "已复制",
				mdCode: "代码",
				mdWrap: "换行",
				mdUnwrap: "取消换行",
				mdFootnotes: "脚注",
				cardToggle: "展开/收起",
				tableEmpty: "暂无数据",
				tableLoading: "正在加载…",
				tableLoadingMore: "加载中…",
				tableNoMore: "没有更多数据",
				paginationAria: "分页",
				paginationPrev: "上一页",
				paginationNext: "下一页",
				paginationPage: "第 {n} 页",
				paginationTotal: "第 {from}-{to} 条，共 {total} 条",
				paginationTotalZero: "共 0 条",
				paginationPageSizeOption: "{n} 条/页",
				paginationPageSizeAria: "每页条数",
				modalClose: "关闭",
				dockClose: "关闭面板",
				dockResize: "拖动调整宽度",
				dockCollapse: "收起面板",
				dockExpand: "展开面板",
				backToTop: "回到顶部",
				quickToolbarAria: "快捷工具栏",
				errorRetry: "重试",
				confirm: "确定",
				cancel: "取消",
				dialogOk: "知道了",
				pickerPlaceholder: "请选择",
				pickerClear: "不选",
				pickerEmpty: "暂无可选",
				pickerNoMatch: "无匹配项",
				pickerSearch: "搜索…",
				pickerSelected: "已选 {n} 项",
				pickerMaxReached: "最多选 {n} 项",
				pickerDegraded: "候选可能不完整",
				pickerMore: "显示更多",
				modelProvider: "供应商",
				modelModel: "模型",
				modelDefault: "默认模型",
				workspaceAll: "所有工作区",
				relNow: "刚刚",
				relInJustNow: "即将",
				relInMinutes: "{n} 分钟后",
				relInHours: "{n} 小时后",
				relInDays: "{n} 天后",
				relInMonths: "{n} 个月后",
				relInYears: "{n} 年后",
				relJustNow: "刚刚",
				relMinutesAgo: "{n} 分钟前",
				relHoursAgo: "{n} 小时前",
				relDaysAgo: "{n} 天前",
				relWeeksAgo: "{n} 周前",
				relMonthsAgo: "{n} 个月前",
				relYearsAgo: "{n} 年前",
				codeCopy: "复制",
				codeCopied: "已复制",
				sessionUnknownKind: "未支持的节点类型：",
				sessionLoadOlder: "加载更早记录",
				sessionProcess: "过程",
				triggerRequest: "收到执行请求",
				triggerGoal: "继续执行目标",
				triggerAgent: "收到任务消息",
				triggerTeam: "收到团队消息",
				triggerSubagent: "子任务状态更新",
				triggerGithub: "收到 GitHub 事件",
				triggerWebhook: "收到外部事件",
				triggerSchedule: "定时任务",
				triggerJob: "后台任务状态更新",
				triggerPlugin: "插件状态更新",
				triggerExplanation: "这条通知触发了本轮回复。",
				turnProcessTook: "已完成，用时 ",
				turnProcessWorked: "已完成",
				turnProcessFailed: "处理失败",
				turnStopped: "已停止",
				chatDeepDiving: "深度求索中",
				chatDeepDivingFor: "深度求索中，用时 {duration} ···",
				reasoningRunning: "运行中",
				jsonTruncated: "… 已截断，共 {total} 字符",
				referenceSummary: "引用会话 · {labels}",
				referenceSeparator: "、",
				thinkLabel: "思考",
				durationSecondUnit: "秒",
				durationMinuteUnit: "分",
				durationHourUnit: "小时",
				durationMilliseconds: "{milliseconds}毫秒",
				retryActive: "正在重试模型请求",
				retryCancelled: "模型请求重试已取消",
				retryStarted: "已重试模型请求",
				retryScheduled: "等待重试模型请求",
				retryStatus: "{label}（{retry}/{maximum}） · {seconds}s",
				retryDelay: "重试延迟：",
				retryFailure: "失败原因：",
				turnErrorTitle: "本轮运行失败",
				accountStopped: "任务已停止",
				maxTokensTitle: "已达到输出 token 上限",
				maxTokensHint: "回答被截断，已有输出保留在对话中。发送“继续”可让模型接着输出。",
				failureInterrupted: "DSH 进程在本轮完成前退出（例如被强制结束、崩溃或关闭超时），重新启动后本轮已中止。未完成的工具调用结果未知。",
				failureAuth: "API 密钥无效",
				failureQuota: "当前请求的额度已用尽",
				failureAccountSignedOut: "任务已因退出 DeepSeek 登录而停止。",
				failureAccountSignInRequired: "请先登录 DeepSeek，并确认请求地址支持账号认证。",
				clockDate: "{m}月{d}日",
				clockDateYear: "{y}年{m}月{d}日",
				copyLabel: "复制",
				copiedLabel: "已复制",
				branchLabel: "在新对话中分支",
				branchUnavailableLabel: "只读会话记录不可分支",
				turnUsageTitle: "本轮用量",
				turnUsageModel: "提供方 / 模型",
				turnUsageCacheHit: "缓存命中",
				turnUsageInput: "未缓存输入",
				turnUsageCacheRead: "缓存读取",
				turnUsageCacheWrite: "缓存写入",
				turnUsageOutput: "输出",
				turnUsageReasoning: "（其中推理 {tokens}）",
				turnUsageConsumed: "用量 {total}",
				turnUsageCount: "{count} tok",
				numberThousand: "{value}K",
				numberMillion: "{value}M",
				numberGroupSeparator: ",",
				stepProcessDoneThinking: "已完成分析",
				stepProcessDoneRead: "已读取文件",
				stepProcessDoneReadImage: "已读取图片",
				stepProcessDoneWrite: "已写入文件",
				stepProcessDoneSearch: "已搜索代码",
				stepProcessDoneEdit: "修改了文件",
				stepProcessDoneCommands: "执行了命令",
				stepProcessDoneCode: "运行了代码",
				stepProcessDoneWebSearch: "已搜索网页",
				stepProcessDoneWebFetch: "已访问网页",
				stepProcessDoneSubagents: "已协调子智能体",
				stepProcessDonePlan: "更新了计划",
				stepProcessDoneQuestions: "向用户提出了问题",
				stepProcessDoneTools: "已调用工具",
				stepProcessJoinTwo: "{first}并{second}",
				stepProcessComma: "，",
				stepProcessSharedPrefix: "已",
				stepProcessMore: "{title}等",
				toolTitleRead: "读取",
				toolTitleReadImage: "读取图片",
				toolTitleGrep: "搜索文件内容",
				toolTitleGlob: "查找文件",
				toolTitleBash: "运行命令",
				toolTitleWrite: "写入",
				toolTitleEdit: "编辑",
				toolTitleCode: "代码",
				toolTitleWebSearch: "网页搜索",
				toolTitleWebFetch: "网页获取",
				toolTitleGeneric: "工具调用",
				toolTitleSearch: "搜索",
				skillRowTitle: "加载技能",
				skillRowPreparing: "准备加载技能",
				skillRowRunning: "正在加载 skill",
				skillRowFailed: "skill 加载失败",
				skillRowStopped: "skill 加载已中止",
				skillRowInstructions: "说明",
				toolInputLabel: "输入",
				toolImageSize: "{width}x{height}px，{bytes}",
				toolImageSizeDownscaled: "{width}x{height}px（由 {originalWidth}x{originalHeight}px 缩小），{bytes}",
				toolCommandArguments: "命令参数",
				toolPreparingContent: "{kilobytes} KB",
				compactionTitle: "上下文已压缩",
				toolTitleTodo: "更新任务清单",
				toolTitlePwsh: "运行命令",
				toolTitleAsk: "提问",
				askAnswered: "{answered}/{total} 已回答",
				askSkipped: "未回答",
				askCancelled: "已取消",
				askCancelledDetail: "本轮已取消，未提交回答",
				askInterrupted: "已中断",
				askInterruptedDetail: "本轮已中断，未提交回答",
				askWaiting: "等待回答",
				detailState: "状态",
				detailGoalEmpty: "没有目标",
				detailGoalDisarmed: "等待继续",
				detailGoalActive: "进行中",
				detailGoalPaused: "已暂停",
				detailGoalBlocked: "受阻",
				detailGoalComplete: "已完成",
				detailGoalRounds: "执行轮次",
				detailGoalReason: "受阻原因",
				detailScheduleCount: "{count} 个定时任务",
				detailScheduleEmpty: "没有定时任务",
				detailScheduleDeleted: "已删除",
				detailScheduleOnce: "单次",
				detailScheduleEvery: "每 {interval}",
				detailDays: "{count} 天",
				detailHours: "{count} 小时",
				detailMinutes: "{count} 分钟",
				detailSeconds: "{count} 秒",
				detailScheduleDaily: "每天 {time}（{zone}）",
				detailScheduleWeekly: "每周 {days} {time}（{zone}）",
				detailScheduleCron: "Cron {expression}（{zone}）",
				detailScheduleWhen: "计划时间",
				detailScheduleFrequency: "重复",
				detailScheduleScheduled: "等待触发",
				detailScheduleOverdue: "已到期，等待会话恢复",
				detailWeekdayJoin: "、",
				detailWeekday1: "周一",
				detailWeekday2: "周二",
				detailWeekday3: "周三",
				detailWeekday4: "周四",
				detailWeekday5: "周五",
				detailWeekday6: "周六",
				detailWeekday7: "周日",
				detailAgentReply: "智能体回复",
				detailAgentsCount: "{count} 个智能体",
				detailEmpty: "暂无结果",
				detailEventNeighbors: "前后事件",
				detailFieldAgent: "智能体 ID",
				detailFieldAgents: "启动智能体数",
				detailFieldAvailability: "可用状态",
				detailFieldBestMatch: "最相关事件",
				detailFieldCallId: "调用 ID",
				detailFieldContent: "内容",
				detailFieldContext: "上下文",
				detailFieldCurrentPackage: "当前包",
				detailFieldData: "数据",
				detailFieldDependencies: "前置任务",
				detailFieldDepth: "层级",
				detailFieldDiagnostics: "诊断",
				detailFieldExitCode: "退出码",
				detailFieldId: "ID",
				detailFieldInputSchema: "输入 Schema",
				detailFieldJob: "任务 ID",
				detailFieldLatestRun: "最近运行",
				detailFieldMessage: "消息",
				detailFieldMessageId: "消息 ID",
				detailFieldMethods: "方法",
				detailFieldModel: "模型",
				detailFieldNextPackage: "待运行的包",
				detailFieldOutputSchema: "输出 Schema",
				detailFieldOwner: "负责人",
				detailFieldPackages: "版本包",
				detailFieldParent: "父级",
				detailFieldPid: "进程 ID",
				detailFieldPlatform: "平台",
				detailFieldPreviousStatus: "中断前状态",
				detailFieldProcessGroup: "进程组",
				detailFieldProps: "属性",
				detailFieldProvider: "提供方",
				detailFieldReady: "可开始",
				detailFieldRegistrations: "注册项",
				detailFieldResult: "结果",
				detailFieldRevision: "版本",
				detailFieldRole: "角色",
				detailFieldRoot: "根节点",
				detailFieldSeq: "事件序号",
				detailFieldSignal: "信号",
				detailFieldSource: "来源",
				detailFieldStep: "步骤",
				detailFieldSurface: "记录状态",
				detailFieldTarget: "目标事件",
				detailFieldTask: "任务内容",
				detailFieldTime: "时间",
				detailFieldTurn: "轮次",
				detailFieldType: "类型",
				detailFieldWarnings: "提示",
				detailFieldWriteScopes: "文件范围",
				detailJobsCount: "{count} 个后台任务",
				detailLocation: "第 {line} 行，第 {column} 列",
				detailLocationsCount: "{count} 个位置",
				detailMatchesCapped: "已达到结果上限，可缩小搜索范围",
				detailMatchesCount: "{count} 条匹配",
				detailModelsTitle: "可用模型",
				detailMoreInInspect: "另有 {count} 项，可在「查看」中读取",
				detailNo: "否",
				detailNone: "无",
				detailOutputLines: "第 {begin}–{end} 行，共 {total} 行",
				detailOutputTruncated: "输出已截断",
				detailPluginsCount: "{count} 个动态插件",
				detailProvidersCount: "{count} 个检查提供方",
				detailRalphLimit: "已达到轮次上限",
				detailRalphReportedBlocker: "智能体报告受阻",
				detailRalphReportedComplete: "智能体报告完成",
				detailReceiptAlreadyFinished: "任务已结束",
				detailReceiptCancel: "已请求取消",
				detailReceiptClosed: "已关闭",
				detailReceiptClosing: "关闭中",
				detailReceiptDelivered: "消息已送达",
				detailReceiptInterrupt: "已请求中断",
				detailReceiptSignal: "信号已发送",
				detailReceiptStarted: "已启动",
				detailRecordedResult: "调用结果",
				detailReportNextSteps: "待完成事项",
				detailStatusAccepted: "已接收",
				detailStatusCompleted: "已完成",
				detailStatusDeleted: "已删除",
				detailStatusExited: "已退出",
				detailStatusFailed: "失败",
				detailStatusIdle: "空闲",
				detailStatusInactive: "未运行",
				detailStatusKilled: "已取消",
				detailStatusProvisioning: "准备中",
				detailStatusQueued: "已入队",
				detailStatusReady: "就绪",
				detailStatusRunning: "运行中",
				detailTasksCount: "{count} 个团队任务",
				detailTasksNextPage: "后面还有任务；下一页位置为 {cursor}",
				detailTerminalsCount: "{count} 个终端",
				detailTodoCompleted: "已完成",
				detailTodoEmpty: "任务清单为空",
				detailTodoInProgress: "进行中",
				detailTodoPending: "待处理",
				detailTraceAncestors: "祖先会话",
				detailTraceDerived: "派生事件",
				detailTraceDescendants: "后代会话",
				detailTraceReplacedBy: "被替换为",
				detailTraceReplacementChain: "替换链",
				detailTraceReplaces: "替换的事件",
				detailTraceSources: "引用来源",
				detailWaitChanged: "检测到变化",
				detailWaitNoProgress: "没有正在运行的子智能体",
				detailWaitTimeout: "等待超时",
				detailWaitTitle: "子智能体状态",
				detailWorkflowScript: "工作流脚本",
				detailYes: "是",
				toolTitleInspect: "查询 Cordis 环境",
				toolTitleRunCordis: "运行 Cordis 插件",
				toolTitleStopCordis: "停止 Cordis 插件",
				toolTitleRemoveCordis: "移除 Cordis 插件",
				toolTitleInspectProviders: "检查提供方",
				toolTitleQueryRuntime: "查询运行时",
				toolTitleInspectPlugins: "检查动态插件",
				toolTitleCreateGoal: "创建目标",
				toolTitleGetGoal: "查看目标",
				toolTitleUpdateGoal: "更新目标",
				toolTitleCreateSchedule: "创建定时任务",
				toolTitleListSchedules: "查看定时任务",
				toolTitleDeleteSchedule: "删除定时任务",
				toolTitleUpdateSchedule: "修改定时任务",
				toolTitleWorkflow: "运行工作流",
				toolTitleRalph: "运行循环工作流",
				toolTitleReadEvent: "读取事件",
				toolTitleSearchEvents: "搜索事件",
				toolTitleTraceEvent: "追踪事件",
				toolTitleSearchSessions: "搜索会话",
				toolTitleTraceSession: "追踪会话",
				toolTitleListModels: "查看可用模型",
				toolTitleSubagent: "创建子智能体",
				toolTitleListAgents: "查看子智能体",
				toolTitleSendMessage: "发送消息",
				toolTitleInterruptAgent: "中断智能体",
				toolTitleListJobs: "查看后台任务",
				toolTitleReadJob: "读取任务输出",
				toolTitleKillJob: "取消后台任务",
				toolTitleOpenTerminal: "创建终端",
				toolTitleReadTerminal: "读取终端",
				toolTitleListTerminals: "查看终端",
				toolTitleSignalTerminal: "发送终端信号",
				toolTitleCloseTerminal: "关闭终端",
				toolTitleLsp: "查询代码符号",
				toolTitleSpawnTeammate: "创建队友",
				toolTitleCreateTeamTask: "创建团队任务",
				toolTitleGetTeamTask: "读取团队任务",
				toolTitleUpdateTeamTask: "更新团队任务",
				toolTitleListTeamTasks: "查看团队任务",
				toolTitleWaitAgent: "等待子智能体",
				todoCompleted: "已完成 {done}/{total}",
				skillSummary: "技能 · {names}",
				skillSeparator: "、",
				compactionCompleted: "已压缩 {items} 条历史记录（约 {tokens} tokens）",
				compactionExpand: "点击查看压缩摘要",
				compactionUnavailable: "压缩摘要不可用",
				contextInjection: "上下文注入",
				contextRecall: "跨会话召回",
				contextInstrLoaded: "已载入",
				contextInstrAdded: "已新增",
				contextInstrUpdated: "已更新",
				contextInstrRemoved: "已移除",
				contextCatalogReplaced: "替换目录",
				contextCatalogMore: "…还有 {count} 条",
				contextSnapshotSupersedes: "取代先前的快照",
				contextRelayFrom: "来自会话 {session}",
				contextRecallCounts: "保留 {retained} 条 · 省略 {omitted} 条",
				contextRecallTruncated: "已截断",
				toolAdded: "已添加工具：{name}",
				toolRemoved: "已移除工具：{name}",
				toolsAdded: "新增：{names}",
				toolsAddedCount: "新增 {count} 个",
				toolsChanged: "新增 {added} 个，移除 {removed} 个",
				toolsRemoved: "移除：{names}",
				toolsRemovedCount: "移除 {count} 个",
				toolsUpdated: "工具已更新",
				toolOutputLabel: "输出",
				rowPreparing: "正在准备调用",
				rowRunning: "运行中",
				rowFailed: "失败",
				rowStopped: "已停止",
				commandRunning: "执行中…",
				commandFailed: "指令失败",
				commandDone: "已完成",
				commandTitle: "指令",
				collapseLabel: "收起",
				readWindow: "显示 {shown} / {total} 行",
				readCollapseAria: "收起内容",
				readExpandAria: "展开其余 {count} 行",
				readExpandRest: "… 其余 {count} 行",
				searchPaths: "{shown} 个路径",
				searchPathsTruncated: "显示 {shown} / 共 {total} 个路径",
				searchMatches: "{shown} 处匹配 · {files} 个文件",
				searchMatchesTruncated: "显示 {shown} / 共 {total} 处匹配 · {files} 个文件",
				searchNoResults: "无结果",
				searchCollapseAria: "收起结果",
				searchExpandAria: "展开其余 {count} 行结果",
				searchExpandRest: "… 其余 {count} 行",
				webNoResults: "未找到结果",
				webSourcesTruncated: "来源列表已截断",
				webHttp: "HTTP",
				webContentTruncated: "内容已截断",
				terminalSignal: "信号 {signal}",
				terminalExitCode: "退出码 {code}",
				terminalNoExitCode: "未正常退出",
				terminalRunning: "运行中",
				terminalFailed: "失败",
				terminalDone: "已完成",
				terminalNoOutput: "无输出",
				terminalCollapseAria: "收起输出",
				terminalExpandAria: "展开其余 {n} 行输出",
				terminalExpandRest: "… 其余 {n} 行",
				terminalCommandLine: "第 {n} 行",
				terminalSendInput: "（发送输入）",
				terminalSession: "终端 {sessionId}",
				codeBlockLabel: "代码块",
				diffWrapLabel: "自动换行",
				diffUnwrapLabel: "取消换行",
				diffCollapseAria: "收起差异",
				diffExpandAria: "展开其余 {count} 行差异",
				diffExpandRest: "… 其余 {count} 行",
				sessionArchived: "已归档",
				sessionHeading: "会话预览",
				changesSingle: "已编辑 {name}",
				changesMulti: "已编辑 {count} 个文件",
				changesBinary: "二进制文件",
				changesAll: "全部 {count} 个文件",
				changesCollapse: "收起",
				changesOversized: "文件过大",
				diffLoading: "正在读取改动…",
				diffMissing: "这轮改动的内容已不可用",
				diffError: "无法读取改动",
				diffBinary: "二进制文件，无法显示改动",
				diffOversized: "文件过大，无法显示改动",
				diffCreated: "本轮新建的文件",
				diffDeleted: "本轮删除的文件",
				diffUnchanged: "两侧内容相同",
				diffCoarse: "逐行对比超时，按整个文件替换显示",
				diffTruncated: "只显示前 {count} 行",
				diffWrap: "自动换行",
				diffNowrap: "取消换行",
				continueBranch: "继续对话",
				forkConfirmTitle: "开分支继续对话",
				forkConfirmText: "是否需要基于此会话开一个新分支继续对话？原会话保持只读留档，新分支复制本会话内容并可继续对话。",
				forkConfirmAccept: "开分支并跳转",
				forkWorking: "正在开分支…",
				forkFailed: "开分支失败：{error}",
				forkUnavailable: "开分支能力未就位：调用方没有提供 forkSession，无法继续对话。",
				deliverRowTitle: "交付文件",
				deliverRowPreparing: "准备交付",
				deliverRowRunning: "正在交付",
				deliverRowOk: "已交付",
				deliverRowError: "交付失败",
				deliverRowStopped: "已中断",
				deliverFileLabel: "文件",
				deliverPreviewHint: "预览",
				deliverReveal: "在文件夹中显示",
				deliverPreviewCard: "预览 {name}",
				deliverAll: "全部 {count} 个文件",
				deliverCollapse: "收起",
				deliverExpandAria: "展开全部 {count} 个交付文件",
				deliverCollapseAria: "收起交付文件列表",
				composerPlaceholder: "继续说点什么…",
				dtPlaceholder: "请选择日期时间",
				dtStart: "开始",
				dtEnd: "结束",
				dtToday: "今天",
				dtNow: "现在",
				dtClear: "清除",
				dtHour: "时",
				dtMinute: "分",
				dtSecond: "秒",
				dtPrevYear: "上一年",
				dtPrevMonth: "上一月",
				dtNextMonth: "下一月",
				dtNextYear: "下一年",
				dtInvalidRange: "结束时间早于开始时间",
				fieldClear: "清空",
				fieldDecrease: "减少",
				fieldIncrease: "增加",
				inputUndo: "撤销",
				inputAction: "操作",
				sessionImage: "[图片]",
				sessionImageOpenNamed: "{label}，点击查看原图",
				sessionImageLoading: "图片加载中…",
				sessionImageLoadFailed: "图片加载失败，点击重试",
				sessionImagePreview: "原图预览",
				sessionImageClosePreview: "关闭原图预览",
				sessionProbeStyle: "官方样式未命中（当前为自绘回退）"
			},
			en: {
				sessionLoading: "Loading session…",
				sessionFailed: "Failed to load session",
				sessionEmpty: "No content in this session",
				explorerLoading: "Loading…",
				loadingDefault: "Loading",
				explorerFailed: "Failed to load",
				explorerRoot: "Workspace",
				explorerTruncated: "Too many entries, truncated",
				explorerEmptyDir: "Empty folder",
				explorerLevels: "Jump to level",
				explorerExpand: "Expand",
				explorerCollapse: "Collapse",
				explorerEnter: "Open",
				explorerRootDir: "Root",
				explorerRootName: "(workspace root)",
				explorerCrumbsAria: "Breadcrumb",
				explorerPickFile: "Pick this file",
				explorerPickDir: "Select",
				explorerPickDirAria: "Pick this folder (with everything under it)",
				previewClose: "Close",
				previewCopyPath: "Copy path",
				previewRefresh: "Refresh",
				previewRender: "Preview",
				previewSource: "Source",
				previewMdSwitchAria: "Toggle render or source",
				previewHtmlSwitchAria: "Toggle render or source",
				previewLoadMore: "Load more",
				previewTruncated: "Content too large, showing first {n}",
				previewOfficeUnavailable: "Office preview unavailable",
				previewOfficeNoSession: "Office preview unavailable (no session yet)",
				previewRenderFailed: "Failed to render preview",
				previewBadPayload: "Unexpected response payload",
				previewOutside: "Path is outside the workspace",
				previewNotFound: "File not found",
				previewNotDirectory: "Not a folder",
				previewNotFile: "Preview not supported for this file type",
				previewTooLarge: "File too large to preview",
				previewNotText: "Preview not supported for this file type",
				previewFailedCode: "Failed to load ({code})",
				mdCopy: "Copy",
				mdCopied: "Copied",
				mdCode: "Code",
				mdWrap: "Wrap",
				mdUnwrap: "Unwrap",
				mdFootnotes: "Footnotes",
				cardToggle: "Expand/Collapse",
				tableEmpty: "No data",
				tableLoading: "Loading…",
				tableLoadingMore: "Loading more…",
				tableNoMore: "No more data",
				paginationAria: "Pagination",
				paginationPrev: "Previous",
				paginationNext: "Next",
				paginationPage: "Page {n}",
				paginationTotal: "{from}-{to} of {total}",
				paginationTotalZero: "0 items",
				paginationPageSizeOption: "{n} / page",
				paginationPageSizeAria: "Rows per page",
				modalClose: "Close",
				dockClose: "Close panel",
				dockResize: "Drag to resize",
				dockCollapse: "Collapse panel",
				dockExpand: "Expand panel",
				backToTop: "Back to top",
				quickToolbarAria: "Quick toolbar",
				errorRetry: "Retry",
				confirm: "Confirm",
				cancel: "Cancel",
				dialogOk: "OK",
				pickerPlaceholder: "Select…",
				pickerClear: "None",
				pickerEmpty: "No options",
				pickerNoMatch: "No match",
				pickerSearch: "Search…",
				pickerSelected: "{n} selected",
				pickerMaxReached: "Up to {n}",
				pickerDegraded: "List may be incomplete",
				pickerMore: "Show more",
				modelProvider: "Provider",
				modelModel: "Model",
				modelDefault: "Default model",
				workspaceAll: "All workspaces",
				relNow: "just now",
				relInJustNow: "soon",
				relInMinutes: "in {n}m",
				relInHours: "in {n}h",
				relInDays: "in {n}d",
				relInMonths: "in {n}mo",
				relInYears: "in {n}y",
				relJustNow: "just now",
				relMinutesAgo: "{n}m ago",
				relHoursAgo: "{n}h ago",
				relDaysAgo: "{n}d ago",
				relWeeksAgo: "{n}w ago",
				relMonthsAgo: "{n}mo ago",
				relYearsAgo: "{n}y ago",
				codeCopy: "Copy",
				codeCopied: "Copied",
				sessionUnknownKind: "Unsupported node kind: ",
				sessionLoadOlder: "Load earlier messages",
				sessionProcess: "Process",
				triggerRequest: "Execution request received",
				triggerGoal: "Continuing the goal",
				triggerAgent: "Task message received",
				triggerTeam: "Team message received",
				triggerSubagent: "Subagent status update",
				triggerGithub: "GitHub event received",
				triggerWebhook: "External event received",
				triggerSchedule: "Scheduled task",
				triggerJob: "Background task status update",
				triggerPlugin: "Plugin status update",
				triggerExplanation: "This notification triggered the reply below.",
				turnProcessTook: "Completed in ",
				turnProcessWorked: "Completed",
				turnProcessFailed: "Failed",
				turnStopped: "Stopped",
				chatDeepDiving: "Thinking",
				chatDeepDivingFor: "Deep diving for {duration} ···",
				reasoningRunning: "Running",
				jsonTruncated: "… truncated, {total} characters total",
				referenceSummary: "Referenced session · {labels}",
				referenceSeparator: ", ",
				thinkLabel: "Think",
				durationSecondUnit: "s",
				durationMinuteUnit: "m ",
				durationHourUnit: "h ",
				durationMilliseconds: "{milliseconds}ms",
				retryActive: "Retrying model request",
				retryCancelled: "Model request retry cancelled",
				retryStarted: "Retried model request",
				retryScheduled: "Waiting to retry model request",
				retryStatus: "{label} ({retry}/{maximum}) · {seconds}s",
				retryDelay: "Retry delay: ",
				retryFailure: "Failure reason: ",
				turnErrorTitle: "This turn failed",
				accountStopped: "Task stopped",
				maxTokensTitle: "Output token limit reached",
				maxTokensHint: "The reply was cut off; earlier output is preserved in the conversation. Send \"continue\" to let the model resume.",
				failureInterrupted: "The DSH process exited before this turn finished (for example, it was killed, crashed, or timed out while shutting down), so the turn was closed when DSH restarted. Unfinished tool calls have unknown outcomes.",
				failureAuth: "API key is invalid",
				failureQuota: "Request quota exhausted.",
				failureAccountSignedOut: "Stopped because you signed out of DeepSeek.",
				failureAccountSignInRequired: "Sign in to DeepSeek and ensure the request destination supports account authentication.",
				clockDate: "{m}/{d}",
				clockDateYear: "{y}/{m}/{d}",
				copyLabel: "Copy",
				copiedLabel: "Copied",
				branchLabel: "Branch into a new conversation",
				branchUnavailableLabel: "A read-only transcript cannot be branched",
				turnUsageTitle: "Turn usage",
				turnUsageModel: "Provider / model",
				turnUsageCacheHit: "Cache hit",
				turnUsageInput: "Uncached input",
				turnUsageCacheRead: "Cached input",
				turnUsageCacheWrite: "Cache write",
				turnUsageOutput: "Output",
				turnUsageReasoning: " ({tokens} reasoning)",
				turnUsageConsumed: "Usage {total}",
				turnUsageCount: "{count} tok",
				numberThousand: "{value}K",
				numberMillion: "{value}M",
				numberGroupSeparator: ",",
				stepProcessDoneThinking: "Analysis completed",
				stepProcessDoneRead: "Read files",
				stepProcessDoneReadImage: "Read images",
				stepProcessDoneWrite: "Wrote files",
				stepProcessDoneSearch: "Searched code",
				stepProcessDoneEdit: "Edited files",
				stepProcessDoneCommands: "Ran commands",
				stepProcessDoneCode: "Ran code",
				stepProcessDoneWebSearch: "Searched the web",
				stepProcessDoneWebFetch: "Fetched web pages",
				stepProcessDoneSubagents: "Coordinated subagents",
				stepProcessDonePlan: "Updated the plan",
				stepProcessDoneQuestions: "Asked you questions",
				stepProcessDoneTools: "Called tools",
				stepProcessJoinTwo: "{first} and {second}",
				stepProcessComma: ", ",
				stepProcessSharedPrefix: "",
				stepProcessMore: "{title}, etc.",
				toolTitleRead: "Read",
				toolTitleReadImage: "Read image",
				toolTitleGrep: "Grep",
				toolTitleGlob: "Glob",
				toolTitleBash: "Bash",
				toolTitleWrite: "Write",
				toolTitleEdit: "Edit",
				toolTitleCode: "Code",
				toolTitleWebSearch: "Search",
				toolTitleWebFetch: "Fetch",
				toolTitleGeneric: "Tool call",
				toolTitleSearch: "Search",
				skillRowTitle: "Skill",
				skillRowPreparing: "Preparing to load a skill",
				skillRowRunning: "Loading skill",
				skillRowFailed: "Skill load failed",
				skillRowStopped: "Skill load stopped",
				skillRowInstructions: "Instructions",
				toolInputLabel: "IN",
				toolImageSize: "{width}x{height}px, {bytes}",
				toolImageSizeDownscaled: "{width}x{height}px (downscaled from {originalWidth}x{originalHeight}px), {bytes}",
				toolCommandArguments: "Command arguments",
				toolPreparingContent: "{kilobytes} KB",
				compactionTitle: "Context compacted",
				toolTitleTodo: "Update to-do list",
				toolTitlePwsh: "Pwsh",
				toolTitleAsk: "Ask question",
				askAnswered: "{answered}/{total} answered",
				askSkipped: "Not answered",
				askCancelled: "cancelled",
				askCancelledDetail: "This question set was cancelled before answers were submitted.",
				askInterrupted: "interrupted",
				askInterruptedDetail: "This question set was interrupted before answers were submitted.",
				askWaiting: "waiting",
				detailState: "Status",
				detailGoalEmpty: "No goal",
				detailGoalDisarmed: "Awaiting continuation",
				detailGoalActive: "Active",
				detailGoalPaused: "Paused",
				detailGoalBlocked: "Blocked",
				detailGoalComplete: "Completed",
				detailGoalRounds: "Rounds",
				detailGoalReason: "Blocker",
				detailScheduleCount: "{count} reminders",
				detailScheduleEmpty: "No reminders",
				detailScheduleDeleted: "Deleted",
				detailScheduleOnce: "Once",
				detailScheduleEvery: "Every {interval}",
				detailDays: "{count} d",
				detailHours: "{count} h",
				detailMinutes: "{count} min",
				detailSeconds: "{count} s",
				detailScheduleDaily: "Every day at {time} ({zone})",
				detailScheduleWeekly: "Weekly on {days} at {time} ({zone})",
				detailScheduleCron: "Cron {expression} ({zone})",
				detailScheduleWhen: "Scheduled for",
				detailScheduleFrequency: "Repeat",
				detailScheduleScheduled: "Scheduled",
				detailScheduleOverdue: "Overdue, awaiting session resume",
				detailWeekdayJoin: ",",
				detailWeekday1: "Mon",
				detailWeekday2: "Tue",
				detailWeekday3: "Wed",
				detailWeekday4: "Thu",
				detailWeekday5: "Fri",
				detailWeekday6: "Sat",
				detailWeekday7: "Sun",
				detailAgentReply: "Agent response",
				detailAgentsCount: "{count} agents",
				detailEmpty: "No results",
				detailEventNeighbors: "Surrounding events",
				detailFieldAgent: "Agent ID",
				detailFieldAgents: "Agents started",
				detailFieldAvailability: "Availability",
				detailFieldBestMatch: "Best match",
				detailFieldCallId: "Call ID",
				detailFieldContent: "Content",
				detailFieldContext: "Context",
				detailFieldCurrentPackage: "Current package",
				detailFieldData: "Data",
				detailFieldDependencies: "Dependencies",
				detailFieldDepth: "Depth",
				detailFieldDiagnostics: "Diagnostics",
				detailFieldExitCode: "Exit code",
				detailFieldId: "ID",
				detailFieldInputSchema: "Input schema",
				detailFieldJob: "Job ID",
				detailFieldLatestRun: "Latest run",
				detailFieldMessage: "Message",
				detailFieldMessageId: "Message ID",
				detailFieldMethods: "Methods",
				detailFieldModel: "Model",
				detailFieldNextPackage: "Next package",
				detailFieldOutputSchema: "Output schema",
				detailFieldOwner: "Owner",
				detailFieldPackages: "Packages",
				detailFieldParent: "Parent",
				detailFieldPid: "Process ID",
				detailFieldPlatform: "Platform",
				detailFieldPreviousStatus: "Previous status",
				detailFieldProcessGroup: "Process group",
				detailFieldProps: "Props",
				detailFieldProvider: "Provider",
				detailFieldReady: "Ready",
				detailFieldRegistrations: "Registrations",
				detailFieldResult: "Result",
				detailFieldRevision: "Revision",
				detailFieldRole: "Role",
				detailFieldRoot: "Root",
				detailFieldSeq: "Event sequence",
				detailFieldSignal: "Signal",
				detailFieldSource: "Source",
				detailFieldStep: "Step",
				detailFieldSurface: "Record status",
				detailFieldTarget: "Target event",
				detailFieldTask: "Task",
				detailFieldTime: "Time",
				detailFieldTurn: "Turn",
				detailFieldType: "Type",
				detailFieldWarnings: "Warnings",
				detailFieldWriteScopes: "Write scopes",
				detailJobsCount: "{count} background jobs",
				detailLocation: "Line {line}, column {column}",
				detailLocationsCount: "{count} locations",
				detailMatchesCapped: "Result limit reached; narrow the search for more",
				detailMatchesCount: "{count} matches",
				detailModelsTitle: "Available models",
				detailMoreInInspect: "{count} more items available in Inspect",
				detailNo: "No",
				detailNone: "None",
				detailOutputLines: "Lines {begin}–{end} of {total}",
				detailOutputTruncated: "Output truncated",
				detailPluginsCount: "{count} dynamic plugins",
				detailProvidersCount: "{count} inspect providers",
				detailRalphLimit: "Round limit reached",
				detailRalphReportedBlocker: "Worker reported a blocker",
				detailRalphReportedComplete: "Worker reported completion",
				detailReceiptAlreadyFinished: "Already finished",
				detailReceiptCancel: "Cancellation requested",
				detailReceiptClosed: "Closed",
				detailReceiptClosing: "Closing",
				detailReceiptDelivered: "Message delivered",
				detailReceiptInterrupt: "Interrupt requested",
				detailReceiptSignal: "Signal delivered",
				detailReceiptStarted: "Started",
				detailRecordedResult: "Recorded result",
				detailReportNextSteps: "Remaining work",
				detailStatusAccepted: "Accepted",
				detailStatusCompleted: "Completed",
				detailStatusDeleted: "Deleted",
				detailStatusExited: "Exited",
				detailStatusFailed: "Failed",
				detailStatusIdle: "Idle",
				detailStatusInactive: "Inactive",
				detailStatusKilled: "Cancelled",
				detailStatusProvisioning: "Provisioning",
				detailStatusQueued: "Queued",
				detailStatusReady: "Ready",
				detailStatusRunning: "Running",
				detailTasksCount: "{count} team tasks",
				detailTasksNextPage: "More tasks available; next cursor is {cursor}",
				detailTerminalsCount: "{count} terminals",
				detailTodoCompleted: "Completed",
				detailTodoEmpty: "The to-do list is empty",
				detailTodoInProgress: "In progress",
				detailTodoPending: "Pending",
				detailTraceAncestors: "Ancestor sessions",
				detailTraceDerived: "Derived events",
				detailTraceDescendants: "Descendant sessions",
				detailTraceReplacedBy: "Replaced by",
				detailTraceReplacementChain: "Replacement chain",
				detailTraceReplaces: "Replaced events",
				detailTraceSources: "Source events",
				detailWaitChanged: "Change detected",
				detailWaitNoProgress: "No active subagents",
				detailWaitTimeout: "Wait timed out",
				detailWaitTitle: "Subagent activity",
				detailWorkflowScript: "Workflow script",
				detailYes: "Yes",
				toolTitleInspect: "Query Cordis environment",
				toolTitleRunCordis: "Run Cordis Plugin",
				toolTitleStopCordis: "Stop Cordis Plugin",
				toolTitleRemoveCordis: "Remove Cordis Plugin",
				toolTitleInspectProviders: "Inspect providers",
				toolTitleQueryRuntime: "Query runtime",
				toolTitleInspectPlugins: "Inspect plugins",
				toolTitleCreateGoal: "Create goal",
				toolTitleGetGoal: "View goal",
				toolTitleUpdateGoal: "Update goal",
				toolTitleCreateSchedule: "Create reminder",
				toolTitleListSchedules: "List reminders",
				toolTitleDeleteSchedule: "Delete reminder",
				toolTitleUpdateSchedule: "Update reminder",
				toolTitleWorkflow: "Run workflow",
				toolTitleRalph: "Run ralph loop",
				toolTitleReadEvent: "Read event",
				toolTitleSearchEvents: "Search events",
				toolTitleTraceEvent: "Trace event",
				toolTitleSearchSessions: "Search sessions",
				toolTitleTraceSession: "Trace session",
				toolTitleListModels: "List models",
				toolTitleSubagent: "Create subagent",
				toolTitleListAgents: "List subagents",
				toolTitleSendMessage: "Send message",
				toolTitleInterruptAgent: "Interrupt agent",
				toolTitleListJobs: "List background jobs",
				toolTitleReadJob: "Read job output",
				toolTitleKillJob: "Cancel background job",
				toolTitleOpenTerminal: "Open terminal",
				toolTitleReadTerminal: "Read terminal",
				toolTitleListTerminals: "List terminals",
				toolTitleSignalTerminal: "Signal terminal",
				toolTitleCloseTerminal: "Close terminal",
				toolTitleLsp: "Query code symbols",
				toolTitleSpawnTeammate: "Create teammate",
				toolTitleCreateTeamTask: "Create team task",
				toolTitleGetTeamTask: "Read team task",
				toolTitleUpdateTeamTask: "Update team task",
				toolTitleListTeamTasks: "List team tasks",
				toolTitleWaitAgent: "Wait for subagent",
				todoCompleted: "{done}/{total} done",
				skillSummary: "Skills · {names}",
				skillSeparator: ", ",
				compactionCompleted: "Compacted {items} history items (~{tokens} tokens)",
				compactionExpand: "Click to view the compaction summary",
				compactionUnavailable: "Compaction summary unavailable",
				contextInjection: "Context injection",
				contextRecall: "Cross-session recall",
				contextInstrLoaded: "loaded",
				contextInstrAdded: "added",
				contextInstrUpdated: "updated",
				contextInstrRemoved: "removed",
				contextCatalogReplaced: "Replacement catalog",
				contextCatalogMore: "… {count} more",
				contextSnapshotSupersedes: "Supersedes earlier snapshots",
				contextRelayFrom: "From session {session}",
				contextRecallCounts: "{retained} kept · {omitted} omitted",
				contextRecallTruncated: "truncated",
				toolAdded: "Added tool: {name}",
				toolRemoved: "Removed tool: {name}",
				toolsAdded: "Added: {names}",
				toolsAddedCount: "{count} added",
				toolsChanged: "{added} added, {removed} removed",
				toolsRemoved: "Removed: {names}",
				toolsRemovedCount: "{count} removed",
				toolsUpdated: "Tools updated",
				toolOutputLabel: "OUT",
				rowPreparing: "Preparing tool call",
				rowRunning: "Running",
				rowFailed: "Failed",
				rowStopped: "Stopped",
				commandRunning: "Running…",
				commandFailed: "Command failed",
				commandDone: "Completed",
				commandTitle: "Command",
				collapseLabel: "Collapse",
				readWindow: "Showing {shown} of {total} lines",
				readCollapseAria: "Collapse content",
				readExpandAria: "Expand {count} more lines",
				readExpandRest: "… {count} more lines",
				searchPaths: "{shown} paths",
				searchPathsTruncated: "Showing {shown} of {total} paths",
				searchMatches: "{shown} matches · {files} files",
				searchMatchesTruncated: "Showing {shown} of {total} matches · {files} files",
				searchNoResults: "No results",
				searchCollapseAria: "Collapse results",
				searchExpandAria: "Expand {count} more result lines",
				searchExpandRest: "… {count} more lines",
				webNoResults: "No results found",
				webSourcesTruncated: "Source list truncated",
				webHttp: "HTTP",
				webContentTruncated: "Content truncated",
				terminalSignal: "signal {signal}",
				terminalExitCode: "exit code {code}",
				terminalNoExitCode: "no exit code",
				terminalRunning: "Running",
				terminalFailed: "Failed",
				terminalDone: "Done",
				terminalNoOutput: "No output",
				terminalCollapseAria: "Collapse output",
				terminalExpandAria: "Expand the remaining {n} output lines",
				terminalExpandRest: "… {n} more lines",
				terminalCommandLine: "line {n}",
				terminalSendInput: "(send input)",
				terminalSession: "Terminal {sessionId}",
				codeBlockLabel: "Code",
				diffWrapLabel: "Wrap lines",
				diffUnwrapLabel: "Unwrap lines",
				diffCollapseAria: "Collapse diff",
				diffExpandAria: "Expand {count} more diff lines",
				diffExpandRest: "… {count} more lines",
				sessionArchived: "Archived",
				sessionHeading: "Session preview",
				changesSingle: "Edited {name}",
				changesMulti: "Edited {count} files",
				changesBinary: "Binary file",
				changesAll: "All {count} files",
				changesCollapse: "Collapse",
				changesOversized: "File too large",
				diffLoading: "Reading changes…",
				diffMissing: "The contents of this turn’s changes are no longer available",
				diffError: "Could not read the changes",
				diffBinary: "Binary file; changes cannot be shown",
				diffOversized: "File too large; changes cannot be shown",
				diffCreated: "Created in this turn",
				diffDeleted: "Deleted in this turn",
				diffUnchanged: "Both sides hold the same lines",
				diffCoarse: "Line comparison timed out; shown as a whole-file replacement",
				diffTruncated: "Showing the first {count} lines",
				diffWrap: "Wrap lines",
				diffNowrap: "No wrap",
				continueBranch: "Continue conversation",
				forkConfirmTitle: "Fork to continue",
				forkConfirmText: "Start a new branch from this session to continue the conversation? The original stays read-only; the branch copies this conversation and can continue.",
				forkConfirmAccept: "Fork & open",
				forkWorking: "Forking…",
				forkFailed: "Fork failed: {error}",
				forkUnavailable: "Fork capability unavailable: the caller did not provide forkSession, so this conversation cannot be continued.",
				deliverRowTitle: "Present files",
				deliverRowPreparing: "Preparing deliverables",
				deliverRowRunning: "Delivering",
				deliverRowOk: "Delivered",
				deliverRowError: "Delivery failed",
				deliverRowStopped: "Interrupted",
				deliverFileLabel: "File",
				deliverPreviewHint: "Preview",
				deliverReveal: "Show in folder",
				deliverPreviewCard: "Preview {name}",
				deliverAll: "All {count} files",
				deliverCollapse: "Collapse",
				deliverExpandAria: "Expand all {count} delivered files",
				deliverCollapseAria: "Collapse the delivered-files list",
				composerPlaceholder: "Say something to continue…",
				dtPlaceholder: "Date & time",
				dtStart: "Start",
				dtEnd: "End",
				dtToday: "Today",
				dtNow: "Now",
				dtClear: "Clear",
				dtHour: "h",
				dtMinute: "m",
				dtSecond: "s",
				dtPrevYear: "Previous year",
				dtPrevMonth: "Previous month",
				dtNextMonth: "Next month",
				dtNextYear: "Next year",
				dtInvalidRange: "End is before start",
				fieldClear: "Clear",
				fieldDecrease: "Decrease",
				fieldIncrease: "Increase",
				inputUndo: "Undo",
				inputAction: "Action",
				sessionImage: "[Image]",
				sessionImageOpenNamed: "{label}, click to view original",
				sessionImageLoading: "Loading image…",
				sessionImageLoadFailed: "Image failed to load; click to retry",
				sessionImagePreview: "Original image preview",
				sessionImageClosePreview: "Close original image preview",
				sessionProbeStyle: "Official styles not matched (using the self-drawn fallback)"
			}
		};
		/**
		* 宿主当前语言。官方 `@deepseek-ai/dsh-client-locale` 把生效语言写进 `<html lang>`
		* （zh → `zh-CN`，其余按语言 id），切语言时同步改写 ⇒ 这里读它即可，插件不必自己接 locale 服务。
		* 非浏览器环境（Node 自检）没有 document，回落 'zh'。
		*/
		function hostLocale() {
			if (typeof document === "undefined") return "zh";
			const tag = document.documentElement.lang !== "" ? document.documentElement.lang : navigator.language;
			if (tag === void 0 || tag === "") return "zh";
			return tag.toLowerCase().startsWith("zh") ? "zh" : "en";
		}
		function getLocale() {
			return hostLocale();
		}
		/** 用内置字典翻译一个 key；未知 key 直接回退 key 本身（不抛、不空白）。 */
		function t(key, vars) {
			const template = DICT[getLocale()][key] ?? DICT.zh[key] ?? key;
			if (vars === void 0) return template;
			return template.replace(/\{(\w+)\}/g, (whole, name) => {
				const value = vars[name];
				return value === void 0 ? whole : String(value);
			});
		}
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/ui/inputs/picker-logic.js
		/** 两种输入归一成 groups：给了 `options` 就当成一个无标题的组。 */
		function toGroups(groups, options) {
			if (groups !== void 0 && groups.length > 0) return groups;
			const flat = options ?? [];
			return flat.length === 0 ? [] : [{
				value: "",
				label: "",
				options: flat
			}];
		}
		function flattenOptions(groups) {
			const out = [];
			for (const g of groups) out.push(...g.options);
			return out;
		}
		/** 分组目录平铺成「厂商-模型」选项：value 原样不动，只给 label 加组名前缀。 */
		function toFlatOptions(groups) {
			return groups.flatMap((g) => g.options.map((o) => ({
				value: o.value,
				label: g.label === "" ? o.label : `${g.label}-${o.label}`
			})));
		}
		/** 按关键词过滤（大小写不敏感，匹配 label 与 keywords 拼起来的串；整组无命中则整组去掉）。 */
		function filterGroups(groups, query) {
			const q = query.trim().toLowerCase();
			if (q === "") return groups;
			const out = [];
			for (const g of groups) {
				const hit = g.options.filter((o) => `${o.label} ${o.keywords ?? ""}`.toLowerCase().includes(q));
				if (hit.length > 0) out.push({
					...g,
					options: hit
				});
			}
			return out;
		}
		/** 按选项条数跨组切片（首屏 limit 条）；count <= 0 视为不分页，整组没被截到就复用原对象。 */
		function sliceGroups(groups, count) {
			if (!(count > 0)) return groups;
			const out = [];
			let left = count;
			for (const g of groups) {
				if (left <= 0) break;
				out.push(left >= g.options.length ? g : {
					...g,
					options: g.options.slice(0, left)
				});
				left -= g.options.length;
			}
			return out;
		}
		/** 多选切换；`max` 达到上限时不再添加（返回原数组，不静默截断）。 */
		function toggleValue(current, value, max) {
			if (current.indexOf(value) >= 0) return current.filter((v) => v !== value);
			if (max !== void 0 && current.length >= max) return [...current];
			return [...current, value];
		}
		function labelsOf(groups, values) {
			const all = flattenOptions(groups);
			const out = [];
			for (const v of values) {
				const hit = all.find((o) => o.value === v);
				if (hit !== void 0) out.push(hit.label);
			}
			return out;
		}
		/** 值落在哪个组里（按模型值反推供应商等场景）。 */
		function groupOf(groups, value) {
			if (value === "") return void 0;
			return groups.find((g) => g.options.some((o) => o.value === value));
		}
		/**
		* 把「不在候选里的受控值」作为一条真实保留项插回目录（领域选择器用）。
		*
		* 目录刷新 / 供应商被摘掉后，调用方持有的旧值仍然真实存在；通用 `labelsOf` 找不到它就
		* 会让触发器退回 placeholder，级联态还会因反推不出 provider 把模型框禁用 —— 表现为
		* 静默丢掉用户的选择。这里按 `provider/id` 的前缀把旧值归到对应组（没有该组就补一组），
		* label 一律用旧值原文，绝不编造模型名。返回值 `retained` 供 degraded 提示使用。
		*
		* 通用 `Picker` 不调用它：纯零件的数据由调用方给，是否保留旧值由调用方决定。
		*/
		function retainSelectedValue(groups, value) {
			if (value === void 0 || value === "") return {
				groups,
				retained: false
			};
			if (flattenOptions(groups).some((o) => o.value === value)) return {
				groups,
				retained: false
			};
			const slash = value.indexOf("/");
			const provider = slash > 0 ? value.slice(0, slash) : "";
			const option = {
				value,
				label: value
			};
			const group = groups.find((g) => g.value === provider && g.value !== "");
			if (group !== void 0) return {
				groups: groups.map((g) => g === group ? {
					value: g.value,
					label: g.label,
					options: [option, ...g.options]
				} : g),
				retained: true
			};
			return {
				groups: [...groups, {
					value: provider,
					label: provider,
					options: [option]
				}],
				retained: true
			};
		}
		/** 触发器宽度解析：把 width / minWidth / maxWidth 译成内联样式。
		* 定宽（width）忽略 min/max 并锁定三值；否则各自生效，缺省沿用 CSS 默认（min 120px、max 100%）。
		* 数值按 px 处理，字符串原样透传。 */
		function resolveTriggerSizing(opts) {
			const px = (v) => typeof v === "number" ? `${v}px` : v;
			if (opts.width !== void 0) {
				const w = px(opts.width);
				return {
					width: w,
					minWidth: w,
					maxWidth: w
				};
			}
			const style = {};
			if (opts.minWidth !== void 0) style.minWidth = px(opts.minWidth);
			if (opts.maxWidth !== void 0) style.maxWidth = px(opts.maxWidth);
			return style;
		}
		/** 菜单宽度：至少与触发器同宽；搜索框设了下限时菜单跟着加宽，
		* 否则 100% 宽的搜索框会被菜单的 overflow:hidden 裁掉。
		* 8px = .dshpc-picker__head 左右各 4px 内距（改该 CSS 时同步改这里，有自检盯着）。
		* min-width 大于 max-width 时浏览器以 min-width 为准，所以显式设宽不会被 480 上限卡住。 */
		function resolveMenuSizing(referenceWidth, availableWidth, searchSizing) {
			const floor = searchSizing?.width ?? searchSizing?.minWidth;
			const cssLen = (v) => typeof v === "number" ? `${v}px` : v;
			return {
				minWidth: floor === void 0 ? `${referenceWidth}px` : `max(${referenceWidth}px, calc(${cssLen(floor)} + 8px))`,
				maxWidth: `${Math.min(480, availableWidth ?? 480)}px`
			};
		}
		//#endregion
		//#region node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs
		function hasWindow() {
			return typeof window !== "undefined";
		}
		function getNodeName(node) {
			if (isNode(node)) return (node.nodeName || "").toLowerCase();
			return "#document";
		}
		function getWindow(node) {
			var _node$ownerDocument;
			return (node == null || (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
		}
		function getDocumentElement(node) {
			var _ref;
			return (_ref = (isNode(node) ? node.ownerDocument : node.document) || window.document) == null ? void 0 : _ref.documentElement;
		}
		function isNode(value) {
			if (!hasWindow()) return false;
			return value instanceof Node || value instanceof getWindow(value).Node;
		}
		function isElement(value) {
			if (!hasWindow()) return false;
			return value instanceof Element || value instanceof getWindow(value).Element;
		}
		function isHTMLElement(value) {
			if (!hasWindow()) return false;
			return value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement;
		}
		function isShadowRoot(value) {
			if (!hasWindow() || typeof ShadowRoot === "undefined") return false;
			return value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot;
		}
		function isOverflowElement(element) {
			const { overflow, overflowX, overflowY, display } = getComputedStyle$1(element);
			return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && display !== "inline" && display !== "contents";
		}
		function isTableElement(element) {
			return /^(table|td|th)$/.test(getNodeName(element));
		}
		function isTopLayer(element) {
			try {
				if (element.matches(":popover-open")) return true;
			} catch (_e) {}
			try {
				return element.matches(":modal");
			} catch (_e) {
				return false;
			}
		}
		const willChangeRe = /transform|translate|scale|rotate|perspective|filter/;
		const containRe = /paint|layout|strict|content/;
		const isNotNone = (value) => !!value && value !== "none";
		let isWebKitValue;
		function isContainingBlock(elementOrCss) {
			const css = isElement(elementOrCss) ? getComputedStyle$1(elementOrCss) : elementOrCss;
			return isNotNone(css.transform) || isNotNone(css.translate) || isNotNone(css.scale) || isNotNone(css.rotate) || isNotNone(css.perspective) || !isWebKit() && (isNotNone(css.backdropFilter) || isNotNone(css.filter)) || willChangeRe.test(css.willChange || "") || containRe.test(css.contain || "");
		}
		function getContainingBlock(element) {
			let currentNode = getParentNode(element);
			while (isHTMLElement(currentNode) && !isLastTraversableNode(currentNode)) {
				if (isContainingBlock(currentNode)) return currentNode;
				else if (isTopLayer(currentNode)) return null;
				currentNode = getParentNode(currentNode);
			}
			return null;
		}
		function isWebKit() {
			if (isWebKitValue == null) isWebKitValue = typeof CSS !== "undefined" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none");
			return isWebKitValue;
		}
		function isLastTraversableNode(node) {
			return /^(html|body|#document)$/.test(getNodeName(node));
		}
		function getComputedStyle$1(element) {
			return getWindow(element).getComputedStyle(element);
		}
		function getNodeScroll(element) {
			if (isElement(element)) return {
				scrollLeft: element.scrollLeft,
				scrollTop: element.scrollTop
			};
			return {
				scrollLeft: element.scrollX,
				scrollTop: element.scrollY
			};
		}
		function getParentNode(node) {
			if (getNodeName(node) === "html") return node;
			const result = node.assignedSlot || node.parentNode || isShadowRoot(node) && node.host || getDocumentElement(node);
			return isShadowRoot(result) ? result.host : result;
		}
		function getNearestOverflowAncestor(node) {
			const parentNode = getParentNode(node);
			if (isLastTraversableNode(parentNode)) return (node.ownerDocument || node).body;
			if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) return parentNode;
			return getNearestOverflowAncestor(parentNode);
		}
		function getOverflowAncestors(node, list, traverseIframes) {
			var _node$ownerDocument2;
			if (list === void 0) list = [];
			if (traverseIframes === void 0) traverseIframes = true;
			const scrollableAncestor = getNearestOverflowAncestor(node);
			const isBody = scrollableAncestor === ((_node$ownerDocument2 = node.ownerDocument) == null ? void 0 : _node$ownerDocument2.body);
			const win = getWindow(scrollableAncestor);
			if (isBody) {
				const frameElement = getFrameElement(win);
				return list.concat(win, win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : [], frameElement && traverseIframes ? getOverflowAncestors(frameElement) : []);
			} else return list.concat(scrollableAncestor, getOverflowAncestors(scrollableAncestor, [], traverseIframes));
		}
		function getFrameElement(win) {
			return win.parent && Object.getPrototypeOf(win.parent) ? win.frameElement : null;
		}
		//#endregion
		//#region node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs
		const min = Math.min;
		const max = Math.max;
		const round = Math.round;
		const floor = Math.floor;
		const createCoords = (v) => ({
			x: v,
			y: v
		});
		const oppositeSideMap = {
			left: "right",
			right: "left",
			bottom: "top",
			top: "bottom"
		};
		function clamp(start, value, end) {
			return max(start, min(value, end));
		}
		function evaluate(value, param) {
			return typeof value === "function" ? value(param) : value;
		}
		function getSide(placement) {
			return placement.split("-")[0];
		}
		function getAlignment(placement) {
			return placement.split("-")[1];
		}
		function getOppositeAxis(axis) {
			return axis === "x" ? "y" : "x";
		}
		function getAxisLength(axis) {
			return axis === "y" ? "height" : "width";
		}
		function getSideAxis(placement) {
			const firstChar = placement[0];
			return firstChar === "t" || firstChar === "b" ? "y" : "x";
		}
		function getAlignmentAxis(placement) {
			return getOppositeAxis(getSideAxis(placement));
		}
		function getAlignmentSides(placement, rects, rtl) {
			if (rtl === void 0) rtl = false;
			const alignment = getAlignment(placement);
			const alignmentAxis = getAlignmentAxis(placement);
			const length = getAxisLength(alignmentAxis);
			let mainAlignmentSide = alignmentAxis === "x" ? alignment === (rtl ? "end" : "start") ? "right" : "left" : alignment === "start" ? "bottom" : "top";
			if (rects.reference[length] > rects.floating[length]) mainAlignmentSide = getOppositePlacement(mainAlignmentSide);
			return [mainAlignmentSide, getOppositePlacement(mainAlignmentSide)];
		}
		function getExpandedPlacements(placement) {
			const oppositePlacement = getOppositePlacement(placement);
			return [
				getOppositeAlignmentPlacement(placement),
				oppositePlacement,
				getOppositeAlignmentPlacement(oppositePlacement)
			];
		}
		function getOppositeAlignmentPlacement(placement) {
			return placement.includes("start") ? placement.replace("start", "end") : placement.replace("end", "start");
		}
		const lrPlacement = ["left", "right"];
		const rlPlacement = ["right", "left"];
		const tbPlacement = ["top", "bottom"];
		const btPlacement = ["bottom", "top"];
		function getSideList(side, isStart, rtl) {
			switch (side) {
				case "top":
				case "bottom":
					if (rtl) return isStart ? rlPlacement : lrPlacement;
					return isStart ? lrPlacement : rlPlacement;
				case "left":
				case "right": return isStart ? tbPlacement : btPlacement;
				default: return [];
			}
		}
		function getOppositeAxisPlacements(placement, flipAlignment, direction, rtl) {
			const alignment = getAlignment(placement);
			let list = getSideList(getSide(placement), direction === "start", rtl);
			if (alignment) {
				list = list.map((side) => side + "-" + alignment);
				if (flipAlignment) list = list.concat(list.map(getOppositeAlignmentPlacement));
			}
			return list;
		}
		function getOppositePlacement(placement) {
			const side = getSide(placement);
			return oppositeSideMap[side] + placement.slice(side.length);
		}
		function expandPaddingObject(padding) {
			var _padding$top, _padding$right, _padding$bottom, _padding$left;
			return {
				top: (_padding$top = padding.top) != null ? _padding$top : 0,
				right: (_padding$right = padding.right) != null ? _padding$right : 0,
				bottom: (_padding$bottom = padding.bottom) != null ? _padding$bottom : 0,
				left: (_padding$left = padding.left) != null ? _padding$left : 0
			};
		}
		function getPaddingObject(padding) {
			return typeof padding !== "number" ? expandPaddingObject(padding) : {
				top: padding,
				right: padding,
				bottom: padding,
				left: padding
			};
		}
		function rectToClientRect(rect) {
			const { x, y, width, height } = rect;
			return {
				width,
				height,
				top: y,
				left: x,
				right: x + width,
				bottom: y + height,
				x,
				y
			};
		}
		/*!
		* tabbable 6.5.1
		* @license MIT, https://github.com/focus-trap/tabbable/blob/master/LICENSE
		*/
		//#endregion
		//#region node_modules/@floating-ui/react/dist/floating-ui.react.utils.mjs
		var import_dist = (/* @__PURE__ */ __commonJSMin(((exports) => {
			var candidateSelector = /* #__PURE__ */ [
				"input:not([inert]):not([inert] *)",
				"select:not([inert]):not([inert] *)",
				"textarea:not([inert]):not([inert] *)",
				"a[href]:not([inert]):not([inert] *)",
				"area[href]:not([inert]):not([inert] *)",
				"button:not([inert]):not([inert] *)",
				"[tabindex]:not(slot):not([inert]):not([inert] *)",
				"audio[controls]:not([inert]):not([inert] *)",
				"video[controls]:not([inert]):not([inert] *)",
				"[contenteditable]:not([contenteditable=\"false\"]):not([inert]):not([inert] *)",
				"details>summary:first-of-type:not([inert]):not([inert] *)",
				"details:not([inert]):not([inert] *)"
			].join(",");
			var NoElement = typeof Element === "undefined";
			var matches = NoElement ? function() {} : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
			var getRootNode = !NoElement && Element.prototype.getRootNode ? function(element) {
				return element == null || element.getRootNode == null ? void 0 : element.getRootNode();
			} : function(element) {
				return element == null ? void 0 : element.ownerDocument;
			};
			/**
			* Determines if a node is inert or in an inert ancestor.
			* @param {Node} [node]
			* @param {boolean} [lookUp] If true and `node` is not inert, looks up at ancestors to
			*  see if any of them are inert. If false, only `node` itself is considered.
			* @returns {boolean} True if inert itself or by way of being in an inert ancestor.
			*  False if `node` is falsy.
			*/
			var _isInert = function isInert(node, lookUp) {
				if (lookUp === void 0) lookUp = true;
				var inertAtt = node == null || node.getAttribute == null ? void 0 : node.getAttribute("inert");
				return inertAtt === "" || inertAtt === "true" || lookUp && node && (typeof node.closest === "function" ? node.closest("[inert]") : _isInert(node.parentNode));
			};
			/**
			* Determines if a node's content is editable.
			* @param {Element} [node]
			* @returns True if it's content-editable; false if it's not or `node` is falsy.
			*/
			var isContentEditable = function isContentEditable(node) {
				var _node$getAttribute;
				var attValue = node == null || node.getAttribute == null || (_node$getAttribute = node.getAttribute("contenteditable")) == null ? void 0 : _node$getAttribute.toLowerCase();
				return attValue === "" || attValue === "true" || attValue === "plaintext-only";
			};
			/**
			* @param {Element} el container to check in
			* @param {boolean} includeContainer add container to check
			* @param {(node: Element) => boolean} filter filter candidates
			* @returns {Element[]}
			*/
			var getCandidates = function getCandidates(el, includeContainer, filter) {
				if (_isInert(el)) return [];
				var candidates = Array.prototype.slice.apply(el.querySelectorAll(candidateSelector));
				if (includeContainer && matches.call(el, candidateSelector)) candidates.unshift(el);
				candidates = candidates.filter(filter);
				return candidates;
			};
			/**
			* @callback GetShadowRoot
			* @param {Element} element to check for shadow root
			* @returns {ShadowRoot|boolean} ShadowRoot if available or boolean indicating if a shadowRoot is attached but not available.
			*/
			/**
			* @callback ShadowRootFilter
			* @param {Element} shadowHostNode the element which contains shadow content
			* @returns {boolean} true if a shadow root could potentially contain valid candidates.
			*/
			/**
			* @typedef {Object} CandidateScope
			* @property {Element} scopeParent contains inner candidates
			* @property {Element[]} candidates list of candidates found in the scope parent
			*/
			/**
			* @typedef {Object} IterativeOptions
			* @property {GetShadowRoot|boolean} getShadowRoot true if shadow support is enabled; falsy if not;
			*  if a function, implies shadow support is enabled and either returns the shadow root of an element
			*  or a boolean stating if it has an undisclosed shadow root
			* @property {(node: Element) => boolean} filter filter candidates
			* @property {boolean} flatten if true then result will flatten any CandidateScope into the returned list
			* @property {ShadowRootFilter} shadowRootFilter filter shadow roots;
			*/
			/**
			* @param {Element[]} elements list of element containers to match candidates from
			* @param {boolean} includeContainer add container list to check
			* @param {IterativeOptions} options
			* @returns {Array.<Element|CandidateScope>}
			*/
			var _getCandidatesIteratively = function getCandidatesIteratively(elements, includeContainer, options) {
				var candidates = [];
				var elementsToCheck = Array.from(elements);
				while (elementsToCheck.length) {
					var element = elementsToCheck.shift();
					if (_isInert(element, false)) continue;
					if (element.tagName === "SLOT") {
						var assigned = element.assignedElements();
						var nestedCandidates = _getCandidatesIteratively(assigned.length ? assigned : element.children, true, options);
						if (options.flatten) candidates.push.apply(candidates, nestedCandidates);
						else candidates.push({
							scopeParent: element,
							candidates: nestedCandidates
						});
					} else {
						if (matches.call(element, candidateSelector) && options.filter(element) && (includeContainer || !elements.includes(element))) candidates.push(element);
						var shadowRoot = element.shadowRoot || typeof options.getShadowRoot === "function" && options.getShadowRoot(element);
						var validShadowRoot = !_isInert(shadowRoot, false) && (!options.shadowRootFilter || options.shadowRootFilter(element));
						if (shadowRoot && validShadowRoot) {
							var _nestedCandidates = _getCandidatesIteratively(shadowRoot === true ? element.children : shadowRoot.children, true, options);
							if (options.flatten) candidates.push.apply(candidates, _nestedCandidates);
							else candidates.push({
								scopeParent: element,
								candidates: _nestedCandidates
							});
						} else elementsToCheck.unshift.apply(elementsToCheck, element.children);
					}
				}
				return candidates;
			};
			/**
			* @private
			* Determines if the node has an explicitly specified `tabindex` attribute.
			* @param {HTMLElement} node
			* @returns {boolean} True if so; false if not.
			*/
			var hasTabIndex = function hasTabIndex(node) {
				return !isNaN(parseInt(node.getAttribute("tabindex"), 10));
			};
			/**
			* Determine the tab index of a given node.
			* @param {HTMLElement} node
			* @returns {number} Tab order (negative, 0, or positive number).
			* @throws {Error} If `node` is falsy.
			*/
			var getTabIndex = function getTabIndex(node) {
				if (!node) throw new Error("No node provided");
				if (node.tabIndex < 0) {
					if ((/^(AUDIO|VIDEO|DETAILS)$/.test(node.tagName) || isContentEditable(node)) && !hasTabIndex(node)) return 0;
				}
				return node.tabIndex;
			};
			/**
			* Determine the tab index of a given node __for sort order purposes__.
			* @param {HTMLElement} node
			* @param {boolean} [isScope] True for a custom element with shadow root or slot that, by default,
			*  has tabIndex -1, but needs to be sorted by document order in order for its content to be
			*  inserted into the correct sort position.
			* @returns {number} Tab order (negative, 0, or positive number).
			*/
			var getSortOrderTabIndex = function getSortOrderTabIndex(node, isScope) {
				var tabIndex = getTabIndex(node);
				if (tabIndex < 0 && isScope && !hasTabIndex(node)) return 0;
				return tabIndex;
			};
			var sortOrderedTabbables = function sortOrderedTabbables(a, b) {
				return a.tabIndex === b.tabIndex ? a.documentOrder - b.documentOrder : a.tabIndex - b.tabIndex;
			};
			var isInput = function isInput(node) {
				return node.tagName === "INPUT";
			};
			var isHiddenInput = function isHiddenInput(node) {
				return isInput(node) && node.type === "hidden";
			};
			var isDetailsWithSummary = function isDetailsWithSummary(node) {
				return node.tagName === "DETAILS" && Array.prototype.slice.apply(node.children).some(function(child) {
					return child.tagName === "SUMMARY";
				});
			};
			var getCheckedRadio = function getCheckedRadio(nodes, form) {
				for (var i = 0; i < nodes.length; i++) if (nodes[i].checked && nodes[i].form === form) return nodes[i];
			};
			var isTabbableRadio = function isTabbableRadio(node) {
				if (!node.name) return true;
				var radioScope = node.form || getRootNode(node);
				var queryRadios = function queryRadios(name) {
					return radioScope.querySelectorAll("input[type=\"radio\"][name=\"" + name + "\"]");
				};
				var radioSet;
				if (typeof window !== "undefined" && typeof window.CSS !== "undefined" && typeof window.CSS.escape === "function") radioSet = queryRadios(window.CSS.escape(node.name));
				else try {
					radioSet = queryRadios(node.name);
				} catch (err) {
					console.error("Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s", err.message);
					return false;
				}
				var checked = getCheckedRadio(radioSet, node.form);
				return !checked || checked === node;
			};
			var isRadio = function isRadio(node) {
				return isInput(node) && node.type === "radio";
			};
			var isNonTabbableRadio = function isNonTabbableRadio(node) {
				return isRadio(node) && !isTabbableRadio(node);
			};
			var isNodeAttached = function isNodeAttached(node) {
				var _nodeRoot;
				var nodeRoot = node && getRootNode(node);
				var nodeRootHost = (_nodeRoot = nodeRoot) == null ? void 0 : _nodeRoot.host;
				var attached = false;
				if (nodeRoot && nodeRoot !== node) {
					var _nodeRootHost, _node$ownerDocument;
					attached = !!((_nodeRootHost = nodeRootHost) != null && (_nodeRootHost = _nodeRootHost.ownerDocument) != null && _nodeRootHost.contains(nodeRootHost) || node != null && (_node$ownerDocument = node.ownerDocument) != null && _node$ownerDocument.contains(node));
					while (!attached && nodeRootHost) {
						var _nodeRoot2, _nodeRootHost2;
						nodeRoot = getRootNode(nodeRootHost);
						nodeRootHost = (_nodeRoot2 = nodeRoot) == null ? void 0 : _nodeRoot2.host;
						attached = !!((_nodeRootHost2 = nodeRootHost) != null && (_nodeRootHost2 = _nodeRootHost2.ownerDocument) != null && _nodeRootHost2.contains(nodeRootHost));
					}
				}
				return attached;
			};
			var isZeroArea = function isZeroArea(node) {
				var _node$getBoundingClie = node.getBoundingClientRect(), width = _node$getBoundingClie.width, height = _node$getBoundingClie.height;
				return width === 0 && height === 0;
			};
			var isHidden = function isHidden(node, _ref) {
				var displayCheck = _ref.displayCheck, getShadowRoot = _ref.getShadowRoot;
				if (displayCheck === "full-native") {
					if ("checkVisibility" in node) return !node.checkVisibility({
						checkOpacity: false,
						opacityProperty: false,
						contentVisibilityAuto: true,
						visibilityProperty: true,
						checkVisibilityCSS: true
					});
				}
				var visibility = getComputedStyle(node).visibility;
				if (visibility === "hidden" || visibility === "collapse") return true;
				var nodeUnderDetails = matches.call(node, "details>summary:first-of-type") ? node.parentElement : node;
				if (matches.call(nodeUnderDetails, "details:not([open]) *")) return true;
				if (!displayCheck || displayCheck === "full" || displayCheck === "full-native" || displayCheck === "legacy-full") {
					if (typeof getShadowRoot === "function") {
						var originalNode = node;
						while (node) {
							var parentElement = node.parentElement;
							var rootNode = getRootNode(node);
							if (parentElement && !parentElement.shadowRoot && getShadowRoot(parentElement) === true) return isZeroArea(node);
							else if (node.assignedSlot) node = node.assignedSlot;
							else if (!parentElement && rootNode !== node.ownerDocument) node = rootNode.host;
							else node = parentElement;
						}
						node = originalNode;
					}
					if (isNodeAttached(node)) return !node.getClientRects().length;
					if (displayCheck !== "legacy-full") return true;
				} else if (displayCheck === "non-zero-area") return isZeroArea(node);
				return false;
			};
			var isDisabledFromFieldset = function isDisabledFromFieldset(node) {
				if (/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(node.tagName)) {
					var parentNode = node.parentElement;
					while (parentNode) {
						if (parentNode.tagName === "FIELDSET" && parentNode.disabled) {
							for (var i = 0; i < parentNode.children.length; i++) {
								var child = parentNode.children.item(i);
								if (child.tagName === "LEGEND") return matches.call(parentNode, "fieldset[disabled] *") ? true : !child.contains(node);
							}
							return true;
						}
						parentNode = parentNode.parentElement;
					}
				}
				return false;
			};
			var isNodeMatchingSelectorFocusable = function isNodeMatchingSelectorFocusable(options, node) {
				if (node.disabled || isHiddenInput(node) || isHidden(node, options) || isDetailsWithSummary(node) || isDisabledFromFieldset(node)) return false;
				return true;
			};
			var isNodeMatchingSelectorTabbable = function isNodeMatchingSelectorTabbable(options, node) {
				if (isNonTabbableRadio(node) || getTabIndex(node) < 0 || !isNodeMatchingSelectorFocusable(options, node)) return false;
				return true;
			};
			var isShadowRootTabbable = function isShadowRootTabbable(shadowHostNode) {
				var tabIndex = parseInt(shadowHostNode.getAttribute("tabindex"), 10);
				if (isNaN(tabIndex) || tabIndex >= 0) return true;
				return false;
			};
			/**
			* @param {Array.<Element|CandidateScope>} candidates
			* @returns Element[]
			*/
			var _sortByOrder = function sortByOrder(candidates) {
				var regularTabbables = [];
				var orderedTabbables = [];
				candidates.forEach(function(item, i) {
					var isScope = !!item.scopeParent;
					var element = isScope ? item.scopeParent : item;
					var candidateTabindex = getSortOrderTabIndex(element, isScope);
					var elements = isScope ? _sortByOrder(item.candidates) : element;
					if (candidateTabindex === 0) isScope ? regularTabbables.push.apply(regularTabbables, elements) : regularTabbables.push(element);
					else orderedTabbables.push({
						documentOrder: i,
						tabIndex: candidateTabindex,
						item,
						isScope,
						content: elements
					});
				});
				return orderedTabbables.sort(sortOrderedTabbables).reduce(function(acc, sortable) {
					sortable.isScope ? acc.push.apply(acc, sortable.content) : acc.push(sortable.content);
					return acc;
				}, []).concat(regularTabbables);
			};
			exports.tabbable = function tabbable(container, options) {
				options = options || {};
				var candidates;
				if (options.getShadowRoot) candidates = _getCandidatesIteratively([container], options.includeContainer, {
					filter: isNodeMatchingSelectorTabbable.bind(null, options),
					flatten: false,
					getShadowRoot: options.getShadowRoot,
					shadowRootFilter: isShadowRootTabbable
				});
				else candidates = getCandidates(container, options.includeContainer, isNodeMatchingSelectorTabbable.bind(null, options));
				return _sortByOrder(candidates);
			};
		})))();
		function isSafari() {
			return /apple/i.test(navigator.vendor);
		}
		function activeElement(doc) {
			let activeElement = doc.activeElement;
			while (((_activeElement = activeElement) == null || (_activeElement = _activeElement.shadowRoot) == null ? void 0 : _activeElement.activeElement) != null) {
				var _activeElement;
				activeElement = activeElement.shadowRoot.activeElement;
			}
			return activeElement;
		}
		function contains(parent, child) {
			if (!parent || !child) return false;
			const rootNode = child.getRootNode == null ? void 0 : child.getRootNode();
			if (parent.contains(child)) return true;
			if (rootNode && isShadowRoot(rootNode)) {
				let next = child;
				while (next) {
					if (parent === next) return true;
					next = next.parentNode || next.host;
				}
			}
			return false;
		}
		function getDocument(node) {
			return (node == null ? void 0 : node.ownerDocument) || document;
		}
		var index$1 = typeof document !== "undefined" ? react.useLayoutEffect : function noop() {};
		const useSafeInsertionEffect = { ...react }.useInsertionEffect || ((fn) => fn());
		function useEffectEvent(callback) {
			const ref = react.useRef(() => {});
			useSafeInsertionEffect(() => {
				ref.current = callback;
			});
			return react.useCallback(function() {
				for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
				return ref.current == null ? void 0 : ref.current(...args);
			}, []);
		}
		const getTabbableOptions = () => ({
			getShadowRoot: true,
			displayCheck: typeof ResizeObserver === "function" && ResizeObserver.toString().includes("[native code]") ? "full" : "none"
		});
		function getTabbableIn(container, dir) {
			const list = (0, import_dist.tabbable)(container, getTabbableOptions());
			const len = list.length;
			if (len === 0) return;
			const active = activeElement(getDocument(container));
			const index = list.indexOf(active);
			return list[index === -1 ? dir === 1 ? 0 : len - 1 : index + dir];
		}
		function getNextTabbable(referenceElement) {
			return getTabbableIn(getDocument(referenceElement).body, 1) || referenceElement;
		}
		function getPreviousTabbable(referenceElement) {
			return getTabbableIn(getDocument(referenceElement).body, -1) || referenceElement;
		}
		function isOutsideEvent(event, container) {
			const containerElement = container || event.currentTarget;
			const relatedTarget = event.relatedTarget;
			return !relatedTarget || !contains(containerElement, relatedTarget);
		}
		function disableFocusInside(container) {
			(0, import_dist.tabbable)(container, getTabbableOptions()).forEach((element) => {
				element.dataset.tabindex = element.getAttribute("tabindex") || "";
				element.setAttribute("tabindex", "-1");
			});
		}
		function enableFocusInside(container) {
			container.querySelectorAll("[data-tabindex]").forEach((element) => {
				const tabindex = element.dataset.tabindex;
				delete element.dataset.tabindex;
				if (tabindex) element.setAttribute("tabindex", tabindex);
				else element.removeAttribute("tabindex");
			});
		}
		//#endregion
		//#region node_modules/@floating-ui/core/dist/floating-ui.core.mjs
		function computeCoordsFromPlacement(_ref, placement, rtl) {
			let { reference, floating } = _ref;
			const sideAxis = getSideAxis(placement);
			const alignmentAxis = getAlignmentAxis(placement);
			const alignLength = getAxisLength(alignmentAxis);
			const side = getSide(placement);
			const isVertical = sideAxis === "y";
			const commonX = reference.x + reference.width / 2 - floating.width / 2;
			const commonY = reference.y + reference.height / 2 - floating.height / 2;
			const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2;
			let coords;
			switch (side) {
				case "top":
					coords = {
						x: commonX,
						y: reference.y - floating.height
					};
					break;
				case "bottom":
					coords = {
						x: commonX,
						y: reference.y + reference.height
					};
					break;
				case "right":
					coords = {
						x: reference.x + reference.width,
						y: commonY
					};
					break;
				case "left":
					coords = {
						x: reference.x - floating.width,
						y: commonY
					};
					break;
				default: coords = {
					x: reference.x,
					y: reference.y
				};
			}
			const alignment = getAlignment(placement);
			if (alignment) coords[alignmentAxis] += commonAlign * (alignment === "end" ? 1 : -1) * (rtl && isVertical ? -1 : 1);
			return coords;
		}
		/**
		* Resolves with an object of overflow side offsets that determine how much the
		* element is overflowing a given clipping boundary on each side.
		* - positive = overflowing the boundary by that number of pixels
		* - negative = how many pixels left before it will overflow
		* - 0 = lies flush with the boundary
		* @see https://floating-ui.com/docs/detectOverflow
		*/
		async function detectOverflow(state, options) {
			var _await$platform$isEle;
			if (options === void 0) options = {};
			const { x, y, platform, rects, elements, strategy } = state;
			const { boundary = "clippingAncestors", rootBoundary = "viewport", elementContext = "floating", altBoundary = false, padding = 0 } = evaluate(options, state);
			const paddingObject = getPaddingObject(padding);
			const element = elements[altBoundary ? elementContext === "floating" ? "reference" : "floating" : elementContext];
			const clippingClientRect = rectToClientRect(await platform.getClippingRect({
				element: ((_await$platform$isEle = await (platform.isElement == null ? void 0 : platform.isElement(element))) != null ? _await$platform$isEle : true) ? element : element.contextElement || await (platform.getDocumentElement == null ? void 0 : platform.getDocumentElement(elements.floating)),
				boundary,
				rootBoundary,
				strategy
			}));
			const rect = elementContext === "floating" ? {
				x,
				y,
				width: rects.floating.width,
				height: rects.floating.height
			} : rects.reference;
			const offsetParent = await (platform.getOffsetParent == null ? void 0 : platform.getOffsetParent(elements.floating));
			const offsetScale = await (platform.isElement == null ? void 0 : platform.isElement(offsetParent)) && await (platform.getScale == null ? void 0 : platform.getScale(offsetParent)) || {
				x: 1,
				y: 1
			};
			const elementClientRect = rectToClientRect(platform.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform.convertOffsetParentRelativeRectToViewportRelativeRect({
				elements,
				rect,
				offsetParent,
				strategy
			}) : rect);
			return {
				top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
				bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
				left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
				right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
			};
		}
		const MAX_RESET_COUNT = 50;
		/**
		* Computes the `x` and `y` coordinates that will place the floating element
		* next to a given reference element.
		*
		* This export does not have any `platform` interface logic. You will need to
		* write one for the platform you are using Floating UI with.
		*/
		const computePosition$1 = async (reference, floating, config) => {
			const { placement = "bottom", strategy = "absolute", middleware = [], platform } = config;
			const platformWithDetectOverflow = platform.detectOverflow ? platform : {
				...platform,
				detectOverflow
			};
			const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(floating));
			let rects = await platform.getElementRects({
				reference,
				floating,
				strategy
			});
			let { x, y } = computeCoordsFromPlacement(rects, placement, rtl);
			let statefulPlacement = placement;
			let resetCount = 0;
			const middlewareData = {};
			for (let i = 0; i < middleware.length; i++) {
				const currentMiddleware = middleware[i];
				if (!currentMiddleware) continue;
				const { name, fn } = currentMiddleware;
				const { x: nextX, y: nextY, data, reset } = await fn({
					x,
					y,
					initialPlacement: placement,
					placement: statefulPlacement,
					strategy,
					middlewareData,
					rects,
					platform: platformWithDetectOverflow,
					elements: {
						reference,
						floating
					}
				});
				x = nextX != null ? nextX : x;
				y = nextY != null ? nextY : y;
				middlewareData[name] = {
					...middlewareData[name],
					...data
				};
				if (reset && resetCount < MAX_RESET_COUNT) {
					resetCount++;
					if (typeof reset === "object") {
						if (reset.placement) statefulPlacement = reset.placement;
						if (reset.rects) rects = reset.rects === true ? await platform.getElementRects({
							reference,
							floating,
							strategy
						}) : reset.rects;
						({x, y} = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
					}
					i = -1;
				}
			}
			return {
				x,
				y,
				placement: statefulPlacement,
				strategy,
				middlewareData
			};
		};
		/**
		* Optimizes the visibility of the floating element by flipping the `placement`
		* in order to keep it in view when the preferred placement(s) will overflow the
		* clipping boundary. Alternative to `autoPlacement`.
		* @see https://floating-ui.com/docs/flip
		*/
		const flip$2 = function(options) {
			if (options === void 0) options = {};
			return {
				name: "flip",
				options,
				async fn(state) {
					var _middlewareData$arrow, _middlewareData$flip;
					const { placement, middlewareData, rects, initialPlacement, platform, elements } = state;
					const { mainAxis: checkMainAxis = true, crossAxis: checkCrossAxis = true, fallbackPlacements: specifiedFallbackPlacements, fallbackStrategy = "bestFit", fallbackAxisSideDirection = "none", flipAlignment = true, ...detectOverflowOptions } = evaluate(options, state);
					if ((_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) return {};
					const side = getSide(placement);
					const initialSideAxis = getSideAxis(initialPlacement);
					const isBasePlacement = getSide(initialPlacement) === initialPlacement;
					const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
					const fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [getOppositePlacement(initialPlacement)] : getExpandedPlacements(initialPlacement));
					const hasFallbackAxisSideDirection = fallbackAxisSideDirection !== "none";
					if (!specifiedFallbackPlacements && hasFallbackAxisSideDirection) fallbackPlacements.push(...getOppositeAxisPlacements(initialPlacement, flipAlignment, fallbackAxisSideDirection, rtl));
					const placements = [initialPlacement, ...fallbackPlacements];
					const overflow = await platform.detectOverflow(state, detectOverflowOptions);
					const overflows = [];
					let overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? void 0 : _middlewareData$flip.overflows) || [];
					if (checkMainAxis) overflows.push(overflow[side]);
					if (checkCrossAxis) {
						const sides = getAlignmentSides(placement, rects, rtl);
						overflows.push(overflow[sides[0]], overflow[sides[1]]);
					}
					overflowsData = [...overflowsData, {
						placement,
						overflows
					}];
					if (!overflows.every((side) => side <= 0)) {
						var _middlewareData$flip2, _overflowsData$filter;
						const nextIndex = (((_middlewareData$flip2 = middlewareData.flip) == null ? void 0 : _middlewareData$flip2.index) || 0) + 1;
						const nextPlacement = placements[nextIndex];
						if (nextPlacement) {
							if (!(checkCrossAxis === "alignment" ? initialSideAxis !== getSideAxis(nextPlacement) : false) || overflowsData.every((d) => getSideAxis(d.placement) === initialSideAxis ? d.overflows[0] > 0 : true)) return {
								data: {
									index: nextIndex,
									overflows: overflowsData
								},
								reset: { placement: nextPlacement }
							};
						}
						let resetPlacement = (_overflowsData$filter = overflowsData.filter((d) => d.overflows[0] <= 0).sort((a, b) => a.overflows[1] - b.overflows[1])[0]) == null ? void 0 : _overflowsData$filter.placement;
						if (!resetPlacement) switch (fallbackStrategy) {
							case "bestFit": {
								var _overflowsData$filter2;
								const placement = (_overflowsData$filter2 = overflowsData.filter((d) => {
									if (hasFallbackAxisSideDirection) {
										const currentSideAxis = getSideAxis(d.placement);
										return currentSideAxis === initialSideAxis || currentSideAxis === "y";
									}
									return true;
								}).map((d) => [d.placement, d.overflows.filter((overflow) => overflow > 0).reduce((acc, overflow) => acc + overflow, 0)]).sort((a, b) => a[1] - b[1])[0]) == null ? void 0 : _overflowsData$filter2[0];
								if (placement) resetPlacement = placement;
								break;
							}
							case "initialPlacement": resetPlacement = initialPlacement;
						}
						if (placement !== resetPlacement) return { reset: { placement: resetPlacement } };
					}
					return {};
				}
			};
		};
		const originSides = /*#__PURE__*/ new Set(["left", "top"]);
		async function convertValueToCoords(state, options) {
			const { placement, platform, elements } = state;
			const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
			const side = getSide(placement);
			const alignment = getAlignment(placement);
			const isVertical = getSideAxis(placement) === "y";
			const mainAxisMulti = originSides.has(side) ? -1 : 1;
			const crossAxisMulti = rtl && isVertical ? -1 : 1;
			const rawValue = evaluate(options, state);
			let { mainAxis, crossAxis, alignmentAxis } = typeof rawValue === "number" ? {
				mainAxis: rawValue,
				crossAxis: 0,
				alignmentAxis: null
			} : {
				mainAxis: rawValue.mainAxis || 0,
				crossAxis: rawValue.crossAxis || 0,
				alignmentAxis: rawValue.alignmentAxis
			};
			if (alignment && typeof alignmentAxis === "number") crossAxis = alignment === "end" ? alignmentAxis * -1 : alignmentAxis;
			return isVertical ? {
				x: crossAxis * crossAxisMulti,
				y: mainAxis * mainAxisMulti
			} : {
				x: mainAxis * mainAxisMulti,
				y: crossAxis * crossAxisMulti
			};
		}
		/**
		* Modifies the placement by translating the floating element along the
		* specified axes.
		* A number (shorthand for `mainAxis` or distance), or an axes configuration
		* object may be passed.
		* @see https://floating-ui.com/docs/offset
		*/
		const offset$2 = function(options) {
			if (options === void 0) options = 0;
			return {
				name: "offset",
				options,
				async fn(state) {
					var _middlewareData$offse, _middlewareData$arrow;
					const { x, y, placement, middlewareData } = state;
					const diffCoords = await convertValueToCoords(state, options);
					if (placement === ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse.placement) && (_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) return {};
					return {
						x: x + diffCoords.x,
						y: y + diffCoords.y,
						data: {
							...diffCoords,
							placement
						}
					};
				}
			};
		};
		/**
		* Optimizes the visibility of the floating element by shifting it in order to
		* keep it in view when it will overflow the clipping boundary.
		* @see https://floating-ui.com/docs/shift
		*/
		const shift$2 = function(options) {
			if (options === void 0) options = {};
			return {
				name: "shift",
				options,
				async fn(state) {
					const { x, y, placement, platform } = state;
					const { mainAxis: checkMainAxis = true, crossAxis: checkCrossAxis = false, limiter = { fn: (_ref) => {
						let { x, y } = _ref;
						return {
							x,
							y
						};
					} }, ...detectOverflowOptions } = evaluate(options, state);
					const coords = {
						x,
						y
					};
					const overflow = await platform.detectOverflow(state, detectOverflowOptions);
					const crossAxis = getSideAxis(placement);
					const mainAxis = getOppositeAxis(crossAxis);
					let mainAxisCoord = coords[mainAxis];
					let crossAxisCoord = coords[crossAxis];
					const clampCoord = (axis, coord) => clamp(coord + overflow[axis === "y" ? "top" : "left"], coord, coord - overflow[axis === "y" ? "bottom" : "right"]);
					if (checkMainAxis) mainAxisCoord = clampCoord(mainAxis, mainAxisCoord);
					if (checkCrossAxis) crossAxisCoord = clampCoord(crossAxis, crossAxisCoord);
					const limitedCoords = limiter.fn({
						...state,
						[mainAxis]: mainAxisCoord,
						[crossAxis]: crossAxisCoord
					});
					return {
						...limitedCoords,
						data: {
							x: limitedCoords.x - x,
							y: limitedCoords.y - y,
							enabled: {
								[mainAxis]: checkMainAxis,
								[crossAxis]: checkCrossAxis
							}
						}
					};
				}
			};
		};
		/**
		* Provides data that allows you to change the size of the floating element —
		* for instance, prevent it from overflowing the clipping boundary or match the
		* width of the reference element.
		* @see https://floating-ui.com/docs/size
		*/
		const size$2 = function(options) {
			if (options === void 0) options = {};
			return {
				name: "size",
				options,
				async fn(state) {
					const { placement, rects, platform, elements } = state;
					const { apply = () => {}, ...detectOverflowOptions } = evaluate(options, state);
					const overflow = await platform.detectOverflow(state, detectOverflowOptions);
					const side = getSide(placement);
					const alignment = getAlignment(placement);
					const isYAxis = getSideAxis(placement) === "y";
					const { width, height } = rects.floating;
					let heightSide;
					let widthSide;
					if (side === "top" || side === "bottom") {
						heightSide = side;
						widthSide = alignment === (await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating)) ? "start" : "end") ? "left" : "right";
					} else {
						widthSide = side;
						heightSide = alignment === "end" ? "top" : "bottom";
					}
					const maximumClippingHeight = height - overflow.top - overflow.bottom;
					const maximumClippingWidth = width - overflow.left - overflow.right;
					const overflowAvailableHeight = min(height - overflow[heightSide], maximumClippingHeight);
					const overflowAvailableWidth = min(width - overflow[widthSide], maximumClippingWidth);
					const shiftData = state.middlewareData.shift;
					const noShift = !shiftData;
					let availableHeight = overflowAvailableHeight;
					let availableWidth = overflowAvailableWidth;
					if (shiftData != null && shiftData.enabled.x) availableWidth = maximumClippingWidth;
					if (shiftData != null && shiftData.enabled.y) availableHeight = maximumClippingHeight;
					if (noShift && !alignment) {
						if (isYAxis) availableWidth = width - 2 * max(overflow.left, overflow.right);
						else availableHeight = height - 2 * max(overflow.top, overflow.bottom);
					}
					await apply({
						...state,
						availableWidth,
						availableHeight
					});
					const nextDimensions = await platform.getDimensions(elements.floating);
					if (width !== nextDimensions.width || height !== nextDimensions.height) return { reset: { rects: true } };
					return {};
				}
			};
		};
		//#endregion
		//#region node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
		function getCssDimensions(element) {
			const css = getComputedStyle$1(element);
			let width = parseFloat(css.width) || 0;
			let height = parseFloat(css.height) || 0;
			const hasOffset = isHTMLElement(element);
			const offsetWidth = hasOffset ? element.offsetWidth : width;
			const offsetHeight = hasOffset ? element.offsetHeight : height;
			const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight;
			if (shouldFallback) {
				width = offsetWidth;
				height = offsetHeight;
			}
			return {
				width,
				height,
				$: shouldFallback
			};
		}
		function unwrapElement(element) {
			return !isElement(element) ? element.contextElement : element;
		}
		function getScale(element) {
			const domElement = unwrapElement(element);
			if (!isHTMLElement(domElement)) return createCoords(1);
			const rect = domElement.getBoundingClientRect();
			const { width, height, $ } = getCssDimensions(domElement);
			let x = ($ ? round(rect.width) : rect.width) / width;
			let y = ($ ? round(rect.height) : rect.height) / height;
			if (!x || !Number.isFinite(x)) x = 1;
			if (!y || !Number.isFinite(y)) y = 1;
			return {
				x,
				y
			};
		}
		const noOffsets = /*#__PURE__*/ createCoords(0);
		function getVisualOffsets(element) {
			const win = getWindow(element);
			if (!isWebKit() || !win.visualViewport) return noOffsets;
			return {
				x: win.visualViewport.offsetLeft,
				y: win.visualViewport.offsetTop
			};
		}
		function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
			if (isFixed === void 0) isFixed = false;
			return !!floatingOffsetParent && isFixed && floatingOffsetParent === getWindow(element);
		}
		function getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
			if (includeScale === void 0) includeScale = false;
			if (isFixedStrategy === void 0) isFixedStrategy = false;
			const clientRect = element.getBoundingClientRect();
			const domElement = unwrapElement(element);
			let scale = createCoords(1);
			if (includeScale) {
				if (offsetParent) {
					if (isElement(offsetParent)) scale = getScale(offsetParent);
				} else scale = getScale(element);
			}
			const visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? getVisualOffsets(domElement) : createCoords(0);
			let x = (clientRect.left + visualOffsets.x) / scale.x;
			let y = (clientRect.top + visualOffsets.y) / scale.y;
			let width = clientRect.width / scale.x;
			let height = clientRect.height / scale.y;
			if (domElement && offsetParent) {
				const win = getWindow(domElement);
				const offsetWin = isElement(offsetParent) ? getWindow(offsetParent) : offsetParent;
				let currentWin = win;
				let currentIFrame = getFrameElement(currentWin);
				while (currentIFrame && offsetWin !== currentWin) {
					const iframeScale = getScale(currentIFrame);
					const iframeRect = currentIFrame.getBoundingClientRect();
					const css = getComputedStyle$1(currentIFrame);
					const left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
					const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
					x *= iframeScale.x;
					y *= iframeScale.y;
					width *= iframeScale.x;
					height *= iframeScale.y;
					x += left;
					y += top;
					currentWin = getWindow(currentIFrame);
					currentIFrame = getFrameElement(currentWin);
				}
			}
			return rectToClientRect({
				width,
				height,
				x,
				y
			});
		}
		function getWindowScrollBarX(element, rect) {
			const leftScroll = getNodeScroll(element).scrollLeft;
			if (!rect) return getBoundingClientRect(getDocumentElement(element)).left + leftScroll;
			return rect.left + leftScroll;
		}
		function getHTMLOffset(documentElement, scroll) {
			const htmlRect = documentElement.getBoundingClientRect();
			return {
				x: htmlRect.left + scroll.scrollLeft - getWindowScrollBarX(documentElement, htmlRect),
				y: htmlRect.top + scroll.scrollTop
			};
		}
		function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
			let { elements, rect, offsetParent, strategy } = _ref;
			const isFixed = strategy === "fixed";
			const documentElement = getDocumentElement(offsetParent);
			const topLayer = elements ? isTopLayer(elements.floating) : false;
			if (offsetParent === documentElement || topLayer && isFixed) return rect;
			let scroll = {
				scrollLeft: 0,
				scrollTop: 0
			};
			let scale = createCoords(1);
			const offsets = createCoords(0);
			const isOffsetParentAnElement = isHTMLElement(offsetParent);
			if (isOffsetParentAnElement || !isFixed) {
				if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) scroll = getNodeScroll(offsetParent);
				if (isOffsetParentAnElement) {
					const offsetRect = getBoundingClientRect(offsetParent);
					scale = getScale(offsetParent);
					offsets.x = offsetRect.x + offsetParent.clientLeft;
					offsets.y = offsetRect.y + offsetParent.clientTop;
				}
			}
			const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
			return {
				width: rect.width * scale.x,
				height: rect.height * scale.y,
				x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x + htmlOffset.x,
				y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y + htmlOffset.y
			};
		}
		function getClientRects(element) {
			return element.getClientRects ? Array.from(element.getClientRects()) : [];
		}
		function getDocumentRect(html) {
			const scroll = getNodeScroll(html);
			const body = html.ownerDocument.body;
			const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
			const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
			let x = -scroll.scrollLeft + getWindowScrollBarX(html);
			const y = -scroll.scrollTop;
			if (getComputedStyle$1(body).direction === "rtl") x += max(html.clientWidth, body.clientWidth) - width;
			return {
				width,
				height,
				x,
				y
			};
		}
		const SCROLLBAR_MAX = 25;
		function getViewportRect(element, strategy, rootBoundary) {
			if (rootBoundary === void 0) rootBoundary = "viewport";
			const isLayoutViewport = rootBoundary === "layoutViewport";
			const win = getWindow(element);
			const html = getDocumentElement(element);
			const visualViewport = win.visualViewport;
			let width = html.clientWidth;
			let height = html.clientHeight;
			let x = 0;
			let y = 0;
			if (visualViewport) {
				const layoutRelativeClientCoords = !isWebKit() || strategy === "fixed";
				if (isLayoutViewport) {
					if (!layoutRelativeClientCoords) {
						x = -visualViewport.offsetLeft;
						y = -visualViewport.offsetTop;
					}
				} else {
					width = visualViewport.width;
					height = visualViewport.height;
					if (layoutRelativeClientCoords) {
						x = visualViewport.offsetLeft;
						y = visualViewport.offsetTop;
					}
				}
			}
			if (getWindowScrollBarX(html) <= 0) {
				const doc = html.ownerDocument;
				const body = doc.body;
				const bodyStyles = getComputedStyle(body);
				const bodyMarginInline = doc.compatMode === "CSS1Compat" ? parseFloat(bodyStyles.marginLeft) + parseFloat(bodyStyles.marginRight) || 0 : 0;
				const reservedWidth = Math.abs(html.clientWidth - body.clientWidth - bodyMarginInline);
				const gutter = getComputedStyle(html).scrollbarGutter === "stable both-edges" ? reservedWidth / 2 : reservedWidth;
				if (gutter <= SCROLLBAR_MAX) width -= gutter;
			}
			return {
				width,
				height,
				x,
				y
			};
		}
		function getInnerBoundingClientRect(element, strategy) {
			const clientRect = getBoundingClientRect(element, true, strategy === "fixed");
			const top = clientRect.top + element.clientTop;
			const left = clientRect.left + element.clientLeft;
			const scale = getScale(element);
			return {
				width: element.clientWidth * scale.x,
				height: element.clientHeight * scale.y,
				x: left * scale.x,
				y: top * scale.y
			};
		}
		function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
			let rect;
			if (clippingAncestor === "viewport" || clippingAncestor === "layoutViewport") rect = getViewportRect(element, strategy, clippingAncestor);
			else if (clippingAncestor === "document") rect = getDocumentRect(getDocumentElement(element));
			else if (isElement(clippingAncestor)) rect = getInnerBoundingClientRect(clippingAncestor, strategy);
			else {
				const visualOffsets = getVisualOffsets(element);
				rect = {
					x: clippingAncestor.x - visualOffsets.x,
					y: clippingAncestor.y - visualOffsets.y,
					width: clippingAncestor.width,
					height: clippingAncestor.height
				};
			}
			return rectToClientRect(rect);
		}
		function getClippingElementAncestors(element, cache) {
			const cachedResult = cache.get(element);
			if (cachedResult) return cachedResult;
			let result = getOverflowAncestors(element, [], false).filter((el) => isElement(el) && getNodeName(el) !== "body");
			let lastKeptComputedStyle = null;
			const elementIsFixed = getComputedStyle$1(element).position === "fixed";
			let currentNode = elementIsFixed ? getParentNode(element) : element;
			while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
				const computedStyle = getComputedStyle$1(currentNode);
				const currentNodeIsContaining = isContainingBlock(currentNode);
				const lastPosition = lastKeptComputedStyle ? lastKeptComputedStyle.position : elementIsFixed ? "fixed" : "";
				if (!currentNodeIsContaining && (lastPosition === "fixed" || lastPosition === "absolute" && computedStyle.position === "static")) result = result.filter((ancestor) => ancestor !== currentNode);
				else lastKeptComputedStyle = computedStyle;
				currentNode = getParentNode(currentNode);
			}
			cache.set(element, result);
			return result;
		}
		function getClippingRect(_ref) {
			let { element, boundary, rootBoundary, strategy } = _ref;
			const clippingAncestors = [...boundary === "clippingAncestors" ? isTopLayer(element) ? [] : getClippingElementAncestors(element, this._c) : [].concat(boundary), rootBoundary];
			const firstRect = getClientRectFromClippingAncestor(element, clippingAncestors[0], strategy);
			let top = firstRect.top;
			let right = firstRect.right;
			let bottom = firstRect.bottom;
			let left = firstRect.left;
			for (let i = 1; i < clippingAncestors.length; i++) {
				const rect = getClientRectFromClippingAncestor(element, clippingAncestors[i], strategy);
				top = max(rect.top, top);
				right = min(rect.right, right);
				bottom = min(rect.bottom, bottom);
				left = max(rect.left, left);
			}
			return {
				width: right - left,
				height: bottom - top,
				x: left,
				y: top
			};
		}
		function getDimensions(element) {
			const { width, height } = getCssDimensions(element);
			return {
				width,
				height
			};
		}
		function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
			const isOffsetParentAnElement = isHTMLElement(offsetParent);
			const documentElement = getDocumentElement(offsetParent);
			const isFixed = strategy === "fixed";
			const rect = getBoundingClientRect(element, true, isFixed, offsetParent);
			let scroll = {
				scrollLeft: 0,
				scrollTop: 0
			};
			const offsets = createCoords(0);
			if (isOffsetParentAnElement || !isFixed) {
				if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) scroll = getNodeScroll(offsetParent);
				if (isOffsetParentAnElement) {
					const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent);
					offsets.x = offsetRect.x + offsetParent.clientLeft;
					offsets.y = offsetRect.y + offsetParent.clientTop;
				}
			}
			if (!isOffsetParentAnElement && documentElement) offsets.x = getWindowScrollBarX(documentElement);
			const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
			return {
				x: rect.left + scroll.scrollLeft - offsets.x - htmlOffset.x,
				y: rect.top + scroll.scrollTop - offsets.y - htmlOffset.y,
				width: rect.width,
				height: rect.height
			};
		}
		function isStaticPositioned(element) {
			return getComputedStyle$1(element).position === "static";
		}
		function getTrueOffsetParent(element, polyfill) {
			if (!isHTMLElement(element) || getComputedStyle$1(element).position === "fixed") return null;
			if (polyfill) return polyfill(element);
			let rawOffsetParent = element.offsetParent;
			if (getDocumentElement(element) === rawOffsetParent) rawOffsetParent = rawOffsetParent.ownerDocument.body;
			return rawOffsetParent;
		}
		function getOffsetParent(element, polyfill) {
			const win = getWindow(element);
			if (isTopLayer(element)) return win;
			if (!isHTMLElement(element)) {
				let svgOffsetParent = getParentNode(element);
				while (svgOffsetParent && !isLastTraversableNode(svgOffsetParent)) {
					if (isElement(svgOffsetParent) && !isStaticPositioned(svgOffsetParent)) return svgOffsetParent;
					svgOffsetParent = getParentNode(svgOffsetParent);
				}
				return win;
			}
			let offsetParent = getTrueOffsetParent(element, polyfill);
			while (offsetParent && isTableElement(offsetParent) && isStaticPositioned(offsetParent)) offsetParent = getTrueOffsetParent(offsetParent, polyfill);
			if (offsetParent && isLastTraversableNode(offsetParent) && isStaticPositioned(offsetParent) && !isContainingBlock(offsetParent)) return win;
			return offsetParent || getContainingBlock(element) || win;
		}
		const getElementRects = async function(data) {
			const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
			const getDimensionsFn = this.getDimensions;
			const floatingDimensions = await getDimensionsFn(data.floating);
			return {
				reference: getRectRelativeToOffsetParent(data.reference, await getOffsetParentFn(data.floating), data.strategy),
				floating: {
					x: 0,
					y: 0,
					width: floatingDimensions.width,
					height: floatingDimensions.height
				}
			};
		};
		function isRTL(element) {
			return getComputedStyle$1(element).direction === "rtl";
		}
		const platform = {
			convertOffsetParentRelativeRectToViewportRelativeRect,
			getDocumentElement,
			getClippingRect,
			getOffsetParent,
			getElementRects,
			getClientRects,
			getDimensions,
			getScale,
			isElement,
			isRTL
		};
		function rectsAreEqual(a, b) {
			return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
		}
		function observeMove(element, onMove, ancestorResize) {
			let io = null;
			let timeoutId;
			const root = getDocumentElement(element);
			function cleanup() {
				var _io;
				clearTimeout(timeoutId);
				(_io = io) == null || _io.disconnect();
				io = null;
			}
			function refresh(skip, threshold) {
				if (skip === void 0) skip = false;
				if (threshold === void 0) threshold = 1;
				cleanup();
				const elementRectForRootMargin = element.getBoundingClientRect();
				const { left, top, width, height } = elementRectForRootMargin;
				if (!skip) onMove();
				if (!width || !height) return;
				const insetTop = floor(top);
				const insetRight = floor(root.clientWidth - (left + width));
				const insetBottom = floor(root.clientHeight - (top + height));
				const insetLeft = floor(left);
				const options = {
					rootMargin: -insetTop + "px " + -insetRight + "px " + -insetBottom + "px " + -insetLeft + "px",
					threshold: max(0, min(1, threshold)) || 1
				};
				let isFirstUpdate = true;
				function handleObserve(entries) {
					const ratio = entries[0].intersectionRatio;
					if (!rectsAreEqual(elementRectForRootMargin, element.getBoundingClientRect())) return refresh();
					if (ratio !== threshold) {
						if (!isFirstUpdate) return refresh();
						if (!ratio) timeoutId = setTimeout(() => {
							refresh(false, 1e-7);
						}, 1e3);
						else refresh(false, ratio);
					}
					isFirstUpdate = false;
				}
				try {
					io = new IntersectionObserver(handleObserve, {
						...options,
						root: root.ownerDocument
					});
				} catch (_e) {
					io = new IntersectionObserver(handleObserve, options);
				}
				io.observe(element);
			}
			const win = getWindow(element);
			const handleResize = () => refresh(ancestorResize);
			win.addEventListener("resize", handleResize);
			refresh(true);
			return () => {
				win.removeEventListener("resize", handleResize);
				cleanup();
			};
		}
		/**
		* Automatically updates the position of the floating element when necessary.
		* Should only be called when the floating element is mounted on the DOM or
		* visible on the screen.
		* @returns cleanup function that should be invoked when the floating element is
		* removed from the DOM or hidden from the screen.
		* @see https://floating-ui.com/docs/autoUpdate
		*/
		function autoUpdate(reference, floating, update, options) {
			if (options === void 0) options = {};
			const { ancestorScroll = true, ancestorResize = true, elementResize = typeof ResizeObserver === "function", layoutShift = typeof IntersectionObserver === "function", animationFrame = false } = options;
			const referenceEl = unwrapElement(reference);
			const ancestors = ancestorScroll || ancestorResize ? [...referenceEl ? getOverflowAncestors(referenceEl) : [], ...floating ? getOverflowAncestors(floating) : []] : [];
			ancestors.forEach((ancestor) => {
				ancestorScroll && ancestor.addEventListener("scroll", update);
				ancestorResize && ancestor.addEventListener("resize", update);
			});
			const cleanupIo = referenceEl && layoutShift ? observeMove(referenceEl, update, ancestorResize) : null;
			let reobserveFrame = -1;
			let resizeObserver = null;
			if (elementResize) {
				resizeObserver = new ResizeObserver((_ref) => {
					let [firstEntry] = _ref;
					if (firstEntry && firstEntry.target === referenceEl && resizeObserver && floating) {
						resizeObserver.unobserve(floating);
						cancelAnimationFrame(reobserveFrame);
						reobserveFrame = requestAnimationFrame(() => {
							var _resizeObserver;
							(_resizeObserver = resizeObserver) == null || _resizeObserver.observe(floating);
						});
					}
					update();
				});
				if (referenceEl && !animationFrame) resizeObserver.observe(referenceEl);
				if (floating) resizeObserver.observe(floating);
			}
			let frameId;
			let prevRefRect = animationFrame ? getBoundingClientRect(reference) : null;
			if (animationFrame) frameLoop();
			function frameLoop() {
				const nextRefRect = getBoundingClientRect(reference);
				if (prevRefRect && !rectsAreEqual(prevRefRect, nextRefRect)) update();
				prevRefRect = nextRefRect;
				frameId = requestAnimationFrame(frameLoop);
			}
			update();
			return () => {
				var _resizeObserver2;
				ancestors.forEach((ancestor) => {
					ancestorScroll && ancestor.removeEventListener("scroll", update);
					ancestorResize && ancestor.removeEventListener("resize", update);
				});
				cleanupIo?.();
				(_resizeObserver2 = resizeObserver) == null || _resizeObserver2.disconnect();
				resizeObserver = null;
				if (animationFrame) cancelAnimationFrame(frameId);
			};
		}
		/**
		* Modifies the placement by translating the floating element along the
		* specified axes.
		* A number (shorthand for `mainAxis` or distance), or an axes configuration
		* object may be passed.
		* @see https://floating-ui.com/docs/offset
		*/
		const offset$1 = offset$2;
		/**
		* Optimizes the visibility of the floating element by shifting it in order to
		* keep it in view when it will overflow the clipping boundary.
		* @see https://floating-ui.com/docs/shift
		*/
		const shift$1 = shift$2;
		/**
		* Optimizes the visibility of the floating element by flipping the `placement`
		* in order to keep it in view when the preferred placement(s) will overflow the
		* clipping boundary. Alternative to `autoPlacement`.
		* @see https://floating-ui.com/docs/flip
		*/
		const flip$1 = flip$2;
		/**
		* Provides data that allows you to change the size of the floating element —
		* for instance, prevent it from overflowing the clipping boundary or match the
		* width of the reference element.
		* @see https://floating-ui.com/docs/size
		*/
		const size$1 = size$2;
		/**
		* Computes the `x` and `y` coordinates that will place the floating element
		* next to a given reference element.
		*/
		const computePosition = (reference, floating, options) => {
			const cache = /* @__PURE__ */ new Map();
			const mergedOptions = options != null ? options : {};
			const platformWithCache = {
				...platform,
				...mergedOptions.platform,
				_c: cache
			};
			return computePosition$1(reference, floating, {
				...mergedOptions,
				platform: platformWithCache
			});
		};
		//#endregion
		//#region node_modules/@floating-ui/react-dom/dist/floating-ui.react-dom.mjs
		var index = typeof document !== "undefined" ? react.useLayoutEffect : function noop() {};
		function deepEqual(a, b) {
			if (a === b) return true;
			if (typeof a !== typeof b) return false;
			if (typeof a === "function" && a.toString() === b.toString()) return true;
			let length;
			let i;
			let keys;
			if (a && b && typeof a === "object") {
				if (Array.isArray(a)) {
					length = a.length;
					if (length !== b.length) return false;
					for (i = length; i-- !== 0;) if (!deepEqual(a[i], b[i])) return false;
					return true;
				}
				keys = Object.keys(a);
				length = keys.length;
				if (length !== Object.keys(b).length) return false;
				for (i = length; i-- !== 0;) if (!{}.hasOwnProperty.call(b, keys[i])) return false;
				for (i = length; i-- !== 0;) {
					const key = keys[i];
					if (key === "_owner" && a.$$typeof) continue;
					if (!deepEqual(a[key], b[key])) return false;
				}
				return true;
			}
			return a !== a && b !== b;
		}
		function getDPR(element) {
			if (typeof window === "undefined") return 1;
			return (element.ownerDocument.defaultView || window).devicePixelRatio || 1;
		}
		function roundByDPR(element, value) {
			const dpr = getDPR(element);
			return Math.round(value * dpr) / dpr;
		}
		function useLatestRef(value) {
			const ref = react.useRef(value);
			index(() => {
				ref.current = value;
			});
			return ref;
		}
		/**
		* Provides data to position a floating element.
		* @see https://floating-ui.com/docs/useFloating
		*/
		function useFloating$1(options) {
			if (options === void 0) options = {};
			const { placement = "bottom", strategy = "absolute", middleware = [], platform, elements: { reference: externalReference, floating: externalFloating } = {}, transform = true, whileElementsMounted, open } = options;
			const [data, setData] = react.useState({
				x: 0,
				y: 0,
				strategy,
				placement,
				middlewareData: {},
				isPositioned: false
			});
			const [latestMiddleware, setLatestMiddleware] = react.useState(middleware);
			if (!deepEqual(latestMiddleware, middleware)) setLatestMiddleware(middleware);
			const [_reference, _setReference] = react.useState(null);
			const [_floating, _setFloating] = react.useState(null);
			const setReference = react.useCallback((node) => {
				if (node !== referenceRef.current) {
					referenceRef.current = node;
					_setReference(node);
				}
			}, []);
			const setFloating = react.useCallback((node) => {
				if (node !== floatingRef.current) {
					floatingRef.current = node;
					_setFloating(node);
				}
			}, []);
			const referenceEl = externalReference || _reference;
			const floatingEl = externalFloating || _floating;
			const referenceRef = react.useRef(null);
			const floatingRef = react.useRef(null);
			const dataRef = react.useRef(data);
			const hasWhileElementsMounted = whileElementsMounted != null;
			const whileElementsMountedRef = useLatestRef(whileElementsMounted);
			const platformRef = useLatestRef(platform);
			const openRef = useLatestRef(open);
			const update = react.useCallback(() => {
				if (!referenceRef.current || !floatingRef.current) return;
				const config = {
					placement,
					strategy,
					middleware: latestMiddleware
				};
				if (platformRef.current) config.platform = platformRef.current;
				computePosition(referenceRef.current, floatingRef.current, config).then((data) => {
					const fullData = {
						...data,
						isPositioned: openRef.current !== false
					};
					if (isMountedRef.current && !deepEqual(dataRef.current, fullData)) {
						dataRef.current = fullData;
						react_dom.flushSync(() => {
							setData(fullData);
						});
					}
				});
			}, [
				latestMiddleware,
				placement,
				strategy,
				platformRef,
				openRef
			]);
			index(() => {
				if (open === false && dataRef.current.isPositioned) {
					dataRef.current.isPositioned = false;
					setData((data) => ({
						...data,
						isPositioned: false
					}));
				}
			}, [open]);
			const isMountedRef = react.useRef(false);
			index(() => {
				isMountedRef.current = true;
				return () => {
					isMountedRef.current = false;
				};
			}, []);
			index(() => {
				if (referenceEl) referenceRef.current = referenceEl;
				if (floatingEl) floatingRef.current = floatingEl;
				if (referenceEl && floatingEl) {
					if (whileElementsMountedRef.current) return whileElementsMountedRef.current(referenceEl, floatingEl, update);
					update();
				}
			}, [
				referenceEl,
				floatingEl,
				update,
				whileElementsMountedRef,
				hasWhileElementsMounted
			]);
			const refs = react.useMemo(() => ({
				reference: referenceRef,
				floating: floatingRef,
				setReference,
				setFloating
			}), [setReference, setFloating]);
			const elements = react.useMemo(() => ({
				reference: referenceEl,
				floating: floatingEl
			}), [referenceEl, floatingEl]);
			const floatingStyles = react.useMemo(() => {
				const initialStyles = {
					position: strategy,
					left: 0,
					top: 0
				};
				if (!elements.floating) return initialStyles;
				const x = roundByDPR(elements.floating, data.x);
				const y = roundByDPR(elements.floating, data.y);
				if (transform) return {
					...initialStyles,
					transform: "translate(" + x + "px, " + y + "px)",
					...getDPR(elements.floating) >= 1.5 && { willChange: "transform" }
				};
				return {
					position: strategy,
					left: x,
					top: y
				};
			}, [
				strategy,
				transform,
				elements.floating,
				data.x,
				data.y
			]);
			return react.useMemo(() => ({
				...data,
				update,
				refs,
				elements,
				floatingStyles
			}), [
				data,
				update,
				refs,
				elements,
				floatingStyles
			]);
		}
		/**
		* Modifies the placement by translating the floating element along the
		* specified axes.
		* A number (shorthand for `mainAxis` or distance), or an axes configuration
		* object may be passed.
		* @see https://floating-ui.com/docs/offset
		*/
		const offset = (options, deps) => {
			const result = offset$1(options);
			return {
				name: result.name,
				fn: result.fn,
				options: [options, deps]
			};
		};
		/**
		* Optimizes the visibility of the floating element by shifting it in order to
		* keep it in view when it will overflow the clipping boundary.
		* @see https://floating-ui.com/docs/shift
		*/
		const shift = (options, deps) => {
			const result = shift$1(options);
			return {
				name: result.name,
				fn: result.fn,
				options: [options, deps]
			};
		};
		/**
		* Optimizes the visibility of the floating element by flipping the `placement`
		* in order to keep it in view when the preferred placement(s) will overflow the
		* clipping boundary. Alternative to `autoPlacement`.
		* @see https://floating-ui.com/docs/flip
		*/
		const flip = (options, deps) => {
			const result = flip$1(options);
			return {
				name: result.name,
				fn: result.fn,
				options: [options, deps]
			};
		};
		/**
		* Provides data that allows you to change the size of the floating element —
		* for instance, prevent it from overflowing the clipping boundary or match the
		* width of the reference element.
		* @see https://floating-ui.com/docs/size
		*/
		const size = (options, deps) => {
			const result = size$1(options);
			return {
				name: result.name,
				fn: result.fn,
				options: [options, deps]
			};
		};
		//#endregion
		//#region node_modules/@floating-ui/react/dist/floating-ui.react.mjs
		const ARROW_LEFT = "ArrowLeft";
		const ARROW_RIGHT = "ArrowRight";
		const ARROW_UP = "ArrowUp";
		const ARROW_DOWN = "ArrowDown";
		const horizontalKeys = [ARROW_LEFT, ARROW_RIGHT];
		const verticalKeys = [ARROW_UP, ARROW_DOWN];
		[...horizontalKeys, ...verticalKeys];
		const SafeReact = { ...react };
		let serverHandoffComplete = false;
		let count = 0;
		const genId = () => "floating-ui-" + Math.random().toString(36).slice(2, 6) + count++;
		function useFloatingId() {
			const [id, setId] = react.useState(() => serverHandoffComplete ? genId() : void 0);
			index$1(() => {
				if (id == null) setId(genId());
			}, []);
			react.useEffect(() => {
				serverHandoffComplete = true;
			}, []);
			return id;
		}
		/**
		* Uses React 18's built-in `useId()` when available, or falls back to a
		* slightly less performant (requiring a double render) implementation for
		* earlier React versions.
		* @see https://floating-ui.com/docs/react-utils#useid
		*/
		const useId = SafeReact.useId || useFloatingId;
		function createEventEmitter() {
			const map = /* @__PURE__ */ new Map();
			return {
				emit(event, data) {
					var _map$get;
					(_map$get = map.get(event)) == null || _map$get.forEach((listener) => listener(data));
				},
				on(event, listener) {
					if (!map.has(event)) map.set(event, /* @__PURE__ */ new Set());
					map.get(event).add(listener);
				},
				off(event, listener) {
					var _map$get2;
					(_map$get2 = map.get(event)) == null || _map$get2.delete(listener);
				}
			};
		}
		const FloatingNodeContext = /*#__PURE__*/ react.createContext(null);
		const FloatingTreeContext = /*#__PURE__*/ react.createContext(null);
		/**
		* Returns the parent node id for nested floating elements, if available.
		* Returns `null` for top-level floating elements.
		*/
		const useFloatingParentNodeId = () => {
			var _React$useContext;
			return ((_React$useContext = react.useContext(FloatingNodeContext)) == null ? void 0 : _React$useContext.id) || null;
		};
		/**
		* Returns the nearest floating tree context, if available.
		*/
		const useFloatingTree = () => react.useContext(FloatingTreeContext);
		function createAttribute(name) {
			return "data-floating-ui-" + name;
		}
		const HIDDEN_STYLES = {
			border: 0,
			clip: "rect(0 0 0 0)",
			height: "1px",
			margin: "-1px",
			overflow: "hidden",
			padding: 0,
			position: "fixed",
			whiteSpace: "nowrap",
			width: "1px",
			top: 0,
			left: 0
		};
		const FocusGuard = /*#__PURE__*/ react.forwardRef(function FocusGuard(props, ref) {
			const [role, setRole] = react.useState();
			index$1(() => {
				if (isSafari()) setRole("button");
			}, []);
			const restProps = {
				ref,
				tabIndex: 0,
				role,
				"aria-hidden": role ? void 0 : true,
				[createAttribute("focus-guard")]: "",
				style: HIDDEN_STYLES
			};
			return /*#__PURE__*/ (0, react_jsx_runtime.jsx)("span", {
				...props,
				...restProps
			});
		});
		const HIDDEN_OWNER_STYLES = {
			clipPath: "inset(50%)",
			position: "fixed",
			top: 0,
			left: 0
		};
		const PortalContext = /*#__PURE__*/ react.createContext(null);
		const attr = /*#__PURE__*/ createAttribute("portal");
		/**
		* @see https://floating-ui.com/docs/FloatingPortal#usefloatingportalnode
		*/
		function useFloatingPortalNode(props) {
			if (props === void 0) props = {};
			const { id, root } = props;
			const uniqueId = useId();
			const portalContext = usePortalContext();
			const [portalNode, setPortalNode] = react.useState(null);
			const portalNodeRef = react.useRef(null);
			index$1(() => {
				return () => {
					portalNode?.remove();
					queueMicrotask(() => {
						portalNodeRef.current = null;
					});
				};
			}, [portalNode]);
			index$1(() => {
				if (!uniqueId) return;
				if (portalNodeRef.current) return;
				const existingIdRoot = id ? document.getElementById(id) : null;
				if (!existingIdRoot) return;
				const subRoot = document.createElement("div");
				subRoot.id = uniqueId;
				subRoot.setAttribute(attr, "");
				existingIdRoot.appendChild(subRoot);
				portalNodeRef.current = subRoot;
				setPortalNode(subRoot);
			}, [id, uniqueId]);
			index$1(() => {
				if (root === null) return;
				if (!uniqueId) return;
				if (portalNodeRef.current) return;
				let container = root || (portalContext == null ? void 0 : portalContext.portalNode);
				if (container && !isNode(container)) container = container.current;
				container = container || document.body;
				let idWrapper = null;
				if (id) {
					idWrapper = document.createElement("div");
					idWrapper.id = id;
					container.appendChild(idWrapper);
				}
				const subRoot = document.createElement("div");
				subRoot.id = uniqueId;
				subRoot.setAttribute(attr, "");
				container = idWrapper || container;
				container.appendChild(subRoot);
				portalNodeRef.current = subRoot;
				setPortalNode(subRoot);
			}, [
				id,
				root,
				uniqueId,
				portalContext
			]);
			return portalNode;
		}
		/**
		* Portals the floating element into a given container element — by default,
		* outside of the app root and into the body.
		* This is necessary to ensure the floating element can appear outside any
		* potential parent containers that cause clipping (such as `overflow: hidden`),
		* while retaining its location in the React tree.
		* @see https://floating-ui.com/docs/FloatingPortal
		*/
		function FloatingPortal(props) {
			const { children, id, root, preserveTabOrder = true } = props;
			const portalNode = useFloatingPortalNode({
				id,
				root
			});
			const [focusManagerState, setFocusManagerState] = react.useState(null);
			const beforeOutsideRef = react.useRef(null);
			const afterOutsideRef = react.useRef(null);
			const beforeInsideRef = react.useRef(null);
			const afterInsideRef = react.useRef(null);
			const modal = focusManagerState == null ? void 0 : focusManagerState.modal;
			const open = focusManagerState == null ? void 0 : focusManagerState.open;
			const shouldRenderGuards = !!focusManagerState && !focusManagerState.modal && focusManagerState.open && preserveTabOrder && !!(root || portalNode);
			react.useEffect(() => {
				if (!portalNode || !preserveTabOrder || modal) return;
				function onFocus(event) {
					if (portalNode && isOutsideEvent(event)) (event.type === "focusin" ? enableFocusInside : disableFocusInside)(portalNode);
				}
				portalNode.addEventListener("focusin", onFocus, true);
				portalNode.addEventListener("focusout", onFocus, true);
				return () => {
					portalNode.removeEventListener("focusin", onFocus, true);
					portalNode.removeEventListener("focusout", onFocus, true);
				};
			}, [
				portalNode,
				preserveTabOrder,
				modal
			]);
			react.useEffect(() => {
				if (!portalNode) return;
				if (open) return;
				enableFocusInside(portalNode);
			}, [open, portalNode]);
			return /*#__PURE__*/ (0, react_jsx_runtime.jsxs)(PortalContext.Provider, {
				value: react.useMemo(() => ({
					preserveTabOrder,
					beforeOutsideRef,
					afterOutsideRef,
					beforeInsideRef,
					afterInsideRef,
					portalNode,
					setFocusManagerState
				}), [preserveTabOrder, portalNode]),
				children: [
					shouldRenderGuards && portalNode && /*#__PURE__*/ (0, react_jsx_runtime.jsx)(FocusGuard, {
						"data-type": "outside",
						ref: beforeOutsideRef,
						onFocus: (event) => {
							if (isOutsideEvent(event, portalNode)) {
								var _beforeInsideRef$curr;
								(_beforeInsideRef$curr = beforeInsideRef.current) == null || _beforeInsideRef$curr.focus();
							} else getPreviousTabbable(focusManagerState ? focusManagerState.domReference : null)?.focus();
						}
					}),
					shouldRenderGuards && portalNode && /*#__PURE__*/ (0, react_jsx_runtime.jsx)("span", {
						"aria-owns": portalNode.id,
						style: HIDDEN_OWNER_STYLES
					}),
					portalNode && /*#__PURE__*/ react_dom.createPortal(children, portalNode),
					shouldRenderGuards && portalNode && /*#__PURE__*/ (0, react_jsx_runtime.jsx)(FocusGuard, {
						"data-type": "outside",
						ref: afterOutsideRef,
						onFocus: (event) => {
							if (isOutsideEvent(event, portalNode)) {
								var _afterInsideRef$curre;
								(_afterInsideRef$curre = afterInsideRef.current) == null || _afterInsideRef$curre.focus();
							} else {
								getNextTabbable(focusManagerState ? focusManagerState.domReference : null)?.focus();
								focusManagerState != null && focusManagerState.closeOnFocusOut && focusManagerState?.onOpenChange(false, event.nativeEvent, "focus-out");
							}
						}
					})
				]
			});
		}
		const usePortalContext = () => react.useContext(PortalContext);
		function useFloatingRootContext(options) {
			const { open = false, onOpenChange: onOpenChangeProp, elements: elementsProp } = options;
			const floatingId = useId();
			const dataRef = react.useRef({});
			const [events] = react.useState(() => createEventEmitter());
			const nested = useFloatingParentNodeId() != null;
			const [positionReference, setPositionReference] = react.useState(elementsProp.reference);
			const onOpenChange = useEffectEvent((open, event, reason) => {
				dataRef.current.openEvent = open ? event : void 0;
				events.emit("openchange", {
					open,
					event,
					reason,
					nested
				});
				onOpenChangeProp?.(open, event, reason);
			});
			const refs = react.useMemo(() => ({ setPositionReference }), []);
			const elements = react.useMemo(() => ({
				reference: positionReference || elementsProp.reference || null,
				floating: elementsProp.floating || null,
				domReference: elementsProp.reference
			}), [
				positionReference,
				elementsProp.reference,
				elementsProp.floating
			]);
			return react.useMemo(() => ({
				dataRef,
				open,
				onOpenChange,
				elements,
				events,
				floatingId,
				refs
			}), [
				open,
				onOpenChange,
				elements,
				events,
				floatingId,
				refs
			]);
		}
		/**
		* Provides data to position a floating element and context to add interactions.
		* @see https://floating-ui.com/docs/useFloating
		*/
		function useFloating(_temp) {
			var _elementsOption$refer, _elementsOption$float;
			let { elements: elementsOption, ...options } = _temp === void 0 ? {} : _temp;
			const { nodeId } = options;
			const internalRootContext = useFloatingRootContext({
				...options,
				elements: {
					reference: (_elementsOption$refer = elementsOption == null ? void 0 : elementsOption.reference) != null ? _elementsOption$refer : null,
					floating: (_elementsOption$float = elementsOption == null ? void 0 : elementsOption.floating) != null ? _elementsOption$float : null
				}
			});
			const rootContext = options.rootContext || internalRootContext;
			const computedElements = rootContext.elements;
			const [_domReference, setDomReference] = react.useState(null);
			const [positionReference, _setPositionReference] = react.useState(null);
			const domReference = (computedElements == null ? void 0 : computedElements.domReference) || _domReference;
			const domReferenceRef = react.useRef(null);
			const tree = useFloatingTree();
			index$1(() => {
				if (domReference) domReferenceRef.current = domReference;
			}, [domReference]);
			const position = useFloating$1({
				...options,
				elements: {
					...computedElements,
					...positionReference && { reference: positionReference }
				}
			});
			const setPositionReference = react.useCallback((node) => {
				const computedPositionReference = isElement(node) ? {
					getBoundingClientRect: () => node.getBoundingClientRect(),
					getClientRects: () => node.getClientRects(),
					contextElement: node
				} : node;
				_setPositionReference(computedPositionReference);
				position.refs.setReference(computedPositionReference);
			}, [position.refs]);
			const setReference = react.useCallback((node) => {
				if (isElement(node) || node === null) {
					domReferenceRef.current = node;
					setDomReference(node);
				}
				if (isElement(position.refs.reference.current) || position.refs.reference.current === null || node !== null && !isElement(node)) position.refs.setReference(node);
			}, [position.refs]);
			const refs = react.useMemo(() => ({
				...position.refs,
				setReference,
				setPositionReference,
				domReference: domReferenceRef
			}), [
				position.refs,
				setReference,
				setPositionReference
			]);
			const elements = react.useMemo(() => ({
				...position.elements,
				domReference
			}), [position.elements, domReference]);
			const context = react.useMemo(() => ({
				...position,
				...rootContext,
				refs,
				elements,
				nodeId
			}), [
				position,
				refs,
				elements,
				nodeId,
				rootContext
			]);
			index$1(() => {
				rootContext.dataRef.current.floatingContext = context;
				const node = tree == null ? void 0 : tree.nodesRef.current.find((node) => node.id === nodeId);
				if (node) node.context = context;
			});
			return react.useMemo(() => ({
				...position,
				context,
				refs,
				elements
			}), [
				position,
				refs,
				elements,
				context
			]);
		}
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/ui/infra/chevron.js
		/**
		* 全站唯一的箭头：**自绘 chevron**（就是下拉框右侧那颗）。
		*
		* 为什么自绘：`ui` 层零官方依赖（官方图标只在宿主内可解析），官方件在这个包里 import 不到。
		* 为什么不再写字形：'▾' / '↑' 这类字符在各系统字体下粗细、角度、基线都不一样，
		* 同一套界面里会出现两种箭头 —— 2026-10-26 用户点名 ▾ 太丑 ⇒ 一律换成这颗 chevron。
		*
		* 用法：`h(Chevron, { dir: 'up' })`（默认 12px；要放大用核心 dense 档，别在这里写死大尺寸）；
		* 要动画就在外层套一个带 transform 的类
		* （如卡片折叠的 `.dshpc-card__caret.is-open`），不要给每个方向另画一条路径。
		*/
		const ROTATE = {
			down: 0,
			up: 180,
			left: 90,
			right: 270
		};
		function Chevron(props) {
			const size = props.size ?? 12;
			const deg = ROTATE[props.dir ?? "down"];
			const style = deg === 0 ? void 0 : { transform: `rotate(${String(deg)}deg)` };
			return (0, react.createElement)("svg", {
				className: props.className,
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": true,
				style
			}, (0, react.createElement)("path", {
				d: "M4 6l4 4 4-4",
				stroke: "currentColor",
				"stroke-width": 1.5,
				"stroke-linecap": "round",
				"stroke-linejoin": "round"
			}));
		}
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/ui/actions/button-css.generated.js
		const BUTTON_CSS = "\n/* ── 按钮 / 图标钮 P2 ───────────────────────────────────────────────────\n   与 Segmented 同一条高度纪律：--dshpc-control-h-sm(24) / -md(28) / -lg(32)，\n   有边框的 variant 用 1px 真边框 + 内部 padding 补回，**有边 / 无边同高**。\n\n   三条受控轴（2026-10-19 重写，对齐主流 UI 框架的分类口径）：\n     · variant —— 外观档 = 形态 + 语义色，共 10 档：\n         primary / secondary / outline / ghost / danger / success / warning / info /\n         danger-outline（红字描边）/ link（行内链接）\n     · size —— sm / md / lg\n     · block —— 撑满父宽\n   每一档**只填 5 个局部变量**（--btn-bg / -fg / -border / -bg-hover / -bg-active），\n   结构与交互只有上面这一份；任何档位都不许再写一遍 display/height/padding。\n   自定义颜色（Button 的 color 参数）同样只覆盖这 5 个变量（token 覆盖，不是新皮肤）。\n\n   ⚠️ hover 不再用 opacity 压一层（用户 2026-10-19：「黑色和红色的按钮移上去变化太小，\n   完全感觉不到颜色变了」）⇒ 走 --dshpc-*-hover / -active 的明确混色，见 tokens-css.ts。 */\n.dshpc-btn{--btn-bg:transparent;--btn-fg:var(--dshpc-fg);--btn-border:transparent;--btn-pad:12px;\n  --btn-bg-hover:var(--dshpc-hover);--btn-bg-active:var(--dshpc-active);--btn-fg-hover:var(--btn-fg);\n  appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;\n  box-sizing:border-box;border:1px solid var(--btn-border);border-radius:var(--dshpc-radius-md);\n  background-color:var(--btn-bg);color:var(--btn-fg);font-family:inherit;font-weight:500;white-space:nowrap;cursor:pointer;\n  transition:background-color var(--dshpc-dur-fast) var(--dshpc-ease),border-color var(--dshpc-dur-fast) var(--dshpc-ease),color var(--dshpc-dur-fast) var(--dshpc-ease),box-shadow var(--dshpc-dur-fast) var(--dshpc-ease),transform var(--dshpc-dur-fast) var(--dshpc-ease);}\n.dshpc-btn--sm{--btn-pad:10px;height:var(--dshpc-control-h-sm);padding:0 var(--btn-pad);font-size:var(--dshpc-font-sm);line-height:1;}\n.dshpc-btn--md{--btn-pad:12px;height:var(--dshpc-control-h-md);padding:0 var(--btn-pad);font-size:var(--dshpc-font-md);line-height:1;}\n.dshpc-btn--lg{--btn-pad:14px;height:var(--dshpc-control-h-lg);padding:0 var(--btn-pad);font-size:var(--dshpc-font-md);line-height:1;}\n/* block：撑满父宽（表单底栏 / 抽屉底部的主操作） */\n.dshpc-btn--block{display:flex;width:100%;}\n/* block + 前置图标 ⇒ 文字视觉居中（2026-10-19 用户点名）：\n   内容组 [图标 + 间距 + 文字] 整体在盒内居中时，**文字**的中心会被图标推右半格。\n   把右内边距补上「图标宽 + 间距」，可用盒随之左移同量 ⇒ 文字落回视觉中心，图标贴左侧。\n   图标宽按 1.2em 估（官方图标 14/16px vs 字号 12/13px），em 随字号档自动缩放。 */\n.dshpc-btn--block.dshpc-btn--icon-start{padding-right:calc(var(--btn-pad) + 1.2em + 6px);}\n/* 图标比同档文字小一号（用户 2026-11-02）：容器吃掉 0.875em，内联 SVG 一律跟随 1em，\n   不再由调用方的 size={16} 说了算 —— 全站按钮图标尺寸只由这一处决定。 */\n.dshpc-btn__icon,.dshpc-btn__icon-end{display:inline-flex;align-items:center;justify-content:center;flex:none;line-height:0;font-size:.875em;}\n.dshpc-btn__icon svg,.dshpc-btn__icon-end svg{display:block;margin:0;width:1em;height:1em;}\n/* maxWidth 包 MarqueeText 时：标签作为 flex 子项必须能收缩到内容以下，否则省略号 / 跑马灯测不准 */\n.dshpc-btn .dshpc-btn__label{min-width:0;}\n/* loading：不换 DOM 结构，只在文案前插一枚 Loader（size=xs，12px）。\n   环的画法与动画统一在 controls/loader.css（本文件不再维护第二份 SVG 弧 / keyframes）。 */\n\n/* 交互态：颜色变化写在变量上 ⇒ 所有档位一次生效，且变化幅度由 token 决定（够明显） */\n.dshpc-btn:hover:not(:disabled){background-color:var(--btn-bg-hover);color:var(--btn-fg-hover);}\n.dshpc-btn:active:not(:disabled){background-color:var(--btn-bg-active);transform:translateY(1px);}\n.dshpc-btn:focus-visible{outline:2px solid var(--dshpc-focus);outline-offset:2px;}\n.dshpc-btn:disabled{cursor:default;opacity:.5;}\n/* dense：尺寸档 / 高度一律不变，只把图标放大一档、内距收紧（描边细的文件类型图标用）。\n   只覆盖局部变量与图标字号，不另写一套皮肤；必须写在尺寸档与图标规则之后才压得过默认值。 */\n.dshpc-btn--dense{--btn-pad:6px;}\n.dshpc-btn--dense .dshpc-btn__icon,.dshpc-btn--dense .dshpc-btn__icon-end{font-size:1.25em;}\n\n.dshpc-btn--primary{--btn-bg:var(--dshpc-accent);--btn-fg:var(--dshpc-fg-inverse);\n  --btn-bg-hover:var(--dshpc-accent-hover);--btn-bg-active:var(--dshpc-accent-active);}\n/* secondary：中性实心（灰面），用于「取消 / 次要」这类与主操作并排的按钮 */\n.dshpc-btn--secondary{--btn-bg:var(--dshpc-hover);--btn-fg:var(--dshpc-fg);\n  --btn-bg-hover:var(--dshpc-active);--btn-bg-active:var(--dshpc-active);}\n.dshpc-btn--outline{--btn-bg:var(--dshpc-surface-1);--btn-border:var(--dshpc-border-strong);\n  --btn-bg-hover:var(--dshpc-hover);--btn-bg-active:var(--dshpc-active);}\n.dshpc-btn--ghost{--btn-fg:var(--dshpc-fg-2);--btn-fg-hover:var(--dshpc-fg);\n  --btn-bg-hover:var(--dshpc-hover);--btn-bg-active:var(--dshpc-active);}\n.dshpc-btn--danger{--btn-bg:var(--dshpc-danger);--btn-fg:var(--dshpc-on-signal);\n  --btn-bg-hover:var(--dshpc-danger-hover);--btn-bg-active:var(--dshpc-danger-active);}\n.dshpc-btn--success{--btn-bg:var(--dshpc-success);--btn-fg:var(--dshpc-on-signal);\n  --btn-bg-hover:var(--dshpc-success-hover);--btn-bg-active:var(--dshpc-success-active);}\n.dshpc-btn--warning{--btn-bg:var(--dshpc-warning);--btn-fg:var(--dshpc-on-warning);\n  --btn-bg-hover:var(--dshpc-warning-hover);--btn-bg-active:var(--dshpc-warning-active);}\n.dshpc-btn--info{--btn-bg:var(--dshpc-business);--btn-fg:var(--dshpc-on-signal);\n  --btn-bg-hover:var(--dshpc-business-hover);--btn-bg-active:var(--dshpc-business-active);}\n/* 扩展八色实心（2026-10-29）：白字两主题均 ≥4.5:1；hover/active 走各自 token 派生。 */\n.dshpc-btn--purple{--btn-bg:var(--dshpc-purple);--btn-fg:var(--dshpc-on-signal);\n  --btn-bg-hover:var(--dshpc-purple-hover);--btn-bg-active:var(--dshpc-purple-active);}\n.dshpc-btn--pink{--btn-bg:var(--dshpc-pink);--btn-fg:var(--dshpc-on-signal);\n  --btn-bg-hover:var(--dshpc-pink-hover);--btn-bg-active:var(--dshpc-pink-active);}\n.dshpc-btn--cyan{--btn-bg:var(--dshpc-cyan);--btn-fg:var(--dshpc-on-signal);\n  --btn-bg-hover:var(--dshpc-cyan-hover);--btn-bg-active:var(--dshpc-cyan-active);}\n.dshpc-btn--teal{--btn-bg:var(--dshpc-teal);--btn-fg:var(--dshpc-on-signal);\n  --btn-bg-hover:var(--dshpc-teal-hover);--btn-bg-active:var(--dshpc-teal-active);}\n.dshpc-btn--orange{--btn-bg:var(--dshpc-orange);--btn-fg:var(--dshpc-on-signal);\n  --btn-bg-hover:var(--dshpc-orange-hover);--btn-bg-active:var(--dshpc-orange-active);}\n.dshpc-btn--indigo{--btn-bg:var(--dshpc-indigo);--btn-fg:var(--dshpc-on-signal);\n  --btn-bg-hover:var(--dshpc-indigo-hover);--btn-bg-active:var(--dshpc-indigo-active);}\n.dshpc-btn--rose{--btn-bg:var(--dshpc-rose);--btn-fg:var(--dshpc-on-signal);\n  --btn-bg-hover:var(--dshpc-rose-hover);--btn-bg-active:var(--dshpc-rose-active);}\n.dshpc-btn--slate{--btn-bg:var(--dshpc-slate);--btn-fg:var(--dshpc-on-signal);\n  --btn-bg-hover:var(--dshpc-slate-hover);--btn-bg-active:var(--dshpc-slate-active);}\n/* danger-outline：红字描边（破坏性次要操作，如卡片上的「删除」）。\n   ⚠️ 旧修饰类 danger-ink 保留为别名（消费方可能还在挂），两者同一套皮肤。 */\n.dshpc-btn--danger-outline,.dshpc-btn--danger-ink{--btn-border:var(--dshpc-danger);--btn-fg:var(--dshpc-danger);\n  --btn-fg-hover:var(--dshpc-danger);--btn-bg-hover:var(--dshpc-danger-soft);--btn-bg-active:var(--dshpc-danger-soft);}\n/* link：行内文字链接型（会话 / 产出文件名），无底无边、品牌蓝、hover 下划线 */\n.dshpc-btn--link{--btn-fg:var(--dshpc-link);--btn-fg-hover:var(--dshpc-link);\n  --btn-bg-hover:transparent;--btn-bg-active:transparent;\n  height:auto;padding:0;border:0;background:none;font-weight:400;text-align:left;}\n.dshpc-btn--link:hover:not(:disabled){text-decoration:underline;}\n\n/* 图标钮：纯图标，方形；尺寸档的宽高与同档文字按钮等高、圆角统一吃 md（与 .dshpc-btn 同款，2026-10-28 拍板）\n   底色 / 图标色全走局部变量：默认**无底色**，消费方可传 color（图标色）/ background（底色）覆盖（用户 2026-11-02）。 */\n.dshpc-iconbtn{--icb-bg:transparent;--icb-bg-hover:var(--dshpc-hover);--icb-fg:var(--dshpc-fg-2);--icb-fg-hover:var(--dshpc-fg);\n  appearance:none;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;padding:0;\n  border:1px solid var(--icb-border,transparent);border-radius:var(--dshpc-radius-md);\n  background:var(--icb-bg);color:var(--icb-fg);\n  font-family:inherit;cursor:pointer;flex:none;\n  transition:background-color var(--dshpc-dur-fast) var(--dshpc-ease),border-color var(--dshpc-dur-fast) var(--dshpc-ease),color var(--dshpc-dur-fast) var(--dshpc-ease),opacity var(--dshpc-dur-fast) var(--dshpc-ease);}\n.dshpc-iconbtn--sm{width:var(--dshpc-control-h-sm);height:var(--dshpc-control-h-sm);font-size:var(--dshpc-font-sm);}\n.dshpc-iconbtn--md{width:var(--dshpc-control-h-md);height:var(--dshpc-control-h-md);font-size:var(--dshpc-font-md);}\n.dshpc-iconbtn--lg{width:var(--dshpc-control-h-lg);height:var(--dshpc-control-h-lg);font-size:var(--dshpc-font-md);}\n/* 图标与文字按钮同口径：SVG 一律跟随 1em（比 16px 档小一号）。\n   ⚠️ flex:none 是硬约束：svg 是按钮的直接 flex item，默认 flex-shrink:1 会被按钮内距\n   挤成 10px 窄条；那是布局收缩，不是层叠优先级 —— 改 width、加 !important 都救不回来，\n   而 height 在交叉轴不受影响，于是图标被压扁变形。后代选择器兼容官方图标外的 wrapper。 */\n.dshpc-iconbtn svg{display:block;width:1em;height:1em;flex:none;}\n/* dense：只放大图标的 em 值，正方形宽高与高度档都不动；\n   1.25em 相对按钮字号 12/13 ⇒ 15/16.25px，与 .dshpc-btn--dense 一致。 */\n.dshpc-iconbtn.dshpc-iconbtn--dense svg{width:1.25em;height:1.25em;}\n.dshpc-iconbtn--outline{--icb-bg:var(--dshpc-surface-1);--icb-border:var(--dshpc-border);}\n.dshpc-iconbtn--danger{--icb-fg:var(--dshpc-danger);--icb-bg-hover:var(--dshpc-danger-soft);--icb-fg-hover:var(--dshpc-danger);}\n.dshpc-iconbtn:hover:not(:disabled){background:var(--icb-bg-hover);color:var(--icb-fg-hover);}\n.dshpc-iconbtn:focus-visible{outline:2px solid var(--dshpc-focus);outline-offset:2px;}\n.dshpc-iconbtn:disabled{cursor:default;opacity:.4;}\n\n/* ── 行式文件按钮（图标 + 文件名）P2：**全站唯一实现**（2026-10-04 收编）──────────\n   用途：「产出物 / 附件」那种**一行一个文件**的清单项（基础信息右栏产出物清单、附件区、\n   执行记录页的展开区）。平时透明、**鼠标移上去才出浅底**（沿用用户 2026-10-03 定的观感）。\n   两个形态修饰类：\n     --block   撑满父宽（清单里一项一行）\n     --inline  内容宽（跟在文字后头，如附件行）\n   收编原因：这份皮肤此前只写在 task-list.tsx 的 TASK_LIST_CSS 里（旧名 .dshpc-info-out），\n   执行记录页展开区要用同一种观感 ⇒ 上提基础层，避免再出现「各写一份外观」（同名不同皮的坑刚踩过）。 */\n.dshpc-filechip{appearance:none;-webkit-appearance:none;border:0;border-radius:var(--dshpc-radius-xs);\n  background:transparent;color:var(--dshpc-fg);font:inherit;text-align:left;cursor:pointer;min-width:0;\n  transition:background-color var(--dshpc-dur) var(--dshpc-ease);}\n.dshpc-filechip:hover:not(:disabled){background:var(--dshpc-chip-bg);}\n.dshpc-filechip:focus-visible{outline:2px solid var(--dshpc-focus);outline-offset:1px;}\n.dshpc-filechip:disabled{cursor:default;background:transparent;color:var(--dshpc-fg-3);}\n.dshpc-filechip--block{display:flex;align-items:center;gap:6px;width:100%;box-sizing:border-box;\n  padding:4px 6px;font-size:var(--dshpc-font-xs);}\n.dshpc-filechip--inline{display:inline-flex;align-items:center;gap:4px;padding:2px 6px;font-size:var(--dshpc-font-sm);}\n\n@media (prefers-reduced-motion: reduce){.dshpc-btn,.dshpc-iconbtn,.dshpc-filechip{transition:none;}}\n";
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/ui/inputs/field-css.generated.js
		const FIELD_CSS = "\n/* ── 字段 + 问号提示（hint 参数内置） ──────────────────────────────────── */\n/* 控件 + FieldHint 同一行；hint 版由组件自己包，调用方只传 hint 字符串。\n   铺满型控件（input/textarea）进包后改吃 flex 弹性，让位给问号。 */\n.dshpc-fieldwrap{display:flex;align-items:center;gap:6px;min-width:0;max-width:100%;}\n.dshpc-fieldwrap--inline{display:inline-flex;}\n.dshpc-fieldwrap > .dshpc-input,.dshpc-fieldwrap > .dshpc-textarea,.dshpc-fieldwrap > .dshpc-iwrap{flex:1 1 auto;width:auto;min-width:0;}\n/* 多行输入：问号钉在**右下角**（2026-10-20 用户：不要垂直居中），文本区底部留出它的位置。\n   ⚠️ 这一档必须把 textarea 的宽度还回去（上面那条 flex 让位规则会把它缩窄）。 */\n.dshpc-fieldwrap--block{position:relative;display:block;}\n.dshpc-fieldwrap--block > .dshpc-textarea{width:100%;padding-bottom:24px;}\n.dshpc-fieldwrap--block > .dshpc-hint{position:absolute;right:8px;bottom:6px;}\n\n/* ── 输入类 P3 ────────────────────────────────────────────────────────── */\n/* 默认铺满容器（width:100%，与 .dshpc-textarea 同口径）：input 原生按 size 属性取内在宽，\n   不铺满 ⇒ 调用方套定宽壳时会「右边空一截、看着没贴右」（2026-10-20 用户抓的 bug）。\n   要定宽由调用方在外面套壳控制（如 192px 搜索槽）。 */\n.dshpc-input{display:block;width:100%;box-sizing:border-box;border:1px solid var(--dshpc-border-heavy);border-radius:var(--dshpc-radius-md);\n  background:var(--dshpc-surface-1);color:var(--dshpc-fg);font-family:inherit;outline:none;\n  transition:border-color var(--dshpc-dur-fast) var(--dshpc-ease),box-shadow var(--dshpc-dur-fast) var(--dshpc-ease);}\n.dshpc-input--sm{height:var(--dshpc-control-h-sm);padding:0 8px;font-size:var(--dshpc-font-sm);line-height:var(--dshpc-line-sm);}\n.dshpc-input--md{height:var(--dshpc-control-h-md);padding:0 10px;font-size:var(--dshpc-font-md);line-height:var(--dshpc-line-md);}\n.dshpc-input--lg{height:var(--dshpc-control-h-lg);padding:0 12px;font-size:var(--dshpc-font-md);line-height:var(--dshpc-line-md);}\n.dshpc-input::placeholder{color:var(--dshpc-fg-3);}\n/* type=\"search\"：原生清除钮（::-webkit-search-cancel-button）整个隐掉，换组件自己挂的 plain IconButton\n   —— 原生那个各子系统长相不一、还不吃 token（2026-10-28 用户：不好看，要数字框加减号那种）。 */\n.dshpc-iwrap .dshpc-input::-webkit-search-cancel-button{display:none;}\n.dshpc-input:focus{border-color:var(--dshpc-focus);box-shadow:0 0 0 1px var(--dshpc-focus);}\n.dshpc-input--error{border-color:var(--dshpc-danger);}\n.dshpc-input:disabled{cursor:default;opacity:.5;}\n\n/* 左侧图标槽（Input 的 icon 参数）：图标绝对定位压在输入框的左内边距上，\n   输入框自己的边框 / 焦点圈 / 描红一律不动。图标不吃点击（pointer-events:none）⇒ 点在图标上照样聚焦。\n   左内边距 = 左偏 8 + 图标宽（sm 14 / md·lg 16，见 fieldMetricsOf）+ 间距 4。 */\n.dshpc-iwrap{position:relative;display:block;width:100%;min-width:0;}\n.dshpc-iwrap__icon{position:absolute;left:8px;top:50%;transform:translateY(-50%);display:inline-flex;pointer-events:none;color:var(--dshpc-fg-2);}\n.dshpc-iwrap--sm > .dshpc-input{padding-left:26px;}\n.dshpc-iwrap--md > .dshpc-input,.dshpc-iwrap--lg > .dshpc-input{padding-left:28px;}\n/* 禁用时图标跟输入框一起变淡（输入框自己已有 opacity:.5，图标不在它里面，得单独跟一下）。 */\n.dshpc-iwrap:has(> .dshpc-input:disabled) > .dshpc-iwrap__icon{opacity:.5;}\n\n/* 搜索框的清空钮（Field.ts 在「有焦点 + 有内容」时才挂出来）：**并进框里**，与数字框的 − / +\n   同形态 —— 整段同高、左直右圆、hover 底色铺满这一格（2026-10-28 用户：不要一颗悬在右边的小按钮）。\n   向内让 1px，免得底色压住输入框自己的边框。 */\n.dshpc-iwrap__clear.dshpc-iconbtn{position:absolute;right:1px;top:1px;bottom:1px;height:auto;width:auto;aspect-ratio:1;\n  border-radius:0 var(--dshpc-radius-md) var(--dshpc-radius-md) 0;font-size:var(--dshpc-font-md);}\n/* height:auto 必须：iconbtn--md/lg 的固定 height 会让 absolute 的 bottom 被忽略\n   （top:1 + 固定高 ⇒ 整钮错位 1px，× 显得没居中，2026-10-28 用户截图抓的）。 */\n/* 文字让开这一段（宽度 = 控件高 - 2，故按档位补）。 */\n.dshpc-iwrap--clear > .dshpc-input{padding-right:calc(var(--dshpc-control-h-md) + 3px);}\n.dshpc-iwrap--clear.dshpc-iwrap--sm > .dshpc-input{padding-right:calc(var(--dshpc-control-h-sm) + 3px);}\n.dshpc-iwrap--clear.dshpc-iwrap--lg > .dshpc-input{padding-right:calc(var(--dshpc-control-h-lg) + 3px);}\n\n.dshpc-pfx{display:inline-flex;align-items:center;box-sizing:border-box;overflow:hidden;\n  border:1px solid var(--dshpc-border-heavy);border-radius:var(--dshpc-radius-md);background:var(--dshpc-surface-1);color:var(--dshpc-fg);}\n.dshpc-pfx--sm{height:var(--dshpc-control-h-sm);}\n.dshpc-pfx--md{height:var(--dshpc-control-h-md);}\n.dshpc-pfx--lg{height:var(--dshpc-control-h-lg);}\n/* md / lg 档字号跟档走（与同档下拉同字号）：此前写死 sm(12px)，同排下拉是 13px ⇒ 显得「input 字小」。 */\n.dshpc-pfx--md .dshpc-pfx__label,.dshpc-pfx--lg .dshpc-pfx__label{font-size:var(--dshpc-font-md);line-height:var(--dshpc-line-md);}\n.dshpc-pfx--md .dshpc-pfx__input,.dshpc-pfx--lg .dshpc-pfx__input{font-size:var(--dshpc-font-md);line-height:var(--dshpc-line-md);}\n.dshpc-pfx--error{border-color:var(--dshpc-danger);}\n.dshpc-pfx:focus-within{border-color:var(--dshpc-focus);box-shadow:0 0 0 1px var(--dshpc-focus);}\n.dshpc-pfx__label{padding:0 8px;color:var(--dshpc-fg-2);font-size:var(--dshpc-font-sm);line-height:var(--dshpc-line-sm);white-space:nowrap;border-right:1px solid var(--dshpc-border);}\n.dshpc-pfx__input{flex:1 1 auto;min-width:0;height:100%;padding:0 8px;border:0;background:transparent;color:var(--dshpc-fg);\n  font-family:inherit;font-size:var(--dshpc-font-sm);line-height:var(--dshpc-line-sm);outline:none;}\n.dshpc-pfx__input::placeholder{color:var(--dshpc-fg-3);}\n\n.dshpc-num{display:inline-flex;align-items:center;justify-content:space-between;box-sizing:border-box;overflow:hidden;\n  border:1px solid var(--dshpc-border-heavy);border-radius:var(--dshpc-radius-md);background:var(--dshpc-surface-1);color:var(--dshpc-fg);}\n/* 中段：数字 + 后缀成组居中；容器被消费端拉宽时吃掉全部余量，两端 − / + 因此钉死在左右边缘。 */\n.dshpc-num__mid{display:flex;align-items:center;justify-content:center;flex:1 1 auto;min-width:0;}\n.dshpc-num--sm{height:var(--dshpc-control-h-sm);}\n.dshpc-num--md{height:var(--dshpc-control-h-md);}\n.dshpc-num--lg{height:var(--dshpc-control-h-lg);}\n.dshpc-num--md .dshpc-num__input,.dshpc-num--lg .dshpc-num__input{font-size:var(--dshpc-font-md);line-height:var(--dshpc-line-md);}\n.dshpc-num--md .dshpc-num__suffix,.dshpc-num--lg .dshpc-num__suffix{font-size:var(--dshpc-font-md);}\n.dshpc-num--disabled{opacity:.5;}\n/* 焦点态与 Input 同款（2026-10-20 用户：数字框里点进去没有蓝框）：内层 input 无边框，\n   焦点状态画在整个步进控件外框上。 */\n.dshpc-num:focus-within{border-color:var(--dshpc-focus);box-shadow:0 0 0 1px var(--dshpc-focus);}\n.dshpc-num__input{width:36px;height:100%;padding:0 2px;border:0;background:transparent;color:var(--dshpc-fg);\n  font-family:inherit;font-size:var(--dshpc-font-sm);line-height:var(--dshpc-line-sm);text-align:center;outline:none;}\n.dshpc-num__suffix{padding:0 6px;color:var(--dshpc-fg-2);font-size:var(--dshpc-font-sm);white-space:nowrap;}\n.dshpc-num .dshpc-iconbtn{border-radius:0;color:var(--dshpc-fg-2);flex:none;}\n\n/* 官方 Switch 包装统一：选中 = success 绿。\n   （合并原先 task-editor-css / task-list 两处就地覆盖；选择器带包装类 + role，特异性高于官方。） */\n.dshpc-switch button[role='switch'][aria-checked='true']{background:var(--dshpc-success);}\n\n/* 多行文本输入（提示词等，P3）：**边框 / 圆角 / 底 / 焦点态与 Input 同一套口径**（用户 2026-10-20：\n   「多行输入应该和 input 的边儿是一个道理，包括圆角在内，都是一个东西」）。\n   ⚠️ 旧意图「卡内无边框、视觉重心在整张卡上」已作废 —— 现在它就是一只带框的多行输入框。\n   （从 task-editor-css 的 .dshpc-ed-prompt 上提而来；业务文件不再自写 textarea 皮肤。） */\n.dshpc-textarea{display:block;width:100%;box-sizing:border-box;min-height:132px;padding:8px 12px;\n  border:1px solid var(--dshpc-border-heavy);border-radius:var(--dshpc-radius-md);outline:none;\n  background:var(--dshpc-surface-1);color:var(--dshpc-fg);font-family:inherit;font-size:var(--dshpc-font-lg);line-height:1.6;resize:vertical;\n  transition:border-color var(--dshpc-dur-fast) var(--dshpc-ease),box-shadow var(--dshpc-dur-fast) var(--dshpc-ease);}\n.dshpc-textarea::placeholder{color:var(--dshpc-fg-3);}\n.dshpc-textarea:focus{border-color:var(--dshpc-focus);box-shadow:0 0 0 1px var(--dshpc-focus);}\n/* 校验不通过：与 Input 一致，走边框描红（旧版是 box-shadow 描红盒，与 Input 不同口径） */\n.dshpc-textarea--error{border-color:var(--dshpc-danger);}\n.dshpc-textarea:disabled{cursor:default;opacity:.5;}\n@media (prefers-reduced-motion: reduce){.dshpc-textarea{transition:none;}}\n\n/* 拖拽分隔条（编辑分栏 / 预览 dock 共用，U20 #3）：6px 命中区，col-resize，不画线，hover/按下浮出浅带。\n   具体 z-index 由 .dshpc-ed-resizer / .dshpc-sv-resizer 各自补。 */\n.dshpc-resizer{position:absolute;top:0;bottom:0;left:0;width:6px;cursor:col-resize;background:0 0;touch-action:none;user-select:none;}\n.dshpc-resizer:hover,.dshpc-resizer:active{background:var(--dshpc-hover);}\n\n@media (prefers-reduced-motion: reduce){.dshpc-input,.dshpc-pfx{transition:none;}}\n";
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/ui/feedback/loader-css.generated.js
		const LOADER_CSS = "/* ── Loader：统一的加载动画图标（无背景 / 无定位 / 颜色跟随 currentColor）────────\n   形态 × 尺寸两轴正交：形态管几何与动画；尺寸档只改 width / height，几何按\n   viewBox=\"0 0 24 24\" 等比缩放 —— 一套几何吃五档，12px 时描边即 1.5px、48px 时 6px，\n   视觉重量一致，不用逐个尺寸换算 calc。\n\n   边界：本控件**只管图标本身**。背景 / 圆角 / 内距 / 阴影 / 定位（fixed、居中、漂浮）\n   一律归调用方 —— 套 Chip、套 Card，或自己包一个 div。 */\n\n.dshpc-loader { display: inline-block; flex: none; vertical-align: middle; line-height: 0; color: inherit; }\n\n.dshpc-loader--xs { width: 12px; height: 12px; }\n.dshpc-loader--sm { width: 16px; height: 16px; }\n.dshpc-loader--md { width: 24px; height: 24px; }\n.dshpc-loader--lg { width: 32px; height: 32px; }\n.dshpc-loader--xl { width: 48px; height: 48px; }\n\n/* 形态一 ring：开口弧整体旋转。必须走 SVG 矢量弧 —— 次像素边框画圆在 12px 下会被\n   抗锯齿拉毛、看着像圆角方（2026-10-20 真机实测，曾被误判成 border-radius 被覆盖）。 */\n.dshpc-loader--ring { animation: dshpc-loader-rotate .8s linear infinite; }\n@keyframes dshpc-loader-rotate { to { transform: rotate(360deg) } }\n\n/* 形态二 blocks：三个方块依次脉动放大。\n   transform-box: fill-box 是 SVG 子元素做 CSS transform 的必要条件 —— 否则 origin\n   落在 viewBox 原点，节点会绕着左上角飞出去。 */\n.dshpc-loader__node { transform-box: fill-box; transform-origin: center; }\n.dshpc-loader--blocks .dshpc-loader__node { animation: dshpc-loader-blink 1.2s ease-in-out infinite; }\n.dshpc-loader__node:nth-child(2) { animation-delay: .15s; }\n.dshpc-loader__node:nth-child(3) { animation-delay: .3s; }\n@keyframes dshpc-loader-blink {\n  0%, 80%, 100% { opacity: .25; transform: scale(.8) }\n  40% { opacity: 1; transform: scale(1) }\n}\n\n/* 降低动效：停在「全部可见、实体大小」，而不是停在动画中途的半透明小点。 */\n@media (prefers-reduced-motion: reduce) {\n  .dshpc-loader--ring { animation: none; }\n  .dshpc-loader__node { animation: none; opacity: 1; transform: none; }\n}\n";
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/ui/display/hint-css.generated.js
		const HINT_CSS = "\n/* ── 问号提示 P4（用户 2026-10-18：对齐真实插件 HelpButton——**带圈的问号图标**）──\n   本体 14px 细圈 + 圈内 ?，颜色 fg-3、hover 只提亮不加底（与 dshpc-ed-help 同规矩）。\n   气泡不在本文件：2026-10-19 用户拍板「问号必须用官方 Tooltip 那一个」⇒ 气泡由注入的\n   官方组件渲染（src/ui/tooltip.ts），这里只管问号图标本身。 */\n.dshpc-hint{display:inline-flex;align-items:center;justify-content:center;flex:none;\n  box-sizing:border-box;width:14px;height:14px;padding:0;border:1px solid currentColor;border-radius:50%;background:transparent;\n  color:var(--dshpc-fg-3);font-family:inherit;font-size:8px;font-weight:600;line-height:12px;cursor:help;vertical-align:middle;\n  transition:color var(--dshpc-dur-fast) var(--dshpc-ease);}\n.dshpc-hint:hover,.dshpc-hint:focus-visible{color:var(--dshpc-fg);background:0 0;}\n.dshpc-hint:focus-visible{outline:2px solid var(--dshpc-focus);outline-offset:1px;}\n";
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/ui/display/FieldHint.js
		/**
		* 问号提示 —— **全站唯一实现、独立组件**（L2，P4）
		*
		* ⚠️ 它**不属于 Input 家族**：任何地方都能挂——表单行尾、标题后面、卡片角落……
		* 调用点自己把它排进自己的 flex / label 里即可（组件只是 14px 的内联图标 + 气泡）。
		*
		* 气泡渲染 = **官方 Tooltip 本体**（2026-10-19 用户拍板「必须和悬停提示用同一个」）：
		* 插件启动时 `setTooltipRenderer` 把官方 Tooltip 交给 core，本组件直接走它。
		* ⚠️ **不做降级兜底**（用户同日明确：宿主内官方包恒在；官方改版 = 我们重新适配，不另造一套）。
		* 未注入 renderer 的环境（node 自检）只出问号图标、没有气泡——那是非宿主环境，不是产品形态。
		*/
		/** 问号提示图标：hover / focus 浮出说明气泡（官方 Tooltip 渲染）。 */
		function FieldHint(props) {
			ensureComponentStyles("hint", HINT_CSS);
			const { text, side, align, maxWidth, className, style } = props;
			return (0, react.createElement)("span", {
				className: `dshpc-hint${className !== void 0 && className !== "" ? ` ${className}` : ""}`,
				style,
				tabIndex: 0,
				role: "note",
				"aria-label": text
			}, "?");
		}
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/ui/display/marquee-css.generated.js
		const MARQUEE_CSS = "/* 跑马灯（MarqueeText）：双层——外层只裁剪，内层才 transform 滚动；非 hover 内层自带省略号。\n   2026-10-20：本文件原是杂烩「select.css」（下拉 / 日历 / 时分的皮肤都装过），随着那些控件\n   一个个删完，最后只剩跑马灯，故按本包「一个 css 服务一个对象」的格局改名归档。\n   同批清掉的还有零引用的省略号类 .dshpc-ellipsis —— 本包三个用到截断的地方都没采纳它。 */\n.dshpc-mq{display:block;overflow:hidden;white-space:nowrap;}\n.dshpc-mq .dshpc-mq-in{display:inline-block;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis;vertical-align:top;}\n/* ⚠️ 跑法（用户 2026-10-03 拍板）：**跑一遍、停在尾字**（播放 1 次 + forwards），不来回弹、不无限跑。\n   滚距 = 精确溢出量 ⇒ 停下时最后一个字正好贴右缘，**不会跑进黑块**（黑块是旧手写版把\n   内层盒子裁了、按「半截文本」平移导致的）。鼠标移开 ⇒ :hover 失效 ⇒ 自动复位回省略号态。 */\n.dshpc-mq-run:hover .dshpc-mq-in{max-width:none;overflow:visible;animation:dshpc-mq-scroll var(--dshpc-mq-dur,6s) linear .4s 1 forwards;}\n@keyframes dshpc-mq-scroll{from{transform:translateX(0)}to{transform:translateX(var(--dshpc-mq-dist,-40px))}}\n/* 溢出渐影（用户 2026-10-24 拍板「左右稍微有点渐影」；官方口径 = dsh-client-ui-primitives@0.2.1-rc.2\n   PathLabel.module.css:13-15：mask-image 线性渐隐 + 28px 随官方）。⚠️ 只在 **hover 滚动态** 加：\n   静态态（三个点）不要渐影（用户 2026-10-24 二次拍板），hover 滚动时两端渐影——左缘柔化被裁的文字头。 */\n/* token-ok：遮罩模板色（纯黑 = 完全不透明），不是主题色；换主题也不该变。 */\n.dshpc-mq-run:hover{mask-image:linear-gradient(to right, transparent, #000 28px, #000 calc(100% - 28px), transparent);}\n";
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/ui/display/MarqueeText.js
		/**
		* 跑马灯文本 —— **全站唯一实现**（L2，P6 从 editor-fields 迁入 ui）
		*
		* 默认超长省略号；hover 且确实放不下时，来回滚动展示全名。自实现原因：官方 primitives 无跑马灯组件。
		* 测宽用 ResizeObserver + 文本变化重测；滚动距离 0 时不启用 hover 动画（`.dshpc-mq-run` 才有动画）。
		*
		* **双层结构**：外层 `.dshpc-mq` 只负责裁剪（overflow:hidden），内层 `.dshpc-mq-in` 才做
		* transform 滚动——文字永远在自己那一块里跑，不会压到相邻文字。皮肤在 `controls-css.ts`。
		*/
		/** 跑马灯文本。 */
		function MarqueeText(props) {
			ensureComponentStyles("marquee", MARQUEE_CSS);
			const outerRef = (0, react.useRef)(null);
			const innerRef = (0, react.useRef)(null);
			const [dist, setDist] = (0, react.useState)(0);
			const measure = (0, react.useCallback)(() => {
				const outer = outerRef.current;
				const inner = innerRef.current;
				if (outer === null || inner === null) return;
				setDist(Math.max(0, Math.ceil(inner.scrollWidth - outer.clientWidth)));
			}, []);
			(0, react.useLayoutEffect)(() => {
				const outer = outerRef.current;
				const inner = innerRef.current;
				if (outer === null || inner === null) return;
				measure();
				const ro = new ResizeObserver(measure);
				ro.observe(outer);
				ro.observe(inner);
				return () => {
					ro.disconnect();
				};
			}, [measure]);
			(0, react.useEffect)(() => {
				measure();
			}, [props.text, measure]);
			const run = dist > 0;
			return (0, react.createElement)("span", {
				ref: outerRef,
				className: (run ? "dshpc-mq dshpc-mq-run" : "dshpc-mq") + (props.className === void 0 ? "" : ` ${props.className}`),
				style: props.style
			}, (0, react.createElement)("span", {
				ref: innerRef,
				className: "dshpc-mq-in",
				style: { ...run ? {
					"--dshpc-mq-dist": `${-dist}px`,
					"--dshpc-mq-dur": `${Math.max(3, Math.round(dist / 30))}s`
				} : null }
			}, props.text));
		}
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/ui/infra/panel-css.generated.js
		const PANEL_CSS = "/* 浮层面板皮肤（2026-11-03 用户定：皮肤统一，只改样式不动交互）。\n *\n * 这份文件是**所有「浮起来的框」的皮肤真源**。定位（fixed / absolute、贴谁、怎么翻转、多大的\n * 层序）留在各自控件里，这里只管表面四件：底色 / 描边宽 / 圆角 / 阴影。\n * ⚠️ 组件 CSS 里不许再写这四个字面值 —— 想改外观就改这里，别在消费方另起一套。\n *\n * 三档（差异只在这三段定义，别处分叉）：\n *   --modal    居中模态（Modal / ConfirmModal / AlertModal 家族）\n *   --popover  贴锚点的浮层面板（pickWorkspaceFile 选文件弹窗、DateTimePicker 弹层）\n *   --menu     下拉菜单（文件浏览器 ▾ 选层、Picker 下拉）\n *\n * 不并入三档的：PanelDock 与 SideSheet 是**贴边家族**（side-panel.css 的\n * .dshpc-side-surface，surface-base、无外描边）—— 2026-11-02 拍板「两者皮肤一模一样」，\n * 一个是布局成员、一个是贴边抽屉，都不是浮层。\n */\n.dshpc-panel{\n  background:var(--dshpc-panel-bg);color:var(--dshpc-fg);\n  border:var(--dshpc-panel-bw) solid var(--dshpc-border);\n  border-radius:var(--dshpc-panel-radius);box-shadow:var(--dshpc-panel-shadow);\n}\n.dshpc-panel--modal{\n  --dshpc-panel-bg:var(--dshpc-surface-1);\n  --dshpc-panel-bw:3px;\n  --dshpc-panel-radius:var(--dshpc-radius-xl);\n  --dshpc-panel-shadow:var(--dshpc-shadow-2);\n  overflow:hidden;\n}\n.dshpc-panel--popover{\n  --dshpc-panel-bg:var(--dshpc-surface-1);\n  --dshpc-panel-bw:1px;\n  --dshpc-panel-radius:var(--dshpc-radius-lg);\n  --dshpc-panel-shadow:var(--dshpc-shadow-2);\n  overflow:hidden;\n  /* 与 menu 同口径的加重描边；日期弹层与选文件弹窗共用这一档（2026-11-06）。 */\n  border-color:var(--dshpc-border-heavy);\n}\n.dshpc-panel--menu{\n  /* 菜单底与模态同一层（用户 2026-11-03：别用页面底色，暗色下看着全黑）。 */\n  --dshpc-panel-bg:var(--dshpc-surface-1);\n  --dshpc-panel-bw:1px;\n  /* 圆角与 popover 档统一成 lg（2026-11-06 用户：下拉框也改成 16）。 */\n  --dshpc-panel-radius:var(--dshpc-radius-lg);\n  --dshpc-panel-shadow:var(--dshpc-shadow-1);\n  /* 下拉菜单同样加重描边；modal 的 3px 边框不动。 */\n  border-color:var(--dshpc-border-heavy);\n}\n\n/* 浮层唯一的关闭钮（20×20 方角图标位）。\n   旧类名 .dshpc-overlay-head__close 保留为别名：消费方写在旧类名上的覆盖仍生效。 */\n.dshpc-panel__close,.dshpc-overlay-head__close{\n  display:inline-flex;align-items:center;justify-content:center;flex:none;\n  width:20px;height:20px;padding:0;border:none;border-radius:var(--dshpc-radius-sm);\n  background:transparent;color:var(--dshpc-fg-3);font-family:inherit;font-size:13px;line-height:1;cursor:pointer;\n  transition:background-color var(--dshpc-dur-fast) var(--dshpc-ease),color var(--dshpc-dur-fast) var(--dshpc-ease);\n}\n.dshpc-panel__close:hover,.dshpc-overlay-head__close:hover{background:var(--dshpc-hover);color:var(--dshpc-fg)}\n.dshpc-panel__close:focus-visible,.dshpc-overlay-head__close:focus-visible{outline:2px solid var(--dshpc-focus);outline-offset:1px}\n\n/* .dshpc-scroll-thin（细滚动条）的唯一定义已移到 design/tokens.css 的 tokens 域：\n   那里全局必在、挂类即生效。这里不再写第二份。 */\n";
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/ui/infra/overlay.js
		/**
		* 浮层公共件 —— Modal 与 SideSheet 共用，**别各写一份**。
		*
		* 抽出来的判据：这两件在两种浮层里完全同构（遮罩让位分栏、头部四槽、Esc 判定），
		* 差异只在「面板怎么排」（居中 vs 贴边），那部分留在各自的控件里。
		*/
		/**
		* 锁定广播：Modal / SideSheet `locked` 时把 true 传下去。
		* 为什么要有它：面板挂 `inert` 管不到 **portal 到 body** 的那几个浮层（Picker / 日期选择的菜单
		* 不在面板 DOM 里），锁定时它们还浮在屏幕上能点；那几个组件自己订阅这里、锁上就收起。
		*/
		const LockedContext = (0, react.createContext)(false);
		/** 外层浮层是否锁死（不在浮层里 = false）。 */
		function useOverlayLocked() {
			return (0, react.useContext)(LockedContext);
		}
		LockedContext.Provider;
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/ui/inputs/picker-css.generated.js
		const PICKER_CSS = "\n/* min-width:0 是给「作为 flex item」准备的：默认 min-width:auto 会被选中文本的 min-content\n   撑住，长模型名就把同一行的其它控件往左顶（2026-11-10 用户真机截图：三个输入框整体左移）。\n   给 0 后可收缩，文字由 __label 的省略号接住。 */\n.dshpc-picker{position:relative;display:inline-block;max-width:100%;min-width:0;font-size:13px;line-height:20px}\n.dshpc-picker__trigger{\n  display:inline-flex;align-items:center;justify-content:space-between;gap:6px;\n  min-width:120px;max-width:100%;height:28px;padding:0 8px;\n  color:var(--dshpc-fg);background:var(--dshpc-surface-1);\n  border:1px solid var(--dshpc-border-heavy);border-radius:var(--dshpc-radius-md);cursor:pointer;\n}\n.dshpc-picker__trigger:disabled{color:var(--dshpc-fg-dim);cursor:not-allowed;opacity:.7}\n/* 聚焦（键盘或点击选中）时与全站一致的蓝色描边；菜单打开后焦点会进去，触发器自然失去焦点。 */\n.dshpc-picker__trigger:focus-visible{outline:2px solid var(--dshpc-focus);outline-offset:1px}\n/* 文字默认靠左（吃掉剩余宽度），不给 space-between 把短文案推到中间的机会；\n   确实要居中就显式传 align=\"center\"。 */\n.dshpc-picker__label{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}\n.dshpc-picker__trigger--center .dshpc-picker__label{text-align:center}\n.dshpc-picker__caret{flex:none;color:var(--dshpc-fg-3)}\n.dshpc-picker__icon{display:inline-flex;flex:none;color:var(--dshpc-fg-2)}\n.dshpc-picker__option-icon{display:inline-flex;flex:none;color:var(--dshpc-fg-2)}\n/* 下拉面板只留定位 / 裁切 / 字号：底色·描边·圆角·阴影来自 panel.css 的 menu 档。 */\n.dshpc-picker__menu{\n  z-index:var(--dshpc-z-popmenu);max-height:280px;overflow:hidden;\n  display:flex;flex-direction:column;\n  /* 菜单经 FloatingPortal 挂到 body，脱离 .dshpc-picker，须显式字号，否则继承 body 的大字号 */\n  font-size:13px;line-height:20px;\n}\n/* 固定头部（提示 + 搜索框），不随列表滚（2026-11-06 用户）。 */\n.dshpc-picker__head{flex:none;padding:4px 4px 0}\n/* 滚动在内层：列表贴满面板内容区，1px 让位由 .dshpc-scroll-thin 统一给\n   （不留缝就贴死在边框内壁上，2026-11-06 用户反馈）。上下角溢出由面板 overflow:hidden 裁掉。 */\n.dshpc-picker__list{flex:1 1 auto;min-height:0;overflow-y:auto;padding:0 4px 4px}\n/* 尺寸档（与 Field 的 sm/md/lg 对应）。 */\n.dshpc-picker__trigger--sm{height:24px;font-size:12px}\n.dshpc-picker__trigger--lg{height:32px}\n/* ── 菜单内部：全部收进 .dshpc-picker__menu 作用域（不要退回裸单类）─────────────\n   每个消费插件都把 core 内联进自己的产物，同一页上可能同时挂着**旧版 core** 的同一批\n   dshpc-* 规则（v0.35.15 的选项是 4px 圆角、提示条是通栏 0 圆角）。旧规则与本文件同为\n   单类选择器（0,1,0），谁后挂载谁赢 —— 2026-11-10 用户真机：选中行 / 悬停行 / 黄色提示块\n   三处圆角全退回旧值，而搜索框（旧版碰巧同值）看着正常。\n   收进菜单祖先（0,2,0）后，无论新旧 CSS 谁先注入，当前版本都赢。\n   根治是类名跨版本隔离（已知未完成项）；在那之前，这层作用域不是可选修饰。 */\n\n/* 键盘游标所在项（无 hover 也要看得见）。 */\n.dshpc-picker__menu .dshpc-picker__option[data-active='true']{background:var(--dshpc-surface-sunken);outline:1px solid var(--dshpc-border)}\n.dshpc-picker__menu .dshpc-picker__option--clear{color:var(--dshpc-fg-3)}\n.dshpc-picker__menu .dshpc-picker__search{\n  width:100%;height:28px;margin-bottom:4px;padding:0 8px;box-sizing:border-box;\n  color:var(--dshpc-fg);background:var(--dshpc-surface-sunken);\n  border:1px solid var(--dshpc-border-heavy);border-radius:var(--dshpc-radius-md);outline:none;\n}\n.dshpc-picker__menu .dshpc-picker__search::placeholder{color:var(--dshpc-fg-3)}\n.dshpc-picker__menu .dshpc-picker__group-label{\n  padding:6px 8px 2px;color:var(--dshpc-fg-3);font-size:11px;\n}\n/* 圆角只跟全站「框 / 行」那一档走：--dshpc-radius-md。\n   真源是 Surface（surface.css:4-5「容器档 = --dshpc-radius-md，与 Button / Input 同档」），ListRow 的行\n   圆角也是从 Surface 继承的 —— 所以这里不能自己挑 xs/sm 之类更小的档。2026-11-10 用户真机截图：\n   搜索框（md）与被选中的蓝行（xs）圆角明显不齐，同在一个面板里像两套控件。\n   大圆角仍然只归外层菜单（panel.css 的 menu 档 + overflow:hidden）。 */\n.dshpc-picker__menu .dshpc-picker__option{\n  display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:var(--dshpc-radius-md);cursor:pointer;\n  color:var(--dshpc-fg);white-space:nowrap;\n}\n/* 行与行之间隔 1px（用户 2026-11-10 指名：只要 1px，不要间距四拍里的 4px —— 四档是排版用的，\n   这种「把两条底色分开一点」的细分缝是用户点名的值，按原样写）。 */\n.dshpc-picker__menu .dshpc-picker__option + .dshpc-picker__option{margin-top:1px}\n/* hover / 选中直接借 ListRow 的两条 token —— 同一个「行」语义，与列表条目对齐。\n   选中不染文字色：蓝字是「链接」语义，行选中只换底（list-row.css:44-47 的口径）。\n   2026-11-10 用户：原来蓝底蓝字 + 亮一点的灰，和 ListRow 完全不是一套。 */\n.dshpc-picker__menu .dshpc-picker__option:hover{background:var(--dshpc-listrow-hover-bg)}\n.dshpc-picker__menu .dshpc-picker__option--active{background:var(--dshpc-listrow-selected-bg);color:var(--dshpc-fg)}\n.dshpc-picker__menu .dshpc-picker__option--disabled{color:var(--dshpc-fg-dim);cursor:not-allowed}\n/* 选项文字吃掉剩余宽度：超长省略号（配合 MarqueeText hover 跑马灯），不撑宽菜单。 */\n.dshpc-picker__menu .dshpc-picker__option-label{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.dshpc-picker__menu .dshpc-picker__tick{width:12px;color:var(--dshpc-business)}\n.dshpc-picker__menu .dshpc-picker__empty{padding:8px;color:var(--dshpc-fg-3);text-align:center}\n/* 提示条（候选不完整 / 已到上限）与列表行同一套「块」：md 圆角 + 行内距，左右对齐搜索框与选项\n   （不再靠负 margin 伸到菜单内壁），只是配色换成提示黄。2026-11-10 用户：那条通栏太难看了，\n   要做成下面选中行那种框、用提示色。 */\n.dshpc-picker__menu .dshpc-picker__degraded{\n  padding:6px 8px;margin:0 0 4px;border-radius:var(--dshpc-radius-md);\n  color:var(--dshpc-warning-label);background:color-mix(in srgb,var(--dshpc-warning) 12%,transparent);\n  font-size:11px;\n}\n.dshpc-picker__menu .dshpc-picker__row{display:flex;align-items:center;gap:8px}\n/* 「显示更多」跟在最后一条后面、长得像多一条选项（2026-11-06 用户：翻到底发现不全才会找它）。\n   圆角同样走 md：它视觉上就是列表里多出来的一行，档位与选项一致，别再单独挑一个。 */\n.dshpc-picker__menu .dshpc-picker__more{\n  display:block;width:100%;margin-top:1px;padding:6px 8px;\n  color:var(--dshpc-business);background:none;\n  border:0;border-radius:var(--dshpc-radius-md);cursor:pointer;\n  font-size:12px;line-height:20px;text-align:center;\n}\n.dshpc-picker__menu .dshpc-picker__more:hover{background:var(--dshpc-surface-sunken)}\n";
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/ui/inputs/Picker.js
		/**
		* 通用选择器：单选 / 多选 / 上限 / 搜索 / 分组 / 空态 / 降级。
		*
		* **纯零件，不自己取数** —— 选项由调用方传入（工作区列表、模型列表这类数据要跨 host↔client
		* 边界，通道是插件私有的，组件取不到，见需求文档 §6）。
		*/
		function Picker(props) {
			ensureComponentStyles("picker", PICKER_CSS);
			ensureComponentStyles("panel", PANEL_CSS);
			ensureComponentStyles("field", FIELD_CSS);
			const tt = props.translate ?? t;
			const mode = props.mode ?? "single";
			const size$3 = props.size ?? "md";
			const placement = props.placement ?? "down";
			const clearable = props.clearable === true;
			const showLabels = props.showLabels !== false;
			const triggerStyle = resolveTriggerSizing(props);
			const groups = (0, react.useMemo)(() => toGroups(props.groups, props.options), [props.groups, props.options]);
			const controlled = props.value !== void 0;
			const [inner, setInner] = (0, react.useState)(() => toArray(props.defaultValue));
			const selected = controlled ? toArray(props.value) : inner;
			const emit = (next) => {
				if (!controlled) setInner(next);
				props.onChange?.(mode === "single" ? next[0] ?? "" : next);
			};
			const limit = props.limit ?? 0;
			const [open, setOpenState] = (0, react.useState)(false);
			const onOpenChangeRef = (0, react.useRef)(props.onOpenChange);
			onOpenChangeRef.current = props.onOpenChange;
			const setOpen = (0, react.useCallback)((next) => {
				setOpenState(next);
				onOpenChangeRef.current?.(next);
			}, []);
			const [query, setQuery] = (0, react.useState)("");
			const [active, setActive] = (0, react.useState)(-1);
			const [visible, setVisible] = (0, react.useState)(limit);
			const rootRef = (0, react.useRef)(null);
			const searchRef = (0, react.useRef)(null);
			const { refs, floatingStyles } = useFloating({
				open,
				onOpenChange: setOpen,
				placement: placement === "up" ? "top-start" : "bottom-start",
				middleware: [
					offset(4),
					flip(),
					shift({ padding: {
						top: 8,
						bottom: 8,
						left: 12,
						right: 12
					} }),
					size({ apply({ elements, rects, availableWidth, availableHeight }) {
						const menu = resolveMenuSizing(rects.reference.width, availableWidth, props.searchSizing);
						Object.assign(elements.floating.style, {
							minWidth: menu.minWidth,
							maxWidth: menu.maxWidth,
							maxHeight: `${Math.max(80, Math.min(280, (availableHeight ?? 320) - 8))}px`
						});
					} })
				],
				whileElementsMounted: autoUpdate,
				strategy: "fixed"
			});
			const setSearchRef = (0, react.useCallback)((el) => {
				searchRef.current = el;
				if (el !== null && open) el.focus();
			}, [open]);
			(0, react.useEffect)(() => {
				if (!open) return;
				const onDown = (e) => {
					const root = rootRef.current;
					const floatingEl = refs.floating.current;
					if (root?.contains(e.target) === true) return;
					if (floatingEl?.contains(e.target) === true) return;
					setOpen(false);
				};
				document.addEventListener("mousedown", onDown);
				return () => document.removeEventListener("mousedown", onDown);
			}, [open]);
			const overlayLocked = useOverlayLocked();
			const off = props.disabled === true || overlayLocked;
			(0, react.useEffect)(() => {
				if (overlayLocked) setOpen(false);
			}, [overlayLocked]);
			(0, react.useEffect)(() => {
				setVisible(limit);
				if (open) return;
				setQuery("");
				setActive(-1);
			}, [open, limit]);
			const matched = filterGroups(groups, query);
			const shown = sliceGroups(matched, visible);
			const flat = flattenOptions(shown);
			const hasMore = limit > 0 && flat.length < flattenOptions(matched).length;
			const atMax = mode === "multiple" && props.max !== void 0 && selected.length >= props.max;
			const summary = selected.length === 0 ? props.placeholder ?? tt("pickerPlaceholder") : mode === "multiple" && !showLabels ? tt("pickerSelected", { n: selected.length }) : labelsOf(groups, selected).join("、") || (props.placeholder ?? tt("pickerPlaceholder"));
			const pick = (value) => {
				if (mode === "single") {
					emit([value]);
					setOpen(false);
					return;
				}
				emit(toggleValue(selected, value, props.max));
				if (props.closeOnSelect === true) setOpen(false);
			};
			const clear = () => {
				emit([]);
				setOpen(false);
			};
			const onKeyDown = (e) => {
				if (!open) return;
				if (e.key === "Escape") {
					setOpen(false);
					return;
				}
				if (flat.length === 0) return;
				if (e.key === "ArrowDown" || e.key === "ArrowUp") {
					e.preventDefault();
					const dir = e.key === "ArrowDown" ? 1 : -1;
					setActive((cur) => (cur + dir + flat.length) % flat.length);
					return;
				}
				if (e.key === "Enter" && active >= 0) {
					e.preventDefault();
					const hit = flat[active];
					if (hit !== void 0) pick(hit.value);
				}
			};
			const trigger = (0, react.createElement)("button", {
				type: "button",
				"aria-label": props.ariaLabel,
				"aria-expanded": open,
				ref: refs.setReference,
				className: `dshpc-picker__trigger dshpc-picker__trigger--${size$3}${props.align === "center" ? " dshpc-picker__trigger--center" : ""}`,
				style: triggerStyle,
				disabled: off,
				onClick: () => {
					if (!off) setOpen(!open);
				}
			}, props.icon !== void 0 && props.icon !== null ? (0, react.createElement)("span", { className: "dshpc-picker__icon" }, props.icon) : null, (0, react.createElement)(MarqueeText, {
				text: summary,
				className: "dshpc-picker__label"
			}), (0, react.createElement)(Chevron, {
				size: 12,
				className: "dshpc-picker__caret"
			}));
			const triggerRow = props.hint === void 0 ? trigger : (0, react.createElement)("span", { className: "dshpc-fieldwrap dshpc-fieldwrap--inline" }, trigger, (0, react.createElement)(FieldHint, { text: props.hint }));
			return (0, react.createElement)("div", {
				className: `dshpc-picker${props.className === void 0 ? "" : ` ${props.className}`}`,
				ref: rootRef,
				onKeyDown
			}, triggerRow, open ? (0, react.createElement)(FloatingPortal, null, (0, react.createElement)("div", {
				className: "dshpc-panel dshpc-panel--menu dshpc-picker__menu",
				ref: refs.setFloating,
				style: floatingStyles
			}, (0, react.createElement)("div", { className: "dshpc-picker__head" }, props.degraded === true ? (0, react.createElement)("div", { className: "dshpc-picker__degraded" }, tt("pickerDegraded")) : null, atMax ? (0, react.createElement)("div", { className: "dshpc-picker__degraded" }, tt("pickerMaxReached", { n: props.max ?? 0 })) : null, props.searchable === true ? (0, react.createElement)("input", {
				ref: setSearchRef,
				className: "dshpc-picker__search",
				style: resolveTriggerSizing(props.searchSizing ?? {}),
				placeholder: tt("pickerSearch"),
				value: query,
				onChange: (e) => {
					setQuery(e.target.value);
					setVisible(limit);
				}
			}) : null), (0, react.createElement)("div", { className: "dshpc-picker__list dshpc-scroll-thin" }, flat.length === 0 && groups.length === 0 ? (0, react.createElement)("div", { className: "dshpc-picker__empty" }, tt("pickerEmpty")) : flat.length === 0 ? (0, react.createElement)("div", { className: "dshpc-picker__empty" }, tt("pickerNoMatch")) : [
				clearable && mode === "single" && selected.length > 0 ? (0, react.createElement)("div", {
					key: "__clear__",
					className: "dshpc-picker__option dshpc-picker__option--clear",
					onClick: clear
				}, tt("pickerClear")) : null,
				...shown.map((g) => (0, react.createElement)("div", { key: g.value || "_" }, g.label === "" ? null : (0, react.createElement)("div", { className: "dshpc-picker__group-label" }, g.label), g.options.map((o) => {
					const blocked = o.disabled === true || atMax && !selected.includes(o.value);
					const activeCls = [
						"dshpc-picker__option",
						selected.includes(o.value) ? "dshpc-picker__option--active" : "",
						blocked ? "dshpc-picker__option--disabled" : ""
					].filter((s) => s !== "").join(" ");
					const idx = flat.indexOf(o);
					return (0, react.createElement)("div", {
						key: o.value,
						className: activeCls,
						"data-active": idx === active ? "true" : void 0,
						onClick: () => {
							if (!blocked) pick(o.value);
						}
					}, mode === "multiple" ? (0, react.createElement)("span", { className: "dshpc-picker__tick" }, selected.includes(o.value) ? "✓" : "") : null, o.icon !== void 0 && o.icon !== null ? (0, react.createElement)("span", { className: "dshpc-picker__option-icon" }, o.icon) : null, (0, react.createElement)(MarqueeText, {
						text: o.label,
						className: "dshpc-picker__option-label"
					}));
				}))),
				hasMore ? (0, react.createElement)("button", {
					type: "button",
					className: "dshpc-picker__more",
					onClick: () => setVisible((v) => v + limit)
				}, tt("pickerMore")) : null
			]))) : null);
		}
		function toArray(v) {
			if (v === void 0) return [];
			return Array.isArray(v) ? [...v] : [v];
		}
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/ui/feedback/Loader.js
		/**
		* Loader —— 统一的加载动画图标（UI 基础层 · 反馈族）。
		*
		* 一句话边界：**只画图标本身**。没有背景、没有内距、没有圆角、没有定位。
		* 要圆角底就外面套 `Chip` / `Card`，要浮在屏幕上就自己包一层 fixed 容器 ——
		* 背景与位置属于调用方，不属于这个控件。
		*
		* 两轴正交（不是两个组件，也不是 N×M 份样式）：
		* - `variant`：`ring` 开口弧旋转（默认）/ `blocks` 三块脉动
		* - `size`：`xs` 12 / `sm` 16 / `md` 24（默认）/ `lg` 32 / `xl` 48
		*
		* 几何统一画在 `viewBox="0 0 24 24"` 里，尺寸档只改 `width` / `height` ⇒ 等比缩放，
		* 描边与方块的视觉重量在各档一致（12px 下描边 1.5px，48px 下 6px）。
		*
		* 颜色：全程 `currentColor`，自动跟随所在按钮 / 标签的文字色，不给 color 轴
		* （要换色在调用点给 `style={{ color }}` 即可，不必新增参数）。
		*
		* 无障碍：默认 `aria-hidden`（图标本身是装饰，语义由所在按钮的文字 / 卡片的
		* `role="status"` 承担）；要让它自己承担语义时传 `label`，此时输出 `role="status"`。
		*
		* 扩展新形态：在 `LoaderVariant` 加一个值 + 本文件加一支几何 + `loader.css` 加一段规则，
		* 不新增导出（形态由数据决定时直接传字符串即可，见 docs/help/ui.md）。
		*/
		/** 形态一：约 265° 的开口弧（周长 59.7，画 44 的空缺留 15.7）。 */
		function ringNode() {
			return (0, react.createElement)("circle", {
				cx: 12,
				cy: 12,
				r: 9.5,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 3,
				strokeLinecap: "round",
				strokeDasharray: "44 15.7"
			});
		}
		/**
		* 形态二：三个圆角短条，横向三等分。
		* 每个 7.2×6.0 —— 正方形在 24px 档看着像「方点」，用户 2026-10-30 指出太丑。
		* 间隔 0.6，左右各留 0.6；三块总宽 22.8，垂直居中于 24 高。
		*/
		function blockNodes() {
			return [
				0,
				1,
				2
			].map((i) => (0, react.createElement)("rect", {
				key: i,
				className: "dshpc-loader__node",
				x: .6 + i * 7.8,
				y: 9,
				width: 7.2,
				height: 6,
				rx: 1.5,
				fill: "currentColor"
			}));
		}
		/**
		* 渲染一个加载动画图标。
		*
		* @param props 见 {@link LoaderProps}。
		* @returns `<svg>` 元素（inline，不占额外行高）。
		*/
		function Loader(props) {
			ensureComponentStyles("loader", LOADER_CSS);
			const { variant = "ring", size = "md", label, className } = props;
			const classes = [
				"dshpc-loader",
				`dshpc-loader--${variant}`,
				`dshpc-loader--${size}`
			];
			if (className !== void 0 && className !== "") classes.push(className);
			return (0, react.createElement)("svg", {
				className: classes.join(" "),
				viewBox: "0 0 24 24",
				role: label === void 0 ? void 0 : "status",
				"aria-label": label,
				"aria-hidden": label === void 0 ? true : void 0,
				focusable: "false"
			}, variant === "ring" ? ringNode() : blockNodes());
		}
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/ui/infra/thenable.js
		/** 返回值是不是 thenable。Button 的自动 loading 与命令式弹窗的收尾共用这一份判定。 */
		function isThenable(value) {
			if (value === null || value === void 0) return false;
			return typeof value.then === "function";
		}
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/ui/actions/Button.js
		/**
		* 按钮 / 图标钮 —— **全站唯一实现**（L2 组件皮肤，P2）
		*
		* 三轴模型：
		*  - `variant`：外观档（形态 + 语义色），共 18 档
		*      primary（黑实心）/ secondary（灰实心）/ outline（描边）/ ghost（无底无边）
		*      danger（红实心）/ success（绿实心）/ warning（黄实心）/ info（蓝实心）
		*      danger-outline（红字描边）/ link（行内链接）
		*      purple / pink / cyan / teal / orange / indigo / rose / slate（扩展八色实心，2026-10-29）
		*  - `size`：`sm`(24) / `md`(28) / `lg`(32) —— 高度一律吃 `--dshpc-control-h-*`，
		*    **有边 / 无边同高**（边框在内部补回）
		*  - `block`：撑满父宽
		*  - `dense`：图标放大一档、内距收紧（高度不变），Button / IconButton 同名同义
		*
		* 内容轴：`icon`（前置）/ `iconRight`（后置）/ `loading`（前置小圈并自动禁用）。
		* 颜色轴：任一档都可以再用 `color` 传任意 CSS 色值 —— 只覆盖 `--btn-*` 几个变量，
		* 不新增皮肤（皮肤仍只在 `controls-css.ts` 里）。
		*
		* `IconButton` 是纯图标钮：`plain`（默认无底无边，hover 起灰底）/ `outline`（描边）/ `danger`（红）。
		* 兼容别名：`danger-ink` 仍是 `danger-outline` 的旧类名，可直接挂 className。
		*
		* ⚠️ 不许在任何使用点就地写按钮样式；要多一档外观 ⇒ 改基础层（一处改全站生效）。
		*/
		/**
		* 有 DOM 时用 layout effect（绘制前锁宽，用户看不到中间态），SSR 退化成 useEffect（服务端本就不跑）。
		* 直接用 `useLayoutEffect` 会在服务端渲染时告警。
		*/
		const useIsoLayoutEffect = typeof document === "undefined" ? react.useEffect : react.useLayoutEffect;
		/** 实心档（color 参数按「底色」处理；其余档按「字色 + 描边色」处理）。 */
		const SOLID_VARIANTS = [
			"primary",
			"secondary",
			"danger",
			"success",
			"warning",
			"info",
			"purple",
			"pink",
			"cyan",
			"teal",
			"orange",
			"indigo",
			"rose",
			"slate"
		];
		/** 把自定义颜色翻译成 5 个局部变量（只覆盖 token，不新增皮肤）。 */
		function colorVars(variant, color) {
			if (color === void 0 || color === "") return void 0;
			if (SOLID_VARIANTS.includes(variant)) return {
				"--btn-bg": color,
				"--btn-bg-hover": `color-mix(in srgb, ${color} 82%, var(--dshpc-fg))`,
				"--btn-bg-active": `color-mix(in srgb, ${color} 70%, var(--dshpc-fg))`
			};
			return {
				"--btn-fg": color,
				"--btn-fg-hover": color,
				"--btn-border": color,
				"--btn-bg-hover": `color-mix(in srgb, ${color} 12%, transparent)`,
				"--btn-bg-active": `color-mix(in srgb, ${color} 18%, transparent)`
			};
		}
		/** 组装按钮 class（结构一套 + 轴类）。 */
		function buttonClass(variant, size, block, hasIcon, dense, extra) {
			return `dshpc-btn dshpc-btn--${variant} dshpc-btn--${size}${dense ? " dshpc-btn--dense" : ""}${block ? " dshpc-btn--block" : ""}${hasIcon ? " dshpc-btn--icon-start" : ""}${extra !== void 0 && extra !== "" ? ` ${extra}` : ""}`;
		}
		/**
		* 异步点击：`onClick` 返回 thenable 就自己转圈（并禁用），settle 后恢复。
		* 不用 `onBusyChange` 也能单独工作 —— 它只是把状态报给外面（弹窗锁关闭用）。
		* `onBusyStart` 在 setBusy 之前跑：那时按钮还是「有文案」的样子，要量宽度只能抓这一刻。
		*/
		function useAsyncClick(onClick, onBusyChange, onBusyStart) {
			const [busy, setBusy] = (0, react.useState)(false);
			const click = (event) => {
				if (onClick === void 0) return;
				const out = onClick(event);
				if (!isThenable(out)) return;
				onBusyStart?.(event.currentTarget);
				setBusy(true);
				onBusyChange?.(true);
				const done = () => {
					setBusy(false);
					onBusyChange?.(false);
				};
				out.then(done, (err) => {
					done();
					console.error("[dsh-plugin-core] Button 异步点击失败，已恢复可点：", err);
				});
			};
			return {
				busy,
				click
			};
		}
		/**
		* 渲染一个「图标 + 文案」按钮。
		*
		* @param props 见 {@link ButtonProps}。
		* @returns 按钮元素。
		*/
		function Button(props) {
			ensureComponentStyles("button", BUTTON_CSS);
			const { variant = "outline", size = "lg", icon, iconRight, color, loading: loadingProp = false, loadingText = true, block = false, dense = false, width, minWidth, maxWidth, className, style, children, onClick, onBusyChange, ...rest } = props;
			const btnRef = (0, react.useRef)(null);
			const idleWidth = (0, react.useRef)(null);
			const [lockWidth, setLockWidth] = (0, react.useState)(null);
			const hasOwnWidth = width !== void 0 || style !== void 0 && style.width !== void 0;
			const lockable = !loadingText && !hasOwnWidth && !block;
			const asyncClick = useAsyncClick(onClick, onBusyChange, (el) => {
				if (!lockable) return;
				const w = el.getBoundingClientRect().width;
				if (w > 0) {
					idleWidth.current = w;
					setLockWidth(w);
				}
			});
			const loading = loadingProp || asyncClick.busy;
			const locked = useOverlayLocked();
			useIsoLayoutEffect(() => {
				const el = btnRef.current;
				if (el === null) return;
				if (!loading) {
					const w = el.getBoundingClientRect().width;
					if (w > 0) idleWidth.current = w;
					if (lockWidth !== null) setLockWidth(null);
					return;
				}
				if (!lockable) {
					if (lockWidth !== null) setLockWidth(null);
					return;
				}
				if (lockWidth === null && idleWidth.current !== null) setLockWidth(idleWidth.current);
			}, [
				loading,
				lockable,
				lockWidth
			]);
			const widthStyle = {};
			if (width !== void 0) widthStyle.width = width;
			else if (loading && lockWidth !== null) widthStyle.width = lockWidth;
			else {
				if (minWidth !== void 0) widthStyle.minWidth = minWidth;
				if (maxWidth !== void 0) widthStyle.maxWidth = maxWidth;
			}
			const hideText = loading && !loadingText;
			const marqueeLabel = !hideText && maxWidth !== void 0 && width === void 0 && typeof children === "string";
			const autoLabel = hideText && typeof children === "string" ? children : void 0;
			const attrs = {
				...rest,
				title: void 0,
				ref: btnRef,
				type: rest.type ?? "button",
				disabled: rest.disabled === true || loading || locked,
				"aria-busy": loading || void 0,
				...autoLabel !== void 0 && rest["aria-label"] === void 0 ? { "aria-label": autoLabel } : {},
				onClick: asyncClick.click,
				className: buttonClass(variant, size, block, icon !== void 0 && icon !== null && !loading, dense, className),
				style: {
					...colorVars(variant, color),
					...widthStyle,
					...style
				}
			};
			return (0, react.createElement)("button", attrs, loading ? (0, react.createElement)("span", { className: "dshpc-btn__icon" }, (0, react.createElement)(Loader, { size: "xs" })) : icon !== void 0 && icon !== null ? (0, react.createElement)("span", { className: "dshpc-btn__icon" }, icon) : null, hideText ? null : marqueeLabel ? (0, react.createElement)(MarqueeText, {
				text: children,
				className: "dshpc-btn__label"
			}) : children, iconRight !== void 0 && iconRight !== null && !loading ? (0, react.createElement)("span", { className: "dshpc-btn__icon-end" }, iconRight) : null);
		}
		/**
		* 渲染一个纯图标按钮。
		*
		* @param props 见 {@link IconButtonProps}。
		* @returns 图标按钮元素。
		*/
		function IconButton(props) {
			ensureComponentStyles("button", BUTTON_CSS);
			const { variant = "plain", size = "lg", icon, label, color, background, loading: loadingProp = false, dense = false, className, style, onClick, onBusyChange, ...rest } = props;
			const asyncClick = useAsyncClick(onClick, onBusyChange);
			const loading = loadingProp || asyncClick.busy;
			const locked = useOverlayLocked();
			const accent = {};
			if (color !== void 0 && color !== "") {
				accent["--icb-fg"] = color;
				accent["--icb-fg-hover"] = color;
				accent["--icb-bg-hover"] = `color-mix(in srgb, ${color} 14%, transparent)`;
			}
			if (background !== void 0 && background !== "") {
				accent["--icb-bg"] = background;
				accent["--icb-bg-hover"] = `color-mix(in srgb, ${background} 85%, var(--dshpc-fg))`;
			}
			const attrs = {
				...rest,
				type: rest.type ?? "button",
				title: void 0,
				"aria-label": rest["aria-label"] ?? label,
				"aria-busy": loading || void 0,
				disabled: rest.disabled === true || loading || locked,
				onClick: asyncClick.click,
				className: `dshpc-iconbtn dshpc-iconbtn--${variant} dshpc-iconbtn--${size}${dense ? " dshpc-iconbtn--dense" : ""}${className !== void 0 && className !== "" ? ` ${className}` : ""}`,
				style: {
					...accent,
					...style
				}
			};
			return (0, react.createElement)("button", attrs, loading ? (0, react.createElement)(Loader, { size: "xs" }) : icon);
		}
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/ui/infra/host-data.js
		/** 模型目录的 observable store（useSyncExternalStore 直接消费）。 */
		var ModelCatalogStore = class {
			constructor() {
				this.snapshot = { status: "loading" };
				this.listeners = /* @__PURE__ */ new Set();
				this.getSnapshot = () => this.snapshot;
				this.subscribe = (listener) => {
					this.listeners.add(listener);
					return () => {
						this.listeners.delete(listener);
					};
				};
			}
			update(next) {
				this.snapshot = next;
				for (const listener of this.listeners) listener();
			}
			setRoutes(routes) {
				this.update({
					status: "ready",
					routes
				});
			}
			setUnavailable(reason) {
				this.update({
					status: "unavailable",
					reason
				});
			}
		};
		/** 模型目录单例（ModelPicker 消费；connectHost 负责喂）。 */
		const modelCatalog = new ModelCatalogStore();
		/** 稳定的空归档集合：官方快照缺席时用它，保证 getArchiveSnapshot 引用稳定。 */
		const NO_ARCHIVED_SESSIONS = [];
		/**
		* 工作区列表的 observable store：直接镜像官方 WorkspaceSource 的 `items` 与
		* `archivedSessionIds`（宿主权威快照，follow 流实时推 —— 源变我们就变，不自持第二份状态机）。
		* `getSnapshot` 保持原有的 items 形态（explorer 各调用方按数组消费），归档集合另给两种读法。
		*/
		var WorkspaceListStore = class {
			constructor() {
				this.items = [];
				this.archivedSessionIds = NO_ARCHIVED_SESSIONS;
				this.listeners = /* @__PURE__ */ new Set();
				this.getSnapshot = () => this.items;
				/** 归档集合的稳定引用（直接喂 useSyncExternalStore，不需要额外 selector 缓存）。 */
				this.getArchiveSnapshot = () => this.archivedSessionIds;
				this.isSessionArchived = (sessionId) => this.archivedSessionIds.includes(sessionId);
				this.subscribe = (listener) => {
					this.listeners.add(listener);
					return () => {
						this.listeners.delete(listener);
					};
				};
			}
			/** 换源（仅 connectHost 调；重复调用换到新源）。 */
			setSource(source) {
				this.unsubscribe?.();
				const pull = () => {
					const snap = source.getSnapshot();
					this.items = snap.items;
					this.archivedSessionIds = snap.archivedSessionIds ?? NO_ARCHIVED_SESSIONS;
					for (const listener of this.listeners) listener();
				};
				pull();
				this.unsubscribe = source.subscribe(pull);
			}
		};
		/** 工作区列表单例（WorkspacePicker / 会话预览消费；connectHost 负责喂）。 */
		const workspaceList = new WorkspaceListStore();
		/** 最近一次接线的模型目录路径（`refreshModelCatalog()` 不带参时用它）。 */
		let boundModelsPath;
		/** 进行中的目录请求：并发刷新合并成一次，避免连点发一串相同请求。 */
		let catalogInFlight;
		/** 最近一次发起请求的时间（`revalidateModelCatalog()` 的节流判据）。 */
		let lastAttemptAt = 0;
		/** 当前退回重试的档位索引（取到目录即归零）。 */
		let retryIndex = 0;
		let retryTimer;
		/**
		* 首拉失败后的退避档（毫秒）。
		*
		* 宿主 `llm` 晚于插件 client 挂载时，`serveModelCatalog` 会回 503 —— 这是启动顺序竞态，
		* 不是真故障，给三次机会等它起来。三次都失败就停在降级态，交给
		* `refreshModelCatalog()` / 重新打开选择器重试，**绝不无限重试**。
		*/
		const RETRY_DELAYS_MS = [
			1e3,
			2e3,
			4e3
		];
		/** 事件驱动补拉的最小间隔：切回页面 / 重新打开选择器时，超过这个时长才真的发请求。 */
		const REVALIDATE_AFTER_MS = 3e4;
		/** 只有「过一会儿可能就好」的失败才值得重试：5xx / 429 / 网络层；403、404 重试也没用。 */
		function isRetryable(error) {
			const matched = /HTTP (\d{3})/.exec(String(error));
			if (matched === null) return true;
			const status = Number(matched[1]);
			return status >= 500 || status === 429;
		}
		function scheduleRetry(path, delay) {
			if (retryTimer !== void 0) clearTimeout(retryTimer);
			const timer = setTimeout(() => {
				retryTimer = void 0;
				loadModelCatalog(path);
			}, delay);
			timer.unref?.();
			retryTimer = timer;
		}
		function loadModelCatalog(path, retryOnFailure = true) {
			if (catalogInFlight !== void 0) return catalogInFlight;
			lastAttemptAt = Date.now();
			const job = fetch(path, { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject(/* @__PURE__ */ new Error(`HTTP ${response.status}`))).then((data) => {
				const routes = data?.routes;
				if (!Array.isArray(routes)) throw new Error("模型目录响应缺少 routes");
				retryIndex = 0;
				modelCatalog.setRoutes(routes);
			}).catch((error) => {
				modelCatalog.setUnavailable(String(error));
				if (!retryOnFailure || !isRetryable(error)) return;
				const delay = RETRY_DELAYS_MS[retryIndex];
				if (delay === void 0) return;
				retryIndex += 1;
				scheduleRetry(path, delay);
			}).finally(() => {
				catalogInFlight = void 0;
			});
			catalogInFlight = job;
			return job;
		}
		/**
		* 事件驱动的补拉（切回页面 / 重新打开选择器时调）。
		*
		* 不轮询：距上次尝试不足 30s 就什么都不做，因此快速开关下拉不会连发请求。
		* 成功态也补 —— 供应商 / 模型增减不会主动推送，这是「不轮询」前提下唯一的感知入口。
		* 正在请求中直接跳过（`catalogInFlight` 已经是合并后的那一个）。
		*/
		function revalidateModelCatalog() {
			if (boundModelsPath === void 0 || catalogInFlight !== void 0) return;
			if (Date.now() - lastAttemptAt < REVALIDATE_AFTER_MS) return;
			loadModelCatalog(boundModelsPath, false);
		}
		/** 标签页重新可见时补拉一次（只绑一次；Node 自检没有 document，直接跳过）。 */
		let visibilityBound = false;
		function bindVisibilityRevalidate() {
			if (visibilityBound) return;
			if (typeof document === "undefined") return;
			visibilityBound = true;
			document.addEventListener("visibilitychange", () => {
				if (document.visibilityState === "visible") revalidateModelCatalog();
			});
		}
		function isWorkspaceSource(value) {
			if (value === null || typeof value !== "object") return false;
			const rec = value;
			return typeof rec.getSnapshot === "function" && typeof rec.subscribe === "function";
		}
		/**
		* 把宿主数据面接进核心（插件 client `apply` 里调**一次**）。
		*
		* 工作区走本地 client 服务注入；模型目录走宿主路由 fetch。哪条失败只影响那一块，
		* 选择器照常渲染空态 / 降级提示 —— 绝不让数据面拖住插件启动。
		*/
		function connectHost(ctx, options = {}) {
			ctx.inject(["workspaces"], (sub) => {
				const source = sub?.workspaces?.list;
				if (isWorkspaceSource(source)) workspaceList.setSource(source);
			});
			ctx.inject(["remote", "remote.workspaceFiles"], (sub) => {
				const rec = sub;
				if (typeof (rec?.["remote.workspaceFiles"] ?? rec?.remote?.workspaceFiles)?.list === "function");
			});
			const modelsPath = options.modelsPath;
			if (modelsPath === void 0) return;
			boundModelsPath = modelsPath;
			bindVisibilityRevalidate();
			loadModelCatalog(modelsPath);
		}
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/ui/inputs/picker-icons.js
		/**
		* 领域选择器的默认前置图标（2026-10-20 用户：默认就带一个 icon，可换、可去掉）。
		*
		* ui 零官方依赖 ⇒ 自绘小 SVG（14px，跟 currentColor 走明暗）。
		* 用法：不传 `icon` ⇒ 默认这颗；传 `null` ⇒ 不显示；传任意 ReactNode ⇒ 换成它。
		*/
		function glyph(path) {
			return (0, react.createElement)("svg", {
				width: 14,
				height: 14,
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": true
			}, path);
		}
		/** 模型：四角星 */
		function sparkleIcon() {
			return glyph((0, react.createElement)("path", {
				d: "M8 1.8l1.6 4.1 4.1 1.6-4.1 1.6L8 13.2 6.4 9.1 2.3 7.5l4.1-1.6z",
				stroke: "currentColor",
				"stroke-width": 1.2,
				"stroke-linejoin": "round"
			}));
		}
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/ui/inputs/ModelPicker.js
		function ModelPicker(props) {
			ensureComponentStyles("picker", PICKER_CSS);
			const tt = props.translate ?? t;
			const value = props.value;
			const variant = props.variant ?? "grouped";
			const searchable = props.searchable ?? true;
			const defaultOption = props.allowDefault === false ? void 0 : {
				value: "",
				label: props.defaultLabel ?? tt("modelDefault")
			};
			const catalog = (0, react.useSyncExternalStore)(modelCatalog.subscribe, modelCatalog.getSnapshot, modelCatalog.getSnapshot);
			const catalogGroups = props.groups ?? (catalog.status === "ready" ? catalog.routes.map((route) => ({
				value: route.provider,
				label: route.displayName,
				options: route.models.map((model) => ({
					value: `${route.provider}/${model.id}`,
					label: model.name ?? model.id
				}))
			})) : []);
			const retained = retainSelectedValue(catalogGroups, props.value);
			const groups = retained.groups;
			const degraded = props.degraded ?? (catalog.status === "unavailable" || catalog.status === "ready" && catalogGroups.length === 0 || retained.retained);
			const icon = props.icon === void 0 ? sparkleIcon() : props.icon ?? void 0;
			const emitModel = (v) => {
				props.onChange?.(typeof v === "string" ? v : v[0] ?? "");
			};
			const sizing = {
				width: props.width,
				minWidth: props.minWidth,
				maxWidth: props.maxWidth
			};
			const [pickedProvider, setPickedProvider] = (0, react.useState)("");
			const curGroup = groupOf(groups, value ?? "");
			const provider = pickedProvider !== "" && groups.some((g) => g.value === pickedProvider) ? pickedProvider : curGroup?.value ?? "";
			(0, react.useEffect)(() => {
				if (value !== void 0 && value !== "") setPickedProvider("");
			}, [value]);
			if (variant === "flat") {
				const options = toFlatOptions(groups);
				return (0, react.createElement)(Picker, {
					options: defaultOption === void 0 ? options : [defaultOption, ...options],
					value,
					defaultValue: props.defaultValue,
					...sizing,
					searchSizing: props.searchSizing,
					icon,
					placeholder: props.placeholder ?? tt("modelModel"),
					degraded,
					disabled: props.disabled,
					clearable: props.clearable,
					searchable,
					hint: props.hint,
					size: props.size,
					placement: props.placement,
					className: props.className,
					onOpenChange: (open) => {
						if (open) revalidateModelCatalog();
					},
					translate: props.translate,
					onChange: emitModel
				});
			}
			if (variant === "grouped") return (0, react.createElement)(Picker, {
				groups: defaultOption === void 0 ? groups : [{
					value: "",
					label: "",
					options: [defaultOption]
				}, ...groups],
				value,
				defaultValue: props.defaultValue,
				...sizing,
				searchSizing: props.searchSizing,
				icon,
				placeholder: props.placeholder ?? tt("modelModel"),
				degraded,
				disabled: props.disabled,
				clearable: props.clearable,
				searchable,
				hint: props.hint,
				size: props.size,
				placement: props.placement,
				className: props.className,
				onOpenChange: (open) => {
					if (open) revalidateModelCatalog();
				},
				translate: props.translate,
				onChange: emitModel
			});
			const group = groups.find((g) => g.value === provider);
			const options = group === void 0 ? [] : flattenOptions([group]);
			const rowClass = [
				"dshpc-picker__row",
				props.className,
				props.rowClassName
			].filter((part) => part !== void 0 && part !== "").join(" ");
			return (0, react.createElement)("div", { className: rowClass }, (0, react.createElement)(Picker, {
				options: groups.map((g) => ({
					value: g.value,
					label: g.label
				})),
				value: provider === "" ? void 0 : provider,
				placeholder: tt("modelProvider"),
				degraded,
				disabled: props.disabled,
				...props.providerSizing ?? sizing,
				searchSizing: props.searchSizing,
				searchable,
				size: props.size,
				placement: props.placement,
				className: props.providerClassName,
				onOpenChange: (open) => {
					if (open) revalidateModelCatalog();
				},
				translate: props.translate,
				onChange: (v) => {
					setPickedProvider(typeof v === "string" ? v : v[0] ?? "");
					props.onChange?.("");
				}
			}), (0, react.createElement)(Picker, {
				options: defaultOption === void 0 ? options : [defaultOption, ...options],
				value,
				defaultValue: props.defaultValue,
				...props.modelSizing ?? sizing,
				searchSizing: props.searchSizing,
				icon,
				placeholder: props.placeholder ?? tt("modelModel"),
				degraded,
				disabled: props.disabled === true || provider === "",
				clearable: props.clearable,
				searchable,
				hint: props.hint,
				size: props.size,
				placement: props.placement,
				className: props.modelClassName,
				onOpenChange: (open) => {
					if (open) revalidateModelCatalog();
				},
				translate: props.translate,
				onChange: emitModel
			}));
		}
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/ui/display/chip-css.generated.js
		const CHIP_CSS = "\n/* 三条局部变量承载配色：neutral 走旧灰面；语义档换底字配对（2026-10-20 用户要多色多尺寸标签）。 */\n.dshpc-chip{--chip-bg:var(--dshpc-chip-bg);--chip-fg:var(--dshpc-fg);--chip-bg-hover:var(--dshpc-chip-bg-hover);\n  display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:1px 8px;\n  box-sizing:border-box;border-radius:var(--dshpc-radius-pill,999px);border:none;\n  background:var(--chip-bg);color:var(--chip-fg);\n  font-family:inherit;font-size:11px;line-height:18px;margin:0;\n  /* 2026-10-18：chip 是 flex 行里的常用项，禁止被压缩换行（预览站出现过文字竖排、互相叠压的挤压）。 */\n  white-space:nowrap;flex:none;\n  appearance:none;-webkit-appearance:none;\n}\n/* md 档：卡片元信息行等稍大场景；sm 即旧版默认，逐像素不动。 */\n.dshpc-chip--md{padding:2px 10px;font-size:12px;line-height:20px;}\n/* xs 档：标题后缀等极紧凑场景（2026-10-20 用户要更小标签）；16px 高、font 10。 */\n.dshpc-chip--xs{padding:0 6px;font-size:10px;line-height:16px;}\n/* 语义色实心档：底 / 字 / hover 配对与 Button 同源（黄底中高明度 ⇒ 字用 --dshpc-on-warning）。 */\n.dshpc-chip--business{--chip-bg:var(--dshpc-business);--chip-fg:var(--dshpc-on-signal);--chip-bg-hover:var(--dshpc-business-hover);}\n.dshpc-chip--success{--chip-bg:var(--dshpc-success);--chip-fg:var(--dshpc-on-signal);--chip-bg-hover:var(--dshpc-success-hover);}\n.dshpc-chip--warning{--chip-bg:var(--dshpc-warning);--chip-fg:var(--dshpc-on-warning);--chip-bg-hover:var(--dshpc-warning-hover);}\n.dshpc-chip--danger{--chip-bg:var(--dshpc-danger);--chip-fg:var(--dshpc-on-signal);--chip-bg-hover:var(--dshpc-danger-hover);}\n/* 扩展八色（2026-10-29）：实心面字色统一白（on-signal），明度均低于黄 / 青柠，白字两主题可读。 */\n.dshpc-chip--purple{--chip-bg:var(--dshpc-purple);--chip-fg:var(--dshpc-on-signal);--chip-bg-hover:var(--dshpc-purple-hover);}\n.dshpc-chip--pink{--chip-bg:var(--dshpc-pink);--chip-fg:var(--dshpc-on-signal);--chip-bg-hover:var(--dshpc-pink-hover);}\n.dshpc-chip--cyan{--chip-bg:var(--dshpc-cyan);--chip-fg:var(--dshpc-on-signal);--chip-bg-hover:var(--dshpc-cyan-hover);}\n.dshpc-chip--teal{--chip-bg:var(--dshpc-teal);--chip-fg:var(--dshpc-on-signal);--chip-bg-hover:var(--dshpc-teal-hover);}\n.dshpc-chip--orange{--chip-bg:var(--dshpc-orange);--chip-fg:var(--dshpc-on-signal);--chip-bg-hover:var(--dshpc-orange-hover);}\n.dshpc-chip--indigo{--chip-bg:var(--dshpc-indigo);--chip-fg:var(--dshpc-on-signal);--chip-bg-hover:var(--dshpc-indigo-hover);}\n.dshpc-chip--rose{--chip-bg:var(--dshpc-rose);--chip-fg:var(--dshpc-on-signal);--chip-bg-hover:var(--dshpc-rose-hover);}\n.dshpc-chip--slate{--chip-bg:var(--dshpc-slate);--chip-fg:var(--dshpc-on-signal);--chip-bg-hover:var(--dshpc-slate-hover);}\n/* 可点态：button 渲染（见 Chip.ts），光标 + hover 加深。 */\n.dshpc-chip--clickable{cursor:pointer;transition:background-color var(--dshpc-dur-fast) var(--dshpc-ease);}\n.dshpc-chip--clickable:hover:not(:disabled){background:var(--chip-bg-hover)}\n.dshpc-chip:focus-visible{outline:2px solid var(--dshpc-focus);outline-offset:1px}\n/* 禁用态字色从 --chip-fg 派生（45% ≈ 旧 fg-3 的弱化观感），不许直接用 --dshpc-fg-3：\n   它跟主题走，暗色下是深灰 ⇒ 语义色实心标签（蓝 / 红底）上几乎看不见（与 Segmented 计数 2026-10-29 同类）。 */\n.dshpc-chip:disabled{cursor:default;color:color-mix(in srgb,var(--chip-fg) 45%,transparent)}\n/* maxWidth 包 MarqueeText 时：标签作为 flex 子项必须能收缩到内容以下，否则省略号 / 跑马灯测不准 */\n.dshpc-chip .dshpc-chip__label{min-width:0;}\n@media (prefers-reduced-motion: reduce){.dshpc-chip{transition:none}}\n";
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/ui/display/Chip.js
		/** 小标签（neutral 用现成的 `--dshpc-chip-bg`；传 `onClick` 才是可点的）。 */
		function Chip(props) {
			ensureComponentStyles("chip", CHIP_CSS);
			const { children, tone = "neutral", size = "sm", width, minWidth, maxWidth, onClick, className } = props;
			const clickable = onClick !== void 0;
			const widthStyle = {};
			if (width !== void 0) widthStyle.width = width;
			else {
				if (minWidth !== void 0) widthStyle.minWidth = minWidth;
				if (maxWidth !== void 0) widthStyle.maxWidth = maxWidth;
			}
			const marqueeLabel = maxWidth !== void 0 && width === void 0 && typeof children === "string";
			return (0, react.createElement)(clickable ? "button" : "span", {
				type: clickable ? "button" : void 0,
				className: `dshpc-chip${tone !== "neutral" ? ` dshpc-chip--${tone}` : ""}${size !== "sm" ? ` dshpc-chip--${size}` : ""}${clickable ? " dshpc-chip--clickable" : ""}${className === void 0 ? "" : ` ${className}`}`,
				style: widthStyle,
				onClick
			}, marqueeLabel ? (0, react.createElement)(MarqueeText, {
				text: children,
				className: "dshpc-chip__label"
			}) : children ?? null);
		}
		//#endregion
		//#region node_modules/dsh-plugin-core/dist/ui/inputs/Field.js
		/**
		* 输入类控件 —— **全站唯一实现**（L2 组件皮肤，P3）
		*
		* - `Input`：文本输入（size sm 24 / md 28 / lg 32，error 描红）；
		* - `PrefixedInput`：前缀 + 文本输入（如路径 / 接口前缀）；
		* - `NumberInput`：数字步进（显式 `− / +`，替换原生 `<input type="number">` 的浏览器 spinner，
		*   支持 step / min / max、clamp、Enter 提交、失焦回弹）。
		*
		* 高度一律吃 `--dshpc-control-h-*`；有边 / 无边同高（边框在内部补回）。
		*/
		/**
		* 字段 hint 的统一包法：控件 + 问号提示同一行（间距/对齐收进组件，调用方传个
		* `hint` 字符串就行，不再手动拼排版 —— 用户 2026-10-20 拍板）。
		*/
		function withHint(control, hint) {
			if (hint === void 0) return control;
			return (0, react.createElement)("span", { className: "dshpc-fieldwrap" }, control, (0, react.createElement)(FieldHint, { text: hint }));
		}
		function sizeClass(size) {
			return size === "lg" ? "--lg" : size === "md" ? "--md" : "--sm";
		}
		/** 文本输入。默认铺满容器（width:100%，与 Textarea 同口径）；要定宽由调用方在外面包壳（如 192px 搜索槽）。 */
		function Input(props) {
			ensureComponentStyles("field", FIELD_CSS);
			const { value, onChange, placeholder, size = "lg", error, disabled, type, icon, className, style } = props;
			const locked = useOverlayLocked();
			const off = disabled === true || locked;
			const [focused, setFocused] = (0, react.useState)(false);
			const search = type === "search";
			const showClear = search && value !== "" && focused && !off;
			const input = (0, react.createElement)("input", {
				ref: props.inputRef,
				type: type ?? "text",
				value,
				placeholder,
				disabled: off,
				"aria-label": props["aria-label"],
				className: `dshpc-input dshpc-input${sizeClass(size)}${error === true ? " dshpc-input--error" : ""}${className !== void 0 && className !== "" ? ` ${className}` : ""}`,
				style,
				onChange: (event) => {
					onChange(event.target.value);
				},
				onKeyDown: props.onKeyDown,
				onFocus: () => {
					setFocused(true);
				},
				onBlur: () => {
					setFocused(false);
					if (props.onBlur !== void 0) props.onBlur();
				}
			});
			const hasIcon = icon !== void 0 && icon !== null;
			if (!hasIcon && !search) return withHint(input, props.hint);
			return withHint((0, react.createElement)("span", { className: `dshpc-iwrap dshpc-iwrap${sizeClass(size)}${showClear ? " dshpc-iwrap--clear" : ""}` }, hasIcon ? (0, react.createElement)("span", { className: "dshpc-iwrap__icon" }, icon) : null, input, showClear ? (0, react.createElement)(IconButton, {
				className: "dshpc-iwrap__clear",
				variant: "plain",
				size,
				icon: "×",
				label: t("fieldClear"),
				onMouseDown: (event) => {
					event.preventDefault();
				},
				onClick: () => {
					onChange("");
				}
			}) : null), props.hint);
		}
		//#endregion
		//#region src/client/model-pair.tsx
		/**
		* 「标题总结大模型」：一个下拉按供应商分组选模型（核心库 `ModelPicker` 的 grouped 形态）。
		*
		* 目录不再自己读：核心 `ModelPicker` 的数据来自宿主 `serveModelCatalog`
		* （client 侧 `connectHost(ctx,{modelsPath})` 自取，见 index.tsx），这里只传
		* `variant="grouped"`：一个下拉，供应商做组头、模型列在下面；把 `${provider}/${id}`
		* 拆回双字段草稿。默认项由 `defaultLabel` 自定义成「跟随对话模型」，置顶且始终可选，
		* 因此选过具体模型后仍能选回默认。目录 loading / 不可用时核心自带 degraded 提示。
		*/
		/**
		* 一个分组下拉（grouped）：供应商做组头、模型列在下面，不再用两个框。
		* 选「跟随对话模型」发 `''`（两个草稿一起清空）；选中具体模型发 `provider/id`，
		* 按第一个 `/` 拆回双字段。宽度由 `stp-config__model` 限到表单的一半、右边留白。
		*/
		function ModelPairFields({ provider, model, disabled, overridden, onEdit, onReset, t }) {
			const value = provider !== "" && model !== "" ? `${provider}/${model}` : "";
			const onModelChange = (next) => {
				const slash = next.indexOf("/");
				if (slash < 0) {
					onEdit("provider", "");
					onEdit("model", "");
					return;
				}
				onEdit("provider", next.slice(0, slash));
				onEdit("model", next.slice(slash + 1));
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "stp-config__field",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "stp-config__head",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "stp-config__label",
							children: t("modelPairLabel")
						}),
						overridden ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Chip, {
							tone: "neutral",
							size: "xs",
							children: t("overridden")
						}) : null,
						overridden ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
							variant: "link",
							size: "sm",
							disabled,
							onClick: onReset,
							children: t("reset")
						}) : null
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ModelPicker, {
					variant: "grouped",
					className: "stp-config__model",
					size: "lg",
					value,
					defaultLabel: t("followMainModel"),
					disabled,
					onChange: onModelChange
				})]
			});
		}
		//#endregion
		//#region src/client/config-panel.tsx
		/**
		* 插件详情页的配置区（dsh 0.1.7 `plugins.bundle.config` 槽位，key = 包名）。
		*
		* 控件一律走核心库分包 `dsh-plugin-core/ui`（Input / Button / Chip / ModelPicker），
		* 状态机仍是官方 `SettingsFormModel`：草稿 / dirty / overridden / invalid /
		* saving / failed / 原子保存，一行都不自己管。版式照 `dsh-task-ledger` 的配置区：
		* 保存与两个链接同一排、保存在最前。
		*/
		/** 本仓库地址（设置区的第一个链接）。 */
		const PROJECT_URL = "https://github.com/cq-guojia/dsh-session-title-pattern";
		/** 友情链接：蓝鲸组件库（UI 基础控件包）。 */
		const COMPONENTS_URL = "https://github.com/cq-guojia/dsh-plugin-core";
		/** `maxOutputTokens` / `maxInputBytes` 是内部预算旋钮，不放出来。 */
		const FIELD_TOP = {
			field: "retitleEvery",
			label: "retitleEveryLabel",
			hint: "retitleEveryHint",
			invalid: "invalidNumber",
			numeric: true
		};
		const FIELD_TEMPLATE = {
			field: "template",
			label: "templateLabel",
			hint: "templateHint"
		};
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
		/** 一行：标签 + 自定义徽章 + 恢复默认 → 控件 → 说明。 */
		function configField(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "stp-config__field",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "stp-config__head",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "stp-config__label",
								id: props.id,
								children: props.label
							}),
							props.overridden ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Chip, {
								tone: "neutral",
								size: "xs",
								children: props.overriddenLabel
							}) : null,
							props.overridden ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
								variant: "link",
								size: "sm",
								disabled: props.disabled,
								onClick: props.onReset,
								children: props.resetLabel
							}) : null
						]
					}),
					props.control,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "stp-config__hint",
						children: props.hint
					})
				]
			}, props.id);
		}
		/** 外链按钮：文案与图标逐字照抄 `dsh-task-ledger` 的设置区。 */
		const linkButton = (label, url) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
			size: "lg",
			variant: "outline",
			icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconLinkOutlineRegular, { size: 16 }),
			onClick: () => {
				window.open(url, "_blank", "noopener");
			},
			children: label
		});
		function ConfigPanel({ view, usePanel, save, edit, resetField, discard, t }) {
			const state = usePanel((s) => s);
			const [toast, setToast] = (0, react.useState)(null);
			const toastSeq = (0, react.useRef)(0);
			const discardRef = (0, react.useRef)(discard);
			discardRef.current = discard;
			(0, react.useEffect)(() => () => discardRef.current(), []);
			if (view !== "page") return null;
			if (!state.available) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: "stp-config__note",
				role: "status",
				children: t("unavailable")
			});
			const providerText = state.provider.text;
			const modelText = state.model.text;
			const handleSave = () => {
				const catalog = modelCatalog.getSnapshot();
				if (catalog.status === "ready") {
					if (providerText === "") {
						if (modelText !== "") edit("model", "");
					} else if (modelText === "") {
						const first = catalog.routes.find((route) => route.provider === providerText)?.models[0]?.id;
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
			/** 渲染一个普通字段：核心 Input，草稿文本原样交给 SettingsFormModel。 */
			const renderField = ({ field, label, hint, invalid, numeric }) => {
				const value = state[field];
				const hintText = value.invalid && invalid !== void 0 ? t(invalid) : hint === void 0 ? "" : t(hint);
				return configField({
					id: `stp-config-${field}`,
					label: t(label),
					hint: hintText,
					overridden: value.overridden,
					resetLabel: t("reset"),
					overriddenLabel: t("overridden"),
					disabled: !state.writable,
					onReset: () => resetField(field),
					control: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Input, {
						value: value.text,
						size: "lg",
						type: numeric === true ? "number" : "text",
						className: numeric === true ? "stp-config__num" : void 0,
						error: value.invalid,
						disabled: !state.writable,
						"aria-label": t(label),
						onChange: (text) => edit(field, text)
					})
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				renderField(FIELD_TOP),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ModelPairFields, {
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
				renderField(FIELD_TEMPLATE),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "stp-config__pair",
					children: FIELDS_BOTTOM_ROW.map(renderField)
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "stp-config__row",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
							variant: "primary",
							size: "lg",
							loading: state.saving,
							disabled: !state.writable || !state.dirty || state.invalid || state.saving,
							onClick: handleSave,
							children: state.saving ? t("saving") : t("save")
						}),
						linkButton(t("configGithub"), PROJECT_URL),
						linkButton(t("configComponents"), COMPONENTS_URL),
						state.failed ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "stp-config__failed",
							role: "status",
							children: t("saveFailed")
						}) : null,
						!state.writable ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "stp-config__note",
							role: "status",
							children: t("readOnly")
						}) : null
					]
				}),
				toast !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Toast, {
					text: toast.text,
					tone: "success",
					onDone: dismissToast
				}, toast.seq) : null
			] });
		}
		//#endregion
		//#region src/shared/models-path.ts
		/**
		* 模型目录路由 path：宿主侧 `serveModelCatalog` 与客户端 `connectHost` 必须共用
		* 同一个字符串（核心库硬性要求，错配就拉不到目录）。
		*
		* 按插件名起名，避免与其它插件的模型路由撞车。
		*/
		const MODELS_PATH = "/api/dsh-session-title-pattern/models";
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
			configGithub: "访问 GitHub",
			configComponents: "蓝鲸组件库",
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
			configGithub: "Visit GitHub",
			configComponents: "dsh-plugin-core",
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
		* 本插件自己的样式，统一注册到 `dsh-plugin-core` 的 styleKit（全插件唯一注入器）。
		*
		* 控件皮肤由核心库各控件自注入，这里只管布局、提示文案与标题宽度覆盖。
		* 颜色一律吃宿主 `--dsw-alias-*` token，不自带明暗判据。
		*/
		/**
		* 当前会话标题（面包屑最后一段）的宽度上限。
		*
		* 上游把 `.crumb` 写死 `max-width:220px` 且没有槽位能改写它；属性选择器与上游
		* `.wSkVaW_crumb` 特异性相同，靠 `!important` 决胜。`_crumbCurrent` 只命中最后
		* 一个面包屑，祖先会话与子代理不受影响。上游若重命名该类名，本规则静默失效
		* （DevTools 查标题元素 class 里还有没有 `_crumbCurrent`）。
		*/
		const STP_CSS = `
[class*="_crumbCurrent"]{max-width:min(640px, 60vw) !important;}
.stp-config__field{display:flex;flex-direction:column;gap:6px;padding:12px 0}
.stp-config__head{display:flex;align-items:center;gap:8px;min-height:24px}
.stp-config__label{flex:1;min-width:0;font-size:13px;font-weight:500;line-height:1.5;color:var(--dsw-alias-label-primary)}
.stp-config__hint{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}
.stp-config__invalid{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-error)}
.stp-config__note{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}
.stp-config__failed{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-error)}
.stp-config__pair{display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:start}
.stp-config__row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px;padding:0 0 24px;border-bottom:1px solid var(--dsw-alias-border-l4)}
/* grouped 单下拉：只占昔日两框中「一个」的位置（(100% - 8px) / 2），右边留白。
   核心 .dshpc-picker 默认 inline-block 按内容宽（trigger min-width:120px），
   这里显式限到半宽并让触发器铺满，否则会缩成一枚小按钮、或反过来占满整行。 */
.stp-config__field .stp-config__model{display:block;align-self:flex-start;width:calc(50% - 4px);min-width:0;max-width:calc(50% - 4px)}
.stp-config__model .dshpc-picker__trigger{width:100%;min-width:0}
/* 数字框只要手输，不要浏览器自带的上下箭头。 */
.stp-config__num::-webkit-inner-spin-button,.stp-config__num::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.stp-config__num{-moz-appearance:textfield}
`;
		//#endregion
		//#region src/client/index.tsx
		/**
		* 核心控件样式统一走一个带 id 的注入器（多插件同页不抢同一个 `<style>`）。
		* 自绘布局与标题宽度覆盖也登记到同一个 kit，不再另开注入器。
		*/
		const styleKit = createStyleKit({ id: "dsh-session-title-pattern-ui" });
		setStyleKit(styleKit);
		styleKit.applyStyle("stp", STP_CSS);
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
		* 下面五条都是唯一公开命令 `/retitle` 的子动作调用，必须带前导斜杠。
		*
		* host 端 `CommandRuntime.execute()` 用 `parseCommand()` 解析，正则要求
		* `^\/[a-z][a-z0-9_-]*`：不带斜杠时它直接返回 undefined，而且属于
		* "admission miss"（语法不合规），**连日志都不记** —— 表现就是按钮点了没反应、
		* 控制台一片安静（v0.6.0 起四个按钮全废，根因就在这里）。
		*
		* 0.2.2-rc.1 把每条注册命令都列进输入框的斜杠候选，所以面板动作不再各自注册，
		* 统一走 `/retitle <动作>`，候选里只剩一条。
		*/
		const RETITLE_LINE = "/retitle";
		/** 手动改名：写入「用户」来源的标题，写入即进入锁定态。 */
		const RENAME_LINE = `${RETITLE_LINE} rename`;
		/** 锁定：把当前标题以「用户」来源写回，停止自动更新。 */
		const LOCK_LINE = `${RETITLE_LINE} lock`;
		/** 解锁：恢复自动更新。标题内容不变，不触发重新生成。 */
		const UNLOCK_LINE = `${RETITLE_LINE} unlock`;
		/** 草稿：按当前对话真算一版标题，只返回文本、不写入，给「自动生成」按钮用。 */
		const SUGGEST_LINE = `${RETITLE_LINE} suggest`;
		/** 状态查询：问 host「当前标题锁没锁」，回答是 `locked` / `unlocked`。 */
		const STATE_LINE = `${RETITLE_LINE} state`;
		/**
		* 本面板依赖的全部命令（不含斜杠），打开时用来自检。
		*
		* 「点了没反应」最费时间的一处就是猜命令到底注册上没有，直接把缺哪条打出来。
		*/
		const REQUIRED_COMMANDS = ["retitle"];
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
			const panelRef = (0, react.useRef)(null);
			/**
			* 卡片必须 portal 到 body：dsh 0.2.2-rc.1 给标题容器 `.titleCluster` 加了
			* `overflow:clip` + `mask-image`，挂在 headerActions 里的绝对定位浮层会被整块裁掉。
			* 定位改用视口坐标，左缘仍对齐会话标题（找不到标题元素就贴锚点），宁歪勿丢。
			*/
			const [panelPos, setPanelPos] = (0, react.useState)(null);
			const close = () => setOpen(false);
			(0, react.useEffect)(() => {
				if (!open) return;
				const anchor = wrapRef.current;
				if (anchor === null) return;
				const updatePos = () => {
					const rect = anchor.getBoundingClientRect();
					const crumb = document.querySelector("[class*=\"_crumbCurrent\"]");
					const left = crumb !== null ? crumb.getBoundingClientRect().left : rect.left;
					setPanelPos({
						left: Math.max(24, Math.min(left, window.innerWidth - 444)),
						top: rect.bottom + 6
					});
				};
				updatePos();
				const onDown = (event) => {
					const target = event.target;
					if (wrapRef.current?.contains(target) || panelRef.current?.contains(target)) return;
					setOpen(false);
				};
				document.addEventListener("mousedown", onDown);
				window.addEventListener("resize", updatePos);
				window.addEventListener("scroll", updatePos, true);
				return () => {
					document.removeEventListener("mousedown", onDown);
					window.removeEventListener("resize", updatePos);
					window.removeEventListener("scroll", updatePos, true);
				};
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
						title: running ? t("renameDisabledHint") : void 0,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
							variant: "plain",
							size: "md",
							icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(EditIcon, { size: 16 }),
							label: t("renameTitle"),
							disabled: running,
							onClick: () => open ? close() : openPanel()
						})
					})
				}), open && panelPos !== null ? (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					ref: panelRef,
					style: {
						position: "fixed",
						top: panelPos.top,
						left: panelPos.left,
						zIndex: 1e3,
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
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								variant: "plain",
								size: "sm",
								icon: "×",
								label: t("closeAria"),
								onClick: close
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Input, {
							value: draft,
							placeholder: t("renamePlaceholder"),
							"aria-label": t("renameTitle"),
							onChange: setDraft,
							onKeyDown: (event) => {
								if (event.key === "Enter") save();
							}
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
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
										variant: "outline",
										size: "lg",
										onClick: close,
										children: t("cancel")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
										variant: "outline",
										size: "lg",
										loading: busy,
										disabled: running,
										onClick: generateDraft,
										children: busy ? t("generating") : t("autoGenerate")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
										variant: "primary",
										size: "lg",
										disabled: busy || draft.trim() === "",
										onClick: save,
										children: t("confirmSave")
									})
								]
							})]
						})
					]
				}), document.body) : null]
			});
		}
		function apply(ctx) {
			connectHost(ctx, { modelsPath: MODELS_PATH });
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
						hooks: { panel: store },
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