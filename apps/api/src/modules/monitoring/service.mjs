import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.mjs';

function toIsoString(value) {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}

function getAgeSeconds(timestamp, nowIso) {
  const targetIso = toIsoString(timestamp);
  if (!targetIso) return null;
  const deltaMs = Date.parse(nowIso) - Date.parse(targetIso);
  if (!Number.isFinite(deltaMs)) return null;
  return Math.max(0, Math.round(deltaMs / 1000));
}

function countBy(items, predicate) {
  return items.reduce((count, item) => (predicate(item) ? count + 1 : count), 0);
}

function buildWorkflowCounts(workflows) {
  return {
    queued: countBy(workflows, (item) => item.status === 'queued'),
    running: countBy(workflows, (item) => item.status === 'running'),
    retryScheduled: countBy(workflows, (item) => item.status === 'retry_scheduled'),
    failed: countBy(workflows, (item) => item.status === 'failed'),
    completed: countBy(workflows, (item) => item.status === 'completed'),
    canceled: countBy(workflows, (item) => item.status === 'canceled'),
  };
}

function buildRiskCounts(events) {
  return {
    riskOff: countBy(events, (item) => item.status === 'risk-off'),
    approvalRequired: countBy(events, (item) => item.status === 'approval-required'),
    connectivityDegraded: countBy(events, (item) => item.status === 'connectivity-degraded'),
    healthy: countBy(events, (item) => item.status === 'healthy'),
  };
}

function resolveWorkerStatus(latestHeartbeat, nowIso) {
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

function deriveOverallStatus(signals) {
  if (signals.includes('critical')) return 'critical';
  if (signals.includes('warn')) return 'warn';
  return 'healthy';
}

export async function getMonitoringStatus(options = {}) {
  const nowIso = toIsoString(options.now || new Date()) || new Date().toISOString();
  const workflows = controlPlaneRuntime.listWorkflowRuns(120);
  const workflowCounts = buildWorkflowCounts(workflows);
  const notifications = controlPlaneRuntime.listNotifications(20);
  const notificationJobs = controlPlaneRuntime.listNotificationJobs(120);
  const pendingNotificationJobs = countBy(notificationJobs, (item) => item.status === 'pending');
  const riskEvents = controlPlaneRuntime.listRiskEvents(120);
  const riskCounts = buildRiskCounts(riskEvents);
  const riskScanJobs = controlPlaneRuntime.listRiskScanJobs(120);
  const pendingRiskScanJobs = countBy(riskScanJobs, (item) => item.status === 'pending');
  const agentActionRequests = controlPlaneRuntime.listAgentActionRequests(120);
  const pendingAgentReviews = countBy(agentActionRequests, (item) => item.status === 'pending_review');
  const latestWorkerHeartbeat = controlPlaneRuntime.getLatestWorkerHeartbeat();
  const schedulerTicks = controlPlaneRuntime.listSchedulerTicks(10);
  const latestSchedulerTick = schedulerTicks[0] || null;
  const worker = resolveWorkerStatus(latestWorkerHeartbeat, nowIso);
  const market = controlPlaneRuntime.getMarketProviderStatus();
  const broker = await (options.getBrokerHealth ? options.getBrokerHealth() : Promise.resolve({
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
  const workflowStatus = workflowCounts.failed > 0
    ? 'critical'
    : (workflowCounts.retryScheduled > 0 || workflowCounts.queued > 0 || workflowCounts.running > 0 ? 'warn' : 'healthy');
  const riskStatus = riskCounts.riskOff > 0
    ? 'critical'
    : (riskCounts.approvalRequired > 0 || riskCounts.connectivityDegraded > 0 ? 'warn' : 'healthy');
  const queueStatus = pendingNotificationJobs > 0 || pendingRiskScanJobs > 0 || pendingAgentReviews > 0 ? 'warn' : 'healthy';

  const status = deriveOverallStatus([
    brokerStatus,
    marketStatus,
    worker.status,
    workflowStatus,
    riskStatus,
    queueStatus,
  ]);

  const alerts = [];
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
  if (pendingNotificationJobs > 0 || pendingRiskScanJobs > 0 || pendingAgentReviews > 0) {
    alerts.push({
      level: 'warn',
      source: 'queue',
      message: `${pendingNotificationJobs} notification jobs, ${pendingRiskScanJobs} risk scan jobs, and ${pendingAgentReviews} agent reviews are still pending.`,
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
      },
      workflows: {
        status: workflowStatus,
        ...workflowCounts,
      },
      queues: {
        status: queueStatus,
        pendingNotificationJobs,
        pendingRiskScanJobs,
        pendingAgentReviews,
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
