import test from 'node:test';
import assert from 'node:assert/strict';
import { createControlPlaneContext } from '../../../packages/control-plane-store/src/context.mjs';
import { createControlPlaneRuntime } from '../../../packages/control-plane-runtime/src/index.mjs';
import { createMemoryStore } from '../../../packages/control-plane-store/test/helpers/memory-store.mjs';
import { runNotificationDispatchTask } from '../src/tasks/notification-dispatch-task.mjs';
import { runRiskScanTask } from '../src/tasks/risk-scan-task.mjs';
import { runSchedulerTickTask } from '../src/tasks/scheduler-tick-task.mjs';
import { runWorkflowExecutionTask } from '../src/tasks/workflow-execution-task.mjs';
import { runWorkflowMaintenanceTask } from '../src/tasks/workflow-maintenance-task.mjs';

const workerConfig = {
  name: 'worker-test',
  notificationBatchSize: 20,
  riskScanBatchSize: 20,
  workflowBatchSize: 20,
};

test('notification dispatch task flushes queued notifications', async () => {
  const context = createControlPlaneContext(createMemoryStore());
  context.notifications.enqueueNotification({
    title: 'Queued notification',
    message: 'notification job created in worker test',
    source: 'worker-test',
  });

  const result = await runNotificationDispatchTask(workerConfig, {
    flushQueuedNotifications: (options) => context.notifications.dispatchPendingNotifications(options),
  });

  assert.equal(result.worker, 'worker-test');
  assert.equal(result.kind, 'notification-dispatch');
  assert.equal(result.dispatchedCount, 1);
  assert.equal(context.notifications.listNotifications().length, 1);
  assert.equal(context.notifications.listNotificationJobs()[0].status, 'dispatched');
});

test('risk scan task dispatches queued risk jobs into events and notifications', async () => {
  const context = createControlPlaneContext(createMemoryStore());
  context.risk.enqueueRiskScan({
    cycle: 9,
    mode: 'autopilot',
    riskLevel: 'RISK OFF',
    pendingApprovals: 0,
    brokerConnected: true,
    marketConnected: true,
    paperExposure: 67,
    liveExposure: 42,
    routeHint: 'route hint for worker test',
  });

  const result = await runRiskScanTask(workerConfig, {
    flushQueuedRiskScans: (options) => context.risk.dispatchPendingRiskScans(options),
  });

  assert.equal(result.worker, 'worker-test');
  assert.equal(result.kind, 'risk-scan');
  assert.equal(result.dispatchedCount, 1);
  assert.equal(context.risk.listRiskEvents()[0].status, 'risk-off');
  assert.equal(context.notifications.listNotifications()[0].source, 'risk-monitor');
});

test('scheduler tick task records a scheduler bucket event', async () => {
  const context = createControlPlaneContext(createMemoryStore());

  const result = await runSchedulerTickTask(workerConfig, {
    runSchedulerTick: (options) => context.scheduler.recordSchedulerTick(options),
  });

  assert.equal(result.worker, 'worker-test');
  assert.equal(result.kind, 'scheduler-tick');
  assert.equal(typeof result.phase, 'string');
  assert.equal(context.scheduler.listSchedulerTicks().length, 1);
});

test('workflow maintenance task re-queues scheduled workflow runs', async () => {
  const context = createControlPlaneContext(createMemoryStore());
  context.workflows.appendWorkflowRun({
    id: 'workflow-maint-1',
    workflowId: 'task-orchestrator.cycle-run',
    status: 'retry_scheduled',
    nextRunAt: '2026-03-10T09:00:00.000Z',
  });

  const result = await runWorkflowMaintenanceTask(workerConfig, {
    releaseScheduledWorkflows: (options) => context.workflows.releaseScheduledWorkflowRuns({
      ...options,
      now: '2026-03-10T09:10:00.000Z',
    }),
  });

  assert.equal(result.worker, 'worker-test');
  assert.equal(result.kind, 'workflow-maintenance');
  assert.equal(result.releasedCount, 1);
  assert.equal(context.workflows.getWorkflowRun('workflow-maint-1').status, 'queued');
});

test('workflow execution task claims and executes queued workflow runs', async () => {
  const context = createControlPlaneContext(createMemoryStore());
  const runtime = createControlPlaneRuntime(context);
  context.workflows.appendWorkflowRun({
    id: 'workflow-exec-1',
    workflowId: 'task-orchestrator.manual-review',
    status: 'queued',
    nextRunAt: '2026-03-10T09:00:00.000Z',
  });

  const result = await runWorkflowExecutionTask(workerConfig, {
    claimQueuedWorkflows: (options) => context.workflows.claimQueuedWorkflowRuns({
      ...options,
      now: '2026-03-10T09:10:00.000Z',
    }),
    executeWorkflow: async (workflow, runtimeContext) => {
      runtimeContext.completeWorkflowRun(workflow.id, {
        steps: [{ key: 'manual-review', status: 'completed' }],
        result: { ok: true },
      });
      return { ok: true };
    },
    context: runtime,
  });

  assert.equal(result.worker, 'worker-test');
  assert.equal(result.kind, 'workflow-execution');
  assert.equal(result.claimedCount, 1);
  assert.equal(context.workflows.getWorkflowRun('workflow-exec-1').status, 'completed');
});
