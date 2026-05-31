# QuantPilot Core Console Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` for independent cleanup streams, or `superpowers:executing-plans` for inline execution with checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 QuantPilot 从机构级量化研究平台收敛为轻量版单用户核心控制台，只保留策略研究、行情查看、回测、模拟/纸面执行、基础风控和必要设置。

**Architecture:** 采用“删除优先、闭环保留”的重构方式：先冻结并删除非核心产品面，再收敛 API、类型、包和验证脚本，最后清理文档与测试。轻量版不保留 Agent、compute job、worker、多租户、合规报表、插件生态和机构级 promotion workflow；这些能力从代码、路由、导航、测试、文档和资源中删除，而不是隐藏或冻结。

**Tech Stack:** TypeScript ES2022, React 18, Vite 5, Vanilla Extract, Node.js ESM, npm workspaces, Vitest, `node --test`, file-backed lightweight control store.

---

## 1. Target Product Boundary

### 1.1 New Positioning

QuantPilot Lite 是一个本地优先、单用户的 quantitative research and paper execution console。

保留的核心问题：

- 查看行情状态和模拟行情。
- 管理少量策略定义。
- 运行和查看回测。
- 将策略信号转成模拟/纸面执行计划。
- 查看订单、持仓、账户和执行日志。
- 用基础风控阻断明显危险动作。
- 在设置页配置运行模式、broker paper endpoint 和基础风控参数。

不再解决的问题：

- 机构级研究组织流程。
- 多账户、多租户、团队权限。
- Agent 协作和 LLM 工具治理。
- compute job 平台和后台 worker 调度。
- 数据资产管理、feature registry、model registry、experiment registry。
- 合规报告、审计报告、operation center、connector marketplace。
- live trading promotion workflow。

### 1.2 Supported Runtime Modes

保留：

- `simulated`: 默认模式，所有数据和执行均本地模拟。
- `paper`: 允许接入 paper broker adapter，但必须走服务器侧配置。

删除：

- `live`: 从 UI、shared types、API route validation、runtime config 和文档中删除。若保留内部字符串会导致后续误启用，必须清理。

### 1.3 Core Pages

保留页面：

- Dashboard: 系统状态、账户摘要、关键告警。
- Market: 行情、价格、信号概览。
- Strategies: 策略列表和策略详情。
- Backtest: 回测参数、运行按钮、结果面板。
- Execution: 计划、订单、成交、持仓和执行日志。
- Risk: 基础限制、kill switch、当前风险状态。
- Settings: 模式、broker paper 配置、刷新频率、基础风险参数。

删除页面：

- Agent
- Data
- Analytics
- Marketplace
- Notifications
- Operations
- Audit / Compliance
- Research OS 独立页面和完整生命周期控制台

---

## 2. Keep / Delete Map

### 2.1 Apps

保留：

- `apps/web`
- `apps/api`

删除：

- `apps/worker`

原因：轻量版不提供异步 compute job 平台，回测走同步或 API 内部短任务。若未来需要长任务，再新增一个专门的 lightweight queue，不保留现有 worker。

### 2.2 Packages

保留：

- `packages/shared-types`
- `packages/trading-engine`
- `packages/control-plane-store`
- `packages/db`

删除：

- `packages/task-workflow-engine`
- `packages/control-plane-runtime`
- `packages/llm-provider`
- `packages/ui` 如果没有被核心页面直接引用

保留理由：

- `shared-types`: 只保留 market、strategy、backtest、execution、risk、settings 所需类型。
- `trading-engine`: 只保留 core market/backtest/risk/execution/strategy 基础能力。
- `control-plane-store`: 降级为轻量文件存储，保留策略、回测、执行、风险配置。
- `db`: 如果当前轻量 store 仍依赖 collection/sqlite adapter，则保留；否则第二轮再删除。

### 2.3 API Route Whitelist

最终只保留：

- `GET /api/health`
- `GET /api/auth/session`
- `GET /api/market/snapshot`
- `GET /api/market/bars`
- `GET /api/strategies`
- `GET /api/strategies/:id`
- `POST /api/strategies`
- `PATCH /api/strategies/:id`
- `POST /api/backtests`
- `GET /api/backtests`
- `GET /api/backtests/:id`
- `GET /api/execution/state`
- `POST /api/execution/plans`
- `POST /api/execution/orders/:id/cancel`
- `GET /api/risk/state`
- `PATCH /api/risk/settings`
- `POST /api/risk/kill-switch`
- `GET /api/settings`
- `PATCH /api/settings`

