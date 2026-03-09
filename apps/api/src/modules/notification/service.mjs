import {
  appendNotification as appendStoredNotification,
  dispatchPendingNotifications,
  enqueueNotification,
  listNotificationJobs,
  listNotifications as listStoredNotifications,
} from '../../../../../packages/control-plane-store/src/index.mjs';

export function listNotifications(limit = 50) {
  return listStoredNotifications(limit);
}

export function appendNotification(event) {
  return appendStoredNotification(event);
}

export function queueNotification(event) {
  return enqueueNotification(event);
}

export function listQueuedNotifications(limit = 50) {
  return listNotificationJobs(limit);
}

export function flushQueuedNotifications(options = {}) {
  return dispatchPendingNotifications(options);
}
