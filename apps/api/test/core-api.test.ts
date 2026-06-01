import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { invokeGatewayRoute } from './helpers/invoke-gateway.js';

const namespace = `core-api-test-${randomUUID()}`;
process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE = namespace;

const [{ createGatewayHandler }] = await Promise.all([import('../src/gateways/alpaca.js')]);

const handler = createGatewayHandler({
  getBrokerHealth: async () => ({
    adapter: 'simulated',
    connected: true,
    customBrokerConfigured: false,
    alpacaConfigured: false,
  }),
  executeBrokerCycle: async () => ({
    connected: true,
    message: 'simulated execution ok',
    submittedOrders: [],
    rejectedOrders: [],
    snapshot: {
      connected: true,
      message: 'simulated broker state ok',
      account: { cash: 100000, buyingPower: 100000, equity: 100000 },
      positions: [],
      orders: [],
    },
  }),
  getMarketSnapshot: async () => ({
    label: 'Simulated Market',
    connected: true,
    message: 'market ok',
    quotes: [],
  }),
});

test.after(() => {
  rmSync(join(process.cwd(), '.quantpilot-runtime', namespace), { recursive: true, force: true });
  delete process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE;
});

test('core health endpoint is available', async () => {
  const response = await invokeGatewayRoute(handler, { path: '/api/v1/health' });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
});

test('core session endpoint is available', async () => {
  const response = await invokeGatewayRoute(handler, { path: '/api/v1/auth/session' });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(typeof response.json.user.id, 'string');
});

test('core market ohlcv endpoint is available', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/v1/market/ohlcv?symbol=SPY&limit=5',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.symbol, 'SPY');
  assert.equal(response.json.bars.length, 5);
});

test('execution ledger returns complete entries', async () => {
  const response = await invokeGatewayRoute(handler, { path: '/api/v1/execution/ledger' });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.entries.length, 1);
  assert.equal(response.json.entries[0].plan.id, 'plan-momentum-core');
  assert.equal(response.json.entries[0].plan.strategyId, 'momentum-core');
  assert.deepEqual(response.json.entries[0].orderStates, []);
});

test('risk workbench returns current response shape', async () => {
  const response = await invokeGatewayRoute(handler, { path: '/api/v1/risk/workbench' });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.posture.status, 'healthy');
  assert.equal(response.json.recent.brokerSnapshot.positions.length, 0);
  assert.equal(response.json.reviewQueue.executionPlans[0].id, 'plan-momentum-core');
});

test('removed non-core endpoints return 404', async () => {
  for (const path of [
    '/api/v1/agent/workbench',
    '/api/v1/compute/jobs',
    '/api/v1/data/datasets',
    '/api/v1/compliance/reports',
    '/api/v1/notification/events',
    '/api/v1/operations/workbench',
    '/api/v1/marketplace/strategies',
  ]) {
    const response = await invokeGatewayRoute(handler, { path });
    assert.equal(response.statusCode, 404, `${path} should be removed`);
  }
});
