import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { invokeGatewayRoute } from './helpers/invoke-gateway.mjs';

const namespace = `stage-2-baseline-test-${randomUUID()}`;
process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE = namespace;

const [{ createGatewayHandler }, { createControlPlaneContext }, { createControlPlaneStore }] = await Promise.all([
  import('../src/gateways/alpaca.mjs'),
  import('../../../packages/control-plane-store/src/context.mjs'),
  import('../../../packages/control-plane-store/src/store.mjs'),
]);

const handler = createGatewayHandler({
  getBrokerHealth: async () => ({
    adapter: 'simulated',
    connected: true,
    customBrokerConfigured: false,
    alpacaConfigured: false,
  }),
  executeBrokerCycle: async () => ({
    connected: true,
    message: 'stage 2 baseline broker ok',
    submittedOrders: [],
    rejectedOrders: [],
    snapshot: {
      connected: true,
      message: 'stage 2 baseline snapshot ok',
      account: {
        cash: 120000,
        buyingPower: 120000,
        equity: 120000,
      },
      positions: [],
      orders: [],
    },
  }),
  getMarketSnapshot: async () => ({
    label: 'Stage 2 Baseline Market',
    connected: true,
    message: 'stage 2 baseline market ok',
    quotes: [],
  }),
});
const context = createControlPlaneContext(createControlPlaneStore({ namespace }));

test.after(() => {
  rmSync(join(process.cwd(), '.quantpilot-runtime', namespace), { recursive: true, force: true });
  delete process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE;
});

