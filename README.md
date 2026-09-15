# Session title + hidden sessions (session-title-pattern)

English | [中文](README.zh.md)

Two small tools for the dsh sidebar: **titles you can read at a glance**, and **tuck away the sessions you are not using right now**.

![Session titles in the sidebar](docs/images/session-list.png)

- **Automatic titles** — every title becomes `0913｜排查｜登录失败`: which day, what kind of work, and what it was about, summarized from the **whole conversation** by a model (two Chinese characters for Chinese, one word for English)
- **Hidden sessions** — put the sessions you are not using away so the sidebar keeps only the recent few; show them all again with one click, and nothing is ever deleted

## Install

```bash
dsh plugin --profile web add dsh-session-title-pattern
```

Every stable release is published to npm, so it works right after installing — no extra configuration and no local build.

## Feature 1: automatic titles

### What a title looks like

By default dsh uses a sentence the model happened to produce (for example 「确认当前模型身份及工具查询」); with a dozen sessions on screen you cannot tell which day a session belongs to or what kind of work it was. This plugin turns the title into three parts:

```
MMDD ｜ type ｜ topic
0913 ｜ 排查 ｜ DeepSeek-Harness login failure
```

- **Date** — your machine's **local** date, four digits `MMDD` (no off-by-one day around midnight)
- **Type** — what the session is about, **following the interface language**: a Chinese UI gets two Chinese characters (排查 / 生成 / 配置…), an English UI gets a single word (Debug / Config / Docs) — an English conversation under a Chinese UI still gets a Chinese type
- **Topic** — a summary of the **whole conversation**, not the first few characters of the first message

The format is yours to change; the default template is `{MMDD}｜{type}｜{topic}`:

| Placeholder | Meaning |
| --- | --- |
| `{YYYY}` `{MM}` `{DD}` `{HH}` `{mm}` `{ss}` | Date/time parts, **local time zone**, freely combinable (`{YYYYMMDD}`, `{HHmmss}`) |
| `{type}` | Type. **Omit it and there is no type**; when it renders empty the whole segment disappears and the neighbouring separator goes with it |
| `{topic}` | Topic. **Omit it and there is no topic**; it disappears the same way when empty |

Change the template directly, e.g. `{topic}｜{MMDD}` (topic first) or `{YYYYMMDD} {topic}` (with the year).

### When it updates

- **On the first message** — dsh schedules this itself and produces a first title
- **Every 10 messages afterwards** (configurable) — this plugin triggers one recompute; the other turns never call the model
- Only top-level sessions are handled; forked child sessions are not auto-named

Each recompute sends only "first message + last main line + last summary + the new turns" — a few hundred tokens in total, **no matter how long the conversation has been going** (earlier text is only ever compressed forward, never re-sent).

The model follows the session's current main model by default; you can also pick one in the settings.

Failures behave differently depending on what already exists:

- **A title already exists**: timeouts, errors, and a missing route all **keep the previous title** — a good title is never wiped out
- **No title yet** (the very first attempt failed): instead of waiting for the model, the plugin builds a fallback title locally — the date as usual, **no type**, and the topic taken from the **leading words** of the first message (the same rule dsh uses for its own first-prompt naming: the first 8 whitespace-separated words, then a byte cap; Chinese has no spaces, so for Chinese this is effectively the whole message cut by bytes), e.g. `0915｜login failure reason`. The next recompute replaces it as soon as the model works

**The type** uses the same language as the interface copy — both follow dsh's **interface language** (Settings → General → Language). **The topic follows the conversation's language.** So an English conversation with a Chinese UI reads exactly `0915｜排查｜Login 401`.

### Manual recompute and rename

![The button next to the title, with its tooltip](docs/images/retitle-button.png)

**Click the header button**: the first item to the right of the title is a pencil icon; it opens a "Rename session" card — the input is prefilled with the current title and can be edited by hand; "Generate" really computes a title and **only fills the input**; "Save" writes it and locks it (no further automatic updates), and the lock switch in the bottom-left corner releases it at any time.

**Type a command**: enter `/retitle` in the input box.

> Automatic naming only fires for "a top-level session, the first human message, and no title yet", so later renames can only use the two entry points above. The three-dot menu on each session row (rename / fork / archive) is a closed platform component with no extension slot, so a third-party plugin cannot add menu items to it.

### Title display width

dsh renders the title as the last breadcrumb segment, and the upstream stylesheet hard-codes `max-width:220px` for it — after padding and the `MMDD｜type` prefix, only seven or eight Chinese characters are left for the topic. When the client activates, this plugin **injects** an override rule (no configuration needed):

```css
[class*="_crumbCurrent"]{max-width:min(640px, 60vw) !important;}
```

Only the **current session's title** is widened; ancestor sessions and subagent breadcrumbs keep the original width. If upstream renames the class, the rule fails silently (no error — the title just gets short again): select the title element in DevTools and check whether `class` still contains `_crumbCurrent`.

## Feature 2: hidden sessions

dsh offers only "archive" for putting a session away, and it is one-way: getting one back afterwards is painful (the platform states plainly that there is *No Session deletion or unarchive control*).

But plenty of sessions are simply not in use right now — you do not want to delete them, yet they clutter the sidebar. This plugin keeps **its own hidden list**: put the ones you are not using away, keep the sidebar down to the recents, and bring them back with one click whenever you want. Fully reversible.

| | Hidden (this plugin) | Archived (platform) |
| --- | --- | --- |
| Scope | Only whether the sidebar shows it | Gone from every grouped view |
| Reversible | Show it again any time | Getting it back is painful |
| The session itself | Untouched | Untouched |

### How to use it

**Hide one**: hover a session row and click the **struck-through eye** at the end of the row.

