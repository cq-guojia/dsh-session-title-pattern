/**
 * 「隐藏会话」的装饰引擎：把配置里的隐藏列表落到侧边栏的真实行上。
 *
 * 一条回路：**配置 → 这一帧的有效状态 → decorate → 行内 style / 注入的眼睛**。
 * 所有触发源（DOM 变更、会话/工作区数据变更、配置变更）都只置一个 dirty 标志，
 * 由 `createFrameScheduler` 合并成每帧最多一趟（见 `./dom`）。
 *
 * 只改行内 `style`，**绝不靠加 class**：React 每次渲染都会整体重写 `className`
 * 属性，加上的类名会被抹掉；而这些行没有 `style` prop，React 不会碰行内样式。
 */
import type { Context } from '@deepseek-ai/cordis';
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client';
// 只为拿到 `ctx.sessions` 的类型增强（tsconfig 的 types 是空的，模块增强必须靠显式
// import 才会被加载）。type-only，不进产物。
import type {} from '@deepseek-ai/dsh-api-session-controller/client';

import { LOG } from '../log';
import type { LocaleTranslate } from '../locales';
import type { PluginConfig } from '../settings-card';
import { createHiddenConfigStore } from './config';
import type { HiddenConfig, HiddenConfigStore } from './config';
import {
  EYE_ATTR,
  HIDDEN_CSS,
  HIDDEN_STYLE_ID,
  bySuffix,
  createEye,
  createFrameScheduler,
  ensureEye,
  eyeIn,
  findAll,
  findSidebarRegion,
  injectStyle,
  installEyeTips,
  removeStyle,
  sessionIdOfRow,
  setEyeState,
  watchSidebarRegion,
} from './dom';

type Sessions = Context['sessions'];

/** 被显示出来的隐藏会话用多淡区分（唯一的视觉标记，用户明确要求不要加图标）。 */
const DIM_OPACITY = '0.55';

/** 一行的显示方式。 */
type RowMode = 'normal' | 'dim' | 'gone';

/** 一趟 decorate 里对「行 → 会话 id」解析成功率的统计，用于 fail-safe 判定。 */
interface RowStats {
  total: number;
  resolved: number;
}

/**
 * 这条会话当前该以什么方式显示。
 *
 * 规则（唯一真源）：
 * - 没隐藏 → 原样
 * - 隐藏但「开关打开」或「当前正打开着」→ 淡化
 * - 其余 → 藏
 *
 * 「当前正打开着」这一条只是**不把它藏起来**（正在聊的内容从侧边栏消失会让人以为
 * 会话没了），它仍然是「已隐藏」的身分，所以照样淡化 —— 与开关打开时看到的样子
 * 完全一致，点出去之后才按规则消失。
 */
function rowMode(isHidden: boolean, revealed: boolean, isCurrent: boolean): RowMode {
  if (!isHidden) return 'normal';
  if (revealed || isCurrent) return 'dim';
  return 'gone';
}

/** 把显示方式写进行内 style；值没变就不写，避免无谓的样式重算。 */
function setRowVisibility(row: HTMLElement, mode: RowMode): void {
  const display = mode === 'gone' ? 'none' : '';
  const opacity = mode === 'dim' ? DIM_OPACITY : '';
  if (row.style.display !== display) row.style.display = display;
  if (row.style.opacity !== opacity) row.style.opacity = opacity;
}

/** 行识别失效的告警只打一次，避免每帧刷屏。 */
function createWarner(): (message: string) => void {
  let warned = false;
  return (message: string): void => {
    if (warned) return;
    warned = true;
    console.warn(`${LOG} ${message}`);
  };
}

/**
 * 装上「隐藏会话」的全部客户端行为。
 *
 * @param ctx - 已注入 `settingsScope` 的上下文（不能拿原始 ctx 用，受保护代理会抛）。
 * @param scope - 绑定到本插件设置命名空间的设置作用域。
 * @param getT - 取当前语言的翻译函数（DOM 层不在 React 里，拿不到框架注入的 `t`）。
 */
