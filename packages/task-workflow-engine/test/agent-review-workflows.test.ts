// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';
import { createControlPlaneRuntime } from '../../control-plane-runtime/src/index.js';
import { createControlPlaneContext } from '../../control-plane-store/src/context.js';
import { createMemoryStore } from '../../control-plane-store/test/helpers/memory-store.js';
import {
  executeAgentReviewWorkflow,
  getReviewWorkflowId,
  isValidReviewType,
} from '../src/agent-review-workflows.js';

function createReviewContext() {
  const runtime = createControlPlaneRuntime(createControlPlaneContext(createMemoryStore()));
  return {
    ...runtime,
    getOperatorName: () => 'Review Test Operator',
    getResearchIdea: (id) => ({ id, title: 'Mean Reversion Alpha', status: 'evaluating' }),
    listExperimentsByIdea: () => [{ id: 'exp-1' }],
    getBacktestRun: (id) => ({
      id,
      strategyName: 'MomentumV2',
      sharpe: 1.8,
      maxDrawdownPct: 8.5,
      winRatePct: 58,
      turnoverPct: 140,
    }),
    getRiskEvent: (id) => ({
      id,
      title: 'Max drawdown breach',
      level: 'critical',
      message: 'Position exceeded 15% drawdown limit.',
    }),
    getStrategyCatalogItem: (id) => ({ id, name: 'MomentumV2', status: 'candidate' }),
    listBacktestRuns: () => [
      {
        id: 'run-1',
        strategyId: 'strat-1',
        strategyName: 'MomentumV2',
        status: 'completed',
        sharpe: 1.8,
        maxDrawdownPct: 8.5,
      },
    ],
    getIncident: (id) => ({
      id,
      title: 'Order rejection storm',
      severity: 'critical',
      status: 'investigating',
      summary: 'Broker rejected 12 orders in sequence.',
    }),
  };
}

test('isValidReviewType: recognizes all 5 types', () => {
  assert.equal(isValidReviewType('research_idea_critique'), true);
  assert.equal(isValidReviewType('backtest_overfit_review'), true);
  assert.equal(isValidReviewType('risk_violation_explanation'), true);
  assert.equal(isValidReviewType('promotion_memo_draft'), true);
  assert.equal(isValidReviewType('execution_incident_summary'), true);
  assert.equal(isValidReviewType('unknown_type'), false);
});

test('getReviewWorkflowId: returns correct workflow ID', () => {
  assert.equal(
    getReviewWorkflowId('research_idea_critique'),
    'task-orchestrator.agent-review.idea-critique'
  );
  assert.equal(
    getReviewWorkflowId('backtest_overfit_review'),
    'task-orchestrator.agent-review.overfit-review'
  );
});

test('research_idea_critique: produces review with evidence', async () => {
  const ctx = createReviewContext();
  const result = await executeAgentReviewWorkflow(
    { reviewType: 'research_idea_critique', targetId: 'idea-1', requestedBy: 'tester' },
    ctx
  );
  assert.equal(result.ok, true);
  assert.equal(result.reviewType, 'research_idea_critique');
  assert.equal(result.verdict, 'has_supporting_evidence');
  assert.ok(result.summary.includes('Mean Reversion Alpha'));
  assert.ok(result.evidenceCitations.length > 0);
  assert.ok(result.recommendations.length > 0);
  assert.ok(result.workflow);
});

test('research_idea_critique: flags ideas without experiments', async () => {
  const ctx = createReviewContext();
  ctx.listExperimentsByIdea = () => [];
  const result = await executeAgentReviewWorkflow(
    { reviewType: 'research_idea_critique', targetId: 'idea-2', requestedBy: 'tester' },
    ctx
  );
  assert.equal(result.verdict, 'needs_experiment');
  assert.ok(result.summary.includes('lacks experimental evidence'));
});

test('backtest_overfit_review: acceptable metrics pass', async () => {
  const ctx = createReviewContext();
  const result = await executeAgentReviewWorkflow(
    { reviewType: 'backtest_overfit_review', targetId: 'run-1', requestedBy: 'tester' },
    ctx
  );
  assert.equal(result.ok, true);
  assert.equal(result.verdict, 'acceptable');
  assert.ok(result.summary.includes('MomentumV2'));
});

test('backtest_overfit_review: detects overfit signals', async () => {
  const ctx = createReviewContext();
  ctx.getBacktestRun = () => ({
    id: 'run-overfit',
    strategyName: 'Overfit Strategy',
    sharpe: 4.5,
    maxDrawdownPct: 1.2,
    winRatePct: 82,
    turnoverPct: 600,
  });
  const result = await executeAgentReviewWorkflow(
    { reviewType: 'backtest_overfit_review', targetId: 'run-overfit', requestedBy: 'tester' },
    ctx
  );
  assert.equal(result.verdict, 'overfit_risk_detected');
  assert.ok(result.summary.includes('overfit signal'));
});

test('risk_violation_explanation: produces critical violation review', async () => {
  const ctx = createReviewContext();
  const result = await executeAgentReviewWorkflow(
    { reviewType: 'risk_violation_explanation', targetId: 'risk-1', requestedBy: 'tester' },
    ctx
  );
  assert.equal(result.ok, true);
  assert.equal(result.verdict, 'critical_violation');
  assert.ok(result.summary.includes('Max drawdown breach'));
  assert.ok(result.recommendations.some((r) => r.includes('Escalate')));
});

test('promotion_memo_draft: recommends promotion when criteria met', async () => {
  const ctx = createReviewContext();
  ctx.listBacktestRuns = () => [
    {
      id: 'run-1',
      strategyId: 'strat-1',
      strategyName: 'MomentumV2',
      status: 'completed',
      sharpe: 1.8,
      maxDrawdownPct: 8.5,
    },
  ];
  const result = await executeAgentReviewWorkflow(
    { reviewType: 'promotion_memo_draft', targetId: 'strat-1', requestedBy: 'tester' },
    ctx
  );
  assert.equal(result.ok, true);
  assert.equal(result.verdict, 'promotion_recommended');
  assert.ok(result.evidenceCitations.length >= 2);
});

test('promotion_memo_draft: defers promotion when criteria not met', async () => {
  const ctx = createReviewContext();
  ctx.listBacktestRuns = () => [
    {
      id: 'run-2',
      strategyId: 'strat-1',
      strategyName: 'MomentumV2',
      status: 'completed',
      sharpe: 0.5,
      maxDrawdownPct: 20,
    },
  ];
  const result = await executeAgentReviewWorkflow(
    { reviewType: 'promotion_memo_draft', targetId: 'strat-1', requestedBy: 'tester' },
    ctx
  );
  assert.equal(result.verdict, 'promotion_deferred');
});

test('execution_incident_summary: summarizes critical incident', async () => {
  const ctx = createReviewContext();
  const result = await executeAgentReviewWorkflow(
    { reviewType: 'execution_incident_summary', targetId: 'inc-1', requestedBy: 'tester' },
    ctx
  );
  assert.equal(result.ok, true);
  assert.equal(result.verdict, 'needs_escalation');
  assert.ok(result.summary.includes('Order rejection storm'));
});

test('workflow failure: returns error result gracefully', async () => {
  const ctx = createReviewContext();
  ctx.getResearchIdea = () => {
    throw new Error('DB connection lost');
  };
  const result = await executeAgentReviewWorkflow(
    { reviewType: 'research_idea_critique', targetId: 'bad-id', requestedBy: 'tester' },
    ctx
  );
  assert.equal(result.ok, false);
  assert.equal(result.verdict, 'error');
  assert.ok(result.summary.includes('DB connection lost'));
});
