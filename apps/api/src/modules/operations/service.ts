// @ts-nocheck
import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.js';
import { getMonitoringStatus } from '../monitoring/service.js';
import { getOperationsMaintenanceSnapshot } from './maintenance-service.js';
import { isSchedulerAttentionStatus } from '../scheduler/service.js';

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

function parseTimestamp(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : null;
}

function countBy(items, predicate) {
  return items.reduce((count, item) => (predicate(item) ? count + 1 : count), 0);
}

function getAgeHours(timestamp) {
  const valueMs = parseTimestamp(timestamp);
  if (valueMs === null) return 0;
  return Math.max(0, (Date.now() - valueMs) / (60 * 60 * 1000));
}

function buildRunbookEntries(input) {
  const entries = [];

  if (input.connectivityIssues > 0) {
    entries.push({
      key: 'stabilize-connectivity',
      priority: 'now',
      title: 'Stabilize connectivity',
      detail: 'Broker, market, or worker health is degraded and should be stabilized before deeper triage.',
      count: input.connectivityIssues,
    });
  }
  if (input.queuePressure > 0) {
    entries.push({
      key: 'drain-queues',
      priority: input.queueBacklogStatus === 'critical' || input.queuePressure >= 5 ? 'now' : 'next',
      title: 'Drain queue backlog',
      detail: 'Pending notification, risk scan, or agent review work is building up in the control plane.',
      count: input.queuePressure,
    });
  }
  if (input.retryScheduledWorkflows > 0) {
    entries.push({
      key: 'review-retry-posture',
      priority: input.retryScheduledWorkflows >= 3 ? 'now' : 'next',
      title: 'Review retry posture',
      detail: 'Retry-scheduled workflows are building up and should be checked for repeated failures or blocked dependencies.',
      count: input.retryScheduledWorkflows,
    });
  }
  if (input.criticalIncidents > 0) {
    entries.push({
      key: 'triage-critical-incidents',
      priority: 'now',
      title: 'Triage critical incidents',
      detail: 'Critical incidents remain unresolved and should be moved into active investigation or mitigation.',
      count: input.criticalIncidents,
    });
  }
  if (input.unassignedIncidents > 0) {
    entries.push({
      key: 'assign-incident-owners',
      priority: 'next',
      title: 'Assign incident owners',
      detail: 'Unassigned incidents are still sitting in the queue without a single accountable operator.',
      count: input.unassignedIncidents,
    });
  }
  if (input.staleIncidents > 0) {
    entries.push({
      key: 'clear-stale-incidents',
      priority: 'next',
      title: 'Clear stale incidents',
      detail: 'Incidents older than the active response window need a mitigation update or explicit closeout.',
      count: input.staleIncidents,
    });
  }
  if (input.schedulerAttention > 0) {
    entries.push({
      key: 'review-scheduler-attention',
      priority: 'next',
      title: 'Review scheduler attention items',
      detail: 'Scheduler ticks include non-healthy states that may signal timeline drift or missed windows.',
      count: input.schedulerAttention,
    });
  }
  if (input.staleWorkers > 0) {
    entries.push({
      key: 'refresh-worker-capacity',
      priority: 'now',
      title: 'Refresh worker capacity',
      detail: 'One or more workers have stale heartbeats and may be failing to keep up with queue demand.',
      count: input.staleWorkers,
    });
  }
  if (input.controlPlaneTrail > 0) {
    entries.push({
      key: 'follow-control-plane-trail',
      priority: 'next',
      title: 'Follow control-plane trail',
      detail: 'Recent control-plane notifications and audit records should be reviewed together for operator context.',
      count: input.controlPlaneTrail,
    });
  }

  return entries;
}

function buildObservabilitySummary(monitoring) {
  const queueStatus = monitoring.services.queues.backlogStatus;
  const staleWorkers = monitoring.services.worker.staleWorkers;
  const failureRate = monitoring.services.workflows.failureRate;

  if (queueStatus === 'critical') {
    return {
      posture: 'critical',
      headline: 'Queue backlog needs immediate intervention.',
      detail: `The control plane is carrying ${monitoring.services.queues.totalPending} pending queue items and ${monitoring.services.queues.retryScheduledWorkflows} retry-scheduled workflows.`,
    };
  }

  if (staleWorkers > 0 || monitoring.services.worker.status === 'critical') {
    return {
      posture: 'critical',
      headline: 'Worker freshness is outside the safe window.',
      detail: `${staleWorkers} workers are stale and the latest heartbeat lag is ${monitoring.services.worker.lagSeconds ?? 'unknown'} seconds.`,
    };
  }

  if (failureRate > 0 || monitoring.services.workflows.retryScheduled > 0) {
    return {
      posture: monitoring.services.workflows.status === 'critical' ? 'critical' : 'warn',
      headline: 'Workflow reliability needs review.',
      detail: `Workflow failure rate is ${Math.round(failureRate * 100)}% with ${monitoring.services.workflows.retryScheduled} retry-scheduled runs.`,
    };
  }

  return {
    posture: 'healthy',
    headline: 'Worker, workflow, and queue posture are stable.',
    detail: 'Recent worker heartbeats, workflow completions, and queue depth are all within the normal operating envelope.',
  };
}

