// @ts-nocheck
import { createBacktestResultEntry, trimAndSave } from '../shared.js';

const FILENAME = 'backtest-results.json';

const DEFAULT_BACKTEST_RESULTS = [
  {
    id: 'backtest-result-ema-cross-v1',
    runId: 'bt-ema-cross-20260310',
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    workflowRunId: '',
    windowLabel: '2024-01-01 -> 2026-03-01',
    status: 'completed',
    stage: 'generated',
    version: 1,
    generatedAt: '2026-03-10T00:21:00.000Z',
    summary: 'Initial research result completed inside the promotion envelope.',
    annualizedReturnPct: 17.8,
    maxDrawdownPct: 9.2,
    sharpe: 1.39,
    winRatePct: 56.4,
    turnoverPct: 138,
    benchmarkReturnPct: 11.3,
    excessReturnPct: 6.5,
    metadata: {
      source: 'control-plane-store.backtest-results',
      notes: ['trend persistence remained stable through the test window'],
    },
  },
  {
    id: 'backtest-result-rsi-revert-v1',
    runId: 'bt-rsi-revert-20260310',
    strategyId: 'rsi-revert-index',
    strategyName: 'Index RSI Revert',
    workflowRunId: '',
    windowLabel: '2023-01-01 -> 2026-03-01',
    status: 'needs_review',
    stage: 'generated',
    version: 1,
    generatedAt: '2026-03-10T00:39:00.000Z',
    summary: 'Initial result requires review because drawdown breached the current gate.',
    annualizedReturnPct: 10.6,
    maxDrawdownPct: 11.8,
    sharpe: 0.96,
    winRatePct: 61.2,
    turnoverPct: 184,
    benchmarkReturnPct: 8.9,
    excessReturnPct: 1.7,
    metadata: {
      source: 'control-plane-store.backtest-results',
      notes: ['drawdown exceeded the 10% review fence'],
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

export function createBacktestResultRepository(store) {
  function readResults() {
    const results = store.readCollection(FILENAME);
    if (!results.length) {
      store.writeCollection(FILENAME, DEFAULT_BACKTEST_RESULTS);
      return DEFAULT_BACKTEST_RESULTS.map((entry) => createBacktestResultEntry(entry));
    }
    return results.map((entry) => createBacktestResultEntry(entry));
  }

  function writeResults(results) {
    trimAndSave(
      store,
      FILENAME,
      results.map((entry) => createBacktestResultEntry(entry)),
      600
    );
  }

  function nextVersion(results, runId) {
    const versions = results
      .filter((item) => item.runId === runId)
      .map((item) => Number(item.version || 0));
    return (versions.length ? Math.max(...versions) : 0) + 1;
  }

  return {
    listBacktestResults(limit = 100, filter = {}) {
      const sinceMs = normalizeSince(filter.since);
      return readResults()
        .filter((item) => !filter.runId || item.runId === filter.runId)
        .filter((item) => !filter.strategyId || item.strategyId === filter.strategyId)
        .filter((item) => !filter.workflowRunId || item.workflowRunId === filter.workflowRunId)
        .filter((item) => !filter.status || item.status === filter.status)
        .filter((item) => !filter.stage || item.stage === filter.stage)
        .filter((item) => !sinceMs || parseTimestamp(item.generatedAt || item.createdAt) >= sinceMs)
        .slice(0, limit);
    },
    getBacktestResult(resultId) {
      return readResults().find((item) => item.id === resultId) || null;
    },
    listBacktestResultsForRun(runId, limit = 20) {
      return readResults()
        .filter((item) => item.runId === runId)
        .slice(0, limit);
    },
    getLatestBacktestResultForRun(runId) {
      return this.listBacktestResultsForRun(runId, 1)[0] || null;
    },
    appendBacktestResult(payload = {}) {
      const results = readResults();
      const entry = createBacktestResultEntry({
        ...payload,
        version: payload.version || nextVersion(results, payload.runId || ''),
      });
      results.unshift(entry);
      writeResults(results);
      return entry;
    },
  };
}
