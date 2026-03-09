import { createAuditRecordEntry, trimAndSave } from '../shared.mjs';

const FILENAME = 'audit-records.json';

export function createAuditRepository(store) {
  return {
    listAuditRecords(limit = 50) {
      return store.readCollection(FILENAME).slice(0, limit);
    },
    appendAuditRecord(record) {
      const records = store.readCollection(FILENAME);
      const entry = createAuditRecordEntry(record);
      records.unshift(entry);
      trimAndSave(store, FILENAME, records, 100);
      return entry;
    },
  };
}
