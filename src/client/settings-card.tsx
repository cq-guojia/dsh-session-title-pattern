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
  template?: string;
  maxBytes?: number;
  /** 总开关：关掉后左侧整套「隐藏会话」功能停止执行（已设过的隐藏列表保留）。 */
  hiddenEnabled?: boolean;
  /** 被用户隐藏的会话 id（本插件私有的显示层开关，与平台「归档」无关）。 */
  hiddenSessions?: string[];
  /** 「工作区」区域标题行那只眼睛的总开关：是否把被隐藏的会话显示出来。 */
  revealHiddenAll?: boolean;
}

/**
 * host 侧 Config 的默认值，客户端留一份镜像。
 *
 * 只在快照的 `base` 层拿不到某字段时兜底 —— `base` 是「清空该字段后会回落到的值」，
 * 正常情况下它就是我们要显示给用户的默认值。
 */
const FALLBACK_DEFAULTS: Record<string, unknown> = {
  mode: 'llm',
  retitleEvery: 10,
  provider: '',
  model: '',
  timeoutMs: 30_000,
  template: '{MMDD}｜{type}｜{topic}',
  maxBytes: 80,
  hiddenEnabled: true,
  hiddenSessions: [],
  revealHiddenAll: false,
};

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
  | {
      status: 'ready';
      routes: readonly DirectoryRoute[];
      /** 凭据域是否真的读到了。false 表示只按设置文档判断，列表可能偏多。 */
      credentialsChecked: boolean;
    };

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

/**
 * 布尔字段。
 *
 * 和 `modeField` 一样用字符串草稿承载真值（`'true'` / `'false'`）：卡片那套
 * 「暂存 → 比对 → 保存」全按文本走，多一套类型只会多一处要同步的地方。
 */
const boolField: FieldSpec = {
  format: (value) => (value === false ? 'false' : 'true'),
  parse: (text) => ({ kind: 'set', value: text !== 'false' }),
};

interface FieldDesc {
  field: keyof PluginConfig & string;
  label: string;
  hint?: string;
  spec: FieldSpec;
  /** 只在 LLM 模式有意义；关掉「用模型总结标题」后整行隐藏。 */
  modelOnly?: boolean;
  /** 有它就渲染成开关行（`renderToggle`），并给出「开 / 关」各自对应的草稿文本。 */
  toggle?: { on: string; off: string };
}

