import { useCallback, useEffect, useState } from 'react';
import { useSyncExternalStore } from 'react';
import { Switch } from '@deepseek-ai/dsh-client-ui-primitives';
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

/** `llm` 远端命名空间里我们用到的方法（结构化声明，不引它的类型入口）。 */
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
    view?: { namespaces: readonly SettingsNamespaceLike[] } | undefined;
  };
}

/** 设置镜像里一个命名空间视图——我们只关心 `ns` 与三层数据。 */
interface SettingsNamespaceLike {
  ns: string;
  value?: unknown;
  user?: unknown;
}

/**
 * 凭据域读取面。
 *
 * 签名不在本地可验证范围内（该包只在部署侧组合），所以按结构化声明调用：
 * 拿不到、形状对不上、调用抛错，一律回退到「用户层配过没有」的判定。
 */
export interface CredentialsFace {
  describe: (refs: readonly string[]) => Promise<unknown>;
}

/** 一个可选路由，以及它已配置的模型。 */
interface DirectoryRoute {
  provider: string;
  displayName: string;
  models: readonly { id: string; name?: string }[];
}

type DirectoryState =
  | { status: 'loading' }
  | { status: 'unavailable'; reason: string }
  | { status: 'ready'; routes: readonly DirectoryRoute[] };

/** 一个字段保存时要做的事。`clear` 表示让它重新继承下层（我们走 `unset`）。 */
type FieldWrite = { kind: 'set'; value: unknown } | { kind: 'clear' };

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
    hint: '只列出已配置且可用的供应商；留空则跟随会话主模型',
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

const ChevronIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M4 6.5 8 10.5 12 6.5"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function hasKey(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

