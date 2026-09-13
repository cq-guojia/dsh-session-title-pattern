import { useCallback, useEffect, useState } from 'react';
import { useSyncExternalStore } from 'react';
import { Button, Input, Switch } from '@deepseek-ai/dsh-client-ui-primitives';
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client';
// 仅为拿到 `settings.plugin.item` 槽位与 settingsScope 的类型声明。
// 值导入会被客户端 bundle-purity 闸门拒绝，跨插件协作一律走 cordis 服务。
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client';

/**
 * 设置命名空间，必须与 host 侧 `installSection` 用的一模一样。
 *
 * 字面量在这里重写而不是从 host 包导入：客户端包不得依赖 host 包。
 */
export const SETTINGS_NS = 'session-title-pattern';

/**
 * 本插件在设置里的可编辑项。
 *
 * 解析后的值一定齐全（schema 默认值兜底），但 `user` / `base` 两层是稀疏的，
 * 所以要按可选字段读。
 */
export interface PluginConfig {
  mode?: 'llm' | 'rules';
  retitleEvery?: number;
  provider?: string;
  model?: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
  separator?: string;
  maxBytes?: number;
}

/**
 * `llm` 远端命名空间里我们用到的方法。
 *
 * 结构化声明而不是引 dsh-llm 的 remote 类型入口：只用到两个方法，
 * 远端结果用 `{ ok, value? }` 形状判定即可。
 */
export interface LlmDirectory {
  listProviders: () => Promise<{
    ok: boolean;
    value?: readonly { id: string; name: string }[] | undefined;
  }>;
  listConfigurableProviders: () => Promise<{
    ok: boolean;
    value?:
      | readonly {
          provider: string;
          displayName: string;
          settingsNs: string;
          settingsPath: readonly string[];
        }[]
      | undefined;
  }>;
}

/** 设置镜像的读取面：只用到「确保读过一次」与「拿当前快照」。 */
export interface DescribeFace {
  ensure: () => Promise<void>;
  getSnapshot: () => {
    view?: { namespaces: readonly { ns: string; value?: unknown }[] } | undefined;
  };
}

/** 一条可选路由，以及它已配置的模型。 */
interface DirectoryRoute {
  provider: string;
  displayName: string;
  models: readonly { id: string; name?: string }[];
}

type DirectoryState =
  | { status: 'loading' }
  | { status: 'unavailable'; reason: string }
  | { status: 'ready'; routes: readonly DirectoryRoute[] };

/**
 * 从某个 provider 的 profile 里读出 `models` 数组。
 *
 * profile 的形状由各适配器自己的 schema 决定，所以全程做结构判定：
 * 任何一步对不上就返回空数组，调用方据此把该行退回文本输入。
 */
function readModels(section: unknown, path: readonly string[]): { id: string; name?: string }[] {
  let node: unknown = section;
  for (const key of path) {
    if (node === null || typeof node !== 'object') return [];
    node = (node as Record<string, unknown>)[key];
  }
  if (node === null || typeof node !== 'object') return [];
  const models = (node as Record<string, unknown>).models;
  if (!Array.isArray(models)) return [];

  const result: { id: string; name?: string }[] = [];
  for (const entry of models) {
    if (entry === null || typeof entry !== 'object') continue;
    const record = entry as Record<string, unknown>;
    if (typeof record.id !== 'string' || record.id.length === 0) continue;
    result.push(typeof record.name === 'string' ? { id: record.id, name: record.name } : { id: record.id });
  }
  return result;
}

/**
 * 组装「供应商 → 已配置模型」目录。
 *
 * 两个来源：`listProviders`（当前已注册的路由）与 `listConfigurableProviders`
 * （已声明可配置的路由，带 settingsNs 地址）。模型不在这些接口里，而在每个
 * provider 自己的设置 section 里，所以还要读一次设置镜像。
 */
