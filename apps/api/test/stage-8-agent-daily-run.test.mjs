import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { invokeGatewayRoute as invokeGateway } from './helpers/invoke-gateway.mjs';

const namespace = `stage-8-agent-daily-run-test-${randomUUID()}`;
process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE = namespace;

const [{ createGatewayHandler }, { createControlPlaneContext }, { createControlPlaneStore }] = await Promise.all([
  import('../src/gateways/alpaca.mjs'),
  import('../../../packages/control-plane-store/src/context.mjs'),
  import('../../../packages/control-plane-store/src/store.mjs'),
]);

const handler = createGatewayHandler({
  getBrokerHealth: async () => ({
    adapter: 'simulated',
    connected: true,
    customBrokerConfigured: false,
    alpacaConfigured: false,
  }),
  executeBrokerCycle: async () => ({
    connected: true,
    message: 'stage 8 baseline broker ok',
    submittedOrders: [],
    rejectedOrders: [],
    snapshot: {
      connected: true,
      message: 'stage 8 baseline snapshot ok',
      account: { cash: 100000, buyingPower: 100000, equity: 100000 },
      positions: [],
      orders: [],
    },
  }),
  getMarketSnapshot: async () => ({
    label: 'Stage 8 Baseline Market',
    connected: true,
    message: 'stage 8 baseline market ok',
    quotes: [],
  }),
});
const context = createControlPlaneContext(createControlPlaneStore({ namespace }));

test.after(() => {
  rmSync(join(process.cwd(), '.quantpilot-runtime', namespace), { recursive: true, force: true });
  delete process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE;
});

test('POST /api/agent/daily-runs queues a pre_market run', async () => {
  const response = await invokeGateway(handler, {
    method: 'POST',
    path: '/api/agent/daily-runs',
    body: { kind: 'pre_market', trigger: 'manual', requestedBy: 'operator' },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.run.kind, 'pre_market');
  assert.equal(response.json.run.status, 'queued');
  assert.equal(response.json.workflow.workflowId, 'task-orchestrator.agent-daily-run');
});

test('GET /api/agent/daily-runs returns runs list', async () => {
  await invokeGateway(handler, {
    method: 'POST',
    path: '/api/agent/daily-runs',
    body: { kind: 'intraday_monitor', trigger: 'manual', requestedBy: 'system' },
  });

  const response = await invokeGateway(handler, {
    method: 'GET',
    path: '/api/agent/daily-runs',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(Array.isArray(response.json.runs), true);
  assert.ok(response.json.runs.length >= 1);
});

test('POST /api/agent/daily-runs returns 403 without strategy:write permission', async () => {
  context.userAccount.updateUserAccess({
    role: 'operator',
    status: 'active',
    permissions: ['dashboard:read'],
  });

  const response = await invokeGateway(handler, {
    method: 'POST',
    path: '/api/agent/daily-runs',
    body: { kind: 'pre_market', trigger: 'manual', requestedBy: 'operator' },
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.json.ok, false);

  context.userAccount.updateUserAccess({
    role: 'admin',
    status: 'active',
    permissions: ['dashboard:read', 'strategy:write', 'risk:review', 'execution:approve', 'account:write'],
  });
});

test('POST /api/agent/action-requests accepts agent_trim request type', async () => {
  const response = await invokeGateway(handler, {
    method: 'POST',
    path: '/api/agent/action-requests',
    body: {
      requestType: 'agent_trim',
      targetId: `strategy-${randomUUID()}`,
      summary: 'Trim position to reduce exposure',
      rationale: 'Momentum signals weakening',
      requestedBy: 'agent',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.workflow.workflowId, 'task-orchestrator.agent-action-request');
});

test('POST /api/agent/action-requests rejects unknown request type', async () => {
  const response = await invokeGateway(handler, {
    method: 'POST',
    path: '/api/agent/action-requests',
    body: {
      requestType: 'agent_fly_to_moon',
      targetId: 'strategy-1',
      summary: 'Unknown action',
      requestedBy: 'agent',
    },
  });

  assert.equal(response.json.ok, false);
  assert.ok(response.json.message?.includes('not allowed'));
});
