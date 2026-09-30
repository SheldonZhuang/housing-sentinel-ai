# Claude Code：每天 08:00 自动出房市简报 / Daily brief in Claude Code

## 1. 添加 MCP 服务器 / Add the MCP server

```bash
claude mcp add --transport http housing-sentinel https://api.housingsentinel.cn/mcp \
  --header "Authorization: Bearer hs_live_xxx"
```

- API Key 在 [housingsentinel.cn/agent](https://housingsentinel.cn/agent)（我的 → 接入AI Agent）生成，新用户 3 天全 12 城免费试用。
- 中国大陆网络连不上时，把地址换成国内代理 `https://housingpi-proxy-anirmyfaea.cn-shanghai.fcapp.run/mcp`。
- 加 `--scope user` 可让所有项目共用这个服务器。

验证：在 Claude Code 里输入 `/mcp`，应看到 `housing-sentinel` 已连接，工具 4 个（list_cities / get_market_signal / get_metrics / get_history）。

## 2. 手动调用 daily_brief 提示词 / Run the prompt manually

MCP Prompts 在 Claude Code 里显示为斜杠命令：

```text
/mcp__housing-sentinel__daily_brief shenzhen,shanghai,hangzhou
```

参数 `cities` 可省略（省略 = 当前 Key 可访问的全部城市）。对比城市用：

```text
/mcp__housing-sentinel__compare_cities shenzhen,guangzhou
```

## 3. 会话内循环 / In-session loop with `/loop`

Claude Code 开着的时候，可以让它按间隔重复执行：

```text
/loop 24h /mcp__housing-sentinel__daily_brief shenzhen,shanghai
```

`/loop` 只在当前会话存活期间有效，关掉终端就停了。要每天固定 08:00 执行，用下面的系统定时任务。

## 4. 系统定时任务（每天 08:00）/ OS scheduler, every day at 08:00

用非交互模式 `claude -p` 执行，并只放行房哨兵的只读工具：

```bash
claude -p "用 housing-sentinel 的 get_market_signal 查询深圳、上海、杭州的当前市场信号，按 daily_brief 的格式输出：每城一行（阶段、二手去化周期、数据日期），最后一句总体判断。注明数据非投资建议。" \
  --allowedTools "mcp__housing-sentinel__*" \
  > ~/housing-brief-$(date +%F).md
```

**macOS / Linux（crontab -e）**

```cron
0 8 * * * cd ~ && /usr/local/bin/claude -p "..." --allowedTools "mcp__housing-sentinel__*" > ~/housing-brief-$(date +\%F).md 2>&1
```

**Windows（任务计划程序，PowerShell 管理员）**

```powershell
$action  = New-ScheduledTaskAction -Execute "powershell.exe" -Argument '-NoProfile -Command "claude -p ''用 housing-sentinel 查询深圳、上海当前市场信号并写简报'' --allowedTools ''mcp__housing-sentinel__*'' | Out-File $env:USERPROFILE\housing-brief.md"'
$trigger = New-ScheduledTaskTrigger -Daily -At 08:00
Register-ScheduledTask -TaskName "HousingSentinel-DailyBrief" -Action $action -Trigger $trigger
```

说明：

- `claude mcp add` 默认是 local scope（绑定当前目录），定时任务要在同一目录执行，或添加时用 `--scope user`。
- 数据每天更新一次（各城市北京时间 07:00–23:59 不等），08:00 跑能拿到大部分城市前一日数据。
- 想只在数据变化时才处理，改用 [polling-etag.sh](polling-etag.sh) 或 [Webhook](webhook-receiver-node.js)。
