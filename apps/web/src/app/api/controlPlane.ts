import type {
  ControlPlaneResolution,
  CycleRunPayload,
  OperatorSession,
  ExecutionRuntimeEvent,
  BrokerAccountSnapshotRecord,
  ExecutionLedgerEntry,
  LatestBrokerAccountSnapshotResponse,
  MarketProviderStatusSnapshot,
  WorkflowRunsSnapshot,
  StateCycleResult,
  TradingState,
  UserAccountProfileSnapshot,
  MonitoringStatusSnapshot,
  MonitoringAlertsResponse,
  MonitoringSnapshotsResponse,
  UserBrokerBindingsSnapshot,
  UserBrokerBindingSaveSnapshot,
  UserBrokerBindingRuntimeSnapshot,
  UserBrokerBindingDeleteSnapshot,
  UserPreferencesUpdateSnapshot,
  UserAccessUpdateSnapshot,
  UserProfileUpdateSnapshot,
} from '@shared-types/trading.ts';
export { ApiPermissionError } from './http.ts';
import { assertOk, fetchJson, jsonHeaders } from './http.ts';

export async function fetchOperatorSession(): Promise<OperatorSession> {
  return fetchJson('/api/auth/session', {
    headers: { Accept: 'application/json' },
  });
}

export async function fetchUserAccountProfile(): Promise<UserAccountProfileSnapshot> {
  return fetchJson('/api/user-account/profile', {
    headers: { Accept: 'application/json' },
  });
}

