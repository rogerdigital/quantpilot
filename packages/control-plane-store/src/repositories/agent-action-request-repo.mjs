import { createAgentActionRequestEntry, trimAndSave } from '../shared.mjs';

const FILENAME = 'agent-action-requests.json';

export function createAgentActionRequestRepository(store) {
  return {
    listAgentActionRequests(limit = 50, filter = {}) {
      return store.readCollection(FILENAME)
        .filter((item) => {
          if (filter.status && item.status !== filter.status) return false;
          if (filter.requestType && item.requestType !== filter.requestType) return false;
          return true;
        })
        .slice(0, limit);
    },
    getAgentActionRequest(requestId) {
      return store.readCollection(FILENAME).find((item) => item.id === requestId) || null;
    },
    appendAgentActionRequest(payload) {
      const requests = store.readCollection(FILENAME);
      const entry = createAgentActionRequestEntry(payload);
      requests.unshift(entry);
      trimAndSave(store, FILENAME, requests, 120);
      return entry;
    },
    updateAgentActionRequest(requestId, patch) {
      const requests = store.readCollection(FILENAME);
      const index = requests.findIndex((item) => item.id === requestId);
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
