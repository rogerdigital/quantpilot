# QuantPilot

[English](./README.md) | [中文](./README.zh-CN.md)

> AI-native quantitative research and execution control plane — research, backtest, execute, manage risk, and collaborate with controlled agents, all from one operator console.

**QuantPilot is a controlled quantitative research and execution platform covering the full lifecycle from hypothesis to live trading, with evidence-based promotion gates, risk enforcement, and agent governance at every boundary.**

---

## Features

| Domain | What It Does |
|--------|-------------|
| **Data Science** | Dataset registry, 7 automated quality checks, feature registry with lineage tracking, version-controlled ingestion |
| **Research & Strategy** | Research workspaces with hypothesis management, experiment registry, model registry, structured decision records |
| **Backtest Lab** | Reproducible specs (hash-stable), commission/slippage models, regime attribution, walk-forward analysis, robustness diagnostics |
| **Strategy Lifecycle** | 8 promotion gates, evidence-based transitions (research → candidate → paper → live), strategy package manifest |
| **Execution** | Order lifecycle state machine (algo orders + legs), broker adapter boundary, recovery workflows, reconciliation |
| **Risk** | Policy engine (11 rules), pre-trade assessment, VaR/CVaR/Beta/HHI analytics, kill switch, approval boundaries |
| **Agent Collaboration** | Governed tool registry, 5 review workflow types, session → intent → plan → analysis → action pipeline, authority ladder |
| **Compute Platform** | Job scheduler, artifact management, async task runner, backtest dispatcher |
| **Connectors** | Data/broker/model connector registry, strategy package validator, environment-aware health checks |
| **Observability** | Platform event bus (13 event types), system health matrix, artifact integrity checks (6 types) |
| **Operations** | Monitoring, incidents, audit trail, compliance reports, backup/restore, maintenance CLI |
| **Auth & Security** | JWT (HS256, 8h), AES-256-GCM broker key encryption at rest, workspace-aware RBAC, institutional permissions (9 actions × 5 roles) |
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
│   └── worker/       Background task runner (job handlers)
├── packages/
│   ├── trading-engine/          Backtest, risk policy, execution, strategy lifecycle, connectors
│   ├── task-workflow-engine/    Workflow orchestration, agent review workflows
│   ├── control-plane-runtime/  Runtime context, event bus, permission policy, connector registry
│   ├── control-plane-store/    Persistence: datasets, features, experiments, models, orgs, audits
│   ├── llm-provider/           Provider-agnostic LLM abstraction
│   ├── shared-types/           Cross-package domain contracts (14 type modules)
│   ├── ui/                     Shared UI components and design tokens
│   └── db/                     SQLite adapter + Drizzle
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

**Long-term direction:** AI-native quantitative research and execution control plane.

### Current Status

The institutional research platform roadmap (Stages 0-12) is complete: domain contracts, data science platform, research OS, backtest lab, strategy lifecycle, risk control plane, execution control plane, compute platform, agent collaboration, institutional operations, open ecosystem, and observability hardening.

### Near-term

- Real database migration (SQLite WAL → PostgreSQL)
- Agent autonomy expansion (P1/P2)
- Multi-tenant workspace isolation
- Real-time market data integration

### Mid-term

- Production broker integration (multiple providers)
- Advanced portfolio optimization
- ML model serving pipeline
- Cross-strategy correlation analysis

### Long-term

- Multi-asset class support (options, futures, crypto)
- Distributed compute cluster
- External strategy marketplace
- Regulatory reporting automation

---

## Safety Boundaries

- Browser never holds real broker credentials
- Remote order placement goes through the server gateway only
- Agents cannot place real trades directly — all agent actions are advisory until accepted by a human or policy
- Risk and approval controls cannot be bypassed; kill switch is server-side enforced
- `simulated`, `paper`, and `live` modes are surfaced through API health and the operator UI
- `live` mode requires server-side environment validation, explicit risk acknowledgement, and promotion evidence (research record, backtest record, risk assessment, execution plan)
- All strategy promotions must carry research evidence, backtest evidence, risk evidence, and execution evidence
- This platform is a controlled research and execution control plane, not a production unattended trading bot or stock recommendation tool
- QuantPilot does not promise alpha, returns, or unsupervised live trading capability

---

## License

[MIT](./LICENSE)
