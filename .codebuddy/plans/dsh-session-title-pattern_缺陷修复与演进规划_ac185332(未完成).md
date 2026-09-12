---
name: dsh-session-title-pattern 缺陷修复与演进规划
overview: 修复 dsh 会话标题插件当前存在的 12 项功能性/契约性缺陷（核心是与内置 LLM 标题插件的单例冲突、标题字节上限越界、时区与截断错误），整理构建打包链路，并给出分类规则与前端能力的未来演进方案。
todos:
  - id: fix-patch
    content: 修复 cordis.patch.yml：按 id 禁用 session-title-llm，删除非法 apply 键
    status: completed
  - id: fix-host
    content: 重写 src/host/index.ts：注册兜底、时区、80 字节对齐、字节安全截断、类型声明清理
    status: completed
  - id: fix-build
    content: 修复构建链路：package.json scripts/exports/files、tsdown clean 顺序、tsconfig
    status: completed
    dependencies:
      - fix-host
  - id: write-review
    content: 编写 REVIEW.md 审查报告，含缺陷清单与分类规则重构、前端能力方案
    status: completed
    dependencies:
      - fix-host
      - fix-build
  - id: update-docs
    content: 重写 README.md 并更新 DEVELOPMENT.md 进度
    status: completed
    dependencies:
      - fix-patch
      - fix-host
      - fix-build
  - id: verify
    content: 安装依赖后跑 typecheck、构建，并用 dsh --dump-config 与新建会话冒烟验证
    status: cancelled
    dependencies:
      - fix-patch
      - fix-host
      - fix-build
---

## 产品概述

`@cq-guojia/dsh-session-title-pattern` 是 DeepSeek Harness（DSH）的一个会话标题插件，用确定性规则把会话首条人类消息格式化成 `YYMMDD|类型|主题` 形式的标题，替代依赖模型调用的标题生成。

## 核心需求

1. **消除安装时的手工配置负担**：当前用户必须在自己的 profile 里手动写 `- id: session-title-llm / disabled: true`，否则插件报错。需要插件自身解决，开箱即用。
2. **全面代码审查**：通读项目，产出一份详细文档，明确列出当前代码存在的 bug（含根因与证据）与可改进项。
3. **本轮修复 bug 并整理构建链路**，不改算法、不加测试。
4. **保留 client 端**（未来要做前端能力），但需修好构建与导出链路，且当前阶段不能让 client 产物影响启动。
5. **未来优化项要给出具体解决方案**（尤其是分类规则），而不是只列问题。

## 已确认的范围边界

- 标题字节上限：对齐服务侧 `maxTitleBytes: 80`，`Config.maxBytes` 默认值改为 80，不侵入 `session-title` 行。
- 冲突处理：bundle patch 自动禁用 `session-title-llm` + `apply()` 内 try/catch 兜底告警，任何情况下不拖垮启动。
- 本轮不写单元测试、不重构分类算法；两者均写入未来优化章节。

## 技术栈

- 语言/运行时：TypeScript（target ES2022）、Node 20、ESM
- 插件框架：`@deepseek-ai/cordis` ^4.0.2（函数式插件 + `ctx.effect` 副作用管理）
- 能力契约：`@deepseek-ai/dsh-session-title` ^0.1.5-rc.2（`SessionTitleProvider` / `SessionTitleProviderId` / `normalizeSessionTitle` / `truncateTitleUtf8`）
- 配置校验：`@deepseek-ai/schemastery` ^3.18.2
- 构建：tsdown（host 端 node 平台 + client 端 browser 平台，双 config）
- 分发：npm bundle + `dsh.bundle.patch` 声明，`dsh plugin --profile <name> add <path>` 安装

## 根因分析（均已在官方文档 / 上游源码中核实）

### 问题 1：必须手动禁用 `session-title-llm`

`packages/bundle/base/cordis.patch.yml` 默认启用：

```
- id: session-title-llm
  name: '@deepseek-ai/dsh-session-title-first-prompt-llm'
```

