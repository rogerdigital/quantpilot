# QuantPilot Lite Project Structure

QuantPilot Lite is being reduced to a focused core console. The active architecture keeps only the web console, API gateway, core trading engine, shared types and lightweight local persistence.

## Target Structure

```text
quantpilot/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── gateways/
│   │   │   ├── modules/
│   │   │   └── main.ts
│   │   └── test/
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── modules/
│       │   ├── pages/
│       │   └── store/
│       └── vite.config.ts
├── packages/
│   ├── control-plane-store/
│   ├── db/
│   ├── shared-types/
│   └── trading-engine/
├── docs/
│   ├── architecture/
│   ├── archive/
│   └── plans/
├── scripts/
└── package.json
```

## Active Responsibilities

- `apps/web`
  - React console for Dashboard, Market, Strategies, Backtest, Execution, Risk and Settings.
  - Owns route rendering, layout, charts and user-visible workflow state.
- `apps/api`
  - Node API gateway for health, session, market, strategies, backtests, execution, risk and settings.
  - Owns server-side broker/paper boundaries and local persistence access.
- `packages/shared-types`
  - Core contracts shared by web, API and engine.
  - Active type surface is limited to market, strategy, backtest, execution, risk and settings.
- `packages/trading-engine`
  - Backtest, cost/slippage, basic market simulation, execution state and risk checks.
- `packages/control-plane-store`
  - Lightweight local store for settings, strategies, backtest runs, execution state and risk settings.
- `packages/db`
  - Storage adapters retained only when needed by the lightweight store.

## Removed Scope

The following systems are not active QuantPilot Lite scope and should be deleted from runtime code during simplification:

- Background worker platform.
- Agent and LLM provider runtime.
- Workflow orchestration engine.
- Organization, teams and institutional permissions.
- Compute jobs and artifact platform.
- Data, feature, experiment and model registries.
- Compliance reports and operations workbench.
- Connector marketplace and strategy package marketplace.
- Live trading promotion workflow.

Archived documents may still mention these systems for historical context, but active docs and runtime code should not depend on them.
