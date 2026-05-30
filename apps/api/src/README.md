# API Source Layout

`apps/api/src/` is now a small QuantPilot Lite gateway.

- `app/`: request entry, route mounting and core route handlers.
- `app/routes/core-data.ts`: in-process Lite data used by strategy, backtest, risk, execution and trading endpoints.
- `modules/auth/`: local single-user session and permission catalog.
- `gateways/`: broker and market adapter helpers retained for paper/simulated integrations.
- `lib/`: environment, logging and persistence helpers.

Removed systems such as autonomous assistant flows, task orchestration, workflow runtime, background dispatch, monitoring, notification, operations and institutional user-account services should not be reintroduced unless the Lite scope is explicitly changed first.
