# QuantPilot Operations Handbook

This handbook covers the lightweight local development and smoke-test flow for QuantPilot.

## Scope

QuantPilot operations are intentionally small:

- Start the API gateway.
- Start the web console.
- Confirm the API gateway is reachable.
- Confirm the runtime mode (`simulated`, `paper`, or `live`) is selected.
- Use the kill switch when execution should be blocked.

This handbook does not cover background task processes, compute queues, reporting services or team administration.

## Startup Checklist

```bash
npm install
npm run typecheck
npm run gateway
npm run dev
```

Open:

```text
http://localhost:8080/
```

Expected:

- Dashboard renders.
- API health route returns ok.
- Settings shows `simulated`, `paper`, or `live`.
- Live trading is exposed only when all live gates are satisfied.

## Verification Commands

Use these during development:

```bash
npm run test:api
npm run test:web
npm run test:engine
npm run typecheck
npm run build
```

Use the full gate before merging:

```bash
npm run verify
```

## Runtime Modes

Supported:

- `simulated`
- `paper`
- `live` (off by default; requires `QUANTPILOT_TRADING_MODE=live`, `ALPACA_USE_PAPER=false`, valid Alpaca credentials, and `QUANTPILOT_LIVE_TRADING_ACK=I_UNDERSTAND_LIVE_TRADING_RISK`)

If live trading activates without all four gates satisfied, treat it as a safety bug.

## Recovery

If the app fails locally:

1. Stop gateway and web dev server.
2. Run `npm run typecheck`.
3. Run the affected test command.
4. Check `.env` values against `.env.example`.
5. Restart `npm run gateway` and `npm run dev`.

For local state issues, restart the API gateway and web dev server after preserving any state you still need.
