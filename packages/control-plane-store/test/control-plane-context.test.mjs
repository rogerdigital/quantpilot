import test from 'node:test';
import assert from 'node:assert/strict';
import { createControlPlaneContext } from '../src/context.mjs';
import { createMemoryStore } from './helpers/memory-store.mjs';

test('notification repository dispatches queued notifications', () => {
  const context = createControlPlaneContext(createMemoryStore());
  context.notifications.enqueueNotification({
    id: 'notif-1',
    title: 'Queued notification',
    message: 'pending',
    source: 'test',
  });

  const result = context.notifications.dispatchPendingNotifications({
    worker: 'test-worker',
  });

  assert.equal(result.dispatchedCount, 1);
  assert.equal(context.notifications.listNotifications(5)[0].title, 'Queued notification');
  assert.equal(context.notifications.listNotificationJobs(5)[0].status, 'dispatched');
});

test('risk repository turns a risk-off scan into risk event and notification', () => {
  const context = createControlPlaneContext(createMemoryStore());
  context.risk.enqueueRiskScan({
    id: 'risk-1',
    cycle: 42,
    mode: 'manual',
    riskLevel: 'RISK OFF',
    pendingApprovals: 0,
    brokerConnected: true,
    marketConnected: true,
    paperExposure: 61.2,
    liveExposure: 37.4,
  });

  const result = context.risk.dispatchPendingRiskScans({
    worker: 'risk-worker',
  });

  assert.equal(result.dispatchedCount, 1);
  assert.equal(context.risk.listRiskEvents(5)[0].status, 'risk-off');
  assert.equal(context.notifications.listNotifications(5)[0].source, 'risk-monitor');
});

test('scheduler repository emits once per bucket and then stays steady', () => {
  const context = createControlPlaneContext(createMemoryStore());

  const first = context.scheduler.recordSchedulerTick({
    worker: 'scheduler-worker',
  });
  const second = context.scheduler.recordSchedulerTick({
    worker: 'scheduler-worker',
  });

  assert.equal(first.emitted, true);
  assert.equal(typeof first.phase, 'string');
  assert.equal(second.emitted, false);
  assert.equal(context.scheduler.listSchedulerTicks(5).length, 1);
});

test('audit and cycle repositories remain available through the injected context', () => {
  const context = createControlPlaneContext(createMemoryStore());
  const cycle = context.cycles.appendCycleRecord({
    id: 'cycle-1',
    cycle: 7,
    mode: 'autopilot',
    riskLevel: 'NORMAL',
  });
  const audit = context.audit.appendAuditRecord({
    id: 'audit-1',
    type: 'cycle',
    actor: 'test',
    title: 'Cycle persisted',
  });

  assert.equal(context.cycles.listCycleRecords(5)[0].id, cycle.id);
  assert.equal(context.audit.listAuditRecords(5)[0].id, audit.id);
});

test('user account repository persists profile preferences and broker bindings', () => {
  const context = createControlPlaneContext(createMemoryStore());
  const initial = context.userAccount.getUserAccount();
  const preferences = context.userAccount.updateUserPreferences({
    locale: 'en-US',
    notificationChannels: ['inbox', 'email'],
  });
  const binding = context.userAccount.upsertBrokerBinding({
    id: 'broker-binding-live',
    provider: 'custom-http',
    label: 'Live Broker',
    environment: 'live',
    accountId: 'live-main',
    status: 'connected',
    permissions: ['read', 'trade'],
    isDefault: true,
  });

  assert.equal(initial.profile.id, 'operator-demo');
  assert.equal(preferences.locale, 'en-US');
  assert.equal(binding.isDefault, true);
  assert.equal(binding.health.connected, true);
  assert.equal(binding.health.status, 'healthy');
  assert.equal(context.userAccount.listBrokerBindings()[0].id, 'broker-binding-live');
  assert.equal(context.userAccount.listRoleTemplates().some((item) => item.id === 'operator'), true);
  const accessSummary = context.userAccount.getAccessSummary(['dashboard:read']);
  assert.equal(accessSummary.defaultPermissions.includes('execution:approve'), true);
  assert.equal(accessSummary.sessionRemovedPermissions.includes('execution:approve'), true);
  const brokerSummary = context.userAccount.getBrokerSummary();
  assert.equal(brokerSummary.total >= 1, true);
  assert.equal(brokerSummary.connected >= 1, true);
});

