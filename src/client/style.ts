/**
 * 本插件自己的样式，统一注册到 `dsh-plugin-core` 的 styleKit（全插件唯一注入器）。
 *
 * 控件皮肤由核心库各控件自注入，这里只管布局、提示文案与标题宽度覆盖。
 * 颜色一律吃宿主 `--dsw-alias-*` token，不自带明暗判据。
 */

/**
 * 当前会话标题（面包屑最后一段）的宽度上限。
 *
 * 上游把 `.crumb` 写死 `max-width:220px` 且没有槽位能改写它；属性选择器与上游
 * `.wSkVaW_crumb` 特异性相同，靠 `!important` 决胜。`_crumbCurrent` 只命中最后
 * 一个面包屑，祖先会话与子代理不受影响。上游若重命名该类名，本规则静默失效
 * （DevTools 查标题元素 class 里还有没有 `_crumbCurrent`）。
 */
export const STP_CSS = `
[class*="_crumbCurrent"]{max-width:min(640px, 60vw) !important;}
.stp-config__field{display:flex;flex-direction:column;gap:6px;padding:12px 0}
.stp-config__head{display:flex;align-items:center;gap:8px;min-height:24px}
.stp-config__label{flex:1;min-width:0;font-size:13px;font-weight:500;line-height:1.5;color:var(--dsw-alias-label-primary)}
.stp-config__hint{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}
.stp-config__invalid{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-error)}
.stp-config__note{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}
.stp-config__failed{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-error)}
.stp-config__pair{display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:start}
.stp-config__row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px;padding:0 0 24px;border-bottom:1px solid var(--dsw-alias-border-l4)}
/* 一排两列里的单下拉：铺满所在半格（核心 .dshpc-picker 默认 inline-block 按内容宽，
   trigger min-width:120px，不显式限宽会缩成一枚小按钮）。 */
.stp-config__field .stp-config__model{display:block;width:100%;min-width:0}
.stp-config__model .dshpc-picker__trigger{width:100%;min-width:0}
/* 数字框只要手输，不要浏览器自带的上下箭头。 */
.stp-config__num::-webkit-inner-spin-button,.stp-config__num::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.stp-config__num{-moz-appearance:textfield}
`;
