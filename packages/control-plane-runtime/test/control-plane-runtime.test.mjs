import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from '../../control-plane-store/test/helpers/memory-store.mjs';
import { createControlPlaneContext } from '../../control-plane-store/src/context.mjs';
import { createControlPlaneRuntime } from '../src/index.mjs';

test('control plane runtime delegates notification and audit operations', () => {
  const runtime = createControlPlaneRuntime(createControlPlaneContext(createMemoryStore()));

  const notification = runtime.appendNotification({
    title: 'Runtime notification',
    message: 'delegated through runtime',
    source: 'runtime-test',
  });
  const audit = runtime.appendAuditRecord({
    type: 'runtime-test',
    actor: 'runtime-test',
    title: 'Runtime audit',
    detail: 'delegated audit append',
  });

  assert.equal(runtime.listNotifications()[0].id, notification.id);
  assert.equal(runtime.listAuditRecords()[0].id, audit.id);
});

test('control plane runtime persists worker heartbeat entries', () => {
  const runtime = createControlPlaneRuntime(createControlPlaneContext(createMemoryStore()));

  const heartbeat = runtime.recordWorkerHeartbeat({
    worker: 'runtime-worker',
    summary: 'runtime heartbeat',
  });

  assert.equal(runtime.getLatestWorkerHeartbeat().id, heartbeat.id);
  assert.equal(runtime.listWorkerHeartbeats()[0].worker, 'runtime-worker');
});

test('control plane runtime persists monitoring snapshots and alerts', () => {
  const runtime = createControlPlaneRuntime(createControlPlaneContext(createMemoryStore()));

  const recorded = runtime.recordMonitoringSnapshot({
    status: 'warn',
    generatedAt: '2026-03-14T10:00:00.000Z',
    services: {
      worker: { status: 'warn' },
    },
    alerts: [
      {
        level: 'warn',
        source: 'worker',
        message: 'Worker heartbeat is getting stale.',
      },
    ],
  });

  assert.equal(recorded.snapshot.status, 'warn');
  assert.equal(runtime.listMonitoringSnapshots()[0].id, recorded.snapshot.id);
  assert.equal(runtime.listMonitoringAlerts()[0].snapshotId, recorded.snapshot.id);
});

test('control plane runtime records incidents with audit and notifications', () => {
  const runtime = createControlPlaneRuntime(createControlPlaneContext(createMemoryStore()));

  const incident = runtime.recordIncident({
    id: 'incident-runtime-1',
    title: 'Broker disconnect',
    summary: 'Primary broker disconnected during intraday execution.',
    severity: 'critical',
    source: 'monitoring',
    owner: 'runtime-ops',
    initialNote: 'Escalated from broker health panel.',
  });
  const transitioned = runtime.transitionIncident('incident-runtime-1', {
    status: 'investigating',
    actor: 'runtime-ops',
  });
  const noteResult = runtime.recordIncidentNote('incident-runtime-1', {
    author: 'runtime-ops',
    body: 'Failover broker verified.',
  });
  const seededTask = runtime.listIncidentTasks('incident-runtime-1')[0];
  const transitionedTask = runtime.transitionIncidentTask('incident-runtime-1', seededTask.id, {
    actor: 'runtime-ops',
    status: 'done',
  });

  assert.equal(incident.id, 'incident-runtime-1');
  assert.equal(transitioned.status, 'investigating');
  assert.equal(noteResult.incident.id, 'incident-runtime-1');
  assert.equal(transitionedTask.status, 'done');
  assert.equal(runtime.listIncidents()[0].id, 'incident-runtime-1');
  assert.equal(runtime.listIncidentNotes('incident-runtime-1')[0].body, 'Failover broker verified.');
  assert.equal(runtime.listIncidentTasks('incident-runtime-1').length >= 5, true);
  assert.equal(runtime.listIncidentActivities('incident-runtime-1').some((item) => item.kind === 'opened'), true);
  assert.equal(runtime.listIncidentActivities('incident-runtime-1').some((item) => item.kind === 'note-added'), true);
  assert.equal(runtime.listIncidentActivities('incident-runtime-1').some((item) => item.kind === 'task-updated'), true);
  assert.equal(runtime.listAuditRecords().some((item) => item.type === 'incident.note'), true);
  assert.equal(runtime.listNotificationJobs().some((job) => job.payload.title === 'Incident opened'), true);
});

test('control plane runtime dispatches queued jobs through injected context', () => {
  const runtime = createControlPlaneRuntime(createControlPlaneContext(createMemoryStore()));

  runtime.enqueueNotification({
    title: 'Queued notification',
    message: 'queued through runtime',
    source: 'runtime-test',
  });
  runtime.enqueueRiskScan({
    cycle: 3,
    mode: 'autopilot',
    riskLevel: 'RISK OFF',
    pendingApprovals: 0,
    brokerConnected: true,
    marketConnected: true,
    paperExposure: 64,
    liveExposure: 18,
    routeHint: 'runtime path',
  });

  const notificationResult = runtime.dispatchPendingNotifications({ worker: 'runtime-worker' });
  const riskResult = runtime.dispatchPendingRiskScans({ worker: 'runtime-worker' });

  assert.equal(notificationResult.dispatchedCount, 1);
  assert.equal(riskResult.dispatchedCount, 1);
  assert.equal(runtime.listNotifications()[0].source, 'risk-monitor');
  assert.equal(runtime.listRiskEvents()[0].status, 'risk-off');
});

