// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { invokeGatewayRoute } from '../../api/test/helpers/invoke-gateway.js';
import { createTradingState } from '../../api/test/helpers/create-trading-state.js';

const namespace = `worker-workflow-e2e-${randomUUID()}`;
process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE = namespace;

const [
  { createGatewayHandler },
  { runWorkflowExecutionTask },
  { runRiskScanTask },
  { runWorkflowMaintenanceTask },
  { executeQueuedWorkflow },
  { createControlPlaneContext },
  { createControlPlaneStore },
  { createControlPlaneRuntime },
  { refreshBacktestSummary },
  { approveAgentActionRequest },
  { recordExecutionPlan },
  { assessAgentActionRequestRisk, assessExecutionCandidate },
  { buildStrategyExecutionCandidate },
] = await Promise.all([
  import('../../api/src/gateways/alpaca.js'),
  import('../src/tasks/workflow-execution-task.js'),
  import('../src/tasks/risk-scan-task.js'),
  import('../src/tasks/workflow-maintenance-task.js'),
  import('../../../packages/task-workflow-engine/src/index.js'),
  import('../../../packages/control-plane-store/src/context.js'),
  import('../../../packages/control-plane-store/src/store.js'),
  import('../../../packages/control-plane-runtime/src/index.js'),
  import('../../api/src/domains/backtest/services/summary-service.js'),
  import('../../api/src/modules/agent/service.js'),
  import('../../api/src/modules/execution/service.js'),
  import('../../api/src/modules/risk/service.js'),
  import('../../api/src/modules/strategy/service.js'),
]);

const workerConfig = {
  name: 'worker-e2e-test',
  workflowBatchSize: 10,
  riskScanBatchSize: 10,
};

// Keep workflow claim/release clocks far in the future so these tests never
// become date-sensitive as real time advances.
const CLAIM_NOW = '2099-01-01T00:00:00.000Z';
const RELEASE_NOW = '2099-01-01T00:01:00.000Z';

const fakeBrokerHealth = {
  adapter: 'simulated',
  connected: true,
  customBrokerConfigured: false,
  alpacaConfigured: false,
};

const fakeBrokerExecution = {
  connected: true,
  message: 'worker e2e broker execution ok',
  submittedOrders: [],
  rejectedOrders: [],
  snapshot: {
    connected: true,
    message: 'worker e2e broker snapshot ok',
    account: null,
    positions: [],
    orders: [],
  },
};

const fakeMarketSnapshot = {
  label: 'Worker E2E Market',
  connected: true,
  message: 'worker e2e market snapshot ok',
  fallback: false,
  quotes: [],
};

const context = createControlPlaneContext(createControlPlaneStore({ namespace }));
const runtime = createControlPlaneRuntime(context);
const handler = createGatewayHandler({
  getBrokerHealth: async () => fakeBrokerHealth,
  executeBrokerCycle: async () => fakeBrokerExecution,
  getMarketSnapshot: async () => fakeMarketSnapshot,
});

function createWorkerContext() {
  return {
    ...runtime,
    getOperatorName: () => 'Workflow Worker E2E',
    getBrokerHealth: async () => fakeBrokerHealth,
    executeBrokerCycle: async () => fakeBrokerExecution,
    getMarketSnapshot: async () => fakeMarketSnapshot,
    assessAgentActionRequestRisk,
    recordAgentActionRequest: (payload) => runtime.recordAgentActionRequest(payload),
    buildStrategyExecutionCandidate,
    assessExecutionCandidate,
    refreshBacktestSummary,
    recordExecutionPlan,
    queueRiskScan: (payload) => runtime.enqueueRiskScan(payload),
  };
}

test.after(() => {
  rmSync(join(process.cwd(), '.quantpilot-runtime', namespace), { recursive: true, force: true });
  delete process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE;
});

