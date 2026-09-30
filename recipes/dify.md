# Dify：以 OpenAPI 自定义工具导入 / Import as an OpenAPI custom tool

## 步骤

1. 在 [housingsentinel.cn/agent](https://housingsentinel.cn/agent) 生成 API Key（`hs_live_...`）。
2. Dify → **工具** → **自定义** → **创建自定义工具**。
3. Schema 处选 **从 URL 导入**，填：

   ```
   https://housingsentinel.cn/openapi.yaml
   ```

   URL 导入失败（例如 Dify 服务器在境外或网络受限）时，打开该地址复制全文粘贴进 Schema 框；也可以用本仓库的 [openapi.yaml](../openapi.yaml)，两者内容一致。
4. **鉴权方法**：API Key → 头部 `Authorization` → 类型 **Bearer** → 值填 `hs_live_xxx`（不要重复写 `Bearer `）。
5. 保存。Dify 会按 `operationId` 生成工具，常用的是：
   - `getSignals`：全部可访问城市的当前信号（主接口）
   - `getCitySignal`：单城市信号
   - `getCityMetrics` / `getCityHistory`：趋势与原始数据（需试用/点数包/订阅）
   - `getCityCard`：公开数据卡（无需 Key）
6. 在 Agent 或工作流里添加这些工具。`createWebhook`/`deleteWebhook` 等写操作一般不需要给 Agent，可以在工具列表里取消勾选。

## 服务器地址

`openapi.yaml` 里的 `servers` 是 `https://api.housingsentinel.cn/api/v1`。Dify 部署在中国大陆且调用超时时，把 Schema 里的 servers 改成国内代理：

```yaml
servers:
  - url: https://housingpi-proxy-anirmyfaea.cn-shanghai.fcapp.run/api/v1
```

## 也可以走 MCP

较新版本的 Dify 支持添加 MCP 服务器（工具 → MCP）。地址填 `https://api.housingsentinel.cn/mcp`（国内用 `https://housingpi-proxy-anirmyfaea.cn-shanghai.fcapp.run/mcp`），请求头 `Authorization: Bearer hs_live_xxx`。

## 提示词示例

```
你是房市分析助手。调用 getSignals 获取最新信号，按城市列出：市场阶段、二手去化周期（月）、数据日期。
去化周期 ≥18 月为防守、12–18 观察、8–12 进攻、<8 快速进攻。最后给一句总体判断，并注明"非投资建议"。
```
