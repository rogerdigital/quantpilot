import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.mjs';

function parseLimit(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveSince(hours) {
  const parsed = Number(hours);
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  return new Date(Date.now() - parsed * 60 * 60 * 1000).toISOString();
}

export function listIncidents(options = {}) {
  return controlPlaneRuntime.listIncidents(parseLimit(options.limit, 50), {
    owner: options.owner || '',
    severity: options.severity || '',
    source: options.source || '',
    status: options.status || '',
    since: resolveSince(options.hours),
  });
}

export function getIncidentDetail(incidentId, options = {}) {
  const incident = controlPlaneRuntime.getIncident(incidentId);
  if (!incident) return null;
  const evidence = collectIncidentEvidence(incident, options);
  const activity = collectIncidentActivity(incidentId, options);
  return {
    incident,
    notes: controlPlaneRuntime.listIncidentNotes(incidentId, parseLimit(options.noteLimit, 100)),
    activity,
    evidence,
  };
}

export function createIncident(payload = {}) {
  return controlPlaneRuntime.recordIncident(payload);
}

export function updateIncident(incidentId, payload = {}) {
  return controlPlaneRuntime.transitionIncident(incidentId, payload);
}

export function appendIncidentNote(incidentId, payload = {}) {
  return controlPlaneRuntime.recordIncidentNote(incidentId, payload);
}

function parseTimestamp(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : null;
}

function intersects(left = [], right = []) {
  if (!left.length || !right.length) return false;
  const set = new Set(right);
  return left.some((item) => set.has(item));
}

function normalizeTokens(...values) {
  return [...new Set(values
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .flatMap((value) => String(value || '')
      .toLowerCase()
      .split(/[^a-z0-9_-]+/g)
      .map((item) => item.trim())
      .filter(Boolean)
    ))];
}

function buildLinkSet(incident) {
  return new Set((incident.links || []).flatMap((item) => Object.values(item || {}).map((value) => String(value || ''))));
}

function buildIncidentContext(incident) {
  const createdAtMs = parseTimestamp(incident.createdAt) || Date.now();
  return {
    createdAtMs,
    fromMs: createdAtMs - (6 * 60 * 60 * 1000),
    toMs: createdAtMs + (7 * 24 * 60 * 60 * 1000),
    linkSet: buildLinkSet(incident),
    source: String(incident.source || '').toLowerCase(),
    tags: normalizeTokens(incident.tags || []),
    textTokens: normalizeTokens(incident.title, incident.summary, incident.latestNotePreview, incident.source, incident.owner),
    metadataTokens: normalizeTokens(Object.values(incident.metadata || {})),
  };
}

function withinIncidentWindow(context, timestamp) {
  const valueMs = parseTimestamp(timestamp);
  if (valueMs === null) return false;
  return valueMs >= context.fromMs && valueMs <= context.toMs;
}

function scoreEvidenceMatch(context, candidate) {
  const refIds = normalizeTokens(candidate.id, ...(candidate.refIds || []));
  const contentTokens = normalizeTokens(candidate.title, candidate.detail, candidate.source, candidate.level, candidate.status, candidate.tokens || []);
  const directLink = refIds.some((item) => context.linkSet.has(item));
  const sourceMatch = context.source && candidate.source?.toLowerCase?.() === context.source;
  const tagMatch = intersects(context.tags, contentTokens);
  const textMatch = intersects([...context.textTokens, ...context.metadataTokens], contentTokens);
  const timeMatch = withinIncidentWindow(context, candidate.timestamp);

  return {
    directLink,
    matched: directLink || ((sourceMatch || tagMatch || textMatch) && timeMatch),
  };
}

function collectIncidentEvidence(incident, options = {}) {
  const limit = parseLimit(options.evidenceLimit, 120);
  const context = buildIncidentContext(incident);
  const evidence = [];

  const monitoringAlerts = controlPlaneRuntime.listMonitoringAlerts(limit, {});
  monitoringAlerts.forEach((item) => {
    const match = scoreEvidenceMatch(context, {
      id: item.id,
      refIds: [item.snapshotId, item.metadata?.monitoringAlertId],
      title: item.source,
      detail: item.message,
      source: item.source,
      level: item.level,
      status: item.status,
      timestamp: item.createdAt,
      tokens: Object.values(item.metadata || {}),
    });
    if (!match.matched) return;
    evidence.push({
      id: item.id,
      kind: 'monitoring-alert',
      title: item.source,
      detail: item.message,
      timestamp: item.createdAt,
      source: item.source,
      level: item.level,
      status: item.status,
      linked: match.directLink,
      metadata: {
        snapshotId: item.snapshotId,
        ...item.metadata,
      },
    });
  });

  const notifications = controlPlaneRuntime.listNotifications(limit, {});
  notifications.forEach((item) => {
    const match = scoreEvidenceMatch(context, {
      id: item.id,
      refIds: [item.metadata?.notificationId, item.metadata?.incidentId],
      title: item.title,
      detail: item.message,
      source: item.source,
      level: item.level,
      status: item.level,
      timestamp: item.createdAt,
      tokens: Object.values(item.metadata || {}),
    });
    if (!match.matched) return;
    evidence.push({
      id: item.id,
      kind: 'notification',
      title: item.title,
      detail: item.message,
      timestamp: item.createdAt,
      source: item.source,
      level: item.level,
      status: item.level,
      linked: match.directLink,
      metadata: item.metadata || {},
    });
  });

  const auditRecords = controlPlaneRuntime.listAuditRecords(limit, {});
  auditRecords.forEach((item) => {
    const match = scoreEvidenceMatch(context, {
      id: item.id,
      refIds: [item.metadata?.auditId, item.metadata?.incidentId],
      title: item.title,
      detail: item.detail,
      source: item.type,
      level: 'info',
      status: item.type,
      timestamp: item.createdAt,
      tokens: [item.actor, ...Object.values(item.metadata || {})],
    });
    if (!match.matched) return;
    evidence.push({
      id: item.id,
      kind: 'audit',
      title: item.title,
      detail: item.detail,
      timestamp: item.createdAt,
      source: item.type,
      level: 'info',
      status: item.type,
      linked: match.directLink,
      metadata: {
        actor: item.actor,
        ...item.metadata,
      },
    });
  });

  const actions = controlPlaneRuntime.listOperatorActions(limit, {});
  actions.forEach((item) => {
    const match = scoreEvidenceMatch(context, {
      id: item.id,
      refIds: [item.metadata?.incidentId],
      title: item.title,
      detail: item.detail,
      source: item.actor,
      level: item.level,
      status: item.type,
      timestamp: item.createdAt,
      tokens: [item.symbol, item.type, ...Object.values(item.metadata || {})],
    });
    if (!match.matched) return;
    evidence.push({
      id: item.id,
      kind: 'operator-action',
      title: item.title,
      detail: item.detail,
      timestamp: item.createdAt,
      source: item.actor,
      level: item.level,
      status: item.type,
      linked: match.directLink,
      metadata: {
        symbol: item.symbol,
        ...item.metadata,
      },
    });
  });

  const schedulerTicks = controlPlaneRuntime.listSchedulerTicks(limit, {});
  schedulerTicks.forEach((item) => {
    const match = scoreEvidenceMatch(context, {
      id: item.id,
      refIds: [item.metadata?.schedulerTickId],
      title: item.title,
      detail: item.message,
      source: 'scheduler',
      level: item.status === 'phase-change' ? 'warn' : 'info',
      status: item.phase,
      timestamp: item.createdAt,
      tokens: [item.phase, item.worker, ...Object.values(item.metadata || {})],
    });
    if (!match.matched) return;
    evidence.push({
      id: item.id,
      kind: 'scheduler-tick',
      title: item.title,
      detail: item.message,
      timestamp: item.createdAt,
      source: 'scheduler',
      level: item.status === 'phase-change' ? 'warn' : 'info',
      status: item.phase,
      linked: match.directLink,
      metadata: {
        worker: item.worker,
        ...item.metadata,
      },
    });
  });

  const riskEvents = controlPlaneRuntime.listRiskEvents(limit);
  riskEvents.forEach((item) => {
    const match = scoreEvidenceMatch(context, {
      id: item.id,
      refIds: [item.metadata?.riskEventId, item.metadata?.incidentId],
      title: item.title,
      detail: item.message,
      source: item.source,
      level: item.level,
      status: item.status,
      timestamp: item.createdAt,
      tokens: [item.riskLevel, item.cycle, ...Object.values(item.metadata || {})],
    });
    if (!match.matched) return;
    evidence.push({
      id: item.id,
      kind: 'risk-event',
      title: item.title,
      detail: item.message,
      timestamp: item.createdAt,
      source: item.source,
      level: item.level,
      status: item.status,
      linked: match.directLink,
      metadata: {
        cycle: item.cycle,
        riskLevel: item.riskLevel,
        ...item.metadata,
      },
    });
  });

  const workflowRuns = controlPlaneRuntime.listWorkflowRuns(limit);
  workflowRuns.forEach((item) => {
    const match = scoreEvidenceMatch(context, {
      id: item.id,
      refIds: [item.workflowId, item.metadata?.workflowRunId, item.metadata?.incidentId],
      title: item.workflowId,
      detail: String(item.error || item.result?.summary || item.metadata?.summary || item.status),
      source: item.workflowType,
      level: item.status === 'failed' ? 'critical' : item.status === 'retry_scheduled' ? 'warn' : 'info',
      status: item.status,
      timestamp: item.updatedAt || item.createdAt,
      tokens: [item.actor, item.trigger, ...Object.values(item.metadata || {})],
    });
    if (!match.matched) return;
    evidence.push({
      id: item.id,
      kind: 'workflow-run',
      title: item.workflowId,
      detail: String(item.error || item.result?.summary || item.metadata?.summary || item.status),
      timestamp: item.updatedAt || item.createdAt,
      source: item.workflowType,
      level: item.status === 'failed' ? 'critical' : item.status === 'retry_scheduled' ? 'warn' : 'info',
      status: item.status,
      linked: match.directLink,
      metadata: {
        workflowType: item.workflowType,
        actor: item.actor,
        trigger: item.trigger,
      },
    });
  });

  const executionPlans = controlPlaneRuntime.listExecutionPlans(limit);
  executionPlans.forEach((item) => {
    const match = scoreEvidenceMatch(context, {
      id: item.id,
      refIds: [item.workflowRunId, item.strategyId, item.metadata?.executionPlanId, item.metadata?.incidentId],
      title: item.strategyName,
      detail: item.summary,
      source: item.mode,
      level: item.riskStatus === 'blocked' ? 'critical' : item.riskStatus === 'review' ? 'warn' : 'info',
      status: item.status,
      timestamp: item.updatedAt || item.createdAt,
      tokens: [item.strategyId, item.riskStatus, item.approvalState, ...Object.values(item.metadata || {})],
    });
    if (!match.matched) return;
    evidence.push({
      id: item.id,
      kind: 'execution-plan',
      title: item.strategyName,
      detail: item.summary,
      timestamp: item.updatedAt || item.createdAt,
      source: item.mode,
      level: item.riskStatus === 'blocked' ? 'critical' : item.riskStatus === 'review' ? 'warn' : 'info',
      status: item.status,
      linked: match.directLink,
      metadata: {
        strategyId: item.strategyId,
        workflowRunId: item.workflowRunId,
        riskStatus: item.riskStatus,
        approvalState: item.approvalState,
      },
    });
  });

  const deduped = [...new Map(evidence.map((item) => [`${item.kind}:${item.id}`, item])).values()]
    .sort((left, right) => (parseTimestamp(right.timestamp) || 0) - (parseTimestamp(left.timestamp) || 0))
    .slice(0, limit);

  const summary = deduped.reduce((acc, item) => {
    acc.total += 1;
    if (item.linked) acc.linked += 1;
    if (item.kind === 'monitoring-alert') acc.monitoringAlerts += 1;
    if (item.kind === 'notification') acc.notifications += 1;
    if (item.kind === 'audit') acc.audits += 1;
    if (item.kind === 'operator-action') acc.operatorActions += 1;
    if (item.kind === 'scheduler-tick') acc.schedulerTicks += 1;
    if (item.kind === 'risk-event') acc.riskEvents += 1;
    if (item.kind === 'workflow-run') acc.workflowRuns += 1;
    if (item.kind === 'execution-plan') acc.executionPlans += 1;
    return acc;
  }, {
    total: 0,
    linked: 0,
    monitoringAlerts: 0,
    notifications: 0,
    audits: 0,
    operatorActions: 0,
    schedulerTicks: 0,
    riskEvents: 0,
    workflowRuns: 0,
    executionPlans: 0,
  });

  return {
    summary,
    timeline: deduped,
  };
}

function collectIncidentActivity(incidentId, options = {}) {
  const timeline = controlPlaneRuntime.listIncidentActivities(incidentId, parseLimit(options.activityLimit, 120));
  const summary = timeline.reduce((acc, item) => {
    acc.total += 1;
    if (item.kind === 'note-added') acc.notes += 1;
    if (item.kind === 'status-changed') acc.statusChanges += 1;
    if (item.kind === 'owner-changed') acc.ownerChanges += 1;
    if (item.kind === 'severity-changed') acc.severityChanges += 1;
    if (!acc.latestAt || Date.parse(item.createdAt || '') > Date.parse(acc.latestAt || '')) {
      acc.latestAt = item.createdAt;
    }
    return acc;
  }, {
    total: 0,
    notes: 0,
    statusChanges: 0,
    ownerChanges: 0,
    severityChanges: 0,
    latestAt: '',
  });

  return {
    summary,
    timeline,
  };
}
