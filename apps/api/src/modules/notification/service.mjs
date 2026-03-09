import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.mjs';

export function listNotifications(limit = 50) {
  return controlPlaneRuntime.listNotifications(limit);
}

export function appendNotification(event) {
  return controlPlaneRuntime.appendNotification(event);
}

export function queueNotification(event) {
  return controlPlaneRuntime.enqueueNotification(event);
}

export function listQueuedNotifications(limit = 50) {
  return controlPlaneRuntime.listNotificationJobs(limit);
}

export function flushQueuedNotifications(options = {}) {
  return controlPlaneRuntime.dispatchPendingNotifications(options);
}
