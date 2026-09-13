# dsh-session-title-pattern 开发进度追踪

> 本文件用于追踪 `@deepseek-ai/dsh-session-title-pattern` 插件的开发进度。
> 格式：`[状态] 步骤名称 - 描述`
> 
> 状态标记：
> - `✅` 已完成
> - `🔄` 进行中
> - `⏳` 待开始
> - `❌` 阻塞/问题

---

## 当前版本：v0.2.9

### v0.2.9（本次）

「生成标题」按钮三项改造：

1. **图标**换成官方 `IconRefreshOutline16`。原来是我手绘的四角星内联 SVG，16px 下会被
   误认成加号。primitives 其实自带 49 个官方 `IconXxx16`（侧边栏开关等内置按钮用的就是
   同一套），手绘属于重复造轮子，已删除。
2. **位置**从 `conversation.session.header.utilities` 挪到 `conversation.session.header.actions`，
   `order` 由 `100` 改为常量 `ACTION_ORDER = -1000`。依据：上游头部结构是
   `titleCluster > (crumbs, headerActions)`，该组紧贴标题；同区内按 order 升序排列，
   取足够小的负数即可成为**标题右边第一个**，「标准模式」落在其右侧，其他插件后挂的
   条目也都在右边。
3. **悬浮提示**改用官方 `Tooltip`（`label` / `side: 'bottom'` / `delayMs: 500`），与内置按钮
   同款。注意 `Button` 是普通函数组件、**不转发 ref**，不能直接当 Tooltip 的锚点，因此套了
   一层 `span`（`display:inline-flex`）当中介。禁用态额外挂原生 `title` —— 禁用的原生表单
   控件不派发鼠标事件，Tooltip 不会出现。

顺带清掉：手绘 SVG 常量、以及那条「ui-primitives 没有通用图标集」的错误注释。

### v0.2.8

解除会话标题的宽度硬上限。客户端激活时自动注入：

```css
[class*="_crumbCurrent"]{max-width:min(640px, 60vw) !important;}
```

**根因**：会话标题是头部面包屑的最后一段（`_crumb` + `_crumbCurrent`），上游给它写死了
`max-width:220px`，与窗口缩放无关。核算：`220 − 16(左右内边距) = 204px` 可用；
`0913 ` 约 38px + `测试` 约 28px + 两个分隔符约 28px = 前缀约 94px；
留给主题约 110px，14px 字号下即 **7~8 个中文字** —— 与用户观察一致。

**为什么不能用槽位解决**（已核实）：解析 ui-conversation 的面包屑渲染代码

```js
const lineage = last || summary.subagent;
lineage ? (summary.subagent
  ? renderSlot('conversation.session.header.lineage', owner, { fallback: title })
  : <>{title}{renderSlot('conversation.session.header.lineage', owner, { fallback: null })}</>)
  : title
```

`conversation.session.header.lineage` 的契约是「单个面包屑标题的可选渲染器」（`kind: 'single'`）：
祖先面包屑不渲染该槽位；子代理面包屑可整体替换标题；**当前会话的 `title` 元素由上游无条件
原生渲染**，槽位只能作为其后的兄弟节点存在。即**没有任何槽位能改写当前会话标题本身**，
CSS 覆盖是唯一可行手段。

**为什么必须 `!important`**：属性选择器与上游 `.wSkVaW_crumb` 特异性相同（都是 0,1,0），
平局按源码顺序决胜，而注入顺序无法保证。

**为什么不会溢出**：`.crumb` 自带 `overflow:hidden`，flex 项的 `min-width:auto` 因此解析为 0，
宽度不足时会自动收缩并省略，不会挤占同行其他控件。

**失效模式**：选择器依赖 CSS Modules 生成的局部类名后缀 `_crumbCurrent`。上游若重命名该类名，
规则会**静默失效** —— 不报错、不崩溃，只是标题又变短。排查方法：DevTools 选中标题元素，
看它 `class` 属性里是否还有 `_crumbCurrent`。

### v0.2.7

按钮改为**图标按钮**（内联四角星 SVG + `title="生成标题"`），不再显示「生成标题」文字，
目的是与同排的 `...` 等控件观感统一（约 36px vs 约 68px）。

> 修正：v0.2.7 当时认为图标按钮「能还给标题 30 多像素」，**这个结论是错的**。
> 标题宽度由上游 `.crumb` 的 `max-width:220px` 决定，只要可用宽度 ≥ 220px，
> 头部控件宽窄完全不影响标题，多出来的空间只会留在 `.titleCluster` 里。
> 真正的宽度问题由 v0.2.8 的 CSS 覆盖解决。

### v0.2.6

