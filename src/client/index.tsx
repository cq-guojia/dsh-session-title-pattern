import type { Context } from '@deepseek-ai/cordis';
// 下面几个只为拿到类型增强（SlotMap / SessionStandardProps / ctx.remote），
// 全部是 type-only，运行时不会引入，因此不会触发客户端产物纯度闸门。
import type {} from '@deepseek-ai/dsh-client-ui-session/client';
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client';
import type {} from '@deepseek-ai/dsh-api-remotes/client';
// ctx.slots 服务的类型增强在 renderer 包里，不在 slots 包里。
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client';
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
// 官方基础组件。它在模块表（PLATFORM_MODULES）里，所以可以正常按 external 引入，
// 不会被内联、也不会触发纯度闸门。用它是为了让按钮与头部其它控件风格一致。
import { Button } from '@deepseek-ai/dsh-client-ui-primitives';

export const name = 'dsh-session-title-pattern';

/**
 * 会话头部右侧的工具区。cardinality 为 list，注册新 id 即增量追加，不会覆盖内置项。
 *
 * 用图标而不是文字按钮，是为了和同排的 `...` 等控件观感统一（约 36px vs 约 68px）。
 *
 * 注意：这**不会**让标题变宽。标题宽度由上游 `.crumb` 的 `max-width:220px` 决定，
 * 只要可用宽度大于 220px，头部控件宽窄就完全不影响标题 —— 多出来的空间只会留在
 * `.titleCluster` 里。标题本身的宽度问题由 installCrumbWidth() 处理。
 */
const SLOT = 'conversation.session.header.utilities';

/** 本菜单项在列表中的地址，必须全局唯一。 */
const ENTRY_ID = 'generate-title';

/** 触发 host 端重算的命令行。 */
const RETITLE_LINE = '/retitle';

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
  /** 由注册项的 inject factory 注入：对当前会话执行 /retitle。 */
  generate: () => void;
};

/**
 * 四个尖角的星形，表示「生成」。
 *
 * 必须内联：`ui-primitives` 只导出文件/链接/引用类图标，没有通用图标集。
 */
const SparkleIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M8 1.8 9.35 5.6 13.2 6.95 9.35 8.3 8 12.1 6.65 8.3 2.8 6.95 6.65 5.6Z"
      fill="currentColor"
    />
  </svg>
);

function GenerateTitleAction({ useSession, generate }: HeaderActionProps) {
  // 会话正在跑时禁用，避免与正在生成的标题竞争。
  const running = useSession((snapshot) => snapshot.running);
  return (
    <Button
      variant="ghost"
      size="sm"
      icon={SparkleIcon}
      disabled={running}
      onClick={generate}
      // 图标按钮没有可见文字，标题与无障碍标签都要给。
      title="生成标题"
      aria-label="生成标题"
    />
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
  if (typeof document === 'undefined') return;
  // 幂等：插件重复激活时不叠加第二条规则。
  if (document.getElementById(CRUMB_STYLE_ID) !== null) return;

  const style = document.createElement('style');
  style.id = CRUMB_STYLE_ID;
  style.textContent = `[class*="_crumbCurrent"]{max-width:${CRUMB_MAX_WIDTH} !important;}`;
  document.head.append(style);
}

export function apply(ctx: Context): void {
  // 放宽会话标题宽度上限。纯样式改动，与后面的槽位注册互不依赖，
  // 放在最前面是为了尽早注入，避免标题先按 220px 渲染再跳变。
  ctx.effect(() => {
    installCrumbWidth();
    return () => {
      if (typeof document !== 'undefined') document.getElementById(CRUMB_STYLE_ID)?.remove();
    };
  });

  // remote 命名空间的挂载可能晚于 slot 注册，所以不能提前闭包捕获 ——
  // 提前捕获会拿到 undefined，表现为「按钮在但点了没反应」。
  let commands: RemoteCommands | undefined;
  ctx.inject(['remote', 'remote.commands'], (sub) => {
    commands = sub.remote.commands;
  });

  ctx.inject(['slots'], (sub) => {
    // slots.inject 等待 owner 声明该 slot，owner 折叠时贡献自动移除。
    sub.slots.inject(SLOT, () =>
      sub.slots.register(
        {
          name: SLOT,
          id: ENTRY_ID,
          // 同区内按 order 升序排列，取正值排在内置工具之后（更靠右）。
          order: 100,
          // factory 在 apply 世界中运行；session scope 的 slot 会收到框架
          // 解析出的 sessionId。
          inject: (sessionId) => ({
            generate: () => {
              if (commands === undefined) {
                console.warn(`${LOG} remote.commands 尚未就绪，无法执行 ${RETITLE_LINE}`);
                return;
              }
              void commands
                .execute(sessionId, RETITLE_LINE, [])
                // 失败交由 host 侧的 command/done 记录，这里静默即可。
                .catch(() => undefined);
            },
          }),
        },
        GenerateTitleAction,
      ),
    );
    console.info(`${LOG} 已注册「生成标题」到 ${SLOT}`);
  });
}
