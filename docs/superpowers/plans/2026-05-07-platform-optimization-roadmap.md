# QuantPilot Platform Optimization Roadmap

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Six-dimension optimization covering product positioning, feature completeness, architecture, code quality, UI, and interaction design. Ground-up analysis against industry standards (QuantConnect, Alpaca, TradingView, Bloomberg Terminal).

**Architecture:** Extend existing monorepo structure. Each phase is independently shippable. Phase ordering reflects dependency chain — later phases build on earlier ones.

**Tech Stack:** React 18, TypeScript, Vite, Vanilla Extract, Node ESM, npm workspaces, Vitest, `node --test`, control-plane runtime/store.

---

## Phase Overview

| Phase | Dimension | Branch Prefix | Est. Commits |
|-------|-----------|---------------|-------------|
| 1 | Code Quality | `fix/code-quality` | 6 |
| 2 | Architecture | `feat/infra-upgrade` | 10 |
| 3 | Feature Completeness | `feat/core-features` | 14 |
| 4 | UI Interface | `feat/design-system` | 8 |
| 5 | Interaction Design | `feat/ux-interactions` | 7 |
| 6 | Product Positioning | `feat/platform-features` | 8 |

**Total: ~53 commits across 6 phases**

---

## Phase 1: Code Quality (fix/code-quality)

> Dependency: None. Foundation for all later phases.

### 1.1 Enable TypeScript Strict Mode

**Branch:** `fix/code-quality/ts-strict`
**Commits:** 2

**Commit 1: `chore: enable TypeScript strict mode in shared-types`**
- [ ] Edit `packages/shared-types/tsconfig.json`: set `"strict": true`
- [ ] Fix all resulting type errors in `packages/shared-types/src/`
  - Add explicit return types to exported functions
  - Add `undefined` checks for optional properties used without guard
  - Replace `any` with proper types
- [ ] Run `npx tsc --noEmit -p packages/shared-types` to verify zero errors
- [ ] Run `npm run test:web` to verify no regressions

**Commit 2: `chore: enable TypeScript strict mode across all packages`**
- [ ] Enable `strict: true` in each tsconfig: `packages/trading-engine`, `packages/task-workflow-engine`, `packages/control-plane-runtime`, `apps/web`
- [ ] Fix type errors per package, one package per logical change:
  - `packages/trading-engine/`: add null guards on market data access, type backtest result shapes
  - `packages/task-workflow-engine/`: type workflow state transitions explicitly
  - `packages/control-plane-runtime/`: type domain service return values
  - `apps/web/`: fix React event handler types, add generic type params to hooks
- [ ] Run `npm run typecheck` to verify zero errors across workspace
- [ ] Run `npm run verify` for full validation

### 1.2 Trading Engine Test Suite

**Branch:** `fix/code-quality/trading-engine-tests`
**Commits:** 2

**Commit 1: `test(trading-engine): add unit tests for core calculations`**
- [ ] Create `packages/trading-engine/test/backtest-engine.test.mjs`
  - Test: P&L calculation with known inputs/outputs (10+ cases)
  - Test: drawdown calculation (peak-to-trough, underwater curve)
  - Test: Sharpe ratio, Sortino ratio, max drawdown duration
  - Test: equity curve generation with periodic contributions
  - Test: commission/slippage deduction accuracy
- [ ] Create `packages/trading-engine/test/risk-calculator.test.mjs`
  - Test: position sizing (fixed fractional, Kelly criterion)
  - Test: portfolio heat calculation
  - Test: correlation matrix computation
  - Test: VaR calculation (historical method with known dataset)
- [ ] Create `packages/trading-engine/test/strategy-runner.test.mjs`
  - Test: strategy signal generation (golden cross, RSI, MACD)
  - Test: signal-to-order conversion logic
  - Test: multi-strategy aggregation and conflict resolution
- [ ] All tests pass with `node --test`

**Commit 2: `test(trading-engine): add integration tests for execution and market modules`**
- [ ] Create `packages/trading-engine/test/execution-engine.test.mjs`
  - Test: order lifecycle (create → submit → fill → settle)
  - Test: partial fill handling (50% fill, then remainder)
  - Test: order rejection scenarios (insufficient margin, market closed)
  - Test: stop-loss and take-profit trigger mechanics
- [ ] Create `packages/trading-engine/test/market-data.test.mjs`
  - Test: OHLCV bar construction from tick stream
  - Test: order book depth aggregation
  - Test: VWAP calculation
  - Test: time-series resampling (1min → 5min → 1hour)
- [ ] All tests pass

### 1.3 Error Code System

**Branch:** `fix/code-quality/error-codes`
**Commits:** 1

**Commit 1: `feat(shared-types): introduce structured error code system`**
- [ ] Create `packages/shared-types/src/errors.ts`:
  ```typescript
  export enum ErrorCode {
    // Auth: 1xxx
    AUTH_INVALID_TOKEN = 'AUTH_1001',
    AUTH_PERMISSION_DENIED = 'AUTH_1002',
    AUTH_SESSION_EXPIRED = 'AUTH_1003',

    // Market: 2xxx
    MARKET_DATA_UNAVAILABLE = 'MKT_2001',
    MARKET_SYMBOL_NOT_FOUND = 'MKT_2002',
    MARKET_FEED_DISCONNECTED = 'MKT_2003',

    // Strategy: 3xxx
    STRATEGY_NOT_FOUND = 'STR_3001',
    STRATEGY_INVALID_PARAMS = 'STR_3002',
    STRATEGY_PROMOTION_DENIED = 'STR_3003',

    // Execution: 4xxx
    EXEC_ORDER_REJECTED = 'EXEC_4001',
    EXEC_INSUFFICIENT_MARGIN = 'EXEC_4002',
    EXEC_MARKET_CLOSED = 'EXEC_4003',
    EXEC_PARTIAL_FILL = 'EXEC_4004',

    // Risk: 5xxx
    RISK_LIMIT_EXCEEDED = 'RISK_5001',
    RISK_DRAWDOWN_BREACH = 'RISK_5002',
    RISK_CONCENTRATION_LIMIT = 'RISK_5003',

    // Backtest: 6xxx
    BACKTEST_INVALID_RANGE = 'BKT_6001',
    BACKTEST_NO_DATA = 'BKT_6002',

    // Agent: 7xxx
    AGENT_AUTHORITY_STOPPED = 'AGT_7001',
    AGENT_DAILY_LIMIT = 'AGT_7002',

    // System: 9xxx
    SYS_INTERNAL = 'SYS_9001',
    SYS_TIMEOUT = 'SYS_9002',
    SYS_RATE_LIMITED = 'SYS_9003',
  }

  export interface AppError {
    code: ErrorCode;
    message: string;
    detail?: Record<string, unknown>;
    retryable: boolean;
  }
  ```
- [ ] Update `packages/shared-types/src/index.ts` to re-export error types
- [ ] Update `apps/api` error responses to use `AppError` shape
- [ ] Update `apps/web/src/services/` error handling to consume error codes
- [ ] Run `npm run verify`

### 1.4 CI Coverage Gate

**Branch:** `fix/code-quality/coverage-gate`
**Commits:** 1

