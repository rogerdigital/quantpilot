# QuantPilot

[English](./README.md) | [中文](./README.zh-CN.md)

QuantPilot is an AI-native quantitative trading platform built as a TypeScript monorepo. It combines a web operator console, an API gateway, background workers, shared control-plane runtimes, and workflow orchestration for research, execution, risk, scheduling, incidents, and controlled agent collaboration.

QuantPilot is not a production live-trading system. It is a platform skeleton and operating surface for controlled quantitative trading workflows, not an unattended trading bot.

## What QuantPilot Includes

- A multi-workbench web console for dashboard, market, strategy, backtest, risk, execution, agent, notifications, and settings workflows
- An API gateway for account, auth, research, execution, risk, scheduler, incident, operations, and agent contracts
- Background workers for notification dispatch, risk scans, scheduler ticks, workflow maintenance, monitoring scans, queued workflow execution, and agent daily run operational loops
- Shared runtime packages for trading logic, control-plane fanout, workflow execution, and frontend/backend type contracts
- Control-plane persistence with `file` and `db` adapter foundations, maintenance tooling, schema manifests, and migration contracts
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

### 2. Backend

The API and orchestration layer for platform contracts, auth, workflow routing, domain services, and control-plane assembly.

Primary locations:

- `apps/api`
- `apps/api/src/app`
- `apps/api/src/domains`
- `apps/api/src/modules`
- `packages/control-plane-runtime`

### 3. Data Layer

Persistence, repository contracts, adapter abstractions, and low-level storage utilities.

Primary locations:

- `packages/control-plane-store`
- `packages/db`
- `packages/shared-types`

### 4. Strategy Layer

Strategy registration, backtesting, evaluation, comparison, and governance.

Primary locations:

- `packages/trading-engine/src/strategy`
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

Risk review, approval boundaries, policy actions, and shared risk/scheduler middleware context.

Primary locations:

- `packages/trading-engine/src/risk`
- `apps/api/src/domains/risk`
- `apps/api/src/modules/risk`
- `apps/worker/src/tasks/risk-scan-task.mjs`

### 7. Execution Layer

Execution preparation, broker integration, lifecycle transitions, reconciliation, recovery, and compensation.

Primary locations:

- `packages/trading-engine/src/execution`
- `apps/api/src/domains/execution`
- `apps/api/src/modules/execution`
- `apps/api/src/gateways/alpaca.mjs`

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
- Governance actions, baselines, champions, comparison, and replay
- Structured handoff from research into execution preparation

### Execution

- Execution plans, runtime events, broker-event ingestion, and account snapshots
- Lifecycle progression through approval, submission, reconciliation, recovery, and compensation
- Queue-oriented execution operations console with incident linkage

### Risk And Scheduling

- Unified risk workbench and scheduler workbench snapshots
- Shared risk/scheduler linkage context
- Reviewed middleware actions that write audit, notifications, and incident-aware control-plane state

### Agent Collaboration

- Persisted `session / intent / plan / analysis run / action request / daily run` contracts
- Backend-driven workbench aggregation
- Controlled action handoffs that stay inside approval and risk boundaries
- Daily run operational loop: pre-market brief, intraday monitoring with authority downgrade, and post-market recap with authority reset
- Ask-first queue for agent-initiated actions: trim, exit, cancel, and risk-reduce

### Operations And Control Plane

- Monitoring snapshots, alerts, incidents, audit trail, operator actions, and workflow history
- Workspace-aware account scope and access policy resolution
- Backup, restore dry-run, integrity checks, repair tooling, and persistence posture visibility

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
5. Control-plane tests
6. Runtime tests
7. Workflow-engine tests
8. API tests
9. Worker tests
10. Web tests
11. Web typecheck
12. Production web build

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
- `apps/api/src/main.mjs`
- `apps/api/src/app/index.mjs`
- `apps/worker/src/main.mjs`
- `packages/trading-engine/src/runtime.mjs`
- `packages/control-plane-runtime/src/index.mjs`
- `packages/control-plane-store/src/index.mjs`
- `packages/task-workflow-engine/src/index.mjs`

## Safety Boundaries

- The browser must not hold real broker credentials
- Remote order placement must go through the server gateway
- Agents must not place real trades directly
- Risk and approval controls must not be bypassed by frontend, agent, or execution code
- The current repository should not be treated as a production unattended live-trading deployment
