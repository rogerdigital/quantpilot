// @ts-nocheck
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { invokeGatewayRoute } from './helpers/invoke-gateway.js';

const namespace = `agent-governance-routes-test-${randomUUID()}`;
process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE = namespace;

const [{ createGatewayHandler }, { createControlPlaneContext }, { createControlPlaneStore }] =
  await Promise.all([
    import('../src/gateways/alpaca.js'),
    import('../../../packages/control-plane-store/src/context.js'),
    import('../../../packages/control-plane-store/src/store.js'),
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
    message: 'ok',
    submittedOrders: [],
    rejectedOrders: [],
  }),
  getMarketSnapshot: async () => ({ label: 'test', connected: true, message: 'ok', quotes: [] }),
});

createControlPlaneContext(createControlPlaneStore({ namespace }));

test.after(() => {
  rmSync(join(process.cwd(), '.quantpilot-runtime', namespace), { recursive: true, force: true });
  delete process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE;
});

test('GET /api/agent/tools/policy returns allowed and forbidden tools', async () => {
  const res = await invokeGatewayRoute(handler, { path: '/api/agent/tools/policy' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.ok, true);
  assert.ok(Array.isArray(res.json.allowed));
  assert.ok(Array.isArray(res.json.forbidden));
  assert.ok(res.json.allowed.length >= 7);
  assert.ok(res.json.forbidden.length >= 5);
  assert.ok(res.json.allowed.some((t) => t.name === 'read_research_workspace'));
  assert.ok(res.json.forbidden.some((t) => t.name === 'place_live_order'));
});

test('POST /api/agent/tools/policy/evaluate rejects forbidden tools', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/agent/tools/policy/evaluate',
    body: {
      tools: [
        'read_research_workspace',
        'place_live_order',
        'draft_risk_review',
        'approve_live_promotion',
        'delete_audit_records',
      ],
    },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.ok, true);
  assert.equal(res.json.allowed.length, 2);
  assert.equal(res.json.rejected.length, 3);
  assert.ok(res.json.rejected.some((r) => r.tool === 'place_live_order'));
  assert.ok(res.json.rejected.some((r) => r.tool === 'approve_live_promotion'));
  assert.ok(res.json.rejected.some((r) => r.tool === 'delete_audit_records'));
});

test('POST /api/agent/tools/policy/evaluate rejects missing tools field', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/agent/tools/policy/evaluate',
    body: {},
  });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json.ok, false);
});

test('POST /api/agent/tools/policy/evaluate allows all read tools', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/agent/tools/policy/evaluate',
    body: {
      tools: [
        'read_research_workspace',
        'summarize_dataset_quality',
        'compare_experiment_runs',
        'explain_backtest_diagnostics',
      ],
    },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.allowed.length, 4);
  assert.equal(res.json.rejected.length, 0);
});

test('POST /api/agent/tools/policy/evaluate rejects unknown tools', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/agent/tools/policy/evaluate',
    body: { tools: ['unknown_tool_abc'] },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.allowed.length, 0);
  assert.equal(res.json.rejected.length, 1);
  assert.ok(res.json.rejected[0].reason.includes('not in the agent allowlist'));
});
