import { useEffect, useState } from 'react';
import type { IncidentActivityRecord, IncidentEvidenceItem } from '@shared-types/trading.ts';
import { useTradingSystem } from '../../store/trading-system/TradingSystemProvider.tsx';
import { useLatestBrokerSnapshot } from '../../hooks/useLatestBrokerSnapshot.ts';
import { useMarketProviderStatus } from '../../hooks/useMarketProviderStatus.ts';
import { useMonitoringStatus } from '../../hooks/useMonitoringStatus.ts';
import { appendIncidentNote, createIncident, updateIncident } from '../../app/api/controlPlane.ts';
import { useExecutionLedgerFeed } from '../../modules/notifications/useExecutionLedgerFeed.ts';
import { useNotificationsFeed } from '../../modules/notifications/useNotificationsFeed.ts';
import { useAuditRecordsFeed } from '../../modules/notifications/useAuditRecordsFeed.ts';
import { useIncidentDetail } from '../../modules/notifications/useIncidentDetail.ts';
import { useIncidentArtifactInspector } from '../../modules/notifications/useIncidentArtifactInspector.ts';
import { useIncidentsFeed } from '../../modules/notifications/useIncidentsFeed.ts';
import { useMonitoringAlertsFeed } from '../../modules/notifications/useMonitoringAlertsFeed.ts';
import { useMonitoringSnapshotsFeed } from '../../modules/notifications/useMonitoringSnapshotsFeed.ts';
import { useOperatorActionsFeed } from '../../modules/notifications/useOperatorActionsFeed.ts';
import { useRiskEventsFeed } from '../../modules/notifications/useRiskEventsFeed.ts';
import { useSchedulerTicksFeed } from '../../modules/notifications/useSchedulerTicksFeed.ts';
import { useWorkflowRunsFeed } from '../../modules/notifications/useWorkflowRunsFeed.ts';
import { SectionHeader, TopMeta } from '../console/components/ConsoleChrome.tsx';
import { ActivityLog } from '../console/components/ConsoleTables.tsx';
import { copy, useLocale } from '../console/i18n.tsx';
import { connectionLabel, fmtDateTime, monitoringTone, translateMonitoringStatus, translateProviderLabel } from '../console/utils.ts';

const MONITORING_TIME_WINDOWS = [
  { key: '1h', hours: 1 },
  { key: '24h', hours: 24 },
  { key: '7d', hours: 24 * 7 },
  { key: 'all', hours: null },
] as const;

const MONITORING_SOURCES = ['all', 'worker', 'workflow', 'queue', 'risk', 'broker', 'market'] as const;
const MONITORING_LEVELS = ['all', 'info', 'warn', 'critical'] as const;
const MONITORING_SNAPSHOT_STATUSES = ['all', 'healthy', 'warn', 'critical'] as const;
const SCHEDULER_PHASES = ['all', 'PRE_OPEN', 'INTRADAY', 'POST_CLOSE', 'OFF_HOURS'] as const;
const OPERATOR_ACTION_LEVELS = ['all', 'info', 'warn', 'critical'] as const;
const NOTIFICATION_LEVELS = ['all', 'info', 'warn', 'critical'] as const;
const NOTIFICATION_SOURCES = ['all', 'scheduler', 'workflow-control', 'task-orchestrator', 'execution-planner', 'control-plane', 'agent-control'] as const;
const AUDIT_TYPES = ['all', 'workflow', 'execution-plan', 'agent-action-request', 'cycle', 'backtest-run.reviewed', 'strategy-catalog.saved'] as const;
const INCIDENT_STATUSES = ['all', 'open', 'investigating', 'mitigated', 'resolved'] as const;
const INCIDENT_SEVERITIES = ['all', 'info', 'warn', 'critical'] as const;
const INCIDENT_SOURCES = ['all', 'monitoring', 'notification', 'audit', 'operator', 'workflow', 'scheduler', 'control-plane', 'risk', 'execution'] as const;
const RISK_EVENT_LEVELS = ['all', 'info', 'warn', 'critical'] as const;
const RISK_EVENT_STATUSES = ['all', 'healthy', 'risk-off', 'approval-required', 'connectivity-degraded'] as const;
const WORKFLOW_RUN_STATUSES = ['all', 'queued', 'running', 'retry_scheduled', 'failed', 'completed', 'canceled'] as const;
const EXECUTION_PLAN_STATUSES = ['all', 'draft', 'ready', 'blocked', 'approved', 'review'] as const;

type InvestigationTimelineItem = {
  id: string;
  detail: string;
  kind: 'incident' | 'notification' | 'audit' | 'operator-action' | 'monitoring-alert' | 'risk-event' | 'workflow-run' | 'execution-plan';
  level: string;
  source: string;
  timestamp: string;
  title: string;
};

function translateTimelineKind(locale: string, kind: InvestigationTimelineItem['kind']) {
  if (locale === 'zh') {
    if (kind === 'incident') return '事件';
    if (kind === 'notification') return '通知';
    if (kind === 'audit') return '审计';
    if (kind === 'operator-action') return '动作';
    if (kind === 'risk-event') return '风控';
    if (kind === 'workflow-run') return '工作流';
    if (kind === 'execution-plan') return '执行计划';
    return '监控';
  }

  if (kind === 'incident') return 'Incident';
  if (kind === 'notification') return 'Notification';
  if (kind === 'audit') return 'Audit';
  if (kind === 'operator-action') return 'Action';
  if (kind === 'risk-event') return 'Risk';
  if (kind === 'workflow-run') return 'Workflow';
  if (kind === 'execution-plan') return 'Execution';
  return 'Monitoring';
}

function translateEvidenceKind(locale: string, kind: 'monitoring-alert' | 'notification' | 'audit' | 'operator-action' | 'scheduler-tick' | 'risk-event' | 'workflow-run' | 'execution-plan') {
  if (kind === 'scheduler-tick') {
    return locale === 'zh' ? '调度' : 'Scheduler';
  }
  if (kind === 'risk-event') {
    return locale === 'zh' ? '风控' : 'Risk';
  }
  if (kind === 'workflow-run') {
    return locale === 'zh' ? '工作流' : 'Workflow';
  }
  if (kind === 'execution-plan') {
    return locale === 'zh' ? '执行计划' : 'Execution';
  }
  return translateTimelineKind(locale, kind === 'monitoring-alert' ? 'monitoring-alert' : kind);
}

function getMetadataEntries(metadata: Record<string, unknown> | undefined) {
  return Object.entries(metadata || {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .slice(0, 10)
    .map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
    }));
}

function buildArtifactDraft(locale: string, item: IncidentEvidenceItem) {
  const lines = [
    `${locale === 'zh' ? '证据' : 'Evidence'}: ${item.title}`,
    `${locale === 'zh' ? '类型' : 'Kind'}: ${item.kind}`,
    `${locale === 'zh' ? '来源' : 'Source'}: ${item.source}`,
    `${locale === 'zh' ? '时间' : 'Time'}: ${item.timestamp}`,
    `${locale === 'zh' ? '摘要' : 'Summary'}: ${item.detail}`,
  ];

  if (item.metadata && Object.keys(item.metadata).length) {
    lines.push(`${locale === 'zh' ? '元数据' : 'Metadata'}: ${JSON.stringify(item.metadata)}`);
  }

  return lines.join('\n');
}

function translateIncidentActivityKind(locale: string, kind: IncidentActivityRecord['kind']) {
  if (locale === 'zh') {
    if (kind === 'opened') return '已创建';
    if (kind === 'status-changed') return '状态变更';
    if (kind === 'owner-changed') return '负责人变更';
    if (kind === 'severity-changed') return '级别变更';
    if (kind === 'summary-updated') return '摘要更新';
    if (kind === 'links-updated') return '关联更新';
    return '追加记录';
  }

  if (kind === 'opened') return 'Opened';
  if (kind === 'status-changed') return 'Status';
  if (kind === 'owner-changed') return 'Owner';
  if (kind === 'severity-changed') return 'Severity';
  if (kind === 'summary-updated') return 'Summary';
  if (kind === 'links-updated') return 'Links';
  return 'Note';
}

function buildActivityDraft(locale: string, item: IncidentActivityRecord) {
  const lines = [
    `${locale === 'zh' ? '活动' : 'Activity'}: ${item.title}`,
    `${locale === 'zh' ? '类型' : 'Kind'}: ${item.kind}`,
    `${locale === 'zh' ? '执行人' : 'Actor'}: ${item.actor}`,
    `${locale === 'zh' ? '时间' : 'Time'}: ${item.createdAt}`,
    `${locale === 'zh' ? '详情' : 'Detail'}: ${item.detail}`,
  ];

  if (item.metadata && Object.keys(item.metadata).length) {
    lines.push(`${locale === 'zh' ? '元数据' : 'Metadata'}: ${JSON.stringify(item.metadata)}`);
  }

  return lines.join('\n');
}

