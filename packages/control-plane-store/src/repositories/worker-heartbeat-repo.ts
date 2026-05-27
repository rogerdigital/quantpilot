import { createWorkerHeartbeatEntry, matchesScopeFilter, trimAndSave } from '../shared.js';

const FILENAME = 'worker-heartbeats.json';

export function createWorkerHeartbeatRepository(store: any) {
  return {
    listWorkerHeartbeats(limit = 50, filter: any = {}) {
      return store
        .readCollection(FILENAME)
        .filter((item: any) => matchesScopeFilter(item, filter))
        .slice(0, limit);
    },
    recordWorkerHeartbeat(payload = {}) {
      const heartbeats = store.readCollection(FILENAME);
      const entry = createWorkerHeartbeatEntry(payload);
      heartbeats.unshift(entry);
      trimAndSave(store, FILENAME, heartbeats, 120);
      return entry;
    },
    getLatestWorkerHeartbeat(worker: any = '') {
      return (
        store.readCollection(FILENAME).find((item: any) => !worker || item.worker === worker) ||
        null
      );
    },
  };
}
