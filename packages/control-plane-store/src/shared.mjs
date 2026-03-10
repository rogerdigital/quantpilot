import { randomUUID } from 'node:crypto';

export function trimAndSave(store, filename, entries, maxSize) {
  entries.splice(maxSize);
  store.writeCollection(filename, entries);
}

export function createNotificationEntry(event) {
  return {
    id: event.id || `notification-${randomUUID()}`,
    level: event.level || 'info',
    title: event.title || 'Notification',
    message: event.message || '',
    source: event.source || 'system',
    createdAt: event.createdAt || new Date().toISOString(),
    metadata: event.metadata || {},
  };
}

export function createRiskEventEntry(event) {
  return {
    id: event.id || `risk-event-${randomUUID()}`,
    level: event.level || 'info',
    status: event.status || 'healthy',
    title: event.title || 'Risk Scan',
    message: event.message || '',
    cycle: Number(event.cycle || 0),
    riskLevel: event.riskLevel || 'NORMAL',
    source: event.source || 'risk-monitor',
    createdAt: event.createdAt || new Date().toISOString(),
    metadata: event.metadata || {},
  };
}

export function createSchedulerTickEntry(event) {
  return {
    id: event.id || `scheduler-tick-${randomUUID()}`,
    phase: event.phase || 'OFF_HOURS',
    status: event.status || 'steady',
    title: event.title || 'Scheduler Tick',
    message: event.message || '',
    worker: event.worker || 'quantpilot-worker',
    createdAt: event.createdAt || new Date().toISOString(),
    metadata: event.metadata || {},
  };
}

export function createAuditRecordEntry(record) {
  return {
    id: record.id || `audit-${randomUUID()}`,
    type: record.type || 'system',
    actor: record.actor || 'system',
    title: record.title || 'Untitled audit event',
    detail: record.detail || '',
    createdAt: record.createdAt || new Date().toISOString(),
    metadata: record.metadata || {},
  };
}

