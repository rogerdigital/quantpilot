import { flushQueuedNotifications } from '../../../api/src/modules/notification/service.mjs';

export async function runNotificationDispatchTask(config, dependencies = {}) {
  const flushNotifications = dependencies.flushQueuedNotifications || flushQueuedNotifications;
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
