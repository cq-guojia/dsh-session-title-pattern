import { useEffect, useRef, useState } from 'react';
import type { Context } from '@deepseek-ai/cordis';
// 下面几个只为拿到类型增强（SlotMap / SessionStandardProps / ctx.remote），
// 全部是 type-only，运行时不会引入，因此不会触发客户端产物纯度闸门。
import type {} from '@deepseek-ai/dsh-client-ui-session/client';
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client';
import type {} from '@deepseek-ai/dsh-api-remotes/client';
// ctx.slots 服务的类型增强在 renderer 包里，不在 slots 包里。
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client';
// `plugins.bundle.config` 槽位契约（SlotMap 增强）在插件管理页包的 client 入口里。
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client';
// ctx.configForms 服务的类型增强在设置包自身的 client 入口里（settingsScope 已随
// dsh 0.1.7 删除，设置读写统一走共享的 ConfigForm）。
import type {} from '@deepseek-ai/dsh-client-ui-settings/client';
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
// 官方基础组件。它们都在模块表（PLATFORM_MODULES）里，所以可以正常按 external
// 引入，不会被内联、也不会触发纯度闸门。用它们是为了与头部其它控件风格一致。
import { Switch, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives';
import {
  SettingsFormModel,
  settingsNumberField,
  settingsTextField,
} from '@deepseek-ai/dsh-client-ui-primitives';
// 图标必须从命名空间按名取用（见下方 EditIcon 的兜底链），不能具名导入：
// 上游改名时具名导入在编译期过不了类型、运行时拿到 undefined，React 渲染直接抛错。
import * as primitives from '@deepseek-ai/dsh-client-ui-primitives';
// `remote.commands` 的入参是品牌化的 SessionId，不能拿裸 string 顶。
import type { SessionId } from '@deepseek-ai/dsh-session/types';

import { ConfigPanel } from './config-panel';
import type { PanelState, PluginConfig } from './config-panel';
import { DirectoryStore } from './model-pair';
import type { LlmDirectory } from './model-pair';
import { LOCALE_NS, zh, en } from './locales';
import { LOG } from './log';
import { injectStyle, removeStyle, PAIR_STYLE_ID, PAIR_CSS, ICONBTN_STYLE_ID, ICONBTN_CSS } from './style';

export const name = 'dsh-session-title-pattern';

/**
 * 会话头部的动作区。cardinality 为 list，注册新 id 即增量追加，不会覆盖内置项。
 *
 * 位置依据：上游的头部结构是 `titleCluster > (crumbs, headerActions)`，
 * 即这一组**紧贴标题之后**，截图里那个「标准模式」指示器就是本槽位的占用者。
 *
 * 注意：这里**不会**影响标题宽度。标题宽度由上游 `.crumb` 的 `max-width` 决定
 * （已由 installCrumbWidth() 放宽），只要可用宽度够，头部控件宽窄就与标题无关。
 */
const SLOT = 'conversation.session.header.actions';

/**
 * 同区内按 order 升序排列（越小越靠左）。
 *
 * 取一个足够小的负数，保证排在所有占用者之前 —— 即**标题右边第一个**，
 * 内置的「标准模式」落在我们右侧；其他插件后挂的条目同样排在我们右边。
 */
const ACTION_ORDER = -1000;

/** 本菜单项在列表中的地址，必须全局唯一。 */
const ENTRY_ID = 'generate-title';

/**
 * 插件详情页配置槽位（dsh 0.1.7）。keyed 槽位，key 必须与包名逐字相同 ——
 * 插件管理页用 `ledger.bundles.has(pkg.name)` 判断要不要在详情页渲染配置区。
 */
const BUNDLE_CONFIG_SLOT = 'plugins.bundle.config';

/**
 * 下面四条是**完整的命令行**，必须带前导斜杠。
 *
 * host 端 `CommandRuntime.execute()` 用 `parseCommand()` 解析，正则要求
 * `^\/[a-z][a-z0-9_-]*`：不带斜杠时它直接返回 undefined，而且属于
 * "admission miss"（语法不合规），**连日志都不记** —— 表现就是按钮点了没反应、
 * 控制台一片安静（v0.6.0 起四个按钮全废，根因就在这里）。
 */
/** 手动改名命令（host 端注册）：写入「用户」来源的标题，写入即进入锁定态。 */
const RENAME_LINE = '/title-rename';

/** 锁定命令：把当前标题以「用户」来源写回，停止自动更新。 */
const LOCK_LINE = '/title-lock';

/** 解锁命令：恢复自动更新。标题内容不变，不触发重新生成。 */
const UNLOCK_LINE = '/title-unlock';

/** 草稿命令：按当前对话真算一版标题，只返回文本、不写入，给「自动生成」按钮用。 */
const SUGGEST_LINE = '/title-suggest';

/** 状态查询命令：问 host「当前标题锁没锁」，回答是 `locked` / `unlocked`。 */
const STATE_LINE = '/title-state';

/**
 * 本面板依赖的全部命令（不含斜杠），打开时用来自检。
 *
 * 「点了没反应」最费时间的一处就是猜命令到底注册上没有，直接把缺哪条打出来。
 */
const REQUIRED_COMMANDS = [RENAME_LINE, LOCK_LINE, UNLOCK_LINE, SUGGEST_LINE, STATE_LINE].map(
  (line) => line.slice(1),
);

/** 注入的样式元素 id。带 id 是为了判重，保证重复激活不会叠加规则。 */
const CRUMB_STYLE_ID = 'dsh-session-title-pattern-crumb-width';

/**
 * 当前会话标题（面包屑最后一段）的宽度上限。
 *
 * 上游 `.crumb` 把宽度写死成 `max-width:220px`，减掉左右内边距 16px 只剩 204px；
 * 我们的标题前缀「日期｜类型」就吃掉约 94px，留给主题的只有约 110px ——
 * 14px 字号下即七八个中文字，这就是「窗口很大标题却很短」的原因。
 *
 * 这里按标题上限 80 字节（约 40 个中文，约 560px）留足余量，再用 60vw 兜住窄窗口。
 */
const CRUMB_MAX_WIDTH = 'min(640px, 60vw)';

type RemoteCommands = Context['remote']['commands'];

// 刻意不导出 inject。
// 客户端 entry 若声明了当前组合无法满足的依赖，会一直 pending，而 pending 的
// entry 会让整个 dsh 启动失败。这里改用 apply 内的 ctx.inject() 延迟等待，
// 依赖没出现的最坏结果只是「没有按钮」。

/**
 * 铅笔图标的三行防御。
 *
 * dsh 0.1.7 把图标集整体改名（`IconEditOutline16` → `IconEditOutlineRegular`），
 * 缺失的名字在上游模块系统里解析成 undefined，React 渲染直接抛
 * "Element type is invalid"，**整个头部动作区静默消失** —— v0.8.0 的铅笔就是这么
 * 没的。所以这里不用具名导入，而是从模块命名空间上**按名取用**并逐级兜底：
 * 上游再改名时只是图标退回内联 SVG（控制台 warn 一次），按钮不再整块消失。
 */
type IconLike = (props: { size?: number }) => React.ReactNode;

const FallbackEditIcon: IconLike = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M11.13 2.09a1.56 1.56 0 0 1 2.2 2.2L5.4 12.23l-3.02.9.9-3.02 7.85-8.02z" />
  </svg>
);

