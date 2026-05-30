const now = () => new Date().toISOString();

type AnyRecord = Record<string, any>;

const strategies: AnyRecord[] = [
  {
    id: 'momentum-core',
    name: 'Momentum Core',
    family: 'trend',
    status: 'paper',
    score: 78,
    expectedReturnPct: 12.4,
    maxDrawdownPct: 8.6,
    sharpe: 1.42,
    updatedAt: now(),
  },
  {
    id: 'mean-reversion-core',
    name: 'Mean Reversion Core',
    family: 'mean-reversion',
    status: 'draft',
    score: 69,
    expectedReturnPct: 8.8,
    maxDrawdownPct: 6.1,
    sharpe: 1.18,
    updatedAt: now(),
  },
];

const backtestRuns: AnyRecord[] = [
  {
    id: 'run-momentum-core',
    strategyId: 'momentum-core',
    status: 'reviewed',
    stage: 'paper',
    startedAt: now(),
    completedAt: now(),
  },
];

const backtestResults: AnyRecord[] = [
  {
    id: 'result-momentum-core',
    runId: 'run-momentum-core',
    strategyId: 'momentum-core',
    status: 'accepted',
    stage: 'paper',
    metrics: {
      totalReturnPct: 14.2,
      maxDrawdownPct: 7.8,
      sharpe: 1.36,
      winRatePct: 56.4,
    },
    createdAt: now(),
  },
];

const executionPlans: AnyRecord[] = [
  {
    id: 'plan-momentum-core',
    strategyId: 'momentum-core',
    strategyName: 'Momentum Core',
    status: 'pending_approval',
    approvalState: 'required',
    riskStatus: 'pass',
    summary: 'Paper rebalance candidate for Momentum Core.',
    orders: [{ symbol: 'SPY', side: 'BUY', qty: 10, orderType: 'market' }],
    createdAt: now(),
    updatedAt: now(),
  },
];

const executionHandoffs: AnyRecord[] = [];
const runtimeEvents: AnyRecord[] = [];
const brokerEvents: AnyRecord[] = [];
const riskEvents: AnyRecord[] = [];

const accountSnapshots: AnyRecord[] = [
  {
    id: 'snapshot-paper',
    accountId: 'paper',
    equity: 100000,
    cash: 62000,
    buyingPower: 124000,
    capturedAt: now(),
  },
];

const riskParameters: AnyRecord = {
  maxPositionWeightPct: 20,
  maxDailyLossPct: 3,
  maxDrawdownPct: 10,
  requireApprovalAboveNotional: 25000,
};

export function listStrategies() {
  return { ok: true, strategies };
}

export function getStrategy(strategyId: string) {
  const strategy = strategies.find((item) => item.id === strategyId);
  if (!strategy) return { ok: false, message: 'strategy not found' };
  return {
    ok: true,
    strategy,
    recentRuns: backtestRuns.filter((run) => run.strategyId === strategyId),
    recentResults: backtestResults.filter((result) => result.strategyId === strategyId),
    recentHandoffs: executionHandoffs.filter((handoff) => handoff.strategyId === strategyId),
  };
}

export function saveStrategy(payload: AnyRecord = {}) {
  const id = payload.id || `strategy-${Date.now()}`;
  const existing = strategies.find((item) => item.id === id);
  const next = {
    id,
    name: payload.name || existing?.name || 'Untitled Strategy',
    family: payload.family || existing?.family || 'custom',
    status: payload.status || existing?.status || 'draft',
    score: Number(payload.score ?? existing?.score ?? 50),
    expectedReturnPct: Number(payload.expectedReturnPct ?? existing?.expectedReturnPct ?? 0),
    maxDrawdownPct: Number(payload.maxDrawdownPct ?? existing?.maxDrawdownPct ?? 0),
    sharpe: Number(payload.sharpe ?? existing?.sharpe ?? 0),
    updatedAt: now(),
  };
  if (existing) Object.assign(existing, next);
  else strategies.unshift(next);
  return { ok: true, strategy: next };
}

export function promoteStrategy(strategyId: string, payload: AnyRecord = {}) {
  const found = strategies.find((item) => item.id === strategyId);
  if (!found) return { ok: false, message: 'strategy not found' };
  found.status = payload.status || 'paper';
  found.updatedAt = now();
  return { ok: true, strategy: found };
}

export function listBacktestRuns() {
  return { ok: true, runs: backtestRuns };
}

export function getBacktestRun(runId = '') {
  const run = backtestRuns.find((item) => item.id === runId);
  return run ? { ok: true, run } : { ok: false, message: 'backtest run not found' };
}

export function createBacktestRun(payload: AnyRecord = {}) {
  const strategyId = payload.strategyId || 'momentum-core';
  const run = {
    id: `run-${Date.now()}`,
    strategyId,
    status: 'completed',
    stage: 'paper',
    startedAt: now(),
    completedAt: now(),
  };
  const result = {
    id: `result-${Date.now()}`,
    runId: run.id,
    strategyId,
    status: 'generated',
    stage: 'paper',
    metrics: payload.metrics || {
      totalReturnPct: 9.4,
      maxDrawdownPct: 5.9,
      sharpe: 1.12,
      winRatePct: 53.1,
    },
    createdAt: now(),
  };
  backtestRuns.unshift(run);
  backtestResults.unshift(result);
  return { ok: true, run, result };
}

export function listBacktestResults() {
  return { ok: true, results: backtestResults };
}

export function getBacktestResult(resultId = '') {
  const result = backtestResults.find((item) => item.id === resultId);
  return result ? { ok: true, result } : { ok: false, message: 'backtest result not found' };
}

