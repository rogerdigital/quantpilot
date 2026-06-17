# API Source Layout

`apps/api/src/` is a small QuantPilot gateway.

- `app/`: request entry, route mounting and core route handlers.
- `app/routes/core-data.ts`: in-process data used by strategy, backtest, risk, execution and trading endpoints.
- `modules/auth/`: local single-user session and permission catalog.
- `gateways/`: Alpaca client/config and broker/market adapter helpers for simulated, paper, live and custom-http integrations.
- `lib/`: environment, logging and persistence helpers.

Removed systems such as autonomous assistant flows, task orchestration, workflow runtime, background dispatch, monitoring, notification, operations and institutional user-account services should not be reintroduced unless the scope is explicitly changed first.
