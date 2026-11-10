/**
 * 「标题总结大模型」：一个下拉按供应商分组选模型（核心库 `ModelPicker` 的 grouped 形态）。
 *
 * 目录不再自己读：核心 `ModelPicker` 的数据来自宿主 `serveModelCatalog`
 * （client 侧 `connectHost(ctx,{modelsPath})` 自取，见 index.tsx），这里只传
 * `variant="grouped"`：一个下拉，供应商做组头、模型列在下面；把 `${provider}/${id}`
 * 拆回双字段草稿。默认项由 `defaultLabel` 自定义成「跟随对话模型」，置顶且始终可选，
 * 因此选过具体模型后仍能选回默认。目录 loading / 不可用时核心自带 degraded 提示。
 */
import { Button, Chip, ModelPicker } from 'dsh-plugin-core/ui';

import type { SessionTitlePatternLocaleKey } from './locales';

/** 本插件渲染文案的函数形状（框架注入的 `t`，支持 `{name}` 插值）。 */
type Translate = (key: SessionTitlePatternLocaleKey, params?: Record<string, unknown>) => string;

/** `ModelPairFields` 收到的 props（字段值与动作由 ConfigPanel 转交）。 */
export interface ModelPairFieldsProps {
  /** provider / model 的当前草稿文本（空 = 跟随对话模型 / 厂家默认）。 */
  provider: string;
  model: string;
  /** 只读文档或命名空间不可用时禁用全部控件。 */
  disabled: boolean;
  /** 两个草稿任一落进用户层即显示「自定义」徽章并放开恢复默认。 */
  overridden: boolean;
  /** 暂存草稿文本。 */
  onEdit: (field: 'provider' | 'model', text: string) => void;
  /** 「恢复默认」：两个草稿一起清空（跟随对话模型）。 */
  onReset: () => void;
  t: Translate;
}

/**
 * 一个分组下拉（grouped）：供应商做组头、模型列在下面，不再用两个框。
 * 选「跟随对话模型」发 `''`（两个草稿一起清空）；选中具体模型发 `provider/id`，
 * 按第一个 `/` 拆回双字段。与「重算间隔」同排半宽，`stp-config__model` 铺满所在半格。
 */
export function ModelPairFields({
  provider,
  model,
  disabled,
  overridden,
  onEdit,
  onReset,
  t,
}: ModelPairFieldsProps) {
  const value = provider !== '' && model !== '' ? `${provider}/${model}` : '';

  const onModelChange = (next: string): void => {
    // 选「跟随对话模型」发 ''（默认项置顶，随时可点回来）；两个草稿一起清空 =
    // 跟随会话主模型。选定具体模型后按第一个 '/' 拆回双字段。
    const slash = next.indexOf('/');
    if (slash < 0) {
      onEdit('provider', '');
      onEdit('model', '');
      return;
    }
    onEdit('provider', next.slice(0, slash));
    onEdit('model', next.slice(slash + 1));
  };

  return (
    <div className="stp-config__field">
      <div className="stp-config__head">
        <span className="stp-config__label">{t('modelPairLabel')}</span>
        {overridden ? <Chip tone="neutral" size="xs">{t('overridden')}</Chip> : null}
        {overridden ? (
          <Button variant="link" size="sm" disabled={disabled} onClick={onReset}>{t('reset')}</Button>
        ) : null}
      </div>
      <ModelPicker
        variant="grouped"
        className="stp-config__model"
        size="lg"
        value={value}
        defaultLabel={t('followMainModel')}
        disabled={disabled}
        onChange={onModelChange}
      />
    </div>
  );
}
