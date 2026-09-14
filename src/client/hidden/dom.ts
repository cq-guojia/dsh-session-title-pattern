/**
 * 「隐藏会话」的 DOM 基础设施。
 *
 * ## 为什么只能在 DOM 层做（已核实）
 *
 * 会话列表整个区域（区域标题行 + 搜索 + 分组/扁平列表）是 `sidebar.workspaces`
 * 这个 **single** 槽位的占用者，注册即整体替换（列表会消失）；会话行与工作区行
 * 的三点菜单项也都是组件内写死的数组，`Menu` 只渲染 `items` prop，没有 children /
 * slot / render-prop 入口。**没有任何 slot 能按会话过滤列表行。**
 *
 * 所以唯一可行的手段是：识别行元素 → 直接改它的行内 `style`。
 *
 * ## 承重假设（上游改版即静默失效，必须配 fail-safe）
 *
 * - 行元素只靠 CSS Module 的**类名后缀**识别（`_sessionRow` / `_searchResultRow` /
 *   `_sectionHeader` / `_searchSlot` / `_rowActions`）。
 *   哈希前缀每个模块都不同（`YDXeBa_` / `bhn1Oq_` / …）且随构建变化，所以只按后缀匹配。
 * - 行元素上**没有任何会话 id 属性**（只有 class / role / aria-selected），会话 id
 *   只能沿 React fiber 上溯取 `memoizedProps`：会话行是 `node.id`、搜索结果行是
 *   `result.id`。
 *
 * 这两条任一失配，`sessionIdOfRow()` 就会返回 undefined —— 调用方据此走 fail-safe：
 * 本趟**什么都不改**，绝不乱动用户的列表。
 */
import { EYE_OFF, EYE_OPEN } from './icons';

/** 我们注入的节点上的标记属性；值是本节点属于哪一处入口。 */
export const EYE_ATTR = 'data-stp-eye';

/** 两处入口：会话行里的眼睛，「工作区」区域标题行上的总开关。 */
export type EyeKind = 'session' | 'header';

/** 提示文案挂在这个属性上，由 `installEyeTips()` 的委托监听读出来。 */
const TIP_ATTR = 'data-stp-tip';

/** 沿 fiber 上溯的最大层数。实测会话行需要 3 层（div → HoverCard span → HoverCard → SessionNodeItem）。 */
const MAX_FIBER_DEPTH = 40;

type FiberLike = {
  memoizedProps?: unknown;
  return?: FiberLike | null;
};

function readRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/**
 * 取 DOM 节点上的 React fiber。
 *
 * React 16.9 起在 host 节点上挂 `__reactFiber$<随机后缀>`（更早是
 * `__reactInternalInstance$`）。后缀每个 renderer 随机生成，**必须按前缀扫描**，
 * 不能写死。dsh 客户端面向 React 18（上游包 devDeps `react ^18.2.0`）。
 */
function fiberOf(element: Element): FiberLike | undefined {
  const record = element as unknown as Record<string, FiberLike | undefined>;
  for (const key of Object.keys(element)) {
    if (key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')) {
      const fiber = record[key];
      if (fiber !== undefined) return fiber;
    }
  }
  return undefined;
}

/**
 * 沿 fiber 上溯，取下这一行的会话 id。
 *
 * 命中路径：会话行 `props.node.id`、搜索结果行 `props.result.id`。
 * 取不到返回 undefined —— 调用方据此判定「行识别失效」并跳过本趟。
 */
export function sessionIdOfRow(element: Element): string | undefined {
  let fiber = fiberOf(element);
  for (let depth = 0; fiber !== undefined && depth < MAX_FIBER_DEPTH; depth += 1) {
    const props = readRecord(fiber.memoizedProps);
    const id = readString(readRecord(props?.node)?.id) ?? readString(readRecord(props?.result)?.id);
    if (id !== undefined) return id;
    fiber = fiber.return ?? undefined;
  }
  return undefined;
}

/** 按类名后缀找节点（哈希前缀随构建变化，只能匹配后缀）。 */
export function bySuffix(suffix: string): string {
  return `[class*="_${suffix}"]`;
}

export function findAll(root: ParentNode, suffix: string): HTMLElement[] {
  // `Array.from` 而不是展开：tsconfig 的 lib 里没有 `DOM.Iterable`，NodeList 不可迭代。
  return Array.from(root.querySelectorAll<HTMLElement>(bySuffix(suffix)));
}

/** 找已注入的眼睛按钮；找不到返回 null。 */
export function eyeIn(container: Element, kind: EyeKind): HTMLButtonElement | null {
  return container.querySelector<HTMLButtonElement>(`[${EYE_ATTR}="${kind}"]`);
}

/**
 * 造一个眼睛按钮（不插入）。
 *
 * 行本身是可点的（打开会话 / 折叠分组）且可能 `draggable`，所以按钮上的事件
 * 一律不外泄：`pointerdown` / `mousedown` 只 `stopPropagation`，
 * `mousedown` 上的 `preventDefault` 用来取消父级的 HTML5 拖拽启动
 * （它**不影响**随后的 click）。
 */
