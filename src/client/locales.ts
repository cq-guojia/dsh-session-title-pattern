/**
 * 本插件的界面文案词典（中英双语）。
 *
 * 走平台自带的 locale 服务（`@deepseek-ai/dsh-client-locale` 提供 `ctx.locale`）：
 * - `ctx.locale.register(NS, { zh, en })` 注册词典；**两种内置语言都必须给全**，
 *   少一种就是编译错误（`Record<BuiltInLocaleId, …>`）
 * - 槽位注册项加 `locale: NS` → 框架把 `t` 作为 prop 注入组件，语言切换时自动重渲
 * - DOM 层不在 React 里，用 `ctx.locale.bind(NS)` 拿 `t`（见 `hidden/`）
 *
 * 字典键由 `LocaleNamespaceMap` 声明合并约束：`zh` / `en` 的键集必须与它完全一致，
 * 缺键或多键都会编译报错 —— 这是「两种语言不会漏翻」的机械保证。
 */
import type {} from '@deepseek-ai/dsh-client-locale/client';

/** 词典命名空间。与设置命名空间同名，便于一眼对上。 */
export const LOCALE_NS = 'session-title-pattern';

/** 本插件渲染的全部文案键。 */
export type SessionTitlePatternLocaleKey =
  // 设置卡片：卡片头与字段
  | 'cardTitle'
  | 'cardDescription'
  | 'retitleEveryLabel'
  | 'retitleEveryHint'
  | 'modelPairLabel'
  | 'modelLabel'
  | 'timeoutLabel'
  | 'timeoutHint'
  | 'templateLabel'
  | 'templateHint'
  | 'maxBytesLabel'
  | 'maxBytesHint'
  | 'overridden'
  | 'reset'
  | 'invalidNumber'
  // 设置卡片：模型下拉
  | 'followMainModel'
  | 'notInList'
  | 'providerPlaceholder'
  | 'modelPlaceholder'
  | 'providerSelectAria'
  | 'modelSelectAria'
  | 'directoryUnavailable'
  | 'credentialsUnknown'
  | 'pairBlocked'
  // 设置卡片：隐藏会话与页脚
  | 'hiddenEnabledTitle'
  | 'hiddenEnabledHint'
  | 'rescueTitle'
  | 'rescueHint'
  | 'rescueAll'
  | 'discard'
  | 'save'
  | 'unsaved'
  | 'unsavedTip'
  | 'saveFailed'
  | 'readOnly'
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
  | 'closeAria'
  // 隐藏会话的眼睛与气泡
  | 'hideSession'
  | 'unhideSession'
  | 'showHidden'
  | 'collapseHidden';

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'session-title-pattern': SessionTitlePatternLocaleKey;
  }
}

/** 简体中文词典。 */
export const zh: Record<SessionTitlePatternLocaleKey, string> = {
  cardTitle: '会话标题（session-title-pattern）',
  cardDescription: '用模型总结会话标题的类型与主题。',
  retitleEveryLabel: '每隔几条对话重算一次',
  retitleEveryHint:
    '0 = 只在新建会话时算一次，之后不自动更新（可随时点标题旁的按钮手动重算）',
  modelPairLabel: '标题总结大模型',
  modelLabel: '具体模型',
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
  followMainModel: '跟随对话模型',
  notInList: '{id}（不在已配置列表）',
  providerPlaceholder: '供应商，如 deepseek',
  modelPlaceholder: '模型 id，留空用厂家默认',
  providerSelectAria: '用哪家的模型总结标题',
  modelSelectAria: '用哪个模型总结标题',
  directoryUnavailable: '未能读取已配置的模型列表（{reason}），这两个框已退回手动输入',
  credentialsUnknown: '未能读取凭据状态，列表只按设置文档判断，可能多列出没配好的供应商',
  pairBlocked: '这家下面没有可选模型，请换一家，或先到「模型」设置里给它配上模型',
  hiddenEnabledTitle: '启用隐藏会话',
  hiddenEnabledHint:
    '启用后，会话行悬停时行尾显示隐藏按钮，可将该会话从侧边栏隐藏；「工作区」标题行放大镜' +
    '左侧的按钮用于整体显示或收起全部已隐藏的会话。隐藏仅影响侧边栏的呈现，不影响会话内容、' +
    '搜索与标题生成，也不会删除任何数据。关闭后，上述按钮与隐藏效果均停止执行；已设置的' +
    '隐藏列表将保留，重新启用时继续生效。',
  rescueTitle: '隐藏的会话',
  rescueHint: '当前已隐藏 {count} 条会话。隐藏仅影响侧边栏的呈现，不影响会话内容与搜索。',
  rescueAll: '全部取消隐藏',
  discard: '放弃修改',
  save: '保存',
  unsaved: '未保存',
  unsavedTip: '未保存：{fields}',
  saveFailed: '保存未落地，Host 拒绝了这次写入（草稿已保留，可修改后重试）',
  readOnly: '当前连接为进程内模式，配置不会写入 Host 文档',
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
  hideSession: '隐藏此会话',
  unhideSession: '取消隐藏',
  showHidden: '显示被隐藏的会话',
  collapseHidden: '收起被隐藏的会话',
};

