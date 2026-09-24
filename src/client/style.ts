/**
 * 样式注入的小工具。
 *
 * 原来住在 `hidden/dom.ts` 里；0.8.0 删除隐藏会话功能后，标题宽度覆盖
 * （`installCrumbWidth`）仍需要它，故独立成模块。
 */

/** 往 `<head>` 注入一条带 id 的 `<style>`；已存在（按 id 判重）则跳过。 */
export function injectStyle(id: string, css: string): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(id) !== null) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.append(style);
}

/** 按 id 摘掉注入的 `<style>`；不存在时静默。 */
export function removeStyle(id: string): void {
  if (typeof document === 'undefined') return;
  document.getElementById(id)?.remove();
}

/** 「供应商 + 模型」一行两个下拉的样式注入 id（判重防叠加）。 */
export const PAIR_STYLE_ID = 'dsh-session-title-pattern-pair-css';

/**
 * 配置表单里「标题总结大模型」一排的样式。
 *
 * 颜色、字号、圆角全部取官方 `--dsw-*` token；控件高度 / 边框对齐
 * `SettingsValueField` 的文本框（34px / 8px 圆角 / l4 边框），排在一列里不突兀。
 */
export const PAIR_CSS = `
.stp-pairField{display:flex;flex-direction:column;gap:6px;padding:12px 0}
.stp-pairHead{display:flex;align-items:center;gap:8px}
.stp-pairLabel{flex:1;min-width:0;font-size:13px;font-weight:500;line-height:1.5;color:var(--dsw-alias-label-primary)}
.stp-badges{display:inline-flex;align-items:center;gap:8px}
.stp-overridden{font-size:12px;line-height:1.5;color:var(--dsw-alias-state-business-primary)}
.stp-reset{font:inherit;font-size:12px;line-height:1.5;padding:0;border:none;background:none;color:var(--dsw-alias-label-secondary);cursor:pointer}
.stp-reset:hover:not(:disabled){color:var(--dsw-alias-label-primary)}
.stp-reset:disabled{cursor:default;opacity:.5}
.stp-pair{display:flex;gap:8px}
.stp-pair>*{flex:1;min-width:0}
.stp-combo{box-sizing:border-box;width:100%;height:34px;border:.5px solid var(--dsw-alias-border-l4);border-radius:8px;background:var(--dsw-alias-bg-layer-3);font:inherit;font-size:13px;line-height:1.5;color:var(--dsw-alias-label-primary);padding:0 10px;display:inline-flex;align-items:center;justify-content:space-between;gap:6px;cursor:pointer}
.stp-combo:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
.stp-combo:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}
.stp-comboText{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.stp-comboText[data-empty="1"]{color:var(--dsw-alias-label-tertiary)}
.stp-comboChevron{display:inline-flex;transition:transform .15s ease}
.stp-comboChevron[data-open="1"]{transform:rotate(180deg)}
.stp-input{box-sizing:border-box;width:100%;border:.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5;appearance:none}
.stp-input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
.stp-input:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}
.stp-hint{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}
.stp-invalid{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-error)}
`;
