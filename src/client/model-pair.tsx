/**
 * 「标题总结大模型」：供应商 + 模型联动选择（核心库 `ModelPicker`）。
 *
 * 控件与联动全交给 `dsh-plugin-core/ui` 的 `ModelPicker variant="cascade"`，
 * 这里只负责把目录路由翻成分组、把 `${provider}/${id}` 拆回 host 的双字段草稿。
 * 官方 `SettingsFormModel` 的暂存 / 保存 / overridden / 重置状态机一行都不自己管。
 *
 * ## 数据从哪来（0.1.7 仍可用，均已核实类型）
 *
 * - provider 目录：远端 `llm/listProviders`（已注册路由）+ `llm/listConfigurableProviders`
 *   （可配置目录，带 `settingsNs` / `settingsPath`）。
 * - 模型列表：各 provider 设置文档 profile 的 `models` 数组（设置镜像 face 读）。
 * - **0.1.7 的 remote 命名空间表里没有 credentials**（v0.7.6 靠它把「key 只在环境
 *   变量」的供应商也认进来），所以目录只按设置文档判定，界面上用
 *   `credentialsUnknown` 文案说明口径 —— 宁缺勿滥，与 v0.7.6 凭据域读不到时相同。
 *
 * 目录 loading / unavailable 时退回两个文本框（与 v0.7.6 相同的 fail-safe）。
 */
import { Button, Chip, Input, ModelPicker } from 'dsh-plugin-core/ui';
import type { PickerGroup } from 'dsh-plugin-core/ui';

import type { SessionTitlePatternLocaleKey } from './locales';

/** 本插件渲染文案的函数形状（框架注入的 `t`，支持 `{name}` 插值）。 */
type Translate = (key: SessionTitlePatternLocaleKey, params?: Record<string, unknown>) => string;

/** `llm` 远端命名空间里我们用到的方法（0.1.7 类型已导出；信封形状按结构声明）。 */
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

/** 设置镜像的读取面（0.1.7 `SettingsDescribeFace` 的结构化子集，不引它的类型入口）。 */
export interface DescribeFace {
  ensure: () => Promise<void>;
  getSnapshot: () => {
    view?: { namespaces: readonly SettingsNamespaceLike[] } | undefined;
  };
}

/** 设置镜像里一个命名空间视图 —— 我们只关心 `ns` 与两层数据。 */
interface SettingsNamespaceLike {
  ns: string;
  value?: unknown;
  user?: unknown;
}

/** 一个可选路由，以及它已配置的模型。 */
interface DirectoryRoute {
  provider: string;
  displayName: string;
  models: readonly { id: string; name?: string }[];
}

export type DirectoryState =
  | { status: 'loading' }
  | { status: 'unavailable'; reason: string }
  | { status: 'ready'; routes: readonly DirectoryRoute[] };

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
 * 一个节点算不算「用户真的写了东西」。**空对象不算** —— 平台会给内置供应商预置
 * 一个空壳 profile，只判断「不是 undefined」会把没配置过的供应商也混进列表。
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

/** profile 里指向凭据的引用名（`apiKeyEnv`）。仅用于说明口径，不再参与判定。 */
function readApiKeyRef(section: unknown, path: readonly string[]): string | undefined {
  const profile = walk(section, path);
  if (profile === null || typeof profile !== 'object') return undefined;
  const ref = (profile as Record<string, unknown>).apiKeyEnv;
  return typeof ref === 'string' && ref.length > 0 ? ref : undefined;
}

/**
 * 组装「供应商 → 已配置模型」目录，**只保留设置文档里真正写过的供应商**。
 *
 * `listProviders()` 返回适配器注册的**全部**内置供应商，直接罗列会出现一大堆
 * 用户根本没配的模型。判定口径（0.1.7 无凭据域）：该 provider 的 profile 必须
 * 在设置文档的**用户层**被写过。
 */
