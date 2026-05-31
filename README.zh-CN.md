# QuantPilot Lite

[English](./README.md) | [中文](./README.zh-CN.md)

QuantPilot Lite 是本地优先的量化研究与纸面执行控制台。项目只聚焦策略查看、行情上下文、回测、模拟/纸面执行和基础风控。

---

## 安全边界

- Lite 范围不包含可运行的实盘交易路径。
- 浏览器端不得持有 broker 密钥。
- 支持的运行模式只有 `simulated` 和 `paper`。
- 执行动作前必须经过基础风控与 kill switch 检查。
- QuantPilot Lite 是研究和纸面执行工具，不是无人值守交易机器人。

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
| `VITE_MARKET_DATA_PROVIDER` | `simulated` 或 `custom-http` |
| `VITE_MARKET_DATA_HTTP_URL` | 使用 `custom-http` 时的可选 HTTP 行情网关 URL |
| `VITE_BROKER_PROVIDER` | `simulated` 或 `custom-http` |
| `VITE_BROKER_HTTP_URL` | 使用 `custom-http` 时的可选 HTTP broker 网关 URL |
| `GATEWAY_PORT` | API 网关端口，默认 `8787` |
| `CORS_ORIGINS` | API 网关允许的前端来源 |
| `RATE_LIMIT_WINDOW_MS` | API 网关限流窗口 |
| `RATE_LIMIT_MAX` | 每个限流窗口允许的请求数 |
| `QUANTPILOT_TRADING_MODE` | API 运行模式，`simulated` 或 `paper` |
| `QUANTPILOT_CONTROL_PLANE_NAMESPACE` | 本地 API 命名空间 |
| `DEMO_USERNAME` | 本地 demo session 用户名 |
| `DEMO_PASSWORD` | 本地 demo session 密码 |
| `QUANTPILOT_USE_MOCK_DATA` | 为 true 时使用合成网关数据 |

---

## 核心能力

| 领域 | 范围 |
|------|------|
| Dashboard | 运行状态、账户摘要、关键告警 |
| Market | 模拟或已配置的行情概览 |
| Strategies | 小规模策略目录和详情 |
| Backtest | 回测规格、运行、结果面板、成本与滑点 |
| Execution | 模拟/纸面计划、订单、持仓和事件日志 |
| Risk | 基础限制、风险状态和 kill switch |
| Settings | 运行模式、刷新间隔、provider 和风控设置 |

## 架构

```text
quantpilot/
├── apps/
│   ├── web/      React 18 SPA (Vite, vanilla-extract)
│   └── api/      Node.js API gateway
├── packages/
│   ├── trading-engine/        回测、风控、执行和策略核心
│   ├── shared-types/          核心共享契约
│   └── ui/                    共享 UI 包占位
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