删除全部其他 route，包括：

- agent
- analytics
- audit
- collaboration
- compliance
- compute
- data
- docs
- export
- incidents
- marketplace
- monitoring
- notification
- operations
- promotion
- research workspace
- scheduler
- sse 如果轻量版第一阶段不用服务端推送
- task-orchestrator
- user-account 多租户相关接口

### 2.4 Frontend Module Whitelist

最终只保留：

- `apps/web/src/app`
- `apps/web/src/components/layout`
- `apps/web/src/components/common`
- `apps/web/src/components/charts`
- `apps/web/src/components/business` 中核心交易表格
- `apps/web/src/components/trading`
- `apps/web/src/modules/console`
- `apps/web/src/modules/risk`
- `apps/web/src/pages/console`
- `apps/web/src/pages/backtest`
- `apps/web/src/pages/risk`
- `apps/web/src/pages/strategies`
- `apps/web/src/pages/trading`
- `apps/web/src/hooks` 中核心 hook
- `apps/web/src/store/trading-system`

删除：

- `apps/web/src/modules/agent`
- `apps/web/src/modules/audit`
- `apps/web/src/modules/data`
- `apps/web/src/modules/operations`
- `apps/web/src/modules/notifications`
- `apps/web/src/modules/permissions` 如果权限系统降级为单用户 session 后不再使用
- `apps/web/src/pages/analytics`
- `apps/web/src/pages/data`
- `apps/web/src/pages/marketplace`
- `apps/web/src/pages/notifications`
- onboarding 如不再需要

---

## 3. Commit Plan

### Commit 0.1: Create Simplification Plan

**Files:**

- Create: `docs/plans/2026-05-30-quantpilot-core-console-simplification-plan.md`

**Steps:**

- [ ] Add this plan document.
- [ ] Run `npm run typecheck`.
- [ ] Commit: `docs: add core console simplification plan`

**Validation:**

- [ ] `npm run typecheck` passes.

---

### Commit 1.1: Rename Product Boundary in Documentation

**Files:**

- Modify: `README.md`
- Modify: `README.zh-CN.md` if present.
- Modify: `docs/architecture/project-structure.md` if present.
- Modify: `docs/operations-handbook.md` if present.
- Modify: `docs/plans/2026-05-10-quantpilot-institutional-research-platform-roadmap.md`
- Modify: `docs/plans/2026-05-24-production-hardening-plan.md`

**Actions:**

- [ ] Change product positioning to `QuantPilot Lite: quantitative research and paper execution console`.
- [ ] Move institutional roadmap and production hardening plan into `docs/archive/plans/`.
- [ ] Add a short note in archived plans: `Archived after core-console simplification; not active product scope.`
- [ ] Remove claims that current project targets institutional operations, multi-tenant governance, connector marketplace, compute platform, or Agent collaboration.

**Validation:**

- [ ] `rg -n "institutional|multi-tenant|marketplace|compute job|Agent Collaboration|live trading" README.md README.zh-CN.md docs -g "*.md"` only returns archived plan references or explicit out-of-scope notes.
- [ ] `npm run lint`

**Commit:**

```bash
git add README.md README.zh-CN.md docs
git commit -m "docs: redefine project as core console"
```

---

### Commit 1.2: Remove Non-Core Frontend Navigation and Routes

**Files:**

- Modify: `apps/web/src/modules/console/console.routes.tsx`
- Modify: `apps/web/src/modules/console/console.i18n.tsx`
- Modify: `apps/web/src/components/layout/ConsoleChrome.tsx`
- Modify: `apps/web/src/components/layout/NavIcons.tsx`
- Delete page directories listed in section 2.4.

**Target route list:**

```ts
const CORE_ROUTES = [
  '/dashboard',
  '/market',
  '/trading',
  '/strategies',
  '/strategies/:id',
  '/backtest',
  '/risk',
  '/execution',
  '/settings',
];
```

**Actions:**

- [ ] Remove route definitions for Agent, Notifications, Marketplace, Analytics, Data and any deleted page.
- [ ] Remove sidebar nav entries for deleted pages.
- [ ] Remove imports of deleted modules.
- [ ] Ensure `/` still redirects or aliases to `/dashboard`.
- [ ] Ensure no visible UI mentions removed modules.

**Validation:**

