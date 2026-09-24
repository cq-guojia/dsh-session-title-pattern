/**
 * 本插件的界面文案词典（中英双语）。
 *
 * 走平台自带的 locale 服务（`@deepseek-ai/dsh-client-locale` 提供 `ctx.locale`）：
 * - `ctx.locale.register(NS, { zh, en })` 注册词典；**两种内置语言都必须给全**，
 *   少一种就是编译错误（`Record<BuiltInLocaleId, …>`）
 * - 槽位注册项加 `locale: NS` → 框架把 `t` 作为 prop 注入组件，语言切换时自动重渲
 *
 * 字典键由 `LocaleNamespaceMap` 声明合并约束：`zh` / `en` 的键集必须与它完全一致，
 * 缺键或多键都会编译报错 —— 这是「两种语言不会漏翻」的机械保证。
 */
import type {} from '@deepseek-ai/dsh-client-locale/client';

/** 词典命名空间。与设置命名空间同名，便于一眼对上。 */
export const LOCALE_NS = 'session-title-pattern';

/** 本插件渲染的全部文案键。 */
export type SessionTitlePatternLocaleKey =
  // 配置表单（插件详情页）
  | 'retitleEveryLabel'
  | 'retitleEveryHint'
  | 'modelPairLabel'
  | 'followMainModel'
  | 'notInList'
  | 'providerSelectAria'
  | 'modelSelectAria'
  | 'loadingDirectory'
  | 'directoryUnavailable'
  | 'credentialsUnknown'
  | 'pairBlocked'
  | 'providerPlaceholder'
  | 'modelPlaceholder'
  | 'timeoutLabel'
  | 'timeoutHint'
  | 'templateLabel'
  | 'templateHint'
  | 'maxBytesLabel'
  | 'maxBytesHint'
  | 'overridden'
  | 'reset'
  | 'invalidNumber'
  | 'unavailable'
  | 'readOnly'
  | 'save'
  | 'saving'
  | 'saveSuccess'
  | 'saveFailed'
  // 重命名面板
  | 'renameTitle'
  | 'renameDisabledHint'
  | 'renamePlaceholder'
  | 'lockHint'
  | 'lockLabel'
  | 'lockShort'
  | 'cancel'
  | 'autoGenerate'
  | 'generating'
  | 'confirmSave'
  | 'closeAria';

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'session-title-pattern': SessionTitlePatternLocaleKey;
  }
}

/** 简体中文词典。 */
export const zh: Record<SessionTitlePatternLocaleKey, string> = {
  retitleEveryLabel: '每隔几条对话重算一次',
  retitleEveryHint:
    '0 = 只在新建会话时算一次，之后不自动更新（可随时点标题旁的按钮手动重算）',
  modelPairLabel: '标题总结大模型',
  followMainModel: '跟随对话模型',
  notInList: '{id}（不在已配置列表）',
  providerSelectAria: '用哪家的模型总结标题',
  modelSelectAria: '用哪个模型总结标题',
  loadingDirectory: '正在读取模型目录…',
  directoryUnavailable: '未能读取已配置的模型列表（{reason}），这两个框已退回手动输入',
  credentialsUnknown: '列表只按设置文档判断，可能多列出没配好的供应商',
  pairBlocked: '这家下面没有可选模型，请换一家，或先到「模型」设置里给它配上模型',
  providerPlaceholder: '供应商 id，如 deepseek；留空跟随对话模型',
  modelPlaceholder: '模型 id；留空用厂家默认',
  timeoutLabel: '超时',
  timeoutHint: '单次模型调用超时（毫秒）。模型慢的时候（比如免费档在排队）就往大调',
  templateLabel: '标题格式',
  templateHint:
    '占位符：{YYYY} {MM} {DD} {HH} {mm} {ss} {type} {topic}。' +
    '日期部件可任意拼接（如 {MMDD}、{YYYYMMDD}），日期取会话创建时间；' +
    '不写 {type} 就没有分类，不写 {topic} 就没有主题',
  maxBytesLabel: '标题长度上限',
  maxBytesHint: '单位字节，必须 ≤ session-title 的 maxTitleBytes（dsh-base 默认 80）',
  overridden: '自定义',
  reset: '恢复默认',
  invalidNumber: '这里需要一个整数',
  unavailable: '当前连接拿不到这份设置',
  readOnly: '当前连接为进程内模式，配置不会写入 Host 文档',
  save: '保存',
  saving: '保存中…',
  saveSuccess: '已保存',
  saveFailed: '保存未落地，Host 拒绝了这次写入（草稿已保留，可修改后重试）',
  renameTitle: '重命名会话',
  renameDisabledHint: '会话回复中，暂不能重命名',
  renamePlaceholder: '输入新的会话标题',
  lockHint: '锁定后，标题不会随对话轮数自动更新；解除锁定即恢复自动更新（标题文字保持不变）',
  lockLabel: '锁定标题',
  lockShort: '锁定',
  cancel: '取消',
  autoGenerate: '自动生成',
  generating: '生成中…',
  confirmSave: '确定保存',
  closeAria: '关闭',
};

