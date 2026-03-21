import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { invokeGatewayRoute } from './helpers/invoke-gateway.mjs';
import { createTradingState } from './helpers/create-trading-state.mjs';

const namespace = `control-plane-api-test-${randomUUID()}`;
process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE = namespace;

const fakeBrokerHealth = {
  adapter: 'simulated',
  connected: true,
  customBrokerConfigured: false,
  alpacaConfigured: false,
};

const fakeBrokerExecution = {
  connected: true,
  message: 'test broker execution ok',
  submittedOrders: [],
  rejectedOrders: [],
  snapshot: {
    connected: true,
    message: 'test broker state ok',
    account: {
      cash: 80000,
      buyingPower: 80000,
      equity: 80000,
    },
    positions: [],
    orders: [],
  },
};

const fakeMarketSnapshot = {
  label: 'Injected Test Market',
  connected: true,
  message: 'test market snapshot ok',
  quotes: [],
};

const [{ createGatewayHandler }, { createControlPlaneContext }, { createControlPlaneStore }] = await Promise.all([
  import('../src/gateways/alpaca.mjs'),
  import('../../../packages/control-plane-store/src/context.mjs'),
  import('../../../packages/control-plane-store/src/store.mjs'),
]);

const handler = createGatewayHandler({
  getBrokerHealth: async () => fakeBrokerHealth,
  executeBrokerCycle: async () => fakeBrokerExecution,
  getMarketSnapshot: async () => fakeMarketSnapshot,
});
const context = createControlPlaneContext(createControlPlaneStore({ namespace }));

test.after(() => {
  rmSync(join(process.cwd(), '.quantpilot-runtime', namespace), { recursive: true, force: true });
  delete process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE;
});

test('GET /api/notification/events returns seeded notifications', async () => {
  const now = Date.now();
  context.notifications.appendNotification({
    id: 'notif-api-test',
    title: 'API notification',
    message: 'seeded notification',
    source: 'test',
    level: 'info',
    createdAt: new Date(now - 60 * 60 * 1000).toISOString(),
  });
  context.notifications.appendNotification({
    id: 'notif-api-warn',
    title: 'Warn notification',
    message: 'warn notification',
    source: 'scheduler',
    level: 'warn',
    createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/notification/events',
  });
  const filteredResponse = await invokeGatewayRoute(handler, {
    path: '/api/notification/events?source=scheduler&level=warn&hours=48&limit=5',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.events[0].id, 'notif-api-test');
  assert.equal(filteredResponse.statusCode, 200);
  assert.equal(filteredResponse.json.events.some((item) => item.id === 'notif-api-warn'), true);
});

test('GET /api/risk/events returns seeded risk events', async () => {
  context.risk.appendRiskEvent({
    id: 'risk-api-test',
    title: 'Risk event',
    message: 'seeded risk event',
    cycle: 88,
    riskLevel: 'RISK OFF',
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/risk/events',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.events[0].id, 'risk-api-test');
});

test('GET /api/risk/workbench returns the consolidated risk workbench snapshot', async () => {
  const nowIso = new Date().toISOString();
  context.risk.appendRiskEvent({
    id: 'risk-workbench-event',
    title: 'Risk workbench event',
    message: 'approval still required before routing live execution',
    cycle: 109,
    riskLevel: 'RISK OFF',
    status: 'approval-required',
    level: 'warn',
    source: 'risk-monitor',
    createdAt: nowIso,
  });
  context.executionPlans.appendExecutionPlan({
    id: 'risk-workbench-plan',
    workflowRunId: 'risk-workbench-workflow',
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    mode: 'live',
    status: 'ready',
    approvalState: 'required',
    riskStatus: 'review',
    summary: 'Risk requires operator approval before live routing.',
    capital: 35000,
    orderCount: 2,
    orders: [],
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  context.backtestRuns.appendBacktestRun({
    id: 'risk-workbench-run',
    strategyId: 'rsi-revert-index',
    strategyName: 'Index RSI Revert',
    status: 'needs_review',
    summary: 'Drawdown is outside the promotion fence.',
    windowLabel: '2024-01-01 -> 2026-03-01',
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  context.incidents.appendIncident({
    id: 'risk-workbench-incident',
    title: 'Risk workbench incident',
    summary: 'Escalated from the risk console',
    severity: 'warn',
    source: 'risk',
    status: 'investigating',
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  context.executionRuntime.appendBrokerAccountSnapshot({
    id: 'risk-workbench-snapshot',
    cycleId: 'cycle-risk-workbench',
    cycle: 109,
    provider: 'alpaca',
    connected: true,
    account: {
      cash: 64000,
      buyingPower: 64000,
      equity: 80000,
    },
    positions: [
      {
        symbol: 'AAPL',
        qty: 10,
        avgCost: 202,
        marketValue: 2100,
      },
    ],
    orders: [],
    createdAt: nowIso,
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/risk/workbench?hours=168&limit=10',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.summary.approvalRequired >= 1, true);
  assert.equal(response.json.summary.reviewBacktests >= 1, true);
  assert.equal(response.json.summary.openRiskIncidents >= 1, true);
  assert.equal(response.json.lanes.some((item) => item.key === 'execution-review'), true);
  assert.equal(response.json.reviewQueue.executionPlans[0].id, 'risk-workbench-plan');
  assert.equal(response.json.reviewQueue.backtestRuns[0].id, 'risk-workbench-run');
  assert.equal(response.json.reviewQueue.incidents[0].id, 'risk-workbench-incident');
  assert.equal(response.json.recent.riskEvents[0].id, 'risk-workbench-event');
});

test('GET /api/risk/events/:id returns a single risk event', async () => {
  context.risk.appendRiskEvent({
    id: 'risk-api-detail',
    title: 'Risk detail event',
    message: 'single risk event',
    cycle: 91,
    riskLevel: 'RISK OFF',
    status: 'risk-off',
    level: 'critical',
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/risk/events/risk-api-detail',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.event.id, 'risk-api-detail');
});

test('GET /api/strategy/catalog returns research strategies', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/strategy/catalog',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(Array.isArray(response.json.strategies), true);
  assert.equal(response.json.strategies.some((item) => item.status === 'candidate'), true);
});

test('POST /api/strategy/catalog saves strategy catalog entries', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/strategy/catalog',
    body: {
      id: 'stat-arb-us',
      name: 'US Stat Arb',
      family: 'stat-arb',
      timeframe: '30m',
      universe: 'S&P 500',
      status: 'researching',
      score: 68,
      expectedReturnPct: 11.4,
      maxDrawdownPct: 6.2,
      sharpe: 1.11,
      summary: 'Mean reversion basket candidate.',
      updatedBy: 'api-test',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.strategy.id, 'stat-arb-us');
  assert.equal(context.strategyCatalog.getStrategy('stat-arb-us').family, 'stat-arb');
  const audit = context.audit.listAuditRecords(5).find((item) => item.type === 'strategy-catalog.saved' && item.metadata?.strategyId === 'stat-arb-us');
  assert.equal(audit.metadata?.timeframe, '30m');
  assert.equal(audit.metadata?.score, 68);
  assert.equal(audit.metadata?.expectedReturnPct, 11.4);
});

test('GET /api/strategy/catalog/:id returns strategy detail with recent runs', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/strategy/catalog/ema-cross-us',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.strategy.id, 'ema-cross-us');
  assert.equal(Array.isArray(response.json.recentRuns), true);
  assert.equal(response.json.recentRuns.every((item) => item.strategyId === 'ema-cross-us'), true);
  assert.ok(response.json.latestResult);
  assert.equal(Array.isArray(response.json.recentResults), true);
  assert.equal(response.json.recentResults.every((item) => item.strategyId === 'ema-cross-us'), true);
  assert.equal(typeof response.json.latestEvaluation?.verdict, 'string');
  assert.equal(Array.isArray(response.json.recentEvaluations), true);
  assert.equal(Array.isArray(response.json.replayTimeline), true);
  assert.equal(response.json.replaySummary.totalEvents >= 1, true);
  assert.equal(typeof response.json.promotionReadiness?.level, 'string');
  assert.equal(typeof response.json.promotionReadiness?.recommendedAction, 'string');
  assert.equal(typeof response.json.executionCandidatePreview?.summary, 'string');
  assert.equal(response.json.executionCandidatePreview?.strategyId, undefined);
  assert.equal(Array.isArray(response.json.executionCandidatePreview?.orders), true);
});

test('GET /api/market/provider-status returns backend market provider status', async () => {
  context.marketProviders.updateMarketProviderStatus({
    provider: 'alpaca',
    connected: true,
    fallback: false,
    message: 'market provider synced from backend',
    symbolCount: 5,
    asOf: '2026-03-11T09:30:00.000Z',
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/market/provider-status',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.status.provider, 'alpaca');
  assert.equal(response.json.status.symbolCount, 5);
});

test('GET /api/backtest/summary returns structured research summary', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/backtest/summary',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(typeof response.json.completedRuns, 'number');
  assert.equal(typeof response.json.averageSharpe, 'number');
});

test('GET /api/backtest/runs returns structured backtest runs', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/backtest/runs',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(Array.isArray(response.json.runs), true);
  assert.equal(response.json.runs.some((item) => item.status === 'completed'), true);
});

test('GET /api/backtest/runs/:id returns run detail with linked strategy and workflow context', async () => {
  const created = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/backtest/runs',
    body: {
      strategyId: 'ema-cross-us',
      windowLabel: '2024-01-01 -> 2024-12-31',
      requestedBy: 'api-test',
    },
  });

  const response = await invokeGatewayRoute(handler, {
    path: `/api/backtest/runs/${created.json.run.id}`,
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.run.id, created.json.run.id);
  assert.equal(response.json.strategy.id, 'ema-cross-us');
  assert.equal(response.json.researchTask.runId, created.json.run.id);
  assert.equal(response.json.researchTask.workflowRunId, created.json.workflow.id);
  assert.equal(response.json.workflow.id, created.json.workflow.id);
});

test('GET /api/research/tasks returns research backbone tasks and related summary routes', async () => {
  const created = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/backtest/runs',
    body: {
      strategyId: 'ema-cross-us',
      windowLabel: '2024-01-01 -> 2024-12-31',
      requestedBy: 'api-research-test',
    },
  });

  const tasksResponse = await invokeGatewayRoute(handler, {
    path: `/api/research/tasks?strategyId=ema-cross-us&workflowRunId=${created.json.workflow.id}&limit=5`,
  });
  const summaryResponse = await invokeGatewayRoute(handler, {
    path: '/api/research/tasks/summary?hours=168&limit=20',
  });
  const hubResponse = await invokeGatewayRoute(handler, {
    path: '/api/research/hub?hours=168&limit=20',
  });
  const workbenchResponse = await invokeGatewayRoute(handler, {
    path: '/api/research/workbench?hours=168&limit=20',
  });
  const detailResponse = await invokeGatewayRoute(handler, {
    path: `/api/research/tasks/${created.json.researchTask.id}`,
  });

  assert.equal(tasksResponse.statusCode, 200);
  assert.equal(tasksResponse.json.tasks.length >= 1, true);
  assert.equal(tasksResponse.json.tasks[0].id, created.json.researchTask.id);
  assert.equal(summaryResponse.statusCode, 200);
  assert.equal(summaryResponse.json.summary.total >= 1, true);
  assert.equal(summaryResponse.json.summary.byType.some((item) => item.taskType === 'backtest-run'), true);
  assert.equal(hubResponse.statusCode, 200);
  assert.equal(hubResponse.json.taskSummary.total >= 1, true);
  assert.equal(hubResponse.json.workbench.ok, true);
  assert.equal(hubResponse.json.tasks.some((item) => item.id === created.json.researchTask.id), true);
  assert.equal(workbenchResponse.statusCode, 200);
  assert.equal(workbenchResponse.json.ok, true);
  assert.equal(Array.isArray(workbenchResponse.json.promotionQueue), true);
  assert.equal(detailResponse.statusCode, 200);
  assert.equal(detailResponse.json.task.id, created.json.researchTask.id);
  assert.equal(detailResponse.json.run.id, created.json.run.id);
  assert.equal(detailResponse.json.workflow.id, created.json.workflow.id);
  assert.equal(detailResponse.json.strategy.id, created.json.run.strategyId);
});

test('POST /api/backtest/runs/:id/evaluate persists a research evaluation and exposes summary routes', async () => {
  const created = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/backtest/runs',
    body: {
      strategyId: 'ema-cross-us',
      windowLabel: '2024-01-01 -> 2024-12-31',
      requestedBy: 'api-test',
    },
  });

  await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/backtest/runs/${created.json.run.id}/review`,
    body: {
      reviewedBy: 'risk-operator',
      summary: 'Reviewed and ready for evaluation.',
    },
  });

  const evaluated = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/backtest/runs/${created.json.run.id}/evaluate`,
    body: {
      actor: 'research-lead',
      summary: 'Research lead marked this result ready for promotion.',
    },
  });
  const detail = await invokeGatewayRoute(handler, {
    path: `/api/backtest/runs/${created.json.run.id}`,
  });
  const feed = await invokeGatewayRoute(handler, {
    path: `/api/research/evaluations?runId=${created.json.run.id}`,
  });
  const summary = await invokeGatewayRoute(handler, {
    path: '/api/research/evaluations/summary?strategyId=ema-cross-us',
  });

  assert.equal(evaluated.statusCode, 200);
  assert.equal(evaluated.json.ok, true);
  assert.equal(typeof evaluated.json.evaluation.id, 'string');
  assert.equal(evaluated.json.reportWorkflow.workflowId, 'task-orchestrator.research-report');
  assert.equal(detail.json.latestEvaluation.id, evaluated.json.evaluation.id);
  assert.equal(feed.json.evaluations.some((item) => item.id === evaluated.json.evaluation.id), true);
  assert.equal(summary.json.summary.total >= 1, true);
});

test('POST /api/research/governance/actions runs batch governance actions and exposes them through the workbench', async () => {
  const created = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/backtest/runs',
    body: {
      strategyId: 'ema-cross-us',
      windowLabel: '2024-01-01 -> 2024-12-31',
      requestedBy: 'governance-test',
    },
  });

  await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/backtest/runs/${created.json.run.id}/review`,
    body: {
      reviewedBy: 'risk-operator',
      summary: 'Reviewed for governance evaluation.',
    },
  });

  const evaluateResponse = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/research/governance/actions',
    body: {
      action: 'evaluate_runs',
      actor: 'research-governance',
      runIds: [created.json.run.id],
    },
  });
  const refreshResponse = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/research/governance/actions',
    body: {
      action: 'queue_backtests',
      actor: 'research-governance',
      strategyIds: ['ema-cross-us'],
      windowLabel: '2025-01-01 -> 2026-03-01',
    },
  });
  const baselineResponse = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/research/governance/actions',
    body: {
      action: 'set_baseline',
      actor: 'research-governance',
      strategyIds: ['ema-cross-us'],
    },
  });
  const championResponse = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/research/governance/actions',
    body: {
      action: 'set_champion',
      actor: 'research-governance',
      strategyIds: ['ema-cross-us'],
    },
  });
  const workbenchResponse = await invokeGatewayRoute(handler, {
    path: '/api/research/workbench?hours=168&limit=20',
  });

  assert.equal(evaluateResponse.statusCode, 200);
  assert.equal(evaluateResponse.json.successes.length >= 1, true);
  assert.equal(refreshResponse.statusCode, 200);
  assert.equal(refreshResponse.json.successes.length >= 1, true);
  assert.equal(baselineResponse.statusCode, 200);
  assert.equal(baselineResponse.json.successes[0].baseline, true);
  assert.equal(championResponse.statusCode, 200);
  assert.equal(championResponse.json.successes[0].champion, true);
  assert.equal(workbenchResponse.statusCode, 200);
  assert.equal(workbenchResponse.json.summary.baselines >= 1, true);
  assert.equal(workbenchResponse.json.summary.champions >= 1, true);
  assert.equal(typeof workbenchResponse.json.comparisonSummary.baselineStrategyId, 'string');
  assert.equal(typeof workbenchResponse.json.comparisonSummary.championStrategyId, 'string');
  assert.equal(Array.isArray(workbenchResponse.json.comparisonInsights), true);
  assert.equal(typeof workbenchResponse.json.comparisons[0].comparisonBand, 'string');
  assert.equal(workbenchResponse.json.recentActions.length >= 4, true);
  assert.equal(workbenchResponse.json.actionSummary.total >= 4, true);
});

test('POST /api/research/execution-candidates creates a persisted handoff and queues execution workflow from it', async () => {
  const created = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/research/execution-candidates',
    body: {
      strategyId: 'ema-cross-us',
      actor: 'research-lead',
      mode: 'paper',
      capital: 60000,
    },
  });
  const listed = await invokeGatewayRoute(handler, {
    path: '/api/research/execution-candidates?limit=10',
  });
  const queued = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/research/execution-candidates/${created.json.handoff.id}/queue`,
    body: {
      actor: 'execution-desk',
      owner: 'execution-desk',
    },
  });

  assert.equal(created.statusCode, 200);
  assert.equal(created.json.ok, true);
  assert.equal(created.json.handoff.strategyId, 'ema-cross-us');
  assert.equal(listed.statusCode, 200);
  assert.equal(listed.json.summary.total >= 1, true);
  assert.equal(listed.json.handoffs.some((item) => item.id === created.json.handoff.id), true);
  assert.equal(queued.statusCode, 200);
  assert.equal(queued.json.handoff.handoffStatus, 'queued');
  assert.equal(queued.json.workflow.workflowId, 'task-orchestrator.strategy-execution');
});