export function getBacktestSummary() {
  return {
    ok: true,
    summary: {
      strategies: strategies.length,
      runs: backtestRuns.length,
      results: backtestResults.length,
      averageSharpe:
        backtestResults.reduce((sum, item) => sum + Number(item.metrics?.sharpe || 0), 0) /
        Math.max(backtestResults.length, 1),
    },
  };
}

export function reviewBacktestRun(runId = '', payload: AnyRecord = {}) {
  const run = backtestRuns.find((item) => item.id === runId);
  if (!run) return { ok: false, message: 'backtest run not found' };
  run.status = payload.status || 'reviewed';
  run.reviewedAt = now();
  return { ok: true, run };
}

export function evaluateBacktestRun(runId = '') {
  const run = backtestRuns.find((item) => item.id === runId);
  if (!run) return { ok: false, message: 'backtest run not found' };
  return { ok: true, evaluation: { runId, verdict: 'watch', createdAt: now() } };
}

export function listExecutionPlans() {
  return executionPlans;
}

export function getExecutionPlan(planId: string) {
  const plan = executionPlans.find((item) => item.id === planId);
  if (!plan) return null;
  return {
    plan,
    brokerEvents: brokerEvents.filter((item) => item.executionPlanId === planId),
    runtimeEvents: runtimeEvents.filter((item) => item.executionPlanId === planId),
  };
}

export function getExecutionWorkbench() {
  return {
    ok: true,
    plans: executionPlans,
    runtimeEvents,
    brokerEvents,
    accountSnapshots,
  };
}

export function updateExecutionPlan(planId: string, patch: AnyRecord = {}) {
  const plan = executionPlans.find((item) => item.id === planId);
  if (!plan) return { ok: false, message: 'execution plan not found' };
  Object.assign(plan, patch, { updatedAt: now() });
  runtimeEvents.unshift({
    id: `runtime-${Date.now()}`,
    executionPlanId: planId,
    type: patch.status || 'updated',
    createdAt: now(),
  });
  return { ok: true, plan };
}

export function bulkUpdateExecutionPlans(payload: AnyRecord = {}) {
  const ids = Array.isArray(payload.ids) ? payload.ids : executionPlans.map((item) => item.id);
  const results = ids.map((id: string) => updateExecutionPlan(id, { status: payload.status || 'reviewed' }));
  return { ok: true, results };
}

export function listExecutionRuntimeEvents(limit = 60) {
  return runtimeEvents.slice(0, limit);
}

export function listBrokerAccountSnapshots(limit = 20) {
  return accountSnapshots.slice(0, limit);
}

export function listBrokerExecutionEvents(limit = 40) {
  return brokerEvents.slice(0, limit);
}

export function listExecutionLedger() {
  return executionPlans.map((plan) => ({
    id: `ledger-${plan.id}`,
    executionPlanId: plan.id,
    status: plan.status,
    updatedAt: plan.updatedAt,
  }));
}

export function appendExecutionHandoff(payload: AnyRecord) {
  executionHandoffs.unshift(payload);
  return payload;
}

export function listExecutionHandoffs() {
  return { ok: true, handoffs: executionHandoffs };
}

export function queueExecutionHandoff(handoffId: string) {
  const handoff = executionHandoffs.find((item) => item.id === handoffId);
  if (!handoff) return { ok: false, message: 'execution handoff not found' };
  handoff.handoffStatus = 'queued';
  return { ok: true, handoff };
}

export function createExecutionHandoff(strategyId: string, payload: AnyRecord = {}) {
  const strategy = strategies.find((item) => item.id === strategyId);
  if (!strategy) return { ok: false, message: 'strategy not found' };
  const handoff = appendExecutionHandoff({
    id: `handoff-${Date.now()}`,
    strategyId,
    strategyName: strategy.name,
    mode: payload.mode || 'paper',
    capital: Number(payload.capital || 10000),
    orders: payload.orders || [],
    summary: payload.summary || `Execution candidate for ${strategy.name}`,
    riskStatus: 'pass',
    approvalState: 'required',
    handoffStatus: 'draft',
    createdAt: now(),
  });
  return { ok: true, handoff };
}

export function getRiskParameters() {
  return { ...riskParameters };
}

export function updateRiskParameters(payload: AnyRecord = {}) {
  Object.assign(riskParameters, payload);
  return getRiskParameters();
}

export function resetRiskParameters() {
  Object.assign(riskParameters, {
    maxPositionWeightPct: 20,
    maxDailyLossPct: 3,
    maxDrawdownPct: 10,
    requireApprovalAboveNotional: 25000,
  });
  return getRiskParameters();
}

export function listRiskEvents() {
  return riskEvents;
}

export function getRiskEvent(eventId: string) {
  return riskEvents.find((item) => item.id === eventId) || null;
}

export function appendRiskEvent(payload: AnyRecord = {}) {
  const event = {
    id: `risk-${Date.now()}`,
    severity: payload.severity || 'info',
    status: payload.status || 'open',
    summary: payload.summary || 'Risk action recorded.',
    createdAt: now(),
  };
  riskEvents.unshift(event);
  return event;
}

export function getRiskWorkbench() {
  return {
    ok: true,
    events: riskEvents,
    executionPlans,
    accountSnapshot: accountSnapshots[0] || null,
    parameters: getRiskParameters(),
  };
}

export function assessExecutionCandidate(candidate: AnyRecord) {
  const notional = Number(candidate.capital || 0);
  const approvalState =
    notional > riskParameters.requireApprovalAboveNotional ? 'required' : 'not_required';
  return {
    riskStatus: 'pass',
    approvalState,
    summary: approvalState === 'required' ? 'Approval required by notional threshold.' : 'Risk check passed.',
  };
}

export function getMarketProviderStatus() {
  return {
    provider: 'simulated',
    status: 'healthy',
    updatedAt: now(),
  };
}
