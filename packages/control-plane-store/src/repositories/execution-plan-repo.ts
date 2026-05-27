import { createExecutionPlanEntry, trimAndSave } from '../shared.js';

const FILENAME = 'execution-plans.json';

export function createExecutionPlanRepository(store: any) {
  return {
    listExecutionPlans(limit = 50, filter: any = {}) {
      return store
        .readCollection(FILENAME)
        .filter((item: any) => {
          if (filter.status && item.status !== filter.status) return false;
          if (filter.strategyId && item.strategyId !== filter.strategyId) return false;
          return true;
        })
        .slice(0, limit);
    },
    getExecutionPlan(planId: any) {
      return store.readCollection(FILENAME).find((item: any) => item.id === planId) || null;
    },
    findExecutionPlanByWorkflowRunId(workflowRunId: any) {
      return (
        store.readCollection(FILENAME).find((item: any) => item.workflowRunId === workflowRunId) ||
        null
      );
    },
    appendExecutionPlan(payload: any) {
      const plans = store.readCollection(FILENAME);
      const entry = createExecutionPlanEntry(payload);
      plans.unshift(entry);
      trimAndSave(store, FILENAME, plans, 120);
      return entry;
    },
    updateExecutionPlan(planId: any, patch: any) {
      const plans = store.readCollection(FILENAME);
      const index = plans.findIndex((item: any) => item.id === planId);
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