async function loadDirectory(llm: LlmDirectory, describe: DescribeFace): Promise<DirectoryState> {
  try {
    const [registered, declared] = await Promise.all([llm.listProviders(), llm.listConfigurableProviders()]);
    if (registered.ok !== true && declared.ok !== true) {
      return { status: 'unavailable', reason: '无法读取模型供应商目录' };
    }
    await describe.ensure();
    const views = describe.getSnapshot().view?.namespaces ?? [];

    const addresses = new Map<string, { displayName: string; settingsNs?: string; settingsPath: readonly string[] }>();
    // 先放已声明的（带设置地址），再补上已注册的（没有地址，拿不到模型列表）。
    for (const entry of declared.ok ? (declared.value ?? []) : []) {
      addresses.set(entry.provider, {
        displayName: entry.displayName,
        settingsNs: entry.settingsNs,
        settingsPath: entry.settingsPath ?? [],
      });
    }
    for (const entry of registered.ok ? (registered.value ?? []) : []) {
      if (!addresses.has(entry.id)) addresses.set(entry.id, { displayName: entry.name, settingsPath: [] });
    }

    const routes: DirectoryRoute[] = [];
    for (const [provider, address] of addresses) {
      const view =
        address.settingsNs === undefined
          ? undefined
          : views.find((candidate) => candidate.ns === address.settingsNs);
      routes.push({
        provider,
        displayName: address.displayName,
        models: readModels(view?.value, address.settingsPath),
      });
    }
    routes.sort((left, right) => left.displayName.localeCompare(right.displayName));
    return { status: 'ready', routes };
  } catch (error) {
    return { status: 'unavailable', reason: String(error) };
  }
}

/** 一个字段保存时要做的事。`clear` 表示让它重新继承下层（我们走 `unset`）。 */
type FieldWrite = { kind: 'set'; value: unknown } | { kind: 'clear' };

/** 卡片标题行的样式：整行是一个按钮（与官方 `PluginCard` 的头部一致）。 */
const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '10px 12px',
  textAlign: 'left',
  cursor: 'pointer',
  background: '0 0',
  border: '1px solid var(--dsw-alias-border-l3)',
  borderRadius: 12,
  color: 'var(--dsw-alias-label-primary)',
} as const;

const dirtyBadgeStyle = {
  fontSize: 11,
  padding: '0 6px',
  borderRadius: 6,
  color: 'var(--dsw-alias-state-business-primary)',
  background: 'var(--dsw-alias-interactive-bg-hover)',
} as const;

/**
 * 一个字段如何在「存储值」与「草稿文本」之间转换。
 *
 * 语义对齐官方 `CardFieldSpec`：`parse` 返回 `undefined` 表示草稿不是本字段能接受的值，
 * 此时**阻止保存**而不是丢弃这次编辑。
 */
interface FieldSpec {
  format: (value: unknown) => string;
  parse: (text: string) => FieldWrite | undefined;
}

const textField: FieldSpec = {
  format: (value) => (typeof value === 'string' ? value : ''),
  parse: (text) => (text.trim() === '' ? { kind: 'clear' } : { kind: 'set', value: text.trim() }),
};

const numberField: FieldSpec = {
  format: (value) => (typeof value === 'number' && Number.isFinite(value) ? String(value) : ''),
  parse: (text) => {
    const trimmed = text.trim();
    if (trimmed === '') return { kind: 'clear' };
    const parsed = Number(trimmed);
    // 只接受整数：schema 上这些字段都带 step(1)，小数会被 host 拒绝。
    return Number.isInteger(parsed) ? { kind: 'set', value: parsed } : undefined;
  },
};

const modeField: FieldSpec = {
  format: (value) => (value === 'rules' ? 'rules' : 'llm'),
  parse: (text) => ({ kind: 'set', value: text === 'rules' ? 'rules' : 'llm' }),
};

type GroupKey = 'top' | 'model' | 'format';

interface FieldDesc {
  field: keyof PluginConfig & string;
  label: string;
  hint?: string;
  spec: FieldSpec;
  group: GroupKey;
}

/**
 * 卡片暴露的 8 项。
 *
 * `maxInputBytes`（滚动摘要的字节预算）刻意不放出来：它是内部预算，
 * 调整它只会影响成本，需要时走 `cordis.patch.yml`。
 */
