import test from 'node:test';
import assert from 'node:assert/strict';
import { createControlPlaneContext } from '../../../packages/control-plane-store/src/context.mjs';
import { createMemoryStore } from '../../../packages/control-plane-store/test/helpers/memory-store.mjs';
import { runNotificationDispatchTask } from '../src/tasks/notification-dispatch-task.mjs';
import { runRiskScanTask } from '../src/tasks/risk-scan-task.mjs';
import { runSchedulerTickTask } from '../src/tasks/scheduler-tick-task.mjs';

const workerConfig = {
  name: 'worker-test',
  notificationBatchSize: 20,
  riskScanBatchSize: 20,
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
