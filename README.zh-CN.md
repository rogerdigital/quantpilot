# QuantPilot

[English](./README.md) | [中文](./README.zh-CN.md)

QuantPilot 是本地优先的量化研究与执行控制台。项目聚焦策略查看、行情上下文、回测、模拟/纸面/实盘执行和基础风控。

---

## 安全边界

- 支持的运行模式为 `simulated`、`paper` 和 `live`，默认 `simulated`。
- 实盘交易默认关闭，且受多重开关保护：需同时满足 `QUANTPILOT_TRADING_MODE=live`、`ALPACA_USE_PAPER=false`、有效的 Alpaca 凭证，以及显式确认 `QUANTPILOT_LIVE_TRADING_ACK=I_UNDERSTAND_LIVE_TRADING_RISK`。任一条件缺失都会回退到非实盘行为。
- 浏览器端不得持有 broker 密钥，凭证只存在于 API 网关环境。
- 执行动作前必须经过基础风控与 kill switch 检查。
- QuantPilot 是研究与执行控制台，不是无人值守交易机器人。

---

## 快速开始

**环境要求：** Node.js >=20.5.0、npm >=10

```bash
npm install

npm run gateway    # API 网关 -> http://localhost:8787
npm run dev        # Web 控制台 -> http://localhost:8080
```

需要本地覆盖配置时，将 `.env.example` 复制为 `.env`。

| 变量 | 用途 |
|------|------|
| `VITE_REFRESH_MS` | 前端刷新间隔，默认 `5000` |
| `VITE_TRADING_MODE` | `simulated` 或 `paper` |
| `VITE_MARKET_DATA_PROVIDER` | `simulated`、`custom-http` 或 `alpaca` |
| `VITE_MARKET_DATA_HTTP_URL` | 使用 `custom-http` 时的可选 HTTP 行情网关 URL |
| `VITE_BROKER_PROVIDER` | `simulated`、`custom-http` 或 `alpaca` |
| `VITE_BROKER_HTTP_URL` | 使用 `custom-http` 时的可选 HTTP broker 网关 URL |
| `GATEWAY_PORT` | API 网关端口，默认 `8787` |
| `CORS_ORIGINS` | API 网关允许的前端来源 |
| `RATE_LIMIT_WINDOW_MS` | API 网关限流窗口 |
| `RATE_LIMIT_MAX` | 每个限流窗口允许的请求数 |
| `QUANTPILOT_TRADING_MODE` | API 运行模式：`simulated`、`paper` 或 `live` |
| `QUANTPILOT_CONTROL_PLANE_NAMESPACE` | 本地 API 命名空间 |
| `DEMO_USERNAME` | 本地 demo session 用户名 |
| `DEMO_PASSWORD` | 本地 demo session 密码 |
| `QUANTPILOT_USE_MOCK_DATA` | `true` 使用合成数据；`false` 使用 Alpaca 网关。默认 `false` |
| `ALPACA_KEY_ID` | Alpaca API key id（仅网关使用） |
| `ALPACA_SECRET_KEY` | Alpaca API secret（仅网关使用） |
| `ALPACA_USE_PAPER` | `true`（默认）指向纸面端点；`false` 指向实盘 |
| `QUANTPILOT_LIVE_TRADING_ACK` | 须等于 `I_UNDERSTAND_LIVE_TRADING_RISK` 才能启用实盘交易 |

---

## 核心能力

| 领域 | 范围 |
|------|------|
| Dashboard | 运行状态、账户摘要、关键告警 |
| Market | 模拟、custom-http 或 Alpaca 行情概览 |
| Trading | 行情监控、图表分析和下单的一体化交易终端 |
| Strategies | 小规模策略目录和详情 |
| Backtest | 回测规格、运行、结果面板、成本与滑点 |
| Execution | 模拟、纸面或实盘计划、订单、持仓和事件日志 |
| Risk | 基础限制、风险状态和 kill switch |
| Settings | 运行模式、刷新间隔、provider 和风控设置 |

## 架构

```text
quantpilot/
├── apps/
│   ├── web/      React 18 SPA (Vite, vanilla-extract)
│   └── api/      Node.js API 网关 (Alpaca + custom-http broker)
├── packages/
│   ├── trading-engine/        回测、风控、执行和策略核心
│   ├── shared-types/          核心共享契约
│   └── ui/                    共享 vanilla-extract UI 组件
├── docs/
│   ├── architecture/
│   ├── archive/
│   └── plans/
└── scripts/
```

详细文档：[项目结构](./docs/architecture/project-structure.md) | [运维手册](./docs/operations-handbook.md) | [部署指南](./docs/deployment.md) | [协作指南](./CONTRIBUTING.md)

---

## 开发

```bash
npm run dev                 # Vite 开发服务器
npm run gateway             # API 网关

npm run test:web            # 前端测试
npm run test:api            # API 测试
npm run test:engine         # 交易引擎测试

npm run typecheck
npm run build
npm run verify
```

Pre-push hook 自动执行 `verify`。

---

## 许可证

[MIT](./LICENSE)