const FIELDS: readonly FieldDesc[] = [
  {
    field: 'mode',
    label: '用模型总结标题',
    hint: '关闭后回到关键词规则分类，不再消耗 token',
    spec: modeField,
    group: 'top',
  },
  {
    field: 'retitleEvery',
    label: '重算间隔',
    hint: '每多少条人类消息重新总结一次标题（条）',
    spec: numberField,
    group: 'top',
  },
  {
    field: 'provider',
    label: '服务商 provider',
    hint: '与 model 必须成对；两项都留空则跟随会话主模型',
    spec: textField,
    group: 'model',
  },
  { field: 'model', label: '模型 model', spec: textField, group: 'model' },
  { field: 'timeoutMs', label: '超时', hint: '单次模型调用超时（毫秒）', spec: numberField, group: 'model' },
  { field: 'maxOutputTokens', label: '输出上限', hint: '单次调用输出 token 上限', spec: numberField, group: 'model' },
  { field: 'separator', label: '分隔符', hint: '标题各段之间的分隔符', spec: textField, group: 'format' },
  {
    field: 'maxBytes',
    label: '标题长度上限',
    hint: '单位字节，必须 ≤ session-title 的 maxTitleBytes（dsh-base 默认 80）',
    spec: numberField,
    group: 'format',
  },
];

const COLLAPSIBLE_GROUPS: readonly { key: GroupKey; label: string }[] = [
  { key: 'model', label: '模型' },
  { key: 'format', label: '标题格式' },
];

const labelWidth = 130;

const labelStyle = {
  flex: `0 0 ${labelWidth}px`,
  fontSize: 13,
  color: 'var(--dsw-alias-label-secondary)',
} as const;

const hintStyle = {
  fontSize: 11,
  lineHeight: '16px',
  color: 'var(--dsw-alias-label-tertiary)',
  marginTop: 2,
} as const;

const overriddenBadgeStyle = {
  marginLeft: 6,
  fontSize: 11,
  color: 'var(--dsw-alias-state-business-primary)',
} as const;

/** provider / model 下拉的样式。没有 Select 基础组件，用原生 select 配上主题变量。 */
const selectStyle = {
  flex: 1,
  minWidth: 0,
  height: 32,
  padding: '0 8px',
  fontSize: 13,
  color: 'var(--dsw-alias-label-primary)',
  background: 'var(--dsw-specific-input-major, var(--dsw-alias-bg-base))',
  border: '1px solid var(--dsw-alias-border-l3)',
  borderRadius: 8,
  cursor: 'pointer',
} as const;

type SettingsCardProps = PropsRuntime<'settings.plugin.item'> & {
  /** 由注册项的 inject 工厂注入：绑定到本插件命名空间的设置作用域。 */
  scope: SettingsScope<PluginConfig>;
  /** 设置镜像读取面：用来读各 provider 已配置的模型。 */
  describe: DescribeFace;
  /** 延迟注入的 llm 远端；拿不到就让 provider/model 退回文本输入。 */
  getLlm: () => LlmDirectory | undefined;
};

