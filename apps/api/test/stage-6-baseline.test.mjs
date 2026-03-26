import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { invokeGatewayRoute } from './helpers/invoke-gateway.mjs';

const namespace = `stage-6-baseline-test-${randomUUID()}`;
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
    message: 'stage 6 baseline broker ok',
    submittedOrders: [],
    rejectedOrders: [],
    snapshot: {
      connected: true,
      message: 'stage 6 baseline snapshot ok',
      account: {
        cash: 125000,
        buyingPower: 140000,
        equity: 129500,
      },
      positions: [],
      orders: [],
    },
  }),
  getMarketSnapshot: async () => ({
    label: 'Stage 6 Baseline Market',
    connected: true,
    message: 'stage 6 baseline market ok',
    quotes: [],
  }),
});
const context = createControlPlaneContext(createControlPlaneStore({ namespace }));

test.after(() => {
  rmSync(join(process.cwd(), '.quantpilot-runtime', namespace), { recursive: true, force: true });
  delete process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE;
});

function seedStage6ProductionizationState() {
  const nowIso = '2026-03-27T08:30:00.000Z';
  context.userAccount.upsertWorkspace({
    id: 'workspace-stage6-live',
    key: 'live-ops',
    label: 'Stage 6 Live Ops',
    description: 'Workspace for stage 6 productionization baseline checks.',
    role: 'execution-approver',
  });
  context.userAccount.setCurrentWorkspace('workspace-stage6-live');
  context.workflows.appendWorkflowRun({
    id: 'stage6-retry-workflow',
    workflowId: 'task-orchestrator.agent-action-request',
    status: 'retry_scheduled',
    nextRunAt: '2026-03-27T08:00:00.000Z',
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  context.notifications.enqueueNotification({
    id: 'stage6-notification-job',
    title: 'Stage 6 notification backlog',
    message: 'notification still pending',
    source: 'control-plane',
  });
  context.risk.enqueueRiskScan({
    id: 'stage6-risk-job',
    cycle: 61,
    pendingApprovals: 0,
    brokerConnected: true,
    marketConnected: true,
  });
  context.workerHeartbeats.recordWorkerHeartbeat({
    id: 'stage6-worker-heartbeat',
    worker: 'stage6-worker',
    summary: 'stage 6 worker heartbeat',
    createdAt: nowIso,
  });
}

test('stage 6 baseline exposes productionization posture across account scope and maintenance contracts', async () => {
  seedStage6ProductionizationState();

  const [account, maintenance, monitoring] = await Promise.all([
    invokeGatewayRoute(handler, { path: '/api/user-account' }),
    invokeGatewayRoute(handler, { path: '/api/operations/maintenance?limit=10' }),
    invokeGatewayRoute(handler, { path: '/api/monitoring/status' }),
  ]);

  assert.equal(account.statusCode, 200);
  assert.equal(account.json.ok, true);
  assert.equal(typeof account.json.tenant.id, 'string');
  assert.equal(account.json.currentWorkspace.id, 'workspace-stage6-live');
  assert.equal(typeof account.json.accessSummary.roleLabel, 'string');

  assert.equal(maintenance.statusCode, 200);
  assert.equal(maintenance.json.ok, true);
  assert.equal(typeof maintenance.json.storageAdapter.kind, 'string');
  assert.equal(typeof maintenance.json.integrity.status, 'string');
  assert.equal(maintenance.json.backlog.retryScheduledWorkflows >= 1, true);
  assert.equal(Array.isArray(maintenance.json.supportedRepairs), true);

  assert.equal(monitoring.statusCode, 200);
  assert.equal(monitoring.json.ok, true);
  assert.equal(typeof monitoring.json.services.queues.backlogStatus, 'string');
  assert.equal(typeof monitoring.json.services.worker.activeWorkers, 'number');
});

test('stage 6 baseline exposes backup, restore dry-run, workflow repair, and observability workbench contracts', async () => {
  seedStage6ProductionizationState();

  const [workbench, backup] = await Promise.all([
    invokeGatewayRoute(handler, { path: '/api/operations/workbench?hours=48&limit=20' }),
    invokeGatewayRoute(handler, {
      method: 'POST',
      path: '/api/operations/maintenance/backup',
    }),
  ]);

  assert.equal(workbench.statusCode, 200);
  assert.equal(workbench.json.ok, true);
  assert.equal(typeof workbench.json.observability.posture, 'string');
  assert.equal(typeof workbench.json.summary.queueBacklogStatus, 'string');

  assert.equal(backup.statusCode, 200);
  assert.equal(backup.json.ok, true);
  assert.equal(backup.json.backup.files.some((item) => item.filename === 'user-account.json'), true);

  const restorePreview = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/operations/maintenance/restore',
    body: {
      dryRun: true,
      backup: backup.json.backup,
    },
  });

  const repair = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/operations/maintenance/repair/workflows',
    body: {
      worker: 'stage6-baseline-worker',
      limit: 10,
      now: '2026-03-27T09:00:00.000Z',
    },
  });

  assert.equal(restorePreview.statusCode, 200);
  assert.equal(restorePreview.json.ok, true);
  assert.equal(restorePreview.json.dryRun, true);
  assert.equal(Array.isArray(restorePreview.json.restoredFiles), true);

  assert.equal(repair.statusCode, 200);
  assert.equal(repair.json.ok, true);
  assert.equal(repair.json.releasedCount >= 1, true);
  assert.equal(repair.json.workflows.some((item) => item.id === 'stage6-retry-workflow'), true);
});
