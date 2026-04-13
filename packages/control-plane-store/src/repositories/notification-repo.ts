// @ts-nocheck
import { createNotificationEntry, matchesScopeFilter, trimAndSave } from '../shared.js';

const EVENTS_FILE = 'notifications.json';
const OUTBOX_FILE = 'notification-outbox.json';

export function createNotificationRepository(store) {
  function filterByDate(items, since) {
    if (!since) return items;
    const sinceMs = Date.parse(since);
    if (!Number.isFinite(sinceMs)) return items;
    return items.filter((item) => {
      const valueMs = Date.parse(item.createdAt || '');
      return Number.isFinite(valueMs) && valueMs >= sinceMs;
    });
  }

  function sortByCreatedAtDesc(items) {
    return [...items].sort((left, right) => {
      const leftMs = Date.parse(left.createdAt || '');
      const rightMs = Date.parse(right.createdAt || '');
      if (!Number.isFinite(leftMs) && !Number.isFinite(rightMs)) return 0;
      if (!Number.isFinite(leftMs)) return 1;
      if (!Number.isFinite(rightMs)) return -1;
      return rightMs - leftMs;
    });
  }

  return {
    listNotifications(limit = 50, filter = {}) {
      const items = sortByCreatedAtDesc(
        filterByDate(store.readCollection(EVENTS_FILE), filter.since)
          .filter((item) => matchesScopeFilter(item, filter))
          .filter((item) => !filter.level || item.level === filter.level)
          .filter((item) => !filter.source || item.source === filter.source)
      );
      return items.slice(0, limit);
    },
    appendNotification(event) {
      const notifications = store.readCollection(EVENTS_FILE);
      const entry = createNotificationEntry(event);
      notifications.unshift(entry);
      trimAndSave(store, EVENTS_FILE, notifications, 100);
      return entry;
    },
    enqueueNotification(event) {
      const jobs = store.readCollection(OUTBOX_FILE);
      const job = {
        id: `notification-job-${event.id || Date.now()}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
        payload: createNotificationEntry(event),
      };
      jobs.unshift(job);
      trimAndSave(store, OUTBOX_FILE, jobs, 200);
      return job;
    },
    listNotificationJobs(limit = 50) {
      return store.readCollection(OUTBOX_FILE).slice(0, limit);
    },
    dispatchPendingNotifications(options = {}) {
      const worker = options.worker || 'quantpilot-worker';
      const limit = Number.isFinite(options.limit) ? options.limit : 20;
      const jobs = store.readCollection(OUTBOX_FILE);
      const notifications = store.readCollection(EVENTS_FILE);
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
        trimAndSave(store, EVENTS_FILE, notifications, 100);
        store.writeCollection(OUTBOX_FILE, [...dispatchedJobs, ...pendingJobs].slice(0, 200));
      }

      return {
        worker,
        dispatchedCount: dispatchedJobs.length,
        dispatchedJobs,
      };
    },
  };
}
