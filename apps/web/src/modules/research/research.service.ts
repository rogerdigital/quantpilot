import { fetchJson } from '../../app/api/http.ts';
import type {
  BacktestRunItem,
  BacktestSummarySnapshot,
  ResearchHubSnapshot,
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