![The hide button on a session row, tooltip "Hide this session"](docs/images/hidden-hide-row.png)

**Bring them back**: click the **eye** to the left of the magnifier in the "Workspaces" header (the master switch); the hidden sessions come back, just **dimmed**; click the eye on an individual row to unhide that one.

![Master switch: show / collapse hidden sessions with one click](docs/images/hidden-toggle-all.png)

![Hidden sessions render dimmed; click the eye to unhide](docs/images/hidden-unhide-row.png)

Both icons mean the same thing: **an eye means "these are showing right now"**. A hidden session row shows an eye (click it to unhide); one that is not hidden shows the struck-through eye. When the master switch is currently revealing hidden sessions it shows an eye, otherwise the struck-through one. Hovering an eye pops its explanation **immediately**.

The session you currently have open is kept visible (so the conversation you are reading does not suddenly "disappear"); it goes away on its own once you switch to another session.

**Turning the whole feature off**: the "**Enable hidden sessions**" switch in the settings card (on by default) takes effect immediately. Off ≠ reset — the hidden list is kept exactly as it was, and re-enabling leaves the same sessions hidden; to really clear it, use "Unhide all" in the card.

### What it is and is not

- Hiding only affects the sidebar: the session stays in the list, and opening, searching, commands, and automatic titles all keep working
- It **never** deletes a session and never touches the session log; the hidden list lives in this plugin's settings document, so it survives a refresh, a restart, and a different browser
- Hiding is implemented at the DOM layer (the platform has no extension slot that can filter list rows by session), so an upstream redesign can break it silently — when clicks stop working or sessions will not hide, first check the console for warnings prefixed with `[dsh-session-title-pattern]`; "Unhide all" in the settings card is the always-available way out

## Configuration

### Settings UI (recommended)

![Settings panel: recompute interval, model selection, timeout, title format, length limit](docs/images/settings-card.png)

Open dsh's **Settings → Plugins** and find this plugin's card (collapsed by default; click its header row to expand):

| Item | Meaning |
| --- | --- |
| **Recompute every N messages** | Default `10`. `0` = compute once when the session is created |
| **Model for title summaries** | One row, two dropdowns: the provider on the left (the first entry is "Follow the conversation model") and that provider's **specific model** on the right. Only the providers you configured and that are available are listed |
| **Timeout** | Raise it when the model is slow (e.g. a free tier queueing) |
| **Title format** / **Title length limit** | What the three parts look like, and how long the title may get |
| **Enable hidden sessions** | Master switch for the hidden-sessions feature; takes effect immediately |

Edits are **staged** and written only when you press "Save"; each field marks whether it was **customized**, can be reset on its own, and "**Discard**" at the bottom drops edits you have not saved.

> The UI copy is **bilingual** and follows dsh's interface language (Settings → General → Language).

### `cordis.patch.yml` in the profile

For scripted or bulk deployments:

```yaml
- id: session-title-pattern
  config:
    retitleEvery: 10
    template: '{MMDD}｜{type}｜{topic}'
    maxBytes: 80
```

| Key | Type | Default | Meaning |
| --- | --- | --- | --- |
| `retitleEvery` | number | `10` | How many human messages between title recomputes; minimum `0`; `0` = compute once when the session is created |
| `provider` | string | empty | Model provider; **must be paired with `model`**; empty follows the session's main model |
| `model` | string | empty | Model id; **must be paired with `provider`** |
| `timeoutMs` | number | `30000` | Timeout for one model call (ms) |
| `maxOutputTokens` | number | `512` | Output token fuse. Not shown in the UI; reach for it here when needed |
| `maxInputBytes` | number | `4096` | Input byte cap for one call |
| `template` | string | `{MMDD}｜{type}｜{topic}` | Title format template |
| `maxBytes` | number | `80` | Total title length cap (UTF-8 bytes), minimum 20 |
| `hiddenEnabled` | boolean | `true` | Master switch for the hidden-sessions feature |
| `hiddenSessions` | string[] | `[]` | Ids of hidden sessions (written by the eye buttons; no need to type them) |
| `revealHiddenAll` | boolean | `false` | Whether hidden sessions are currently revealed |

> The `｜` in the default template is a full-width vertical bar (U+FF5C). A placeholder the plugin does not recognize **stays in the title verbatim** (e.g. `{date}`), so a typo in the template is obvious at a glance.
>
> ⚠️ `maxBytes` must be ≤ `maxTitleBytes` of the `session-title` row (`dsh-base` uses **80** by default); anything beyond is **silently truncated**.
>
> Precedence is `schema default → composition layer (this section) → user layer (settings UI)`: for a field you changed in the UI, editing `cordis.patch.yml` has no effect until you "Reset" it in the UI first.

## When something goes wrong

**dsh fails to start**: this plugin ships browser-side code, so a very old dsh may not be compatible. In the profile's `cordis.patch.yml`, **disable only this plugin** and dsh recovers; upgrade dsh and install again afterwards:

```yaml
- id: session-title-pattern
  disabled: true
```

## Development

```bash
npm install
npm run build        # builds host first, then client
npm run typecheck
```

> **`lib/` is a build artefact committed to git** — dsh loads `main` from `package.json` (`lib/index.mjs`) and never compiles TypeScript at runtime. After changing `src/` you must run `npm run build` again and commit `lib/` with it, or the change will not take effect.

Implementation details (the cost model, why hidden sessions can only work at the DOM layer, and lessons from past iterations) live in [DEVELOPMENT.md](./DEVELOPMENT.md) — written in Chinese.

> This README has two languages: this file and [README.zh.md](README.zh.md). **Changing one means changing the other** — the copy readers actually see is the one that counts.

## License

MIT
