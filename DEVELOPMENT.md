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

## 当前版本：v0.8.0

### v0.8.0（本次）

**适配 dsh 0.1.7-rc.1 的破坏性重构：设置入口搬到插件详情页，删除「隐藏会话」功能。**

dsh 0.1.7 的破坏面（均从 npm 产物源码逐一核实，非猜测）：`settingsScope` 服务删除、
`settings.plugin.item` 槽位删除、host 侧 `installSection` / `settings.get` 删除（新
`SettingsForms` 服务只保留 configure/get/writable/describe 等读写面，设置命名空间由
entry 的 Config 导出**自动派生**）；`IconEditOutline16` 改名 `IconEditOutlineRegular`；
`MessageSource` 删除共享的 `plugin` catch-all（各 producer 在自己模块里声明专属 kind）。

**1. 删除「隐藏会话」功能**（[src/client/hidden/](src/client) 四文件全删）。

- 依据：该功能靠 CSS 类名后缀 + React fiber 内部结构识别列表行，上游任何改版即静默
  失效；dsh 原生已提供会话归档，显示层开关不再有存在价值。
- 连带删除：九条 locale 词条、三张截图（hidden-*.png）、devDependency
  `dsh-api-session-controller`、Config 的 `hiddenEnabled` / `hiddenSessions` /
  `revealHiddenAll` 三字段。旧配置里的残留键由 schema 忽略，不影响加载。

**2. 配置 UI 迁到 `plugins.bundle.config` 槽位**（新建 [config-panel.tsx](src/client/config-panel.tsx)，删除 settings-card.tsx / settings-css.ts）。

- 状态机全部交给官方 `SettingsFormModel`（stage 在共享 ConfigForm 之上，save 原子
  提交），渲染用官方 `SettingsForm` + `SettingsValueField`。
- 六个字段：retitleEvery / provider / model / timeoutMs / template / maxBytes。
  provider / model 由 [model-pair.tsx](src/client/model-pair.tsx) 渲染成
  「标题总结大模型」一排的两个下拉（见第 6 条）；`maxOutputTokens` / `maxInputBytes`
  仍是内部预算，不放出。
- entry 以 `hooks: { panel: store, directory: directoryStore }` 注入，框架合成
  `usePanel` / `useDirectory` selector hook；保存成功沿用平台 Toast（v0.7.6 口径）。
- 槽位为 keyed、key 必须与包名逐字相同；`configForms.whileServed` 保证宿主未登记
  命名空间时详情页不留痕迹。

**3. host 端热更新改造**（[src/host/index.ts](src/host/index.ts)）。

- Config 八个字段全部 `.volatile()`（schemastery ^3.18.4）：设置提交后宿主原位刷新
  活性引用，**改配置不再需要重载 entry**。运行时形态是 `{ get(): T }`，读取一律经
  `currentConfig()` 逐字段 `.get()`。
- 删除 `installSection`（含 setSource/onChange/validate）。0.1.7 没有 validate 钩子，
  provider / model 成对校验退化为启动时 warn；「配置变化清滚动摘要」改在
  `generate()` 入口做签名比较（只看影响标题生成的六个字段）。
- 界面语言读取从 `settings.get('locale')` 改为 `settings.describe()` 里找
  `ns === 'locale'` 的描述符。

**4. 铅笔图标三行兜底链**（[src/client/index.tsx](src/client/index.tsx)）。

- 不再具名导入：从 primitives 命名空间按名取用
  `IconEditOutlineRegular ?? IconEditOutline16 ?? 内联 SVG`，都没有就 warn 一次。
  上游再改名时只是图标退回内联 SVG，按钮不再整块消失（0.1.7 的改名正是这么把
  v0.7.x 的铅笔弄没的）。

**5. 依赖与清单**（[package.json](package.json)、[cordis.patch.yml](cordis.patch.yml)）。

- devDependencies / peerDependencies 全部升至 0.1.7-rc.1；peer 收紧为
  `>=0.1.7-rc.1 <0.2.0-0`；schemastery ^3.18.4。
- `dsh.client.inject` 加 `@deepseek-ai/dsh-client-ui-plugin-manager`（配置槽位契约）、
  去 `@deepseek-ai/dsh-client-ui-settings-plugins`（包已删除）。
- [llm.ts](src/host/llm.ts) 按新词汇登记专属消息来源
  `kind: 'dsh-session-title-pattern'`。

**6. 实机反馈：provider / model 恢复为双下拉，一行两个**（[src/client/model-pair.tsx](src/client/model-pair.tsx)）。

用户原话：「这个不能选择了吗？？为什么是填写了？」「放一排，一个左边，一个右边，不是要
自己写样式，就是原本有没有样子支持这样的」。0.1.7 官方 settings-form 只有文本 / 数字 /
密钥三种字段控件、没有下拉，首轮实施据此退化成文本框，被实机否决。恢复方案：

- 下拉用官方 `Menu` 原语组合（受控 open / anchor / items / selectedId / onSelect），
  草稿仍走 `edit()` 进官方 `SettingsFormModel`，状态机一行不自己管；Menu 没有
  disabled prop，禁用落在触发按钮上。
- 目录数据：远端 `llm/listProviders` + `llm/listConfigurableProviders`，模型列表从
  设置镜像 `configForms.describe()` 读各供应商 profile 的 `models`。0.1.7 remote
  命名空间已无 credentials，判定口径只看设置文档用户层写过没有，界面上用
  `credentialsUnknown` 文案说明（宁缺勿滥，同 v0.7.6 凭据域读不到时的方向）。
- `DirectoryStore` 两阶段喂参（`remote.llm` 与 `configForms` 就绪时序不定，齐了才
  加载一次，幂等）；loading / unavailable 退回两个文本框（v0.7.6 同款 fail-safe）。
- 官方没有「一排两个」布局原语，用 flex + 官方 token 拼（`.stp-pair`，样式注入走
  `style.ts` 的 PAIR_CSS）；选厂家时模型自动落到第一个（保存入口前补解析，显示上
  从不自动补值 —— 不挂「未保存」，v0.7.6 踩过的坑）。

**7. 展示名/介绍跟随界面语言、版本下限收紧、最后一排并排**。

- 新增 `locale/en.json` / `locale/zh.json`（`meta.title` / `meta.description`）：
  Host 的 `readPluginMeta` 解析 `包名/locale/<语言>.json`（en.json 是入口，没有它整个
  目录都不读），按界面语言给插件列表与详情页提供展示名与介绍。中文显示
  「会话标题格式化(dsh-session-title-pattern)」，英文 Session Title Formatter；
  package.json 的 exports 放开 `./locale/*.json` 并把 `locale` 加进 files。
- `engines.dsh` 声明 `>=0.1.7`，peerDependencies 同步从 `>=0.1.7-rc.1` 收紧为
  `>=0.1.7`（0.1.7-rc.x 会被兼容性预检判为不兼容）。
- 配置表单最后一排改为「标题长度上限（左）｜超时（右）」并排（复用 `.stp-pair`），
  标题格式仍独占一行。
- 新增插件图标 [icon.svg](icon.svg)（方块拼的 T + 两侧浅色中括号，DeepSeek 蓝）：
  package.json 顶层 `"icon": "./icon.svg"`，宿主读文件转 base64 data URL 渲染
  （支持 SVG/PNG/JPEG/WebP，≤256 KiB），`icon.svg` 已加入 files。

**实机验证清单**：

1. 插件出现在侧边栏「插件」列表的「已安装」分组（前置条件；不在则配置区无从谈起）。
2. 详情页配置表单出现 → 改一项 → 保存 → Toast → 重进值还在 → 标题按新配置生成，
   且改 retitleEvery 等字段不清滚动摘要。
3. 头部铅笔图标正常、重命名面板正常（自动生成 / 锁定 / 解锁）。
4. 中英语言切换正常（表单文案跟随）。
5. 旧配置里的 `hiddenSessions` 等残留键不影响加载。
6. 「标题总结大模型」一排出现两个下拉且只含已配置的供应商；选厂家后模型自动落到
   第一个；保存 → 重进值还在；改语言下拉文案跟随；目录读不到时退回两个文本框并
   显示原因。
7. 插件列表与详情页的名称/介绍跟随界面语言（中文显示「会话标题格式化」，英文显示
   Session Title Formatter）；最后一排「标题长度上限 | 超时」并排正确。

**状态**：🔄 代码完成（typecheck + build 通过），待实机验证后发版。

### v0.7.6

**实机反馈修正（两处交互）：折叠侧边栏时藏掉区域标题行的眼睛、保存后留在原地弹 Toast。**

用户原话：「左侧菜单，我们加的那个眼睛的图标。在菜单栏收起来的时候（就是收窄时）要把这个
眼睛图标隐藏起来。还有，在设置里面，有个保存按钮，点了那个保存不应该把设置的那个下拉收起来，
应该给个简单的保存成功的提示，然后页面不动，不要去单独写那个提示，看系统有没有自带的toast
之类的。直接用。」

**1. 折叠侧边栏时藏掉区域标题行的眼睛总开关**（[sidebar.ts](src/client/hidden/sidebar.ts) 的 `ensureHeaderEye`）。

- 依据（v0.4.x 实机验证过）：折叠成图标栏（rail）时上游不渲染 `_searchSlot`。原逻辑此时把
  眼睛降级挂在标题行末尾「+」旁边，窄栏里挤着一只常显按钮很突兀。
- 现在 `_searchSlot` 不在 = 折叠态：把已注入的眼睛摘掉，展宽后下一趟 decorate 自动装回。
- 会话行 hover 的眼睛不受影响：折叠态不渲染会话行，那一处本来就不存在。

**2. 保存成功后不收起卡片，改弹平台自带 Toast**（[settings-card.tsx](src/client/settings-card.tsx)）。

- 删掉 `save()` 里的 `setExpanded(false)`（原对齐官方 PluginCard 的「保存成功自动收起」，
  用户要求留在原地继续编辑）。
- 提示直接用 `@deepseek-ai/dsh-client-ui-primitives` 的 `Toast`（顶部横幅、body portal、
  3 秒自动淡出），与官方 `InputBar` 同一套模式：按 seq 计数发新的一条，连存两次也能重启
  淡出周期，`onDone` 淡出完了才卸载。没有自己写任何提示 UI。
- 新增词条 `saveSuccess`（已保存 / Saved）。

**实机验证**：用户装上确认通过后发版（两处行为均正常）。

### v0.7.5

**标题里的日期改为「会话创建时间」，不再用生成那一刻的 `new Date()`。**

用户原话：「重命名文件的时候用的给文件命名的时间用的是当前的时间，我觉得这是不对的，
应该是用这个对话创建的时间，或是第一次对话的时间」。

问题：`{MMDD}` 这类日期部件的锚点原来是调用点的 `new Date()`，于是每满 `retitleEvery` 条
重算一次、前缀就刷新一次 —— 跨零点继续聊，同一个会话的日期当天就变了；对老会话敲 `/retitle`
也会把前缀跳到今天。

修法（**方案 B**，用户选定：只用会话创建时间，不加 `dateSource` 配置项）：统一走
`session.header.createdAt`（存储层创建会话时写死的 Unix 毫秒，恢复 / 重启读回同一个值），
4 个调用点全部改掉：

| 调用点 | 原来 | 现在 |
| --- | --- | --- |
| `generate()` 正式生成 | `composeTitle(new Date(), …)` | `composeTitle(createdAt, …)` |
| `generate()` 本地兜底 | `buildFallbackTitle(messages, config)` | `buildFallbackTitle(messages, config, createdAt)` |
| `title-suggest` 草稿 | `composeTitle(new Date(), …)` | `composeTitle(createdAt, …)` |
| `title-suggest` 兜底 | `buildFallbackTitle(messages, config)` | `buildFallbackTitle(messages, config, createdAt)` |

- 新增 `sessionStartedAt(session)`（host/index.ts）：一行 `new Date(session.header.createdAt)`。
- `rules.ts` 的渲染逻辑**一行没动** —— `formatTitle` / `composeTitle` 本来就把 `now` 当参数收；
  `buildFallbackTitle` 的默认值 `new Date()` 保留为纯函数兜底，实际调用点都显式传。
- 草稿与自动生成**同口径**，否则面板预览与正式标题会差一天。
- `{HH}` `{mm}` `{ss}` 也一并锚到同一时刻：用 `{HHmmss}` 模板的人会发现时间不再变化，
  这是「前缀稳定」的必然结果，README 里已注明。
- 副作用（预期）：老会话重算时前缀回到它自己那天的日期；用户手动改名（锁定态）的标题不受影响。

**待实机验证**（无自动化测试，只能装进真实 dsh profile 跑）：① 昨天开的会话敲 `/retitle`，
前缀是否仍是昨天；② 跨零点发出第 `retitleEvery` 条消息，前缀是否没跳；③ 面板「自动生成」的
草稿日期与自动标题是否一致。

### v0.7.4

**撤销 v0.7.3 的锁定态缓存（用户决定），保留两个默认值修改。**

用户原话：「为了那个提示去做这么多，不值得，还原原来的状态吧。让他正常提示就行。」

- `LOCK_STATE_CACHE` 及其三个回写点全部移除；`/title-state` 回到**每次打开面板都执行**，
  对话末尾每次都会有一条 "unlocked" / "locked" —— 接受它（命令通道的固有行为，
  `command/run` / `command/done` 必落，平台没有「不落日志」的选项）。
- 面板行为与 v0.7.2 完全一致：开面板 → 查锁定态 → 显示在开关上。
- **保留** v0.7.3 的两个默认值修改：`maxOutputTokens` 2048、`timeoutMs` 90s
  （修 `produced no text` 与超时），这两条与本话题无关，是推理模型的预算与时间问题。

### v0.7.3

**实机反馈修正。** 用户装上 0.7.2 实测后报了两类问题，外加一处交互噪音。

**1. 「自动生成」连续失败：`Title model produced no text` / `SESSION_TITLE_TIMEOUT after 30000ms`。**

先诊断、经用户确认后再改：

- dsh-llm 的块模型里 **`text`（可见文本）与 `reasoning`（思考）是两种块**，我们只取 `text`。
  「produced no text」= 流**正常结束**但一个 text 块都没有 —— 推理模型把 512 的输出预算
  全部花在思考上，想完就到了 `max-tokens`，一行可见文本都没写。这是 v0.5.19
  「标题模型未正常结束（max-tokens）」的直系后代：当时改成「max-tokens 不算失败、取首行」，
  但**首行也无从取起**时就成了这条新错误。
- 超时那条是我们自己的 30s 闸门（`deadline`）正常工作，不是 bug。
- **为什么自动命名「最后成功了」而手点一直失败**：自动那条路有多次机会（首条一次 +
  每 N 条重算一次）且错峰；手点一次只有一个 30s 窗口，还可能正跟主对话抢免费档并发名额。

修法（用户拍板）：`maxOutputTokens` 默认 512 → **2048**、`timeoutMs` 默认 30s → **90s**。
前者是保险丝松紧 —— 硬切断、按实写计费，正常情况（标题一行几十 token）成本一分不变；
后者给推理与排队留时间。都改在 schema 默认值上，没改过的老用户自动受益。

> 顺带核实：`GenerateOptions.reasoningEffort` 存在（"Adapter-owned reasoning effort selected
> for this exact model"），类型上**可以按调用降推理**，但接受哪些值由适配器自有
> （`ReasoningEffortId`），本地没有 DeepSeek 适配器、验证不了有没有「关」档 —— 没走这条路。
> 回复里给了更省事的替代：给标题单独指定一个**非推理模型**（设置里就能改），
> 一句话的标题任务不需要推理，慢 / 超时 / produced no text 三个问题一起消失。

**2. 每次打开重命名面板，对话末尾都多一行 "unlocked" / "locked"。**

