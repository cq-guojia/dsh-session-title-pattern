/**
 * 「标题总结大模型」：供应商 + 模型一行两个下拉（实机反馈恢复 v0.7.x 的选择器）。
 *
 * ## 为什么控件是自绘的
 *
 * 官方 settings-form 体系只有文本 / 数字 / 密钥三种字段控件，没有下拉 —— v0.8.0
 * 迁到官方表单时 provider / model 因此退化成了文本框。这里用官方 `Menu` + `Button`
 * 原语组合出下拉：草稿仍经 `edit()` 写进官方 `SettingsFormModel`，状态机（暂存 /
 * 保存 / overridden / 重置）一行都不自己管，只换「产生草稿文本的输入方式」。
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
import { useState } from 'react';
import { Menu } from '@deepseek-ai/dsh-client-ui-primitives';
import type { MenuEntry } from '@deepseek-ai/dsh-client-ui-primitives';

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

/** 下拉框尾部的 chevron（内联 SVG，不赌上游图标名）。 */
const ChevronDown = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ flex: 'none', color: 'var(--dsw-alias-label-tertiary)' }}
  >
    <path d="M4 6.5 8 10.5 12 6.5" />
  </svg>
);

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
 * 供应商 + 模型：**一行两个下拉**。
 *
 * 为什么合并成一行：这本来就是一件事（先挑哪家的、再挑哪个模型），两个框的内容
 * 本身就能说明各自是干什么的，不再各配一个标签。左边第一个选项是「跟随对话模型」；
 * 选中厂家后右边自动落到该家的第一个模型（**只在选择时写草稿**，显示上从不自动
 * 补值 —— 那会让表单一打开就挂着「未保存」，v0.7.6 踩过的坑）。目录读不到才退回
 * 两个文本输入；目录可用时是**只能选**的下拉：手写 provider / model 几乎总是拼错。
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
  const [openMenu, setOpenMenu] = useState<'provider' | 'model' | null>(null);

  const routes = directory.status === 'ready' ? directory.routes : undefined;
  const models = routes !== undefined ? (routes.find((route) => route.provider === provider)?.models ?? []) : [];
  const providerKnown = routes?.some((route) => route.provider === provider) ?? true;
  const following = provider === '';
  const blocked = routes !== undefined && !following && models.length === 0 && model === '';
  // 模型下拉的选中项：跟随对话模型时无意义；存过值原样保留（哪怕不在列表里，
  // 用 notInList 行显示，绝不静默替换用户的选择）。
  const modelKnown = models.some((entry) => entry.id === model);

  const selectProvider = (id: string): void => {
    // 换厂家，具体模型立刻落到新家的第一个 —— 这一项不允许留空。
    const first = routes?.find((route) => route.provider === id)?.models[0]?.id ?? '';
    onEdit('provider', id);
    onEdit('model', id === '' ? '' : first);
  };

  const providerDisplay =
    provider === ''
      ? t('followMainModel')
      : (routes?.find((route) => route.provider === provider)?.displayName ??
        t('notInList', { id: provider }));
  const modelDisplay = model === '' ? '' : (models.find((entry) => entry.id === model)?.name ?? t('notInList', { id: model }));

  const providerItems: MenuEntry[] = [
    { id: '', label: t('followMainModel') },
    ...(routes ?? []).map((route) => ({ id: route.provider, label: route.displayName })),
    ...(providerKnown || provider === '' ? [] : [{ id: provider, label: t('notInList', { id: provider }) }]),
  ];
  const modelItems: MenuEntry[] = [
    ...models.map((entry) => ({ id: entry.id, label: entry.name ?? entry.id })),
    ...(modelKnown || model === '' ? [] : [{ id: model, label: t('notInList', { id: model }) }]),
  ];

  /** 下拉触发按钮：外观对齐文本框（同样的 34px 高度与边框），内容右侧带 chevron。 */
  const trigger = (
    label: string,
    aria: SessionTitlePatternLocaleKey,
    isOpen: boolean,
    onToggle: () => void,
    isDisabled: boolean,
  ): React.JSX.Element => (
    <button type="button" className="stp-combo" disabled={isDisabled} aria-label={t(aria)} onClick={onToggle}>
      <span className="stp-comboText" data-empty={label === '' ? '1' : undefined}>
        {label}
      </span>
      <span className="stp-comboChevron" data-open={isOpen ? '1' : undefined}>
        {ChevronDown}
      </span>
    </button>
  );

  return (
    <div className="stp-pairField">
      <div className="stp-pairHead">
        <span className="stp-pairLabel">{t('modelPairLabel')}</span>
        <span className="stp-badges">
          {overridden ? <span className="stp-overridden">{t('overridden')}</span> : null}
          <button type="button" className="stp-reset" disabled={disabled || !overridden} onClick={onReset}>
            {t('reset')}
          </button>
        </span>
      </div>
      {routes === undefined ? (
        <div className="stp-pair">
          <input
            className="stp-input"
            value={provider}
            disabled={disabled}
            placeholder={t('providerPlaceholder')}
            aria-label={t('providerSelectAria')}
            onChange={(event) => {
              // 换了供应商就清掉已选模型，避免留下属于上一个供应商的模型 id。
              onEdit('provider', event.target.value);
              onEdit('model', '');
            }}
          />
          <input
            className="stp-input"
            value={model}
            disabled={disabled}
            placeholder={t('modelPlaceholder')}
            aria-label={t('modelSelectAria')}
            onChange={(event) => onEdit('model', event.target.value)}
          />
        </div>
      ) : (
        <div className="stp-pair">
          <Menu
            open={openMenu === 'provider'}
            anchor={trigger(
              providerDisplay,
              'providerSelectAria',
              openMenu === 'provider',
              () => setOpenMenu(openMenu === 'provider' ? null : 'provider'),
              disabled,
            )}
            items={providerItems}
            selectedId={provider}
            onSelect={(id) => {
              setOpenMenu(null);
              selectProvider(id);
            }}
            onClose={() => setOpenMenu(null)}
          />
          <Menu
            open={openMenu === 'model'}
            anchor={trigger(
              modelDisplay,
              'modelSelectAria',
              openMenu === 'model',
              () => setOpenMenu(openMenu === 'model' ? null : 'model'),
              // 跟随对话模型时第二个框没有意义；这家一个模型都没有时也无从选起。
              // 置灰而不是藏起来：两个框并排，藏一个会让布局跳动。
              disabled || following || models.length === 0,
            )}
            items={modelItems}
            selectedId={model}
            onSelect={(id) => {
              setOpenMenu(null);
              onEdit('model', id);
            }}
            onClose={() => setOpenMenu(null)}
          />
        </div>
      )}
      {directory.status === 'loading' ? <p className="stp-hint">{t('loadingDirectory')}</p> : null}
      {directory.status === 'unavailable' ? (
        <p className="stp-hint">{t('directoryUnavailable', { reason: directory.reason })}</p>
      ) : null}
      {routes !== undefined ? <p className="stp-hint">{t('credentialsUnknown')}</p> : null}
      {blocked ? <p className="stp-invalid">{t('pairBlocked')}</p> : null}
    </div>
  );
}
