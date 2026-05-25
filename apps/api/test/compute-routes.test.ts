import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { invokeGatewayRoute } from './helpers/invoke-gateway.js';

const namespace = `compute-routes-test-${randomUUID()}`;
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

test('GET /api/compute/jobs returns empty list initially', async () => {
  const res = await invokeGatewayRoute(handler, { path: '/api/compute/jobs' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.ok, true);
  assert.deepEqual(res.json.jobs, []);
});

test('POST /api/compute/jobs enqueues a new job', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/compute/jobs',
    body: {
      id: 'test-job-1',
      type: 'backtest',
      owner: 'researcher@desk',
      resource: {
        cpu: 4,
        memoryMb: 8192,
        gpuCount: 0,
        estimatedDurationMs: 300_000,
        priority: 'normal',
      },
      params: { strategyId: 'strat-1' },
      retrySafe: true,
    },
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.json.ok, true);
  assert.equal(res.json.job.id, 'test-job-1');
  assert.equal(res.json.job.status, 'queued');
  assert.equal(res.json.job.type, 'backtest');
});

test('POST /api/compute/jobs rejects missing fields', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/compute/jobs',
    body: { owner: 'someone' },
  });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json.ok, false);
});

test('GET /api/compute/jobs/:id returns a specific job', async () => {
  const res = await invokeGatewayRoute(handler, { path: '/api/compute/jobs/test-job-1' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.ok, true);
  assert.equal(res.json.job.id, 'test-job-1');
});

test('GET /api/compute/jobs/:id returns 404 for unknown job', async () => {
  const res = await invokeGatewayRoute(handler, { path: '/api/compute/jobs/nonexistent' });
  assert.equal(res.statusCode, 404);
  assert.equal(res.json.ok, false);
});

test('GET /api/compute/jobs?status=queued filters by status', async () => {
  const res = await invokeGatewayRoute(handler, { path: '/api/compute/jobs?status=queued' });
  assert.equal(res.statusCode, 200);
  assert.ok(res.json.jobs.length >= 1);
  assert.ok(res.json.jobs.every((j) => j.status === 'queued'));
});

test('POST /api/compute/jobs/:id/cancel cancels a queued job', async () => {
  await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/compute/jobs',
    body: {
      id: 'cancel-me',
      type: 'report',
      owner: 'test',
      resource: {
        cpu: 2,
        memoryMb: 4096,
        gpuCount: 0,
        estimatedDurationMs: 60_000,
        priority: 'low',
      },
    },
  });
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/compute/jobs/cancel-me/cancel',
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.ok, true);
  assert.equal(res.json.job.status, 'cancelled');
});

test('POST /api/compute/jobs/:id/retry rejects non-retry-safe job', async () => {
  await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/compute/jobs',
    body: {
      id: 'no-retry',
      type: 'backtest',
      owner: 'test',
      resource: {
        cpu: 2,
        memoryMb: 4096,
        gpuCount: 0,
        estimatedDurationMs: 60_000,
        priority: 'normal',
      },
      retrySafe: false,
    },
  });
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/compute/jobs/no-retry/retry',
  });
  assert.equal(res.statusCode, 400);
  assert.ok(res.json.error.includes('retry-safe'));
});

test('GET /api/compute/queue returns queue summary', async () => {
  const res = await invokeGatewayRoute(handler, { path: '/api/compute/queue' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.ok, true);
  assert.ok('activeJobs' in res.json.queue);
  assert.ok('queuedJobs' in res.json.queue);
  assert.ok('totalCompleted' in res.json.queue);
  assert.ok('totalFailed' in res.json.queue);
});
