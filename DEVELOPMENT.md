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

## 当前版本：v0.5.21

### v0.5.21（本次）

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
