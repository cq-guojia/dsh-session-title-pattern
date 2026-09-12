# @cq-guojia/dsh-session-title-pattern

DeepSeek Harness 会话标题插件：用确定性规则把首条人类消息格式化成 `YYMMDD|类型|主题`。
不调用模型、零 token 开销、零网络依赖。

## 标题格式

```
YYMMDD|类型|主题
```

示例：`260913|接口|登录接口鉴权`

- **日期** —— 会话创建时的**本地**日期，6 位 `YYMMDD`
- **类型** —— 按首条消息关键词分类，见[分类规则](#分类规则)
- **主题** —— 首条消息正文（剥离开头的斜杠命令后），按剩余字节预算截断

## 安装

```bash
dsh plugin --profile web add /path/to/dsh-session-title-pattern
```

安装后**无需任何额外配置**。

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

在 profile 的 `cordis.patch.yml` 里按 id 覆盖：

```yaml
- id: session-title-pattern
  config:
    separator: '-'
    maxBytes: 60
```

| 键 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `separator` | string | `\|` | 各段之间的分隔符 |
| `maxBytes` | number | `80` | 标题总长度上限（UTF-8 字节），最小 20 |

> ⚠️ **`maxBytes` 必须 ≤ `session-title` 行的 `maxTitleBytes`**（`dsh-base` 默认为 **80**）。
> 服务在写入前会按该值二次截断，超出部分被**静默丢弃**，不会有任何报错。
> 如果你调整了 `session-title.maxTitleBytes`，这里要同步调整。

## 分类规则

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

## 已知限制

- **fork 出的子会话不会自动命名**。`first-prompt` 的触发条件要求「非 fork 会话 且 是第一条人类消息 且 尚无标题」。
- **只有首条人类消息参与生成**，后续对话不会重算标题。
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
