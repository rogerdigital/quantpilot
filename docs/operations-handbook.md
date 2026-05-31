# QuantPilot Lite Operations Handbook

This handbook covers the lightweight local development and smoke-test flow for QuantPilot Lite.

## Scope

QuantPilot Lite operations are intentionally small:

- Start the API gateway.
- Start the web console.
- Confirm the API gateway is reachable.
- Confirm simulated or paper mode is selected.
- Use the kill switch when execution should be blocked.

This handbook does not cover background task processes, compute queues, reporting services, team administration or live trading operations.

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
- Settings shows `simulated` or `paper`.
- No UI exposes live trading.

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

Unsupported:

- `live`

If any active UI or runtime path still offers live trading, treat it as a simplification bug.

## Recovery

If the app fails locally:

1. Stop gateway and web dev server.
2. Run `npm run typecheck`.
3. Run the affected test command.
4. Check `.env` values against `.env.example`.
5. Restart `npm run gateway` and `npm run dev`.

For local state issues, restart the API gateway and web dev server after preserving any state you still need.
