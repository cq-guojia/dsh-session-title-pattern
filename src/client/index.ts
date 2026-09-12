// 客户端（浏览器）入口占位。
//
// 标题生成目前完全在 Host 端以确定性规则完成，不需要任何浏览器 UI，
// 所以这里暂时是空的。
//
// ── 将来要做前端时，需要同时满足三件事 ────────────────────────────────
//
// 1. package.json 补 `dsh.client` 声明，例如：
//      "dsh": {
//        "bundle": { "patch": "./cordis.patch.yml" },
//        "client": { "platform": "web" }
//      }
//    只有声明了 dsh.client 的包才会被 dsh-client-modules 扫描并建立
//    window.__DSH_BOOT__ 条目（见 docs: /reference/subsystems/client-modules）。
//
// 2. 本文件导出真实的客户端插件（与 Host 端同构的 apply / name / inject），
//    产物经 exports["./client"] 暴露（package.json 已配好）。
//
// 3. cordis.patch.yml 里增列对应的浏览器 row，并把 Host 端需要的 RPC
//    （例如「自动生成标题」）挂到 Typert Remote 上。
//
// ⚠️ 在第 2 步完成前**不要**加 dsh.client 声明：官方明确说明「声明了
//    dsh.client 但产物缺失」会在激活期聚合为 AggregateError 并让 fiber
//    FAILED，等于拖垮整个 dsh 启动。
export {};
