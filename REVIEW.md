# 代码审查报告

> 审查对象：`@cq-guojia/dsh-session-title-pattern` v0.1.0
> 审查时间：2026-09-13
> 对照基准：DeepSeek Harness 官方文档 + `deepseek-ai/deepseek-harness` master 源码

---

## 0. 结论速览

| 分类 | 数量 | 状态 |
|------|------|------|
| P0 功能性 / 契约性缺陷 | 12 | 已全部修复（v0.1.1） |
| P1 构建 / 打包缺陷 | 4 | 已全部修复（v0.1.1） |
| P2 设计层面的改进项 | 6 | 本轮不做，方案见第 3 节 |

最严重的是 **#1（与内置 LLM 标题插件冲突）**：不手动禁用 `session-title-llm` 时插件直接报错，属于「装了就用不了」级别。
其次是 **#2（字节上限越界）**：属于静默错误，配置了却不生效，且没有任何报错提示。

---

## 1. P0 功能性 / 契约性缺陷

### #1 与内置 LLM 标题插件冲突，必须手动禁用

**现象**：不禁用 `session-title-llm` 就报错。

**根因**：`packages/bundle/base/cordis.patch.yml` 默认启用

```yaml
- id: session-title-llm
  name: '@deepseek-ai/dsh-session-title-first-prompt-llm'
```

而 `SessionTitleService.register()` 是**全局单例**：

```ts
register(provider: SessionTitleProvider): () => Promise<void> {
  this.validateProvider(provider)
  if (this.registration !== undefined) {
    throw new Error(`session-title provider "${this.registration.provider.id}" is already registered`)
  }
  ...
}
```

**修复（两层）**：

1. bundle patch 自动禁用。层叠顺序是「各 bundle 层（dsh-base 先，其后按 `dsh.profile.bundles` 顺序）→ profile 的 `cordis.patch.yml` → `$DSH_HOME/cordis.patch.yml` → `--patch`」，后层可按 `id` 覆盖前层。官方 `dsh-web-app` 层正是用 `- id: tool-bash / disabled: true` 关掉 base 的行，所以这是官方支持的方式：

   ```yaml
   - id: session-title-llm
     disabled: true
   ```

2. `apply()` 内 try/catch 兜底。patch 只在「我们的包排在 `dsh-base` 之后」时有效；若有人手工调整 bundles 顺序，或将来另有插件抢先注册，仍会冲突。**异常绝不能冒泡**——`apply()` 抛错会让插件 fiber 失败，进而拖垮 dsh 启动。改为捕获后 `ctx.logger(name).warn(...)` 并正常返回，插件退化为「不提供标题」，dsh 继续用内置 fallback。

**残留限制**：`register()` 是单例，因此本插件与 LLM 标题插件**本质互斥**，用户只能二选一。这是上游设计，无法绕过。

### #2 `maxBytes: 120` 超过服务硬上限 80

**现象**：配置写了 120，实际标题最长仍是 80 字节，主题在尾部被静默砍掉，无任何告警。

**根因**：`packages/bundle/base/cordis.patch.yml`

```yaml
- id: session-title
  name: '@deepseek-ai/dsh-session-title'
  config:
    fallbackMaxWords: 5
    fallbackMaxBytes: 40
    maxTitleBytes: 80
```

服务在 `validateResult()` 里对**任何来源**的标题做二次截断：

```ts
const title = normalizeSessionTitle(candidate.title, this.config.maxTitleBytes)
if (title.length === 0) throw new Error('session-title provider returned an empty title')
```

**修复**：默认值 120 → **80**，并加 `.step(1).min(20)` 让配错时在加载期就响亮失败（符合官方「用 schema 表达约束，让非法配置在加载时失败」的原则）。

**注意**：如果用户调整了 `session-title.maxTitleBytes`，本插件的 `maxBytes` 也要同步调整。已写入 README。

### #3 日期用 UTC，东八区跨天显示错误

```ts
const yy = String(now.getUTCFullYear()).slice(-2)   // ← UTC
```

东八区在 `00:00–08:00` 之间创建的会话，标题日期会显示成**前一天**。

**修复**：改用本地时区 `getFullYear()` / `getMonth()` / `getDate()`，并把 `now` 改为参数注入（`now: Date = new Date()`），方便日后单测。

### #4 UTF-16 code unit 截断会切断代理对

```ts
const clean = raw.replace(/^\/\S+\s*/, '').slice(0, 40)   // ← 按 UTF-16 单元截
```

