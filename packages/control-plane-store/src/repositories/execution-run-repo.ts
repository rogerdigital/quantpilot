import { createExecutionOrderStateEntry, createExecutionRunEntry, trimAndSave } from '../shared.js';

const RUNS_FILE = 'execution-runs.json';
const ORDERS_FILE = 'execution-order-states.json';

export function createExecutionRunRepository(store: any) {
  function readRuns() {
    return store.readCollection(RUNS_FILE).map((item: any) => createExecutionRunEntry(item));
  }

  function writeRuns(items: any) {
    trimAndSave(
      store,
      RUNS_FILE,
      items.map((item: any) => createExecutionRunEntry(item)),
      180
    );
  }

  function readOrderStates() {
    return store
      .readCollection(ORDERS_FILE)
      .map((item: any) => createExecutionOrderStateEntry(item));
  }

  function writeOrderStates(items: any) {
    trimAndSave(
      store,
      ORDERS_FILE,
      items.map((item: any) => createExecutionOrderStateEntry(item)),
      600
    );
  }

  return {
    listExecutionRuns(limit = 50, filter: any = {}) {
      return readRuns()
        .filter(
          (item: any) => !filter.executionPlanId || item.executionPlanId === filter.executionPlanId
        )
        .filter((item: any) => !filter.strategyId || item.strategyId === filter.strategyId)
        .filter(
          (item: any) => !filter.lifecycleStatus || item.lifecycleStatus === filter.lifecycleStatus
        )
        .slice(0, limit);
    },
    getExecutionRun(runId: any) {
      return readRuns().find((item: any) => item.id === runId) || null;
    },
    getExecutionRunByPlanId(executionPlanId: any) {
      return readRuns().find((item: any) => item.executionPlanId === executionPlanId) || null;
    },
    appendExecutionRun(payload: any = {}) {
      const items = readRuns();
      const entry = createExecutionRunEntry(payload);
      items.unshift(entry);
      writeRuns(items);
      return entry;
    },
    updateExecutionRun(runId: any, patch: any = {}) {
      const items = readRuns();
      const index = items.findIndex((item: any) => item.id === runId);
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
    listExecutionOrderStates(limit = 200, filter: any = {}) {
      return readOrderStates()
        .filter(
          (item: any) => !filter.executionPlanId || item.executionPlanId === filter.executionPlanId
        )
        .filter(
          (item: any) => !filter.executionRunId || item.executionRunId === filter.executionRunId
        )
        .slice(0, limit);
    },
    appendExecutionOrderStates(entries = []) {
      const items = readOrderStates();
      const created = entries.map((item) => createExecutionOrderStateEntry(item));
      items.unshift(...created);
      writeOrderStates(items);
      return created;
    },
    updateExecutionOrderState(orderStateId: any, patch: any = {}) {
      const items = readOrderStates();
      const index = items.findIndex((item: any) => item.id === orderStateId);
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