export function createEye(kind: EyeKind, onClick: (button: HTMLButtonElement) => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute(EYE_ATTR, kind);
  // **不要**在这里预设 `data-stp-on`：`setEyeState` 拿它跟目标值比对来决定要不要重画
  // 图标，预置成 '0' 会让第一次调用认为「已经是关态、图标早画好了」而整个跳过，
  // 于是按钮一直是个空底板，点一下才长出第一个图标（实机上就是这么暴露的）。
  // 留空则第一次 setEyeState 必定落笔。

  const swallow = (event: Event): void => {
    event.stopPropagation();
  };
  button.addEventListener('pointerdown', swallow);
  button.addEventListener('mousedown', (event) => {
    event.preventDefault();
    swallow(event);
  });
  button.addEventListener('click', (event) => {
    swallow(event);
    onClick(button);
  });
  return button;
}

/** 保证 `container` 里有我们的眼睛按钮，返回它（已有就复用，绝不重复插入）。 */
export function ensureEye(
  container: HTMLElement,
  kind: EyeKind,
  onClick: (button: HTMLButtonElement) => void,
): HTMLButtonElement {
  const existing = eyeIn(container, kind);
  if (existing !== null) return existing;
  const button = createEye(kind, onClick);
  // 排在容器最左侧（「…」左边）。用 `order` 而不是 `insertBefore`：容器是 flex，
  // order 能稳定压过 React 之后插入的兄弟节点，不必跟 React 抢 DOM 位置。
  button.style.order = '-1';
  container.append(button);
  return button;
}

/**
 * 更新按钮的图标与提示文案。值与当前一致时不写 DOM，避免无谓的属性变更。
 *
 * 提示**不用**原生 `title`：一是慢（浏览器默认要悬停约 1 秒），二是我们要的是一个
 * 立刻能看懂的说明（见 `installEyeTips()`）。`aria-label` 照旧给读屏用。
 */
export function setEyeState(button: HTMLButtonElement, on: boolean, label: string): void {
  const next = on ? '1' : '0';
  if (button.dataset.stpOn !== next) {
    button.dataset.stpOn = next;
    button.innerHTML = on ? EYE_OPEN : EYE_OFF;
  }
  if (button.getAttribute(TIP_ATTR) !== label) button.setAttribute(TIP_ATTR, label);
  if (button.getAttribute('aria-label') !== label) button.setAttribute('aria-label', label);
}

/**
 * 提示气泡。
 *
 * 必须挂在 `document.body` 上：侧边栏里 `regionArea` / `sectionHeader` 都是
 * `overflow:hidden`，跟着按钮走的 `::after` 一律会被裁掉。气泡用 `position:fixed`
 * 自己算坐标，观感（底色、字号、圆角）照抄官方 `Tooltip.module.css` 的 token。
 */
let tipBubble: HTMLDivElement | undefined;

function tipElement(): HTMLDivElement {
  if (tipBubble !== undefined && tipBubble.isConnected) return tipBubble;
  const bubble = document.createElement('div');
  bubble.setAttribute('data-stp-tip-bubble', '');
  bubble.style.display = 'none';
  document.body.append(bubble);
  tipBubble = bubble;
  return bubble;
}

/** 贴着按钮上沿居中显示；上面放不下（贴到视口顶）就翻到下面。 */
function showTip(button: HTMLElement): void {
  const text = button.getAttribute(TIP_ATTR);
  if (text === null || text.length === 0) return;
  const bubble = tipElement();
  bubble.textContent = text;
  // 先显示再量尺寸：`display:none` 时量出来是 0。
  bubble.style.display = 'block';
  const anchor = button.getBoundingClientRect();
  const size = bubble.getBoundingClientRect();
  const above = anchor.top - size.height - 6;
  const top = above >= 4 ? above : anchor.bottom + 6;
  const left = Math.min(
    Math.max(anchor.left + anchor.width / 2 - size.width / 2, 4),
    Math.max(window.innerWidth - size.width - 4, 4),
  );
  bubble.style.top = `${Math.round(top)}px`;
  bubble.style.left = `${Math.round(left)}px`;
}

function hideTip(): void {
  if (tipBubble !== undefined) tipBubble.style.display = 'none';
}

/**
 * 全局委托装一次提示气泡，返回卸载函数。
 *
 * 用委托而不是给每个按钮绑事件：按钮是动态注入、被 React 挤掉后又重新造的，
 * 逐个绑定迟早漏一个。
 */
export function installEyeTips(): () => void {
  const over = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest(`[${TIP_ATTR}]`);
    if (button === null) return;
    showTip(button as HTMLElement);
  };
  const out = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest(`[${TIP_ATTR}]`);
    if (button === null) return;
    // 指针只是从按钮移到它里面的 SVG（或反过来）—— 还在同一个按钮里，别闪。
    const next = (event as PointerEvent).relatedTarget;
    if (next instanceof Node && button.contains(next)) return;
    hideTip();
  };
  // 位置会变（列表滚动、行被重排）或马上要点击时，直接收掉，不追着走。
  const dismiss = (): void => hideTip();

  document.addEventListener('pointerover', over, true);
  document.addEventListener('pointerout', out, true);
  window.addEventListener('scroll', dismiss, true);
  document.addEventListener('pointerdown', dismiss, true);
  return () => {
    document.removeEventListener('pointerover', over, true);
    document.removeEventListener('pointerout', out, true);
    window.removeEventListener('scroll', dismiss, true);
    document.removeEventListener('pointerdown', dismiss, true);
    tipBubble?.remove();
    tipBubble = undefined;
  };
}

