// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { createControlPlaneContext } from '../src/context.js';
import { exportControlPlaneBackup, getControlPlaneIntegrityReport, restoreControlPlaneBackup, runControlPlaneMigrations } from '../src/maintenance.js';
import { createControlPlaneStore, getControlPlanePersistenceStatus, listSupportedControlPlaneAdapters } from '../src/store.js';
import { createMemoryStore } from './helpers/memory-store.js';

test.after(() => {
  rmSync(join(process.cwd(), '.quantpilot-runtime', 'cp-store-test-file-adapter'), { recursive: true, force: true });
  rmSync(join(process.cwd(), '.quantpilot-runtime-db', 'cp-store-test-db-adapter'), { recursive: true, force: true });
});

test('control plane store exposes supported storage adapters and metadata', () => {
  const fileStore = createControlPlaneStore({
    namespace: 'cp-store-test-file-adapter',
    adapter: 'file',
  });
  const dbStore = createControlPlaneStore({
    namespace: 'cp-store-test-db-adapter',
    adapter: 'db',
  });
  const supported = listSupportedControlPlaneAdapters();

  assert.equal(supported.some((item) => item.kind === 'file'), true);
  assert.equal(supported.some((item) => item.kind === 'db'), true);
  assert.equal(fileStore.adapter.kind, 'file');
  assert.equal(dbStore.adapter.kind, 'db');
  assert.equal(fileStore.adapter.persistence, 'filesystem-json');
  assert.equal(dbStore.adapter.persistence, 'embedded-json-db');
  assert.equal(fileStore.readAdapterManifest().schemaVersion >= 1, true);
  assert.equal(dbStore.readAdapterManifest().schemaVersion >= 1, true);
});

test('control plane context persists repository contracts through the db adapter foundation', () => {
  const namespace = `cp-store-db-contract-${randomUUID()}`;
  const context = createControlPlaneContext(createControlPlaneStore({
    namespace,
    adapter: 'db',
  }));

  try {
    const session = context.agentSessions.appendAgentSession({
      title: 'DB adapter session',
      prompt: 'Prepare a controlled review.',
      requestedBy: 'operator-demo',
      latestIntent: {
        kind: 'request_execution_prep',
        summary: 'Prepare an execution review.',
        targetType: 'strategy',
        targetId: 'ema-cross-us',
        requiresApproval: true,
        requestedMode: 'prepare_action',
      },
    });
    const workflow = context.workflows.appendWorkflowRun({
      workflowId: 'task-orchestrator.agent-action-request',
      status: 'queued',
      payload: {
        requestType: 'prepare_execution_plan',
      },
    });

    assert.equal(context.storageAdapter.kind, 'db');
    assert.equal(context.agentSessions.getAgentSession(session.id).id, session.id);
    assert.equal(context.workflows.getWorkflowRun(workflow.id).id, workflow.id);
  } finally {
    rmSync(join(process.cwd(), '.quantpilot-runtime-db', namespace), { recursive: true, force: true });
  }
});

test('control plane db adapter exposes persistence status and migration contracts', () => {
  const namespace = `cp-store-db-persistence-${randomUUID()}`;
  const store = createControlPlaneStore({
    namespace,
    adapter: 'db',
  });

  try {
    const persistence = getControlPlanePersistenceStatus({
      namespace,
      adapter: 'db',
    });
    const plan = store.getMigrationPlan();
    const result = runControlPlaneMigrations(store);

    assert.equal(persistence.adapter.kind, 'db');
    assert.equal(persistence.manifest.schemaVersion >= 1, true);
    assert.equal(Array.isArray(persistence.manifest.migrations), true);
    assert.equal(plan.upToDate, true);
    assert.equal(Array.isArray(plan.pending), true);
    assert.equal(result.ok, true);
    assert.equal(result.manifest.schemaVersion >= 1, true);
  } finally {
    rmSync(join(process.cwd(), '.quantpilot-runtime-db', namespace), { recursive: true, force: true });
  }
});