test('execution runtime repository persists runtime events and broker snapshots', () => {
  const context = createControlPlaneContext(createMemoryStore());
  const event = context.executionRuntime.appendExecutionRuntimeEvent({
    cycle: 12,
    mode: 'live',
    brokerAdapter: 'alpaca',
    brokerConnected: true,
    marketConnected: true,
    submittedOrderCount: 2,
    equity: 102400,
  });
  const snapshot = context.executionRuntime.appendBrokerAccountSnapshot({
    cycle: 12,
    provider: 'alpaca',
    connected: true,
    account: { cash: 50000, buyingPower: 80000, equity: 102400 },
    positions: [],
    orders: [],
  });

  assert.equal(context.executionRuntime.listExecutionRuntimeEvents(5)[0].id, event.id);
  assert.equal(context.executionRuntime.listBrokerAccountSnapshots(5)[0].id, snapshot.id);
});

test('incident repository persists incidents, filters them, and stores notes', () => {
  const context = createControlPlaneContext(createMemoryStore());
  const incident = context.incidents.appendIncident({
    id: 'incident-1',
    title: 'Worker lag warning',
    summary: 'Heartbeat lag crossed threshold.',
    severity: 'warn',
    source: 'monitoring',
    owner: 'ops-a',
    status: 'open',
    createdAt: '2026-03-16T08:00:00.000Z',
    updatedAt: '2026-03-16T08:00:00.000Z',
    initialNote: 'Created from monitoring alert.',
  });
  context.incidents.appendIncident({
    id: 'incident-unassigned',
    title: 'Unassigned incident',
    severity: 'info',
    source: 'monitoring',
    status: 'open',
    createdAt: '2026-03-16T09:00:00.000Z',
    updatedAt: '2026-03-16T09:00:00.000Z',
  });

  const updated = context.incidents.updateIncident('incident-1', {
    status: 'investigating',
    owner: 'ops-b',
  });
  const note = context.incidents.appendIncidentNote('incident-1', {
    author: 'ops-b',
    body: 'Worker restarted and backlog is draining.',
    createdAt: '2026-03-16T08:30:00.000Z',
  });
  const task = context.incidents.updateIncidentTask('incident-1', context.incidents.listIncidentTasks('incident-1', 10)[0].id, {
    owner: 'ops-b',
    status: 'done',
  });
  const list = context.incidents.listIncidents(10, {
    severity: 'warn',
    source: 'monitoring',
  });
  const unassigned = context.incidents.listIncidents(10, {
    owner: 'unassigned',
  });

  assert.equal(incident.id, 'incident-1');
  assert.equal(updated.status, 'investigating');
  assert.equal(updated.owner, 'ops-b');
  assert.equal(note.incidentId, 'incident-1');
  assert.equal(task.status, 'done');
  assert.equal(list[0].latestNotePreview, 'Worker restarted and backlog is draining.');
  assert.equal(unassigned[0].id, 'incident-unassigned');
  assert.equal(context.incidents.listIncidentNotes('incident-1', 10).length, 2);
  assert.equal(context.incidents.listIncidentTasks('incident-1', 10).length >= 5, true);
  const activity = context.incidents.listIncidentActivities('incident-1', 10);
  assert.equal(activity.some((item) => item.kind === 'opened'), true);
  assert.equal(activity.some((item) => item.kind === 'status-changed' && item.metadata.to === 'investigating'), true);
  assert.equal(activity.some((item) => item.kind === 'owner-changed' && item.metadata.to === 'ops-b'), true);
  assert.equal(activity.some((item) => item.kind === 'note-added'), true);
  assert.equal(activity.some((item) => item.kind === 'task-updated'), true);
});

