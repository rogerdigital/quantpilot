# QuantPilot

[English](./README.md) | [中文](./README.zh-CN.md)

QuantPilot is an AI-native quantitative trading platform built as a TypeScript monorepo. It combines a web operator console, an API gateway, background workers, shared control-plane runtimes, and workflow orchestration for research, execution, risk, scheduling, incidents, and controlled agent collaboration.

QuantPilot is not a production live-trading system. It is a platform skeleton and operating surface for controlled quantitative trading workflows, not an unattended trading bot.

## Tech Stack

| Category | Technology |
|----------|------------|
| Language | TypeScript 5 (TypeScript-first first-party source; no new JavaScript source files in `apps`, `packages`, or `scripts`) |
| Frontend | React 18 + react-router-dom 6 |
| Build | Vite 5 |
| Styling | vanilla-extract |
| Backend | Node.js ESM + tsx |
| Testing | Vitest + node --test |
| Package Manager | npm workspaces |

## What QuantPilot Includes

- A multi-workbench web console for dashboard, market, strategy, backtest, risk, execution, trading terminal, agent, notifications, and settings workflows
- An API gateway for account, auth, research, execution, risk, scheduler, incident, operations, market data, SSE push, and agent contracts
- Background workers for notification dispatch, risk scans, scheduler ticks, workflow maintenance, monitoring scans, queued workflow execution, and agent daily run operational loops
- Shared runtime packages for trading logic, control-plane fanout, workflow execution, and frontend/backend type contracts
- Control-plane persistence with `file` and `db` adapter foundations — the `db` adapter is backed by SQLite (WAL mode) via `better-sqlite3`, with maintenance tooling, schema manifests, and migration contracts
- Event-driven backtest engine producing real Sharpe, max drawdown, and win-rate metrics
- Risk analytics layer computing Historical VaR, CVaR, Beta, and HHI concentration on live portfolio snapshots
- Optional Hono API gateway layer (`USE_HONO=true`) with CORS, structured logging, and request timing
- JWT authentication (`jose`) and AES-256-GCM broker API key encryption for credentials at rest
- Server-Sent Events push for live state updates, reducing polling to a 15-second fallback
- Verification baselines that protect closed roadmap contracts across platform, research, execution, risk, scheduler, agent, and production-readiness surfaces
## Platform Scope

QuantPilot is designed around four platform-level operating loops:

- Research loop: strategy catalog, backtest runs, evaluations, reports, governance, and execution handoff
- Execution loop: execution plans, broker-event ingestion, reconciliation, compensation, recovery, and incident linkage
- Middleware loop: risk workbench, scheduler workbench, linkage context, reviewed actions, and control-plane fanout
- Agent loop: prompt, intent, plan, read-only analysis, explanation, controlled handoff, approval, downstream workflow routing, and daily run operational cycles (pre-market brief, intraday monitor, post-market recap)

The platform also includes account scope, workspace-aware permissions, monitoring, incident response, maintenance tooling, and deployment-facing verification.

## Target Architecture

### 1. Frontend

The operator-facing console for workflows, review queues, workbenches, and settings.

Primary locations:

- `apps/web`
- `apps/web/src/app`
- `apps/web/src/pages`
- `apps/web/src/modules`
- `apps/web/src/store`
- `apps/web/src/components/charts` — lightweight-charts v5 components (EquityChart, SignalBarChart, CandlestickChart)
- `apps/web/src/components/command-palette` — global `Cmd+K` fuzzy-search command palette
- `apps/web/src/components/approval-drawer` — fixed bottom drawer for pending live order approvals
- `apps/web/src/components/toast` — toast notification system (`ToastProvider` / `useToast`)
- `apps/web/src/hooks` — useOhlcvData, useSSE

### 2. Backend

The API and orchestration layer for platform contracts, auth, workflow routing, domain services, and control-plane assembly.

Primary locations:

- `apps/api`
- `apps/api/src/app`
- `apps/api/src/app/routes/hono` — optional Hono router layer
- `apps/api/src/domains`
- `apps/api/src/modules`
- `apps/api/src/modules/auth` — JWT service, broker key encryption
- `apps/api/src/modules/sse` — SSE connection manager
- `packages/control-plane-runtime`
- `packages/llm-provider` — provider-agnostic LLM abstraction (Claude, OpenAI) used by agent services

### 3. Data Layer

Persistence, repository contracts, adapter abstractions, and low-level storage utilities.

