// @ts-nocheck
import { createAgentSessionEntry, matchesScopeFilter, trimAndSave } from '../shared.js';

const FILENAME = 'agent-sessions.json';

export function createAgentSessionRepository(store) {
  return {
    listAgentSessions(limit = 50, filter = {}) {
      return store
        .readCollection(FILENAME)
        .filter((item) => {
          if (!matchesScopeFilter(item, filter)) return false;
          if (filter.status && item.status !== filter.status) return false;
          if (filter.requestedBy && item.requestedBy !== filter.requestedBy) return false;
          return true;
        })
        .slice(0, limit);
    },
    getAgentSession(sessionId) {
      return store.readCollection(FILENAME).find((item) => item.id === sessionId) || null;
    },
    appendAgentSession(payload = {}) {
      const sessions = store.readCollection(FILENAME);
      const entry = createAgentSessionEntry(payload);
      sessions.unshift(entry);
      trimAndSave(store, FILENAME, sessions, 120);
      return entry;
    },
    updateAgentSession(sessionId, patch = {}) {
      const sessions = store.readCollection(FILENAME);
      const index = sessions.findIndex((item) => item.id === sessionId);
      if (index === -1) return null;
      const current = sessions[index];
      const next = {
        ...current,
        ...patch,
        latestIntent: patch.latestIntent
          ? {
              ...current.latestIntent,
              ...patch.latestIntent,
              metadata: patch.latestIntent.metadata
                ? { ...current.latestIntent.metadata, ...patch.latestIntent.metadata }
                : current.latestIntent.metadata,
            }
          : current.latestIntent,
        tags: Array.isArray(patch.tags) ? patch.tags : current.tags,
        metadata: patch.metadata ? { ...current.metadata, ...patch.metadata } : current.metadata,
        updatedAt: patch.updatedAt || new Date().toISOString(),
      };
      sessions[index] = next;
      trimAndSave(store, FILENAME, sessions, 120);
      return next;
    },
  };
}