test('GET /api/research/reports and summary return report assets generated for research operations', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/research/reports?strategyId=ema-cross-us&limit=10',
  });
  const summary = await invokeGatewayRoute(handler, {
    path: '/api/research/reports/summary?strategyId=ema-cross-us&limit=20',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(Array.isArray(response.json.reports), true);
  assert.equal(summary.statusCode, 200);
  assert.equal(summary.json.summary.total >= 1, true);
});

test('POST /api/strategy/catalog/:id/promote uses the latest research evaluation as a guardrail', async () => {
  const reviewed = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/backtest/runs/bt-ema-cross-20260310/review',
    body: {
      reviewedBy: 'risk-operator',
      summary: 'Reviewed seed run for promotion guardrail.',
    },
  });

  assert.equal(reviewed.statusCode, 200);

  const evaluated = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/backtest/runs/bt-ema-cross-20260310/evaluate',
    body: {
      actor: 'research-lead',
      summary: 'Seed strategy is ready for paper promotion.',
    },
  });
  const promoted = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/strategy/catalog/ema-cross-us/promote',
    body: {
      actor: 'api-test',
      nextStatus: 'paper',
      evaluationId: evaluated.json.evaluation.id,
    },
  });

  assert.equal(promoted.statusCode, 200);
  assert.equal(promoted.json.ok, true);
  assert.equal(promoted.json.strategy.status, 'paper');
  assert.equal(promoted.json.evaluation.id, evaluated.json.evaluation.id);
});

test('GET /api/backtest/results exposes versioned backtest results and detail context', async () => {
  const created = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/backtest/runs',
    body: {
      strategyId: 'ema-cross-us',
      windowLabel: '2024-01-01 -> 2024-12-31',
      requestedBy: 'api-result-test',
    },
  });

  context.backtestRuns.updateBacktestRun(created.json.run.id, {
    status: 'needs_review',
    completedAt: new Date().toISOString(),
    annualizedReturnPct: 12.8,
    maxDrawdownPct: 10.9,
    sharpe: 0.97,
    winRatePct: 54.1,
    turnoverPct: 148,
    summary: 'Generated run requires review.',
  });

  const reviewResponse = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/backtest/runs/${created.json.run.id}/review`,
    body: {
      reviewedBy: 'risk-operator',
      summary: 'Operator accepted the result after reviewing the drawdown explanation.',
    },
  });

  const listResponse = await invokeGatewayRoute(handler, {
    path: `/api/backtest/results?runId=${created.json.run.id}&limit=10`,
  });
  const summaryResponse = await invokeGatewayRoute(handler, {
    path: `/api/backtest/results/summary?strategyId=ema-cross-us&limit=20`,
  });
  const detailResponse = await invokeGatewayRoute(handler, {
    path: `/api/backtest/results/${reviewResponse.json.latestResult.id}`,
  });

  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.json.results.length >= 1, true);
  assert.equal(listResponse.json.results[0].runId, created.json.run.id);
  assert.equal(summaryResponse.statusCode, 200);
  assert.equal(summaryResponse.json.summary.total >= 1, true);
  assert.equal(typeof summaryResponse.json.summary.averageExcessReturnPct, 'number');
  assert.equal(detailResponse.statusCode, 200);
  assert.equal(detailResponse.json.result.id, reviewResponse.json.latestResult.id);
  assert.equal(detailResponse.json.run.id, created.json.run.id);
  assert.equal(detailResponse.json.workflow.id, created.json.workflow.id);
  assert.equal(Array.isArray(detailResponse.json.siblings), true);
});

test('POST /api/backtest/runs queues a persisted research workflow run', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/backtest/runs',
    body: {
      strategyId: 'ema-cross-us',
      windowLabel: '2024-01-01 -> 2024-12-31',
      requestedBy: 'api-test',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.workflow.workflowId, 'task-orchestrator.backtest-run');
  assert.equal(response.json.run.strategyId, 'ema-cross-us');
  assert.equal(response.json.run.status, 'queued');
});

test('POST /api/backtest/runs/:id/review updates reviewable backtest runs', async () => {
  const created = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/backtest/runs',
    body: {
      strategyId: 'rsi-revert-index',
      windowLabel: '2023-01-01 -> 2024-12-31',
      requestedBy: 'api-test',
    },
  });

  context.backtestRuns.updateBacktestRun(created.json.run.id, {
    status: 'needs_review',
    summary: 'Needs operator review.',
    completedAt: '2026-03-10T09:45:00.000Z',
  });

  const reviewResponse = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/backtest/runs/${created.json.run.id}/review`,
    body: {
      reviewedBy: 'risk-operator',
      summary: 'Operator accepted the run for promotion review.',
    },
  });

  assert.equal(reviewResponse.statusCode, 200);
  assert.equal(reviewResponse.json.ok, true);
  assert.equal(reviewResponse.json.run.status, 'completed');
  assert.equal(reviewResponse.json.run.reviewedBy, 'risk-operator');
  const audit = context.audit.listAuditRecords(10).find((item) => item.type === 'backtest-run.reviewed' && item.metadata?.runId === created.json.run.id);
  assert.equal(audit.metadata?.windowLabel, '2023-01-01 -> 2024-12-31');
  assert.equal(audit.metadata?.annualizedReturnPct, 0);
});

test('GET /api/agent/tools returns allowlisted read-only tools', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/agent/tools',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(Array.isArray(response.json.tools), true);
  assert.equal(response.json.tools.some((item) => item.name === 'execution.plans.list'), true);
  assert.equal(response.json.tools.every((item) => item.access === 'read'), true);
});