export function createCycleRecordEntry(payload) {
  return {
    id: payload.id || `cycle-${randomUUID()}`,
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
}

export function createOperatorActionEntry(payload) {
  return {
    id: payload.id || `action-${randomUUID()}`,
    type: payload.type || 'manual',
    symbol: payload.symbol || '',
    detail: payload.detail || '',
    actor: payload.actor || 'operator',
    title: payload.title || 'Operator action',
    level: payload.level || 'info',
    createdAt: payload.createdAt || new Date().toISOString(),
    metadata: payload.metadata || {},
  };
}

export function createWorkflowRunEntry(payload) {
  const now = payload.createdAt || new Date().toISOString();
  return {
    id: payload.id || `workflow-${randomUUID()}`,
    workflowId: payload.workflowId || 'task-orchestrator.run',
    workflowType: payload.workflowType || 'control-plane',
    status: payload.status || 'pending',
    actor: payload.actor || 'system',
    trigger: payload.trigger || 'api',
    attempt: Number(payload.attempt || 0),
    maxAttempts: Number(payload.maxAttempts || 3),
    nextRunAt: payload.nextRunAt || now,
    lockedBy: payload.lockedBy || '',
    lockedAt: payload.lockedAt || '',
    createdAt: now,
    updatedAt: payload.updatedAt || now,
    startedAt: payload.startedAt || now,
    completedAt: payload.completedAt || '',
    failedAt: payload.failedAt || '',
    steps: Array.isArray(payload.steps) ? payload.steps : [],
    payload: payload.payload || {},
    result: payload.result || null,
    error: payload.error || null,
    metadata: payload.metadata || {},
  };
}

export function createExecutionPlanEntry(payload) {
  const now = payload.createdAt || new Date().toISOString();
  return {
    id: payload.id || `execution-plan-${randomUUID()}`,
    workflowRunId: payload.workflowRunId || '',
    strategyId: payload.strategyId || '',
    strategyName: payload.strategyName || 'Unknown Strategy',
    mode: payload.mode || 'paper',
    status: payload.status || 'draft',
    approvalState: payload.approvalState || 'pending',
    riskStatus: payload.riskStatus || 'review',
    summary: payload.summary || '',
    capital: Number(payload.capital || 0),
    orderCount: Number(payload.orderCount || 0),
    orders: Array.isArray(payload.orders) ? payload.orders : [],
    metadata: payload.metadata || {},
    createdAt: now,
    updatedAt: payload.updatedAt || now,
  };
}

export function createAgentActionRequestEntry(payload) {
  const now = payload.createdAt || new Date().toISOString();
  return {
    id: payload.id || `agent-action-request-${randomUUID()}`,
    workflowRunId: payload.workflowRunId || '',
    requestType: payload.requestType || 'analysis',
    targetId: payload.targetId || '',
    status: payload.status || 'submitted',
    approvalState: payload.approvalState || 'pending',
    riskStatus: payload.riskStatus || 'pending',
    summary: payload.summary || '',
    rationale: payload.rationale || '',
    requestedBy: payload.requestedBy || 'agent',
    metadata: payload.metadata || {},
    createdAt: now,
    updatedAt: payload.updatedAt || now,
  };
}

export function createUserAccountProfile(payload = {}) {
  const timezone = payload.timezone || 'Asia/Shanghai';
  const locale = payload.locale || 'zh-CN';
  return {
    id: payload.id || 'operator-demo',
    name: payload.name || 'QuantPilot Operator',
    email: payload.email || 'operator@quantpilot.local',
    role: payload.role || 'admin',
    organization: payload.organization || 'QuantPilot Labs',
    timezone,
    locale,
  };
}

export function createUserPreferences(payload = {}) {
  return {
    locale: payload.locale || 'zh-CN',
    timezone: payload.timezone || 'Asia/Shanghai',
    theme: payload.theme || 'system',
    defaultMode: payload.defaultMode || 'hybrid',
    riskReviewRequired: payload.riskReviewRequired !== false,
    notificationChannels: Array.isArray(payload.notificationChannels) && payload.notificationChannels.length
      ? [...new Set(payload.notificationChannels.map((item) => String(item).trim()).filter(Boolean))]
      : ['inbox'],
  };
}

export function createBrokerBindingEntry(payload = {}) {
  return {
    id: payload.id || `broker-binding-${randomUUID()}`,
    provider: payload.provider || 'alpaca',
    label: payload.label || 'Primary Broker',
    environment: payload.environment || 'paper',
    accountId: payload.accountId || '',
    status: payload.status || 'disconnected',
    permissions: Array.isArray(payload.permissions) && payload.permissions.length
      ? [...new Set(payload.permissions.map((item) => String(item).trim()).filter(Boolean))]
      : ['read'],
    lastSyncAt: payload.lastSyncAt || '',
    isDefault: Boolean(payload.isDefault),
    metadata: payload.metadata || {},
  };
}

export function getShanghaiTimeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const map = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  });
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    hour: Number(map.hour || 0),
    minute: Number(map.minute || 0),
    second: Number(map.second || 0),
  };
}

export function resolveSchedulerPhase(parts) {
  const time = parts.hour * 60 + parts.minute;
  if (time >= 8 * 60 + 30 && time < 9 * 60 + 30) {
    return 'PRE_OPEN';
  }
  if (time >= 9 * 60 + 30 && time < 15 * 60) {
    return 'INTRADAY';
  }
  if (time >= 15 * 60 && time < 18 * 60) {
    return 'POST_CLOSE';
  }
  return 'OFF_HOURS';
}

export function buildSchedulerBucket(parts) {
  const minuteBucket = String(Math.floor(parts.minute / 15) * 15).padStart(2, '0');
  return `${parts.date} ${String(parts.hour).padStart(2, '0')}:${minuteBucket}`;
}

export function buildRiskScanResult(payload) {
  if (payload.riskLevel === 'RISK OFF') {
    return {
      level: 'critical',
      status: 'risk-off',
      title: `Cycle ${payload.cycle} entered risk-off`,
      message: 'Risk guard triggered a defensive posture and reduced executable risk.',
      notify: true,
    };
  }
  if (payload.pendingApprovals > 0) {
    return {
      level: 'warn',
      status: 'approval-required',
      title: `Cycle ${payload.cycle} requires review`,
      message: `${payload.pendingApprovals} live actions remain behind the approval gate.`,
      notify: true,
    };
  }
  if (!payload.brokerConnected || !payload.marketConnected) {
    return {
      level: 'warn',
      status: 'connectivity-degraded',
      title: `Cycle ${payload.cycle} risk scan detected degraded inputs`,
      message: 'Broker or market connectivity is degraded, so downstream execution confidence is reduced.',
      notify: true,
    };
  }
  return {
    level: 'info',
    status: 'healthy',
    title: `Cycle ${payload.cycle} risk posture healthy`,
    message: 'Risk scan completed without a blocking condition.',
    notify: false,
  };
}
