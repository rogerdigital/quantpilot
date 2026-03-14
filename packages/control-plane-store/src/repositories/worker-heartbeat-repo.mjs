import { createWorkerHeartbeatEntry, trimAndSave } from '../shared.mjs';

const FILENAME = 'worker-heartbeats.json';

export function createWorkerHeartbeatRepository(store) {
  return {
    listWorkerHeartbeats(limit = 50) {
      return store.readCollection(FILENAME).slice(0, limit);
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