test('queued state workflow executes end-to-end through worker and persists downstream risk scan results', async () => {
  const queued = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/state/queue',
    body: {
      state: createTradingState(),
    },
  });

  assert.equal(queued.statusCode, 200);
  assert.equal(queued.json.workflow.workflowId, 'task-orchestrator.state-run');
  assert.equal(queued.json.workflow.status, 'queued');

  const execution = await runWorkflowExecutionTask(workerConfig, {
    claimQueuedWorkflows: (options) => runtime.claimQueuedWorkflowRuns({
      ...options,
      now: CLAIM_NOW,
    }),
    executeWorkflow: executeQueuedWorkflow,
    context: createWorkerContext(),
  });

  assert.equal(execution.kind, 'workflow-execution');
  assert.equal(execution.claimedCount, 1);
  assert.equal(execution.executions[0].ok, true);

  const workflows = context.workflows.listWorkflowRuns();
  const stateWorkflow = workflows.find((item) => item.id === queued.json.workflow.id);
  const cycleWorkflow = workflows.find((item) => item.workflowId === 'task-orchestrator.cycle-run');

  assert.equal(stateWorkflow.status, 'completed');
  assert.equal(cycleWorkflow.status, 'completed');
  assert.equal(context.cycles.listCycleRecords().length, 1);
  assert.equal(context.risk.listRiskScanJobs().length, 1);

  const riskDispatch = await runRiskScanTask(workerConfig, {
    flushQueuedRiskScans: (options) => runtime.dispatchPendingRiskScans(options),
  });

  assert.equal(riskDispatch.kind, 'risk-scan');
  assert.equal(riskDispatch.dispatchedCount, 1);
  assert.equal(context.risk.listRiskEvents().length, 1);
  assert.equal(context.risk.listRiskEvents()[0].status, 'healthy');
});

test('queued strategy execution workflow persists execution plan and downstream risk event', async () => {
  const queued = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/strategy/execute',
    body: {
      strategyId: 'multi-factor-rotation',
      mode: 'live',
      capital: 250000,
      requestedBy: 'worker-e2e-test',
    },
  });

  assert.equal(queued.statusCode, 200);
  assert.equal(queued.json.workflow.workflowId, 'task-orchestrator.strategy-execution');
  assert.equal(queued.json.workflow.status, 'queued');

  const execution = await runWorkflowExecutionTask(workerConfig, {
    claimQueuedWorkflows: (options) => runtime.claimQueuedWorkflowRuns({
      ...options,
      now: CLAIM_NOW,
      workflowId: 'task-orchestrator.strategy-execution',
    }),
    executeWorkflow: executeQueuedWorkflow,
    context: createWorkerContext(),
  });

  assert.equal(execution.claimedCount, 1);
  assert.equal(execution.executions[0].ok, true);
  assert.equal(context.executionPlans.listExecutionPlans().length, 1);
  assert.equal(context.executionPlans.listExecutionPlans()[0].strategyId, 'multi-factor-rotation');
  assert.equal(context.executionPlans.listExecutionPlans()[0].riskStatus, 'approved');
  assert.equal(context.risk.listRiskScanJobs().length >= 1, true);

  const riskDispatch = await runRiskScanTask(workerConfig, {
    flushQueuedRiskScans: (options) => runtime.dispatchPendingRiskScans(options),
  });

  assert.equal(riskDispatch.dispatchedCount >= 1, true);
  assert.equal(context.risk.listRiskEvents().some((item) => item.source === 'risk-monitor'), true);
});

test('failed strategy execution workflow is scheduled for retry and re-queued by maintenance task', async () => {
  const queued = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/strategy/execute',
    body: {
      strategyId: 'unknown-strategy',
      mode: 'paper',
      capital: 50000,
      requestedBy: 'worker-e2e-test',
    },
  });

  assert.equal(queued.statusCode, 200);

  const execution = await runWorkflowExecutionTask(workerConfig, {
    claimQueuedWorkflows: (options) => runtime.claimQueuedWorkflowRuns({
      ...options,
      now: CLAIM_NOW,
      workflowId: 'task-orchestrator.strategy-execution',
    }),
    executeWorkflow: executeQueuedWorkflow,
    context: createWorkerContext(),
  });

  assert.equal(execution.claimedCount, 1);
  assert.equal(execution.executions[0].workflow?.status, 'retry_scheduled');
  assert.equal(context.notifications.listNotificationJobs().some((item) => item.payload.source === 'workflow-control'), true);

  const maintenance = await runWorkflowMaintenanceTask(workerConfig, {
    releaseScheduledWorkflows: (options) => runtime.releaseScheduledWorkflowRuns({
      ...options,
      now: RELEASE_NOW,
    }),
  });

  assert.equal(maintenance.releasedCount, 1);
  assert.equal(context.workflows.getWorkflowRun(queued.json.workflow.id).status, 'queued');
});