function NotificationsPage() {
  const { state } = useTradingSystem();
  const { locale } = useLocale();
  const [monitoringSourceFilter, setMonitoringSourceFilter] = useState('all');
  const [monitoringLevelFilter, setMonitoringLevelFilter] = useState('all');
  const [selectedMonitoringSnapshotId, setSelectedMonitoringSnapshotId] = useState('');
  const [monitoringSnapshotStatusFilter, setMonitoringSnapshotStatusFilter] = useState('all');
  const [monitoringTimeWindow, setMonitoringTimeWindow] = useState<(typeof MONITORING_TIME_WINDOWS)[number]['key']>('24h');
  const [schedulerPhaseFilter, setSchedulerPhaseFilter] = useState('all');
  const [schedulerTimeWindow, setSchedulerTimeWindow] = useState<(typeof MONITORING_TIME_WINDOWS)[number]['key']>('24h');
  const [operatorActionLevelFilter, setOperatorActionLevelFilter] = useState('all');
  const [operatorActionTimeWindow, setOperatorActionTimeWindow] = useState<(typeof MONITORING_TIME_WINDOWS)[number]['key']>('24h');
  const [notificationLevelFilter, setNotificationLevelFilter] = useState('all');
  const [notificationSourceFilter, setNotificationSourceFilter] = useState('all');
  const [notificationTimeWindow, setNotificationTimeWindow] = useState<(typeof MONITORING_TIME_WINDOWS)[number]['key']>('24h');
  const [auditTypeFilter, setAuditTypeFilter] = useState('all');
  const [auditTimeWindow, setAuditTimeWindow] = useState<(typeof MONITORING_TIME_WINDOWS)[number]['key']>('24h');
  const [incidentStatusFilter, setIncidentStatusFilter] = useState('all');
  const [incidentSeverityFilter, setIncidentSeverityFilter] = useState('all');
  const [incidentSourceFilter, setIncidentSourceFilter] = useState('all');
  const [incidentTimeWindow, setIncidentTimeWindow] = useState<(typeof MONITORING_TIME_WINDOWS)[number]['key']>('7d');
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [incidentRefreshKey, setIncidentRefreshKey] = useState(0);
  const [selectedArtifactKey, setSelectedArtifactKey] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [incidentNoteDraft, setIncidentNoteDraft] = useState('');
  const [incidentOwnerDraft, setIncidentOwnerDraft] = useState('');
  const [incidentBusy, setIncidentBusy] = useState(false);
  const [riskEventLevelFilter, setRiskEventLevelFilter] = useState('all');
  const [riskEventStatusFilter, setRiskEventStatusFilter] = useState('all');
  const [workflowRunStatusFilter, setWorkflowRunStatusFilter] = useState('all');
  const [executionPlanStatusFilter, setExecutionPlanStatusFilter] = useState('all');
  const activeTimeWindow = MONITORING_TIME_WINDOWS.find((item) => item.key === monitoringTimeWindow) || MONITORING_TIME_WINDOWS[1];
  const activeSchedulerTimeWindow = MONITORING_TIME_WINDOWS.find((item) => item.key === schedulerTimeWindow) || MONITORING_TIME_WINDOWS[1];
  const activeOperatorActionTimeWindow = MONITORING_TIME_WINDOWS.find((item) => item.key === operatorActionTimeWindow) || MONITORING_TIME_WINDOWS[1];
  const activeNotificationTimeWindow = MONITORING_TIME_WINDOWS.find((item) => item.key === notificationTimeWindow) || MONITORING_TIME_WINDOWS[1];
  const activeAuditTimeWindow = MONITORING_TIME_WINDOWS.find((item) => item.key === auditTimeWindow) || MONITORING_TIME_WINDOWS[1];
  const activeIncidentTimeWindow = MONITORING_TIME_WINDOWS.find((item) => item.key === incidentTimeWindow) || MONITORING_TIME_WINDOWS[2];
  const { snapshot } = useLatestBrokerSnapshot(state.controlPlane.lastSyncAt);
  const { status: marketStatus } = useMarketProviderStatus(state.controlPlane.lastSyncAt);
  const { status: monitoringStatus, loading: monitoringLoading } = useMonitoringStatus(state.controlPlane.lastSyncAt);
  const { items: monitoringAlertItems, loading: monitoringAlertsLoading } = useMonitoringAlertsFeed({
    hours: activeTimeWindow.hours,
    level: monitoringLevelFilter === 'all' ? '' : monitoringLevelFilter,
    snapshotId: selectedMonitoringSnapshotId,
    source: monitoringSourceFilter === 'all' ? '' : monitoringSourceFilter,
  });
  const { items: monitoringSnapshotItems, loading: monitoringSnapshotsLoading } = useMonitoringSnapshotsFeed({
    hours: activeTimeWindow.hours,
    status: monitoringSnapshotStatusFilter === 'all' ? '' : monitoringSnapshotStatusFilter,
  });
  const { items, loading } = useNotificationsFeed({
    hours: activeNotificationTimeWindow.hours,
    level: notificationLevelFilter === 'all' ? '' : notificationLevelFilter,
    source: notificationSourceFilter === 'all' ? '' : notificationSourceFilter,
  });
  const { items: actionItems, loading: actionLoading } = useOperatorActionsFeed({
    hours: activeOperatorActionTimeWindow.hours,
    level: operatorActionLevelFilter === 'all' ? '' : operatorActionLevelFilter,
  });
  const { items: auditItems, loading: auditLoading } = useAuditRecordsFeed({
    hours: activeAuditTimeWindow.hours,
    type: auditTypeFilter === 'all' ? '' : auditTypeFilter,
  });
  const { items: incidentItems, loading: incidentsLoading } = useIncidentsFeed({
    hours: activeIncidentTimeWindow.hours,
    refreshKey: incidentRefreshKey,
    severity: incidentSeverityFilter === 'all' ? '' : incidentSeverityFilter,
    source: incidentSourceFilter === 'all' ? '' : incidentSourceFilter,
    status: incidentStatusFilter === 'all' ? '' : incidentStatusFilter,
  });
  const {
    incident: selectedIncident,
    notes: selectedIncidentNotes,
    activity: selectedIncidentActivity,
    evidence: selectedIncidentEvidence,
    loading: incidentDetailLoading,
  } = useIncidentDetail(selectedIncidentId, incidentRefreshKey);
  const selectedArtifact = selectedIncidentEvidence.timeline.find((item) => `${item.kind}:${item.id}` === selectedArtifactKey) || selectedIncidentEvidence.timeline[0] || null;
  const selectedActivity = selectedIncidentActivity.timeline.find((item) => item.id === selectedActivityId) || selectedIncidentActivity.timeline[0] || null;
  const artifactInspector = useIncidentArtifactInspector(selectedArtifact, incidentRefreshKey);
  const { items: riskEventItems, loading: riskEventsLoading } = useRiskEventsFeed({
    level: riskEventLevelFilter === 'all' ? '' : riskEventLevelFilter,
    refreshKey: incidentRefreshKey,
    status: riskEventStatusFilter === 'all' ? '' : riskEventStatusFilter,
  });
  const { items: workflowRunItems, loading: workflowRunsLoading } = useWorkflowRunsFeed({
    refreshKey: incidentRefreshKey,
    status: workflowRunStatusFilter === 'all' ? '' : workflowRunStatusFilter,
  });
  const { items: executionLedgerItems, loading: executionLedgerLoading } = useExecutionLedgerFeed({
    refreshKey: incidentRefreshKey,
    status: executionPlanStatusFilter === 'all' ? '' : executionPlanStatusFilter,
  });
  const { items: schedulerItems, loading: schedulerLoading } = useSchedulerTicksFeed({
    hours: activeSchedulerTimeWindow.hours,
    phase: schedulerPhaseFilter === 'all' ? '' : schedulerPhaseFilter,
  });
  const marketConnected = marketStatus?.connected ?? state.integrationStatus.marketData.connected;
  const marketFallback = marketStatus?.fallback ?? !marketConnected;
  const brokerConnected = Boolean(snapshot?.connected ?? state.integrationStatus.broker.connected);
  const connectedCount = Number(marketConnected) + Number(brokerConnected);
  const marketProviderLabel = translateProviderLabel(
    locale,
    marketStatus?.provider === 'alpaca'
      ? 'Alpaca Market Data via Gateway'
      : marketStatus?.provider === 'custom-http'
        ? 'HTTP 行情网关'
        : (state.integrationStatus.marketData.label || state.integrationStatus.marketData.provider),
  );
  const monitoringWorkflowBacklog = (monitoringStatus?.services.workflows.queued || 0)
    + (monitoringStatus?.services.workflows.running || 0)
    + (monitoringStatus?.services.workflows.retryScheduled || 0);
  const monitoringQueueBacklog = (monitoringStatus?.services.queues.pendingNotificationJobs || 0)
    + (monitoringStatus?.services.queues.pendingRiskScanJobs || 0)
    + (monitoringStatus?.services.queues.pendingAgentReviews || 0);
  const workerHeartbeatLag = monitoringStatus?.services.worker.lagSeconds;
  const selectedMonitoringSnapshot = monitoringSnapshotItems.find((item) => item.id === selectedMonitoringSnapshotId) || null;

  useEffect(() => {
    if (!selectedMonitoringSnapshotId) return;
    const exists = monitoringSnapshotItems.some((item) => item.id === selectedMonitoringSnapshotId);
    if (!exists) {
      setSelectedMonitoringSnapshotId('');
    }
  }, [monitoringSnapshotItems, selectedMonitoringSnapshotId]);

  useEffect(() => {
    if (!selectedIncidentId) return;
    const exists = incidentItems.some((item) => item.id === selectedIncidentId);
    if (!exists) {
      setSelectedIncidentId('');
      setIncidentNoteDraft('');
      setSelectedArtifactKey('');
      setSelectedActivityId('');
    }
  }, [incidentItems, selectedIncidentId]);

  useEffect(() => {
    if (!selectedIncidentId) {
      setSelectedArtifactKey('');
      return;
    }
    if (!selectedIncidentEvidence.timeline.length) {
      setSelectedArtifactKey('');
      return;
    }
    const exists = selectedIncidentEvidence.timeline.some((item) => `${item.kind}:${item.id}` === selectedArtifactKey);
    if (!exists) {
      const preferred = selectedIncidentEvidence.timeline.find((item) => item.linked) || selectedIncidentEvidence.timeline[0];
      setSelectedArtifactKey(preferred ? `${preferred.kind}:${preferred.id}` : '');
    }
  }, [selectedArtifactKey, selectedIncidentEvidence.timeline, selectedIncidentId]);

  useEffect(() => {
    if (!selectedIncidentId) {
      setSelectedActivityId('');
      return;
    }
    if (!selectedIncidentActivity.timeline.length) {
      setSelectedActivityId('');
      return;
    }
    const exists = selectedIncidentActivity.timeline.some((item) => item.id === selectedActivityId);
    if (!exists) {
      setSelectedActivityId(selectedIncidentActivity.timeline[0]?.id || '');
    }
  }, [selectedActivityId, selectedIncidentActivity.timeline, selectedIncidentId]);

  useEffect(() => {
    if (selectedIncident?.owner) {
      setIncidentOwnerDraft(selectedIncident.owner);
      return;
    }
    if (!selectedIncidentId) {
      setIncidentOwnerDraft(state.controlPlane.operator || '');
    }
  }, [selectedIncident?.owner, selectedIncidentId, state.controlPlane.operator]);

  function applyMonitoringFocus(options: {
    source?: string;
    level?: string;
    snapshotStatus?: string;
    timeWindow?: (typeof MONITORING_TIME_WINDOWS)[number]['key'];
    snapshotId?: string;
  }) {
    setMonitoringSourceFilter(options.source || 'all');
    setMonitoringLevelFilter(options.level || 'all');
    setMonitoringSnapshotStatusFilter(options.snapshotStatus || 'all');
    setMonitoringTimeWindow(options.timeWindow || '24h');
    setSelectedMonitoringSnapshotId(options.snapshotId || '');
  }

  function applyNotificationFocus(options: {
    level?: string;
    source?: string;
    timeWindow?: (typeof MONITORING_TIME_WINDOWS)[number]['key'];
  }) {
    setNotificationLevelFilter(options.level || 'all');
    setNotificationSourceFilter(options.source || 'all');
    setNotificationTimeWindow(options.timeWindow || '24h');
  }

  function applyAuditFocus(options: {
    type?: string;
    timeWindow?: (typeof MONITORING_TIME_WINDOWS)[number]['key'];
  }) {
    setAuditTypeFilter(options.type || 'all');
    setAuditTimeWindow(options.timeWindow || '24h');
  }

  function applySchedulerFocus(options: {
    phase?: string;
    timeWindow?: (typeof MONITORING_TIME_WINDOWS)[number]['key'];
  }) {
    setSchedulerPhaseFilter(options.phase || 'all');
    setSchedulerTimeWindow(options.timeWindow || '24h');
  }

  function applyOperatorActionFocus(options: {
    level?: string;
    timeWindow?: (typeof MONITORING_TIME_WINDOWS)[number]['key'];
  }) {
    setOperatorActionLevelFilter(options.level || 'all');
    setOperatorActionTimeWindow(options.timeWindow || '24h');
  }

  function applyIncidentFocus(options: {
    severity?: string;
    source?: string;
    status?: string;
    timeWindow?: (typeof MONITORING_TIME_WINDOWS)[number]['key'];
    incidentId?: string;
  }) {
    setIncidentSeverityFilter(options.severity || 'all');
    setIncidentSourceFilter(options.source || 'all');
    setIncidentStatusFilter(options.status || 'all');
    setIncidentTimeWindow(options.timeWindow || '7d');
    if (options.incidentId !== undefined) {
      setSelectedIncidentId(options.incidentId || '');
    }
  }

  function applyRiskFocus(options: {
    level?: string;
    status?: string;
  }) {
    setRiskEventLevelFilter(options.level || 'all');
    setRiskEventStatusFilter(options.status || 'all');
  }

  function applyWorkflowFocus(options: {
    status?: string;
  }) {
    setWorkflowRunStatusFilter(options.status || 'all');
  }

  function applyExecutionFocus(options: {
    status?: string;
  }) {
    setExecutionPlanStatusFilter(options.status || 'all');
  }

  function resetAllFocuses() {
    applyMonitoringFocus({});
    applyNotificationFocus({});
    applyAuditFocus({});
    applySchedulerFocus({});
    applyOperatorActionFocus({});
    applyIncidentFocus({});
    applyRiskFocus({});
    applyWorkflowFocus({});
    applyExecutionFocus({});
    setSelectedActivityId('');
  }

  function focusNotificationItem(source: string) {
    if (source === 'scheduler') {
      applySchedulerFocus({ timeWindow: '24h' });
      applyNotificationFocus({ source, timeWindow: '24h' });
      return;
    }
    if (source === 'workflow-control') {
      applyAuditFocus({ type: 'workflow', timeWindow: '24h' });
      applyNotificationFocus({ source, timeWindow: '24h' });
      return;
    }
    if (source === 'execution-planner') {
      applyAuditFocus({ type: 'execution-plan', timeWindow: '24h' });
      applyNotificationFocus({ source, timeWindow: '24h' });
      return;
    }
    if (source === 'agent-control') {
      applyAuditFocus({ type: 'agent-action-request', timeWindow: '24h' });
      applyNotificationFocus({ source, timeWindow: '24h' });
      return;
    }
    applyNotificationFocus({ source, timeWindow: '24h' });
  }

  function focusAuditItem(type: string) {
    applyAuditFocus({ type, timeWindow: '24h' });
    if (type === 'workflow') {
      applyNotificationFocus({ source: 'workflow-control', timeWindow: '24h' });
      return;
    }
    if (type === 'execution-plan') {
      applyNotificationFocus({ source: 'execution-planner', timeWindow: '24h' });
      return;
    }
    if (type === 'agent-action-request') {
      applyNotificationFocus({ source: 'agent-control', timeWindow: '24h' });
    }
  }

  function focusSchedulerItem(phase: string) {
    applySchedulerFocus({ phase, timeWindow: '24h' });
    applyNotificationFocus({ source: 'scheduler', timeWindow: '24h' });
  }

  function focusOperatorActionItem(level: string) {
    applyOperatorActionFocus({ level, timeWindow: '24h' });
    applyAuditFocus({ timeWindow: '24h' });
  }

  function focusRiskEventItem(status: string, level: string) {
    applyRiskFocus({
      level: level === 'info' ? 'all' : level,
      status,
    });
    applyMonitoringFocus({
      source: 'risk',
      level: level === 'info' ? 'all' : level,
      timeWindow: '24h',
    });
  }

  function focusWorkflowRunItem(status: string) {
    applyWorkflowFocus({ status });
    applyMonitoringFocus({
      source: 'workflow',
      level: status === 'failed' ? 'critical' : status === 'retry_scheduled' ? 'warn' : 'all',
      timeWindow: '24h',
    });
  }

  function focusExecutionPlanItem(status: string) {
    applyExecutionFocus({ status });
    applyAuditFocus({
      type: 'execution-plan',
      timeWindow: '24h',
    });
  }

  async function openIncident(payload: {
    title: string;
    summary: string;
    severity: string;
    source: string;
    owner?: string;
    tags?: string[];
    links?: Array<Record<string, unknown>>;
    initialNote?: string;
    metadata?: Record<string, unknown>;
  }) {
    setIncidentBusy(true);
    try {
      const response = await createIncident({
        ...payload,
        owner: payload.owner || state.controlPlane.operator,
        status: 'open',
      });
      const nextId = response.incident.id;
      setIncidentRefreshKey((value) => value + 1);
      applyIncidentFocus({
        incidentId: nextId,
        severity: payload.severity,
        source: payload.source,
        status: 'open',
        timeWindow: '7d',
      });
      setIncidentNoteDraft('');
      return response.incident;
    } finally {
      setIncidentBusy(false);
    }
  }

  async function updateSelectedIncident(patch: Record<string, unknown>) {
    if (!selectedIncidentId) return;
    setIncidentBusy(true);
    try {
      await updateIncident(selectedIncidentId, patch);
      setIncidentRefreshKey((value) => value + 1);
    } finally {
      setIncidentBusy(false);
    }
  }

  async function appendSelectedIncidentNote() {
    if (!selectedIncidentId || !incidentNoteDraft.trim()) return;
    setIncidentBusy(true);
    try {
      await appendIncidentNote(selectedIncidentId, {
        author: state.controlPlane.operator,
        body: incidentNoteDraft.trim(),
      });
      setIncidentNoteDraft('');
      setIncidentRefreshKey((value) => value + 1);
    } finally {
      setIncidentBusy(false);
    }
  }

  function focusIncidentActivityItem(item: IncidentActivityRecord) {
    setSelectedActivityId(item.id);
    if (item.kind === 'status-changed' && typeof item.metadata?.to === 'string') {
      applyIncidentFocus({
        incidentId: selectedIncidentId,
        severity: selectedIncident?.severity || 'all',
        source: selectedIncident?.source || 'all',
        status: item.metadata.to,
        timeWindow: incidentTimeWindow,
      });
      return;
    }
    if (item.kind === 'severity-changed' && typeof item.metadata?.to === 'string') {
      applyIncidentFocus({
        incidentId: selectedIncidentId,
        severity: item.metadata.to,
        source: selectedIncident?.source || 'all',
        status: selectedIncident?.status || 'all',
        timeWindow: incidentTimeWindow,
      });
      return;
    }
    if (item.kind === 'owner-changed' && typeof item.metadata?.to === 'string') {
      setIncidentOwnerDraft(item.metadata.to);
    }
  }

  function createMonitoringIncident(item: (typeof monitoringAlertItems)[number]) {
    return openIncident({
      title: `${item.source} ${locale === 'zh' ? '告警' : 'alert'}`,
      summary: item.message,
      severity: item.level,
      source: 'monitoring',
      tags: ['monitoring', item.source, item.level].filter(Boolean),
      links: [{ kind: 'monitoring-alert', alertId: item.id, snapshotId: item.snapshotId || '' }],
      initialNote: `${item.message}\n\n${locale === 'zh' ? '来源' : 'Source'}: ${item.source}`,
      metadata: {
        monitoringAlertId: item.id,
        snapshotId: item.snapshotId || '',
      },
    });
  }

  function createNotificationIncident(item: (typeof items)[number]) {
    return openIncident({
      title: item.title,
      summary: item.message,
      severity: item.level,
      source: 'notification',
      tags: ['notification', item.source, item.level].filter(Boolean),
      links: [{ kind: 'notification', notificationId: item.id, source: item.source }],
      initialNote: item.message,
      metadata: {
        notificationId: item.id,
        notificationSource: item.source,
      },
    });
  }

  function createAuditIncident(item: (typeof auditItems)[number]) {
    return openIncident({
      title: item.title,
      summary: item.detail,
      severity: 'warn',
      source: 'audit',
      tags: ['audit', item.type].filter(Boolean),
      links: [{ kind: 'audit', auditId: item.id, auditType: item.type }],
      initialNote: item.detail,
      metadata: {
        auditId: item.id,
        auditType: item.type,
      },
    });
  }

  function createOperatorActionIncident(item: (typeof actionItems)[number]) {
    return openIncident({
      title: item.title,
      summary: item.detail,
      severity: item.level,
      source: 'operator',
      tags: ['operator', item.type, item.level, item.actor].filter(Boolean),
      links: [{ kind: 'operator-action', actionId: item.id, actor: item.actor }],
      initialNote: item.detail,
      metadata: {
        operatorActionId: item.id,
        actionActor: item.actor,
        actionType: item.type,
      },
    });
  }

  function createSchedulerIncident(item: (typeof schedulerItems)[number]) {
    return openIncident({
      title: item.title,
      summary: item.message,
      severity: item.status === 'phase-change' ? 'warn' : 'info',
      source: 'scheduler',
      tags: ['scheduler', item.phase, item.status].filter(Boolean),
      links: [{ kind: 'scheduler-tick', tickId: item.id, phase: item.phase }],
      initialNote: item.message,
      metadata: {
        schedulerTickId: item.id,
        schedulerPhase: item.phase,
      },
    });
  }

  function createRiskIncident(item: (typeof riskEventItems)[number]) {
    return openIncident({
      title: item.title,
      summary: item.message,
      severity: item.level,
      source: 'risk',
      tags: ['risk', item.status, item.riskLevel, item.level].filter(Boolean),
      links: [{ kind: 'risk-event', riskEventId: item.id, source: item.source }],
      initialNote: item.message,
      metadata: {
        riskEventId: item.id,
        riskStatus: item.status,
        riskLevel: item.riskLevel,
        cycle: item.cycle,
      },
    });
  }

  function createWorkflowIncident(item: (typeof workflowRunItems)[number]) {
    return openIncident({
      title: item.workflowId,
      summary: String(item.error || item.metadata?.summary || item.status),
      severity: item.status === 'failed' ? 'critical' : item.status === 'retry_scheduled' ? 'warn' : 'info',
      source: 'workflow',
      tags: ['workflow', item.workflowType, item.status, item.actor].filter(Boolean),
      links: [{ kind: 'workflow-run', workflowRunId: item.id, workflowId: item.workflowId }],
      initialNote: String(item.error || item.metadata?.summary || item.status),
      metadata: {
        workflowRunId: item.id,
        workflowId: item.workflowId,
        workflowType: item.workflowType,
        workflowStatus: item.status,
      },
    });
  }

  function createExecutionPlanIncident(item: (typeof executionLedgerItems)[number]) {
    return openIncident({
      title: item.plan.strategyName,
      summary: item.plan.summary,
      severity: item.plan.riskStatus === 'blocked' ? 'critical' : item.plan.riskStatus === 'review' ? 'warn' : 'info',
      source: 'execution',
      tags: ['execution-plan', item.plan.status, item.plan.riskStatus, item.plan.mode].filter(Boolean),
      links: [{ kind: 'execution-plan', executionPlanId: item.plan.id, workflowRunId: item.plan.workflowRunId }],
      initialNote: item.plan.summary,
      metadata: {
        executionPlanId: item.plan.id,
        workflowRunId: item.plan.workflowRunId,
        strategyId: item.plan.strategyId,
        planStatus: item.plan.status,
        riskStatus: item.plan.riskStatus,
      },
    });
  }

  const activeFocusTags = [
    monitoringSourceFilter !== 'all' ? `monitor:${monitoringSourceFilter}` : '',
    monitoringLevelFilter !== 'all' ? `severity:${monitoringLevelFilter}` : '',
    selectedMonitoringSnapshotId ? 'snapshot:selected' : '',
    monitoringSnapshotStatusFilter !== 'all' ? `snapshot:${monitoringSnapshotStatusFilter}` : '',
    monitoringTimeWindow !== '24h' ? `monitor-window:${monitoringTimeWindow}` : '',
    schedulerPhaseFilter !== 'all' ? `scheduler:${schedulerPhaseFilter}` : '',
    schedulerTimeWindow !== '24h' ? `scheduler-window:${schedulerTimeWindow}` : '',
    operatorActionLevelFilter !== 'all' ? `actions:${operatorActionLevelFilter}` : '',
    operatorActionTimeWindow !== '24h' ? `actions-window:${operatorActionTimeWindow}` : '',
    notificationLevelFilter !== 'all' ? `notif-level:${notificationLevelFilter}` : '',
    notificationSourceFilter !== 'all' ? `notif-source:${notificationSourceFilter}` : '',
    notificationTimeWindow !== '24h' ? `notif-window:${notificationTimeWindow}` : '',
    auditTypeFilter !== 'all' ? `audit:${auditTypeFilter}` : '',
    auditTimeWindow !== '24h' ? `audit-window:${auditTimeWindow}` : '',
    incidentStatusFilter !== 'all' ? `incident:${incidentStatusFilter}` : '',
    incidentSeverityFilter !== 'all' ? `incident-severity:${incidentSeverityFilter}` : '',
    incidentSourceFilter !== 'all' ? `incident-source:${incidentSourceFilter}` : '',
    incidentTimeWindow !== '7d' ? `incident-window:${incidentTimeWindow}` : '',
    selectedIncidentId ? 'incident:selected' : '',
    riskEventLevelFilter !== 'all' ? `risk-level:${riskEventLevelFilter}` : '',
    riskEventStatusFilter !== 'all' ? `risk-status:${riskEventStatusFilter}` : '',
    workflowRunStatusFilter !== 'all' ? `workflow:${workflowRunStatusFilter}` : '',
    executionPlanStatusFilter !== 'all' ? `execution:${executionPlanStatusFilter}` : '',
  ].filter(Boolean);

  const investigationTimeline = [
    ...incidentItems.map<InvestigationTimelineItem>((item) => ({
      id: `incident:${item.id}`,
      kind: 'incident',
      title: item.title,
      detail: item.summary || item.latestNotePreview || item.status,
      level: item.severity,
      source: item.source,
      timestamp: item.updatedAt || item.createdAt,
    })),
    ...items.map<InvestigationTimelineItem>((item) => ({
      id: `notification:${item.id}`,
      kind: 'notification',
      title: item.title,
      detail: item.message,
      level: item.level,
      source: item.source,
      timestamp: item.createdAt,
    })),
    ...auditItems.map<InvestigationTimelineItem>((item) => ({
      id: `audit:${item.id}`,
      kind: 'audit',
      title: item.title,
      detail: item.detail,
      level: 'info',
      source: item.type,
      timestamp: item.createdAt,
    })),
    ...actionItems.map<InvestigationTimelineItem>((item) => ({
      id: `action:${item.id}`,
      kind: 'operator-action',
      title: item.title,
      detail: item.detail,
      level: item.level,
      source: item.actor,
      timestamp: item.createdAt,
    })),
    ...monitoringAlertItems.map<InvestigationTimelineItem>((item) => ({
      id: `monitoring:${item.id}`,
      kind: 'monitoring-alert',
      title: item.source,
      detail: item.message,
      level: item.level,
      source: item.source,
      timestamp: item.createdAt,
    })),
    ...riskEventItems.map<InvestigationTimelineItem>((item) => ({
      id: `risk:${item.id}`,
      kind: 'risk-event',
      title: item.title,
      detail: item.message,
      level: item.level,
      source: item.source,
      timestamp: item.createdAt,
    })),
    ...workflowRunItems.map<InvestigationTimelineItem>((item) => ({
      id: `workflow:${item.id}`,
      kind: 'workflow-run',
      title: item.workflowId,
      detail: String(item.error || item.metadata?.summary || item.status),
      level: item.status === 'failed' ? 'critical' : item.status === 'retry_scheduled' ? 'warn' : 'info',
      source: item.workflowType,
      timestamp: item.updatedAt || item.createdAt,
    })),
    ...executionLedgerItems.map<InvestigationTimelineItem>((item) => ({
      id: `execution:${item.plan.id}`,
      kind: 'execution-plan',
      title: item.plan.strategyName,
      detail: item.plan.summary,
      level: item.plan.riskStatus === 'blocked' ? 'critical' : item.plan.riskStatus === 'review' ? 'warn' : 'info',
      source: item.plan.mode,
      timestamp: item.plan.updatedAt || item.plan.createdAt,
    })),
  ]
    .sort((left, right) => Date.parse(right.timestamp || '') - Date.parse(left.timestamp || ''))
    .slice(0, 18);

  const investigationPathSummary = activeFocusTags.length
    ? activeFocusTags.join(' -> ')
    : (locale === 'zh' ? '当前处于默认总览路径，可从任一条时间线或状态卡开始钻取。' : 'You are on the default overview path. Drill in from any timeline entry or status card.');
  const incidentResponseChecklist = selectedIncident ? [
    {
      id: 'owner',
      label: locale === 'zh' ? '负责人已指派' : 'Owner assigned',
      done: Boolean(selectedIncident.owner),
      hint: selectedIncident.owner || (locale === 'zh' ? '还没有负责人' : 'No owner assigned yet'),
    },
    {
      id: 'ack',
      label: locale === 'zh' ? '已开始排查' : 'Investigation acknowledged',
      done: Boolean(selectedIncident.acknowledgedAt || selectedIncident.status !== 'open'),
      hint: selectedIncident.acknowledgedAt
        ? fmtDateTime(selectedIncident.acknowledgedAt, locale)
        : (locale === 'zh' ? '还没有确认时间' : 'No acknowledgement timestamp'),
    },
    {
      id: 'notes',
      label: locale === 'zh' ? '已有排查记录' : 'Notes captured',
      done: selectedIncidentNotes.length > 0,
      hint: selectedIncidentNotes.length
        ? `${selectedIncidentNotes.length} ${locale === 'zh' ? '条记录' : 'notes'}`
        : (locale === 'zh' ? '还没有排查记录' : 'No notes captured yet'),
    },
    {
      id: 'evidence',
      label: locale === 'zh' ? '已有关联证据' : 'Evidence linked',
      done: selectedIncidentEvidence.summary.total > 0,
      hint: selectedIncidentEvidence.summary.total
        ? `${selectedIncidentEvidence.summary.total} ${locale === 'zh' ? '条证据' : 'evidence items'}`
        : (locale === 'zh' ? '还没有聚合证据' : 'No evidence aggregated yet'),
    },
    {
      id: 'resolved',
      label: locale === 'zh' ? '已完成收尾' : 'Resolution complete',
      done: selectedIncident.status === 'resolved',
      hint: selectedIncident.resolvedAt
        ? fmtDateTime(selectedIncident.resolvedAt, locale)
        : (locale === 'zh' ? '还未标记为 resolved' : 'Not resolved yet'),
    },
  ] : [];

  function focusTimelineItem(item: InvestigationTimelineItem) {
    if (item.kind === 'incident') {
      applyIncidentFocus({
        incidentId: item.id.split(':').at(-1) || '',
        severity: item.level,
        source: item.source,
        timeWindow: '7d',
      });
      return;
    }
    if (item.kind === 'notification') {
      focusNotificationItem(item.source);
      return;
    }
    if (item.kind === 'audit') {
      focusAuditItem(item.source);
      return;
    }
    if (item.kind === 'operator-action') {
      focusOperatorActionItem(item.level);
      return;
    }
    if (item.kind === 'risk-event') {
      focusRiskEventItem(item.source === 'risk-monitor' ? 'risk-off' : 'healthy', item.level);
      return;
    }
    if (item.kind === 'workflow-run') {
      focusWorkflowRunItem(item.level === 'critical' ? 'failed' : item.level === 'warn' ? 'retry_scheduled' : 'running');
      return;
    }
    if (item.kind === 'execution-plan') {
      focusExecutionPlanItem(item.level === 'critical' ? 'blocked' : item.level === 'warn' ? 'review' : 'ready');
      return;
    }
    applyMonitoringFocus({
      source: item.source,
      level: item.level === 'info' ? 'all' : item.level,
      timeWindow: '24h',
    });
  }

  function focusIncidentEvidenceItem(item: NonNullable<typeof selectedIncidentEvidence>['timeline'][number]) {
    setSelectedArtifactKey(`${item.kind}:${item.id}`);
    if (item.kind === 'monitoring-alert') {
      applyMonitoringFocus({
        source: item.source,
        level: item.level === 'info' ? 'all' : item.level,
        snapshotId: String(item.metadata?.snapshotId || ''),
        timeWindow: '7d',
      });
      return;
    }
    if (item.kind === 'notification') {
      applyNotificationFocus({
        source: item.source,
        level: item.level === 'info' ? 'all' : item.level,
        timeWindow: '7d',
      });
      return;
    }
    if (item.kind === 'audit') {
      focusAuditItem(item.source);
      return;
    }
    if (item.kind === 'operator-action') {
      applyOperatorActionFocus({
        level: item.level === 'info' ? 'all' : item.level,
        timeWindow: '7d',
      });
      return;
    }
    if (item.kind === 'risk-event') {
      applyRiskFocus({
        level: item.level === 'info' ? 'all' : item.level,
        status: item.status,
      });
      return;
    }
    if (item.kind === 'workflow-run') {
      applyWorkflowFocus({
        status: item.status,
      });
      return;
    }
    if (item.kind === 'execution-plan') {
      applyExecutionFocus({
        status: item.status,
      });
      return;
    }
    applySchedulerFocus({
      phase: ['PRE_OPEN', 'INTRADAY', 'POST_CLOSE', 'OFF_HOURS'].includes(item.status) ? item.status : 'all',
      timeWindow: '7d',
    });
  }

  return (
    <>
      <SectionHeader routeKey="notifications" />
      <TopMeta items={[
        { label: locale === 'zh' ? '系统事件' : 'System Events', value: String(state.activityLog.length), accent: true },
        { label: copy[locale].terms.pendingApprovals, value: String(state.approvalQueue.length) },
        { label: locale === 'zh' ? '在线链路' : 'Connected Links', value: `${connectedCount}/2` },
        { label: locale === 'zh' ? '控制面状态' : 'Control Plane', value: state.controlPlane.lastStatus },
      ]} />

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '焦点路由' : 'Focus Router'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '当前筛选焦点会汇总在这里，方便随时重置或确认你正在排查哪一条链路。'
                  : 'Current investigation focus lives here so you can reset or confirm which path is active.'}
              </div>
            </div>
            <div className="panel-badge badge-info">{activeFocusTags.length}</div>
          </div>
          <div className="settings-chip-row">
            <button type="button" className="settings-chip" onClick={resetAllFocuses}>
              {locale === 'zh' ? '重置全部筛选' : 'Reset All Filters'}
            </button>
            {!activeFocusTags.length ? (
              <span className="empty-cell">{locale === 'zh' ? '当前没有额外焦点筛选' : 'No extra focus filters are active.'}</span>
            ) : null}
            {activeFocusTags.map((tag) => (
              <span key={tag} className="settings-chip active">{tag}</span>
            ))}
          </div>
          <div className="status-copy">{investigationPathSummary}</div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '排查时间线' : 'Investigation Timeline'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '把通知、审计、操作动作和监控告警按时间汇总到一条主线里，方便先看最近发生了什么。'
                  : 'Merge notifications, audits, operator actions, and monitoring alerts into one chronological investigation stream.'}
              </div>
            </div>
            <div className="panel-badge badge-info">{investigationTimeline.length}</div>
          </div>
          <div className="focus-list focus-list-terminal">
            {!investigationTimeline.length ? <div className="empty-cell">{locale === 'zh' ? '当前没有可用于排查的时间线事件' : 'No investigation timeline entries are available right now.'}</div> : null}
            {investigationTimeline.map((item) => (
              <button type="button" className="focus-row status-row-button" key={item.id} onClick={() => focusTimelineItem(item)}>
                <div className="symbol-cell">
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '类型' : 'Kind'}</span>
                  <strong>{translateTimelineKind(locale, item.kind)}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '级别' : 'Level'}</span>
                  <strong>{translateMonitoringStatus(locale, item.level)}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '来源' : 'Source'}</span>
                  <strong>{item.source}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '时间' : 'Time'}</span>
                  <strong>{fmtDateTime(item.timestamp, locale)}</strong>
                </div>
              </button>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '事件队列' : 'Incident Queue'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '把重要告警、通知或审计项升级成需要跟踪的 incident，并在这里统一查看状态。'
                  : 'Escalate important alerts, notifications, or audits into trackable incidents and review them here.'}
              </div>
            </div>
            <div className="panel-badge badge-warn">{incidentItems.length}</div>
          </div>
          <div className="settings-chip-row">
            {MONITORING_TIME_WINDOWS.map((window) => {
              const selected = incidentTimeWindow === window.key;
              const label = window.key === '1h'
                ? (locale === 'zh' ? '最近 1 小时' : 'Last 1h')
                : window.key === '24h'
                  ? (locale === 'zh' ? '最近 24 小时' : 'Last 24h')
                  : window.key === '7d'
                    ? (locale === 'zh' ? '最近 7 天' : 'Last 7d')
                    : (locale === 'zh' ? '全部时间' : 'All Time');
              return (
                <button
                  key={window.key}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setIncidentTimeWindow(window.key)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="settings-chip-row">
            {INCIDENT_STATUSES.map((status) => {
              const selected = incidentStatusFilter === status;
              const label = status === 'all'
                ? (locale === 'zh' ? '全部状态' : 'All Statuses')
                : translateMonitoringStatus(locale, status);
              return (
                <button
                  key={status}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setIncidentStatusFilter(status)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="settings-chip-row">
            {INCIDENT_SEVERITIES.map((severity) => {
              const selected = incidentSeverityFilter === severity;
              const label = severity === 'all'
                ? (locale === 'zh' ? '全部级别' : 'All Levels')
                : translateMonitoringStatus(locale, severity);
              return (
                <button
                  key={severity}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setIncidentSeverityFilter(severity)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="settings-chip-row">
            {INCIDENT_SOURCES.map((source) => {
              const selected = incidentSourceFilter === source;
              const label = source === 'all' ? (locale === 'zh' ? '全部来源' : 'All Sources') : source;
              return (
                <button
                  key={source}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setIncidentSourceFilter(source)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="focus-list focus-list-terminal">
            {incidentsLoading ? <div className="empty-cell">{locale === 'zh' ? '正在加载事件...' : 'Loading incidents...'}</div> : null}
            {!incidentsLoading && !incidentItems.length ? <div className="empty-cell">{locale === 'zh' ? '当前还没有升级为 incident 的事件' : 'No incidents have been opened yet.'}</div> : null}
            {!incidentsLoading ? incidentItems.map((item) => (
              <button
                type="button"
                className="focus-row status-row-button"
                key={item.id}
                onClick={() => applyIncidentFocus({
                  incidentId: selectedIncidentId === item.id ? '' : item.id,
                  severity: item.severity,
                  source: item.source,
                  status: item.status,
                  timeWindow: incidentTimeWindow,
                })}
              >
                <div className="symbol-cell">
                  <strong>{item.title}</strong>
                  <span>{item.summary || item.latestNotePreview || (locale === 'zh' ? '暂无摘要' : 'No summary')}</span>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '状态' : 'Status'}</span>
                  <strong>{translateMonitoringStatus(locale, item.status)}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '负责人' : 'Owner'}</span>
                  <strong>{item.owner || (locale === 'zh' ? '未指派' : 'Unassigned')}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '更新于' : 'Updated'}</span>
                  <strong>{fmtDateTime(item.updatedAt || item.createdAt, locale)}</strong>
                </div>
              </button>
            )) : null}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '事件详情' : 'Incident Detail'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '选中 incident 后，可以在这里改状态、指派负责人、补充排查记录。'
                  : 'Once an incident is selected, update its status, assign an owner, and add investigation notes here.'}
              </div>
            </div>
            <div className={`panel-badge ${selectedIncident ? 'badge-info' : 'muted'}`}>{selectedIncident ? selectedIncident.status : '--'}</div>
          </div>
          {!selectedIncidentId ? (
            <div className="empty-cell">{locale === 'zh' ? '从上方事件队列选择一条 incident，或在告警/通知/审计面板里直接升级创建。' : 'Select an incident from the queue above, or escalate one from the alert, notification, or audit panels below.'}</div>
          ) : null}
          {selectedIncidentId && incidentDetailLoading ? (
            <div className="empty-cell">{locale === 'zh' ? '正在加载事件详情...' : 'Loading incident detail...'}</div>
          ) : null}
          {selectedIncident ? (
            <>
              <div className="status-stack">
                <div className="status-row"><span>{locale === 'zh' ? '标题' : 'Title'}</span><strong>{selectedIncident.title}</strong></div>
                <div className="status-row"><span>{locale === 'zh' ? '来源' : 'Source'}</span><strong>{selectedIncident.source}</strong></div>
                <div className="status-row"><span>{locale === 'zh' ? '级别' : 'Severity'}</span><strong>{translateMonitoringStatus(locale, selectedIncident.severity)}</strong></div>
                <div className="status-row"><span>{locale === 'zh' ? '状态' : 'Status'}</span><strong>{translateMonitoringStatus(locale, selectedIncident.status)}</strong></div>
                <div className="status-row"><span>{locale === 'zh' ? '创建于' : 'Created'}</span><strong>{fmtDateTime(selectedIncident.createdAt, locale)}</strong></div>
                <div className="status-copy">{selectedIncident.summary || (locale === 'zh' ? '暂无摘要' : 'No summary')}</div>
              </div>
              <div className="settings-chip-row">
                <button type="button" className="settings-chip" disabled={incidentBusy} onClick={() => updateSelectedIncident({ status: 'investigating', actor: state.controlPlane.operator })}>
                  {locale === 'zh' ? '开始排查' : 'Start Investigating'}
                </button>
                <button type="button" className="settings-chip" disabled={incidentBusy} onClick={() => updateSelectedIncident({ status: 'mitigated', actor: state.controlPlane.operator })}>
                  {locale === 'zh' ? '已缓解' : 'Mark Mitigated'}
                </button>
                <button type="button" className="settings-chip" disabled={incidentBusy} onClick={() => updateSelectedIncident({ status: 'resolved', actor: state.controlPlane.operator })}>
                  {locale === 'zh' ? '已解决' : 'Resolve'}
                </button>
              </div>
              <label className="field-label" htmlFor="incident-owner-input">{locale === 'zh' ? '负责人' : 'Owner'}</label>
              <div className="settings-chip-row">
                <input
                  id="incident-owner-input"
                  className="text-input"
                  value={incidentOwnerDraft}
                  onChange={(event) => setIncidentOwnerDraft(event.target.value)}
                  placeholder={locale === 'zh' ? '输入负责人' : 'Assign owner'}
                />
                <button
                  type="button"
                  className="settings-chip"
                  disabled={incidentBusy || !incidentOwnerDraft.trim()}
                  onClick={() => updateSelectedIncident({ owner: incidentOwnerDraft.trim(), actor: state.controlPlane.operator })}
                >
                  {locale === 'zh' ? '保存负责人' : 'Save Owner'}
                </button>
              </div>
              <label className="field-label" htmlFor="incident-note-input">{locale === 'zh' ? '排查记录' : 'Investigation Note'}</label>
              <textarea
                id="incident-note-input"
                className="detail-textarea"
                rows={4}
                value={incidentNoteDraft}
                onChange={(event) => setIncidentNoteDraft(event.target.value)}
                placeholder={locale === 'zh' ? '记录当前判断、缓解动作或下一步计划' : 'Capture findings, mitigation steps, or next actions'}
              />
              <div className="settings-chip-row">
                <button type="button" className="settings-chip" disabled={incidentBusy || !incidentNoteDraft.trim()} onClick={appendSelectedIncidentNote}>
                  {locale === 'zh' ? '追加记录' : 'Append Note'}
                </button>
                <button type="button" className="settings-chip" disabled={incidentBusy} onClick={() => setIncidentNoteDraft('')}>
                  {locale === 'zh' ? '清空草稿' : 'Clear Draft'}
                </button>
              </div>
              <div className="metrics-grid metrics-grid-compact">
                <div className="metric-card">
                  <span>{locale === 'zh' ? '活动记录' : 'Activity'}</span>
                  <strong>{selectedIncidentActivity.summary.total}</strong>
                </div>
                <div className="metric-card">
                  <span>{locale === 'zh' ? '最后活动' : 'Latest Activity'}</span>
                  <strong>{selectedIncidentActivity.summary.latestAt ? fmtDateTime(selectedIncidentActivity.summary.latestAt, locale) : '--'}</strong>
                </div>
                <div className="metric-card">
                  <span>{locale === 'zh' ? '关联证据' : 'Evidence'}</span>
                  <strong>{selectedIncidentEvidence.summary.total}</strong>
                </div>
                <div className="metric-card">
                  <span>{locale === 'zh' ? '直接链接' : 'Direct Links'}</span>
                  <strong>{selectedIncidentEvidence.summary.linked}</strong>
                </div>
                <div className="metric-card">
                  <span>{locale === 'zh' ? '监控告警' : 'Monitoring'}</span>
                  <strong>{selectedIncidentEvidence.summary.monitoringAlerts}</strong>
                </div>
                <div className="metric-card">
                  <span>{locale === 'zh' ? '控制面通知' : 'Notifications'}</span>
                  <strong>{selectedIncidentEvidence.summary.notifications}</strong>
                </div>
                <div className="metric-card">
                  <span>{locale === 'zh' ? '审计 / 动作 / 调度' : 'Audit / Action / Scheduler'}</span>
                  <strong>{selectedIncidentEvidence.summary.audits + selectedIncidentEvidence.summary.operatorActions + selectedIncidentEvidence.summary.schedulerTicks}</strong>
                </div>
                <div className="metric-card">
                  <span>{locale === 'zh' ? '风控 / 工作流 / 执行' : 'Risk / Workflow / Execution'}</span>
                  <strong>{selectedIncidentEvidence.summary.riskEvents + selectedIncidentEvidence.summary.workflowRuns + selectedIncidentEvidence.summary.executionPlans}</strong>
                </div>
              </div>
              <div className="panel-subtitle">{locale === 'zh' ? '响应检查单' : 'Response Checklist'}</div>
              <div className="focus-list focus-list-terminal">
                {incidentResponseChecklist.map((item) => (
                  <div className="focus-row" key={item.id}>
                    <div className="symbol-cell">
                      <strong>{item.label}</strong>
                      <span>{item.hint}</span>
                    </div>
                    <div className="focus-metric">
                      <span>{locale === 'zh' ? '状态' : 'State'}</span>
                      <strong>{item.done ? (locale === 'zh' ? '已完成' : 'Done') : (locale === 'zh' ? '待处理' : 'Pending')}</strong>
                    </div>
                  </div>
                ))}
              </div>
              <div className="panel-subtitle">{locale === 'zh' ? '关联证据时间线' : 'Related Evidence Timeline'}</div>
              <div className="focus-list focus-list-terminal">
                {!selectedIncidentEvidence.timeline.length ? <div className="empty-cell">{locale === 'zh' ? '当前还没有自动聚合到关联证据' : 'No related evidence has been aggregated yet.'}</div> : null}
                {selectedIncidentEvidence.timeline.map((item) => (
                  <button type="button" className="focus-row focus-row-wide status-row-button" key={`${item.kind}:${item.id}`} onClick={() => focusIncidentEvidenceItem(item)}>
                    <div className="symbol-cell">
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                    </div>
                    <div className="focus-metric">
                      <span>{locale === 'zh' ? '类型' : 'Kind'}</span>
                      <strong>{translateEvidenceKind(locale, item.kind)}</strong>
                    </div>
                    <div className="focus-metric">
                      <span>{locale === 'zh' ? '来源' : 'Source'}</span>
                      <strong>{item.source}</strong>
                    </div>
                    <div className="focus-metric">
                      <span>{locale === 'zh' ? '关联' : 'Link'}</span>
                      <strong>{item.linked ? (locale === 'zh' ? '直接' : 'Direct') : (locale === 'zh' ? '推断' : 'Inferred')}</strong>
                    </div>
                    <div className="focus-metric">
                      <span>{locale === 'zh' ? '时间' : 'Time'}</span>
                      <strong>{fmtDateTime(item.timestamp, locale)}</strong>
                    </div>
                  </button>
                ))}
              </div>
              <div className="panel-subtitle">{locale === 'zh' ? '排查记录' : 'Investigation Notes'}</div>
              <div className="focus-list focus-list-terminal">
                {!selectedIncidentNotes.length ? <div className="empty-cell">{locale === 'zh' ? '这条 incident 还没有追加记录' : 'This incident does not have investigation notes yet.'}</div> : null}
                {selectedIncidentNotes.map((note) => (
                  <div className="focus-row" key={note.id}>
                    <div className="symbol-cell">
                      <strong>{note.author}</strong>
                      <span>{note.body}</span>
                    </div>
                    <div className="focus-metric">
                      <span>{locale === 'zh' ? '时间' : 'Time'}</span>
                      <strong>{fmtDateTime(note.createdAt, locale)}</strong>
                    </div>
                  </div>
                ))}
              </div>
              <div className="panel-subtitle">{locale === 'zh' ? '处置活动流' : 'Response Activity'}</div>
              <div className="metrics-grid metrics-grid-compact">
                <div className="metric-card">
                  <span>{locale === 'zh' ? '状态变更' : 'Status Changes'}</span>
                  <strong>{selectedIncidentActivity.summary.statusChanges}</strong>
                </div>
                <div className="metric-card">
                  <span>{locale === 'zh' ? '负责人变更' : 'Owner Changes'}</span>
                  <strong>{selectedIncidentActivity.summary.ownerChanges}</strong>
                </div>
                <div className="metric-card">
                  <span>{locale === 'zh' ? '级别变更' : 'Severity Changes'}</span>
                  <strong>{selectedIncidentActivity.summary.severityChanges}</strong>
                </div>
                <div className="metric-card">
                  <span>{locale === 'zh' ? '追加记录' : 'Note Updates'}</span>
                  <strong>{selectedIncidentActivity.summary.notes}</strong>
                </div>
              </div>
              <div className="focus-list focus-list-terminal">
                {!selectedIncidentActivity.timeline.length ? <div className="empty-cell">{locale === 'zh' ? '这条 incident 还没有活动流记录' : 'No response activity has been recorded for this incident yet.'}</div> : null}
                {selectedIncidentActivity.timeline.map((item) => (
                  <button type="button" className="focus-row focus-row-wide status-row-button" key={item.id} onClick={() => focusIncidentActivityItem(item)}>
                    <div className="symbol-cell">
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                    </div>
                    <div className="focus-metric">
                      <span>{locale === 'zh' ? '类型' : 'Kind'}</span>
                      <strong>{translateIncidentActivityKind(locale, item.kind)}</strong>
                    </div>
                    <div className="focus-metric">
                      <span>{locale === 'zh' ? '执行人' : 'Actor'}</span>
                      <strong>{item.actor}</strong>
                    </div>
                    <div className="focus-metric">
                      <span>{locale === 'zh' ? '时间' : 'Time'}</span>
                      <strong>{fmtDateTime(item.createdAt, locale)}</strong>
                    </div>
                  </button>
                ))}
              </div>
              {selectedActivity ? (
                <div className="settings-chip-row">
                  <button
                    type="button"
                    className="settings-chip"
                    disabled={incidentBusy}
                    onClick={() => setIncidentNoteDraft((draft) => {
                      const next = buildActivityDraft(locale, selectedActivity);
                      return draft ? `${draft}\n\n${next}` : next;
                    })}
                  >
                    {locale === 'zh' ? '引用活动到草稿' : 'Append Activity To Draft'}
                  </button>
                  <button
                    type="button"
                    className="settings-chip"
                    disabled={incidentBusy}
                    onClick={() => setIncidentNoteDraft(buildActivityDraft(locale, selectedActivity))}
                  >
                    {locale === 'zh' ? '用活动覆盖草稿' : 'Replace Draft With Activity'}
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '对象检查器' : 'Artifact Inspector'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '针对当前选中的关联证据，直接预览 workflow、execution plan、risk event 或运行态细节。'
                  : 'Preview workflow, execution plan, risk event, or runtime detail for the currently selected evidence item.'}
              </div>
            </div>
            <div className={`panel-badge ${selectedArtifact ? 'badge-info' : 'muted'}`}>{selectedArtifact ? translateEvidenceKind(locale, selectedArtifact.kind) : '--'}</div>
          </div>
          {!selectedArtifact ? (
            <div className="empty-cell">{locale === 'zh' ? '先在上面的关联证据时间线里选择一条证据。' : 'Select an evidence item from the related evidence timeline above first.'}</div>
          ) : null}
          {selectedArtifact && artifactInspector.loading ? (
            <div className="empty-cell">{locale === 'zh' ? '正在加载对象详情...' : 'Loading artifact detail...'}</div>
          ) : null}
          {selectedArtifact ? (
            <>
              <div className="status-stack">
                <div className="status-row"><span>{locale === 'zh' ? '证据标题' : 'Evidence'}</span><strong>{selectedArtifact.title}</strong></div>
                <div className="status-row"><span>{locale === 'zh' ? '类型' : 'Kind'}</span><strong>{translateEvidenceKind(locale, selectedArtifact.kind)}</strong></div>
                <div className="status-row"><span>{locale === 'zh' ? '来源' : 'Source'}</span><strong>{selectedArtifact.source}</strong></div>
                <div className="status-row"><span>{locale === 'zh' ? '时间' : 'Time'}</span><strong>{fmtDateTime(selectedArtifact.timestamp, locale)}</strong></div>
                <div className="status-copy">{selectedArtifact.detail}</div>
              </div>
              {(selectedArtifact.kind === 'workflow-run' || artifactInspector.workflow) ? (
                <>
                  <div className="panel-subtitle">{locale === 'zh' ? '工作流详情' : 'Workflow Detail'}</div>
                  <div className="metrics-grid metrics-grid-compact">
                    <div className="metric-card">
                      <span>{locale === 'zh' ? '状态' : 'Status'}</span>
                      <strong>{artifactInspector.workflow?.status || '--'}</strong>
                    </div>
                    <div className="metric-card">
                      <span>{locale === 'zh' ? '尝试次数' : 'Attempts'}</span>
                      <strong>{artifactInspector.workflow ? `${artifactInspector.workflow.attempt}/${artifactInspector.workflow.maxAttempts}` : '--'}</strong>
                    </div>
                    <div className="metric-card">
                      <span>{locale === 'zh' ? '触发' : 'Trigger'}</span>
                      <strong>{artifactInspector.workflow?.trigger || '--'}</strong>
                    </div>
                    <div className="metric-card">
                      <span>{locale === 'zh' ? '执行人' : 'Actor'}</span>
                      <strong>{artifactInspector.workflow?.actor || '--'}</strong>
                    </div>
                  </div>
                  <div className="focus-list focus-list-terminal">
                    {artifactInspector.workflow?.steps?.map((step) => (
                      <div className="focus-row" key={step.key}>
                        <div className="symbol-cell">
                          <strong>{step.key}</strong>
                          <span>{locale === 'zh' ? '工作流步骤' : 'Workflow step'}</span>
                        </div>
                        <div className="focus-metric">
                          <span>{locale === 'zh' ? '状态' : 'Status'}</span>
                          <strong>{step.status}</strong>
                        </div>
                      </div>
                    ))}
                    {!artifactInspector.workflow?.steps?.length ? <div className="empty-cell">{locale === 'zh' ? '当前没有步骤详情。' : 'No workflow steps are available.'}</div> : null}
                  </div>
                  {(artifactInspector.workflow?.payload || artifactInspector.workflow?.result || artifactInspector.workflow?.error) ? (
                    <>
                      <div className="panel-subtitle">{locale === 'zh' ? '工作流上下文' : 'Workflow Context'}</div>
                      {artifactInspector.workflow?.payload ? (
                        <>
                          <div className="field-label">{locale === 'zh' ? '输入载荷' : 'Payload'}</div>
                          <pre className="inspection-json">{JSON.stringify(artifactInspector.workflow.payload, null, 2)}</pre>
                        </>
                      ) : null}
                      {artifactInspector.workflow?.result ? (
                        <>
                          <div className="field-label">{locale === 'zh' ? '执行结果' : 'Result'}</div>
                          <pre className="inspection-json">{JSON.stringify(artifactInspector.workflow.result, null, 2)}</pre>
                        </>
                      ) : null}
                      {artifactInspector.workflow?.error ? (
                        <>
                          <div className="field-label">{locale === 'zh' ? '错误信息' : 'Error'}</div>
                          <pre className="inspection-json">{JSON.stringify(artifactInspector.workflow.error, null, 2)}</pre>
                        </>
                      ) : null}
                    </>
                  ) : null}
                </>
              ) : null}
              {(selectedArtifact.kind === 'execution-plan' || artifactInspector.executionPlan) ? (
                <>
                  <div className="panel-subtitle">{locale === 'zh' ? '执行计划详情' : 'Execution Plan Detail'}</div>
                  <div className="metrics-grid metrics-grid-compact">
                    <div className="metric-card">
                      <span>{locale === 'zh' ? '模式' : 'Mode'}</span>
                      <strong>{artifactInspector.executionPlan?.mode || '--'}</strong>
                    </div>
                    <div className="metric-card">
                      <span>{locale === 'zh' ? '状态' : 'Plan Status'}</span>
                      <strong>{artifactInspector.executionPlan?.status || '--'}</strong>
                    </div>
                    <div className="metric-card">
                      <span>{locale === 'zh' ? '风控' : 'Risk'}</span>
                      <strong>{artifactInspector.executionPlan?.riskStatus || '--'}</strong>
                    </div>
                    <div className="metric-card">
                      <span>{locale === 'zh' ? '订单数' : 'Orders'}</span>
                      <strong>{artifactInspector.executionPlan?.orderCount ?? '--'}</strong>
                    </div>
                  </div>
                  <div className="focus-list focus-list-terminal">
                    {artifactInspector.executionPlan?.orders?.map((order, index) => (
                      <div className="focus-row" key={`${order.symbol}-${index}`}>
                        <div className="symbol-cell">
                          <strong>{order.symbol}</strong>
                          <span>{order.rationale}</span>
                        </div>
                        <div className="focus-metric">
                          <span>{locale === 'zh' ? '方向' : 'Side'}</span>
                          <strong>{order.side}</strong>
                        </div>
                        <div className="focus-metric">
                          <span>{locale === 'zh' ? '数量' : 'Qty'}</span>
                          <strong>{order.qty}</strong>
                        </div>
                        <div className="focus-metric">
                          <span>{locale === 'zh' ? '权重' : 'Weight'}</span>
                          <strong>{order.weight}</strong>
                        </div>
                      </div>
                    ))}
                    {!artifactInspector.executionPlan?.orders?.length ? <div className="empty-cell">{locale === 'zh' ? '当前没有订单明细。' : 'No execution orders are available.'}</div> : null}
                  </div>
                  {artifactInspector.latestRuntime ? (
                    <div className="status-copy">
                      {locale === 'zh'
                        ? `最近执行: cycle ${artifactInspector.latestRuntime.cycle}，submitted ${artifactInspector.latestRuntime.submittedOrderCount}，equity ${artifactInspector.latestRuntime.equity}`
                        : `Latest runtime: cycle ${artifactInspector.latestRuntime.cycle}, submitted ${artifactInspector.latestRuntime.submittedOrderCount}, equity ${artifactInspector.latestRuntime.equity}`}
                    </div>
                  ) : null}
                  {artifactInspector.executionPlan?.metadata ? (
                    <>
                      <div className="field-label">{locale === 'zh' ? '计划元数据' : 'Plan Metadata'}</div>
                      <pre className="inspection-json">{JSON.stringify(artifactInspector.executionPlan.metadata, null, 2)}</pre>
                    </>
                  ) : null}
                </>
              ) : null}
              {(selectedArtifact.kind === 'risk-event' || artifactInspector.riskEvent) ? (
                <>
                  <div className="panel-subtitle">{locale === 'zh' ? '风控事件详情' : 'Risk Event Detail'}</div>
                  <div className="metrics-grid metrics-grid-compact">
                    <div className="metric-card">
                      <span>{locale === 'zh' ? '状态' : 'Status'}</span>
                      <strong>{artifactInspector.riskEvent?.status || selectedArtifact.status || '--'}</strong>
                    </div>
                    <div className="metric-card">
                      <span>{locale === 'zh' ? '级别' : 'Level'}</span>
                      <strong>{artifactInspector.riskEvent?.level || selectedArtifact.level || '--'}</strong>
                    </div>
                    <div className="metric-card">
                      <span>{locale === 'zh' ? '风险级别' : 'Risk Level'}</span>
                      <strong>{artifactInspector.riskEvent?.riskLevel || String(selectedArtifact.metadata?.riskLevel || '--')}</strong>
                    </div>
                    <div className="metric-card">
                      <span>{locale === 'zh' ? '周期' : 'Cycle'}</span>
                      <strong>{String(artifactInspector.riskEvent?.cycle ?? selectedArtifact.metadata?.cycle ?? '--')}</strong>
                    </div>
                  </div>
                  <div className="status-copy">{artifactInspector.riskEvent?.message || selectedArtifact.detail}</div>
                </>
              ) : null}
              {getMetadataEntries(selectedArtifact.metadata).length ? (
                <>
                  <div className="panel-subtitle">{locale === 'zh' ? '关键元数据' : 'Key Metadata'}</div>
                  <div className="focus-list focus-list-terminal">
                    {getMetadataEntries(selectedArtifact.metadata).map((entry) => (
                      <div className="focus-row" key={entry.key}>
                        <div className="symbol-cell">
                          <strong>{entry.key}</strong>
                          <span>{entry.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
              <div className="panel-subtitle">{locale === 'zh' ? '原始元数据' : 'Raw Metadata'}</div>
              <pre className="inspection-json">{JSON.stringify(selectedArtifact.metadata || {}, null, 2)}</pre>
              <div className="settings-chip-row">
                <button
                  type="button"
                  className="settings-chip"
                  onClick={() => setIncidentNoteDraft((current) => {
                    const prefix = current.trim() ? `${current.trim()}\n\n` : '';
                    return `${prefix}${buildArtifactDraft(locale, selectedArtifact)}`;
                  })}
                >
                  {locale === 'zh' ? '写入排查草稿' : 'Append To Note Draft'}
                </button>
                <button
                  type="button"
                  className="settings-chip"
                  disabled={incidentBusy}
                  onClick={() => updateSelectedIncident({ status: 'investigating', actor: state.controlPlane.operator })}
                >
                  {locale === 'zh' ? '据此开始排查' : 'Investigate From Artifact'}
                </button>
                <button
                  type="button"
                  className="settings-chip"
                  disabled={incidentBusy}
                  onClick={() => updateSelectedIncident({ status: selectedArtifact.level === 'critical' ? 'mitigated' : 'resolved', actor: state.controlPlane.operator })}
                >
                  {locale === 'zh' ? '据此推进处置' : 'Advance Resolution'}
                </button>
              </div>
            </>
          ) : null}
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '通知流' : 'Notification Stream'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '统一查看执行事件、风险拦截、审批动作和系统提示。'
                  : 'Review execution events, risk blocks, approval actions, and system notices in one stream.'}
              </div>
            </div>
            <div className="panel-badge badge-info">EVENTS</div>
          </div>
          <ActivityLog />
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '运行态摘要' : 'Monitoring Summary'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '把 worker、workflow、风险和队列积压收敛成一个控制面健康摘要。'
                  : 'Collapse worker, workflow, risk, and queue backlog into one control-plane health summary.'}
              </div>
            </div>
            <div className={`panel-badge tone-${monitoringTone(monitoringStatus?.status)}`}>{monitoringLoading ? '...' : translateMonitoringStatus(locale, monitoringStatus?.status)}</div>
          </div>
          <div className="status-stack">
            <div className="status-row"><span>{locale === 'zh' ? '系统健康' : 'System health'}</span><strong>{monitoringLoading ? (locale === 'zh' ? '加载中' : 'Loading') : translateMonitoringStatus(locale, monitoringStatus?.status)}</strong></div>
            <button type="button" className="status-row status-row-button" onClick={() => applyMonitoringFocus({ source: 'worker', timeWindow: '24h' })}><span>{locale === 'zh' ? 'Worker 心跳' : 'Worker heartbeat'}</span><strong>{workerHeartbeatLag === null || workerHeartbeatLag === undefined ? '--' : `${workerHeartbeatLag}s`}</strong></button>
            <button type="button" className="status-row status-row-button" onClick={() => applyMonitoringFocus({ source: 'workflow', timeWindow: '24h' })}><span>{locale === 'zh' ? 'Workflow 积压' : 'Workflow backlog'}</span><strong>{monitoringWorkflowBacklog}</strong></button>
            <button type="button" className="status-row status-row-button" onClick={() => applyMonitoringFocus({ source: 'queue', timeWindow: '24h' })}><span>{locale === 'zh' ? '待处理队列' : 'Pending queues'}</span><strong>{monitoringQueueBacklog}</strong></button>
            <button type="button" className="status-row status-row-button" onClick={() => applyMonitoringFocus({ source: 'risk', level: 'critical', timeWindow: '24h' })}><span>{locale === 'zh' ? '风险阻断' : 'Risk-off events'}</span><strong>{monitoringStatus?.services.risk.riskOff || 0}</strong></button>
            <button type="button" className="status-row status-row-button" onClick={() => applyMonitoringFocus({ source: 'queue', level: 'warn', timeWindow: '24h' })}><span>{locale === 'zh' ? '人工复核' : 'Manual reviews'}</span><strong>{monitoringStatus?.services.queues.pendingAgentReviews || 0}</strong></button>
            <div className="status-copy">{monitoringStatus?.services.worker.message || (locale === 'zh' ? '监控摘要尚未返回。' : 'Monitoring summary has not returned yet.')}</div>
            <div className="status-copy">{monitoringStatus?.generatedAt ? `${locale === 'zh' ? '摘要时间' : 'Summary time'}: ${fmtDateTime(monitoringStatus.generatedAt, locale)}` : ''}</div>
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '监控告警' : 'Monitoring Alerts'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '直接查看 Monitoring 模块聚合出的当前告警来源和原因，并按快照、来源或级别快速聚焦。'
                  : 'Inspect monitoring alerts and quickly focus by snapshot, source, or severity.'}
              </div>
            </div>
            <div className="panel-badge badge-warn">{monitoringAlertItems.length}</div>
          </div>
          <div className="settings-chip-row">
            {MONITORING_TIME_WINDOWS.map((window) => {
              const selected = monitoringTimeWindow === window.key;
              const label = window.key === '1h'
                ? (locale === 'zh' ? '最近 1 小时' : 'Last 1h')
                : window.key === '24h'
                  ? (locale === 'zh' ? '最近 24 小时' : 'Last 24h')
                  : window.key === '7d'
                    ? (locale === 'zh' ? '最近 7 天' : 'Last 7d')
                    : (locale === 'zh' ? '全部时间' : 'All Time');
              return (
                <button
                  key={window.key}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setMonitoringTimeWindow(window.key)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="settings-chip-row">
            <button
              type="button"
              className={`settings-chip${selectedMonitoringSnapshotId ? ' active' : ''}`}
              onClick={() => setSelectedMonitoringSnapshotId('')}
            >
              {selectedMonitoringSnapshot
                ? (locale === 'zh'
                  ? `快照 ${fmtDateTime(selectedMonitoringSnapshot.generatedAt || selectedMonitoringSnapshot.createdAt, locale)}`
                  : `Snapshot ${fmtDateTime(selectedMonitoringSnapshot.generatedAt || selectedMonitoringSnapshot.createdAt, locale)}`)
                : (locale === 'zh' ? '全部快照' : 'All Snapshots')}
            </button>
          </div>
          <div className="settings-chip-row">
            {MONITORING_SOURCES.map((source) => {
              const selected = monitoringSourceFilter === source;
              const label = source === 'all' ? (locale === 'zh' ? '全部来源' : 'All Sources') : source;
              return (
                <button
                  key={source}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setMonitoringSourceFilter(source)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="settings-chip-row">
            {MONITORING_LEVELS.map((level) => {
              const selected = monitoringLevelFilter === level;
              const label = level === 'all' ? (locale === 'zh' ? '全部级别' : 'All Levels') : translateMonitoringStatus(locale, level);
              return (
                <button
                  key={level}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setMonitoringLevelFilter(level)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="focus-list focus-list-terminal">
            {monitoringAlertsLoading ? <div className="empty-cell">{locale === 'zh' ? '正在加载监控告警...' : 'Loading monitoring alerts...'}</div> : null}
            {!monitoringAlertsLoading && !monitoringAlertItems.length ? <div className="empty-cell">{locale === 'zh' ? '当前筛选条件下没有监控告警' : 'No monitoring alerts match the current filters.'}</div> : null}
            {!monitoringAlertsLoading ? monitoringAlertItems.map((item) => (
              <div className="focus-row" key={item.id}>
                <div className="symbol-cell">
                  <strong>{item.source}</strong>
                  <span>{item.message}</span>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '级别' : 'Level'}</span>
                  <strong>{translateMonitoringStatus(locale, item.level)}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '时间' : 'Time'}</span>
                  <strong>{fmtDateTime(item.createdAt, locale)}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '处置' : 'Action'}</span>
                  <button type="button" className="settings-chip" disabled={incidentBusy} onClick={() => createMonitoringIncident(item)}>
                    {locale === 'zh' ? '升级事件' : 'Open Incident'}
                  </button>
                </div>
              </div>
            )) : null}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '监控快照' : 'Monitoring Snapshots'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '查看最近几次 monitoring snapshot 的状态演进、告警数量和采样时间。'
                  : 'Review recent monitoring snapshots to track status changes, alert count, and sampling time.'}
              </div>
            </div>
            <div className="panel-badge badge-info">{monitoringSnapshotItems.length}</div>
          </div>
          <div className="settings-chip-row">
            {MONITORING_TIME_WINDOWS.map((window) => {
              const selected = monitoringTimeWindow === window.key;
              const label = window.key === '1h'
                ? (locale === 'zh' ? '最近 1 小时' : 'Last 1h')
                : window.key === '24h'
                  ? (locale === 'zh' ? '最近 24 小时' : 'Last 24h')
                  : window.key === '7d'
                    ? (locale === 'zh' ? '最近 7 天' : 'Last 7d')
                    : (locale === 'zh' ? '全部时间' : 'All Time');
              return (
                <button
                  key={window.key}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setMonitoringTimeWindow(window.key)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="settings-chip-row">
            {MONITORING_SNAPSHOT_STATUSES.map((status) => {
              const selected = monitoringSnapshotStatusFilter === status;
              const label = status === 'all' ? (locale === 'zh' ? '全部状态' : 'All Statuses') : translateMonitoringStatus(locale, status);
              return (
                <button
                  key={status}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setMonitoringSnapshotStatusFilter(status)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="focus-list focus-list-terminal">
            {monitoringSnapshotsLoading ? <div className="empty-cell">{locale === 'zh' ? '正在加载监控快照...' : 'Loading monitoring snapshots...'}</div> : null}
            {!monitoringSnapshotsLoading && !monitoringSnapshotItems.length ? <div className="empty-cell">{locale === 'zh' ? '当前筛选条件下没有监控快照' : 'No monitoring snapshots match the current filters.'}</div> : null}
            {!monitoringSnapshotsLoading ? monitoringSnapshotItems.map((item) => (
              <button
                type="button"
                className="focus-row status-row-button"
                key={item.id}
                onClick={() => setSelectedMonitoringSnapshotId((current) => (current === item.id ? '' : item.id))}
              >
                <div className="symbol-cell">
                  <strong>{translateMonitoringStatus(locale, item.status)}</strong>
                  <span>
                    {selectedMonitoringSnapshotId === item.id
                      ? (locale === 'zh' ? `已选中 · 告警 ${item.alertCount} 条` : `Selected · ${item.alertCount} alerts`)
                      : (locale === 'zh' ? `告警 ${item.alertCount} 条` : `${item.alertCount} alerts`)}
                  </span>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '采样时间' : 'Captured'}</span>
                  <strong>{fmtDateTime(item.generatedAt || item.createdAt, locale)}</strong>
                </div>
              </button>
            )) : null}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '操作动作流' : 'Operator Actions'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '查看批准、拒绝、撤单等操作员动作的后端记录。'
                  : 'Review backend-recorded operator actions such as approvals, rejections, and cancellations.'}
              </div>
            </div>
            <div className="panel-badge badge-info">{actionItems.length}</div>
          </div>
          <div className="settings-chip-row">
            {MONITORING_TIME_WINDOWS.map((window) => {
              const selected = operatorActionTimeWindow === window.key;
              const label = window.key === '1h'
                ? (locale === 'zh' ? '最近 1 小时' : 'Last 1h')
                : window.key === '24h'
                  ? (locale === 'zh' ? '最近 24 小时' : 'Last 24h')
                  : window.key === '7d'
                    ? (locale === 'zh' ? '最近 7 天' : 'Last 7d')
                    : (locale === 'zh' ? '全部时间' : 'All Time');
              return (
                <button
                  key={window.key}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setOperatorActionTimeWindow(window.key)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="settings-chip-row">
            {OPERATOR_ACTION_LEVELS.map((level) => {
              const selected = operatorActionLevelFilter === level;
              const label = level === 'all' ? (locale === 'zh' ? '全部级别' : 'All Levels') : translateMonitoringStatus(locale, level);
              return (
                <button
                  key={level}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setOperatorActionLevelFilter(level)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="focus-list focus-list-terminal">
            {actionLoading ? <div className="empty-cell">{locale === 'zh' ? '正在加载操作动作...' : 'Loading operator actions...'}</div> : null}
            {!actionLoading && !actionItems.length ? <div className="empty-cell">{locale === 'zh' ? '暂无操作动作' : 'No operator actions yet.'}</div> : null}
            {!actionLoading ? actionItems.map((item) => (
              <div className="focus-row" key={item.id}>
                <button type="button" className="focus-main-button" onClick={() => focusOperatorActionItem(item.level)}>
                  <div className="symbol-cell">
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </div>
                </button>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '执行人' : 'Actor'}</span>
                  <strong>{item.actor}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '级别' : 'Level'}</span>
                  <strong>{translateMonitoringStatus(locale, item.level)}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '处置' : 'Action'}</span>
                  <button
                    type="button"
                    className="settings-chip"
                    disabled={incidentBusy}
                    onClick={() => void createOperatorActionIncident(item)}
                  >
                    {locale === 'zh' ? '升级事件' : 'Open Incident'}
                  </button>
                </div>
              </div>
            )) : null}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '控制面通知' : 'Control Plane Notifications'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '来自后端任务编排、审计和告警模块的事件流。'
                  : 'Events emitted by backend task orchestration, audit, and alert modules.'}
              </div>
            </div>
            <div className="panel-badge badge-warn">{items.length}</div>
          </div>
          <div className="settings-chip-row">
            {MONITORING_TIME_WINDOWS.map((window) => {
              const selected = notificationTimeWindow === window.key;
              const label = window.key === '1h'
                ? (locale === 'zh' ? '最近 1 小时' : 'Last 1h')
                : window.key === '24h'
                  ? (locale === 'zh' ? '最近 24 小时' : 'Last 24h')
                  : window.key === '7d'
                    ? (locale === 'zh' ? '最近 7 天' : 'Last 7d')
                    : (locale === 'zh' ? '全部时间' : 'All Time');
              return (
                <button
                  key={window.key}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setNotificationTimeWindow(window.key)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="settings-chip-row">
            {NOTIFICATION_LEVELS.map((level) => {
              const selected = notificationLevelFilter === level;
              const label = level === 'all' ? (locale === 'zh' ? '全部级别' : 'All Levels') : translateMonitoringStatus(locale, level);
              return (
                <button
                  key={level}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setNotificationLevelFilter(level)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="settings-chip-row">
            {NOTIFICATION_SOURCES.map((source) => {
              const selected = notificationSourceFilter === source;
              const label = source === 'all' ? (locale === 'zh' ? '全部来源' : 'All Sources') : source;
              return (
                <button
                  key={source}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setNotificationSourceFilter(source)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="focus-list focus-list-terminal">
            {loading ? <div className="empty-cell">{locale === 'zh' ? '正在加载通知...' : 'Loading notifications...'}</div> : null}
            {!loading && !items.length ? <div className="empty-cell">{locale === 'zh' ? '暂无控制面通知' : 'No control-plane notifications yet.'}</div> : null}
            {!loading ? items.map((item) => (
              <div className="focus-row" key={item.id}>
                <button type="button" className="focus-main-button" onClick={() => focusNotificationItem(item.source)}>
                  <div className="symbol-cell">
                    <strong>{item.title}</strong>
                    <span>{item.message}</span>
                  </div>
                </button>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '来源' : 'Source'}</span>
                  <strong>{item.source}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '时间' : 'Time'}</span>
                  <strong>{fmtDateTime(item.createdAt, locale)}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '处置' : 'Action'}</span>
                  <button
                    type="button"
                    className="settings-chip"
                    disabled={incidentBusy}
                    onClick={() => void createNotificationIncident(item)}
                  >
                    {locale === 'zh' ? '升级事件' : 'Open Incident'}
                  </button>
                </div>
              </div>
            )) : null}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '控制面裁决' : 'Control Plane Resolution'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '这里展示后端对当前周期的最终控制面判断。'
                  : 'This summarizes the backend control-plane decision for the current cycle.'}
              </div>
            </div>
            <div className="panel-badge badge-info">{state.controlPlane.notificationCount}</div>
          </div>
          <div className="settings-chip-row">
            <button type="button" className="settings-chip" onClick={() => applyNotificationFocus({ timeWindow: '24h' })}>
              {locale === 'zh' ? '查看通知' : 'Open Notifications'}
            </button>
            <button type="button" className="settings-chip" onClick={() => applyAuditFocus({ timeWindow: '24h' })}>
              {locale === 'zh' ? '查看审计' : 'Open Audit Trail'}
            </button>
            <button type="button" className="settings-chip" onClick={() => applyAuditFocus({ type: 'workflow', timeWindow: '24h' })}>
              {locale === 'zh' ? '工作流审计' : 'Workflow Audits'}
            </button>
          </div>
          <div className="status-stack">
            <div className="status-row"><span>{locale === 'zh' ? '操作员' : 'Operator'}</span><strong>{state.controlPlane.operator}</strong></div>
            <button type="button" className="status-row status-row-button" onClick={() => applyNotificationFocus({ source: 'control-plane', timeWindow: '24h' })}><span>{locale === 'zh' ? '状态' : 'Status'}</span><strong>{state.controlPlane.lastStatus}</strong></button>
            <button type="button" className="status-row status-row-button" onClick={() => applyAuditFocus({ timeWindow: '24h' })}><span>{locale === 'zh' ? '审计记录' : 'Audit Records'}</span><strong>{state.controlPlane.auditCount}</strong></button>
            <div className="status-copy">{state.controlPlane.routeHint}</div>
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '审计记录' : 'Audit Records'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '查看关键控制面操作和工作流落下的审计轨迹。'
                  : 'Review audit trails for key control-plane actions and workflow changes.'}
              </div>
            </div>
            <div className="panel-badge badge-info">{auditItems.length}</div>
          </div>
          <div className="settings-chip-row">
            {MONITORING_TIME_WINDOWS.map((window) => {
              const selected = auditTimeWindow === window.key;
              const label = window.key === '1h'
                ? (locale === 'zh' ? '最近 1 小时' : 'Last 1h')
                : window.key === '24h'
                  ? (locale === 'zh' ? '最近 24 小时' : 'Last 24h')
                  : window.key === '7d'
                    ? (locale === 'zh' ? '最近 7 天' : 'Last 7d')
                    : (locale === 'zh' ? '全部时间' : 'All Time');
              return (
                <button
                  key={window.key}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setAuditTimeWindow(window.key)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="settings-chip-row">
            {AUDIT_TYPES.map((type) => {
              const selected = auditTypeFilter === type;
              const label = type === 'all' ? (locale === 'zh' ? '全部类型' : 'All Types') : type;
              return (
                <button
                  key={type}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setAuditTypeFilter(type)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="focus-list focus-list-terminal">
            {auditLoading ? <div className="empty-cell">{locale === 'zh' ? '正在加载审计记录...' : 'Loading audit records...'}</div> : null}
            {!auditLoading && !auditItems.length ? <div className="empty-cell">{locale === 'zh' ? '当前筛选条件下没有审计记录' : 'No audit records match the current filters.'}</div> : null}
            {!auditLoading ? auditItems.map((item) => (
              <div className="focus-row" key={item.id}>
                <button type="button" className="focus-main-button" onClick={() => focusAuditItem(item.type)}>
                  <div className="symbol-cell">
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </div>
                </button>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '类型' : 'Type'}</span>
                  <strong>{item.type}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '操作人' : 'Actor'}</span>
                  <strong>{item.actor}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '处置' : 'Action'}</span>
                  <button
                    type="button"
                    className="settings-chip"
                    disabled={incidentBusy}
                    onClick={() => void createAuditIncident(item)}
                  >
                    {locale === 'zh' ? '升级事件' : 'Open Incident'}
                  </button>
                </div>
              </div>
            )) : null}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '后端链路健康' : 'Backend Connectivity'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '通知中心里的接入状态以 worker 和后端快照为准。'
                  : 'Connectivity inside the notifications center is derived from worker and backend snapshots.'}
              </div>
            </div>
            <div className="panel-badge badge-info">{connectedCount}/2</div>
          </div>
          <div className="settings-chip-row">
            <button type="button" className="settings-chip" onClick={() => applyMonitoringFocus({ source: 'market', timeWindow: '24h' })}>
              {locale === 'zh' ? '查看行情监控' : 'Market Monitoring'}
            </button>
            <button type="button" className="settings-chip" onClick={() => applyMonitoringFocus({ source: 'broker', timeWindow: '24h' })}>
              {locale === 'zh' ? '查看券商监控' : 'Broker Monitoring'}
            </button>
            <button type="button" className="settings-chip" onClick={() => applyNotificationFocus({ source: 'task-orchestrator', timeWindow: '24h' })}>
              {locale === 'zh' ? '查看同步通知' : 'Sync Notifications'}
            </button>
          </div>
          <div className="status-stack">
            <button type="button" className="status-row status-row-button" onClick={() => applyMonitoringFocus({ source: 'market', timeWindow: '24h' })}><span>{copy[locale].labels.marketData}</span><strong>{marketProviderLabel}</strong></button>
            <button type="button" className="status-row status-row-button" onClick={() => applyMonitoringFocus({ source: 'market', timeWindow: '24h' })}><span>{copy[locale].labels.marketState}</span><strong>{connectionLabel(locale, marketConnected, marketFallback)}</strong></button>
            <button type="button" className="status-row status-row-button" onClick={() => applyMonitoringFocus({ source: 'broker', timeWindow: '24h' })}><span>{copy[locale].labels.brokerState}</span><strong>{connectionLabel(locale, brokerConnected, false, true)}</strong></button>
            <button type="button" className="status-row status-row-button" onClick={() => applyNotificationFocus({ source: 'task-orchestrator', timeWindow: '24h' })}><span>{locale === 'zh' ? '最近行情同步' : 'Last market sync'}</span><strong>{fmtDateTime(marketStatus?.asOf, locale)}</strong></button>
            <div className="status-copy">{marketStatus?.message || state.integrationStatus.marketData.message}</div>
            <div className="status-copy">{snapshot?.message || state.integrationStatus.broker.message}</div>
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '调度节拍' : 'Scheduler Ticks'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '查看 worker 产生的盘前、盘中、盘后调度窗口节拍。'
                  : 'Inspect worker-produced pre-open, intraday, and post-close scheduler ticks.'}
              </div>
            </div>
            <div className="panel-badge badge-info">{schedulerItems.length}</div>
          </div>
          <div className="settings-chip-row">
            {MONITORING_TIME_WINDOWS.map((window) => {
              const selected = schedulerTimeWindow === window.key;
              const label = window.key === '1h'
                ? (locale === 'zh' ? '最近 1 小时' : 'Last 1h')
                : window.key === '24h'
                  ? (locale === 'zh' ? '最近 24 小时' : 'Last 24h')
                  : window.key === '7d'
                    ? (locale === 'zh' ? '最近 7 天' : 'Last 7d')
                    : (locale === 'zh' ? '全部时间' : 'All Time');
              return (
                <button
                  key={window.key}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setSchedulerTimeWindow(window.key)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="settings-chip-row">
            {SCHEDULER_PHASES.map((phase) => {
              const selected = schedulerPhaseFilter === phase;
              const label = phase === 'all' ? (locale === 'zh' ? '全部窗口' : 'All Phases') : phase;
              return (
                <button
                  key={phase}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setSchedulerPhaseFilter(phase)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="focus-list focus-list-terminal">
            {schedulerLoading ? <div className="empty-cell">{locale === 'zh' ? '正在加载调度节拍...' : 'Loading scheduler ticks...'}</div> : null}
            {!schedulerLoading && !schedulerItems.length ? <div className="empty-cell">{locale === 'zh' ? '当前筛选条件下没有调度节拍' : 'No scheduler ticks match the current filters.'}</div> : null}
            {!schedulerLoading ? schedulerItems.map((item) => (
              <div className="focus-row" key={item.id}>
                <button type="button" className="focus-main-button" onClick={() => focusSchedulerItem(item.phase)}>
                  <div className="symbol-cell">
                    <strong>{item.title}</strong>
                    <span>{item.message}</span>
                  </div>
                </button>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '窗口' : 'Phase'}</span>
                  <strong>{item.phase}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '状态' : 'Status'}</span>
                  <strong>{item.status}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '处置' : 'Action'}</span>
                  <button
                    type="button"
                    className="settings-chip"
                    disabled={incidentBusy}
                    onClick={() => void createSchedulerIncident(item)}
                  >
                    {locale === 'zh' ? '升级事件' : 'Open Incident'}
                  </button>
                </div>
              </div>
            )) : null}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '风控事件' : 'Risk Events'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '把风险扫描、审批要求和 risk-off 拦截纳入同一页排查。'
                  : 'Bring risk scans, approval requirements, and risk-off blocks into the same investigation console.'}
              </div>
            </div>
            <div className="panel-badge badge-warn">{riskEventItems.length}</div>
          </div>
          <div className="settings-chip-row">
            {RISK_EVENT_LEVELS.map((level) => {
              const selected = riskEventLevelFilter === level;
              const label = level === 'all' ? (locale === 'zh' ? '全部级别' : 'All Levels') : translateMonitoringStatus(locale, level);
              return (
                <button
                  key={level}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setRiskEventLevelFilter(level)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="settings-chip-row">
            {RISK_EVENT_STATUSES.map((status) => {
              const selected = riskEventStatusFilter === status;
              const label = status === 'all' ? (locale === 'zh' ? '全部状态' : 'All Statuses') : status;
              return (
                <button
                  key={status}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setRiskEventStatusFilter(status)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="focus-list focus-list-terminal">
            {riskEventsLoading ? <div className="empty-cell">{locale === 'zh' ? '正在加载风控事件...' : 'Loading risk events...'}</div> : null}
            {!riskEventsLoading && !riskEventItems.length ? <div className="empty-cell">{locale === 'zh' ? '当前筛选条件下没有风控事件' : 'No risk events match the current filters.'}</div> : null}
            {!riskEventsLoading ? riskEventItems.map((item) => (
              <div className="focus-row" key={item.id}>
                <button type="button" className="focus-main-button" onClick={() => focusRiskEventItem(item.status, item.level)}>
                  <div className="symbol-cell">
                    <strong>{item.title}</strong>
                    <span>{item.message}</span>
                  </div>
                </button>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '状态' : 'Status'}</span>
                  <strong>{item.status}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '风险级别' : 'Risk Level'}</span>
                  <strong>{item.riskLevel}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '处置' : 'Action'}</span>
                  <button
                    type="button"
                    className="settings-chip"
                    disabled={incidentBusy}
                    onClick={() => void createRiskIncident(item)}
                  >
                    {locale === 'zh' ? '升级事件' : 'Open Incident'}
                  </button>
                </div>
              </div>
            )) : null}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '工作流运行' : 'Workflow Runs'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '把队列、重试、失败和恢复中的 workflow 放到通知中心里统一跟踪。'
                  : 'Track queued, retrying, failed, and recovered workflows alongside the rest of the investigation view.'}
              </div>
            </div>
            <div className="panel-badge badge-info">{workflowRunItems.length}</div>
          </div>
          <div className="settings-chip-row">
            {WORKFLOW_RUN_STATUSES.map((status) => {
              const selected = workflowRunStatusFilter === status;
              const label = status === 'all' ? (locale === 'zh' ? '全部状态' : 'All Statuses') : status;
              return (
                <button
                  key={status}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setWorkflowRunStatusFilter(status)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="focus-list focus-list-terminal">
            {workflowRunsLoading ? <div className="empty-cell">{locale === 'zh' ? '正在加载工作流...' : 'Loading workflow runs...'}</div> : null}
            {!workflowRunsLoading && !workflowRunItems.length ? <div className="empty-cell">{locale === 'zh' ? '当前筛选条件下没有工作流记录' : 'No workflow runs match the current filters.'}</div> : null}
            {!workflowRunsLoading ? workflowRunItems.map((item) => (
              <div className="focus-row" key={item.id}>
                <button type="button" className="focus-main-button" onClick={() => focusWorkflowRunItem(item.status)}>
                  <div className="symbol-cell">
                    <strong>{item.workflowId}</strong>
                    <span>{String(item.error || item.metadata?.summary || item.status)}</span>
                  </div>
                </button>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '状态' : 'Status'}</span>
                  <strong>{item.status}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '执行人' : 'Actor'}</span>
                  <strong>{item.actor}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '处置' : 'Action'}</span>
                  <button
                    type="button"
                    className="settings-chip"
                    disabled={incidentBusy}
                    onClick={() => void createWorkflowIncident(item)}
                  >
                    {locale === 'zh' ? '升级事件' : 'Open Incident'}
                  </button>
                </div>
              </div>
            )) : null}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '执行计划' : 'Execution Plans'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '把执行计划、风控审查状态和关联 workflow 放进 investigation console。'
                  : 'Bring execution plans, risk review state, and linked workflows into the investigation console.'}
              </div>
            </div>
            <div className="panel-badge badge-info">{executionLedgerItems.length}</div>
          </div>
          <div className="settings-chip-row">
            {EXECUTION_PLAN_STATUSES.map((status) => {
              const selected = executionPlanStatusFilter === status;
              const label = status === 'all' ? (locale === 'zh' ? '全部状态' : 'All Statuses') : status;
              return (
                <button
                  key={status}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setExecutionPlanStatusFilter(status)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="focus-list focus-list-terminal">
            {executionLedgerLoading ? <div className="empty-cell">{locale === 'zh' ? '正在加载执行计划...' : 'Loading execution plans...'}</div> : null}
            {!executionLedgerLoading && !executionLedgerItems.length ? <div className="empty-cell">{locale === 'zh' ? '当前筛选条件下没有执行计划' : 'No execution plans match the current filters.'}</div> : null}
            {!executionLedgerLoading ? executionLedgerItems.map((item) => (
              <div className="focus-row" key={item.plan.id}>
                <button type="button" className="focus-main-button" onClick={() => focusExecutionPlanItem(item.plan.status === 'blocked' ? 'blocked' : item.plan.riskStatus)}>
                  <div className="symbol-cell">
                    <strong>{item.plan.strategyName}</strong>
                    <span>{item.plan.summary}</span>
                  </div>
                </button>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '状态' : 'Status'}</span>
                  <strong>{item.plan.status}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '风控' : 'Risk'}</span>
                  <strong>{item.plan.riskStatus}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '处置' : 'Action'}</span>
                  <button
                    type="button"
                    className="settings-chip"
                    disabled={incidentBusy}
                    onClick={() => void createExecutionPlanIncident(item)}
                  >
                    {locale === 'zh' ? '升级事件' : 'Open Incident'}
                  </button>
                </div>
              </div>
            )) : null}
          </div>
        </article>
      </section>
    </>
  );
}

export default NotificationsPage;
