# QuantPilot

[English](./README.md) | [中文](./README.zh-CN.md)

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
- `monitoring` is in prototype-plus mode, with backend summaries for `broker / market / worker / workflow / risk / queues`, including workflow retry posture, queue backlog posture, and worker freshness metrics.
- Workers persist `monitoring snapshots / alerts`, so the notifications console and operations views have traceable monitoring history.
- The notifications center has evolved into an `incident / investigation` console with evidence timelines, response activity, object inspection, and response checklists.
- Incident queues support `summary / owner load / source mix / aging / bulk actions`, including assignment, state transitions, and response notes.
- The incident console already exposes operational posture such as `ack overdue / blocked tasks / owner hotspots / next actions / handoff / next step`.
- Control-plane feeds in notifications are converging on a unified `boards + context + feed detail` interaction pattern.
- The platform now ships an `operations workbench` snapshot that aggregates monitoring, incidents, scheduler, connectivity, and control-plane trails, plus observability posture for worker lag, queue backlog, and workflow reliability.
- Control-plane maintenance tooling now supports backup export, restore dry runs, integrity checks, and workflow retry repair through shared store contracts, API routes, and a CLI entrypoint.
- Risk Console now consumes a unified `risk workbench` snapshot instead of relying on frontend-assembled runtime state.
- Workers now handle notification dispatch, risk scans, scheduler ticks, workflow maintenance, and workflow execution.
- Shared runtime logic has been split into `trading-engine / control-plane-runtime / task-workflow-engine / shared-types`.
- Control-plane persistence lives in `control-plane-store`, and now exposes both `file` and `db` storage adapter foundations while keeping the existing file-backed path as the default runtime.
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
- `execution exception and retry policies` now turn broker-event history into retry budget, compensation posture, and incident linkage so repeated rejects or drift can escalate into execution incidents instead of staying as raw broker events.
- `execution operations console` now exposes approval, retry, compensation, incident, and active-routing queues plus owner load, so the execution desk can work from a queue-based operating view instead of only inspecting individual plans.
- `execution account reconciliation` now compares cash, buying power, equity, deployed capital, residual capital, and snapshot cadence in addition to order and position drift, and the execution console surfaces those account-level signals directly.
- `execution compensation automation` now turns compensation posture into a structured plan with automated reconciliation refresh, incident sync, and operator follow-up steps, and exposes a dedicated `compensate` action from the execution desk.
- `execution bulk queue actions` now let the execution desk select plans from approval, retry, compensation, and incident queues and run bulk `approve / reconcile / compensate / recover` actions from the same console.
- `execution incident triage` now lives in the execution console: queue-focus chips can filter the ledger by operational backlog, and linked incidents can be assigned, advanced, resolved, and annotated without leaving the execution workflow.
- `risk governance workbench` now expands the risk console into a richer middleware snapshot with portfolio concentration, drawdown/compliance alerts, scheduler attention, and operator runbook actions.
- `scheduler operations workbench` now turns scheduler windows into a middleware surface with current-phase posture, cycle drift, scheduler incidents, notification pressure, risk linkage, and operator runbook actions.
- `risk scheduler linkage` now gives both consoles a shared linkage snapshot so the same scheduler window, risk events, incidents, cycle drift, and notifications can be reviewed through one middleware context instead of two disconnected boards.
- `scheduler orchestration actions` now turn scheduler runbook items into real control-plane operations: operator actions, scheduler ticks, cycle records, and scheduler incident triage are written together from one scheduler action API and notifications-console workflow.
- `risk middleware policy actions` now turn the risk runbook into real policy operations: the risk console can execute reviewed policy actions that write operator history, append risk-policy events, notify the control plane, and triage linked risk incidents from the same workbench.
- Agent collaboration now has formal control-plane contracts for `session / intent / plan / analysis run / action request`, rather than frontend-only prompt scaffolding.
- Agent prompts now move through persisted `intent parsing -> planning -> read-only analysis -> explanation` contracts before any downstream handoff is attempted.
- Agent now exposes a backend `workbench` view with recent explanations, pending action requests, and operator timeline context so the frontend can operate as a real collaboration console.
- Agent sessions can now submit controlled action handoffs from completed analyses, and request approval outcomes are linked back into session detail and operator timeline contracts.
- The Overview page consumes backend `monitoring status`.
- `user-account` now owns persisted `profile / preferences / access / broker bindings`.
- `user-account` now persists role templates and access policies with `default permissions / grants / revokes / effective permissions`, instead of relying on demo-only role constants.
- `tenant / workspace` foundations are now formalized in the account domain, including workspace memberships, current-workspace session context, and controlled workspace switching.
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
- Stage 4 is now closed: risk and scheduler now expose stable middleware contracts for workbench snapshots, linkage context, reviewed operator actions, and incident-aware control-plane fanout.

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

