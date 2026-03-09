import { createCycleRecordEntry, trimAndSave } from '../shared.mjs';
import { controlPlaneStore as store } from '../store.mjs';

const FILENAME = 'cycle-records.json';

export function listCycleRecords(limit = 30) {
  return store.readCollection(FILENAME).slice(0, limit);
}

export function appendCycleRecord(payload) {
  const cycles = store.readCollection(FILENAME);
  const entry = createCycleRecordEntry(payload);
  cycles.unshift(entry);
  trimAndSave(store, FILENAME, cycles, 60);
  return entry;
}