- [ ] `rg -n "Agent|Notifications|Marketplace|Analytics|Data Console|Operations|Compliance" apps/web/src`
- [ ] Expected: no route/nav/page hits except historical comments already scheduled for deletion.
- [ ] `npm run test:web`
- [ ] `npm run build`

**Commit:**

```bash
git add apps/web/src
git commit -m "feat: reduce web app to core console routes"
```

---

### Commit 1.3: Delete Non-Core Frontend Modules and Tests

**Files:**

- Delete: `apps/web/src/modules/agent/`
- Delete: `apps/web/src/modules/audit/`
- Delete: `apps/web/src/modules/data/`
- Delete: `apps/web/src/modules/operations/`
- Delete: `apps/web/src/modules/notifications/`
- Delete: deleted module tests from `package.json` `test:web`.
- Delete: deleted page tests.

**Actions:**

- [ ] Remove files instead of leaving stubs.
- [ ] Update `package.json` `test:web` script so it references only existing core tests.
- [ ] Remove imports from deleted modules.

**Validation:**

- [ ] `rg -n "modules/(agent|audit|data|operations|notifications)" apps/web/src package.json`
- [ ] Expected: no hits.
- [ ] `npm run test:web`
- [ ] `npm run typecheck`

**Commit:**

```bash
git add apps/web/src package.json
git commit -m "refactor: delete non-core web modules"
```

---

### Commit 2.1: Collapse API Route Surface to Core Routes

**Files:**

- Modify: `apps/api/src/app/routes/platform-routes.ts`
- Modify: `apps/api/src/app/routes/control-plane-routes.ts`
- Delete non-core routers under `apps/api/src/app/routes/routers/`.
- Modify: `apps/api/test/*.test.ts`

**Core routers to keep or create:**

- `health-router.ts`
- `market-router.ts`
- `strategy-router.ts`
- `backtest-router.ts`
- `execution-router.ts`
- `risk-router.ts`
- `settings-router.ts`
- `auth-router.ts` reduced to session only

**Actions:**

- [ ] Replace router registry with the whitelist in section 2.3.
- [ ] Delete non-core route files.
- [ ] Remove route tests for deleted endpoints.
- [ ] Add a route contract test that verifies removed endpoints return 404.

**Route deletion test:**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { invokeGateway } from './helpers/invoke-gateway.ts';

test('non-core endpoints are removed', async () => {
  for (const path of ['/api/agent', '/api/compute/jobs', '/api/data/datasets', '/api/compliance/reports']) {
    const response = await invokeGateway({ method: 'GET', path });
    assert.equal(response.statusCode, 404);
  }
});
```

**Validation:**

- [ ] `npm run test:api`
- [ ] `npm run typecheck`

**Commit:**

```bash
git add apps/api package.json
git commit -m "refactor: reduce api to core route surface"
```

---

### Commit 2.2: Replace Auth With Single-User Local Session

**Files:**

- Modify: `apps/api/src/app/routes/routers/auth-router.ts`
- Delete: `apps/api/src/middleware/auth.ts` if no longer needed.
- Delete: `apps/api/src/modules/auth/broker-key-service.ts`
- Delete: `apps/api/src/modules/auth/team-store.ts`
- Modify: `apps/api/src/modules/auth/user-store.ts` or replace with `apps/api/src/modules/session/service.ts`.
- Modify: `apps/web/src/store/trading-system/TradingSystemProvider.tsx`
- Modify: `apps/web/src/pages/console/routes/SettingsPage.tsx`

**Session model:**

```ts
export type CoreSession = {
  ok: true;
  user: {
    id: 'local-user';
    name: 'Local Operator';
    role: 'operator';
  };
  mode: 'simulated' | 'paper';
};
```

**Actions:**

- [ ] Remove JWT issuance, refresh token, password reset, MFA, API keys, team store and permission catalog from runtime.
- [ ] Keep only `GET /api/auth/session`.
- [ ] Frontend should no longer check granular permissions; core actions are allowed unless kill switch or risk rules block them.
- [ ] Remove permission copy/tests if no remaining consumer exists.

**Validation:**

- [ ] `rg -n "JWT|Bearer|permission|mfa|password-reset|refreshToken|team" apps/api/src apps/web/src`
- [ ] Expected: no runtime hits except user-facing archived docs or migration notes.
- [ ] `npm run test:api`
- [ ] `npm run test:web`

**Commit:**

```bash
git add apps/api/src apps/web/src
git commit -m "refactor: replace auth with local session"
```

---

### Commit 2.3: Unify API Gateway Entry

**Files:**

- Modify: `apps/api/src/main.ts`
- Modify: `apps/api/src/app/index.ts`
- Modify: `apps/api/src/app/hono-app.ts` or delete it if choosing raw Node.
- Modify: `apps/api/src/gateways/alpaca.ts`
- Modify: `apps/api/src/gateways/alpaca-client.ts`
- Modify: `apps/api/src/gateways/alpaca-config.ts`

**Decision:**

Use Hono as the single API entry because the dependency is already installed and middleware is clearer. Delete raw Node gateway server code after route parity is restored.

**Actions:**

- [ ] `apps/api/src/main.ts` should create and serve the Hono app.
- [ ] `apps/api/src/app/hono-app.ts` should mount only core routers.
- [ ] `apps/api/src/gateways/alpaca.ts` should stop exporting `createGatewayServer` and `startGatewayServer`.
- [ ] Move broker/paper adapter functions into `alpaca-client.ts`.
- [ ] Remove custom `.env` parser from `alpaca-config.ts`; read env through `apps/api/src/lib/env.ts`.

**Validation:**

- [ ] `npm run gateway`
- [ ] `curl -s http://127.0.0.1:8787/api/health`
- [ ] Expected JSON includes `"ok":true`.
- [ ] `npm run test:api`
- [ ] `npm run typecheck`