用户原话：「点铅笔按钮，在对话窗口，就是对话最后面输出的提示。删除那个」。

根因：面板打开时执行 `/title-state`，而命令通道**必然**在会话记录里落 `command/run` +
`command/done` 两条事件 —— `recordInput: false` 只是不记输入，**命令名与结果一定落**
（`dsh-commands` 的 `CommandDefinition` 没有任何「不落日志」选项）。所以「彻底删掉」在
命令通道内做不到，只能**把频率降下来**。

修法：锁定态加**会话级内存缓存**（`LOCK_STATE_CACHE`，上限 200、按最近使用淘汰）——
同一页面里锁定态只会被本面板自己改变（rename 写入即锁定 / lock / unlock），所以每个会话
只查一次、之后读缓存；rename / lock / unlock 三个动作同步回写缓存。刷新页面缓存清空会重查
一次；跨标签页或手敲命令的改动拿不到，那时开关位置可能是旧的，拨一下即纠正。

**3. 版本与文档**：0.7.2 → 0.7.3；两份 README 的配置表同步两个新默认值。

### v0.7.2

**英文支持改造。** 用户原话：「给我一个需要支持英文的改进方案」。

用户给的可见项四条：①不用模型总结的功能直接砍掉，必须用模型；②类型「中文还是两个汉字，
英文就用一个单词」；③设置与提示要有中英双语；④其余让我补。落地方案先出、经确认后才动手。

**1. 砍掉 rules 模式（必用模型）。**

删除 `Config.mode`、设置卡片里的「用模型总结标题」开关、`modelOnly` 机制、`classifyMessage`
与 11 类关键词表、`FALLBACK_TYPE`。`buildRuleTitle` 收敛为 `buildFallbackTitle`。
设置卡片少一行，其余项常显。

**失败的语义改成分两段**（判定依据 = **会话当前是否已有标题**）：

| 场景 | 表现 |
| --- | --- |
| 已有标题（重算 / 修改） | 抛错 → 服务保留上一次标题（原有行为） |
| 还没有标题（新建会话首次就失败） | 本地兜底，不报错 |

判定用 `ctx.sessionTitle.get(session)?.title` 而**不是** `state.summary` —— `/retitle` 会清摘要
但标题仍在，用摘要判定会让手动重算误触发兜底。

**兜底标题的口径（用户逐字定义）**：「如果请求大模型失败，就忽略分类，后面直接拿前多少个字
就可以了……比如用户设置的是 `{MMDD}｜{type}｜{topic}`，那标题就是 `0915｜xxxxxxxxxxx`」。
即：日期时间部件本地渲染（`MMDD`/`YYMMDD` 这类本来就不需要模型）、**类型整段省略**、
主题取首条消息正文，长度由 `maxBytes` 收口。

> **后续修正（同一版本内，见第 7 条）**：主题的截断口径改为直接复用官方
> `fallbackSessionTitle()`，与 dsh 自带那次首次命名逐字一致。

为此 `formatTitle` 新增**空段折叠**：占位符渲染成空串时先打上内部标记 `EMPTY_SEGMENT`，
再由 `dropEmptySegments()` 吃掉它**一侧紧邻的分隔符串**。刻意**不做**整体分隔符折叠 ——
否则用户有意写的 `{YYYY}--{MM}` 会被压成 `2026-09`。

**2. `/title-suggest`（面板的「自动生成」）**：同一个判定 —— 会话**已有标题**时拿不到模型
就直接回错误文案，不给假草稿；**还没有标题**时退本地兜底，保证按钮永远有反馈。

**3. 类型按语言区分。**

新增 `normalizeType(raw, lang)` 取代 `MAX_TYPE_CHARS` 的一刀切：目标语言是中文 → 只留汉字
（最多 4 个）；是英文 → **只取第一个单词**、去标点、按 16 字符设安全上限。原实现按 4 个**字符**
截断，`Debugging` 会变成 `Debu` —— 这是英文支持里最直接的一个缺陷。

`SYSTEM_PROMPT` 改为**按目标语言生成**（`systemPrompt(typeLang)`）：**类型严格按指定语言**，
主线与主题跟随消息本身的语言；两段示例里**总有一条是「消息语言 ≠ 类型语言」**的情形 ——
只靠一句文字说明压不住，模型照抄示例比照抄说明可靠（v0.5.22 的教训）。

`parseTitleOutput` 的行首标签补上 `Main line:` / `Type:` / `Topic:`（大小写不敏感、中英冒号都认）
—— 原来只认中文标签，英文输出会把 `Type: Debug` 整行误当标题行，导致类型与主题错位。

**4. host 侧文案全面英文。** 6 条命令描述、全部命令回执、以及**会随回执冒出来的内部错误**
（`No usable model route…`、`Title model did not finish normally…`、`The llm service is not ready…`
等）与 `logger.info/warn` 全部改英文。范围边界：**客户端 `console.warn` 保持中文**（开发向）。

**5. 客户端中英双语（接入平台自带的 locale 服务）。**

这一步的关键发现：dsh **自带 i18n 机制**，第三方插件可直接接入，不必自造。

- 提供方是 `@deepseek-ai/dsh-client-locale`（`ctx.locale`）；官方 `ui-settings-plugins`、
  `ui-conversation` 都是这么用的（`lib/client.js:1702` 一带）
- API：`ctx.locale.register(NS, { zh, en })`、`bind(NS)` 拿 `t`、`getSnapshot().revision`、`subscribe()`
- 槽位注册项加 `locale: NS` → 框架把 `t` 注入组件，且**语言切换时组件自动重渲**
- 词典键由 `LocaleNamespaceMap` 声明合并约束，且 typed 形式的 `register` 要求
  `Record<BuiltInLocaleId, …>` —— **两种内置语言都必须给全**，缺键 / 缺语言都是**编译错误**。
  这是「两种语言不会漏翻」的机械保证，比人肉对齐可靠。

落地：新增 `src/client/locales.ts`（`LOCALE_NS`、`zh`/`en` 扁平词典 50 键、
`LocaleNamespaceMap` 合并、以及 DOM 层兜底的 `fallbackTranslate`）；
头部动作与设置卡片两处注册加 `locale: LOCALE_NS`；`FIELDS` 的 `label`/`hint` 改为**词条键**，
渲染时才 `t()`（否则语言切换不会跟着变）；DOM 层（不在 React 里）用 `bind` 拿 `t`，
并订阅 `locale/change` 重跑一趟 `decorate` 刷新眼睛的提示气泡与 `aria-label`。
`package.json` 的 `dsh.client.inject` 与 `devDependencies` 各加一条 `@deepseek-ai/dsh-client-locale`
（`^0.1.5-rc.2`，注意 npm `latest` 指向旧的 `0.0.1-rc.1`，与其余 devDeps 同款陷阱）。

`ctx.locale` 走 `ctx.inject` 延迟等待（**不能**写进模块级注入声明：组合里缺它会一直 pending）；
服务就位前 DOM 层用内置中文词典兜底，不会渲染出空串。

**6. 撤销一条原计划的「迁移兼容」。**

方案阶段我担心「删掉 `mode` 后，老 `cordis.patch.yml` 里残留的 `mode: rules` 会让
schemastery 判为非法键 → dsh 起不来」，建议保留一个「接受但忽略」的兼容键。
**核实后证明不必**：`object` 校验在非 strict 模式下会把未知键**原样并入结果、不报错**
（`schemastery/lib/index.mjs:479-487`，且 `Schema.resolve` 的 strict 默认 `false`，见 `:238`）。
用户的口径（「有就留在那里不用就好了」）本身就是对的，**直接删即可**，无需兼容键。

**7. 同一版本内的两处修正（用户复核后追加）。**

**7.1 兜底主题的截断口径要对齐 dsh 原生。** 原实现只按字节截（`maxBytes` 减日期前缀），
没有词数上限 —— 英文长句会一路铺到 73 个字符才断。用户追问「原生 dsh 自带的那个第一次命名
的逻辑是什么」，查证后确认原生是：

```js
// @deepseek-ai/dsh-session-title/lib/index.js:62
function fallbackSessionTitle(input, maxWords, maxBytes) {
  return truncateTitleUtf8(
    cleanTitleText(input).split(" ").filter(Boolean).slice(0, maxWords).join(" "),
    maxBytes,
  ).trimEnd();
}
```

即**前 `maxWords` 个空格分隔的词 + 字节上限**。该函数**从包根导出**（`lib/index.js:647`），
所以直接复用：`buildFallbackTitle` 现在走
`fallbackSessionTitle(source, FALLBACK_MAX_WORDS, format.maxBytes)`。
`FALLBACK_MAX_WORDS = 8` —— 原生那个值来自 service 的私有配置（`fallbackMaxWords`，由 dsh-base
给值），插件读不到，取与官方 README 示例一致的 8；用户明确表示**不需要做成配置项**。
顺带把控制字符清理换成了官方的 `cleanTitleText`。

> 一个原生就有的特性：`split(' ')` 对中文是退化的 —— 中文没有空格，整句算「一个词」，
> 所以**词数上限对中文不起作用**，中文只受字节约束。这是原生行为，不是我们的偏差。

**7.2 类型的语言由「语言环境」决定，不是对话语言。** 用户原话：「不是英文会话，是用户选的
什么样的语言环境，就是语言环境决定了分类是中文还是英文，如果语言环境是中文，即便对话是英文，
那分类也应该是中文，反之亦然。」

原实现让类型跟随消息语言，是错的。难点在于 **host 侧没有 locale 服务**（已核实
`dsh-commands` / `dsh-settings` / `dsh-session-title` / `dsh-llm` 全都没有）。解法是读设置文档：
locale 插件把偏好存在 `locale` 命名空间的 `preference` 字段里
（`dsh-client-locale/lib/types/locale-settings.d.ts`），而 `ctx.settings.get(ns)` 是公开读取面
（`dsh-settings/lib/types/index.d.ts`「Read one registered namespace's resolved value」）。
于是 `getUiLocale()` 走 `ctx.settings.get('locale')`。

- 解析顺序：`语言环境 → 对话语言`。后者只在**用户从没显式选过语言**时生效（那时真实语言由
  浏览器推导，host 看不到），用新增的 `detectMessageLang()` 取最近 3 条消息、按汉字与拉丁字母
  的个数判断。
- **主题跟随对话语言**（用户让我给建议，采纳的是这一条）：主题是对内容的凝练，跟内容语言走才
  不失真；类型是给人扫的分类标签，跟界面语言走。结果形态是 `0915｜排查｜Login 401`。
- 语言环境换过时，`SessionState.lang` 与本次不一致就清掉 `summary`（它里面那个类型是旧语言的，
  继续喂给模型会把新语言带偏）；`mainLine` 是句子、跟对话语言走，保留。
- 读不到语言环境**一律不报错**（`try/catch` + 返回 `undefined`）—— 读设置这件事不该拖垮标题生成。

**8. 对外文档改中英双语（用户确认）。**

用户问：「readme 是不是也应该改成中英文双语？还是就是英文，中文需要点一下看？」，按 dsh 生态的
统一惯例选了后者。核对过两个平台包的写法（`dsh-session-title`、`dsh-client-ui-settings-plugins`），
它们都是：

| 文件 | 开头一行 |
| --- | --- |
| `README.md`（英文，默认） | `English \| [中文](README.zh.md)` |
| `README.zh.md`（中文） | `[English](README.md) \| 中文` |

**为什么默认英文**：npm 与 GitHub **都只默认渲染 `README.md`**，所以国际读者零成本、中文读者
一次点击就能切；单文件双语（英文在上、中文在下）会让目录要备两套、篇幅翻倍，而且市场抽内容时
容易抽错语言；只留英文又不合适 —— 项目历史、本文件、现有中文用户群全在中文这侧。

两处**刻意没做**：

- **不加 YAML front-matter**（平台那几个 README 开头的 `description:` / `kind:`）：那是它内部的
  文档分类，我们不是平台包；市场描述来自 awesome 条目的 `zh`/`en` 字段，截图来自
  `screenshots.json`，都用不上它。
- **不做 `README.i18n.yaml`**：平台那份记录两侧的 git blob 哈希，供它自己 monorepo 里的
  `verify-translation-pairing` 用，第三方跑不了。改为在两个 README 里各写一句「改一份必须同时改
  另一份」——README 体量小、改动不频繁，手工同步够用。

顺带四处：

1. **英文 README 不是逐字直译，是按最新行为重写**：rules 模式已不存在、类型跟界面语言、
   主题跟对话语言、兜底是「前 8 个词」、界面中英双语。直译会留下已删除功能的描述。
2. `package.json` 的 `description` 由中文改为**英文**（npm 页面是国际面），中文描述留给市场条目的
   `zh` 字段。这与 v0.5.18 记的「同一口径用在三处」不同了 —— 是刻意改的：三处现在各按自己的读者面说话。
3. `package.json` 的 `files` 补上 `README.zh.md`（npm 的 always-include 规则是否覆盖
   `README.zh.md` 并不明确，显式列出最稳）。
4. **截图继续用中文那 6 张**（用户决定）：界面本身中英自适应，英文 README 复用同一套图；
   英文界面截图要在真实 dsh 里跑一次才能补，留给以后。`DEVELOPMENT.md` 则**保持中文** ——
   维护者日志，逐版翻译是纯开销，平台也没对外暴露它的中文版。

**验证**：`npm run typecheck` 通过；`npm run build` 重建 `lib/`；
产物核对 —— `lib/client.js` **不含** `dsh-client-locale` 的 require（type-only 引入已被抹掉，
不进浏览器模块表），`lib/index.mjs` 已无 `mode` 的 union schema 且含新英文文案；
两份 README 的章节与措辞逐节对齐。

**待实机验证（本项目没有自动化测试，只能装到 dsh 上跑）**：见文末「待办事项」。

### v0.7.1

**换一版对外说明：README 精简 + 隐藏会话截图入库**（用户原话：「写的太复杂了，没有人有耐心看」）。
只动文档与仓库内图片，**代码未变**（`lib/` 无需重建）。

**第一轮**（用户首条反馈）：

- **三张隐藏会话截图入库** `docs/images/`，都放在「隐藏会话 → 怎么用」一段里：
  `hidden-hide-row.png`（会话行的划线眼，提示「隐藏此会话」）、
  `hidden-toggle-all.png`（「工作区」行放大镜左边那只眼睛，提示「收起被隐藏的会话」；
  同时能看到被隐藏的行是淡色的）、`hidden-unhide-row.png`（淡化行上的眼睛，提示「取消隐藏」）。
  三张图顺序按实际操作顺序排，正好讲完「藏 → 看回来 → 单独恢复」。
- **`screenshots.json` 同步**（3 → 6 条）：市场优先读它，不补就等于新图只在 README 里可见。
- **README 全文收口**：同一批事实换更短的写法 —— 删掉重复行（「锁定与手动改名」原先在
  「功能一览」里出现了两次）、大段 `>` 引用压成一句或并成表格、把「为什么这么实现」的推导
  （成本模型的 ①–⑤ 清单、隐藏会话为什么只能在 DOM 层做、crumb 宽度的像素核算）从正文拿掉，
  只保留结论与排查步骤，末尾统一指向本文件。

**第二轮**（用户看完第一轮后的四条意见，都是"删"）：

1. **安装只留一句**。「关于版本锁定」「与内置 LLM 标题插件互斥」「包名沿革 / 只有 npm 通道 /
   不支持 `github:` 直装」**整块删掉**，正文只剩一条添加命令 + 一句
   「每个稳定正式版都发布到 npm，装完就能用」。版本锁定那段知识仍然有效，但它挡在了
   用户读到功能之前 —— 需要它的人去 npm 页面看即可。
