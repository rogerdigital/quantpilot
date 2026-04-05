# Agent Trading Governance P0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the P0 governance skeleton for QuantPilot Agent: policy-driven execution authority, operator chat instructions that produce same-day bias, mixed-trigger Agent daily runs, and visible authority/degradation state in the UI.

**Architecture:** Extend the existing `session / intent / plan / analysis run / action request` Agent backbone instead of replacing it. Add first-class control-plane contracts for Agent policy, Agent instructions, Agent daily runs, and Agent authority events; then wire them through runtime, API, worker triggers, and the Agent / Settings UI so the system can evaluate authority and surface daily operating state before any deeper autonomy is enabled.

**Tech Stack:** React 18, TypeScript, Vite, Node ESM `.mjs`, npm workspaces, Vitest, `node --test`, control-plane runtime/store.

---

## File Structure

### New files

- `apps/api/test/stage-7-agent-governance-baseline.test.mjs`
  - New baseline contract test for Agent governance P0.
- `apps/web/src/modules/agent/agent-governance.test.tsx`
  - Focused UI test coverage for authority state and daily bias rendering.
- `packages/control-plane-store/src/repositories/agent-policy-repo.mjs`
  - Persistence contract for account / strategy / action authority rules.
- `packages/control-plane-store/src/repositories/agent-instruction-repo.mjs`
  - Persistence contract for operator chat-derived daily instructions.
- `packages/control-plane-store/src/repositories/agent-daily-run-repo.mjs`
  - Persistence contract for scheduled and event-triggered Agent runs.
- `packages/control-plane-store/src/repositories/agent-authority-event-repo.mjs`
  - Persistence contract for downgrade / stop / recovery events.
- `apps/api/src/domains/agent/services/policy-service.mjs`
  - Authority resolution, bounds evaluation, and effective-mode calculation.
- `apps/api/src/domains/agent/services/instruction-service.mjs`
  - Chat instruction classification and current-day bias management.
- `apps/api/src/domains/agent/services/runtime-service.mjs`
  - Mixed-trigger Agent daily run orchestration for P0.
- `apps/web/src/modules/agent/agentGovernance.service.ts`
  - Frontend service wrapper for governance endpoints.
- `apps/web/src/modules/agent/useAgentGovernance.ts`
  - Shared hook for authority state, daily bias, and pending governance state.

### Existing files to modify

- `packages/shared-types/src/trading.ts`
  - Add shared types for Agent policy, instruction, daily run, and authority events.
- `packages/control-plane-store/src/index.mjs`
  - Export new repositories.
- `packages/control-plane-store/src/context.mjs`
  - Register new repositories in runtime context.
- `packages/control-plane-store/src/shared.mjs`
  - Add normalizers/builders for new Agent governance records.
- `packages/control-plane-runtime/src/index.mjs`
  - Add runtime methods and list/get/update flows for governance records.
- `packages/control-plane-store/test/control-plane-context.test.mjs`
  - Verify new repository availability and persistence contracts.
- `apps/api/src/domains/agent/services/analysis-service.mjs`
  - Evaluate authority against proposed actions and include same-day bias context.
- `apps/api/src/domains/agent/services/action-request-service.mjs`
  - Route decisions through authority guard before execution / ask-first handoff.
- `apps/api/src/domains/agent/services/workbench-service.mjs`
  - Expose authority state, daily bias, recent runs, and degradation info in workbench payload.
- `apps/api/src/app/routes/routers/agent-router.mjs`
  - Add governance endpoints.
- `apps/worker/src/tasks/workflow-execution-task.mjs`
  - Dispatch P0 mixed-trigger Agent run workflows if queued there.
- `apps/worker/test/worker-workflow-e2e.test.mjs`
  - Cover Agent daily run workflow execution.
- `apps/web/src/modules/agent/AgentPage.tsx`
  - Surface daily bias, authority mode, and recent governance events.
- `apps/web/src/modules/agent/useAgentTools.ts`
  - Keep session tools focused on analysis; delegate governance state to dedicated hook.
