import { createExecutionPlanEntry, trimAndSave } from '../shared.js';

const FILENAME = 'execution-plans.json';

export function createExecutionPlanRepository(store) {
  return {
    listExecutionPlans(limit = 50, filter = {}) {
      return store.readCollection(FILENAME)
        .filter((item) => {
          if (filter.status && item.status !== filter.status) return false;
          if (filter.strategyId && item.strategyId !== filter.strategyId) return false;
          return true;
        })
        .slice(0, limit);
    },
    getExecutionPlan(planId) {
      return store.readCollection(FILENAME).find((item) => item.id === planId) || null;
    },
    findExecutionPlanByWorkflowRunId(workflowRunId) {
      return store.readCollection(FILENAME).find((item) => item.workflowRunId === workflowRunId) || null;
    },
    appendExecutionPlan(payload) {
      const plans = store.readCollection(FILENAME);
      const entry = createExecutionPlanEntry(payload);
      plans.unshift(entry);
      trimAndSave(store, FILENAME, plans, 120);
      return entry;
    },
    updateExecutionPlan(planId, patch) {
      const plans = store.readCollection(FILENAME);
      const index = plans.findIndex((item) => item.id === planId);
      if (index === -1) return null;
      const current = plans[index];
      const next = {
        ...current,
        ...patch,
        orders: Array.isArray(patch.orders) ? patch.orders : current.orders,
        metadata: patch.metadata ? { ...current.metadata, ...patch.metadata } : current.metadata,
        updatedAt: patch.updatedAt || new Date().toISOString(),
      };
      plans[index] = next;
      trimAndSave(store, FILENAME, plans, 120);
      return next;
    },
  };
}
