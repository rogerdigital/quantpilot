import type {
  ControlPlaneResolution,
  CycleRunPayload,
  OperatorSession,
  ExecutionRuntimeEvent,
  BrokerAccountSnapshotRecord,
  ExecutionLedgerEntry,
  StateCycleResult,
  TradingState,
  UserAccountProfileSnapshot,
  UserBrokerBindingsSnapshot,
  UserBrokerBindingSaveSnapshot,
  UserBrokerBindingRuntimeSnapshot,
  UserPreferencesUpdateSnapshot,
  UserProfileUpdateSnapshot,
} from '@shared-types/trading.ts';

function jsonHeaders() {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

export async function fetchOperatorSession(): Promise<OperatorSession> {
  const response = await fetch('/api/auth/session', {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchUserAccountProfile(): Promise<UserAccountProfileSnapshot> {
  const response = await fetch('/api/user-account/profile', {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export async function updateUserAccountProfile(payload: Record<string, unknown>): Promise<UserProfileUpdateSnapshot> {
  const response = await fetch('/api/user-account/profile', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export async function updateUserAccountPreferences(payload: Record<string, unknown>): Promise<UserPreferencesUpdateSnapshot> {
  const response = await fetch('/api/user-account/preferences', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchBrokerBindings(): Promise<UserBrokerBindingsSnapshot> {
  const response = await fetch('/api/user-account/broker-bindings', {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export async function saveBrokerBinding(payload: Record<string, unknown>): Promise<UserBrokerBindingSaveSnapshot> {
  const response = await fetch('/api/user-account/broker-bindings', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchBrokerBindingRuntime(): Promise<UserBrokerBindingRuntimeSnapshot> {
  const response = await fetch('/api/user-account/broker-bindings/runtime', {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export async function syncBrokerBindingRuntime(): Promise<UserBrokerBindingRuntimeSnapshot> {
  const response = await fetch('/api/user-account/broker-bindings/sync', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
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
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export async function runStateCycle(state: TradingState): Promise<StateCycleResult> {
  const response = await fetch('/api/task-orchestrator/state/run', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ state }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
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
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchNotifications() {
  const response = await fetch('/api/notification/events', {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchRiskEvents() {
  const response = await fetch('/api/risk/events', {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchSchedulerTicks() {
  const response = await fetch('/api/scheduler/ticks', {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchOperatorActions() {
  const response = await fetch('/api/task-orchestrator/actions', {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchExecutionRuntime(): Promise<{ ok: boolean; events: ExecutionRuntimeEvent[] }> {
  const response = await fetch('/api/execution/runtime', {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchExecutionAccountSnapshots(): Promise<{ ok: boolean; snapshots: BrokerAccountSnapshotRecord[] }> {
  const response = await fetch('/api/execution/account-snapshots', {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchExecutionLedger(): Promise<{ ok: boolean; entries: ExecutionLedgerEntry[] }> {
  const response = await fetch('/api/execution/ledger', {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}
