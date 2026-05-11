// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';
import { PlatformEventBus } from '../src/platform-event-bus.js';

test('emit creates event with id and timestamp', () => {
  const bus = new PlatformEventBus();
  const event = bus.emit({
    type: 'dataset_ingested',
    severity: 'info',
    source: 'data-pipeline',
    payload: { datasetId: 'sp500' },
  });
  assert.ok(event.id);
  assert.ok(event.timestamp);
  assert.equal(event.type, 'dataset_ingested');
  assert.equal(event.severity, 'info');
  assert.equal(event.source, 'data-pipeline');
  assert.deepEqual(event.payload, { datasetId: 'sp500' });
});

test('emit supports correlationId and namespace', () => {
  const bus = new PlatformEventBus();
  const event = bus.emit({
    type: 'backtest_completed',
    severity: 'info',
    source: 'backtest-engine',
    payload: {},
    correlationId: 'corr-123',
    namespace: 'ns-alpha',
  });
  assert.equal(event.correlationId, 'corr-123');
  assert.equal(event.namespace, 'ns-alpha');
});

test('subscribe receives matching events', () => {
  const bus = new PlatformEventBus();
  const received: string[] = [];
  bus.subscribe({ type: 'risk_breach_detected' }, (e) => received.push(e.id));

  bus.emit({ type: 'dataset_ingested', severity: 'info', source: 's', payload: {} });
  bus.emit({ type: 'risk_breach_detected', severity: 'critical', source: 'risk', payload: {} });
  bus.emit({ type: 'risk_breach_detected', severity: 'warning', source: 'risk', payload: {} });

  assert.equal(received.length, 2);
});

test('subscribe filters by severity', () => {
  const bus = new PlatformEventBus();
  const received: string[] = [];
  bus.subscribe({ severity: 'critical' }, (e) => received.push(e.id));

  bus.emit({ type: 'risk_breach_detected', severity: 'critical', source: 'risk', payload: {} });
  bus.emit({ type: 'kill_switch_triggered', severity: 'critical', source: 'risk', payload: {} });
  bus.emit({ type: 'dataset_ingested', severity: 'info', source: 'data', payload: {} });

  assert.equal(received.length, 2);
});

test('unsubscribe stops delivery', () => {
  const bus = new PlatformEventBus();
  const received: string[] = [];
  const subId = bus.subscribe({}, (e) => received.push(e.id));

  bus.emit({ type: 'dataset_ingested', severity: 'info', source: 's', payload: {} });
  assert.equal(received.length, 1);

  bus.unsubscribe(subId);
  bus.emit({ type: 'dataset_ingested', severity: 'info', source: 's', payload: {} });
  assert.equal(received.length, 1);
});

test('query filters events', () => {
  const bus = new PlatformEventBus();
  bus.emit({ type: 'dataset_ingested', severity: 'info', source: 'data', payload: {} });
  bus.emit({ type: 'risk_breach_detected', severity: 'critical', source: 'risk', payload: {} });
  bus.emit({ type: 'dataset_ingested', severity: 'info', source: 'data', payload: {} });

  const results = bus.query({ type: 'dataset_ingested' });
  assert.equal(results.length, 2);
});

test('query filters by namespace', () => {
  const bus = new PlatformEventBus();
  bus.emit({
    type: 'experiment_started',
    severity: 'info',
    source: 's',
    payload: {},
    namespace: 'team-a',
  });
  bus.emit({
    type: 'experiment_started',
    severity: 'info',
    source: 's',
    payload: {},
    namespace: 'team-b',
  });

  const results = bus.query({ namespace: 'team-a' });
  assert.equal(results.length, 1);
});

test('recent returns last N events', () => {
  const bus = new PlatformEventBus();
  for (let i = 0; i < 10; i++) {
    bus.emit({ type: 'order_lifecycle_changed', severity: 'info', source: 'exec', payload: { i } });
  }
  const last3 = bus.recent(3);
  assert.equal(last3.length, 3);
  assert.deepEqual(last3[0].payload, { i: 7 });
  assert.deepEqual(last3[2].payload, { i: 9 });
});

test('countByType aggregates correctly', () => {
  const bus = new PlatformEventBus();
  bus.emit({ type: 'dataset_ingested', severity: 'info', source: 's', payload: {} });
  bus.emit({ type: 'dataset_ingested', severity: 'info', source: 's', payload: {} });
  bus.emit({ type: 'risk_breach_detected', severity: 'critical', source: 's', payload: {} });

  const counts = bus.countByType();
  assert.equal(counts['dataset_ingested'], 2);
  assert.equal(counts['risk_breach_detected'], 1);
});

test('countBySeverity aggregates correctly', () => {
  const bus = new PlatformEventBus();
  bus.emit({ type: 'dataset_ingested', severity: 'info', source: 's', payload: {} });
  bus.emit({ type: 'risk_breach_detected', severity: 'critical', source: 's', payload: {} });
  bus.emit({ type: 'kill_switch_triggered', severity: 'critical', source: 's', payload: {} });

  const counts = bus.countBySeverity();
  assert.equal(counts['info'], 1);
  assert.equal(counts['critical'], 2);
});

test('clear removes all events', () => {
  const bus = new PlatformEventBus();
  bus.emit({ type: 'dataset_ingested', severity: 'info', source: 's', payload: {} });
  bus.emit({ type: 'dataset_ingested', severity: 'info', source: 's', payload: {} });
  assert.equal(bus.recent(100).length, 2);

  bus.clear();
  assert.equal(bus.recent(100).length, 0);
});

test('all 13 event types are emittable', () => {
  const bus = new PlatformEventBus();
  const types = [
    'dataset_ingested',
    'data_quality_failed',
    'experiment_started',
    'experiment_completed',
    'backtest_completed',
    'promotion_submitted',
    'promotion_approved',
    'promotion_rejected',
    'risk_breach_detected',
    'execution_plan_submitted',
    'order_lifecycle_changed',
    'agent_review_produced',
    'kill_switch_triggered',
  ];
  for (const type of types) {
    bus.emit({ type, severity: 'info', source: 'test', payload: {} });
  }
  const counts = bus.countByType();
  assert.equal(Object.keys(counts).length, 13);
});

test('payload is deeply cloned on emit', () => {
  const bus = new PlatformEventBus();
  const payload = { nested: { value: 1 } };
  const event = bus.emit({ type: 'dataset_ingested', severity: 'info', source: 's', payload });
  payload.nested.value = 999;
  assert.equal(event.payload.nested.value, 1);
});