test('GET /api/architecture returns the seven-layer architecture summary', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/architecture',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.architecture.summary.layerCount, 7);
  assert.equal(response.json.architecture.layers.some((item) => item.id === 'frontend'), true);
  assert.equal(response.json.architecture.layers.some((item) => item.id === 'backend' && item.moduleCount >= 1), true);
  assert.equal(
    response.json.architecture.layers.some(
      (item) => item.id === 'agent' && item.modules.some((module) => module.id === 'agent'),
    ),
    true,
  );
});

test('GET /api/auth/session returns account-backed session data', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/auth/session',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.user.id, 'operator-demo');
  assert.equal(Array.isArray(response.json.user.permissions), true);
  assert.equal(response.json.user.accessStatus, 'active');
  assert.equal(typeof response.json.preferences.timezone, 'string');
});

test('GET /api/auth/permissions returns the shared permission catalog', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/auth/permissions',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(Array.isArray(response.json.permissions), true);
  assert.equal(response.json.permissions.some((item) => item.id === 'execution:approve' && item.scope === 'execution'), true);
});

test('GET /api/user-account/profile returns profile and preferences', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/user-account/profile',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.profile.email, 'operator@quantpilot.local');
  assert.equal(Array.isArray(response.json.access.permissions), true);
  assert.equal(Array.isArray(response.json.roleTemplates), true);
  assert.equal(typeof response.json.accessSummary.isSessionAligned, 'boolean');
  assert.equal(typeof response.json.preferences.defaultMode, 'string');
});

test('GET /api/user-account returns consolidated account workspace data', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/user-account',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(Array.isArray(response.json.brokerBindings), true);
  assert.equal(Array.isArray(response.json.roleTemplates), true);
  assert.equal(typeof response.json.brokerSummary.total, 'number');
  assert.equal(typeof response.json.accessSummary.isSessionAligned, 'boolean');
  assert.equal(response.json.session.user.id, 'operator-demo');
});

test('POST /api/user-account/access updates persisted access policy and session permissions', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/user-account/access',
    body: {
      role: 'operator',
      permissions: ['dashboard:read', 'risk:review'],
      status: 'active',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.access.role, 'operator');
  assert.equal(response.json.access.permissions.includes('risk:review'), true);
  assert.equal(response.json.access.permissions.includes('account:write'), false);
  assert.equal(response.json.accessSummary.effectivePermissions.includes('risk:review'), true);
  assert.equal(response.json.session.user.role, 'operator');

  const sessionResponse = await invokeGatewayRoute(handler, {
    path: '/api/auth/session',
  });
  assert.equal(sessionResponse.statusCode, 200);
  assert.equal(sessionResponse.json.user.role, 'operator');
  assert.equal(sessionResponse.json.user.permissions.includes('risk:review'), true);
  assert.equal(sessionResponse.json.user.permissions.includes('account:write'), false);

  const auditResponse = await invokeGatewayRoute(handler, {
    path: '/api/audit/records',
  });
  assert.equal(auditResponse.statusCode, 200);
  assert.equal(auditResponse.json.records.some((item) => item.type === 'user-account.access.updated' && item.metadata.role === 'operator'), true);

  context.userAccount.updateUserAccess({
    role: 'admin',
    status: 'active',
    permissions: ['dashboard:read', 'strategy:write', 'risk:review', 'execution:approve', 'account:write'],
  });
});

test('POST /api/user-account/profile updates persisted profile data', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/user-account/profile',
    body: {
      name: 'Operator One',
      organization: 'QuantPilot Research',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.profile.name, 'Operator One');
  assert.equal(response.json.profile.organization, 'QuantPilot Research');

  const auditResponse = await invokeGatewayRoute(handler, {
    path: '/api/audit/records',
  });
  assert.equal(auditResponse.statusCode, 200);
  assert.equal(auditResponse.json.records.some((item) => item.type === 'user-account.profile.updated' && item.metadata.userId === 'operator-demo'), true);
});

test('POST /api/user-account/preferences updates persisted preferences', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/user-account/preferences',
    body: {
      locale: 'en-US',
      notificationChannels: ['inbox', 'email'],
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.preferences.locale, 'en-US');
  assert.equal(response.json.preferences.notificationChannels.includes('email'), true);

  const auditResponse = await invokeGatewayRoute(handler, {
    path: '/api/audit/records',
  });
  assert.equal(auditResponse.statusCode, 200);
  assert.equal(auditResponse.json.records.some((item) => item.type === 'user-account.preferences.updated' && item.metadata.locale === 'en-US'), true);
});

test('account write routes reject requests without account:write permission', async () => {
  context.userAccount.updateUserAccess({
    role: 'viewer',
    status: 'active',
    permissions: ['dashboard:read'],
  });

  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/user-account/preferences',
    body: {
      locale: 'zh-CN',
    },
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.json.ok, false);
  assert.equal(response.json.missingPermission, 'account:write');
  assert.equal(response.json.permission.id, 'account:write');
  assert.equal(typeof response.json.help, 'string');
  assert.equal(response.json.message, 'missing required permission: account:write');

  context.userAccount.updateUserAccess({
    role: 'admin',
    status: 'active',
    permissions: ['dashboard:read', 'strategy:write', 'risk:review', 'execution:approve', 'account:write'],
  });
});

test('POST /api/user-account/broker-bindings upserts broker bindings', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/user-account/broker-bindings',
    body: {
      id: 'binding-live',
      provider: 'custom-http',
      label: 'Live Broker',
      environment: 'live',
      accountId: 'live-main',
      status: 'connected',
      permissions: ['read', 'trade'],
      isDefault: true,
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.binding.id, 'binding-live');
  assert.equal(response.json.summary.total >= 1, true);

  const listResponse = await invokeGatewayRoute(handler, {
    path: '/api/user-account/broker-bindings',
  });
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.json.ok, true);
  assert.equal(listResponse.json.bindings.some((item) => item.id === 'binding-live' && item.isDefault), true);
  assert.equal(typeof listResponse.json.summary.requiresAttention, 'number');

  const auditResponse = await invokeGatewayRoute(handler, {
    path: '/api/audit/records',
  });
  assert.equal(auditResponse.statusCode, 200);
  assert.equal(auditResponse.json.records.some((item) => item.type === 'user-account.broker-binding.saved' && item.metadata.bindingId === 'binding-live'), true);
});

test('POST /api/user-account/broker-bindings/:id/default switches the default binding', async () => {
  await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/user-account/broker-bindings',
    body: {
      id: 'binding-paper',
      provider: 'alpaca',
      label: 'Paper Backup',
      environment: 'paper',
      accountId: 'paper-backup',
      status: 'disconnected',
      permissions: ['read'],
      isDefault: false,
    },
  });

  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/user-account/broker-bindings/binding-paper/default',
    body: {},
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.binding.id, 'binding-paper');
  assert.equal(response.json.bindings.find((item) => item.id === 'binding-paper')?.isDefault, true);
  assert.equal(response.json.bindings.filter((item) => item.isDefault).length, 1);

  const auditResponse = await invokeGatewayRoute(handler, {
    path: '/api/audit/records',
  });
  assert.equal(auditResponse.statusCode, 200);
  assert.equal(auditResponse.json.records.some((item) => item.type === 'user-account.broker-binding.default-set' && item.metadata.bindingId === 'binding-paper'), true);
});

test('DELETE /api/user-account/broker-bindings/:id removes a non-default binding', async () => {
  await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/user-account/broker-bindings',
    body: {
      id: 'binding-delete',
      provider: 'custom-http',
      label: 'Delete Me',
      environment: 'paper',
      accountId: 'delete-me',
      status: 'disconnected',
      permissions: ['read'],
      isDefault: false,
    },
  });

  const response = await invokeGatewayRoute(handler, {
    method: 'DELETE',
    path: '/api/user-account/broker-bindings/binding-delete',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.binding.id, 'binding-delete');
  assert.equal(response.json.bindings.some((item) => item.id === 'binding-delete'), false);

  const auditResponse = await invokeGatewayRoute(handler, {
    path: '/api/audit/records',
  });
  assert.equal(auditResponse.statusCode, 200);
  assert.equal(auditResponse.json.records.some((item) => item.type === 'user-account.broker-binding.deleted' && item.metadata.bindingId === 'binding-delete'), true);
});

test('DELETE /api/user-account/broker-bindings/:id rejects deleting the default binding', async () => {
  const listResponse = await invokeGatewayRoute(handler, {
    path: '/api/user-account/broker-bindings',
  });
  const defaultBinding = listResponse.json.bindings.find((item) => item.isDefault);

  const response = await invokeGatewayRoute(handler, {
    method: 'DELETE',
    path: `/api/user-account/broker-bindings/${defaultBinding.id}`,
  });

  assert.equal(response.statusCode, 409);
  assert.equal(response.json.ok, false);
  assert.equal(response.json.error, 'default broker binding cannot be deleted');
});

test('GET /api/user-account/broker-bindings/runtime returns default binding runtime health', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/user-account/broker-bindings/runtime',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.runtime.adapter, 'simulated');
  assert.equal(typeof response.json.runtime.lastCheckedAt, 'string');
});

test('POST /api/user-account/broker-bindings/sync updates default binding runtime status', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/user-account/broker-bindings/sync',
    body: {},
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.binding.status, 'connected');
  assert.equal(response.json.binding.health.connected, true);
  assert.equal(typeof response.json.binding.lastSyncAt, 'string');

  const auditResponse = await invokeGatewayRoute(handler, {
    path: '/api/audit/records',
  });
  assert.equal(auditResponse.statusCode, 200);
  assert.equal(auditResponse.json.records.some((item) => item.type === 'user-account.broker-binding.runtime-synced' && item.metadata.bindingId === response.json.binding.id), true);
});

test('POST /api/agent/tools/execute runs an allowlisted read-only tool', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/agent/tools/execute',
    body: {
      tool: 'backtest.summary.get',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.tool, 'backtest.summary.get');
  assert.equal(typeof response.json.summary, 'string');
});

test('POST /api/agent/tools/execute rejects non-allowlisted tools', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/agent/tools/execute',
    body: {
      tool: 'execution.plan.create',
    },
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.json.ok, false);
});

test('POST /api/agent/action-requests queues an agent action request workflow', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/agent/action-requests',
    body: {
      requestType: 'prepare_execution_plan',
      targetId: 'ema-cross-us',
      summary: 'Agent asks for execution plan review.',
      rationale: 'Strategy score has improved.',
      requestedBy: 'agent',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.workflow.workflowId, 'task-orchestrator.agent-action-request');
});

test('POST /api/agent/action-requests rejects unsupported request types', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/agent/action-requests',
    body: {
      requestType: 'direct_execute',
      targetId: 'ema-cross-us',
      requestedBy: 'agent',
    },
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.json.ok, false);
});

test('POST /api/agent/action-requests requires strategy:write permission', async () => {
  context.userAccount.updateUserAccess({
    role: 'viewer',
    status: 'active',
    permissions: ['dashboard:read'],
  });

  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/agent/action-requests',
    body: {
      requestType: 'prepare_execution_plan',
      targetId: 'ema-cross-us',
      requestedBy: 'agent',
    },
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.json.ok, false);
  assert.equal(response.json.error, 'forbidden');
  assert.equal(response.json.missingPermission, 'strategy:write');

  context.userAccount.updateUserAccess({
    role: 'admin',
    status: 'active',
    permissions: ['dashboard:read', 'strategy:write', 'risk:review', 'execution:approve', 'account:write'],
  });
});

