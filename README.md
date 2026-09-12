# @deepseek-ai/dsh-session-title-pattern

Deterministic session-title provider for DeepSeek Harness.

## Title format

```
YYMMDD|类型|主题
```

Example: `260912|接口|登录接口鉴权`

## How it works

1. Takes the **first human message** in the session.
2. Extracts the **date** (UTC) as a 6-digit `YYMMDD` prefix.
3. **Classifies** the message into a type tag by keyword matching:
   - `鉴权` — auth/login/oauth keywords
   - `接口` — api/endpoint/route keywords
   - `查询` — search/fetch/read keywords
   - `创建` — create/insert/add keywords
   - `更新` — update/edit/patch keywords
   - `删除` — delete/remove keywords
   - `测试` — test keywords
   - `配置` — config/setup keywords
   - `修复` — bug/fix/exc keywords
   - `文档` — doc/readme keywords
   - `其他` — fallback
4. Uses the first meaningful phrase from the message as the **topic**.
5. Truncates to 120 UTF-8 bytes if needed.

## Installation

```bash
dsh plugin --profile web add /path/to/dsh-session-title-pattern
```

## Configuration

No runtime configuration is required. The provider is deterministic.
