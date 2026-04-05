import { createAgentInstructionEntry, matchesScopeFilter, trimAndSave } from '../shared.mjs';

const FILENAME = 'agent-instructions.json';

function isInstructionActive(item, activeAt = new Date().toISOString()) {
  if (!item.activeUntil) return true;
  const activeUntilMs = Date.parse(item.activeUntil);
  const activeAtMs = Date.parse(activeAt);
  if (!Number.isFinite(activeUntilMs) || !Number.isFinite(activeAtMs)) return true;
  return activeUntilMs >= activeAtMs;
}

function matchesInstructionFilter(item, filter = {}) {
  if (!matchesScopeFilter(item, filter)) return false;
  if (filter.sessionId && item.sessionId !== filter.sessionId) return false;
  if (filter.kind && item.kind !== filter.kind) return false;
  if (filter.requestedBy && item.requestedBy !== filter.requestedBy) return false;
  if (filter.activeOnly && !isInstructionActive(item, filter.activeAt)) return false;
  if (filter.activeAt && !isInstructionActive(item, filter.activeAt)) return false;
  if (filter.since) {
    const sinceMs = Date.parse(filter.since);
    const createdAtMs = Date.parse(item.createdAt || '');
    if (Number.isFinite(sinceMs) && (!Number.isFinite(createdAtMs) || createdAtMs < sinceMs)) {
      return false;
    }
  }
  return true;
}

function persistInstruction(store, payload = {}) {
  const records = store.readCollection(FILENAME);
  const currentIndex = payload.id ? records.findIndex((item) => item.id === payload.id) : -1;
  const current = currentIndex >= 0 ? records[currentIndex] : null;
  const entry = current
    ? createAgentInstructionEntry({
      ...current,
      ...payload,
      id: current.id,
      createdAt: current.createdAt,
    })
    : createAgentInstructionEntry(payload);

  if (currentIndex >= 0) {
    records[currentIndex] = entry;
  } else {
    records.unshift(entry);
  }

  trimAndSave(store, FILENAME, records, 240);
  return entry;
}

function appendInstruction(store, payload = {}) {
  const records = store.readCollection(FILENAME);
  const entry = createAgentInstructionEntry(payload);
  records.unshift(entry);
  trimAndSave(store, FILENAME, records, 240);
  return entry;
}

export function createAgentInstructionRepository(store) {
  return {
    list(limit = 50, filter = {}) {
      return store.readCollection(FILENAME)
        .filter((item) => matchesInstructionFilter(item, filter))
        .slice(0, limit);
    },
    get(instructionId) {
      return store.readCollection(FILENAME).find((item) => item.id === instructionId) || null;
    },
    upsert(payload = {}) {
      return persistInstruction(store, payload);
    },
    append(payload = {}) {
      return appendInstruction(store, payload);
    },
    update(instructionId, patch = {}) {
      const current = store.readCollection(FILENAME).find((item) => item.id === instructionId);
      if (!current) return null;
      return persistInstruction(store, {
        ...current,
        ...patch,
        id: current.id,
        createdAt: current.createdAt,
      });
    },
    listAgentInstructions(limit = 50, filter = {}) {
      return this.list(limit, filter);
    },
    getAgentInstruction(instructionId) {
      return this.get(instructionId);
    },
    upsertAgentInstruction(payload = {}) {
      return this.upsert(payload);
    },
    appendAgentInstruction(payload = {}) {
      return this.append(payload);
    },
    updateAgentInstruction(instructionId, patch = {}) {
      return this.update(instructionId, patch);
    },
  };
}
