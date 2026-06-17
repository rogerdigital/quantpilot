# QuantPilot Layered Architecture

QuantPilot uses a small four-layer shape instead of the previous institutional platform model.

## Layers

**Web Console**

Owns user interaction and visualization for Dashboard, Market, Strategies, Backtest, Execution, Risk and Settings.

**API Gateway**

Owns core HTTP routes, local session, runtime settings, market access, strategy persistence, backtest requests, execution state and risk actions.

**Core Engine**

Owns reusable trading logic: market simulation helpers, backtest calculations, cost and slippage models, execution state transitions and basic risk checks.

**Local Runtime State**

Owns in-process data for strategies, backtest runs, execution state and risk settings.

## Collaboration Rules

- Strategy and backtest code can suggest execution plans, but cannot bypass risk checks.
- Risk checks and kill switch are evaluated before execution actions.
- Browser code never stores broker secrets; Alpaca credentials live only in the gateway.
- Runtime supports `simulated`, `paper`, and gated `live` (see deployment guide for the live gates).

## Active Code Landing Points

- `apps/web`: React console and route-level UI.
- `apps/api`: Node API gateway, Alpaca/custom-http broker boundaries and server-side provider boundaries.
- `packages/shared-types`: core market, strategy, backtest, execution, risk and settings contracts.
- `packages/trading-engine`: reusable backtest, execution and risk logic.
- `packages/ui`: shared vanilla-extract UI components.

## Removed Architecture

The previous seven-layer institutional architecture is archived and no longer active scope. Active code should not depend on autonomous assistant orchestration, background task processes, compute queues, team governance, reporting services or connector marketplaces.
