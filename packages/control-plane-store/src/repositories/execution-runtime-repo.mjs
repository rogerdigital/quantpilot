import { createBrokerExecutionEventEntry, createExecutionRuntimeEntry, trimAndSave } from '../shared.mjs';

const EVENTS_FILE = 'execution-runtime-events.json';
const SNAPSHOTS_FILE = 'broker-account-snapshots.json';
const BROKER_EVENTS_FILE = 'broker-execution-events.json';

export function createExecutionRuntimeRepository(store) {
  return {
    listExecutionRuntimeEvents(limit = 50) {
      return store.readCollection(EVENTS_FILE).slice(0, limit);
    },
    appendExecutionRuntimeEvent(payload = {}) {
      const events = store.readCollection(EVENTS_FILE);
      const entry = createExecutionRuntimeEntry(payload);
      events.unshift(entry);
      trimAndSave(store, EVENTS_FILE, events, 150);
      return entry;
    },
    listBrokerAccountSnapshots(limit = 50) {
      return store.readCollection(SNAPSHOTS_FILE).slice(0, limit);
    },
    appendBrokerAccountSnapshot(payload = {}) {
      const snapshots = store.readCollection(SNAPSHOTS_FILE);
      const entry = {
        id: payload.id || `broker-account-snapshot-${Date.now()}`,
        cycleId: payload.cycleId || '',
        cycle: Number(payload.cycle || 0),
        executionPlanId: payload.executionPlanId || '',
        executionRunId: payload.executionRunId || '',
        provider: payload.provider || 'simulated',
        connected: Boolean(payload.connected),
        account: payload.account || null,
        positions: Array.isArray(payload.positions) ? payload.positions : [],
        orders: Array.isArray(payload.orders) ? payload.orders : [],
        message: payload.message || '',
        createdAt: payload.createdAt || new Date().toISOString(),
      };
      snapshots.unshift(entry);
      trimAndSave(store, SNAPSHOTS_FILE, snapshots, 120);
      return entry;
    },
    listBrokerExecutionEvents(limit = 50, filter = {}) {
      return store.readCollection(BROKER_EVENTS_FILE)
        .filter((item) => {
          if (filter.executionPlanId && item.executionPlanId !== filter.executionPlanId) return false;
          if (filter.executionRunId && item.executionRunId !== filter.executionRunId) return false;
          if (filter.symbol && item.symbol !== filter.symbol) return false;
          if (filter.eventType && item.eventType !== filter.eventType) return false;
          return true;
        })
        .slice(0, limit);
    },
    appendBrokerExecutionEvent(payload = {}) {
      const events = store.readCollection(BROKER_EVENTS_FILE);
      const entry = createBrokerExecutionEventEntry(payload);
      events.unshift(entry);
      trimAndSave(store, BROKER_EVENTS_FILE, events, 200);
      return entry;
    },
  };
}
