import { createExecutionOrderStateEntry, createExecutionRunEntry, trimAndSave } from '../shared.mjs';

const RUNS_FILE = 'execution-runs.json';
const ORDERS_FILE = 'execution-order-states.json';

export function createExecutionRunRepository(store) {
  function readRuns() {
    return store.readCollection(RUNS_FILE).map((item) => createExecutionRunEntry(item));
  }

  function writeRuns(items) {
    trimAndSave(store, RUNS_FILE, items.map((item) => createExecutionRunEntry(item)), 180);
  }

  function readOrderStates() {
    return store.readCollection(ORDERS_FILE).map((item) => createExecutionOrderStateEntry(item));
  }

  function writeOrderStates(items) {
    trimAndSave(store, ORDERS_FILE, items.map((item) => createExecutionOrderStateEntry(item)), 600);
  }

  return {
    listExecutionRuns(limit = 50, filter = {}) {
      return readRuns()
        .filter((item) => !filter.executionPlanId || item.executionPlanId === filter.executionPlanId)
        .filter((item) => !filter.strategyId || item.strategyId === filter.strategyId)
        .filter((item) => !filter.lifecycleStatus || item.lifecycleStatus === filter.lifecycleStatus)
        .slice(0, limit);
    },
    getExecutionRun(runId) {
      return readRuns().find((item) => item.id === runId) || null;
    },
    getExecutionRunByPlanId(executionPlanId) {
      return readRuns().find((item) => item.executionPlanId === executionPlanId) || null;
    },
    appendExecutionRun(payload = {}) {
      const items = readRuns();
      const entry = createExecutionRunEntry(payload);
      items.unshift(entry);
      writeRuns(items);
      return entry;
    },
    updateExecutionRun(runId, patch = {}) {
      const items = readRuns();
      const index = items.findIndex((item) => item.id === runId);
      if (index === -1) return null;
      const current = items[index];
      items[index] = createExecutionRunEntry({
        ...current,
        ...patch,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: patch.updatedAt || new Date().toISOString(),
        metadata: patch.metadata ? { ...current.metadata, ...patch.metadata } : current.metadata,
      });
      writeRuns(items);
      return items[index];
    },
    listExecutionOrderStates(limit = 200, filter = {}) {
      return readOrderStates()
        .filter((item) => !filter.executionPlanId || item.executionPlanId === filter.executionPlanId)
        .filter((item) => !filter.executionRunId || item.executionRunId === filter.executionRunId)
        .slice(0, limit);
    },
    appendExecutionOrderStates(entries = []) {
      const items = readOrderStates();
      const created = entries.map((item) => createExecutionOrderStateEntry(item));
      items.unshift(...created);
      writeOrderStates(items);
      return created;
    },
    updateExecutionOrderState(orderStateId, patch = {}) {
      const items = readOrderStates();
      const index = items.findIndex((item) => item.id === orderStateId);
      if (index === -1) return null;
      const current = items[index];
      items[index] = createExecutionOrderStateEntry({
        ...current,
        ...patch,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: patch.updatedAt || new Date().toISOString(),
        metadata: patch.metadata ? { ...current.metadata, ...patch.metadata } : current.metadata,
      });
      writeOrderStates(items);
      return items[index];
    },
  };
}
