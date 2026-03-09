import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(packageDir, '..', '..', '..');
const runtimeRoot = join(repoRoot, '.quantpilot-runtime', 'control-plane');
const notificationsPath = join(runtimeRoot, 'notifications.json');
const outboxPath = join(runtimeRoot, 'notification-outbox.json');

function ensureRuntimeRoot() {
  mkdirSync(runtimeRoot, { recursive: true });
}

function readCollection(pathname) {
  ensureRuntimeRoot();
  if (!existsSync(pathname)) {
    return [];
  }
  try {
    const text = readFileSync(pathname, 'utf8');
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCollection(pathname, entries) {
  ensureRuntimeRoot();
  writeFileSync(pathname, JSON.stringify(entries, null, 2));
}

function createNotificationEntry(event) {
  return {
    id: event.id || `notification-${randomUUID()}`,
    level: event.level || 'info',
    title: event.title || 'Notification',
    message: event.message || '',
    source: event.source || 'system',
    createdAt: event.createdAt || new Date().toISOString(),
    metadata: event.metadata || {},
  };
}

export function listNotifications(limit = 50) {
  return readCollection(notificationsPath).slice(0, limit);
}

export function appendNotification(event) {
  const notifications = readCollection(notificationsPath);
  const entry = createNotificationEntry(event);
  notifications.unshift(entry);
  notifications.splice(100);
  writeCollection(notificationsPath, notifications);
  return entry;
}

export function enqueueNotification(event) {
  const jobs = readCollection(outboxPath);
  const job = {
    id: `notification-job-${randomUUID()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    payload: createNotificationEntry(event),
  };
  jobs.unshift(job);
  jobs.splice(200);
  writeCollection(outboxPath, jobs);
  return job;
}

export function listNotificationJobs(limit = 50) {
  return readCollection(outboxPath).slice(0, limit);
}

export function dispatchPendingNotifications(options = {}) {
  const worker = options.worker || 'quantpilot-worker';
  const limit = Number.isFinite(options.limit) ? options.limit : 20;
  const jobs = readCollection(outboxPath);
  const notifications = readCollection(notificationsPath);
  const dispatchedJobs = [];
  const pendingJobs = [];

  jobs.forEach((job) => {
    if (job.status !== 'pending' || dispatchedJobs.length >= limit) {
      pendingJobs.push(job);
      return;
    }
    const entry = {
      ...job.payload,
      dispatchedAt: new Date().toISOString(),
      dispatchedBy: worker,
    };
    notifications.unshift(entry);
    dispatchedJobs.push({
      ...job,
      status: 'dispatched',
      dispatchedAt: entry.dispatchedAt,
      dispatchedBy: worker,
      notificationId: entry.id,
    });
  });

  if (dispatchedJobs.length) {
    notifications.splice(100);
    writeCollection(notificationsPath, notifications);
    writeCollection(outboxPath, [...dispatchedJobs, ...pendingJobs].slice(0, 200));
  }

  return {
    worker,
    dispatchedCount: dispatchedJobs.length,
    dispatchedJobs,
  };
}