2. **删掉「分类规则」整节**（11 类关键词表）。**`rules` 模式保留在代码里，但不再对外介绍** ——
   用户原话：「就只提用大模型命名的那个功能……作为一个内置保留，但不用在页面上介绍它，
   没有太大意义」。连带删掉「功能一览」里的「零 token 开关」一行，以及 `cordis.patch.yml`
   配置表里的 `mode` 行（只留「用模型总结标题」这个界面开关）。
   > 这与 v0.5.18 记的「一句话简介不提、README 里仍保留说明」是**不同的口径**：
   > 那次保留的理由是"文档讲清楚比藏着好"，这次用户判断**为它花的篇幅不值**。
   > 代码、行为、配置键一字未动，只是不再宣传。
3. **删掉「已知限制」整节**。用户原话：「能解决，其实我们都解决了，不用写到 README 里给所有
   用户看」—— fork 子会话不命名、摘要有损、`maxBytes` 二次截断、隐藏计数偏大、图标栏降级、
   搜索行同样淡化、隐藏列表不清理等，都属于"用户读完也做不了什么"的条目。
   **事实没有丢**：本文件 v0.7.0 / v0.2.x 各条里有完整记录，README 只保留**能动手做的**内容
   （怎么排查、怎么一键恢复）。
4. **重排为「功能一 / 功能二」**，隐藏会话从原来的中段小节目升为**并列的核心功能**。
   顶部去掉「功能一览」大表，改成两句 bullet 直接点明两大功能。
   顺带按用户口径改写了隐藏会话的起因：归档**不是"找不回来"而是"找回来很麻烦"**，
   真正的痛点是「有些会话长期不用，但不想删，留在侧边栏又碍事」—— 藏起来只留最近要用的几个。
   新增「## 出问题时」一节收拢启动失败自救（原挂在「分类规则」下面，那节删了就无处可依）。

最终篇幅：498 行 / 13573 字符 → 212 行 / 5266 字符（**还多含 3 张图**，正文减掉六成）。
`package.json` 版本随之升到 **0.7.1**（文档改版也发一版，让市场页与 npm 页同步拿到新 README）。

### v0.7.0

**新功能：隐藏会话。** 用户痛点原话：「dsh 的对话只有归档，归档就找不到了，而且就有点像
放入垃圾箱的感觉。但对话多了管理又很麻烦。」—— 插件自己维护一份隐藏列表，被隐藏的会话
默认不在侧边栏显示，随时一键显示回来。

**先查清了平台能不能做，结论是「不能，只能在 DOM 层做」**（这一步决定了整个方案）：

- `sidebar.workspaces` 是 **single** 槽位且已被 ui-workspace 的 `WorkspaceBrowser` 占用
  —— 注册即整体替换，会话列表会消失；`sectionHeader` 内部也没有任何 slot 洞。
- 会话行与工作区行的三点菜单项都是组件内写死的数组（`sessionMenuItems` /
  `workspaceMenuItems`），`Menu` 只渲染 `items` prop，没有 children / slot / render-prop。
  连 `anchor` / `footer` 都只是「插入自己的 ReactNode」，**无法按会话过滤既有项**。
- 行元素上**没有** `data-session-id` 之类的属性（只有 `class` / `role="treeitem"` /
  `aria-selected`），会话 id 只能沿 React fiber 上溯取 `memoizedProps`。

**为什么不复用平台的「归档」**：归档是 host 权威且**单向**的 —— `ctx.workspaceRegistry`
只有 `archiveSession()`，客户端 `IWorkspaces` 也没有任何 unarchive；`ui-workspace` 的
已知限制里明写 *No Session deletion or unarchive control*。而且归档是**全局**的
（所有浏览器、所有设备一致），用户要的是"我自己的列表 + 一个开关"。所以这条只作为对比
写进 README，没有实现。

**实现（四个新文件 + 三处改动）**：

| 文件 | 作用 |
| --- | --- |
| `src/client/hidden/config.ts` | 隐藏列表的唯一真源：绑 `settingsScope` 读写同一份设置文档；**本地乐观值**广播（点一下立刻生效，不等 host 往返）；300ms 去抖 + **整体覆盖写**（读-改-写在连点下会丢写） |
| `src/client/hidden/dom.ts` | fiber 反查 id、幂等注入眼睛（`data-stp-eye`）、样式注入、只观察侧边栏区域的 `MutationObserver`（250ms 轮询重新发现区域）、rAF 帧合并、fail-safe |
| `src/client/hidden/sidebar.ts` | decorate 主流程：会话行 / 搜索结果行的藏与淡化、两处眼睛的注入与状态 |
| `src/client/hidden/icons.ts` | 两个内联 SVG（眼睛 / 划线眼）。用官方 `IconXxx16` 不行 —— 那是 React 组件，原生注入的节点里渲染不了 |

- `src/host/index.ts`：`Config` 增加 `hiddenSessions` / `revealHiddenAll` 两个字段
- `src/client/settings-card.tsx`：`PluginConfig` 同步这两个字段；正文加**自救块**
  （已隐藏 N 条 + 立即生效的「全部取消隐藏」），刻意**不进 `FIELDS`** —— 它不该参与
  「自定义 / 未保存 / 保存」那套草稿机制
- `src/client/index.tsx`：`injectStyle` / `removeStyle` / `LOG` 迁到 `hidden/dom.ts`
  与 `log.ts` 复用；`apply` 里挂上 `installHiddenSessions`

**顺手修掉一个真 bug（host 侧）**：`installSection` 的 `onChange` 原本无条件
`states.clear()`（清空标题滚动摘要）。隐藏 / 显示会频繁改同一份设置文档，照旧写法
**每点一次眼睛就会把模型逐轮积累的摘要与主线清掉**，标题被重新归纳一遍。
现在按 `titleStateSignature()` 比对，只有 `mode` / `provider` / `model` / `retitleEvery` /
`timeoutMs` / `maxOutputTokens` / `maxInputBytes` 真的变了才清。

**几处刻意的取舍**：

1. **眼睛注入到上游已有的 `_rowActions` 里**（那个容器本来就 hover 才 `inline-flex`），
   可见性交给上游 CSS 管，我们不必自己写 hover 规则；用 `style.order = -1` 排在「…」左边，
   而不是 `insertBefore` —— 不必跟 React 抢 DOM 位置。
2. **只写行内 `style`，绝不加 class**：React 每次渲染都会整体重写 `className`，加上的
   类名会被抹掉；而这些行没有 `style` prop，行内样式 React 不会碰。
3. **当前会话先不藏**（用户要求）：点隐藏后它仍在侧边栏，切走之后自然消失。
   实机反馈补了一条：它**也要淡化**（第一版写成了原样显示）。它只是「暂时没被藏起来」，
   身分仍是已隐藏 —— 表现就该和开关打开时看到的隐藏项完全一致，否则用户点完隐藏
   在侧边栏上看不出任何变化，会以为没生效。
4. **fail-safe**：一趟 decorate 里「有行、却一条 id 都解析不出来」= 行识别整体失效 →
   本趟**什么都不改**（连眼睛都不注入，免得留一排点了没反应的死按钮），只 warn 一次。
5. **区域标题行的总开关**：插到放大镜左边，并把 `_searchSlot` 自带的
   `margin-left:auto` 归零、让给我们 —— 两个 auto 外边距会平分剩余空间，眼睛会被挤到中间。
   折叠成图标栏时上游不渲染 `_searchSlot`，降级为挂在「+」旁边。

**已知代价**（都写进 README 了）：依赖上游类名后缀与 fiber 结构，上游改版即静默失效；
分组标题的会话计数按未过滤数据算，会偏大；隐藏列表不做清理（归档或消失的会话 id 仍留着）。

**实机反馈后的第一轮修正（同一版本内，尚未发 npm）**，三条都在用户那边一眼看出来的：

1. **图标是个空底板**（点一下才长出眼睛，再点变划线眼）—— 这是个真 bug：
   `createEye()` 里预设了 `dataset.stpOn = '0'`，而 `setEyeState()` 正是拿这个值与目标
   比对**来决定要不要重画图标**，于是第一次调用认为「已经是关态、图标早画好了」而整个
   跳过 —— 按钮就一直空着。改法：不预设该属性，让第一次 `setEyeState` 必定落笔。
   教训与项目里其他几次一样：**「值一样就不写 DOM」这种优化，遇到「初始态其实没写」时
   就会把首次渲染吞掉**。
2. **去掉「按工作区分别覆盖」那一层**（用户原话：不好用，做一个统一的开关就可以了）。
   连带把 `revealHiddenWorkspaces` 配置项、`revealOf()`、`toggleWorkspace()`、
   文件夹行的眼睛、以及整条**工作区归属索引**（`buildWorkspaceIndex` + `ctx.workspaces`
   注入 + `@deepseek-ai/dsh-api-workspace-controller` 依赖）一起删掉 ——
   `SessionSummary` 里没有 workspaceId，那个索引存在的唯一理由就是按工作区覆盖。
   现在只剩 `hiddenSessions` + `revealHiddenAll` 两个字段。
3. **补上悬停说明**。原生 `title` 要等约一秒才出来，等于没有；而跟着按钮放的 CSS 气泡
   会被侧边栏的 `overflow:hidden`（`regionArea` / `sectionHeader`）裁掉。做法是自己画一个
   `position:fixed` 的气泡挂在 `document.body` 上，用全局委托的 `pointerover` / `pointerout`
   驱动（按钮是动态注入、被挤掉后还会重造的，逐个绑定迟早漏一个），token 照抄官方
   `Tooltip.module.css`。文案只留最短的动作描述（用户反馈：括号里那些补充「太啰嗦」）：
   会话行是「隐藏此会话」/「取消隐藏」，总开关是「显示被隐藏的会话」/「收起被隐藏的会话」。

**再加一个总开关**（用户要求）：设置卡片里新增「启用隐藏会话」，**默认打开**。
关掉后左侧整套功能不执行，但**已设过的隐藏列表与显示开关原样保留**（用户原话：
「如果用户什么时候又打开了，它那些设置还在，就是该隐藏的还有」）。

- 配置面：`hiddenEnabled`（boolean，默认 `true`）—— 注意默认值是 **true**，与
  `revealHiddenAll` 的 false 方向相反，schema 与客户端 `FALLBACK_DEFAULTS` 两处都要对齐。
- 客户端在 decorate 的**最前面**判断：关掉就调 `clearDecorations()` 并返回。
  这个函数原来叫 `teardown()`（只在插件卸载时跑），现在兼职「把关掉之后残余的痕迹
  撤干净」—— 否则关掉开关界面还停在上一个状态。它是幂等的：没有痕迹时是一趟空查询。
- 开关行的骨架抽成了 `renderToggleRow()`：卡片里有两种开关 —— `FIELDS` 里的字段
  （暂存 + 保存）与立即生效的那一个，外观必须一致。`FIELDS` 那一支原先写死了
  `'llm' / 'rules'`（服务 `mode` 字段），现在由 `FieldDesc.toggle` 声明端点。
- **这一项不进 `FIELDS`、一点即生效**（第一版按普通字段做成了"改完要保存"，用户否掉了）：
  它是"要不要用这个功能"的总闸，改了就该立刻看到界面变化，再点一次「保存」没有意义。
  同理它也不该有「未保存」状态 —— 状态就在开关本身。写的是
  `scope.set('hiddenEnabled', next)`：布尔值一律**显式写**而不是 `unset`，否则组合层
  把默认值配成 false 时，「启用」会落回 false，看起来像没生效。
- **关掉时「隐藏的会话」自救块整块不渲染**（用户要求）：功能都不执行了，显示"隐藏了
  多少条"、给一个"全部取消隐藏"按钮都没有意义。

**发布通道收敛为「只有 npm」**（用户决定，与 v0.6.6 的「npm 正式 / github 测试」不同）：

- README 里「也可以从 GitHub 直装」**整节删除**，连同「GitHub 直装更新失败怎么办（先查网络）」
  一整节、以及「关于版本锁定」表里的 GitHub 一栏。以后再发版一律发 npm。
- **顺带修掉两处因此失效的旧建议**：「客户端与 dsh 不兼容请用 v0.3.2」与
  「回退到纯命令版 v0.2.0」—— 这两个版本**从未发布到 npm**，而 npm 上最早的 0.6.6
  已经带浏览器端代码，所以现在只剩「升级 dsh」或「先停用本插件」两条路。
- DEVELOPMENT.md 里 v0.5.x / v0.6.6 那些关于 `github:` 安装的记录**刻意保留** ——
  它们是当时的事实记录，删掉反而看不懂历史。

### v0.6.6

**包名去掉 scope：`@cq-guojia/dsh-session-title-pattern` → `dsh-session-title-pattern`**（为发 npm 做准备）。

原 scope 在 npm 上不属于本账号（npm 用户名是 `guojia`，不是 `cq-guojia`），直接用会因无权限失败。
三条路（建 org / 换成用户 scope `@guojia` / 去掉 scope）里选了**去掉 scope**：名字更干净，
而且避开一个坑 —— **scoped 包在 npm 上默认按「私有包」发布**，不显式声明
`publishConfig.access=public` 会直接报 `You must sign up for private packages`；
无 scope 的包默认就是公开，没有这条规则，也就少一处配置。

改动落在 6 处（必须全部同步，漏一处就装不上或产物对不上）：

| 位置 | 作用 |
| --- | --- |
| `package.json` 的 `name` | 包的身份 |
| `cordis.patch.yml` 的 `name:` | **必须跟着改**，否则 dsh 解析不到这个包 |
| `tsdown.client.config.ts` 的 `PACKAGE_NAME` | 客户端产物的模块 id 由它生成 |
| `lib/client.js` 等产物 | 重建后 `id:` 已是新名（`lib/` 是提交进仓库的产物） |
| `package-lock.json` 的 `name` ×2 | 顺手把 root `version` 从 0.3.2 同步到当前版本 |
| README 的 `allowBuilds` 示例键 | 去掉「`@` 开头的键要加引号」那半句 |

**发布路线调整：npm 成为正式渠道，`github:` 直装退为测试通道。**

| 通道 | 用途 | 版本 |
| --- | --- | --- |
| `github:cq-guojia/dsh-session-title-pattern` | **开发时测试**：推上去就能装，改完即验 | 跟踪 `main` |
| `dsh-session-title-pattern`（npm） | **对外发布** | 发版号 |

> `github:` 认的是**仓库路径**而不是包名，所以改名之后这条命令照旧可用 ——
> 装进来的包名取自仓库里 `package.json` 的 `name`。副作用是 profile 里那条依赖记录的
> **键**会变（旧 scope 的那份需要先卸掉），否则会残留成两份。
>
> 为什么不直接发 `@guojia/...`：能用，但包名会跟用户名绑定；无 scope 的名字更中性，
> 将来换账号也不用改包名。

**顺带补上 `LICENSE`**（MIT，署名 `cq-guojia`）：`package.json` 一直声明着 MIT，
但仓库里从来没有这个文件 —— GitHub 与将来的 npm 页面都会显示「无许可证」。
npm 本就会**无条件打包** `LICENSE`（不受 `files` 白名单约束），这里仍然显式列进
`files`，免得看的人以为它会被漏掉。

**已发布：`dsh-session-title-pattern@0.6.6`（2026-09-14，首次发 npm）。**

发布这一段踩的坑值得记下来，都是绕不开的：

1. **npm 现在要求「发布包必须 2FA」**，而 2FA 只剩 **WebAuthn 安全密钥**一种 ——
   网页上的「认证器 App / TOTP」选项已经被拿掉了（`npm profile get` 会显示
   `two-factor auth: disabled`，而 403 报错就是 `Two-factor authentication or
   granular access token with bypass 2fa enabled is required to publish packages`）。
