/**
 * 「隐藏会话」的配置层：插件私有「隐藏列表 + 显示开关」的唯一真源。
 *
 * 值落在插件自己的 settings section（host 设置文档）里，所以刷新、重启、换浏览器都保持。
 * 这一层做三件事：
 *
 * 1. **读**：从 `settingsScope` 取解析后的值（`value` 已含 schema 默认值兜底）
 * 2. **乐观**：点一下眼睛必须立刻看到效果，所以先用本地值广播，不等 host 往返
 * 3. **写**：改动去抖后**整体覆盖写**（隐藏列表是一条完整数组）——
 *    读-改-写在连点下会丢写，整体覆盖写不会
 */
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client';

import { LOG } from '../log';
import type { PluginConfig } from '../settings-card';

/** 隐藏相关的两个字段，全部落在本插件的设置命名空间里。 */
export interface HiddenConfig {
  /** 被隐藏的会话 id。 */
  readonly hiddenSessions: readonly string[];
  /** 「工作区」区域标题行那只眼睛：是否把被隐藏的会话显示出来。 */
  readonly revealHiddenAll: boolean;
}

const EMPTY: HiddenConfig = { hiddenSessions: [], revealHiddenAll: false };

/** 写回设置文档前的去抖窗口：连点眼睛只落一次写。 */
const WRITE_DEBOUNCE_MS = 300;

type HiddenField = 'hiddenSessions' | 'revealHiddenAll';

export interface HiddenConfigStore {
  /** 当前值（本地乐观值优先）。DOM 层每趟 decorate 读一次。 */
  read(): HiddenConfig;
  /** 订阅变化：本地写入与 host 推送都会触发。 */
  subscribe(listener: () => void): () => void;
  /** 隐藏 / 取消隐藏一条会话。 */
  toggleSession(sessionId: string): void;
  /** 总开关：一键全显 / 全隐。 */
  toggleAll(): void;
  /** 清空隐藏列表（设置卡片里的自救出口）。 */
  clearAll(): void;
  dispose(): void;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

/**
 * 从设置快照里解析出隐藏配置。
 *
 * `value` 正常是经过 schema 兜底的完整值，但设置服务还没就绪、或文档被外部改坏时
 * 都可能拿到别的形状，所以逐字段按形状取，取不到就用默认值。
 */
function parse(config: PluginConfig | undefined): HiddenConfig {
  if (config === undefined) return EMPTY;
  return {
    hiddenSessions: readStringArray(config.hiddenSessions),
    revealHiddenAll: config.revealHiddenAll === true,
  };
}

/** 空列表就没必要在用户层记一笔，直接清掉让它回落默认值。 */
function shouldUnset(field: HiddenField, value: unknown): boolean {
  if (field === 'hiddenSessions') return Array.isArray(value) && value.length === 0;
  // 布尔值一律显式写：万一组合层把默认值配成了 true，unset 会让用户的「关」失效。
  return false;
}

class Store implements HiddenConfigStore {
  /** 本地乐观值：界面上生效的永远是它，点一下立刻变。 */
  private local: HiddenConfig;
  /** 已经写出去、但 host 快照还没追上的字段：这些字段不吃 host 的快照值。 */
  private readonly dirty = new Set<HiddenField>();
  /** 待写队列：同一字段重复修改只保留最后一次的值。 */
  private pending: Partial<Record<HiddenField, unknown>> = {};
  private timer: ReturnType<typeof setTimeout> | undefined;
  private readonly listeners = new Set<() => void>();
  private readonly unsubscribe: () => void;
  private disposed = false;

  constructor(private readonly scope: SettingsScope<PluginConfig>) {
    this.local = parse(scope.getSnapshot().value);
    this.unsubscribe = scope.subscribe(() => this.absorb());
  }

  read(): HiddenConfig {
    return this.local;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  toggleSession(sessionId: string): void {
    const next = new Set(this.local.hiddenSessions);
    if (next.has(sessionId)) next.delete(sessionId);
    else next.add(sessionId);
    this.write({ hiddenSessions: [...next] });
  }

  toggleAll(): void {
    this.write({ revealHiddenAll: !this.local.revealHiddenAll });
  }

  clearAll(): void {
    this.write({ hiddenSessions: [] });
  }

  dispose(): void {
    this.disposed = true;
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
    this.unsubscribe();
    this.listeners.clear();
  }

  /** host 快照变了：没在途写入的字段照单全收，在途的以本地为准。 */
  private absorb(): void {
    if (this.disposed) return;
    const incoming = parse(this.scope.getSnapshot().value);
    if (this.dirty.size === 0) {
      this.local = incoming;
    } else {
      this.local = {
        hiddenSessions: this.dirty.has('hiddenSessions') ? this.local.hiddenSessions : incoming.hiddenSessions,
        revealHiddenAll: this.dirty.has('revealHiddenAll')
          ? this.local.revealHiddenAll
          : incoming.revealHiddenAll,
      };
    }
    this.emit();
  }

  private write(patch: Partial<Record<HiddenField, unknown>>): void {
    if (this.disposed) return;
    this.local = { ...this.local, ...patch } as HiddenConfig;
    for (const field of Object.keys(patch) as HiddenField[]) {
      this.dirty.add(field);
      this.pending[field] = patch[field];
    }
    this.emit();
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = undefined;
      void this.flush();
    }, WRITE_DEBOUNCE_MS);
  }

  private async flush(): Promise<void> {
    const batch = this.pending;
    this.pending = {};
    for (const field of Object.keys(batch) as HiddenField[]) {
      const value = batch[field];
      try {
        if (shouldUnset(field, value)) await this.scope.unset(field);
        else await this.scope.set(field, value);
      } catch (error) {
        // 写失败不清空本地值：界面先按用户点的显示，host 快照回来时会纠正它。
        console.warn(`${LOG} 写回设置「${field}」失败：${String(error)}`);
      } finally {
        // 期间又改了同一个字段（pending 里已有更新值）→ 保留 dirty，交给下一轮写。
        if (!(field in this.pending)) this.dirty.delete(field);
      }
    }
    this.absorb();
  }

  private emit(): void {
    // 复制一份再遍历：监听者在回调里退订不会影响这一趟。
    for (const listener of [...this.listeners]) listener();
  }
}

/**
 * 绑定本插件的设置命名空间，得到隐藏配置的读写入口。
 *
 * 与设置卡片注册的是**同一个命名空间**，两边看到同一份文档；这里只是多一个
 * 不经过卡片的读取/订阅面（DOM 层不在 React 里，用不了卡片那套 props）。
 */
export function createHiddenConfigStore(scope: SettingsScope<PluginConfig>): HiddenConfigStore {
  return new Store(scope);
}
