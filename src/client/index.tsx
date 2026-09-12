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
 * 为什么是图标而不是文字按钮：头部三组右侧容器（actions / utilities / corner）
 * 都是 `flex:none`，而标题所在的 `.titleCluster` 是 `flex:1` —— 标题吃的是
 * 「剩余宽度」。也就是说我们在这里多宽，标题就少多宽。文字按钮约 68px，
 * 图标按钮约 36px，能还给标题 30 多像素。
 */
const SLOT = 'conversation.session.header.utilities';

/** 本菜单项在列表中的地址，必须全局唯一。 */
const ENTRY_ID = 'generate-title';

/** 触发 host 端重算的命令行。 */
const RETITLE_LINE = '/retitle';

/** 浏览器控制台前缀，便于排查。 */
const LOG = '[dsh-session-title-pattern]';

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

export function apply(ctx: Context): void {
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
