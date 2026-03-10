import type {
  ControlPlaneResolution,
  CycleRunPayload,
  OperatorSession,
  ExecutionRuntimeEvent,
  BrokerAccountSnapshotRecord,
  ExecutionLedgerEntry,
  LatestBrokerAccountSnapshotResponse,
  StateCycleResult,
  TradingState,
  UserAccountProfileSnapshot,
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

export async function fetchSchedulerTicks(): Promise<{
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
  return fetchJson('/api/scheduler/ticks', {
    headers: { Accept: 'application/json' },
  });
}

export async function fetchOperatorActions(): Promise<{
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
  return fetchJson('/api/task-orchestrator/actions', {
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