/** 注入样式元素的 id，带 id 是为了判重：重复激活不会叠加规则。 */
export const HIDDEN_STYLE_ID = 'dsh-session-title-pattern-hidden-css';

export const HIDDEN_CSS = `
/* 注入的眼睛按钮。可见性交给上游的 _rowActions 容器管（它本身 hover 才 inline-flex），
   所以这里不需要自己写 hover 规则；区域头那只常显。 */
[data-stp-eye]{appearance:none;box-sizing:border-box;flex:none;align-items:center;justify-content:center;display:inline-flex;width:20px;height:20px;padding:0;border:none;border-radius:6px;background:0 0;color:var(--dsw-alias-label-secondary);cursor:pointer}
[data-stp-eye]>svg{display:block}
[data-stp-eye]:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
/* 已「露出」的眼睛用主文字色，和未激活的灰区分开。 */
[data-stp-eye][data-stp-on="1"]{color:var(--dsw-alias-label-primary)}
[data-stp-eye="header"]{margin-right:2px}
/* 提示气泡。挂在 body 上、position:fixed，所以不会被侧边栏的 overflow:hidden 裁掉；
   底色/字号/圆角照官方 Tooltip.module.css 的 token 抄，观感与内置提示一致。 */
[data-stp-tip-bubble]{position:fixed;z-index:100;pointer-events:none;width:max-content;max-width:50vw;padding:3px 7px;border-radius:8px;background:var(--dsw-alias-tooltip-bg);color:var(--dsw-static-neutral-bluish-00);font-size:13px;line-height:20px;white-space:nowrap}
`;

/** 按 id 幂等地往页面注入一段样式（沿用原有 crumb-width 覆盖的做法）。 */
export function injectStyle(id: string, css: string): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(id) !== null) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.append(style);
}

export function removeStyle(id: string): void {
  if (typeof document === 'undefined') return;
  document.getElementById(id)?.remove();
}

/**
 * 找出会话浏览区域的根节点（区域标题行的父元素）。
 *
 * 观察与查询都限定在它里面，而不是 `document.body`：主对话区流式输出时每帧都有
 * 海量 DOM 变更，观察 body 会让我们的装饰循环被无谓地唤醒。
 *
 * @returns 区域根节点；区域还没挂载（或上游改了类名）时返回 undefined。
 */
export function findSidebarRegion(): HTMLElement | undefined {
  const header = document.querySelector<HTMLElement>(bySuffix('sectionHeader'));
  return header?.parentElement ?? undefined;
}

/** 区域还没渲染出来时的轮询间隔。 */
const REGION_POLL_MS = 250;

/**
 * 观察会话浏览区域，任何 childList 变化都调一次 `onDirty`。
 *
 * 区域本身是 React 挂载的，插件激活时未必已经存在；区域被整体替换（切面板、
 * 重连）时已观察的节点会断连，所以靠一条低频轮询重新发现并挂上。
 *
 * @returns 停止观察的清理函数。
 */
export function watchSidebarRegion(onDirty: () => void): () => void {
  let region: HTMLElement | undefined;
  let observer: MutationObserver | undefined;

  const detach = (): void => {
    observer?.disconnect();
    observer = undefined;
    region = undefined;
  };

  const attach = (): void => {
    const next = findSidebarRegion();
    if (next === undefined) {
      // 区域暂时不在（还没挂载 / 正在重建）：丢掉旧的观察，等轮询再发现。
      if (region !== undefined) detach();
      return;
    }
    if (next === region && region.isConnected) return;
    detach();
    region = next;
    // 只看 childList：React 增删节点足以让我们重跑一趟；属性变更不用管
    // （我们写的是自己的 dataset / style，观察属性会形成自触发回路）。
    observer = new MutationObserver(() => onDirty());
    observer.observe(next, { childList: true, subtree: true });
    onDirty();
  };

  attach();
  const timer = setInterval(attach, REGION_POLL_MS);
  return () => {
    clearInterval(timer);
    detach();
  };
}

/**
 * 把多次触发合并成「每帧最多一趟」。
 *
 * 触发源有三个（DOM 变更、会话/工作区数据变更、配置变更），再加上轮询，
 * 不合并的话一次列表重排就会跑十几趟。
 */
export function createFrameScheduler(run: () => void): { schedule: () => void; cancel: () => void } {
  let handle: number | undefined;
  return {
    schedule: (): void => {
      if (handle !== undefined) return;
      handle = requestAnimationFrame(() => {
        handle = undefined;
        run();
      });
    },
    cancel: (): void => {
      if (handle === undefined) return;
      cancelAnimationFrame(handle);
      handle = undefined;
    },
  };
}
