import { appendAuditRecord } from '../audit/service.mjs';
import { queueNotification } from '../notification/service.mjs';
import {
  appendCycleRecord,
  appendOperatorAction,
  listCycleRecords,
  listOperatorActions,
} from '../../../../../packages/control-plane-store/src/index.mjs';

export function listCycles(limit = 30) {
  return listCycleRecords(limit);
}

export function recordCycleRun(payload) {
  const entry = appendCycleRecord(payload);

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
  const action = appendOperatorAction(payload);

  appendAuditRecord({
    type: action.type,
    actor: action.actor,
    title: action.title,
    detail: action.detail,
    metadata: { symbol: action.symbol, level: action.level },
  });

  queueNotification({
    level: action.level,
    source: 'control-plane',
    title: action.title,
    message: action.detail,
    metadata: { symbol: action.symbol, type: action.type },
  });

  return action;
}

export function listActions(limit = 50) {
  return listOperatorActions(limit);
}
