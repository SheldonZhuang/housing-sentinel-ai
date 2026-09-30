# housing-sentinel-mcp

stdio MCP bridge for **Housing Sentinel（房哨兵）** — official daily housing-transaction data and offense/defense market signals for 12 major Chinese cities.

The process has no state of its own. It relays JSON-RPC messages between a local stdio MCP client and the remote Streamable HTTP server `https://api.housingsentinel.cn/mcp`. Use it with clients that only support stdio servers. Clients that support remote HTTP servers can connect directly (see the [repo README](https://github.com/SheldonZhuang/housing-sentinel-ai)).

本包是房哨兵 MCP 的 stdio 转发器：本地 MCP 客户端通过 stdio 通信，本进程把消息原样转发到远程 `https://api.housingsentinel.cn/mcp`。客户端支持远程 HTTP 时可直接连远程地址，不需要本包。

## Usage 用法

```bash
HOUSING_SENTINEL_API_KEY=hs_live_xxx npx -y housing-sentinel-mcp
```

| Env | Required | Description |
|---|---|---|
| `HOUSING_SENTINEL_API_KEY` | yes | `hs_live_...`, generate at [housingsentinel.cn/agent](https://housingsentinel.cn/agent) (My → AI Agent). New accounts get a free 3-day all-city trial. 登录后「我的→接入AI Agent」生成 |
| `HOUSING_SENTINEL_URL` | no | Override the endpoint. Default `https://api.housingsentinel.cn/mcp`. From mainland China you can use `https://housingpi-proxy-anirmyfaea.cn-shanghai.fcapp.run/mcp` 中国大陆网络可用此代理 |

If the key is missing, the process exits with code 1. If the key is invalid, each request gets a JSON-RPC error with code `-32001` whose message comes from the server.

## Claude Desktop / Cursor

`claude_desktop_config.json` (or Cursor `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "housing-sentinel": {
      "command": "npx",
      "args": ["-y", "housing-sentinel-mcp"],
      "env": { "HOUSING_SENTINEL_API_KEY": "hs_live_xxx" }
    }
  }
}
```

On Windows, if `npx` can't be found, use `"command": "cmd", "args": ["/c", "npx", "-y", "housing-sentinel-mcp"]`.

## What you get

- Tools: `list_cities`, `get_market_signal`, `get_metrics`, `get_history` (all read-only)
- Prompts: `daily_brief` (optional `cities`, comma-separated), `compare_cities` (`cities`)
- Resources: `housing://llms.txt`, `housing://thresholds`

Data comes from each city's official housing authority and updates once a day. It is not investment advice.

## License

MIT