test('queued agent action request workflow persists a review request without changing execution plans', async () => {
  const executionPlanCountBefore = context.executionPlans.listExecutionPlans().length;
  const queued = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/agent/action-requests',
    body: {
      requestType: 'prepare_execution_plan',
      targetId: 'ema-cross-us',
      summary: 'Agent asks for execution plan review.',
      rationale: 'Signal quality improved.',
      requestedBy: 'agent',
    },
  });

  assert.equal(queued.statusCode, 200);
  assert.equal(queued.json.workflow.workflowId, 'task-orchestrator.agent-action-request');

  const execution = await runWorkflowExecutionTask(workerConfig, {
    claimQueuedWorkflows: (options) => runtime.claimQueuedWorkflowRuns({
      ...options,
      now: CLAIM_NOW,
      workflowId: 'task-orchestrator.agent-action-request',
    }),
    executeWorkflow: executeQueuedWorkflow,
    context: createWorkerContext(),
  });

  assert.equal(execution.claimedCount, 1);
  assert.equal(execution.executions[0].ok, true);
  assert.equal(context.agentActionRequests.listAgentActionRequests().length, 1);
  assert.equal(context.agentActionRequests.listAgentActionRequests()[0].requestType, 'prepare_execution_plan');
  assert.equal(context.executionPlans.listExecutionPlans().length, executionPlanCountBefore);
  assert.equal(context.notifications.listNotificationJobs().some((item) => item.payload.source === 'agent-control'), true);
});

test('research evaluation queues a report workflow and worker execution persists a research report asset', async () => {
  const reviewed = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/backtest/runs/bt-ema-cross-20260310/review',
    body: {
      reviewedBy: 'risk-operator',
      summary: 'Reviewed for downstream report generation.',
    },
  });

  assert.equal(reviewed.statusCode, 200);

  const evaluated = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/backtest/runs/bt-ema-cross-20260310/evaluate',
    body: {
      actor: 'research-lead',
      summary: 'Queue the asynchronous research memo.',
    },
  });

  assert.equal(evaluated.statusCode, 200);
  assert.equal(evaluated.json.reportWorkflow.workflowId, 'task-orchestrator.research-report');

  const execution = await runWorkflowExecutionTask(workerConfig, {
    claimQueuedWorkflows: (options) => runtime.claimQueuedWorkflowRuns({
      ...options,
      now: CLAIM_NOW,
      workflowId: 'task-orchestrator.research-report',
    }),
    executeWorkflow: executeQueuedWorkflow,
    context: createWorkerContext(),
  });

  assert.equal(execution.claimedCount >= 1, true);
  assert.equal(execution.executions[0].ok, true);
  assert.equal(context.researchReports.listResearchReports().some((item) => item.evaluationId === evaluated.json.evaluation.id), true);
  assert.equal(context.researchTasks.listResearchTasks(20, { taskType: 'research-report' }).some((item) => item.status === 'completed'), true);
});

test('blocked agent action request is rejected by risk gate before approval stage', async () => {
  const queued = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/agent/action-requests',
    body: {
      requestType: 'prepare_execution_plan',
      targetId: 'breakout-crypto',
      summary: 'Agent asks for execution plan review.',
      rationale: 'Try higher beta setup.',
      requestedBy: 'agent',
    },
  });

  const execution = await runWorkflowExecutionTask(workerConfig, {
    claimQueuedWorkflows: (options) => runtime.claimQueuedWorkflowRuns({
      ...options,
      now: CLAIM_NOW,
      workflowId: 'task-orchestrator.agent-action-request',
    }),
    executeWorkflow: executeQueuedWorkflow,
    context: createWorkerContext(),
  });

  assert.equal(execution.claimedCount, 1);
  assert.equal(execution.executions[0].ok, true);
  assert.equal(context.agentActionRequests.listAgentActionRequests()[0].status, 'rejected');
  assert.equal(context.agentActionRequests.listAgentActionRequests()[0].riskStatus, 'blocked');
});

test('approved agent action request is the only path that queues downstream strategy execution workflow', async () => {
  const strategyWorkflowCountBefore = context.workflows.listWorkflowRuns()
    .filter((item) => item.workflowId === 'task-orchestrator.strategy-execution').length;
  const queued = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/agent/action-requests',
    body: {
      requestType: 'prepare_execution_plan',
      targetId: 'ema-cross-us',
      summary: 'Agent asks for execution plan review.',
      rationale: 'Trend quality improved.',
      requestedBy: 'agent',
    },
  });

  await runWorkflowExecutionTask(workerConfig, {
    claimQueuedWorkflows: (options) => runtime.claimQueuedWorkflowRuns({
      ...options,
      now: CLAIM_NOW,
      workflowId: 'task-orchestrator.agent-action-request',
    }),
    executeWorkflow: executeQueuedWorkflow,
    context: createWorkerContext(),
  });

  const request = context.agentActionRequests.listAgentActionRequests()
    .find((item) => item.workflowRunId === queued.json.workflow.id);
  assert.equal(request.status, 'pending_review');
  assert.equal(
    context.workflows.listWorkflowRuns().filter((item) => item.workflowId === 'task-orchestrator.strategy-execution').length,
    strategyWorkflowCountBefore
  );

  const approval = approveAgentActionRequest(request.id, {
    approvedBy: 'risk-operator',
    mode: 'paper',
    capital: 150000,
  });

  assert.equal(approval.ok, true);
  assert.equal(approval.request.status, 'approved');
  assert.equal(approval.workflow.workflowId, 'task-orchestrator.strategy-execution');
  assert.equal(
    context.workflows.listWorkflowRuns().filter((item) => item.workflowId === 'task-orchestrator.strategy-execution').length,
    strategyWorkflowCountBefore + 1
  );
});