test('GET /api/agent/action-requests returns persisted requests', async () => {
  context.agentActionRequests.appendAgentActionRequest({
    requestType: 'review_backtest',
    targetId: 'bt-ema-cross-20260310',
    status: 'pending_review',
    approvalState: 'pending',
    summary: 'Agent requests backtest review.',
    rationale: 'Drawdown breach needs review.',
    requestedBy: 'agent',
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/agent/action-requests',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(Array.isArray(response.json.requests), true);
  assert.equal(response.json.requests[0].requestType, 'review_backtest');
});

test('POST /api/agent/action-requests/approve queues downstream workflow only after approval', async () => {
  const createResponse = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/agent/action-requests',
    body: {
      requestType: 'prepare_execution_plan',
      targetId: 'ema-cross-us',
      summary: 'Agent asks for execution plan review.',
      rationale: 'Strategy score improved.',
      requestedBy: 'agent',
    },
  });

  const queuedRequestWorkflowId = createResponse.json.workflow.id;
  context.workflows.updateWorkflowRun(queuedRequestWorkflowId, {
    status: 'completed',
  });
  const request = context.agentActionRequests.appendAgentActionRequest({
    workflowRunId: queuedRequestWorkflowId,
    requestType: 'prepare_execution_plan',
    targetId: 'ema-cross-us',
    status: 'pending_review',
    approvalState: 'required',
    riskStatus: 'approved',
    summary: 'Pending review',
    rationale: 'Strategy score improved.',
    requestedBy: 'agent',
  });

  const approveResponse = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/agent/action-requests/${request.id}/approve`,
    body: {
      approvedBy: 'risk-operator',
      mode: 'paper',
      capital: 125000,
    },
  });

  assert.equal(approveResponse.statusCode, 200);
  assert.equal(approveResponse.json.request.status, 'approved');
  assert.equal(approveResponse.json.workflow.workflowId, 'task-orchestrator.strategy-execution');
});

test('POST /api/agent/action-requests/reject marks the request as rejected', async () => {
  const request = context.agentActionRequests.appendAgentActionRequest({
    requestType: 'review_backtest',
    targetId: 'bt-ema-cross-20260310',
    status: 'pending_review',
    approvalState: 'required',
    riskStatus: 'review',
    summary: 'Pending review',
    rationale: 'Review needed',
    requestedBy: 'agent',
  });

  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/agent/action-requests/${request.id}/reject`,
    body: {
      rejectedBy: 'risk-operator',
      reason: 'Not enough context',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.request.status, 'rejected');
  assert.equal(response.json.request.approvalState, 'rejected');
});

