import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { invokeGatewayRoute } from './helpers/invoke-gateway.js';

const namespace = `data-routes-test-${randomUUID()}`;
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

test('GET /api/data/datasets returns empty list initially', async () => {
  const res = await invokeGatewayRoute(handler, { path: '/api/data/datasets' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.ok, true);
  assert.deepEqual(res.json.datasets, []);
});

test('POST /api/data/datasets creates a dataset', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/data/datasets',
    body: {
      id: 'ds-001',
      name: 'US Equity Daily',
      description: 'Daily OHLCV',
      category: 'market_data',
      source: {
        id: 'src-1',
        name: 'Polygon',
        provider: 'polygon',
        category: 'market_data',
        license: 'commercial',
        ingestionFrequency: 'daily',
        lastSuccessfulIngestion: new Date().toISOString(),
        owner: 'data-team',
        metadata: {},
      },
      owner: 'data-team',
    },
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.json.ok, true);
  assert.equal(res.json.dataset.id, 'ds-001');
});

test('POST /api/data/datasets rejects malformed body', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/data/datasets',
    body: { name: 'Missing id and category' },
  });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json.ok, false);
});

test('GET /api/data/datasets/:id/versions returns versions', async () => {
  const res = await invokeGatewayRoute(handler, { path: '/api/data/datasets/ds-001/versions' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.ok, true);
  assert.deepEqual(res.json.versions, []);
});

test('POST /api/data/datasets/:id/versions creates a version', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/data/datasets/ds-001/versions',
    body: {
      id: 'dsv-001',
      version: 1,
      schemaHash: 'abc123',
      rowCount: 50000,
      columnCount: 8,
      timeRange: { start: '2020-01-01', end: '2023-12-31' },
      symbols: ['AAPL', 'MSFT'],
    },
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.json.ok, true);
  assert.equal(res.json.version.id, 'dsv-001');
});

test('POST /api/data/datasets/:id/versions rejects missing fields', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/data/datasets/ds-001/versions',
    body: { version: 1 },
  });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json.ok, false);
});

test('GET /api/data/quality returns quality reports', async () => {
  const res = await invokeGatewayRoute(handler, { path: '/api/data/quality' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.ok, true);
});

test('GET /api/data/features returns empty list initially', async () => {
  const res = await invokeGatewayRoute(handler, { path: '/api/data/features' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.ok, true);
  assert.deepEqual(res.json.featureSets, []);
});

test('POST /api/data/features creates a feature set', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/data/features',
    body: {
      id: 'fs-001',
      name: 'Momentum Features',
      description: 'Cross-sectional momentum',
      owner: 'researcher-01',
    },
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.json.ok, true);
  assert.equal(res.json.featureSet.id, 'fs-001');
});

test('POST /api/data/features rejects missing fields', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/data/features',
    body: { description: 'no id or name' },
  });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json.ok, false);
});
