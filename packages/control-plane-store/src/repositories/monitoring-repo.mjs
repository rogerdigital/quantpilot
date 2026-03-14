import { createMonitoringAlertEntry, createMonitoringSnapshotEntry, trimAndSave } from '../shared.mjs';

const SNAPSHOTS_FILE = 'monitoring-snapshots.json';
const ALERTS_FILE = 'monitoring-alerts.json';

export function createMonitoringRepository(store) {
  function filterByDate(items, field, since) {
    if (!since) return items;
    const sinceMs = Date.parse(since);
    if (!Number.isFinite(sinceMs)) return items;
    return items.filter((item) => {
      const valueMs = Date.parse(item[field] || '');
      return Number.isFinite(valueMs) && valueMs >= sinceMs;
    });
  }

  function sortByDateDesc(items, field) {
    return [...items].sort((left, right) => {
      const leftMs = Date.parse(left[field] || '');
      const rightMs = Date.parse(right[field] || '');
      if (!Number.isFinite(leftMs) && !Number.isFinite(rightMs)) return 0;
      if (!Number.isFinite(leftMs)) return 1;
      if (!Number.isFinite(rightMs)) return -1;
      return rightMs - leftMs;
    });
  }

  return {
    listMonitoringSnapshots(limit = 50, filter = {}) {
      const items = sortByDateDesc(
        filterByDate(store.readCollection(SNAPSHOTS_FILE), 'generatedAt', filter.since)
          .filter((item) => !filter.status || item.status === filter.status),
        'generatedAt',
      );
      return items.slice(0, limit);
    },
    listMonitoringAlerts(limit = 100, filter = {}) {
      const items = sortByDateDesc(
        filterByDate(store.readCollection(ALERTS_FILE), 'createdAt', filter.since)
          .filter((item) => !filter.snapshotId || item.snapshotId === filter.snapshotId)
          .filter((item) => !filter.source || item.source === filter.source)
          .filter((item) => !filter.level || item.level === filter.level),
        'createdAt',
      );
      return items.slice(0, limit);
    },
    recordMonitoringSnapshot(payload = {}) {
      const snapshots = store.readCollection(SNAPSHOTS_FILE);
      const alerts = store.readCollection(ALERTS_FILE);
      const snapshot = createMonitoringSnapshotEntry(payload);
      snapshots.unshift(snapshot);
      trimAndSave(store, SNAPSHOTS_FILE, snapshots, 120);

      const nextAlerts = Array.isArray(payload.alerts) ? payload.alerts.map((item) => createMonitoringAlertEntry({
        ...item,
        status: payload.status || 'healthy',
        snapshotId: snapshot.id,
        createdAt: payload.generatedAt || snapshot.createdAt,
      })) : [];
      if (nextAlerts.length) {
        alerts.unshift(...nextAlerts);
        trimAndSave(store, ALERTS_FILE, alerts, 240);
      }

      return {
        snapshot,
        alerts: nextAlerts,
      };
    },
  };
}