2. 本机没有指纹、手机（小米）没有 GMS（`使用手机` 那条路要 Google Play 服务），
   物理密钥又不愿意买 —— 最后走的是 **Bitwarden 浏览器扩展保存的通行密钥**：
   免费、存在保险库里、跨设备同步，两台 Mac 与手机都能用。
   前置条件只有一个：扩展 **Settings → Notifications → "Ask to save and use passkeys"** 要打开，
   注册时在浏览器弹窗里选 **Save passkey**（选成「使用设备或硬件密钥」会把该域名拉黑）。
3. CLI 发布时 `npm publish` 会报 `EOTP`，**必须先用 `npm login --auth-type=web`
   刷新一次凭据**，之后再 `npm publish` —— 它会拉起浏览器让你用通行密钥确认一下。

> 另一个一直存在的选项是 **Bypass 2FA 的 Granular Access Token**（`~/.npmrc` 里配
> `_authToken`，发布时不用按指纹）。本次没走它，因为 npm 登录时已明示
> `tokens that bypass 2FA are being restricted for account changes and direct publishing`。
> 但它仍是多机器/CI 场景的官方兜底。

### v0.6.5

**修「解除锁定」必失败**：

```
title-unlock 解锁失败：Error: session-title provider must identify at least one source message seq
```

解锁走的是「provider 原样返回当前标题」，而**用户改名产生的标题 `messageSeqs`
是空数组** —— 平台语义如此（手动命名不指认任何消息，`SessionTitleSnapshot` 的
注释明写 "empty for an explicit user rename"）。服务的 `validateResult` 要求
provider 至少指认一条 seq，空数组直接被拒。

也就是说：**凡是通过 rename 锁定的会话，解锁必然失败** —— v0.6.0 起就没成功过，
只是此前锁定态显示都是本地假象，没人走到这一步。

改法：`messageSeqs` 为空时改用本次 `request.messages` 的 seq。解锁只换来源
（user → provider），指认哪些消息不影响标题文字；一条都没有才照常生成。

### v0.6.4

**「host 明明执行了，客户端却拿不到返回值」—— 两个症状同一个根因。**

实机反馈：① 锁定态刷新仍回未锁定；② `/title-suggest` 成功了，但标题只出现在
下面的会话里，**没填进输入框**。第②条是决定性的证据 —— 命令确实跑了
（会话里出现了命令结果），可我们读到的返回值里没有文本。

**根因：远端返回值的形状我们认错了。** `runLine()` 一刀切地按
`execution.result` 取，认不出就 resolve undefined。而消费 `TYPERT_REMOTE` 的
运行时在 dsh 里、不在 node_modules —— 描述符声明的是 `CommandExecution`
（`{ commandId, result }`），但实际到手的是哪一层封装**本地无法验证**。
之前的 v0.6.2 那条「未被执行：行必须以 / 开头，且命令名必须已注册」也因此是
**误报**：host 其实执行了，只是我们没剥开返回值。

**改法：不再猜，按可能的封装逐层剥，认出 `kind` 就算成功** ——
`{ commandId, result }`、`{ kind, text }`、`{ ok, value }` / `{ value }` 三层都试；
认不出就把**原始返回 JSON** 打进控制台，下次一次就能看清真相。
`checkCommands()` 同样按「裸数组 / 包一层 value」两种都收。

顺带两处：
- 文案不再断言「未被执行」（可能只是没认出返回值），改成「未取到执行结果 + 原始返回」
- `.catch()` 原来静默吞掉，现在也打一条

> 这条也是本项目的通用教训：**远端命名空间的实际返回形状本地验证不了**
> （`LlmDirectory` 那个 `{ ok, value }` 同样是按猜写的，而 dsh-llm 描述符里
> `listProviders` 的结果其实是裸数组）。凡是靠远端返回值驱动界面的地方，都要
> 么容错、要么把原始结构打出来。

### v0.6.3

三件事，都出在重命名卡片上。

**1. 修「自动生成」必报「没有可用的模型路由」。**

`title-suggest` 为了「只出草稿不写标题」是**自己拼 request** 的，而
`request.route`（当前主请求路由）从来是**服务**替 provider 填的 —— 它读的是
`session.requestHeader()?.config`。草稿这条旁路没人填，于是 `resolveRoute()`
既找不到配置里的 provider/model 对（默认留空 = 跟随对话模型），也找不到
`request.route`，只能抛错。`/retitle` 走服务，所以一直是好的 —— 同一份代码里
只有「自动生成」坏了，很符合这个归因。

改法：新增 `draftRoute()`，按服务同款从 `session.requestHeader()` 取
`{ provider, model }` 塞进 request；仍然取不到（会话还没发过主请求）就**退回
关键词规则出草稿**并 warn —— 草稿只是个可编辑的起点，不值得为它报一个错误。

**2. 锁定态刷新后回到未锁定（v0.6.0 那条"已知妥协"的彻底解法）。**

`title` 投影的 wire 类型是 `string | null`，**只带文本不带来源**；而「锁没锁」
= `session/title` 事件里 `source.kind === 'user'`，这个字段根本没推给浏览器 ——
所以开关全是本地 state，刷新即丢，而 host 端其实一直是锁着的。

改法：新增 `/title-state`（`recordInput: false`，不调模型）回答
`locked` / `unlocked`，面板**每次打开时问一次**作为初始值。v0.6.0 记的
「彻底解法要插件自供查询」就是它，走的是与其余面板命令相同的命令通道。

**3. 「点了没反应」的自检。**

`execute()` 对「命令没注册」只回一个 undefined 且不留痕（admission miss），
排查全靠猜。现在面板打开时会 `commands.list(sessionId)` 一次，把**缺哪几条**
直接打进控制台（v0.6.2 修斜杠时就是靠这条才定位的）。

### v0.6.2

**修重命名卡片四个按钮全部失灵**（用户反馈：点「自动生成」没反应；改了名字点
「确定保存」标题不变，只有锁定开关亮了）。

**根因：命令行少了前导斜杠。** 卡片发给 host 的是 `title-rename xxx`、
`title-suggest`，而 `CommandRuntime.execute()` 用 `parseCommand()` 解析，正则是
`^\/([a-z][a-z0-9_-]*)`：不以 `/` 开头就直接返回 undefined，且注释明写
"Admission misses (syntax or unknown name) log nothing" —— **连日志都不留**。
v0.2.1 那个直达按钮发的是 `'/retitle'`（带斜杠，一直好用），v0.6.0 重构成卡片时
新写的四条全漏了。

对上症状：`runLine()` 拿到 undefined 就静默 resolve，`suggest()` 没文本 → 输入框
不动；`rename()` 没写标题 → 标题不变，而 `save()` 里紧跟的 `setLocked(true)` 是
本地 state、照常执行 —— 所以开关显示「已锁定」，而那个状态刷新页面就消失。

**改动（两处，都在客户端）**：
1. 四条命令行常量补 `/` 前缀（`RENAME_LINE` / `LOCK_LINE` / `UNLOCK_LINE` /
   `SUGGEST_LINE`），并加注释说明为什么必须有它
2. `runLine()` 的 `result === undefined` 分支补一条 `console.warn` —— 这条静默
   路径正是"点了没反应又查不到原因"的元凶

host 端未动：handler 里访问 `ctx.sessionTitle` 的写法与实机验证过的 `/retitle`
同款。

### v0.6.1

重命名卡片的定位修正：原来是 `right:0`（右缘贴铅笔、向左铺开），左半截会伸过标题、
压进侧边栏底下（实机截图确认）。改为打开时**实测标题元素（`_crumbCurrent`，与
crumbWidth 覆盖同一识别方式）与锚点的横向差值**，把卡片左缘对齐会话标题左缘；
标题元素找不到时退回 0（贴锚点），并加 `maxWidth: calc(100vw - 48px)` 兜窄窗口。

### v0.6.0

重命名卡片（用户嫌旧面板「做得太烂」，给了官方重命名对话框的截图作参照）。

**布局**：铅笔按钮点开一张 420px 的「重命名会话」卡片 —— 标题行（重命名会话 + ×）、
预填当前标题的输入框、底部一行：左下角「锁定」开关（Tooltip 讲清两边行为），
右下角三个按钮：取消 / 自动生成 / 确定保存。Esc / 点外部 / × / 取消都是关闭不动任何值。

**三个行为，全部按用户的需求定义**：

1. **预填**：当前标题走平台的 `title` 投影（`useProjection('title')`，实时推送）。
2. **自动生成 = 只出草稿**：新命令 `title-suggest` —— 从会话事件提取人类消息
   （与服务内部 `sessionTitleUserMessageOf` 判定逐条对齐），LLM 模式下真调一次模型
   （滚动状态传**浅拷贝**，绝不碰真身的 summary/seenCount/mainLine），rules 模式或
   llm 未就绪退到关键词规则；结果文本随 `CommandResult` 带回浏览器，**只填进输入框、
   不写标题** —— 保存与否由用户决定。在途时按钮显示「生成中…」防连点。
3. **解锁 = 单纯解锁，不重新生成**：新命令 `title-unlock` —— 平台解锁的唯一切入点是
   `refresh()`（会驱动一次 provider 调用），所以解锁命令先在 provider 的
   `pendingUnlocks` 里挂号，随后的 `generate()` 看到挂号就**原样返回当前标题**：
   文字一个字不变、不调模型，只是来源从「用户」变回「provider」，自动更新恢复。
   若 refresh 在调 generate 前失败，挂号留到下次重算生效（延迟解锁，无害）。

**「确定保存」= rename = 写入即锁定**（平台唯一的手动写入语义），开关随之显示锁定。
命令结果回传：`commands.execute()` 的 resolve 值带 `result.text`，`runLine` 改为
把成功文本 resolve 给调用方（`/retitle` 的直发按钮被卡片取代，host 命令保留）。

**已知妥协（记下来）**：锁定态的**初始显示**只有本地记忆 —— 平台的标题投影只有文本
不带来源，客户端读不到「当前是否锁定」；刷新页面后开关按未锁定显示，面板内操作过后
就是准的。彻底解法要插件自供 remote 查询（credentials 的提供方式），留待以后。

### v0.5.24

**v0.5.23 会让 dsh 起不来，本次修复。** 用户实机确认：禁用本插件 dsh 正常、启用后连
界面都进不了。容器日志抓到根因：

```
Error: dsh: plugin tree failed to load: failed to apply loader entry session-title-pattern:
  cannot get property "commands" without inject
    at registerTitleEditCommands
```

根因：v0.5.23 新加的 `registerTitleEditCommands(ctx, …)` 在 **apply 里拿原始 ctx 直接访问
`ctx.commands`**。cordis 的 Context 是受保护代理，未声明的服务属性一访问就同步抛错，
apply 一抛 → 插件 fiber 失败 → **整个 dsh 启动失败** → 容器反复重启。

讽刺的是我们自己的注释里早就写了这条禁忌（「也不能直接写 ctx.llm —— 受保护代理」），
`/retitle` 也一直用正确写法（在 `ctx.inject(['commands'], (commandCtx) => …)` 里注册），
新代码偏偏没照抄。

**修复**：把 `registerTitleEditCommands` 挪进与 `/retitle` 同一条
`ctx.inject(['commands'], …)` 里，用 inject 给回的 commandCtx 注册。
并全文扫描了其余 `ctx.*` 服务访问点：handler/事件回调里访问 `sessionTitle`、
inject 内访问 `commands` 都是有实跑记录的安全模式。

> 教训：本项目里每新增一个「ctx.服务」访问点，都必须落在某条 `ctx.inject([…], …)`
> 的作用域内，或至少与一个已在实机跑通过的写法逐字对齐。仅靠类型检查查不出这类错误。

### v0.5.23

四件一起落地：**标题面板（锁定 / 改名）**、**主线改写高门槛**、**等距采样**、**重启恢复**。

**1. 标题旁的铅笔按钮 → 小面板**（自动生成 / 锁定 / 手动改名）。

- 全部基于平台现成能力：`SessionTitleService.rename()` 写入的标题来源是「用户」，
  **写入即自动锁定**（自动命名停止）——所以「锁定不改字」就是把当前标题原样写回，
  「手动改完自动锁定」是平台内置行为；解锁 = `/retitle`（refresh 覆盖已固定的用户标题）
- 宿主端新增两条命令：`/title-lock`（锁定当前标题）、`/title-rename <文本>`
  （`normalizeSessionTitle` 截到 maxBytes，rename 不会因长度抛错；处理器返回
  `CommandResult`，成败都有可见回执）
- 客户端面板：铅笔按钮点开一个自绘浮层（内联样式，不依赖额外 CSS 注入），含
  「根据对话重新生成 / 锁定当前标题 / 手动改标题」三项；点外部收起
- 覆盖系统重命名弹窗**做不到**（封闭组件、无 slot），但系统入口改名走同一个
  `rename()`，行为一致、自动锁定 ✓

**2. 主线改写高门槛（提示词）**。用户场景：开发插件 → bug 修了一两百轮 → 主线被
最近的 debug 内容带偏。提示词明确：mainLine 是会话**最初的最大目标**，解决主线过程中的
报错 / bug / 调试都是主线的**子任务**，不属于目标变化；只有出现并列的新目标才改。

**3. 等距采样（B 方案）**。`buildPromptInput` 从「新鲜窗口之前」的历史里等距抽 2 条
（每条截 200 字节）放进 `sampledHistory`，让模型看到会话怎么演化 —— 长会话归纳与
重启恢复（seenCount 归零、历史全部落在新鲜窗口之外）时尤其重要。

**4. 重启恢复主线。** `mainLine`/`summary` 原来只在内存，dsh 重启即失，下一次重算
只能从「首条 + 最近几轮」猜 —— 主线在会话中段的场景必然漂。

- 恢复路径：`generate()` 里发现内存态为空时，用现成的
  `foldSessionTitle(session.snapshotEvents())` 取**上一次的标题**，剥掉日期段还原出
  `类型|主题`（作摘要）与主题（兼任主线）—— 近似恢复，足够把方向锚住
- 为什么不用自定义事件持久化：`SessionEventType` 是封闭联合，第三方插件追加自定义
  事件类型需要验证运行时是否接受（本轮未验证），而标题恢复零风险、零成本，先落地
- 每个进程生命周期只恢复一次（`restored` 标记），之后照常滚动

README 同步（功能一览、面板说明、输入结构）。

### v0.5.22

**修解析器被模型「将了一军」**。实机出现 `0913｜其他｜类型：编程` —— 主题变成了字面的
「类型：编程」。

**根因**：v0.5.20 把提示词改成两行输出后，**模型经常照抄提示词的措辞**，把行写成
`主线：xxx` / `类型：编程` / `主题：xxx`（带标签），而不是裸的 `主线内容` + `类型|主题`。
老解析器死认行序（第二行必须是 `类型|主题`），遇到没有竖线的 `类型：编程` 就认不出类型，
整行落进主题、类型回退到规则的「其他」。时好时坏 —— 模型加不加标签是随机的。

**两层修复：**

1. **提示词给出输出示例**（假设主线/类型/主题，明确写出那两行长什么样）——
   照抄示例比照抄说明可靠得多，从源头减少带标签的输出。
2. **解析器按行首标签归类**，不再死认行序：
   - `主线：` / `类型：` / `主题：` 开头的行各自归位（中英冒号都认）
   - 类型与主题挤在一行（`类型：编程｜主题：配置损坏`）也能拆开
   - 行首的编号 / 项目符号（`1.`、`-`）先剥掉
   - 只吐了一行主线时，把主线当主题用（总比把「主线：」留在标题里强）
   - 完全认不出标签才退回老约定（两行 = 主线 + 标题行；一行 = 标题行）

六种形态验证（与代码同款逻辑）：事故原始形态、三行带标签、两段挤一行、理想两行、
理想一行、带编号 —— 全部解析正确。