function seedResearchChain() {
  const nowMs = Date.now();
  const createdAt = new Date(nowMs - 2 * 24 * 60 * 60 * 1000).toISOString();
  const workflowCompletedAt = new Date(nowMs - (2 * 24 * 60 * 60 * 1000) + 5 * 60 * 1000).toISOString();
  const evaluationCreatedAt = new Date(nowMs - (2 * 24 * 60 * 60 * 1000) + 8 * 60 * 1000).toISOString();
  const reportCreatedAt = new Date(nowMs - (2 * 24 * 60 * 60 * 1000) + 10 * 60 * 1000).toISOString();
  const governanceActionAt = new Date(nowMs - (2 * 24 * 60 * 60 * 1000) + 12 * 60 * 1000).toISOString();
  context.strategyCatalog.upsertStrategy({
    id: 'stage2-strategy',
    name: 'Stage 2 Research Strategy',
    family: 'trend',
    timeframe: '1h',
    universe: 'NASDAQ 100',
    status: 'paper',
    score: 93,
    expectedReturnPct: 21.4,
    maxDrawdownPct: 7.1,
    sharpe: 1.84,
    baseline: false,
    champion: true,
    summary: 'Stage 2 baseline strategy',
    updatedAt: createdAt,
  });
  context.audit.appendAuditRecord({
    id: 'stage2-audit-strategy',
    type: 'strategy-catalog.saved',
    actor: 'research-lead',
    title: 'Stage 2 strategy saved',
    detail: 'Seed strategy for stage 2 baseline checks.',
    createdAt,
    metadata: {
      strategyId: 'stage2-strategy',
      status: 'paper',
    },
  });
  context.workflows.appendWorkflowRun({
    id: 'stage2-backtest-workflow',
    workflowId: 'task-orchestrator.backtest-run',
    workflowType: 'research',
    status: 'completed',
    actor: 'research-lead',
    createdAt,
    updatedAt: workflowCompletedAt,
    completedAt: workflowCompletedAt,
    title: 'Stage 2 backtest workflow',
    summary: 'Research workflow completed.',
  });
  context.backtestRuns.appendBacktestRun({
    id: 'stage2-run',
    strategyId: 'stage2-strategy',
    strategyName: 'Stage 2 Research Strategy',
    workflowRunId: 'stage2-backtest-workflow',
    status: 'completed',
    windowLabel: '2024-01-01 -> 2026-03-01',
    startedAt: createdAt,
    completedAt: workflowCompletedAt,
    annualizedReturnPct: 23.4,
    maxDrawdownPct: 7.1,
    sharpe: 1.84,
    winRatePct: 58.2,
    turnoverPct: 121,
    summary: 'Baseline research run completed.',
    requestedBy: 'research-lead',
    createdAt,
    updatedAt: workflowCompletedAt,
  });
  context.researchTasks.appendResearchTask({
    id: 'stage2-task',
    taskType: 'backtest-run',
    status: 'completed',
    title: 'Stage 2 backtest task',
    summary: 'Backtest task completed.',
    strategyId: 'stage2-strategy',
    strategyName: 'Stage 2 Research Strategy',
    workflowRunId: 'stage2-backtest-workflow',
    runId: 'stage2-run',
    windowLabel: '2024-01-01 -> 2026-03-01',
    createdAt,
    updatedAt: workflowCompletedAt,
  });
  context.backtestResults.appendBacktestResult({
    id: 'stage2-result',
    runId: 'stage2-run',
    workflowRunId: 'stage2-backtest-workflow',
    strategyId: 'stage2-strategy',
    strategyName: 'Stage 2 Research Strategy',
    windowLabel: '2024-01-01 -> 2026-03-01',
    status: 'completed',
    stage: 'reviewed',
    version: 2,
    generatedAt: workflowCompletedAt,
    summary: 'Reviewed research result is ready for execution preparation.',
    annualizedReturnPct: 23.4,
    maxDrawdownPct: 7.1,
    sharpe: 1.84,
    winRatePct: 58.2,
    turnoverPct: 121,
    benchmarkReturnPct: 13.1,
    excessReturnPct: 10.3,
  });
  context.researchEvaluations.appendResearchEvaluation({
    id: 'stage2-evaluation',
    runId: 'stage2-run',
    resultId: 'stage2-result',
    strategyId: 'stage2-strategy',
    strategyName: 'Stage 2 Research Strategy',
    verdict: 'prepare_execution',
    scoreBand: 'conviction',
    readiness: 'paper',
    recommendedAction: 'prepare_execution',
    summary: 'Research package is approved for execution preparation.',
    actor: 'research-lead',
    createdAt: evaluationCreatedAt,
  });
  context.researchReports.appendResearchReport({
    id: 'stage2-report',
    evaluationId: 'stage2-evaluation',
    workflowRunId: 'stage2-report-workflow',
    runId: 'stage2-run',
    resultId: 'stage2-result',
    strategyId: 'stage2-strategy',
    strategyName: 'Stage 2 Research Strategy',
    title: 'Stage 2 report',
    verdict: 'prepare_execution',
    readiness: 'paper',
    executiveSummary: 'Stage 2 report confirms the strategy is ready for handoff.',
    promotionCall: 'Promote to execution preparation.',
    executionPreparation: 'Paper execution handoff is recommended.',
    riskNotes: 'No blocking risk concerns remain.',
    createdAt: reportCreatedAt,
    updatedAt: reportCreatedAt,
  });
  context.operatorActions.appendOperatorAction({
    id: 'stage2-governance-action',
    type: 'research-governance.set-champion',
    symbol: 'stage2-strategy',
    detail: 'Updated the champion strategy from the research workbench.',
    actor: 'research-lead',
    title: 'Research governance: set champion',
    level: 'info',
    createdAt: governanceActionAt,
    metadata: {
      primaryId: 'stage2-strategy',
      action: 'set_champion',
      successes: [{ strategyId: 'stage2-strategy', champion: true }],
    },
  });
}

