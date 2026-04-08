// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { invokeGatewayRoute } from './helpers/invoke-gateway.js';

const namespace = `stage-1-baseline-test-${randomUUID()}`;
process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE = namespace;

const fakeBrokerHealth = {
  adapter: 'simulated',
  connected: true,
  customBrokerConfigured: false,
  alpacaConfigured: false,
};

const fakeBrokerExecution = {
  connected: true,
  message: 'stage 1 baseline broker ok',
  submittedOrders: [],
  rejectedOrders: [],
  snapshot: {
    connected: true,
    message: 'stage 1 baseline broker snapshot ok',
    account: {
      cash: 100000,
      buyingPower: 100000,
      equity: 100000,
    },
    positions: [],
    orders: [],
  },
};

const fakeMarketSnapshot = {
  label: 'Stage 1 Baseline Market',
  connected: true,
  message: 'stage 1 baseline market ok',
  quotes: [],
};

const [{ createGatewayHandler }, { createControlPlaneContext }, { createControlPlaneStore }] = await Promise.all([
  import('../src/gateways/alpaca.js'),
  import('../../../packages/control-plane-store/src/context.js'),
  import('../../../packages/control-plane-store/src/store.js'),
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

test('stage 1 baseline exposes account workspace, session, and permission catalog contracts', async () => {
  const [workspace, session, permissions] = await Promise.all([
    invokeGatewayRoute(handler, { path: '/api/user-account' }),
    invokeGatewayRoute(handler, { path: '/api/auth/session' }),
    invokeGatewayRoute(handler, { path: '/api/auth/permissions' }),
  ]);

  assert.equal(workspace.statusCode, 200);
  assert.equal(workspace.json.ok, true);
  assert.equal(typeof workspace.json.profile.email, 'string');
  assert.equal(typeof workspace.json.preferences.defaultMode, 'string');
  assert.equal(Array.isArray(workspace.json.roleTemplates), true);
  assert.equal(Array.isArray(workspace.json.workspaces), true);
  assert.equal(Array.isArray(workspace.json.brokerBindings), true);
  assert.equal(typeof workspace.json.brokerSummary.total, 'number');
  assert.equal(typeof workspace.json.accessSummary.isSessionAligned, 'boolean');
  assert.equal(typeof workspace.json.tenant.id, 'string');
  assert.equal(typeof workspace.json.currentWorkspace.id, 'string');

  assert.equal(session.statusCode, 200);
  assert.equal(session.json.ok, true);
  assert.equal(Array.isArray(session.json.user.permissions), true);
  assert.equal(typeof session.json.user.role, 'string');
  assert.equal(typeof session.json.user.workspaceId, 'string');

  assert.equal(permissions.statusCode, 200);
  assert.equal(permissions.json.ok, true);
  assert.equal(Array.isArray(permissions.json.permissions), true);
  assert.equal(permissions.json.permissions.some((item) => item.id === 'account:write'), true);
  assert.equal(permissions.json.permissions.some((item) => item.id === 'execution:approve'), true);
});

test('stage 1 baseline exposes incident console summary and detail contracts', async () => {
  context.monitoring.recordMonitoringSnapshot({
    id: 'stage1-monitoring-snapshot',
    status: 'warn',
    generatedAt: '2026-03-18T09:00:00.000Z',
    alerts: [{ id: 'alert-1', source: 'workflow', level: 'warn', message: 'workflow backlog rising' }],
  });
  context.notifications.appendNotification({
    id: 'stage1-notification',
    title: 'Operator follow-up',
    message: 'manual review still pending',
    source: 'control-plane',
    level: 'warn',
    createdAt: '2026-03-18T09:05:00.000Z',
  });
  context.audit.appendAuditRecord({
    id: 'stage1-audit',
    type: 'workflow',
    summary: 'workflow requires intervention',
    actor: 'system',
    createdAt: '2026-03-18T09:06:00.000Z',
  });

  await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/incidents',
    body: {
      id: 'stage1-incident',
      title: 'Stage 1 incident baseline',
      summary: 'Validate incident contracts',
      severity: 'warn',
      source: 'monitoring',
      owner: 'ops-stage1',
      evidenceLinks: [
        { kind: 'monitoring-alert', alertId: 'alert-1', snapshotId: 'stage1-monitoring-snapshot' },
        { kind: 'notification', notificationId: 'stage1-notification' },
        { kind: 'audit', auditId: 'stage1-audit' },
      ],
      metadata: {
        monitoringAlertId: 'alert-1',
        notificationId: 'stage1-notification',
        auditId: 'stage1-audit',
      },
    },
  });

  const [summary, detail] = await Promise.all([
    invokeGatewayRoute(handler, { path: '/api/incidents/summary?hours=168&limit=20' }),
    invokeGatewayRoute(handler, { path: '/api/incidents/stage1-incident' }),
  ]);

  assert.equal(summary.statusCode, 200);
  assert.equal(summary.json.ok, true);
  assert.equal(typeof summary.json.summary.total, 'number');
  assert.equal(Array.isArray(summary.json.summary.byOwner), true);
  assert.equal(Array.isArray(summary.json.summary.nextActions), true);
  assert.equal(typeof summary.json.summary.response.ackOverdue, 'number');

  assert.equal(detail.statusCode, 200);
  assert.equal(detail.json.ok, true);
  assert.equal(detail.json.incident.id, 'stage1-incident');
  assert.equal(Array.isArray(detail.json.evidence.timeline), true);
  assert.equal(Array.isArray(detail.json.activity.timeline), true);
  assert.equal(Array.isArray(detail.json.tasks.items), true);
  assert.equal(typeof detail.json.operations.nextAction.key, 'string');
});

test('stage 1 baseline exposes operations workbench aggregation contracts', async () => {
  const nowIso = new Date().toISOString();

  context.scheduler.recordSchedulerTick({
    id: 'stage1-scheduler-tick',
    phase: 'INTRADAY',
    status: 'warn',
    title: 'Intraday attention',
    message: 'intraday scan delayed',
    worker: 'quantpilot-task-worker',
    createdAt: nowIso,
  });
  context.monitoring.recordMonitoringSnapshot({
    id: 'stage1-workbench-snapshot',
    status: 'critical',
    generatedAt: nowIso,
    services: {
      worker: { status: 'healthy' },
    },
    alerts: [
      {
        id: 'stage1-workbench-alert',
        level: 'critical',
        source: 'queue',
        message: 'queue pressure is critical',
      },
    ],
  });
  context.incidents.appendIncident({
    id: 'stage1-workbench-incident',
    title: 'Workbench incident',
    summary: 'Validate operations workbench contract',
    severity: 'critical',
    source: 'monitoring',
    status: 'investigating',
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/operations/workbench?hours=24&limit=50',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(typeof response.json.summary.criticalSignals, 'number');
  assert.equal(Array.isArray(response.json.lanes), true);
  assert.equal(Array.isArray(response.json.runbook), true);
  assert.equal(typeof response.json.recent, 'object');
  assert.equal(response.json.lanes.some((item) => item.key === 'monitoring'), true);
  assert.equal(response.json.lanes.some((item) => item.key === 'incidents'), true);
  assert.equal(response.json.runbook.some((item) => item.key === 'triage-critical-incidents'), true);
});
