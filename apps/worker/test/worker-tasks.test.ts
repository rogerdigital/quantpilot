// @ts-nocheck

import assert from 'node:assert/strict';
import test from 'node:test';
import { createControlPlaneRuntime } from '../../../packages/control-plane-runtime/src/index.js';
import { createControlPlaneContext } from '../../../packages/control-plane-store/src/context.js';
import { createMemoryStore } from '../../../packages/control-plane-store/test/helpers/memory-store.js';
import { runTick } from '../src/runtime/worker-runtime.js';
import { runHeartbeatTask } from '../src/tasks/heartbeat-task.js';
import { runMonitoringScanTask } from '../src/tasks/monitoring-scan-task.js';
import { runNotificationDispatchTask } from '../src/tasks/notification-dispatch-task.js';
import { runRiskScanTask } from '../src/tasks/risk-scan-task.js';
import { runSchedulerTickTask } from '../src/tasks/scheduler-tick-task.js';
import { runWorkflowExecutionTask } from '../src/tasks/workflow-execution-task.js';
import { runWorkflowMaintenanceTask } from '../src/tasks/workflow-maintenance-task.js';

const workerConfig = {
  name: 'worker-test',
  notificationBatchSize: 20,
  riskScanBatchSize: 20,
  workflowBatchSize: 20,
  taskTimeoutMs: 10000,
  continueOnTaskFailure: true,
};

const TEST_CLAIM_NOW = '2099-01-01T00:10:00.000Z';
const TEST_RELEASE_NOW = '2099-01-01T00:10:00.000Z';
const TEST_DUE_NEXT_RUN_AT = '2099-01-01T00:00:00.000Z';

test('notification dispatch task flushes queued notifications', async () => {
  const context = createControlPlaneContext(createMemoryStore());
  context.notifications.enqueueNotification({
    title: 'Queued notification',
    message: 'notification job created in worker test',
    source: 'worker-test',
  });

  const result = await runNotificationDispatchTask(workerConfig, {
    flushQueuedNotifications: (options) =>
      context.notifications.dispatchPendingNotifications(options),
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

test('heartbeat task records a persisted worker heartbeat', async () => {
  const context = createControlPlaneContext(createMemoryStore());

  const result = await runHeartbeatTask(workerConfig, {
    recordWorkerHeartbeat: (payload) => context.workerHeartbeats.recordWorkerHeartbeat(payload),
  });

  assert.equal(result.worker, 'worker-test');
  assert.equal(result.kind, 'heartbeat');
  assert.equal(context.workerHeartbeats.listWorkerHeartbeats().length, 1);
  assert.equal(context.workerHeartbeats.listWorkerHeartbeats()[0].worker, 'worker-test');
});

test('monitoring scan task records monitoring snapshots and alerts', async () => {
  const context = createControlPlaneContext(createMemoryStore());
  const runtime = createControlPlaneRuntime(context);
  context.workerHeartbeats.recordWorkerHeartbeat({
    worker: 'worker-test',
    createdAt: new Date().toISOString(),
    summary: 'worker heartbeat',
  });
  context.workflows.appendWorkflowRun({
    id: 'workflow-monitoring',
    workflowId: 'task-orchestrator.state-run',
    status: 'failed',
  });

  const result = await runMonitoringScanTask(workerConfig, {
    recordMonitoringSnapshot: async () => {
      const generatedAt = new Date().toISOString();
      const recorded = runtime.recordMonitoringSnapshot({
        status: 'critical',
        generatedAt,
        services: {
          worker: { status: 'healthy' },
          workflows: { status: 'critical', failed: 1 },
        },
        alerts: [
          {
            level: 'critical',
            source: 'workflow',
            message: '1 workflow run is currently in a failed state.',
          },
        ],
      });

      return {
        ok: true,
        status: 'critical',
        generatedAt,
        snapshot: recorded.snapshot,
        alerts: recorded.alerts,
      };
    },
  });

  assert.equal(result.worker, 'worker-test');
  assert.equal(result.kind, 'monitoring-scan');
  assert.equal(runtime.listMonitoringSnapshots().length, 1);
  assert.equal(
    runtime.listMonitoringAlerts().some((item) => item.source === 'workflow'),
    true
  );
});

test('worker tick continues after a task failure by default', async () => {
  const results = await runTick(workerConfig, [
    {
      kind: 'failing-task',
      run: async () => {
        throw new Error('simulated worker failure');
      },
    },
    {
      kind: 'follow-up-task',
      run: async () => ({
        worker: workerConfig.name,
        kind: 'follow-up-task',
        timestamp: new Date().toISOString(),
        summary: 'follow-up completed',
      }),
    },
  ]);

  assert.equal(results.length, 2);
  assert.equal(results[0].ok, false);
  assert.equal(results[0].summary, 'simulated worker failure');
  assert.equal(results[1].ok, true);
  assert.equal(results[1].kind, 'follow-up-task');
});

test('worker tick stops after a task failure when configured', async () => {
  const results = await runTick(
    {
      ...workerConfig,
      continueOnTaskFailure: false,
    },
    [
      {
        kind: 'failing-task',
        run: async () => {
          throw new Error('stop after this failure');
        },
      },
      {
        kind: 'skipped-task',
        run: async () => ({
          worker: workerConfig.name,
          kind: 'skipped-task',
          timestamp: new Date().toISOString(),
          summary: 'should not run',
        }),
      },
    ]
  );

  assert.equal(results.length, 1);
  assert.equal(results[0].ok, false);
  assert.equal(results[0].summary, 'stop after this failure');
});

test('worker tick records timeout failures without blocking the tick', async () => {
  const results = await runTick(
    {
      ...workerConfig,
      taskTimeoutMs: 5,
    },
    [
      {
        kind: 'slow-task',
        run: () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                worker: workerConfig.name,
                kind: 'slow-task',
                timestamp: new Date().toISOString(),
                summary: 'too slow',
              });
            }, 25);
          }),
      },
      {
        kind: 'follow-up-task',
        run: async () => ({
          worker: workerConfig.name,
          kind: 'follow-up-task',
          timestamp: new Date().toISOString(),
          summary: 'follow-up completed',
        }),
      },
    ]
  );

  assert.equal(results.length, 2);
  assert.equal(results[0].ok, false);
  assert.match(results[0].summary, /timed out after 5ms/);
  assert.equal(results[1].ok, true);
});

