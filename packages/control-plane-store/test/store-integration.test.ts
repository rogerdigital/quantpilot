import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { createControlPlaneContext } from '../src/context.js';
import { createControlPlaneStore } from '../src/store.js';

const namespace = `store-integration-${randomUUID()}`;
const store = createControlPlaneStore({ namespace });
const ctx = createControlPlaneContext(store);

test.after(() => {
  rmSync(join(process.cwd(), '.quantpilot-runtime', namespace), { recursive: true, force: true });
});

test('strategy catalog: write and read round-trip', () => {
  const id = `strat-${randomUUID()}`;
  const saved = ctx.strategyCatalog.upsertStrategy({
    id,
    name: 'Integration Test Strategy',
    family: 'momentum',
    timeframe: 'daily',
    universe: ['AAPL', 'MSFT'],
    status: 'draft',
    score: 75,
  });
  assert.equal(saved.id, id);
  assert.equal(saved.name, 'Integration Test Strategy');

  const item = ctx.strategyCatalog.getStrategy(id);
  assert.ok(item);
  assert.equal(item.id, id);
  assert.deepEqual(item.universe, ['AAPL', 'MSFT']);

  const all = ctx.strategyCatalog.listStrategies(100);
  assert.ok(all.some((s: any) => s.id === id));
});

test('backtest run: write and query', () => {
  const strategyId = `strat-bt-${randomUUID()}`;
  ctx.strategyCatalog.upsertStrategy({
    id: strategyId,
    name: 'BT Strategy',
    family: 'value',
    timeframe: 'daily',
    universe: [],
    status: 'candidate',
  });

  const runId = `run-${randomUUID()}`;
  const run = ctx.backtestRuns.appendBacktestRun({
    id: runId,
    workflowRunId: '',
    strategyId,
    strategyName: 'BT Strategy',
    status: 'queued',
    windowLabel: '2025-H1',
  });
  assert.equal(run.id, runId);
  assert.equal(run.strategyId, strategyId);

  const retrieved = ctx.backtestRuns.getBacktestRun(runId);
  assert.ok(retrieved);
  assert.equal(retrieved.status, 'queued');

  const byStrategy = ctx.backtestRuns.listBacktestRuns(100, { strategyId });
  assert.ok(byStrategy.some((r: any) => r.id === runId));
});

test('execution plan: write, update, and query', () => {
  const planId = `plan-${randomUUID()}`;
  const plan = ctx.executionPlans.appendExecutionPlan({
    id: planId,
    strategyId: 'strat-exec',
    mode: 'paper',
    status: 'pending_approval',
    capital: 50000,
    orders: [],
  });
  assert.equal(plan.id, planId);
  assert.equal(plan.status, 'pending_approval');

  ctx.executionPlans.updateExecutionPlan(planId, {
    status: 'approved',
  });

  const retrieved = ctx.executionPlans.getExecutionPlan(planId);
  assert.ok(retrieved);
  assert.equal(retrieved.status, 'approved');
});

test('notifications: append and list', () => {
  const notification = ctx.notifications.appendNotification({
    id: `notif-${randomUUID()}`,
    title: 'Test notification',
    message: 'Store integration test',
    source: 'test',
    level: 'info',
    createdAt: new Date().toISOString(),
  });
  assert.ok(notification);

  const listed = ctx.notifications.listNotifications(100);
  assert.ok(listed.length >= 1);
});

test('audit: append and query', () => {
  const record = ctx.audit.appendAuditRecord({
    id: `audit-${randomUUID()}`,
    type: 'store-integration',
    summary: 'Integration test audit',
    actor: 'test-runner',
    createdAt: new Date().toISOString(),
  });
  assert.ok(record);

  const listed = ctx.audit.listAuditRecords(100);
  assert.ok(listed.length >= 1);
  assert.ok(listed.some((r: any) => r.type === 'store-integration'));
});

test('scheduler: record tick and query', () => {
  const tick = ctx.scheduler.recordSchedulerTick({
    id: `tick-${randomUUID()}`,
    phase: 'INTRADAY',
    status: 'healthy',
    title: 'Integration tick',
    message: 'Store integration test tick',
    worker: 'test-worker',
    createdAt: new Date().toISOString(),
  });
  assert.ok(tick);

  const ticks = ctx.scheduler.listSchedulerTicks(100);
  assert.ok(ticks.length >= 1);
});

test('incidents: create, update, and list', () => {
  const id = `inc-${randomUUID()}`;
  ctx.incidents.appendIncident({
    id,
    title: 'Test incident',
    summary: 'Store integration',
    severity: 'warn',
    source: 'test',
    status: 'investigating',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const listed = ctx.incidents.listIncidents(100);
  assert.ok(listed.some((i: any) => i.id === id));

  ctx.incidents.appendIncidentNote(id, {
    author: 'test',
    body: 'Investigation note',
    createdAt: new Date().toISOString(),
  });

  const detail = ctx.incidents.getIncident(id);
  assert.ok(detail);
  assert.ok(detail.noteCount >= 1);
});