/** English dictionary. */
export const en: Record<SessionTitlePatternLocaleKey, string> = {
  retitleEveryLabel: 'Recompute every N messages',
  retitleEveryHint:
    '0 = compute once when the session is created and never again automatically ' +
    '(use the button next to the title any time to recompute manually)',
  modelPairLabel: 'Model for title summaries',
  followMainModel: 'Follow the conversation model',
  notInList: '{id} (not in the configured list)',
  providerSelectAria: 'Which provider summarizes the title',
  modelSelectAria: 'Which model summarizes the title',
  loadingDirectory: 'Loading the model directory…',
  directoryUnavailable:
    'Could not read the configured model list ({reason}); these two fields fall back to manual input',
  credentialsUnknown:
    'The list is derived from the settings document alone and may include providers that are not configured',
  pairBlocked:
    'This provider has no selectable models; pick another provider, or add models to it in the Models settings first',
  providerPlaceholder: 'Provider id, e.g. deepseek; empty follows the conversation model',
  modelPlaceholder: 'Model id; empty uses the provider default',
  timeoutLabel: 'Timeout',
  timeoutHint:
    'Timeout for one model call, in milliseconds. Raise it when the model is slow ' +
    '(for example while a free tier is queueing).',
  templateLabel: 'Title format',
  templateHint:
    'Placeholders: {YYYY} {MM} {DD} {HH} {mm} {ss} {type} {topic}. ' +
    'Date parts can be combined freely (e.g. {MMDD}, {YYYYMMDD}) and come from the session ' +
    'creation time; omit {type} to drop the type, omit {topic} to drop the topic.',
  maxBytesLabel: 'Title length limit',
  maxBytesHint: 'In bytes; must be ≤ session-title maxTitleBytes (dsh-base default 80)',
  overridden: 'Custom',
  reset: 'Reset',
  invalidNumber: 'An integer is required here',
  unavailable: 'This connection cannot see these settings',
  readOnly: 'This connection is in-process; configuration is not written to the Host document',
  save: 'Save',
  saving: 'Saving…',
  saveSuccess: 'Saved',
  saveFailed:
    'Save did not land: the Host rejected this write (your draft is kept — fix it and retry)',
  renameTitle: 'Rename session',
  renameDisabledHint: 'The session is replying; renaming is unavailable for now',
  renamePlaceholder: 'Enter the new session title',
  lockHint:
    'While locked the title stops updating as the conversation grows; unlocking resumes ' +
    'automatic updates and leaves the title text unchanged',
  lockLabel: 'Lock title',
  lockShort: 'Lock',
  cancel: 'Cancel',
  autoGenerate: 'Generate',
  generating: 'Generating…',
  confirmSave: 'Save',
  closeAria: 'Close',
};