按钮改用官方 `@deepseek-ai/dsh-client-ui-primitives` 的 `Button`（`variant="ghost"` +
`size="sm"`），与头部其它控件风格一致。原先渲染的是裸 `<button>`，这多半才是「位置不好」
的真实原因。该包在 PLATFORM_MODULES 内，按 external 引入即可，不会内联、不触发纯度闸门。

另：再次核实「会话头部最右『更多』菜单」也**不可扩展** ——
`@deepseek-ai/dsh-session-log-export`（该菜单的所有者）的编译产物里没有任何 `renderSlot` 调用。

### v0.2.5

按钮位置从 `conversation.session.header.actions`（紧挨标题，会把标题挤窄）移到同级的
`conversation.session.header.utilities`（同一行靠右），`order` 由 -100 改为 100。

排查结论（已记入 README）：dsh 只在「会话头部 / 输入区 / 侧边栏框架」这些扩展位开放 slot。
会话列表每行的三点菜单（重命名/分叉/归档）和重命名对话框都是封闭组件，没有任何 slot，
第三方插件无法往里加菜单项 —— 已从两个角度核实（SlotMap 声明与编译产物中的 renderSlot 调用点）。

### v0.2.4

修复「按钮不出现」。

- `dsh.client.inject` 里误写了 `@deepseek-ai/dsh-client-ui-slots` —— 它是平台模块，
  不是 Loader row，不存在的依赖边会让本 entry 永远不 materialize（静默不出现）。
  已按官方 `ui-open-in-app` 的写法收敛到真实 row。
- slot 注册不再等 `remote`：改成只等 `slots`，`remote.commands` 在点击时通过
  可变引用读取。remote 命名空间挂载可能晚于 slot 注册，提前闭包捕获会拿到
  undefined，表现为「按钮在但点了没反应」。
- 注册成功时输出 `[dsh-session-title-pattern] 已注册「生成标题」到 ...` 到控制台，便于排查。

### v0.2.3

**修复 v0.2.1 的启动事故。**

v0.2.1 用 `inject = { required: [...], optional: [...] }` 声明依赖，但 cordis 的
`Inject` 是「服务名 → 配置」映射，没有 required/optional 概念。结果 entry 永远
pending，dsh 直接起不来：

```
@cq-guojia/dsh-session-title-pattern: pending (waiting for services: required, optional)
Error: dsh: plugin tree failed to load: dsh: 1 entry did not activate
```

修法：必填依赖回到数组形式，可选依赖一律改用 `ctx.inject()` 延迟加载 ——
子 fiber 不是 Loader entry，依赖永不出现也只是功能降级，不会阻断启动。
host 与 client 两端都已采用。

### v0.2.2

精简开发依赖：移除排查时临时安装、实际从未引用的 `@deepseek-ai/dsh-client-ui-sidebar`，
以及运行时由 dsh 模块表提供、本地只需类型定义的 `react`。对产物无任何影响
（`lib/client.js` 仍只 require `react/jsx-runtime`）。

### v0.2.1

新增会话头部「生成标题」按钮（客户端 Slots 贡献）。

新增会话头部「生成标题」按钮（客户端 Slots 贡献）。

- Host：注册 `/retitle` 命令，`ctx.sessionTitle.refresh(agent.session, signal)`
- Client：`conversation.session.header.actions` slot，`order: -100` 排最前，`id: generate-title`
- 触发链路：按钮 → `ctx.remote.commands.execute(sessionId, '/retitle', [], signal)` → host 命令
- 构建：客户端产物改为官方 CJS 闭包契约（`window.__ModuleLoader__.load`），产出单文件 `lib/client.js`

### v0.2.0

新增 host 端 `/retitle` 命令（`commands` 可选注入）。零启动风险，输入框可直接敲命令。

### v0.1.2

标题格式调整：日期 `YYMMDD` → `MMDD`，分隔符默认改为全角竖线 `｜`。

### v0.1.0（已完成）

**目标**：实现 `MMDD｜类型｜主题` 格式的确定性会话标题生成器

### v0.1.1（本次，代码已改完，待构建 + 提交）

**目标**：修复代码审查发现的 16 项缺陷，整理构建链路

详细根因与方案见 [REVIEW.md](./REVIEW.md)。

**P0 功能性 / 契约性缺陷（12 项）**