/**
 * 三行兜底链：0.1.7 的 `IconEditOutlineRegular` ?? 旧名 `IconEditOutline16` ?? 内联 SVG。
 * 都没有时只在控制台 warn 一次，按钮照常渲染 —— 宁可图标朴素，绝不整块消失。
 */
const EditIcon = ((primitives as unknown as Record<string, unknown>).IconEditOutlineRegular ??
  (primitives as unknown as Record<string, unknown>).IconEditOutline16 ??
  FallbackEditIcon) as typeof FallbackEditIcon;

if (EditIcon === FallbackEditIcon) {
  console.warn(`${LOG} 上游图标导出表里没有铅笔图标，已退回内联 SVG`);
}

type HeaderActionProps = PropsRuntime<typeof SLOT> & {
  /** 算一版标题草稿：成功时 resolve 出标题文本，失败/不可用 resolve undefined。 */
  suggest: () => Promise<string | undefined>;
  /** 手动改名（host 端截断到标题上限；写入即自动锁定）。 */
  rename: (title: string) => void;
  /** 锁定当前标题（内容不变，停止自动更新）。 */
  lock: () => void;
  /** 解锁（恢复自动更新；标题内容不变，不触发重新生成）。 */
  unlock: () => void;
  /** 问 host「锁没锁」：回答 `locked` / `unlocked`，失败 resolve undefined。 */
  readState: () => Promise<string | undefined>;
  /** 自检：本面板依赖的命令是否都注册了，缺的打进控制台。 */
  checkCommands: () => void;
} & PropsLocale<typeof LOCALE_NS>;

