# 扣子（Coze）工作流接入 / Coze workflow

> ⚠️ 国内平台（扣子、魔搭、Dify 国内部署等）的服务器访问 `api.housingsentinel.cn` 经常超时，**一律使用国内代理地址**：
>
> `https://housingpi-proxy-anirmyfaea.cn-shanghai.fcapp.run/mcp`

## 方式 A：直接用商店插件（最快）

扣子插件商店搜索「房哨兵」，添加到智能体或工作流即可。商店插件使用平台共享的演示密钥，只能查深圳当前信号；要用全部城市，按方式 B 用你自己的 API Key。

## 方式 B：用自己的 Key 创建 MCP 插件

1. 在 [housingsentinel.cn/agent](https://housingsentinel.cn/agent) 生成 API Key（`hs_live_...`）。
2. 扣子 → 工作空间 → 资源库 → **+ 资源 → 插件**，创建方式选 **MCP**（或"基于 MCP 服务创建"）。
3. 服务地址填：`https://housingpi-proxy-anirmyfaea.cn-shanghai.fcapp.run/mcp`
   传输方式选 **Streamable HTTP**。
4. 鉴权：请求头 `Authorization`，值 `Bearer hs_live_xxx`。
   如果界面不支持自定义请求头，可以把 Key 放在查询参数里：
   `https://housingpi-proxy-anirmyfaea.cn-shanghai.fcapp.run/mcp?apiKey=hs_live_xxx`
5. 保存后扣子会自动发现 4 个工具：`list_cities`、`get_market_signal`、`get_metrics`、`get_history`。

## 搭一个"每日房市简报"工作流

```
开始（输入 cities，默认 "shenzhen,shanghai"）
  → 插件节点 get_market_signal（city = 循环中的城市）   ← 用"批处理"对 cities 逐个调用
  → 大模型节点：
       根据以下信号写一段 ≤200 字的房市简报，每城一行：阶段、二手去化周期、数据日期；
       结尾注明"数据来自各城市住建部门官方渠道，非投资建议"。
       {{signals}}
  → 结束（输出简报文本）
```

定时执行：在智能体的 **触发器** 里加"定时触发"，每天 08:00 调用该工作流，并推送到飞书/企业微信等渠道。

## 注意

- 数据每天更新一次，定时频率 ≥ 1 小时即可，避免耗尽每日调用额度。
- 扣子里展示 AI 生成内容时，请保留"AI 生成"标识与"非投资建议"声明。
