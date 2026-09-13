# @cq-guojia/dsh-session-title-pattern

DeepSeek Harness 会话标题插件：用确定性规则把首条人类消息格式化成 `MMDD｜类型｜主题`。
不调用模型、零 token 开销、零网络依赖。

## 标题格式

```
MMDD｜类型｜主题
```

示例：`0913｜接口｜登录接口鉴权`

- **日期** —— 本机**本地**日期，4 位 `MMDD`，由插件本地生成
- **类型** —— 两个汉字，概括这段会话在做什么
- **主题** —— 对**整段对话**的凝练，提炼关键词

默认走 [LLM 模式](#llm-模式)：类型与主题由模型根据整段对话总结，首条消息先生成一次，之后每 5 条对话滚动重算。把 `mode` 设为 `rules` 可切回**零 token** 的关键词规则版本（类型与主题都只取自首条消息）。

## 安装

```bash
dsh plugin --profile web add github:cq-guojia/dsh-session-title-pattern
```

安装后**无需任何额外配置**。

### 关于版本锁定（重要）

git 安装有两种写法，行为差别很大：

| 写法 | 行为 |
| --- | --- |
| `github:cq-guojia/dsh-session-title-pattern` | 跟踪 `main` 分支，点「更新」会升级到最新 |
| `github:cq-guojia/dsh-session-title-pattern#v0.2.3` | **钉死在 v0.2.3**，点「更新」永远不会有变化 |

⚠️ 用 `#tag` 安装后，dsh-market / `dsh plugin update` 会按记录下来的 spec 重装，
结果版本纹丝不动（命令返回成功但版本未变）。要升级必须重新 `add` 并指定新 tag。

需要确定性时用 tag，需要能自动升级时不要带 tag。

### 与内置 LLM 标题插件的关系

`dsh-base` 默认启用 `session-title-llm`（用模型生成标题），而 `SessionTitleService`
**全局只允许注册一个 provider**，两者同时存在会直接报错。

本插件的 bundle patch 已自动禁用它：

```yaml
- id: session-title-llm
  disabled: true
```

所以你不需要手动改配置。**注意两者本质互斥，只能二选一。**

若想恢复 LLM 标题，在自己的 profile `cordis.patch.yml`（更靠后的层）写：

```yaml
- id: session-title-llm
  disabled: false
```

此时本插件会注册失败并降级为不提供标题——**不会拖垮 dsh 启动**，只会 warn 一条日志。

## 配置

两种方式，效果一样，可混用。

### 1. 设置界面（推荐）

打开 dsh 的「**设置 → 插件**」，找到本插件的卡片（默认**收起**，点标题行展开；有未保存的
改动时标题行会显示「未保存」）：

| 分组 | 项 |
| --- | --- |
| 常显 | **用模型总结标题**（开关，关掉即回到零 token 的关键词规则）、**重算间隔** |
| 模型（默认折叠） | provider、model（**都是下拉选择**，且**只列出你已配置且可用的供应商**）、超时、输出上限 |
| 标题格式（默认折叠） | 分隔符、标题长度上限 |

改动是**暂存**的：改完点「保存」才写入。每个字段会标出是否**已覆盖**，可以单字段「恢复默认」，
也可以整体「重置为默认值」（它把各字段填回默认值，点保存后才一并写回）。

> 「已覆盖」的判定是「与你写的值**不等于**默认值」：填了一个恰好等于默认值的数，
> 保存时不会往用户层记一笔，等于没改。

> provider 与 model 必须**成对**填写。只填一个时保存会被拒绝并提示（这是 schema 表达不了的
> 跨字段约束，由 host 侧校验）。

### 2. profile 的 `cordis.patch.yml`

适合脚本化或批量部署：

```yaml
- id: session-title-pattern
  config:
    mode: llm
    retitleEvery: 5
    separator: '｜'
    maxBytes: 80
```

| 键 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `mode` | `llm` \| `rules` | `llm` | `llm` 由模型总结类型与主题；`rules` 走零 token 的关键词规则 |
| `retitleEvery` | number | `5` | 每多少条人类消息重算一次标题（仅 LLM 模式），最小 1 |
| `provider` | string | 空 | 指定模型 provider，**必须与 `model` 成对**；留空则跟随会话主模型 |
| `model` | string | 空 | 指定模型 id，**必须与 `provider` 成对** |
| `timeoutMs` | number | `15000` | 单次模型调用超时（毫秒） |
| `maxOutputTokens` | number | `64` | 单次调用输出 token 上限 |
| `maxInputBytes` | number | `4096` | 单次调用输入字节上限（滚动摘要的硬预算） |
| `separator` | string | `｜`（全角竖线） | 各段之间的分隔符 |
| `maxBytes` | number | `80` | 标题总长度上限（UTF-8 字节），最小 20 |

> 默认分隔符是全角竖线 `｜`（U+FF5C），占 3 个 UTF-8 字节。

> ⚠️ **`maxBytes` 必须 ≤ `session-title` 行的 `maxTitleBytes`**（`dsh-base` 默认为 **80**）。
> 服务在写入前会按该值二次截断，超出部分被**静默丢弃**，不会有任何报错。
> 如果你调整了 `session-title.maxTitleBytes`，这里要同步调整。

> **两层优先级**：解析顺序是 `schema 默认值 → 组合层（本节） → 用户层（设置界面）`。
> 也就是说界面里改过的字段，改 `cordis.patch.yml` 不会生效，除非先在界面上「恢复默认」。
>
> **兼容性**：设置卡片依赖 dsh 自带的设置界面（`@deepseek-ai/dsh-client-ui-settings*`），
> 本插件的 `dsh.client.inject` 声明了它们。如果你的 dsh 版本没有这些包，客户端部分会一直
> pending 并**导致启动失败** —— 这种情况请用 v0.3.2。

## LLM 模式

默认开启。类型与主题由模型总结，**一次调用同时产出两者**。

### 什么时候调用模型

- **第 1 条消息** —— 由 dsh 自身的自动调度生成
- **之后每 `retitleEvery` 条**（默认 5）—— 由本插件按轮次显式触发一次重算
- 其余轮次**完全不调用模型**，标题保持不变

> 只处理**顶层会话**。fork 出的子会话（子代理）不做自动命名、也不参与重算，
> 否则每次 fork 都要多付一次模型调用。

### 成本为什么恒定

关键在于**滚动摘要**。每次重算只发固定三段：

```
① 首条消息（截断到 200 字节）  ← 锚住会话最初的目标，防止多轮压缩后主题漂移
② 上次摘要（一行）             ← 携带历史脉络
③ 上次之后的新增人类消息        ← 正常情况下就是「每 N 轮」那么多条
```

② 里的「摘要」不是额外生成的东西 —— **它就是模型上一次输出的那一行**（既是标题，也是下一次的输入）。
所以早期对话的原文只会向前压缩，**永远不会被重新发送**。

输入大小与会话聊了多久无关：每 5 轮大约 300 token 输入 + 最多 64 token 输出；聊到 100 轮也就是三四万 token。

### 失败时怎么办

超时、模型报错、没有可用模型路由……**一律保留上一次的标题，不覆盖**，日志里记一条 `warn`。

首轮就失败时没有可保留的标题，此时 dsh 的内置 fallback 会顶上（首条消息的前 5 个词 / 40 字节）。

### 用哪个模型

默认**跟随会话当前的主模型**（取自会话记录的主请求路由），零配置即可使用。
想用便宜的小模型跑标题，就把 `provider` 与 `model` 一起填上：

```yaml
- id: session-title-pattern
  config:
    mode: llm
    provider: <provider-id>
    model: <model-id>
```

⚠️ 两项**必须成对**。只填一个会被忽略并 warn，然后回落到跟随主模型。

### 想省钱或关掉

```yaml
- id: session-title-pattern
  config:
    mode: rules
```

`rules` 模式完全不调用模型，回到关键词分类 + 首条消息主题，见[分类规则](#分类规则)。

## 手动生成标题

两种方式，底层是同一个 `/retitle` 命令：

**1. 头部按钮** —— **标题右侧第一个**位置有个铅笔图标，鼠标悬停会出现气泡提示「生成标题」。
会话正在生成回答时按钮会禁用；此时悬停显示原生提示说明原因（禁用元素不派发鼠标事件，气泡不会出现）。

> 位置说明：用的是 `conversation.session.header.actions`。上游头部结构是
> `titleCluster > (crumbs, headerActions)`，这一组紧贴标题；注册时给一个很小的负数 `order`，
> 保证排在所有占用者之前，即标题右边第一个 —— 内置的「标准模式」指示器在它右侧，
> 其他插件后挂的条目也都在右边。
>
> 另外，dsh 的 slots 系统只在「会话头部 / 输入区 / 侧边栏框架」这些扩展位开放挂载。
> 会话列表每一行的三点菜单（重命名 / 分叉 / 归档）和重命名对话框都是封闭组件、没有 slot，
> 第三方插件无法往里加菜单项。

**2. 直接敲命令** —— 在输入框输入 `/retitle` 回车。

自动命名只在「非 fork 子会话 且 是第一条人类消息 且 尚无标题」时触发，所以手动入口是后续改标题的唯一方式。

> 手动重命名过的会话会进入「已固定」状态，自动命名随之停止调度。
> `/retitle` 是解除固定、让规则重新接管的唯一途径。

## 标题显示宽度

dsh 头部把会话标题渲染成**面包屑的最后一段**，上游样式给它写死了 `max-width:220px`：

```css
.wSkVaW_crumb { max-width:220px; padding:4px 8px; overflow:hidden;
                text-overflow:ellipsis; white-space:nowrap; font-size:14px; line-height:20px }
```

`220 − 16(左右内边距) = 204px` 可用，而 `MMDD｜类型` 前缀就吃掉约 94px —— 留给主题的约 110px，
14px 字号下就是**七八个中文字**。这跟窗口大小无关，屏幕再大也一样。

本插件在客户端激活时**自动注入**一条覆盖规则，无需你配置任何东西：

```css
[class*="_crumbCurrent"]{max-width:min(640px, 60vw) !important;}
```

- 只放宽**当前会话标题**这一个面包屑；祖先会话与子代理的面包屑保持 220px
- `640px` 是按标题上限 80 字节（约 40 个中文，约 560px）留的余量
- `60vw` 兜住窄窗口；宽度真不够时靠 `.crumb` 自带的 `overflow:hidden` 自动收缩省略，不会溢出

> 为什么不能用插件槽位做：标题元素由上游无条件原生渲染，`conversation.session.header.lineage`
> 这个槽位只能在其**后面**追加节点，无法替换它。详见 [DEVELOPMENT.md](./DEVELOPMENT.md)。

### 没生效时怎么排查

这条规则靠 CSS Modules 生成的类名后缀 `_crumbCurrent` 命中。上游若重命名该类名，规则会
**静默失效** —— 不报错、不崩溃，只是标题又变短。

DevTools 选中标题元素，检查：

1. `class` 属性里是否还有 `_crumbCurrent`
2. Computed 面板的 `max-width` 是否为 `640px`（宽屏）或 `60vw` 对应值

如果类名变了，把新的完整 class 字符串反馈即可。

## 分类规则

**只在 `rules` 模式下决定类型**。在默认的 `llm` 模式下，模型给出的类型优先；
只有模型没按 `类型|主题` 格式输出时，才回退到这里。

按**顺序**匹配，先命中先赢；全部未命中则为 `其他`。

| 顺序 | 类型 | 关键词 |
| --- | --- | --- |
| 1 | `指令` | `/` 开头、command、指令、命令 |
| 2 | `鉴权` | 登录、鉴权、auth、login、oauth |
| 3 | `接口` | 接口、api、endpoint、路由 |
| 4 | `查询` | 查询、search、fetch、获取、read、什么、如何、为什么、怎么、哪 |
| 5 | `创建` | 创建、新增、insert、add、write、生成、写、做、建、弄 |
| 6 | `更新` | 更新、修改、update、edit、patch、改、调整、变、换 |
| 7 | `删除` | 删除、delete、remove、drop、删、移除、去、清 |
| 8 | `测试` | 测试、test、单测、集成、验证、检查、跑 |
| 9 | `配置` | 配置、config、setup、设置、装、部署 |
| 10 | `修复` | 错误、bug、异常、fix、报错、问题、错、故障 |
| 11 | `文档` | 文档、doc、readme、说明、帮助、教程 |
| — | `其他` | 兜底 |

### 客户端按钮导致启动失败时的自救

从 v0.2.1 起本插件带浏览器端代码（package.json 中的 `dsh.client`）。若产物与你的 dsh
版本不兼容，dsh 会启动失败。两种恢复方式：

1. **只关掉本插件** —— 在 profile 的 `cordis.patch.yml` 里写：

   ```yaml
   - id: session-title-pattern
     disabled: true
   ```

2. **回退到纯命令版** —— v0.2.0 只有 host 端命令，没有浏览器代码：

   ```bash
   dsh plugin --profile web add git+https://github.com/cq-guojia/dsh-session-title-pattern.git#v0.2.0
   ```

## 已知限制

- **fork 出的子会话不会自动命名**。`first-prompt` 的触发条件要求「非 fork 会话 且 是第一条人类消息 且 尚无标题」。
- **模型总结会有损**：早期对话会被压缩进一行摘要，细节可能丢失（这是成本恒定的代价）。
- `rules` 模式下**只看首条人类消息**，后续对话不参与，也不会重算标题。
- **分类是顺序敏感的规则匹配**，「查一下接口文档并修复」会命中 `查询` 而非 `修复`；单字关键词（`改`/`去`/`清`/`做`）存在误判。重构方案见 [REVIEW.md](./REVIEW.md#31-分类规则重构--当前方案不可接受)。
- **标题会被写入两次**：服务先写入内置 fallback（前 5 个词），再被本插件的结果覆盖。这是上游设计，UI 上可能看到一次标题跳变。
- **仅有中文分类词表**，英文消息也能匹配英文关键词，但类型标签仍是中文。

## 开发

```bash
npm install
npm run build        # 先构建 host 再构建 client
npm run typecheck
```

> **`lib/` 是提交进 git 的构建产物** —— dsh 加载的是 `package.json` 的 `main`（`lib/index.mjs`），
> 运行时不编译 TypeScript。改完 `src/` 必须重新 `npm run build` 并把 `lib/` 一起提交，否则改动不会生效。

## 相关文档

- [REVIEW.md](./REVIEW.md) —— 代码审查报告：16 项缺陷的根因与修复，以及分类规则重构、前端能力等未来优化方案
- [DEVELOPMENT.md](./DEVELOPMENT.md) —— 开发进度追踪

## 许可证

MIT
