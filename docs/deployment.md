# QuantPilot Lite Deployment

QuantPilot Lite deployment is a small web console plus API gateway. The active scope supports simulated and paper execution only.

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
  - `simulated` or `custom-http`.
- `VITE_MARKET_DATA_HTTP_URL`
  - Required only for `custom-http`.
- `VITE_BROKER_PROVIDER`
  - `simulated` or `custom-http`.
- `VITE_BROKER_HTTP_URL`
  - Required only for `custom-http`.
- `GATEWAY_PORT`
  - API gateway port. Default: `8787`.
- `QUANTPILOT_TRADING_MODE`
  - Server mode: `simulated` or `paper`.
- `QUANTPILOT_CONTROL_PLANE_NAMESPACE`
  - Local store namespace.

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

The Lite scope does not support:

- live trading
- background workers
- compute queues
- multi-tenant administration
- compliance reporting services
- Agent or LLM runtime services
