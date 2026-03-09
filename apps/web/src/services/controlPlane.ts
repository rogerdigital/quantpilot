import type { ControlPlaneResolution, TradingState } from '@shared-types/trading.ts';

function jsonHeaders() {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

export async function fetchOperatorSession() {
  const response = await fetch('/api/auth/session', {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export async function resolveCycle(state: TradingState): Promise<ControlPlaneResolution> {
  const response = await fetch('/api/task-orchestrator/cycles/resolve', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      cycle: state.cycle,
      mode: state.mode,
      riskLevel: state.riskLevel,
      decisionSummary: state.decisionSummary,
      marketClock: state.marketClock,
      pendingApprovals: state.approvalQueue.length,
      liveIntentCount: state.pendingLiveIntents.length,
      brokerConnected: state.integrationStatus.broker.connected,
      marketConnected: state.integrationStatus.marketData.connected,
    }),
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
