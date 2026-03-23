import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';
import { isSchedulerAttentionStatus } from '../../../modules/scheduler/service.mjs';

function parseTimestamp(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortByRecency(items, timestampKey = 'createdAt') {
  return [...items].sort((left, right) => parseTimestamp(right[timestampKey] || right.updatedAt) - parseTimestamp(left[timestampKey] || left.updatedAt));
}

function takeLatest(items, limit, timestampKey = 'createdAt') {
  return sortByRecency(items, timestampKey).slice(0, limit);
}

function isLinkedRiskEvent(item) {
  const message = `${item?.title || ''} ${item?.message || ''}`.toLowerCase();
  return item?.source === 'scheduler'
    || Boolean(item?.metadata?.schedulerTickId)
    || message.includes('scheduler')
    || message.includes('pre-open')
    || message.includes('post-close')
    || message.includes('intraday');
}

function isLinkedSchedulerNotification(item) {
  const text = `${item?.title || ''} ${item?.message || ''}`.toLowerCase();
  return item?.source === 'scheduler'
    || text.includes('scheduler')
    || text.includes('pre-open')
    || text.includes('post-close')
    || text.includes('intraday');
}

function isLinkedIncident(item) {
  return item?.source === 'scheduler'
    || item?.source === 'risk'
    || Boolean(item?.metadata?.schedulerTickId)
    || Boolean(item?.metadata?.riskEventId)
    || (Array.isArray(item?.links) && item.links.some((link) => link?.kind === 'scheduler-tick' || link?.kind === 'risk-event'));
}

function isCycleAttention(item) {
  return item.pendingApprovals > 0 || !item.brokerConnected || !item.marketConnected || ['REVIEW', 'RISK OFF'].includes(item.riskLevel);
}

function buildRunbook(input) {
  const items = [];

  if (input.currentPhaseAttention > 0) {
    items.push({
      key: 'focus-linked-window',
      priority: input.riskOffLinked > 0 ? 'now' : 'next',
      title: 'Focus the linked scheduler window',
      detail: 'The active scheduler window still contains linked risk signals or attention ticks that should be reviewed together.',
      count: input.currentPhaseAttention,
    });
  }
  if (input.linkedRiskEvents > 0) {
    items.push({
      key: 'review-linked-risk',
      priority: input.riskOffLinked > 0 ? 'now' : 'next',
      title: 'Review linked risk signals',
      detail: 'Scheduler-linked risk events should be reconciled before the next middleware transition.',
      count: input.linkedRiskEvents,
    });
  }
  if (input.linkedIncidents > 0) {
    items.push({
      key: 'triage-linked-incidents',
      priority: 'next',
      title: 'Triage linked incidents',
      detail: 'Incidents connected to both scheduler and risk paths still need ownership or closeout.',
      count: input.linkedIncidents,
    });
  }
  if (input.cycleAttention > 0) {
    items.push({
      key: 'align-cycle-posture',
      priority: 'next',
      title: 'Align cycle posture',
      detail: 'Cycle attention suggests the scheduler window and the risk posture have drifted apart.',
      count: input.cycleAttention,
    });
  }
  if (input.linkedNotifications > 0) {
    items.push({
      key: 'clear-linked-notifications',
      priority: 'next',
      title: 'Clear linked notifications',
      detail: 'Notifications tied to the current risk and scheduler path should be reviewed before they go stale.',
      count: input.linkedNotifications,
    });
  }

  return items;
}

function resolvePosture(input) {
  if (input.riskOffLinked > 0 || input.criticalTicks > 0 || input.linkedIncidents > 0) {
    return {
      status: 'critical',
      title: 'Risk and scheduler paths are out of sync',
      detail: 'Linked risk-off signals, critical scheduler drift, or unresolved incidents indicate the middleware path needs direct intervention.',
    };
  }
  if (input.linkedRiskEvents > 0 || input.currentPhaseAttention > 0 || input.cycleAttention > 0 || input.linkedNotifications > 0) {
    return {
      status: 'warn',
      title: 'Risk and scheduler linkage needs review',
      detail: 'The risk middleware and scheduler windows are still carrying linked attention items that should be reviewed together.',
    };
  }
  return {
    status: 'healthy',
    title: 'Risk and scheduler linkage is stable',
    detail: 'The active scheduler window and linked risk middleware signals are currently aligned.',
  };
}

export function getRiskSchedulerLinkage(options = {}) {
  const limit = Number(options.limit) > 0 ? Number(options.limit) : 12;
  const since = options.since || '';
  const schedulerTicks = controlPlaneRuntime.listSchedulerTicks(Math.max(limit * 4, 80), { since });
  const riskEvents = controlPlaneRuntime.listRiskEvents(Math.max(limit * 4, 80))
    .filter((item) => !since || parseTimestamp(item.createdAt) >= parseTimestamp(since))
    .filter(isLinkedRiskEvent);
  const incidents = controlPlaneRuntime.listIncidents(Math.max(limit * 4, 80), { since })
    .filter((item) => item.status !== 'resolved')
    .filter(isLinkedIncident);
  const notifications = controlPlaneRuntime.listNotifications(Math.max(limit * 4, 80), { since })
    .filter(isLinkedSchedulerNotification);
  const cycleRecords = controlPlaneRuntime.listCycleRecords(Math.max(limit * 4, 80))
    .filter((item) => !since || parseTimestamp(item.createdAt) >= parseTimestamp(since))
    .filter(isCycleAttention);

  const activePhase = schedulerTicks[0]?.phase || 'UNKNOWN';
  const linkedSchedulerTicks = schedulerTicks.filter((item) => {
    const metadataId = item.metadata?.previousPhase || item.metadata?.bucket || '';
    return isSchedulerAttentionStatus(item.status)
      || riskEvents.some((event) => event.metadata?.schedulerTickId === item.id || String(event.metadata?.schedulerPhase || '') === item.phase)
      || incidents.some((incident) => Array.isArray(incident.links) && incident.links.some((link) => link?.tickId === item.id || link?.phase === item.phase))
      || Boolean(metadataId && activePhase === item.phase);
  });
  const criticalTicks = linkedSchedulerTicks.filter((item) => item.status === 'critical' || item.status === 'failed' || item.status === 'missed-window');
  const currentPhaseAttention = linkedSchedulerTicks.filter((item) => item.phase === activePhase).length;
  const riskOffLinked = riskEvents.filter((item) => item.status === 'risk-off').length;
  const complianceLinked = riskEvents.filter((item) => {
    const message = `${item.title} ${item.message}`.toLowerCase();
    return message.includes('compliance') || message.includes('policy');
  }).length;
  const posture = resolvePosture({
    linkedRiskEvents: riskEvents.length,
    currentPhaseAttention,
    cycleAttention: cycleRecords.length,
    linkedNotifications: notifications.length,
    linkedIncidents: incidents.length,
    riskOffLinked,
    criticalTicks: criticalTicks.length,
  });
  const generatedAt = new Date().toISOString();

  return {
    posture,
    summary: {
      linkedRiskEvents: riskEvents.length,
      linkedSchedulerTicks: linkedSchedulerTicks.length,
      linkedIncidents: incidents.length,
      linkedNotifications: notifications.length,
      cycleAttention: cycleRecords.length,
      currentPhaseAttention,
      riskOffLinked,
      complianceLinked,
      activePhase,
    },
    lanes: [
      {
        key: 'current-window',
        title: 'Current Window',
        status: criticalTicks.some((item) => item.phase === activePhase) ? 'critical' : (currentPhaseAttention ? 'warn' : 'healthy'),
        detail: `${currentPhaseAttention} linked items are attached to the active ${activePhase} scheduler window.`,
        primaryCount: currentPhaseAttention,
        secondaryCount: linkedSchedulerTicks.filter((item) => item.phase === activePhase).length,
        updatedAt: schedulerTicks[0]?.createdAt || generatedAt,
      },
      {
        key: 'risk-events',
        title: 'Risk Events',
        status: riskOffLinked > 0 ? 'critical' : (riskEvents.length ? 'warn' : 'healthy'),
        detail: `${riskEvents.length} risk events link back to scheduler windows or timing drift.`,
        primaryCount: riskEvents.length,
        secondaryCount: riskOffLinked,
        updatedAt: riskEvents[0]?.createdAt || generatedAt,
      },
      {
        key: 'scheduler-ticks',
        title: 'Scheduler Ticks',
        status: criticalTicks.length ? 'critical' : (linkedSchedulerTicks.length ? 'warn' : 'healthy'),
        detail: `${linkedSchedulerTicks.length} scheduler ticks are part of the current risk linkage path.`,
        primaryCount: linkedSchedulerTicks.length,
        secondaryCount: criticalTicks.length,
        updatedAt: linkedSchedulerTicks[0]?.createdAt || generatedAt,
      },
      {
        key: 'incidents',
        title: 'Incidents',
        status: incidents.some((item) => item.severity === 'critical') ? 'critical' : (incidents.length ? 'warn' : 'healthy'),
        detail: `${incidents.length} unresolved incidents sit across the shared risk and scheduler path.`,
        primaryCount: incidents.length,
        secondaryCount: incidents.filter((item) => item.severity === 'critical').length,
        updatedAt: incidents[0]?.updatedAt || generatedAt,
      },
      {
        key: 'cycles',
        title: 'Cycle Drift',
        status: cycleRecords.some((item) => !item.brokerConnected || !item.marketConnected) ? 'critical' : (cycleRecords.length ? 'warn' : 'healthy'),
        detail: `${cycleRecords.length} cycle records show approvals, degraded connectivity, or elevated risk posture around scheduler windows.`,
        primaryCount: cycleRecords.length,
        secondaryCount: cycleRecords.filter((item) => item.pendingApprovals > 0).length,
        updatedAt: cycleRecords[0]?.createdAt || generatedAt,
      },
      {
        key: 'notifications',
        title: 'Notifications',
        status: notifications.some((item) => item.level === 'critical') ? 'critical' : (notifications.length ? 'warn' : 'healthy'),
        detail: `${notifications.length} notifications are linked to the current risk and scheduler path.`,
        primaryCount: notifications.length,
        secondaryCount: notifications.filter((item) => item.level === 'critical').length,
        updatedAt: notifications[0]?.createdAt || generatedAt,
      },
    ],
    runbook: buildRunbook({
      linkedRiskEvents: riskEvents.length,
      currentPhaseAttention,
      linkedIncidents: incidents.length,
      cycleAttention: cycleRecords.length,
      linkedNotifications: notifications.length,
      riskOffLinked,
    }),
    queue: {
      riskEvents: takeLatest(riskEvents, limit),
      schedulerTicks: takeLatest(linkedSchedulerTicks, limit),
      incidents: takeLatest(incidents, limit, 'updatedAt'),
      notifications: takeLatest(notifications, limit),
      cycleRecords: takeLatest(cycleRecords, limit),
    },
  };
}
