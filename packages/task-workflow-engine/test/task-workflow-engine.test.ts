// @ts-nocheck

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assessAgentActionRequestRisk,
  assessExecutionCandidate,
} from '../../../apps/api/src/modules/risk/service.js';
import { buildStrategyExecutionCandidate } from '../../../apps/api/src/modules/strategy/service.js';
import { createTradingState } from '../../../apps/api/test/helpers/create-trading-state.js';
import { createControlPlaneRuntime } from '../../control-plane-runtime/src/index.js';
import { createControlPlaneContext } from '../../control-plane-store/src/context.js';
import { createMemoryStore } from '../../control-plane-store/test/helpers/memory-store.js';
import { executeCycleWorkflow, executeQueuedWorkflow, executeStateWorkflow } from '../src/index.js';

function refreshSummaryForRuntime(runtime) {
  const strategies = runtime.listStrategyCatalog();
  const runs = runtime.listBacktestRuns();
  const completedRuns = runs.filter((run) => run.status === 'completed');
  return runtime.updateResearchSummary({
    asOf: '2026-03-11T09:30:00.000Z',
    queuedRuns: runs.filter((run) => run.status === 'queued').length,
    runningRuns: runs.filter((run) => run.status === 'running').length,
    completedRuns: completedRuns.length,
    failedRuns: runs.filter((run) => run.status === 'failed').length,
    candidateStrategies: strategies.filter((item) =>
      ['candidate', 'paper', 'live'].includes(item.status)
    ).length,
    promotedStrategies: strategies.filter((item) => ['paper', 'live'].includes(item.status)).length,
    averageSharpe: completedRuns.length
      ? Number(
          (completedRuns.reduce((sum, run) => sum + run.sharpe, 0) / completedRuns.length).toFixed(
            2
          )
        )
      : 0,
    averageReturnPct: completedRuns.length
      ? Number(
          (
            completedRuns.reduce((sum, run) => sum + run.annualizedReturnPct, 0) /
            completedRuns.length
          ).toFixed(2)
        )
      : 0,
    reviewQueue: runs.filter((run) => run.status === 'needs_review').length,
    dataSource: 'task-workflow-engine.test',
  });
}

function createEngineContext() {
  const runtime = createControlPlaneRuntime(createControlPlaneContext(createMemoryStore()));
  return {
    ...runtime,
    getOperatorName: () => 'Workflow Test Operator',
    queueRiskScan: (payload) => runtime.enqueueRiskScan(payload),
    getBrokerHealth: async () => ({
      adapter: 'simulated',
      connected: true,
      customBrokerConfigured: false,
      alpacaConfigured: false,
    }),
    executeBrokerCycle: async () => ({
      connected: true,
      message: 'engine test broker ok',
      submittedOrders: [],
      rejectedOrders: [],
      snapshot: {
        connected: true,
        message: 'engine test broker state ok',
        orders: [],
        positions: [],
        account: { cash: 100000, buyingPower: 100000, equity: 100000 },
      },
    }),
    getMarketSnapshot: async () => ({
      label: 'Workflow Test Market',
      connected: true,
      message: 'workflow test market ok',
      quotes: [],
    }),
    assessAgentActionRequestRisk,
    buildStrategyExecutionCandidate,
    assessExecutionCandidate,
    refreshBacktestSummary: () => refreshSummaryForRuntime(runtime),
    recordExecutionPlan: (payload) => runtime.recordExecutionPlan(payload),
    recordAgentActionRequest: (payload) => runtime.recordAgentActionRequest(payload),
  };
}

test('cycle workflow execution persists a completed workflow', async () => {
  const context = createEngineContext();
  const result = await executeCycleWorkflow(
    {
      cycle: 3,
      mode: 'autopilot',
      riskLevel: 'NORMAL',
      decisionSummary: 'engine cycle',
      marketClock: '2026-03-10 10:00:00',
      pendingApprovals: 0,
      liveIntentCount: 0,
      brokerConnected: true,
      marketConnected: true,
      liveTradeEnabled: false,
      pendingLiveIntents: [],
    },
    context
  );

  assert.equal(result.ok, true);
  assert.equal(result.workflow.status, 'completed');
  assert.equal(context.listWorkflowRuns()[0].workflowId, 'task-orchestrator.cycle-run');
});

test('state workflow execution persists a completed workflow and nested cycle run', async () => {
  const context = createEngineContext();
  const result = await executeStateWorkflow(createTradingState(), context);

  assert.equal(result.ok, true);
  assert.equal(result.workflow.workflowId, 'task-orchestrator.state-run');
  assert.equal(
    context.listWorkflowRuns().some((item) => item.workflowId === 'task-orchestrator.cycle-run'),
    true
  );
});

test('queued workflow dispatcher executes manual-review workflows', async () => {
  const context = createEngineContext();
  const queued = context.enqueueWorkflowRun({
    workflowId: 'task-orchestrator.manual-review',
    status: 'queued',
  });
  const claimed = context.claimQueuedWorkflowRuns({ worker: 'engine-worker' });

  const result = await executeQueuedWorkflow(claimed.workflows[0], context);

  assert.equal(queued.workflowId, 'task-orchestrator.manual-review');
  assert.equal(result.workflow.status, 'completed');
});

test('queued workflow dispatcher executes strategy execution workflows', async () => {
  const context = createEngineContext();
  context.enqueueWorkflowRun({
    workflowId: 'task-orchestrator.strategy-execution',
    status: 'queued',
    payload: {
      strategyId: 'ema-cross-us',
      mode: 'paper',
      capital: 120000,
      requestedBy: 'engine-test',
    },
  });
  const claimed = context.claimQueuedWorkflowRuns({ worker: 'engine-worker' });

  const result = await executeQueuedWorkflow(claimed.workflows[0], context);

  assert.equal(result.ok, true);
  assert.equal(result.workflow.status, 'completed');
  assert.equal(context.listExecutionPlans()[0].strategyId, 'ema-cross-us');
});