test('queued backtest workflow persists research run and summary through worker execution', async () => {
  const queued = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/backtest/runs',
    body: {
      strategyId: 'ema-cross-us',
      windowLabel: '2024-01-01 -> 2024-12-31',
      requestedBy: 'worker-e2e-test',
    },
  });

  assert.equal(queued.statusCode, 200);
  assert.equal(queued.json.workflow.workflowId, 'task-orchestrator.backtest-run');
  assert.equal(queued.json.run.status, 'queued');

  const execution = await runWorkflowExecutionTask(workerConfig, {
    claimQueuedWorkflows: (options) => runtime.claimQueuedWorkflowRuns({
      ...options,
      now: CLAIM_NOW,
      workflowId: 'task-orchestrator.backtest-run',
    }),
    executeWorkflow: executeQueuedWorkflow,
    context: createWorkerContext(),
  });

  assert.equal(execution.claimedCount, 1);
  assert.equal(execution.executions[0].ok, true);
  assert.equal(context.backtestRuns.findBacktestRunByWorkflowRunId(queued.json.workflow.id).status !== 'queued', true);
  assert.equal(context.backtestResults.getLatestBacktestResultForRun(queued.json.run.id) !== null, true);
  assert.equal(context.researchSummary.getResearchSummary().completedRuns >= 1, true);
});

test('queued agent daily run workflow records a completed pre-market run', async () => {
  const { run, workflow } = runtime.queueAgentDailyRun({
    kind: 'pre_market',
    trigger: 'schedule',
    accountId: 'paper-main',
    strategyId: 'trend',
    requestedBy: 'system',
  });

  assert.equal(run.status, 'queued');
  assert.equal(workflow.status, 'queued');

  const execution = await runWorkflowExecutionTask(workerConfig, {
    claimQueuedWorkflows: (options) => runtime.claimQueuedWorkflowRuns({
      ...options,
      now: CLAIM_NOW,
      workflowId: 'task-orchestrator.agent-daily-run',
    }),
    executeWorkflow: executeQueuedWorkflow,
    context: createWorkerContext(),
  });

  assert.equal(execution.claimedCount, 1);
  assert.equal(execution.executions[0].ok, true);

  const updated = runtime.getAgentDailyRun(run.id);
  assert.equal(updated.status, 'completed');
});

test('pre_market workflow writes brief content to run metadata', async () => {
  const { run, workflow } = runtime.queueAgentDailyRun({
    kind: 'pre_market',
    trigger: 'schedule',
    accountId: 'paper-main',
    strategyId: 'trend',
    requestedBy: 'system',
  });

  assert.equal(run.status, 'queued');
  assert.equal(workflow.status, 'queued');

  await runWorkflowExecutionTask(workerConfig, {
    claimQueuedWorkflows: (options) => runtime.claimQueuedWorkflowRuns({
      ...options,
      now: CLAIM_NOW,
      workflowId: 'task-orchestrator.agent-daily-run',
    }),
    executeWorkflow: executeQueuedWorkflow,
    context: createWorkerContext(),
  });

  const updated = runtime.getAgentDailyRun(run.id);
  assert.equal(updated.status, 'completed');
  assert.equal(typeof updated.metadata.briefContent, 'string');
  assert.equal(typeof updated.metadata.authorityMode, 'string');
  assert.equal(typeof updated.metadata.instructionCount, 'number');
});

