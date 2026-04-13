// @ts-nocheck
import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';

function parseLimit(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveSince(hours) {
  const parsed = Number(hours);
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  return new Date(Date.now() - parsed * 60 * 60 * 1000).toISOString();
}

export function listBacktestResults(options = {}) {
  const limit = parseLimit(options.limit, 100);
  const since = resolveSince(options.hours);
  const results = controlPlaneRuntime.listBacktestResults(limit, {
    runId: options.runId || '',
    strategyId: options.strategyId || '',
    workflowRunId: options.workflowRunId || '',
    status: options.status || '',
    stage: options.stage || '',
    since,
  });

  return {
    ok: true,
    asOf: results[0]?.generatedAt || new Date().toISOString(),
    results,
  };
}

export function getBacktestResultDetail(resultId) {
  const result = controlPlaneRuntime.getBacktestResult(resultId);
  if (!result) {
    return {
      ok: false,
      error: 'backtest result not found',
      message: `Unknown backtest result: ${resultId || 'missing resultId'}`,
    };
  }

  const run = result.runId ? controlPlaneRuntime.getBacktestRun(result.runId) : null;
  const workflow = result.workflowRunId
    ? controlPlaneRuntime.getWorkflowRun(result.workflowRunId)
    : null;
  const strategy = result.strategyId
    ? controlPlaneRuntime.getStrategyCatalogItem(result.strategyId)
    : null;
  const siblings = result.runId
    ? controlPlaneRuntime.listBacktestResultsForRun(result.runId, 20)
    : [];

  return {
    ok: true,
    result,
    run,
    workflow,
    strategy,
    siblings,
  };
}

export function getBacktestResultSummary(options = {}) {
  const limit = parseLimit(options.limit, 200);
  const since = resolveSince(options.hours);
  const results = controlPlaneRuntime.listBacktestResults(limit, {
    strategyId: options.strategyId || '',
    status: options.status || '',
    stage: options.stage || '',
    since,
  });

  const summary = {
    total: results.length,
    completed: 0,
    needsReview: 0,
    failed: 0,
    averageSharpe: 0,
    averageReturnPct: 0,
    averageExcessReturnPct: 0,
    latestGeneratedAt: results[0]?.generatedAt || '',
  };

  if (!results.length) {
    return {
      ok: true,
      asOf: new Date().toISOString(),
      summary,
    };
  }

  results.forEach((item) => {
    if (item.status === 'completed') summary.completed += 1;
    if (item.status === 'needs_review') summary.needsReview += 1;
    if (item.status === 'failed') summary.failed += 1;
  });

  summary.averageSharpe = Number(
    (results.reduce((sum, item) => sum + item.sharpe, 0) / results.length).toFixed(2)
  );
  summary.averageReturnPct = Number(
    (results.reduce((sum, item) => sum + item.annualizedReturnPct, 0) / results.length).toFixed(2)
  );
  summary.averageExcessReturnPct = Number(
    (results.reduce((sum, item) => sum + item.excessReturnPct, 0) / results.length).toFixed(2)
  );

  return {
    ok: true,
    asOf: summary.latestGeneratedAt || new Date().toISOString(),
    summary,
  };
}
