// @ts-nocheck
import { createAgentAuthorityEventEntry, matchesScopeFilter, trimAndSave } from '../shared.js';

const FILENAME = 'agent-authority-events.json';

function matchesAuthorityEventFilter(item, filter = {}) {
  if (!matchesScopeFilter(item, filter)) return false;
  if (filter.severity && item.severity !== filter.severity) return false;
  if (filter.eventType && item.eventType !== filter.eventType) return false;
  if (filter.accountId && item.accountId !== filter.accountId) return false;
  if (filter.strategyId && item.strategyId !== filter.strategyId) return false;
  if (filter.actionType && item.actionType !== filter.actionType) return false;
  if (filter.sessionId && item.sessionId !== filter.sessionId) return false;
  if (filter.policyId && item.policyId !== filter.policyId) return false;
  if (filter.since) {
    const sinceMs = Date.parse(filter.since);
    const createdAtMs = Date.parse(item.createdAt || '');
    if (Number.isFinite(sinceMs) && (!Number.isFinite(createdAtMs) || createdAtMs < sinceMs)) {
      return false;
    }
  }
  return true;
}

function persistAuthorityEvent(store, payload = {}) {
  const records = store.readCollection(FILENAME);
  const currentIndex = payload.id ? records.findIndex((item) => item.id === payload.id) : -1;
  const current = currentIndex >= 0 ? records[currentIndex] : null;
  const entry = current
    ? createAgentAuthorityEventEntry({
        ...current,
        ...payload,
        id: current.id,
        createdAt: current.createdAt,
      })
    : createAgentAuthorityEventEntry(payload);

  if (currentIndex >= 0) {
    records[currentIndex] = entry;
  } else {
    records.unshift(entry);
  }

  trimAndSave(store, FILENAME, records, 240);
  return entry;
}

function appendAuthorityEvent(store, payload = {}) {
  const records = store.readCollection(FILENAME);
  const entry = createAgentAuthorityEventEntry(payload);
  records.unshift(entry);
  trimAndSave(store, FILENAME, records, 240);
  return entry;
}

export function createAgentAuthorityEventRepository(store) {
  return {
    list(limit = 50, filter = {}) {
      return store
        .readCollection(FILENAME)
        .filter((item) => matchesAuthorityEventFilter(item, filter))
        .slice(0, limit);
    },
    get(eventId) {
      return store.readCollection(FILENAME).find((item) => item.id === eventId) || null;
    },
    upsert(payload = {}) {
      return persistAuthorityEvent(store, payload);
    },
    append(payload = {}) {
      return appendAuthorityEvent(store, payload);
    },
    update(eventId, patch = {}) {
      const current = store.readCollection(FILENAME).find((item) => item.id === eventId);
      if (!current) return null;
      return persistAuthorityEvent(store, {
        ...current,
        ...patch,
        id: current.id,
        createdAt: current.createdAt,
      });
    },
    listAgentAuthorityEvents(limit = 50, filter = {}) {
      return this.list(limit, filter);
    },
    getAgentAuthorityEvent(eventId) {
      return this.get(eventId);
    },
    upsertAgentAuthorityEvent(payload = {}) {
      return this.upsert(payload);
    },
    appendAgentAuthorityEvent(payload = {}) {
      return this.append(payload);
    },
    updateAgentAuthorityEvent(eventId, patch = {}) {
      return this.update(eventId, patch);
    },
  };
}
