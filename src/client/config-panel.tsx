/**
 * 插件详情页的配置表单（dsh 0.1.7 的 `plugins.bundle.config` 槽位）。
 *
 * dsh 0.1.7 把插件配置入口从「对话侧边栏内嵌卡片」搬到了
 * 「主窗口左侧插件按钮 → 插件列表 → 组合包详情页」，旧的
 * `settings.plugin.item` 槽位与 `settingsScope` 服务都已删除，v0.7.x 那张
 * 300 行的自绘状态机卡片（`settings-card.tsx`）随之退役。
 *
 * ## 组成（全部复用官方件，不自带状态机）
 *
 * - **`SettingsFormModel`**（`@deepseek-ai/dsh-client-ui-primitives`）：草稿 /
 *   dirty / overridden / invalid / saving / failed 全套状态机，stage 在官方共享的
 *   `ConfigForm`（`ctx.configForms.get(ns)`）之上，save 时一次性原子提交。
 * - **`SettingsForm`**：表单框架（只读提示、保存按钮、unavailable 分支、
 *   离开页面自动 discard）。
 * - **`SettingsValueField`**：其余四个字段的控件。provider / model 由
 *   `model-pair.tsx` 渲染成一行两个下拉（官方 `Menu` 原语组合 —— 官方表单本身
 *   没有下拉控件），目录读不到时退回文本输入。
 * - 保存成功的轻提示沿用 v0.7.6 的口径：平台自带 `Toast`（`tone: 'success'`）。
 *   官方 `SettingsForm` 只有 saveFailed 文案、没有成功提示，所以 onSave 由这里
 *   包一层：`save` 动作 resolve 后按结果弹（连存两次按 seq 重启淡出周期）。
 */
import { useRef, useState } from 'react';
import { SettingsForm, SettingsValueField, Toast } from '@deepseek-ai/dsh-client-ui-primitives';
import type { SettingsFormShell, SettingsFieldState } from '@deepseek-ai/dsh-client-ui-primitives';
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';

import { LOCALE_NS } from './locales';
import type { SessionTitlePatternLocaleKey } from './locales';
import { ModelPairFields } from './model-pair';
import type { DirectoryState } from './model-pair';

/**
 * 本插件在设置里的可编辑项（host 侧 `Config` 的客户端镜像）。
 *
 * 解析后的值一定齐全（schema 默认值兜底），但快照的 `user` / `base` 两层是
 * 稀疏的，字段缺省交由 `SettingsFormModel` 处理。
 */
export interface PluginConfig {
  retitleEvery?: number;
  provider?: string;
  model?: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
  template?: string;
  maxBytes?: number;
}

/** 表单投影：卡片级状态 + 六个字段的控件态，一次 `usePanel()` 全拿。 */
export interface PanelState extends SettingsFormShell {
  retitleEvery: SettingsFieldState;
  provider: SettingsFieldState;
  model: SettingsFieldState;
  timeoutMs: SettingsFieldState;
  template: SettingsFieldState;
  maxBytes: SettingsFieldState;
}

/** 槽位组件收到的全部 props（`PropsLocale` 展开 `t`；save 由 entry 包过一层）。 */
export type ConfigPanelProps = PropsLocale<typeof LOCALE_NS> & {
  /** 详情页要求的视图；bundle 配置只渲染 `page`，`summary` 渲染空。 */
  view: 'summary' | 'page';
  /**
   * 表单投影。entry 以 `hooks: { panel: store }` 注入，框架把每个 observable
   * 成员合成名为 `use<Name>` 的 selector hook（`panel` → `usePanel`）。
   */
  usePanel: <S>(sel: (state: PanelState) => S) => S;
  /** 模型目录投影（entry 以 `hooks: { directory }` 注入，同上合成 `useDirectory`）。 */
  useDirectory: <S>(sel: (state: DirectoryState) => S) => S;
  /** 保存全部草稿；resolve 出「是否真的落了地」（失败时草稿保留）。 */
  save: () => Promise<boolean>;
  /** 暂存一个字段的草稿文本。 */
  edit: (field: string, text: string) => void;
  /** 暂存清空：保存后该字段重新继承组合层默认值。 */
  resetField: (field: string) => void;
  /** 丢弃全部草稿（SettingsForm 离开页面时自动调）。 */
  discard: () => void;
};

/** 详情页暴露的六个字段名；`maxOutputTokens` / `maxInputBytes` 是内部预算，不放出来。 */
type PanelField = 'retitleEvery' | 'provider' | 'model' | 'timeoutMs' | 'template' | 'maxBytes';