function hasKey(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

/**
 * 本插件的设置卡片。
 *
 * 用「暂存 + 保存」而不是改一下就提交：每一次写入都是可持久化的、带修订号栅栏的文档变更，
 * 边改边写会把一次输入变成用户没要求、也无法预览的写入（官方 `CardForm` 的同一取舍）。
 *
 * 自己渲染表单是因为客户端纯度闸门禁止复用设置区块自带的卡片外壳，
 * 只能从平台模块（ui-primitives）取控件。
 */
export function SettingsCard({ scope, describe, getLlm }: SettingsCardProps): React.JSX.Element | null {
  const subscribe = useCallback((onChange: () => void) => scope.subscribe(onChange), [scope]);
  // getSnapshot 必须返回稳定引用：作用域的实现在值不变时保证同一引用。
  const getSnapshot = useCallback(() => scope.getSnapshot(), [scope]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);

  const [directory, setDirectory] = useState<DirectoryState>({ status: 'loading' });
  useEffect(() => {
    const llm = getLlm();
    if (llm === undefined) {
      setDirectory({ status: 'unavailable', reason: 'llm 远端服务不可用' });
      return undefined;
    }
    let alive = true;
    void loadDirectory(llm, describe).then((next) => {
      if (alive) setDirectory(next);
    });
    return () => {
      alive = false;
    };
  }, [describe, getLlm]);

  // 默认折叠。官方的插件卡片也是收起状态，点标题行才展开详细设置。
  const [expanded, setExpanded] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Partial<Record<GroupKey, boolean>>>({});

  const section = (snapshot.value ?? {}) as PluginConfig;
  const user = (snapshot.user ?? {}) as Record<string, unknown>;
  const writable = snapshot.writable && !busy;

  // 命名空间没被 host 服务（或还在加载）时整张卡片不渲染，不给用户看半成品。
  const ready = snapshot.status === 'ready';

  const draftText = (desc: FieldDesc): string =>
    drafts[desc.field] ?? desc.spec.format(section[desc.field]);

  // 覆盖状态按「键是否存在」判断，而不是比值：一个等于默认值的覆盖仍然是覆盖。
  // 有暂存草稿时按草稿预演保存后的状态，这样徽标不会与屏幕上的输入自相矛盾。
  const isOverridden = (desc: FieldDesc): boolean => {
    const draft = drafts[desc.field];
    if (draft === undefined) return hasKey(user, desc.field);
    return desc.spec.parse(draft)?.kind === 'set';
  };

  const isInvalid = (desc: FieldDesc): boolean => {
    const draft = drafts[desc.field];
    return draft !== undefined && desc.spec.parse(draft) === undefined;
  };

  const dirty = Object.keys(drafts).length > 0;
  const invalid = FIELDS.some(isInvalid);

  const stage = (field: string, text: string): void => {
    setFailed(false);
    setDrafts((previous) => ({ ...previous, [field]: text }));
  };

  const stageMany = (patch: Record<string, string>): void => {
    setFailed(false);
    setDrafts((previous) => ({ ...previous, ...patch }));
  };

  /**
   * provider / model 的控件。
   *
   * 目录可用时渲染成**只能选**的下拉 —— 手写 provider/model 几乎总是拼错，
   * 而拼错的结果是运行时调用失败，不如从根上不让输。目录读不到就退回文本输入。
   */
  const renderControl = (desc: FieldDesc): React.JSX.Element => {
    const value = draftText(desc);
    const disabled = !writable;

    if (directory.status === 'ready') {
      if (desc.field === 'provider') {
        const known = directory.routes.some((route) => route.provider === value);
        return (
          <select
            value={value}
            disabled={disabled}
            style={selectStyle}
            onChange={(event) => {
              // 换了供应商就清掉已选模型，避免留下属于上一个供应商的模型 id。
              stageMany({ provider: event.target.value, model: '' });
            }}
          >
            <option value="">跟随会话主模型</option>
            {directory.routes.map((route) => (
              <option key={route.provider} value={route.provider}>
                {route.displayName}
              </option>
            ))}
            {value !== '' && !known ? <option value={value}>{`${value}（不在已配置列表）`}</option> : null}
          </select>
        );
      }
      if (desc.field === 'model') {
        const providerValue = drafts.provider ?? (typeof section.provider === 'string' ? section.provider : '');
        const models =
          directory.routes.find((route) => route.provider === providerValue)?.models ?? [];
        const known = models.some((model) => model.id === value);
        return (
          <select
            value={value}
            disabled={disabled || providerValue === ''}
            style={selectStyle}
            onChange={(event) => stage(desc.field, event.target.value)}
          >
            <option value="">
              {providerValue === '' ? '跟随会话主模型' : '该供应商未配模型，跟随其默认'}
            </option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name ?? model.id}
              </option>
            ))}
            {value !== '' && !known ? <option value={value}>{`${value}（不在已配置列表）`}</option> : null}
          </select>
        );
      }
    }

    return (
      <Input
        value={value}
        disabled={disabled}
        aria-invalid={isInvalid(desc) || undefined}
        onChange={(event) => stage(desc.field, event.target.value)}
      />
    );
  };

  const save = async (): Promise<void> => {
    setBusy(true);
    setFailed(false);
    try {
      for (const desc of FIELDS) {
        const draft = drafts[desc.field];
        if (draft === undefined) continue;
        const write = desc.spec.parse(draft);
        // 无效草稿不写：`invalid` 已经禁用了保存按钮，这里只是兜底。
        if (write === undefined) continue;
        if (write.kind === 'clear') await scope.unset(desc.field);
        else await scope.set(desc.field, write.value);
      }
      setDrafts({});
    } catch {
      // 草稿保留，用户可以改完再存一次，而不是重打一遍。
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const renderRow = (desc: FieldDesc): React.JSX.Element => {
    const overridden = isOverridden(desc);
    const fieldInvalid = isInvalid(desc);
    return (
      <div key={desc.field} style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={labelStyle}>
            {desc.label}
            {overridden ? <span style={overriddenBadgeStyle}>已覆盖</span> : null}
          </span>
          {renderControl(desc)}
          <Button
            variant="ghost"
            size="sm"
            disabled={!writable || !overridden}
            title="清除本字段，恢复继承默认值（保存后生效）"
            onClick={() => stage(desc.field, '')}
          >
            恢复默认
          </Button>
        </div>
        {desc.hint === undefined ? null : <div style={hintStyle}>{desc.hint}</div>}
        {desc.field === 'provider' && directory.status === 'unavailable' ? (
          <div style={hintStyle}>
            {`未能读取已配置的模型列表（${directory.reason}），这两行已退回手动输入`}
          </div>
        ) : null}
        {fieldInvalid ? <div style={{ ...hintStyle, color: 'var(--dsw-alias-label-error, #d9534f)' }}>这里需要一个整数</div> : null}
      </div>
    );
  };

  const renderModeRow = (desc: FieldDesc): React.JSX.Element => {
    const overridden = isOverridden(desc);
    return (
      <div key={desc.field} style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Switch 的 label 只用于无障碍，不会渲染出可见文字，所以这里补一个字段名。 */}
          <span style={labelStyle}>
            {desc.label}
            {overridden ? <span style={overriddenBadgeStyle}>已覆盖</span> : null}
          </span>
          <Switch
            checked={draftText(desc) !== 'rules'}
            disabled={!writable}
            label={desc.label}
            onChange={(next) => stage(desc.field, next ? 'llm' : 'rules')}
          />
          <span style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' }}>
            {draftText(desc) !== 'rules' ? '模型总结' : '关键词规则'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={!writable || !overridden}
            title="清除本字段，恢复继承默认值（保存后生效）"
            onClick={() => stage(desc.field, '')}
          >
            恢复默认
          </Button>
        </div>
        {desc.hint === undefined ? null : <div style={hintStyle}>{desc.hint}</div>}
      </div>
    );
  };

  const renderGroup = (key: GroupKey): React.JSX.Element => {
    const expanded = openGroups[key] === true;
    const group = COLLAPSIBLE_GROUPS.find((item) => item.key === key);
    return (
      <div key={key} style={{ marginTop: 6 }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpenGroups((previous) => ({ ...previous, [key]: !expanded }))}
        >
          {`${expanded ? '▾' : '▸'} ${group?.label ?? key}`}
        </Button>
        {expanded ? (
          <div style={{ paddingLeft: 4, marginTop: 8 }}>
            {FIELDS.filter((desc) => desc.group === key).map(renderRow)}
          </div>
        ) : null}
      </div>
    );
  };

  if (!ready) return null;

  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        style={headerStyle}
      >
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, textAlign: 'left' }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--dsw-alias-label-primary)' }}>
            会话标题
          </span>
          <span style={{ fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-tertiary)' }}>
            用模型总结会话标题的类型与主题，也可以退回关键词规则。
          </span>
        </span>
        {/* 折叠不影响暂存的改动，所以标题行要标出「有未保存的改动」。 */}
        {dirty ? <span style={dirtyBadgeStyle}>未保存</span> : null}
        <span style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>
      <div style={{ display: expanded ? 'block' : 'none', marginTop: 10 }}>
      {FIELDS.filter((desc) => desc.group === 'top').map((desc) =>
        desc.field === 'mode' ? renderModeRow(desc) : renderRow(desc),
      )}
      {COLLAPSIBLE_GROUPS.map((group) => renderGroup(group.key))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <Button
          variant="primary"
          size="sm"
          disabled={!writable || !dirty || invalid}
          onClick={() => void save()}
        >
          保存
        </Button>
        <Button variant="ghost" size="sm" disabled={busy || !dirty} onClick={() => { setFailed(false); setDrafts({}); }}>
          放弃
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={!writable}
          title="把所有字段标记为恢复默认（保存后生效）"
          onClick={() => {
            setFailed(false);
            setDrafts(Object.fromEntries(FIELDS.map((desc) => [desc.field, ''])));
          }}
        >
          全部恢复默认
        </Button>
        {failed ? (
          <span style={{ fontSize: 12, color: 'var(--dsw-alias-label-error, #d9534f)' }}>
            保存未落地，Host 拒绝了这次写入（草稿已保留，可修改后重试）
          </span>
        ) : null}
        {snapshot.writable ? null : (
          <span style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' }}>
            当前连接为进程内模式，配置不会写入 Host 文档
          </span>
        )}
      </div>
      </div>
    </div>
  );
}
