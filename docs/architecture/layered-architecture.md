# QuantPilot Lite Layered Architecture

QuantPilot Lite uses a small four-layer shape instead of the previous institutional platform model.

## Layers

**Web Console**

Owns user interaction and visualization for Dashboard, Market, Strategies, Backtest, Execution, Risk and Settings.

**API Gateway**

Owns core HTTP routes, local session, runtime settings, market access, strategy persistence, backtest requests, execution state and risk actions.

**Core Engine**

Owns reusable trading logic: market simulation helpers, backtest calculations, cost and slippage models, execution state transitions and basic risk checks.

**Local Store**

Owns lightweight persistence for settings, strategies, backtest runs, execution state and risk settings.

## Collaboration Rules

- Strategy and backtest code can suggest execution plans, but cannot bypass risk checks.
- Risk checks and kill switch are evaluated before execution actions.
- Browser code never stores broker secrets.
- Lite runtime supports `simulated` and `paper`; it does not expose live trading.

## Active Code Landing Points

- `apps/web`: React console and route-level UI.
- `apps/api`: Node API gateway and server-side provider boundaries.
- `packages/shared-types`: core market, strategy, backtest, execution, risk and settings contracts.
- `packages/trading-engine`: reusable backtest, execution and risk logic.
- `packages/control-plane-store`: lightweight local state.
- `packages/db`: optional storage adapters used by the local store.

## Removed Architecture

The previous seven-layer institutional architecture is archived and no longer active scope. Active code should not depend on Agent orchestration, background workers, compute queues, multi-tenant governance, compliance reports, connector marketplaces or live trading promotion workflows.
