# 接入层说明

当前系统已经把“行情源”和“broker”抽成可替换 provider。

## 配置入口

- [runtime.ts](../apps/web/src/services/config/runtime.ts)
- [.env.example](../.env.example)
- [main.mjs](../apps/api/src/main.mjs)
- [alpaca.mjs](../apps/api/src/gateways/alpaca.mjs)

## 推荐接法

如果你希望项目以“半真实交易沙盒”的方式运行，推荐前端统一走：

```bash
VITE_BROKER_PROVIDER=custom-http
VITE_BROKER_HTTP_URL=/api/broker
```

然后由 Node gateway 通过 `BROKER_ADAPTER` 决定后端实际接 Alpaca 还是你自己的 HTTP broker。

## 行情 Provider

[marketData.ts](../apps/web/src/services/providers/marketData.ts) 当前支持：

- `simulated`
- `custom-http`
- `alpaca`

如果使用 `custom-http`，请求格式为：

- 方法：`GET`
- 参数：`symbols=AAPL,MSFT,NVDA,...`

期望返回：

```json
{
  "data": [
    {
      "symbol": "AAPL",
      "price": 212.8,
      "prevClose": 210.9,
      "high": 214.0,
      "low": 209.5,
      "volume": 1234567,
      "turnover": 262345678
    }
  ]
}
```

## Broker Provider

[broker.ts](../apps/web/src/services/providers/broker.ts) 当前支持：

- `simulated`
- `custom-http`
- `alpaca`

其中 `custom-http` 现在既可以直连外部 URL，也可以默认走同源 ` /api/broker ` 网关。推荐优先走同源网关。

如果使用 `custom-http`，请求格式为：

- 方法：`POST`
- Body：订单批次 JSON

如果上游 broker 需要鉴权，建议把 `VITE_BROKER_HTTP_URL` 指向你自己的同源网关，再由服务端注入鉴权头。不要把 broker 密钥放进前端 `VITE_*` 变量。

请求体示例：

```json
{
  "timestamp": "2026-03-07T07:20:00.000Z",
  "orders": [
    {
      "account": "paper",
      "clientOrderId": "sandbox-live-buy-AAPL-12",
      "side": "BUY",
      "symbol": "AAPL",
      "qty": 12
    }
  ]
}
```

响应体最小格式：

```json
{
  "message": "accepted",
  "orders": [],
  "rejectedOrders": []
}
```

## 当前行为

- 行情网关失败时，回退到本地模拟行情
- broker 网关失败时，保留本地实盘账户模拟链路
- 页面侧边栏和总览页会显示当前 provider 与连接状态
- 远程 broker 下单会携带稳定的 `clientOrderId`
- 若一批订单出现部分成功，网关会返回 `orders` 和 `rejectedOrders`，前端保留未确认意图并继续跟踪
- `riskGuard` 触发时，live 账户也会生成对应的远程减仓意图

## Alpaca 说明

当前仓库已经接入一套真实官方 HTTP 协议，并且默认建议通过本地服务端网关访问：

- 行情：`https://data.alpaca.markets/v2/stocks/snapshots`
- 交易：`https://paper-api.alpaca.markets/v2/orders` 或 `https://api.alpaca.markets/v2/orders`

当前前端访问的是：

- `/api/alpaca/market/snapshots`
- `/api/alpaca/broker/orders`
- `/api/alpaca/broker/state`
- `/api/alpaca/broker/orders/:id`

统一 broker adapter 还提供：

- `/api/broker/health`
- `/api/broker/orders`
- `/api/broker/state`
- `/api/broker/orders/:id`

这些接口由 [alpaca.mjs](../apps/api/src/gateways/alpaca.mjs) 代理到 Alpaca。

## 启动方式

1. 复制 [.env.example](../.env.example) 为 `.env`
2. 选择 `BROKER_ADAPTER=alpaca` 或 `BROKER_ADAPTER=custom-http`
3. 如果使用 Alpaca，写入 Alpaca Key/Secret；如果使用自定义 broker，写入 `BROKER_UPSTREAM_URL` 与服务端密钥
4. 启动网关：`npm run gateway`
5. 启动前端：`npm start`

开发环境下，Vite 会把 `/api/*` 代理到 `http://127.0.0.1:8787`。
