// @ts-nocheck
import { createExecutionCandidateHandoffEntry, trimAndSave } from '../shared.js';

const FILENAME = 'execution-candidate-handoffs.json';

function parseTimestamp(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSince(value) {
  if (!value) return 0;
  return parseTimestamp(value);
}

export function createExecutionCandidateHandoffRepository(store) {
  function readHandoffs() {
    return store.readCollection(FILENAME).map((item) => createExecutionCandidateHandoffEntry(item));
  }

  function writeHandoffs(items) {
    trimAndSave(store, FILENAME, items.map((item) => createExecutionCandidateHandoffEntry(item)), 300);
  }

  return {
    listExecutionCandidateHandoffs(limit = 100, filter = {}) {
      const sinceMs = normalizeSince(filter.since);
      return readHandoffs()
        .filter((item) => !filter.strategyId || item.strategyId === filter.strategyId)
        .filter((item) => !filter.mode || item.mode === filter.mode)
        .filter((item) => !filter.handoffStatus || item.handoffStatus === filter.handoffStatus)
        .filter((item) => !sinceMs || parseTimestamp(item.updatedAt || item.createdAt) >= sinceMs)
        .slice(0, limit);
    },
    getExecutionCandidateHandoff(handoffId) {
      return readHandoffs().find((item) => item.id === handoffId) || null;
    },
    getLatestExecutionCandidateHandoffForStrategy(strategyId) {
      return readHandoffs().find((item) => item.strategyId === strategyId) || null;
    },
    appendExecutionCandidateHandoff(payload = {}) {
      const items = readHandoffs();
      const entry = createExecutionCandidateHandoffEntry(payload);
      items.unshift(entry);
      writeHandoffs(items);
      return entry;
    },
    updateExecutionCandidateHandoff(handoffId, patch = {}) {
      const items = readHandoffs();
      const index = items.findIndex((item) => item.id === handoffId);
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