**Commit 1: `ci: add test coverage reporting with minimum threshold`**
- [ ] Add `c8` as dev dependency: `npm install --save-dev c8 --workspace=packages/trading-engine`
- [ ] Add coverage scripts to `packages/trading-engine/package.json`:
  ```json
  { "test:coverage": "c8 --reporter=lcov --lines=70 node --test test/*.test.mjs" }
  ```
- [ ] Add Vitest coverage config to `apps/web/vitest.config.ts`:
  ```typescript
  coverage: {
    provider: 'v8',
    reporter: ['lcov', 'text'],
    lines: 60,
    branches: 50,
    functions: 60,
  }
  ```
- [ ] Update `.github/workflows/ci.yml`: add coverage step after tests, upload lcov as artifact
- [ ] Add coverage badge to README (optional)
- [ ] Run `npm run verify` to confirm threshold not broken

---

## Phase 2: Architecture (feat/infra-upgrade)

> Dependency: Phase 1 (strict mode, error codes)

### 2.1 API Versioning

**Branch:** `feat/infra-upgrade/api-versioning`
**Commits:** 1

**Commit 1: `refactor(api): add version prefix to all routes`**
- [ ] Create `apps/api/src/app/routes/versioned-router.mjs`:
  - Wrap existing route registration with `/v1/` prefix
  - Maintain backward-compatible unversioned routes with deprecation header
  - Version resolution from URL path: `/api/v1/strategies` vs `/api/strategies`
- [ ] Update all route registration in `platform-routes.mjs` and `control-plane-routes.mjs`
- [ ] Update frontend service layer (`apps/web/src/services/`) to use `/api/v1/` prefix
- [ ] Update all API tests to use versioned endpoints
- [ ] Run `npm run verify`

### 2.2 Time-Series Storage Layer

**Branch:** `feat/infra-upgrade/timeseries-store`
**Commits:** 3

**Commit 1: `feat(db): add DuckDB adapter for analytical queries`**
- [ ] Create `packages/db/src/adapters/duckdb-adapter.mjs`:
  - Connection management (embedded mode, no server dependency)
  - Query interface: `query(sql, params)` → rows
  - Bulk insert for OHLCV bars
  - Time-range queries with automatic partitioning
- [ ] Create `packages/db/src/repositories/market-data-repo.mjs`:
  - `insertBars(symbol, bars[])` — bulk OHLCV insert
  - `getBars(symbol, interval, from, to)` — time-range query
  - `getLatestBar(symbol)` — latest price snapshot
  - `getSymbols()` — available instruments
- [ ] Unit tests for DuckDB adapter with sample data
- [ ] Run `npm run test:api`

**Commit 2: `feat(db): add historical data import pipeline`**
- [ ] Create `packages/db/src/importers/csv-importer.mjs`:
  - Parse CSV market data (Yahoo Finance, Alpha Vantage format)
  - Validate OHLCV constraints (high >= open/close, low <= open/close)
  - Deduplication by (symbol, timestamp, interval)
  - Progress reporting for large imports
- [ ] Create `packages/db/src/importers/api-importer.mjs`:
  - Fetch from free data sources (Yahoo Finance via proxy, Alpha Vantage)
  - Rate limiting and retry logic
  - Incremental import (only new bars since last timestamp)
- [ ] Create CLI entry point: `packages/db/src/cli/import-data.mjs`
  - `node packages/db/src/cli/import-data.mjs --source yahoo --symbol AAPL --from 2024-01-01`
- [ ] Tests for import pipeline with sample data
- [ ] Run `npm run verify`

**Commit 3: `feat(api): wire market data endpoints to DuckDB store`**
- [ ] Create `apps/api/src/domains/market/services/market-data-service.mjs`:
  - `getBars(symbol, interval, range)` — delegate to market-data-repo
  - `getQuote(symbol)` — latest bar + daily change
  - `searchSymbols(query)` — fuzzy symbol search
- [ ] Create market data routes in `apps/api/src/app/routes/routers/market-data-router.mjs`:
  - `GET /api/v1/market/bars?symbol=AAPL&interval=1d&from=2024-01-01&to=2024-12-31`
  - `GET /api/v1/market/quote/:symbol`
  - `GET /api/v1/market/search?q=apple`
- [ ] Update frontend `market.service.ts` to call new endpoints
- [ ] Integration tests for market data API
- [ ] Run `npm run verify`

### 2.3 Real-Time Data Pipeline (WebSocket)

**Branch:** `feat/infra-upgrade/websocket-pipeline`
**Commits:** 3

**Commit 1: `feat(api): add WebSocket server for real-time subscriptions`**
- [ ] Create `apps/api/src/websocket/server.mjs`:
  - WebSocket server attached to existing HTTP server
  - Connection authentication (JWT validation on upgrade)
  - Subscription management: subscribe/unsubscribe by channel
  - Channels: `price:{symbol}`, `orderbook:{symbol}`, `trade:{symbol}`, `portfolio`, `notifications`
  - Heartbeat/ping-pong for connection health
  - Graceful shutdown (drain connections)
- [ ] Create `apps/api/src/websocket/channel-manager.mjs`:
  - Track active subscriptions per connection
  - Broadcast to subscribed connections only
  - Connection limit per user (default: 5)
- [ ] Unit tests for WebSocket server lifecycle
- [ ] Run `npm run test:api`

**Commit 2: `feat(web): add WebSocket client hook and real-time data layer`**
- [ ] Create `apps/web/src/hooks/useWebSocket.ts`:
  - Auto-connect with exponential backoff
  - Subscription management (subscribe/unsubscribe)
  - Message deserialization and type routing
  - Connection status indicator (connected/reconnecting/offline)
- [ ] Create `apps/web/src/hooks/useRealtimePrice.ts`:
  - Wraps `useWebSocket` for price channel
  - Returns `{ price, change, changePercent, lastUpdated }`
  - Debounced updates (max 4/second per symbol to avoid render storms)
- [ ] Create `apps/web/src/services/websocket.service.ts`:
  - Singleton WebSocket connection manager
  - Shared across components (one connection, many subscribers)
  - Queue messages while disconnected, flush on reconnect
- [ ] Unit tests with mock WebSocket
- [ ] Run `npm run test:web`

**Commit 3: `feat(web): integrate real-time prices into trading and overview pages`**
- [ ] Update `TradingPage.tsx`: replace polling with `useRealtimePrice` for watchlist
- [ ] Update `OverviewPage.tsx`: real-time NAV, P&L, position updates
- [ ] Add price change animation (flash green/red on tick)
- [ ] Add connection status indicator to ConsoleChrome header
- [ ] Run `npm run verify`

### 2.4 Frontend State Management Refactor

**Branch:** `feat/infra-upgrade/state-refactor`
**Commits:** 2

**Commit 1: `refactor(web): extract market and strategy stores from TradingSystemProvider`**
- [ ] Create `apps/web/src/store/market-store.ts` (Zustand):
  - Market symbols, quotes, watchlist, recent trades
  - Actions: `setQuote`, `updateWatchlist`, `subscribeToSymbol`
- [ ] Create `apps/web/src/store/strategy-store.ts` (Zustand):
  - Strategy list, selected strategy, promotion state
  - Actions: `loadStrategies`, `promoteStrategy`, `selectStrategy`
- [ ] Create `apps/web/src/store/risk-store.ts` (Zustand):
  - Risk parameters, events, alerts
  - Actions: `loadRiskState`, `acknowledgeAlert`