test('control plane runtime records cycle runs with audit and notifications', () => {
  const runtime = createControlPlaneRuntime(createControlPlaneContext(createMemoryStore()));

  const cycle = runtime.recordCycleRun({
    cycle: 11,
    mode: 'hybrid',
    riskLevel: 'NORMAL',
    decisionSummary: 'runtime cycle',
    pendingApprovals: 2,
    liveIntentCount: 2,
    brokerConnected: false,
    marketConnected: true,
  });

  const audits = runtime.listAuditRecords();
  const jobs = runtime.listNotificationJobs();

  assert.equal(cycle.cycle, 11);
  assert.equal(audits[0].type, 'cycle');
  assert.equal(jobs.length, 2);
  assert.equal(jobs[0].payload.title.includes('degraded'), true);
});

test('control plane runtime records operator actions with audit and notification fanout', () => {
  const runtime = createControlPlaneRuntime(createControlPlaneContext(createMemoryStore()));

  const action = runtime.recordOperatorAction({
    type: 'approve-intent',
    actor: 'runtime-test',
    title: 'Approve intent',
    detail: 'approved from runtime test',
    symbol: 'AAPL',
    level: 'info',
  });

  assert.equal(action.type, 'approve-intent');
  assert.equal(runtime.listOperatorActions()[0].id, action.id);
  assert.equal(runtime.listAuditRecords()[0].actor, 'runtime-test');
  assert.equal(runtime.listNotificationJobs()[0].payload.title, 'Approve intent');
});

test('control plane runtime records execution plans with audit and notification fanout', () => {
  const runtime = createControlPlaneRuntime(createControlPlaneContext(createMemoryStore()));

  const plan = runtime.recordExecutionPlan({
    workflowRunId: 'workflow-strategy-1',
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    mode: 'paper',
    status: 'ready',
    approvalState: 'not_required',
    riskStatus: 'approved',
    summary: 'Execution plan ready for paper execution.',
    capital: 100000,
    orderCount: 2,
    orders: [
      { symbol: 'NVDA', side: 'BUY', qty: 10, weight: 0.5, rationale: 'trend' },
      { symbol: 'MSFT', side: 'BUY', qty: 8, weight: 0.5, rationale: 'confirmation' },
    ],
    metadata: {
      metrics: {
        score: 74,
        expectedReturnPct: 12.6,
      },
      reasons: ['risk approved for paper execution'],
    },
  });

  assert.equal(plan.strategyId, 'ema-cross-us');
  assert.equal(runtime.listExecutionPlans()[0].id, plan.id);
  assert.equal(runtime.listAuditRecords()[0].type, 'execution-plan');
  assert.equal(runtime.listAuditRecords()[0].metadata.executionPlanId, plan.id);
  assert.equal(runtime.listAuditRecords()[0].metadata.capital, 100000);
  assert.equal(runtime.listAuditRecords()[0].metadata.metrics.score, 74);
  assert.equal(runtime.listNotificationJobs()[0].payload.source, 'execution-planner');
});

test('control plane runtime records agent action requests with audit and notification fanout', () => {
  const runtime = createControlPlaneRuntime(createControlPlaneContext(createMemoryStore()));

  const request = runtime.recordAgentActionRequest({
    workflowRunId: 'workflow-agent-1',
    requestType: 'prepare_execution_plan',
    targetId: 'ema-cross-us',
    status: 'pending_review',
    approvalState: 'pending',
    summary: 'Agent requests an execution plan review.',
    rationale: 'Strategy score improved and needs operator review.',
    requestedBy: 'agent',
  });

  assert.equal(request.requestType, 'prepare_execution_plan');
  assert.equal(runtime.listAgentActionRequests()[0].id, request.id);
  assert.equal(runtime.listAuditRecords()[0].type, 'agent-action-request');
  assert.equal(runtime.listNotificationJobs()[0].payload.source, 'agent-control');
  assert.equal(runtime.listAgentActionRequests()[0].riskStatus, 'pending');
});