export async function updateUserAccountProfile(payload: Record<string, unknown>): Promise<UserProfileUpdateSnapshot> {
  const response = await fetch('/api/user-account/profile', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  await assertOk(response);
  return response.json();
}

export async function updateUserAccountPreferences(payload: Record<string, unknown>): Promise<UserPreferencesUpdateSnapshot> {
  const response = await fetch('/api/user-account/preferences', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  await assertOk(response);
  return response.json();
}

export async function updateUserAccountAccess(payload: Record<string, unknown>): Promise<UserAccessUpdateSnapshot> {
  const response = await fetch('/api/user-account/access', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  await assertOk(response);
  return response.json();
}

export async function fetchBrokerBindings(): Promise<UserBrokerBindingsSnapshot> {
  const response = await fetch('/api/user-account/broker-bindings', {
    headers: { Accept: 'application/json' },
  });
  await assertOk(response);
  return response.json();
}

export async function saveBrokerBinding(payload: Record<string, unknown>): Promise<UserBrokerBindingSaveSnapshot> {
  const response = await fetch('/api/user-account/broker-bindings', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  await assertOk(response);
  return response.json();
}

export async function setDefaultBrokerBinding(bindingId: string): Promise<UserBrokerBindingSaveSnapshot> {
  const response = await fetch(`/api/user-account/broker-bindings/${bindingId}/default`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({}),
  });
  await assertOk(response);
  return response.json();
}

export async function deleteBrokerBinding(bindingId: string): Promise<UserBrokerBindingDeleteSnapshot> {
  const response = await fetch(`/api/user-account/broker-bindings/${bindingId}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });
  await assertOk(response);
  return response.json();
}

export async function fetchBrokerBindingRuntime(): Promise<UserBrokerBindingRuntimeSnapshot> {
  const response = await fetch('/api/user-account/broker-bindings/runtime', {
    headers: { Accept: 'application/json' },
  });
  await assertOk(response);
  return response.json();
}

export async function syncBrokerBindingRuntime(): Promise<UserBrokerBindingRuntimeSnapshot> {
  const response = await fetch('/api/user-account/broker-bindings/sync', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({}),
  });
  await assertOk(response);
  return response.json();
}

function buildCyclePayload(state: TradingState): CycleRunPayload {
  return {
    cycle: state.cycle,
    mode: state.mode,
    riskLevel: state.riskLevel,
    decisionSummary: state.decisionSummary,
    marketClock: state.marketClock,
    pendingApprovals: state.approvalQueue.length,
    liveIntentCount: state.pendingLiveIntents.length,
    brokerConnected: state.integrationStatus.broker.connected,
    marketConnected: state.integrationStatus.marketData.connected,
    liveTradeEnabled: state.toggles.liveTrade,
    pendingLiveIntents: state.pendingLiveIntents,
  };
}

export async function runCycle(state: TradingState): Promise<ControlPlaneResolution> {
  const response = await fetch('/api/task-orchestrator/cycles/run', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(buildCyclePayload(state)),
  });
  await assertOk(response);
  return response.json();
}

export async function runStateCycle(state: TradingState): Promise<StateCycleResult> {
  const response = await fetch('/api/task-orchestrator/state/run', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ state }),
  });
  await assertOk(response);
  return response.json();
}

export async function reportOperatorAction(payload: {
  type: string;
  title: string;
  detail: string;
  symbol?: string;
  level?: string;
}) {
  const response = await fetch('/api/task-orchestrator/actions', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  await assertOk(response);
  return response.json();
}

export async function fetchNotifications(): Promise<{
  ok: boolean;
  events: Array<{
    id: string;
    level: string;
    title: string;
    message: string;
    source: string;
    createdAt: string;
  }>;
}> {
  return fetchJson('/api/notification/events', {
    headers: { Accept: 'application/json' },
  });
}

export async function fetchAuditRecords(): Promise<{
  ok: boolean;
  records: Array<{
    id: string;
    type: string;
    actor: string;
    title: string;
    detail: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
  }>;
}> {
  return fetchJson('/api/audit/records', {
    headers: { Accept: 'application/json' },
  });
}

export async function fetchRiskEvents(): Promise<{
  ok: boolean;
  events: Array<{
    id: string;
    level: string;
    status: string;
    title: string;
    message: string;
    cycle: number;
    riskLevel: string;
    source: string;
    createdAt: string;
  }>;
}> {
  return fetchJson('/api/risk/events', {
    headers: { Accept: 'application/json' },
  });
}

type SchedulerTicksQuery = {
  hours?: number | null;
  limit?: number;
  phase?: string;
};

function buildSchedulerTicksQuery(options: SchedulerTicksQuery = {}) {
  const params = new URLSearchParams();

  if (typeof options.limit === 'number' && Number.isFinite(options.limit) && options.limit > 0) {
    params.set('limit', String(options.limit));
  }
  if (typeof options.hours === 'number' && Number.isFinite(options.hours) && options.hours > 0) {
    params.set('hours', String(options.hours));
  }
  if (options.phase) {
    params.set('phase', options.phase);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function fetchSchedulerTicks(options: SchedulerTicksQuery = {}): Promise<{
  ok: boolean;
  ticks: Array<{
    id: string;
    phase: string;
    status: string;
    title: string;
    message: string;
    worker: string;
    createdAt: string;
  }>;
}> {
  return fetchJson(`/api/scheduler/ticks${buildSchedulerTicksQuery(options)}`, {
    headers: { Accept: 'application/json' },
  });
}

type OperatorActionsQuery = {
  hours?: number | null;
  level?: string;
  limit?: number;
};

function buildOperatorActionsQuery(options: OperatorActionsQuery = {}) {
  const params = new URLSearchParams();

  if (typeof options.limit === 'number' && Number.isFinite(options.limit) && options.limit > 0) {
    params.set('limit', String(options.limit));
  }
  if (typeof options.hours === 'number' && Number.isFinite(options.hours) && options.hours > 0) {
    params.set('hours', String(options.hours));
  }
  if (options.level) {
    params.set('level', options.level);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function fetchOperatorActions(options: OperatorActionsQuery = {}): Promise<{
  ok: boolean;
  actions: Array<{
    id: string;
    type: string;
    symbol: string;
    detail: string;
    actor: string;
    title: string;
    level: string;
    createdAt: string;
  }>;
}> {
  return fetchJson(`/api/task-orchestrator/actions${buildOperatorActionsQuery(options)}`, {
    headers: { Accept: 'application/json' },
  });
}

export async function fetchTaskWorkflows(): Promise<WorkflowRunsSnapshot> {
  return fetchJson('/api/task-orchestrator/workflows', {
    headers: { Accept: 'application/json' },
  });
}

export async function fetchExecutionRuntime(): Promise<{ ok: boolean; events: ExecutionRuntimeEvent[] }> {
  return fetchJson('/api/execution/runtime', {
    headers: { Accept: 'application/json' },
  });
}

export async function fetchExecutionAccountSnapshots(): Promise<{ ok: boolean; snapshots: BrokerAccountSnapshotRecord[] }> {
  return fetchJson('/api/execution/account-snapshots', {
    headers: { Accept: 'application/json' },
  });
}

export async function fetchExecutionLedger(): Promise<{ ok: boolean; entries: ExecutionLedgerEntry[] }> {
  return fetchJson('/api/execution/ledger', {
    headers: { Accept: 'application/json' },
  });
}

export async function fetchLatestBrokerAccountSnapshot(): Promise<LatestBrokerAccountSnapshotResponse> {
  return fetchJson('/api/execution/account-snapshots/latest', {
    headers: { Accept: 'application/json' },
  });
}

export async function fetchMarketProviderStatus(): Promise<{ ok: boolean; status: MarketProviderStatusSnapshot }> {
  return fetchJson('/api/market/provider-status', {
    headers: { Accept: 'application/json' },
  });
}

export async function fetchMonitoringStatus(): Promise<MonitoringStatusSnapshot> {
  return fetchJson('/api/monitoring/status', {
    headers: { Accept: 'application/json' },
  });
}

type MonitoringHistoryQuery = {
  hours?: number | null;
  level?: string;
  limit?: number;
  snapshotId?: string;
  source?: string;
  status?: string;
};

function buildMonitoringHistoryQuery(options: MonitoringHistoryQuery = {}) {
  const params = new URLSearchParams();

  if (typeof options.limit === 'number' && Number.isFinite(options.limit) && options.limit > 0) {
    params.set('limit', String(options.limit));
  }
  if (typeof options.hours === 'number' && Number.isFinite(options.hours) && options.hours > 0) {
    params.set('hours', String(options.hours));
  }
  if (options.snapshotId) {
    params.set('snapshotId', options.snapshotId);
  }
  if (options.source) {
    params.set('source', options.source);
  }
  if (options.level) {
    params.set('level', options.level);
  }
  if (options.status) {
    params.set('status', options.status);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function fetchMonitoringAlerts(options: MonitoringHistoryQuery = {}): Promise<MonitoringAlertsResponse> {
  return fetchJson(`/api/monitoring/alerts${buildMonitoringHistoryQuery(options)}`, {
    headers: { Accept: 'application/json' },
  });
}

export async function fetchMonitoringSnapshots(options: MonitoringHistoryQuery = {}): Promise<MonitoringSnapshotsResponse> {
  return fetchJson(`/api/monitoring/snapshots${buildMonitoringHistoryQuery(options)}`, {
    headers: { Accept: 'application/json' },
  });
}