- [ ] Create `apps/web/src/store/execution-store.ts` (Zustand):
  - Orders, positions, fills, blotter state
  - Actions: `submitOrder`, `cancelOrder`, `refreshPositions`
- [ ] Tests for each store
- [ ] Run `npm run test:web`

**Commit 2: `refactor(web): migrate pages from TradingSystemProvider to independent stores`**
- [ ] Update `TradingPage.tsx` to use `market-store` + `execution-store`
- [ ] Update `StrategiesPage.tsx` to use `strategy-store`
- [ ] Update `RiskPage.tsx` to use `risk-store`
- [ ] Update `OverviewPage.tsx` to compose from all stores
- [ ] Deprecate `TradingSystemProvider` (keep as thin wrapper for backward compat)
- [ ] Run `npm run verify`

### 2.5 API Caching Layer

**Branch:** `feat/infra-upgrade/api-caching`
**Commits:** 1

**Commit 1: `feat(api): add in-memory cache with TTL for hot endpoints`**
- [ ] Create `apps/api/src/middleware/cache.mjs`:
  - LRU cache with configurable TTL per route
  - Cache key: `${method}:${path}:${userId}`
  - Cache invalidation on mutation (POST/PUT/DELETE auto-invalidates related GET)
  - Cache stats endpoint: `GET /api/v1/system/cache-stats`
- [ ] Apply cache middleware to hot endpoints:
  - `GET /api/v1/market/bars` — TTL 60s
  - `GET /api/v1/strategies` — TTL 30s
  - `GET /api/v1/risk/parameters` — TTL 30s
  - `GET /api/v1/summary` — TTL 10s
- [ ] Add `X-Cache: HIT/MISS` response header for debugging
- [ ] Tests for cache hit/miss/invalidation scenarios
- [ ] Run `npm run verify`

---

## Phase 3: Feature Completeness (feat/core-features)

> Dependency: Phase 2 (market data pipeline, WebSocket)

### 3.1 Backtest Engine Enhancements

**Branch:** `feat/core-features/backtest-v2`
**Commits:** 3

**Commit 1: `feat(trading-engine): add slippage and commission models`**
- [ ] Create `packages/trading-engine/src/backtest/slippage.mjs`:
  - Fixed slippage model: `price * (1 ± slippagePercent)`
  - Volume-based slippage: impact proportional to order size / average volume
  - Spread model: bid-ask spread simulation based on historical data
- [ ] Create `packages/trading-engine/src/backtest/commission.mjs`:
  - Fixed per-trade commission
  - Per-share commission (e.g., $0.005/share)
  - Percentage-based commission
  - Commission cap (min/max)
  - Configurable via backtest params
- [ ] Update backtest execution loop to apply slippage + commission
- [ ] Tests for each model with known inputs
- [ ] Run `npm run verify`

**Commit 2: `feat(trading-engine): add multi-factor attribution analysis`**
- [ ] Create `packages/trading-engine/src/backtest/attribution.mjs`:
  - Factor decomposition: market beta, sector exposure, momentum, value, size
  - Brinson attribution: allocation effect, selection effect, interaction effect
  - Rolling factor exposure (60-day window)
  - Output: `AttributionResult { factors: FactorExposure[], brinson: BrinsonResult, rolling: RollingExposure[] }`
- [ ] Create `packages/trading-engine/src/backtest/benchmark.mjs`:
  - Benchmark comparison (SPY, custom index)
  - Alpha/Beta calculation
  - Information ratio, tracking error
  - Up/down capture ratios
  - Relative drawdown
- [ ] Integration with backtest result pipeline
- [ ] Tests with sample portfolio vs SPY
- [ ] Run `npm run verify`

**Commit 3: `feat(backtest): wire enhanced backtest results into UI`**
- [ ] Create `apps/web/src/components/backtest/AttributionPanel.tsx`:
  - Factor exposure bar chart
  - Brinson attribution waterfall chart
  - Rolling factor exposure line chart
- [ ] Create `apps/web/src/components/backtest/BenchmarkComparison.tsx`:
  - Equity curve overlay (strategy vs benchmark)
  - Relative performance scatter plot
  - Key metrics comparison table
- [ ] Update `BacktestPage.tsx` inspection panel to include attribution + benchmark tabs
- [ ] Add backtest params UI: commission model selector, slippage config, benchmark selector
- [ ] Run `npm run verify`

### 3.2 Execution Engine V2

**Branch:** `feat/core-features/execution-v2`
**Commits:** 3

**Commit 1: `feat(trading-engine): implement algorithmic order splitting`**
- [ ] Create `packages/trading-engine/src/execution/algo-orders.mjs`:
  - TWAP: split order evenly over time window
  - VWAP: volume-weighted distribution using historical volume profile
  - Iceberg: show only N% of total order at a time
  - Implementation: `createAlgoOrder(type, params) → AlgoOrder`
- [ ] Create `packages/trading-engine/src/execution/order-lifecycle.mjs`:
  - State machine: `PENDING → SUBMITTED → PARTIAL_FILL → FILLED | CANCELLED | REJECTED`
  - Partial fill tracking: `filledQty`, `remainingQty`, `avgFillPrice`
  - Cancel/reject reason propagation
  - Timeout handling with configurable TTL
- [ ] Tests for each algo order type
- [ ] Run `npm run verify`

**Commit 2: `feat(trading-engine): add order retry and smart routing logic`**
- [ ] Create `packages/trading-engine/src/execution/retry-handler.mjs`:
  - Exponential backoff retry for transient failures
  - Max retry count per order (configurable)
  - Dead letter queue for permanently failed orders
  - Retry budget: max N retries per minute globally
- [ ] Create `packages/trading-engine/src/execution/smart-router.mjs`:
  - Route to venue with best fill probability
  - Latency tracking per venue
  - Fallback routing on venue failure
- [ ] Tests for retry and routing scenarios
- [ ] Run `npm run verify`

**Commit 3: `feat(trading): wire algo orders and partial fills into trading page`**
- [ ] Update `TradingPage.tsx` order form:
  - Order type selector: Market, Limit, Stop, TWAP, VWAP, Iceberg
  - TWAP params: duration, interval count
  - VWAP params: volume profile selection
- [ ] Create `apps/web/src/components/trading/AlgoOrderProgress.tsx`:
  - Visual progress bar for TWAP/VWAP execution
  - Child order list with individual fill status
- [ ] Update blotter to show partial fills with remaining quantity
- [ ] Run `npm run verify`

### 3.3 Portfolio Risk Engine

**Branch:** `feat/core-features/portfolio-risk`
**Commits:** 3

**Commit 1: `feat(trading-engine): implement VaR and CVaR calculations`**
- [ ] Create `packages/trading-engine/src/risk/var-calculator.mjs`:
  - Historical VaR (percentile-based)
  - Parametric VaR (variance-covariance method)
  - Monte Carlo VaR (configurable simulations, default 10,000)
  - Confidence levels: 95%, 99%
  - Time horizons: 1-day, 5-day, 10-day, 30-day
- [ ] Create `packages/trading-engine/src/risk/cvar-calculator.mjs`:
  - Expected Shortfall (CVaR): average loss beyond VaR threshold
  - Tail risk analysis
