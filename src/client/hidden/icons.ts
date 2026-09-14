/**
 * 注入到侧边栏 DOM 里的图标（内联 SVG 字符串）。
 *
 * 为什么不用官方的 `IconXxx16`：那是 React 组件，在原生注入的节点里渲染不了。
 * 尺寸 16、`stroke="currentColor"`、`fill="none"`、`stroke-width="1.5"`，
 * 与头部其它控件的观感一致，颜色由按钮的 `color` 控制（见 `HIDDEN_CSS`）。
 *
 * 两个形态的语义统一为「**眼睛 = 这些东西现在已经露出来了**」：
 * - 会话行：这条会话已隐藏 → 眼睛（点它取消隐藏）；未隐藏 → 划线眼
 * - 开关：正在显示被隐藏的会话 → 眼睛；没显示 → 划线眼
 */
export const EYE_OPEN =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
  '<path d="M1.6 8S3.9 3.9 8 3.9 14.4 8 14.4 8 12.1 12.1 8 12.1 1.6 8 1.6 8Z"' +
  ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
  '<circle cx="8" cy="8" r="1.9" stroke="currentColor" stroke-width="1.5"/>' +
  '</svg>';

export const EYE_OFF =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
  '<path d="M6.3 4.1A6.9 6.9 0 0 1 8 3.9c4.1 0 6.4 4.1 6.4 4.1a12 12 0 0 1-2.3 2.7' +
  'M4.1 5.2A12 12 0 0 0 1.6 8s2.3 4.1 6.4 4.1c.9 0 1.7-.2 2.4-.5"' +
  ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
  '<path d="M2.6 2.6 13.4 13.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
  '</svg>';
