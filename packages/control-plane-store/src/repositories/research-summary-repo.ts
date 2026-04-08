const FILENAME = 'research-summary.json';

const DEFAULT_SUMMARY = {
  ok: true,
  asOf: '2026-03-10T09:30:00.000Z',
  queuedRuns: 1,
  runningRuns: 1,
  completedRuns: 1,
  failedRuns: 0,
  candidateStrategies: 2,
  promotedStrategies: 1,
  averageSharpe: 1.39,
  averageReturnPct: 17.8,
  reviewQueue: 1,
  dataSource: 'control-plane-store.research-summary',
};

function normalizeSummary(summary = {}) {
  return {
    ok: true,
    asOf: summary.asOf || new Date().toISOString(),
    queuedRuns: Number(summary.queuedRuns || 0),
    runningRuns: Number(summary.runningRuns || 0),
    completedRuns: Number(summary.completedRuns || 0),
    failedRuns: Number(summary.failedRuns || 0),
    candidateStrategies: Number(summary.candidateStrategies || 0),
    promotedStrategies: Number(summary.promotedStrategies || 0),
    averageSharpe: Number(summary.averageSharpe || 0),
    averageReturnPct: Number(summary.averageReturnPct || 0),
    reviewQueue: Number(summary.reviewQueue || 0),
    dataSource: summary.dataSource || 'control-plane-store.research-summary',
  };
}

export function createResearchSummaryRepository(store) {
  return {
    getResearchSummary() {
      return normalizeSummary(store.readObject(FILENAME, DEFAULT_SUMMARY));
    },
    updateResearchSummary(summary = {}) {
      const next = normalizeSummary(summary);
      store.writeObject(FILENAME, next);
      return next;
    },
  };
}
