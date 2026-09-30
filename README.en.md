<div align="center">

# 🏠 Housing Sentinel (房哨兵) — AI Integration Hub

**Bring official daily housing-transaction data and offense/defense market signals for 12 major Chinese cities into your AI agents and automation workflows**

[![官网](https://img.shields.io/badge/%E5%AE%98%E7%BD%91-housingsentinel.cn-1677ff)](https://housingsentinel.cn)
[![MCP](https://img.shields.io/badge/MCP-Streamable%20HTTP-8b5cf6)](#option-a-mcp-claude--cursor-recommended)
[![smithery badge](https://smithery.ai/badge/sdzhuang/housing-sentinel-ai)](https://smithery.ai/servers/sdzhuang/housing-sentinel-ai)
[![REST API](https://img.shields.io/badge/REST-OpenAPI%203.0-22c55e)](./openapi.yaml)
[![Claude Skill](https://img.shields.io/badge/Claude-Skill-d97706)](./skills/housing-sentinel/SKILL.md)
[![城市](https://img.shields.io/badge/%E8%A6%86%E7%9B%96%E5%9F%8E%E5%B8%82-12-ef4444)](#cities--data-coverage)

[中文](./README.md) | **English**

</div>

---

## Contents

- [What Is This](#what-is-this)
- [Cities & Data Coverage](#cities--data-coverage)
- [Core Concept: Offense/Defense Market Signals](#core-concept-offensedefense-market-signals)
- [Quick Start (3 Steps)](#quick-start-3-steps)
  - [Option A: MCP (Claude / Cursor, recommended)](#option-a-mcp-claude--cursor-recommended)
  - [Option B: REST API (any language / n8n / Coze / Dify)](#option-b-rest-api-any-language--n8n--coze--dify)
  - [Option C: Claude Skill (methodology + tools, one-command install)](#option-c-claude-skill-methodology--tools-one-command-install)
- [API Overview](#api-overview)
- [Change-Driven Access: since / ETag & Webhooks](#change-driven-access-since--etag--webhooks)
- [MCP Prompts & Resources](#mcp-prompts--resources)
- [npm stdio Package](#npm-stdio-package)
- [Recipes](#recipes)
- [Examples & Templates](#examples--templates)
- [Usage Rules & Limits](#usage-rules--limits)
- [FAQ](#faq)

## What Is This

[Housing Sentinel](https://housingsentinel.cn) is a housing-market data monitoring SaaS. Every day it automatically collects residential transaction and inventory figures **officially published** by each city's housing authority, computes inventory absorption cycles, and distills them into a four-phase market signal — **Defense / Watch / Buy / Strong Buy** — to help home buyers and investors time the market.

This repository is its **AI Integration Hub**: connect the data and signals to Claude, Cursor, Coze, Dify, n8n, or any custom agent workflow via MCP, REST API, or a Claude Skill. **Free trial for new users**: log in, generate a key, and query all 12 cities for 3 days starting from your first call; afterwards Shenzhen’s current signal stays free forever. A credit pack (¥39 / 1,000 calls / 30 days) or a subscription unlocks everything. The public no-key endpoint `GET /api/v1/cities/{city}/card` returns any city’s latest transactions and market phase.

> 📌 This repository contains public integration docs and examples only — no Housing Sentinel implementation code.

## Cities & Data Coverage

**12 cities**: Shenzhen · Shanghai · Beijing · Guangzhou · Hangzhou · Nanjing · Suzhou · Wuxi · Chengdu · Chongqing · Dongguan · Xiamen

| Data | Notes |
|---|---|
| New-home & second-hand residential transactions (registered) | Daily (Chengdu/Chongqing new-home data is weekly per official releases; Guangzhou second-hand is monthly) |
| New-home & second-hand residential inventory | Daily, or per each city's official publication cadence |
| Inventory absorption cycle | Inventory ÷ average monthly transactions (in months), reported separately for new-home and second-hand |
| Market phase signal | Defense / Watch / Buy / Strong Buy (city-specific thresholds returned with each response) |

Data refreshes once a day (between 07:00 and 23:59 Beijing time, varying by city).

## Core Concept: Offense/Defense Market Signals

The decision framework is anchored on the **second-hand residential inventory absorption cycle**:

| Absorption cycle | Market phase | Meaning |
|---|---|---|
| ≥ 18 months | 🔴 Defense | Oversupply, high downside risk for prices — stay on the sidelines |
| 12 – 18 months | 🟠 Watch | Bottoming out — get your resources ready, but no rush to buy |
| 8 – 12 months | 🔵 Buy / Offense | Supply and demand converging — hunt for bargains in core districts |
| < 8 months | 🟢 Strong Buy | Undersupply — quality listings are likely to appreciate |

Cities without absorption-cycle data fall back to a monthly-volume test (bull line / boom line, thresholds vary by city — see `GET /api/v1/cities`). When new-home and second-hand signals conflict, the second-hand signal prevails.

## Quick Start (3 Steps)

1. **Log in**: at [housingsentinel.cn](https://housingsentinel.cn) or via the WeChat mini program "房哨兵" (subscribe to a single city at ¥299/year (approx. $42) or the nationwide plan at ¥1,888/year (approx. $265) to unlock all 12 cities; without a subscription you still get a free 3-day all-city trial, then Shenzhen’s current signal for free forever; credit pack ¥39 / 1,000 calls / 30 days)
2. **Get a key**: after logging in, go to **My → AI Agent**（我的→接入AI Agent） and generate an API key (`hs_live_...`)
3. **Connect** (pick any option below):

### Option A: MCP (Claude / Cursor, recommended)

Zero install — the Housing Sentinel MCP server is remote; just supply the URL and your key.

**Claude Code, one command:**

```bash
claude mcp add --transport http housing-sentinel https://api.housingsentinel.cn/mcp \
  --header "Authorization: Bearer hs_live_你的密钥"
```

**Claude Desktop / Cursor config file:**

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

Then just ask your AI:

> **"What market phase is Xiamen in right now — offense or defense?"**
> **"Compare all my subscribed cities. Which one is closest to a buy window?"**
> **"Analyze the trend of Shenzhen's second-hand absorption cycle over the past 90 days."**

MCP tools: `list_cities` · `get_market_signal` · `get_metrics` · `get_history`

### Option B: REST API (any language / n8n / Coze / Dify)

```bash
curl https://api.housingsentinel.cn/api/v1/signals \
  -H "Authorization: Bearer hs_live_你的密钥"
```

OpenAPI 3.0 spec: [`openapi.yaml`](./openapi.yaml) — import it directly into **Coze plugins, Dify custom tools, n8n, or Custom GPT Actions**.

### Option C: Claude Skill (methodology + tools, one-command install)

[`skills/housing-sentinel/SKILL.md`](./skills/housing-sentinel/SKILL.md) teaches your Claude the full "inventory absorption cycle offense/defense framework" — not just how to call the API, but **how to interpret the results**: the second-hand-first principle, trend over level, per-city data caveats, and answer conventions.

```bash
# Claude Code 安装（复制到项目 skills 目录）
mkdir -p .claude/skills/housing-sentinel
curl -o .claude/skills/housing-sentinel/SKILL.md \
  https://raw.githubusercontent.com/SheldonZhuang/housing-sentinel-ai/main/skills/housing-sentinel/SKILL.md
```

## API Overview

| Endpoint | Description |
|---|---|
| `GET /api/v1/signals` | **Primary endpoint**: current signal snapshot for all subscribed cities |
| `GET /api/v1/cities/{city}/signal` | Current signal for a single city |
| `GET /api/v1/cities/{city}/metrics?from=&to=` | Daily indicator time series (for trend analysis; defaults to the last 90 days) |
| `GET /api/v1/cities/{city}/history?from=&to=` | Raw daily transaction/inventory data (up to 400 records per request) |
| `GET /api/v1/cities` | List of subscribed cities + threshold metadata |
| `POST/GET /api/v1/webhooks`, `DELETE /api/v1/webhooks/{id}`, `POST /api/v1/webhooks/{id}/test` | Webhook management (trial / credits / subscription / institution) |

City codes are full pinyin (`xiamen`, `shenzhen`, …). Full field definitions are in [`openapi.yaml`](./openapi.yaml).

**Sample signal response** (excerpt):

```json
{
  "cityCode": "xiamen", "city": "厦门", "dataDate": "2026-07-12",
  "phase": "观察期", "phaseSource": "cycle",
  "secondHand": { "inventoryCycle": 13.4, "inventory": 25495, "avgMonthly": 1901 },
  "firstHand":  { "inventoryCycle": 29.1, "inventory": 21058, "avgMonthly": 723 },
  "thresholds": { "cycleDefense": 18, "cycleWatch": 12, "cycleBuy": 8 }
}
```

> Note: `phase` values are returned in Chinese — e.g. `防守期` (Defense), `观察期` (Watch), `进攻/买入期` (Buy), `快速进攻/买入期` (Strong Buy). Use `phaseSource` and the numeric fields for language-independent logic.

## Change-Driven Access: since / ETag & Webhooks

Data updates once a day, so there is no need to re-parse the full snapshot every time.

**Polling** (all tiers): call `GET /api/v1/signals` once, then pass the previous response's `nextSince`:

```bash
curl "https://api.housingsentinel.cn/api/v1/signals?since=2026-09-30T00:00:00.000Z" \
  -H "Authorization: Bearer hs_live_xxx" -H 'If-None-Match: W/"previous-etag"'
```

- With `since`, only cities whose data changed after that time are returned. The response adds `since`, `changedSince` (array of changed city codes) and `nextSince`, and every city object carries `updatedAt`. An invalid since returns 400 `BAD_SINCE`.
- `/signals` and `/cities/{city}/signal` return a weak `ETag`. Send `If-None-Match` to get **304** when nothing changed.
- Full scripts: [recipes/polling-etag.sh](./recipes/polling-etag.sh), [recipes/n8n-signals-since.json](./recipes/n8n-signals-since.json).

**Webhooks** (trial / credits / subscription / institution; free tier and demo keys get 403):

```bash
curl -X POST https://api.housingsentinel.cn/api/v1/webhooks \
  -H "Authorization: Bearer hs_live_xxx" -H "Content-Type: application/json" \
  -d '{"url":"https://your.domain/hs-webhook","cities":["shenzhen"],"events":["data.updated","phase.changed"]}'
# → 201; the secret (whsec_...) is returned only once
```

- Events: `data.updated` (new data for a city) and `phase.changed` (market phase changed; adds `previousPhase`/`phase`). The server checks every 5 minutes.
- Body `{ id, event, createdAt, cityCode, signal }`; `signal` has the same shape as the `/cities/{city}/signal` response.
- Headers `X-HS-Event`, `X-HS-Delivery`, `X-HS-Signature: t=<unix seconds>,v1=<hex>` with **`v1 = HMAC-SHA256(secret, "<t>.<raw body>")`**.
- Rules: https only (private/loopback addresses rejected); reply 2xx within 5 s, redirects are not followed; 10 consecutive failures disable the hook (a successful `POST /webhooks/{id}/test` re-enables it); max 5 per account; pushes stop when the subscription/trial ends.
- Verification samples: [Node.js](./recipes/webhook-receiver-node.js) / [Python](./recipes/webhook-receiver-python.py).

## MCP Prompts & Resources

MCP server 1.3.0 also exposes the following alongside its 4 tools:

| Type | Name | Description |
|---|---|---|
| Prompt | `daily_brief` | Daily housing brief; optional `cities`, comma-separated |
| Prompt | `compare_cities` | Compare cities; argument `cities` |
| Resource | `housing://llms.txt` | Integration notes (same as [llms.txt](./llms.txt)) |
| Resource | `housing://thresholds` | Per-city phase thresholds (JSON) |

## npm stdio Package

Clients that only support stdio servers can use [`housing-sentinel-mcp`](./packages/housing-sentinel-mcp). It relays stdio messages unchanged to the remote MCP server:

```json
{ "mcpServers": { "housing-sentinel": { "command": "npx", "args": ["-y", "housing-sentinel-mcp"], "env": { "HOUSING_SENTINEL_API_KEY": "hs_live_xxx" } } } }
```

## Recipes

Every file in [`recipes/`](./recipes) is copy-paste ready: Claude Code daily 08:00 brief, Claude Desktop/Cursor config, n8n since+ETag polling, Coze workflow, Dify OpenAPI import, OpenAI Agents SDK, webhook verification (Node/Python), and a curl polling script.

## Examples & Templates

| File | Scenario |
|---|---|
| [`examples/python-example.py`](./examples/python-example.py) | Python: pull signals for all cities + detect phase crossings (cron-friendly) |
| [`examples/n8n-daily-alert.json`](./examples/n8n-daily-alert.json) | n8n workflow: daily 8 a.m. sweep, push phase crossings to WeCom (import and run) |
| [`examples/claude-agent.md`](./examples/claude-agent.md) | Claude Code property-investment monitoring subagent definition + daily automated sweep |

## Usage Rules & Limits

| Item | Details |
|---|---|
| **Data license** | **API data is for the subscriber's / trial user's own use only; providing it to third parties as a data service is prohibited** |
| Authentication | `Authorization: Bearer hs_live_...`; reset your key anytime on the AI Agent page（接入 AI Agent） — the old key is invalidated immediately |
| **Free trial** | Accounts without a subscription can query all 12 cities for **3 days** from the first call; history limited to the last 30 days |
| **Free tier** | After the trial, forever: Shenzhen’s current signal (`/cities`, `/signals`, `/cities/shenzhen/signal`; MCP `list_cities` / `get_market_signal`), 10 req/min & 50 req/day; `metrics` / `history` return 403 (`FREE_TIER_LIMIT`) |
| **Credit pack** | **¥39 for 1,000 calls, valid 30 days**, all 12 cities, history limited to the last 90 days; falls back to the free tier when used up or expired; no referral rewards |
| **Public endpoint** | `GET /api/v1/cities/{city}/card` needs no key: latest daily transactions, month-to-date totals, second-hand absorption cycle and market phase (no inventory values), 60 s cache |
| **Pricing** | **¥299/year** per city, **¥1,888/year** for all 12 cities (full history, 60 req/min, 2,000 req/day); subscribe or buy credits at [housingsentinel.cn/agent](https://housingsentinel.cn/agent) (My → AI Agent after login); access is granted immediately; 403/429 responses include `subscribeUrl` and `pricing` |
| **Institutional plan** | Higher limits (300 req/min, 20,000 req/day), all cities, multiple seats, custom contract; contact WeChat `SheldonZhuang` |
| Rate limits | Subscribers: 60 req/min, 2,000 req/day; credit pack: 60 req/min; trial: 10 req/min, 100 req/day; free tier: 10 req/min, 50 req/day (per account — resetting the key does not reset quotas) |
| Polling | Data updates once per day; **recommended polling interval ≥ 1 hour** |
| Access scope | Subscribers see their subscribed cities; trial users see all 12 cities; the free tier keeps Shenzhen’s current signal; credit packs cover all 12 cities; expired subscriptions fall back to the free tier — subscribing or buying credits restores access |
| Disclaimer | Signals are market-timing references derived from official transaction data and do not constitute investment advice |

The docs and example code in this repository are free to use for integrating with the Housing Sentinel service; rights to the Housing Sentinel name, the decision framework, and the data service are reserved by housingsentinel.cn.

## FAQ

**Q: Can I try it without subscribing?**
Yes. Log in and generate an API key — you can query all 12 cities free for **3 days from your first call** (signals, metric series, and the last 30 days of raw data, at 10 req/min / 100 req/day), and Shenzhen’s current signal stays free forever afterwards. Without logging in you can call the public endpoint `GET /api/v1/cities/{city}/card`. Need more? Credit pack ¥39 / 1,000 calls / 30 days (all cities, 90-day history). You can also view each city's current-day/current-month figures free at [housingsentinel.cn](https://housingsentinel.cn). Subscribing to any city (¥299/year per city, approx. $42; nationwide plan ¥1,888/year, approx. $265) unlocks that city's full data and higher limits.

**Q: What if my key leaks?**
Log in, go to **My → AI Agent**（我的→接入AI Agent）, and click "Reset key". The old key is invalidated instantly — just update your agent config with the new one.

**Q: Why is the new-home absorption cycle null for Chengdu/Chongqing?**
For these two cities the official new-home figures are weekly transactions plus units *approved for listing that month* (not a cumulative for-sale inventory). Computing an absorption cycle from that would be misleading, so we honestly return null; rely on the second-hand metrics and transaction volumes instead.

**Q: Is the data reliable?**
All data comes from each city's housing authority's official publication channels, collected automatically every day with multiple fallback and validation layers (details in the product).

**Q: My city isn't on the list?**
Submit a city request on the website — subscription demand is the top factor in deciding which city we launch next.

---

<div align="center">

**[Get started →](https://housingsentinel.cn)** ｜ Found an issue? Open an [Issue](https://github.com/SheldonZhuang/housing-sentinel-ai/issues)

*Let AI watch every buy window for you.*

</div>
