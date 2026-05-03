# QuantPilot

AI-native quantitative trading platform — research, backtest, execute, and manage risk through a web console with controlled agent collaboration.

> **Not a production live-trading system.** QuantPilot is a platform skeleton and operating surface for controlled quantitative trading workflows.

## Quick Start

**Prerequisites:** Node.js 20+, npm 10+

```bash
npm install
npm run dev        # Web UI — http://127.0.0.1:8080
npm run gateway    # API gateway — http://127.0.0.1:8787
npm run worker     # Background workers
```

For real broker or LLM integration, copy `.env.example` to `.env` and configure providers. Validate with:

```bash
npm run check:runtime-env -- --env-file .env
```

## Architecture

```
apps/
├── api/        API gateway (Node.js)
├── web/        React SPA (Vite + Vanilla Extract)
└── worker/     Background workers

packages/
├── trading-engine/          Strategy, backtest, risk analytics, execution
├── task-workflow-engine/    Workflow orchestration
├── control-plane-runtime/   Runtime context
├── control-plane-store/     Persistence adapters (file / SQLite)
├── llm-provider/            LLM abstraction (Claude, OpenAI)
├── db/                      Database adapter (SQLite + Drizzle)
└── shared-types/            Shared TypeScript contracts
```

**Four operating loops:** Research → Execution → Middleware (risk/scheduler) → Agent collaboration.

## Feature Highlights

- **Research & Strategy** — Strategy catalog, event-driven backtesting (Sharpe, max drawdown, win-rate, turnover), governance, comparison, and structured handoff to execution
- **Execution** — Execution plans, broker-event ingestion, reconciliation, recovery, trading terminal with BUY/SELL order submission
- **Risk & Scheduling** — Risk workbench, Historical VaR (95%), CVaR, Beta, HHI concentration, scheduler workbench, reviewed middleware actions
- **Agent Collaboration** — Session/intent/plan/analysis/action contracts, daily run loop (pre-market brief, intraday monitor, post-market recap), ask-first queue for agent-initiated actions
- **Real-Time Push** — SSE for live state updates, frontend polling as 15-second fallback
- **Charts** — lightweight-charts v5: Equity, Candlestick, Signal Bar charts with OHLCV data hooks
- **Auth & Security** — JWT authentication, AES-256-GCM broker key encryption, API key masking
- **Operations** — Monitoring, incidents, audit trail, backup/restore, integrity checks, SQLite WAL storage

## Commands

```bash
# Development
npm run dev                  # Start web dev server
npm run gateway              # Start API gateway
npm run worker               # Start background worker

# Testing
npm run test:web             # Vitest web tests
npm run test:api             # API tests (node --test)
npm run test:engine          # Trading engine tests
npm run test:runtime         # Runtime tests
npm run test:control-plane   # Control-plane store tests
npm run test:worker          # Worker tests

# Validation
npm run typecheck            # TypeScript check
npm run build                # Production build
npm run verify               # Full validation (lint + tests + typecheck + build)
```

Pre-push hook runs `npm run verify` automatically.

## Documentation

- [Contributing Guide](./CONTRIBUTING.md)
- [Operations Handbook](./docs/operations-handbook.md)
- [Deployment Guide](./docs/deployment.md)
- [Control-Plane Migrations](./docs/control-plane-migrations.md)
- [Project Structure](./docs/architecture/project-structure.md)

### Architecture History

The staged delivery roadmap is closed. Stage documents serve as architecture history and contract references:

- [Stage 1](./docs/architecture/stage-1-closeout.md) · [Stage 2](./docs/architecture/stage-2-closeout.md) · [Stage 3](./docs/architecture/stage-3-closeout.md) · [Stage 4](./docs/architecture/stage-4-closeout.md) · [Stage 5](./docs/architecture/stage-5-closeout.md) · [Stage 6](./docs/architecture/stage-6-closeout.md) · [Stage 7](./docs/architecture/stage-7-closeout.md)

## Safety Boundaries

- Browser never holds real broker credentials
- Remote order placement goes through the server gateway only
- Agents cannot place real trades directly
- Risk and approval controls cannot be bypassed
- This is not a production unattended live-trading deployment

## License

[MIT](./LICENSE)