### v0.5.21

**手动重算不再清空主线。** 起因是用户问「手动重算传什么、主线怎么找回来」，一算就暴露了：

- 手动重算的输入 = 首条消息（200 字节）+ 最「新」的一批（`maxInputBytes` 4096 字节内，
  **从旧往新丢**）—— 8MB 的会话也只会发这么多，一次约 1200~1600 token，成本无忧 ✓
- 但主线也被清空了 → 模型手里只剩「首条 + 最近一批」。**主线出现在会话中段时
  （最常见的那种情形）它再也找不回来** —— 而 v0.5.20 好不容易让主线逐轮延续了下来，
  等于自己拆自己的锚

改为：手动重算**保留主线**，只清摘要与计数。

- 成本一模一样（主线就一行、几十字节）
- 「重新归纳」的能力没丢：提示词允许模型在会话目标真变了时更新主线
- 内存态语义不变：dsh 进程活着期间主线一直延续、每轮重算被重新确认；
  进程重启后归零，下一次重算重新归纳

### v0.5.20

两件事：**模型维护「主线」（C 方案）** 与 **「输出标题最大Token」退出界面**。

**1. 主线锚，解决标题漂移。** 用户实测：一条 8MB 的长会话，主线是「开发插件」，
标题却漂成了「排查｜安装失败、依赖冲突」。归因三条：

- **主线不在开头** —— 那条会话的第一条消息是问 dsh-context，不是开发插件；锚首条消息接不住
- **输入约 20:1 偏向最近** —— 首条 200 字节 vs 最近几轮 ~3600 字节，模型自然总结最近的事
- **摘要自我强化** —— 上一版输出「排查」后，下一轮就带着「排查」当历史

做法（C 方案）：

- `SessionState` / `RollState` 增加 `mainLine`：模型逐轮判断的主线，随摘要一起滚动传递
- 输入 JSON 增加 `mainLine` 字段；提示词改为**输出两行**：第一行主线（会话目标没变就
  **原样返回**，真变了才改），第二行 `类型|主题`（**主线优先**，不要被最近几轮的具体问题带偏）
- 解析新增 `parseTitleOutput()`：两行 → 更新主线并取标题行；只有一行 → 按老格式解析、
  **主线沿用上一次的**（不猜那一行是什么）；`toSummary` 改用标题行而不是整段输出
- 手动重算（`/retitle`）连主线一起清空，让模型重新归纳

成本：输出多 ~20–30 token，输入多 ~50 字节。

**2. 「输出标题最大Token」从界面拿掉，内部默认 512。**

用户想明白了自己要管什么：**标题长度上限**（拿到文字后我们自己截），而不是输出预算。
顺带纠正一个概念：`maxOutputTokens` 是**服务端硬切断**（到点就停，后面的内容根本没生成），
不是「模型不遵守就返回多少用多少」的软限制 —— 所以「超了就截断」救不回没生成出来的部分。

- FIELDS 里移除，配置键保留，要改走 `cordis.patch.yml`
- 默认 `128 → 512`：调大不花钱（上限不是预扣费），给任何模型把一行标题写完留足余量，
  同时仍是防跑飞的保险丝

README 同步（设置表、配置表、截图说明）。

> 备注：`maxInputBytes`（4096）**维持不变** ——「最近 10 轮」仍会占满它。先观察主线锚
> 能否止住漂移；不够再考虑放宽预算或加历史采样（B 方案：等距采 2–3 条历史消息）。

### v0.5.19

实机报错：`生成标题失败：Error: 标题模型未正常结束（max-tokens）`。

**根因**：输出预算被用光（默认 `maxOutputTokens = 64`）。**带推理（thinking）的模型，
思考同样计入 `maxTokens`** —— 64 很容易被思考吃掉，真正开始写标题时就被截断了。
免费档 / 推理型模型尤其容易触发。

而原来的处理**过严**：`finish.kind !== 'stop'` 就抛错，等于「标题永远不更新」，
用户只看到一句"生成标题失败"，很难联想到是输出预算不够。

**两处改动：**

1. **`max-tokens` 不再算失败**：模型写了超预算的废话、或预算花在推理上，都照用首行 ——
   我们本来就只取第一行，而**第一行通常是完整的**（提示词要求单行输出）。
   同时返回 `truncated`，调用方记一条 warn 说明「触达上限、已改用首行、建议调大或换不带推理的模型」。
   其余结束原因（error、被内容策略拦下等）仍然抛错，走「保留上一个标题」的降级。
2. **默认值 `64` → `128`**：给推理留出余量。客户端兜底值、说明文案、README 的配置表同步。

> 交互上还有个改进空间（本轮没做）：失败时界面只显示一行错误，用户看不到"为什么"。
> 现在这条 warn 会进日志，排查时能对上。

### v0.5.18

**按 dsh-market 的上架要求整备**（读的是 dshmarket 自己的 README + awesome-dsh-plugin 的
`contributing.md`）。

**上架路径（与 npm 无关）**：dsh-market 是市场应用本身，插件列表来自 curated 仓库
**awesome-dsh-plugin**。上架 = 往那个仓库提 PR，**新增一个文件**
`data/plugins/cq-guojia__dsh-session-title-pattern.yml`（**不要**改它的 README，那是脚本生成的）。
收录后 **GitHub 直装是一等公民**：条目里 `npm: null`、`install: dsh plugin --profile web add
github:owner/repo` —— **不发 npm 也能上架**。

**本轮改动：**

1. **修 peer 依赖范围（真问题）**：`@deepseek-ai/dsh-*` 原本写的是 `^0.1.5-rc.2`。
   官方 contributing 明确点出这是坑：**不带显式预发布分支的范围会静默排除 harness 的所有
   预发布构建** —— `^0.1.5-rc.2` 只覆盖 `0.1.5` 这一个 patch 的预发布，等 dsh 升到
   `0.1.6-rc.1` 就会把用户直接挡在 `ERESOLVE` 上。改成 `>=0.1.0-rc.0 <0.2.0-0`
   （覆盖 0.1.x 的全部正式版与预发布）。
2. **新增 `screenshots.json`**（仓库根，1–8 张仓库内图片路径）：市场优先读它，没有才去
   README 里抽。路径相对该文件、不能跳出插件目录。
3. **package.json 元数据补全**：`keywords`（含 `dsh-plugin`）、`repository`、`homepage`、
   `author`；`files` 加上 `screenshots.json`。
4. 清理工作区：删掉 27 个历史 `.tgz`（都在 `.gitignore` 里，本来就没进版本库）。

**待用户在做的事（我这边做不了）：**

- 给 GitHub 仓库加 **`dsh-plugin`** topic（上架 checklist 明确要求）
- **仓库满 1 天**后再提 PR（CI 硬门槛；首次提交 2026-09-12 19:15）
- 提 PR：新增 `data/plugins/cq-guojia__dsh-session-title-pattern.yml`

> **对外一句话描述定稿**（用户要求：**不提**零 token 的关键词规则模式 —— 那条路实际几乎用不上，
> 第一屏应该讲模型总结）：
>
> 「自动管理 dsh 会话标题，统一成「日期｜类型｜主题」的格式：类型与主题由模型对整段对话总结。」
>
> 同一口径用在三处：GitHub 仓库 About、`package.json` 的 `description`、market 条目的 `zh`/`en`。
> README 里**仍保留**规则模式的说明 —— 它是真实存在的配置项，文档讲清楚比藏着好；
> 不放进一句话简介只是取舍，不是隐瞒。

### v0.5.17

**为发布到插件市场重排 README**（只动文档与仓库内图片，代码未变）。

- **修掉开头的硬伤**：原首段还写着「用确定性规则把首条人类消息格式化……**不调用模型、
  零 token 开销、零网络依赖**」—— 那是最早规则版的描述，而默认早已是 LLM 模式。
  这是别人点进仓库看到的第一屏，必须改。
- 重写成市场向的结构：一句话定位（带真实标题示例）→ 侧边栏截图 →「它解决什么问题」→
  「功能一览」表 →「标题格式」→ 安装 → 配置（带设置面板截图）→ … → 手动重算（带按钮截图）
- 三张截图入库 `docs/images/`（`session-list.png` / `settings-card.png` / `retitle-button.png`），
  README 用相对路径引用，GitHub 与市场页都能显示
- 「功能一览」把真正会被问到的点摆在前面：成本恒定、零 token 开关、可单独指定模型、
  失败不伤标题（一律保留上一个标题）

### v0.5.16

两处**改名**，纯文案、行为不变：

| 位置 | 原名 | 现在 |
| --- | --- | --- |
| 每个字段右侧的标签 | 已覆盖 | **自定义** |
| 底部按钮 | 重置为默认值 →（v0.5.15）撤销改动 | **放弃修改** |

- 「已覆盖」是 override 的直译，属于技术词；「自定义」更直白，也准确表达「这一项的值和默认不一样」
- 底部按钮：**名字必须与行为一致**。它做的是「丢掉没保存的草稿、回到已保存的状态」，
  「放弃修改」说的正是这件事；「恢复默认」这个名字留给每个字段自己那个按钮
  （把该项清回 schema 默认值）

到这一版，三个动作各归其位、不再互相暗示错误的东西：

| 动作 | 位置 | 回到哪里 |
| --- | --- | --- |
| **放弃修改** | 底部 | 回到**你保存过的**值 |
| **恢复默认** | 每项右侧 | 回到**该项的 schema 默认值** |
| *（已去掉）* | ~~底部~~ | ~~把所有项清回默认~~ |

### v0.5.15

**底部的「重置为默认值」改成「撤销改动」。** 手动改值来回切已经正常了，但一点这个按钮
「未保存」就永远挂着。查清楚了：**这不是判定逻辑的问题，是按钮语义本身超出了预期**。

旧行为是把**所有**字段填回 schema 默认值，其中包括 `provider` 与 `model`。用户存过自定义的
供应商 + 具体模型，它们都不等于默认值，于是点一下这个按钮就等于「把模型选择也清空了」——
草稿与已存值**确实不同**，所以「未保存」亮起是"正确的"，但完全不是用户想要的效果；
更糟的是之后改任何字段都清不掉它（那两个草稿一直在）。

**新行为：`撤销改动` = `setDrafts({})`，丢掉所有未保存的草稿，回到已保存的状态。**
点完标记必然消失 —— 这也正是用户点这个按钮时真正做的事（他就是为了撤销刚改的那个 8）。

- 「把某一项清回默认」原本就有更精确的入口：那一项自己的「恢复默认」（顺带清掉
  该字段在用户层的覆盖）
- **全局一键清空所有覆盖**这个能力去掉了：它既危险（会连带清掉模型选择）又少见，
  逐项清覆盖已经够用
- 按钮禁用条件收紧为 `busy || !dirty`：没有改动可撤销时它是灰的

### v0.5.14

**根治「未保存」误报。** v0.5.13 只堵住了「已存的值不在当前列表里」那条路径，但
「模型为空 → 自动落到第一个」**仍然会写进草稿**，同一个症状因此还在。

这一版换了思路：**自动补的值不再写草稿，改为「只算不写」**——

- `pair*`（`pairProvider` / `pairModels` / `pairModelResolved`）照常解析，界面显示的就是它，
  但**没有任何 effect 回写草稿**（那个 `useEffect` 整段删掉了）
- 保存时由 `save()` 按**解析值**写 `provider` / `model`（把它们从 `FIELDS` 循环里摘出来单独处理），
  所以「界面上看到的 = 保存后会写进去的」这条性质仍然成立
- 于是 `drafts` 里**只会出现用户真正编辑过的字段**，「未保存」的口径彻底干净：
  改回原值会消失，点「恢复默认」填回原值也会消失

顺带：「未保存」标签**加了悬停提示**，列出到底哪几项不同（形如「未保存：标题格式、超时」）。
以后再遇到"它怎么不消失"，鼠标停一下就知道该查哪个字段，不用靠猜。

### v0.5.13

**1. 「输出标题最大Token」的说明去掉「标题只占一行，」**（用户要求）：现在只剩
「单位是 token，64 大致相当于 100 个汉字。这一项只是防止模型啰嗦，一般不用改。」

**2. 修掉「什么都没动、却一直显示未保存」。** 根因不在判定逻辑，而在**渲染前就污染草稿**
的那段「自动补具体模型」兜底：

它把「已存的模型不在当前列表里」也当成需要修正的情况，顺手换成了列表第一个 —— 而这一步会
**写进草稿**，于是卡片一打开就挂着「未保存」（草稿值与已存值确实不同）。此时用户改别的字段、
甚至改回原值，标记都不会消失 —— 正是用户描述的现象。

现在只在**值为空**时兜底（对应用户要求的「必须选一个、不给留空」），**已存的值一律原样保留**：

- 值为空 → 自动落到列表第一个（仍进草稿，保证「界面上看到的 = 保存后会写进去的」）
- 有值但不在当前列表 → 原样显示，并给一个「（不在已配置列表）」选项，让用户自己决定换不换
- 连带把 `pairBlocked`（禁用保存）收紧为「列表为空 **且** 手上也没有存过的值」——
  已经存过模型的人，不该因为目录里读不到模型而被拦住保存

> 「未保存」的判定口径（v0.5.8 起）本来就是用户要的那个：把草稿用 `spec.parse()` 解析成值，
> 与已保存的 `section` 比一次，一样就不算改动。本次修的是**另一处**在渲染前写草稿的逻辑。

### v0.5.12

**修正 v0.5.11 的错误归因。** v0.5.11 把「更新失败」归到 pnpm v11 的构建许可上并写进了 README，
**那是错的**。实机日志给出的证据链：

- 最后一次成功更新是 **07:05 UTC**（commit `5b4da54` = v0.5.7），从 07:16 起每次更新都失败
- **v0.5.8 只改了客户端代码与文档，`package.json` 只动了版本号** —— 依赖、脚本一字未改。
  若真是「这个包的构建要被批准」，v0.5.7 就该同样被拦，可它装得好好的
- 同一时刻的系统日志里有
  `fatal: unable to access 'https://github.com/...': gnutls_handshake() failed:
  The TLS connection was non-properly terminated.`
- `pnpm approve-builds` 输出 **There are no packages awaiting approval**，
  且 `allowBuilds` 里**根本没有本插件的条目**（真有构建脚本的包会被 pnpm 自动写入占位条目）
- 网络恢复后，**同样的更新一次就成功**

结论：**病因是这台机器到 GitHub 的链路不稳** —— `github:` 安装要从 `codeload.github.com`
下 tarball。dsh 那段 `allowBuilds` 文案是它对「pnpm 失败」的**通用提示**，不是病因，
照着它改白折腾了一轮。

改动：

1. README 那一节改写为「**更新失败怎么办（先查网络）**」：第一步用 `curl` 与
   `git ls-remote` 验证链路，第二步才谈构建许可，并写清「待批准列表为空 = 不是这里的问题」
2. 顺手补回被 v0.5.11 误删的 `### 关于版本锁定（重要）` 小标题
3. 补一条：GitHub 长期不稳时，从 registry（国内镜像）安装会明显更稳

> 顺带排除掉另一个猜测：`minimumReleaseAge`（最小发布年龄，默认 1440 分钟）也不是原因 ——
> 04:13 至 07:05 的 11 次成功更新全是「刚推完提交就装」，若真有一天的时间闸，那些都会失败。

### v0.5.11

**只加文档**：README 新增「更新时报『pnpm 阻止了构建脚本』怎么办」。

实机更新失败，报 `ERR_PNPM_IGNORED_BUILDS`，dsh 提示去 profile 的 `pnpm-workspace.yaml`
里加 `allowBuilds` 条目。查 pnpm 官方文档后确认了三件事，记进 README 以免下次再查：

