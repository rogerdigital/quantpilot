import { createAgentActionRequestEntry, matchesScopeFilter, trimAndSave } from '../shared.js';

const FILENAME = 'agent-action-requests.json';

export function createAgentActionRequestRepository(store: any) {
  return {
    listAgentActionRequests(limit = 50, filter: any = {}) {
      return store
        .readCollection(FILENAME)
        .filter((item: any) => {
          if (!matchesScopeFilter(item, filter)) return false;
          if (filter.status && item.status !== filter.status) return false;
          if (filter.requestType && item.requestType !== filter.requestType) return false;
          return true;
        })
        .slice(0, limit);
    },
    getAgentActionRequest(requestId: any) {
      return store.readCollection(FILENAME).find((item: any) => item.id === requestId) || null;
    },
    appendAgentActionRequest(payload: any) {
      const requests = store.readCollection(FILENAME);
      const entry = createAgentActionRequestEntry(payload);
      requests.unshift(entry);
      trimAndSave(store, FILENAME, requests, 120);
      return entry;
    },
    updateAgentActionRequest(requestId: any, patch: any) {
      const requests = store.readCollection(FILENAME);
      const index = requests.findIndex((item: any) => item.id === requestId);
      if (index === -1) return null;
      const current = requests[index];
      const next = {
        ...current,
        ...patch,
        metadata: patch.metadata ? { ...current.metadata, ...patch.metadata } : current.metadata,
        updatedAt: patch.updatedAt || new Date().toISOString(),
      };
      requests[index] = next;
      trimAndSave(store, FILENAME, requests, 120);
      return next;
    },
  };
}