function buildPersistenceSummary(maintenance) {
  const persistence = maintenance?.integrity?.persistence || {
    adapter: maintenance?.storageAdapter || {
      kind: 'custom',
      label: 'Custom Store',
      namespace: 'control-plane',
    },
    manifest: null,
    migrationPlan: {
      currentVersion: null,
      targetVersion: null,
      pending: [],
      upToDate: true,
    },
  };
  const manifest = persistence.manifest || null;
  const migrationPlan = persistence.migrationPlan || {
    currentVersion: null,
    targetVersion: null,
    pending: [],
    upToDate: true,
  };
  const latestMigration = Array.isArray(manifest?.migrations) && manifest.migrations.length
    ? manifest.migrations[manifest.migrations.length - 1]
    : null;
  const pendingCount = Array.isArray(migrationPlan.pending) ? migrationPlan.pending.length : 0;
  const storageModel = manifest?.storageModel || manifest?.persistence || maintenance?.storageAdapter?.persistence || 'filesystem-json';
  const hasReadablePlan = migrationPlan.currentVersion !== null && migrationPlan.targetVersion !== null;
  let posture = 'healthy';
  let headline = 'Persistence posture is current.';
  let detail = `The ${storageModel} backend is aligned with schema version ${manifest?.schemaVersion ?? 'unknown'}.`;
  let recommendedAction = 'Continue monitoring.';

  if (!manifest || !hasReadablePlan) {
    posture = 'degraded';
    headline = 'Persistence metadata needs inspection.';
    detail = 'Manifest or migration planning data is incomplete, so maintenance posture should be reviewed before making changes.';
    recommendedAction = 'Inspect maintenance posture before making changes.';
  } else if (!migrationPlan.upToDate || pendingCount > 0) {
    posture = 'attention';
    headline = 'Migration follow-up recommended.';
    detail = `The ${storageModel} backend is readable, but ${pendingCount} migrations are still pending between versions ${migrationPlan.currentVersion} and ${migrationPlan.targetVersion}.`;
    recommendedAction = 'Back up before applying migrations.';
  }

  return {
    posture,
    headline,
    detail,
    adapter: persistence.adapter || maintenance.storageAdapter,
    storageModel,
    schemaVersion: manifest?.schemaVersion ?? null,
    currentVersion: migrationPlan.currentVersion ?? null,
    targetVersion: migrationPlan.targetVersion ?? null,
    pendingCount,
    upToDate: Boolean(migrationPlan.upToDate && pendingCount === 0),
    recommendedAction,
    latestMigration,
    links: {
      maintenance: '/notifications#operations-workbench',
      settings: '/settings#persistence-migration',
    },
  };
}

