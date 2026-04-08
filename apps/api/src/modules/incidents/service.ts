import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.js';

const ACK_OVERDUE_HOURS = 1;
const STALE_HOURS = 24;

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

export function getIncidentSummary(options = {}) {
  const incidents = controlPlaneRuntime.listIncidents(parseLimit(options.limit, 500), {
    owner: options.owner || '',
    severity: options.severity || '',
    source: options.source || '',
    status: options.status || '',
    since: resolveSince(options.hours),
  });

  const summary = {
    total: incidents.length,
    open: 0,
    investigating: 0,
    mitigated: 0,
    resolved: 0,
    critical: 0,
    warn: 0,
    info: 0,
    unassigned: 0,
    stale: 0,
    unacknowledged: 0,
    missingNotes: 0,
    bySource: [],
    byOwner: [],
    ageBuckets: [
      { bucket: 'lt_1h', count: 0 },
      { bucket: 'lt_6h', count: 0 },
      { bucket: 'lt_24h', count: 0 },
      { bucket: 'gte_24h', count: 0 },
    ],
    response: {
      acknowledged: 0,
      ackOverdue: 0,
      blockedTasks: 0,
      activeTasks: 0,
      unresolvedCritical: 0,
      ownerHotspots: 0,
    },
    nextActions: [
      { key: 'assign-owner', count: 0 },
      { key: 'acknowledge', count: 0 },
      { key: 'resolve-blocker', count: 0 },
      { key: 'capture-evidence', count: 0 },
      { key: 'closeout', count: 0 },
    ],
  };

  const sourceCounts = new Map();
  const ownerCounts = new Map();

  incidents.forEach((incident) => {
    const tasks = controlPlaneRuntime.listIncidentTasks(incident.id, 100);
    const operations = buildIncidentOperations(incident, {
      tasks,
      notes: controlPlaneRuntime.listIncidentNotes(incident.id, 100),
      activity: controlPlaneRuntime.listIncidentActivities(incident.id, 120),
      evidenceSummary: {
        linked: Array.isArray(incident.links) ? incident.links.length : 0,
      },
    });

    if (incident.status === 'open') summary.open += 1;
    if (incident.status === 'investigating') summary.investigating += 1;
    if (incident.status === 'mitigated') summary.mitigated += 1;
    if (incident.status === 'resolved') summary.resolved += 1;
    if (incident.severity === 'critical') summary.critical += 1;
    if (incident.severity === 'warn') summary.warn += 1;
    if (incident.severity === 'info') summary.info += 1;
    if (!incident.owner) summary.unassigned += 1;
    if (!incident.acknowledgedAt && incident.status !== 'resolved') summary.unacknowledged += 1;
    if (!Number(incident.noteCount || 0)) summary.missingNotes += 1;
    if (operations.ackState !== 'pending') summary.response.acknowledged += 1;
    if (operations.ackState === 'overdue') summary.response.ackOverdue += 1;
    summary.response.blockedTasks += operations.blockedTasks;
    summary.response.activeTasks += operations.activeTasks;
    if (incident.status !== 'resolved' && incident.severity === 'critical') summary.response.unresolvedCritical += 1;
    const nextActionEntry = summary.nextActions.find((item) => item.key === operations.nextAction.key);
    if (nextActionEntry) nextActionEntry.count += 1;

    const updatedMs = parseTimestamp(incident.updatedAt || incident.createdAt) || Date.now();
    const ageHours = Math.max(0, (Date.now() - updatedMs) / (60 * 60 * 1000));
    if (incident.status !== 'resolved' && ageHours >= STALE_HOURS) summary.stale += 1;
    if (ageHours < 1) summary.ageBuckets[0].count += 1;
    else if (ageHours < 6) summary.ageBuckets[1].count += 1;
    else if (ageHours < 24) summary.ageBuckets[2].count += 1;
    else summary.ageBuckets[3].count += 1;

    sourceCounts.set(incident.source || 'unknown', Number(sourceCounts.get(incident.source || 'unknown') || 0) + 1);
    const ownerKey = incident.owner || 'unassigned';
    const ownerEntry = ownerCounts.get(ownerKey) || {
      owner: ownerKey,
      count: 0,
      openCount: 0,
      criticalCount: 0,
      blockedTaskCount: 0,
      staleCount: 0,
      unacknowledgedCount: 0,
    };
    ownerEntry.count += 1;
    if (incident.status !== 'resolved') ownerEntry.openCount += 1;
    if (incident.severity === 'critical') ownerEntry.criticalCount += 1;
    ownerEntry.blockedTaskCount += operations.blockedTasks;
    if (operations.stale) ownerEntry.staleCount += 1;
    if (operations.ackState === 'pending' || operations.ackState === 'overdue') ownerEntry.unacknowledgedCount += 1;
    ownerCounts.set(ownerKey, ownerEntry);
  });

  summary.bySource = [...sourceCounts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((left, right) => right.count - left.count);
  summary.byOwner = [...ownerCounts.values()]
    .sort((left, right) => right.openCount - left.openCount
      || right.criticalCount - left.criticalCount
      || right.blockedTaskCount - left.blockedTaskCount
      || right.staleCount - left.staleCount
      || right.count - left.count)
    .slice(0, 8);
  summary.response.ownerHotspots = summary.byOwner.filter((item) => item.openCount >= 3 || item.criticalCount > 0 || item.blockedTaskCount > 0 || item.staleCount > 0).length;

  return summary;
}

export function getIncidentDetail(incidentId, options = {}) {
  const incident = controlPlaneRuntime.getIncident(incidentId);
  if (!incident) return null;
  const evidence = collectIncidentEvidence(incident, options);
  const activity = collectIncidentActivity(incidentId, options);
  const tasks = collectIncidentTasks(incidentId, options);
  const notes = controlPlaneRuntime.listIncidentNotes(incidentId, parseLimit(options.noteLimit, 100));
  const operations = buildIncidentOperations(incident, {
    activity: activity.timeline,
    evidenceSummary: evidence.summary,
    notes,
    tasks: tasks.items,
  });
  return {
    incident,
    notes,
    tasks,
    activity,
    evidence,
    operations,
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

export function appendIncidentTask(incidentId, payload = {}) {
  return controlPlaneRuntime.recordIncidentTask(incidentId, payload);
}

export function updateIncidentTask(incidentId, taskId, payload = {}) {
  return controlPlaneRuntime.transitionIncidentTask(incidentId, taskId, payload);
}

export function bulkUpdateIncidents(payload = {}) {
  const incidentIds = [...new Set((Array.isArray(payload.incidentIds) ? payload.incidentIds : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean))];
  const patch = {};

  if (typeof payload.status === 'string' && payload.status) patch.status = payload.status;
  if (typeof payload.owner === 'string') patch.owner = payload.owner;
  if (typeof payload.summary === 'string' && payload.summary.trim()) patch.summary = payload.summary.trim();
  if (typeof payload.actor === 'string' && payload.actor) patch.actor = payload.actor;

  const incidents = [];
  let notesAdded = 0;

  incidentIds.forEach((incidentId) => {
    const incident = Object.keys(patch).length
      ? controlPlaneRuntime.transitionIncident(incidentId, patch)
      : controlPlaneRuntime.getIncident(incidentId);
    if (!incident) return;
    incidents.push(incident);
    if (typeof payload.note === 'string' && payload.note.trim()) {
      const noteResult = controlPlaneRuntime.recordIncidentNote(incidentId, {
        author: payload.actor || payload.owner || incident.owner || 'operator',
        body: payload.note.trim(),
        metadata: {
          bulkAction: true,
        },
      });
      if (noteResult?.note) {
        notesAdded += 1;
      }
    }
  });

  return {
    updatedIds: incidents.map((item) => item.id),
    incidents,
    notesAdded,
  };
}

function parseTimestamp(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : null;
}

function buildIncidentOperations(incident, inputs = {}) {
  const tasks = Array.isArray(inputs.tasks) ? inputs.tasks : [];
  const notes = Array.isArray(inputs.notes) ? inputs.notes : [];
  const activity = Array.isArray(inputs.activity) ? inputs.activity : [];
  const evidenceSummary = inputs.evidenceSummary || {};
  const updatedMs = parseTimestamp(incident.updatedAt || incident.createdAt) || Date.now();
  const ageHours = Math.max(0, (Date.now() - updatedMs) / (60 * 60 * 1000));
  const blockedTasks = tasks.filter((item) => item.status === 'blocked').length;
  const pendingTasks = tasks.filter((item) => item.status === 'pending').length;
  const activeTasks = tasks.filter((item) => item.status === 'pending' || item.status === 'in_progress' || item.status === 'blocked').length;
  const linkedEvidence = Number(evidenceSummary.linked || 0);
  const latestActivity = [...activity]
    .sort((left, right) => (parseTimestamp(right.createdAt) || 0) - (parseTimestamp(left.createdAt) || 0))[0] || null;
  const stale = incident.status !== 'resolved' && ageHours >= STALE_HOURS;
  const ackState = incident.status === 'resolved'
    ? 'acknowledged'
    : incident.acknowledgedAt
      ? 'acknowledged'
      : ageHours >= ACK_OVERDUE_HOURS
        ? 'overdue'
        : 'pending';

  const nextAction = resolveIncidentNextAction({
    ackState,
    blockedTasks,
    incident,
    linkedEvidence,
    notes,
    pendingTasks,
    tasks,
  });

  return {
    ageHours: Number(ageHours.toFixed(1)),
    stale,
    ackState,
    blockedTasks,
    activeTasks,
    pendingTasks,
    linkedEvidence,
    latestActor: latestActivity?.actor || incident.owner || '',
    latestActivityAt: latestActivity?.createdAt || incident.updatedAt || incident.createdAt,
    nextAction,
    handoff: {
      owner: incident.owner || '',
      queue: incident.status === 'resolved' ? 'resolved' : (incident.owner ? 'owned' : 'unassigned'),
      summary: incident.status === 'resolved'
        ? 'Resolved incidents should leave a closeout note and track follow-up work.'
        : incident.owner
          ? `${incident.owner} owns the next response step for this incident.`
          : 'Assign an owner before the incident leaves triage.',
    },
  };
}

function resolveIncidentNextAction({ incident, ackState, blockedTasks, linkedEvidence, pendingTasks, notes, tasks }) {
  if (!incident.owner) {
    return {
      key: 'assign-owner',
      label: 'Assign owner',
      detail: 'Set a single operator responsible for driving the incident to closure.',
    };
  }
  if (ackState === 'pending' || ackState === 'overdue') {
    return {
      key: 'acknowledge',
      label: ackState === 'overdue' ? 'Acknowledge overdue response' : 'Acknowledge investigation',
      detail: 'Move the incident into active investigation and confirm the response owner.',
    };
  }
  if (blockedTasks > 0) {
    return {
      key: 'resolve-blocker',
      label: 'Resolve blocked tasks',
      detail: 'Unblock the current playbook steps before progressing mitigation or closure.',
    };
  }
  if (!linkedEvidence || !notes.length) {
    return {
      key: 'capture-evidence',
      label: 'Capture evidence',
      detail: 'Attach evidence and leave investigation notes so the next operator has context.',
    };
  }
  if (incident.status !== 'resolved' && (!pendingTasks || tasks.some((item) => item.status === 'done'))) {
    return {
      key: 'closeout',
      label: incident.status === 'mitigated' ? 'Close out incident' : 'Advance mitigation',
      detail: incident.status === 'mitigated'
        ? 'Write the resolution summary and move the incident to resolved when the queue is clean.'
        : 'Convert current findings into mitigation or closure actions.',
    };
  }
  return {
    key: 'monitor',
    label: 'Monitor response',
    detail: 'Keep the owner queue updated while remaining tasks and evidence continue to evolve.',
  };
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
    .sort((left, right) => Number(right.linked) - Number(left.linked)
      || (parseTimestamp(right.timestamp) || 0) - (parseTimestamp(left.timestamp) || 0))
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

function collectIncidentTasks(incidentId, options = {}) {
  const items = controlPlaneRuntime.listIncidentTasks(incidentId, parseLimit(options.taskLimit, 100));
  const summary = items.reduce((acc, item) => {
    acc.total += 1;
    if (item.status === 'pending') acc.pending += 1;
    if (item.status === 'in_progress') acc.inProgress += 1;
    if (item.status === 'done') acc.done += 1;
    if (item.status === 'blocked') acc.blocked += 1;
    return acc;
  }, {
    total: 0,
    pending: 0,
    inProgress: 0,
    done: 0,
    blocked: 0,
  });

  return {
    summary,
    items,
  };
}
