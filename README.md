# QuantPilot

English is the default README for this repository. For the Chinese edition, see [README.zh-CN.md](/Users/Roger/codex/quantpilot/README.zh-CN.md).

QuantPilot is an AI-native quantitative trading platform under active development. The long-term product target is:

`Web2.0 platform foundations + Web4.0 intelligent agent capability`

This repository is not a production live-trading system. It is an evolving monorepo that already contains a frontend console, backend gateway, async worker, shared runtimes, control-plane storage, and workflow orchestration.

## Product Goal

### Web2.0 Platform Foundations

- User system
- Market data access
- Strategy management
- Backtesting system
- Risk control
- Execution engine
- Dashboard
- Logging and alerting

### Web4.0 Intelligent Agent Capability

- Natural-language goals
- AI-driven market analysis
- AI-generated strategy suggestions
- AI explanations for backtests and live performance
- AI-assisted risk review
- AI-triggered controlled execution flows

## Seven-Layer Target Architecture

### 1. Frontend

The unified entry point for operators. It hosts the dashboard, strategy workspace, risk console, execution console, agent workspace, and notifications center.

Current code locations:

- `apps/web`
- `apps/web/src/pages`
- `apps/web/src/store`
- `apps/web/src/services`

### 2. Backend

The platform control core. It owns APIs, auth, accounts, task orchestration, notifications, audit, monitoring, scheduling, and the coordination of data, strategy, agent, risk, and execution domains.

Current code locations:

- `apps/api`
- `apps/api/src/app`
- `apps/api/src/control-plane`
- `apps/api/src/domains`
- `apps/api/src/modules`
- `packages/control-plane-runtime`

### 3. Data Layer

The stable state layer for market data, user data, trading data, research data, and system events.

Current code locations:

- `packages/db`
- `packages/control-plane-store`
- `apps/web/src/data`

### 4. Strategy Layer

Owns strategy registration, signal generation, historical backtesting, parameter exploration, and performance evaluation.

Current code locations:

- `packages/trading-engine/src/strategy`
- `apps/api/src/domains/strategy`
- `apps/api/src/domains/backtest`
- `apps/api/src/modules/strategy`
- `apps/api/src/modules/backtest`

### 5. Agent Layer

Interprets goals, organizes analysis, calls tools, explains outcomes, and submits controlled action requests within approval and risk boundaries.

Current code locations:

- `apps/web/src/pages/agent`
- `apps/web/src/services/agentTools.ts`
- `apps/api/src/domains/agent`
- `apps/api/src/modules/agent`

### 6. Risk Layer

Acts as the final gate before execution. It owns position limits, risk checks, thresholds, circuit breakers, and approval controls.

Current code locations:

- `packages/trading-engine/src/risk`
- `apps/api/src/domains/risk`
- `apps/api/src/modules/risk`
- `apps/worker/src/tasks/risk-scan-task.mjs`

### 7. Execution Layer

Transforms approved and risk-cleared plans into execution activity, including broker connectivity, order management, state sync, and recovery paths.

Current code locations:

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

## Current Implementation Status

The repository is still in active R&D. The current summary is:

The platform skeleton is stable, the minimum control-plane loop is working, the research loop has been closed, and the execution loop is now being deepened into a real trading middleware path.

### Already Implemented