test('control plane context exposes agent governance repositories', () => {
  const context = createControlPlaneContext(createMemoryStore());

  assert.equal(typeof context.agentPolicy.list, 'function');
  assert.equal(typeof context.agentPolicy.get, 'function');
  assert.equal(typeof context.agentPolicy.upsert, 'function');
  assert.equal(typeof context.agentInstruction.list, 'function');
  assert.equal(typeof context.agentInstruction.get, 'function');
  assert.equal(typeof context.agentInstruction.upsert, 'function');
  assert.equal(typeof context.agentDailyRun.list, 'function');
  assert.equal(typeof context.agentDailyRun.get, 'function');
  assert.equal(typeof context.agentDailyRun.upsert, 'function');
  assert.equal(typeof context.agentAuthorityEvent.list, 'function');
  assert.equal(typeof context.agentAuthorityEvent.get, 'function');
  assert.equal(typeof context.agentAuthorityEvent.upsert, 'function');

  const policy = context.agentPolicy.upsert({
    id: 'policy-live-enter',
    accountId: 'live-main',
    strategyId: 'trend-following',
    actionType: 'enter',
    environment: 'live',
    authority: 'bounded_auto',
    singleActionMaxNotional: 2500,
    singleActionMaxEquityPct: 0.05,
    strategyExposureMaxPct: 0.2,
    dailyAutoActionLimit: 4,
    dailyLossLimitPct: 1.5,
    maxDrawdownLimitPct: 5,
  });
  const instruction = context.agentInstruction.upsert({
    id: 'instruction-daily-bias',
    sessionId: 'session-1',
    kind: 'daily_bias',
    title: 'Trade lighter today',
    body: 'Prefer fewer new entries and keep stops tight.',
    requestedBy: 'operator-demo',
  });
  const dailyRun = context.agentDailyRun.upsert({
    id: 'daily-run-pre-market',
    kind: 'pre_market',
    status: 'queued',
    trigger: 'schedule',
    accountId: 'live-main',
    strategyId: 'trend-following',
    requestedBy: 'system',
  });
  const authorityEvent = context.agentAuthorityEvent.upsert({
    id: 'authority-event-downgrade',
    severity: 'warn',
    eventType: 'downgraded',
    previousMode: 'full_auto',
    nextMode: 'ask_first',
    reason: 'daily drawdown threshold reached',
    accountId: 'live-main',
    strategyId: 'trend-following',
    actionType: 'enter',
    policyId: policy.id,
  });

  assert.equal(context.agentPolicy.get(policy.id).authority, 'bounded_auto');
  assert.equal(context.agentPolicy.list(10, { accountId: 'live-main' })[0].id, policy.id);
  assert.equal(context.agentInstruction.get(instruction.id).kind, 'daily_bias');
  assert.equal(context.agentInstruction.list(10, { sessionId: 'session-1', activeOnly: true })[0].id, instruction.id);
  assert.equal(context.agentDailyRun.get(dailyRun.id).kind, 'pre_market');
  assert.equal(context.agentDailyRun.list(10, { accountId: 'live-main', kind: 'pre_market' })[0].id, dailyRun.id);
  assert.equal(context.agentAuthorityEvent.get(authorityEvent.id).nextMode, 'ask_first');
  assert.equal(context.agentAuthorityEvent.list(10, { policyId: policy.id })[0].id, authorityEvent.id);
});