emoji、部分生僻汉字占 2 个 UTF-16 单元，截在中间会产生半个字符（渲染成乱码或 `�`）。

**修复**：删除这层预截断，字节收口统一交给 `truncateTitleUtf8`——它内部按 `for (const character of input)` 迭代 code point，不会切半。

### #5 主题预算没扣前缀，截断逻辑重复

原逻辑先 `normalizeSessionTitle(clean, config.maxBytes)`（用**总**预算截主题），再拼上 `日期|类型` 后又 `truncateToBytes(pattern, config.maxBytes)` 截一次。主题先被浪费地截过一次。

**修复**：改为先拼 `head = 日期|类型`，整串只做一次 `truncateTitleUtf8`。`head` 恒定极短（6 + 1 + 最多 18 = 25 字节），等价于自动给主题留出了正确预算，且不需要自己算字节。

### #6 兜底分类与 README 不符

```ts
const match = text.match(/[^\s\/\\.,，。！？、]+/)
return match ? match[0].slice(0, 6) : '其他'   // ← 把正文片段塞进「类型」位
```

README 声明兜底是 `其他`，实际返回的是用户消息的首个词（如「帮我看看这个」→ 类型变成「帮我看看这个」）。语义混乱。

**修复**：兜底直接返回 `其他`。

### #7 `cordis.patch.yml` 使用了官方不存在的 row key

```yaml
- id: session-title-pattern
  apply: host        # ← 非法
```

对照 `packages/bundle/base` 与 `packages/bundle/web-app` 两份官方 patch，row 的合法键只有 **`id` / `name` / `config` / `inject` / `disabled`**，没有 `apply`。

**修复**：删除。同时删掉空的 `config: {}`（schema 默认值会生效）。

### #8 `name` 未导出

```ts
const name = 'dsh-session-title-pattern'   // ← 未 export
```

构建产物确认只有 `export { Config, SessionTitlePatternProvider, apply, inject }`。官方插件要求 `export const name`（插件清单、日志、插件清单页都依赖它）。

**修复**：改为 `export const name`。

### #9 重复的类型增强声明存在冲突风险

```ts
interface SessionTitleService {
  register(provider: SessionTitleProvider): () => Promise<void>
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    sessionTitle: SessionTitleService   // ← 与依赖包内的声明冲突
  }
}
```

`@deepseek-ai/dsh-session-title` 内部**已经**声明过同名属性：

```ts
declare module '@deepseek-ai/cordis' {
  interface Context { sessionTitle: SessionTitleService }   // 这里是 Service 类
}
```

两个 `interface Context` 合并后，`sessionTitle` 被声明两次且类型不同（本地 interface 只有 `register`，依赖包的是完整 Service 类），存在 **TS2717「Subsequent property declarations must have the same type」** 风险。

**修复**：整个 `declare module` 块与 `Context & { sessionTitle: ... }` 交集一并删除，直接使用依赖包自带的类型增强。

> 补充：v0.1.0 能构建通过，是因为 tsdown 的 dts 生成环节不做完整类型检查。这属于「暂时没炸」而非「没问题」。

### #10 `z.infer` 非官方写法

```ts
export type Config = z.infer<typeof Config>
```

官方文档与上游源码都没有这个用法。上游 `SessionTitleService` 的写法是：

```ts
static Config: z<Config> = z.object({ ... })
```

**修复**：改为官方同款 `export interface Config {...}` + `export const Config: z<Config> = z.object({...})`。

### #11 斜杠命令消息退化

`/compact` 这类消息，剥离命令后主题为空，原逻辑 `|| type` 会退化成 `0913｜指令｜指令`。

**修复**：`stripLeadingCommand(raw) || raw` 回退（剥离后为空就用原文）；主题仍为空时只返回 `日期|类型`，**保证标题永远非空**——服务会抛 `session-title provider returned an empty title`。

### #12 重复实现字节截断

自实现的 `truncateToBytes` 与包已导出的 `truncateTitleUtf8` 功能重复，且前者逐 code point 调 `new TextEncoder().encode(cp)`，比后者（`Buffer.byteLength`）慢得多。

**修复**：删除自实现，改用 `truncateTitleUtf8`。

---

## 2. P1 构建 / 打包缺陷

### #13 两个 tsdown 配置的 `clean` 互相打架

host 的 `outDir` 是整个 `lib`，`clean: true` 会连带清掉 `lib/client`；client 也是 `clean: true`。构建顺序敏感，且单独跑任一配置都可能留下不完整产物。