而 `SessionTitleService.register()` 是**全局单例**，第二次注册直接抛 `session-title provider "X" is already registered`。我们的 `apply()` 因此失败。

修复依据：官方文档「Package and install」明确说明层的叠加顺序为「各 bundle 层（dsh-base 先，其后按添加顺序）→ profile 的 cordis.patch.yml → $DSH_HOME/cordis.patch.yml → --patch 覆盖层」，**后层可按 id 覆盖前层**。官方 `packages/bundle/web-app/cordis.patch.yml` 正是用 `- id: tool-bash\n  disabled: true` 关闭 base 的行。所以我们的 bundle patch 完全可以自己关掉它。

### 问题 2：`maxBytes: 120` 越界

`packages/bundle/base/cordis.patch.yml`：

```
- id: session-title
  config:
    fallbackMaxWords: 5
    fallbackMaxBytes: 40
    maxTitleBytes: 80
```

服务在 `validateResult()` 中执行 `normalizeSessionTitle(candidate.title, this.config.maxTitleBytes)` 二次截断到 80 字节。当前 `maxBytes: 120` 超出的部分会被**静默砍掉**，配置形同虚设，且主题（在尾部）先被截断。

## 实现方案

### 整体数据流

```mermaid
flowchart TD
  A[用户首条消息] --> B[session-title 服务]
  B --> C[写 fallback 标题<br/>前 5 词 / 40 字节]
  C --> D[调用已注册的 provider]
  D --> E{本插件 SessionTitlePatternProvider}
  E --> F[classifyMessage 分类]
  E --> G[normalizeSessionTitle 提取主题]
  F --> H[拼接 head = 日期|类型]
  G --> H
  H --> I[truncateTitleUtf8 按 maxBytes 收口]
  I --> J[服务覆写 session/title 事件]
  K[cordis.patch.yml<br/>禁用 session-title-llm] --> B
```

### 修复清单

#### P0 契约 / 功能缺陷

| # | 缺陷 | 修复 |
| --- | --- | --- |
| 1 | 与 `session-title-llm` 单例冲突 | patch 中按 id 禁用；`apply()` 内 try/catch + `ctx.logger.warn` 兜底 |
| 2 | `maxBytes: 120` > 服务上限 80 | 默认改 80，schema 加 `.step(1).min(20)` 让它失败得响亮 |
| 3 | 日期用 UTC（`getUTCFullYear/getUTCMonth/getUTCDate`），东八区 00:00–08:00 显示前一天 | 改本地时区 `getFullYear/getMonth/getDate`，并把 `now` 作为参数注入以便后续可测 |
| 4 | `raw.replace(...).slice(0, 40)` 按 UTF-16 code unit 截断，会切断代理对 | 删除该字符级预截断，完全交给 `normalizeSessionTitle` / `truncateTitleUtf8` 做**字节安全、code point 安全**的截断 |
| 5 | 主题预算未扣除前缀，逻辑重复 | 改为显式 `head = 日期 + 分隔符 + 类型`，先拼全文再用 `truncateTitleUtf8(full, maxBytes)` 收口（head 恒定极短，等价于给主题留出正确预算，且无需自己做字节计算） |
| 6 | `classifyMessage` 兜底返回消息正文首个词（`match[0].slice(0, 6)`），与 README 声明的 `其他` 不符 | 兜底改为 `其他` |
| 7 | `cordis.patch.yml` 的 `apply: host` 是官方不存在的 row key（合法键仅 `id`/`name`/`config`/`inject`/`disabled`） | 删除 |
| 8 | `const name` 未 export，构建产物只导出 `Config, SessionTitlePatternProvider, apply, inject` | 改为 `export const name` |
| 9 | 本地重复 `declare module '@deepseek-ai/cordis'` 声明 `sessionTitle`（本地 interface 仅含 `register`，与依赖包的 Service 类不一致，接口合并有 TS2717 风险）；`Context & { sessionTitle: ... }` 交集冗余 | 全部删除，直接依赖 `dsh-session-title` 自带的类型增强 |
| 10 | `export type Config = z.infer<typeof Config>` 官方无此写法 | 改用上游源码同款：`export interface Config {...}` + `export const Config: z<Config> = z.object({...})` |
| 11 | 斜杠命令消息（如 `/compact`）剥离命令后主题为空，退化成 `260913 | 指令 | 指令` | `stripCommand(raw) |  | raw` 回退；主题仍为空时返回 `head`（`260913 | 指令`），保证永不返回空串（服务会抛 `empty title`） |
| 12 | 自实现 `truncateToBytes` 与包已导出的 `truncateTitleUtf8` 重复 | 删除自实现，改用包导出（内部走 `Buffer.byteLength`，更快且已处理 code point） |