test('agent governance repositories keep append semantics immutable and same-day instructions active', () => {
  const context = createControlPlaneContext(createMemoryStore());

  const appendedInstruction = context.agentInstruction.append({
    id: 'instruction-repeatable',
    sessionId: 'session-append',
    kind: 'daily_bias',
    title: 'Stay selective',
    body: 'Reduce opening size for new positions.',
    requestedBy: 'operator-demo',
    createdAt: '2026-04-05T10:15:00.000Z',
  });
  const appendedInstructionAgain = context.agentInstruction.append({
    id: 'instruction-repeatable',
    sessionId: 'session-append',
    kind: 'market_intel',
    title: 'Late update',
    body: 'News flow changed during the day.',
    requestedBy: 'operator-demo',
    createdAt: '2026-04-05T15:45:00.000Z',
  });
  const instructionHistory = context.agentInstruction.list(10, { sessionId: 'session-append' });

  const firstEvent = context.agentAuthorityEvent.append({
    id: 'authority-event-repeatable',
    severity: 'warn',
    eventType: 'downgraded',
    previousMode: 'bounded_auto',
    nextMode: 'ask_first',
    reason: 'Initial downgrade',
    createdAt: '2026-04-05T10:00:00.000Z',
  });
  const secondEvent = context.agentAuthorityEvent.append({
    id: 'authority-event-repeatable',
    severity: 'critical',
    eventType: 'stopped',
    previousMode: 'ask_first',
    nextMode: 'stopped',
    reason: 'Escalated stop',
    createdAt: '2026-04-05T11:00:00.000Z',
  });
  const eventHistory = context.agentAuthorityEvent.list(10);

  assert.equal(instructionHistory.length, 2);
  assert.equal(instructionHistory[0].kind, 'market_intel');
  assert.equal(instructionHistory[1].kind, 'daily_bias');
  assert.equal(context.agentInstruction.get(appendedInstruction.id).body, appendedInstructionAgain.body);
  assert.equal(appendedInstruction.activeUntil.startsWith('2026-04-05T'), true);
  assert.equal(firstEvent.reason, 'Initial downgrade');
  assert.equal(secondEvent.reason, 'Escalated stop');
  assert.equal(eventHistory.length, 2);
  assert.equal(eventHistory[0].eventType, 'stopped');
  assert.equal(eventHistory[1].eventType, 'downgraded');
});

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
  assert.equal(initial.tenant.id, 'tenant-quantpilot-labs');
  assert.equal(initial.currentWorkspace.id, 'workspace-operations');
  assert.equal(initial.workspaces.some((item) => item.id === 'workspace-research'), true);
  assert.equal(preferences.locale, 'en-US');
  assert.equal(binding.isDefault, true);
  assert.equal(binding.health.connected, true);
  assert.equal(binding.health.status, 'healthy');
  assert.equal(context.userAccount.listBrokerBindings()[0].id, 'broker-binding-live');
  assert.equal(context.userAccount.listRoleTemplates().some((item) => item.id === 'operator'), true);
  assert.equal(context.userAccount.listRoleTemplates().some((item) => item.id === 'risk-reviewer'), true);
  const accessSummary = context.userAccount.getAccessSummary(['dashboard:read']);
  assert.equal(accessSummary.defaultPermissions.includes('execution:approve'), true);
  assert.equal(accessSummary.sessionRemovedPermissions.includes('execution:approve'), true);
  const brokerSummary = context.userAccount.getBrokerSummary();
  assert.equal(brokerSummary.total >= 1, true);
  assert.equal(brokerSummary.connected >= 1, true);
});

test('user account repository persists role templates and resolves access policy grants and revokes', () => {
  const context = createControlPlaneContext(createMemoryStore());
  const roleTemplate = context.userAccount.upsertRoleTemplate({
    id: 'quant-analyst',
    label: 'Quant Analyst',
    summary: 'Research-focused role.',
    defaultPermissions: ['dashboard:read', 'strategy:write'],
  });
  const access = context.userAccount.updateUserAccess({
    role: 'quant-analyst',
    grants: ['risk:review'],
    revokes: ['strategy:write'],
  });
  const accessSummary = context.userAccount.getAccessSummary(['dashboard:read', 'risk:review']);

  assert.equal(roleTemplate.id, 'quant-analyst');
  assert.equal(context.userAccount.listRoleTemplates().some((item) => item.id === 'quant-analyst'), true);
  assert.equal(access.permissions.includes('dashboard:read'), true);
  assert.equal(access.permissions.includes('risk:review'), true);
  assert.equal(access.permissions.includes('strategy:write'), false);
  assert.equal(accessSummary.roleLabel, 'Quant Analyst');
  assert.equal(accessSummary.grants.includes('risk:review'), true);
  assert.equal(accessSummary.revokes.includes('strategy:write'), true);
});