test('workflow repository persists and updates workflow runs through the injected context', () => {
  const context = createControlPlaneContext(createMemoryStore());
  const workflow = context.workflows.appendWorkflowRun({
    id: 'workflow-1',
    workflowId: 'task-orchestrator.state-run',
    status: 'running',
    steps: [{ key: 'start', status: 'completed' }],
  });
  const updated = context.workflows.updateWorkflowRun('workflow-1', {
    status: 'completed',
    completedAt: '2026-03-10T09:45:00.000Z',
    steps: [
      { key: 'start', status: 'completed' },
      { key: 'finish', status: 'completed' },
    ],
  });

  assert.equal(context.workflows.listWorkflowRuns(5)[0].id, workflow.id);
  assert.equal(updated.status, 'completed');
  assert.equal(context.workflows.getWorkflowRun('workflow-1').steps.length, 2);
});

test('workflow repository releases due retry-scheduled runs back to queued', () => {
  const context = createControlPlaneContext(createMemoryStore());
  context.workflows.appendWorkflowRun({
    id: 'workflow-retry-1',
    workflowId: 'task-orchestrator.cycle-run',
    status: 'retry_scheduled',
    nextRunAt: '2026-03-10T09:00:00.000Z',
  });

  const result = context.workflows.releaseScheduledWorkflowRuns({
    worker: 'workflow-worker',
    now: '2026-03-10T09:10:00.000Z',
  });

  assert.equal(result.releasedCount, 1);
  assert.equal(context.workflows.getWorkflowRun('workflow-retry-1').status, 'queued');
});

test('workflow repository claims queued runs for execution', () => {
  const context = createControlPlaneContext(createMemoryStore());
  context.workflows.appendWorkflowRun({
    id: 'workflow-queue-1',
    workflowId: 'task-orchestrator.cycle-run',
    status: 'queued',
    nextRunAt: '2026-03-10T09:00:00.000Z',
  });

  const result = context.workflows.claimQueuedWorkflowRuns({
    worker: 'queue-worker',
    now: '2026-03-10T09:01:00.000Z',
  });

  assert.equal(result.claimedCount, 1);
  assert.equal(result.workflows[0].status, 'running');
  assert.equal(context.workflows.getWorkflowRun('workflow-queue-1').attempt, 1);
});

test('research repositories persist strategy catalog, backtest runs, summary, and market provider status', () => {
  const context = createControlPlaneContext(createMemoryStore());
  const strategy = context.strategyCatalog.getStrategy('ema-cross-us');
  const run = context.backtestRuns.appendBacktestRun({
    id: 'backtest-run-test',
    strategyId: strategy.id,
    strategyName: strategy.name,
    workflowRunId: 'workflow-backtest-1',
    status: 'queued',
    windowLabel: '2024-01-01 -> 2024-12-31',
  });
  const updated = context.backtestRuns.updateBacktestRun(run.id, {
    status: 'completed',
    sharpe: 1.21,
    annualizedReturnPct: 14.2,
  });
  const summary = context.researchSummary.updateResearchSummary({
    asOf: '2026-03-11T09:30:00.000Z',
    queuedRuns: 0,
    runningRuns: 0,
    completedRuns: 2,
    failedRuns: 0,
    candidateStrategies: 3,
    promotedStrategies: 1,
    averageSharpe: 1.3,
    averageReturnPct: 16.1,
    reviewQueue: 1,
  });
  const marketStatus = context.marketProviders.updateMarketProviderStatus({
    provider: 'simulated',
    connected: true,
    fallback: false,
    message: 'market provider synced',
    symbolCount: 4,
  });

  assert.equal(strategy.id, 'ema-cross-us');
  assert.equal(context.backtestRuns.findBacktestRunByWorkflowRunId('workflow-backtest-1').id, run.id);
  assert.equal(updated.status, 'completed');
  assert.equal(summary.completedRuns, 2);
  assert.equal(marketStatus.connected, true);
});