**关于 `request.signal`**：当前 `generate()` 是同步纯计算，不消费 signal 无实际影响；且 `tsconfig.json` 的 `"types": []` 下 `AbortSignal` 全局类型可能缺失。本轮**保持不使用**，记入未来项（一旦接入模型调用必须处理）。

#### P1 构建 / 打包缺陷

| # | 缺陷 | 修复 |
| --- | --- | --- |
| 13 | host 与 client 两个 tsdown config 都 `clean: true`，host 的 outDir 是 `lib`，会把 `lib/client` 一起清掉，构建顺序敏感 | host 保留 `clean: true`，client 改 `clean: false`；`scripts.build` 固定为「先 host 后 client」并在 README 注明 |
| 14 | `exports` 无 `./client`、`files` 不含 `lib/client`，client 产物发不出去 | 补 `exports["./client"]`（types + default）与 `files: ["lib", "cordis.patch.yml", "README.md"]` |
| 15 | package.json 完全没有 `scripts` | 加 `build` / `typecheck` / `prepublishOnly` |
| 16 | README 包名写 `@deepseek-ai/dsh-session-title-pattern`，与 package.json 的 `@cq-guojia/...` 不一致；缺安装后行为说明与 `maxBytes` 上限说明 | 重写 README |


#### 关于 client 端（用户明确要求保留）

按 `/reference/subsystems/client-modules`，**只有声明了 `dsh.client` 的包才会被扫描器建立条目**。因此本轮：

- 保留 `src/client/` 与 `tsdown.client.config.ts`，保留为带说明的占位 stub（`export {}`，外加「如何开启」的注释）
- 只把 `exports["./client"]` 与 `files` 打通，**不声明 `dsh.client`**
—— 理由：官方文档指出「声明了 `dsh.client` 但产物缺失，激活期会聚合为 `AggregateError` 并让 fiber FAILED」，当前无真实客户端代码，声明即等于炸启动

## 架构设计

插件保持单一职责，全部逻辑集中在 host 端一个文件，不引入新的架构模式：

- `Config`：schemastery schema，承载全部可调值（符合官方「不要硬编码可调值」原则）
- 纯函数层：`formatPatternDate` / `classifyMessage` / `buildTitle` —— 无副作用，便于后续加单测
- Provider 层：`SessionTitlePatternProvider implements SessionTitleProvider`
- 装配层：`apply(ctx, config)` —— `inject: ['sessionTitle']` 保证服务就绪，注册包在 `ctx.effect` 内，注册失败降级为 warn

## 目录结构

