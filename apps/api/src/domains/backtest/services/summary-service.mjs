import { listStrategyCatalog } from '../../../modules/strategy/service.mjs';
import { listBacktestRuns } from './runs-service.mjs';

export function getBacktestSummary() {
  const { strategies } = listStrategyCatalog();
  const { runs } = listBacktestRuns();
  const completedRuns = runs.filter((run) => run.status === 'completed');
  const queuedRuns = runs.filter((run) => run.status === 'queued').length;
  const runningRuns = runs.filter((run) => run.status === 'running').length;
  const reviewQueue = runs.filter((run) => run.status === 'needs_review').length;
  const averageSharpe = completedRuns.length
    ? completedRuns.reduce((sum, run) => sum + run.sharpe, 0) / completedRuns.length
    : 0;
  const averageReturnPct = completedRuns.length
    ? completedRuns.reduce((sum, run) => sum + run.annualizedReturnPct, 0) / completedRuns.length
    : 0;
  const candidateStrategies = strategies.filter((item) => ['candidate', 'paper', 'live'].includes(item.status)).length;
  const promotedStrategies = strategies.filter((item) => ['paper', 'live'].includes(item.status)).length;

  return {
    ok: true,
    asOf: '2026-03-10T09:30:00.000Z',
    queuedRuns,
    runningRuns,
    completedRuns: completedRuns.length,
    candidateStrategies,
    promotedStrategies,
    averageSharpe: Number(averageSharpe.toFixed(2)),
    averageReturnPct: Number(averageReturnPct.toFixed(2)),
    reviewQueue,
    dataSource: 'QuantPilot research service mock snapshot',
  };
}
