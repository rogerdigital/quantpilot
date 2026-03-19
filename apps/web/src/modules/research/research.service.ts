import { assertOk, fetchJson, jsonHeaders } from '../../app/api/http.ts';
import type {
  BacktestRunDetailSnapshot,
  BacktestRunCreateSnapshot,
  ResearchHubSnapshot,
  StrategyCatalogDetailSnapshot,
  StrategyCatalogSaveSnapshot,
} from '@shared-types/trading.ts';

export async function fetchResearchHub(): Promise<ResearchHubSnapshot> {
  return fetchJson<ResearchHubSnapshot>('/api/research/hub');
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

export async function fetchStrategyCatalogItem(strategyId: string): Promise<StrategyCatalogDetailSnapshot> {
  return fetchJson<StrategyCatalogDetailSnapshot>(`/api/strategy/catalog/${strategyId}`);
}

export async function fetchBacktestRunItem(runId: string): Promise<BacktestRunDetailSnapshot> {
  return fetchJson<BacktestRunDetailSnapshot>(`/api/backtest/runs/${runId}`);
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
