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

export function createWorkerHeartbeatEntry(event) {
  return {
    id: event.id || `worker-heartbeat-${randomUUID()}`,
    worker: event.worker || 'quantpilot-worker',
    kind: event.kind || 'heartbeat',
    summary: event.summary || 'Worker heartbeat recorded.',
    createdAt: event.createdAt || new Date().toISOString(),
    metadata: event.metadata || {},
  };
}

export function createMonitoringSnapshotEntry(event = {}) {
  return {
    id: event.id || `monitoring-snapshot-${randomUUID()}`,
    status: event.status || 'healthy',
    generatedAt: event.generatedAt || new Date().toISOString(),
    createdAt: event.createdAt || event.generatedAt || new Date().toISOString(),
    services: event.services || {},
    recent: event.recent || {},
    alertCount: Number(event.alertCount || (Array.isArray(event.alerts) ? event.alerts.length : 0)),
    metadata: event.metadata || {},
  };
}

export function createMonitoringAlertEntry(event = {}) {
  return {
    id: event.id || `monitoring-alert-${randomUUID()}`,
    snapshotId: event.snapshotId || '',
    status: event.status || 'healthy',
    level: event.level || 'info',
    source: event.source || 'monitoring',
    message: event.message || '',
    createdAt: event.createdAt || new Date().toISOString(),
    metadata: event.metadata || {},
  };
}

export function createIncidentEntry(payload = {}) {
  const now = payload.createdAt || new Date().toISOString();
  const noteCount = Number.isFinite(payload.noteCount) ? Number(payload.noteCount) : 0;
  return {
    id: payload.id || `incident-${randomUUID()}`,
    title: payload.title || 'Untitled incident',
    summary: payload.summary || '',
    status: payload.status || 'open',
    severity: payload.severity || 'warn',
    source: payload.source || 'monitoring',
    owner: payload.owner || '',
    createdAt: now,
    updatedAt: payload.updatedAt || now,
    acknowledgedAt: payload.acknowledgedAt || '',
    resolvedAt: payload.resolvedAt || '',
    noteCount,
    latestNotePreview: payload.latestNotePreview || '',
    links: Array.isArray(payload.links) ? payload.links : [],
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    metadata: payload.metadata || {},
  };
}

export function createIncidentNoteEntry(payload = {}) {
  return {
    id: payload.id || `incident-note-${randomUUID()}`,
    incidentId: payload.incidentId || '',
    body: payload.body || '',
    author: payload.author || 'operator',
    createdAt: payload.createdAt || new Date().toISOString(),
    metadata: payload.metadata || {},
  };
}

export function createIncidentActivityEntry(payload = {}) {
  return {
    id: payload.id || `incident-activity-${randomUUID()}`,
    incidentId: payload.incidentId || '',
    kind: payload.kind || 'opened',
    title: payload.title || 'Incident activity',
    detail: payload.detail || '',
    actor: payload.actor || 'operator',
    createdAt: payload.createdAt || new Date().toISOString(),
    metadata: payload.metadata || {},
  };
}

