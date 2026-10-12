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

以下路径固定槽位本项目暂不适用，设计类内容原散存在根目录 `DEVELOPMENT.md`（已于文档体系升级时退役删除），待后续抽取至 `docs/design/`：

- 运行逻辑 `docs/design/architecture.md`
- 功能总索引 `docs/design/features.md`
- 各功能 `docs/design/features/`
- 外部事实 `docs/design/external/`（上游 dsh API 行为等）
- 数据库说明 / 样式规范 / 方法规范（本项目无对应内容）

## 历史进度快照

根目录 `DEVELOPMENT.md` 原为文档体系升级前的开发进度追踪文档（v0.1.0–v0.8.1 版本记录 +
阶段计划 + 待办），已于升级时**退役删除**（内容仍留 git 历史）。其版本记录经 `koc-code-doc-progress`
skill 的 `import` 迁入 `docs/progress.json` + `docs/PROGRESS-HISTORY.md` + `docs/worklog/`，任务进度现由
这三处承载。
