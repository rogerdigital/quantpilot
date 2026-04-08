import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.js';

function parseLimit(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveSince(hours) {
  const parsed = Number(hours);
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  return new Date(Date.now() - parsed * 60 * 60 * 1000).toISOString();
}

export function listNotifications(options = {}) {
  return controlPlaneRuntime.listNotifications(parseLimit(options.limit, 50), {
    level: options.level || '',
    source: options.source || '',
    since: resolveSince(options.hours),
  });
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
