import { createAgentSessionMessageEntry, matchesScopeFilter, trimAndSave } from '../shared.js';

const FILENAME = 'agent-session-messages.json';

export function createAgentSessionMessageRepository(store: any) {
  return {
    listAgentSessionMessages(sessionId: any, limit = 100, filter: any = {}) {
      return store
        .readCollection(FILENAME)
        .filter((item: any) => {
          if (sessionId && item.sessionId !== sessionId) return false;
          if (!matchesScopeFilter(item, filter)) return false;
          if (filter.role && item.role !== filter.role) return false;
          if (filter.kind && item.kind !== filter.kind) return false;
          return true;
        })
        .slice(0, limit);
    },
    appendAgentSessionMessage(payload = {}) {
      const messages = store.readCollection(FILENAME);
      const entry = createAgentSessionMessageEntry(payload);
      messages.unshift(entry);
      trimAndSave(store, FILENAME, messages, 400);
      return entry;
    },
  };
}
