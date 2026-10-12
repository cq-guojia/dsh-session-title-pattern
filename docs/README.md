# 文档规范（槽位登记表）

本文件只登记本项目文档的**实际落点与差异**；通用规范、命名、生命周期、模板见注入规则与
`koc-code-doc-progress` skill，不在此复述、不引用其点位。

## 槽位登记表

| 槽位 | 落位 | 说明 |
|---|---|---|
| 文档规范 | `docs/README.md`（本文件） | 路径固定 |
| 项目介绍 | `README.md` / `README.zh.md`（根目录） | 规则允许根目录；双语，改一必同步另一 |
| 状态表 | `docs/progress.json` | 路径固定，只由脚本写 |
| 已结案 | `docs/PROGRESS-HISTORY.md` | 路径固定，只由脚本写 |
| 过程叙事 | `docs/worklog/<年月>/<日>-<时分>-<说明>-<随机码>.md` | 路径固定，建档只由脚本 |
| 样例 / 截图 | `docs/images/` | 项目自定（落在 `docs/` 下）；`README.md` 与 `screenshots.json` 共用 |

## 暂未启用（内容待抽取）

以下路径固定槽位本项目暂不适用，设计类内容目前仍散存在根目录 `DEVELOPMENT.md`
（历史开发进度快照，迁移后保留），待后续抽取至 `docs/design/`：

- 运行逻辑 `docs/design/architecture.md`
- 功能总索引 `docs/design/features.md`
- 各功能 `docs/design/features/`
- 外部事实 `docs/design/external/`（上游 dsh API 行为等）
- 数据库说明 / 样式规范 / 方法规范（本项目无对应内容）

## 历史进度快照

根目录 `DEVELOPMENT.md` 是文档体系升级前的开发进度追踪文档（v0.1.0–v0.8.1 版本记录 +
阶段计划 + 待办），于本次升级时**停更并保留作历史证据**，不删除、不改写。任务进度现已由
`docs/progress.json` + `docs/PROGRESS-HISTORY.md` + `docs/worklog/` 承载（经 `koc-code-doc-progress`
skill 的 `import` 从 `DEVELOPMENT.md` 迁来）。