1. `allowBuilds` 是 **pnpm v11** 的设置（v10.26.0 引入），形状是 **map（包 → 布尔）**；
   v11 已**移除** `onlyBuiltDependencies` / `neverBuiltDependencies` /
   `ignoredBuiltDependencies` 这些数组式旧设置 —— 所以网上 v10 的写法在 v11 上不会被识别
2. **git 托管的包不能用包名批准**（名字不足以标识产物），必须写成
   `包名@git 地址`（不带 `#ref`）或精确到 commit；同一仓库的 `git+ssh://` 与
   `git+https://` 是两个不同的键
3. 安装时 pnpm 会把未审核的条目**以占位值自动写进** `pnpm-workspace.yaml`，
   多数情况下只要把那个值改成 `true` 就行

顺带说明了两点：本插件产物 `lib/` 已入库、安装并不需要真编译，这道许可来自 pnpm 对
git 托管包的一刀切策略；更新失败后 profile 可能停在中间状态，修好后 `add` 一次即可。

### v0.5.10

**`retitleEvery` 默认 5 → 10。** 用户实跑后觉得 5 轮偏短，改为 10。

只改默认值，语义不变：仍是最小 `0`（= 不自动重算），仍可在设置卡片或 `cordis.patch.yml` 里改。
注意**间隔只影响「多久更新一次」，不改变总量级** —— 每次重算的输入是「上次摘要 + 新增几轮」，
间隔翻倍后单次输入变大、但次数减半，总量大致持平。

### v0.5.9

实跑第一次就抓到的问题：**手动重算标题超时**。

```
生成标题失败：TimeoutReason: SESSION_TITLE_TIMEOUT after 15000ms
```

失败本身的行为是对的（不覆盖已有标题、日志留一条 warn），问题只是**默认超时给得太紧**。
两个原因叠加：

1. 手动重算会**重置滚动状态**（摘要清空、`seenCount` 归零），等于基于整段对话重来一遍，
   输入比平时的增量重算大（虽然有 `maxInputBytes` 兜底）
2. **免费档模型可能正在为主会话排队** —— 实测那轮主对话跑了 47 秒、19 次工具调用，
   同时再挤一个辅助请求进去很容易超时

**改动：`timeoutMs` 默认 `15000` → `30000`**，客户端提示补一句「模型慢的时候（比如免费档
在排队）就往大调」。卡片上的「超时」本来就能改，这次只是把默认值调到够用的位置。

> 另一个可选方向（本轮没做）：给标题调用配一个**专用的小模型**（设置里别选「跟随对话模型」），
> 既避开与主会话争抢，也更快更便宜。

### v0.5.8

**1. 具体模型为空时不再往框里写字。** 原先该厂家一个模型都没有时，右边下拉里放了个
「（这家没有可选模型）」的选项 —— 但一个空框本身就说明问题了，不必再配一行文字。
现在只留一个空选项，框是空的（仍置灰）。下面那条红色提示保留：它解释的是
「**为什么**保存不过」，和框里的空白是两件事。

> 空选项不能直接删掉：受控 `<select>` 的 `value` 匹配不上任何 option 时 React 会告警，
> 留一个 `<option value="" />` 既满足匹配、渲染出来又是空的。

**2. 「未保存」改为与**已保存的值**比较。** 原判据是 `Object.keys(drafts).length > 0`，
也就是「草稿里有没有东西」，于是把 80 改成 90 再改回 80，「未保存」还挂在那儿、保存按钮也还亮着。

现在按字段把草稿解析成值，和 `section`（当前已保存的解析值）比一次，一样就不算改动：

- 走 `spec.parse()` 而不是比字符串，所以 `80 `（带空格）、`080` 这类等价写法也算没改
- 解析不了的草稿（比如输了个半成品）**仍算改动** —— 保存按钮要亮着，用户才收得到
  「这里需要一个整数」的校验提示
- 顺带修正了「重置为默认值」：填回默认值后，本来就等于默认值的字段不再把整卡标成未保存

### v0.5.7

补上 LLM 链路的**可观测性日志**。此前只有失败时的一条 warn，正常调用完全静默 ——
实机验证时看不出「到底调没调、走哪条路由、发了多少字节、花了多久」，排查只能靠猜。

- `callTitleModel()` 返回值增加 `inputBytes`（函数内部本来就算过这个字节数）
- `generate()` 成功后 info 一条：消息条数、`provider/model`、输入字节、耗时、最终标题
- `trackRecomputes()` 触发重算时 info 一条：第几条消息、每几条一次

日志前缀是插件名，直接 grep `dsh-session-title-pattern` 就能看到整条链路。

### v0.5.6

**1. 「模型最多写多少」→「输出标题最大Token」**（用户定名，说明文字不变）。

**2. 具体模型不允许留空。** 原先右边下拉的第一个选项是「厂家默认模型」（value 为空），
而 host 侧的跨字段校验是「provider 与 model 必须**成对**」—— 于是「选厂家 + 厂家默认模型」
这条看起来完全正常的路径**根本保存不过**。这是个真 bug，现在：

- 去掉「厂家默认模型」这一项，右边只能从该厂家的模型列表里选
- 选中厂家后具体模型**自动落到第一个**；换厂家时同样自动落到新家的第一个
- 该厂家一个模型都没有时，右边显示「（这家没有可选模型）」并置灰，卡片标红提示
  「请换一家，或先到『模型』设置里给它配上模型」，同时**禁用保存** ——
  host 的成对校验本来也拦得住，但要在界面上先说清楚，别等点了保存才报错
- 选「跟随对话模型」时把 model 一起清空，避免留下 provider 为空、model 有值的坏状态

实现要点：这对值的解析抽成组件级的 `pair*`（`pairProvider` / `pairModels` /
`pairModelResolved` / `pairBlocked`），再用一个 `useEffect` 把**解析后的可用值同步回草稿**。

> 这一步不能省：只在渲染时兜底而不落进草稿的话，保存写进去的仍是空值，host 依旧会拒。
> 现在的效果是「界面上看到的」永远等于「保存后会写进去的」，而且不一致时卡片会立刻
> 标出「未保存」，用户看得见这次自动修正。

### v0.5.5

「输出上限」用户看不懂（原话：「我都不理解这是什么事儿」）。只改文案，语义不变：

- 标签：`输出上限` → **`模型最多写多少`**
- 说明：`单次调用输出 token 上限` → **`单位是 token，64 大致相当于 100 个汉字。
  标题只占一行，这一项只是防止模型啰嗦，一般不用改`**

背景（记下来，免得以后又被当成效果开关）：

- 这一项设的是**模型单次输出**的上限，与输入无关。输入侧另有 `maxInputBytes`
  （滚动摘要的硬预算），那个故意不放到界面上。
- 标题只需要输出一行 `类型|主题`，64 token ≈ 100 个汉字，**远远用不完**。
- 所以它不是调效果的旋钮，而是一根**保险丝**：防止模型跑偏写小作文时不至于花冤枉钱。
  调小反而有害（输出被截断在中途 → 解析失败 → 类型回退到规则分类），因此文案里明确写「一般不用改」。

### v0.5.4

**1. `retitleEvery` 允许 0** —— 0 表示**只在新建会话（首条消息）时算一次**，之后不再自动更新；
想更新就点标题旁的按钮，或敲 `/retitle`。

- schema：`.min(1)` → `.min(0)`
- `trackRecomputes` 加一条显式 `if (config.retitleEvery <= 0) return;` ——
  虽然 `count % 0` 是 `NaN`、恰好也不会等于 0 从而碰巧不重算，但那是撞运气，不如写清楚
- 客户端提示补上 0 的含义

**2. `separator` → `template`（自定义标题格式）** —— 只让用户填一个分隔符太窄。改成格式模板：

| 占位符 | 含义 |
| --- | --- |
| `YYYY` `MM` `DD` `HH` `mm` `ss` | 日期时间部件，**本地时区** |
| `type` | 分类。**不写就没有分类** |
| `topic` | 主题。不写就没有主题 |

- 日期部件**可任意拼接**：`{MMDD}`、`{YYYYMMDD}`、`{HHmmss}` 都成立。
- 日期时间的锚点是**会话创建时刻**（v0.7.5 起），不是「生成标题的那一刻」。
  实现是「`{...}` 内从左往右逐个吃已知部件，先长后短，吃不下就整体原样保留」
- 认不出的占位符**原样留在标题里**（如 `{date}`），方便一眼看出是模板写错
- 主题为空时收掉两端残留的分隔符，不留 `0913｜修复｜` 这样的尾巴
- 渲染后仍只做一次 `truncateTitleUtf8` 字节收口；渲染结果为空时逐级回退
  （主题 → 类型 → `FALLBACK_TYPE`），保证标题非空（服务会拒绝空标题）
- 顺带删掉已无人使用的 `formatPatternDate()`（由 `timeParts()` + `formatTitle()` 取代）

验证（用与代码同款的逻辑跑过）：

```
{MMDD}｜{type}｜{topic}  →  0913｜修复｜登录失败
{YYYYMMDD} {topic}       →  20260913 登录失败
{MMDD}｜{type}｜{topic}  →  0913｜修复          （主题为空，尾部竖线被收掉）
{HHmmss} {type}: {topic} →  140507 指令: 跑测试
{date}｜{topic}          →  {date}｜登录        （认不出的占位符原样保留）
```

> **破坏性变更**：配置键 `separator` 已移除，改用 `template`。在 `cordis.patch.yml` 里
> 写过 `separator` 的话需要改键名（界面上是「标题格式」这一项）。

### v0.5.3

设置卡片三处体感修正，都是用户看出来的。

**1. 第一行「用模型总结标题」离上分隔线太近。** 根因是我照抄官方 CSS 时留了一条
`.stp-body>.stp-field:first-child{padding-top:4px}`（原意是「首尾字段不要顶到分隔线上」），
而这一行正好是首行，于是它只有 4px、其余各行都是 12px。现在删掉首行那条规则，各行统一 12px；
末行保留 4px（它紧挨页脚的分隔线）。

**2. 供应商与模型合并成一行两个下拉。** 原先拆成两个字段，每行各挂一套
「标签 + 已覆盖 + 恢复默认 + 说明」，读起来很啰嗦。现在只留一行：

- 标签只有一个「标题总结大模型」
- 标签右侧只有一个「已覆盖 / 恢复默认」（两字段任一被覆盖就点亮，恢复时一起清）
- 下面并排两个下拉：左边挑厂家（第一个选项「跟随对话模型」）、右边挑具体模型（第一个选项「厂家默认模型」）
- 跟随对话模型时右边**置灰而不是隐藏** —— 并排两个框，藏一个会让布局跳动
- 原来挂在 provider 行上的两条说明（目录读不到 / 凭据状态读不到）挪到这一行下面

两个框的内容本身就能说明各自是干什么的（一边是厂家名、一边是模型名），所以不再各配标签。

**3. 目录读不到时的退路同样合并**：两个并排的文本输入（供应商 / 模型 id），不再拆成两个字段。

实现上 `FIELDS` 里 `provider` 与 `model` **仍然各占一项** —— 保存（`save()` 按项遍历）与
校验都靠它，只是渲染时把 `model` 折叠进 `provider` 那一行（`renderModelPair()`），
并在 `visibleFields` 里排除 `model`，避免多渲染一行空的。

### v0.5.2

设置卡片四处修正。

**1. 标签去掉行话。**「服务商 provider」→「**标题总结大模型**」（说明：先挑哪家的模型来做总结）；
「模型 model」→「**具体模型**」。原先的英文加「服务商」对普通用户不友好，改成按用途命名；
「重算间隔」也顺带写成「每隔几条对话重算一次」。

**2. 去掉下拉框右侧的小箭头。** 用户以为那是我们画的 —— 其实是**浏览器给 `<select>` 画的原生箭头**，
我们的 `.stp-input` 既没写 `appearance:none` 也没有任何箭头或背景图。按要求加上 `appearance:none` 去掉。
副作用：下拉从此与文本输入框外观一致（用户明确接受）。

**3. 修掉「没配 DeepSeek 却列出 DeepSeek」。** 这是上一版筛选逻辑的真 bug，两处原因：

- **凭据域没接上**：`credentials/describe` 由 `@deepseek-ai/dsh-api-settings-controller` 提供，
  入参 `string[]`、返回 `{ [ref]: { configured, source?, writable } }` —— schema 就在
  `dsh-api-remotes/lib/client.js` 里，上一版没查到，导致一直走回落路径。现在只在该请求真正
  成功（`ok === true` 且形状认得）时才把它当依据。
- **回落判定太松**：`settingsPath` 为空时 `walk(user, [])` 返回 `user` 本身，于是只要平台给内置
  供应商预置过一个**空壳 profile**，就被判成「我配过」。现在改用 `isMeaningful()`：**空对象不算写过**。

新规则：profile 命名了 `apiKeyEnv` → **以凭据域为准**（配没配 key 只有它知道），凭据域读不到才退回
用户层判定；没命名任何引用 → 只有用户层真的写过才算「我配了」。
另加一条自诊断：凭据状态没读到时，在「标题总结大模型」那行下面提示
「列表只按设置文档判断，可能多列出没配好的供应商」——下次再遇到就能一眼看出是哪条路径。

**4. 关掉「用模型总结标题」后，相关的项全部隐藏。** 重算间隔 / 标题总结大模型 / 具体模型 / 超时 /
输出上限都标了 `modelOnly`，开关一关（以**草稿**为准，不等保存）整行消失；分隔符与长度上限在两种
模式下都有效，保留。开关下面补一句说明：改用关键词规则后类型按关键词匹配、主题取首条消息、
标题不会随对话更新——关掉之后确实没什么可配的了，留着只会让人以为还生效。

### v0.5.1

设置卡片按用户逐条反馈做的 7 处调整。

1. **开关行改成「标题与说明在左、开关在右」**（对齐官方的 MCP 连接器 / Subagent 卡片）。
   先查了平台有没有现成组件：`primitives` 里 `DisclosureRow` 是折叠头、`FoldToggle` 是折叠
   控件，**没有**「标签 + 说明 + 控件」这种行组件。但官方 `SubagentModelSelectionCard` 里有
   现成的行布局，照抄它的 `.toggleRow{justify-content:space-between;gap:16px}` +
   `.toggleLabel{flex:1;min-width:0}`，开关本身用系统自带的 `Switch`。
2. **去掉二级折叠**：「模型」「标题格式」两组不再需要再点一次展开，卡片展开即全部可见
   （一共就 8 项，再折一层是负担）。顺带删掉了 `COLLAPSIBLE_GROUPS`、`openGroups`、
   `renderGroup` 与 `FieldDesc.group`。
3. **删掉 provider 的多余说明**。
4. **模型行按需出现**：provider 留空（跟随会话主模型）时根本不渲染 model 那一行 ——
   此时没有第二个选择可做。
5. **「恢复默认」填默认值，而不是清空**。原先 `stage(field, '')` 会把框清空，用户看不到
   默认到底是多少。现在填 `defaultOf(field)`；默认值取自快照的 **`base` 层**
   （文档定义就是「清空该字段后会回落到的值」），拿不到才用客户端的 `FALLBACK_DEFAULTS` 兜底。
   连带把「已覆盖」的判定也改了：**存在 user 键 且 值不等于默认值**才算覆盖；保存时若值等于
   默认值则走 `unset`，不往用户层记多余的一笔。
6. **底部按钮语义改对**：「放弃修改」→「**重置为默认值**」，把各字段填回默认（暂存），
   点保存时一并写回。原先的「放弃」与用户想要的行为不符。
7. **标题带上插件名**：「会话标题（session-title-pattern）」，让人知道这是哪个插件的设置。

### v0.5.0

设置卡片：样式全面对齐官方，模型列表改为严格筛选。

