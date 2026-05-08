import type {
  BacktestRunCreateSnapshot,
  BacktestRunDetailSnapshot,
  ExecutionCandidateHandoffSnapshot,
  ResearchEvaluationRecord,
  ResearchGovernanceActionRecord,
  ResearchHubSnapshot,
  ResearchWorkbenchSnapshot,
  StrategyCatalogDetailSnapshot,
  StrategyCatalogSaveSnapshot,
} from '@shared-types/trading.ts';
import { API_PREFIX, assertOk, fetchJson, jsonHeaders } from '../../app/api/http.ts';

export async function fetchResearchHub(): Promise<ResearchHubSnapshot> {
  return fetchJson<ResearchHubSnapshot>(`${API_PREFIX}/research/hub`);
}

export async function fetchResearchWorkbench(): Promise<ResearchWorkbenchSnapshot> {
  return fetchJson<ResearchWorkbenchSnapshot>(`${API_PREFIX}/research/workbench`);
}

export async function fetchResearchGovernanceActions(): Promise<{
  ok: boolean;
  asOf: string;
  actions: ResearchGovernanceActionRecord[];
}> {
  return fetchJson(`${API_PREFIX}/research/governance/actions`);
}

export async function queueBacktestRun(payload: {
  strategyId: string;
  windowLabel?: string;
  requestedBy?: string;
}): Promise<BacktestRunCreateSnapshot> {
  const response = await fetch(`${API_PREFIX}/backtest/runs`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  await assertOk(response);
  return response.json();
}

export async function fetchStrategyCatalogItem(
  strategyId: string
): Promise<StrategyCatalogDetailSnapshot> {
  return fetchJson<StrategyCatalogDetailSnapshot>(`${API_PREFIX}/strategy/catalog/${strategyId}`);
}

export async function fetchBacktestRunItem(runId: string): Promise<BacktestRunDetailSnapshot> {
  return fetchJson<BacktestRunDetailSnapshot>(`${API_PREFIX}/backtest/runs/${runId}`);
}

export async function reviewBacktestRun(
  runId: string,
  payload: {
    reviewedBy?: string;
    summary?: string;
  }
) {
  const response = await fetch(`${API_PREFIX}/backtest/runs/${runId}/review`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  await assertOk(response);
  return response.json();
}

export async function evaluateBacktestRunItem(
  runId: string,
  payload: {
    actor?: string;
    summary?: string;
    note?: string;
  }
): Promise<{ ok: boolean; evaluation: ResearchEvaluationRecord }> {
  const response = await fetch(`${API_PREFIX}/backtest/runs/${runId}/evaluate`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  await assertOk(response);
  return response.json();
}

export async function promoteStrategyCatalogItem(
  strategyId: string,
  payload: {
    actor?: string;
    summary?: string;
    evaluationId?: string;
    nextStatus?: string;
  } = {}
) {
  const response = await fetch(`${API_PREFIX}/strategy/catalog/${strategyId}/promote`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  await assertOk(response);
  return response.json();
}

export async function runResearchGovernanceAction(payload: {
  action:
    | 'promote_strategies'
    | 'queue_backtests'
    | 'evaluate_runs'
    | 'set_baseline'
    | 'set_champion';
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
  const response = await fetch(`${API_PREFIX}/research/governance/actions`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  await assertOk(response);
  return response.json();
}

export async function createExecutionCandidateHandoff(payload: {
  strategyId: string;
  actor?: string;
  owner?: string;
  mode?: 'paper' | 'live';
  capital?: number;
  summary?: string;
}): Promise<{
  ok: boolean;
  handoff?: ExecutionCandidateHandoffSnapshot['handoffs'][number];
}> {
  const response = await fetch(`${API_PREFIX}/research/execution-candidates`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  await assertOk(response);
  return response.json();
}

export async function saveStrategyCatalogItem(
  payload: Record<string, unknown>
): Promise<StrategyCatalogSaveSnapshot> {
  const response = await fetch(`${API_PREFIX}/strategy/catalog`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  await assertOk(response);
  return response.json();
}