export function installHiddenSessions(
  ctx: Context,
  scope: SettingsScope<PluginConfig>,
  getT: () => LocaleTranslate,
): void {
  const store: HiddenConfigStore = createHiddenConfigStore(scope);
  const warnOnce = createWarner();

  /** 可选会话服务：拿不到只是「当前会话先不藏」这条例外失效，不会阻断启动。 */
  const services: { sessions?: Sessions } = {};

  const scheduler = createFrameScheduler(() => decorate());
  const dirty = (): void => scheduler.schedule();

  const onSessionEye = (button: HTMLButtonElement): void => {
    const id = button.dataset.stpId;
    if (id === undefined || id.length === 0) return;
    store.toggleSession(id);
  };

  const onHeaderEye = (): void => {
    store.toggleAll();
  };

  /**
   * 处理一条会话行（分组列表与搜索结果共用同一套规则）。
   *
   * 搜索结果行也必须处理：否则一搜索就能"看到"被隐藏的会话。
   */
  const applySessionRow = (
    row: HTMLElement,
    config: HiddenConfig,
    hidden: ReadonlySet<string>,
    current: string | undefined,
    stats: RowStats,
  ): void => {
    const id = sessionIdOfRow(row);
    if (id === undefined) return;
    stats.resolved += 1;

    const isHidden = hidden.has(id);
    const revealed = isHidden && config.revealHiddenAll;
    setRowVisibility(row, rowMode(isHidden, revealed, id === current));

    // 眼睛挂在行内操作区里：那个容器本来就是 hover 才 `inline-flex`，
    // 可见性交给上游 CSS，我们不必自己写 hover 规则。
    const actions = row.querySelector<HTMLElement>(bySuffix('rowActions'));
    // blank 行没有操作区（也不该被隐藏），没有落点就跳过。
    if (actions === null) return;
    const eye = ensureEye(actions, 'session', onSessionEye);
    eye.dataset.stpId = id;
    const t = getT();
    setEyeState(eye, isHidden, isHidden ? t('unhideSession') : t('hideSession'));
  };

  /**
   * 「工作区」区域标题行上的总开关（一键全显 / 全隐）。
   *
   * 位置：放大镜**左边**。宽态下放大镜在 `_searchSlot` 里，插到它前面即可；
   * 折叠成图标栏（rail）时上游不渲染 `_searchSlot`，放大镜还移出了标题行
   * （成了它的兄弟节点），插不过去 —— 降级为挂在标题行末尾（「+」旁边）。
   */
  const ensureHeaderEye = (root: HTMLElement, config: HiddenConfig): void => {
    const header = root.querySelector<HTMLElement>(bySuffix('sectionHeader'));
    if (header === null) return;

    const slot = header.querySelector<HTMLElement>(bySuffix('searchSlot'));
    let eye = eyeIn(header, 'header');
    if (eye === null) eye = createEye('header', onHeaderEye);

    if (slot === null) {
      if (eye.parentElement !== header) header.append(eye);
    } else {
      // 被 React 挤掉 / 挤歪了就重插一次（两者都不在原点时才发现）。
      if (eye.parentElement !== header || eye.nextElementSibling !== slot) {
        header.insertBefore(eye, slot);
      }
      // 必须**紧贴**放大镜：`_searchSlot` 自带 `margin-left:auto`，而两个 auto 外边距
      // 会把剩余空间平分（眼睛就被挤到中间去了），所以把那个 auto 让给我们的眼睛。
      if (slot.style.marginLeft !== '0px') slot.style.marginLeft = '0px';
      if (eye.style.marginLeft !== 'auto') eye.style.marginLeft = 'auto';
    }

    const revealing = config.revealHiddenAll;
    const t = getT();
    setEyeState(eye, revealing, revealing ? t('collapseHidden') : t('showHidden'));
  };

  function decorate(): void {
    const config = store.read();

    // 总开关关掉：整套功能**不执行**。先把已经落到 DOM 上的痕迹撤掉（注入的眼睛、
    // 行上的 display / opacity、被我们动过的搜索槽外边距），否则关掉之后界面还停在
    // 上一个状态。隐藏列表与显示开关**一个字都不动** —— 重新打开时原样恢复。
    if (!config.enabled) {
      clearDecorations();
      return;
    }

    const root = findSidebarRegion();
    if (root === undefined) return;

    const hidden = new Set(config.hiddenSessions);
    const current = services.sessions?.list.getSnapshot().current;
    const stats: RowStats = { total: 0, resolved: 0 };

    for (const suffix of ['sessionRow', 'searchResultRow'] as const) {
      const rows = findAll(root, suffix);
      stats.total += rows.length;
      for (const row of rows) applySessionRow(row, config, hidden, current, stats);
    }

    // fail-safe：有行、却一条会话 id 都解析不出来 → 行识别整体失效（上游改了类名
    // 或换了 fiber 键）。此时**什么都不改**，连眼睛也不注入 —— 否则会留下一排
    // 点了没反应的死按钮，比不生效更糟。
    if (stats.total > 0 && stats.resolved === 0) {
      warnOnce('未能从会话行解析出会话 id，隐藏会话功能已停用（上游 DOM 结构可能变了）');
      return;
    }

    ensureHeaderEye(root, config);
  }

  ctx.effect(() => {
    injectStyle(HIDDEN_STYLE_ID, HIDDEN_CSS);
    const stopTips = installEyeTips();
    // 语言切换：重跑一趟 decorate，把眼睛的提示文案与无障碍标签换成新语言。
    ctx.on('locale/change', dirty);
    dirty();

    const stopWatch = watchSidebarRegion(dirty);
    const stopConfig = store.subscribe(dirty);

    // 会话服务用 ctx.inject 延迟等待：它在组合里不存在时只是「当前会话先不藏」这条例外
    // 失效，绝不能写进 inject 声明 —— 那会让本 entry 永远 pending，而 pending 的 entry
    // 会让整个 dsh 启动失败。
    let stopSessions: (() => void) | undefined;
    ctx.inject(['sessions'], (sub) => {
      services.sessions = sub.sessions;
      stopSessions = sub.sessions.list.subscribe(dirty);
      // 服务是晚一步到位的：到位后立刻补跑一趟，否则「当前会话例外」要等到下一次
      // 列表变化才生效。
      dirty();
    });

    return () => {
      stopSessions?.();
      stopConfig();
      stopWatch();
      stopTips();
      scheduler.cancel();
      clearDecorations();
      removeStyle(HIDDEN_STYLE_ID);
      store.dispose();
    };
  });

  /**
   * 拔掉本插件往上游 DOM 上留下的所有痕迹：注入的按钮、写过的行内样式、以及我们为了
   * 对齐位置而改掉的搜索槽 `margin-left`（少了最后一项，搜索框会停在错的位置上）。
   *
   * 两个调用点：插件卸载时（正常使用走不到），以及总开关被关掉时。
   * 幂等且廉价 —— 没有痕迹时是一趟空查询，值没变也不写 DOM。
   */
  function clearDecorations(): void {
    for (const eye of Array.from(document.querySelectorAll<HTMLElement>(`[${EYE_ATTR}]`))) {
      eye.remove();
    }
    for (const suffix of ['sessionRow', 'searchResultRow'] as const) {
      for (const row of findAll(document, suffix)) setRowVisibility(row, 'normal');
    }
    const slot = document.querySelector<HTMLElement>(bySuffix('searchSlot'));
    if (slot !== null && slot.style.marginLeft !== '') slot.style.marginLeft = '';
  }
}
