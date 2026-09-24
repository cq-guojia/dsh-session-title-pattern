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
