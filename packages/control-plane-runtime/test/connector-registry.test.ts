// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';
import { ConnectorRegistry } from '../src/connector-registry.js';

function makeConnector(overrides = {}) {
  return {
    id: 'conn-1',
    type: 'market_data',
    name: 'Yahoo Finance',
    provider: 'yahoo',
    version: '1.0.0',
    status: 'active',
    capabilities: [
      { name: 'real_time_quotes', version: '1.0', description: 'Real-time price feeds' },
    ],
    healthCheck: null,
    auth: { method: 'api_key', configured: true },
    rateLimits: { requestsPerMinute: 100, requestsPerDay: 10000, concurrentConnections: 5 },
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

test('register and retrieve connector', () => {
  const registry = new ConnectorRegistry();
  const connector = registry.register(makeConnector());
  assert.equal(connector.id, 'conn-1');
  assert.equal(connector.type, 'market_data');

  const loaded = registry.get('conn-1');
  assert.equal(loaded?.name, 'Yahoo Finance');
});

test('returns null for unknown connector', () => {
  const registry = new ConnectorRegistry();
  assert.equal(registry.get('nonexistent'), null);
});

test('list connectors filtered by type', () => {
  const registry = new ConnectorRegistry();
  registry.register(makeConnector({ id: 'c1', type: 'market_data' }));
  registry.register(makeConnector({ id: 'c2', type: 'broker' }));
  registry.register(makeConnector({ id: 'c3', type: 'news_nlp' }));
  registry.register(makeConnector({ id: 'c4', type: 'market_data' }));

  const marketData = registry.list('market_data');
  assert.equal(marketData.length, 2);
  const all = registry.list();
  assert.equal(all.length, 4);
});

test('list connectors by status', () => {
  const registry = new ConnectorRegistry();
  registry.register(makeConnector({ id: 'c1', status: 'active' }));
  registry.register(makeConnector({ id: 'c2', status: 'inactive' }));
  registry.register(makeConnector({ id: 'c3', status: 'active' }));

  const active = registry.listByStatus('active');
  assert.equal(active.length, 2);
});

test('update connector status', () => {
  const registry = new ConnectorRegistry();
  registry.register(makeConnector());
  const updated = registry.updateStatus('conn-1', 'error');
  assert.equal(updated?.status, 'error');
});

test('update health check', () => {
  const registry = new ConnectorRegistry();
  registry.register(makeConnector());
  const updated = registry.updateHealthCheck('conn-1', {
    status: 'healthy',
    latencyMs: 42,
    lastCheckedAt: new Date().toISOString(),
    message: 'All systems operational',
  });
  assert.equal(updated?.healthCheck?.status, 'healthy');
  assert.equal(updated?.healthCheck?.latencyMs, 42);
});

test('unregister removes connector', () => {
  const registry = new ConnectorRegistry();
  registry.register(makeConnector());
  assert.equal(registry.unregister('conn-1'), true);
  assert.equal(registry.get('conn-1'), null);
  assert.equal(registry.unregister('conn-1'), false);
});

test('record and list events', () => {
  const registry = new ConnectorRegistry();
  registry.recordEvent({
    id: 'ev-1',
    connectorId: 'conn-1',
    eventType: 'connected',
    detail: 'Connection established',
    timestamp: new Date().toISOString(),
    metadata: {},
  });
  registry.recordEvent({
    id: 'ev-2',
    connectorId: 'conn-2',
    eventType: 'error',
    detail: 'Timeout',
    timestamp: new Date().toISOString(),
    metadata: {},
  });

  const allEvents = registry.listEvents();
  assert.equal(allEvents.length, 2);

  const conn1Events = registry.listEvents('conn-1');
  assert.equal(conn1Events.length, 1);
  assert.equal(conn1Events[0].eventType, 'connected');
});

test('health summary aggregates connector states', () => {
  const registry = new ConnectorRegistry();
  registry.register(
    makeConnector({
      id: 'c1',
      healthCheck: { status: 'healthy', latencyMs: 10, lastCheckedAt: '', message: '' },
    })
  );
  registry.register(
    makeConnector({
      id: 'c2',
      healthCheck: { status: 'degraded', latencyMs: 500, lastCheckedAt: '', message: '' },
    })
  );
  registry.register(makeConnector({ id: 'c3', healthCheck: null }));

  const summary = registry.getHealthSummary();
  assert.equal(summary.total, 3);
  assert.equal(summary.healthy, 1);
  assert.equal(summary.degraded, 1);
  assert.equal(summary.unhealthy, 0);
  assert.equal(summary.unchecked, 1);
});

test('all 6 connector types are supported', () => {
  const registry = new ConnectorRegistry();
  const types = [
    'market_data',
    'fundamental_data',
    'news_nlp',
    'broker',
    'model_provider',
    'report_export',
  ];
  types.forEach((type, i) => {
    registry.register(makeConnector({ id: `c-${i}`, type }));
  });
  assert.equal(registry.list().length, 6);
  types.forEach((type) => {
    assert.equal(registry.list(type).length, 1);
  });
});

test('defensive copies prevent external mutation', () => {
  const registry = new ConnectorRegistry();
  const created = registry.register(makeConnector());
  created.name = 'mutated';
  const loaded = registry.get('conn-1');
  assert.equal(loaded?.name, 'Yahoo Finance');
});