async function loadDirectory(llm: LlmDirectory, describe: DescribeFace): Promise<DirectoryState> {
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

    const routes: DirectoryRoute[] = [];
    for (const [provider, address] of addresses) {
      if (!activeIds.has(provider)) continue;

      const view = address.settingsNs === undefined ? undefined : findView(address.settingsNs);
      // 0.1.7 没有凭据域：profile 命名了凭据引用（apiKeyEnv）也拿不到「key 到底
      // 配没配」的权威答案，只能看用户层写没写过 —— 文案里已向用户说明这个口径。
      if (readApiKeyRef(view?.value, address.settingsPath) !== undefined) {
        if (!isMeaningful(walk(view?.user, address.settingsPath))) continue;
      } else if (!isMeaningful(walk(view?.user, address.settingsPath))) {
        continue;
      }

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

/**
 * 模型目录的 observable store（`hooks` 成员的形状要求：getSnapshot + subscribe）。
 *
 * 依赖两组服务（`remote.llm` 与设置镜像 face），就绪时序不定，所以 `load()`
 * 设计成**两阶段喂参数**：任一次调用补上自己的那份，两组齐了才真正启动一次
 * 加载（幂等）。之后组件挂载多早都只会读到 loading，加载完成自动重渲。
 */
export class DirectoryStore {
  private llm: LlmDirectory | undefined;
  private describe: DescribeFace | undefined;
  private started = false;
  private snapshot: DirectoryState = { status: 'loading' };
  private readonly listeners = new Set<() => void>();

  /** 当前快照（值不变时返回同一引用，满足 observable 的稳定性约定）。 */
  readonly getSnapshot = (): DirectoryState => this.snapshot;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** 喂入服务面；两组齐了就启动一次加载。重复调用幂等。 */
  load(llm?: LlmDirectory, describe?: DescribeFace): void {
    if (this.started) return;
    if (llm !== undefined) this.llm = llm;
    if (describe !== undefined) this.describe = describe;
    const { llm: readyLlm, describe: readyDescribe } = this;
    if (readyLlm === undefined || readyDescribe === undefined) return;
    this.started = true;
    void loadDirectory(readyLlm, readyDescribe).then((next) => {
      this.snapshot = next;
      for (const listener of this.listeners) listener();
    });
  }
}

/** 把目录路由翻成核心 ModelPicker 的分组；选项值统一为 `${provider}/${id}`。 */
function toGroups(routes: readonly DirectoryRoute[]): PickerGroup[] {
  return routes.map((route) => ({
    value: route.provider,
    label: route.displayName,
    options: route.models.map((entry) => ({
      value: `${route.provider}/${entry.id}`,
      label: entry.name ?? entry.id,
    })),
  }));
}

/** `ModelPairFields` 收到的 props（字段值与动作由 ConfigPanel 转交）。 */
export interface ModelPairFieldsProps {
  /** 模型目录状态（`useDirectory` 投影）。 */
  directory: DirectoryState;
  /** provider / model 的当前草稿文本（空 = 跟随对话模型 / 厂家默认）。 */
  provider: string;
  model: string;
  /** 只读文档或命名空间不可用时禁用全部控件。 */
  disabled: boolean;
  /** 两个草稿任一落进用户层即显示「自定义」徽章并放开恢复默认。 */
  overridden: boolean;
  /** 暂存草稿文本。 */
  onEdit: (field: 'provider' | 'model', text: string) => void;
  /** 「恢复默认」：两个框一起清空（跟随对话模型）。 */
  onReset: () => void;
  t: Translate;
}

/**
 * 供应商 + 模型：核心 `ModelPicker` 的 cascade 形态，两个下拉由组件自己联动。
 * 目录读不到时退回两个核心 `Input` 文本框（与 v0.7.6 相同的 fail-safe）。
 */
export function ModelPairFields({
  directory,
  provider,
  model,
  disabled,
  overridden,
  onEdit,
  onReset,
  t,
}: ModelPairFieldsProps) {
  const routes = directory.status === 'ready' ? directory.routes : undefined;
  const groups = routes === undefined ? undefined : toGroups(routes);
  const value = provider !== '' && model !== '' ? `${provider}/${model}` : '';
  const models = routes?.find((route) => route.provider === provider)?.models ?? [];
  const blocked = routes !== undefined && provider !== '' && models.length === 0 && model === '';

  const onModelChange = (next: string): void => {
    // cascade 换供应商会先发 ''（新供应商由组件内部记着，不回传）；这时两个草稿
    // 一起清空 = 跟随对话模型。选定具体模型后按第一个 '/' 拆回双字段。
    const slash = next.indexOf('/');
    if (slash < 0) {
      onEdit('provider', '');
      onEdit('model', '');
      return;
    }
    onEdit('provider', next.slice(0, slash));
    onEdit('model', next.slice(slash + 1));
  };

  return (
    <div className="stp-config__field">
      <div className="stp-config__head">
        <span className="stp-config__label">{t('modelPairLabel')}</span>
        {overridden ? <Chip tone="neutral" size="xs">{t('overridden')}</Chip> : null}
        {overridden ? (
          <Button variant="link" size="sm" disabled={disabled} onClick={onReset}>{t('reset')}</Button>
        ) : null}
      </div>
      {groups === undefined ? (
        <div className="stp-config__pair">
          <Input
            value={provider}
            disabled={disabled}
            placeholder={t('providerPlaceholder')}
            aria-label={t('providerSelectAria')}
            onChange={(text) => {
              // 换了供应商就清掉已选模型，避免留下属于上一个供应商的模型 id。
              onEdit('provider', text);
              onEdit('model', '');
            }}
          />
          <Input
            value={model}
            disabled={disabled}
            placeholder={t('modelPlaceholder')}
            aria-label={t('modelSelectAria')}
            onChange={(text) => onEdit('model', text)}
          />
        </div>
      ) : (
        <ModelPicker
          variant="cascade"
          size="lg"
          groups={groups}
          value={value}
          defaultLabel={t('followMainModel')}
          disabled={disabled}
          onChange={onModelChange}
        />
      )}
      {directory.status === 'loading' ? <p className="stp-config__hint">{t('loadingDirectory')}</p> : null}
      {directory.status === 'unavailable' ? (
        <p className="stp-config__hint">{t('directoryUnavailable', { reason: directory.reason })}</p>
      ) : null}
      {routes !== undefined ? <p className="stp-config__hint">{t('credentialsUnknown')}</p> : null}
      {blocked ? <p className="stp-config__invalid">{t('pairBlocked')}</p> : null}
    </div>
  );
}