test('stage 2 baseline exposes the research hub with governance and execution handoff contracts', async () => {
  seedResearchChain();

  const createHandoff = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/research/execution-candidates',
    body: {
      strategyId: 'stage2-strategy',
      actor: 'research-lead',
      mode: 'paper',
      capital: 75000,
      summary: 'Stage 2 baseline handoff',
    },
  });

  assert.equal(createHandoff.statusCode, 200);
  assert.equal(createHandoff.json.ok, true);
  assert.equal(createHandoff.json.handoff.strategyId, 'stage2-strategy');

  const hub = await invokeGatewayRoute(handler, {
    path: '/api/research/hub?hours=168&limit=20',
  });

  assert.equal(hub.statusCode, 200);
  assert.equal(hub.json.ok, true);
  assert.equal(typeof hub.json.taskSummary.total, 'number');
  assert.equal(typeof hub.json.resultSummary.total, 'number');
  assert.equal(typeof hub.json.evaluationSummary.total, 'number');
  assert.equal(typeof hub.json.reportSummary.total, 'number');
  assert.equal(typeof hub.json.governanceSummary.total, 'number');
  assert.equal(typeof hub.json.handoffSummary.total, 'number');
  assert.equal(Array.isArray(hub.json.governanceActions), true);
  assert.equal(Array.isArray(hub.json.handoffs), true);
  assert.equal(hub.json.governanceActions.some((item) => item.type === 'research-governance.set-champion'), true);
  assert.equal(hub.json.handoffs.some((item) => item.strategyId === 'stage2-strategy'), true);
});

test('stage 2 baseline exposes research replay and queued execution handoff contracts', async () => {
  seedResearchChain();

  let list = await invokeGatewayRoute(handler, {
    path: '/api/research/execution-candidates?hours=168&limit=20',
  });
  let handoffId = list.json.handoffs.find((item) => item.strategyId === 'stage2-strategy')?.id;

  if (!handoffId) {
    const createHandoff = await invokeGatewayRoute(handler, {
      method: 'POST',
      path: '/api/research/execution-candidates',
      body: {
        strategyId: 'stage2-strategy',
        actor: 'research-lead',
        mode: 'paper',
        capital: 75000,
        summary: 'Stage 2 baseline handoff',
      },
    });
    assert.equal(createHandoff.statusCode, 200);
    handoffId = createHandoff.json.handoff?.id;
    list = await invokeGatewayRoute(handler, {
      path: '/api/research/execution-candidates?hours=168&limit=20',
    });
  }

  assert.equal(typeof handoffId, 'string');

  const queue = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/research/execution-candidates/${handoffId}/queue`,
    body: {
      actor: 'execution-approver',
      owner: 'execution-desk',
    },
  });

  assert.equal(queue.statusCode, 200);
  assert.equal(queue.json.ok, true);
  assert.equal(queue.json.handoff.handoffStatus, 'queued');
  assert.equal(queue.json.workflow.workflowId, 'task-orchestrator.strategy-execution');

  const [strategyDetail, workbench] = await Promise.all([
    invokeGatewayRoute(handler, { path: '/api/strategy/catalog/stage2-strategy' }),
    invokeGatewayRoute(handler, { path: '/api/research/workbench?hours=168&limit=20' }),
  ]);

  assert.equal(strategyDetail.statusCode, 200);
  assert.equal(strategyDetail.json.ok, true);
  assert.equal(Array.isArray(strategyDetail.json.replayTimeline), true);
  assert.equal(typeof strategyDetail.json.replaySummary.executionEvents, 'number');
  assert.equal(strategyDetail.json.replaySummary.executionEvents >= 1, true);
  assert.equal(strategyDetail.json.latestExecutionHandoff.handoffStatus, 'queued');

  assert.equal(workbench.statusCode, 200);
  assert.equal(workbench.json.ok, true);
  assert.equal(typeof workbench.json.summary.readyForExecution, 'number');
  assert.equal(Array.isArray(workbench.json.comparisons), true);
  assert.equal(Array.isArray(workbench.json.recentActions), true);
  assert.equal(workbench.json.recentActions.some((item) => item.type?.startsWith('research-governance.')), true);
});
