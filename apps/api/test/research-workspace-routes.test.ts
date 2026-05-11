// @ts-nocheck
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { invokeGatewayRoute } from './helpers/invoke-gateway.js';

const namespace = `research-ws-routes-test-${randomUUID()}`;
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

test('GET /api/research/workspaces returns empty list initially', async () => {
  const res = await invokeGatewayRoute(handler, { path: '/api/research/workspaces' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.ok, true);
  assert.deepEqual(res.json.workspaces, []);
});

test('POST /api/research/workspaces creates a workspace', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/research/workspaces',
    body: {
      id: 'ws-001',
      title: 'Momentum Research',
      description: 'Investigating momentum factors',
      owner: 'researcher-01',
      ownerRole: 'researcher',
    },
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.json.ok, true);
  assert.equal(res.json.workspace.id, 'ws-001');
  assert.equal(res.json.workspace.title, 'Momentum Research');
});

test('POST /api/research/workspaces rejects missing fields', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/research/workspaces',
    body: { title: 'No ID' },
  });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json.ok, false);
});

test('GET /api/research/workspaces/:id returns workspace', async () => {
  const res = await invokeGatewayRoute(handler, { path: '/api/research/workspaces/ws-001' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.workspace.id, 'ws-001');
});

test('GET /api/research/workspaces/:id returns 404 for missing', async () => {
  const res = await invokeGatewayRoute(handler, { path: '/api/research/workspaces/nonexistent' });
  assert.equal(res.statusCode, 404);
});

test('POST /api/research/workspaces/:id/ideas attaches idea', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/research/workspaces/ws-001/ideas',
    body: {
      id: 'idea-001',
      title: 'Momentum Factor',
      hypothesis: {
        statement: 'High momentum stocks outperform',
        rationale: 'Behavioral persistence',
        expectedOutcome: 'Sharpe > 0.8',
        falsificationCriteria: 'Sharpe < 0.3 OOS',
        relatedLiterature: [],
      },
      market: 'US_EQUITIES',
      assetUniverse: ['SP500'],
      timeHorizon: '12M',
      owner: 'researcher-01',
    },
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.json.ok, true);
  assert.equal(res.json.idea.id, 'idea-001');
  assert.equal(res.json.idea.status, 'idea');
});

test('POST /api/research/ideas/:id/transitions moves status', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/research/ideas/idea-001/transitions',
    body: {
      workspaceId: 'ws-001',
      nextStatus: 'dataset_selected',
      reason: 'Selected daily OHLCV dataset',
      actor: 'researcher-01',
      role: 'researcher',
    },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.ok, true);
  assert.equal(res.json.idea.status, 'dataset_selected');
  assert.ok(res.json.idea.decisionRecords.length > 0);
});

test('POST /api/research/ideas/:id/decisions records decision', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/research/ideas/idea-001/decisions',
    body: {
      workspaceId: 'ws-001',
      id: 'dec-manual-001',
      actor: 'risk-officer-01',
      role: 'risk_officer',
      action: 'review',
      reason: 'Risk review passed',
      evidenceLinks: ['risk-report-001'],
    },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.ok, true);
  assert.equal(res.json.decision.id, 'dec-manual-001');
});

test('GET /api/research/experiments returns empty list initially', async () => {
  const res = await invokeGatewayRoute(handler, { path: '/api/research/experiments' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.ok, true);
  assert.deepEqual(res.json.experiments, []);
});

test('POST /api/research/experiments creates experiment', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/research/experiments',
    body: {
      id: 'exp-001',
      name: 'Momentum Backtest',
      description: 'Testing 12M momentum factor',
      workspaceId: 'ws-001',
      owner: 'researcher-01',
    },
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.json.ok, true);
  assert.equal(res.json.experiment.id, 'exp-001');
});

test('POST /api/research/experiments/:id/runs creates run', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/research/experiments/exp-001/runs',
    body: {
      id: 'run-001',
      snapshot: {
        datasetVersionId: 'dsv-001',
        featureVersionId: 'fv-001',
        codeVersion: 'abc123',
        parameters: [{ name: 'lookback', value: 252, type: 'number' }],
        seed: 42,
        runtimeEnvironment: 'node-22',
      },
    },
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.json.ok, true);
  assert.equal(res.json.run.id, 'run-001');
  assert.equal(res.json.run.snapshot.datasetVersionId, 'dsv-001');
});

test('POST /api/research/experiments rejects missing fields', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/research/experiments',
    body: { description: 'No ID or name' },
  });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json.ok, false);
});