function GenerateTitleAction({
  t,
  useSession,
  useProjection,
  suggest,
  rename,
  lock,
  unlock,
  readState,
  checkCommands,
}: HeaderActionProps) {
  // 会话正在跑时禁用，避免与正在生成的标题竞争。
  const running = useSession((snapshot) => snapshot.running);
  // 当前标题走平台的 title 投影（实时推送），面板打开时预填进输入框。
  const currentTitle = typeof useProjection === 'function' ? useProjection('title') : undefined;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  /** 「自动生成」请求在途：期间按钮显示生成中并禁用，防止连点并发调模型。 */
  const [busy, setBusy] = useState(false);
  // 锁定态只有本地记忆：平台的标题投影不带来源，刷新页面后按未锁定显示。
  const [locked, setLocked] = useState(false);
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  /**
   * 卡片左缘相对锚点的横向偏移：对齐**会话标题的左缘**，而不是右缘贴着铅笔按钮
   * —— 贴右会让卡片向左伸过标题、左半截压进侧边栏底下（实机反馈）。
   * 标题元素用 `_crumbCurrent` 定位（与 crumbWidth 覆盖同一个识别方式）；
   * 找不到就退回 0（贴着铅笔右对齐的旧定位），宁歪勿丢。
   */
  const [panelLeft, setPanelLeft] = useState<number | null>(null);

  const close = (): void => setOpen(false);

  // 点面板外面就收起。原生的 Menu 组件存在，但锚定 API 未在类型里稳定导出，
  // 自绘一个浮层反而更可控（样式内联，不依赖额外注入）。
  useEffect(() => {
    if (!open) return;
    const anchor = wrapRef.current;
    if (anchor === null) return;
    const crumb = document.querySelector('[class*="_crumbCurrent"]');
    if (crumb !== null) {
      setPanelLeft(crumb.getBoundingClientRect().left - anchor.getBoundingClientRect().left);
    } else {
      setPanelLeft(null);
    }
    const onDown = (event: MouseEvent): void => {
      if (wrapRef.current !== null && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const openPanel = (): void => {
    setDraft(typeof currentTitle === 'string' ? currentTitle : '');
    setOpen(true);
    // 锁定态以 host 为准：本地 state 刷新即丢，而「锁没锁」只有 host 看得到
    // （title 投影只带文本不带来源）。问一次再显示，避免刷新后开关说谎。
    void readState().then((text) => {
      if (typeof text !== 'string') return;
      setLocked(text.trim() === 'locked');
    });
    checkCommands();
  };

  /**
   * 自动生成：host 真算一版草稿（按当前模式走 LLM 或规则），**只填进输入框**，
   * 保存与否由用户点「确定保存」决定 —— 这是面板与直接 /retitle 的核心区别。
   */
  const generateDraft = (): void => {
    setBusy(true);
    void suggest().then((text) => {
      setBusy(false);
      if (typeof text === 'string' && text.length > 0) setDraft(text);
      // 失败（undefined）：保留输入框原内容，host 侧已留日志。
    });
  };

  const save = (): void => {
    const text = draft.trim();
    if (text.length === 0 || busy) return;
    // rename 写入即「用户来源」= 锁定（平台唯一的手动写入语义），开关随之显示锁定。
    rename(text);
    setLocked(true);
    close();
  };

  const toggleLock = (): void => {
    if (locked) {
      unlock(); // 单纯解锁：标题文字不变，不触发重新生成。
      setLocked(false);
    } else {
      lock(); // 锁定的是已保存的标题（内容不变）。
      setLocked(true);
    }
  };

  const inputStyle = {
    boxSizing: 'border-box' as const,
    width: '100%',
    height: 34,
    font: 'inherit',
    color: 'var(--dsw-alias-label-primary)',
    background: 'var(--dsw-alias-bg-layer-3)',
    border: '.5px solid var(--dsw-alias-border-l4)',
    borderRadius: 8,
    padding: '0 10px',
    fontSize: 13,
  };
  const ghostButton = (disabled: boolean): React.CSSProperties => ({
    appearance: 'none', font: 'inherit', cursor: disabled ? 'default' : 'pointer',
    background: 'transparent', border: '.5px solid var(--dsw-alias-border-l4)',
    borderRadius: 8, padding: '0 12px', height: 30, fontSize: 13,
    color: 'var(--dsw-alias-label-primary)', opacity: disabled ? 0.4 : 1,
  });

  return (
    // 必须套一层 span 当锚点：Tooltip 要往子元素注入 ref，我们的定位也以它为基准。
    <span ref={wrapRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <Tooltip label={t('renameTitle')} side="bottom" delayMs={500}>
        <span style={{ display: 'inline-flex' }}>
          {/* 不用官方 Button：ghost sm 是 36×28 胶囊（r14），比系统头部按钮宽一圈。
              几何与形状语义都在 style.ts 的 ICONBTN_CSS 里，改样式去那里。 */}
          <button
            type="button"
            className="stp-iconBtn"
            disabled={running}
            onClick={() => (open ? close() : openPanel())}
            // 禁用的原生控件不派发鼠标事件，Tooltip 不会出现，补一条原生提示说明原因。
            title={running ? t('renameDisabledHint') : undefined}
            aria-label={t('renameTitle')}
          >
            <EditIcon size={16} />
          </button>
        </span>
      </Tooltip>
      {open ? (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            // 左缘对齐会话标题（打开时实测的偏移）；取不到标题元素时退回贴锚点。
            left: panelLeft ?? 0,
            zIndex: 30,
            width: 420,
            maxWidth: 'calc(100vw - 48px)',
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            background: 'var(--dsw-alias-bg-layer-2)',
            border: '.5px solid var(--dsw-alias-border-l4)',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgb(0 0 0 / 18%)',
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') close();
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--dsw-alias-label-primary)' }}>
              {t('renameTitle')}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label={t('closeAria')}
              style={{
                appearance: 'none', font: 'inherit', cursor: 'pointer', lineHeight: 1,
                background: 'transparent', border: 'none', fontSize: 16,
                color: 'var(--dsw-alias-label-secondary)', padding: 2,
              }}
            >
              ×
            </button>
          </div>
          <input
            value={draft}
            placeholder={t('renamePlaceholder')}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') save();
            }}
            style={inputStyle}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Tooltip label={t('lockHint')} side="top" delayMs={400}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Switch checked={locked} label={t('lockLabel')} onChange={() => toggleLock()} />
                <span style={{ fontSize: 12, color: 'var(--dsw-alias-label-secondary)' }}>
                  {t('lockShort')}
                </span>
              </span>
            </Tooltip>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" onClick={close} style={ghostButton(false)}>
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={busy || running}
                onClick={generateDraft}
                style={ghostButton(busy || running)}
              >
                {busy ? t('generating') : t('autoGenerate')}
              </button>
              <button
                type="button"
                disabled={busy || draft.trim() === ''}
                onClick={save}
                style={{
                  appearance: 'none', font: 'inherit', cursor: draft.trim() === '' || busy ? 'default' : 'pointer',
                  border: '1px solid #0000', borderRadius: 8, padding: '0 12px', height: 30, fontSize: 13,
                  background: 'var(--dsw-alias-label-primary)', color: 'var(--dsw-alias-bg-layer-3)',
                  opacity: draft.trim() === '' || busy ? 0.4 : 1,
                }}
              >
                {t('confirmSave')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </span>
  );
}

/**
 * 放宽当前会话标题的宽度上限。
 *
 * 为什么只能用 CSS 覆盖：会话标题是头部面包屑的最后一段，上游对它只有
 * `.crumb{max-width:220px}` 这一条宽度约束，而且没有任何槽位能改写它 ——
 * `conversation.session.header.lineage` 的契约是「面包屑标题的可选渲染器」，
 * 但**当前会话的 title 元素由上游无条件原生渲染**，槽位只能作为它后面的兄弟节点。
 *
 * 为什么必须 `!important`：属性选择器与上游 `.wSkVaW_crumb` 特异性相同（都是 0,1,0），
 * 平局按源码顺序决胜，而我们的注入顺序无法保证。
 *
 * 为什么只匹配 `_crumbCurrent`：它只命中最后一个面包屑，即当前会话标题；
 * 祖先会话与子代理的面包屑（只有 `_crumb`）保持 220px，不挤占同一行空间。
 * 宽度不足时也不会溢出 —— `.crumb` 自带 `overflow:hidden`，flex 项的
 * `min-width:auto` 因此解析为 0，会自动收缩并省略。
 *
 * 失效模式：选择器依赖 CSS Modules 生成的局部类名后缀 `_crumbCurrent`。
 * 上游若重命名该类名，本规则会**静默失效**（不报错、不崩溃，只是标题又变短）。
 * 排查方法：DevTools 选中标题元素，看它 class 属性里是否还有 `_crumbCurrent`。
 */
function installCrumbWidth(): void {
  injectStyle(CRUMB_STYLE_ID, `[class*="_crumbCurrent"]{max-width:${CRUMB_MAX_WIDTH} !important;}`);
}

export function apply(ctx: Context): void {
  // 放宽会话标题宽度上限。纯样式改动，与后面的槽位注册互不依赖，
  // 放在最前面是为了尽早注入，避免标题先按 220px 渲染再跳变。
  ctx.effect(() => {
    installCrumbWidth();
    // 「供应商 + 模型」一行两个下拉的样式（配置表单用）。
    injectStyle(PAIR_STYLE_ID, PAIR_CSS);
    // 头部铅笔按钮的 Icon_container 形态样式。
    injectStyle(ICONBTN_STYLE_ID, ICONBTN_CSS);
    return () => {
      removeStyle(CRUMB_STYLE_ID);
      removeStyle(PAIR_STYLE_ID);
      removeStyle(ICONBTN_STYLE_ID);
    };
  });

  /**
   * 模型目录 store（配置表单的 provider / model 下拉数据源）。
   *
   * 两组服务（`remote.llm` 与设置镜像 face）就绪时序不定，DirectoryStore.load()
   * 两阶段喂参数，齐了自动加载一次。0.1.7 没有凭据域远端（remote 命名空间表里
   * 已无 credentials），目录只按设置文档判定，界面文案已说明口径。
   */
  const directoryStore = new DirectoryStore();
  ctx.inject(['remote', 'remote.llm'], (sub) => {
    directoryStore.load(sub.remote.llm as unknown as LlmDirectory);
  });

  /**
   * 界面文案（中英双语）。
   *
   * 词典注册要等 locale 服务，所以用 `ctx.inject` 延迟等待 —— 绝不能写进模块级
   * 注入声明：组合里缺它会让整个客户端 entry 一直 pending。React 组件的 `t` 由
   * 框架经槽位的 `locale: LOCALE_NS` 声明注入，语言切换自动重渲。
   */
  ctx.inject(['locale'], (localeCtx) => {
    ctx.effect(() => localeCtx.locale.register(LOCALE_NS, { zh, en }));
  });

  // remote 命名空间的挂载可能晚于 slot 注册，所以不能提前闭包捕获 ——
  // 提前捕获会拿到 undefined，表现为「按钮在但点了没反应」。
  let commands: RemoteCommands | undefined;
  ctx.inject(['remote', 'remote.commands'], (sub) => {
    commands = sub.remote.commands;
  });

  /**
   * 从远端回答里取出 `CommandResult`。
   *
   * 远端通道**实际**返回什么，本地验证不了：消费 `TYPERT_REMOTE` 的运行时在 dsh
   * 里，不在 node_modules。而实测出现过「host 明明执行了（标题改了 / 会话里出了
   * 命令结果），客户端却拿到一个读不出 `result` 的东西」—— 于是草稿填不进输入框、
   * 锁定态也读不回来。
   *
   * 所以这里按可能的封装逐层剥，认出 `kind` 就算成功：
   *   `{ commandId, result }`  —— 描述符声明的形状
   *   `{ kind, text }`         —— 直接就是 CommandResult
   *   `{ ok, value }` / `{ value }` —— 传输层再包一层
   * 认不出就把原始结构打进控制台，下次不必再猜。
   */
  const readCommandResult = (raw: unknown): { kind: string; text?: string } | undefined => {
    let node: unknown = raw;
    for (let depth = 0; depth < 3; depth += 1) {
      if (node === null || typeof node !== 'object') return undefined;
      const record = node as Record<string, unknown>;
      if (typeof record.kind === 'string') {
        return {
          kind: record.kind,
          text: typeof record.text === 'string' ? record.text : undefined,
        };
      }
      const next = record.result ?? record.value;
      if (next === undefined) return undefined;
      node = next;
    }
    return undefined;
  };

  /** 把任意值打成可读的一段，用于「认不出形状」时把真相打出来。 */
  const describe = (raw: unknown): string => {
    try {
      return JSON.stringify(raw) ?? String(raw);
    } catch {
      return String(raw);
    }
  };

  /**
   * 面板与按钮的所有动作都收敛到这一条：往会话发命令行。
   *
   * 命令成功时把结果文本 resolve 回去（「自动生成」靠它拿草稿标题、
   * 「锁定态」靠它拿 locked/unlocked）；失败记控制台并 resolve undefined ——
   * 界面保持原状，host 侧留有日志。
   */
  const runLine = (sessionId: SessionId, line: string): Promise<string | undefined> => {
    if (commands === undefined) {
      console.warn(`${LOG} remote.commands 尚未就绪，无法执行 ${line}`);
      return Promise.resolve(undefined);
    }
    return commands
      .execute(sessionId, line, [])
      .then((execution: unknown) => {
        const result = readCommandResult(execution);
        if (result === undefined) {
          // 注意：这一支**不等于**命令没执行 —— host 可能已经照做了（会话里会出现
          // 命令结果），只是我们没认出返回值。所以文案里不再断言「未被执行」。
          console.warn(`${LOG} ${line} 未取到执行结果（原始返回：${describe(execution)}）`);
          return undefined;
        }
        if (result.kind === 'error') {
          console.warn(`${LOG} ${line} 失败：${result.text ?? '（无详情）'}`);
          return undefined;
        }
        return result.text;
      })
      .catch((error: unknown) => {
        console.warn(`${LOG} ${line} 调用失败：${String(error)}`);
        return undefined;
      });
  };

  /**
   * 自检：本面板依赖的命令是否都在 host 注册了。
   *
   * `execute()` 对「命令没注册」只回一个 undefined、不留任何痕，表现就是点了没反应。
   * 打开面板时列一次命令表，缺哪条直接写进控制台 —— 不用再靠猜。
   */
  const checkCommands = (sessionId: SessionId): void => {
    if (commands === undefined) return;
    void commands
      .list(sessionId)
      .then((raw: unknown) => {
        // 同样是「实际形状未知」：可能是裸数组，也可能包了一层 `{ value }`。
        const node = (raw as { value?: unknown } | null) ?? null;
        const entries = Array.isArray(raw) ? raw : Array.isArray(node?.value) ? node?.value : undefined;
        if (entries === undefined) {
          console.warn(`${LOG} 未能读取命令列表（原始返回：${describe(raw)}）`);
          return;
        }
        const known = new Set(
          (entries as readonly { name?: unknown }[]).map((entry) =>
            typeof entry?.name === 'string' ? entry.name : '',
          ),
        );
        const missing = REQUIRED_COMMANDS.filter((name) => !known.has(name));
        if (missing.length > 0) {
          console.warn(`${LOG} 命令未注册（点了会没反应）：${missing.join('、')}`);
        }
      })
      .catch(() => undefined);
  };

  ctx.inject(['slots'], (sub) => {
    // slots.inject 等待 owner 声明该 slot，owner 折叠时贡献自动移除。
    sub.slots.inject(SLOT, () =>
      sub.slots.register(
        {
          name: SLOT,
          id: ENTRY_ID,
          order: ACTION_ORDER,
          // 声明词典命名空间 → 框架把 t 注入组件，且语言切换时自动重渲。
          locale: LOCALE_NS,
          // factory 在 apply 世界中运行；session scope 的 slot 会收到框架
          // 解析出的 sessionId。
          inject: (sessionId) => ({
            suggest: () => runLine(sessionId, SUGGEST_LINE),
            rename: (title: string) => void runLine(sessionId, `${RENAME_LINE} ${title}`),
            lock: () => void runLine(sessionId, LOCK_LINE),
            unlock: () => void runLine(sessionId, UNLOCK_LINE),
            readState: () => runLine(sessionId, STATE_LINE),
            checkCommands: () => checkCommands(sessionId),
          }),
        },
        GenerateTitleAction,
      ),
    );
    console.info(`${LOG} 已注册重命名面板到 ${SLOT}`);
  });

  // 插件详情页的配置表单（dsh 0.1.7：设置入口从对话侧边栏搬到了这里）。
  //
  // 状态机全部交给官方 `SettingsFormModel`：它 stage 在官方共享的 ConfigForm
  // （`ctx.configForms.get(ns)`）之上，save 一次性原子提交；这里只负责把投影与
  // 动作接进槽位组件。`whileServed` 保证宿主没登记这个命名空间时（比如 entry 被
  // 禁用）详情页不留任何痕迹；`slots.inject` 等 owner 声明槽位。
  ctx.inject(['slots', 'locale', 'configForms'], (sub) => {
    // 设置镜像 face：目录加载要读各 provider 的设置文档（profile.models）。
    directoryStore.load(undefined, sub.configForms.describe());
    const model = new SettingsFormModel<PluginConfig>(
      sub.configForms.get<PluginConfig>(LOCALE_NS),
      [
        settingsNumberField('retitleEvery'),
        settingsTextField('provider'),
        settingsTextField('model'),
        settingsNumberField('timeoutMs'),
        settingsTextField('template'),
        settingsNumberField('maxBytes'),
      ],
    );
    /** 卡片级状态 + 六个字段的控件态，一次投影全量发布。 */
    const store = model.bind<PanelState>(() => ({
      ...model.shell(),
      retitleEvery: model.field('retitleEvery'),
      provider: model.field('provider'),
      model: model.field('model'),
      timeoutMs: model.field('timeoutMs'),
      template: model.field('template'),
      maxBytes: model.field('maxBytes'),
    }));
    const actions = model.actions();
    ctx.effect(() => () => model.dispose());
    ctx.effect(() =>
      sub.configForms.whileServed([LOCALE_NS], () =>
        sub.slots.inject(BUNDLE_CONFIG_SLOT, () =>
          sub.slots.register(
            {
              name: BUNDLE_CONFIG_SLOT,
              // keyed 槽位：key 必须与包名逐字相同。
              key: name,
              locale: LOCALE_NS,
              inject: () => ({
                hooks: { panel: store, directory: directoryStore },
                // 包一层把「是否真的落地」带给组件：成功弹平台 Toast（v0.7.6 口径），
                // 失败由 SettingsForm 自带的 saveFailed 文案说明（草稿保留）。
                save: () =>
                  model.save().then(() => !model.shell().failed),
                edit: actions.edit,
                resetField: actions.resetField,
                discard: actions.discard,
              }),
            },
            ConfigPanel,
          ),
        ),
      ),
    );
    console.info(`${LOG} 已注册配置表单到 ${BUNDLE_CONFIG_SLOT}（${LOCALE_NS}）`);
  });
}