test('queued workflow dispatcher executes agent action request workflows', async () => {
  const context = createEngineContext();
  context.enqueueWorkflowRun({
    workflowId: 'task-orchestrator.agent-action-request',
    status: 'queued',
    payload: {
      requestType: 'prepare_execution_plan',
      targetId: 'ema-cross-us',
      summary: 'Agent requests execution plan review.',
      rationale: 'Score has improved.',
      requestedBy: 'agent',
    },
  });
  const claimed = context.claimQueuedWorkflowRuns({ worker: 'engine-worker' });

  const result = await executeQueuedWorkflow(claimed.workflows[0], context);

  assert.equal(result.ok, true);
  assert.equal(result.workflow.status, 'completed');
  assert.equal(context.listAgentActionRequests()[0].requestType, 'prepare_execution_plan');
  assert.equal(context.listExecutionPlans().length, 0);
  assert.equal(context.listAgentActionRequests()[0].approvalState, 'required');
});

test('queued agent action request workflows link persisted requests back to agent sessions', async () => {
  const context = createEngineContext();
  const session = context.recordAgentSession({
    id: 'agent-session-engine-link',
    title: 'Link action request back to session',
    prompt: 'Prepare execution approval for ema-cross-us.',
    requestedBy: 'engine-test',
    status: 'completed',
    latestIntent: {
      kind: 'request_execution_prep',
      summary: 'Prepare execution review.',
      targetType: 'strategy',
      targetId: 'ema-cross-us',
      urgency: 'normal',
      requiresApproval: true,
      requestedMode: 'prepare_action',
      metadata: {},
    },
  });
  context.enqueueWorkflowRun({
    workflowId: 'task-orchestrator.agent-action-request',
    status: 'queued',
    payload: {
      requestType: 'prepare_execution_plan',
      targetId: 'ema-cross-us',
      summary: 'Agent requests execution plan review.',
      rationale: 'Score has improved.',
      requestedBy: 'agent',
      metadata: {
        agentSessionId: session.id,
      },
    },
  });
  const claimed = context.claimQueuedWorkflowRuns({ worker: 'engine-worker' });

  const result = await executeQueuedWorkflow(claimed.workflows[0], context);
  const updatedSession = context.getAgentSession(session.id);

  assert.equal(result.ok, true);
  assert.equal(updatedSession.latestActionRequestId, context.listAgentActionRequests()[0].id);
  assert.equal(updatedSession.status, 'waiting_approval');
});

test('queued workflow dispatcher executes backtest workflows and refreshes research summary', async () => {
  const context = createEngineContext();
  context.enqueueWorkflowRun({
    workflowId: 'task-orchestrator.backtest-run',
    status: 'queued',
    payload: {
      strategyId: 'ema-cross-us',
      windowLabel: '2024-01-01 -> 2024-12-31',
      requestedBy: 'engine-test',
    },
  });
  const claimed = context.claimQueuedWorkflowRuns({ worker: 'engine-worker' });

  const result = await executeQueuedWorkflow(claimed.workflows[0], context);

  assert.equal(result.ok, true);
  assert.equal(result.workflow.status, 'completed');
  assert.equal(context.listBacktestRuns().length >= 1, true);
  assert.equal(context.listResearchTasks().length >= 1, true);
  assert.equal(
    context.listBacktestResultsForRun(context.listBacktestRuns()[0].id).length >= 1,
    true
  );
  assert.equal(context.listResearchTasks()[0].taskType, 'backtest-run');
  assert.equal(context.listResearchTasks()[0].status, context.listBacktestRuns()[0].status);
  assert.equal(context.listResearchTasks()[0].workflowRunId, result.workflow.id);
  assert.equal(
    result.workflow.result.backtestResultId,
    context.listBacktestResultsForRun(context.listBacktestRuns()[0].id)[0].id
  );
  assert.equal(typeof context.getResearchSummary().averageSharpe, 'number');
});

test('queued workflow dispatcher executes research report workflows and persists report assets', async () => {
  const context = createEngineContext();
  const evaluation = context.appendResearchEvaluation({
    id: 'research-eval-engine-1',
    runId: 'bt-ema-cross-20260310',
    resultId: 'backtest-result-ema-cross-v1',
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    verdict: 'promote',
    scoreBand: 'strong',
    readiness: 'paper',
    recommendedAction: 'promote_to_paper',
    summary: 'Reviewed result is ready for paper promotion.',
    actor: 'engine-test',
  });
  context.enqueueWorkflowRun({
    workflowId: 'task-orchestrator.research-report',
    status: 'queued',
    payload: {
      evaluationId: evaluation.id,
      runId: evaluation.runId,
      resultId: evaluation.resultId,
      strategyId: evaluation.strategyId,
      requestedBy: 'engine-test',
    },
  });
  const claimed = context.claimQueuedWorkflowRuns({ worker: 'engine-worker' });

  const reportWorkflow = claimed.workflows.find(
    (item) => item.workflowId === 'task-orchestrator.research-report'
  );
  const result = await executeQueuedWorkflow(reportWorkflow, context);

  assert.equal(result.ok, true);
  assert.equal(result.workflow.status, 'completed');
  assert.equal(context.listResearchReports().length >= 1, true);
  assert.equal(context.listResearchReports()[0].evaluationId, evaluation.id);
  assert.equal(
    context
      .listResearchTasks()
      .some((item) => item.taskType === 'research-report' && item.status === 'completed'),
    true
  );
});