**Commit:**

```bash
git add apps/api/src
git commit -m "refactor: unify api gateway entry"
```

---

### Commit 3.1: Delete Worker and Compute Platform

**Files:**

- Delete: `apps/worker/`
- Delete: `packages/control-plane-store/src/compute-job-store.ts`
- Delete: `packages/control-plane-store/test/compute-job-store.test.ts`
- Delete: `packages/control-plane-store/test/compute-job-contracts.test.ts`
- Delete: `packages/shared-types/src/compute.ts`
- Modify: `packages/shared-types/src/index.ts`
- Modify: root `package.json`
- Modify: root workspace scripts and verify script.

**Actions:**

- [ ] Remove `apps/worker` from workspace expectation by deleting its package directory.
- [ ] Remove `npm run worker` and `npm run test:worker`.
- [ ] Remove `test:worker` from `npm run verify`.
- [ ] Remove compute route tests from `test:api`.
- [ ] Remove compute references in UI and API.

**Validation:**

- [ ] `npm run check:workspaces`
- [ ] `npm run check:lockfile`
- [ ] `npm run typecheck`
- [ ] `npm run verify`

**Commit:**

```bash
git add apps package.json package-lock.json packages
git commit -m "refactor: remove worker and compute platform"
```

---

### Commit 3.2: Delete Agent and LLM Provider

**Files:**

- Delete: `packages/llm-provider/`
- Delete: `packages/task-workflow-engine/src/agent-review-workflows.ts`
- Delete: `packages/task-workflow-engine/test/agent-review-workflows.test.ts`
- Delete: `packages/shared-types/src/ai-research.ts`
- Modify: `packages/shared-types/src/index.ts`
- Modify: root `package.json`
- Modify: root `package-lock.json`

**Actions:**

- [ ] Delete LLM package and all Agent-specific contracts.
- [ ] Remove `@quantpilot/llm-provider` dependency from `apps/api/package.json`.
- [ ] Remove LLM env vars from `.env.example`.
- [ ] Remove Agent docs from README.

**Validation:**

- [ ] `rg -n "llm|LLM|agent|Agent|ANTHROPIC|OPENAI|Claude|OpenAI" apps packages README.md README.zh-CN.md .env.example`
- [ ] Expected: no runtime or README hits.
- [ ] `npm run check:workspaces`
- [ ] `npm run typecheck`
- [ ] `npm run verify`

**Commit:**

```bash
git add apps packages package.json package-lock.json .env.example README.md README.zh-CN.md
git commit -m "refactor: remove agent and llm provider"
```

---

### Commit 3.3: Delete Institutional Runtime and Workflow Engine

**Files:**

- Delete: `packages/control-plane-runtime/`
- Delete: `packages/task-workflow-engine/`
- Modify: imports in `apps/api/src`
- Modify: imports in `apps/web/src`
- Modify: root `package.json`
- Modify: root `package-lock.json`

**Replacement:**

Create a small API-local runtime module only if needed:

- `apps/api/src/core/session.ts`
- `apps/api/src/core/settings.ts`

**Actions:**

- [ ] Replace `getUserAccount()` usage with local session/settings reads.
- [ ] Replace permission policy usage with simple risk/settings checks.
- [ ] Delete workflow orchestration routes and tests.

**Validation:**

- [ ] `rg -n "control-plane-runtime|task-workflow-engine|workflow|orchestrator" apps packages package.json`
- [ ] Expected: no runtime hits.
- [ ] `npm run check:workspaces`
- [ ] `npm run typecheck`
- [ ] `npm run test:api`

**Commit:**

```bash
git add apps packages package.json package-lock.json
git commit -m "refactor: remove institutional runtime workflows"
```

---

### Commit 4.1: Simplify Shared Types

**Files:**

- Keep and reduce: `packages/shared-types/src/trading.ts`
- Keep and reduce: `packages/shared-types/src/backtest.ts`
- Modify: `packages/shared-types/src/index.ts`
- Delete:
  - `packages/shared-types/src/ai-research.ts`
  - `packages/shared-types/src/compute.ts`
  - `packages/shared-types/src/connectors.ts`
  - `packages/shared-types/src/data-science.ts`
  - `packages/shared-types/src/experiments.ts`
  - `packages/shared-types/src/lifecycle.ts`
  - `packages/shared-types/src/organization.ts`
  - `packages/shared-types/src/platform-events.ts`
  - `packages/shared-types/src/research.ts`
  - `packages/shared-types/src/strategy-package.ts`

**Core type groups:**

- Market snapshot and bars.
- Strategy summary/detail.
- Backtest spec/run/result.
- Execution plan/order/position/account.
- Risk settings/status/kill switch.
- Runtime settings/session.

**Actions:**

- [ ] Identify all remaining imports from deleted shared type modules.
- [ ] Move only required type definitions into `trading.ts` or `backtest.ts`.
- [ ] Do not keep broad institutional type aliases for future use.

**Validation:**

- [ ] `rg -n "@shared-types/(ai-research|compute|connectors|data-science|experiments|lifecycle|organization|platform-events|research|strategy-package)" apps packages`
- [ ] Expected: no hits.
- [ ] `npm run typecheck`
- [ ] `npm run test:web`
- [ ] `npm run test:api`

**Commit:**

```bash
git add packages/shared-types apps packages
git commit -m "refactor: simplify shared type surface"
```

---

### Commit 4.2: Simplify Trading Engine

**Files:**

- Keep:
  - `packages/trading-engine/src/backtest/`
  - `packages/trading-engine/src/execution/`
  - `packages/trading-engine/src/risk/`
  - `packages/trading-engine/src/market/`
  - `packages/trading-engine/src/strategy/`
- Delete:
  - `packages/trading-engine/src/connectors/`
  - `packages/trading-engine/src/data-quality/`
  - `packages/trading-engine/src/strategy/package-validator.ts`
  - advanced lifecycle/promotion files if no longer used.

**Actions:**

- [ ] Keep cost/slippage and basic metrics.
- [ ] Delete data connector, broker connector marketplace abstractions, feature lineage, strategy package manifest.
- [ ] Keep only risk checks needed by the Risk page and execution precheck.
- [ ] Keep simulated broker adapter if used by paper/simulated execution.

**Validation:**

- [ ] `npm run test:engine`
- [ ] `npm run typecheck`

**Commit:**

```bash
git add packages/trading-engine packages/shared-types
git commit -m "refactor: reduce trading engine to core simulation"
```

---

### Commit 4.3: Simplify Control Plane Store

**Files:**

- Keep or create:
  - `packages/control-plane-store/src/store.ts`
  - `packages/control-plane-store/src/context.ts`
  - `packages/control-plane-store/src/core-store.ts`
- Delete:
  - artifact integrity
  - audit report store
  - compute job store
  - dataset registry
  - experiment registry
  - feature registry
  - model registry
  - organization store
  - promotion store
  - research workspace store
  - institutional repositories not used by core pages.

**Core persisted objects:**

- `settings.json`
- `strategies.json`
- `backtest-runs.json`
- `execution-state.json`
- `risk-settings.json`

**Actions:**

- [ ] Replace registry APIs with direct collection helpers.
- [ ] Remove append-only institutional audit requirements.
- [ ] Keep simple execution event log inside `execution-state.json`.

**Validation:**