test('control plane runtime persists workflow runs through start and complete transitions', () => {
  const runtime = createControlPlaneRuntime(createControlPlaneContext(createMemoryStore()));

  const workflow = runtime.startWorkflowRun({
    id: 'workflow-runtime-1',
    workflowId: 'task-orchestrator.cycle-run',
    actor: 'runtime-test',
    trigger: 'api',
    steps: [{ key: 'record-cycle', status: 'completed' }],
    payload: { cycle: 12 },
  });
  const completed = runtime.completeWorkflowRun('workflow-runtime-1', {
    steps: [
      { key: 'record-cycle', status: 'completed' },
      { key: 'resolve-control-plane', status: 'completed' },
    ],
    result: { ok: true },
  });

  assert.equal(workflow.status, 'running');
  assert.equal(runtime.getWorkflowRun('workflow-runtime-1').workflowId, 'task-orchestrator.cycle-run');
  assert.equal(completed.status, 'completed');
  assert.equal(runtime.listWorkflowRuns()[0].result.ok, true);
});

test('control plane runtime persists research task backbone entries', () => {
  const runtime = createControlPlaneRuntime(createControlPlaneContext(createMemoryStore()));

  const created = runtime.upsertResearchTask({
    id: 'research-task-runtime-1',
    taskType: 'backtest-run',
    status: 'queued',
    title: 'Backtest: Runtime Test',
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    workflowRunId: 'workflow-runtime-backtest',
    runId: 'run-runtime-backtest',
    windowLabel: '2024-01-01 -> 2024-12-31',
    requestedBy: 'runtime-test',
    latestCheckpoint: 'queued through runtime',
  });
  const updated = runtime.updateResearchTask('research-task-runtime-1', {
    status: 'running',
    latestCheckpoint: 'runtime worker is executing the backtest',
  });

  assert.equal(created.id, 'research-task-runtime-1');
  assert.equal(runtime.getResearchTask('research-task-runtime-1').status, 'running');
  assert.equal(runtime.findResearchTaskByWorkflowRunId('workflow-runtime-backtest').id, 'research-task-runtime-1');
  assert.equal(runtime.findResearchTaskByRunId('run-runtime-backtest').latestCheckpoint, 'runtime worker is executing the backtest');
  assert.equal(updated.status, 'running');
});

test('control plane runtime schedules retries and supports resume/cancel workflow operations', () => {
  const runtime = createControlPlaneRuntime(createControlPlaneContext(createMemoryStore()));

  runtime.startWorkflowRun({
    id: 'workflow-runtime-retry',
    workflowId: 'task-orchestrator.state-run',
    maxAttempts: 3,
    attempt: 1,
  });

  const retryScheduled = runtime.failWorkflowRun('workflow-runtime-retry', 'temporary failure', {
    nextRunAt: '2026-03-10T10:00:00.000Z',
  });
  const released = runtime.releaseScheduledWorkflowRuns({
    worker: 'runtime-worker',
    now: '2026-03-10T10:01:00.000Z',
  });
  const resumed = runtime.resumeWorkflowRun('workflow-runtime-retry');
  const canceled = runtime.cancelWorkflowRun('workflow-runtime-retry');

  assert.equal(retryScheduled.status, 'retry_scheduled');
  assert.equal(released.releasedCount, 1);
  assert.equal(resumed.status, 'queued');
  assert.equal(canceled.status, 'canceled');
});

test('control plane runtime fans out workflow failure and recovery events and syncs linked execution plans', () => {
  const runtime = createControlPlaneRuntime(createControlPlaneContext(createMemoryStore()));

  runtime.startWorkflowRun({
    id: 'workflow-runtime-strategy',
    workflowId: 'task-orchestrator.strategy-execution',
    actor: 'runtime-test',
    status: 'running',
    attempt: 1,
    maxAttempts: 3,
  });
  runtime.recordExecutionPlan({
    workflowRunId: 'workflow-runtime-strategy',
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    mode: 'live',
    status: 'ready',
    approvalState: 'required',
    riskStatus: 'approved',
    summary: 'Ready before failure',
    capital: 120000,
    orderCount: 2,
    orders: [],
  });

  const retryScheduled = runtime.failWorkflowRun('workflow-runtime-strategy', 'temporary failure', {
    nextRunAt: '2026-03-10T10:00:00.000Z',
  });
  const failedPlan = runtime.findExecutionPlanByWorkflowRunId('workflow-runtime-strategy');
  const resumed = runtime.resumeWorkflowRun('workflow-runtime-strategy');
  const resumedPlan = runtime.findExecutionPlanByWorkflowRunId('workflow-runtime-strategy');
  const canceled = runtime.cancelWorkflowRun('workflow-runtime-strategy');
  const canceledPlan = runtime.findExecutionPlanByWorkflowRunId('workflow-runtime-strategy');

  assert.equal(retryScheduled.status, 'retry_scheduled');
  assert.equal(failedPlan.status, 'blocked');
  assert.equal(resumed.status, 'queued');
  assert.equal(resumedPlan.riskStatus, 'review');
  assert.equal(canceled.status, 'canceled');
  assert.equal(canceledPlan.status, 'blocked');
  assert.equal(runtime.listAuditRecords().some((item) => item.title.includes('Workflow resumed')), true);
  assert.equal(runtime.listNotificationJobs().some((item) => item.payload.source === 'workflow-control'), true);
});
