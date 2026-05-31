# QuantPilot Lite

[English](./README.md) | [中文](./README.zh-CN.md)

QuantPilot Lite is a local-first quantitative research and paper execution console. It keeps the product focused on strategy review, market context, backtesting, simulated or paper execution, and basic risk controls.

This repository is being simplified from an institutional research platform into a smaller core console. Archived institutional plans live under `docs/archive/plans/` and are no longer active product scope.

---

## Safety Boundaries

- No live trading runtime is part of the Lite scope.
- Browser code must not hold broker secrets.
- Supported modes are `simulated` and `paper`.
- Risk checks and the kill switch must be enforced before execution actions.
- QuantPilot Lite is a research and paper execution tool, not an unattended trading bot.

---

## Quick Start

**Prerequisites:** Node.js >=20.5.0, npm >=10

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
| `VITE_MARKET_DATA_PROVIDER` | `simulated` or `custom-http` |
| `VITE_BROKER_PROVIDER` | `simulated` or `custom-http` |
| `GATEWAY_PORT` | API gateway port, default `8787` |
| `QUANTPILOT_TRADING_MODE` | Server runtime mode, `simulated` or `paper` |
| `QUANTPILOT_CONTROL_PLANE_NAMESPACE` | Local runtime namespace |

---

## Core Capabilities

| Domain | Scope |
|--------|-------|
| Dashboard | Runtime status, account summary, key warnings |
| Market | Simulated or configured market data overview |
| Strategies | Small strategy catalog and detail view |
| Backtest | Backtest specs, runs, result panels, costs and slippage |
| Execution | Simulated or paper plans, orders, positions and event log |
| Risk | Basic limits, risk state and kill switch |
| Settings | Runtime mode, refresh interval, provider and risk settings |

Removed from active scope: autonomous assistant collaboration, compute jobs, background task platform, team administration, reporting services, connector marketplace, data/feature/model registries, experiment registry, and live trading approval flows.

---

## Architecture

```text
quantpilot/
├── apps/
│   ├── web/      React 18 SPA (Vite, vanilla-extract)
│   └── api/      Node.js API gateway
├── packages/
│   ├── trading-engine/        Backtest, risk, execution and strategy core
│   ├── shared-types/          Core cross-package contracts
│   └── ui/                    Shared UI package placeholder
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