| # | 缺陷 | 修复 |
|---|------|------|
| 1 | 与内置 `session-title-llm` 单例冲突，用户必须手动禁用 | patch 按 id 自动禁用 + `apply()` 内 try/catch 兜底告警 |
| 2 | `maxBytes: 120` 超过服务硬上限 80，静默失效 | 默认改 80，schema 加 `.step(1).min(20)` |
| 3 | 日期用 UTC，东八区 00:00–08:00 显示成前一天 | 改本地时区，`now` 改为参数注入 |
| 4 | 按 UTF-16 code unit 截断，切断代理对 | 删除预截断，统一交给 `truncateTitleUtf8` |
| 5 | 主题预算没扣前缀，截断逻辑重复 | 先拼 `head`，整串只截断一次 |
| 6 | 兜底分类返回正文片段，与 README 不符 | 兜底改 `其他` |
| 7 | patch 使用了官方不存在的 `apply: host` 键 | 删除 |
| 8 | `name` 未 export | 改 `export const name` |
| 9 | 重复 `declare module` 声明 `sessionTitle`（TS2717 风险） | 删除，改用依赖包自带类型增强 |
| 10 | `z.infer` 非官方写法 | 改 `interface Config` + `z<Config>` |
| 11 | 斜杠命令消息退化成 `日期\|指令\|指令` | 回退原文；主题为空时只返回 `日期\|类型` |
| 12 | 自实现截断与包导出的 `truncateTitleUtf8` 重复 | 删除自实现 |

**P1 构建 / 打包缺陷（4 项）**

| # | 缺陷 | 修复 |
|---|------|------|
| 13 | 两个 tsdown 配置的 `clean` 互相清产物 | client 改 `clean: false`，`scripts.build` 固定顺序 |
| 14 | `exports` 无 `./client`、`files` 漏 `lib/client` | 补齐 |
| 15 | 完全没有 `scripts` | 加 `build` / `build:host` / `build:client` / `typecheck` / `prepublishOnly` |
| 16 | README 包名与 `package.json` 不一致、缺关键说明 | 重写 README |

**待办（本轮不做，方案见 REVIEW.md 第 3 节）**

- 分类规则重构（规则表 + 最长匹配 + 加权打分）
- 主题提取优化（停用词、按句切分、CJK/英文分治）
- 前端能力（自定义格式模板、模型选择、手动刷新按钮、N 条对话重算）
- 单元测试（vitest）
- `request.signal` 接入
- 多语言 / 英文标题

---

## v0.1.0 及之前的记录

**目标（v0.1.0）**：实现 `MMDD｜类型｜主题` 格式的确定性会话标题生成器

---

## 开发步骤

### Phase 1: 项目初始化 ✅

| 步骤 | 状态 | 说明 | 完成时间 |
|------|------|------|---------|
| 1.1 | ✅ | 创建 Git 仓库，初始化目录结构 | 2026-09-12 |
| 1.2 | ✅ | 编写 package.json（插件清单） | 2026-09-12 |
| 1.3 | ✅ | 编写 tsconfig.json（TypeScript 配置） | 2026-09-12 |
| 1.4 | ✅ | 编写 tsdown.host.config.ts（Host 构建配置） | 2026-09-12 |
| 1.5 | ✅ | 编写 tsdown.client.config.ts（Client 构建配置） | 2026-09-12 |
| 1.6 | ✅ | 编写 .gitignore（排除 node_modules/lib） | 2026-09-12 |
| 1.7 | ✅ | 创建 src/host/index.ts（核心逻辑） | 2026-09-12 |
| 1.8 | ✅ | 创建 src/client/index.ts（客户端存根） | 2026-09-12 |
| 1.9 | ✅ | 编写 cordis.patch.yml（DSH 插件入口） | 2026-09-12 |
| 1.10 | ✅ | 编写 README.md（使用说明） | 2026-09-12 |

**Phase 1 输出物**：
- 源代码：`src/host/index.ts`, `src/client/index.ts`
- 配置文件：`package.json`, `tsconfig.json`, `tsdown.*.config.ts`, `.gitignore`, `cordis.patch.yml`
- 文档：`README.md`

---

### Phase 2: 构建与编译 🔄

| 步骤 | 状态 | 说明 | 完成时间 |
|------|------|------|---------|
| 2.1 | ⏳ | 安装依赖（npm install） | 待执行 |
| 2.2 | ✅ | 编译 Host 端（tsdown --config tsdown.host.config.ts） | 2026-09-12 |
| 2.3 | ✅ | 编译 Client 端（tsdown --config tsdown.client.config.ts） | 2026-09-12 |
| 2.4 | ⏳ | 验证编译产物（lib/ 目录内容） | 待执行 |
| 2.5 | ⏳ | 提交编译产物到 Git（可选，建议不提交） | 待决策 |

**Phase 2 输出物**：
- 编译产物：`lib/index.mjs`, `lib/index.d.mts`, `lib/client/index.js`, `lib/client/index.d.ts`
- 映射文件：`lib/*.mjs.map`, `lib/*.d.mts.map`

**注意**：编译产物建议加入 `.gitignore`，不提交到版本控制。