- `apps/web/src/pages/console/routes/SettingsPage.tsx`
  - Add Agent Governance panel for P0 policy inspection and edit flows.
- `apps/web/src/app/api/controlPlane.ts`
  - Add API helpers for governance payloads.
- `package.json`
  - Extend `test:web` / `test:api` if explicit file list needs new tests.

### Existing files to inspect during implementation

- `apps/api/src/domains/agent/services/intent-service.mjs`
- `apps/api/src/domains/agent/services/planning-service.mjs`
- `apps/api/src/domains/execution/services/lifecycle-service.mjs`
- `apps/api/src/modules/user-account/service.mjs`
- `apps/api/src/modules/monitoring/service.mjs`
- `apps/web/src/modules/console/console.i18n.tsx`
- `apps/web/src/app/styles/style.css`

---

### Task 1: Define Shared Governance Contracts

**Files:**
- Modify: `packages/shared-types/src/trading.ts`
- Test: `apps/api/test/stage-7-agent-governance-baseline.test.mjs`

- [ ] **Step 1: Write the failing baseline contract test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { invokeGateway } from './helpers/invoke-gateway.mjs';

test('stage 7 baseline exposes agent governance contracts', async () => {
  const response = await invokeGateway({
    method: 'GET',
    path: '/api/agent/workbench',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(typeof response.json.authorityState.mode, 'string');
  assert.equal(Array.isArray(response.json.dailyBias.instructions), true);
  assert.equal(Array.isArray(response.json.authorityEvents), true);
  assert.equal(Array.isArray(response.json.dailyRuns), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test apps/api/test/stage-7-agent-governance-baseline.test.mjs`
Expected: FAIL because `authorityState`, `dailyBias`, `authorityEvents`, and `dailyRuns` are not present yet.

- [ ] **Step 3: Add shared types for governance contracts**

```ts
export type AgentAuthorityMode =
  | 'full_auto'
  | 'bounded_auto'
  | 'ask_first'
  | 'manual_only'
  | 'stopped';

export type AgentInstructionKind =
  | 'conversation'
  | 'daily_bias'
  | 'market_intel'
  | 'watch_focus'
  | 'strategy_change_request';

export type AgentDailyRunKind =
  | 'pre_market'
  | 'intraday_monitor'
  | 'post_market'
  | 'operator_update'
  | 'risk_event'
  | 'execution_event'
  | 'market_event';

export type AgentPolicyRecord = {
  id: string;
  accountId: string;
  strategyId: string;
  actionType: string;
  environment: 'paper' | 'live' | 'all';
  authority: AgentAuthorityMode;
  singleActionMaxNotional: number;
  singleActionMaxEquityPct: number;
  strategyExposureMaxPct: number;
  dailyAutoActionLimit: number;
  dailyLossLimitPct: number;
  maxDrawdownLimitPct: number;
  createdAt: string;
  updatedAt: string;
};

export type AgentInstructionRecord = {
  id: string;
  sessionId: string;
  kind: AgentInstructionKind;
  title: string;
  body: string;
  requestedBy: string;
  activeUntil: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type AgentDailyRunRecord = {
  id: string;
  kind: AgentDailyRunKind;
  status: 'queued' | 'running' | 'completed' | 'failed';
  trigger: 'schedule' | 'event';
  accountId: string;
  strategyId: string;
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type AgentAuthorityEventRecord = {
  id: string;
  severity: 'info' | 'warn' | 'critical';
  eventType: 'downgraded' | 'stopped' | 'restored' | 'blocked';
  previousMode: AgentAuthorityMode;
  nextMode: AgentAuthorityMode;
  reason: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};
```

- [ ] **Step 4: Run the new baseline test to verify type-level payload consumers now compile once server payload work lands**

Run: `node --test apps/api/test/stage-7-agent-governance-baseline.test.mjs`
Expected: still FAIL on missing API payload fields, but no syntax/type-contract ambiguity remains.

- [ ] **Step 5: Commit**

```bash
git add packages/shared-types/src/trading.ts apps/api/test/stage-7-agent-governance-baseline.test.mjs
git commit -m "feat: add agent governance shared contracts"
```

### Task 2: Add Control-Plane Persistence For Governance Records

**Files:**
- Create: `packages/control-plane-store/src/repositories/agent-policy-repo.mjs`
- Create: `packages/control-plane-store/src/repositories/agent-instruction-repo.mjs`
- Create: `packages/control-plane-store/src/repositories/agent-daily-run-repo.mjs`
- Create: `packages/control-plane-store/src/repositories/agent-authority-event-repo.mjs`
- Modify: `packages/control-plane-store/src/shared.mjs`
- Modify: `packages/control-plane-store/src/context.mjs`
- Modify: `packages/control-plane-store/src/index.mjs`
- Test: `packages/control-plane-store/test/control-plane-context.test.mjs`

- [ ] **Step 1: Write the failing repository-context test**

```js
test('control plane context exposes agent governance repositories', () => {
  const context = createControlPlaneContext({ adapter: 'memory' });

  assert.equal(typeof context.agentPolicy.list, 'function');
  assert.equal(typeof context.agentInstruction.list, 'function');
  assert.equal(typeof context.agentDailyRun.list, 'function');
  assert.equal(typeof context.agentAuthorityEvent.list, 'function');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test packages/control-plane-store/test/control-plane-context.test.mjs`
Expected: FAIL because the new repositories are not registered on context.

- [ ] **Step 3: Add normalizers and repositories**

```js
export function normalizeAgentPolicy(record = {}) {
  const now = record.updatedAt || new Date().toISOString();
  return {
    id: record.id || `agent-policy-${Date.now()}`,
    accountId: record.accountId || 'default',
    strategyId: record.strategyId || 'all',
    actionType: record.actionType || 'all',
    environment: record.environment || 'all',
    authority: record.authority || 'manual_only',
    singleActionMaxNotional: Number(record.singleActionMaxNotional || 0),
    singleActionMaxEquityPct: Number(record.singleActionMaxEquityPct || 0),
    strategyExposureMaxPct: Number(record.strategyExposureMaxPct || 0),
    dailyAutoActionLimit: Number(record.dailyAutoActionLimit || 0),
    dailyLossLimitPct: Number(record.dailyLossLimitPct || 0),
    maxDrawdownLimitPct: Number(record.maxDrawdownLimitPct || 0),
    createdAt: record.createdAt || now,
    updatedAt: now,
  };
}
```

```js
export function createAgentPolicyRepo(store) {
  return {
    list(limit = 50) { return store.list('agent-policies', limit); },
    get(id) { return store.get('agent-policies', id); },
    upsert(payload) {
      const record = normalizeAgentPolicy(payload);
      store.put('agent-policies', record.id, record);
      return record;
    },
  };
}
```

- [ ] **Step 4: Register the repositories in context and public exports**

```js
agentPolicy: createAgentPolicyRepo(store),
agentInstruction: createAgentInstructionRepo(store),
agentDailyRun: createAgentDailyRunRepo(store),
agentAuthorityEvent: createAgentAuthorityEventRepo(store),
```

- [ ] **Step 5: Run repository test to verify it passes**

Run: `node --test packages/control-plane-store/test/control-plane-context.test.mjs`
Expected: PASS with new repository functions available on context.

- [ ] **Step 6: Commit**

```bash
git add packages/control-plane-store/src/repositories/agent-policy-repo.mjs packages/control-plane-store/src/repositories/agent-instruction-repo.mjs packages/control-plane-store/src/repositories/agent-daily-run-repo.mjs packages/control-plane-store/src/repositories/agent-authority-event-repo.mjs packages/control-plane-store/src/shared.mjs packages/control-plane-store/src/context.mjs packages/control-plane-store/src/index.mjs packages/control-plane-store/test/control-plane-context.test.mjs
git commit -m "feat: add agent governance repositories"
```

### Task 3: Extend Control-Plane Runtime With Governance APIs

**Files:**
- Modify: `packages/control-plane-runtime/src/index.mjs`
- Test: `packages/control-plane-runtime/test/control-plane-runtime.test.mjs`

- [ ] **Step 1: Write the failing runtime test**

```js
test('control plane runtime persists agent governance records', () => {
  const policy = runtime.saveAgentPolicy({ accountId: 'paper-main', strategyId: 'trend', actionType: 'enter', authority: 'bounded_auto' });
  const instruction = runtime.recordAgentInstruction({ sessionId: 'session-1', kind: 'daily_bias', title: 'Conservative bias', body: 'Trade lighter today.' });
  const dailyRun = runtime.recordAgentDailyRun({ kind: 'pre_market', trigger: 'schedule', accountId: 'paper-main', strategyId: 'trend' });
  const authorityEvent = runtime.recordAgentAuthorityEvent({ eventType: 'downgraded', previousMode: 'full_auto', nextMode: 'ask_first', reason: 'daily drawdown breach' });

  assert.equal(policy.authority, 'bounded_auto');
  assert.equal(instruction.kind, 'daily_bias');
  assert.equal(dailyRun.kind, 'pre_market');
  assert.equal(authorityEvent.nextMode, 'ask_first');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test packages/control-plane-runtime/test/control-plane-runtime.test.mjs`
Expected: FAIL because runtime methods do not exist yet.

- [ ] **Step 3: Add runtime methods that delegate to new repositories**

```js
saveAgentPolicy(payload = {}) {
  return context.agentPolicy.upsert(payload);
},
listAgentPolicies(limit = 50) {
  return context.agentPolicy.list(limit);
},
recordAgentInstruction(payload = {}) {
  return context.agentInstruction.upsert(payload);
},
listAgentInstructions(limit = 50) {
  return context.agentInstruction.list(limit);
},
recordAgentDailyRun(payload = {}) {
  return context.agentDailyRun.upsert(payload);
},
listAgentDailyRuns(limit = 50) {
  return context.agentDailyRun.list(limit);
},
recordAgentAuthorityEvent(payload = {}) {
  return context.agentAuthorityEvent.upsert(payload);
},
listAgentAuthorityEvents(limit = 50) {
  return context.agentAuthorityEvent.list(limit);
},
```

- [ ] **Step 4: Run runtime test to verify it passes**

Run: `node --test packages/control-plane-runtime/test/control-plane-runtime.test.mjs`
Expected: PASS with runtime delegates available for all governance records.

- [ ] **Step 5: Commit**

```bash
git add packages/control-plane-runtime/src/index.mjs packages/control-plane-runtime/test/control-plane-runtime.test.mjs
git commit -m "feat: add agent governance runtime methods"
```

### Task 4: Build Authority Resolution And Daily Bias Services

**Files:**
- Create: `apps/api/src/domains/agent/services/policy-service.mjs`
- Create: `apps/api/src/domains/agent/services/instruction-service.mjs`
- Modify: `apps/api/src/domains/agent/services/analysis-service.mjs`
- Test: `apps/api/test/gateway-routes.test.mjs`

- [ ] **Step 1: Write the failing API behavior tests**

```js
test('POST /api/agent/instructions records a daily bias instruction', async () => {
  const response = await invokeGateway({
    method: 'POST',
    path: '/api/agent/instructions',
    body: { sessionId: 'session-1', kind: 'daily_bias', title: 'Conservative', body: 'Trade smaller today.' },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.instruction.kind, 'daily_bias');
});

test('GET /api/agent/authority resolves the most restrictive mode', async () => {
  const response = await invokeGateway({
    method: 'GET',
    path: '/api/agent/authority?accountId=live-main&strategyId=trend&actionType=enter&environment=live',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(typeof response.json.mode, 'string');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test apps/api/test/gateway-routes.test.mjs`
Expected: FAIL because the instruction and authority routes do not exist.

- [ ] **Step 3: Add policy and instruction services**

```js
export function resolveAgentAuthority({ accountId, strategyId, actionType, environment = 'paper', riskMode = 'healthy', anomalyMode = 'healthy' }) {
  const policies = controlPlaneRuntime.listAgentPolicies(200).filter((item) => (
    (item.accountId === accountId || item.accountId === 'all')
    && (item.strategyId === strategyId || item.strategyId === 'all')
    && (item.actionType === actionType || item.actionType === 'all')
    && (item.environment === environment || item.environment === 'all')
  ));

  const ordered = ['full_auto', 'bounded_auto', 'ask_first', 'manual_only', 'stopped'];
  const resolved = policies.sort((a, b) => ordered.indexOf(b.authority) - ordered.indexOf(a.authority)).at(-1)?.authority || 'manual_only';
  const downgraded = anomalyMode === 'critical' || riskMode === 'risk_off'
    ? 'stopped'
    : anomalyMode === 'warn' && resolved === 'full_auto'
      ? 'ask_first'
      : resolved;

  return { ok: true, mode: downgraded, policies };
}
```

```js
export function createAgentInstruction(payload = {}) {
  const activeUntil = payload.activeUntil || new Date(new Date(payload.createdAt || Date.now()).getTime() + 24 * 60 * 60 * 1000).toISOString();
  const instruction = controlPlaneRuntime.recordAgentInstruction({
    ...payload,
    activeUntil,
  });
  return { ok: true, instruction };
}
```

- [ ] **Step 4: Thread same-day bias into analysis output**

```js
const dailyBias = listActiveAgentInstructions({
  sessionId: session.id,
  kind: 'daily_bias',
});

const biasSummary = dailyBias.map((item) => item.body).join(' ');

const rationale = [
  ...existingRationale,
  biasSummary ? `Current daily bias: ${biasSummary}` : 'No active daily bias is affecting this session.',
];
```

- [ ] **Step 5: Run API tests to verify they pass**

Run: `node --test apps/api/test/gateway-routes.test.mjs`
Expected: PASS for the new authority and instruction tests, while existing Agent tests remain green.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/domains/agent/services/policy-service.mjs apps/api/src/domains/agent/services/instruction-service.mjs apps/api/src/domains/agent/services/analysis-service.mjs apps/api/test/gateway-routes.test.mjs
git commit -m "feat: add agent authority and instruction services"
```

### Task 5: Expose Governance Endpoints And Workbench Payload

**Files:**
- Modify: `apps/api/src/app/routes/routers/agent-router.mjs`
- Modify: `apps/api/src/domains/agent/services/workbench-service.mjs`
- Test: `apps/api/test/stage-7-agent-governance-baseline.test.mjs`

- [ ] **Step 1: Extend the failing baseline assertions**

```js
assert.equal(typeof response.json.authorityState.mode, 'string');
assert.equal(typeof response.json.authorityState.reason, 'string');
assert.equal(Array.isArray(response.json.dailyBias.instructions), true);
assert.equal(Array.isArray(response.json.dailyRuns), true);
assert.equal(Array.isArray(response.json.authorityEvents), true);
```

- [ ] **Step 2: Run baseline test to verify it fails**

Run: `node --test apps/api/test/stage-7-agent-governance-baseline.test.mjs`
Expected: FAIL because workbench payload is still missing governance fields.

- [ ] **Step 3: Add agent governance routes**

```js
if (req.method === 'GET' && reqUrl.pathname === '/api/agent/authority') {
  writeJson(res, 200, resolveAgentAuthority({
    accountId: reqUrl.searchParams.get('accountId') || 'default',
    strategyId: reqUrl.searchParams.get('strategyId') || 'all',
    actionType: reqUrl.searchParams.get('actionType') || 'all',
    environment: reqUrl.searchParams.get('environment') || 'paper',
  }));
  return true;
}

if (req.method === 'POST' && reqUrl.pathname === '/api/agent/instructions') {
  const body = await readJsonBody(req);
  writeJson(res, 200, createAgentInstruction(body || {}));
  return true;
}
```

- [ ] **Step 4: Extend workbench payload**

```js
authorityState: {
  mode: resolved.mode,
  reason: resolved.mode === 'stopped' ? 'risk or anomaly downgrade is active' : 'current effective authority mode',
},
dailyBias: {
  instructions: activeBias,
},
dailyRuns: controlPlaneRuntime.listAgentDailyRuns(limit),
authorityEvents: controlPlaneRuntime.listAgentAuthorityEvents(limit),
```

- [ ] **Step 5: Run baseline test to verify it passes**

Run: `node --test apps/api/test/stage-7-agent-governance-baseline.test.mjs`
Expected: PASS with governance payload fields available from the workbench.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/app/routes/routers/agent-router.mjs apps/api/src/domains/agent/services/workbench-service.mjs apps/api/test/stage-7-agent-governance-baseline.test.mjs
git commit -m "feat: expose agent governance api surfaces"
```

### Task 6: Add Mixed-Trigger Agent Daily Run Skeleton

**Files:**
- Create: `apps/api/src/domains/agent/services/runtime-service.mjs`
- Modify: `apps/api/src/domains/agent/services/action-request-service.mjs`
- Modify: `apps/worker/src/tasks/workflow-execution-task.mjs`
- Test: `apps/worker/test/worker-workflow-e2e.test.mjs`

- [ ] **Step 1: Write the failing worker workflow test**

```js
test('queued agent daily run workflow records a completed pre-market run', async () => {
  const run = controlPlaneRuntime.recordAgentDailyRun({
    kind: 'pre_market',
    trigger: 'schedule',
    status: 'queued',
    accountId: 'paper-main',
    strategyId: 'trend',
  });

  await executeQueuedWorkflow();

  const updated = controlPlaneRuntime.listAgentDailyRuns(1)[0];
  assert.equal(updated.id, run.id);
  assert.equal(updated.status, 'completed');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test apps/worker/test/worker-workflow-e2e.test.mjs`
Expected: FAIL because no Agent daily run workflow exists yet.

- [ ] **Step 3: Add runtime service and minimal worker execution path**

```js
export function runAgentDailyCycle(payload = {}) {
  const run = controlPlaneRuntime.recordAgentDailyRun({
    ...payload,
    status: 'running',
  });

  controlPlaneRuntime.recordAgentAuthorityEvent({
    eventType: 'restored',
    previousMode: 'manual_only',
    nextMode: 'manual_only',
    reason: `Agent daily run ${run.kind} started.`,
  });

  return controlPlaneRuntime.recordAgentDailyRun({
    ...run,
    status: 'completed',
    updatedAt: new Date().toISOString(),
  });
}
```

- [ ] **Step 4: Queue Agent daily run requests through existing workflow machinery**

```js
const workflow = queueWorkflow({
  workflowId: 'task-orchestrator.agent-daily-run',
  workflowType: 'task-orchestrator',
  actor: payload.requestedBy || 'agent',
  trigger: payload.trigger || 'schedule',
  payload,
  maxAttempts: 2,
});
```

- [ ] **Step 5: Run worker test to verify it passes**

Run: `node --test apps/worker/test/worker-workflow-e2e.test.mjs`
Expected: PASS with queued Agent daily runs moving to `completed`.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/domains/agent/services/runtime-service.mjs apps/api/src/domains/agent/services/action-request-service.mjs apps/worker/src/tasks/workflow-execution-task.mjs apps/worker/test/worker-workflow-e2e.test.mjs
git commit -m "feat: add agent daily run workflow skeleton"
```

### Task 7: Surface Governance State In The Agent UI

**Files:**
- Create: `apps/web/src/modules/agent/agentGovernance.service.ts`
- Create: `apps/web/src/modules/agent/useAgentGovernance.ts`
- Modify: `apps/web/src/app/api/controlPlane.ts`
- Modify: `apps/web/src/modules/agent/AgentPage.tsx`
- Modify: `apps/web/src/modules/agent/useAgentTools.ts`
- Test: `apps/web/src/modules/agent/agent-governance.test.tsx`

- [ ] **Step 1: Write the failing UI test**

```tsx
it('renders current authority mode and daily bias on the Agent page', async () => {
  const html = await renderAgentPageWithData({
    authorityState: { mode: 'bounded_auto', reason: 'account and strategy limits apply' },
    dailyBias: { instructions: [{ id: 'bias-1', title: 'Conservative bias', body: 'Trade smaller today.' }] },
  });

  expect(html).toContain('bounded_auto');
  expect(html).toContain('Conservative bias');
  expect(html).toContain('Trade smaller today.');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run apps/web/src/modules/agent/agent-governance.test.tsx --environment node`
Expected: FAIL because the Agent page does not render authority and bias state yet.

- [ ] **Step 3: Add governance client and hook**

```ts
export async function fetchAgentAuthority(query: {
  accountId: string;
  strategyId: string;
  actionType: string;
  environment: 'paper' | 'live';
}) {
  const params = new URLSearchParams(query);
  return fetchJson(`/api/agent/authority?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
}

export async function createAgentInstruction(payload: {
  sessionId: string;
  kind: 'daily_bias' | 'market_intel' | 'watch_focus';
  title: string;
  body: string;
}) {
  return fetchJson('/api/agent/instructions', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}
```

- [ ] **Step 4: Render the new Agent governance surfaces**

```tsx
<article className="panel">
  <div className="panel-head">
    <div>
      <div className="panel-title">{locale === 'zh' ? 'Authority State' : 'Authority State'}</div>
      <div className="panel-copy">{authorityState.reason}</div>
    </div>
    <div className="panel-badge badge-info">{authorityState.mode}</div>
  </div>
  <div className="status-stack">
    {dailyBias.instructions.map((item) => (
      <div className="status-row" key={item.id}>
        <span>{item.title}</span>
        <strong>{item.body}</strong>
      </div>
    ))}
  </div>
</article>
```

- [ ] **Step 5: Run UI test to verify it passes**

Run: `./node_modules/.bin/vitest run apps/web/src/modules/agent/agent-governance.test.tsx --environment node`
Expected: PASS with authority mode and daily bias visible in the Agent page.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/modules/agent/agentGovernance.service.ts apps/web/src/modules/agent/useAgentGovernance.ts apps/web/src/app/api/controlPlane.ts apps/web/src/modules/agent/AgentPage.tsx apps/web/src/modules/agent/useAgentTools.ts apps/web/src/modules/agent/agent-governance.test.tsx
git commit -m "feat: surface agent governance state in ui"
```

### Task 8: Add Agent Governance Controls To Settings

**Files:**
- Modify: `apps/web/src/pages/console/routes/SettingsPage.tsx`
- Modify: `apps/web/src/app/styles/style.css`
- Test: `apps/web/src/pages/settings-page.test.tsx`

- [ ] **Step 1: Write the failing settings test**

```tsx
it('renders the agent governance panel with authority controls', async () => {
  const html = await renderSettingsPage();

  expect(html).toContain('Agent Governance');
  expect(html).toContain('full_auto');
  expect(html).toContain('bounded_auto');
  expect(html).toContain('ask_first');
  expect(html).toContain('manual_only');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run apps/web/src/pages/settings-page.test.tsx --environment node`
Expected: FAIL because Settings does not yet expose Agent governance controls.

- [ ] **Step 3: Add the new governance panel**

```tsx
<article className="panel" id="agent-governance">
  <div className="panel-head">
    <div>
      <div className="panel-title">{locale === 'zh' ? 'Agent Governance' : 'Agent Governance'}</div>
      <div className="panel-copy">{locale === 'zh' ? '管理账户、策略、动作三级执行权限与降级策略。' : 'Manage account, strategy, and action-level execution authority and degradation policy.'}</div>
    </div>
    <div className="panel-badge badge-info">{authorityState.mode}</div>
  </div>
  <div className="settings-chip-row">
    <span className="settings-chip">full_auto</span>
    <span className="settings-chip">bounded_auto</span>
    <span className="settings-chip">ask_first</span>
    <span className="settings-chip">manual_only</span>
  </div>
</article>
```

- [ ] **Step 4: Add minimal styles for governance surfaces**

```css
.agent-governance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.authority-mode-chip {
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

- [ ] **Step 5: Run settings test to verify it passes**

Run: `./node_modules/.bin/vitest run apps/web/src/pages/settings-page.test.tsx --environment node`
Expected: PASS with the governance panel rendered.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/console/routes/SettingsPage.tsx apps/web/src/app/styles/style.css apps/web/src/pages/settings-page.test.tsx
git commit -m "feat: add agent governance panel to settings"
```

### Task 9: Run Full Verification And Update Docs

**Files:**
- Modify: `docs/architecture/project-structure.md`
- Modify: `docs/operations-handbook.md`
- Modify: `package.json` if test lists need explicit updates

- [ ] **Step 1: Document new governance foundations**

```md
- `agent_policy`
  Account / strategy / action authority records for `paper` and `live`.
- `agent_instruction`
  Operator chat-derived current-day guidance and market intelligence.
- `agent_daily_run`
  Scheduled and event-driven Agent operating cycles.
- `agent_authority_event`
  Downgrade, stop, and restore audit records for governed autonomy.
```

- [ ] **Step 2: Run targeted verification**

Run: `node --test apps/api/test/stage-7-agent-governance-baseline.test.mjs`
Expected: PASS

Run: `node --test packages/control-plane-store/test/control-plane-context.test.mjs`
Expected: PASS

Run: `node --test packages/control-plane-runtime/test/control-plane-runtime.test.mjs`
Expected: PASS

Run: `node --test apps/worker/test/worker-workflow-e2e.test.mjs`
Expected: PASS

Run: `./node_modules/.bin/vitest run apps/web/src/modules/agent/agent-governance.test.tsx apps/web/src/pages/settings-page.test.tsx --environment node`
Expected: PASS

- [ ] **Step 3: Run full repository verification**

Run: `npm run verify`
Expected: PASS across workspace checks, tests, typecheck, and build.

- [ ] **Step 4: Commit**

```bash
git add docs/architecture/project-structure.md docs/operations-handbook.md package.json
git commit -m "docs: record agent governance foundations"
```

---

## Spec Coverage Check

- `Agent Chat`: covered in Tasks 4, 7, and 8 through instruction capture and UI surfacing.
- `Agent Memory`: covered in Tasks 2, 3, and 4 through `agent_instruction` persistence and active daily bias retrieval.
- `Agent Runtime`: covered in Task 6 through mixed-trigger daily run scaffolding.
- `Agent Decision Engine`: partially covered in Task 4 by threading daily bias and authority evaluation into analysis; deeper decision logic remains P1/P2.
- `Agent Authority Guard`: covered in Tasks 2, 3, 4, 5, and 8.
- `Agent Review & Summary`: partially covered in Task 5 through workbench payload extensions; full daily brief/recap artifact generation remains P1.

## Intentional P0 Deferrals

The following spec items are intentionally deferred because they belong to P1/P2, not P0:

- full pre-market briefing artifact generation
- rich post-market recap generation
- bounded automatic `enter / add` execution
- long-term memory and lesson persistence beyond current-day instruction scope
- full event-driven market reaction integration

## Placeholder Scan

- No `TODO`, `TBD`, or deferred "fill in later" placeholders remain in this plan.
- All tasks identify exact files and exact verification commands.

## Type Consistency Check

- Policy authority modes are consistently `full_auto / bounded_auto / ask_first / manual_only / stopped`.
- Instruction kinds are consistently `conversation / daily_bias / market_intel / watch_focus / strategy_change_request`.
- Runtime kinds are consistently `pre_market / intraday_monitor / post_market / operator_update / risk_event / execution_event / market_event`.