/** English dictionary. */
export const en: Record<SessionTitlePatternLocaleKey, string> = {
  cardTitle: 'Session title (session-title-pattern)',
  cardDescription: 'Summarize the type and topic of session titles with a model.',
  retitleEveryLabel: 'Recompute every N messages',
  retitleEveryHint:
    '0 = compute once when the session is created and never again automatically ' +
    '(use the button next to the title any time to recompute manually)',
  modelPairLabel: 'Model for title summaries',
  modelLabel: 'Model',
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
  followMainModel: 'Follow the conversation model',
  notInList: '{id} (not in the configured list)',
  providerPlaceholder: 'Provider, e.g. deepseek',
  modelPlaceholder: 'Model id; empty uses the provider default',
  providerSelectAria: 'Which provider summarizes the title',
  modelSelectAria: 'Which model summarizes the title',
  directoryUnavailable:
    'Could not read the configured model list ({reason}); these two fields fall back to manual input',
  credentialsUnknown:
    'Credential status is unavailable, so the list is derived from the settings document alone ' +
    'and may include providers that are not configured',
  pairBlocked:
    'This provider has no selectable models; pick another provider, or add models to it ' +
    'in the Models settings first',
  hiddenEnabledTitle: 'Enable hidden sessions',
  hiddenEnabledHint:
    'When enabled, hovering a session row reveals a hide button at the end of the row, and the ' +
    'button left of the search icon in the Workspaces header shows or collapses every hidden ' +
    'session. Hiding only affects the sidebar — it never changes session content, search, or ' +
    'title generation, and deletes no data. When disabled, those buttons and the hiding effect ' +
    'stop; the hidden list is kept and applies again once you re-enable it.',
  rescueTitle: 'Hidden sessions',
  rescueHint:
    '{count} session(s) currently hidden. Hiding only affects the sidebar; it never changes ' +
    'session content or search.',
  rescueAll: 'Unhide all',
  discard: 'Discard',
  save: 'Save',
  unsaved: 'Unsaved',
  unsavedTip: 'Unsaved: {fields}',
  saveFailed:
    'Save did not land: the Host rejected this write (your draft is kept — fix it and retry)',
  readOnly: 'This connection is in-process; configuration is not written to the Host document',
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
  hideSession: 'Hide this session',
  unhideSession: 'Unhide',
  showHidden: 'Show hidden sessions',
  collapseHidden: 'Collapse hidden sessions',
};

/**
 * 翻译函数在非 React 代码（DOM 层）里的最小形态。
 *
 * 平台的 `bind` 返回值是本类型的超集（键域更大），可直接赋值过来。
 */
export type LocaleTranslate = (
  key: SessionTitlePatternLocaleKey,
  params?: Record<string, unknown>,
) => string;

/**
 * locale 服务尚未就位时的兜底翻译函数：直接用中文词典。
 *
 * 只服务 DOM 层（`ctx.locale` 是延迟注入的，`bind` 之前要有东西可用）；
 * React 组件的 `t` 由框架注入，用不到这里。
 */
export const fallbackTranslate: LocaleTranslate = (key, params) => {
  const template = zh[key];
  if (params === undefined) return template;
  // 与平台同款替换：`{name}` 用 params 里的值填，缺参数就原样保留占位符。
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : whole,
  );
};