- Stage 1 closeout definition, non-goals, and Stage 2 entry conditions live in [docs/architecture/stage-1-closeout.md](./docs/architecture/stage-1-closeout.md).
- Stage 1 delivered account and permission foundations, incident and investigation console, operations workbench, risk workbench, and the first productized version of research/execution data boundaries.

### Stage 2: Research And Strategy Loop (Closed)

- Stage 2 closeout definition, non-goals, and Stage 3 entry conditions live in [docs/architecture/stage-2-closeout.md](./docs/architecture/stage-2-closeout.md).
- Stage 2 delivered `Research Task Backbone`, `Backtest Result Model`, `Research Workspace Integration`, `Evaluation And Promotion Flow`, `Research Report Workflow`, `Research Workbench`, `Research Governance Actions`, `Research Baselines And Champions`, `Research Comparison And Baseline Analysis`, `Research Timeline And Replay`, and `Execution Candidate Handoff`.
- The research loop now forms a unified async chain: `task -> workflow -> result -> evaluation -> report -> compare -> replay -> govern -> handoff -> act -> promote`.

### Stage 3: Execution Loop And Trading Middleware (Closed)

- Stage 3 closeout definition, non-goals, and Stage 4 entry conditions live in [docs/architecture/stage-3-closeout.md](./docs/architecture/stage-3-closeout.md).
- Stage 3 delivered `Execution Lifecycle Backbone`, `Execution Order State Machine`, `Execution Reconciliation Workbench`, `Execution Recovery Workbench`, `Broker Event Ingestion`, `Execution Exception And Retry Policies`, `Execution Operations Console`, `Execution Account Reconciliation`, `Execution Compensation Automation`, `Execution Bulk Queue Actions`, and `Execution Incident Triage`.
- The execution loop now forms a unified chain: `handoff -> workflow -> plan -> run -> order state -> broker event -> reconcile -> compensate -> recover -> incident -> operate`.

### Stage 4: Risk And Scheduling Middleware Deepening (Closed)

- Stage 4 closeout definition, non-goals, and Stage 5 entry conditions live in [docs/architecture/stage-4-closeout.md](./docs/architecture/stage-4-closeout.md).
- Stage 4 delivered `Risk Governance Workbench`, `Scheduler Operations Workbench`, `Risk Scheduler Linkage`, `Scheduler Orchestration Actions`, and `Risk Middleware Policy Actions`.
- The middleware loop now forms a unified chain: `risk/scheduler snapshot -> linkage -> runbook -> reviewed action -> operator history / notification / incident triage`.

### Stage 5: Controlled Agent Collaboration (Closed)

- Stage 5 closeout definition, non-goals, and Stage 6 entry conditions live in [docs/architecture/stage-5-closeout.md](./docs/architecture/stage-5-closeout.md).
- Stage 5 delivered `Agent Contracts`, `Intent Parsing And Planning`, `Analysis Runs`, `Agent Workbench`, and `Controlled Action Handoffs`.
- The agent loop now forms a unified chain: `prompt -> intent -> plan -> analysis -> explanation -> action request -> approval -> downstream workflow`.

### Stage 6: Productionization And Professionalization

- The first productionization step is in place: control-plane storage now has `file / db` adapter foundations.
- Access policy foundations now persist role templates and effective permission overlays, which prepares the platform for fuller RBAC and multi-user boundaries.
- Workspace and tenant foundations now persist account workspaces and stamp current scope metadata into new control-plane writes, which prepares later isolation and filtering work.
- Monitoring and operations workbench now expose worker freshness, workflow retry posture, queue backlog posture, and observability summary fields for operator triage.
- Control-plane maintenance now supports backup export, restore dry runs, integrity validation, and workflow retry repair as the first recovery and maintenance baseline.
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

Low-level storage abstraction. It now provides `file` and `db` control-plane adapter foundations so the current runtime can stay file-backed while later work migrates repositories toward a fuller database-backed path.

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

Stage 1, Stage 2, Stage 3, and Stage 4 are closed. The active focus is now Stage 5: controlled agent collaboration.

1. Build an `agent collaboration workbench` on top of the now-stable research, execution, risk, scheduler, and incident middleware contracts.
2. Introduce `intent parsing / planner / tool routing / explanation` as explicit backend-facing contracts instead of frontend-only assistant surfaces.
   The shared contracts for `session / intent / plan / analysis run` are now in place; the next step is wiring parsing and routing onto them.
3. Keep every agent request inside the existing audit, risk, approval, execution, and control-plane boundaries instead of creating a parallel action path.
4. Preserve the Stage 1 through Stage 4 baselines for accounts, incidents, research hub, execution workbench, risk middleware, scheduler workbench, and linkage contracts while agent capabilities grow.
5. Before moving into stronger autonomy, stabilize the read-only analysis and controlled action-request loop that will sit above the now-closed risk and scheduling middleware layer.

The delivery cadence remains:

`design alignment -> incremental implementation -> automated validation -> next capability layer`
