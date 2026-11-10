/**
 * 插件详情页的配置区（dsh 0.1.7 `plugins.bundle.config` 槽位，key = 包名）。
 *
 * 控件一律走核心库分包 `dsh-plugin-core/ui`（Input / Button / Chip / ModelPicker），
 * 状态机仍是官方 `SettingsFormModel`：草稿 / dirty / overridden / invalid /
 * saving / failed / 原子保存，一行都不自己管。版式照 `dsh-task-ledger` 的配置区：
 * 保存与两个链接同一排、保存在最前。
 */
import { useEffect, useRef, useState } from 'react';
import { IconLinkOutlineRegular, Toast } from '@deepseek-ai/dsh-client-ui-primitives';
import type { SettingsFormShell, SettingsFieldState } from '@deepseek-ai/dsh-client-ui-primitives';
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
import { Button, Chip, Input, modelCatalog } from 'dsh-plugin-core/ui';

import { LOCALE_NS } from './locales';
import type { SessionTitlePatternLocaleKey } from './locales';
import { ModelPairFields } from './model-pair';

/** 本仓库地址（设置区的第一个链接）。 */
const PROJECT_URL = 'https://github.com/cq-guojia/dsh-session-title-pattern';
/** 友情链接：蓝鲸组件库（UI 基础控件包）。 */
const COMPONENTS_URL = 'https://github.com/cq-guojia/dsh-plugin-core';

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
  /** 表单投影（entry 以 `hooks: { panel: store }` 注入）。 */
  usePanel: <S>(sel: (state: PanelState) => S) => S;
  /** 保存全部草稿；resolve 出「是否真的落了地」（失败时草稿保留）。 */
  save: () => Promise<boolean>;
  /** 暂存一个字段的草稿文本。 */
  edit: (field: string, text: string) => void;
  /** 暂存清空：保存后该字段重新继承组合层默认值。 */
  resetField: (field: string) => void;
  /** 丢弃全部草稿（离开页面时自动调）。 */
  discard: () => void;
};

type PanelField = 'retitleEvery' | 'provider' | 'model' | 'timeoutMs' | 'template' | 'maxBytes';

/** 一个字段渲染所需的静态元数据；文案存词典键，渲染时才 `t()`，语言切换才跟得上。 */
interface FieldView {
  field: PanelField;
  label: SessionTitlePatternLocaleKey;
  hint?: SessionTitlePatternLocaleKey;
  invalid?: SessionTitlePatternLocaleKey;
  numeric?: boolean;
}

/** `maxOutputTokens` / `maxInputBytes` 是内部预算旋钮，不放出来。 */
const FIELD_TOP: FieldView = {
  field: 'retitleEvery',
  label: 'retitleEveryLabel',
  hint: 'retitleEveryHint',
  invalid: 'invalidNumber',
  numeric: true,
};

const FIELD_TEMPLATE: FieldView = { field: 'template', label: 'templateLabel', hint: 'templateHint' };

/** 最下面一排并排的两个：标题长度上限在左、超时在右（实机反馈）。 */
const FIELDS_BOTTOM_ROW: readonly FieldView[] = [
  { field: 'maxBytes', label: 'maxBytesLabel', hint: 'maxBytesHint', invalid: 'invalidNumber', numeric: true },
  { field: 'timeoutMs', label: 'timeoutLabel', hint: 'timeoutHint', invalid: 'invalidNumber', numeric: true },
];

/** 一行：标签 + 自定义徽章 + 恢复默认 → 控件 → 说明。 */
function configField(props: {
  id: string;
  label: string;
  hint: string;
  overridden: boolean;
  resetLabel: string;
  overriddenLabel: string;
  disabled: boolean;
  onReset: () => void;
  control: React.ReactNode;
}): React.JSX.Element {
  return (
    <div key={props.id} className="stp-config__field">
      <div className="stp-config__head">
        <span className="stp-config__label" id={props.id}>{props.label}</span>
        {props.overridden ? <Chip tone="neutral" size="xs">{props.overriddenLabel}</Chip> : null}
        {props.overridden ? (
          <Button variant="link" size="sm" disabled={props.disabled} onClick={props.onReset}>
            {props.resetLabel}
          </Button>
        ) : null}
      </div>
      {props.control}
      <p className="stp-config__hint">{props.hint}</p>
    </div>
  );
}

