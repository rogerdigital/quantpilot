# QuantPilot

[English](./README.md) | [中文](./README.zh-CN.md)

AI-native quantitative research and execution control plane — research, backtest, execute, manage risk, and collaborate with controlled agents, all from one operator console.

> QuantPilot is a controlled quantitative research and execution platform covering the full lifecycle from hypothesis to live trading, with evidence-based promotion gates, risk enforcement, and agent governance at every boundary.

---

## Safety Boundaries

- Browser never holds real broker credentials — all secrets stay server-side
- Agents cannot place real trades directly — all agent actions are advisory until accepted by a human or policy
- Risk and approval controls cannot be bypassed; kill switch is server-side enforced
- `live` mode requires server-side environment validation, explicit risk acknowledgement, and full promotion evidence chain
- All strategy promotions must carry research, backtest, risk, and execution evidence
- This is a controlled research and execution control plane, not an unattended trading bot

---

## Quick Start

**Prerequisites:** Node.js >=20.5.0, npm >=10

```bash
npm install

# Start all three processes (separate terminals)
npm run dev        # Web console → http://localhost:8080
npm run gateway    # API gateway → http://localhost:8787
npm run worker     # Background worker
```

Copy `.env.example` to `.env` and configure. Validate with:

```bash
npm run check:runtime-env -- --env-file .env
```

| Variable | Purpose |
|----------|---------|
| `QUANTPILOT_TRADING_MODE` / `VITE_TRADING_MODE` | `simulated`, `paper`, or `live` |
| `ALPACA_KEY_ID` / `ALPACA_SECRET_KEY` | Required for `paper` and `live` modes |
| `QUANTPILOT_LIVE_TRADING_ACK` | Must be set before `live` mode can start |
| `JWT_SECRET` | HS256 signing key (min 32 chars) |
| `BROKER_KEY_ENCRYPTION_KEY` | 64-char hex for AES-256-GCM |
| `DEMO_USERNAME` / `DEMO_PASSWORD` | Login credentials (`admin` / `changeme`) |

---

## Core Capabilities

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

## Architecture

```text
quantpilot/
├── apps/
│   ├── web/          React 18 SPA (Vite, vanilla-extract)
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

Further reading: [Project Structure](./docs/architecture/project-structure.md) | [Operations Handbook](./docs/operations-handbook.md) | [Deployment Guide](./docs/deployment.md) | [Contributing](./CONTRIBUTING.md)

---

## Development

```bash
# Dev servers
npm run dev                 # Vite dev server (HMR)
npm run gateway             # API gateway
npm run worker              # Background worker

# Testing
npm run test:web            # Vitest (frontend)
npm run test:api            # node --test (API)
npm run test:engine         # Trading & workflow engine
npm run test:runtime        # Runtime
npm run test:control-plane  # Store layer
npm run test:worker         # Worker

# Validation
npm run typecheck           # tsc --noEmit
npm run build               # Production build
npm run verify              # Full pipeline (lint + tests + typecheck + build)
```

Pre-push hook runs `verify` automatically.

| Layer | Choice |
|-------|--------|
| Language | TypeScript 5 (TS-only first-party source) |
| Frontend | React 18 + react-router-dom 6 |
| Build | Vite 5 + vanilla-extract |
| Backend | Node.js ESM + tsx |
| Test | Vitest + node --test |
| Package Mgr | npm workspaces |

---

## Future Direction

The core platform (domain contracts through observability) is complete. Next priorities: real database migration (PostgreSQL), production broker integration with multiple providers, and multi-tenant workspace isolation.

---

## License

[MIT](./LICENSE)
