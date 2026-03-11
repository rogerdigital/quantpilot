import { assertOk, fetchJson, jsonHeaders } from '../../app/api/http.ts';
import type {
  BacktestRunCreateSnapshot,
  BacktestRunItem,
  BacktestSummarySnapshot,
  ResearchHubSnapshot,
  StrategyCatalogSaveSnapshot,
  StrategyCatalogItem,
} from '@shared-types/trading.ts';

export async function fetchResearchHub(): Promise<ResearchHubSnapshot> {
  const [summary, strategyCatalog, backtestRuns] = await Promise.all([
    fetchJson<BacktestSummarySnapshot>('/api/backtest/summary'),
    fetchJson<{ ok: boolean; asOf: string; strategies: StrategyCatalogItem[] }>('/api/strategy/catalog'),
    fetchJson<{ ok: boolean; asOf: string; runs: BacktestRunItem[] }>('/api/backtest/runs'),
  ]);

  return {
    ok: true,
    asOf: summary.asOf,
    summary,
    strategies: strategyCatalog.strategies,
    runs: backtestRuns.runs,
  };
}

export async function queueBacktestRun(payload: {
  strategyId: string;
  windowLabel?: string;
  requestedBy?: string;
}): Promise<BacktestRunCreateSnapshot> {
  const response = await fetch('/api/backtest/runs', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  await assertOk(response);
  return response.json();
}

export async function reviewBacktestRun(runId: string, payload: {
  reviewedBy?: string;
  summary?: string;
}) {
  const response = await fetch(`/api/backtest/runs/${runId}/review`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  await assertOk(response);
  return response.json();
}

export async function saveStrategyCatalogItem(payload: Record<string, unknown>): Promise<StrategyCatalogSaveSnapshot> {
  const response = await fetch('/api/strategy/catalog', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  await assertOk(response);
  return response.json();
}
