// @ts-nocheck
import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';

function buildSummary(strategies, runs, dataSource = 'control-plane-runtime.research-summary') {
  const completedRuns = runs.filter((run) => run.status === 'completed');
  const queuedRuns = runs.filter((run) => run.status === 'queued').length;
  const runningRuns = runs.filter((run) => run.status === 'running').length;
  const failedRuns = runs.filter((run) => run.status === 'failed').length;
  const reviewQueue = runs.filter((run) => run.status === 'needs_review').length;
  const averageSharpe = completedRuns.length
    ? completedRuns.reduce((sum, run) => sum + run.sharpe, 0) / completedRuns.length
    : 0;
  const averageReturnPct = completedRuns.length
    ? completedRuns.reduce((sum, run) => sum + run.annualizedReturnPct, 0) / completedRuns.length
    : 0;
  const candidateStrategies = strategies.filter((item) =>
    ['candidate', 'paper', 'live'].includes(item.status)
  ).length;
  const promotedStrategies = strategies.filter((item) =>
    ['paper', 'live'].includes(item.status)
  ).length;

  return {
    ok: true,
    asOf: new Date().toISOString(),
    queuedRuns,
    runningRuns,
    completedRuns: completedRuns.length,
    failedRuns,
    candidateStrategies,
    promotedStrategies,
    averageSharpe: Number(averageSharpe.toFixed(2)),
    averageReturnPct: Number(averageReturnPct.toFixed(2)),
    reviewQueue,
    dataSource,
  };
}

export function refreshBacktestSummary(dataSource = 'control-plane-runtime.research-summary') {
  const strategies = controlPlaneRuntime.listStrategyCatalog();
  const runs = controlPlaneRuntime.listBacktestRuns();
  const summary = buildSummary(strategies, runs, dataSource);
  return controlPlaneRuntime.updateResearchSummary(summary);
}

export function getBacktestSummary() {
  const summary = controlPlaneRuntime.getResearchSummary();
  if (!summary?.asOf) {
    return refreshBacktestSummary();
  }
  return summary;
}