test('user account repository persists tenant workspaces and current workspace selection', () => {
  const context = createControlPlaneContext(createMemoryStore());
  const workspace = context.userAccount.upsertWorkspace({
    id: 'workspace-live-ops',
    key: 'live-ops',
    label: 'Live Operations',
    description: 'Workspace for live trading operations.',
    role: 'execution-approver',
    grants: ['risk:review'],
    revokes: ['execution:approve'],
  });
  const currentWorkspace = context.userAccount.setCurrentWorkspace('workspace-live-ops');
  const accessSummary = context.userAccount.getAccessSummary();

  assert.equal(workspace.id, 'workspace-live-ops');
  assert.equal(context.userAccount.getTenant().id, 'tenant-quantpilot-labs');
  assert.equal(context.userAccount.listWorkspaces().some((item) => item.id === 'workspace-live-ops'), true);
  assert.equal(currentWorkspace.id, 'workspace-live-ops');
  assert.equal(context.userAccount.getCurrentWorkspace().role, 'execution-approver');
  assert.equal(currentWorkspace.grants.includes('risk:review'), true);
  assert.equal(currentWorkspace.effectivePermissions.includes('risk:review'), true);
  assert.equal(currentWorkspace.effectivePermissions.includes('execution:approve'), false);
  assert.equal(accessSummary.workspaceRole, 'execution-approver');
  assert.equal(accessSummary.scopedPermissions.includes('risk:review'), true);
  assert.equal(accessSummary.scopedPermissions.includes('execution:approve'), false);
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

test('agent collaboration repositories persist sessions, plans, and analysis runs', () => {
  const context = createControlPlaneContext(createMemoryStore());
  const session = context.agentSessions.appendAgentSession({
    id: 'agent-session-1',
    title: 'Investigate risk posture',
    prompt: 'Summarize the latest risk posture for this strategy.',
    requestedBy: 'operator-demo',
    latestIntent: {
      kind: 'request_risk_explanation',
      summary: 'Review risk posture before an execution decision.',
      targetType: 'strategy',
      targetId: 'ema-cross-us',
      requiresApproval: false,
      requestedMode: 'read_only',
    },
    tags: ['risk', 'strategy'],
  });
  const plan = context.agentPlans.appendAgentPlan({
    id: 'agent-plan-1',
    sessionId: session.id,
    summary: 'Read risk workbench and explain posture.',
    requestedBy: 'operator-demo',
    steps: [
      {
        id: 'step-1',
        kind: 'read',
        title: 'Load risk workbench',
        status: 'pending',
        toolName: 'risk.workbench.get',
      },
    ],
  });
  const run = context.agentAnalysisRuns.appendAgentAnalysisRun({
    id: 'agent-analysis-1',
    sessionId: session.id,
    planId: plan.id,
    status: 'completed',
    summary: 'Risk posture summarized.',
    conclusion: 'Risk posture is elevated because drawdown alert remains active.',
    requestedBy: 'operator-demo',
    toolCalls: [
      {
        tool: 'risk.workbench.get',
        status: 'completed',
        summary: 'Loaded risk workbench.',
      },
    ],
    evidence: [
      {
        id: 'evidence-1',
        kind: 'domain_snapshot',
        title: 'Risk workbench snapshot',
        summary: 'Drawdown alert and scheduler attention are both active.',
        source: 'risk-workbench',
      },
    ],
    explanation: {
      thesis: 'Risk posture is elevated.',
      rationale: ['Drawdown alert remains active.'],
      warnings: ['Do not bypass risk review.'],
      recommendedNextStep: 'Escalate to the risk console before preparing execution.',
    },
  });
  const message = context.agentSessionMessages.appendAgentSessionMessage({
    id: 'agent-message-1',
    sessionId: session.id,
    role: 'assistant',
    kind: 'analysis_result',
    title: 'Risk posture summary',
    body: 'Risk posture is elevated.',
    requestedBy: 'agent',
    metadata: {
      agentAnalysisRunId: run.id,
    },
  });

  const updatedSession = context.agentSessions.updateAgentSession(session.id, {
    latestPlanId: plan.id,
    latestAnalysisRunId: run.id,
    status: 'completed',
  });

  assert.equal(context.agentSessions.listAgentSessions(5)[0].id, session.id);
  assert.equal(context.agentPlans.getLatestAgentPlanForSession(session.id).id, plan.id);
  assert.equal(context.agentAnalysisRuns.getLatestAgentAnalysisRunForSession(session.id).id, run.id);
  assert.equal(context.agentSessionMessages.listAgentSessionMessages(session.id, 5)[0].id, message.id);
  assert.equal(updatedSession.latestAnalysisRunId, run.id);
  assert.equal(updatedSession.status, 'completed');
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

test('research task repository upserts tasks and filters them by workflow and strategy context', () => {
  const context = createControlPlaneContext(createMemoryStore());
  const queued = context.researchTasks.appendResearchTask({
    id: 'research-task-1',
    taskType: 'backtest-run',
    status: 'queued',
    title: 'Backtest: Momentum',
    strategyId: 'strategy-1',
    strategyName: 'Momentum',
    workflowRunId: 'workflow-1',
    runId: 'run-1',
    windowLabel: '2024-01-01 -> 2024-12-31',
    requestedBy: 'researcher',
    latestCheckpoint: 'queued for worker execution',
    createdAt: '2026-03-18T08:00:00.000Z',
    updatedAt: '2026-03-18T08:00:00.000Z',
  });

  const running = context.researchTasks.upsertResearchTask({
    workflowRunId: 'workflow-1',
    status: 'running',
    latestCheckpoint: 'worker picked up the research task',
    updatedAt: '2026-03-18T08:05:00.000Z',
  });
  context.researchTasks.appendResearchTask({
    id: 'research-task-2',
    taskType: 'backtest-run',
    status: 'failed',
    title: 'Backtest: Mean Revert',
    strategyId: 'strategy-2',
    strategyName: 'Mean Revert',
    workflowRunId: 'workflow-2',
    runId: 'run-2',
    windowLabel: '2025-01-01 -> 2025-12-31',
    requestedBy: 'researcher',
    latestCheckpoint: 'backtest worker failed',
    createdAt: '2026-03-17T08:00:00.000Z',
    updatedAt: '2026-03-17T08:05:00.000Z',
  });

  const byWorkflow = context.researchTasks.findResearchTaskByWorkflowRunId('workflow-1');
  const byRun = context.researchTasks.findResearchTaskByRunId('run-1');
  const filtered = context.researchTasks.listResearchTasks(10, {
    strategyId: 'strategy-1',
    status: 'running',
  });

  assert.equal(queued.id, 'research-task-1');
  assert.equal(running.id, 'research-task-1');
  assert.equal(byWorkflow.status, 'running');
  assert.equal(byRun.latestCheckpoint, 'worker picked up the research task');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].strategyName, 'Momentum');
});

test('backtest result repository stores generated and reviewed result versions per run', () => {
  const context = createControlPlaneContext(createMemoryStore());
  const generated = context.backtestResults.appendBacktestResult({
    id: 'backtest-result-1',
    runId: 'run-1',
    workflowRunId: 'workflow-1',
    strategyId: 'strategy-1',
    strategyName: 'Momentum',
    windowLabel: '2024-01-01 -> 2024-12-31',
    status: 'needs_review',
    stage: 'generated',
    version: 1,
    generatedAt: '2026-03-18T08:10:00.000Z',
    annualizedReturnPct: 12.1,
    maxDrawdownPct: 10.8,
    sharpe: 0.98,
    winRatePct: 54.2,
    turnoverPct: 138,
    benchmarkReturnPct: 7.4,
    excessReturnPct: 4.7,
    summary: 'Initial run requires review.',
  });
  const reviewed = context.backtestResults.appendBacktestResult({
    runId: 'run-1',
    workflowRunId: 'workflow-1',
    strategyId: 'strategy-1',
    strategyName: 'Momentum',
    windowLabel: '2024-01-01 -> 2024-12-31',
    status: 'completed',
    stage: 'reviewed',
    generatedAt: '2026-03-18T08:25:00.000Z',
    annualizedReturnPct: 12.1,
    maxDrawdownPct: 10.8,
    sharpe: 0.98,
    winRatePct: 54.2,
    turnoverPct: 138,
    benchmarkReturnPct: 7.4,
    excessReturnPct: 4.7,
    reviewVerdict: 'approved',
    summary: 'Operator approved the result with explanation.',
  });

  const history = context.backtestResults.listBacktestResultsForRun('run-1', 10);

  assert.equal(generated.version, 1);
  assert.equal(reviewed.version, 2);
  assert.equal(context.backtestResults.getLatestBacktestResultForRun('run-1').stage, 'reviewed');
  assert.equal(context.backtestResults.getBacktestResult('backtest-result-1').stage, 'generated');
  assert.equal(history.length, 2);
});

test('research evaluation repository stores verdict history per run and strategy', () => {
  const context = createControlPlaneContext(createMemoryStore());
  const first = context.researchEvaluations.appendResearchEvaluation({
    id: 'research-eval-1',
    runId: 'run-1',
    resultId: 'result-1',
    strategyId: 'strategy-1',
    strategyName: 'Momentum',
    verdict: 'promote',
    scoreBand: 'strong',
    readiness: 'paper',
    recommendedAction: 'promote_to_paper',
    summary: 'Ready for paper promotion.',
    actor: 'research-lead',
    createdAt: '2026-03-18T08:30:00.000Z',
  });
  const second = context.researchEvaluations.appendResearchEvaluation({
    runId: 'run-1',
    resultId: 'result-2',
    strategyId: 'strategy-1',
    strategyName: 'Momentum',
    verdict: 'prepare_execution',
    scoreBand: 'strong',
    readiness: 'live',
    recommendedAction: 'prepare_live_execution',
    summary: 'Ready for live prep.',
    actor: 'research-lead',
    createdAt: '2026-03-18T09:00:00.000Z',
  });

  const history = context.researchEvaluations.listResearchEvaluations(10, { strategyId: 'strategy-1' });

  assert.equal(first.id, 'research-eval-1');
  assert.equal(second.verdict, 'prepare_execution');
  assert.equal(history.length >= 2, true);
  assert.equal(context.researchEvaluations.getLatestEvaluationForRun('run-1').verdict, 'prepare_execution');
  assert.equal(context.researchEvaluations.getLatestEvaluationForStrategy('strategy-1').readiness, 'live');
});

test('research report repository stores generated research assets per run and strategy', () => {
  const context = createControlPlaneContext(createMemoryStore());
  const first = context.researchReports.appendResearchReport({
    id: 'research-report-1',
    evaluationId: 'evaluation-1',
    workflowRunId: 'workflow-report-1',
    runId: 'run-1',
    resultId: 'result-1',
    strategyId: 'strategy-1',
    strategyName: 'Momentum',
    title: 'Momentum memo',
    verdict: 'promote',
    readiness: 'paper',
    executiveSummary: 'Ready for paper promotion.',
    promotionCall: 'Promote to paper.',
    executionPreparation: 'Paper execution is ready.',
    riskNotes: 'Risk metrics remain healthy.',
    createdAt: '2026-03-18T09:30:00.000Z',
  });
  const second = context.researchReports.appendResearchReport({
    evaluationId: 'evaluation-2',
    workflowRunId: 'workflow-report-2',
    runId: 'run-1',
    resultId: 'result-2',
    strategyId: 'strategy-1',
    strategyName: 'Momentum',
    title: 'Momentum live memo',
    verdict: 'prepare_execution',
    readiness: 'live',
    executiveSummary: 'Ready for live preparation.',
    promotionCall: 'Hold paper promotion and prepare live checklist.',
    executionPreparation: 'Live execution checklist can be opened.',
    riskNotes: 'Operator approval remains required.',
    createdAt: '2026-03-18T10:00:00.000Z',
  });

  const history = context.researchReports.listResearchReports(10, { strategyId: 'strategy-1' });

  assert.equal(first.id, 'research-report-1');
  assert.equal(second.verdict, 'prepare_execution');
  assert.equal(history.length >= 2, true);
  assert.equal(context.researchReports.getLatestResearchReportForRun('run-1').verdict, 'prepare_execution');
  assert.equal(context.researchReports.getLatestResearchReportForStrategy('strategy-1').readiness, 'live');
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

test('control plane maintenance exports backups, validates integrity, and restores snapshots', () => {
  const store = createMemoryStore();
  const context = createControlPlaneContext(store);
  context.notifications.appendNotification({
    id: 'maintenance-notification',
    title: 'Operator alert',
    message: 'maintenance smoke test',
    source: 'test',
  });
  context.workflows.appendWorkflowRun({
    id: 'maintenance-workflow',
    workflowId: 'task-orchestrator.state-run',
    status: 'retry_scheduled',
  });

  const backup = exportControlPlaneBackup(store);
  const integrity = getControlPlaneIntegrityReport(store);

  assert.equal(backup.ok, true);
  assert.equal(typeof backup.persistence?.migrationPlan?.upToDate, 'boolean');
  assert.equal(backup.files.some((item) => item.filename === 'notifications.json'), true);
  assert.equal(backup.data['notifications.json'][0].id, 'maintenance-notification');
  assert.equal(integrity.ok, true);
  assert.equal(typeof integrity.persistence?.migrationPlan?.upToDate, 'boolean');
  assert.equal(integrity.summary.retryScheduledWorkflows, 1);
  assert.equal(integrity.status, 'healthy');

  context.notifications.appendNotification({
    id: 'maintenance-notification-new',
    title: 'Temporary mutation',
    message: 'will be overwritten',
    source: 'test',
  });

  const restorePreview = restoreControlPlaneBackup(store, backup, { dryRun: true });
  const restoreApplied = restoreControlPlaneBackup(store, backup);

  assert.equal(restorePreview.ok, true);
  assert.equal(restorePreview.dryRun, true);
  assert.equal(restoreApplied.ok, true);
  assert.equal(restoreApplied.dryRun, false);
  assert.equal(context.notifications.listNotifications(5)[0].id, 'maintenance-notification');
});
