/**
 * 设置卡片的样式。
 *
 * 逐条照抄官方 `@deepseek-ai/dsh-client-ui-settings-plugins` 里
 * `PluginCard.module.css` 与 `fields.module.css` 的规则（含卡片收起/展开的底色、
 * 字段的上下布局、保存/放弃按钮），只把类名前缀换成我们自己的 `stp-`。
 *
 * 为什么不直接借官方那几个 hash 类名（`YyYd_a_card` 之类）：它们由上游构建时生成，
 * 上游一改版就会**静默失效**，那时卡片会变成没有任何样式的裸 DOM。
 * 抄规则则只依赖 CSS 变量，而变量是稳定的公开契约。
 */
export const SETTINGS_STYLE_ID = 'dsh-session-title-pattern-settings-css';

export const SETTINGS_CSS = `
/* ---- 卡片壳：收起是灰底，展开切深底（官方 .card / .cardOpen） ---- */
.stp-card{border:.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-3);border-radius:16px;list-style:none;transition:border-color .16s,background .16s}
.stp-card:hover{border-color:var(--dsw-alias-label-dimmed)}
.stp-cardOpen{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}
/* 首尾字段不要顶到 body 的分隔线上 */
.stp-body>.stp-field:first-child{padding-top:4px}
.stp-body>.stp-field:last-of-type{padding-bottom:4px}
.stp-header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}
.stp-header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
.stp-headText{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}
.stp-name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}
.stp-description{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}
.stp-chevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s;display:inline-flex}
.stp-chevronOpen{transform:rotate(180deg)}
.stp-pending{flex:none;font-size:12px;line-height:18px;padding:0 6px;border-radius:6px;color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-interactive-bg-hover)}
/* ---- body 在卡片内部，只隔一条细线（官方 .body） ---- */
.stp-body{border-top:.5px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}
/* ---- 一个字段：标签在上、控件整宽在下、hint 再下一行（官方 .field） ---- */
.stp-field{flex-direction:column;gap:6px;padding:12px 0;display:flex}
.stp-field+.stp-field{border-top:.5px solid var(--dsw-alias-border-l2)}
.stp-head{align-items:center;gap:8px;display:flex}
.stp-label{min-width:0;color:var(--dsw-alias-label-primary);flex:1;font-size:13px;font-weight:500;line-height:1.5}
.stp-badges{align-items:center;gap:8px;display:inline-flex}
.stp-overridden{font-size:12px;line-height:1.5;color:var(--dsw-alias-state-business-primary)}
.stp-reset{font:inherit;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;padding:0;font-size:12px;line-height:1.5}
.stp-reset:hover:not(:disabled){color:var(--dsw-alias-label-primary)}
.stp-reset:disabled{cursor:default;opacity:.5}
.stp-input{box-sizing:border-box;width:100%;border:.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5}
.stp-input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
.stp-input:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}
.stp-inputInvalid{border-color:var(--dsw-alias-label-error)}
.stp-invalid{color:var(--dsw-alias-label-error);margin:0;font-size:12px;line-height:1.5}
.stp-hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}
/* ---- 开关行：标题与说明在左，开关在右（照抄官方 SubagentModelSelectionCard 的 .toggleRow） ---- */
.stp-toggleRow{color:var(--dsw-alias-label-primary);justify-content:space-between;align-items:center;gap:16px;font-size:13px;line-height:1.5;display:flex}
.stp-toggleLabel{flex:1;min-width:0;flex-direction:column;gap:2px;display:flex}
.stp-toggleTitle{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.5}
/* ---- 底部：右对齐的保存/放弃（官方 .footer / .save / .discard） ---- */
.stp-footer{border-top:.5px solid var(--dsw-alias-border-l2);justify-content:flex-end;align-items:center;gap:8px;padding:12px 0 4px;display:flex}
.stp-failed{min-width:0;color:var(--dsw-alias-label-error);flex:1;margin:0;font-size:12px;line-height:1.5}
.stp-discard,.stp-save{appearance:none;font:inherit;cursor:pointer;border:1px solid #0000;border-radius:8px;padding:5px 14px;font-size:13px;line-height:1.5}
.stp-discard{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:0 0}
.stp-discard:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}
.stp-save{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3)}
.stp-discard:disabled,.stp-save:disabled{opacity:.4;cursor:default}
.stp-discard:focus-visible,.stp-save:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
`;