- [ ] Tests with known portfolio datasets
- [ ] Run `npm run verify`

**Commit 2: `feat(trading-engine): add stress testing and correlation analysis`**
- [ ] Create `packages/trading-engine/src/risk/stress-test.mjs`:
  - Predefined scenarios: 2008 crash, COVID crash, Flash crash, rate hike
  - Custom scenario builder: define factor shocks (equity -20%, rates +2%, vol +50%)
  - Portfolio impact calculation per scenario
  - Output: `StressTestResult { scenario, pnlImpact, worstPosition, recoveryEstimate }`
- [ ] Create `packages/trading-engine/src/risk/correlation-matrix.mjs`:
  - Rolling correlation calculation (Pearson, Spearman)
  - Sector concentration detection
  - Correlation breakdown alert (regime change detection)
- [ ] Tests for stress scenarios and correlation edge cases
- [ ] Run `npm run verify`

**Commit 3: `feat(risk): wire portfolio risk analytics into risk page and settings`**
- [ ] Create `apps/web/src/components/risk/VaRPanel.tsx`:
  - VaR gauge with confidence level selector
  - Historical VaR trend chart
  - CVaR comparison bar
- [ ] Create `apps/web/src/components/risk/StressTestPanel.tsx`:
  - Scenario cards with P&L impact
  - Run custom stress test form
  - Historical stress test results table
- [ ] Create `apps/web/src/components/risk/CorrelationMatrix.tsx`:
  - Heatmap visualization of position correlations
  - Click to drill into pair detail
- [ ] Update `RiskPage.tsx` to include new panels
- [ ] Update `RiskParametersPanel` to include VaR limits configuration
- [ ] Run `npm run verify`

### 3.4 Market Data Management

**Branch:** `feat/core-features/market-data`
**Commits:** 2

**Commit 1: `feat(market): implement real-time market data ingestion pipeline`**
- [ ] Create `packages/trading-engine/src/market/feed-manager.mjs`:
  - Abstract feed interface: `connect()`, `subscribe(symbols)`, `onBar(callback)`, `onQuote(callback)`
  - Yahoo Finance WebSocket adapter (real-time proxy)
  - Alpaca market data stream adapter
  - Feed health monitoring: latency tracking, gap detection, reconnection
  - Data normalization across providers (different timestamp formats, price scales)
- [ ] Create `packages/trading-engine/src/market/bar-aggregator.mjs`:
  - Tick-to-bar aggregation: 1s ticks → 1m/5m/15m/1h/1d bars
  - Session-aware aggregation (market open/close boundaries)
  - Bar validation (OHLCV constraints)
- [ ] Tests with simulated tick streams
- [ ] Run `npm run verify`

**Commit 2: `feat(market): add Level 2 order book and market data UI`**
- [ ] Create `apps/web/src/components/market/OrderBook.tsx`:
  - Bid/ask price levels with depth visualization
  - Real-time updates via WebSocket
  - Spread indicator
  - Price level aggregation (configurable tick size)
- [ ] Create `apps/web/src/components/market/DepthChart.tsx`:
  - Cumulative depth visualization
  - Bid/ask imbalance indicator
- [ ] Update `MarketPage.tsx` with order book and depth chart panels
- [ ] Update `TradingPage.tsx` sidebar to include mini order book
- [ ] Run `npm run verify`

### 3.5 Notification System V2

**Branch:** `feat/core-features/notifications-v2`
**Commits:** 1

**Commit 1: `feat(notifications): add multi-channel notification delivery`**
- [ ] Create `packages/control-plane-runtime/src/domains/notifications/channels/email.mjs`:
  - SMTP integration (configurable: SendGrid, SES, or direct SMTP)
  - Template-based emails (order filled, risk alert, strategy promoted)
- [ ] Create `packages/control-plane-runtime/src/domains/notifications/channels/webhook.mjs`:
  - HTTP POST to configurable URL
  - Signature verification (HMAC)
  - Retry logic with exponential backoff
- [ ] Create `packages/control-plane-runtime/src/domains/notifications/channels/websocket.mjs`:
  - Real-time push to connected clients (leverage Phase 2.3 WebSocket)
- [ ] Create notification preference model:
  - Per-user channel preferences (email on/off, webhook URL, etc.)
  - Per-event-type routing (risk alerts → all channels, order fills → websocket only)
- [ ] Update `NotificationsPage.tsx` with channel configuration UI
- [ ] Update `SettingsPage.tsx` with notification preferences panel
- [ ] Tests for each channel
- [ ] Run `npm run verify`

### 3.6 User System Enhancement

**Branch:** `feat/core-features/user-system`
**Commits:** 2

**Commit 1: `feat(auth): implement registration, login, and session management`**
- [ ] Create `apps/api/src/domains/auth/services/auth-service.mjs`:
  - Registration: email + password (bcrypt hash, strength validation)
  - Login: email/password → JWT access token + refresh token
  - Token refresh: rotate refresh token on use
  - Session management: track active sessions, revoke by ID
  - Password reset: token-based email flow
- [ ] Create auth routes in `apps/api/src/app/routes/routers/auth-router.mjs`:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `POST /api/v1/auth/password-reset`
- [ ] Update frontend with login/register pages
- [ ] Add auth guard to API gateway middleware
- [ ] Tests for auth flows
- [ ] Run `npm run verify`

**Commit 2: `feat(auth): add MFA and team management`**
- [ ] Add TOTP-based MFA (Google Authenticator compatible):
  - MFA enrollment flow: secret generation → QR code → verification
  - MFA challenge on login
  - Recovery codes generation
- [ ] Create team management:
  - Team CRUD (create, invite, remove members)
  - Role assignment within team (owner, admin, member, viewer)
  - Permission scoping by team context
  - API key management per team
- [ ] Update `SettingsPage.tsx` with MFA setup and team management panels
- [ ] Tests for MFA and team flows
- [ ] Run `npm run verify`

---

## Phase 4: UI Interface (feat/design-system)

> Dependency: Phase 1 (strict mode), Phase 3 (feature components to style)

### 4.1 Design System Foundation

**Branch:** `feat/design-system/foundation`
**Commits:** 2

**Commit 1: `feat(web): create @quantpilot/ui component library package`**
- [ ] Create `packages/ui/` with package.json, tsconfig, vite config (library mode)
- [ ] Define design tokens in `packages/ui/src/tokens/`:
  - `colors.css.ts`: semantic tokens (accent, surface, text, success, warning, danger, info)
  - `spacing.css.ts`: 4px grid scale (xs=4, sm=8, md=12, lg=16, xl=24, xxl=32)
  - `typography.css.ts`: font families, sizes, weights, line heights
  - `radii.css.ts`: border radius scale
  - `shadows.css.ts`: elevation levels (0-4)
  - `motion.css.ts`: transition durations, easing curves
- [ ] Export token theme from `packages/ui/src/theme.css.ts`
- [ ] Verify tree-shaking works with Vite
- [ ] Run `npm run verify`