test('POST /api/agent/action-requests/:id/approve requires risk:review permission', async () => {
  const request = context.agentActionRequests.appendAgentActionRequest({
    requestType: 'prepare_execution_plan',
    targetId: 'ema-cross-us',
    status: 'pending_review',
    approvalState: 'required',
    riskStatus: 'approved',
    summary: 'Pending review',
    rationale: 'Strategy score improved.',
    requestedBy: 'agent',
  });

  context.userAccount.updateUserAccess({
    role: 'operator',
    status: 'active',
    permissions: ['dashboard:read', 'strategy:write'],
  });

  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/agent/action-requests/${request.id}/approve`,
    body: {
      approvedBy: 'operator-without-risk-review',
      mode: 'paper',
      capital: 125000,
    },
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.json.ok, false);
  assert.equal(response.json.error, 'forbidden');
  assert.equal(response.json.missingPermission, 'risk:review');

  context.userAccount.updateUserAccess({
    role: 'admin',
    status: 'active',
    permissions: ['dashboard:read', 'strategy:write', 'risk:review', 'execution:approve', 'account:write'],
  });
});

test('POST /api/strategy/execute queues a strategy execution workflow', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/strategy/execute',
    body: {
      strategyId: 'ema-cross-us',
      mode: 'paper',
      capital: 150000,
      requestedBy: 'api-test',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.workflow.workflowId, 'task-orchestrator.strategy-execution');
  assert.equal(response.json.workflow.status, 'queued');
});

test('POST /api/strategy/execute requires strategy:write permission', async () => {
  context.userAccount.updateUserAccess({
    role: 'viewer',
    status: 'active',
    permissions: ['dashboard:read'],
  });

  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/strategy/execute',
    body: {
      strategyId: 'ema-cross-us',
      mode: 'paper',
      capital: 150000,
      requestedBy: 'api-test',
    },
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.json.ok, false);
  assert.equal(response.json.error, 'forbidden');
  assert.equal(response.json.missingPermission, 'strategy:write');

  context.userAccount.updateUserAccess({
    role: 'admin',
    status: 'active',
    permissions: ['dashboard:read', 'strategy:write', 'risk:review', 'execution:approve', 'account:write'],
  });
});

test('GET /api/execution/plans returns persisted execution plans', async () => {
  context.executionPlans.appendExecutionPlan({
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    mode: 'paper',
    status: 'ready',
    lifecycleStatus: 'submitted',
    approvalState: 'not_required',
    riskStatus: 'approved',
    summary: 'Seed execution plan',
    capital: 100000,
    orderCount: 1,
    orders: [{ symbol: 'NVDA', side: 'BUY', qty: 10, weight: 1, rationale: 'seed' }],
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/execution/plans',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(Array.isArray(response.json.plans), true);
  assert.equal(response.json.plans[0].strategyId, 'ema-cross-us');
});

test('GET /api/execution/plans/:id returns a single execution plan with workflow and runtime context', async () => {
  context.workflows.appendWorkflowRun({
    id: 'exec-plan-workflow-detail',
    workflowId: 'task-orchestrator.strategy-execution',
    workflowType: 'task-orchestrator',
    status: 'running',
  });
  context.executionPlans.appendExecutionPlan({
    id: 'exec-plan-detail',
    workflowRunId: 'exec-plan-workflow-detail',
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    mode: 'paper',
    status: 'ready',
    lifecycleStatus: 'submitted',
    approvalState: 'required',
    riskStatus: 'review',
    summary: 'detail plan',
    capital: 90000,
    orderCount: 1,
    orders: [{ symbol: 'MSFT', side: 'BUY', qty: 10, weight: 1, rationale: 'trend' }],
  });
  context.executionRuntime.appendExecutionRuntimeEvent({
    cycle: 51,
    executionPlanId: 'exec-plan-detail',
    executionRunId: 'exec-run-detail',
    mode: 'paper',
    brokerAdapter: 'simulated',
    brokerConnected: true,
    marketConnected: true,
    submittedOrderCount: 1,
    rejectedOrderCount: 0,
    openOrderCount: 1,
    positionCount: 1,
    cash: 50000,
    buyingPower: 90000,
    equity: 90500,
    message: 'detail runtime',
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/execution/plans/exec-plan-detail',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.plan.id, 'exec-plan-detail');
  assert.equal(response.json.workflow.id, 'exec-plan-workflow-detail');
  assert.equal(response.json.latestRuntime.submittedOrderCount, 1);
  assert.equal(Array.isArray(response.json.orderStates), true);
});

test('GET /api/execution/plans/:id returns 404 for unknown plans', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/execution/plans/unknown-plan-id',
  });

  assert.equal(response.statusCode, 404);
  assert.equal(response.json.ok, false);
});

test('GET /api/execution/runtime returns persisted execution runtime events', async () => {
  context.executionRuntime.appendExecutionRuntimeEvent({
    cycle: 21,
    mode: 'live',
    brokerAdapter: 'simulated',
    brokerConnected: true,
    marketConnected: true,
    submittedOrderCount: 1,
    positionCount: 2,
    equity: 101200,
    message: 'Execution runtime synced.',
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/execution/runtime',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.events[0].cycle, 21);
});

test('GET /api/execution/account-snapshots returns broker account snapshots', async () => {
  context.executionRuntime.appendBrokerAccountSnapshot({
    cycle: 21,
    provider: 'simulated',
    connected: true,
    account: { cash: 50000, buyingPower: 80000, equity: 101200 },
    positions: [],
    orders: [],
    message: 'Snapshot ok',
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/execution/account-snapshots',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.snapshots[0].provider, 'simulated');
});

test('GET /api/execution/account-snapshots/latest returns the latest broker snapshot', async () => {
  context.executionRuntime.appendBrokerAccountSnapshot({
    id: 'snapshot-old',
    cycle: 20,
    provider: 'simulated',
    connected: false,
    account: { cash: 10000, buyingPower: 10000, equity: 10000 },
    positions: [],
    orders: [],
    createdAt: '2026-03-11T09:00:00.000Z',
  });
  context.executionRuntime.appendBrokerAccountSnapshot({
    id: 'snapshot-new',
    cycle: 21,
    provider: 'simulated',
    connected: true,
    account: { cash: 50000, buyingPower: 80000, equity: 101200 },
    positions: [],
    orders: [],
    createdAt: '2026-03-11T09:10:00.000Z',
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/execution/account-snapshots/latest',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.snapshot.id, 'snapshot-new');
});

test('GET /api/execution/ledger returns plans joined with workflow and runtime state', async () => {
  const workflow = context.workflows.appendWorkflowRun({
    id: 'workflow-ledger-1',
    workflowId: 'task-orchestrator.strategy-execution',
    status: 'completed',
  });
  const plan = context.executionPlans.appendExecutionPlan({
    id: 'plan-ledger-1',
    workflowRunId: workflow.id,
    strategyId: 'ema-cross-us',
    strategyName: 'EMA Cross US',
    mode: 'live',
    status: 'ready',
    lifecycleStatus: 'awaiting_approval',
    approvalState: 'required',
    riskStatus: 'review',
    summary: 'Plan ready for review.',
    capital: 100000,
    orderCount: 2,
    orders: [],
  });
  context.executionRuntime.appendExecutionRuntimeEvent({
    cycle: 30,
    executionPlanId: plan.id,
    executionRunId: 'run-ledger-1',
    mode: 'live',
    brokerAdapter: 'simulated',
    brokerConnected: true,
    marketConnected: true,
    submittedOrderCount: 2,
    openOrderCount: 1,
    createdAt: new Date(new Date(plan.createdAt).getTime() + 60_000).toISOString(),
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/execution/ledger',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.entries[0].plan.id, 'plan-ledger-1');
  assert.equal(response.json.entries[0].workflow.status, 'completed');
  assert.equal(response.json.entries[0].latestRuntime.submittedOrderCount, 2);
  assert.equal(typeof response.json.entries[0].reconciliation?.status, 'string');
});

test('GET /api/execution/workbench returns lifecycle summary and execution ledger entries', async () => {
  context.executionPlans.appendExecutionPlan({
    id: 'exec-workbench-plan',
    strategyId: 'multi-factor-rotation',
    strategyName: 'Multi Factor Rotation',
    mode: 'paper',
    status: 'ready',
    lifecycleStatus: 'awaiting_approval',
    approvalState: 'required',
    riskStatus: 'approved',
    summary: 'Awaiting approval before routing.',
    capital: 88000,
    orderCount: 1,
    orders: [{ symbol: 'QQQ', side: 'BUY', qty: 12, weight: 1, rationale: 'seed' }],
  });
  context.executionRuns.appendExecutionRun({
    id: 'exec-workbench-run',
    executionPlanId: 'exec-workbench-plan',
    strategyId: 'multi-factor-rotation',
    strategyName: 'Multi Factor Rotation',
    mode: 'paper',
    lifecycleStatus: 'awaiting_approval',
    summary: 'Awaiting approval before routing.',
    owner: 'execution-desk',
    orderCount: 1,
  });
  context.executionPlans.appendExecutionPlan({
    id: 'exec-workbench-recovery-plan',
    strategyId: 'mean-revert-basket',
    strategyName: 'Mean Revert Basket',
    mode: 'live',
    status: 'ready',
    lifecycleStatus: 'cancelled',
    approvalState: 'not_required',
    riskStatus: 'approved',
    summary: 'Cancelled route awaiting recovery.',
    capital: 42000,
    orderCount: 1,
    orders: [{ symbol: 'IWM', side: 'BUY', qty: 9, weight: 1, rationale: 're-enter' }],
  });
  context.executionRuns.appendExecutionRun({
    id: 'exec-workbench-recovery-run',
    executionPlanId: 'exec-workbench-recovery-plan',
    strategyId: 'mean-revert-basket',
    strategyName: 'Mean Revert Basket',
    mode: 'live',
    lifecycleStatus: 'cancelled',
    summary: 'Cancelled route awaiting recovery.',
    owner: 'execution-desk',
    orderCount: 1,
    submittedOrderCount: 1,
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/execution/workbench',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(typeof response.json.summary.awaitingApproval, 'number');
  assert.equal(typeof response.json.summary.acknowledged, 'number');
  assert.equal(typeof response.json.summary.cancelled, 'number');
  assert.equal(typeof response.json.summary.totalOpenOrders, 'number');
  assert.equal(typeof response.json.summary.recoverablePlans, 'number');
  assert.equal(typeof response.json.summary.retryScheduledWorkflows, 'number');
  assert.equal(typeof response.json.summary.interventionNeeded, 'number');
  assert.equal(response.json.summary.recoverablePlans >= 1, true);
  assert.equal(Array.isArray(response.json.entries), true);
  assert.equal(response.json.entries.some((entry) => entry.plan.id === 'exec-workbench-plan'), true);
  assert.equal(response.json.entries.some((entry) => entry.recovery?.recommendedAction === 'reroute_orders'), true);
});

test('POST /api/execution/plans/:id/approve transitions awaiting plans into submitted lifecycle', async () => {
  context.executionPlans.appendExecutionPlan({
    id: 'exec-approve-plan',
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    mode: 'live',
    status: 'ready',
    lifecycleStatus: 'awaiting_approval',
    approvalState: 'required',
    riskStatus: 'approved',
    summary: 'Awaiting approval.',
    capital: 100000,
    orderCount: 2,
    orders: [
      { symbol: 'AAPL', side: 'BUY', qty: 10, weight: 0.5, rationale: 'trend' },
      { symbol: 'MSFT', side: 'BUY', qty: 8, weight: 0.5, rationale: 'trend' },
    ],
  });
  context.executionRuns.appendExecutionRun({
    id: 'exec-approve-run',
    executionPlanId: 'exec-approve-plan',
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    mode: 'live',
    lifecycleStatus: 'awaiting_approval',
    summary: 'Awaiting approval.',
    owner: 'execution-desk',
    orderCount: 2,
  });
  context.executionRuns.appendExecutionOrderStates([
    {
      id: 'exec-approve-order-1',
      executionPlanId: 'exec-approve-plan',
      executionRunId: 'exec-approve-run',
      symbol: 'AAPL',
      side: 'BUY',
      qty: 10,
      weight: 0.5,
      lifecycleStatus: 'planned',
      summary: 'waiting approval',
    },
    {
      id: 'exec-approve-order-2',
      executionPlanId: 'exec-approve-plan',
      executionRunId: 'exec-approve-run',
      symbol: 'MSFT',
      side: 'BUY',
      qty: 8,
      weight: 0.5,
      lifecycleStatus: 'planned',
      summary: 'waiting approval',
    },
  ]);

  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/execution/plans/exec-approve-plan/approve',
    body: {
      actor: 'execution-desk',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.plan.lifecycleStatus, 'submitted');
  assert.equal(response.json.executionRun.lifecycleStatus, 'submitted');
  assert.equal(response.json.orderStates.every((item) => item.lifecycleStatus === 'submitted'), true);
});

test('POST /api/execution/plans/:id/settle moves submitted plans into filled lifecycle', async () => {
  context.executionPlans.appendExecutionPlan({
    id: 'exec-settle-plan',
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    mode: 'paper',
    status: 'ready',
    lifecycleStatus: 'submitted',
    approvalState: 'not_required',
    riskStatus: 'approved',
    summary: 'Submitted into broker route.',
    capital: 100000,
    orderCount: 1,
    orders: [{ symbol: 'NVDA', side: 'BUY', qty: 5, weight: 1, rationale: 'trend' }],
  });
  context.executionRuns.appendExecutionRun({
    id: 'exec-settle-run',
    executionPlanId: 'exec-settle-plan',
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    mode: 'paper',
    lifecycleStatus: 'submitted',
    summary: 'Submitted into broker route.',
    owner: 'execution-desk',
    orderCount: 1,
    submittedOrderCount: 1,
  });
  context.executionRuns.appendExecutionOrderStates([
    {
      id: 'exec-settle-order-1',
      executionPlanId: 'exec-settle-plan',
      executionRunId: 'exec-settle-run',
      symbol: 'NVDA',
      side: 'BUY',
      qty: 5,
      weight: 1,
      lifecycleStatus: 'submitted',
      brokerOrderId: 'broker-exec-settle-1',
      summary: 'submitted',
      submittedAt: '2026-03-21T08:00:00.000Z',
    },
  ]);

  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/execution/plans/exec-settle-plan/settle',
    body: {
      actor: 'execution-desk',
      outcome: 'filled',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.plan.lifecycleStatus, 'filled');
  assert.equal(response.json.executionRun.lifecycleStatus, 'filled');
  assert.equal(response.json.orderStates[0].lifecycleStatus, 'filled');
});

test('POST /api/execution/plans/:id/sync advances submitted plans into broker acknowledged lifecycle', async () => {
  context.executionPlans.appendExecutionPlan({
    id: 'exec-sync-plan',
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    mode: 'paper',
    status: 'ready',
    lifecycleStatus: 'submitted',
    approvalState: 'not_required',
    riskStatus: 'approved',
    summary: 'Submitted into broker route.',
    capital: 100000,
    orderCount: 1,
    orders: [{ symbol: 'META', side: 'BUY', qty: 6, weight: 1, rationale: 'trend' }],
  });
  context.executionRuns.appendExecutionRun({
    id: 'exec-sync-run',
    executionPlanId: 'exec-sync-plan',
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    mode: 'paper',
    lifecycleStatus: 'submitted',
    summary: 'Submitted into broker route.',
    owner: 'execution-desk',
    orderCount: 1,
    submittedOrderCount: 1,
  });
  context.executionRuns.appendExecutionOrderStates([
    {
      id: 'exec-sync-order-1',
      executionPlanId: 'exec-sync-plan',
      executionRunId: 'exec-sync-run',
      symbol: 'META',
      side: 'BUY',
      qty: 6,
      weight: 1,
      lifecycleStatus: 'submitted',
      brokerOrderId: 'broker-exec-sync-1',
      summary: 'submitted',
      submittedAt: '2026-03-21T08:00:00.000Z',
    },
  ]);

  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/execution/plans/exec-sync-plan/sync',
    body: {
      actor: 'execution-desk',
      scenario: 'acknowledge',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.plan.lifecycleStatus, 'acknowledged');
  assert.equal(response.json.executionRun.lifecycleStatus, 'acknowledged');
  assert.equal(response.json.orderStates[0].lifecycleStatus, 'acknowledged');
});

test('POST /api/execution/plans/:id/cancel cancels active plans before settlement', async () => {
  context.executionPlans.appendExecutionPlan({
    id: 'exec-cancel-plan',
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    mode: 'live',
    status: 'ready',
    lifecycleStatus: 'acknowledged',
    approvalState: 'not_required',
    riskStatus: 'approved',
    summary: 'Broker acknowledged the route.',
    capital: 100000,
    orderCount: 1,
    orders: [{ symbol: 'AMZN', side: 'SELL', qty: 4, weight: 1, rationale: 'rebalance' }],
  });
  context.executionRuns.appendExecutionRun({
    id: 'exec-cancel-run',
    executionPlanId: 'exec-cancel-plan',
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    mode: 'live',
    lifecycleStatus: 'acknowledged',
    summary: 'Broker acknowledged the route.',
    owner: 'execution-desk',
    orderCount: 1,
    submittedOrderCount: 1,
  });
  context.executionRuns.appendExecutionOrderStates([
    {
      id: 'exec-cancel-order-1',
      executionPlanId: 'exec-cancel-plan',
      executionRunId: 'exec-cancel-run',
      symbol: 'AMZN',
      side: 'SELL',
      qty: 4,
      weight: 1,
      lifecycleStatus: 'acknowledged',
      brokerOrderId: 'broker-exec-cancel-1',
      summary: 'acknowledged',
      submittedAt: '2026-03-21T08:00:00.000Z',
      acknowledgedAt: '2026-03-21T08:01:00.000Z',
    },
  ]);

  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/execution/plans/exec-cancel-plan/cancel',
    body: {
      actor: 'execution-desk',
      reason: 'operator_cancelled',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.plan.lifecycleStatus, 'cancelled');
  assert.equal(response.json.executionRun.lifecycleStatus, 'cancelled');
  assert.equal(response.json.orderStates[0].lifecycleStatus, 'cancelled');
});

test('POST /api/execution/plans/:id/reconcile records structured reconciliation output', async () => {
  context.executionPlans.appendExecutionPlan({
    id: 'exec-reconcile-plan',
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    mode: 'paper',
    status: 'ready',
    lifecycleStatus: 'filled',
    approvalState: 'not_required',
    riskStatus: 'approved',
    summary: 'Execution completed.',
    capital: 100000,
    orderCount: 1,
    orders: [{ symbol: 'AAPL', side: 'BUY', qty: 5, weight: 1, rationale: 'trend' }],
  });
  context.executionRuns.appendExecutionRun({
    id: 'exec-reconcile-run',
    executionPlanId: 'exec-reconcile-plan',
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    mode: 'paper',
    lifecycleStatus: 'filled',
    summary: 'Execution completed.',
    owner: 'execution-desk',
    orderCount: 1,
    submittedOrderCount: 1,
    filledOrderCount: 1,
  });
  context.executionRuns.appendExecutionOrderStates([
    {
      id: 'exec-reconcile-order-1',
      executionPlanId: 'exec-reconcile-plan',
      executionRunId: 'exec-reconcile-run',
      symbol: 'AAPL',
      side: 'BUY',
      qty: 5,
      weight: 1,
      lifecycleStatus: 'filled',
      brokerOrderId: 'broker-exec-reconcile-1',
      filledQty: 5,
      avgFillPrice: 181.5,
      summary: 'filled',
      submittedAt: '2026-03-21T08:00:00.000Z',
      acknowledgedAt: '2026-03-21T08:01:00.000Z',
      filledAt: '2026-03-21T08:02:00.000Z',
    },
  ]);
  context.executionRuntime.appendBrokerAccountSnapshot({
    id: 'exec-reconcile-snapshot',
    cycleId: 'cycle-1',
    cycle: 1,
    executionPlanId: 'exec-reconcile-plan',
    executionRunId: 'exec-reconcile-run',
    provider: 'simulated',
    connected: true,
    account: { cash: 90000, buyingPower: 90000, equity: 100000 },
    positions: [{ symbol: 'AAPL', qty: 3, avgCost: 181.5 }],
    orders: [{ id: 'broker-exec-reconcile-1', symbol: 'AAPL', side: 'BUY', qty: 5, filledQty: 5, status: 'filled' }],
    message: 'snapshot synced',
    createdAt: '2026-03-21T08:03:00.000Z',
  });

  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/execution/plans/exec-reconcile-plan/reconcile',
    body: {
      actor: 'execution-desk',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.reconciliation.status, 'attention');
  assert.equal(response.json.reconciliation.issueCount > 0, true);
});

test('POST /api/execution/plans/:id/recover reroutes cancelled plans back into execution flow', async () => {
  context.executionPlans.appendExecutionPlan({
    id: 'exec-recover-plan',
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    mode: 'live',
    status: 'ready',
    lifecycleStatus: 'cancelled',
    approvalState: 'not_required',
    riskStatus: 'approved',
    summary: 'Cancelled after broker reject.',
    capital: 100000,
    orderCount: 1,
    orders: [{ symbol: 'AAPL', side: 'BUY', qty: 5, weight: 1, rationale: 'recover route' }],
  });
  context.executionRuns.appendExecutionRun({
    id: 'exec-recover-run',
    executionPlanId: 'exec-recover-plan',
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    mode: 'live',
    lifecycleStatus: 'cancelled',
    summary: 'Cancelled after broker reject.',
    owner: 'execution-desk',
    orderCount: 1,
    submittedOrderCount: 1,
    rejectedOrderCount: 1,
  });
  context.executionRuns.appendExecutionOrderStates([
    {
      id: 'exec-recover-order-1',
      executionPlanId: 'exec-recover-plan',
      executionRunId: 'exec-recover-run',
      symbol: 'AAPL',
      side: 'BUY',
      qty: 5,
      weight: 1,
      lifecycleStatus: 'cancelled',
      brokerOrderId: 'broker-exec-recover-1',
      filledQty: 0,
      summary: 'cancelled by broker',
      submittedAt: '2026-03-21T09:00:00.000Z',
      acknowledgedAt: '2026-03-21T09:01:00.000Z',
    },
  ]);

  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/execution/plans/exec-recover-plan/recover',
    body: {
      actor: 'execution-desk',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.recoveryAction, 'reroute_orders');
  assert.equal(response.json.plan.lifecycleStatus, 'submitted');
  assert.equal(response.json.executionRun.lifecycleStatus, 'submitted');
  assert.equal(response.json.orderStates[0].lifecycleStatus, 'submitted');
  assert.equal(response.json.orderStates[0].filledQty, 0);
});

test('POST /api/task-orchestrator/workflows/:id/resume emits workflow-control notification for recovery', async () => {
  const queued = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/strategy/execute',
    body: {
      strategyId: 'ema-cross-us',
      mode: 'live',
      capital: 150000,
      requestedBy: 'api-test',
    },
  });

  context.workflows.updateWorkflowRun(queued.json.workflow.id, {
    status: 'failed',
    error: 'seeded failure',
  });

  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/task-orchestrator/workflows/${queued.json.workflow.id}/resume`,
    body: {},
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.workflow.status, 'queued');
  assert.equal(context.notifications.listNotificationJobs().some((item) => item.payload.source === 'workflow-control'), true);
});

