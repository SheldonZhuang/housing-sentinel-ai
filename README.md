<div align="center">

# 🏠 房哨兵 Housing Sentinel — AI 接入中心

**把中国 12 城官方房产成交数据与进攻/防守市场信号，接入你的 AI Agent 和自动化工作流**

Connect official daily housing-transaction data & market signals for 12 major Chinese cities<br>to your AI agents and workflows.

[![官网](https://img.shields.io/badge/%E5%AE%98%E7%BD%91-housingsentinel.cn-1677ff)](https://housingsentinel.cn)
[![MCP](https://img.shields.io/badge/MCP-Streamable%20HTTP-8b5cf6)](#方式-amcp-接入claude--cursor-等推荐)
[![smithery badge](https://smithery.ai/badge/sdzhuang/housing-sentinel-ai)](https://smithery.ai/servers/sdzhuang/housing-sentinel-ai)
[![REST API](https://img.shields.io/badge/REST-OpenAPI%203.0-22c55e)](./openapi.yaml)
[![Claude Skill](https://img.shields.io/badge/Claude-Skill-d97706)](./skills/housing-sentinel/SKILL.md)
[![城市](https://img.shields.io/badge/%E8%A6%86%E7%9B%96%E5%9F%8E%E5%B8%82-12-ef4444)](#覆盖城市与数据)

</div>

---

## 目录

- [这是什么](#这是什么)
- [覆盖城市与数据](#覆盖城市与数据)
- [核心概念：进攻/防守市场信号](#核心概念进攻防守市场信号)
- [快速开始（3 步）](#快速开始3-步)
  - [方式 A：MCP 接入（推荐）](#方式-amcp-接入claude--cursor-等推荐)
  - [方式 B：REST API](#方式-brest-api任意语言--n8n--扣子--dify)
  - [方式 C：Claude Skill](#方式-cclaude-skill方法论--工具一键安装)
- [API 一览](#api-一览)
- [示例与模板](#示例与模板)
- [使用规则与限制](#使用规则与限制)
- [FAQ](#faq)
- [English Summary](#english-summary)

## 这是什么

[房哨兵](https://housingsentinel.cn)是一个房产市场数据监控 SaaS：每日自动抓取各市住建局/房管局**官方发布**的住宅成交与库存数据，计算库存去化周期，输出"防守 / 观察 / 进攻 / 快速进攻"四档市场信号，帮助购房者和投资者把握交易时机。

本仓库是它的 **AI 接入中心**——订阅用户可以通过 MCP、REST API 或 Claude Skill，把这些数据和信号接进 Claude、Cursor、扣子、Dify、n8n 或任何自建 Agent 工作流。

> 📌 本仓库只包含公开接入文档与示例，不包含房哨兵实现代码。

## 覆盖城市与数据

**12 城**：深圳 · 上海 · 北京 · 广州 · 杭州 · 南京 · 苏州 · 无锡 · 成都 · 重庆 · 东莞 · 厦门

| 数据项 | 说明 |
|---|---|
| 一手/二手住宅网签成交 | 每日（成都/重庆一手为周度官方口径，广州二手为月度官方口径） |
| 一手/二手住宅库存 | 每日或按官方发布节奏 |
| 库存去化周期 | 库存 ÷ 月均成交（月），一手/二手分列 |
| 市场阶段信号 | 防守 / 观察 / 进攻 / 快速进攻（阈值随城市返回） |

数据每日更新一次（北京时间 07:00–23:59 各城市不同）。

## 核心概念：进攻/防守市场信号

判断框架以**二手住宅库存去化周期**为核心：

| 去化周期 | 市场阶段 | 含义 |
|---|---|---|
| ≥ 18 月 | 🔴 防守期 | 供过于求，房价下行风险大，观望 |
| 12 – 18 月 | 🟠 观察期 | 止跌企稳中，备好资源不急买 |
| 8 – 12 月 | 🔵 进攻/买入期 | 供需趋衡，可挑核心区笋盘 |
| < 8 月 | 🟢 快速进攻期 | 供不应求，优质盘大概率上涨 |

无去化周期数据的城市降级为月成交量判断（荣枯线/暴涨线，各城市阈值不同，见 `GET /api/v1/cities`）。一手与二手信号矛盾时，以二手为准。

## 快速开始（3 步）

1. **订阅**：在 [housingsentinel.cn](https://housingsentinel.cn) 或微信小程序"房哨兵"订阅任意城市（或全国套餐）
2. **取密钥**：登录后进入 **我的 → 接入 AI Agent**，生成 API Key（`hs_live_...`）
3. **接入**（任选其一）：

### 方式 A：MCP 接入（Claude / Cursor 等，推荐）

零安装——房哨兵 MCP 是远程服务，填 URL + 密钥即用。

**Claude Code 一条命令：**

```bash
claude mcp add --transport http housing-sentinel https://api.housingsentinel.cn/mcp \
  --header "Authorization: Bearer hs_live_你的密钥"
```

**Claude Desktop / Cursor 配置文件：**

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

然后直接问你的 AI：

> **"厦门现在是什么市场阶段？该进攻还是防守？"**
> **"对比一下我订阅的所有城市，哪个最接近买入期？"**
> **"分析深圳近90天二手去化周期趋势"**

MCP 工具：`list_cities` · `get_market_signal` · `get_metrics` · `get_history`

### 方式 B：REST API（任意语言 / n8n / 扣子 / Dify）

```bash
curl https://api.housingsentinel.cn/api/v1/signals \
  -H "Authorization: Bearer hs_live_你的密钥"
```

OpenAPI 3.0 描述文件：[`openapi.yaml`](./openapi.yaml) —— 可直接导入**扣子（Coze）插件、Dify 自定义工具、n8n、Custom GPT Actions**。

### 方式 C：Claude Skill（方法论 + 工具，一键安装）

[`skills/housing-sentinel/SKILL.md`](./skills/housing-sentinel/SKILL.md) 让你的 Claude 掌握完整的"库存去化周期进攻/防守判断框架"——不只是会调 API，还知道**怎么解读**：二手优先原则、趋势重于水平、各城市口径差异、回答规范。

```bash
# Claude Code 安装（复制到项目 skills 目录）
mkdir -p .claude/skills/housing-sentinel
curl -o .claude/skills/housing-sentinel/SKILL.md \
  https://raw.githubusercontent.com/SheldonZhuang/housing-sentinel-ai/main/skills/housing-sentinel/SKILL.md
```

## API 一览

| 端点 | 说明 |
|---|---|
| `GET /api/v1/signals` | **主接口**：全部已订阅城市当前信号快照 |
| `GET /api/v1/cities/{city}/signal` | 单城市当前信号 |
| `GET /api/v1/cities/{city}/metrics?from=&to=` | 逐日指标时间序列（趋势分析，默认近90天） |
| `GET /api/v1/cities/{city}/history?from=&to=` | 原始日度成交/库存数据（单次最多400条） |
| `GET /api/v1/cities` | 已订阅城市列表 + 阈值元数据 |

城市代码用拼音全拼（`xiamen`、`shenzhen`…）。完整字段定义见 [`openapi.yaml`](./openapi.yaml)。

**信号响应示例**（节选）：

```json
{
  "cityCode": "xiamen", "city": "厦门", "dataDate": "2026-07-12",
  "phase": "观察期", "phaseSource": "cycle",
  "secondHand": { "inventoryCycle": 13.4, "inventory": 25495, "avgMonthly": 1901 },
  "firstHand":  { "inventoryCycle": 29.1, "inventory": 21058, "avgMonthly": 723 },
  "thresholds": { "cycleDefense": 18, "cycleWatch": 12, "cycleBuy": 8 }
}
```

## 示例与模板

| 文件 | 场景 |
|---|---|
| [`examples/python-example.py`](./examples/python-example.py) | Python 拉取全城市信号 + 阶段跨越检测（可挂 cron） |
| [`examples/n8n-daily-alert.json`](./examples/n8n-daily-alert.json) | n8n 工作流：每天 8 点巡检，阶段跨越推送企业微信（导入即用） |
| [`examples/claude-agent.md`](./examples/claude-agent.md) | Claude Code 房产投资监控 subagent 定义 + 每日自动巡检 |

## 使用规则与限制

| 项目 | 说明 |
|---|---|
| **数据授权** | **API 数据仅限订阅者本人使用，不得对外提供数据服务** |
| 认证 | `Authorization: Bearer hs_live_...`；密钥可在"接入 AI Agent"页随时重置（旧密钥即刻失效） |
| 限流 | 60 次/分钟、2000 次/天（按账号计，重置密钥不重置限额） |
| 轮询建议 | 数据每日更新一次，**建议轮询间隔 ≥ 1 小时** |
| 权限 | 仅返回订阅中城市；订阅到期返回 403，续费即恢复 |
| 免责 | 信号为基于官方成交数据的市场时机参考，不构成投资建议 |

本仓库的文档与示例代码可自由用于接入房哨兵服务；房哨兵名称、判断框架内容与数据服务的权利由 housingsentinel.cn 保留。

## FAQ

**Q：不订阅能试用吗？**
可以先在 [housingsentinel.cn](https://housingsentinel.cn) 免费查看各城市的当日/本月成交数据，感受数据质量；API 与去化周期信号为订阅功能。

**Q：密钥泄露了怎么办？**
登录后到"我的 → 接入 AI Agent"点"重置密钥"，旧密钥立即失效，把新密钥更新到 Agent 配置即可。

**Q：为什么成都/重庆的一手去化周期是 null？**
这两城的一手官方口径为周度成交 + 当月批准上市套数（并非累计可售库存），计算去化周期会产生误导，故诚实地返回 null；判断请看二手指标与成交量。

**Q：数据来源可靠吗？**
全部来自各市住建局/房管局官方发布渠道，每日自动抓取，多重兜底校验（详见产品内说明）。

**Q：想要的城市不在列表里？**
到官网提交城市需求，订阅需求量是我们开新城的首要依据。

## English Summary

**Housing Sentinel** provides official daily housing-transaction data and offense/defense market signals for 12 major Chinese cities (Shenzhen, Shanghai, Beijing, Guangzhou, Hangzhou, Nanjing, Suzhou, Wuxi, Chengdu, Chongqing, Dongguan, Xiamen). Signals are derived from second-hand inventory absorption cycles: **≥18 months = defense, 12–18 = watch, 8–12 = buy, <8 = strong buy**.

**Getting started:** subscribe at [housingsentinel.cn](https://housingsentinel.cn) → generate an API key under **My → AI Agent** → connect via the remote MCP server (`https://api.housingsentinel.cn/mcp`, Bearer auth) or REST (`/api/v1/signals`, spec in [`openapi.yaml`](./openapi.yaml)). A ready-made [Claude Skill](./skills/housing-sentinel/SKILL.md) teaches your agent both the API and the decision framework.

Data updates daily; rate limits 60 req/min & 2,000 req/day; data is licensed for the subscriber's own use only — redistribution as a data service is prohibited.

---

<div align="center">

**[开始接入 →](https://housingsentinel.cn)** ｜ 问题反馈请提 [Issue](https://github.com/SheldonZhuang/housing-sentinel-ai/issues)

*让 AI 帮你盯住每一个买入时机。*

</div>
