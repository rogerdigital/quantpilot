import { createExecutionCandidateHandoffEntry, trimAndSave } from '../shared.js';

const FILENAME = 'execution-candidate-handoffs.json';

function parseTimestamp(value: any) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSince(value: any) {
  if (!value) return 0;
  return parseTimestamp(value);
}

export function createExecutionCandidateHandoffRepository(store: any) {
  function readHandoffs() {
    return store
      .readCollection(FILENAME)
      .map((item: any) => createExecutionCandidateHandoffEntry(item));
  }

  function writeHandoffs(items: any) {
    trimAndSave(
      store,
      FILENAME,
      items.map((item: any) => createExecutionCandidateHandoffEntry(item)),
      300
    );
  }

  return {
    listExecutionCandidateHandoffs(limit = 100, filter: any = {}) {
      const sinceMs = normalizeSince(filter.since);
      return readHandoffs()
        .filter((item: any) => !filter.strategyId || item.strategyId === filter.strategyId)
        .filter((item: any) => !filter.mode || item.mode === filter.mode)
        .filter((item: any) => !filter.handoffStatus || item.handoffStatus === filter.handoffStatus)
        .filter(
          (item: any) => !sinceMs || parseTimestamp(item.updatedAt || item.createdAt) >= sinceMs
        )
        .slice(0, limit);
    },
    getExecutionCandidateHandoff(handoffId: any) {
      return readHandoffs().find((item: any) => item.id === handoffId) || null;
    },
    getLatestExecutionCandidateHandoffForStrategy(strategyId: any) {
      return readHandoffs().find((item: any) => item.strategyId === strategyId) || null;
    },
    appendExecutionCandidateHandoff(payload: any = {}) {
      const items = readHandoffs();
      const entry = createExecutionCandidateHandoffEntry(payload);
      items.unshift(entry);
      writeHandoffs(items);
      return entry;
    },
    updateExecutionCandidateHandoff(handoffId: any, patch: any = {}) {
      const items = readHandoffs();
      const index = items.findIndex((item: any) => item.id === handoffId);
      if (index === -1) return null;
      const current = items[index];
      items[index] = createExecutionCandidateHandoffEntry({
        ...current,
        ...patch,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: patch.updatedAt || new Date().toISOString(),
        metadata: patch.metadata ? { ...current.metadata, ...patch.metadata } : current.metadata,
      });
      writeHandoffs(items);
      return items[index];
    },
  };
}