test('GET /api/scheduler/ticks returns scheduler ticks from shared store', async () => {
  const recentIntradayIso = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const olderPostCloseIso = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString();
  context.scheduler.recordSchedulerTick({
    id: 'scheduler-tick-intraday',
    worker: 'api-test-worker',
    phase: 'INTRADAY',
    status: 'steady',
    title: 'Scheduler tick intraday',
    message: 'intraday tick',
    createdAt: recentIntradayIso,
  });
  context.scheduler.recordSchedulerTick({
    id: 'scheduler-tick-post-close',
    worker: 'api-test-worker',
    phase: 'POST_CLOSE',
    status: 'phase-change',
    title: 'Scheduler entered post close',
    message: 'post-close tick',
    createdAt: olderPostCloseIso,
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/scheduler/ticks',
  });
  const filteredResponse = await invokeGatewayRoute(handler, {
    path: '/api/scheduler/ticks?phase=INTRADAY&hours=168&limit=5',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ticks.length >= 1, true);
  assert.equal(response.json.ticks[0].id, 'scheduler-tick-intraday');
  assert.equal(filteredResponse.statusCode, 200);
  assert.equal(filteredResponse.json.ticks.length, 1);
  assert.equal(filteredResponse.json.ticks[0].id, 'scheduler-tick-intraday');
});

test('POST then GET /api/task-orchestrator/actions persists operator actions', async () => {
  const recentWarnIso = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const createResponse = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/actions',
    body: {
      type: 'approve-intent',
      actor: 'api-test',
      title: 'Approve from API test',
      detail: 'approved via gateway route',
      symbol: 'AAPL',
      level: 'info',
    },
  });
  const listResponse = await invokeGatewayRoute(handler, {
    path: '/api/task-orchestrator/actions',
  });

  assert.equal(createResponse.statusCode, 200);
  assert.equal(createResponse.json.action.title, 'Approve from API test');
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.json.actions.some((item) => item.id === createResponse.json.action.id), true);

  context.operatorActions.appendOperatorAction({
    id: 'operator-action-warn',
    type: 'reject-intent',
    actor: 'risk-operator',
    title: 'Rejected for review',
    detail: 'rejected due to risk controls',
    symbol: 'TSLA',
    level: 'warn',
    createdAt: recentWarnIso,
  });

  const filteredResponse = await invokeGatewayRoute(handler, {
    path: '/api/task-orchestrator/actions?level=warn&hours=48&limit=5',
  });

  assert.equal(filteredResponse.statusCode, 200);
  assert.equal(filteredResponse.json.actions.some((item) => item.id === 'operator-action-warn'), true);
});

test('POST /api/task-orchestrator/actions requires execution:approve permission', async () => {
  context.userAccount.updateUserAccess({
    role: 'operator',
    status: 'active',
    permissions: ['dashboard:read', 'strategy:write', 'risk:review'],
  });

  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/actions',
    body: {
      type: 'approve-intent',
      actor: 'api-test',
      title: 'Blocked approval',
      detail: 'approved via gateway route',
      symbol: 'AAPL',
      level: 'info',
    },
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.json.ok, false);
  assert.equal(response.json.error, 'forbidden');
  assert.equal(response.json.missingPermission, 'execution:approve');

  context.userAccount.updateUserAccess({
    role: 'admin',
    status: 'active',
    permissions: ['dashboard:read', 'strategy:write', 'risk:review', 'execution:approve', 'account:write'],
  });
});

test('GET /api/health exposes gateway module status', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/health',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.brokerAdapter, 'alpaca');
  assert.equal(response.json.architectureLayers, 7);
  assert.equal(typeof response.json.modules, 'number');
});

