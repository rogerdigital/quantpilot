import { randomUUID } from 'node:crypto';
import { trimAndSave } from '../shared.js';

const FILENAME = 'backtest-runs.json';

const DEFAULT_BACKTEST_RUNS = [
  {
    id: 'bt-ema-cross-20260310',
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    workflowRunId: '',
    status: 'completed',
    windowLabel: '2024-01-01 -> 2026-03-01',
    startedAt: '2026-03-10T00:15:00.000Z',
    completedAt: '2026-03-10T00:21:00.000Z',
    annualizedReturnPct: 17.8,
    maxDrawdownPct: 9.2,
    sharpe: 1.39,
    winRatePct: 56.4,
    turnoverPct: 138,
    summary: 'Return and drawdown remain inside the current promotion threshold, suitable for candidate review.',
    requestedBy: 'research-bot',
    dataSource: 'control-plane-store.backtest-runs',
    createdAt: '2026-03-10T00:15:00.000Z',
    updatedAt: '2026-03-10T00:21:00.000Z',
  },
  {
    id: 'bt-rsi-revert-20260310',
    strategyId: 'rsi-revert-index',
    strategyName: 'Index RSI Revert',
    workflowRunId: '',
    status: 'needs_review',
    windowLabel: '2023-01-01 -> 2026-03-01',
    startedAt: '2026-03-10T00:35:00.000Z',
    completedAt: '2026-03-10T00:39:00.000Z',
    annualizedReturnPct: 10.6,
    maxDrawdownPct: 11.8,
    sharpe: 0.96,
    winRatePct: 61.2,
    turnoverPct: 184,
    summary: 'Win rate is acceptable, but drawdown breaches the current 10% review gate and requires explanation.',
    requestedBy: 'research-bot',
    dataSource: 'control-plane-store.backtest-runs',
    createdAt: '2026-03-10T00:35:00.000Z',
    updatedAt: '2026-03-10T00:39:00.000Z',
  },
  {
    id: 'bt-multi-factor-20260310',
    strategyId: 'multi-factor-rotation',
    strategyName: 'Multi Factor Rotation',
    workflowRunId: '',
    status: 'running',
    windowLabel: '2019-01-01 -> 2026-03-01',
    startedAt: '2026-03-10T01:10:00.000Z',
    annualizedReturnPct: 0,
    maxDrawdownPct: 0,
    sharpe: 0,
    winRatePct: 0,
    turnoverPct: 0,
    summary: 'Long-horizon factor rotation run is rebuilding monthly allocation buckets and cost assumptions.',
    requestedBy: 'research-bot',
    dataSource: 'control-plane-store.backtest-runs',
    createdAt: '2026-03-10T01:10:00.000Z',
    updatedAt: '2026-03-10T01:10:00.000Z',
  },
  {
    id: 'bt-breakout-crypto-20260310',
    strategyId: 'breakout-crypto',
    strategyName: 'Crypto Breakout Pulse',
    workflowRunId: '',
    status: 'queued',
    windowLabel: '2025-01-01 -> 2026-03-01',
    startedAt: '2026-03-10T01:25:00.000Z',
    annualizedReturnPct: 0,
    maxDrawdownPct: 0,
    sharpe: 0,
    winRatePct: 0,
    turnoverPct: 0,
    summary: 'Queued behind slippage calibration and exchange session normalization checks.',
    requestedBy: 'research-bot',
    dataSource: 'control-plane-store.backtest-runs',
    createdAt: '2026-03-10T01:25:00.000Z',
    updatedAt: '2026-03-10T01:25:00.000Z',
  },
];

function createBacktestRunEntry(payload = {}) {
  const now = payload.createdAt || new Date().toISOString();
  return {
    id: payload.id || `backtest-run-${randomUUID()}`,
    strategyId: payload.strategyId || '',
    strategyName: payload.strategyName || 'Unknown Strategy',
    workflowRunId: payload.workflowRunId || '',
    status: payload.status || 'queued',
    windowLabel: payload.windowLabel || '',
    startedAt: payload.startedAt || now,
    completedAt: payload.completedAt || '',
    annualizedReturnPct: Number(payload.annualizedReturnPct || 0),
    maxDrawdownPct: Number(payload.maxDrawdownPct || 0),
    sharpe: Number(payload.sharpe || 0),
    winRatePct: Number(payload.winRatePct || 0),
    turnoverPct: Number(payload.turnoverPct || 0),
    summary: payload.summary || '',
    requestedBy: payload.requestedBy || 'operator',
    reviewedAt: payload.reviewedAt || '',
    reviewedBy: payload.reviewedBy || '',
    createdAt: now,
    updatedAt: payload.updatedAt || now,
    dataSource: payload.dataSource || 'control-plane-store.backtest-runs',
  };
}

export function createBacktestRunRepository(store) {
  function readRuns() {
    const runs = store.readCollection(FILENAME);
    if (!runs.length) {
      store.writeCollection(FILENAME, DEFAULT_BACKTEST_RUNS);
      return DEFAULT_BACKTEST_RUNS.map((entry) => ({ ...entry }));
    }
    return runs.map((entry) => createBacktestRunEntry(entry));
  }

  function writeRuns(runs) {
    trimAndSave(store, FILENAME, runs.map((entry) => createBacktestRunEntry(entry)), 300);
  }

  return {
    listBacktestRuns(limit = 100, filter = {}) {
      return readRuns()
        .filter((run) => {
          if (filter.status && run.status !== filter.status) return false;
          if (filter.strategyId && run.strategyId !== filter.strategyId) return false;
          return true;
        })
        .slice(0, limit);
    },
    getBacktestRun(runId) {
      return readRuns().find((run) => run.id === runId) || null;
    },
    findBacktestRunByWorkflowRunId(workflowRunId) {
      return readRuns().find((run) => run.workflowRunId === workflowRunId) || null;
    },
    appendBacktestRun(payload = {}) {
      const runs = readRuns();
      const entry = createBacktestRunEntry(payload);
      runs.unshift(entry);
      writeRuns(runs);
      return entry;
    },
    updateBacktestRun(runId, patch = {}) {
      const runs = readRuns();
      const index = runs.findIndex((run) => run.id === runId);
      if (index === -1) {
        return null;
      }
      const current = runs[index];
      runs[index] = createBacktestRunEntry({
        ...current,
        ...patch,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: patch.updatedAt || new Date().toISOString(),
        startedAt: patch.startedAt || current.startedAt || current.createdAt,
      });
      writeRuns(runs);
      return runs[index];
    },
  };
}