```
dsh-session-title-pattern/
├── src/
│   ├── host/index.ts              # [MODIFY] 核心逻辑。修复 P0 #2-#12：导出 name、Config 改 z<Config> 形式、maxBytes 默认 80 且 min(20)、
│   │                              #   日期改本地时区且 now 注入、删除 UTF-16 slice 预截断、主题预算与前缀解耦、
│   │                              #   兜底分类改「其他」、斜杠命令回退、改用 truncateTitleUtf8、
│   │                              #   删除本地 declare module 与 Context 交集、apply() 内 try/catch + ctx.logger.warn 兜底
│   └── client/index.ts            # [MODIFY] 保留为占位 stub，扩充注释说明「未来开启前端需补 dsh.client 声明 + 导出 apply」
├── cordis.patch.yml               # [MODIFY] 新增 `- id: session-title-llm / disabled: true`（含原因注释）；
│                                  #   删除非法的 `apply: host` 与冗余的 `config: {}`
├── package.json                   # [MODIFY] 新增 scripts（build/typecheck/prepublishOnly）；
│                                  #   exports 补 `./client`；files 改为 ["lib", "cordis.patch.yml", "README.md"]
├── tsdown.client.config.ts        # [MODIFY] clean 改为 false，避免与 host 的 outDir 冲突
├── tsdown.host.config.ts          # [MODIFY] 保持 clean: true，补充注释说明构建顺序约束
├── tsconfig.json                  # [MODIFY] 显式声明 lib（ES2022），保证 typecheck 可复现
├── README.md                      # [MODIFY] 重写：包名统一、安装步骤、自动禁用 session-title-llm 的行为与恢复方法、
│                                  #   maxBytes 必须与 session-title.maxTitleBytes 对齐、标题格式与分类表、构建方式、已知限制
├── REVIEW.md                      # [NEW] 代码审查报告：P0/P1 缺陷逐条（根因 + 证据 + 修复方案）、
│                                  #   P2 未来优化项（分类规则重构方案、主题提取、前端能力规划、单测策略）
└── DEVELOPMENT.md                 # [MODIFY] 追加 v0.1.1 阶段，记录本次修复清单与验证结果
```

## 关键代码结构

```ts
// src/host/index.ts —— 配置契约（沿用上游 z<Config> 标注写法）
export interface Config {
  /** 标题分隔符 */
  separator: string
  /** 标题总字节上限；必须 <= session-title 行的 maxTitleBytes（base 默认 80） */
  maxBytes: number
}

export const Config: z<Config> = z.object({
  separator: z.string().default('|'),
  maxBytes: z.number().step(1).min(20).default(80),
})
```

```ts
// src/host/index.ts —— 标题拼装（字节安全、无自实现截断）
function buildTitle(
  messages: readonly SessionTitleUserMessage[],
  config: Config,
  now: Date = new Date(),
): string {
  const first = messages[0]
  if (!first) return ''
  const raw = (first.text ?? '').trim()
  const source = stripLeadingCommand(raw) || raw
  const topic = normalizeSessionTitle(source, config.maxBytes)
  const head = `${formatPatternDate(now)}${config.separator}${classifyMessage(raw)}`
  return topic
    ? truncateTitleUtf8(`${head}${config.separator}${topic}`, config.maxBytes)
    : head
}
```

```
# cordis.patch.yml
# SessionTitleService.register() 只允许一个 provider；dsh-base 默认启用
# session-title-llm，若不关掉，本插件注册时会抛错。
- id: session-title-llm
  disabled: true

- insert:
    - id: session-title-pattern
      name: '@cq-guojia/dsh-session-title-pattern'
```

## 实现要点（执行细节）

- **禁用行的边界**：`dsh plugin add` 初始化的 profile 必然以 `@deepseek-ai/dsh-base` 为首个 bundle，因此 `session-title-llm` 行一定存在，按 id 禁用不会指向空行。用户若想恢复 LLM 标题，在自己的 profile `cordis.patch.yml`（后层）写 `disabled: false` 即可，需在 README 说明。
- **try/catch 的语义**：`register()` 抛错时**不能**再抛出去。`apply()` 抛错会让插件 fiber 失败，因此捕获后 `ctx.logger.warn` 并正常返回，插件退化为「不提供标题」，dsh 继续用内置 fallback 标题。
- **不要重新实现字节截断**：`truncateTitleUtf8` / `normalizeSessionTitle` 已由 `dsh-session-title` 导出，且内部用 `Buffer.byteLength`，比逐 code point 调 `TextEncoder` 快得多。
- **`files` 改为 `["lib", ...]` 的副作用**：会把 `*.map` 一并发布。体积可忽略，且便于线上排查，接受。
- **不要动 `automatic`**：保持 `'first-prompt'`。注意其触发条件为「非 fork 子会话 且 是第 1 条人类消息 且 尚无标题」，fork 出的子会话不会自动命名 —— 这是上游设计，属于未来项而非 bug。
- **不要新增配置项**：本轮只修 bug，`separator` / `maxBytes` 保持不变，避免扩大 blast radius。