- The monorepo split across `web / api / worker / packages/*` is stable.
- The frontend console already covers `dashboard / market / strategies / backtest / risk / execution / agent / notifications / settings`.
- The backend already has the minimum platform-control surface, including `auth / audit / notification / risk / scheduler / task-orchestrator / strategy / backtest / agent`.
- `monitoring` is in prototype-plus mode, with backend summaries for `broker / market / worker / workflow / risk / queues`.
- Workers persist `monitoring snapshots / alerts`, so the notifications console and operations views have traceable monitoring history.
- The notifications center has evolved into an `incident / investigation` console with evidence timelines, response activity, object inspection, and response checklists.
- Incident queues support `summary / owner load / source mix / aging / bulk actions`, including assignment, state transitions, and response notes.
- The incident console already exposes operational posture such as `ack overdue / blocked tasks / owner hotspots / next actions / handoff / next step`.
- Control-plane feeds in notifications are converging on a unified `boards + context + feed detail` interaction pattern.
- The platform now ships an `operations workbench` snapshot that aggregates monitoring, incidents, scheduler, connectivity, and control-plane trails.
- Risk Console now consumes a unified `risk workbench` snapshot instead of relying on frontend-assembled runtime state.
- Workers now handle notification dispatch, risk scans, scheduler ticks, workflow maintenance, and workflow execution.
- Shared runtime logic has been split into `trading-engine / control-plane-runtime / task-workflow-engine / shared-types`.
- Control-plane persistence lives in `control-plane-store`, currently backed by file-based storage.
- The minimum workflow loop is operational: `API enqueue -> worker execution -> control-plane persistence -> risk review -> execution-plan preparation / notification fanout`.
- `strategy catalog` already has structured registry boundaries and per-strategy research context.
- `backtest runs` support listing, enqueue, manual review, and detail reads with linked workflow and strategy context.
- `research task backbone` is live: backtest enqueue, worker execution, and manual review all map into unified research tasks.
- `backtest result model` is versioned and no longer replayed only from audit metadata.
- `research workspace integration` now links `strategy -> result -> execution prep`.
- `evaluation and promotion flow` is live: reviewed results become `research evaluations`, and promotion is gated by the latest evaluation verdict.
- `research report workflow` runs asynchronously through worker workflows and persists formal research-report assets.
- `research workbench` aggregates results, evaluations, reports, governance queues, and coverage gaps.
- `research governance actions` support batch promote / rerun / reevaluate operations with unified audit, notification, and operator-action history.
- `research baselines and champions` can now be formally assigned and reused by comparison and governance views.
- `research comparison and baseline analysis` provides baseline/champion deltas and governance insight summaries.
- `research timeline and replay` unifies `audit / task / workflow / run / result / evaluation / report / governance` into a strategy replay timeline.
- `execution plans / runtime events / account snapshots / execution ledger` already have standalone query APIs.
- `execution lifecycle backbone` is live: `execution candidate handoff -> execution workflow -> execution plan -> execution run -> order lifecycle`.
- `execution order state machine` already supports `broker acknowledged / partial fill / cancel` lifecycle progression.
- `execution reconciliation` compares execution order states, broker snapshots, and positions and exposes `aligned / attention / drift / missing snapshot`.
- `execution recovery workbench` derives recovery posture from workflow retry/failure, cancelled/failed plans, and reconciliation drift.
- `broker event ingestion` is live: broker `acknowledged / partial fill / filled / rejected / cancelled` reports are now persisted as structured broker events and feed order-state aggregation and execution timelines.
- The Overview page consumes backend `monitoring status`.
- `user-account` now owns persisted `profile / preferences / access / broker bindings`.
- Account mutations and broker-binding changes are audited.
- `auth/session` is now driven by persisted account-access policy instead of frontend-only demo constants.
- The account domain has converged into a unified `account workspace` snapshot for profile, preferences, access, broker summary, role templates, and session state.
- `broker bindings` now expose health posture and pending-state summaries.
- Permission guardrails are becoming consistent across backend `403` contracts and frontend permission copy.
- Settings, Risk, Execution, and Agent pages already surface structured permission restrictions and API error explanations.

### Current Boundaries

- The system is still not suitable for unattended live trading.
- Multi-tenant user isolation and full RBAC are not complete yet.
- Market ingestion, historical data, and research persistence are still simplified.
- The agent layer is still a controlled collaboration prototype, not a full planner/memory/tool-router system.
- The execution engine is in the early-to-mid part of Stage 3. It already has an order state machine, structured reconciliation, recovery posture, and broker-event ingestion, but it is still far from complete broker-report handling, automated compensation policy, and multi-broker abstraction.

## Development Principles

- Extend the system inside the existing layered boundaries instead of collapsing back into a monolith.
- Prefer shared domain logic in `packages/*` over duplicated frontend/backend implementations.
- Agents must not bypass risk or execution boundaries.
- Risk remains the final gate before execution.
- Every critical state change should have audit, notification, and recovery semantics.
- The frontend should gradually become a state consumer and operator surface, while orchestration moves into backend and worker layers.

## Delivery Stages

### Foundation Stage: Architecture Skeleton

- Monorepo boundaries and the seven-layer target architecture are established.
- The minimum control-plane loop is operational.
- The frontend workbench, backend module skeleton, shared runtimes, and control-plane storage are ready for iterative delivery.

### Stage 1: Platform Foundations Productization (Closed)

- Stage 1 closeout definition, non-goals, and Stage 2 entry conditions live in [docs/architecture/stage-1-closeout.md](/Users/Roger/codex/quantpilot/docs/architecture/stage-1-closeout.md).
- Stage 1 delivered account and permission foundations, incident and investigation console, operations workbench, risk workbench, and the first productized version of research/execution data boundaries.

### Stage 2: Research And Strategy Loop (Closed)

- Stage 2 closeout definition, non-goals, and Stage 3 entry conditions live in [docs/architecture/stage-2-closeout.md](/Users/Roger/codex/quantpilot/docs/architecture/stage-2-closeout.md).
- Stage 2 delivered `Research Task Backbone`, `Backtest Result Model`, `Research Workspace Integration`, `Evaluation And Promotion Flow`, `Research Report Workflow`, `Research Workbench`, `Research Governance Actions`, `Research Baselines And Champions`, `Research Comparison And Baseline Analysis`, `Research Timeline And Replay`, and `Execution Candidate Handoff`.
- The research loop now forms a unified async chain: `task -> workflow -> result -> evaluation -> report -> compare -> replay -> govern -> handoff -> act -> promote`.