**Commit 2: `feat(ui): build atomic components (Button, Input, Select, Modal, Table, Card)`**
- [ ] Create `packages/ui/src/components/`:
  - `Button.css.ts` + `Button.tsx`: variants (primary, secondary, ghost, danger), sizes (sm, md, lg), loading state, icon support
  - `Input.css.ts` + `Input.tsx`: text, number, password; validation state; prefix/suffix slots
  - `Select.css.ts` + `Select.tsx`: single/multi select, searchable, option groups
  - `Modal.css.ts` + `Modal.tsx`: header/body/footer, sizes (sm, md, lg, full), close on overlay
  - `Table.css.ts` + `Table.tsx`: sortable columns, row selection, pagination, empty state, loading skeleton
  - `Card.css.ts` + `Card.tsx`: header, body, footer sections, hover elevation
- [ ] Create `packages/ui/src/index.ts` barrel export
- [ ] Storybook stories for each component (optional but recommended)
- [ ] Tests for each component (render, interaction, a11y)
- [ ] Run `npm run verify`

### 4.2 Chart Library Integration

**Branch:** `feat/design-system/charts`
**Commits:** 1

**Commit 1: `feat(web): integrate Lightweight Charts for financial charting`**
- [ ] Install `lightweight-charts` as dependency in `apps/web`
- [ ] Create `apps/web/src/components/charts/CandlestickChartV2.tsx`:
  - Replace hand-drawn Canvas CandlestickChart
  - Features: zoom, pan, crosshair, tooltip, volume bars overlay
  - Technical indicator overlays: SMA, EMA, Bollinger Bands, RSI
  - Multi-timeframe support (1m, 5m, 15m, 1h, 4h, 1d)
  - Real-time bar update via WebSocket
- [ ] Create `apps/web/src/components/charts/EquityChartV2.tsx`:
  - Replace hand-drawn Canvas EquityChart
  - Features: drawdown underwater overlay, benchmark comparison line
  - Interactive legend (toggle series visibility)
- [ ] Create `apps/web/src/components/charts/DepthChart.tsx`:
  - L2 order book depth visualization
- [ ] Migrate `TradingPage.tsx` and `BacktestPage.tsx` to new chart components
- [ ] Remove old Canvas chart components
- [ ] Run `npm run verify`

### 4.3 Dark/Light Theme

**Branch:** `feat/design-system/theming`
**Commits:** 1

**Commit 1: `feat(web): implement dark/light theme system`**
- [ ] Create `apps/web/src/app/styles/themes/dark.css.ts`:
  - Dark surface colors: `#0a0a0f`, `#12121a`, `#1a1a2e`
  - Indigo accent adjusted for dark backgrounds (brighter)
  - Chart color palette optimized for dark mode
- [ ] Create `apps/web/src/app/styles/themes/light.css.ts`:
  - Light surface colors: `#ffffff`, `#f8f9fa`, `#e9ecef`
  - Indigo accent for light backgrounds
  - Chart color palette for light mode
- [ ] Create `apps/web/src/hooks/useTheme.ts`:
  - Theme toggle with localStorage persistence
  - System preference detection (`prefers-color-scheme`)
  - Smooth transition between themes (CSS transition on background/color)
- [ ] Add theme toggle button to ConsoleChrome header
- [ ] Update all `.css.ts` files to use semantic token variables instead of hardcoded colors
- [ ] Update design tokens in `packages/ui` to support both themes
- [ ] Run `npm run verify`

### 4.4 Mobile Responsive Layout

**Branch:** `feat/design-system/responsive`
**Commits:** 2

**Commit 1: `feat(web): add responsive breakpoints and mobile layout shell`**
- [ ] Define breakpoint tokens: `mobile` (<640px), `tablet` (640-1024px), `desktop` (>1024px)
- [ ] Create `apps/web/src/components/layout/MobileLayout.tsx`:
  - Bottom navigation bar (Dashboard, Trading, Risk, Settings)
  - Swipeable page transitions
  - Pull-to-refresh on data pages
- [ ] Create `apps/web/src/components/layout/MobileHeader.tsx`:
  - Compact header with hamburger menu
  - Quick-action buttons (notifications, theme toggle)
- [ ] Add `@media` responsive rules to all `.css.ts` files:
  - Tables → card lists on mobile
  - Sidebars → slide-over drawers on mobile
  - Charts → simplified view on mobile (single timeframe)
- [ ] Run `npm run test:web`

**Commit 2: `feat(web): optimize core pages for mobile viewing`**
- [ ] `OverviewPage`: KPI cards stack vertically, charts hidden on mobile (show summary only)
- [ ] `TradingPage`: simplified order form (direction + quantity + price), mini blotter
- [ ] `RiskPage`: alert list as primary view, risk gauge as compact widget
- [ ] `NotificationsPage`: full-screen notification list (already mobile-friendly layout)
- [ ] Test on 375px (iPhone SE) and 768px (iPad) viewports
- [ ] Run `npm run verify`

### 4.5 Keyboard Shortcuts System

**Branch:** `feat/design-system/shortcuts`
**Commits:** 1

**Commit 1: `feat(web): implement global keyboard shortcut system`**
- [ ] Create `apps/web/src/hooks/useKeyboardShortcuts.ts`:
  - Global shortcut registry with conflict detection
  - Context-aware shortcuts (active page determines available shortcuts)
  - Shortcut categories: navigation, trading, search
- [ ] Define shortcuts:
  - `Cmd+K`: Command palette (existing)
  - `Cmd+/`: Show shortcut help overlay
  - `Cmd+1-9`: Navigate to pages (Dashboard, Market, Strategies, etc.)
  - `Cmd+B`: Quick buy order form
  - `Cmd+S`: Quick sell order form
  - `Cmd+E`: Toggle watchlist
  - `Escape`: Close any open modal/drawer
  - `Cmd+.`: Toggle notifications panel
- [ ] Create `apps/web/src/components/ShortcutHelp.tsx`:
  - Modal overlay showing all shortcuts, grouped by category
  - Search/filter shortcuts
- [ ] Register shortcuts in ConsoleChrome layout
- [ ] Tests for shortcut registration and dispatch
- [ ] Run `npm run verify`

### 4.6 Loading States & Skeleton Screens

**Branch:** `feat/design-system/skeletons`
**Commits:** 1

**Commit 1: `feat(ui): add skeleton loading components and page-level skeletons`**
- [ ] Create `packages/ui/src/components/Skeleton.css.ts` + `Skeleton.tsx`:
  - Base skeleton with shimmer animation
  - Variants: text (line), circle (avatar), rectangle (card), table (rows)
  - Configurable dimensions and animation speed
- [ ] Create page-level skeleton components:
  - `OverviewSkeleton.tsx`: KPI cards + chart placeholders
  - `TradingSkeleton.tsx`: chart + order form + blotter layout
  - `StrategiesSkeleton.tsx`: table + detail panel layout
  - `RiskSkeleton.tsx`: metric cards + chart layout
- [ ] Replace all `Loading...` text and spinners with skeleton screens
- [ ] Add fade-in transition when data arrives (skeleton → content)
- [ ] Run `npm run verify`

---

## Phase 5: Interaction Design (feat/ux-interactions)

> Dependency: Phase 4 (design system components, charts)

### 5.1 Quick Order Bar

**Branch:** `feat/ux-interactions/quick-order`
**Commits:** 1

