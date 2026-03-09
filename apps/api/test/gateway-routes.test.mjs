import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { invokeGatewayRoute } from './helpers/invoke-gateway.mjs';
import { createTradingState } from './helpers/create-trading-state.mjs';

const namespace = `control-plane-api-test-${randomUUID()}`;
process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE = namespace;

const fakeBrokerHealth = {
  adapter: 'simulated',
  connected: true,
  customBrokerConfigured: false,
  alpacaConfigured: false,
};

const fakeBrokerExecution = {
  connected: true,
  message: 'test broker execution ok',
  submittedOrders: [],
  rejectedOrders: [],
  snapshot: {
    connected: true,
    message: 'test broker state ok',
    account: {
      cash: 80000,
      buyingPower: 80000,
      equity: 80000,
    },
    positions: [],
    orders: [],
  },
};

const fakeMarketSnapshot = {
  label: 'Injected Test Market',
  connected: true,
  message: 'test market snapshot ok',
  quotes: [],
};

const [{ createGatewayHandler }, { createControlPlaneContext }, { createControlPlaneStore }] = await Promise.all([
  import('../src/gateways/alpaca.mjs'),
  import('../../../packages/control-plane-store/src/context.mjs'),
  import('../../../packages/control-plane-store/src/store.mjs'),
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

test('GET /api/notification/events returns seeded notifications', async () => {
  context.notifications.appendNotification({
    id: 'notif-api-test',
    title: 'API notification',
    message: 'seeded notification',
    source: 'test',
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/notification/events',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.events[0].id, 'notif-api-test');
});

test('GET /api/risk/events returns seeded risk events', async () => {
  context.risk.appendRiskEvent({
    id: 'risk-api-test',
    title: 'Risk event',
    message: 'seeded risk event',
    cycle: 88,
    riskLevel: 'RISK OFF',
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/risk/events',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.events[0].id, 'risk-api-test');
});

test('GET /api/scheduler/ticks returns scheduler ticks from shared store', async () => {
  context.scheduler.recordSchedulerTick({
    worker: 'api-test-worker',
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/scheduler/ticks',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ticks.length >= 1, true);
  assert.equal(typeof response.json.ticks[0].phase, 'string');
});

test('POST then GET /api/task-orchestrator/actions persists operator actions', async () => {
  const createResponse = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/actions',
    body: {
      type: 'approve-intent',
      actor: 'api-test',
      title: 'Approve from API test',
      detail: 'approved via gateway route',
      symbol: 'AAPL',
      level: 'info',
    },
  });
  const listResponse = await invokeGatewayRoute(handler, {
    path: '/api/task-orchestrator/actions',
  });

  assert.equal(createResponse.statusCode, 200);
  assert.equal(createResponse.json.action.title, 'Approve from API test');
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.json.actions.some((item) => item.id === createResponse.json.action.id), true);
});

test('GET /api/health exposes gateway module status', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/health',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.brokerAdapter, 'alpaca');
  assert.equal(typeof response.json.modules, 'number');
});

test('POST then GET /api/audit/records persists audit entries', async () => {
  const createResponse = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/audit/records',
    body: {
      type: 'test-audit',
      actor: 'api-test',
      title: 'Audit from API test',
      detail: 'audit record created through gateway route',
    },
  });
  const listResponse = await invokeGatewayRoute(handler, {
    path: '/api/audit/records',
  });

  assert.equal(createResponse.statusCode, 200);
  assert.equal(createResponse.json.record.title, 'Audit from API test');
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.json.records.some((item) => item.id === createResponse.json.record.id), true);
});

test('POST then GET /api/task-orchestrator/cycles persists cycle records', async () => {
  const createResponse = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/cycles',
    body: {
      cycle: 21,
      mode: 'hybrid',
      riskLevel: 'NORMAL',
      decisionSummary: 'cycle created from API test',
      marketClock: '2026-03-10 09:30:00',
      pendingApprovals: 0,
      liveIntentCount: 0,
      brokerConnected: true,
      marketConnected: true,
    },
  });
  const listResponse = await invokeGatewayRoute(handler, {
    path: '/api/task-orchestrator/cycles',
  });

  assert.equal(createResponse.statusCode, 200);
  assert.equal(createResponse.json.cycle.cycle, 21);
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.json.cycles.some((item) => item.id === createResponse.json.cycle.id), true);
});

test('POST /api/task-orchestrator/cycles/run returns control plane resolution', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/cycles/run',
    body: {
      cycle: 22,
      mode: 'autopilot',
      riskLevel: 'NORMAL',
      decisionSummary: 'resolution route test',
      marketClock: '2026-03-10 09:35:00',
      pendingApprovals: 0,
      liveIntentCount: 0,
      brokerConnected: true,
      marketConnected: true,
      liveTradeEnabled: false,
      pendingLiveIntents: [],
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.controlPlane.lastStatus, 'HEALTHY');
  assert.equal(response.json.brokerExecution.message, 'test broker execution ok');
});

test('POST /api/task-orchestrator/state/run returns next state and enqueues risk scan', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/state/run',
    body: {
      state: createTradingState(),
    },
  });

  const riskJobs = context.risk.listRiskScanJobs();

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.state.cycle, 1);
  assert.equal(response.json.resolution.ok, true);
  assert.equal(response.json.state.integrationStatus.marketData.message, 'test market snapshot ok');
  assert.equal(riskJobs.length >= 1, true);
  assert.equal(riskJobs[0].payload.source, 'state-runner');
});
