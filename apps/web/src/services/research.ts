import type {
  BacktestRunItem,
  BacktestSummarySnapshot,
  ResearchHubSnapshot,
  StrategyCatalogItem,
} from '@shared-types/trading.ts';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

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