export async function getOperationsWorkbench(options = {}) {
  const limit = parseLimit(options.limit, 120);
  const since = resolveSince(options.hours);
  const [monitoring, maintenance] = await Promise.all([
    getMonitoringStatus(options),
    getOperationsMaintenanceSnapshot(options),
  ]);
  const incidents = controlPlaneRuntime.listIncidents(limit, {
    since,
  });
  const unresolvedIncidents = incidents.filter((item) => item.status !== 'resolved');
  const staleIncidents = unresolvedIncidents.filter((item) => getAgeHours(item.updatedAt || item.createdAt) >= STALE_HOURS);
  const unassignedIncidents = unresolvedIncidents.filter((item) => !item.owner);
  const criticalIncidents = unresolvedIncidents.filter((item) => item.severity === 'critical');
  const ackOverdueIncidents = unresolvedIncidents.filter((item) => !item.acknowledgedAt && getAgeHours(item.updatedAt || item.createdAt) >= ACK_OVERDUE_HOURS);
  const monitoringAlerts = controlPlaneRuntime.listMonitoringAlerts(limit, {
    since,
  });
  const schedulerTicks = controlPlaneRuntime.listSchedulerTicks(limit, {
    since,
  });
  const notifications = controlPlaneRuntime.listNotifications(limit, {
    since,
  });
  const auditRecords = controlPlaneRuntime.listAuditRecords(limit, {
    since,
  });

  const schedulerAttention = schedulerTicks.filter((item) => isSchedulerAttentionStatus(item.status));
  const connectivityIssues = countBy([
    monitoring.services.broker.status,
    monitoring.services.market.status,
    monitoring.services.worker.status,
  ], (item) => item !== 'healthy');
  const criticalSignals = monitoringAlerts.filter((item) => item.level === 'critical').length
    + criticalIncidents.length
    + schedulerAttention.filter((item) => item.status === 'critical').length
    + countBy(notifications, (item) => item.level === 'critical');
  const warnSignals = monitoringAlerts.filter((item) => item.level === 'warn').length
    + ackOverdueIncidents.length
    + countBy(notifications, (item) => item.level === 'warn');
  const queuePressure = monitoring.services.queues.totalPending;
  const controlPlaneTrail = countBy(notifications, (item) => item.source === 'control-plane' || item.source === 'workflow-control')
    + countBy(auditRecords, (item) => item.type === 'workflow' || item.type === 'execution-plan' || item.type === 'agent-action-request');
  const observability = buildObservabilitySummary(monitoring);

  return {
    ok: true,
    generatedAt: monitoring.generatedAt,
    status: monitoring.status,
    summary: {
      criticalSignals,
      warnSignals,
      queuePressure,
      openIncidents: unresolvedIncidents.length,
      staleIncidents: staleIncidents.length,
      unassignedIncidents: unassignedIncidents.length,
      schedulerAttention: schedulerAttention.length,
      queueBacklogStatus: monitoring.services.queues.backlogStatus,
      retryScheduledWorkflows: monitoring.services.queues.retryScheduledWorkflows,
      staleWorkers: monitoring.services.worker.staleWorkers,
      activeWorkers: monitoring.services.worker.activeWorkers,
      workflowFailureRate: monitoring.services.workflows.failureRate,
    },
    observability: {
      posture: observability.posture,
      headline: observability.headline,
      detail: observability.detail,
      queueBacklogStatus: monitoring.services.queues.backlogStatus,
      oldestQueuedAgeSeconds: monitoring.services.workflows.oldestQueuedAgeSeconds,
      oldestRetryAgeSeconds: monitoring.services.workflows.oldestRetryAgeSeconds,
      lastCompletedWorkflowAt: monitoring.services.workflows.lastCompletedAt,
      workerLagSeconds: monitoring.services.worker.lagSeconds,
    },
    persistence: buildPersistenceSummary(maintenance),
    lanes: [
      {
        key: 'monitoring',
        title: 'Monitoring',
        status: monitoring.status,
        detail: `${monitoring.alerts.length} monitoring alerts across worker, workflow, risk, and queue signals.`,
        primaryCount: monitoringAlerts.filter((item) => item.level === 'critical').length,
        secondaryCount: monitoringAlerts.filter((item) => item.level === 'warn').length,
        updatedAt: monitoring.generatedAt,
      },
      {
        key: 'incidents',
        title: 'Incidents',
        status: criticalIncidents.length ? 'critical' : (staleIncidents.length || unassignedIncidents.length ? 'warn' : 'healthy'),
        detail: `${unresolvedIncidents.length} unresolved incidents, ${staleIncidents.length} stale, ${unassignedIncidents.length} unassigned.`,
        primaryCount: criticalIncidents.length,
        secondaryCount: staleIncidents.length + unassignedIncidents.length,
        updatedAt: unresolvedIncidents[0]?.updatedAt || monitoring.generatedAt,
      },
      {
        key: 'scheduler',
        title: 'Scheduler',
        status: schedulerAttention.some((item) => item.status === 'critical') ? 'critical' : (schedulerAttention.length ? 'warn' : 'healthy'),
        detail: `${schedulerTicks.length} scheduler ticks observed with ${schedulerAttention.length} attention items.`,
        primaryCount: schedulerAttention.length,
        secondaryCount: countBy(schedulerTicks, (item) => item.phase === 'INTRADAY'),
        updatedAt: schedulerTicks[0]?.createdAt || monitoring.generatedAt,
      },
      {
        key: 'connectivity',
        title: 'Connectivity',
        status: connectivityIssues >= 2 ? 'critical' : (connectivityIssues ? 'warn' : 'healthy'),
        detail: `${connectivityIssues} connectivity surfaces degraded across broker, market, and worker health.`,
        primaryCount: connectivityIssues,
        secondaryCount: queuePressure,
        updatedAt: monitoring.generatedAt,
      },
      {
        key: 'control-plane',
        title: 'Control Plane',
        status: controlPlaneTrail > 0 ? 'warn' : 'healthy',
        detail: `${controlPlaneTrail} control-plane notifications and audit records need coordinated review.`,
        primaryCount: countBy(notifications, (item) => item.level === 'critical' || item.level === 'warn'),
        secondaryCount: countBy(auditRecords, (item) => item.type === 'workflow' || item.type === 'execution-plan' || item.type === 'agent-action-request'),
        updatedAt: notifications[0]?.createdAt || auditRecords[0]?.createdAt || monitoring.generatedAt,
      },
    ],
    runbook: buildRunbookEntries({
      connectivityIssues,
      controlPlaneTrail,
      criticalIncidents: criticalIncidents.length,
      queuePressure,
      queueBacklogStatus: monitoring.services.queues.backlogStatus,
      retryScheduledWorkflows: monitoring.services.queues.retryScheduledWorkflows,
      schedulerAttention: schedulerAttention.length,
      staleWorkers: monitoring.services.worker.staleWorkers,
      staleIncidents: staleIncidents.length,
      unassignedIncidents: unassignedIncidents.length,
    }),
    recent: {
      incident: incidents[0] || null,
      monitoringAlert: monitoringAlerts[0] || null,
      notification: notifications[0] || null,
      auditRecord: auditRecords[0] || null,
      schedulerTick: schedulerTicks[0] || null,
    },
  };
}