- [ ] `npm run test:control-plane`
- [ ] `npm run typecheck`

**Commit:**

```bash
git add packages/control-plane-store apps/api/src
git commit -m "refactor: simplify control plane store"
```

---

### Commit 5.1: Rebuild Core API Tests

**Files:**

- Delete obsolete `apps/api/test/stage-*.test.ts`.
- Delete obsolete route tests for removed endpoints.
- Create: `apps/api/test/core-api.test.ts`
- Create: `apps/api/test/core-backtest.test.ts`
- Create: `apps/api/test/core-execution-risk.test.ts`

**Required coverage:**

- Health endpoint returns ok.
- Session endpoint returns local operator.
- Strategy CRUD works.
- Backtest can be submitted and listed.
- Execution state returns account, positions and orders.
- Risk kill switch blocks new execution plan.
- Removed endpoints return 404.

**Validation:**

- [ ] `npm run test:api`

**Commit:**

```bash
git add apps/api/test package.json
git commit -m "test: rebuild api tests around core console"
```

---

### Commit 5.2: Rebuild Core Web Tests

**Files:**

- Modify: root `package.json` `test:web`.
- Delete tests for removed modules/pages.
- Keep or create:
  - `apps/web/src/pages/settings-page.test.tsx`
  - `apps/web/src/pages/research-pages.test.tsx` renamed to core strategy/backtest page tests if needed.
  - `apps/web/src/modules/console/execution-panels.test.tsx`
  - `apps/web/src/modules/risk/risk-workbench.test.tsx`
  - `apps/web/src/store/trading-system/TradingSystemProvider.test.tsx`

**Required coverage:**

- Core route list contains only allowed pages.
- Dashboard renders with session and state.
- Strategy page renders list and detail link.
- Backtest page renders result panels.
- Execution page renders plan/order/account state.
- Risk page renders kill switch and settings.
- Settings page renders mode and broker paper settings.

**Validation:**

- [ ] `npm run test:web`
- [ ] `npm run build`

**Commit:**

```bash
git add apps/web/src package.json
git commit -m "test: rebuild web tests around core console"
```

---

### Commit 6.1: Remove Deleted Assets, Env, and Scripts

**Files:**

- Modify: `.env.example`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `scripts/check-workspace-integrity.ts`
- Modify: `scripts/typecheck-all.ts`
- Delete scripts only used by removed systems.

**Final env keys:**

```env
VITE_REFRESH_MS=5000
VITE_TRADING_MODE=simulated
VITE_MARKET_DATA_PROVIDER=simulated
VITE_MARKET_DATA_HTTP_URL=
VITE_BROKER_PROVIDER=simulated
VITE_BROKER_HTTP_URL=
GATEWAY_PORT=8787
QUANTPILOT_TRADING_MODE=simulated
QUANTPILOT_CONTROL_PLANE_ADAPTER=file
QUANTPILOT_CONTROL_PLANE_NAMESPACE=core-console
```

**Actions:**

- [ ] Remove LLM env keys.
- [ ] Remove live trading ack env keys.
- [ ] Remove broker secret examples unless paper adapter still needs them.
- [ ] Remove worker scripts.
- [ ] Remove test scripts for deleted packages.
- [ ] Ensure `npm run verify` uses only existing workspaces.

**Validation:**

- [ ] `npm run check:workspaces`
- [ ] `npm run check:lockfile`
- [ ] `npm run check:no-js-source`
- [ ] `npm run typecheck`

**Commit:**

```bash
git add .env.example package.json package-lock.json scripts
git commit -m "chore: remove non-core scripts and env"
```

---

### Commit 6.2: Final Documentation Pass

**Files:**

- Modify: `README.md`
- Modify: `README.zh-CN.md` if present.
- Modify: `docs/architecture/project-structure.md`
- Modify: `docs/deployment.md`
- Modify: `docs/operations-handbook.md`
- Delete or archive docs for removed systems.

**Required docs:**

- How to run: `npm run dev`, `npm run gateway`.
- Core routes.
- Runtime modes: `simulated | paper`.
- What was removed and why.
- Verification command: `npm run verify`.
- Safety boundary: no live trading.

**Validation:**

- [ ] `rg -n "live|Agent|compute|worker|marketplace|multi-tenant|organization|compliance" README.md README.zh-CN.md docs -g "*.md"`
- [ ] Expected: no active-scope hits; archived docs may mention removed features.
- [ ] `npm run lint`

