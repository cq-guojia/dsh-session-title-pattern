# @cq-guojia/dsh-session-title-pattern

确定性会话标题生成器 for DeepSeek Harness。

## 标题格式

```
YYMMDD|类型|主题
```

示例：`260912|接口|登录接口鉴权`

## 工作原理

1. 取会话中**第一条人类消息**
2. 提取 **UTC 日期** 作为 `YYMMDD` 前缀
3. **分类**消息类型为标签：
   - `指令` — 命令/指令类
   - `鉴权` — 登录/认证相关
   - `接口` — API/端点/路由相关
   - `查询` — 搜索/读取/询问类（什么/如何/为什么等）
   - `创建` — 新建/生成/写入类
   - `更新` — 修改/调整/变更类
   - `删除` — 删除/移除类
   - `测试` — 测试/验证类
   - `配置` — 配置/设置类
   - `修复` — Bug/错误/问题类
   - `文档` — 文档/说明类
   - `其他` — 默认分类
4. 提取消息中的**主题短语**作为标题内容
5. 如需截断则限制在 120 UTF-8 字节内

## 安装

```bash
# 从 GitHub 安装
dsh plugin --profile web add git+https://github.com/cq-guojia/dsh-session-title-pattern.git

# 或从本地路径安装
dsh plugin --profile web add /path/to/dsh-session-title-pattern
```

## 配置

安装后，在 `~/.dsh/profiles/web/cordis.patch.yml` 中添加：

```yaml
# 禁用默认的 LLM 标题提供者
- id: session-title-llm
  disabled: true

# 启用我们的 pattern 提供者
- id: dsh-session-title-pattern
  name: '@cq-guojia/dsh-session-title-pattern'
  apply: host
  config: {}
```

### 配置项

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `separator` | `|` | 标题分隔符 |
| `maxBytes` | `120` | 标题最大字节数 |

## 示例

| 用户消息 | 生成的标题 |
|---------|-----------|
| "你怎么用 TypeScript 写一个 HTTP 服务器？" | `260912|查询|你怎么用 TypeScript` |
| "帮我创建一个用户登录接口" | `260912|创建|用户登录接口` |
| "/test run all tests" | `260912|指令|run all tests` |
| "修复登录页面的 bug" | `260912|修复|登录页面的 bug` |

## 开发

```bash
# 安装依赖
pnpm install

# 编译
pnpm run build

# 本地测试
dsh plugin --profile web add /path/to/plugin
```

## 许可证

MIT