**样式重做**。v0.4.x 的卡片样式是我自己编的，三处都不对（用户截图指出）：
header 用透明背景所以永远显黑；body 浮在卡片外面所以断开；字段用「左标签 + 右输入 +
右侧按钮」的表格布局所以很乱。

现在逐条照抄官方 `@deepseek-ai/dsh-client-ui-settings-plugins` 里
`PluginCard.module.css` 与 `fields.module.css` 的规则（新建 `src/client/settings-css.ts`）：

- `.card` 收起态 `background:var(--dsw-alias-bg-layer-3)`（灰）；`.cardOpen` 展开切
  `bg-layer-2`（深）—— 这就是「没展开是灰的、展开了才黑」
- `.body{border-top:.5px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}`
  —— 正文落在**同一张卡片内**，只隔一条细线
- `.field{flex-direction:column;gap:6px;padding:12px 0}` + `.field+.field{border-top:…}`
  —— **标签在上、控件整宽在下、hint 再下一行**，字段之间用细线分隔
- 「恢复默认」是 label 行里的 12px 文字按钮；底部是右对齐的「放弃修改 / 保存」
  （`.save` 实心、`.discard` 描边）
- 保存成功后**自动收起**（官方 PluginCard 的行为）

类名用我们自己的 `stp-` 前缀、规则照抄，**不直接借用官方的 hash 类名**
（`YyYd_a_card` 这类由上游构建生成，改版即静默失效）。

**模型列表严格筛选**。v0.4.2 把 `listProviders()`（适配器注册的**全部内置供应商**）
直接列了出来，于是用户只配了一个 DeepSeek key，却看到一大堆用不了的模型。现在加两道闸：

1. 路由必须**已注册**（active）；
2. 该 provider 的 profile 要么在设置文档的**用户层**被写过，要么它引用的
   `apiKeyEnv` 在**凭据域**里 `configured === true`。

第 2 条与官方模型页 `providerUsable` 的口径一致，只是我们更严一档：官方对「profile
未命名任何凭据」的路由直接放行（留给 Bedrock/Vertex 这类走自身凭据链的场景），
而这里的目标是「我配了什么就出什么」，所以不放行。

凭据域通过 `remote.credentials.describe(refs)` 读取，但**该命名空间的签名本地无法验证**
（声明它的包只在部署侧组合），因此做结构化调用 + 形状解析 + 整体 try/catch：
拿不到就回退成「只看用户层」，并在卡片上说明。这一条是本次唯一未经实机验证的部分。

### v0.4.2

provider / model 改成**只能选的下拉**，选项来自用户已经配好的模型。

**为什么**：原先让用户手打 provider 与 model id，等于把「哪个供应商配了哪些模型」这件事
在插件里重录一遍；而手打错一个字母的后果是运行时调用失败。

**数据源**（都在客户端可得，不需要新增依赖）：

- `remote.llm.listProviders()` —— 当前已注册的路由（`{ id, name }`）
- `remote.llm.listConfigurableProviders()` —— 已声明可配置的路由，带 `displayName`、
  `settingsNs`、`settingsPath`
- **具体配了哪些模型不在上面两个接口里**，而在各 provider 自己的 settings section：
  按 `settingsNs` 从设置镜像（`settingsScope.describe()`）找到 `SettingsNamespaceView`，
  读它的 `value`（`SettingsNamespaceView.value` 就是「schema 默认值 → 组合层 → 用户层」
  解析后的结果），再按 `settingsPath` 走进去取 `models` 数组。
  这点由官方 `ModelListEditor` 的注释确认：the profile's `models` array。

**降级**：模型页那个包（`dsh-client-ui-settings-models`）**没有对外暴露可复用服务**
（无 cordis 服务增强，导出都是页面内部类型与 store，跨插件值导入又会被纯度闸门拒绝），
所以目录得我们自己拼。任何一步拿不到（llm 远端不存在、镜像读不到、profile 结构对不上）
就**把这两行退回文本输入**并在下方说明原因 —— 最坏情况等于 v0.4.1 的行为，不会把用户卡死。

**细节**：换供应商时清掉已选模型，避免留下属于上一个供应商的 model id；
当前值不在候选里时额外插一条「（不在已配置列表）」选项，防止 select 显示空白。

### v0.4.1

设置卡片两处修复。

**1. 卡片默认折叠。** v0.4.0 把表单整片摊开，与官方的插件卡片不符 —— 官方 `PluginCard` 的
头部是「插件名 + 一行描述 + 折叠箭头」，点标题行才展开控件（`PluginCardProps` 的
`titleKey` / `descriptionKey` / `children` 就是这个结构）。现在照此实现：标题行是一个按钮，
默认收起；折叠**不影响暂存的改动**，所以标题行右侧会显示「未保存」徽标
（官方注释：staged edits outlive collapsing）。

**2. 模式开关补上可见文字。** v0.4.0 用 `Switch` 的 `label` 属性当字段名，但截图显示
**它根本不渲染可见文字** —— 结果那一行只剩一个没有说明的开关，用户完全不知道它控制什么。
现在按其它行的布局补一个可见的字段名，并在开关右侧显示当前状态（「模型总结」/「关键词规则」）。

### v0.4.0

设置界面：在 dsh「设置 → 插件」里为本插件提供一张配置卡片。

**配对机制**：卡片由同一个包的两半配对 —— host 半用 `ctx.settings.installSection` 注册
命名空间 `session-title-pattern`，client 半把卡片注册到 `settings.plugin.item` 槽位并以
**同一个命名空间为 `key`**。设置页的「插件」标签页遍历 host 提供的命名空间，逐个
`renderSlot("settings.plugin.item", {}, { entryKey: ns })` 拉取卡片。

**8 项可配置**：mode（开关）、retitleEvery、provider、model、timeoutMs、maxOutputTokens、
separator、maxBytes。分三组：前两项常显，「模型」与「标题格式」默认折叠。
`maxInputBytes` 刻意不露出（滚动摘要的内部成本预算，需要时走 `cordis.patch.yml`）。

**表单语义**：官方 `CardForm` 用「暂存 + 保存」而不是改一下即提交，理由是每次写入都是
可持久化的、带修订号栅栏的文档变更，边改边写会把一次输入变成用户没要求、也无法预览的写入。
卡片照此实现：草稿 + 保存/放弃 + 单字段恢复默认 + 全部恢复默认。覆盖状态按 `user` 层的
**键存在性**判断（不是比值 —— 等于默认值的覆盖仍然是覆盖），有草稿时按草稿预演，
徽标不与屏幕上的输入自相矛盾。

**配置改成动态读取**：provider 原先在构造时把 config 冻结进字段；现在持有 `source()`，
每次 `generate` 现读。`onChange` 里替换来源并**清空滚动摘要**（换了模型或间隔后旧摘要
不再匹配新设置）。`trackRecomputes` 也不再只在 apply 时判断 mode —— 模式可以随时切换。

**跨字段校验**：`validate` 拒绝 provider/model 只填一项的写入（schema 表达不了的约束），
用户在设置页立刻收到失败提示。

**新增依赖**：`@deepseek-ai/dsh-settings`（peer + dev）、`@deepseek-ai/dsh-client-ui-settings`
与 `@deepseek-ai/dsh-client-ui-settings-plugins`（dev，仅类型）。三者都加了
`dsh.client.inject`（后两者是客户端插件）。

**三个踩坑记录**：

1. **版本标签陷阱**：`npm view <pkg> version` 拿到的是 `latest` 标签，而这两个设置包
   `latest` 指向旧的 `0.0.1-rc.x` 版本线，与整条 `0.1.5-rc.2` 栈 peer 冲突（ERESOLVE 装不上）。
   正确版本在 **`next` 标签 = `0.1.5-rc.2`**。
2. **类型增强必须显式 import**：`ctx.settings` 的声明来自 `@deepseek-ai/dsh-settings`，
   而 tsconfig 的 `types` 是空的 —— 不写 `import type {} from '@deepseek-ai/dsh-settings'`
   就报 TS2339。
3. **受保护代理**：`ctx.settings` 与 `ctx.settingsScope` 都不能直接访问，一律走
   `ctx.inject([...])` 延迟注入（同 v0.3.1 的 `ctx.llm`）。

### v0.3.2

文案细化。悬浮气泡不占布局空间，所以把说明写全：

- 客户端按钮的 `ACTION_LABEL`：`生成标题` → **`根据对话重新生成标题`**
- `/retitle` 的命令描述同步改成同一句，保持一致

刻意不用「自动生成标题」：本按钮是**手动**触发，写「自动」会让人以为它自己会跑。

### v0.3.1

修复 v0.3.0 的致命缺陷：**`/retitle` 与自动生成全部报
`Error: cannot get property "llm" without inject`**。

**根因**：cordis 的 `Context` 是受保护的代理，**未在 `inject` 里声明的服务属性一经访问
就抛错**。v0.3.0 在 `callTitleModel` 里直接写了 `ctx.llm.stream(...)`，而本插件的
`inject` 只有 `['sessionTitle']`。

**修法**：没有简单地把 `llm` 加进 `inject` 声明，而是改用**延迟注入**：

```ts
let llm: LlmService | undefined;
ctx.inject(['llm'], (llmCtx) => { llm = llmCtx.llm; });
```

理由：`mode: rules` 时我们根本不需要 LLM，而**声明式依赖会让本 entry 在缺少该服务的
组合里一直 pending**。延迟注入让「没有 llm」只表现为「LLM 模式不可用」，rules 模式照常工作。
与项目对 `commands` 的处理一致。

配套改动：`callTitleModel` 的第一个参数从 `Context` 改为 `LlmService`（服务由参数传入，
不再从 ctx 上取），`LlmService` 类型用 `Context['llm']` 表达；provider 构造函数新增
`getLlm: () => LlmService | undefined`；取不到时抛带说明的错误，走既有的「保留上一次标题」
降级路径。

**验证**：`npm run typecheck` 通过；产物核对 —— 含 `inject(["llm"]`，`llm.stream`，
且 `grep "ctx\.llm" lib/index.mjs` **无结果**。

**教训**：这个错误不是"配置问题"，而是插件在开发环境里无法暴露的一类错误（本地没有 dsh
运行环境，typecheck 也查不出受保护代理的运行时约束）。凡是访问 `ctx.<服务>`，都必须先确认
该服务已在 `inject` 声明里，或通过 `ctx.inject` 拿到。

### v0.3.0

接入大模型：类型与主题改为模型对**整段对话**的总结，首条消息先生成一次，之后每 N 轮滚动重算。

**用户需求**：分类交给模型总结（两个汉字，可给示例但不硬性约束）；标题要成为对整段对话的
总结而非首条消息前几个字；首条消息先生成，之后每 5 轮重算；必须控制 token（不能把全部对话
都发一遍）；提供"每 5 轮 / 每 10 轮"这类配置项。本轮先实现功能，配置面板押后。

**四项决策**：默认开启 LLM 且可关；独立调用 + 滚动摘要；模型可配置、留空跟随主模型；
失败保留上一次标题。

**为什么不做「把任务偷偷塞给下一轮对话」**：dsh 的主对话请求由 agent loop 构建，传给
`llm/stream` 时深度冻结只读，第三方插件无法注入隐藏轮次；`GenerateOptions.purpose` 也是
封闭枚举（只有 `compaction` / `session-title`）。唯一能贴近该设想的是注册工具让主模型顺带
调用，但工具定义与提示说明会随每轮主请求一起发给模型，token 随轮数线性增长，按 N=5 估算
比滚动摘要更贵，故弃用。

**成本模型**：每次重算只发固定三段 —— ① 首条消息（截断 200 字节）② 上次摘要（一行）
③ 上次之后的新增人类消息。② 就是模型上一次的输出本身，不是额外生成的东西。输入大小与
会话总长度无关：每 5 轮约 300 token 输入 + ≤64 token 输出，100 轮也就三四万 token。

**实现要点**：
- `automatic` 保持 `first-prompt`：首条消息由服务自动调度；之后的重算由本插件订阅
  `session/event` 数轮次，每满 `retitleEvery` 条显式调 `ctx.sessionTitle.refresh()`。
  这样非重算轮根本不会被调用，也不会写重复的 `session/title` 事件
  （改成 `all-prompts` 会每轮写一条重复标题事件）
- 模型调用照官方 `session-title-llm` 范式：`ctx.llm.stream` + `BlockAssembler` +
  `deadline(request.signal, timeoutMs, 'SESSION_TITLE_TIMEOUT')`，`purpose: 'session-title'`
- 输入用 JSON 承载（防注入，官方同做法）；超预算时从**最旧**的新增消息开始丢
- 输出解析容错：多行只取首行、剥编号/引号/反引号、兼容全角竖线；类型缺失时回退规则分类
- **降级**：provider 抛错即可 —— 服务的 `runProvider` 只在成功后 `append('session/title')`，
  抛错天然保留旧标题（已读 `dsh-session-title/lib/index.js` 确认）；轮次仍推进，
  避免失败后每轮重试
- **只处理顶层会话**：`session.header.parentSession !== undefined` 直接跳过，否则每次
  fork（子代理）都要多付一次模型调用
- 内存有界：每会话只留一行摘要 + 两个计数，`Map` 上限 64 个会话，按插入序淘汰
- 手动 `/retitle` 会重置滚动状态，让这次尽量基于全部对话重来

**新增依赖**：`@deepseek-ai/dsh-llm`、`@deepseek-ai/dsh-timeout`（peer + dev，均为 0.1.5-rc.2）；
tsconfig 的 `lib` 增加 `ESNext.Disposable`（`deadline` 的 `[Symbol.dispose]`）。
字节计算用 `TextEncoder` 而非 `Buffer.byteLength`，避免为 `types: []` 引入 `@types/node`。

**新增文件**：`src/host/rules.ts`（规则模式与标题拼装，供 LLM 模式复用）、
`src/host/llm.ts`（提示组装、模型调用、输出解析、路由解析）。

**顺带**：客户端按钮图标由 `IconRefreshOutline16` 换成 `IconEditOutline16`（铅笔）。

**已用临时脚本验证**（跑完即删）：`parseTitleLine` 的 6 种输入、`buildPromptInput` 的
首轮/第 5 轮/极小预算、`composeTitle` 的字节安全截断与空主题分支。

**未做（下一轮）**：配置面板（settings card）、分类规则重构、单测。

### v0.2.9

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

（详细根因与方案原记在 `REVIEW.md`，该文件已不存在）

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

**待办（本轮不做，原方案记在已删除的 `REVIEW.md` 第 3 节）**

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

> **原始计划 vs 实际路径**：下面的 Phase 1–7 是项目最初排的计划表，实际开发在 Phase 3
> 之后就转入了版本迭代（v0.1.0 → v0.6.5）。一路加上去的东西大多不在原计划里：
> 设置卡片、重命名卡片、模型主线锚、等距采样、重启恢复、市场整备……
> 所以**功能进度的真实来源是本文件上半部分的 v0.x 版本记录**，
> 本节表格只作「原计划哪些做了、哪些没做」的对照。

### Phase 1: 项目初始化 ✅

| 步骤 | 状态 | 说明 | 完成时间 |
|------|------|------|---------|
| 1.1 | ✅ | 创建 Git 仓库，初始化目录结构 | 2026-09-12 |
| 1.2 | ✅ | 编写 package.json（插件清单） | 2026-09-12 |
| 1.3 | ✅ | 编写 tsconfig.json（TypeScript 配置） | 2026-09-12 |
| 1.4 | ✅ | 编写 tsdown.host.config.ts（Host 构建配置） | 2026-09-12 |
| 1.5 | ✅ | 编写 tsdown.client.config.ts（Client 构建配置） | 2026-09-12 |
| 1.6 | ✅ | 编写 .gitignore（排除 `node_modules` / `*.tgz`；**`lib/` 不排除**，见 Phase 2） | 2026-09-12 |
| 1.7 | ✅ | 创建 src/host/index.ts（核心逻辑） | 2026-09-12 |
| 1.8 | ✅ | 创建 src/client/index.ts（客户端存根） | 2026-09-12 |
| 1.9 | ✅ | 编写 cordis.patch.yml（DSH 插件入口） | 2026-09-12 |
| 1.10 | ✅ | 编写 README.md（使用说明） | 2026-09-12 |