**Commit 1: `feat(trading): add persistent quick order bar to trading page`**
- [ ] Create `apps/web/src/components/trading/QuickOrderBar.tsx`:
  - Persistent bottom bar (always visible when on TradingPage)
  - Fields: Direction (Buy/Sell toggle), Symbol (autocomplete), Quantity, Price (market/limit toggle)
  - Submit on Enter key
  - One-click market buy/sell with default quantity
  - P&L preview before submit
- [ ] Create `apps/web/src/components/trading/OrderConfirmation.tsx`:
  - Minimal confirmation popup (not modal — inline toast-style)
  - Shows: direction, symbol, qty, est. price, est. commission
  - Auto-dismiss after 3s if no interaction (for market orders)
- [ ] Wire into `TradingPage.tsx` layout
- [ ] Tests for quick order submission flow
- [ ] Run `npm run verify`

### 5.2 Real-Time Data Feedback Animations

**Branch:** `feat/ux-interactions/price-animations`
**Commits:** 1

**Commit 1: `feat(web): add price change animations and real-time visual feedback`**
- [ ] Create `apps/web/src/components/common/PriceFlash.tsx`:
  - Flash green on price increase, red on decrease
  - CSS animation: brief background highlight (200ms)
  - Configurable intensity (subtle for small changes, strong for large moves)
- [ ] Create `apps/web/src/components/common/PnLAnimator.tsx`:
  - Animated counter for P&L values (smooth number transition)
  - Color shifts: green → brighter green on profit increase, red → darker red on loss increase
- [ ] Create `apps/web/src/components/common/SignalAlert.tsx`:
  - Pulse animation on new signal detection
  - Expandable to show signal details
- [ ] Apply to:
  - Watchlist prices on `TradingPage`
  - NAV/P&L on `OverviewPage`
  - Position rows in blotter
  - Signal indicators
- [ ] Performance: use CSS transforms/animations (GPU-accelerated), avoid layout thrashing
- [ ] Run `npm run verify`

### 5.3 Multi-Panel Layout

**Branch:** `feat/ux-interactions/multi-panel`
**Commits:** 1

**Commit 1: `feat(web): implement resizable multi-panel layout for trading workspace`**
- [ ] Create `apps/web/src/components/layout/SplitPane.tsx`:
  - Horizontal and vertical split
  - Drag handle with min/max constraints
  - Collapse/expand panels
  - Persist layout state to localStorage
- [ ] Create `apps/web/src/components/layout/TradingWorkspace.tsx`:
  - Preset layouts: "Standard" (chart + blotter), "Advanced" (chart + orderbook + blotter + order form), "Monitor" (multi-chart + alerts)
  - Layout switcher in toolbar
  - Each panel: closeable, replaceable content
- [ ] Apply to `TradingPage.tsx`:
  - Left: chart panel
  - Right top: order form / order book (switchable)
  - Right bottom: blotter (orders + positions tabs)
- [ ] Apply to `OverviewPage.tsx`:
  - Left: KPI + charts
  - Right: blotter + activity feed (collapsible)
- [ ] Tests for split pane resize and persistence
- [ ] Run `npm run verify`

### 5.4 Empty State Guidance

**Branch:** `feat/ux-interactions/empty-states`
**Commits:** 1

**Commit 1: `feat(web): redesign empty states with actionable guidance`**
- [ ] Update `EmptyState` component to accept:
  - `action`: CTA button (label + onClick)
  - `description`: helpful text explaining what to do
  - `illustration`: optional SVG illustration
- [ ] Page-specific empty states:
  - **Strategies (empty)**: "Create your first strategy" → CTA: "New Strategy" (opens creation form)
  - **Backtest (no runs)**: "Run your first backtest" → CTA: "New Backtest" (opens params form)
  - **Trading (no positions)**: "Start trading" → CTA: "Place Order" (focuses order form)
  - **Risk (no events)**: "All clear" → illustration + "Risk events will appear here"
  - **Notifications (empty)**: "You're all caught up" → illustration
- [ ] Add progress indicators for first-time setup:
  - "Complete your profile" → "Connect a broker" → "Create a strategy" → "Run a backtest"
- [ ] Run `npm run verify`

### 5.5 Inline Error Handling

**Branch:** `feat/ux-interactions/error-ux`
**Commits:** 1

**Commit 1: `feat(web): improve error feedback with inline messages and retry actions`**
- [ ] Create `apps/web/src/components/common/ErrorBanner.tsx`:
  - Inline error display (not modal)
  - Shows: error code (from Phase 1.3), human message, suggested action
  - Actions: "Retry" button (re-invokes failed operation), "Dismiss"
  - Color: danger variant with icon
- [ ] Create `apps/web/src/components/common/FormValidationError.tsx`:
  - Per-field validation error display
  - Appears below field, not as toast
  - Auto-clear on field edit
- [ ] Create `apps/web/src/hooks/useRetryableAction.ts`:
  - Wraps async actions with auto-retry (1 attempt by default)
  - Shows ErrorBanner on failure
  - Tracks retry count, disables after max retries
- [ ] Update all form submissions to use inline error display instead of toast
- [ ] Update API error interceptor to map ErrorCode → user-friendly message
- [ ] Run `npm run verify`

### 5.6 Command Palette Enhancement

**Branch:** `feat/ux-interactions/command-palette-v2`
**Commits:** 1

**Commit 1: `feat(web): enhance command palette with actions, navigation, and search`**
- [ ] Extend existing CommandPalette with categories:
  - **Navigation**: "Go to Dashboard", "Go to Trading", "Go to Risk" (with page icons)
  - **Actions**: "Place Buy Order", "Run Backtest", "Create Strategy", "Export Data"
  - **Search**: "Search strategies...", "Search symbols...", "Search orders..."
  - **Settings**: "Toggle Theme", "Toggle Notifications", "Open Settings"
- [ ] Add recent actions history (persisted to localStorage):
  - Show last 5 actions at top
  - Learn from usage frequency
- [ ] Add context-aware suggestions:
  - On TradingPage: suggest symbol search, order actions
  - On StrategiesPage: suggest strategy actions, backtest
  - On RiskPage: suggest risk parameter changes
- [ ] Add keyboard navigation within palette (arrow keys, Enter, Tab)
- [ ] Add fuzzy search for commands
- [ ] Tests for palette behavior
- [ ] Run `npm run verify`

### 5.7 Onboarding Flow

**Branch:** `feat/ux-interactions/onboarding`
**Commits:** 1

**Commit 1: `feat(web): add guided onboarding for new users`**
- [ ] Create `apps/web/src/components/onboarding/OnboardingTour.tsx`:
  - Step-by-step overlay highlighting key UI areas
  - Steps: 1) Dashboard overview, 2) Market data, 3) Create strategy, 4) Run backtest, 5) Paper trading, 6) Go live
  - Skip / Next / Back navigation
  - Persist completion state to user profile
- [ ] Create `apps/web/src/components/onboarding/SetupWizard.tsx`:
  - Initial setup flow on first login:
    - Step 1: "What do you trade?" (stocks, crypto, forex — checkboxes)
    - Step 2: "Connect a broker" (Alpaca, Interactive Brokers, or skip)
    - Step 3: "Import data" (upload CSV or connect data source, or skip)
    - Step 4: "Create your first strategy" (template picker or blank)
  - Each step skippable, wizard completable at any point
- [ ] Trigger on first visit (check localStorage flag `onboarding_complete`)
- [ ] Re-triggerable from Settings: "Restart onboarding tour"
- [ ] Run `npm run verify`

