import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.js';

function parseLimit(value: any, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveSince(hours: any): string {
  const parsed = Number(hours);
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  return new Date(Date.now() - parsed * 60 * 60 * 1000).toISOString();
}

export function listNotifications(options: Record<string, any> = {}) {
  return controlPlaneRuntime.listNotifications(parseLimit(options.limit, 50), {
    level: options.level || '',
    source: options.source || '',
    since: resolveSince(options.hours),
  });
}

export function appendNotification(event: any) {
  return controlPlaneRuntime.appendNotification(event);
}

export function queueNotification(event: any) {
  return controlPlaneRuntime.enqueueNotification(event);
}

export function listQueuedNotifications(limit = 50) {
  return controlPlaneRuntime.listNotificationJobs(limit);
}

export function flushQueuedNotifications(options: Record<string, any> = {}) {
  return controlPlaneRuntime.dispatchPendingNotifications(options);
}
