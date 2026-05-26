import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { invokeGatewayRoute } from '../helpers/invoke-gateway.js';

const namespace = `e2e-strategy-${randomUUID()}`;
process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE = namespace;

const fakeBrokerHealth = {
  adapter: 'simulated',
  connected: true,
  customBrokerConfigured: false,
  alpacaConfigured: false,
};

const fakeBrokerExecution = {
  connected: true,
  message: 'e2e broker ok',
  submittedOrders: [],
  rejectedOrders: [],
  snapshot: {
    connected: true,
    message: 'e2e broker snapshot ok',
    account: { cash: 100000, buyingPower: 100000, equity: 100000 },
    positions: [],
    orders: [],
  },
};

const fakeMarketSnapshot = {
  label: 'E2E Market',
  connected: true,
  message: 'e2e market ok',
  quotes: [],
};

const [{ createGatewayHandler }, { createControlPlaneContext }, { createControlPlaneStore }] =
  await Promise.all([
    import('../../src/gateways/alpaca.js'),
    import('../../../../packages/control-plane-store/src/context.js'),
    import('../../../../packages/control-plane-store/src/store.js'),
  ]);

const handler = createGatewayHandler({
  getBrokerHealth: async () => fakeBrokerHealth,
  executeBrokerCycle: async () => fakeBrokerExecution,
  getMarketSnapshot: async () => fakeMarketSnapshot,
});
const context = createControlPlaneContext(createControlPlaneStore({ namespace }));

test.after(() => {
  rmSync(join(process.cwd(), '.quantpilot-runtime', namespace), { recursive: true, force: true });
  delete process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE;
});

test('strategy catalog: list starts empty', async () => {
  const res = await invokeGatewayRoute(handler, { path: '/api/strategy/catalog' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.ok, true);
  assert.ok(Array.isArray(res.json.strategies));
});

test('strategy catalog: create, read, and verify strategy', async () => {
  const strategyId = `strat-${randomUUID()}`;
  const createRes = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/strategy/catalog',
    body: {
      id: strategyId,
      name: 'E2E Momentum Alpha',
      family: 'momentum',
      timeframe: 'daily',
      universe: ['AAPL', 'MSFT'],
      status: 'draft',
      score: 72,
      expectedReturnPct: 12.5,
      maxDrawdownPct: 8.0,
      sharpe: 1.4,
    },
  });
  assert.equal(createRes.statusCode, 200);
  assert.equal(createRes.json.ok, true);
  assert.equal(createRes.json.strategy.id, strategyId);
  assert.equal(createRes.json.strategy.name, 'E2E Momentum Alpha');

  const detailRes = await invokeGatewayRoute(handler, {
    path: `/api/strategy/catalog/${strategyId}`,
  });
  assert.equal(detailRes.statusCode, 200);
  assert.equal(detailRes.json.ok, true);
  assert.equal(detailRes.json.strategy.id, strategyId);
  assert.equal(detailRes.json.strategy.family, 'momentum');

  const listRes = await invokeGatewayRoute(handler, { path: '/api/strategy/catalog' });
  assert.equal(listRes.statusCode, 200);
  assert.ok(listRes.json.strategies.length >= 1);
  assert.ok(listRes.json.strategies.some((s: any) => s.id === strategyId));
});

test('strategy catalog: create duplicate updates the strategy', async () => {
  const strategyId = `strat-dup-${randomUUID()}`;
  await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/strategy/catalog',
    body: {
      id: strategyId,
      name: 'V1',
      family: 'value',
      timeframe: 'daily',
      universe: [],
      status: 'draft',
    },
  });

  const updateRes = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/strategy/catalog',
    body: {
      id: strategyId,
      name: 'V2 Updated',
      family: 'value',
      timeframe: 'daily',
      universe: [],
      status: 'researching',
    },
  });
  assert.equal(updateRes.statusCode, 200);
  assert.equal(updateRes.json.strategy.name, 'V2 Updated');
  assert.equal(updateRes.json.strategy.status, 'researching');
});