**修复**：host 保持 `clean: true`，client 改 `clean: false`，并由 `scripts.build` 固化「先 host 后 client」。

### #14 client 产物发不出去

`exports` 没有 `./client`，`files` 也不含 `lib/client`——即使构建了也进不了发布包。

**修复**：补 `exports["./client"]`，`files` 改为 `["lib", "cordis.patch.yml", "README.md"]`。

### #15 完全没有 `scripts`

没有 `build` 入口，只能手工拼 `npx tsdown --config ...`。由于 `lib/` 是提交进 git 的（dsh 加载的是产物不是源码），**改完 `src/` 必须重新构建并一起提交**，否则改动不生效。

**修复**：加 `build` / `build:host` / `build:client` / `typecheck` / `prepublishOnly`。

### #16 文档与包名不一致

README 标题写 `@deepseek-ai/dsh-session-title-pattern`，`package.json` 是 `@cq-guojia/dsh-session-title-pattern`；且缺安装后行为说明、`maxBytes` 上限说明。

**修复**：重写 README。

---

## 3. P2 未来优化项（含方案）

### 3.1 分类规则重构 —— 当前方案不可接受

**现状问题**：顺序敏感的 if-else，**先命中先赢**。

```ts
if (/查询|search|fetch|获取|read|什么|如何|为什么|怎么|哪/.test(text)) return '查询'
if (/创建|新增|insert|add|write|生成|写|做|建|弄/.test(text)) return '创建'
```

四类硬伤：

1. **语义上错的**：「查一下接口文档并修复」会命中 `查询`（因为 `查询` 规则在前），但用户真实意图是 `修复`。
2. **单字关键词子串误命中**：`改` 会命中「改个错别字」也会命中「这篇文章改得不错」；`去` 命中「去年」；`清` 命中「清楚」；`做` 命中「做法」；`错` 命中「错觉」。这些单字在中文里出现频率极高，误判率很大。
3. **无法表达权重**：整条消息被平等看待，体现不出「句首动词比句中名词更重要」。
4. **不可配置**：用户想加一个自己的类型标签必须改代码。

**推荐方案：规则表 + 最长匹配 + 加权打分**

```
1) 声明式规则表
   TypeRule { tag, keywords[], weight?, priority? }
   关键词按长度降序排序，作为默认规则内置；同时下沉为 Config.rules，
   用户可在 cordis.patch.yml 覆盖，无需改代码。

2) 最长匹配优先 + 消费命中子串
   扫描时优先匹配最长关键词，命中后把该子串从文本中「消费」掉。
   → 从根上消除「改」命中「修改」的问题（先匹配到「修改」并消费）。
   → 也消除「去」命中「去年」（若「去年」在停用/更长词表里）。

3) 分句加权
   按 ，。；！？\n 拆句，首句权重最高（×3），后续句递减（×1）。
   每句内命中累加到对应 tag 的分数。
   → 「查一下接口文档并修复」中 接口(创建/接口) 与 修复 都能计分，由总分决出。

4) 位置加权
   句首 12 字符内命中 ×2（动词通常在句首）；
   「帮我 / 请 / 麻烦」后的首个动词额外 ×1.5。

5) 否定词降权
   命中前有「不是 / 不要 / 别 / 无需」时该命中 ×0.2。

6) 同分 tie-break：按规则表声明顺序取先者；全无命中 → Config.defaultType（默认「其他」）。

7) 可观测性：debug 级日志输出各 tag 得分与命中词，便于调规则。
```

**成本**：纯函数改造，无外部依赖，可完全用表驱动单测覆盖。

### 3.2 主题提取

- **停用词去除**：「帮我 / 请 / 麻烦 / 一下 / 这个 / 那个」等开头套话。
- **按标点取首个完整短句**，而非定长截断——避免出现半个句子。
- **CJK 与英文分治**：英文按 token（空格），中文按字词。
- 可选：`Config.topicMaxChars` 让用户控制主题长度。

### 3.3 前端能力