---

## Phase 6: Product Positioning (feat/platform-features)

> Dependency: Phase 3 (features), Phase 4 (UI), Phase 5 (interactions)

### 6.1 Strategy Marketplace

**Branch:** `feat/platform-features/strategy-marketplace`
**Commits:** 2

**Commit 1: `feat(strategies): add strategy sharing and marketplace backend`**
- [ ] Create `packages/control-plane-store/src/repositories/strategy-marketplace-repo.mjs`:
  - `publishStrategy(strategyId, visibility)` — publish to marketplace
  - `searchStrategies(query, filters)` — search published strategies
  - `forkStrategy(strategyId, userId)` — clone strategy to user's workspace
  - `rateStrategy(strategyId, userId, rating)` — 1-5 star rating
  - `reviewStrategy(strategyId, userId, comment)` — text review
- [ ] Create `apps/api/src/domains/strategies/services/marketplace-service.mjs`:
  - Publish/unpublish workflow with validation (must have backtest results)
  - Fork with full strategy config + parameter copying
  - Rating aggregation and sorting
  - Abuse prevention (rate limit on forks/reviews)
- [ ] Create marketplace API routes:
  - `GET /api/v1/marketplace/strategies` — browse published strategies
  - `POST /api/v1/marketplace/strategies/:id/fork` — fork to workspace
  - `POST /api/v1/marketplace/strategies/:id/rate` — rate
  - `POST /api/v1/marketplace/strategies/:id/reviews` — review
  - `GET /api/v1/marketplace/strategies/:id/reviews` — list reviews
- [ ] Tests for marketplace operations
- [ ] Run `npm run verify`

**Commit 2: `feat(strategies): build marketplace UI with browse, search, and fork`**
- [ ] Create `apps/web/src/pages/marketplace/MarketplacePage.tsx`:
  - Strategy cards grid with: name, author, rating, backtest performance (CAGR, Sharpe, max DD)
  - Filter sidebar: asset class, strategy type, performance range, risk level
  - Sort: popular, newest, top rated, best performing
  - Search bar with autocomplete
- [ ] Create `apps/web/src/components/marketplace/StrategyDetail.tsx`:
  - Full strategy detail: description, parameters, equity curve, metrics
  - Fork button → copies to workspace
  - Reviews section
- [ ] Add "Publish to Marketplace" button on StrategiesPage (for strategy owner)
- [ ] Add "Marketplace" to navigation sidebar
- [ ] Run `npm run verify`

### 6.2 Paper Trading Performance Tracking

**Branch:** `feat/platform-features/paper-tracking`
**Commits:** 1

**Commit 1: `feat(trading): add paper trading performance journal and promotion criteria`**
- [ ] Create `packages/control-plane-store/src/repositories/paper-journal-repo.mjs`:
  - Daily snapshot: positions, P&L, drawdown, trade count
  - Cumulative performance metrics (since paper start)
  - Promotion readiness score (configurable criteria)
- [ ] Create `apps/api/src/domains/execution/services/paper-promotion-service.mjs`:
  - Evaluate paper trading history against criteria:
    - Minimum trading days (default: 30)
    - Max drawdown within threshold (default: 15%)
    - Positive Sharpe ratio (default: >0.5)
    - Minimum trade count (default: 20)
  - Generate promotion readiness report
  - Auto-flag strategies meeting criteria
- [ ] Create `apps/web/src/components/trading/PaperPerformancePanel.tsx`:
  - Paper trading journal: daily P&L chart, trade log
  - Promotion readiness checklist with progress bars
  - "Request Live Promotion" button (when all criteria met)
- [ ] Add to TradingPage and StrategiesPage
- [ ] Run `npm run verify`

### 6.3 Multi-Asset Support

**Branch:** `feat/platform-features/multi-asset`
**Commits:** 2

**Commit 1: `feat(trading-engine): abstract asset type handling for options and futures`**
- [ ] Create `packages/trading-engine/src/core/asset-types.mjs`:
  - `AssetType` enum: STOCK, OPTION, FUTURE, CRYPTO, FOREX
  - `Instrument` interface with asset-type-specific fields:
    - Option: strike, expiry, type (call/put), underlying, Greeks
    - Future: contract month, multiplier, tick size
    - Crypto: base/quote pair, decimal precision
  - `Position` extended with asset-type-specific risk metrics
- [ ] Create `packages/trading-engine/src/risk/options-risk.mjs`:
  - Black-Scholes pricing (European options)
  - Greeks calculation: delta, gamma, theta, vega, rho
  - Portfolio Greeks aggregation
  - Options-specific risk: gamma squeeze, theta decay, implied vol change
- [ ] Create `packages/trading-engine/src/execution/options-execution.mjs`:
  - Option chain management
  - Multi-leg orders (spread, straddle, iron condor)
  - Exercise/assignment handling
- [ ] Tests for options pricing and Greeks with known values
- [ ] Run `npm run verify`

**Commit 2: `feat(trading): add options trading UI with chain viewer and Greeks display`**
- [ ] Create `apps/web/src/components/trading/OptionsChain.tsx`:
  - Call/put columns with strike prices
  - Bid/ask/mid/last/volume/OpenInterest per strike
  - Greeks column (delta, gamma, theta, vega)
  - Expiry selector
  - Click to select leg → order form
- [ ] Create `apps/web/src/components/trading/MultiLegOrderForm.tsx`:
  - Add/remove legs
  - Strategy templates: single, vertical spread, iron condor, straddle
  - Net debit/credit calculation
  - Risk/reward diagram
- [ ] Create `apps/web/src/components/risk/PortfolioGreeks.tsx`:
  - Aggregate Greeks display (net delta, gamma, theta, vega)
  - Greeks exposure heat map by underlying
- [ ] Add asset type selector to TradingPage (Stock, Options, Crypto)
- [ ] Run `npm run verify`

### 6.4 Collaboration & Team Features

**Branch:** `feat/platform-features/collaboration`
**Commits:** 1

**Commit 1: `feat(strategies): add strategy sharing and team collaboration`**
- [ ] Create `packages/control-plane-store/src/repositories/collaboration-repo.mjs`:
  - Strategy sharing: share with specific users or team
  - Permission levels: view, comment, edit
  - Comment threads on strategy parameters and backtest results
  - Activity log: who changed what, when
- [ ] Create collaboration API routes:
  - `POST /api/v1/strategies/:id/share` — share with user/team
  - `GET /api/v1/strategies/:id/comments` — list comments
  - `POST /api/v1/strategies/:id/comments` — add comment
  - `GET /api/v1/strategies/:id/activity` — activity log
- [ ] Create `apps/web/src/components/strategies/ShareDialog.tsx`:
  - Share with specific users (email/username search)
  - Permission level selector
  - Shared users list with revoke option
- [ ] Create `apps/web/src/components/strategies/CommentThread.tsx`:
  - Comment list with timestamps and authors
  - Reply support
  - Resolve/close thread
- [ ] Create `apps/web/src/components/strategies/ActivityLog.tsx`:
  - Timeline view of strategy changes
  - Filter by user, action type, date range
- [ ] Add to StrategiesPage detail view
- [ ] Run `npm run verify`

### 6.5 Analytics Dashboard

