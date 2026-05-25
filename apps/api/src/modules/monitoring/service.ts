import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.js';

function toIsoString(value: any) {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}

function getAgeSeconds(timestamp: any, nowIso: any) {
  const targetIso = toIsoString(timestamp);
  if (!targetIso) return null;
  const deltaMs = Date.parse(nowIso) - Date.parse(targetIso);
  if (!Number.isFinite(deltaMs)) return null;
  return Math.max(0, Math.round(deltaMs / 1000));
}

function countBy(items: any[], predicate: (item: any) => boolean): number {
  return items.reduce((count: number, item: any) => (predicate(item) ? count + 1 : count), 0);
}

function listUniqueWorkers(heartbeats: any[]) {
  return [...new Set(heartbeats.map((item: any) => item.worker).filter(Boolean))];
}

function findLatestTimestamp(items: any[], field: string) {
  let latestIso = '';
  let latestValue = -Infinity;
  for (const item of items) {
    const iso = toIsoString(item?.[field]);
    if (!iso) continue;
    const value = Date.parse(iso);
    if (!Number.isFinite(value) || value <= latestValue) continue;
    latestValue = value;
    latestIso = iso;
  }
  return latestIso || null;
}

function findOldestAgeSeconds(items: any[], nowIso: any, fields: string[] = []) {
  let oldestAge = null;
  for (const item of items) {
    const timestamps = fields
      .map((field) => item?.[field])
      .map((value: any) => getAgeSeconds(value, nowIso))
      .filter((value: any): value is number => value !== null);
    if (!timestamps.length) continue;
    const candidate = Math.max(...timestamps);
    if (oldestAge === null || candidate > oldestAge) oldestAge = candidate;
  }
  return oldestAge;
}

function buildQueueBacklogStatus(totalPending: any, retryScheduledWorkflows: any) {
  if (retryScheduledWorkflows > 0 || totalPending >= 10) return 'critical';
  if (totalPending > 0) return 'warn';
  return 'healthy';
}

function buildWorkflowCounts(workflows: any[]) {
  return {
    queued: countBy(workflows, (item: any) => item.status === 'queued'),
    running: countBy(workflows, (item: any) => item.status === 'running'),
    retryScheduled: countBy(workflows, (item: any) => item.status === 'retry_scheduled'),
    failed: countBy(workflows, (item: any) => item.status === 'failed'),
    completed: countBy(workflows, (item: any) => item.status === 'completed'),
    canceled: countBy(workflows, (item: any) => item.status === 'canceled'),
  };
}

function buildRiskCounts(events: any[]) {
  return {
    riskOff: countBy(events, (item: any) => item.status === 'risk-off'),
    approvalRequired: countBy(events, (item: any) => item.status === 'approval-required'),
    connectivityDegraded: countBy(events, (item: any) => item.status === 'connectivity-degraded'),
    healthy: countBy(events, (item: any) => item.status === 'healthy'),
  };
}

function resolveWorkerStatus(latestHeartbeat: any, nowIso: any) {
  if (!latestHeartbeat) {
    return {
      status: 'warn',
      message: 'No worker heartbeat has been recorded yet.',
      latestHeartbeat: null,
      lagSeconds: null,
    };
  }

  const lagSeconds = getAgeSeconds(latestHeartbeat.createdAt, nowIso);
  if (lagSeconds === null) {
    return {
      status: 'warn',
      message: 'Worker heartbeat timestamp is unavailable.',
      latestHeartbeat,
      lagSeconds: null,
    };
  }

  if (lagSeconds <= 20 * 60) {
    return {
      status: 'healthy',
      message: 'Worker heartbeat is within the expected freshness window.',
      latestHeartbeat,
      lagSeconds,
    };
  }

  if (lagSeconds <= 45 * 60) {
    return {
      status: 'warn',
      message: 'Worker heartbeat is getting stale and should be checked.',
      latestHeartbeat,
      lagSeconds,
    };
  }

  return {
    status: 'critical',
    message: 'Worker heartbeat is stale and the worker may be offline.',
    latestHeartbeat,
    lagSeconds,
  };
}

function deriveOverallStatus(signals: any[]) {
  if (signals.includes('critical')) return 'critical';
  if (signals.includes('warn')) return 'warn';
  return 'healthy';
}