/** 一个字段渲染所需的静态元数据；文案存词典键，渲染时才 `t()`，语言切换才跟得上。 */
interface FieldView {
  field: PanelField;
  label: SessionTitlePatternLocaleKey;
  hint?: SessionTitlePatternLocaleKey;
  placeholder?: SessionTitlePatternLocaleKey;
  /** 草稿非法时替换 hint 的文案。文本字段的 spec 永不 invalid，可不设（死文案）。 */
  invalid?: SessionTitlePatternLocaleKey;
  numeric?: boolean;
}

/**
 * 详情页暴露的可编辑项。`maxOutputTokens` / `maxInputBytes` 刻意不放出来：
 * 内部预算旋钮，调整只影响成本，需要时走 `cordis.patch.yml`。
 *
 * provider / model 不在这里：它们是「标题总结大模型」一排的两个下拉
 * （见 `ModelPairFields`），目录读不到时才退回文本框。
 */
const FIELDS_BEFORE_PAIR: readonly FieldView[] = [
  {
    field: 'retitleEvery',
    label: 'retitleEveryLabel',
    hint: 'retitleEveryHint',
    invalid: 'invalidNumber',
    numeric: true,
  },
];

const FIELDS_AFTER_PAIR: readonly FieldView[] = [
  { field: 'timeoutMs', label: 'timeoutLabel', hint: 'timeoutHint', invalid: 'invalidNumber', numeric: true },
  { field: 'template', label: 'templateLabel', hint: 'templateHint' },
  { field: 'maxBytes', label: 'maxBytesLabel', hint: 'maxBytesHint', invalid: 'invalidNumber', numeric: true },
];

export function ConfigPanel({ view, usePanel, useDirectory, save, edit, resetField, discard, t }: ConfigPanelProps) {
  const state = usePanel((s) => s);
  const directory = useDirectory((s) => s);
  // 保存成功的轻提示：按 seq 计数发新的一条，连存两次也能重启淡出周期，
  // onDone 淡出完了才卸载（v0.7.6 用平台 Toast 替代自绘提示的同一套模式）。
  const [toast, setToast] = useState<{ seq: number; text: string } | null>(null);
  const toastSeq = useRef(0);

  if (view !== 'page') return null;

  const routes = directory.status === 'ready' ? directory.routes : undefined;
  const providerText = state.provider.text;
  const modelText = state.model.text;

  const handleSave = (): void => {
    // v0.7.6 的「具体模型自动落到第一个」解析挪到保存前一刻补写（官方 save 是
    // 原子提交，只能从入口前写入；显示上从不自动补值，不挂「未保存」）。
    // 跟随对话模型时 model 无意义，一并清空。目录不可用或这家没有模型
    // （blocked，界面上有红字说明）时不动草稿。
    if (routes !== undefined) {
      if (providerText === '') {
        if (modelText !== '') edit('model', '');
      } else if (modelText === '') {
        const first = routes.find((route) => route.provider === providerText)?.models[0]?.id;
        if (first !== undefined) edit('model', first);
      }
    }
    void save().then((landed) => {
      if (!landed) return; // 失败由 SettingsForm 的 saveFailed 文案说明，草稿保留。
      toastSeq.current += 1;
      setToast({ seq: toastSeq.current, text: t('saveSuccess') });
    });
  };
  const dismissToast = (): void => setToast(null);

  /** 渲染一个普通字段（官方 SettingsValueField）。 */
  const renderField = ({ field, label, hint, placeholder, invalid, numeric }: FieldView): React.JSX.Element => {
    const value = state[field];
    return (
      <SettingsValueField
        key={field}
        id={`stp-config-${field}`}
        label={t(label)}
        hint={hint === undefined ? undefined : t(hint)}
        placeholder={placeholder === undefined ? undefined : t(placeholder)}
        text={value.text}
        overridden={value.overridden}
        invalid={value.invalid}
        overriddenLabel={t('overridden')}
        resetLabel={t('reset')}
        invalidLabel={invalid === undefined ? '' : t(invalid)}
        disabled={!state.writable}
        onEdit={(text) => edit(field, text)}
        onReset={() => resetField(field)}
        numeric={numeric}
      />
    );
  };

  return (
    <>
      <SettingsForm
        labels={{
          unavailable: t('unavailable'),
          readOnly: t('readOnly'),
          saveFailed: t('saveFailed'),
          save: t('save'),
          saving: t('saving'),
        }}
        state={state}
        onSave={handleSave}
        onDiscard={discard}
      >
        {FIELDS_BEFORE_PAIR.map(renderField)}
        <ModelPairFields
          directory={directory}
          provider={providerText}
          model={modelText}
          disabled={!state.writable}
          overridden={state.provider.overridden || state.model.overridden}
          onEdit={edit}
          onReset={() => {
            resetField('provider');
            resetField('model');
          }}
          t={t}
        />
        {FIELDS_AFTER_PAIR.map(renderField)}
      </SettingsForm>
      {toast !== null ? <Toast key={toast.seq} text={toast.text} tone="success" onDone={dismissToast} /> : null}
    </>
  );
}
