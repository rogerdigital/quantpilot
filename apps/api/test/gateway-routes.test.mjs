import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { invokeGatewayRoute } from './helpers/invoke-gateway.mjs';

const namespace = `control-plane-api-test-${randomUUID()}`;
process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE = namespace;

const [{ createGatewayHandler }, { createControlPlaneContext }, { createControlPlaneStore }] = await Promise.all([
  import('../src/gateways/alpaca.mjs'),
  import('../../../packages/control-plane-store/src/context.mjs'),
  import('../../../packages/control-plane-store/src/store.mjs'),
]);

const handler = createGatewayHandler();
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
