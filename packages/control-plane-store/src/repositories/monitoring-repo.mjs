import { createMonitoringAlertEntry, createMonitoringSnapshotEntry, trimAndSave } from '../shared.mjs';

const SNAPSHOTS_FILE = 'monitoring-snapshots.json';
const ALERTS_FILE = 'monitoring-alerts.json';

export function createMonitoringRepository(store) {
  return {
    listMonitoringSnapshots(limit = 50) {
      return store.readCollection(SNAPSHOTS_FILE).slice(0, limit);
    },
    listMonitoringAlerts(limit = 100) {
      return store.readCollection(ALERTS_FILE).slice(0, limit);
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
