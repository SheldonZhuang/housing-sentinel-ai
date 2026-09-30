# 接入配方 / Integration recipes

每个文件都可以直接复制使用。API Key（`hs_live_...`）在 [housingsentinel.cn/agent](https://housingsentinel.cn/agent) 生成，新用户 3 天全 12 城免费试用。中国大陆网络或国内平台（扣子、魔搭等）请把域名换成代理 `housingpi-proxy-anirmyfaea.cn-shanghai.fcapp.run`。

Each file is copy-paste ready. Get an API key (`hs_live_...`) at [housingsentinel.cn/agent](https://housingsentinel.cn/agent); new accounts get a free 3-day all-city trial.

| 配方 Recipe | 说明 | Description |
|---|---|---|
| [claude-code-daily.md](claude-code-daily.md) | Claude Code 添加 MCP，用 `/loop` 或系统定时任务每天 08:00 跑 `daily_brief` | Claude Code MCP setup + daily 08:00 brief via `/loop` or cron / Task Scheduler |
| [claude-desktop-cursor.md](claude-desktop-cursor.md) | Claude Desktop / Cursor 配置：远程 HTTP 与 npm stdio 包两种方式 | Claude Desktop / Cursor config: remote HTTP or the npm stdio package |
| [n8n-signals-since.json](n8n-signals-since.json) | n8n 每小时轮询，带 since + If-None-Match，仅在有变化时通知 | n8n hourly poll with since + If-None-Match, notify only on change |
| [coze-workflow.md](coze-workflow.md) | 扣子 MCP 插件与"每日简报"工作流（使用国内代理地址） | Coze MCP plugin + daily brief workflow (mainland proxy endpoint) |
| [dify.md](dify.md) | Dify 以 OpenAPI 自定义工具导入 `openapi.yaml` | Dify: import `openapi.yaml` as a custom tool |
| [openai-agents-sdk.py](openai-agents-sdk.py) | OpenAI Agents SDK 通过 `MCPServerStreamableHttp` 连接 | OpenAI Agents SDK via `MCPServerStreamableHttp` |
| [webhook-receiver-node.js](webhook-receiver-node.js) | Node.js Webhook 接收与 HMAC 验签（零依赖） | Node.js webhook receiver with HMAC verification (no deps) |
| [webhook-receiver-python.py](webhook-receiver-python.py) | Python Webhook 接收与 HMAC 验签（仅标准库） | Python webhook receiver with HMAC verification (stdlib only) |
| [polling-etag.sh](polling-etag.sh) | curl + jq 轮询，保存 ETag 与 nextSince | curl + jq polling that stores ETag and nextSince |

## 怎么选 / Which one

- **只要每天看一眼**：`claude-code-daily.md` 或扣子/Dify 定时工作流。
- **数据一变就处理**：Webhook（试用/点数包/订阅可用）> `since` + ETag 轮询（所有层级可用，免费层仅深圳）。
- **在自己的 Agent 里用**：`openai-agents-sdk.py`、`claude-desktop-cursor.md`。

Webhook 签名：`X-HS-Signature: t=<unix秒>,v1=<hex>`，`v1 = HMAC-SHA256(secret, "<t>.<原始请求体>")`。用原始字节验签、常数时间比较、拒绝 5 分钟以外的时间戳，并在 5 秒内返回 2xx。

Data is from each city's official housing authority, updated once a day. Not investment advice. 数据非投资建议。
