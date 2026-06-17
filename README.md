# QuantPilot

[English](./README.md) | [中文](./README.zh-CN.md)

QuantPilot is a local-first quantitative research and execution console. It keeps the product focused on strategy review, market context, backtesting, simulated/paper/live execution, and basic risk controls.

---

## Safety Boundaries

- Supported runtime modes are `simulated`, `paper`, and `live`. `simulated` is the default.
- Live trading is off by default and multi-gated: it requires `QUANTPILOT_TRADING_MODE=live`, `ALPACA_USE_PAPER=false`, valid Alpaca credentials, and the explicit acknowledgement `QUANTPILOT_LIVE_TRADING_ACK=I_UNDERSTAND_LIVE_TRADING_RISK`. Any missing gate falls back to non-live behavior.
- Browser code must not hold broker secrets; credentials live only in the API gateway environment.
- Risk checks and the kill switch must be enforced before execution actions.
- QuantPilot is a research and execution console, not an unattended trading bot.

---

## Quick Start

**Prerequisites:** Node.js >=20.19.0, npm >=10

```bash
npm install

npm run gateway    # API gateway -> http://localhost:8787
npm run dev        # Web console -> http://localhost:8080
```

Copy `.env.example` to `.env` when you need local overrides.

| Variable | Purpose |
|----------|---------|
| `VITE_REFRESH_MS` | Frontend refresh interval, default `5000` |
| `VITE_TRADING_MODE` | `simulated` or `paper` |
| `VITE_MARKET_DATA_PROVIDER` | `simulated`, `custom-http`, or `alpaca` |
| `VITE_MARKET_DATA_HTTP_URL` | Optional HTTP market data gateway URL when using `custom-http` |
| `VITE_BROKER_PROVIDER` | `simulated`, `custom-http`, or `alpaca` |
| `VITE_BROKER_HTTP_URL` | Optional HTTP broker gateway URL when using `custom-http` |
| `GATEWAY_PORT` | API gateway port, default `8787` |
| `CORS_ORIGINS` | Allowed frontend origins for the API gateway |
| `RATE_LIMIT_WINDOW_MS` | API gateway rate-limit window |
| `RATE_LIMIT_MAX` | API gateway request limit per window |
| `QUANTPILOT_TRADING_MODE` | API runtime mode: `simulated`, `paper`, or `live` |
| `QUANTPILOT_CONTROL_PLANE_NAMESPACE` | Local API namespace |
| `DEMO_USERNAME` | Local demo session username |
| `DEMO_PASSWORD` | Local demo session password |
| `QUANTPILOT_USE_MOCK_DATA` | `true` uses synthetic data; `false` uses the Alpaca gateway. Default `false` |
| `ALPACA_KEY_ID` | Alpaca API key id (gateway only) |
| `ALPACA_SECRET_KEY` | Alpaca API secret (gateway only) |
| `ALPACA_USE_PAPER` | `true` (default) targets the paper endpoint; `false` targets live |
| `QUANTPILOT_LIVE_TRADING_ACK` | Must equal `I_UNDERSTAND_LIVE_TRADING_RISK` to enable live trading |

---

## Core Capabilities

| Domain | Scope |
|--------|-------|
| Dashboard | Runtime status, account summary, key warnings |
| Market | Simulated, custom-http, or Alpaca market data overview |
| Trading | Unified desk for market monitoring, charting, and order entry |
| Strategies | Small strategy catalog and detail view |
| Backtest | Backtest specs, runs, result panels, costs and slippage |
| Execution | Simulated, paper, or live plans, orders, positions and event log |
| Risk | Basic limits, risk state and kill switch |
| Settings | Runtime mode, refresh interval, provider and risk settings |

## Architecture

```text
quantpilot/
├── apps/
│   ├── web/      React 18 SPA (Vite, vanilla-extract)
│   └── api/      Node.js API gateway (Alpaca + custom-http brokers)
├── packages/
│   ├── trading-engine/        Backtest, risk, execution and strategy core
│   ├── shared-types/          Core cross-package contracts
│   └── ui/                    Shared vanilla-extract UI components
├── docs/
│   ├── architecture/
│   ├── archive/
│   └── plans/
└── scripts/
```

Further reading: [Project Structure](./docs/architecture/project-structure.md) | [Operations Handbook](./docs/operations-handbook.md) | [Deployment Guide](./docs/deployment.md) | [Contributing](./CONTRIBUTING.md)

---

## Development

```bash
npm run dev                 # Vite dev server
npm run gateway             # API gateway

npm run test:web            # Vitest frontend tests
npm run test:api            # API tests
npm run test:engine         # Trading engine tests

npm run typecheck
npm run build
npm run verify
```

Pre-push hook runs `verify` automatically.

---

## License

[MIT](./LICENSE)