/** 外链按钮：文案与图标逐字照抄 `dsh-task-ledger` 的设置区。 */
const linkButton = (label: string, url: string): React.JSX.Element => (
  <Button
    size="lg"
    variant="outline"
    icon={<IconLinkOutlineRegular size={16} />}
    onClick={() => {
      window.open(url, '_blank', 'noopener');
    }}
  >
    {label}
  </Button>
);

export function ConfigPanel({ view, usePanel, save, edit, resetField, discard, t }: ConfigPanelProps) {
  const state = usePanel((s) => s);
  // 保存成功的轻提示：按 seq 计数发新的一条，连存两次也能重启淡出周期。
  const [toast, setToast] = useState<{ seq: number; text: string } | null>(null);
  const toastSeq = useRef(0);
  // 官方 SettingsForm 的规矩是「离开页面丢弃草稿」，现在自己接。
  const discardRef = useRef(discard);
  discardRef.current = discard;
  useEffect(() => () => discardRef.current(), []);
  // 目录自愈与补拉由核心内建（首拉失败退避重试、打开选择器/切回页面节流补拉），
  // 这里不再手动 refreshModelCatalog()，免得多发一次绕过节流的请求。

  if (view !== 'page') return null;
  if (!state.available) return <p className="stp-config__note" role="status">{t('unavailable')}</p>;

  const providerText = state.provider.text;
  const modelText = state.model.text;

  const handleSave = (): void => {
    // 「具体模型自动落到第一个」在保存前一刻补写（官方 save 是原子提交），
    // 显示上从不自动补值，不挂「未保存」。跟随对话模型时 model 无意义，一并清空。
    // routes 取自核心目录单例（connectHost 喂的宿主 serveModelCatalog）。
    const catalog = modelCatalog.getSnapshot();
    if (catalog.status === 'ready') {
      if (providerText === '') {
        if (modelText !== '') edit('model', '');
      } else if (modelText === '') {
        const first = catalog.routes.find((route) => route.provider === providerText)?.models[0]?.id;
        if (first !== undefined) edit('model', first);
      }
    }
    void save().then((landed) => {
      if (!landed) return; // 失败由 saveFailed 文案说明，草稿保留。
      toastSeq.current += 1;
      setToast({ seq: toastSeq.current, text: t('saveSuccess') });
    });
  };
  const dismissToast = (): void => setToast(null);

  /** 渲染一个普通字段：核心 Input，草稿文本原样交给 SettingsFormModel。 */
  const renderField = ({ field, label, hint, invalid, numeric }: FieldView): React.JSX.Element => {
    const value: SettingsFieldState = state[field];
    const hintText = value.invalid && invalid !== undefined
      ? t(invalid)
      : (hint === undefined ? '' : t(hint));
    return configField({
      id: `stp-config-${field}`,
      label: t(label),
      hint: hintText,
      overridden: value.overridden,
      resetLabel: t('reset'),
      overriddenLabel: t('overridden'),
      disabled: !state.writable,
      onReset: () => resetField(field),
      control: (
        <Input
          value={value.text}
          size="lg"
          type={numeric === true ? 'number' : 'text'}
          className={numeric === true ? 'stp-config__num' : undefined}
          error={value.invalid}
          disabled={!state.writable}
          aria-label={t(label)}
          onChange={(text) => edit(field, text)}
        />
      ),
    });
  };

  return (
    <>
      {renderField(FIELD_TOP)}
      <ModelPairFields
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
      {renderField(FIELD_TEMPLATE)}
      <div className="stp-config__pair">{FIELDS_BOTTOM_ROW.map(renderField)}</div>
      <div className="stp-config__row">
        <Button
          variant="primary"
          size="lg"
          loading={state.saving}
          disabled={!state.writable || !state.dirty || state.invalid || state.saving}
          onClick={handleSave}
        >
          {state.saving ? t('saving') : t('save')}
        </Button>
        {linkButton(t('configGithub'), PROJECT_URL)}
        {linkButton(t('configComponents'), COMPONENTS_URL)}
        {state.failed ? <p className="stp-config__failed" role="status">{t('saveFailed')}</p> : null}
        {!state.writable ? <p className="stp-config__note" role="status">{t('readOnly')}</p> : null}
      </div>
      {toast !== null ? <Toast key={toast.seq} text={toast.text} tone="success" onDone={dismissToast} /> : null}
    </>
  );
}
