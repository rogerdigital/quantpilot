import { createOperatorActionEntry, matchesScopeFilter, trimAndSave } from '../shared.js';

const FILENAME = 'operator-actions.json';

export function createOperatorActionRepository(store: any) {
  function filterByDate(items: any, since: any) {
    if (!since) return items;
    const sinceMs = Date.parse(since);
    if (!Number.isFinite(sinceMs)) return items;
    return items.filter((item: any) => {
      const valueMs = Date.parse(item.createdAt || '');
      return Number.isFinite(valueMs) && valueMs >= sinceMs;
    });
  }

  function sortByCreatedAtDesc(items: any) {
    return [...items].sort((left: any, right: any) => {
      const leftMs = Date.parse(left.createdAt || '');
      const rightMs = Date.parse(right.createdAt || '');
      if (!Number.isFinite(leftMs) && !Number.isFinite(rightMs)) return 0;
      if (!Number.isFinite(leftMs)) return 1;
      if (!Number.isFinite(rightMs)) return -1;
      return rightMs - leftMs;
    });
  }

  return {
    listOperatorActions(limit = 50, filter: any = {}) {
      const items = sortByCreatedAtDesc(
        filterByDate(store.readCollection(FILENAME), filter.since)
          .filter((item: any) => matchesScopeFilter(item, filter))
          .filter((item: any) => !filter.level || item.level === filter.level)
      );
      return items.slice(0, limit);
    },
    appendOperatorAction(payload: any) {
      const actions = store.readCollection(FILENAME);
      const entry = createOperatorActionEntry(payload);
      actions.unshift(entry);
      trimAndSave(store, FILENAME, actions, 100);
      return entry;
    },
  };
}
