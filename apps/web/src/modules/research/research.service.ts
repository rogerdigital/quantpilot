import { assertOk, fetchJson, jsonHeaders } from '../../app/api/http.ts';
import type {
  BacktestRunDetailSnapshot,
  BacktestRunCreateSnapshot,
  ResearchEvaluationRecord,
  ResearchGovernanceActionRecord,
  ResearchWorkbenchSnapshot,
  ResearchHubSnapshot,
  StrategyCatalogDetailSnapshot,
  StrategyCatalogSaveSnapshot,
} from '@shared-types/trading.ts';

export async function fetchResearchHub(): Promise<ResearchHubSnapshot> {
  return fetchJson<ResearchHubSnapshot>('/api/research/hub');
}

export async function fetchResearchWorkbench(): Promise<ResearchWorkbenchSnapshot> {
  return fetchJson<ResearchWorkbenchSnapshot>('/api/research/workbench');
}

export async function fetchResearchGovernanceActions(): Promise<{
  ok: boolean;
  asOf: string;
  actions: ResearchGovernanceActionRecord[];
}> {
  return fetchJson('/api/research/governance/actions');
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

export async function evaluateBacktestRunItem(runId: string, payload: {
  actor?: string;
  summary?: string;
  note?: string;
}): Promise<{ ok: boolean; evaluation: ResearchEvaluationRecord }> {
  const response = await fetch(`/api/backtest/runs/${runId}/evaluate`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  await assertOk(response);
  return response.json();
}

export async function promoteStrategyCatalogItem(strategyId: string, payload: {
  actor?: string;
  summary?: string;
  evaluationId?: string;
  nextStatus?: string;
} = {}) {
  const response = await fetch(`/api/strategy/catalog/${strategyId}/promote`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  await assertOk(response);
  return response.json();
}

export async function runResearchGovernanceAction(payload: {
  action: 'promote_strategies' | 'queue_backtests' | 'evaluate_runs';
  actor?: string;
  strategyIds?: string[];
  runIds?: string[];
  summary?: string;
  windowLabel?: string;
}): Promise<{
  ok: boolean;
  action?: ResearchGovernanceActionRecord;
  successes: Array<Record<string, unknown>>;
  failures: Array<Record<string, unknown>>;
}> {
  const response = await fetch('/api/research/governance/actions', {
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