### Stage 3: Execution Loop And Trading Middleware

- Upgrade execution into a real `broker connector / order manager / execution engine / fill handler / failure handler`.
- Complete order state machine coverage, position sync, account-equity sync, and exception compensation.
- Build the full mapping between execution plans and real orders, fills, positions, and account state.
- Make every risk-cleared plan enter a traceable, recoverable, and auditable execution path.

### Stage 4: Risk And Scheduling Middleware Deepening

- Expand risk from basic scanning into `position / portfolio / drawdown / volatility / compliance / emergency brake`.
- Upgrade scheduler from tick logging into a real pre-market / intraday / post-market / timed orchestration hub.
- Complete the loop for risk blocking, manual approval, circuit breaking, recovery, and notification linkage.
- Give the control plane a stronger model for retry, cancel, recovery, compensation, and operator intervention.

### Stage 5: Controlled Agent Collaboration

- Implement `intent parser / planner / tool router / analysis engine / explanation engine / approval controller`.
- Start with read-only analysis and explanation, then expand into controlled action requests.
- Keep every agent action inside audit, risk, approval, and execution guardrails.

### Stage 6: Productionization And Professionalization

- Upgrade database, cache, object storage, logging, alerting, and deployment infrastructure.
- Complete tenancy, permissions, subscriptions, observability, backup/recovery, and operator tooling.
- Add live-run stability metrics, replay, failure drills, and release workflows.
- Move the system from “usable for R&D” to “operable as a professional platform”.

## Directory Notes

### `apps/web`

The frontend console for routing, layouts, interaction surfaces, and state consumption.

### `apps/api`

The backend entrypoint and service aggregation layer, internally organized around:

- `app`: request and routing entrypoints
- `control-plane`: orchestration and control-plane workflows
- `domains`: execution, risk, research, and agent domain logic
- `modules`: stable module boundaries and compatibility exports

### `apps/worker`

The async worker process for background jobs, outbox dispatch, workflow progression, and maintenance tasks.

### `packages/trading-engine`

Shared trading runtime logic for market progression, strategy output, risk decisions, execution intent, and control-plane state composition.

### `packages/task-workflow-engine`

Shared workflow execution layer with workflow executor registry and execution paths.

### `packages/control-plane-runtime`

Shared API/worker assembly layer for workflow lifecycle and control-plane fanout.

### `packages/control-plane-store`

Persistence for notifications, risk events, scheduler ticks, audit records, workflow runs, operator actions, incidents, and execution state.

### `packages/db`

Low-level storage abstraction. It currently provides a file adapter and a base store boundary for future database migration.

### `packages/shared-types`

Shared frontend/backend type definitions.

## Development Commands

```bash
npm install
npm run dev
npm run gateway
npm run worker
npm run typecheck
npm run test:control-plane
npm run test:runtime
npm run test:engine
npm run test:api
npm run test:worker
npm run verify
```

After dependency installation, repository git hooks are automatically pointed at `.githooks`. The default setup enables `pre-push`, which runs `npm run verify` before a push so typecheck or production-build failures do not wait until CI.

Default ports:

- Web: `http://127.0.0.1:8080`
- API: `http://127.0.0.1:8787`

## Validation

`npm run verify` runs:

1. workspace integrity checks
2. lockfile sync checks
3. stage-doc consistency checks
4. control-plane tests
5. runtime tests
6. task-workflow-engine tests
7. API tests
8. worker tests
9. web tests
10. web typecheck
11. web build

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

- The browser must not hold real broker credentials.
- Remote order placement must go through the server gateway.
- Agents must not place real trades directly.
- Risk and approval controls must not be bypassed by frontend, agent, or execution code.

## Current Development Focus

Stage 1 and Stage 2 are closed. The active focus is now Stage 3: execution loop and trading middleware.

1. Build on the delivered `execution candidate handoff -> execution workflow -> execution plan -> execution run -> order lifecycle` backbone with stronger broker-report handling, order sync, account/position reconciliation, and compensation paths.
2. Keep approval, broker sync, reconciliation, settlement, failure transfer, cancellation, and compensation logic converging into lifecycle services and worker flows instead of page-local logic.
3. Extend execution, risk, and scheduling around the existing research replay, governance, and handoff contracts instead of rebuilding research context.
4. Preserve the Stage 1 and Stage 2 baselines for accounts, incidents, operations, risk workbench, research hub, and execution handoff while Stage 3 expands.
5. Before multi-broker live connectivity and more advanced retry/compensation work, keep stabilizing the execution workbench, order lifecycle contract, broker-event ingestion, and account/position sync contracts.

The delivery cadence remains:

`design alignment -> incremental implementation -> automated validation -> next capability layer`