test('strategy catalog: get unknown strategy returns 404', async () => {
  const res = await invokeGatewayRoute(handler, {
    path: '/api/strategy/catalog/unknown-strategy-id',
  });
  assert.equal(res.statusCode, 404);
  assert.equal(res.json.ok, false);
});

test('strategy catalog: create without required fields returns 400', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/strategy/catalog',
    body: { family: 'momentum' },
  });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json.ok, false);
});

test('backtest: summary and runs start empty', async () => {
  const [summary, runs] = await Promise.all([
    invokeGatewayRoute(handler, { path: '/api/backtest/summary' }),
    invokeGatewayRoute(handler, { path: '/api/backtest/runs' }),
  ]);
  assert.equal(summary.statusCode, 200);
  assert.equal(runs.statusCode, 200);
});

test('backtest: create run for existing strategy and retrieve it', async () => {
  const strategyId = `strat-bt-${randomUUID()}`;
  await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/strategy/catalog',
    body: {
      id: strategyId,
      name: 'Backtest E2E Strategy',
      family: 'momentum',
      timeframe: 'daily',
      universe: ['AAPL'],
      status: 'candidate',
    },
  });

  const createRes = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/backtest/runs',
    body: {
      strategyId,
      windowLabel: '2024-Q4',
      requestedBy: 'e2e-test',
    },
  });
  assert.equal(createRes.statusCode, 200);
  assert.equal(createRes.json.ok, true);
  assert.ok(createRes.json.run.id);

  const detailRes = await invokeGatewayRoute(handler, {
    path: `/api/backtest/runs/${createRes.json.run.id}`,
  });
  assert.equal(detailRes.statusCode, 200);
  assert.equal(detailRes.json.ok, true);
  assert.equal(detailRes.json.run.strategyId, strategyId);
});

test('execution: plans list starts empty', async () => {
  const res = await invokeGatewayRoute(handler, { path: '/api/execution/plans' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.ok, true);
  assert.ok(Array.isArray(res.json.plans));
});

test('execution: get unknown plan returns 404', async () => {
  const res = await invokeGatewayRoute(handler, {
    path: '/api/execution/plans/nonexistent-plan-id',
  });
  assert.equal(res.statusCode, 404);
  assert.equal(res.json.ok, false);
});

test('execution: workbench returns valid structure', async () => {
  const res = await invokeGatewayRoute(handler, { path: '/api/execution/workbench' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.ok, true);
});

test('full lifecycle: create strategy → backtest run → results → execution handoff', async () => {
  const strategyId = `strat-lifecycle-${randomUUID()}`;

  const createStratRes = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/strategy/catalog',
    body: {
      id: strategyId,
      name: 'Lifecycle Test Strategy',
      family: 'mean_reversion',
      timeframe: 'intraday',
      universe: ['GOOG', 'AMZN'],
      status: 'candidate',
      score: 80,
      expectedReturnPct: 15.0,
      maxDrawdownPct: 6.0,
      sharpe: 1.8,
    },
  });
  assert.equal(createStratRes.json.ok, true);

  const runId = `run-lifecycle-${randomUUID()}`;
  const createRunRes = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/backtest/runs',
    body: {
      id: runId,
      strategyId,
      windowLabel: '2025-H1',
      status: 'completed',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      annualizedReturnPct: 14.7,
      sharpe: 1.75,
      maxDrawdownPct: 5.8,
      totalTrades: 120,
    },
  });
  assert.equal(createRunRes.json.ok, true);

  const detailRes = await invokeGatewayRoute(handler, {
    path: `/api/strategy/catalog/${strategyId}`,
  });
  assert.equal(detailRes.statusCode, 200);
  assert.equal(detailRes.json.strategy.id, strategyId);
  assert.ok(Array.isArray(detailRes.json.recentRuns));
});