function parseLimit(value: any, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveSince(hours: any): string {
  const parsed = Number(hours);
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  return new Date(Date.now() - parsed * 60 * 60 * 1000).toISOString();
}

export async function getMonitoringStatus(options: Record<string, any> = {}) {
  const nowIso = toIsoString(options.now || new Date()) || new Date().toISOString();
  const workflows = controlPlaneRuntime.listWorkflowRuns(120);
  const workflowCounts = buildWorkflowCounts(workflows);
  const totalWorkflows = workflows.length;
  const activeWorkflows =
    workflowCounts.queued + workflowCounts.running + workflowCounts.retryScheduled;
  const oldestQueuedAgeSeconds = findOldestAgeSeconds(
    workflows.filter((item: any) => item.status === 'queued'),
    nowIso,
    ['createdAt', 'updatedAt', 'startedAt']
  );
  const oldestRetryAgeSeconds = findOldestAgeSeconds(
    workflows.filter((item: any) => item.status === 'retry_scheduled'),
    nowIso,
    ['nextRunAt', 'updatedAt', 'failedAt', 'createdAt']
  );
  const lastCompletedAt = findLatestTimestamp(
    workflows.filter((item: any) => item.status === 'completed'),
    'updatedAt'
  );
  const lastFailedAt = findLatestTimestamp(
    workflows.filter((item: any) => item.status === 'failed'),
    'updatedAt'
  );
  const failureRate =
    totalWorkflows > 0 ? Number((workflowCounts.failed / totalWorkflows).toFixed(4)) : 0;
  const notifications = controlPlaneRuntime.listNotifications(20);
  const notificationJobs = controlPlaneRuntime.listNotificationJobs(120);
  const pendingNotificationJobs = countBy(
    notificationJobs,
    (item: any) => item.status === 'pending'
  );
  const riskEvents = controlPlaneRuntime.listRiskEvents(120);
  const riskCounts = buildRiskCounts(riskEvents);
  const riskScanJobs = controlPlaneRuntime.listRiskScanJobs(120);
  const pendingRiskScanJobs = countBy(riskScanJobs, (item: any) => item.status === 'pending');
  const agentActionRequests = controlPlaneRuntime.listAgentActionRequests(120);
  const pendingAgentReviews = countBy(
    agentActionRequests,
    (item: any) => item.status === 'pending_review'
  );
  const latestWorkerHeartbeat = controlPlaneRuntime.getLatestWorkerHeartbeat();
  const recentWorkerHeartbeats = controlPlaneRuntime.listWorkerHeartbeats(120);
  const activeWorkers = listUniqueWorkers(recentWorkerHeartbeats).length;
  const staleWorkers = listUniqueWorkers(
    recentWorkerHeartbeats.filter((item: any) => {
      const ageSeconds = getAgeSeconds(item.createdAt, nowIso);
      return ageSeconds !== null && ageSeconds > 45 * 60;
    })
  ).length;
  const latestHeartbeatAt = findLatestTimestamp(recentWorkerHeartbeats, 'createdAt');
  const schedulerTicks = controlPlaneRuntime.listSchedulerTicks(10);
  const latestSchedulerTick = schedulerTicks[0] || null;
  const worker = resolveWorkerStatus(latestWorkerHeartbeat, nowIso);
  const market = controlPlaneRuntime.getMarketProviderStatus();
  const broker = await (options.getBrokerHealth
    ? options.getBrokerHealth()
    : Promise.resolve({
        adapter: 'unknown',
        connected: false,
        customBrokerConfigured: false,
        alpacaConfigured: false,
      }));
  const auditRecords = controlPlaneRuntime.listAuditRecords(20);
  const latestWorkflow = workflows[0] || null;
  const latestRiskEvent = riskEvents[0] || null;
  const latestAuditRecord = auditRecords[0] || null;

  const brokerStatus = broker.connected ? 'healthy' : 'warn';
  const marketStatus = market.connected && !market.fallback ? 'healthy' : 'warn';
  const workflowStatus =
    workflowCounts.failed > 0
      ? 'critical'
      : workflowCounts.retryScheduled > 0 || workflowCounts.queued > 0 || workflowCounts.running > 0
        ? 'warn'
        : 'healthy';
  const riskStatus =
    riskCounts.riskOff > 0
      ? 'critical'
      : riskCounts.approvalRequired > 0 || riskCounts.connectivityDegraded > 0
        ? 'warn'
        : 'healthy';
  const retryScheduledWorkflows = workflowCounts.retryScheduled;
  const totalPending =
    pendingNotificationJobs + pendingRiskScanJobs + pendingAgentReviews + retryScheduledWorkflows;
  const backlogStatus = buildQueueBacklogStatus(totalPending, retryScheduledWorkflows);
  const queueStatus = backlogStatus === 'critical' ? 'critical' : backlogStatus;

  const status = deriveOverallStatus([
    brokerStatus,
    marketStatus,
    worker.status,
    workflowStatus,
    riskStatus,
    queueStatus,
  ]);

  const alerts: any[] = [];
  if (!broker.connected) {
    alerts.push({
      level: 'warn',
      source: 'broker',
      message: `Broker adapter ${broker.adapter || 'unknown'} is disconnected.`,
    });
  }
  if (!market.connected || market.fallback) {
    alerts.push({
      level: 'warn',
      source: 'market',
      message: market.message || 'Market provider is degraded or running in fallback mode.',
    });
  }
  if (worker.status !== 'healthy') {
    alerts.push({
      level: worker.status,
      source: 'worker',
      message: worker.message,
    });
  }
  if (workflowCounts.failed > 0) {
    alerts.push({
      level: 'critical',
      source: 'workflow',
      message: `${workflowCounts.failed} workflow runs are currently in a failed state.`,
    });
  } else if (workflowCounts.retryScheduled > 0) {
    alerts.push({
      level: 'warn',
      source: 'workflow',
      message: `${workflowCounts.retryScheduled} workflow runs are waiting for retry.`,
    });
  }
  if (riskCounts.riskOff > 0) {
    alerts.push({
      level: 'critical',
      source: 'risk',
      message: `${riskCounts.riskOff} risk events have triggered risk-off mode.`,
    });
  } else if (riskCounts.approvalRequired > 0) {
    alerts.push({
      level: 'warn',
      source: 'risk',
      message: `${riskCounts.approvalRequired} risk events still require manual review.`,
    });
  }
  if (totalPending > 0) {
    alerts.push({
      level: backlogStatus === 'critical' ? 'critical' : 'warn',
      source: 'queue',
      message: `${pendingNotificationJobs} notification jobs, ${pendingRiskScanJobs} risk scan jobs, ${pendingAgentReviews} agent reviews, and ${retryScheduledWorkflows} retry-scheduled workflows are still pending.`,
    });
  }

  return {
    ok: true,
    status,
    generatedAt: nowIso,
    services: {
      gateway: {
        status: 'healthy',
        uptimeSeconds: Math.round(process.uptime()),
      },
      broker: {
        status: brokerStatus,
        ...broker,
      },
      market: {
        status: marketStatus,
        ...market,
        lagSeconds: getAgeSeconds(market.asOf, nowIso),
      },
      worker: {
        status: worker.status,
        message: worker.message,
        lagSeconds: worker.lagSeconds,
        latestHeartbeat: worker.latestHeartbeat,
        activeWorkers,
        staleWorkers,
        latestHeartbeatAt,
      },
      workflows: {
        status: workflowStatus,
        ...workflowCounts,
        total: totalWorkflows,
        active: activeWorkflows,
        oldestQueuedAgeSeconds,
        oldestRetryAgeSeconds,
        lastCompletedAt,
        lastFailedAt,
        failureRate,
      },
      queues: {
        status: queueStatus,
        pendingNotificationJobs,
        pendingRiskScanJobs,
        pendingAgentReviews,
        retryScheduledWorkflows,
        totalPending,
        backlogStatus,
      },
      risk: {
        status: riskStatus,
        ...riskCounts,
      },
    },
    recent: {
      latestWorkflow,
      latestWorkerHeartbeat,
      latestSchedulerTick,
      latestRiskEvent,
      latestNotification: notifications[0] || null,
      latestAuditRecord,
    },
    alerts,
  };
}

export function listMonitoringSnapshots(options: Record<string, any> = {}) {
  const limit = parseLimit(options.limit, 50);
  const since = resolveSince(options.hours);
  return {
    ok: true,
    snapshots: controlPlaneRuntime.listMonitoringSnapshots(limit, {
      status: options.status || '',
      since,
    }),
  };
}

export function listMonitoringAlerts(options: Record<string, any> = {}) {
  const limit = parseLimit(options.limit, 100);
  const since = resolveSince(options.hours);
  return {
    ok: true,
    alerts: controlPlaneRuntime.listMonitoringAlerts(limit, {
      snapshotId: options.snapshotId || '',
      source: options.source || '',
      level: options.level || '',
      since,
    }),
  };
}

export async function recordMonitoringStatusSnapshot(options: Record<string, any> = {}) {
  const summary = await getMonitoringStatus(options);
  const recorded = controlPlaneRuntime.recordMonitoringSnapshot({
    status: summary.status,
    generatedAt: summary.generatedAt,
    services: summary.services,
    recent: summary.recent,
    alerts: summary.alerts,
    alertCount: summary.alerts.length,
  });

  return {
    ok: true,
    status: summary.status,
    generatedAt: summary.generatedAt,
    snapshot: recorded.snapshot,
    alerts: recorded.alerts,
  };
}