export function createIncidentTaskEntry(payload = {}) {
  const now = payload.createdAt || new Date().toISOString();
  return {
    id: payload.id || `incident-task-${randomUUID()}`,
    incidentId: payload.incidentId || '',
    title: payload.title || 'Untitled task',
    detail: payload.detail || '',
    status: payload.status || 'pending',
    owner: payload.owner || '',
    createdAt: now,
    updatedAt: payload.updatedAt || now,
    completedAt: payload.completedAt || '',
    metadata: payload.metadata || {},
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
    handoffId: payload.handoffId || '',
    executionRunId: payload.executionRunId || '',
    strategyId: payload.strategyId || '',
    strategyName: payload.strategyName || 'Unknown Strategy',
    mode: payload.mode || 'paper',
    status: payload.status || 'draft',
    lifecycleStatus: payload.lifecycleStatus || 'planned',
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

export function createExecutionRunEntry(payload = {}) {
  const now = payload.createdAt || new Date().toISOString();
  return {
    id: payload.id || `execution-run-${randomUUID()}`,
    executionPlanId: payload.executionPlanId || '',
    workflowRunId: payload.workflowRunId || '',
    strategyId: payload.strategyId || '',
    strategyName: payload.strategyName || 'Unknown Strategy',
    mode: payload.mode || 'paper',
    lifecycleStatus: payload.lifecycleStatus || 'planned',
    summary: payload.summary || '',
    owner: payload.owner || '',
    orderCount: Number(payload.orderCount || 0),
    submittedOrderCount: Number(payload.submittedOrderCount || 0),
    filledOrderCount: Number(payload.filledOrderCount || 0),
    rejectedOrderCount: Number(payload.rejectedOrderCount || 0),
    createdAt: now,
    updatedAt: payload.updatedAt || now,
    completedAt: payload.completedAt || '',
    metadata: payload.metadata || {},
  };
}

export function createExecutionOrderStateEntry(payload = {}) {
  const now = payload.createdAt || new Date().toISOString();
  return {
    id: payload.id || `execution-order-state-${randomUUID()}`,
    executionPlanId: payload.executionPlanId || '',
    executionRunId: payload.executionRunId || '',
    symbol: payload.symbol || '',
    side: payload.side || 'BUY',
    qty: Number(payload.qty || 0),
    weight: Number(payload.weight || 0),
    lifecycleStatus: payload.lifecycleStatus || 'planned',
    brokerOrderId: payload.brokerOrderId || '',
    avgFillPrice: Number.isFinite(payload.avgFillPrice) ? Number(payload.avgFillPrice) : null,
    filledQty: Number(payload.filledQty || 0),
    summary: payload.summary || '',
    createdAt: now,
    updatedAt: payload.updatedAt || now,
    submittedAt: payload.submittedAt || '',
    acknowledgedAt: payload.acknowledgedAt || '',
    filledAt: payload.filledAt || '',
    metadata: payload.metadata || {},
  };
}

export function createExecutionCandidateHandoffEntry(payload = {}) {
  const now = payload.createdAt || new Date().toISOString();
  return {
    id: payload.id || `execution-handoff-${randomUUID()}`,
    strategyId: payload.strategyId || '',
    strategyName: payload.strategyName || 'Unknown Strategy',
    strategyStatus: payload.strategyStatus || 'draft',
    runId: payload.runId || '',
    resultId: payload.resultId || '',
    evaluationId: payload.evaluationId || '',
    reportId: payload.reportId || '',
    mode: payload.mode || 'paper',
    capital: Number(payload.capital || 0),
    orderCount: Number(payload.orderCount || 0),
    baseline: Boolean(payload.baseline),
    champion: Boolean(payload.champion),
    readiness: payload.readiness || 'hold',
    verdict: payload.verdict || '',
    riskStatus: payload.riskStatus || 'review',
    approvalState: payload.approvalState || 'required',
    handoffStatus: payload.handoffStatus || 'ready',
    owner: payload.owner || '',
    summary: payload.summary || '',
    reasons: Array.isArray(payload.reasons) ? payload.reasons : [],
    orders: Array.isArray(payload.orders) ? payload.orders : [],
    createdAt: now,
    updatedAt: payload.updatedAt || now,
    metadata: payload.metadata || {},
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

export function createAgentSessionEntry(payload = {}) {
  const now = payload.createdAt || new Date().toISOString();
  return {
    id: payload.id || `agent-session-${randomUUID()}`,
    status: payload.status || 'draft',
    title: payload.title || 'Agent collaboration session',
    prompt: payload.prompt || '',
    requestedBy: payload.requestedBy || 'operator',
    latestIntent: {
      kind: payload.latestIntent?.kind || 'unknown',
      summary: payload.latestIntent?.summary || '',
      targetType: payload.latestIntent?.targetType || 'unknown',
      targetId: payload.latestIntent?.targetId || '',
      urgency: payload.latestIntent?.urgency || 'normal',
      requiresApproval: Boolean(payload.latestIntent?.requiresApproval),
      requestedMode: payload.latestIntent?.requestedMode || 'read_only',
      metadata: payload.latestIntent?.metadata || {},
    },
    latestPlanId: payload.latestPlanId || '',
    latestAnalysisRunId: payload.latestAnalysisRunId || '',
    latestActionRequestId: payload.latestActionRequestId || '',
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    metadata: payload.metadata || {},
    createdAt: now,
    updatedAt: payload.updatedAt || now,
  };
}

export function createAgentPlanEntry(payload = {}) {
  const now = payload.createdAt || new Date().toISOString();
  return {
    id: payload.id || `agent-plan-${randomUUID()}`,
    sessionId: payload.sessionId || '',
    status: payload.status || 'draft',
    summary: payload.summary || '',
    requiresApproval: Boolean(payload.requiresApproval),
    requestedBy: payload.requestedBy || 'agent',
    steps: Array.isArray(payload.steps) ? payload.steps.map((step, index) => ({
      id: step.id || `agent-plan-step-${index + 1}`,
      kind: step.kind || 'read',
      title: step.title || 'Untitled step',
      status: step.status || 'pending',
      toolName: step.toolName || '',
      description: step.description || '',
      outputSummary: step.outputSummary || '',
      metadata: step.metadata || {},
    })) : [],
    metadata: payload.metadata || {},
    createdAt: now,
    updatedAt: payload.updatedAt || now,
  };
}

export function createAgentAnalysisRunEntry(payload = {}) {
  const now = payload.createdAt || new Date().toISOString();
  return {
    id: payload.id || `agent-analysis-run-${randomUUID()}`,
    sessionId: payload.sessionId || '',
    planId: payload.planId || '',
    status: payload.status || 'queued',
    summary: payload.summary || '',
    conclusion: payload.conclusion || '',
    requestedBy: payload.requestedBy || 'agent',
    toolCalls: Array.isArray(payload.toolCalls) ? payload.toolCalls.map((call) => ({
      tool: call.tool || '',
      status: call.status || 'pending',
      summary: call.summary || '',
      metadata: call.metadata || {},
    })) : [],
    evidence: Array.isArray(payload.evidence) ? payload.evidence.map((entry, index) => ({
      id: entry.id || `agent-evidence-${index + 1}`,
      kind: entry.kind || 'tool_result',
      title: entry.title || 'Evidence',
      summary: entry.summary || '',
      source: entry.source || 'agent',
      sourceId: entry.sourceId || '',
      metadata: entry.metadata || {},
    })) : [],
    explanation: {
      thesis: payload.explanation?.thesis || '',
      rationale: Array.isArray(payload.explanation?.rationale) ? payload.explanation.rationale : [],
      warnings: Array.isArray(payload.explanation?.warnings) ? payload.explanation.warnings : [],
      recommendedNextStep: payload.explanation?.recommendedNextStep || '',
    },
    metadata: payload.metadata || {},
    createdAt: now,
    updatedAt: payload.updatedAt || now,
    completedAt: payload.completedAt || '',
  };
}

export function createResearchTaskEntry(payload = {}) {
  const now = payload.createdAt || new Date().toISOString();
  return {
    id: payload.id || `research-task-${randomUUID()}`,
    taskType: payload.taskType || 'backtest-run',
    status: payload.status || 'queued',
    title: payload.title || 'Research task',
    summary: payload.summary || '',
    strategyId: payload.strategyId || '',
    strategyName: payload.strategyName || '',
    workflowRunId: payload.workflowRunId || '',
    runId: payload.runId || '',
    windowLabel: payload.windowLabel || '',
    requestedBy: payload.requestedBy || 'operator',
    lastActor: payload.lastActor || payload.requestedBy || 'operator',
    resultLabel: payload.resultLabel || '',
    latestCheckpoint: payload.latestCheckpoint || '',
    priority: payload.priority || 'normal',
    createdAt: now,
    updatedAt: payload.updatedAt || now,
    startedAt: payload.startedAt || '',
    completedAt: payload.completedAt || '',
    metadata: payload.metadata || {},
  };
}

export function createBacktestResultEntry(payload = {}) {
  const now = payload.createdAt || new Date().toISOString();
  return {
    id: payload.id || `backtest-result-${randomUUID()}`,
    runId: payload.runId || '',
    workflowRunId: payload.workflowRunId || '',
    strategyId: payload.strategyId || '',
    strategyName: payload.strategyName || 'Unknown Strategy',
    windowLabel: payload.windowLabel || '',
    status: payload.status || 'completed',
    stage: payload.stage || 'generated',
    version: Number(payload.version || 1),
    generatedAt: payload.generatedAt || now,
    summary: payload.summary || '',
    annualizedReturnPct: Number(payload.annualizedReturnPct || 0),
    maxDrawdownPct: Number(payload.maxDrawdownPct || 0),
    sharpe: Number(payload.sharpe || 0),
    winRatePct: Number(payload.winRatePct || 0),
    turnoverPct: Number(payload.turnoverPct || 0),
    benchmarkReturnPct: Number(payload.benchmarkReturnPct || 0),
    excessReturnPct: Number(payload.excessReturnPct || 0),
    reviewVerdict: payload.reviewVerdict || '',
    createdAt: now,
    updatedAt: payload.updatedAt || now,
    metadata: payload.metadata || {},
  };
}

export function createResearchEvaluationEntry(payload = {}) {
  const now = payload.createdAt || new Date().toISOString();
  return {
    id: payload.id || `research-evaluation-${randomUUID()}`,
    runId: payload.runId || '',
    resultId: payload.resultId || '',
    strategyId: payload.strategyId || '',
    strategyName: payload.strategyName || 'Unknown Strategy',
    verdict: payload.verdict || 'rework',
    scoreBand: payload.scoreBand || 'watch',
    readiness: payload.readiness || 'hold',
    recommendedAction: payload.recommendedAction || '',
    summary: payload.summary || '',
    actor: payload.actor || 'operator',
    createdAt: now,
    metadata: payload.metadata || {},
  };
}

export function createResearchReportEntry(payload = {}) {
  const now = payload.createdAt || new Date().toISOString();
  return {
    id: payload.id || `research-report-${randomUUID()}`,
    evaluationId: payload.evaluationId || '',
    workflowRunId: payload.workflowRunId || '',
    runId: payload.runId || '',
    resultId: payload.resultId || '',
    strategyId: payload.strategyId || '',
    strategyName: payload.strategyName || 'Unknown Strategy',
    title: payload.title || 'Research report',
    verdict: payload.verdict || 'rework',
    readiness: payload.readiness || 'hold',
    executiveSummary: payload.executiveSummary || '',
    promotionCall: payload.promotionCall || '',
    executionPreparation: payload.executionPreparation || '',
    riskNotes: payload.riskNotes || '',
    createdAt: now,
    updatedAt: payload.updatedAt || now,
    metadata: payload.metadata || {},
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

export function createTenantEntry(payload = {}) {
  return {
    id: payload.id || 'tenant-quantpilot-labs',
    key: payload.key || 'quantpilot-labs',
    label: payload.label || payload.organization || 'QuantPilot Labs',
    status: payload.status || 'active',
  };
}

export function createWorkspaceEntry(payload = {}, tenant = createTenantEntry()) {
  return {
    id: payload.id || 'workspace-operations',
    tenantId: payload.tenantId || tenant.id,
    key: payload.key || 'operations',
    label: payload.label || 'Operations',
    description: payload.description || 'Default platform operations workspace.',
    role: payload.role || 'admin',
    status: payload.status || 'active',
    isDefault: payload.isDefault !== false,
    isCurrent: Boolean(payload.isCurrent),
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

function listUniquePermissions(items = []) {
  return [...new Set(items.map((item) => String(item || '').trim()).filter(Boolean))];
}

export function getItemScopeMetadata(item = {}) {
  return {
    tenantId: item?.metadata?.tenantId || item?.tenantId || '',
    workspaceId: item?.metadata?.workspaceId || item?.workspaceId || '',
  };
}

export function matchesScopeFilter(item = {}, filter = {}) {
  if (filter.allScopes || filter.scope === 'all') return true;

  const tenantId = filter.tenantId || '';
  const workspaceId = filter.workspaceId || '';
  if (!tenantId && !workspaceId) return true;

  const includeUnscoped = filter.includeUnscoped !== false;
  const itemScope = getItemScopeMetadata(item);
  const hasTenant = Boolean(itemScope.tenantId);
  const hasWorkspace = Boolean(itemScope.workspaceId);

  if (!hasTenant && !hasWorkspace) {
    return includeUnscoped;
  }

  if (tenantId && itemScope.tenantId && itemScope.tenantId !== tenantId) {
    return false;
  }
  if (workspaceId && itemScope.workspaceId && itemScope.workspaceId !== workspaceId) {
    return false;
  }
  if (tenantId && !itemScope.tenantId) {
    return includeUnscoped;
  }
  if (workspaceId && !itemScope.workspaceId) {
    return includeUnscoped;
  }

  return true;
}

export function listUserRoleTemplates() {
  return [
    {
      id: 'admin',
      label: 'Admin',
      summary: 'Full control over account settings, strategy changes, risk reviews, and execution approvals.',
      defaultPermissions: ['dashboard:read', 'strategy:write', 'risk:review', 'execution:approve', 'account:write', 'operations:maintain'],
      system: true,
    },
    {
      id: 'operator',
      label: 'Operator',
      summary: 'Can run the platform, manage strategies, and review risk without account administration.',
      defaultPermissions: ['dashboard:read', 'strategy:write', 'risk:review'],
      system: true,
    },
    {
      id: 'risk-reviewer',
      label: 'Risk Reviewer',
      summary: 'Focused risk-review role for reviewing risk posture, agent approvals, and guarded execution gates.',
      defaultPermissions: ['dashboard:read', 'risk:review'],
      system: true,
    },
    {
      id: 'execution-approver',
      label: 'Execution Approver',
      summary: 'Focused execution role for reviewing and controlling guarded execution actions.',
      defaultPermissions: ['dashboard:read', 'execution:approve'],
      system: true,
    },
    {
      id: 'viewer',
      label: 'Viewer',
      summary: 'Read-only access to dashboards and investigation context.',
      defaultPermissions: ['dashboard:read'],
      system: true,
    },
  ].map((template) => ({
    ...template,
    defaultPermissions: listUniquePermissions(template.defaultPermissions),
  }));
}

export function createUserRoleTemplateEntry(payload = {}, existingTemplates = listUserRoleTemplates()) {
  const existing = existingTemplates.find((item) => item.id === payload.id) || null;
  const inferredPermissions = Array.isArray(payload.defaultPermissions) && payload.defaultPermissions.length
    ? payload.defaultPermissions
    : (existing?.defaultPermissions || ['dashboard:read']);

  return {
    id: payload.id || existing?.id || 'custom-role',
    label: payload.label || existing?.label || 'Custom Role',
    summary: payload.summary || existing?.summary || 'Custom access role template.',
    defaultPermissions: listUniquePermissions(inferredPermissions),
    system: payload.system ?? existing?.system ?? false,
  };
}

export function getDefaultPermissionsForRole(role = 'viewer', roleTemplates = listUserRoleTemplates()) {
  const template = roleTemplates.find((item) => item.id === role) || roleTemplates.find((item) => item.id === 'viewer');
  return listUniquePermissions(template?.defaultPermissions || ['dashboard:read']);
}

export function createUserAccessPolicy(payload = {}, roleTemplates = listUserRoleTemplates()) {
  const role = payload.role || 'admin';
  const defaultPermissions = getDefaultPermissionsForRole(role, roleTemplates);
  const explicitPermissions = Array.isArray(payload.permissions) && payload.permissions.length
    ? listUniquePermissions(payload.permissions)
    : null;
  const grants = explicitPermissions
    ? explicitPermissions.filter((item) => !defaultPermissions.includes(item))
    : listUniquePermissions(payload.grants || []);
  const revokes = explicitPermissions
    ? defaultPermissions.filter((item) => !explicitPermissions.includes(item))
    : listUniquePermissions(payload.revokes || []);
  const effectivePermissions = explicitPermissions || listUniquePermissions([
    ...defaultPermissions.filter((item) => !revokes.includes(item)),
    ...grants,
  ]);

  return {
    role,
    status: payload.status || 'active',
    permissions: effectivePermissions,
    grants,
    revokes,
    defaultPermissions,
    effectivePermissions,
    roleTemplateId: payload.roleTemplateId || role,
  };
}

export function createBrokerBindingEntry(payload = {}) {
  const rawStatus = payload.status || 'disconnected';
  const connected = Boolean(payload.health?.connected ?? rawStatus === 'connected');
  const mismatch = Boolean(payload.health?.mismatch ?? payload.metadata?.mismatch);
  const lastError = payload.health?.lastError || payload.metadata?.lastError || '';
  const requiresAttention = Boolean(
    payload.health?.requiresAttention
      ?? Boolean(lastError || mismatch || rawStatus === 'error' || (!connected && payload.environment === 'live')),
  );
  const healthStatus = payload.health?.status
    || (requiresAttention ? (connected ? 'degraded' : 'attention') : (connected ? 'healthy' : 'idle'));
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
    health: {
      status: healthStatus,
      connected,
      requiresAttention,
      mismatch,
      lastCheckedAt: payload.health?.lastCheckedAt || payload.lastSyncAt || '',
      lastError,
    },
    metadata: payload.metadata || {},
  };
}

export function createExecutionRuntimeEntry(payload = {}) {
  const now = payload.createdAt || new Date().toISOString();
  return {
    id: payload.id || `execution-runtime-${randomUUID()}`,
    cycleId: payload.cycleId || '',
    cycle: Number(payload.cycle || 0),
    executionPlanId: payload.executionPlanId || '',
    executionRunId: payload.executionRunId || '',
    mode: payload.mode || 'paper',
    brokerAdapter: payload.brokerAdapter || 'simulated',
    brokerConnected: Boolean(payload.brokerConnected),
    marketConnected: Boolean(payload.marketConnected),
    submittedOrderCount: Number(payload.submittedOrderCount || 0),
    rejectedOrderCount: Number(payload.rejectedOrderCount || 0),
    openOrderCount: Number(payload.openOrderCount || 0),
    positionCount: Number(payload.positionCount || 0),
    cash: Number(payload.cash || 0),
    buyingPower: Number(payload.buyingPower || 0),
    equity: Number(payload.equity || 0),
    message: payload.message || '',
    metadata: payload.metadata || {},
    createdAt: now,
  };
}

export function createBrokerExecutionEventEntry(payload = {}) {
  const now = payload.createdAt || new Date().toISOString();
  return {
    id: payload.id || `broker-execution-event-${randomUUID()}`,
    executionPlanId: payload.executionPlanId || '',
    executionRunId: payload.executionRunId || '',
    brokerOrderId: payload.brokerOrderId || '',
    symbol: payload.symbol || '',
    eventType: payload.eventType || 'acknowledged',
    status: payload.status || payload.eventType || 'acknowledged',
    filledQty: Number(payload.filledQty || 0),
    avgFillPrice: Number.isFinite(payload.avgFillPrice) ? Number(payload.avgFillPrice) : null,
    source: payload.source || 'execution-desk',
    actor: payload.actor || 'execution-desk',
    headline: payload.headline || '',
    message: payload.message || '',
    metadata: payload.metadata || {},
    createdAt: now,
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