test('GET /api/monitoring/status returns runtime health and queue summary', async () => {
  const nowIso = new Date().toISOString();
  context.marketProviders.updateMarketProviderStatus({
    provider: 'alpaca',
    connected: true,
    fallback: false,
    message: 'market provider synced from backend',
    symbolCount: 12,
    asOf: nowIso,
  });
  context.workflows.appendWorkflowRun({
    id: 'workflow-monitoring-failed',
    workflowId: 'task-orchestrator.strategy-execution',
    status: 'failed',
    actor: 'api-test',
    trigger: 'api',
    error: 'simulated workflow failure',
    startedAt: nowIso,
    updatedAt: nowIso,
    createdAt: nowIso,
  });
  context.agentActionRequests.appendAgentActionRequest({
    id: 'agent-review-monitoring',
    requestType: 'execution-plan',
    targetId: 'plan-1',
    status: 'pending_review',
    approvalState: 'pending',
    riskStatus: 'pending',
    requestedBy: 'agent',
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  context.notifications.enqueueNotification({
    id: 'monitoring-notification-job',
    title: 'Pending delivery',
    message: 'waiting for worker dispatch',
    source: 'test',
  });
  context.risk.enqueueRiskScan({
    id: 'monitoring-risk-job',
    cycle: 99,
    pendingApprovals: 1,
    brokerConnected: true,
    marketConnected: true,
  });
  context.risk.appendRiskEvent({
    id: 'monitoring-risk-event',
    status: 'risk-off',
    level: 'critical',
    title: 'Risk off',
    message: 'risk off triggered in test',
    cycle: 99,
    createdAt: nowIso,
  });
  context.workerHeartbeats.recordWorkerHeartbeat({
    id: 'worker-heartbeat-monitoring',
    worker: 'quantpilot-task-worker',
    summary: 'worker heartbeat',
    createdAt: nowIso,
  });
  context.store.writeCollection('scheduler-ticks.json', [{
    id: 'scheduler-monitoring-tick',
    phase: 'INTRADAY',
    status: 'steady',
    title: 'Scheduler tick',
    message: 'scheduler tick',
    worker: 'quantpilot-task-worker',
    createdAt: nowIso,
    metadata: {},
  }]);

  const response = await invokeGatewayRoute(handler, {
    path: '/api/monitoring/status',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.status, 'critical');
  assert.equal(response.json.services.market.status, 'healthy');
  assert.equal(response.json.services.worker.status, 'healthy');
  assert.equal(response.json.services.worker.latestHeartbeat.id, 'worker-heartbeat-monitoring');
  assert.equal(response.json.services.workflows.failed >= 1, true);
  assert.equal(response.json.services.queues.pendingNotificationJobs >= 1, true);
  assert.equal(response.json.services.queues.pendingRiskScanJobs >= 1, true);
  assert.equal(response.json.services.queues.pendingAgentReviews >= 1, true);
  assert.equal(response.json.services.risk.riskOff >= 1, true);
  assert.equal(response.json.alerts.some((item) => item.source === 'workflow' && item.level === 'critical'), true);
  assert.equal(response.json.recent.latestWorkerHeartbeat.id, 'worker-heartbeat-monitoring');
  assert.equal(response.json.recent.latestSchedulerTick.id, 'scheduler-monitoring-tick');
});

test('GET /api/monitoring/snapshots and alerts return persisted monitoring history', async () => {
  const recentSnapshotIso = new Date(Date.now() - 90 * 60 * 1000).toISOString();
  const olderSnapshotIso = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString();
  context.monitoring.recordMonitoringSnapshot({
    id: 'monitoring-snapshot-test',
    status: 'warn',
    generatedAt: recentSnapshotIso,
    services: {
      worker: { status: 'warn' },
    },
    alerts: [
      {
        id: 'monitoring-alert-test',
        level: 'warn',
        source: 'worker',
        message: 'Worker heartbeat is stale.',
      },
    ],
  });
  context.monitoring.recordMonitoringSnapshot({
    id: 'monitoring-snapshot-ok',
    status: 'healthy',
    generatedAt: olderSnapshotIso,
    services: {
      worker: { status: 'healthy' },
    },
    alerts: [
      {
        id: 'monitoring-alert-ok',
        level: 'info',
        source: 'worker',
        message: 'Worker heartbeat healthy.',
      },
    ],
  });

  const snapshotsResponse = await invokeGatewayRoute(handler, {
    path: '/api/monitoring/snapshots',
  });
  const alertsResponse = await invokeGatewayRoute(handler, {
    path: '/api/monitoring/alerts',
  });

  assert.equal(snapshotsResponse.statusCode, 200);
  assert.equal(snapshotsResponse.json.ok, true);
  assert.equal(snapshotsResponse.json.snapshots[0].id, 'monitoring-snapshot-test');
  assert.equal(alertsResponse.statusCode, 200);
  assert.equal(alertsResponse.json.ok, true);
  assert.equal(alertsResponse.json.alerts[0].id, 'monitoring-alert-test');

  const filteredSnapshots = await invokeGatewayRoute(handler, {
    path: '/api/monitoring/snapshots?status=warn&hours=168&limit=5',
  });
  const filteredAlerts = await invokeGatewayRoute(handler, {
    path: '/api/monitoring/alerts?source=worker&level=warn&snapshotId=monitoring-snapshot-test&hours=168&limit=5',
  });

  assert.equal(filteredSnapshots.statusCode, 200);
  assert.equal(filteredSnapshots.json.snapshots.length, 1);
  assert.equal(filteredSnapshots.json.snapshots[0].id, 'monitoring-snapshot-test');
  assert.equal(filteredAlerts.statusCode, 200);
  assert.equal(filteredAlerts.json.alerts.length, 1);
  assert.equal(filteredAlerts.json.alerts[0].id, 'monitoring-alert-test');
});

test('GET /api/operations/workbench returns unified operations overview', async () => {
  const nowIso = new Date().toISOString();
  context.marketProviders.updateMarketProviderStatus({
    provider: 'alpaca',
    connected: false,
    fallback: true,
    message: 'market provider fallback in operations workbench',
    symbolCount: 8,
    asOf: nowIso,
  });
  context.workerHeartbeats.recordWorkerHeartbeat({
    id: 'worker-heartbeat-operations',
    worker: 'quantpilot-task-worker',
    summary: 'worker heartbeat',
    createdAt: nowIso,
  });
  context.notifications.appendNotification({
    id: 'operations-notification',
    level: 'warn',
    title: 'Control-plane warning',
    message: 'queue pressure is increasing',
    source: 'control-plane',
    createdAt: nowIso,
  });
  context.audit.appendAuditRecord({
    id: 'operations-audit',
    type: 'workflow',
    actor: 'api-test',
    title: 'Workflow reviewed',
    detail: 'workflow needs manual follow-up',
    createdAt: nowIso,
  });
  context.scheduler.recordSchedulerTick({
    id: 'operations-scheduler',
    phase: 'INTRADAY',
    status: 'warn',
    title: 'Scheduler attention',
    message: 'scheduler slipped from expected cadence',
    worker: 'quantpilot-task-worker',
    createdAt: nowIso,
  });
  context.monitoring.recordMonitoringSnapshot({
    id: 'operations-snapshot',
    status: 'critical',
    generatedAt: nowIso,
    services: {
      worker: { status: 'healthy' },
    },
    alerts: [
      {
        id: 'operations-alert',
        level: 'critical',
        source: 'queue',
        message: 'notification backlog is critical',
      },
    ],
  });
  context.incidents.appendIncident({
    id: 'operations-incident',
    title: 'Operations incident',
    summary: 'Escalated from operations workbench',
    severity: 'critical',
    source: 'monitoring',
    status: 'open',
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/operations/workbench?hours=24&limit=50',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(typeof response.json.summary.criticalSignals, 'number');
  assert.equal(response.json.summary.openIncidents >= 1, true);
  assert.equal(response.json.lanes.some((item) => item.key === 'monitoring'), true);
  assert.equal(response.json.lanes.some((item) => item.key === 'incidents'), true);
  assert.equal(response.json.runbook.some((item) => item.key === 'stabilize-connectivity'), true);
  assert.equal(response.json.runbook.some((item) => item.key === 'triage-critical-incidents'), true);
  assert.equal(response.json.recent.incident.id, 'operations-incident');
  assert.equal(typeof response.json.recent.notification.title, 'string');
  assert.equal(typeof response.json.recent.notification.source, 'string');
  assert.equal(response.json.recent.auditRecord.id, 'operations-audit');
  assert.equal(response.json.recent.schedulerTick.id, 'operations-scheduler');
});

test('incident routes create, update, and return incident details', async () => {
  context.monitoring.recordMonitoringSnapshot({
    id: 'incident-monitoring-snapshot',
    status: 'warn',
    generatedAt: '2026-03-16T08:00:00.000Z',
    alerts: [{
      id: 'incident-monitoring-alert',
      level: 'warn',
      source: 'worker',
      message: 'Worker lag exceeded threshold.',
    }],
  });
  context.notifications.appendNotification({
    id: 'incident-notification',
    title: 'Worker degraded',
    message: 'Worker queue is starting to backlog.',
    source: 'task-orchestrator',
    level: 'warn',
    createdAt: '2026-03-16T08:05:00.000Z',
  });
  context.audit.appendAuditRecord({
    id: 'incident-audit',
    type: 'workflow',
    actor: 'api-test',
    title: 'Workflow paused',
    detail: 'Workflow paused because worker lag is too high.',
    createdAt: '2026-03-16T08:06:00.000Z',
  });
  context.operatorActions.appendOperatorAction({
    id: 'incident-action',
    type: 'restart-worker',
    actor: 'api-operator',
    title: 'Restart worker',
    detail: 'Worker restarted after lag alert.',
    level: 'warn',
    createdAt: '2026-03-16T08:08:00.000Z',
  });
  context.scheduler.recordSchedulerTick({
    id: 'incident-scheduler-tick',
    phase: 'INTRADAY',
    title: 'Scheduler tick INTRADAY',
    message: 'Scheduler tick captured while worker lag was elevated.',
    status: 'steady',
    createdAt: '2026-03-16T08:09:00.000Z',
  });
  context.risk.appendRiskEvent({
    id: 'incident-risk-event',
    level: 'critical',
    status: 'risk-off',
    title: 'Risk-off engaged',
    message: 'Risk engine disabled live trading after repeated disconnects.',
    cycle: 188,
    riskLevel: 'RISK OFF',
    source: 'risk-monitor',
    createdAt: '2026-03-16T08:10:00.000Z',
  });
  context.workflows.appendWorkflowRun({
    id: 'incident-workflow-run',
    workflowId: 'task-orchestrator.state-run',
    workflowType: 'task-orchestrator',
    status: 'failed',
    actor: 'worker-test',
    trigger: 'worker',
    createdAt: '2026-03-16T08:11:00.000Z',
    updatedAt: '2026-03-16T08:11:30.000Z',
    error: 'worker lag forced a retry',
    metadata: {
      workflowRunId: 'incident-workflow-run',
      summary: 'Worker lag blocked state runner.',
    },
  });
  context.executionPlans.appendExecutionPlan({
    id: 'incident-execution-plan',
    workflowRunId: 'incident-workflow-run',
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    mode: 'paper',
    status: 'blocked',
    approvalState: 'required',
    riskStatus: 'blocked',
    summary: 'Execution plan blocked by risk review.',
    capital: 100000,
    orderCount: 2,
    orders: [],
    createdAt: '2026-03-16T08:12:00.000Z',
    updatedAt: '2026-03-16T08:12:30.000Z',
    metadata: {
      executionPlanId: 'incident-execution-plan',
    },
  });

  const created = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/incidents',
    body: {
      id: 'incident-api-test',
      title: 'Queue backlog incident',
      summary: 'Notification queue backlog exceeded threshold.',
      severity: 'warn',
      source: 'monitoring',
      owner: 'api-operator',
      initialNote: 'Created from API test.',
      links: [
        { kind: 'monitoring-alert', alertId: 'incident-monitoring-alert', snapshotId: 'incident-monitoring-snapshot' },
        { kind: 'notification', notificationId: 'incident-notification' },
        { kind: 'audit', auditId: 'incident-audit' },
        { kind: 'operator-action', actionId: 'incident-action' },
        { kind: 'scheduler-tick', tickId: 'incident-scheduler-tick' },
        { kind: 'risk-event', riskEventId: 'incident-risk-event' },
        { kind: 'workflow-run', workflowRunId: 'incident-workflow-run' },
        { kind: 'execution-plan', executionPlanId: 'incident-execution-plan', workflowRunId: 'incident-workflow-run' },
      ],
      metadata: {
        monitoringAlertId: 'incident-monitoring-alert',
        notificationId: 'incident-notification',
        auditId: 'incident-audit',
        operatorActionId: 'incident-action',
        schedulerTickId: 'incident-scheduler-tick',
        riskEventId: 'incident-risk-event',
        workflowRunId: 'incident-workflow-run',
        executionPlanId: 'incident-execution-plan',
      },
    },
  });
  const listed = await invokeGatewayRoute(handler, {
    path: '/api/incidents?status=open&severity=warn&source=monitoring&hours=168&limit=5',
  });
  const summary = await invokeGatewayRoute(handler, {
    path: '/api/incidents/summary?hours=168&limit=20',
  });
  const updated = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/incidents/incident-api-test',
    body: {
      status: 'investigating',
      actor: 'api-operator',
    },
  });
  const noted = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/incidents/incident-api-test/notes',
    body: {
      author: 'api-operator',
      body: 'Queue was drained by worker retry.',
    },
  });
  const bulk = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/incidents/bulk',
    body: {
      actor: 'api-operator',
      incidentIds: ['incident-api-test'],
      note: 'Bulk action note',
      owner: 'ops-bulk',
      status: 'mitigated',
    },
  });
  const seededTaskId = context.incidents.listIncidentTasks('incident-api-test', 10)[0].id;
  const createdTask = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/incidents/incident-api-test/tasks',
    body: {
      actor: 'api-operator',
      detail: 'Double-check fallback queue drain metrics.',
      owner: 'api-operator',
      title: 'Validate queue recovery',
    },
  });
  const updatedTask = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/incidents/incident-api-test/tasks/${seededTaskId}`,
    body: {
      actor: 'api-operator',
      status: 'done',
    },
  });
  const detail = await invokeGatewayRoute(handler, {
    path: '/api/incidents/incident-api-test',
  });

  assert.equal(created.statusCode, 200);
  assert.equal(created.json.incident.id, 'incident-api-test');
  assert.equal(listed.statusCode, 200);
  assert.equal(listed.json.incidents[0].id, 'incident-api-test');
  assert.equal(summary.statusCode, 200);
  assert.equal(summary.json.summary.total >= 1, true);
  assert.equal(summary.json.summary.byOwner.some((item) => item.owner === 'api-operator'), true);
  assert.equal(typeof summary.json.summary.response.ackOverdue, 'number');
  assert.equal(typeof summary.json.summary.response.blockedTasks, 'number');
  assert.equal(summary.json.summary.nextActions.some((item) => item.key === 'closeout'), true);
  assert.equal(updated.statusCode, 200);
  assert.equal(updated.json.incident.status, 'investigating');
  assert.equal(noted.statusCode, 200);
  assert.equal(noted.json.note.incidentId, 'incident-api-test');
  assert.equal(bulk.statusCode, 200);
  assert.equal(bulk.json.updatedIds.includes('incident-api-test'), true);
  assert.equal(bulk.json.notesAdded, 1);
  assert.equal(createdTask.statusCode, 200);
  assert.equal(createdTask.json.task.title, 'Validate queue recovery');
  assert.equal(updatedTask.statusCode, 200);
  assert.equal(updatedTask.json.task.status, 'done');
  assert.equal(detail.statusCode, 200);
  assert.equal(detail.json.incident.id, 'incident-api-test');
  assert.equal(detail.json.incident.owner, 'ops-bulk');
  assert.equal(detail.json.incident.status, 'mitigated');
  assert.equal(detail.json.notes.length >= 2, true);
  assert.equal(detail.json.tasks.summary.total >= 5, true);
  assert.equal(detail.json.tasks.items.some((item) => item.title === 'Validate queue recovery'), true);
  assert.equal(detail.json.activity.summary.total >= 4, true);
  assert.equal(detail.json.activity.timeline.some((item) => item.kind === 'opened'), true);
  assert.equal(detail.json.activity.timeline.some((item) => item.kind === 'status-changed'), true);
  assert.equal(detail.json.activity.timeline.some((item) => item.kind === 'owner-changed'), true);
  assert.equal(detail.json.activity.timeline.some((item) => item.kind === 'note-added'), true);
  assert.equal(detail.json.activity.timeline.some((item) => item.kind === 'task-updated'), true);
  assert.equal(detail.json.evidence.summary.total >= 5, true);
  assert.equal(detail.json.evidence.summary.linked >= 5, true);
  assert.equal(detail.json.evidence.timeline.some((item) => item.kind === 'monitoring-alert' && item.id === 'incident-monitoring-alert'), true);
  assert.equal(detail.json.evidence.timeline.some((item) => item.kind === 'notification' && item.id === 'incident-notification'), true);
  assert.equal(detail.json.evidence.timeline.some((item) => item.kind === 'audit' && item.id === 'incident-audit'), true);
  assert.equal(detail.json.evidence.timeline.some((item) => item.kind === 'risk-event' && item.id === 'incident-risk-event'), true);
  assert.equal(detail.json.evidence.timeline.some((item) => item.kind === 'workflow-run' && item.id === 'incident-workflow-run'), true);
  assert.equal(detail.json.evidence.timeline.some((item) => item.kind === 'execution-plan' && item.id === 'incident-execution-plan'), true);
  assert.equal(detail.json.operations.ackState, 'acknowledged');
  assert.equal(detail.json.operations.linkedEvidence >= 5, true);
  assert.equal(detail.json.operations.nextAction.key, 'closeout');
  assert.equal(detail.json.operations.handoff.owner, 'ops-bulk');
});

test('POST then GET /api/audit/records persists audit entries', async () => {
  const recentAuditAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const createResponse = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/audit/records',
    body: {
      type: 'test-audit',
      actor: 'api-test',
      title: 'Audit from API test',
      detail: 'audit record created through gateway route',
    },
  });
  const listResponse = await invokeGatewayRoute(handler, {
    path: '/api/audit/records',
  });

  assert.equal(createResponse.statusCode, 200);
  assert.equal(createResponse.json.record.title, 'Audit from API test');
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.json.records.some((item) => item.id === createResponse.json.record.id), true);

  context.audit.appendAuditRecord({
    id: 'audit-workflow-test',
    type: 'workflow',
    actor: 'worker-test',
    title: 'Workflow audit',
    detail: 'workflow audit test record',
    createdAt: recentAuditAt,
  });

  const filteredResponse = await invokeGatewayRoute(handler, {
    path: '/api/audit/records?type=workflow&hours=48&limit=5',
  });

  assert.equal(filteredResponse.statusCode, 200);
  assert.equal(filteredResponse.json.records.some((item) => item.id === 'audit-workflow-test'), true);
});

test('POST then GET /api/task-orchestrator/cycles persists cycle records', async () => {
  const createResponse = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/cycles',
    body: {
      cycle: 21,
      mode: 'hybrid',
      riskLevel: 'NORMAL',
      decisionSummary: 'cycle created from API test',
      marketClock: '2026-03-10 09:30:00',
      pendingApprovals: 0,
      liveIntentCount: 0,
      brokerConnected: true,
      marketConnected: true,
    },
  });
  const listResponse = await invokeGatewayRoute(handler, {
    path: '/api/task-orchestrator/cycles',
  });

  assert.equal(createResponse.statusCode, 200);
  assert.equal(createResponse.json.cycle.cycle, 21);
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.json.cycles.some((item) => item.id === createResponse.json.cycle.id), true);
  assert.equal(context.audit.listAuditRecords().some((item) => item.title.includes('Cycle 21 completed')), true);
  assert.equal(context.notifications.listNotificationJobs().length >= 0, true);
});

test('POST /api/task-orchestrator/cycles/run returns control plane resolution', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/cycles/run',
    body: {
      cycle: 22,
      mode: 'autopilot',
      riskLevel: 'NORMAL',
      decisionSummary: 'resolution route test',
      marketClock: '2026-03-10 09:35:00',
      pendingApprovals: 0,
      liveIntentCount: 0,
      brokerConnected: true,
      marketConnected: true,
      liveTradeEnabled: false,
      pendingLiveIntents: [],
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.controlPlane.lastStatus, 'HEALTHY');
  assert.equal(response.json.brokerExecution.message, 'test broker execution ok');
  assert.equal(response.json.workflow.workflowId, 'task-orchestrator.cycle-run');
  assert.equal(response.json.workflow.status, 'completed');
});

test('POST /api/task-orchestrator/cycles queues review notifications when approvals are pending', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/cycles',
    body: {
      cycle: 23,
      mode: 'autopilot',
      riskLevel: 'NORMAL',
      decisionSummary: 'pending approvals route test',
      marketClock: '2026-03-10 09:40:00',
      pendingApprovals: 2,
      liveIntentCount: 2,
      brokerConnected: true,
      marketConnected: true,
    },
  });

  const notificationJobs = context.notifications.listNotificationJobs();

  assert.equal(response.statusCode, 200);
  assert.equal(notificationJobs.some((job) => job.payload.title.includes('requires approval')), true);
});

test('POST /api/task-orchestrator/state/run returns next state and enqueues risk scan', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/state/run',
    body: {
      state: createTradingState(),
    },
  });

  const riskJobs = context.risk.listRiskScanJobs();

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.state.cycle, 1);
  assert.equal(response.json.resolution.ok, true);
  assert.equal(response.json.state.integrationStatus.marketData.message, 'test market snapshot ok');
  assert.equal(response.json.workflow.workflowId, 'task-orchestrator.state-run');
  assert.equal(response.json.workflow.status, 'completed');
  assert.equal(riskJobs.length >= 1, true);
  assert.equal(riskJobs[0].payload.source, 'state-runner');
});

test('GET /api/task-orchestrator/workflows returns persisted workflow runs', async () => {
  await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/cycles/run',
    body: {
      cycle: 24,
      mode: 'autopilot',
      riskLevel: 'NORMAL',
      decisionSummary: 'workflow list route test',
      marketClock: '2026-03-10 09:45:00',
      pendingApprovals: 0,
      liveIntentCount: 0,
      brokerConnected: true,
      marketConnected: true,
      liveTradeEnabled: false,
      pendingLiveIntents: [],
    },
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/task-orchestrator/workflows',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.workflows.some((item) => item.workflowId === 'task-orchestrator.cycle-run'), true);
});

test('GET /api/task-orchestrator/workflows/:id returns a persisted workflow run', async () => {
  const cycleRun = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/cycles/run',
    body: {
      cycle: 25,
      mode: 'autopilot',
      riskLevel: 'NORMAL',
      decisionSummary: 'workflow detail route test',
      marketClock: '2026-03-10 09:50:00',
      pendingApprovals: 0,
      liveIntentCount: 0,
      brokerConnected: true,
      marketConnected: true,
      liveTradeEnabled: false,
      pendingLiveIntents: [],
    },
  });

  const response = await invokeGatewayRoute(handler, {
    path: `/api/task-orchestrator/workflows/${cycleRun.json.workflow.id}`,
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.workflow.id, cycleRun.json.workflow.id);
  assert.equal(response.json.workflow.workflowId, 'task-orchestrator.cycle-run');
});

test('POST /api/task-orchestrator/workflows/queue creates a queued workflow run', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/workflows/queue',
    body: {
      workflowId: 'task-orchestrator.manual-review',
      workflowType: 'task-orchestrator',
      actor: 'api-test',
      trigger: 'manual',
      payload: { symbol: 'AAPL' },
      maxAttempts: 2,
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.workflow.status, 'queued');
  assert.equal(response.json.workflow.workflowId, 'task-orchestrator.manual-review');
});

test('POST /api/task-orchestrator/cycles/queue creates a queued cycle workflow', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/cycles/queue',
    body: {
      cycle: 26,
      mode: 'hybrid',
      riskLevel: 'NORMAL',
      decisionSummary: 'queued cycle route test',
      marketClock: '2026-03-10 10:10:00',
      pendingApprovals: 0,
      liveIntentCount: 0,
      brokerConnected: true,
      marketConnected: true,
      liveTradeEnabled: false,
      pendingLiveIntents: [],
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.workflow.workflowId, 'task-orchestrator.cycle-run');
  assert.equal(response.json.workflow.status, 'queued');
});

test('POST /api/task-orchestrator/state/queue creates a queued state workflow', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/state/queue',
    body: {
      state: createTradingState(),
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.workflow.workflowId, 'task-orchestrator.state-run');
  assert.equal(response.json.workflow.status, 'queued');
});

test('POST /api/task-orchestrator/workflows/:id/resume resumes a failed workflow run', async () => {
  const queued = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/workflows/queue',
    body: {
      workflowId: 'task-orchestrator.resume-test',
      workflowType: 'task-orchestrator',
      actor: 'api-test',
      trigger: 'manual',
    },
  });

  context.workflows.updateWorkflowRun(queued.json.workflow.id, {
    status: 'failed',
    error: 'manual failure',
    failedAt: '2026-03-10T10:00:00.000Z',
  });

  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/task-orchestrator/workflows/${queued.json.workflow.id}/resume`,
    body: {},
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.workflow.status, 'queued');
  assert.equal(response.json.workflow.error, null);
});

