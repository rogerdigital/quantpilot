# QuantPilot Project Structure

QuantPilot is a focused core console. The active architecture keeps the web console, API gateway, core trading engine, shared types and a small shared UI component package.

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
│   ├── shared-types/
│   ├── trading-engine/
│   └── ui/
├── docs/
│   ├── architecture/
│   ├── archive/
│   └── plans/
├── scripts/
└── package.json
```

## Active Responsibilities

- `apps/web`
  - React console for Dashboard, Market, Trading, Strategies, Backtest, Execution, Risk and Settings.
  - Owns route rendering, layout, charts and user-visible state.
- `apps/api`
  - Node API gateway for health, session, market, strategies, backtests, execution, trading, risk and settings.
  - Owns server-side simulated/paper/live boundaries, Alpaca + custom-http broker adapters and in-process data.
- `packages/shared-types`
  - Core contracts shared by web, API and engine.
  - Active type surface is limited to market, strategy, backtest, execution, risk and settings.
- `packages/trading-engine`
  - Backtest, cost/slippage, basic market simulation, execution state and risk checks.
- `packages/ui`
  - Shared vanilla-extract UI components (Button, Card, Input, Select, Table, Skeleton).

## Removed Scope

The following systems are not active QuantPilot scope and should not be reintroduced into runtime code unless the scope is explicitly changed first:

- Background task platform.
- Autonomous assistant and LLM provider runtime.
- Workflow orchestration engine.
- Organization, teams and institutional permissions.
- Compute jobs and artifact platform.
- Data, feature, experiment and model registries.
- Compliance reports and operations workbench.
- Connector marketplace and strategy package marketplace.

Archived documents may still mention these systems for historical context, but active docs and runtime code should not depend on them.
