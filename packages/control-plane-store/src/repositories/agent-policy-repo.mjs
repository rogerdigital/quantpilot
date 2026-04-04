import { createAgentPolicyEntry, matchesScopeFilter, trimAndSave } from '../shared.mjs';

const FILENAME = 'agent-policies.json';

function matchesPolicyFilter(item, filter = {}) {
  if (!matchesScopeFilter(item, filter)) return false;
  if (filter.accountId && item.accountId !== filter.accountId) return false;
  if (filter.strategyId && item.strategyId !== filter.strategyId) return false;
  if (filter.actionType && item.actionType !== filter.actionType) return false;
  if (filter.environment && item.environment !== filter.environment) return false;
  if (filter.authority && item.authority !== filter.authority) return false;
  if (filter.since) {
    const sinceMs = Date.parse(filter.since);
    const createdAtMs = Date.parse(item.createdAt || '');
    if (Number.isFinite(sinceMs) && (!Number.isFinite(createdAtMs) || createdAtMs < sinceMs)) {
      return false;
    }
  }
  return true;
}

function persistPolicy(store, payload = {}) {
  const records = store.readCollection(FILENAME);
  const currentIndex = payload.id ? records.findIndex((item) => item.id === payload.id) : -1;
  const current = currentIndex >= 0 ? records[currentIndex] : null;
  const entry = current
    ? createAgentPolicyEntry({
      ...current,
      ...payload,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    })
    : createAgentPolicyEntry(payload);

  if (currentIndex >= 0) {
    records[currentIndex] = entry;
  } else {
    records.unshift(entry);
  }

  trimAndSave(store, FILENAME, records, 120);
  return entry;
}

export function createAgentPolicyRepository(store) {
  return {
    list(limit = 50, filter = {}) {
      return store.readCollection(FILENAME)
        .filter((item) => matchesPolicyFilter(item, filter))
        .slice(0, limit);
    },
    get(policyId) {
      return store.readCollection(FILENAME).find((item) => item.id === policyId) || null;
    },
    upsert(payload = {}) {
      return persistPolicy(store, payload);
    },
    append(payload = {}) {
      return persistPolicy(store, payload);
    },
    update(policyId, patch = {}) {
      const current = store.readCollection(FILENAME).find((item) => item.id === policyId);
      if (!current) return null;
      return persistPolicy(store, {
        ...current,
        ...patch,
        id: current.id,
        createdAt: current.createdAt,
      });
    },
    listAgentPolicies(limit = 50, filter = {}) {
      return this.list(limit, filter);
    },
    getAgentPolicy(policyId) {
      return this.get(policyId);
    },
    upsertAgentPolicy(payload = {}) {
      return this.upsert(payload);
    },
    appendAgentPolicy(payload = {}) {
      return this.append(payload);
    },
    updateAgentPolicy(policyId, patch = {}) {
      return this.update(policyId, patch);
    },
  };
}