**Phase 1 输出物**：
- 源代码：`src/host/index.ts`, `src/client/index.ts`
- 配置文件：`package.json`, `tsconfig.json`, `tsdown.*.config.ts`, `.gitignore`, `cordis.patch.yml`
- 文档：`README.md`

---

### Phase 2: 构建与编译 ✅

| 步骤 | 状态 | 说明 | 完成时间 |
|------|------|------|---------|
| 2.1 | ✅ | 安装依赖（npm install） | 2026-09-12 |
| 2.2 | ✅ | 编译 Host 端（tsdown --config tsdown.host.config.ts） | 2026-09-12 |
| 2.3 | ✅ | 编译 Client 端（tsdown --config tsdown.client.config.ts） | 2026-09-12 |
| 2.4 | ✅ | 验证编译产物（lib/ 目录内容） | 2026-09-12 |
| 2.5 | ✅ | 提交编译产物到 Git —— **决策：提交**（与原计划相反） | 2026-09-12 |

**Phase 2 输出物**：
- 编译产物：`lib/index.mjs`, `lib/index.d.mts`, `lib/client.js`
- 映射文件：`lib/index.mjs.map`, `lib/index.d.mts.map`, `lib/client.js.map`

> **产物决策**：最初打算把 `lib/` 加进 `.gitignore`，实际改为**提交进仓库**。
> 原因：dsh 加载的是 `package.json` 的 `main`（`lib/index.mjs`），**运行时不编译 TypeScript**，
> 而本插件是按 `github:` 直装的 —— 不提交产物就等于装了一个跑不起来的包。
> 所以**改完 `src/` 必须 `npm run build` 并把 `lib/` 一起提交**。

---

### Phase 3: 本地测试 ✅

| 步骤 | 状态 | 说明 | 完成时间 |
|------|------|------|---------|
| 3.1 | ✅ | 装进 dsh profile（实际是 `dsh plugin --profile web add github:…` 直装，非软链） | 2026-09-12 |
| 3.2 | ✅ | 重启 dsh Web GUI | 2026-09-12 |
| 3.3 | ✅ | 新建会话验证标题格式（`0913｜接口｜登录接口鉴权`） | 2026-09-12 起 |
| 3.4 | ✅ | 验证各类消息的分类 | 2026-09-12 起 |
| 3.5 | ✅ | 验证标题长度截断（字节安全，不切断代理对） | 2026-09-12 起 |
| 3.6 | ✅ | 验证配置项（`template` / `maxBytes` / `retitleEvery` / 模型选择） | 2026-09-12 起 |

**Phase 3 输出物**：
- 测试报告：多轮实机验证结论都落在上面各版本的记录里
- 问题记录：发现的问题及修复方案，见 v0.2.x–v0.6.x 各条

> 本地测试**贯穿整个迭代周期**，不是一次性收尾：v0.2.1（按钮不出现）、v0.3.1（受保护代理）、
> v0.5.24（dsh 起不来）、v0.6.2（命令少了斜杠）都是实机跑出来的问题。
> 本项目**至今没有自动化测试**，验证手段一直是「装到 dsh 上实跑」。

---

### Phase 4: 完善功能 🔄

| 步骤 | 状态 | 说明 | 完成时间 |
|------|------|------|---------|
| 4.1 | 🔄 | 扩展消息分类规则 —— README 已固化 11 类顺序匹配词表；「规则表 + 最长匹配 + 加权打分」重构未做 | 部分完成 |
| 4.2 | 🔄 | 优化主题提取 —— LLM 模式由模型提炼并加主线锚（v0.5.20）；`rules` 模式的停用词 / 分句优化未做 | 部分完成 |
| 4.3 | ⏳ | 添加多语言支持（英文标题） | 未做 |
| 4.4 | ⏳ | 添加单元测试 | 未做 |
| 4.5 | ⏳ | 添加 E2E 测试 | 未做 |

> **原计划之外、实际做掉的功能**（本节表格没覆盖，进度以上方版本记录为准）：
> 设置卡片（v0.4.0 / v0.5.x）、重命名卡片（v0.6.0–v0.6.5）、模型主线锚（v0.5.20）、
> 等距采样（v0.5.23）、重启恢复（v0.5.23）、标题宽度覆盖（v0.2.8）、市场整备（v0.5.18）。

---

### Phase 5: 发布准备 🔄

| 步骤 | 状态 | 说明 | 完成时间 |
|------|------|------|---------|
| 5.1 | ✅ | 版本升级（v0.1.0 → v0.6.5，共 30+ 次发版） | 持续 |
| 5.2 | ✅ | 变更记录 —— **不单独建 `CHANGELOG.md`**，由本文件上方的 v0.x 记录承担 | 持续 |
| 5.3 | ✅ | 更新 README（v0.5.17 为发布市场重排，并入三张截图） | 2026-09-13 |
| 5.4 | ✅ | Tag 发布版本（每个版本同名 tag，最新 `v0.6.5`） | 持续 |
| 5.5 | ✅ | 推送 Tag 到 GitHub | 持续 |
| 5.6 | ⏳ | 创建 GitHub Release —— **一个都没建过**，目前只有 tag | 未做 |
| 5.7 | 🔄 | 上架 dsh-market —— **PR #5064 已提交，CI 通过，等审核合并** | 2026-09-14 |

> 5.7 的流程与已核对项：仓库已有 **`dsh-plugin` topic**、创建于 2026-09-12（**已过 1 天门槛**）；
> 上架 = 往 awesome-dsh-plugin **新增一个文件**
> `data/plugins/cq-guojia__dsh-session-title-pattern.yml`（**不要**改它的 README，脚本生成的）。
>
> ⚠️ **条目里禁止手写 `npm:` 字段** —— CI 会直接拒。npm 映射由 registry **自动采集**，
> 前提是 `package.json` 的 `repository` 指回被收录的仓库（已满足）。
>
> 提 PR 之后才查到的两条实情（事先没预料到）：
> 1. 市场里**已有 4 个同类插件**（`weibaohui/dsh-smart-title` 思路最接近）。
>    contributing 明写「已被现有条目覆盖」只是**平局排序依据、不是既得利益**，规则是「谁更好」，
>    所以不是硬性障碍；PR 正文里主动写清了机制差异（结构化 / 成本与会话长度无关 / 可零 token），
>    省得评审自己去逐个比对。
> 2. **PR 正文要写清功能与仓库 URL**。条目文件里虽然有 `url:` 与 `description:`，
>    但那躲在文件里，人看 PR 时看不到 —— 第一版正文只写了合规自检，写歪了，已改。

---

### Phase 6: 发布到 npm ✅

| 步骤 | 状态 | 说明 | 完成时间 |
|------|------|------|---------|
| 6.1 | ✅ | 登录 npm（`npm login`，用户名 `guojia`） | 2026-09-14 |
| 6.2 | ✅ | 发布到 npm（`dsh-session-title-pattern@0.6.6`，首次发布） | 2026-09-14 |
| 6.3 | ✅ | 装机验证：**npm 与 `github:` 两个通道各装一次都成功**，`peerDependencies` 解析无问题 | 2026-09-14 |

> **路线已从「不做」改回「要做」**（v0.6.6）。v0.5.18 查到的「不发 npm 也能上架」
> 依然成立，但市场**推荐**发 npm：预构建安装可以跳过 `allowBuilds` 构建授权那一步。
> 包名取无 scope 的 `dsh-session-title-pattern`（scoped 包默认按私有包发布，见 v0.6.6）。
>
> 6.2 的坑见 v0.6.6 那条：npm 要求发布必须有 2FA，而 2FA 只剩 WebAuthn 安全密钥，
> 且 CLI 发布前要先 `npm login --auth-type=web` 刷新凭据（否则报 `EOTP`）。

---

### Phase 7: 长期维护 🔄

| 步骤 | 状态 | 说明 | 完成时间 |
|------|------|------|---------|
| 7.1 | 🔄 | 关注 GitHub Issues | 持续 |
| 7.2 | 🔄 | 处理 Pull Requests | 持续 |
| 7.3 | 🔄 | 跟进 dsh 新版本兼容性（peer 范围 `>=0.1.0-rc.0 <0.2.0-0`） | 持续 |
| 7.4 | 🔄 | 定期版本更新 | 持续 |

---

## 当前状态总结

> 下面的百分比**只对照最初的 Phase 1–6 计划表**。实际功能集早已超出该计划
> （v0.1.0 → v0.6.5），真实进度以本文件上半部分的版本记录为准。

```
Phase 1: 项目初始化    ✅ 100%  (10/10)
Phase 2: 构建与编译    ✅ 100%  (5/5，产物决策改为提交 lib/)
Phase 3: 本地测试      ✅ 100%  (6/6，持续实机验证，无自动化测试)
Phase 4: 完善功能      🔄  40%  (4.1 / 4.2 部分完成；多语言 / 单测 / E2E 未做)
Phase 5: 发布准备      🔄  71%  (5/7，余 GitHub Release 与 dsh-market 上架)
Phase 6: 发布到 npm    ✅ 100%  (3/3)
Phase 7: 长期维护      🔄  进行中 (4/4 持续项)

表格共 40 步（Phase 5 补了 5.7）
  明确完成  29 步  = Phase 1–3 全部 21 步 + Phase 5 的 5 步 + Phase 6 的 3 步
  进行中     7 步  = Phase 4 的 4.1 / 4.2 + Phase 5 的 5.7 + Phase 7 的 4 项
  未做       4 步  = 4.3 / 4.4 / 4.5、5.6

当前版本: v0.7.4（v0.7.0 新增「隐藏会话」；v0.7.1 为文档改版，代码未变；
v0.7.2 英文支持改造 —— 删除 rules 模式、失败语义改两段、兜底复用官方 fallbackSessionTitle、
类型跟界面语言／主题跟对话语言、设置与提示接入平台 locale 服务实现中英双语、host 文案统一英文、
README 改中英双语（英文默认）；
v0.7.3 默认值提高 —— maxOutputTokens 2048 / timeoutMs 90s；
v0.7.4 撤销 v0.7.3 的锁定态缓存，/title-state 回到每次开面板都查询；
市场 PR #5064 等审核）
```

---

## 最近提交

> 快照，写文档时的状态。

```
1393dee docs: 安装首选改为 npm 通道，并记录 v0.6.6 发版 (v0.6.6)
8312b2b chore: 补上缺失的 LICENSE（MIT，署名 cq-guojia）
63d60fc feat!: 包名去掉 scope 改为 dsh-session-title-pattern，转向 npm 发布 (v0.6.6)
1442347 docs: 更新 DEVELOPMENT.md 阶段追踪至 v0.6.5 现状
cfcbc13 fix: 解锁时 messageSeqs 为空改用当前消息的 seq（用户改名标题不指认消息）(v0.6.5)
```

---

## 待办事项（下一步）

1. **跟 dsh-market 的 PR #5064**（Phase 5.7）—— 现在等人工审核；
   若被打回，往**同一个分支**（`cq-guojia:add-session-title-pattern`）推一次修复即可，不用重开 PR
2. **实机验证 v0.6.4 / v0.6.5 的重命名卡片全链路** —— v0.6.4 的「按形状逐层剥取远端返回值」
   与 v0.6.5 的解锁修复都还没实机确认：打开卡片看控制台有无 `未取到执行结果` 告警，
   再走一遍「自动生成 → 确定保存 → 锁定 → 解锁」
3. **实机验证 v0.7.0 的隐藏会话全链路**（同样只能实机跑）—— 顺序：
   ① hover 会话行看眼睛是否出现（**且图标一开始就要是完整的眼睛 / 划线眼，不能是空底板**）
   → ② 鼠标停在眼睛上看提示气泡是否立刻出现 → ③ 点它，行是否消失 →
   ④「工作区」行放大镜左边是否有总开关，点一下是否全部显示（半透明）→
   ⑤ 隐藏当前正在打开的会话，确认它先不消失、切走后消失 →
   ⑥ 搜索一个被隐藏的会话，确认结果行被藏 / 淡化 → ⑦ 刷新页面与重启 dsh，确认状态保持 →
   ⑧ 设置卡片里「已隐藏 N 条」与实际一致，「全部取消隐藏」有效。
   任何一步不生效就看控制台有没有本插件前缀的告警（`_sessionRow` / `__reactFiber$` 的排查
   写在 README「没生效时怎么排查」）
4. **补单元测试**（vitest）—— 优先覆盖纯函数：`formatTitle`（含空段折叠）/ `normalizeType` /
   `parseTitleOutput` / `buildPromptInput` / `composeTitle` / `buildFallbackTitle`；
   v0.7.0 的 `rowMode()` 也是纯函数，一并覆盖
5. **实机验证 v0.7.2 英文支持改造**（只能实机跑）——
   ① 新建英文会话，确认标题是 `MMDD｜Word｜topic`（类型是**一个英文单词**：既不是两个汉字，
   也不是被截短的 `Debu`）；② 中文会话仍出两个汉字；
   ③ 把 provider/model 配成一条不通的路由，在**新会话**里发第一条消息，确认标题落成
   `0915｜<首条消息片段>`（**没有类型段、也没有双竖线**），而不是报错或留空；
   ④ 在**已有标题**的会话里敲 `/retitle`，确认失败时标题**原样保留**；
   ⑤ 打开重命名卡片点「自动生成」，有标题时失败应显示**英文错误**、不出假草稿；
   ⑥ 设置界面切到英文，确认卡片、重命名面板、隐藏会话的悬浮提示**全部**跟着变英文
   （含 `aria-label`），切回中文能恢复；
   ⑦ 关掉「启用隐藏会话」再打开，确认眼睛与气泡文案正常；
   ⑧ 把界面语言切成英文，在**中文会话**里生成标题：类型应是**英文单词**、主题仍是中文；
   再切回中文，在**英文会话**里确认类型变回中文 —— 这条验证的是「语言环境决定类型语言」，
   也是本次唯一依赖 `ctx.settings.get('locale')` 的路径，**必须实机确认**；
   ⑨ 在**新会话**发一条较长的英文首条消息并让模型失败，确认兜底主题是**前 8 个词**
   （而不是铺满 73 个字符）。
6. **（可选，低优先级）英文类型词观察** —— 模型偶尔会给短语而不是一个单词（如
   `Feature work`），`normalizeType` 只取第一个词会得到 `Feature`；收集几个实例后再决定
   是否把提示词的约束写得更硬
7. **（可选）英文界面截图** —— 现在 6 张截图都是中文界面，英文 README 复用同一套。
   等实机把 dsh 切成英文，可以补一套英文图并换进 `README.md`（`screenshots.json` 是市场
   截图清单，两份 README 共用，换图时要一起看）

> 发版流程照旧：`npm run build`（改了 `src/` 才需要）→ 提交（含 `lib/`）→
> 打同名 tag 并推送 → `npm publish`。两条通道的版本号要保持一致。

---

## 维护说明

**如何更新此文档**：
1. 每完成一个步骤，将对应行的状态从 `⏳` 改为 `🔄` 或 `✅`
2. 填写完成时间（如适用）
3. 如有新问题或阻塞，在对应步骤后添加 `❌` 并备注说明
4. 定期更新"当前状态总结"和"总进度"

**建议**：此文档应与代码一起提交到 Git，作为项目文档的一部分。