test('POST /api/task-orchestrator/workflows/:id/resume requires execution:approve permission', async () => {
  const queued = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/workflows/queue',
    body: {
      workflowId: 'task-orchestrator.resume-gate-test',
      workflowType: 'task-orchestrator',
      actor: 'api-test',
      trigger: 'manual',
    },
  });

  context.workflows.updateWorkflowRun(queued.json.workflow.id, {
    status: 'failed',
    error: 'manual failure',
    failedAt: '2026-03-10T10:00:00.000Z',
  });

  context.userAccount.updateUserAccess({
    role: 'operator',
    status: 'active',
    permissions: ['dashboard:read', 'strategy:write', 'risk:review'],
  });

  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/task-orchestrator/workflows/${queued.json.workflow.id}/resume`,
    body: {},
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.json.ok, false);
  assert.equal(response.json.error, 'forbidden');
  assert.equal(response.json.missingPermission, 'execution:approve');

  context.userAccount.updateUserAccess({
    role: 'admin',
    status: 'active',
    permissions: ['dashboard:read', 'strategy:write', 'risk:review', 'execution:approve', 'account:write'],
  });
});

test('POST /api/task-orchestrator/workflows/:id/cancel cancels a workflow run', async () => {
  const queued = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/workflows/queue',
    body: {
      workflowId: 'task-orchestrator.cancel-test',
      workflowType: 'task-orchestrator',
      actor: 'api-test',
      trigger: 'manual',
    },
  });

  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/task-orchestrator/workflows/${queued.json.workflow.id}/cancel`,
    body: {},
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.workflow.status, 'canceled');
});

test('POST /api/task-orchestrator/workflows/:id/cancel requires execution:approve permission', async () => {
  const queued = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/workflows/queue',
    body: {
      workflowId: 'task-orchestrator.cancel-gate-test',
      workflowType: 'task-orchestrator',
      actor: 'api-test',
      trigger: 'manual',
    },
  });

  context.userAccount.updateUserAccess({
    role: 'operator',
    status: 'active',
    permissions: ['dashboard:read', 'strategy:write', 'risk:review'],
  });

  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/task-orchestrator/workflows/${queued.json.workflow.id}/cancel`,
    body: {},
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.json.ok, false);
  assert.equal(response.json.error, 'forbidden');
  assert.equal(response.json.missingPermission, 'execution:approve');

  context.userAccount.updateUserAccess({
    role: 'admin',
    status: 'active',
    permissions: ['dashboard:read', 'strategy:write', 'risk:review', 'execution:approve', 'account:write'],
  });
});
