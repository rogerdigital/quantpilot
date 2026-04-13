// @ts-nocheck
import { controlPlaneRuntime } from '../../../../packages/control-plane-runtime/src/index.js';

export async function runNotificationDispatchTask(config, dependencies = {}) {
  const flushNotifications =
    dependencies.flushQueuedNotifications || controlPlaneRuntime.dispatchPendingNotifications;
  const result = flushNotifications({
    worker: config.name,
    limit: config.notificationBatchSize,
  });
  return {
    worker: config.name,
    kind: 'notification-dispatch',
    timestamp: new Date().toISOString(),
    summary: result.dispatchedCount
      ? `Dispatched ${result.dispatchedCount} queued notifications.`
      : 'No queued notifications.',
    dispatchedCount: result.dispatchedCount,
  };
}
