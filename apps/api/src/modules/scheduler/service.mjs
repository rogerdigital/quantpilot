import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.mjs';
import { getRiskSchedulerLinkage } from '../../domains/risk/services/risk-scheduler-linkage-service.mjs';

const SCHEDULER_RUNBOOK_KEYS = new Set([
  'review-current-window',
  'triage-scheduler-incidents',
  'clear-scheduler-signals',
  'follow-cycle-drift',
  'align-risk-window',
  'review-off-hours-watch',
]);

function parseLimit(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveSince(hours) {
  const parsed = Number(hours);
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  return new Date(Date.now() - parsed * 60 * 60 * 1000).toISOString();
}

function parseTimestamp(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortByRecency(items, timestampKey = 'createdAt') {
  return [...items].sort((left, right) => parseTimestamp(right[timestampKey]) - parseTimestamp(left[timestampKey]));
}

function takeLatest(items, limit, timestampKey = 'createdAt') {
  return sortByRecency(items, timestampKey).slice(0, limit);
}

const NEUTRAL_SCHEDULER_STATUSES = new Set(['healthy', 'ok', 'completed', 'success', 'steady', 'phase-change', 'info']);

export function isSchedulerAttentionStatus(status = '') {
  return Boolean(status) && !NEUTRAL_SCHEDULER_STATUSES.has(status);
}

function isSchedulerCriticalStatus(status = '') {
  return ['critical', 'failed', 'missed-window', 'drift-critical'].includes(status);
}

function isSchedulerLinkedRiskEvent(item) {
  const message = `${item?.title || ''} ${item?.message || ''}`.toLowerCase();
  return item?.source === 'scheduler'
    || Boolean(item?.metadata?.schedulerTickId)
    || message.includes('scheduler')
    || message.includes('pre-open')
    || message.includes('post-close')
    || message.includes('intraday');
}

function buildRunbook(input) {
  const items = [];

  if (input.currentWindowAttention > 0) {
    items.push({
      key: 'review-current-window',
      priority: input.criticalTicks > 0 ? 'now' : 'next',
      title: 'Review current scheduler window',
      detail: 'The active scheduler window includes attention ticks that can disrupt operator timing and middleware sequencing.',
      count: input.currentWindowAttention,
    });
  }

  if (input.openIncidents > 0) {
    items.push({
      key: 'triage-scheduler-incidents',
      priority: input.criticalIncidents > 0 ? 'now' : 'next',
      title: 'Triage scheduler incidents',
      detail: 'Scheduler-linked incidents still need ownership, mitigation updates, or explicit closeout.',
      count: input.openIncidents,
    });
  }

  if (input.schedulerNotifications > 0) {
    items.push({
      key: 'clear-scheduler-signals',
      priority: input.notificationCritical > 0 ? 'now' : 'next',
      title: 'Clear scheduler notifications',
      detail: 'Scheduler notifications and warnings should be reconciled against the active phase before they pile up.',
      count: input.schedulerNotifications,
    });
  }

  if (input.cycleAttention > 0) {
    items.push({
      key: 'follow-cycle-drift',
      priority: 'next',
      title: 'Follow cycle drift',
      detail: 'Control-plane cycles show degraded connectivity, pending approvals, or review-level risk posture around scheduler windows.',
      count: input.cycleAttention,
    });
  }

  if (input.riskSignals > 0) {
    items.push({
      key: 'align-risk-window',
      priority: 'next',
      title: 'Align risk with scheduler',
      detail: 'Risk middleware is emitting scheduler-linked signals and should be reviewed together with the current scheduling window.',
      count: input.riskSignals,
    });
  }

  if (input.offHoursAttention > 0) {
    items.push({
      key: 'review-off-hours-watch',
      priority: 'next',
      title: 'Review off-hours watch',
      detail: 'Off-hours scheduler activity is carrying attention items that should be explained before the next market window.',
      count: input.offHoursAttention,
    });
  }

  return items;
}

function resolvePosture(input) {
  if (input.criticalTicks > 0 || input.criticalIncidents > 0) {
    return {
      status: 'critical',
      title: 'Scheduler posture needs intervention',
      detail: 'Critical scheduler ticks or unresolved scheduler incidents indicate the orchestration path is outside its active guardrails.',
    };
  }

  if (input.attentionTicks > 0 || input.cycleAttention > 0 || input.schedulerNotifications > 0 || input.riskSignals > 0) {
    return {
      status: 'warn',
      title: 'Scheduler posture requires review',
      detail: 'Scheduler windows, notifications, or adjacent risk and cycle signals still need operator review.',
    };
  }

  return {
    status: 'healthy',
    title: 'Scheduler posture is stable',
    detail: 'Scheduler windows, cycle health, and linked control-plane signals are currently aligned.',
  };
}

export function listSchedulerTicks(options = {}) {
  return controlPlaneRuntime.listSchedulerTicks(parseLimit(options.limit, 50), {
    phase: options.phase || '',
    since: resolveSince(options.hours),
  });
}

export function runSchedulerTick(options = {}) {
  return controlPlaneRuntime.recordSchedulerTick(options);
}

export function getSchedulerWorkbench(options = {}) {
  const limit = parseLimit(options.limit, 80);
  const since = resolveSince(options.hours);
  const ticks = controlPlaneRuntime.listSchedulerTicks(Math.max(limit * 4, 120), { since });
  const notifications = controlPlaneRuntime.listNotifications(Math.max(limit * 3, 120), {
    since,
    source: 'scheduler',
  });
  const incidents = controlPlaneRuntime.listIncidents(Math.max(limit * 3, 120), {
    since,
    source: 'scheduler',
  }).filter((item) => item.status !== 'resolved');
  const cycleRecords = controlPlaneRuntime.listCycleRecords(Math.max(limit * 3, 120))
    .filter((item) => !since || parseTimestamp(item.createdAt) >= parseTimestamp(since));
  const riskEvents = controlPlaneRuntime.listRiskEvents(Math.max(limit * 3, 120))
    .filter((item) => !since || parseTimestamp(item.createdAt) >= parseTimestamp(since))
    .filter(isSchedulerLinkedRiskEvent);
  const linkage = getRiskSchedulerLinkage({ limit, since });

  const attentionTicks = ticks.filter((item) => isSchedulerAttentionStatus(item.status));
  const criticalTicks = attentionTicks.filter((item) => isSchedulerCriticalStatus(item.status));
  const phaseChanges = ticks.filter((item) => item.status === 'phase-change');
  const currentPhase = ticks[0]?.phase || 'UNKNOWN';
  const currentWindowAttention = attentionTicks.filter((item) => item.phase === currentPhase).length;
  const cycleAttention = cycleRecords.filter((item) => item.pendingApprovals > 0 || !item.brokerConnected || !item.marketConnected || ['REVIEW', 'RISK OFF'].includes(item.riskLevel));
  const criticalIncidents = incidents.filter((item) => item.severity === 'critical');
  const notificationCritical = notifications.filter((item) => item.level === 'critical').length;
  const offHoursAttention = attentionTicks.filter((item) => item.phase === 'OFF_HOURS').length;
  const posture = resolvePosture({
    attentionTicks: attentionTicks.length,
    criticalIncidents: criticalIncidents.length,
    criticalTicks: criticalTicks.length,
    cycleAttention: cycleAttention.length,
    riskSignals: riskEvents.length,
    schedulerNotifications: notifications.length,
  });
  const generatedAt = new Date().toISOString();

  function summarizePhase(phase, title) {
    const phaseTicks = ticks.filter((item) => item.phase === phase);
    const phaseAttention = phaseTicks.filter((item) => isSchedulerAttentionStatus(item.status));
    return {
      key: title.toLowerCase(),
      title,
      status: phaseAttention.some((item) => isSchedulerCriticalStatus(item.status)) ? 'critical' : (phaseAttention.length ? 'warn' : 'healthy'),
      detail: phaseTicks.length
        ? `${phaseTicks.length} ${phase} ticks observed with ${phaseAttention.length} attention items.`
        : `No ${phase} ticks were observed in the current scheduler window.`,
      primaryCount: phaseTicks.length,
      secondaryCount: phaseAttention.length,
      updatedAt: phaseTicks[0]?.createdAt || generatedAt,
    };
  }

  return {
    ok: true,
    generatedAt,
    posture: {
      ...posture,
      currentPhase,
      lastTickAt: ticks[0]?.createdAt || '',
    },
    summary: {
      totalTicks: ticks.length,
      attentionTicks: attentionTicks.length,
      criticalTicks: criticalTicks.length,
      phaseChanges: phaseChanges.length,
      preOpenTicks: ticks.filter((item) => item.phase === 'PRE_OPEN').length,
      intradayTicks: ticks.filter((item) => item.phase === 'INTRADAY').length,
      postCloseTicks: ticks.filter((item) => item.phase === 'POST_CLOSE').length,
      offHoursTicks: ticks.filter((item) => item.phase === 'OFF_HOURS').length,
      openIncidents: incidents.length,
      cycleAttention: cycleAttention.length,
      schedulerNotifications: notifications.length,
      riskSignals: riskEvents.length,
    },
    lanes: [
      {
        ...summarizePhase('PRE_OPEN', 'Pre-Open'),
        key: 'pre-open',
      },
      {
        ...summarizePhase('INTRADAY', 'Intraday'),
        key: 'intraday',
      },
      {
        ...summarizePhase('POST_CLOSE', 'Post-Close'),
        key: 'post-close',
      },
      {
        ...summarizePhase('OFF_HOURS', 'Off-Hours'),
        key: 'off-hours',
      },
      {
        key: 'incidents',
        title: 'Incidents',
        status: criticalIncidents.length ? 'critical' : (incidents.length ? 'warn' : 'healthy'),
        detail: `${incidents.length} unresolved scheduler incidents remain in the operator path.`,
        primaryCount: incidents.length,
        secondaryCount: criticalIncidents.length,
        updatedAt: incidents[0]?.updatedAt || generatedAt,
      },
      {
        key: 'cycles',
        title: 'Cycles',
        status: cycleAttention.some((item) => !item.brokerConnected || !item.marketConnected) ? 'critical' : (cycleAttention.length ? 'warn' : 'healthy'),
        detail: `${cycleAttention.length} cycle records show approvals, degraded connectivity, or elevated risk posture around scheduler windows.`,
        primaryCount: cycleAttention.length,
        secondaryCount: cycleAttention.filter((item) => item.pendingApprovals > 0).length,
        updatedAt: cycleRecords[0]?.createdAt || generatedAt,
      },
      {
        key: 'notifications',
        title: 'Notifications',
        status: notificationCritical ? 'critical' : (notifications.length ? 'warn' : 'healthy'),
        detail: `${notifications.length} scheduler notifications are available for operator follow-up.`,
        primaryCount: notifications.length,
        secondaryCount: notificationCritical,
        updatedAt: notifications[0]?.createdAt || generatedAt,
      },
      {
        key: 'risk',
        title: 'Risk Linkage',
        status: riskEvents.some((item) => item.level === 'critical' || item.status === 'risk-off') ? 'critical' : (riskEvents.length ? 'warn' : 'healthy'),
        detail: `${riskEvents.length} risk events are linked back to scheduler windows or drift signals.`,
        primaryCount: riskEvents.length,
        secondaryCount: riskEvents.filter((item) => item.status === 'risk-off').length,
        updatedAt: riskEvents[0]?.createdAt || generatedAt,
      },
    ],
    runbook: buildRunbook({
      criticalTicks: criticalTicks.length,
      currentWindowAttention,
      cycleAttention: cycleAttention.length,
      criticalIncidents: criticalIncidents.length,
      notificationCritical,
      offHoursAttention,
      openIncidents: incidents.length,
      riskSignals: riskEvents.length,
      schedulerNotifications: notifications.length,
    }),
    queue: {
      attentionTicks: takeLatest(attentionTicks, limit),
      incidents: takeLatest(incidents, limit, 'updatedAt'),
      notifications: takeLatest(notifications, limit),
      cycleRecords: takeLatest(cycleAttention, limit),
      riskEvents: takeLatest(riskEvents, limit),
    },
    recent: {
      ticks: takeLatest(ticks, limit),
      incidents: takeLatest(incidents, limit, 'updatedAt'),
      notifications: takeLatest(notifications, limit),
      cycleRecords: takeLatest(cycleRecords, limit),
      riskEvents: takeLatest(riskEvents, limit),
    },
    linkage,
  };
}

function resolveCurrentPhase(workbench) {
  if (workbench.posture.currentPhase && workbench.posture.currentPhase !== 'UNKNOWN') {
    return workbench.posture.currentPhase;
  }
  return workbench.linkage.summary.activePhase || 'INTRADAY';
}

function resolveActionTargets(actionKey, workbench) {
  const currentPhase = resolveCurrentPhase(workbench);
  const currentWindowAttention = workbench.queue.attentionTicks.filter((item) => item.phase === currentPhase);
  const offHoursAttention = workbench.queue.attentionTicks.filter((item) => item.phase === 'OFF_HOURS');

  if (actionKey === 'review-current-window') {
    return {
      phase: currentPhase,
      attentionTicks: currentWindowAttention,
      incidents: workbench.queue.incidents,
      notifications: workbench.queue.notifications,
      cycleRecords: workbench.queue.cycleRecords,
      riskEvents: workbench.queue.riskEvents,
    };
  }

  if (actionKey === 'triage-scheduler-incidents') {
    return {
      phase: currentPhase,
      attentionTicks: currentWindowAttention,
      incidents: workbench.queue.incidents,
      notifications: [],
      cycleRecords: [],
      riskEvents: [],
    };
  }

  if (actionKey === 'clear-scheduler-signals') {
    return {
      phase: currentPhase,
      attentionTicks: currentWindowAttention,
      incidents: workbench.queue.incidents,
      notifications: workbench.queue.notifications,
      cycleRecords: [],
      riskEvents: [],
    };
  }

  if (actionKey === 'follow-cycle-drift') {
    return {
      phase: currentPhase,
      attentionTicks: currentWindowAttention,
      incidents: workbench.queue.incidents,
      notifications: workbench.queue.notifications,
      cycleRecords: workbench.queue.cycleRecords,
      riskEvents: [],
    };
  }

  if (actionKey === 'align-risk-window') {
    return {
      phase: currentPhase,
      attentionTicks: currentWindowAttention,
      incidents: workbench.queue.incidents,
      notifications: workbench.queue.notifications,
      cycleRecords: workbench.queue.cycleRecords,
      riskEvents: workbench.queue.riskEvents,
    };
  }

  return {
    phase: 'OFF_HOURS',
    attentionTicks: offHoursAttention,
    incidents: workbench.queue.incidents,
    notifications: workbench.queue.notifications,
    cycleRecords: workbench.queue.cycleRecords,
    riskEvents: workbench.queue.riskEvents.filter((item) => String(item.metadata?.schedulerPhase || '') === 'OFF_HOURS'),
  };
}

function buildOrchestrationDescriptor(actionKey, workbench, targets) {
  const currentPhase = targets.phase || resolveCurrentPhase(workbench);
  const hasCriticalNotification = targets.notifications.some((item) => item.level === 'critical');
  const hasCriticalRisk = targets.riskEvents.some((item) => item.level === 'critical' || item.status === 'risk-off');
  const hasCriticalTick = targets.attentionTicks.some((item) => isSchedulerCriticalStatus(item.status));
  const hasCriticalIncident = targets.incidents.some((item) => item.severity === 'critical');
  const level = hasCriticalNotification || hasCriticalRisk || hasCriticalTick || hasCriticalIncident ? 'critical' : 'warn';

  if (actionKey === 'review-current-window') {
    return {
      phase: currentPhase,
      level,
      title: 'Review current scheduler window',
      detail: `Operator review was triggered for the ${currentPhase} scheduler window to reconcile attention ticks, incidents, and linked control-plane signals.`,
      tickStatus: 'info',
      createCycleRecord: true,
      riskLevel: level === 'critical' ? 'REVIEW' : 'NORMAL',
    };
  }
  if (actionKey === 'triage-scheduler-incidents') {
    return {
      phase: currentPhase,
      level: hasCriticalIncident ? 'critical' : 'warn',
      title: 'Triage scheduler incidents',
      detail: `Scheduler incidents were moved into an active triage pass for the ${currentPhase} orchestration window.`,
      tickStatus: 'info',
      createCycleRecord: false,
      riskLevel: 'REVIEW',
    };
  }
  if (actionKey === 'clear-scheduler-signals') {
    return {
      phase: currentPhase,
      level: hasCriticalNotification ? 'critical' : 'warn',
      title: 'Clear scheduler notifications',
      detail: `Scheduler notifications were reviewed against the ${currentPhase} window so stale or duplicated signals can be cleared before they stack up.`,
      tickStatus: 'info',
      createCycleRecord: false,
      riskLevel: 'NORMAL',
    };
  }
  if (actionKey === 'follow-cycle-drift') {
    return {
      phase: currentPhase,
      level: targets.cycleRecords.length > 0 ? 'warn' : 'info',
      title: 'Follow cycle drift',
      detail: `Cycle drift was reviewed alongside the active scheduler window to stabilize pending approvals and middleware connectivity.`,
      tickStatus: 'info',
      createCycleRecord: true,
      riskLevel: 'REVIEW',
    };
  }
  if (actionKey === 'align-risk-window') {
    return {
      phase: currentPhase,
      level: hasCriticalRisk ? 'critical' : 'warn',
      title: 'Align risk with scheduler',
      detail: `Risk-linked scheduler signals were synchronized with the ${currentPhase} window so review posture, incidents, and notifications share one operator path.`,
      tickStatus: 'info',
      createCycleRecord: true,
      riskLevel: hasCriticalRisk ? 'RISK OFF' : 'REVIEW',
    };
  }
  return {
    phase: 'OFF_HOURS',
    level: targets.attentionTicks.length ? 'warn' : 'info',
    title: 'Review off-hours watch',
    detail: 'Off-hours scheduler activity was reviewed so overnight drift and pending follow-up stay visible before the next market window.',
    tickStatus: 'info',
    createCycleRecord: false,
    riskLevel: 'NORMAL',
  };
}

function buildIncidentLinks(targets) {
  return [
    ...targets.attentionTicks.map((item) => ({ kind: 'scheduler-tick', tickId: item.id })),
    ...targets.notifications.map((item) => ({ kind: 'notification', notificationId: item.id })),
    ...targets.cycleRecords.map((item) => ({ kind: 'cycle', cycleId: item.id })),
    ...targets.riskEvents.map((item) => ({ kind: 'risk-event', riskEventId: item.id })),
  ].slice(0, 12);
}

function upsertSchedulerIncidents(actor, descriptor, targets) {
  const incidentNote = `${descriptor.title} runbook action executed by ${actor}. ${descriptor.detail}`;
  const touched = [];
  const existing = targets.incidents.filter((item) => item.status !== 'resolved');

  existing.forEach((incident) => {
    const nextStatus = incident.status === 'open' ? 'investigating' : incident.status;
    const transitioned = controlPlaneRuntime.transitionIncident(incident.id, {
      actor,
      owner: incident.owner || actor,
      status: nextStatus,
      summary: incident.summary || descriptor.detail,
    });
    if (transitioned) {
      touched.push(transitioned);
      controlPlaneRuntime.recordIncidentNote(transitioned.id, {
        author: actor,
        body: incidentNote,
        metadata: {
          schedulerAction: descriptor.title,
          schedulerPhase: descriptor.phase,
        },
      });
    }
  });

  if (!touched.length && descriptor.level !== 'info') {
    const created = controlPlaneRuntime.recordIncident({
      title: `${descriptor.title} requires follow-up`,
      summary: descriptor.detail,
      severity: descriptor.level === 'critical' ? 'critical' : 'warn',
      source: 'scheduler',
      status: 'investigating',
      owner: actor,
      actor,
      links: buildIncidentLinks(targets),
      tags: ['scheduler', 'orchestration', descriptor.phase.toLowerCase()],
      metadata: {
        schedulerAction: descriptor.title,
        schedulerPhase: descriptor.phase,
      },
    });
    if (created) {
      touched.push(created);
      controlPlaneRuntime.recordIncidentNote(created.id, {
        author: actor,
        body: incidentNote,
        metadata: {
          schedulerAction: descriptor.title,
          schedulerPhase: descriptor.phase,
          autoCreated: true,
        },
      });
    }
  }

  return touched;
}

export function runSchedulerOrchestrationAction(payload = {}) {
  const actionKey = String(payload.actionKey || '').trim();
  if (!SCHEDULER_RUNBOOK_KEYS.has(actionKey)) {
    return {
      ok: false,
      message: 'unknown scheduler action',
    };
  }

  const actor = String(payload.actor || 'operator').trim() || 'operator';
  const workbench = getSchedulerWorkbench({
    limit: payload.limit,
    hours: payload.hours,
  });
  const targets = resolveActionTargets(actionKey, workbench);
  const descriptor = buildOrchestrationDescriptor(actionKey, workbench, targets);

  const incidents = upsertSchedulerIncidents(actor, descriptor, targets);
  const touchedIncidentIds = incidents.map((item) => item.id);
  const touchedNotificationIds = targets.notifications.map((item) => item.id);
  const touchedRiskEventIds = targets.riskEvents.map((item) => item.id);
  const touchedCycleIds = targets.cycleRecords.map((item) => item.id);

  const operatorAction = controlPlaneRuntime.recordOperatorAction({
    type: `scheduler.orchestration.${actionKey}`,
    actor,
    title: descriptor.title,
    detail: descriptor.detail,
    level: descriptor.level,
    metadata: {
      schedulerPhase: descriptor.phase,
      incidentIds: touchedIncidentIds,
      notificationIds: touchedNotificationIds,
      riskEventIds: touchedRiskEventIds,
      cycleIds: touchedCycleIds,
    },
  });

  const schedulerTick = controlPlaneRuntime.recordSchedulerTick({
    phase: descriptor.phase,
    status: descriptor.tickStatus,
    title: `${descriptor.title} executed`,
    message: descriptor.detail,
    metadata: {
      orchestrated: true,
      actionKey,
      actor,
      incidentIds: touchedIncidentIds,
      notificationIds: touchedNotificationIds,
      riskEventIds: touchedRiskEventIds,
      cycleIds: touchedCycleIds,
    },
  });

  let cycleRecord = null;
  if (descriptor.createCycleRecord) {
    const latestCycle = controlPlaneRuntime.listCycleRecords(1)[0] || null;
    cycleRecord = controlPlaneRuntime.recordCycleRun({
      cycle: Number(latestCycle?.cycle || 0) + 1,
      mode: 'scheduler-orchestration',
      riskLevel: descriptor.riskLevel,
      decisionSummary: descriptor.detail,
      marketClock: descriptor.phase,
      pendingApprovals: touchedIncidentIds.length,
      liveIntentCount: 0,
      brokerConnected: latestCycle?.brokerConnected ?? true,
      marketConnected: latestCycle?.marketConnected ?? true,
    });
  }

  return {
    ok: true,
    action: {
      key: actionKey,
      actor,
      title: descriptor.title,
      detail: descriptor.detail,
      level: descriptor.level,
      phase: descriptor.phase,
      executedAt: schedulerTick.createdAt,
      touchedIncidentIds,
      touchedNotificationIds,
      touchedRiskEventIds,
      touchedCycleIds,
    },
    operatorAction,
    schedulerTick,
    cycleRecord,
    incidents,
    workbench: getSchedulerWorkbench({
      limit: payload.limit,
      hours: payload.hours,
    }),
  };
}
