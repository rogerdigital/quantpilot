import { createResearchEvaluationEntry, trimAndSave } from '../shared.js';

const FILENAME = 'research-evaluations.json';

const DEFAULT_RESEARCH_EVALUATIONS = [
  {
    id: 'research-eval-ema-cross',
    runId: 'bt-ema-cross-20260310',
    resultId: 'backtest-result-ema-cross-v1',
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    verdict: 'promote',
    scoreBand: 'strong',
    readiness: 'paper',
    recommendedAction: 'promote_to_paper',
    summary: 'The reviewed trend strategy is healthy enough to move from candidate into paper execution prep.',
    actor: 'research-lead',
    createdAt: '2026-03-10T01:05:00.000Z',
    metadata: {
      benchmarkGapPct: 6.5,
      drawdownBufferPct: 2.8,
      sharpe: 1.39,
    },
  },
];

function parseTimestamp(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSince(value) {
  if (!value) return 0;
  return parseTimestamp(value);
}

export function createResearchEvaluationRepository(store) {
  function readEvaluations() {
    const evaluations = store.readCollection(FILENAME);
    if (!evaluations.length) {
      store.writeCollection(FILENAME, DEFAULT_RESEARCH_EVALUATIONS);
      return DEFAULT_RESEARCH_EVALUATIONS.map((entry) => createResearchEvaluationEntry(entry));
    }
    return evaluations.map((entry) => createResearchEvaluationEntry(entry));
  }

  function writeEvaluations(evaluations) {
    trimAndSave(store, FILENAME, evaluations.map((entry) => createResearchEvaluationEntry(entry)), 600);
  }

  return {
    listResearchEvaluations(limit = 100, filter = {}) {
      const sinceMs = normalizeSince(filter.since);
      return readEvaluations()
        .filter((item) => !filter.runId || item.runId === filter.runId)
        .filter((item) => !filter.resultId || item.resultId === filter.resultId)
        .filter((item) => !filter.strategyId || item.strategyId === filter.strategyId)
        .filter((item) => !filter.verdict || item.verdict === filter.verdict)
        .filter((item) => !sinceMs || parseTimestamp(item.createdAt) >= sinceMs)
        .slice(0, limit);
    },
    getResearchEvaluation(evaluationId) {
      return readEvaluations().find((item) => item.id === evaluationId) || null;
    },
    getLatestEvaluationForRun(runId) {
      return readEvaluations().find((item) => item.runId === runId) || null;
    },
    getLatestEvaluationForStrategy(strategyId) {
      return readEvaluations().find((item) => item.strategyId === strategyId) || null;
    },
    appendResearchEvaluation(payload = {}) {
      const evaluations = readEvaluations();
      const entry = createResearchEvaluationEntry(payload);
      evaluations.unshift(entry);
      writeEvaluations(evaluations);
      return entry;
    },
  };
}