Primary locations:

- `packages/control-plane-store`
- `packages/db` — includes SQLite adapter (`sqlite-adapter.ts`) and Drizzle schema
- `packages/shared-types`

### 4. Strategy Layer

Strategy registration, backtesting, evaluation, comparison, and governance.

Primary locations:

- `packages/trading-engine/src/strategy`
- `packages/trading-engine/src/backtest` — event-driven backtest engine
- `apps/api/src/domains/strategy`
- `apps/api/src/domains/backtest`
- `apps/api/src/modules/strategy`
- `apps/api/src/modules/backtest`

### 5. Agent Layer

Controlled collaboration workflows for session, intent, planning, analysis, explanation, and action handoff.

Primary locations:

- `apps/web/src/modules/agent`
- `apps/api/src/domains/agent`
- `apps/api/src/modules/agent`

### 6. Risk Layer

Risk review, approval boundaries, policy actions, risk analytics, and shared risk/scheduler middleware context.

Primary locations:

- `packages/trading-engine/src/risk` — Historical VaR, CVaR, Beta, HHI calculators
- `apps/api/src/domains/risk`
- `apps/api/src/modules/risk`
- `apps/worker/src/tasks/risk-scan-task.ts`

### 7. Execution Layer

Execution preparation, broker integration, lifecycle transitions, reconciliation, recovery, and compensation.

Primary locations:

- `packages/trading-engine/src/execution`
- `apps/api/src/domains/execution`
- `apps/api/src/modules/execution`
- `apps/api/src/gateways/alpaca.ts`

## Repository Layout

```text
quantpilot/
├── apps/
│   ├── api/
│   ├── web/
│   └── worker/
├── packages/
│   ├── control-plane-runtime/
│   ├── control-plane-store/
│   ├── db/
│   ├── llm-provider/
│   ├── shared-types/
│   ├── task-workflow-engine/
│   └── trading-engine/
├── docs/
├── scripts/
├── package.json
└── tsconfig.base.json
```

## Key Capabilities

### Research And Strategy

- Strategy catalog with research context
- Backtest runs, result versions, evaluations, and reports
- Event-driven daily-frequency backtest engine with real Sharpe, max drawdown, win-rate, and turnover metrics
- Governance actions, baselines, champions, comparison, and replay
- Structured handoff from research into execution preparation

### Execution

- Execution plans, runtime events, broker-event ingestion, and account snapshots
- Lifecycle progression through approval, submission, reconciliation, recovery, and compensation
- Queue-oriented execution operations console with incident linkage
- Trading terminal with BUY/SELL order submission wired to the execution candidate handoff flow

### Risk And Scheduling

- Unified risk workbench and scheduler workbench snapshots
- Shared risk/scheduler linkage context
- Reviewed middleware actions that write audit, notifications, and incident-aware control-plane state
- Risk analytics on live positions: Historical VaR (95%), CVaR (95%), Beta, and HHI concentration index

### Charts And Market Data

- `GET /api/market/ohlcv` endpoint for OHLCV bar history (Alpaca-backed or deterministic simulation)
- lightweight-charts v5 components replacing hand-drawn Canvas: EquityChart, SignalBarChart, CandlestickChart
- `useOhlcvData` hook for symbol/timeframe-driven chart data with automatic refetch

### Agent Collaboration

- Persisted `session / intent / plan / analysis run / action request / daily run` contracts
- Backend-driven workbench aggregation with AI daily summary card on the Dashboard
- Controlled action handoffs that stay inside approval and risk boundaries
- Daily run operational loop: pre-market brief, intraday monitoring with authority downgrade, and post-market recap with authority reset
- Ask-first queue for agent-initiated actions: trim, exit, cancel, and risk-reduce

### Real-Time Push

- `GET /api/sse/state` Server-Sent Events endpoint for live state updates
- `useSSE` hook with exponential-backoff reconnect
- Frontend polling drops to 15-second fallback while SSE connection is alive

### Auth And Security

- `POST /api/auth/login` endpoint issuing HS256 JWT tokens (8-hour expiry, `jose`)
- Optional Bearer token validation in `getSession` — backward compatible with the existing static session
- AES-256-GCM encryption for broker API keys at rest (`BROKER_KEY_ENCRYPTION_KEY`)
- API key masked to last 4 characters on all read endpoints

### Operations And Control Plane

