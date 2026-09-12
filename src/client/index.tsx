import type { Context } from '@deepseek-ai/cordis';
// 下面三个只为拿到类型增强（SlotMap / SessionStandardProps / ctx.remote），
// 全部是 type-only，运行时不会引入，因此不会触发客户端产物纯度闸门。
import type {} from '@deepseek-ai/dsh-client-ui-session/client';
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client';
import type {} from '@deepseek-ai/dsh-api-remotes/client';
// ctx.slots 服务的类型增强在 renderer 包里，不在 slots 包里。
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client';
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';

export const name = 'dsh-session-title-pattern';

/** 会话头部操作区。cardinality 为 list，注册新 id 即增量追加，不会覆盖内置项。 */
const SLOT = 'conversation.session.header.actions';

/** 本菜单项在列表中的地址，必须全局唯一。 */
const ENTRY_ID = 'generate-title';

/** 触发 host 端重算的命令行。 */
const RETITLE_LINE = '/retitle';

export const inject = {
  required: ['slots'],
  // remote 缺失时只是没有按钮，不该让整个客户端插件挂掉。
  optional: ['remote', 'remote.commands'],
} as const;

type HeaderActionProps = PropsRuntime<typeof SLOT> & {
  /** 由注册项的 inject factory 注入：对当前会话执行 /retitle。 */
  generate: () => void;
};

function GenerateTitleAction({ useSession, generate }: HeaderActionProps) {
  // 会话正在跑时禁用，避免与正在生成的标题竞争。
  const running = useSession((snapshot) => snapshot.running);
  return (
    <button type="button" disabled={running} onClick={generate}>
      生成标题
    </button>
  );
}

export function apply(ctx: Context): void {
  const commands = ctx.remote?.commands;
  if (!commands) return;

  // slots.inject 等待 owner 声明该 slot，owner 折叠时贡献自动移除。
  ctx.slots.inject(SLOT, () =>
    ctx.slots.register(
      {
        name: SLOT,
        id: ENTRY_ID,
        // 数值越小越先渲染，取负值保证排在「重命名 / 分叉 / 归档」之前。
        order: -100,
        // factory 在 apply 世界中运行，闭包捕获 commands；session scope 的
        // slot 会收到框架解析出的 sessionId。
        inject: (sessionId) => ({
          generate: () => {
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
}
