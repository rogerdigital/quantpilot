# QuantPilot

[English](./README.md) | [中文](./README.zh-CN.md)

> AI-native quantitative trading platform — research, backtest, execute, manage risk, and collaborate with controlled agents, all from one operator console.

![QuantPilot Dashboard](./docs/media/quantpilot-overview.gif)

**QuantPilot is a platform skeleton and operating surface for controlled quantitative trading workflows, not a production unattended trading bot.**

---

## Features

| Domain | What It Does |
|--------|-------------|
| **Research & Strategy** | Strategy catalog, event-driven backtest engine (Sharpe, max drawdown, win-rate), evaluation, comparison, and governance |
| **Execution** | Plan → approve → submit → reconcile → recover lifecycle, broker-event ingestion, queue-based operations console |
| **Risk** | Live VaR/CVaR/Beta/HHI analytics, approval boundaries, policy actions, risk-parameter tuning panel |
| **Agent Collaboration** | Session → intent → plan → analysis → action handoff pipeline, daily-run loops (pre-market / intraday / post-market), ask-first queue |
| **Real-Time Push** | SSE state stream with exponential-backoff reconnect; polling drops to 15 s fallback |
| **Auth & Security** | JWT (HS256, 8h), AES-256-GCM broker key encryption at rest, workspace-aware RBAC |
| **Operations** | Monitoring, incidents, audit trail, backup/restore, integrity checks, SQLite WAL persistence |
| **Charts** | lightweight-charts v5 — equity curve, candlestick, signal bar |
| **UX** | `Cmd+K` command palette, approval drawer, toast notifications |

---

## Quick Start

### Prerequisites

- Node.js >=20.5.0
- npm >= 10

### Install & Run

```bash
npm install

# Start all three processes (separate terminals)
npm run dev        # Web console → http://localhost:8080
npm run gateway    # API gateway → http://localhost:8787
npm run worker     # Background worker
```

### Environment Variables

Copy `.env.example` to `.env` and configure providers. Validate with:

```bash
npm run check:runtime-env -- --env-file .env
```

| Variable | Purpose |
|----------|---------|
| `QUANTPILOT_TRADING_MODE` / `VITE_TRADING_MODE` | Runtime mode: `simulated`, `paper`, or `live`; both values must match when both are set |
| `ALPACA_KEY_ID` / `ALPACA_SECRET_KEY` | Required for `paper` and `live` modes; not required for `simulated` |
| `QUANTPILOT_LIVE_TRADING_ACK` | Must be `I_UNDERSTAND_LIVE_TRADING_RISK` before `live` mode can start |
| `JWT_SECRET` | HS256 signing key (min 32 chars) |
| `BROKER_KEY_ENCRYPTION_KEY` | 64-char hex for AES-256-GCM |
| `DEMO_USERNAME` / `DEMO_PASSWORD` | Login credentials (`admin` / `changeme`) |

### Trading Modes

| Mode | Behavior |
|------|----------|
| `simulated` | Uses local simulated broker and market-data fallbacks. Alpaca credentials may be blank. |
| `paper` | Requires Alpaca credentials and `ALPACA_USE_PAPER=true`. Orders route through the gateway to a paper account. |
| `live` | Requires Alpaca credentials, `ALPACA_USE_PAPER=false`, and the explicit live-trading acknowledgement. |

---

## Development

### Commands

```bash
# Development
npm run dev                 # Vite dev server (HMR)
npm run gateway             # API gateway
npm run worker              # Background worker

# Testing
npm run test:web            # Vitest (frontend)
npm run test:api            # node --test (API)
npm run test:engine         # Workflow engine
npm run test:runtime        # Runtime
npm run test:control-plane  # Store layer
npm run test:worker         # Worker

# Validation
npm run typecheck           # tsc --noEmit
npm run build               # Production build
npm run verify              # Full pipeline (lint + tests + typecheck + build)
```

A `pre-push` git hook runs `verify` automatically.

### Tech Stack

| Layer | Choice |
|-------|--------|
| Language | TypeScript 5 (TS-only first-party source) |
| Frontend | React 18 + react-router-dom 6 |
| Build | Vite 5 + vanilla-extract |
| Backend | Node.js ESM + tsx |
| Test | Vitest + node --test |
| Package Mgr | npm workspaces |

---

## Architecture

```text
quantpilot/
├── apps/
│   ├── web/          React 18 SPA (Vite, VE styles)
│   ├── api/          Node.js API gateway (ESM + tsx)
│   └── worker/       Background task runner
├── packages/
│   ├── trading-engine        Strategy, backtest, risk
│   ├── task-workflow-engine  Workflow orchestration
│   ├── control-plane-runtime Runtime context & fanout
│   ├── control-plane-store   Persistence (file / SQLite)
│   ├── llm-provider          Provider-agnostic LLM
│   ├── shared-types          Cross-package contracts
│   ├── ui                    Shared UI components
│   └── db                    SQLite adapter + Drizzle
├── docs/             Architecture, ops, deployment
├── scripts/          Tooling & CI helpers
└── CONTRIBUTING.md
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| [Contributing Guide](./CONTRIBUTING.md) | Dev workflow, PR rules |
| [Operations Handbook](./docs/operations-handbook.md) | Backup, restore, incidents |
| [Deployment Guide](./docs/deployment.md) | Build, env, deploy checklist |
| [Project Structure](./docs/architecture/project-structure.md) | Detailed module map |

---

## Roadmap

### Current Status

Stage 1-7 completed. Platform skeleton is fully functional with research, backtest, execution, risk, and agent collaboration modules.

### Near-term (1-3 months)

- Broker integration: Alpaca, Interactive Brokers API connectors
- Agent governance: Fine-grained permission control, risk policy configuration
- Monitoring & alerts: Real-time risk metrics, anomaly detection, notifications
- Documentation: API docs, user manual, contribution guide

### Long-term (6-12 months)

- Multi-strategy multi-account: Strategy portfolio management, account isolation
- Institutional-grade risk: Stress testing, scenario analysis, compliance reports
- Open-source ecosystem: Plugin architecture, third-party strategy marketplace
- Cloud-native deployment: Docker, Kubernetes, multi-tenancy

---

## Safety Boundaries

- Browser never holds real broker credentials
- Remote order placement goes through the server gateway only
- Agents cannot place real trades directly
- Risk and approval controls cannot be bypassed
- `simulated`, `paper`, and `live` modes are surfaced through API health and the operator UI
- This is not a production unattended live-trading deployment

---

## License

[MIT](./LICENSE)