- Monitoring snapshots, alerts, incidents, audit trail, operator actions, and workflow history
- Workspace-aware account scope and access policy resolution
- Backup, restore dry-run, integrity checks, repair tooling, and persistence posture visibility
- SQLite WAL storage for the embedded control-plane DB (replaces flat-file JSON in `db` adapter)
- Optional Hono gateway layer (`USE_HONO=true`) with CORS, request logging, and timing middleware

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Start The Main Processes

```bash
npm run dev
npm run gateway
npm run worker
```

Default local ports:

- Web: `http://127.0.0.1:8080`
- API: `http://127.0.0.1:8787`

### Validate Environment Contracts

Before starting a real gateway profile, validate the runtime configuration:

```bash
npm run check:runtime-env -- --env-file .env
```

This validates supported storage adapters, provider combinations, and required environment variables. The checked template lives in `.env.example`.

Key environment variables added in the platform upgrade:

| Variable | Purpose | Default |
|----------|---------|---------|
| `JWT_SECRET` | HS256 signing key for issued tokens (min 32 chars) | `dev-secret-change-in-prod` |
| `BROKER_KEY_ENCRYPTION_KEY` | 64-char hex key (32 bytes) for AES-256-GCM broker key encryption | `000...0` (dev only) |
| `DEMO_USERNAME` / `DEMO_PASSWORD` | Credentials for `POST /api/auth/login` | `admin` / `changeme` |
| `USE_HONO` | Set `true` to start the Hono gateway instead of the native HTTP server | unset |

## Development Commands

```bash
npm run check:runtime-env
npm run test:control-plane
npm run test:runtime
npm run test:engine
npm run test:api
npm run test:worker
npm run test:web
npm run typecheck
npm run build
npm run verify
```

After dependency installation, repository git hooks are automatically pointed at `.githooks`. The default `pre-push` hook runs `npm run verify` before a push.

## Validation

`npm run verify` runs:

1. Workspace integrity checks
2. Lockfile sync checks
3. Documentation consistency checks
4. Runtime environment checks
5. Lint (Biome)
6. Control-plane tests
7. Runtime tests
8. Workflow-engine tests
9. API tests
10. Worker tests
11. Web tests
12. Web typecheck
13. Production web build

## Operations And Deployment

Primary operator and deployment documentation:

- [Contributing Guide](./CONTRIBUTING.md)
- [Operations Handbook](./docs/operations-handbook.md)
- [Deployment Guide](./docs/deployment.md)
- [Control-Plane Migration Runbook](./docs/control-plane-migrations.md)
- [Project Structure](./docs/architecture/project-structure.md)

Persistence and maintenance tooling supports:

- Backup export
- Restore dry runs
- Integrity checks
- Workflow retry repair
- Persistence status and migration posture inspection

## Architecture History

The staged delivery roadmap is closed. The stage documents remain as architecture history and contract references:

- [Stage 1 Closeout](./docs/architecture/stage-1-closeout.md)
- [Stage 2 Closeout](./docs/architecture/stage-2-closeout.md)
- [Stage 3 Closeout](./docs/architecture/stage-3-closeout.md)
- [Stage 4 Closeout](./docs/architecture/stage-4-closeout.md)
- [Stage 5 Closeout](./docs/architecture/stage-5-closeout.md)
- [Stage 6 Closeout](./docs/architecture/stage-6-closeout.md)
- [Stage 7 Closeout](./docs/architecture/stage-7-closeout.md)

These documents define the closed capability boundaries and the baseline expectations still enforced by `verify`.

## Key Entry Points

- `apps/web/src/app/App.tsx`
- `apps/web/src/pages/console/DashboardConsole.tsx`
- `apps/web/src/store/trading-system/TradingSystemProvider.tsx`
- `apps/api/src/main.ts`
- `apps/api/src/app/index.ts`
- `apps/worker/src/main.ts`
- `packages/trading-engine/src/runtime.ts`
- `packages/trading-engine/src/backtest/index.ts`
- `packages/control-plane-runtime/src/index.ts`
- `packages/control-plane-store/src/index.ts`
- `packages/task-workflow-engine/src/index.ts`

## Safety Boundaries

- The browser must not hold real broker credentials
- Remote order placement must go through the server gateway
- Agents must not place real trades directly
- Risk and approval controls must not be bypassed by frontend, agent, or execution code
- The current repository should not be treated as a production unattended live-trading deployment
