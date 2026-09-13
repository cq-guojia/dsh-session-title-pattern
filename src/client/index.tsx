import { useEffect, useRef, useState } from 'react';
import type { Context } from '@deepseek-ai/cordis';
// 下面几个只为拿到类型增强（SlotMap / SessionStandardProps / ctx.remote），
// 全部是 type-only，运行时不会引入，因此不会触发客户端产物纯度闸门。
import type {} from '@deepseek-ai/dsh-client-ui-session/client';
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client';
import type {} from '@deepseek-ai/dsh-api-remotes/client';
// ctx.slots 服务的类型增强在 renderer 包里，不在 slots 包里。
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client';
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
// 官方基础组件与图标。它们都在模块表（PLATFORM_MODULES）里，所以可以正常按 external
// 引入，不会被内联、也不会触发纯度闸门。用它们是为了与头部其它控件风格一致 ——
// 图标集有 49 个 `IconXxx16`，侧边栏开关等内置按钮用的就是同一套。
import { Button, IconEditOutline16, Switch, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives';
// settingsScope 的类型增强在设置包自身的 client 入口里。
import type {} from '@deepseek-ai/dsh-client-ui-settings/client';

import { SETTINGS_NS, SettingsCard } from './settings-card';
import type { CredentialsFace, LlmDirectory, PluginConfig } from './settings-card';
import { SETTINGS_CSS, SETTINGS_STYLE_ID } from './settings-css';

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

/** 浏览器控制台前缀，便于排查。 */
const LOG = '[dsh-session-title-pattern]';

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
};

/**
 * 锁定开关的悬浮提示。
 *
 * 把两边的行为都讲清楚：锁定 = 不再自动更新；解锁 = 恢复自动更新但**不动当前文字**
 * —— 这是刻意的：用户要求「解锁只是改状态，不要立刻重新生成」。
 */
const LOCK_HINT =
  '锁定后，标题不会随对话轮数自动更新；解除锁定即恢复自动更新（标题文字保持不变）';

function GenerateTitleAction({
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
    // 必须套一层 span 当锚点：Tooltip 要往子元素注入 ref，而 Button 不转发 ref。
    <span ref={wrapRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <Tooltip label="重命名会话" side="bottom" delayMs={500}>
        <span style={{ display: 'inline-flex' }}>
          <Button
            variant="ghost"
            size="sm"
            icon={<IconEditOutline16 size={16} />}
            disabled={running}
            onClick={() => (open ? close() : openPanel())}
            // 禁用的原生控件不派发鼠标事件，Tooltip 不会出现，补一条原生提示说明原因。
            title={running ? '会话回复中，暂不能重命名' : undefined}
            aria-label="重命名会话"
          />
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
              重命名会话
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="关闭"
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
            placeholder="输入新的会话标题"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') save();
            }}
            style={inputStyle}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Tooltip label={LOCK_HINT} side="top" delayMs={400}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Switch checked={locked} label="锁定标题" onChange={() => toggleLock()} />
                <span style={{ fontSize: 12, color: 'var(--dsw-alias-label-secondary)' }}>锁定</span>
              </span>
            </Tooltip>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" onClick={close} style={ghostButton(false)}>
                取消
              </button>
              <button
                type="button"
                disabled={busy || running}
                onClick={generateDraft}
                style={ghostButton(busy || running)}
              >
                {busy ? '生成中…' : '自动生成'}
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
                确定保存
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
/** 按 id 幂等地往页面注入一段样式。重复激活不会叠加。 */
function injectStyle(id: string, css: string): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(id) !== null) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.append(style);
}

function removeStyle(id: string): void {
  if (typeof document === 'undefined') return;
  document.getElementById(id)?.remove();
}

function installCrumbWidth(): void {
  injectStyle(CRUMB_STYLE_ID, `[class*="_crumbCurrent"]{max-width:${CRUMB_MAX_WIDTH} !important;}`);
}

