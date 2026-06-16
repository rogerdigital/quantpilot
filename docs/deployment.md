# QuantPilot Deployment

QuantPilot deployment is a small web console plus API gateway. The active scope supports `simulated`, `paper`, and gated `live` execution.

## Preflight

```bash
npm install
npm run verify
```

## Environment

Start from [.env.example](../.env.example).

Core variables:

- `VITE_REFRESH_MS`
  - Frontend refresh interval. Default: `5000`.
- `VITE_TRADING_MODE`
  - `simulated` or `paper`.
- `VITE_MARKET_DATA_PROVIDER`
  - `simulated`, `custom-http`, or `alpaca`.
- `VITE_MARKET_DATA_HTTP_URL`
  - Required only for `custom-http`.
- `VITE_BROKER_PROVIDER`
  - `simulated`, `custom-http`, or `alpaca`.
- `VITE_BROKER_HTTP_URL`
  - Required only for `custom-http`.
- `GATEWAY_PORT`
  - API gateway port. Default: `8787`.
- `QUANTPILOT_TRADING_MODE`
  - Server mode: `simulated`, `paper`, or `live`.
- `QUANTPILOT_CONTROL_PLANE_NAMESPACE`
  - Local runtime namespace.

### Alpaca / live trading (gateway only)

- `ALPACA_KEY_ID`, `ALPACA_SECRET_KEY`
  - Alpaca API credentials. Never expose via `VITE_*`.
- `ALPACA_USE_PAPER`
  - `true` (default) targets the paper endpoint; `false` targets live.
- `QUANTPILOT_LIVE_TRADING_ACK`
  - Must equal `I_UNDERSTAND_LIVE_TRADING_RISK`. Live trading activates only when
    `QUANTPILOT_TRADING_MODE=live`, `ALPACA_USE_PAPER=false`, valid credentials are
    present, and this ack is set. Any missing gate falls back to non-live behavior.

Do not place broker secrets in `VITE_*` variables.

## Local Runtime

```bash
npm run gateway
npm run dev
```

Open:

```text
http://localhost:8080/
```

## Production Build

```bash
npm run build
```

The web build output is `dist/`.

For SPA hosting, route all frontend paths back to `index.html`.

## Unsupported Deployment Modes

The active scope does not support:

- background task processes
- compute queues
- team administration
- compliance reporting services
- autonomous assistant or LLM runtime services