/** 沿路径走进一层层的对象；任何一步对不上就返回 undefined。 */
function walk(node: unknown, path: readonly string[]): unknown {
  let current = node;
  for (const key of path) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/** 从某个 provider 的 profile 里读出 `models` 数组。 */
function readModels(section: unknown, path: readonly string[]): { id: string; name?: string }[] {
  const profile = walk(section, path);
  if (profile === null || typeof profile !== 'object') return [];
  const models = (profile as Record<string, unknown>).models;
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

/** profile 里指向凭据的引用名（`apiKeyEnv`）。 */
function readApiKeyRef(section: unknown, path: readonly string[]): string | undefined {
  const profile = walk(section, path);
  if (profile === null || typeof profile !== 'object') return undefined;
  const ref = (profile as Record<string, unknown>).apiKeyEnv;
  return typeof ref === 'string' && ref.length > 0 ? ref : undefined;
}

/**
 * 解析凭据域的回答，尽力而为。
 *
 * 期望形状是 `{ ok: true, value: … }`，`value` 可能是 `[{ ref, configured }]`
 * 或 `{ [ref]: { configured } }`。形状不认就返回 undefined，让调用方回退。
 */
function parseConfiguredRefs(raw: unknown): ReadonlySet<string> | undefined {
  if (raw === null || typeof raw !== 'object') return undefined;
  const envelope = raw as { ok?: unknown; value?: unknown };
  if (envelope.ok !== true) return undefined;
  const value = envelope.value;
  const configured = new Set<string>();

  if (Array.isArray(value)) {
    for (const entry of value) {
      if (entry === null || typeof entry !== 'object') continue;
      const record = entry as Record<string, unknown>;
      const ref =
        typeof record.ref === 'string' ? record.ref : typeof record.name === 'string' ? record.name : undefined;
      if (ref !== undefined && record.configured === true) configured.add(ref);
    }
    return configured;
  }
  if (value !== null && typeof value === 'object') {
    for (const [ref, entry] of Object.entries(value as Record<string, unknown>)) {
      if (entry !== null && typeof entry === 'object' && (entry as Record<string, unknown>).configured === true) {
        configured.add(ref);
      }
    }
    return configured;
  }
  return undefined;
}

/**
 * 组装「供应商 → 已配置模型」目录，**只保留用户真正配好的供应商**。
 *
 * 这是这次最关键的一处：`listProviders()` 返回的是适配器注册的**全部内置供应商**，
 * 直接罗列会出现一大堆用户根本没配、用不了的模型。所以再加两道闸：
 *
 *   1. 该路由必须**已注册**（active）；
 *   2. 该 provider 的 profile 要么在**用户层**被写过、要么它引用的**凭据已配置**。
 *
 * 第 2 条与官方模型页 `providerUsable` 的口径一致（我们更严一档：官方对「profile 未命名
 * 任何凭据」的路由直接放行，那是给 Bedrock/Vertex 这类走自身凭据链的场景留的口子，
 * 而这里的目的是「我配了什么就出什么」，所以不放行）。
 *
 * 凭据域拿不到时只用用户层判定，并在界面上说明。
 */
async function loadDirectory(
  llm: LlmDirectory,
  describe: DescribeFace,
  getCredentials: () => CredentialsFace | undefined,
): Promise<DirectoryState> {
  try {
    const [registered, declared] = await Promise.all([llm.listProviders(), llm.listConfigurableProviders()]);
    if (registered.ok !== true) return { status: 'unavailable', reason: '无法读取已注册的模型供应商' };

    await describe.ensure();
    const views = describe.getSnapshot().view?.namespaces ?? [];
    const findView = (ns: string): SettingsNamespaceLike | undefined =>
      views.find((candidate) => candidate.ns === ns);

    const activeIds = new Set((registered.value ?? []).map((entry) => entry.id));
    const addresses = new Map<
      string,
      { displayName: string; settingsNs?: string; settingsPath: readonly string[] }
    >();
    for (const entry of declared.ok ? (declared.value ?? []) : []) {
      addresses.set(entry.provider, {
        displayName: entry.displayName,
        settingsNs: entry.settingsNs,
        settingsPath: entry.settingsPath ?? [],
      });
    }
    for (const entry of registered.value ?? []) {
      if (!addresses.has(entry.id)) addresses.set(entry.id, { displayName: entry.name, settingsPath: [] });
    }

    // 先尽量读一次凭据域：只有它能把「key 存在环境变量里、设置文档没写过」也算进来。
    const refs: string[] = [];
    const profileOf = new Map<string, { section: unknown; path: readonly string[] }>();
    for (const [provider, address] of addresses) {
      if (address.settingsNs === undefined) continue;
      const view = findView(address.settingsNs);
      profileOf.set(provider, { section: view?.value, path: address.settingsPath });
      const ref = readApiKeyRef(view?.value, address.settingsPath);
      if (ref !== undefined) refs.push(ref);
    }
    let configuredRefs: ReadonlySet<string> | undefined;
    const credentials = getCredentials();
    if (credentials !== undefined && refs.length > 0) {
      try {
        configuredRefs = parseConfiguredRefs(await credentials.describe([...new Set(refs)]));
      } catch {
        configuredRefs = undefined;
      }
    }

    const routes: DirectoryRoute[] = [];
    for (const [provider, address] of addresses) {
      if (!activeIds.has(provider)) continue;

      const view = address.settingsNs === undefined ? undefined : findView(address.settingsNs);
      // 用户层写没写过这个 provider 的 profile。
      const userConfigured = walk(view?.user, address.settingsPath) !== undefined;
      const ref = readApiKeyRef(view?.value, address.settingsPath);
      const credentialConfigured = ref !== undefined && configuredRefs?.has(ref) === true;

      if (!userConfigured && !credentialConfigured) continue;

      const profile = profileOf.get(provider);
      routes.push({
        provider,
        displayName: address.displayName,
        models: readModels(profile?.section ?? view?.value, address.settingsPath),
      });
    }
    routes.sort((left, right) => left.displayName.localeCompare(right.displayName));
    return { status: 'ready', routes };
  } catch (error) {
    return { status: 'unavailable', reason: String(error) };
  }
}

type SettingsCardProps = PropsRuntime<'settings.plugin.item'> & {
  /** 由注册项的 inject 工厂注入：绑定到本插件命名空间的设置作用域。 */
  scope: SettingsScope<PluginConfig>;
  /** 设置镜像读取面：用来读各 provider 已配置的模型。 */
  describe: DescribeFace;
  /** 延迟注入的 llm 远端；拿不到就让 provider/model 退回文本输入。 */
  getLlm: () => LlmDirectory | undefined;
  /** 延迟注入的凭据域；拿不到就只用用户层判定「配没配」。 */
  getCredentials: () => CredentialsFace | undefined;
};

/**
 * 本插件的设置卡片。
 *
 * 结构、类名与样式对齐官方 `PluginCard` + `fields`（见 `settings-css.ts`）：
 * 收起时是灰底卡片，展开后正文落在同一张卡片内、只隔一条细线；字段一律
 * 「标签在上 / 控件整宽在下 / 说明再下一行」，保存与放弃在右下角。
 *
 * 用「暂存 + 保存」而不是改一下就提交：每次写入都是可持久化的、带修订号栅栏的文档变更，
 * 边改边写会把一次输入变成用户没要求、也无法预览的写入（官方 `CardForm` 的同一取舍）。
 */
export function SettingsCard({
  scope,
  describe,
  getLlm,
  getCredentials,
}: SettingsCardProps): React.JSX.Element | null {
  const subscribe = useCallback((onChange: () => void) => scope.subscribe(onChange), [scope]);
  // getSnapshot 必须返回稳定引用：作用域的实现在值不变时保证同一引用。
  const getSnapshot = useCallback(() => scope.getSnapshot(), [scope]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);

  // 默认折叠。官方卡片同样默认收起，且**保存成功后自动收起**。
  const [expanded, setExpanded] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Partial<Record<GroupKey, boolean>>>({});
  const [directory, setDirectory] = useState<DirectoryState>({ status: 'loading' });

  useEffect(() => {
    const llm = getLlm();
    if (llm === undefined) {
      setDirectory({ status: 'unavailable', reason: 'llm 远端服务不可用' });
      return undefined;
    }
    let alive = true;
    void loadDirectory(llm, describe, getCredentials).then((next) => {
      if (alive) setDirectory(next);
    });
    return () => {
      alive = false;
    };
  }, [describe, getCredentials, getLlm]);

  const section = (snapshot.value ?? {}) as PluginConfig;
  const user = (snapshot.user ?? {}) as Record<string, unknown>;
  const writable = snapshot.writable && !busy;
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
      // 与官方一致：保存成功后自动收起。
      setExpanded(false);
    } catch {
      // 草稿保留，用户可以改完再存一次，而不是重打一遍。
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  /**
   * provider / model 的控件。
   *
   * 目录可用时渲染成**只能选**的下拉 —— 手写 provider/model 几乎总是拼错，
   * 而拼错的结果是运行时调用失败，不如从根上不让输。目录读不到就退回文本输入。
   */
  const renderControl = (desc: FieldDesc): React.JSX.Element => {
    const value = draftText(desc);
    const invalidField = isInvalid(desc);
    const disabled = !writable;

    if (directory.status === 'ready') {
      if (desc.field === 'provider') {
        const known = directory.routes.some((route) => route.provider === value);
        return (
          <select
            className="stp-input"
            value={value}
            disabled={disabled}
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
        const models = directory.routes.find((route) => route.provider === providerValue)?.models ?? [];
        const known = models.some((model) => model.id === value);
        return (
          <select
            className="stp-input"
            value={value}
            disabled={disabled || providerValue === ''}
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
      <input
        className={invalidField ? 'stp-input stp-inputInvalid' : 'stp-input'}
        value={value}
        disabled={disabled}
        onChange={(event) => stage(desc.field, event.target.value)}
      />
    );
  };

  const renderField = (desc: FieldDesc): React.JSX.Element => {
    const overridden = isOverridden(desc);
    const fieldInvalid = isInvalid(desc);
    return (
      <div key={desc.field} className="stp-field">
        <div className="stp-head">
          <span className="stp-label">{desc.label}</span>
          <span className="stp-badges">
            {overridden ? <span className="stp-overridden">已覆盖</span> : null}
            <button
              type="button"
              className="stp-reset"
              disabled={!writable || !overridden}
              onClick={() => stage(desc.field, '')}
            >
              恢复默认
            </button>
          </span>
        </div>
        {/* 模式用开关，其余用输入框或下拉。 */}
        {desc.field === 'mode' ? (
          <div className="stp-toggleRow">
            <Switch
              checked={draftText(desc) !== 'rules'}
              disabled={!writable}
              label={desc.label}
              onChange={(next) => stage(desc.field, next ? 'llm' : 'rules')}
            />
            <span className="stp-toggleText">
              {draftText(desc) !== 'rules' ? '模型总结' : '关键词规则'}
            </span>
          </div>
        ) : (
          renderControl(desc)
        )}
        {desc.hint === undefined ? null : <p className="stp-hint">{desc.hint}</p>}
        {fieldInvalid ? <p className="stp-invalid">这里需要一个整数</p> : null}
        {desc.field === 'provider' && directory.status === 'unavailable' ? (
          <p className="stp-hint">
            {`未能读取已配置的模型列表（${directory.reason}），这两行已退回手动输入`}
          </p>
        ) : null}
      </div>
    );
  };

  const renderGroup = (key: GroupKey): React.JSX.Element => {
    const isOpen = openGroups[key] === true;
    const group = COLLAPSIBLE_GROUPS.find((item) => item.key === key);
    return (
      <div key={key}>
        <div className="stp-head" style={{ paddingTop: 12 }}>
          <span className="stp-label">{group?.label ?? key}</span>
          <span className="stp-badges">
            <button
              type="button"
              className="stp-reset"
              onClick={() => setOpenGroups((previous) => ({ ...previous, [key]: !isOpen }))}
            >
              {isOpen ? '收起' : '展开'}
            </button>
          </span>
        </div>
        {isOpen ? <div>{FIELDS.filter((desc) => desc.group === key).map(renderField)}</div> : null}
      </div>
    );
  };

  if (!ready) return null;

  return (
    <li className={expanded ? 'stp-card stp-cardOpen' : 'stp-card'}>
      <button
        type="button"
        className="stp-header"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="stp-headText">
          <span className="stp-name">会话标题</span>
          <span className="stp-description">用模型总结会话标题的类型与主题，也可以退回关键词规则。</span>
        </span>
        {/* 折叠不影响暂存的改动，所以标题行要标出「有未保存的改动」。 */}
        {dirty ? <span className="stp-pending">未保存</span> : null}
        <span className={expanded ? 'stp-chevron stp-chevronOpen' : 'stp-chevron'}>{ChevronIcon}</span>
      </button>
      {expanded ? (
        <div className="stp-body">
          {FIELDS.filter((desc) => desc.group === 'top').map(renderField)}
          {COLLAPSIBLE_GROUPS.map((group) => renderGroup(group.key))}
          <div className="stp-footer">
            {failed ? (
              <p className="stp-failed">保存未落地，Host 拒绝了这次写入（草稿已保留，可修改后重试）</p>
            ) : null}
            {snapshot.writable ? null : (
              <p className="stp-failed">当前连接为进程内模式，配置不会写入 Host 文档</p>
            )}
            <button
              type="button"
              className="stp-discard"
              disabled={busy || !dirty}
              onClick={() => {
                setFailed(false);
                setDrafts({});
              }}
            >
              放弃修改
            </button>
            <button
              type="button"
              className="stp-save"
              disabled={!writable || !dirty || invalid}
              onClick={() => void save()}
            >
              保存
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}
