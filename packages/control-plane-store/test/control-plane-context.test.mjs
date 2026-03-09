import test from 'node:test';
import assert from 'node:assert/strict';
import { createControlPlaneContext } from '../src/context.mjs';
import { createMemoryStore } from './helpers/memory-store.mjs';

test('notification repository dispatches queued notifications', () => {
  const context = createControlPlaneContext(createMemoryStore());
  context.notifications.enqueueNotification({
    id: 'notif-1',
    title: 'Queued notification',
    message: 'pending',
    source: 'test',
  });

  const result = context.notifications.dispatchPendingNotifications({
    worker: 'test-worker',
  });

  assert.equal(result.dispatchedCount, 1);
  assert.equal(context.notifications.listNotifications(5)[0].title, 'Queued notification');
  assert.equal(context.notifications.listNotificationJobs(5)[0].status, 'dispatched');
});

test('risk repository turns a risk-off scan into risk event and notification', () => {
  const context = createControlPlaneContext(createMemoryStore());
  context.risk.enqueueRiskScan({
    id: 'risk-1',
    cycle: 42,
    mode: 'manual',
    riskLevel: 'RISK OFF',
    pendingApprovals: 0,
    brokerConnected: true,
    marketConnected: true,
    paperExposure: 61.2,
    liveExposure: 37.4,
  });

  const result = context.risk.dispatchPendingRiskScans({
    worker: 'risk-worker',
  });

  assert.equal(result.dispatchedCount, 1);
  assert.equal(context.risk.listRiskEvents(5)[0].status, 'risk-off');
  assert.equal(context.notifications.listNotifications(5)[0].source, 'risk-monitor');
});

test('scheduler repository emits once per bucket and then stays steady', () => {
  const context = createControlPlaneContext(createMemoryStore());

  const first = context.scheduler.recordSchedulerTick({
    worker: 'scheduler-worker',
  });
  const second = context.scheduler.recordSchedulerTick({
    worker: 'scheduler-worker',
  });

  assert.equal(first.emitted, true);
  assert.equal(typeof first.phase, 'string');
  assert.equal(second.emitted, false);
  assert.equal(context.scheduler.listSchedulerTicks(5).length, 1);
});

test('audit and cycle repositories remain available through the injected context', () => {
  const context = createControlPlaneContext(createMemoryStore());
  const cycle = context.cycles.appendCycleRecord({
    id: 'cycle-1',
    cycle: 7,
    mode: 'autopilot',
    riskLevel: 'NORMAL',
  });
  const audit = context.audit.appendAuditRecord({
    id: 'audit-1',
    type: 'cycle',
    actor: 'test',
    title: 'Cycle persisted',
  });

  assert.equal(context.cycles.listCycleRecords(5)[0].id, cycle.id);
  assert.equal(context.audit.listAuditRecords(5)[0].id, audit.id);
});

test('workflow repository persists and updates workflow runs through the injected context', () => {
  const context = createControlPlaneContext(createMemoryStore());
  const workflow = context.workflows.appendWorkflowRun({
    id: 'workflow-1',
    workflowId: 'task-orchestrator.state-run',
    status: 'running',
    steps: [{ key: 'start', status: 'completed' }],
  });
  const updated = context.workflows.updateWorkflowRun('workflow-1', {
    status: 'completed',
    completedAt: '2026-03-10T09:45:00.000Z',
    steps: [
      { key: 'start', status: 'completed' },
      { key: 'finish', status: 'completed' },
    ],
  });

  assert.equal(context.workflows.listWorkflowRuns(5)[0].id, workflow.id);
  assert.equal(updated.status, 'completed');
  assert.equal(context.workflows.getWorkflowRun('workflow-1').steps.length, 2);
});

test('workflow repository releases due retry-scheduled runs back to queued', () => {
  const context = createControlPlaneContext(createMemoryStore());
  context.workflows.appendWorkflowRun({
    id: 'workflow-retry-1',
    workflowId: 'task-orchestrator.cycle-run',
    status: 'retry_scheduled',
    nextRunAt: '2026-03-10T09:00:00.000Z',
  });

  const result = context.workflows.releaseScheduledWorkflowRuns({
    worker: 'workflow-worker',
    now: '2026-03-10T09:10:00.000Z',
  });

  assert.equal(result.releasedCount, 1);
  assert.equal(context.workflows.getWorkflowRun('workflow-retry-1').status, 'queued');
});