> **v0.2.1 已落地「手动生成标题」按钮**。实现过程中确认了两条重要约束，记录下来：
>
> 1. **第三方插件无法新增 Typert Remote**。内置「重命名」走 `ctx.remote.session.rename(...)`，
>    该 Remote 由 dsh 主仓库构建时的 Typert 生成器产出，out-of-tree 插件跑不了生成器。
>    可行替代是复用已存在的 `commands` namespace —— `CommandRuntime.execute` 本身就是 `@Remote`。
> 2. **客户端产物是 CJS 闭包工厂，不是普通 ESM**：`window.__ModuleLoader__.load({ id, factory })`，
>    且存在构建期「纯度闸门」：模块表外的 `@deepseek-ai/*` 值导入会直接让构建失败。
>    可用 external 只有 `PLATFORM_MODULES` 那 9 个，`ui-session` / `ui-conversation` 只能 type-only 导入。

用户已明确的需求及落地路径：

| 需求 | 落地方式 |
|------|----------|
| **自定义标题格式** | 新增 `Config.template`（如 `{{date}}|{{type}}|{{topic}}`），host 端渲染；client 侧做设置卡片实时预览。参考官方文档 `/reference/cookbook/adding-a-settings-card` |
| **选择生成模型** | 两条路：① 新增 `Config.strategy`（`pattern` / `llm`），host 端内部分流；② 拆成两个独立 provider 包。小模型跑标题可直接复用 `@deepseek-ai/dsh-session-title-first-prompt-llm` 的既有能力 |
| **手动刷新按钮**（在「修改标题」弹窗加「自动生成」） | client 模块通过 slots / 右侧 Sidebar 机制挂载（`/reference/subsystems/slots`、`/reference/subsystems/sidebar-right`）；按钮调 host 端暴露的 RPC，内部调 `ctx.sessionTitle.refresh(session, signal)` |
| **N 条对话后重算标题** | `automatic` 改为 `'all-prompts'` + 新增 `Config.recomputeEveryN` 在 provider 内自行计数节流。⚠️ 该模式下**每条**人类消息都会调度一次，必须自己做节流，否则每个 turn 都重算 |

**开启前端的前置条件**（三条必须同时满足，缺一会炸启动）：

1. `package.json` 补 `dsh.client: { platform: 'web' }`
2. `src/client/index.ts` 导出真实客户端插件，产物经 `exports["./client"]` 提供（**v0.1.1 已备好出口**）
3. `cordis.patch.yml` 增列浏览器 row，并把需要的 RPC 挂到 Typert Remote

> ⚠️ 官方文档明确：声明了 `dsh.client` 但产物缺失，激活期会聚合为 `AggregateError` 并让 fiber **FAILED**。所以必须先有真实产物再开声明。

### 3.4 单元测试

`classifyMessage` / `buildTitle` / 截断都是纯函数，极易表驱动覆盖。建议 vitest，重点用例：

- 分类：`查询` / `修复` 混合句、单字误命中（`去年`、`清楚`、`做法`、`错觉`）
- 截断：emoji 边界、超长输入、纯控制字符（会被 `normalizeSessionTitle` 清空）
- 边界：空消息、`/compact` 裸命令、`maxBytes` 极小值

### 3.5 `request.signal` 接入

当前 `generate()` 是同步纯计算，不消费 `signal` 无影响。**但一旦接入模型调用（3.3 的 LLM 策略）就必须处理**，否则取消/超时无法传导。

需注意 `tsconfig.json` 的 `"types": []` 可能导致 `AbortSignal` 全局类型缺失，接入时要一并处理。

### 3.6 其他

- **多语言 / 英文标题**：目前关键词表和类型标签都是中文。
- **`automatic: 'first-prompt'` 的边界**：源码的触发条件是「非 fork 子会话 且 是第 1 条人类消息 且 尚无标题」，**fork 出来的子会话永远不会被自动命名**。这是上游设计，若需要子会话标题，得改用 `all-prompts`。
- **标题二次写入**：服务在调 provider 前会先 `ensureFallback`（前 5 词 / 40 字节），所以标题会**先显示 fallback 再被我们的结果覆盖**。这是上游设计，不是 bug，但要知道 UI 上可能有一次跳变。

---

## 4. 发版检查清单

由于 `lib/` 是提交进 git 的（dsh 加载产物不编译 TS），发版前必须：

```bash
npm install
npm run build          # 先 host 后 client
git add -A
git commit
```

确认项：

- [ ] `lib/index.mjs` 已重新生成（否则改动不生效）
- [ ] 产物导出了 `name`
- [ ] `lib/client/index.js` 存在
- [ ] 在 dsh 机器上 `dsh --profile web --dump-config` 能看到本插件层，且 `session-title-llm` 行为 `disabled`
- [ ] 新建会话发一条消息，标题形如 `0913｜接口｜登录接口鉴权`，且主题没被截断