**Commit:**

```bash
git add README.md README.zh-CN.md docs
git commit -m "docs: document core console scope"
```

---

### Commit 7.1: Full Verification and Cleanup

**Files:**

- Modify only files needed to fix verification failures.

**Actions:**

- [ ] Run `npm run verify`.
- [ ] Fix every failure by deleting stale references or adjusting core tests.
- [ ] Run `git status --short` and inspect all changed files.
- [ ] Run `rg -n "agent|compute|worker|marketplace|compliance|organization|promotion|dataset registry|feature registry|model registry|experiment registry" apps packages README.md docs package.json .env.example`.
- [ ] For each hit, decide whether it is an archived doc reference or stale runtime code. Delete stale runtime code.

**Validation:**

- [ ] `npm run verify` passes.
- [ ] `git status --short` contains only intentional changes.

**Commit:**

```bash
git add .
git commit -m "chore: finish core console cleanup"
```

---

## 4. Verification Strategy

Run after each commit:

```bash
npm run typecheck
```

Run after frontend commits:

```bash
npm run test:web
npm run build
```

Run after API commits:

```bash
npm run test:api
```

Run after package deletions:

```bash
npm run check:workspaces
npm run check:lockfile
npm run check:no-js-source
npm run typecheck
```

Final gate:

```bash
npm run verify
```

Manual smoke test:

```bash
npm run gateway
npm run dev
```

Open:

```text
http://localhost:8080/
```

Check:

- Dashboard loads.
- Market page loads.
- Strategies page loads.
- Backtest page can render and submit a sample run.
- Execution page shows account/order state.
- Risk page kill switch blocks execution.
- Settings page updates mode without exposing live trading.

---

## 5. Risk Controls

### 5.1 Avoid Half-Deleted Systems

Every deleted system must be removed from five places:

- Route registry.
- UI navigation.
- Tests.
- Shared type exports.
- Documentation/scripts/env.

Do not leave hidden routes or unused package exports “for future use”.

### 5.2 Keep Commits Reviewable

Do not combine frontend deletion, API deletion and package deletion in one commit. Each commit should either:

- reduce visible product surface,
- reduce API surface,
- remove one backend subsystem,
- rebuild tests,
- update docs.

### 5.3 No Live Trading

Lightweight QuantPilot must not contain runnable live trading paths. Search for `live` after every execution/risk change. Acceptable hits are limited to archived documentation explaining removal.

### 5.4 No Agent / LLM Runtime

After Commit 3.2, no runtime code should reference LLM providers, Agent tools, Agent review, tool policy or AI assistant actions.

### 5.5 No Institutional Drift

Do not recreate organization/team/permission/promotion concepts while simplifying. If a page needs action gating, use direct risk state and runtime mode checks.

---

## 6. Expected Final Repository Shape

```text
apps/
├── api/
└── web/

packages/
├── control-plane-store/
├── db/
├── shared-types/
└── trading-engine/

docs/
├── architecture/
├── archive/
└── plans/
```

Expected root scripts:

```json
{
  "dev": "vite --config apps/web/vite.config.ts --host 0.0.0.0 --port 8080",
  "gateway": "node --import tsx/esm apps/api/src/main.ts",
  "build": "vite build --config apps/web/vite.config.ts",
  "test:api": "node --import tsx/esm --test apps/api/test/*.test.ts",
  "test:engine": "node --import tsx/esm --test packages/trading-engine/test/*.ts",
  "test:control-plane": "node --import tsx/esm --test packages/control-plane-store/test/*.test.ts",
  "test:web": "vitest run --config apps/web/vite.config.ts --environment node",
  "typecheck": "node --import tsx/esm scripts/typecheck-all.ts",
  "verify": "npm run check:workspaces && npm run check:lockfile && npm run check:no-js-source && npm run lint && npm run test:control-plane && npm run test:engine && npm run test:api && npm run test:web && npm run typecheck && npm run build"
}
```

---

## 7. Done Definition

The simplification is complete only when all of these are true:

- `apps/worker` is gone.
- Agent, compute, data registry, feature registry, model registry, experiment registry, organization, compliance, marketplace and promotion workflow runtime code is gone.
- Web navigation contains only core pages.
- API exposes only the core whitelist.
- `live` trading cannot be selected or reached.
- `npm run verify` passes.
- README documents the lightweight product scope.
- Archived roadmap files are clearly marked as inactive.

