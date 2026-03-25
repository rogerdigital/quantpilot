import { createAgentPlanEntry, trimAndSave } from '../shared.mjs';

const FILENAME = 'agent-plans.json';

export function createAgentPlanRepository(store) {
  return {
    listAgentPlans(limit = 50, filter = {}) {
      return store.readCollection(FILENAME)
        .filter((item) => {
          if (filter.status && item.status !== filter.status) return false;
          if (filter.sessionId && item.sessionId !== filter.sessionId) return false;
          return true;
        })
        .slice(0, limit);
    },
    getAgentPlan(planId) {
      return store.readCollection(FILENAME).find((item) => item.id === planId) || null;
    },
    getLatestAgentPlanForSession(sessionId) {
      return store.readCollection(FILENAME).find((item) => item.sessionId === sessionId) || null;
    },
    appendAgentPlan(payload = {}) {
      const plans = store.readCollection(FILENAME);
      const entry = createAgentPlanEntry(payload);
      plans.unshift(entry);
      trimAndSave(store, FILENAME, plans, 200);
      return entry;
    },
    updateAgentPlan(planId, patch = {}) {
      const plans = store.readCollection(FILENAME);
      const index = plans.findIndex((item) => item.id === planId);
      if (index === -1) return null;
      const current = plans[index];
      const next = {
        ...current,
        ...patch,
        steps: Array.isArray(patch.steps) ? patch.steps : current.steps,
        metadata: patch.metadata ? { ...current.metadata, ...patch.metadata } : current.metadata,
        updatedAt: patch.updatedAt || new Date().toISOString(),
      };
      plans[index] = next;
      trimAndSave(store, FILENAME, plans, 200);
      return next;
    },
  };
}