test('workflow maintenance task re-queues scheduled workflow runs', async () => {
  const context = createControlPlaneContext(createMemoryStore());
  const runtime = createControlPlaneRuntime(context);
  context.workflows.appendWorkflowRun({
    id: 'workflow-maint-1',
    workflowId: 'task-orchestrator.cycle-run',
    status: 'retry_scheduled',
    nextRunAt: TEST_DUE_NEXT_RUN_AT,
  });

  const result = await runWorkflowMaintenanceTask(workerConfig, {
    releaseScheduledWorkflows: (options) =>
      runtime.releaseScheduledWorkflowRuns({
        ...options,
        now: TEST_RELEASE_NOW,
      }),
  });

  assert.equal(result.worker, 'worker-test');
  assert.equal(result.kind, 'workflow-maintenance');
  assert.equal(result.releasedCount, 1);
  assert.equal(context.workflows.getWorkflowRun('workflow-maint-1').status, 'queued');
  assert.equal(
    context.notifications
      .listNotificationJobs()
      .some((item) => item.payload.source === 'workflow-control'),
    true
  );
});

test('workflow execution task claims and executes queued workflow runs', async () => {
  const context = createControlPlaneContext(createMemoryStore());
  const runtime = createControlPlaneRuntime(context);
  context.workflows.appendWorkflowRun({
    id: 'workflow-exec-1',
    workflowId: 'task-orchestrator.manual-review',
    status: 'queued',
    nextRunAt: TEST_DUE_NEXT_RUN_AT,
  });

  const result = await runWorkflowExecutionTask(workerConfig, {
    claimQueuedWorkflows: (options) =>
      context.workflows.claimQueuedWorkflowRuns({
        ...options,
        now: TEST_CLAIM_NOW,
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
