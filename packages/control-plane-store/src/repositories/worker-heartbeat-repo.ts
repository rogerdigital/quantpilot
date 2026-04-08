import { createWorkerHeartbeatEntry, matchesScopeFilter, trimAndSave } from '../shared.js';

const FILENAME = 'worker-heartbeats.json';

export function createWorkerHeartbeatRepository(store) {
  return {
    listWorkerHeartbeats(limit = 50, filter = {}) {
      return store.readCollection(FILENAME)
        .filter((item) => matchesScopeFilter(item, filter))
        .slice(0, limit);
    },
    recordWorkerHeartbeat(payload = {}) {
      const heartbeats = store.readCollection(FILENAME);
      const entry = createWorkerHeartbeatEntry(payload);
      heartbeats.unshift(entry);
      trimAndSave(store, FILENAME, heartbeats, 120);
      return entry;
    },
    getLatestWorkerHeartbeat(worker = '') {
      return store.readCollection(FILENAME).find((item) => !worker || item.worker === worker) || null;
    },
  };
}
