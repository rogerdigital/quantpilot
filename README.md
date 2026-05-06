# QuantPilot

[English](./README.md) | [中文](./README.zh-CN.md)

> AI-native quantitative trading platform — research, backtest, execute, manage risk, and collaborate with controlled agents, all from one operator console.

![QuantPilot Dashboard](./docs/media/quantpilot-overview.png)

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
| **UX Extras** | `Cmd+K` command palette, approval drawer, toast notifications |

---

## Quick Start

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10

### Install & Run

```bash
npm install

# Start all three processes (separate terminals)
npm run dev        # Web console → http://localhost:8080
npm run gateway    # API gateway → http://localhost:8787
npm run worker     # Background worker
```

For real broker or LLM integration, copy `.env.example` to `.env` and configure providers. Validate with:

```bash
npm run check:runtime-env -- --env-file .env
```

Key env vars:

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | HS256 signing key (min 32 chars) |
| `BROKER_KEY_ENCRYPTION_KEY` | 64-char hex for AES-256-GCM |
| `DEMO_USERNAME` / `DEMO_PASSWORD` | Login credentials (`admin` / `changeme`) |
| `USE_HONO` | Set `true` for Hono gateway layer |

---

## Architecture

```text
┌─────────────────────────────────────────────────────┐
│  apps/web          React 18 SPA (Vite, VE styles)   │
├─────────────────────────────────────────────────────┤
│  apps/api          Node.js API gateway (ESM + tsx)   │
├─────────────────────────────────────────────────────┤
│  apps/worker       Background task runner            │
├─────────────────────────────────────────────────────┤
│  packages/                                           │
│  ├── trading-engine        Strategy, backtest, risk  │
│  ├── task-workflow-engine  Workflow orchestration     │
│  ├── control-plane-runtime Runtime context & fanout  │
│  ├── control-plane-store   Persistence (file / SQLite) │
│  ├── llm-provider          Provider-agnostic LLM     │
│  ├── shared-types          Cross-package contracts   │
│  └── db                    SQLite adapter + Drizzle  │
└─────────────────────────────────────────────────────┘
```

### Platform Operating Loops

1. **Research** — strategy catalog → backtest → evaluation → governance → execution handoff
2. **Execution** — plan → broker event → reconciliation → compensation → incident linkage
3. **Middleware** — risk workbench + scheduler workbench → reviewed actions → control-plane fanout
4. **Agent** — prompt → intent → plan → analysis → handoff → approval → daily-run cycle

---

## Development

### Commands

```bash
npm run dev                 # Vite dev server (HMR)
npm run gateway             # API gateway
npm run worker              # Background worker

npm run test:web            # Vitest (frontend)
npm run test:api            # node --test (API)
npm run test:engine         # Workflow engine
npm run test:runtime        # Runtime
npm run test:control-plane  # Store layer
npm run test:worker         # Worker

npm run typecheck           # tsc --noEmit
npm run build               # Production build
npm run verify              # Full pipeline (all of the above)
```

### Verify Pipeline

`npm run verify` runs sequentially:

1. Workspace & lockfile integrity
2. Documentation consistency
3. Runtime env checks
4. Lint (Biome)
5. All test suites (control-plane → runtime → engine → API → worker → web)
6. TypeScript typecheck
7. Production build

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

## Project Structure

```
quantpilot/
├── apps/
│   ├── api/                 API gateway
│   ├── web/                 React SPA
│   │   └── src/
│   │       ├── app/         Shell, global styles
│   │       ├── components/  Shared UI (charts, command-palette, toast, approval-drawer)
│   │       ├── modules/     Domain modules (agent, console, research, risk, permissions)
│   │       ├── pages/       9 route pages
│   │       ├── services/    API client layer
│   │       ├── store/       TradingSystemProvider
│   │       └── hooks/       useOhlcvData, useSSE
│   └── worker/              Background tasks
├── packages/                Shared engines & contracts
├── docs/                    Architecture, ops, deployment
├── scripts/                 Tooling & CI helpers
└── CONTRIBUTING.md
```

### Key Entry Points

| What | Where |
|------|-------|
| Web app | `apps/web/src/app/App.tsx` |
| Dashboard | `apps/web/src/pages/console/DashboardConsole.tsx` |
| State provider | `apps/web/src/store/trading-system/TradingSystemProvider.tsx` |
| API server | `apps/api/src/main.ts` |
| Worker | `apps/worker/src/main.ts` |
| Trading engine | `packages/trading-engine/src/runtime.ts` |
| Backtest engine | `packages/trading-engine/src/backtest/index.ts` |
| Control-plane | `packages/control-plane-runtime/src/index.ts` |
| Workflow engine | `packages/task-workflow-engine/src/index.ts` |

---

## Documentation

| Document | Purpose |
|----------|---------|
| [Contributing Guide](./CONTRIBUTING.md) | Dev workflow, PR rules |
| [Operations Handbook](./docs/operations-handbook.md) | Backup, restore, incidents |
| [Deployment Guide](./docs/deployment.md) | Build, env, deploy checklist |
| [Migration Runbook](./docs/control-plane-migrations.md) | Control-plane schema changes |
| [Project Structure](./docs/architecture/project-structure.md) | Detailed module map |
| [Layered Architecture](./docs/architecture/layered-architecture.md) | Design philosophy |

---

## Roadmap & History

The staged delivery roadmap (Stages 1–7) is **closed**. Stage closeout documents remain as architecture references and contract baselines enforced by `verify`:

[Stage 1](./docs/architecture/stage-1-closeout.md) · [Stage 2](./docs/architecture/stage-2-closeout.md) · [Stage 3](./docs/architecture/stage-3-closeout.md) · [Stage 4](./docs/architecture/stage-4-closeout.md) · [Stage 5](./docs/architecture/stage-5-closeout.md) · [Stage 6](./docs/architecture/stage-6-closeout.md) · [Stage 7](./docs/architecture/stage-7-closeout.md)

---

## Safety Boundaries

- Browser never holds real broker credentials
- Remote order placement goes through the server gateway only
- Agents cannot place real trades directly
- Risk and approval controls cannot be bypassed
- This is not a production unattended live-trading deployment

---

## License

[MIT](./LICENSE)