**Branch:** `feat/platform-features/analytics`
**Commits:** 1

**Commit 1: `feat(analytics): add performance analytics and reporting page`**
- [ ] Create `packages/trading-engine/src/analytics/performance.mjs`:
  - Return analysis: daily/weekly/monthly/annual returns, cumulative returns
  - Risk metrics: Sharpe, Sortino, Calmar, Omega ratio, up/down capture
  - Drawdown analysis: max DD, avg DD, DD duration, recovery time
  - Trade analytics: win rate, avg win/loss, profit factor, expectancy
  - Monthly returns heatmap data
- [ ] Create `apps/api/src/domains/analytics/services/analytics-service.mjs`:
  - Aggregate analytics across strategies
  - Date range filtering
  - Export to CSV/PDF
- [ ] Create `apps/web/src/pages/analytics/AnalyticsPage.tsx`:
  - Performance summary cards (CAGR, Sharpe, Max DD, Win Rate)
  - Cumulative return chart (multi-strategy overlay)
  - Monthly returns heatmap
  - Drawdown chart
  - Trade distribution histogram (P&L per trade)
  - Risk-return scatter plot (strategy comparison)
- [ ] Add "Analytics" to navigation
- [ ] Run `npm run verify`

### 6.6 Data Export & API Documentation

**Branch:** `feat/platform-features/export-and-docs`
**Commits:** 1

**Commit 1: `feat(api): add data export and interactive API documentation`**
- [ ] Create `apps/api/src/domains/export/services/export-service.mjs`:
  - Export strategies to JSON/PDF
  - Export backtest results to CSV/PDF (with charts)
  - Export trade history to CSV
  - Export analytics report to PDF
  - Async export with download link (for large datasets)
- [ ] Create export API routes:
  - `GET /api/v1/export/strategies/:id?format=pdf`
  - `GET /api/v1/export/backtest/:id?format=csv`
  - `GET /api/v1/export/trades?from=...&to=...&format=csv`
  - `GET /api/v1/export/analytics?format=pdf`
- [ ] Add OpenAPI spec generation:
  - Create `apps/api/src/docs/openapi.mjs` — generate spec from route definitions
  - Serve at `GET /api/v1/docs/openapi.json`
  - Add Swagger UI at `/api/v1/docs` (static HTML)
- [ ] Tests for export endpoints
- [ ] Run `npm run verify`

---

## Implementation Guidelines

### Branch Strategy

```
main
├── fix/code-quality/ts-strict           (Phase 1.1)
├── fix/code-quality/trading-engine-tests (Phase 1.2)
├── fix/code-quality/error-codes          (Phase 1.3)
├── fix/code-quality/coverage-gate        (Phase 1.4)
├── feat/infra-upgrade/api-versioning     (Phase 2.1)
├── feat/infra-upgrade/timeseries-store   (Phase 2.2)
├── feat/infra-upgrade/websocket-pipeline (Phase 2.3)
├── feat/infra-upgrade/state-refactor     (Phase 2.4)
├── feat/infra-upgrade/api-caching        (Phase 2.5)
├── feat/core-features/backtest-v2        (Phase 3.1)
├── feat/core-features/execution-v2       (Phase 3.2)
├── feat/core-features/portfolio-risk     (Phase 3.3)
├── feat/core-features/market-data        (Phase 3.4)
├── feat/core-features/notifications-v2   (Phase 3.5)
├── feat/core-features/user-system        (Phase 3.6)
├── feat/design-system/foundation         (Phase 4.1)
├── feat/design-system/charts             (Phase 4.2)
├── feat/design-system/theming            (Phase 4.3)
├── feat/design-system/responsive         (Phase 4.4)
├── feat/design-system/shortcuts          (Phase 4.5)
├── feat/design-system/skeletons          (Phase 4.6)
├── feat/ux-interactions/quick-order      (Phase 5.1)
├── feat/ux-interactions/price-animations (Phase 5.2)
├── feat/ux-interactions/multi-panel      (Phase 5.3)
├── feat/ux-interactions/empty-states     (Phase 5.4)
├── feat/ux-interactions/error-ux         (Phase 5.5)
├── feat/ux-interactions/command-palette  (Phase 5.6)
├── feat/ux-interactions/onboarding       (Phase 5.7)
├── feat/platform-features/strategy-marketplace  (Phase 6.1)
├── feat/platform-features/paper-tracking        (Phase 6.2)
├── feat/platform-features/multi-asset           (Phase 6.3)
├── feat/platform-features/collaboration         (Phase 6.4)
├── feat/platform-features/analytics             (Phase 6.5)
└── feat/platform-features/export-and-docs       (Phase 6.6)
```

### Commit Conventions

- Prefix: `feat`, `fix`, `refactor`, `chore`, `test`, `ci`, `docs`, `style`
- Scope: package or feature area
- Format: `type(scope): imperative description`
- Examples:
  - `feat(trading-engine): add slippage models for backtest simulation`
  - `fix(api): correct auth middleware JWT expiry check`
  - `refactor(web): migrate from TradingSystemProvider to Zustand stores`

### PR Strategy

- Each branch = one PR targeting `main`
- Phase 1 & 2 branches can merge independently (no cross-dependency within phase)
- Phase 3+ depends on specific Phase 2 features:
  - Backtest V2 → Timeseries Store (2.2)
  - Execution V2 → no hard dependency, but benefits from WebSocket (2.3)
  - Portfolio Risk → Timeseries Store (2.2)
  - Market Data → WebSocket (2.3)
- Phase 4+ depends on Phase 3 features it styles/integrates
- Phase 6 depends on Phase 3, 4, 5 being substantially complete

### Pre-merge Checklist

Every PR must pass:
- [ ] `npm run verify` (lint + all tests + typecheck + build)
- [ ] No `console.log` left in production code
- [ ] No `any` types introduced without justification
- [ ] New files follow existing directory conventions
- [ ] Tests cover new functionality (not just happy path)
- [ ] No AI co-author lines in commits

### Estimated Timeline

| Phase | Duration | Parallelizable |
|-------|----------|---------------|
| Phase 1 (Code Quality) | 1-2 weeks | All sub-phases parallel |
| Phase 2 (Architecture) | 3-4 weeks | 2.1 independent; 2.2 → 2.3 sequential; 2.4, 2.5 parallel |
| Phase 3 (Features) | 4-6 weeks | 3.1-3.4 parallel after 2.2/2.3; 3.5-3.6 parallel |
| Phase 4 (UI) | 2-3 weeks | 4.1 first, then 4.2-4.6 parallel |
| Phase 5 (Interactions) | 2-3 weeks | All parallel after Phase 4 |
| Phase 6 (Platform) | 4-6 weeks | 6.1-6.3 parallel; 6.4-6.6 parallel |
| **Total** | **16-24 weeks** | With parallelization |

### Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| TypeScript strict breaks existing code | Phase 1.1 incrementally enables strict per package |
| DuckDB adds native dependency | Embedded mode, no server; fallback to SQLite for dev |
| WebSocket adds complexity | Graceful degradation to polling if WS fails |
| Zustand migration breaks state | Phase 2.4 keeps old provider as thin wrapper |
| Lightweight Charts API changes | Pin version, wrap in adapter component |
| Multi-asset scope creep | Phase 6.3 only implements options, not all asset types |
