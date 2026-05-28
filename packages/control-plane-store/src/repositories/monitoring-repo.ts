import {
  createMonitoringAlertEntry,
  createMonitoringSnapshotEntry,
  matchesScopeFilter,
  trimAndSave,
} from '../shared.js';

const SNAPSHOTS_FILE = 'monitoring-snapshots.json';
const ALERTS_FILE = 'monitoring-alerts.json';

export function createMonitoringRepository(store: any) {
  function filterByDate(items: any, field: any, since: any) {
    if (!since) return items;
    const sinceMs = Date.parse(since);
    if (!Number.isFinite(sinceMs)) return items;
    return items.filter((item: any) => {
      const valueMs = Date.parse(item[field] || '');
      return Number.isFinite(valueMs) && valueMs >= sinceMs;
    });
  }

  function sortByDateDesc(items: any, field: any) {
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
    listMonitoringSnapshots(limit = 50, filter: any = {}) {
      const items = sortByDateDesc(
        filterByDate(store.readCollection(SNAPSHOTS_FILE), 'generatedAt', filter.since)
          .filter((item: any) => matchesScopeFilter(item, filter))
          .filter((item: any) => !filter.status || item.status === filter.status),
        'generatedAt'
      );
      return items.slice(0, limit);
    },
    listMonitoringAlerts(limit = 100, filter: any = {}) {
      const items = sortByDateDesc(
        filterByDate(store.readCollection(ALERTS_FILE), 'createdAt', filter.since)
          .filter((item: any) => matchesScopeFilter(item, filter))
          .filter((item: any) => !filter.snapshotId || item.snapshotId === filter.snapshotId)
          .filter((item: any) => !filter.source || item.source === filter.source)
          .filter((item: any) => !filter.level || item.level === filter.level),
        'createdAt'
      );
      return items.slice(0, limit);
    },
    recordMonitoringSnapshot(payload: any = {}) {
      const snapshots = store.readCollection(SNAPSHOTS_FILE);
      const alerts = store.readCollection(ALERTS_FILE);
      const snapshot = createMonitoringSnapshotEntry(payload);
      snapshots.unshift(snapshot);
      trimAndSave(store, SNAPSHOTS_FILE, snapshots, 120);

      const nextAlerts = Array.isArray(payload.alerts)
        ? payload.alerts.map((item: any) =>
            createMonitoringAlertEntry({
              ...item,
              status: payload.status || 'healthy',
              snapshotId: snapshot.id,
              createdAt: payload.generatedAt || snapshot.createdAt,
            })
          )
        : [];
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
