# Claude Desktop / Cursor 配置 / Configuration

两种方式任选：**远程 HTTP**（客户端原生支持时首选，不需要本地进程）或 **npm stdio 包**（客户端只支持 stdio 时使用）。

API Key 在 [housingsentinel.cn/agent](https://housingsentinel.cn/agent) 生成（`hs_live_...`）。

## 方式 1：远程 HTTP / Remote Streamable HTTP

**Cursor**（`~/.cursor/mcp.json` 或项目内 `.cursor/mcp.json`）：

```json
{
  "mcpServers": {
    "housing-sentinel": {
      "url": "https://api.housingsentinel.cn/mcp",
      "headers": { "Authorization": "Bearer hs_live_xxx" }
    }
  }
}
```

**Claude Desktop**：在 设置 → Connectors → Add custom connector 填 `https://api.housingsentinel.cn/mcp`。自定义连接器界面不一定能填请求头，这种情况用下面的方式 2，或用 `mcp-remote`：

```json
{
  "mcpServers": {
    "housing-sentinel": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://api.housingsentinel.cn/mcp", "--header", "Authorization:Bearer ${HS_KEY}"],
      "env": { "HS_KEY": "hs_live_xxx" }
    }
  }
}
```

## 方式 2：npm stdio 包 / npm stdio package

[`housing-sentinel-mcp`](../packages/housing-sentinel-mcp) 是一个 stdio → Streamable HTTP 转发器。Claude Desktop 编辑 `claude_desktop_config.json`（macOS `~/Library/Application Support/Claude/`，Windows `%APPDATA%\Claude\`），Cursor 编辑 `~/.cursor/mcp.json`：

```json
{
  "mcpServers": {
    "housing-sentinel": {
      "command": "npx",
      "args": ["-y", "housing-sentinel-mcp"],
      "env": {
        "HOUSING_SENTINEL_API_KEY": "hs_live_xxx"
      }
    }
  }
}
```

- 中国大陆网络：在 `env` 加 `"HOUSING_SENTINEL_URL": "https://housingpi-proxy-anirmyfaea.cn-shanghai.fcapp.run/mcp"`。
- Windows 找不到 `npx` 时：`"command": "cmd", "args": ["/c", "npx", "-y", "housing-sentinel-mcp"]`。
- 需要 Node.js ≥ 18。

保存后重启客户端，可以试试这样问：

> 用房哨兵看一下深圳和上海现在是进攻期还是防守期？

Prompts（`daily_brief`、`compare_cities`）在 Claude Desktop 的"+"→ 附加菜单里；Resources（`housing://thresholds` 各城市判档阈值）可作为上下文附加。