## 未来优化方案（本轮只写入 REVIEW.md，不实现）

### 分类规则重构（当前顺序敏感 if-else 的替代方案）

问题：先命中先赢；单字关键词（`改`/`去`/`清`/`做`/`错`）子串误命中率高；整条消息平等看待，无法体现「句首动词」的语义权重。

方案 —— **规则表 + 最长匹配 + 加权打分**：

1. 声明式规则表 `TypeRule { tag, keywords, weight?, position? }`，关键词按长度降序排列
2. 匹配时**最长匹配优先并消费已命中的子串**，从根上消除 `改` 命中 `修改` 的问题
3. 按 `，。；！？\n` 拆句，**首句权重最高**，逐句打分累加 —— 「查一下接口文档并修复」中 `接口` 与 `修复` 都能命中，由分数决出
4. 位置加权：句首 12 字符内命中 ×2；「帮我 / 请」后的首个动词 ×1.5
5. 同分按规则表声明顺序 tie-break，兜底 `其他`
6. 规则表下沉为 `Config.rules` + `Config.defaultType`，用户可在 cordis.patch.yml 覆盖，无需改代码
7. 加 debug 日志输出命中词与分数，便于调规则

### 主题提取

停用词去除、按标点取首个完整短句而非定长截断、CJK 与英文分治（英文按 token、中文按字词）。

### 前端能力（用户已明确需要，REVIEW.md 中给出路径）

1. **自定义标题格式模板**：`Config.template` 如 `{{date}}|{{type}}|{{topic}}`，client 侧设置卡片实时预览（参考 `/reference/cookbook/adding-a-settings-card`）
2. **模型选择**：拆出第二个 provider 包（pattern / llm），或 `Config.strategy` 切换；小模型跑标题可复用 `@deepseek-ai/dsh-session-title-first-prompt-llm` 的既有能力
3. **手动刷新按钮**：client 模块通过 slots / 右侧 Sidebar 机制（`/reference/subsystems/slots`、`/reference/subsystems/sidebar-right`）在「修改标题」弹窗加「自动生成」按钮，调用 session-title 的 refresh API Remote
4. **N 条对话后重算**：`automatic: 'all-prompts'` + `recomputeEveryN` 节流（注意该模式下每条人类消息都会调度一次，需在 provider 内自行计数节流）

开启前端的前置条件：package.json 补 `dsh.client: { platform: 'web' }`、`exports["./client"]` 产出真实 bundle（本轮已备好出口）、客户端包名对齐官方 `@deepseek-ai/dsh-client-*` 约定。

### 其他

- 单测：vitest 表驱动覆盖 `classifyMessage` / `buildTitle` / 截断边界（emoji、超长、纯控制字符）
- `request.signal` 接入（接入模型后必须）
- 多语言 / 英文标题

## 验证方式

1. `npm install`
2. `npx tsc --noEmit` —— 确认 `z<Config>`、`ctx.logger.warn`、`truncateTitleUtf8` 等类型可用；若 `tsconfig` 的 `types: []` 导致全局类型缺失，就地调整 `lib`
3. `npm run build` —— 确认 `lib/index.mjs` 与 `lib/client/index.js` 同时存在（验证 clean 顺序问题已解决），并确认产物导出了 `name`
4. `dsh --profile web --dump-config` —— 确认出现本插件层，且 `session-title-llm` 行为 disabled
5. 冒烟：新建会话发一条消息，确认标题为 `YYMMDD|类型|主题` 且未被截掉主题