import { appendAuditRecord } from '../audit/service.mjs';
import { queueNotification } from '../notification/service.mjs';

const cycleRuns = [];

export function listCycles(limit = 30) {
  return cycleRuns.slice(0, limit);
}

export function recordCycleRun(payload) {
  const entry = {
    id: `cycle-${Date.now()}-${cycleRuns.length + 1}`,
    cycle: Number(payload.cycle || 0),
    mode: payload.mode || 'autopilot',
    riskLevel: payload.riskLevel || 'NORMAL',
    decisionSummary: payload.decisionSummary || '',
    marketClock: payload.marketClock || '',
    pendingApprovals: Number(payload.pendingApprovals || 0),
    liveIntentCount: Number(payload.liveIntentCount || 0),
    brokerConnected: Boolean(payload.brokerConnected),
    marketConnected: Boolean(payload.marketConnected),
    createdAt: payload.createdAt || new Date().toISOString(),
  };

  cycleRuns.unshift(entry);
  cycleRuns.splice(60);

  appendAuditRecord({
    type: 'cycle',
    actor: 'task-orchestrator',
    title: `Cycle ${entry.cycle} completed`,
    detail: entry.decisionSummary || 'Cycle completed without a new priority decision.',
    metadata: {
      mode: entry.mode,
      riskLevel: entry.riskLevel,
      pendingApprovals: entry.pendingApprovals,
      liveIntentCount: entry.liveIntentCount,
    },
  });

  if (entry.pendingApprovals > 0) {
    queueNotification({
      level: 'warn',
      source: 'task-orchestrator',
      title: `Cycle ${entry.cycle} requires approval`,
      message: `${entry.pendingApprovals} live actions are waiting for review.`,
      metadata: { cycle: entry.cycle },
    });
  }

  if (!entry.brokerConnected || !entry.marketConnected) {
    queueNotification({
      level: 'warn',
      source: 'task-orchestrator',
      title: `Cycle ${entry.cycle} degraded`,
      message: 'One or more platform integrations are disconnected or running in fallback mode.',
      metadata: {
        cycle: entry.cycle,
        brokerConnected: entry.brokerConnected,
        marketConnected: entry.marketConnected,
      },
    });
  }

  return entry;
}

export function recordAction(payload) {
  const action = {
    id: `action-${Date.now()}`,
    type: payload.type || 'manual',
    symbol: payload.symbol || '',
    detail: payload.detail || '',
    actor: payload.actor || 'operator',
    createdAt: new Date().toISOString(),
  };

  appendAuditRecord({
    type: action.type,
    actor: action.actor,
    title: payload.title || 'Operator action',
    detail: action.detail,
    metadata: { symbol: action.symbol },
  });

  queueNotification({
    level: payload.level || 'info',
    source: 'control-plane',
    title: payload.title || 'Operator action',
    message: action.detail,
    metadata: { symbol: action.symbol, type: action.type },
  });

  return action;
}