export function apply(ctx: Context): void {
  // 放宽会话标题宽度上限。纯样式改动，与后面的槽位注册互不依赖，
  // 放在最前面是为了尽早注入，避免标题先按 220px 渲染再跳变。
  ctx.effect(() => {
    installCrumbWidth();
    // 设置卡片的样式：逐条照抄官方卡片与字段的规则（见 settings-css.ts）。
    injectStyle(SETTINGS_STYLE_ID, SETTINGS_CSS);
    return () => {
      removeStyle(CRUMB_STYLE_ID);
      removeStyle(SETTINGS_STYLE_ID);
    };
  });

  // remote 命名空间的挂载可能晚于 slot 注册，所以不能提前闭包捕获 ——
  // 提前捕获会拿到 undefined，表现为「按钮在但点了没反应」。
  let commands: RemoteCommands | undefined;
  ctx.inject(['remote', 'remote.commands'], (sub) => {
    commands = sub.remote.commands;
  });

  /**
   * 面板与按钮的所有动作都收敛到这一条：往会话发命令行。
   *
   * 命令成功时把结果文本 resolve 回去（「自动生成」靠它拿草稿标题）；
   * 失败记控制台并 resolve undefined —— 界面保持原状，host 侧留有日志。
   */
  const runLine = (sessionId: string, line: string): Promise<string | undefined> => {
    if (commands === undefined) {
      console.warn(`${LOG} remote.commands 尚未就绪，无法执行 ${line}`);
      return Promise.resolve(undefined);
    }
    return commands
      .execute(sessionId, line, [])
      .then((execution: unknown) => {
        const result = (
          execution as { result?: { kind: string; text?: string } } | undefined
        )?.result;
        if (result === undefined) {
          // execute() 对「行不以 / 开头」与「命令未注册」都返回 undefined 且不留任何日志，
          // 这里补一条：下次再出现「点了没反应」时，控制台至少能看出是命令没命中。
          console.warn(`${LOG} ${line} 未被执行：行必须以 / 开头，且命令名必须已注册`);
          return undefined;
        }
        if (result.kind === 'error') {
          console.warn(`${LOG} ${line} 失败：${result.text ?? '（无详情）'}`);
          return undefined;
        }
        return result.text;
      })
      .catch(() => undefined);
  };

  /**
   * 自检：本面板依赖的命令是否都在 host 注册了。
   *
   * `execute()` 对「命令没注册」只回一个 undefined、不留任何痕，表现就是点了没反应。
   * 打开面板时列一次命令表，缺哪条直接写进控制台 —— 不用再靠猜。
   */
  const checkCommands = (sessionId: string): void => {
    if (commands === undefined) return;
    void commands
      .list(sessionId)
      .then((entries: readonly { name: string }[]) => {
        const known = new Set(entries.map((entry) => entry.name));
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

  // 模型目录：provider 列表与每个 provider 已配置的模型都来自 llm 远端命名空间
  // 加设置镜像。拿不到就只是「两行退回文本输入」，不影响其它配置。
  let llmDirectory: LlmDirectory | undefined;
  ctx.inject(['remote', 'remote.llm'], (sub) => {
    llmDirectory = sub.remote.llm as unknown as LlmDirectory;
  });

  // 凭据域：用来判断「这个供应商的 key 到底配没配」。命名空间由部署侧组合提供，
  // 拿不到就只是退化成「只看设置文档的用户层」，不影响其它功能。
  let credentialsFace: CredentialsFace | undefined;
  ctx.inject(['remote', 'remote.credentials'], (sub) => {
    credentialsFace = (sub.remote as unknown as Record<string, CredentialsFace | undefined>).credentials;
  });

  // 设置卡片：host 半用同一个命名空间注册 settings section，这里按命名空间注册卡片，
  // 设置页的「插件」标签页会遍历已服务的命名空间并自动配对渲染。
  ctx.inject(['slots', 'settingsScope'], (sub) => {
    const scope = sub.settingsScope.bind<PluginConfig>({ namespace: SETTINGS_NS });
    const describe = sub.settingsScope.describe();
    sub.slots.inject('settings.plugin.item', () =>
      sub.slots.register(
        {
          name: 'settings.plugin.item',
          // keyed 槽位用 key 声明本条贡献给哪个命名空间（list 才是 id/order）。
          key: SETTINGS_NS,
          inject: () => ({
            scope,
            describe,
            getLlm: () => llmDirectory,
            getCredentials: () => credentialsFace,
          }),
        },
        SettingsCard,
      ),
    );
    console.info(`${LOG} 已注册设置卡片到 settings.plugin.item（${SETTINGS_NS}）`);
  });
}