/**
 * 卡片暴露的可编辑项。全部一次展开，不再做二级折叠 —— 一共没几个输入项。
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
    toggle: { on: 'llm', off: 'rules' },
  },
  {
    field: 'retitleEvery',
    label: '每隔几条对话重算一次',
    hint: '0 = 只在新建会话时算一次，之后不自动更新（可随时点标题旁的按钮手动重算）',
    spec: numberField,
    modelOnly: true,
  },
  // provider 与 model 仍然各占 FIELDS 里的一项（保存、校验都按项走），
  // 但**渲染时合并成一行两个下拉**，见 renderModelPair()。
  { field: 'provider', label: '标题总结大模型', spec: textField, modelOnly: true },
  { field: 'model', label: '具体模型', spec: textField, modelOnly: true },
  {
    field: 'timeoutMs',
    label: '超时',
    hint: '单次模型调用超时（毫秒）。模型慢的时候（比如免费档在排队）就往大调',
    spec: numberField,
    modelOnly: true,
  },
  {
    field: 'template',
    label: '标题格式',
    hint:
      '占位符：{YYYY} {MM} {DD} {HH} {mm} {ss} {type} {topic}。' +
      '日期部件可任意拼接（如 {MMDD}、{YYYYMMDD}）；不写 {type} 就没有分类，不写 {topic} 就没有主题',
    spec: textField,
  },
  {
    field: 'maxBytes',
    label: '标题长度上限',
    hint: '单位字节，必须 ≤ session-title 的 maxTitleBytes（dsh-base 默认 80）',
    spec: numberField,
  },
  // 隐藏会话的总开关。放在最后、紧挨着下面的「隐藏的会话」自救块 —— 一个功能的
  // 开关、状态与重置放在一起读起来才顺。
  {
    field: 'hiddenEnabled',
    label: '启用隐藏会话',
    hint:
      '打开后：侧边栏每条会话行悬停时，「…」左边会出现一只眼睛，点它就把这条会话隐藏起来' +
      '（默认不再显示，随时可以再显示回来）；「工作区」那一行放大镜左边的眼睛是一键' +
      '显示 / 收起所有被隐藏的会话。隐藏只影响侧边栏显不显示 —— 会话本身、搜索与标题' +
      '自动生成都不受影响，也不会删掉任何东西。' +
      '关掉这里，左侧这一整套按钮与隐藏效果全部停止执行；' +
      '你设过的隐藏列表会原样保留，以后再打开还是那些会话被隐藏着。',
    spec: boolField,
    toggle: { on: 'true', off: 'false' },
  },
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

/** 这两个字段都是标量，用严格相等即可；留 JSON 比较兜底以防将来出现对象。 */
function sameValue(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (left === null || right === null) return false;
  if (typeof left !== 'object' || typeof right !== 'object') return false;
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
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

/**
 * 一个节点算不算「用户真的写了东西」。
 *
 * **空对象不算**。这条很关键：`settingsPath` 为空时 `walk(user, [])` 返回 `user` 本身，
 * 而平台会给内置供应商预置一个空壳 profile —— 若只判断「不是 undefined」，
 * 一堆没配置过的供应商（比如没填 key 的 DeepSeek）就会混进列表。
 */
function isMeaningful(node: unknown): boolean {
  if (node === undefined || node === null) return false;
  if (typeof node === 'object') return Object.keys(node as object).length > 0;
  return true;
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
 * `listProviders()` 返回的是适配器注册的**全部内置供应商**，直接罗列会出现一大堆
 * 用户根本没配、用不了的模型。所以再加两道闸：路由必须**已注册**，且该 provider 的
 * profile 要么在设置文档的**用户层**被写过、要么它引用的凭据**已配置**。
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
    for (const address of addresses.values()) {
      if (address.settingsNs === undefined) continue;
      const ref = readApiKeyRef(findView(address.settingsNs)?.value, address.settingsPath);
      if (ref !== undefined) refs.push(ref);
    }
    let configuredRefs: ReadonlySet<string> | undefined;
    const credentials = getCredentials();
    if (credentials !== undefined) {
      try {
        // 没有任何 profile 命名凭据时不必发这次请求，直接算「查过了」。
        configuredRefs =
          refs.length === 0
            ? new Set<string>()
            : parseConfiguredRefs(await credentials.describe([...new Set(refs)]));
      } catch {
        configuredRefs = undefined;
      }
    }

    const routes: DirectoryRoute[] = [];
    for (const [provider, address] of addresses) {
      if (!activeIds.has(provider)) continue;

      const view = address.settingsNs === undefined ? undefined : findView(address.settingsNs);
      const userConfigured = isMeaningful(walk(view?.user, address.settingsPath));
      const ref = readApiKeyRef(view?.value, address.settingsPath);

      if (ref !== undefined) {
        // profile 命名了凭据引用：**以凭据域为准** —— key 到底配没配，只有它知道。
        // 「profile 写了个引用名」不等于「配了 key」，这是上一版把没配的供应商
        // 也列出来的根因。凭据域读不到时才退回用户层判定。
        const usable = configuredRefs !== undefined ? configuredRefs.has(ref) : userConfigured;
        if (!usable) continue;
      } else if (!userConfigured) {
        // 没命名任何引用：只有用户层真的写过它，才算「我配了」。
        continue;
      }

      routes.push({
        provider,
        displayName: address.displayName,
        models: readModels(view?.value, address.settingsPath),
      });
    }
    routes.sort((left, right) => left.displayName.localeCompare(right.displayName));
    return { status: 'ready', routes, credentialsChecked: configuredRefs !== undefined };
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
 * 收起时是灰底卡片，展开后正文落在同一张卡片内、只隔一条细线；普通字段
 * 「标签在上 / 控件整宽在下 / 说明再下一行」，开关字段「标题与说明在左、开关在右」。
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
  const base = (snapshot.base ?? {}) as Record<string, unknown>;
  const writable = snapshot.writable && !busy;
  const ready = snapshot.status === 'ready';

  /** 一个字段「清空后回落到」的值，也就是界面上该显示的默认值。 */
  const defaultOf = (field: string): unknown => (base[field] !== undefined ? base[field] : FALLBACK_DEFAULTS[field]);

  const draftText = (desc: FieldDesc): string =>
    drafts[desc.field] ?? desc.spec.format(section[desc.field]);

  const providerDesc = FIELDS.find((desc) => desc.field === 'provider');
  const modelDesc = FIELDS.find((desc) => desc.field === 'model');

  /**
   * 「厂家 + 具体模型」这一对的当前取值。
   *
   * - 厂家：草稿优先，否则取已保存的值
   * - 具体模型：草稿优先；**没有值时**自动落到该厂家的第一个模型
   *   （对应用户要求的「必须选一个、不给留空」）；**已存过的值一律原样保留**
   * - 目录读不到（`pairModels === undefined`）→ 原样保留，退回手动输入
   *
   * 注意这里**只算不写**：解析结果不回写草稿。曾经把「自动落到第一个」写进草稿，
   * 后果是卡片一打开就挂着「未保存」—— 草稿值与已存值确实不同，而用户什么都没动过，
   * 之后改任何字段、甚至改回原值，那个标记都不会消失。
   * 那一步挪到了 `save()` 里：保存时按解析值写，界面上看到的仍然等于会存进去的。
   */
  const pairProvider = providerDesc === undefined ? '' : draftText(providerDesc);
  const pairModels =
    directory.status === 'ready'
      ? (directory.routes.find((route) => route.provider === pairProvider)?.models ?? [])
      : undefined;
  const pairModel = modelDesc === undefined ? '' : draftText(modelDesc);
  const pairModelResolved =
    pairModels === undefined || pairModel !== '' ? pairModel : (pairModels[0]?.id ?? '');
  /** 厂家已选、这家没有任何模型、而且手上也没有存过的值：无从选起，保存也过不去。 */
  const pairBlocked =
    pairModels !== undefined && pairProvider !== '' && pairModels.length === 0 && pairModel === '';

  /**
   * 是否「自定义」过（界面上那个标签）。
   *
   * 与官方「键存在即覆盖」不同：用户要的是「和默认值一样就当没改过」，
   * 所以这里额外比一次默认值 —— 一个恰好等于默认值的取值不算覆盖。
   */
  const isOverridden = (desc: FieldDesc): boolean => {
    const draft = drafts[desc.field];
    if (draft !== undefined) {
      const write = desc.spec.parse(draft);
      if (write === undefined || write.kind === 'clear') return false;
      return !sameValue(write.value, defaultOf(desc.field));
    }
    if (!hasKey(user, desc.field)) return false;
    return !sameValue(user[desc.field], defaultOf(desc.field));
  };

  const isInvalid = (desc: FieldDesc): boolean => {
    const draft = drafts[desc.field];
    return draft !== undefined && desc.spec.parse(draft) === undefined;
  };

  /**
   * 这个字段的草稿和**已经保存的值**不一样吗？
   *
   * 注意判据不是「动过输入框」，而是「值变了」：把 80 改成 90 再改回 80，
   * 不该继续挂着「未保存」。
   */
  const draftDiffers = (desc: FieldDesc): boolean => {
    const draft = drafts[desc.field];
    if (draft === undefined) return false;
    const write = desc.spec.parse(draft);
    // 解析不了的草稿（比如输了个半成品）算改动：保存按钮要亮着，
    // 用户才收得到「这里需要一个整数」的提示。
    if (write === undefined) return true;
    return !sameValue(write.kind === 'clear' ? undefined : write.value, section[desc.field]);
  };
  /** 与已存值不同的项。只可能是用户自己编辑过的字段 —— 不会再被自动补的值污染。 */
  const differing = FIELDS.filter(draftDiffers);
  const dirty = differing.length > 0;
  // 厂家下面一个模型都没有时也保存不过：host 的「成对」校验会拒（provider 有值、model 没有）。
  const invalid = FIELDS.some(isInvalid) || pairBlocked;

  const stage = (field: string, text: string): void => {
    setFailed(false);
    setDrafts((previous) => ({ ...previous, [field]: text }));
  };

  const stageMany = (patch: Record<string, string>): void => {
    setFailed(false);
    setDrafts((previous) => ({ ...previous, ...patch }));
  };

  /** 「恢复默认」：把框里填回默认值，而不是留空。 */
  const restoreDefault = (desc: FieldDesc): void => {
    stage(desc.field, desc.spec.format(defaultOf(desc.field)));
  };

  const save = async (): Promise<void> => {
    setBusy(true);
    setFailed(false);
    try {
      for (const desc of FIELDS) {
        // 「厂家 + 具体模型」这一对单独处理，见循环之后。
        if (desc.field === 'provider' || desc.field === 'model') continue;
        const draft = drafts[desc.field];
        if (draft === undefined) continue;
        const write = desc.spec.parse(draft);
        // 无效草稿不写：`invalid` 已经禁用了保存按钮，这里只是兜底。
        if (write === undefined) continue;

        const value = write.kind === 'clear' ? undefined : write.value;
        // 值等于默认值就不必往用户层记一笔 —— 清掉它，让它继续继承默认。
        if (value === undefined || sameValue(value, defaultOf(desc.field))) {
          await scope.unset(desc.field);
        } else {
          await scope.set(desc.field, value);
        }
      }

      // 这一对按**解析后的值**写，而不是按草稿：界面上的具体模型可能是自动落到第一个的
      // （用户没单独编辑过它），只按草稿写会漏掉它，留下 provider 有值、model 为空的
      // 坏配置 —— host 的「成对」校验会直接拒掉这次保存。
      const pairWrites: readonly (readonly [keyof PluginConfig & string, string | undefined])[] = [
        ['provider', pairProvider === '' ? undefined : pairProvider],
        ['model', pairProvider === '' || pairModelResolved === '' ? undefined : pairModelResolved],
      ];
      for (const [field, value] of pairWrites) {
        if (value === undefined || sameValue(value, defaultOf(field))) {
          await scope.unset(field);
        } else {
          await scope.set(field, value);
        }
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

  /** 普通字段的控件：一个整宽的输入框。 */
  const renderControl = (desc: FieldDesc): React.JSX.Element => (
    <input
      className={isInvalid(desc) ? 'stp-input stp-inputInvalid' : 'stp-input'}
      value={draftText(desc)}
      disabled={!writable}
      onChange={(event) => stage(desc.field, event.target.value)}
    />
  );

  /**
   * 供应商 + 模型：**一行两个下拉**，不再拆成两个字段。
   *
   * 为什么合并：这本来就是一件事（先挑哪家的、再挑哪个模型），拆成两行时每行都要一套
   * 「标签 + 自定义 + 恢复默认 + 说明」，读起来非常啰嗦。两个框的内容本身就能说明各自
   * 是干什么的（一边是厂家名、一边是模型名），所以也不再各配一个标签 —— 左边第一个
   * 选项是「跟随对话模型」，右边是该厂家下的具体模型 —— **必须选一个、不给留空**，
   * 选中厂家后自动落到第一个，换厂家时同样自动落到新家的第一个。
   *
   * 目录可用时是**只能选**的下拉：手写 provider / model 几乎总是拼错，而拼错的结果是
   * 运行时调用失败，不如从根上不让输。目录读不到才退回两个文本输入。
   */
  const renderModelPair = (providerDesc: FieldDesc, modelDesc: FieldDesc): React.JSX.Element => {
    const disabled = !writable;
    const routes = directory.status === 'ready' ? directory.routes : undefined;
    // 取值统一用上面那组 pair* —— 「模型必须是列表里的某一个」的解析与自动落位都在那里做。
    const provider = pairProvider;
    const model = pairModelResolved;
    const models = pairModels ?? [];
    const providerKnown = routes?.some((route) => route.provider === provider) ?? true;
    const modelKnown = models.some((entry) => entry.id === model);
    // 跟随对话模型时第二个框没有意义；这家一个模型都没有时也无从选起。
    const following = provider === '';
    const overridden = isOverridden(providerDesc) || isOverridden(modelDesc);

    /** 两个框是一次选择的两个部分，「恢复默认」自然要一起清。 */
    const restore = (): void => {
      restoreDefault(providerDesc);
      restoreDefault(modelDesc);
    };

    return (
      <div key={providerDesc.field} className="stp-field">
        <div className="stp-head">
          <span className="stp-label">{providerDesc.label}</span>
          <span className="stp-badges">
            {overridden ? <span className="stp-overridden">自定义</span> : null}
            <button type="button" className="stp-reset" disabled={!writable || !overridden} onClick={restore}>
              恢复默认
            </button>
          </span>
        </div>
        <div className="stp-pair">
          {routes === undefined ? (
            <>
              <input
                className="stp-input"
                value={provider}
                disabled={disabled}
                placeholder="供应商，如 deepseek"
                onChange={(event) => {
                  // 换了供应商就清掉已选模型，避免留下属于上一个供应商的模型 id。
                  stageMany({ provider: event.target.value, model: '' });
                }}
              />
              <input
                className="stp-input"
                value={model}
                disabled={disabled}
                placeholder="模型 id，留空用厂家默认"
                onChange={(event) => stage(modelDesc.field, event.target.value)}
              />
            </>
          ) : (
            <>
              <select
                className="stp-input"
                value={provider}
                disabled={disabled}
                aria-label="用哪家的模型总结标题"
                onChange={(event) => {
                  // 换了厂家，具体模型立刻落到新家的第一个 —— 这一项不允许留空。
                  const next = event.target.value;
                  const first = routes.find((route) => route.provider === next)?.models[0]?.id ?? '';
                  stageMany({ provider: next, model: first });
                }}
              >
                <option value="">跟随对话模型</option>
                {routes.map((route) => (
                  <option key={route.provider} value={route.provider}>
                    {route.displayName}
                  </option>
                ))}
                {provider !== '' && !providerKnown ? (
                  <option value={provider}>{`${provider}（不在已配置列表）`}</option>
                ) : null}
              </select>
              <select
                className="stp-input"
                value={model}
                // 置灰而不是藏起来：两个框并排，藏一个会让布局跳动。
                disabled={disabled || following || models.length === 0}
                aria-label="用哪个模型总结标题"
                onChange={(event) => stage(modelDesc.field, event.target.value)}
              >
                {/* 没有模型就是一个空框：不写字，空着本身就说明问题了。
                    仍给一个空选项，免得受控 select 的 value 匹配不上任何 option。 */}
                {models.length === 0 ? <option value="" /> : null}
                {models.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name ?? entry.id}
                  </option>
                ))}
                {/* 存过的模型不在当前列表里：原样保留，别静默替换掉用户的选择。 */}
                {model !== '' && !modelKnown ? (
                  <option value={model}>{`${model}（不在已配置列表）`}</option>
                ) : null}
              </select>
            </>
          )}
        </div>
        {directory.status === 'unavailable' ? (
          <p className="stp-hint">
            {`未能读取已配置的模型列表（${directory.reason}），这两个框已退回手动输入`}
          </p>
        ) : null}
        {directory.status === 'ready' && !directory.credentialsChecked ? (
          <p className="stp-hint">未能读取凭据状态，列表只按设置文档判断，可能多列出没配好的供应商</p>
        ) : null}
        {pairBlocked ? (
          <p className="stp-invalid">这家下面没有可选模型，请换一家，或先到「模型」设置里给它配上模型</p>
        ) : null}
      </div>
    );
  };

  /** 开关字段：标题与说明在左，开关在右（对齐官方 MCP / Subagent 卡片的开关行）。 */
  const renderToggle = (desc: FieldDesc, notice?: string): React.JSX.Element => {
    // 开关的真值是布尔，而卡片全程按文本走 —— 两个端点由 `desc.toggle` 给出。
    const { on, off } = desc.toggle ?? { on: 'llm', off: 'rules' };
    return (
      <div key={desc.field} className="stp-field">
        <div className="stp-toggleRow">
          <div className="stp-toggleLabel">
            <span className="stp-toggleTitle">{desc.label}</span>
            {desc.hint === undefined ? null : <p className="stp-hint">{desc.hint}</p>}
          </div>
          {isOverridden(desc) ? <span className="stp-overridden">自定义</span> : null}
          <Switch
            checked={draftText(desc) === on}
            disabled={!writable}
            label={desc.label}
            onChange={(next) => stage(desc.field, next ? on : off)}
          />
        </div>
        {/* 关掉模型总结后，把「接下来会怎样」直接写在开关下面。 */}
        {notice === undefined ? null : <p className="stp-hint">{notice}</p>}
      </div>
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
            {overridden ? <span className="stp-overridden">自定义</span> : null}
            <button
              type="button"
              className="stp-reset"
              disabled={!writable || !overridden}
              onClick={() => restoreDefault(desc)}
            >
              恢复默认
            </button>
          </span>
        </div>
        {renderControl(desc)}
        {desc.hint === undefined ? null : <p className="stp-hint">{desc.hint}</p>}
        {fieldInvalid ? <p className="stp-invalid">这里需要一个整数</p> : null}
      </div>
    );
  };

  /**
   * 自救块：只读状态 + **立即生效**的「全部取消隐藏」。
   *
   * 为什么需要它：隐藏是靠往侧边栏真实 DOM 上做标记实现的（上游没有能过滤列表的
   * slot），一旦上游改版让行识别失效，隐藏列表就变成用户自己删不掉的死数据 ——
   * 这一块是官方界面里唯一的兜底出口，所以它刻意**不进 `FIELDS`**：
   * 它不参与「自定义 / 未保存 / 保存」那套草稿机制，点了就直接写。
   */
  const renderRescue = (): React.JSX.Element => {
    const hiddenCount = Array.isArray(section.hiddenSessions) ? section.hiddenSessions.length : 0;
    const revealing = section.revealHiddenAll === true;
    return (
      <div key="stp-rescue" className="stp-field">
        <div className="stp-head">
          <span className="stp-label">隐藏的会话</span>
        </div>
        <p className="stp-hint">
          {`已隐藏 ${hiddenCount} 条。悬停侧边栏的会话行可隐藏 / 取消隐藏，「工作区」那行放大镜左边的眼睛是一键全显 / 全隐；` +
            '隐藏只影响侧边栏显不显示，会话本身、搜索与标题都照常。'}
        </p>
        <div className="stp-rescueActions">
          <button
            type="button"
            className="stp-discard"
            disabled={!writable || (hiddenCount === 0 && !revealing)}
            onClick={() => {
              setFailed(false);
              // 直接写、不经过「保存」：它是兜底出口，越少前置条件越好。
              void scope.unset('hiddenSessions').catch(() => setFailed(true));
            }}
          >
            全部取消隐藏
          </button>
        </div>
      </div>
    );
  };

  if (!ready) return null;

  const modeDesc = FIELDS.find((desc) => desc.field === 'mode');
  // 以草稿为准：把开关关掉后，下面那些只对模型有意义的项应当**立刻**消失，
  // 不用等保存。关掉之后没有什么可配的，留着只会让人以为还生效。
  const modelMode = modeDesc === undefined || draftText(modeDesc) !== 'rules';
  // provider 与 model 合并成一行（两个下拉）渲染，所以 model 不单独出行。
  const visibleFields = FIELDS.filter(
    (desc) => (desc.modelOnly !== true || modelMode) && desc.field !== 'model',
  );

  return (
    <li className={expanded ? 'stp-card stp-cardOpen' : 'stp-card'}>
      <button
        type="button"
        className="stp-header"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="stp-headText">
          {/* 带上插件名，用户才知道这条设置属于哪个插件。 */}
          <span className="stp-name">会话标题（session-title-pattern）</span>
          <span className="stp-description">用模型总结会话标题的类型与主题，也可以退回关键词规则。</span>
        </span>
        {/* 折叠不影响暂存的改动，所以标题行要标出「有未保存的改动」。 */}
        {dirty ? (
          // 把「到底哪几项不同」挂在悬停提示里：标记不消失时鼠标一停就知道该查哪个字段。
          <span className="stp-pending" title={`未保存：${differing.map((desc) => desc.label).join('、')}`}>
            未保存
          </span>
        ) : null}
        <span className={expanded ? 'stp-chevron stp-chevronOpen' : 'stp-chevron'}>{ChevronIcon}</span>
      </button>
      {expanded ? (
        <div className="stp-body">
          {modeDesc === undefined
            ? null
            : renderToggle(
                modeDesc,
                modelMode
                  ? undefined
                  : '已改用关键词规则：类型按关键词匹配得出、主题取首条消息原文，标题不会随对话更新。下面的标题格式与长度上限仍然有效。',
              )}
          {visibleFields
            .filter((desc) => desc.field !== 'mode')
            .map((desc) => {
              if (desc.toggle !== undefined) return renderToggle(desc);
              return desc.field === 'provider' && modelDesc !== undefined
                ? renderModelPair(desc, modelDesc)
                : renderField(desc);
            })}
          {renderRescue()}
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
                // 丢掉所有未保存的草稿，回到已保存的状态。
                //
                // 这里原来是「把各字段填回 schema 默认值」，但那会连 supplier /
                // 具体模型一起清空 —— 用户存过自定义模型时，点一下就等于改了模型选择，
                // 于是「未保存」亮起且之后改什么都清不掉（那两个草稿一直在）。
                // 清回默认是各字段自己那个「恢复默认」的职责，这里只负责撤销本次改动。
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
