import { createCycleRecordEntry, trimAndSave } from '../shared.mjs';

const FILENAME = 'cycle-records.json';

export function createCycleRepository(store) {
  return {
    listCycleRecords(limit = 30) {
      return store.readCollection(FILENAME).slice(0, limit);
    },
    appendCycleRecord(payload) {
      const cycles = store.readCollection(FILENAME);
      const entry = createCycleRecordEntry(payload);
      cycles.unshift(entry);
      trimAndSave(store, FILENAME, cycles, 60);
      return entry;
    },
  };
}
