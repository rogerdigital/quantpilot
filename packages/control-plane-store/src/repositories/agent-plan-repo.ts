import { createAgentPlanEntry, matchesScopeFilter, trimAndSave } from '../shared.js';

const FILENAME = 'agent-plans.json';

export function createAgentPlanRepository(store: any) {
  return {
    listAgentPlans(limit = 50, filter: any = {}) {
      return store
        .readCollection(FILENAME)
        .filter((item: any) => {
          if (!matchesScopeFilter(item, filter)) return false;
          if (filter.status && item.status !== filter.status) return false;
          if (filter.sessionId && item.sessionId !== filter.sessionId) return false;
          return true;
        })
        .slice(0, limit);
    },
    getAgentPlan(planId: any) {
      return store.readCollection(FILENAME).find((item: any) => item.id === planId) || null;
    },
    getLatestAgentPlanForSession(sessionId: any) {
      return (
        store.readCollection(FILENAME).find((item: any) => item.sessionId === sessionId) || null
      );
    },
    appendAgentPlan(payload: any = {}) {
      const plans = store.readCollection(FILENAME);
      const entry = createAgentPlanEntry(payload);
      plans.unshift(entry);
      trimAndSave(store, FILENAME, plans, 200);
      return entry;
    },
    updateAgentPlan(planId: any, patch: any = {}) {
      const plans = store.readCollection(FILENAME);
      const index = plans.findIndex((item: any) => item.id === planId);
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
