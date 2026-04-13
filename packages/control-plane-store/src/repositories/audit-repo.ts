// @ts-nocheck
import { createAuditRecordEntry, matchesScopeFilter, trimAndSave } from '../shared.js';

const FILENAME = 'audit-records.json';

export function createAuditRepository(store) {
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
    listAuditRecords(limit = 50, filter = {}) {
      const items = sortByCreatedAtDesc(
        filterByDate(store.readCollection(FILENAME), filter.since)
          .filter((item) => matchesScopeFilter(item, filter))
          .filter((item) => !filter.type || item.type === filter.type)
      );
      return items.slice(0, limit);
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
