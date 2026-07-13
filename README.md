# 房哨兵 Housing Sentinel — AI 接入中心

> 把中国 12 个主要城市的官方房产成交数据与进攻/防守市场信号，接入你的 AI Agent 和自动化工作流。
>
> Connect official daily housing-transaction data & market signals for 12 major Chinese cities to your AI agents and workflows.

**产品**：[housingsentinel.cn](https://housingsentinel.cn) ｜ **API 基址**：`https://api.housingsentinel.cn`

覆盖城市：深圳、上海、北京、广州、杭州、南京、苏州、无锡、成都、重庆、东莞、厦门。
数据来源：各市住建局/房管局官方发布，**每日自动抓取**（部分城市为周度/月度官方口径）。

---

## 快速开始（3 步）

1. **订阅**：在 [housingsentinel.cn](https://housingsentinel.cn) 或微信小程序"房哨兵"订阅任意城市
2. **取密钥**：登录后进入 **我的 → 接入 AI Agent**，生成 API Key（`hs_live_...`）
3. **接入**（任选其一）：

### 方式 A：MCP（Claude / Cursor 等，推荐）

```bash
claude mcp add --transport http housing-sentinel https://api.housingsentinel.cn/mcp \
  --header "Authorization: Bearer hs_live_你的密钥"
```

或加入 MCP 配置文件（Claude Desktop `claude_desktop_config.json`）：

```json
{
  "mcpServers": {
    "housing-sentinel": {
      "type": "http",
      "url": "https://api.housingsentinel.cn/mcp",
      "headers": { "Authorization": "Bearer hs_live_你的密钥" }
    }
  }
}
```

然后直接问你的 AI：**"厦门现在是什么市场阶段？该进攻还是防守？"**

### 方式 B：REST API（任意语言 / n8n / 扣子 / Dify）

```bash
curl https://api.housingsentinel.cn/api/v1/signals \
  -H "Authorization: Bearer hs_live_你的密钥"
```

OpenAPI 描述文件见 [`openapi.yaml`](./openapi.yaml)，可直接导入扣子（Coze）、Dify、n8n、Custom GPT。

### 方式 C：Claude Skill（方法论 + 工具，一键安装）

见 [`skills/housing-sentinel/SKILL.md`](./skills/housing-sentinel/SKILL.md)——让你的 Claude 掌握"库存去化周期进攻/防守判断框架"，并自动调用房哨兵数据回答购房决策问题。

---

## 核心概念：进攻/防守市场信号

房哨兵的判断框架以**二手住宅库存去化周期**（库存 ÷ 月均成交）为核心：

| 去化周期 | 市场阶段 | 含义 |
|---|---|---|
| ≥ 18 月 | 🔴 防守期 | 供过于求，房价下行风险大，观望 |
| 12 – 18 月 | 🟠 观察期 | 止跌企稳中，备好资源不急买 |
| 8 – 12 月 | 🔵 进攻/买入期 | 供需趋衡，可挑核心区笋盘 |
| < 8 月 | 🟢 快速进攻期 | 供不应求，优质盘大概率上涨 |

无去化周期数据的城市降级为月成交量判断（荣枯线/暴涨线，各城市阈值不同，见 `GET /api/v1/cities`）。

## API 一览

| 端点 | 说明 |
|---|---|
| `GET /api/v1/signals` | **主接口**：全部已订阅城市当前信号快照 |
| `GET /api/v1/cities/{city}/signal` | 单城市当前信号 |
| `GET /api/v1/cities/{city}/metrics?from=&to=` | 逐日指标时间序列（趋势分析） |
| `GET /api/v1/cities/{city}/history?from=&to=` | 原始日度成交/库存数据 |
| `GET /api/v1/cities` | 已订阅城市列表 + 阈值元数据 |

MCP 工具：`list_cities` / `get_market_signal` / `get_metrics` / `get_history`。

## 使用规则与限制

- **API 数据仅限订阅者本人使用，不得对外提供数据服务**
- 认证：`Authorization: Bearer hs_live_...`；密钥可在"接入 AI Agent"页随时重置
- 限流：60 次/分钟、2000 次/天（按账号）
- 数据每日更新一次（北京时间 07:00–23:59 各城市不同），**建议轮询间隔 ≥ 1 小时**
- 仅返回订阅中城市的数据；订阅到期返回 403，续费即恢复

## 示例

- [`examples/python-example.py`](./examples/python-example.py) — Python 拉取信号 + 阶段跨越检测
- [`examples/n8n-daily-alert.json`](./examples/n8n-daily-alert.json) — n8n 每日信号监控工作流模板
- [`examples/claude-agent.md`](./examples/claude-agent.md) — Claude Code 房产投资监控 subagent 定义

## English Summary

Housing Sentinel provides official daily housing-transaction data and offense/defense market signals (based on inventory absorption cycles) for 12 major Chinese cities, via REST API and a remote MCP server. Subscribe at [housingsentinel.cn](https://housingsentinel.cn), generate an API key under **My → AI Agent**, then connect via MCP (`https://api.housingsentinel.cn/mcp`, Bearer auth) or REST (`/api/v1/signals`). Data updates daily; rate limits 60/min & 2000/day; data is licensed for the subscriber's own use only.

---

*本仓库只包含公开接入文档与示例，不包含房哨兵实现代码。问题反馈请提 Issue。*
