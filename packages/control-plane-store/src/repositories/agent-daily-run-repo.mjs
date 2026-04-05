import { createAgentDailyRunEntry, matchesScopeFilter, trimAndSave } from '../shared.mjs';

const FILENAME = 'agent-daily-runs.json';

function matchesDailyRunFilter(item, filter = {}) {
  if (!matchesScopeFilter(item, filter)) return false;
  if (filter.status && item.status !== filter.status) return false;
  if (filter.kind && item.kind !== filter.kind) return false;
  if (filter.trigger && item.trigger !== filter.trigger) return false;
  if (filter.accountId && item.accountId !== filter.accountId) return false;
  if (filter.strategyId && item.strategyId !== filter.strategyId) return false;
  if (filter.requestedBy && item.requestedBy !== filter.requestedBy) return false;
  if (filter.since) {
    const sinceMs = Date.parse(filter.since);
    const createdAtMs = Date.parse(item.createdAt || '');
    if (Number.isFinite(sinceMs) && (!Number.isFinite(createdAtMs) || createdAtMs < sinceMs)) {
      return false;
    }
  }
  return true;
}

function persistDailyRun(store, payload = {}) {
  const records = store.readCollection(FILENAME);
  const currentIndex = payload.id ? records.findIndex((item) => item.id === payload.id) : -1;
  const current = currentIndex >= 0 ? records[currentIndex] : null;
  const entry = current
    ? createAgentDailyRunEntry({
      ...current,
      ...payload,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    })
    : createAgentDailyRunEntry(payload);

  if (currentIndex >= 0) {
    records[currentIndex] = entry;
  } else {
    records.unshift(entry);
  }

  trimAndSave(store, FILENAME, records, 240);
  return entry;
}

function appendDailyRun(store, payload = {}) {
  const records = store.readCollection(FILENAME);
  const entry = createAgentDailyRunEntry(payload);
  records.unshift(entry);
  trimAndSave(store, FILENAME, records, 240);
  return entry;
}

export function createAgentDailyRunRepository(store) {
  return {
    list(limit = 50, filter = {}) {
      return store.readCollection(FILENAME)
        .filter((item) => matchesDailyRunFilter(item, filter))
        .slice(0, limit);
    },
    get(runId) {
      return store.readCollection(FILENAME).find((item) => item.id === runId) || null;
    },
    upsert(payload = {}) {
      return persistDailyRun(store, payload);
    },
    append(payload = {}) {
      return appendDailyRun(store, payload);
    },
    update(runId, patch = {}) {
      const current = store.readCollection(FILENAME).find((item) => item.id === runId);
      if (!current) return null;
      return persistDailyRun(store, {
        ...current,
        ...patch,
        id: current.id,
        createdAt: current.createdAt,
      });
    },
    listAgentDailyRuns(limit = 50, filter = {}) {
      return this.list(limit, filter);
    },
    getAgentDailyRun(runId) {
      return this.get(runId);
    },
    upsertAgentDailyRun(payload = {}) {
      return this.upsert(payload);
    },
    appendAgentDailyRun(payload = {}) {
      return this.append(payload);
    },
    updateAgentDailyRun(runId, patch = {}) {
      return this.update(runId, patch);
    },
  };
}