---

### Phase 3: 本地测试 ⏳

| 步骤 | 状态 | 说明 | 完成时间 |
|------|------|------|---------|
| 3.1 | ⏳ | 将插件软链接到 DSH profile（测试用） | 待执行 |
| 3.2 | ⏳ | 重启 DSH Web GUI | 待执行 |
| 3.3 | ⏳ | 创建新会话，验证标题格式 | 待执行 |
| 3.4 | ⏳ | 测试不同类型的消息分类 | 待执行 |
| 3.5 | ⏳ | 测试标题长度截断逻辑 | 待执行 |
| 3.6 | ⏳ | 测试配置项（separator, maxBytes） | 待执行 |

**Phase 3 输出物**：
- 测试报告：标题格式验证结果
- 问题记录：发现的问题及修复方案

---

### Phase 4: 完善功能 ⏳

| 步骤 | 状态 | 说明 | 完成时间 |
|------|------|------|---------|
| 4.1 | ⏳ | 扩展消息分类规则（更多业务场景） | 待执行 |
| 4.2 | ⏳ | 优化主题提取算法（更准确的关键字） | 待执行 |
| 4.3 | ⏳ | 添加多语言支持（英文标题） | 待执行 |
| 4.4 | ⏳ | 添加单元测试 | 待执行 |
| 4.5 | ⏳ | 添加 E2E 测试 | 待执行 |

---

### Phase 5: 发布准备 ⏳

| 步骤 | 状态 | 说明 | 完成时间 |
|------|------|------|---------|
| 5.1 | ⏳ | 版本升级（v0.1.0 → v0.2.0） | 待执行 |
| 5.2 | ⏳ | 更新 CHANGELOG.md | 待执行 |
| 5.3 | ⏳ | 更新 README.md（完善使用文档） | 待执行 |
| 5.4 | ⏳ | Tag 发布版本（git tag v0.2.0） | 待执行 |
| 5.5 | ⏳ | 推送 Tag 到 GitHub | 待执行 |
| 5.6 | ⏳ | 创建 GitHub Release | 待执行 |

---

### Phase 6: 发布到 npm ⏳

| 步骤 | 状态 | 说明 | 完成时间 |
|------|------|------|---------|
| 6.1 | ⏳ | 登录 npm（npm login） | 待执行 |
| 6.2 | ⏳ | 发布到 npm（npm publish） | 待执行 |
| 6.3 | ⏳ | 验证 npm 包可安装 | 待执行 |

---

### Phase 7: 长期维护 ⏳

| 步骤 | 状态 | 说明 | 完成时间 |
|------|------|------|---------|
| 7.1 | ⏳ | 监控 GitHub Issues | 持续 |
| 7.2 | ⏳ | 处理 Pull Requests | 持续 |
| 7.3 | ⏳ | 跟进 DSH 新版本兼容性 | 持续 |
| 7.4 | ⏳ | 定期版本更新 | 持续 |

---

## 当前状态总结

```
Phase 1: 项目初始化    ✅ 100% (10/10)
Phase 2: 构建与编译    🔄  40% (2/5)
Phase 3: 本地测试      ⏳   0% (0/6)
Phase 4: 完善功能      ⏳   0% (0/5)
Phase 5: 发布准备      ⏳   0% (0/6)
Phase 6: 发布到 npm    ⏳   0% (0/3)
Phase 7: 长期维护      ⏳   0% (0/4)

总进度: 12/39 步骤完成 (31%)

v0.1.1 代码修复: ✅ 16/16（P0 12 项 + P1 4 项），产物未重建
```

---

## 最近提交

```
34cead5 init: plugin structure for dsh-session-title-pattern
```

---

## 待办事项（下一步）

1. **构建**：`npm install && npm run build`
   —— `lib/` 是提交进 git 的产物，dsh 加载它而不编译 `src/`，不构建则本次改动不生效
2. **提交**：`git add -A && git commit`
3. **发版**：打 tag，然后在 dsh 机器上更新版本
4. **验收**：
   - `dsh --profile web --dump-config` —— 确认出现本插件层，且 `session-title-llm` 行为 `disabled`
   - 新建会话发一条消息 —— 确认标题形如 `0913｜接口｜登录接口鉴权`，且主题没被截断

---

## 维护说明

**如何更新此文档**：
1. 每完成一个步骤，将对应行的状态从 `⏳` 改为 `🔄` 或 `✅`
2. 填写完成时间（如适用）
3. 如有新问题或阻塞，在对应步骤后添加 `❌` 并备注说明
4. 定期更新"当前状态总结"和"总进度"

**建议**：此文档应与代码一起提交到 Git，作为项目文档的一部分。