test('intraday_monitor workflow records authority downgrade on critical risk event', async () => {
  runtime.appendRiskEvent({
    level: 'critical',
    status: 'risk-off',
    title: 'Test critical event for intraday monitor',
    source: 'test',
    metadata: { test: true },
  });

  const { run, workflow } = runtime.queueAgentDailyRun({
    kind: 'intraday_monitor',
    trigger: 'schedule',
    accountId: 'paper-main',
    strategyId: 'trend',
    requestedBy: 'system',
  });

  assert.equal(run.status, 'queued');
  assert.equal(workflow.status, 'queued');

  await runWorkflowExecutionTask(workerConfig, {
    claimQueuedWorkflows: (options) => runtime.claimQueuedWorkflowRuns({
      ...options,
      now: CLAIM_NOW,
      workflowId: 'task-orchestrator.agent-daily-run',
    }),
    executeWorkflow: executeQueuedWorkflow,
    context: createWorkerContext(),
  });

  const updated = runtime.getAgentDailyRun(run.id);
  assert.equal(updated.status, 'completed');
  assert.equal(typeof updated.metadata.newCriticalEventCount, 'number');
  assert.equal(updated.metadata.newCriticalEventCount >= 1, true);
  assert.ok(Array.isArray(updated.metadata.processedRiskEventIds));
  assert.ok(updated.metadata.processedRiskEventIds.length >= 1);

  const authorityEvents = runtime.listAgentAuthorityEvents(5);
  const riskTriggered = authorityEvents.find((e) => e.eventType === 'risk_triggered');
  assert.ok(riskTriggered, 'expected a risk_triggered authority event');
  assert.equal(riskTriggered.nextMode, 'stopped');
});

test('intraday_monitor does not reprocess already-handled risk events', async () => {
  const { run: firstRun } = runtime.queueAgentDailyRun({
    kind: 'intraday_monitor',
    trigger: 'schedule',
    accountId: 'paper-main',
    strategyId: 'trend',
    requestedBy: 'system',
  });

  await runWorkflowExecutionTask(workerConfig, {
    claimQueuedWorkflows: (options) => runtime.claimQueuedWorkflowRuns({
      ...options,
      now: CLAIM_NOW,
      workflowId: 'task-orchestrator.agent-daily-run',
    }),
    executeWorkflow: executeQueuedWorkflow,
    context: createWorkerContext(),
  });

  const firstUpdated = runtime.getAgentDailyRun(firstRun.id);
  assert.equal(firstUpdated.status, 'completed');

  // Second run without adding any new risk events — should not process anything new
  const { run: secondRun } = runtime.queueAgentDailyRun({
    kind: 'intraday_monitor',
    trigger: 'schedule',
    accountId: 'paper-main',
    strategyId: 'trend',
    requestedBy: 'system',
  });

  await runWorkflowExecutionTask(workerConfig, {
    claimQueuedWorkflows: (options) => runtime.claimQueuedWorkflowRuns({
      ...options,
      now: CLAIM_NOW,
      workflowId: 'task-orchestrator.agent-daily-run',
    }),
    executeWorkflow: executeQueuedWorkflow,
    context: createWorkerContext(),
  });

  const secondUpdated = runtime.getAgentDailyRun(secondRun.id);
  assert.equal(secondUpdated.status, 'completed');
  assert.equal(secondUpdated.metadata.newCriticalEventCount, 0);
});

test('post_market workflow generates recap and resets authority after risk downgrade', async () => {
  runtime.recordAgentAuthorityEvent({
    severity: 'critical',
    eventType: 'risk_triggered',
    previousMode: 'ask_first',
    nextMode: 'stopped',
    reason: 'Test: simulate risk downgrade before post-market recap.',
  });

  const { run, workflow } = runtime.queueAgentDailyRun({
    kind: 'post_market',
    trigger: 'schedule',
    accountId: 'paper-main',
    strategyId: 'trend',
    requestedBy: 'system',
  });

  assert.equal(run.status, 'queued');
  assert.equal(workflow.status, 'queued');

  await runWorkflowExecutionTask(workerConfig, {
    claimQueuedWorkflows: (options) => runtime.claimQueuedWorkflowRuns({
      ...options,
      now: CLAIM_NOW,
      workflowId: 'task-orchestrator.agent-daily-run',
    }),
    executeWorkflow: executeQueuedWorkflow,
    context: createWorkerContext(),
  });

  const updated = runtime.getAgentDailyRun(run.id);
  assert.equal(updated.status, 'completed');
  assert.equal(typeof updated.metadata.recap, 'string');
  assert.ok(updated.metadata.recap.length > 0);

  const authorityEvents = runtime.listAgentAuthorityEvents(5);
  const restored = authorityEvents.find((e) => e.eventType === 'restored');
  assert.ok(restored, 'expected a restored authority event after post_market recap');
  assert.equal(restored.nextMode, 'manual_only');
});
