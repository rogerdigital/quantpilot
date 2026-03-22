import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { approveExecutionPlan, cancelExecutionPlan, ingestBrokerExecutionEvent, queueExecutionCandidateHandoff, reconcileExecutionPlan, recoverExecutionPlan, settleExecutionPlan, syncExecutionPlan } from '../../../app/api/controlPlane.ts';
import { useAuditFeed } from '../../../modules/audit/useAuditFeed.ts';
import { readDeepLinkParams } from '../../../modules/console/deepLinks.ts';
import { useExecutionConsoleData } from '../../../modules/console/useExecutionConsoleData.ts';
import { formatActionGuardNotice } from '../../../modules/permissions/permissionCopy.ts';
import { getExecutionCollectionConfigs } from '../../../modules/console/executionCollectionConfigs.ts';
import { useExecutionDetailPanels } from '../../../modules/console/useExecutionDetailPanels.ts';
import {
  getExecutionAuditEventInspectionConfig,
  getExecutionDetailInspectionConfig,
  getExecutionSnapshotInspectionConfig,
  getExecutionWorkflowInspectionConfig,
  getExecutionWorkflowStepInspectionConfig,
} from '../../../modules/console/executionInspectionConfigs.ts';
import { useSyncedQuerySelection } from '../../../modules/console/useSyncedQuerySelection.ts';
import { useResearchNavigationContext } from '../../../modules/research/useResearchNavigationContext.ts';
import { useTradingSystem } from '../../../store/trading-system/TradingSystemProvider.tsx';
import { TopMeta } from '../components/ConsoleChrome.tsx';
import { InspectionEmpty, InspectionListPanel, InspectionMetricsRow, InspectionPanel, InspectionSelectableRow, InspectionStatus } from '../components/InspectionPanels.tsx';
import { ActivityLog, ApprovalQueueTable, OrdersTable } from '../components/ConsoleTables.tsx';
import { onShortcutKeyDown, useSettingsNavigation } from '../hooks.ts';
import { copy, useLocale } from '../i18n.tsx';
import { modeTone, translateEngineStatus, translateMode, translateRiskLevel, translateRuntimeText } from '../utils.ts';

export function ExecutionPage() {
  const { state, approveLiveIntent, rejectLiveIntent, hasPermission, actionGuardNotice } = useTradingSystem();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [handoffBusyId, setHandoffBusyId] = useState('');
  const [handoffMessage, setHandoffMessage] = useState('');
  const [planBusyAction, setPlanBusyAction] = useState('');
  const [planMessage, setPlanMessage] = useState('');
  const researchNavigation = useResearchNavigationContext(searchParams, navigate);
  const goToSettings = useSettingsNavigation();
  const canApproveExecution = hasPermission('execution:approve');
  const {
    runtimeEvents,
    accountSnapshots,
    handoffs,
    ledgerEntries,
    workbench,
    workflowRuns,
    operatorActions,
    loading: executionDataLoading,
    error: executionDataError,
  } = useExecutionConsoleData(`${state.controlPlane.lastSyncAt}-${refreshKey}`);
  const { items: auditItems, loading: auditLoading } = useAuditFeed(state.controlPlane.lastSyncAt);
  const {
    planId: requestedPlanId,
    strategyId: requestedStrategyId,
    runId: requestedRunId,
    timelineId: requestedTimelineId,
    sourcePage,
    auditEventId: requestedAuditEventId,
    workflowStepKey: requestedWorkflowStepKey,
  } = readDeepLinkParams(searchParams);
  const {
    selectedId: selectedPlanId,
    setSelectedId: setSelectedPlanId,
  } = useSyncedQuerySelection({
    itemIds: ledgerEntries.map((entry) => entry.plan.id),
    queryKey: 'plan',
    requestedId: requestedPlanId,
    searchParams,
    setSearchParams,
  });
  const executionPanelBase = useExecutionDetailPanels({
    selectedPlanId,
    selectedAuditEventId: '',
    selectedWorkflowStepKey: '',
    ledgerEntries,
    auditItems,
    operatorActions,
    workflowRuns,
    accountSnapshots,
  });
  const {
    selectedId: selectedAuditEventId,
    setSelectedId: setSelectedAuditEventId,
  } = useSyncedQuerySelection({
    itemIds: executionPanelBase.selectedExecutionAuditItems.map((item) => item.id),
    queryKey: 'audit',
    requestedId: requestedAuditEventId,
    searchParams,
    setSearchParams,
  });
  const {
    selectedId: selectedWorkflowStepKey,
    setSelectedId: setSelectedWorkflowStepKey,
  } = useSyncedQuerySelection({
    itemIds: executionPanelBase.selectedWorkflow?.steps.map((step) => step.key) || [],
    queryKey: 'step',
    requestedId: requestedWorkflowStepKey,
    searchParams,
    setSearchParams,
  });
  const {
    selectedEntry,
    selectedExecutionAuditItems,
    selectedExecutionVersionItems,
    selectedExecutionActions,
    selectedWorkflow,
    selectedAccountSnapshot,
    selectedAuditEvent,
    selectedWorkflowStep,
  } = useExecutionDetailPanels({
    selectedPlanId,
    selectedAuditEventId,
    selectedWorkflowStepKey,
    ledgerEntries,
    auditItems,
    operatorActions,
    workflowRuns,
    accountSnapshots,
  });
  const executionDetailInspection = getExecutionDetailInspectionConfig(locale, selectedEntry);
  const executionAuditEventInspection = getExecutionAuditEventInspectionConfig(locale, selectedEntry, selectedAuditEvent);
  const executionWorkflowInspection = getExecutionWorkflowInspectionConfig(locale, selectedEntry, selectedWorkflow, executionDataLoading);
  const executionWorkflowStepInspection = getExecutionWorkflowStepInspectionConfig(locale, selectedEntry, selectedWorkflowStep);
  const executionSnapshotInspection = getExecutionSnapshotInspectionConfig(locale, selectedEntry, selectedAccountSnapshot);
  const executionCollectionConfigs = getExecutionCollectionConfigs(locale, {
    audit: selectedExecutionAuditItems.length,
    actions: selectedExecutionActions.length,
    versions: selectedExecutionVersionItems.length,
  });
  const selectedLifecycleStatus = selectedEntry?.executionRun?.lifecycleStatus || selectedEntry?.plan.lifecycleStatus || '--';
  const selectedOrderStates = selectedEntry?.orderStates || [];
  const selectedSubmittedCount = selectedEntry?.executionRun?.submittedOrderCount || 0;
  const selectedAcknowledgedCount = selectedOrderStates.filter((item) => item.lifecycleStatus === 'acknowledged').length;
  const selectedFilledCount = selectedEntry?.executionRun?.filledOrderCount || 0;
  const selectedReconciliation = selectedEntry?.reconciliation;
  const selectedExceptionPolicy = selectedEntry?.exceptionPolicy;
  const selectedRecovery = selectedEntry?.recovery;
  const selectedBrokerEvents = selectedEntry?.brokerEvents || [];
  const selectedLinkedIncidents = selectedEntry?.linkedIncidents || [];
  const workbenchSummary = workbench?.summary;
  const workbenchOperations = workbench?.operations;
  const planSummary = ledgerEntries.reduce((acc, entry) => {
    const lifecycle = entry.executionRun?.lifecycleStatus || entry.plan.lifecycleStatus;
    if (lifecycle === 'awaiting_approval') acc.awaitingApproval += 1;
    if (lifecycle === 'routing') acc.routing += 1;
    if (lifecycle === 'submitted' || lifecycle === 'partial_fill') acc.submitted += 1;
    if (lifecycle === 'acknowledged') acc.acknowledged += 1;
    if (lifecycle === 'filled') acc.filled += 1;
    if (lifecycle === 'blocked') acc.blocked += 1;
    if (lifecycle === 'cancelled') acc.cancelled += 1;
    if (lifecycle === 'failed') acc.failed += 1;
    return acc;
  }, {
    awaitingApproval: 0,
    routing: 0,
    submitted: 0,
    acknowledged: 0,
    filled: 0,
    blocked: 0,
    cancelled: 0,
    failed: 0,
  });

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">{copy[locale].desk.execution}</div>
          <h1>{copy[locale].pages.execution[0]}</h1>
          <p className="topbar-copy">{copy[locale].pages.execution[1]}</p>
        </div>
        <TopMeta items={[
          { label: copy[locale].labels.marketClock, value: state.marketClock },
          { label: copy[locale].labels.systemStatus, value: translateEngineStatus(locale, state.engineStatus), accent: true },
          { label: copy[locale].terms.fillCount, value: String(state.activityLog.length) },
        ]} />
      </header>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.executionLog}</div><div className="panel-copy">{locale === 'zh' ? '按时间逆序查看最新系统执行记录。' : 'Review the latest execution records in reverse chronological order.'}</div></div><div className="panel-badge badge-info">EXECUTION</div></div>
          <ActivityLog />
        </article>
        <article
          className="panel shortcut-surface"
          role="button"
          tabIndex={0}
          onClick={() => goToSettings('integrations')}
          onKeyDown={(event) => onShortcutKeyDown(event, () => goToSettings('integrations'))}
        >
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.executionSummary}</div><div className="panel-copy">{locale === 'zh' ? '汇总最近一个刷新周期的动作和通道路由。' : 'Summarize the latest cycle actions and routing posture.'}</div></div><div className={`panel-badge badge-${modeTone(state.mode)}`}>{translateMode(locale, state.mode)}</div></div>
          <div className="status-stack">
            <div className="status-row"><span>{copy[locale].labels.latestSignal}</span><strong>{state.stockStates.filter((stock) => stock.signal === 'BUY').length} / {state.stockStates.filter((stock) => stock.signal === 'SELL').length}</strong></div>
            <div className="status-row"><span>{copy[locale].terms.riskLevel}</span><strong>{translateRiskLevel(locale, state.riskLevel)}</strong></div>
            <div className="status-row"><span>{copy[locale].terms.tradeDecision}</span><strong>{translateRuntimeText(locale, state.decisionSummary)}</strong></div>
            <div className="status-row"><span>{copy[locale].labels.brokerState}</span><strong>{state.integrationStatus.broker.connected ? copy[locale].labels.connected : copy[locale].labels.fallback}</strong></div>
            <div className="status-copy">{translateRuntimeText(locale, state.decisionCopy)}</div>
            <div className="status-copy">{translateRuntimeText(locale, state.integrationStatus.broker.message)}</div>
          </div>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '执行生命周期总览' : 'Execution Lifecycle Summary'}</div><div className="panel-copy">{locale === 'zh' ? '把待审批、已提交、已成交和阻塞的执行计划压缩成一块执行中台总览。' : 'Compress awaiting approval, submitted, filled, and blocked plans into one execution-lifecycle overview.'}</div></div><div className="panel-badge badge-info">{workbenchSummary?.totalPlans ?? ledgerEntries.length}</div></div>
          <div className="status-stack">
            <div className="status-row"><span>{locale === 'zh' ? '待审批' : 'Awaiting Approval'}</span><strong>{workbenchSummary?.awaitingApproval ?? planSummary.awaitingApproval}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '路由中' : 'Routing'}</span><strong>{workbenchSummary?.routing ?? planSummary.routing}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '已提交' : 'Submitted'}</span><strong>{workbenchSummary?.submitted ?? planSummary.submitted}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '已受理' : 'Acknowledged'}</span><strong>{workbenchSummary?.acknowledged ?? planSummary.acknowledged}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '已成交' : 'Filled'}</span><strong>{workbenchSummary?.filled ?? planSummary.filled}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '已取消' : 'Cancelled'}</span><strong>{workbenchSummary?.cancelled ?? planSummary.cancelled}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '阻塞 / 失败' : 'Blocked / Failed'}</span><strong>{(workbenchSummary?.blocked ?? planSummary.blocked) + (workbenchSummary?.failed ?? planSummary.failed)}</strong></div>
          </div>
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '账户与持仓对账' : 'Account And Position Reconciliation'}</div><div className="panel-copy">{locale === 'zh' ? '比较 execution order state、broker snapshot 和持仓数量，快速识别 drift。' : 'Compare execution order states, broker snapshots, and positions to quickly spot drift.'}</div></div><div className="panel-badge badge-info">{workbenchSummary ? workbenchSummary.aligned + workbenchSummary.attention + workbenchSummary.drift + workbenchSummary.missingSnapshot : ledgerEntries.length}</div></div>
          <div className="status-stack">
            <div className="status-row"><span>{locale === 'zh' ? '对齐' : 'Aligned'}</span><strong>{workbenchSummary?.aligned ?? 0}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '需关注' : 'Attention'}</span><strong>{workbenchSummary?.attention ?? 0}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '已漂移' : 'Drift'}</span><strong>{workbenchSummary?.drift ?? 0}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '缺少快照' : 'Missing Snapshot'}</span><strong>{workbenchSummary?.missingSnapshot ?? 0}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '未完成订单' : 'Open Orders'}</span><strong>{workbenchSummary?.totalOpenOrders ?? 0}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '已同步持仓' : 'Synced Positions'}</span><strong>{workbenchSummary?.syncedPositions ?? 0}</strong></div>
          </div>
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '执行恢复工作台' : 'Execution Recovery Workbench'}</div><div className="panel-copy">{locale === 'zh' ? '把 retry、失败、取消和对账异常压缩成统一恢复姿态，便于执行台做补偿与恢复。' : 'Compress retry, failed, cancelled, and reconciliation drift into one recovery posture for compensation and recovery actions.'}</div></div><div className="panel-badge badge-warn">{workbenchSummary?.recoverablePlans ?? 0}</div></div>
          <div className="status-stack">
            <div className="status-row"><span>{locale === 'zh' ? '可恢复计划' : 'Recoverable Plans'}</span><strong>{workbenchSummary?.recoverablePlans ?? 0}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '待释放重试' : 'Retry Scheduled'}</span><strong>{workbenchSummary?.retryScheduledWorkflows ?? 0}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '需要人工介入' : 'Needs Intervention'}</span><strong>{workbenchSummary?.interventionNeeded ?? 0}</strong></div>
            <div className="status-copy">
              {locale === 'zh'
                ? '当 workflow 失败、plan 取消或 reconciliation 发生 drift 时，这里会直接给出恢复姿态。'
                : 'When a workflow fails, a plan is cancelled, or reconciliation drifts, this surface exposes the next recovery posture.'}
            </div>
          </div>
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '执行异常与重试策略' : 'Execution Exception And Retry Policies'}</div><div className="panel-copy">{locale === 'zh' ? '把 broker reject、取消、重试预算和 incident 升级压成统一异常姿态。' : 'Compress broker rejects, cancellations, retry budget, and incident escalation into one exception posture.'}</div></div><div className="panel-badge badge-warn">{(workbenchSummary?.retryEligiblePlans ?? 0) + (workbenchSummary?.compensationPlans ?? 0) + (workbenchSummary?.incidentLinkedPlans ?? 0)}</div></div>
          <div className="status-stack">
            <div className="status-row"><span>{locale === 'zh' ? '可重试计划' : 'Retry Eligible'}</span><strong>{workbenchSummary?.retryEligiblePlans ?? 0}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '补偿队列' : 'Compensation Queue'}</span><strong>{workbenchSummary?.compensationPlans ?? 0}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '关联 Incident' : 'Linked Incidents'}</span><strong>{workbenchSummary?.incidentLinkedPlans ?? 0}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '拒单计划' : 'Reject Plans'}</span><strong>{workbenchSummary?.brokerRejectPlans ?? 0}</strong></div>
            <div className="status-copy">
              {locale === 'zh'
                ? '这层策略会把 broker event 历史转成 retry、补偿和 incident 升级建议。'
                : 'This policy layer turns broker event history into retry, compensation, and incident escalation guidance.'}
            </div>
          </div>
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '执行运营队列' : 'Execution Operations Console'}</div><div className="panel-copy">{locale === 'zh' ? '把审批、重试、补偿、incident 和活跃路由统一成执行台的处置队列。' : 'Turn approvals, retries, compensation, incidents, and active routing into one execution-ops queue view.'}</div></div><div className="panel-badge badge-info">{(workbenchOperations?.queues.approvals.length ?? 0) + (workbenchOperations?.queues.retryEligible.length ?? 0) + (workbenchOperations?.queues.compensation.length ?? 0) + (workbenchOperations?.queues.incidents.length ?? 0)}</div></div>
          <div className="focus-list">
            <div className="focus-row">
              <div className="focus-metric"><span>{locale === 'zh' ? '审批队列' : 'Approvals'}</span><strong>{workbenchOperations?.queues.approvals.length ?? 0}</strong></div>
              <div className="focus-metric"><span>{locale === 'zh' ? '可重试' : 'Retry Eligible'}</span><strong>{workbenchOperations?.queues.retryEligible.length ?? 0}</strong></div>
              <div className="focus-metric"><span>{locale === 'zh' ? '补偿队列' : 'Compensation'}</span><strong>{workbenchOperations?.queues.compensation.length ?? 0}</strong></div>
              <div className="focus-metric"><span>{locale === 'zh' ? '执行 Incident' : 'Incidents'}</span><strong>{workbenchOperations?.queues.incidents.length ?? 0}</strong></div>
            </div>
            {workbenchOperations?.nextActions.map((item) => (
              <div key={item.key} className="focus-row">
                <div className="focus-metric"><span>{item.priority}</span><strong>{item.count}</strong></div>
                <div className="status-copy"><strong>{item.title}</strong>{` - ${item.detail}`}</div>
              </div>
            ))}
            {!workbenchOperations?.nextActions.length ? (
              <div className="status-copy">
                {locale === 'zh' ? '当前没有额外排队的执行运营动作。' : 'No extra execution operations actions are queued right now.'}
              </div>
            ) : null}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? 'Owner 负载' : 'Owner Load'}</div><div className="panel-copy">{locale === 'zh' ? '按执行 owner 看审批、重试、补偿和 incident 压力。' : 'Review approval, retry, compensation, and incident pressure by execution owner.'}</div></div><div className="panel-badge badge-info">{workbenchOperations?.ownerLoad.length ?? 0}</div></div>
          <div className="focus-list">
            {workbenchOperations?.ownerLoad.map((item) => (
              <div key={item.owner} className="focus-row">
                <div className="focus-metric"><span>{locale === 'zh' ? 'Owner' : 'Owner'}</span><strong>{item.owner}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '总量' : 'Total'}</span><strong>{item.total}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '审批' : 'Approvals'}</span><strong>{item.approvals}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '重试' : 'Retry'}</span><strong>{item.retryEligible}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '补偿/Incident' : 'Comp/Inc'}</span><strong>{item.compensation + item.incidents}</strong></div>
              </div>
            ))}
            {!workbenchOperations?.ownerLoad.length ? (
              <div className="status-copy">
                {locale === 'zh' ? '当前没有 owner 负载数据。' : 'No owner load data is available yet.'}
              </div>
            ) : null}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? 'Broker 回报承接' : 'Broker Event Ingestion'}</div><div className="panel-copy">{locale === 'zh' ? '把 broker ack、fill、reject 和 cancel 回报接成结构化事件，并驱动执行状态聚合。' : 'Turn broker ack, fill, reject, and cancel reports into structured events that drive execution state aggregation.'}</div></div><div className="panel-badge badge-info">{workbenchSummary?.brokerEvents ?? 0}</div></div>
          <div className="status-stack">
            <div className="status-row"><span>{locale === 'zh' ? '已记录回报' : 'Recorded Events'}</span><strong>{workbenchSummary?.brokerEvents ?? 0}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '成交回报' : 'Fill Events'}</span><strong>{workbenchSummary?.fillEvents ?? 0}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '拒单回报' : 'Rejected Events'}</span><strong>{workbenchSummary?.rejectedBrokerEvents ?? 0}</strong></div>
            <div className="status-copy">
              {locale === 'zh'
                ? '这层事件历史会成为后续 retry policy、异常补偿和 execution incident 联动的稳定输入。'
                : 'This event trail becomes the stable input for later retry policies, exception compensation, and execution incident linkage.'}
            </div>
          </div>
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '服务端执行记录' : 'Server Execution Runtime'}</div><div className="panel-copy">{locale === 'zh' ? '来自后端持久化的 broker 执行摘要，不依赖当前页面内存状态。' : 'Backend-persisted broker execution summaries, independent of the current page runtime state.'}</div></div><div className="panel-badge badge-info">{runtimeEvents.length}</div></div>
          <div className="focus-list">
            {executionDataError ? <div className="status-copy">{locale === 'zh' ? `执行数据加载失败：${executionDataError}` : `Failed to load execution data: ${executionDataError}`}</div> : null}
            {runtimeEvents.slice(0, 6).map((event) => (
              <div key={event.id} className="focus-row">
                <div className="focus-metric"><span>{locale === 'zh' ? '周期' : 'Cycle'}</span><strong>{event.cycle}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '已提交' : 'Submitted'}</span><strong>{event.submittedOrderCount}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '持仓数' : 'Positions'}</span><strong>{event.positionCount}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '权益' : 'Equity'}</span><strong>{event.equity.toFixed(0)}</strong></div>
              </div>
            ))}
            {!runtimeEvents.length ? <div className="status-copy">{executionDataLoading ? (locale === 'zh' ? '正在同步执行数据...' : 'Syncing execution data...') : (locale === 'zh' ? '尚无后端执行记录。执行一个周期后这里会出现服务端快照。' : 'No backend execution records yet. Run a cycle to persist server-side snapshots.')}</div> : null}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? 'Broker 账户快照' : 'Broker Account Snapshots'}</div><div className="panel-copy">{locale === 'zh' ? '查看最近一次后端同步回来的账户、订单和持仓规模。' : 'Inspect the latest backend-synced account, order, and position state.'}</div></div><div className="panel-badge badge-ok">{accountSnapshots.length}</div></div>
          <div className="focus-list">
            {accountSnapshots.slice(0, 4).map((snapshot) => (
              <div key={snapshot.id} className="focus-row">
                <div className="focus-metric"><span>{locale === 'zh' ? '提供商' : 'Provider'}</span><strong>{snapshot.provider}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '订单数' : 'Orders'}</span><strong>{snapshot.orders.length}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '现金' : 'Cash'}</span><strong>{Number(snapshot.account?.cash || 0).toFixed(0)}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '状态' : 'Status'}</span><strong>{snapshot.connected ? 'connected' : 'disconnected'}</strong></div>
              </div>
            ))}
          {!accountSnapshots.length ? <div className="status-copy">{executionDataLoading ? (locale === 'zh' ? '正在同步 broker 快照...' : 'Syncing broker snapshots...') : (locale === 'zh' ? '尚无 broker 账户快照。' : 'No broker account snapshots yet.')}</div> : null}
          </div>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '研究执行交接台' : 'Research Execution Handoffs'}</div><div className="panel-copy">{locale === 'zh' ? '查看研究侧正式移交过来的执行候选对象，并从这里把它们排队进入 execution workflow。' : 'Review formal handoff objects coming from research and queue them into execution workflows from one place.'}</div></div><div className="panel-badge badge-info">{handoffs.length}</div></div>
          <div className="focus-list">
            {handoffMessage ? <div className="status-copy">{handoffMessage}</div> : null}
            {handoffs.slice(0, 6).map((handoff) => (
              <InspectionSelectableRow
                key={handoff.id}
                leadTitle={`${handoff.strategyName} · ${handoff.mode}`}
                leadCopy={handoff.summary}
                metrics={[
                  { label: locale === 'zh' ? '交接状态' : 'Handoff', value: handoff.handoffStatus },
                  { label: locale === 'zh' ? '风险' : 'Risk', value: handoff.riskStatus },
                  { label: locale === 'zh' ? '审批' : 'Approval', value: handoff.approvalState },
                  { label: locale === 'zh' ? '订单数' : 'Orders', value: handoff.orderCount },
                ]}
                actions={(
                  <div className="action-group">
                    <button
                      type="button"
                      className="inline-action"
                      onClick={() => researchNavigation.openStrategyDetail(handoff.strategyId)}
                    >
                      {locale === 'zh' ? '打开策略' : 'Open Strategy'}
                    </button>
                    <button
                      type="button"
                      className="inline-action inline-action-approve"
                      disabled={!canApproveExecution || handoff.handoffStatus !== 'ready' || handoffBusyId === handoff.id}
                      onClick={async () => {
                        setHandoffBusyId(handoff.id);
                        setHandoffMessage('');
                        try {
                          const result = await queueExecutionCandidateHandoff(handoff.id, {
                            actor: 'execution-desk',
                            owner: 'execution-desk',
                          });
                          setHandoffMessage(
                            locale === 'zh'
                              ? `已将 ${handoff.strategyName} 的交接对象排队到 workflow ${result.workflow?.id || ''}。`
                              : `Queued ${handoff.strategyName} handoff into workflow ${result.workflow?.id || ''}.`,
                          );
                          setRefreshKey((current) => current + 1);
                        } catch (error) {
                          setHandoffMessage(error instanceof Error ? error.message : 'unknown error');
                        } finally {
                          setHandoffBusyId('');
                        }
                      }}
                    >
                      {handoffBusyId === handoff.id
                        ? (locale === 'zh' ? '排队中...' : 'Queueing...')
                        : (locale === 'zh' ? '排队执行' : 'Queue Execution')}
                    </button>
                  </div>
                )}
              />
            ))}
            {!handoffs.length ? <div className="status-copy">{executionDataLoading ? (locale === 'zh' ? '正在同步交接对象...' : 'Syncing handoffs...') : (locale === 'zh' ? '当前还没有研究侧移交过来的执行候选对象。' : 'No research execution handoffs are available yet.')}</div> : null}
            {!canApproveExecution ? <div className="status-copy">{locale === 'zh' ? '当前没有 execution:approve 权限，无法将交接对象排队到执行 workflow。' : 'You do not have execution:approve permission to queue handoffs into execution workflows.'}</div> : null}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '执行计划账本' : 'Execution Plan Ledger'}</div><div className="panel-copy">{locale === 'zh' ? '把 execution plan、workflow 状态和最新服务端执行结果放到同一视图。' : 'A single view for execution plans, workflow status, and the latest backend execution result.'}</div></div><div className="panel-badge badge-info">{ledgerEntries.length}</div></div>
          <div className="focus-list">
            {ledgerEntries.slice(0, 6).map((entry) => (
              <InspectionSelectableRow
                key={entry.plan.id}
                metrics={[
                  { label: locale === 'zh' ? '策略' : 'Strategy', value: entry.plan.strategyName },
                  { label: locale === 'zh' ? '执行阶段' : 'Lifecycle', value: entry.executionRun?.lifecycleStatus || entry.plan.lifecycleStatus },
                  { label: locale === 'zh' ? '工作流' : 'Workflow', value: entry.workflow?.status || '--' },
                  { label: locale === 'zh' ? '订单进度' : 'Order Progress', value: entry.executionRun ? `${entry.executionRun.filledOrderCount}/${entry.executionRun.orderCount}` : '--' },
                ]}
                actions={(
                  <button
                    type="button"
                    className="inline-action"
                    disabled={selectedPlanId === entry.plan.id}
                    onClick={() => setSelectedPlanId(entry.plan.id)}
                  >
                    {selectedPlanId === entry.plan.id
                      ? (locale === 'zh' ? '已选中' : 'Selected')
                      : (locale === 'zh' ? '查看' : 'Inspect')}
                  </button>
                )}
              />
            ))}
            {!ledgerEntries.length ? <div className="status-copy">{executionDataLoading ? (locale === 'zh' ? '正在同步执行账本...' : 'Syncing execution ledger...') : (locale === 'zh' ? '尚无 execution ledger 数据。' : 'No execution ledger data yet.')}</div> : null}
          </div>
        </article>
      </section>

      <section className="panel-grid">
        <InspectionPanel
          title={executionDetailInspection.title}
          copy={executionDetailInspection.copy}
          badge={selectedLifecycleStatus}
        >
          {!selectedEntry ? (
            <InspectionStatus>{executionDetailInspection.emptyMessage}</InspectionStatus>
          ) : (
            <div className="status-stack">
              <div className="status-row"><span>{locale === 'zh' ? '策略' : 'Strategy'}</span><strong>{selectedEntry.plan.strategyName}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '模式' : 'Mode'}</span><strong>{selectedEntry.plan.mode}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '计划状态' : 'Plan status'}</span><strong>{selectedEntry.plan.status}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '执行阶段' : 'Lifecycle'}</span><strong>{selectedLifecycleStatus}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '审批状态' : 'Approval'}</span><strong>{selectedEntry.plan.approvalState}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '订单数' : 'Order count'}</span><strong>{selectedEntry.plan.orderCount}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '已提交 / 已受理 / 已成交' : 'Submitted / Acknowledged / Filled'}</span><strong>{selectedSubmittedCount} / {selectedAcknowledgedCount} / {selectedFilledCount}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '资金规模' : 'Capital'}</span><strong>{selectedEntry.plan.capital.toFixed(0)}</strong></div>
              {selectedRecovery ? (
                <>
                  <div className="status-row"><span>{locale === 'zh' ? '恢复姿态' : 'Recovery Posture'}</span><strong>{selectedRecovery.status}</strong></div>
                  <div className="status-row"><span>{locale === 'zh' ? '推荐动作' : 'Recommended Action'}</span><strong>{selectedRecovery.recommendedAction}</strong></div>
                </>
              ) : null}
              {selectedExceptionPolicy ? (
                <>
                  <div className="status-row"><span>{locale === 'zh' ? '异常姿态' : 'Exception Posture'}</span><strong>{selectedExceptionPolicy.status}</strong></div>
                  <div className="status-row"><span>{locale === 'zh' ? '异常分类' : 'Exception Category'}</span><strong>{selectedExceptionPolicy.category}</strong></div>
                  <div className="status-row"><span>{locale === 'zh' ? '重试预算' : 'Retry Budget'}</span><strong>{`${selectedExceptionPolicy.remainingRetries}/${selectedExceptionPolicy.retryLimit}`}</strong></div>
                  <div className="status-row"><span>{locale === 'zh' ? '关联 Incident' : 'Linked Incident'}</span><strong>{selectedExceptionPolicy.linkedIncidentId || '--'}</strong></div>
                </>
              ) : null}
              <div className="settings-actions">
                <button
                  type="button"
                  className="inline-action inline-action-approve"
                  onClick={() => researchNavigation.openStrategyDetail(selectedEntry.plan.strategyId)}
                >
                  {locale === 'zh' ? '打开策略详情' : 'Open Strategy Detail'}
                </button>
                <button
                  type="button"
                  className="inline-action inline-action-approve"
                  disabled={!canApproveExecution || selectedLifecycleStatus !== 'awaiting_approval' || planBusyAction === 'approve'}
                  onClick={async () => {
                    setPlanBusyAction('approve');
                    setPlanMessage('');
                    try {
                      await approveExecutionPlan(selectedEntry.plan.id, { actor: 'execution-desk' });
                      setPlanMessage(locale === 'zh' ? '已批准执行计划并开始提交订单。' : 'Approved the execution plan and started order submission.');
                      setRefreshKey((current) => current + 1);
                    } catch (error) {
                      setPlanMessage(error instanceof Error ? error.message : 'unknown error');
                    } finally {
                      setPlanBusyAction('');
                    }
                  }}
                >
                  {planBusyAction === 'approve' ? (locale === 'zh' ? '审批中...' : 'Approving...') : (locale === 'zh' ? '批准路由' : 'Approve Routing')}
                </button>
                <button
                  type="button"
                  className="inline-action"
                  disabled={!canApproveExecution || !['submitted', 'acknowledged', 'partial_fill'].includes(selectedLifecycleStatus) || planBusyAction === 'sync'}
                  onClick={async () => {
                    setPlanBusyAction('sync');
                    setPlanMessage('');
                    try {
                      await syncExecutionPlan(selectedEntry.plan.id, {
                        actor: 'execution-desk',
                        scenario: selectedLifecycleStatus === 'submitted' ? 'acknowledge' : 'filled',
                      });
                      setPlanMessage(
                        selectedLifecycleStatus === 'submitted'
                          ? (locale === 'zh' ? '已同步 broker 受理状态。' : 'Synced broker acknowledgement state.')
                          : (locale === 'zh' ? '已同步 broker 成交状态。' : 'Synced broker fill state.'),
                      );
                      setRefreshKey((current) => current + 1);
                    } catch (error) {
                      setPlanMessage(error instanceof Error ? error.message : 'unknown error');
                    } finally {
                      setPlanBusyAction('');
                    }
                  }}
                >
                  {planBusyAction === 'sync'
                    ? (locale === 'zh' ? '同步中...' : 'Syncing...')
                    : (selectedLifecycleStatus === 'submitted' || selectedLifecycleStatus === 'awaiting_approval'
                      ? (locale === 'zh' ? '同步受理' : 'Broker Sync')
                      : (locale === 'zh' ? '同步成交' : 'Sync Fill'))}
                </button>
                <button
                  type="button"
                  className="inline-action"
                  disabled={!canApproveExecution || !selectedEntry || planBusyAction === 'broker-ack'}
                  onClick={async () => {
                    setPlanBusyAction('broker-ack');
                    setPlanMessage('');
                    try {
                      await ingestBrokerExecutionEvent(selectedEntry.plan.id, {
                        actor: 'execution-desk',
                        source: 'broker-webhook',
                        eventType: 'acknowledged',
                        symbol: selectedEntry.orderStates[0]?.symbol,
                        brokerOrderId: selectedEntry.orderStates[0]?.brokerOrderId,
                        message: locale === 'zh' ? '已接收 broker acknowledged 回报。' : 'Ingested broker acknowledged event.',
                      });
                      setPlanMessage(locale === 'zh' ? '已记录 broker 受理回报。' : 'Recorded broker acknowledgement event.');
                      setRefreshKey((current) => current + 1);
                    } catch (error) {
                      setPlanMessage(error instanceof Error ? error.message : 'unknown error');
                    } finally {
                      setPlanBusyAction('');
                    }
                  }}
                >
                  {planBusyAction === 'broker-ack' ? (locale === 'zh' ? '承接中...' : 'Ingesting...') : (locale === 'zh' ? '接收 Ack 回报' : 'Ingest Ack')}
                </button>
                <button
                  type="button"
                  className="inline-action"
                  disabled={!canApproveExecution || !['submitted', 'acknowledged'].includes(selectedLifecycleStatus) || planBusyAction === 'partial-fill'}
                  onClick={async () => {
                    setPlanBusyAction('partial-fill');
                    setPlanMessage('');
                    try {
                      await syncExecutionPlan(selectedEntry.plan.id, { actor: 'execution-desk', scenario: 'partial_fill' });
                      setPlanMessage(locale === 'zh' ? '已模拟部分成交并保留未完成订单。' : 'Simulated a partial fill while keeping open orders active.');
                      setRefreshKey((current) => current + 1);
                    } catch (error) {
                      setPlanMessage(error instanceof Error ? error.message : 'unknown error');
                    } finally {
                      setPlanBusyAction('');
                    }
                  }}
                >
                  {planBusyAction === 'partial-fill' ? (locale === 'zh' ? '处理中...' : 'Processing...') : (locale === 'zh' ? '模拟部分成交' : 'Simulate Partial Fill')}
                </button>
                <button
                  type="button"
                  className="inline-action"
                  disabled={!canApproveExecution || !selectedEntry || planBusyAction === 'broker-fill'}
                  onClick={async () => {
                    setPlanBusyAction('broker-fill');
                    setPlanMessage('');
                    try {
                      const targetOrder = selectedEntry.orderStates[0];
                      await ingestBrokerExecutionEvent(selectedEntry.plan.id, {
                        actor: 'execution-desk',
                        source: 'broker-webhook',
                        eventType: 'filled',
                        symbol: targetOrder?.symbol,
                        brokerOrderId: targetOrder?.brokerOrderId,
                        filledQty: targetOrder?.qty,
                        avgFillPrice: targetOrder?.avgFillPrice || 101.25,
                        message: locale === 'zh' ? '已接收 broker fill 回报。' : 'Ingested broker fill event.',
                      });
                      setPlanMessage(locale === 'zh' ? '已记录 broker 成交回报。' : 'Recorded broker fill event.');
                      setRefreshKey((current) => current + 1);
                    } catch (error) {
                      setPlanMessage(error instanceof Error ? error.message : 'unknown error');
                    } finally {
                      setPlanBusyAction('');
                    }
                  }}
                >
                  {planBusyAction === 'broker-fill' ? (locale === 'zh' ? '承接中...' : 'Ingesting...') : (locale === 'zh' ? '接收 Fill 回报' : 'Ingest Fill')}
                </button>
                <button
                  type="button"
                  className="inline-action"
                  disabled={!canApproveExecution || !['submitted', 'acknowledged', 'partial_fill'].includes(selectedLifecycleStatus) || planBusyAction === 'settle'}
                  onClick={async () => {
                    setPlanBusyAction('settle');
                    setPlanMessage('');
                    try {
                      await settleExecutionPlan(selectedEntry.plan.id, { actor: 'execution-desk', outcome: 'filled' });
                      setPlanMessage(locale === 'zh' ? '已将执行计划推进到 filled。' : 'Moved the execution plan into filled state.');
                      setRefreshKey((current) => current + 1);
                    } catch (error) {
                      setPlanMessage(error instanceof Error ? error.message : 'unknown error');
                    } finally {
                      setPlanBusyAction('');
                    }
                  }}
                >
                  {planBusyAction === 'settle' ? (locale === 'zh' ? '结算中...' : 'Settling...') : (locale === 'zh' ? '标记成交' : 'Mark Filled')}
                </button>
                <button
                  type="button"
                  className="inline-action"
                  disabled={!canApproveExecution || !['awaiting_approval', 'submitted', 'acknowledged'].includes(selectedLifecycleStatus) || planBusyAction === 'cancel'}
                  onClick={async () => {
                    setPlanBusyAction('cancel');
                    setPlanMessage('');
                    try {
                      await cancelExecutionPlan(selectedEntry.plan.id, { actor: 'execution-desk', reason: 'operator_cancelled' });
                      setPlanMessage(locale === 'zh' ? '已取消当前执行计划。' : 'Cancelled the current execution plan.');
                      setRefreshKey((current) => current + 1);
                    } catch (error) {
                      setPlanMessage(error instanceof Error ? error.message : 'unknown error');
                    } finally {
                      setPlanBusyAction('');
                    }
                  }}
                >
                  {planBusyAction === 'cancel' ? (locale === 'zh' ? '取消中...' : 'Cancelling...') : (locale === 'zh' ? '取消计划' : 'Cancel Plan')}
                </button>
                <button
                  type="button"
                  className="inline-action"
                  disabled={!canApproveExecution || !selectedEntry || planBusyAction === 'broker-reject'}
                  onClick={async () => {
                    setPlanBusyAction('broker-reject');
                    setPlanMessage('');
                    try {
                      const targetOrder = selectedEntry.orderStates[0];
                      await ingestBrokerExecutionEvent(selectedEntry.plan.id, {
                        actor: 'execution-desk',
                        source: 'broker-webhook',
                        eventType: 'rejected',
                        symbol: targetOrder?.symbol,
                        brokerOrderId: targetOrder?.brokerOrderId,
                        reason: 'broker_reported_rejection',
                        message: locale === 'zh' ? '已接收 broker reject 回报。' : 'Ingested broker reject event.',
                      });
                      setPlanMessage(locale === 'zh' ? '已记录 broker 拒单回报。' : 'Recorded broker reject event.');
                      setRefreshKey((current) => current + 1);
                    } catch (error) {
                      setPlanMessage(error instanceof Error ? error.message : 'unknown error');
                    } finally {
                      setPlanBusyAction('');
                    }
                  }}
                >
                  {planBusyAction === 'broker-reject' ? (locale === 'zh' ? '承接中...' : 'Ingesting...') : (locale === 'zh' ? '接收 Reject 回报' : 'Ingest Reject')}
                </button>
                <button
                  type="button"
                  className="inline-action"
                  disabled={!canApproveExecution || !selectedEntry || planBusyAction === 'reconcile'}
                  onClick={async () => {
                    setPlanBusyAction('reconcile');
                    setPlanMessage('');
                    try {
                      await reconcileExecutionPlan(selectedEntry.plan.id, { actor: 'execution-desk' });
                      setPlanMessage(locale === 'zh' ? '已记录最新执行对账结果。' : 'Captured the latest execution reconciliation result.');
                      setRefreshKey((current) => current + 1);
                    } catch (error) {
                      setPlanMessage(error instanceof Error ? error.message : 'unknown error');
                    } finally {
                      setPlanBusyAction('');
                    }
                  }}
                >
                  {planBusyAction === 'reconcile' ? (locale === 'zh' ? '对账中...' : 'Reconciling...') : (locale === 'zh' ? '执行对账' : 'Run Reconciliation')}
                </button>
                <button
                  type="button"
                  className="inline-action inline-action-approve"
                  disabled={!canApproveExecution || !selectedEntry || !selectedRecovery || selectedRecovery.recommendedAction === 'none' || planBusyAction === 'recover'}
                  onClick={async () => {
                    setPlanBusyAction('recover');
                    setPlanMessage('');
                    try {
                      const result = await recoverExecutionPlan(selectedEntry.plan.id, { actor: 'execution-desk' });
                      setPlanMessage(
                        locale === 'zh'
                          ? `已执行恢复动作：${result.recoveryAction || selectedRecovery.recommendedAction}。`
                          : `Executed recovery action: ${result.recoveryAction || selectedRecovery.recommendedAction}.`,
                      );
                      setRefreshKey((current) => current + 1);
                    } catch (error) {
                      setPlanMessage(error instanceof Error ? error.message : 'unknown error');
                    } finally {
                      setPlanBusyAction('');
                    }
                  }}
                >
                  {planBusyAction === 'recover'
                    ? (locale === 'zh' ? '恢复中...' : 'Recovering...')
                    : (locale === 'zh' ? '恢复计划' : 'Recover Plan')}
                </button>
                {sourcePage === 'strategies' && requestedStrategyId ? (
                  <button
                    type="button"
                    className="inline-action"
                    onClick={() => researchNavigation.returnToStrategyTimeline()}
                  >
                    {locale === 'zh' ? '返回策略时间线' : 'Return to Strategy Timeline'}
                  </button>
                ) : null}
                {sourcePage === 'backtest' && requestedRunId ? (
                  <button
                    type="button"
                    className="inline-action"
                    onClick={() => researchNavigation.returnToBacktestDetail()}
                  >
                    {locale === 'zh' ? '返回回测详情' : 'Return to Backtest Detail'}
                  </button>
                ) : null}
              </div>
              {planMessage ? <InspectionStatus>{planMessage}</InspectionStatus> : null}
              {selectedExceptionPolicy ? <InspectionStatus>{selectedExceptionPolicy.headline}</InspectionStatus> : null}
              {selectedExceptionPolicy?.reasons?.map((reason) => (
                <InspectionStatus key={`policy-${reason}`}>{reason}</InspectionStatus>
              ))}
              {selectedLinkedIncidents.map((incident) => (
                <InspectionStatus key={incident.id}>
                  {locale === 'zh'
                    ? `关联 Incident ${incident.id}: ${incident.status} / ${incident.title}`
                    : `Linked incident ${incident.id}: ${incident.status} / ${incident.title}`}
                </InspectionStatus>
              ))}
              {selectedRecovery ? <InspectionStatus>{selectedRecovery.headline}</InspectionStatus> : null}
              {selectedRecovery?.reasons?.map((reason) => (
                <InspectionStatus key={reason}>{reason}</InspectionStatus>
              ))}
              <InspectionStatus>{executionDetailInspection.summary}</InspectionStatus>
              <InspectionStatus>{executionDetailInspection.runtimeMessage}</InspectionStatus>
            </div>
          )}
        </InspectionPanel>
        <InspectionPanel
          title={locale === 'zh' ? '执行对账结果' : 'Execution Reconciliation'}
          copy={locale === 'zh' ? '把订单生命周期、成交数量和 broker 快照的持仓数量对到一起。' : 'Align order lifecycle, fill quantity, and broker snapshot positions in one reconciliation view.'}
          badge={selectedReconciliation?.status || '--'}
        >
          {!selectedEntry ? (
            <InspectionStatus>{locale === 'zh' ? '先从账本中选择一个 execution plan。' : 'Select an execution plan from the ledger first.'}</InspectionStatus>
          ) : !selectedReconciliation ? (
            <InspectionStatus>{locale === 'zh' ? '当前还没有对账摘要。' : 'No reconciliation summary is available yet.'}</InspectionStatus>
          ) : (
            <div className="status-stack">
              <div className="status-row"><span>{locale === 'zh' ? '对账状态' : 'Status'}</span><strong>{selectedReconciliation.status}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '问题数' : 'Issues'}</span><strong>{selectedReconciliation.issueCount}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '订单偏差' : 'Order Delta'}</span><strong>{selectedReconciliation.orderCountDelta}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '成交偏差' : 'Fill Delta'}</span><strong>{selectedReconciliation.filledQtyDelta}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '持仓偏差' : 'Position Delta'}</span><strong>{selectedReconciliation.positionDelta}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '最新快照' : 'Snapshot'}</span><strong>{selectedReconciliation.latestSnapshotAt || '--'}</strong></div>
              {!selectedReconciliation.issues.length ? <InspectionStatus>{locale === 'zh' ? '当前 execution lifecycle 与 broker snapshot 已对齐。' : 'The current execution lifecycle is aligned with the linked broker snapshot.'}</InspectionStatus> : null}
              {selectedReconciliation.issues.map((item) => (
                <InspectionStatus key={item.id}>{`${item.title}: ${item.detail} (${item.expected} / ${item.actual})`}</InspectionStatus>
              ))}
            </div>
          )}
        </InspectionPanel>
        <InspectionListPanel
          title={locale === 'zh' ? 'Broker 回报时间线' : 'Broker Event Timeline'}
          copy={locale === 'zh' ? '查看 broker 侧 ack、fill、reject 和 cancel 回报是如何驱动 order state 聚合的。' : 'Review how broker ack, fill, reject, and cancel reports drive order-state aggregation.'}
          badge={String(selectedBrokerEvents.length)}
        >
          {!selectedEntry ? <InspectionStatus>{locale === 'zh' ? '先从账本中选择一个 execution plan。' : 'Select an execution plan from the ledger first.'}</InspectionStatus> : null}
          {selectedEntry && !selectedBrokerEvents.length ? <InspectionStatus>{locale === 'zh' ? '当前 plan 还没有 broker 回报事件。' : 'No broker execution events have been recorded for this plan yet.'}</InspectionStatus> : null}
          {selectedBrokerEvents.map((item) => (
            <InspectionMetricsRow
              key={item.id}
              metrics={[
                { label: locale === 'zh' ? '事件' : 'Event', value: item.eventType },
                { label: locale === 'zh' ? '标的' : 'Symbol', value: item.symbol || '--' },
                { label: locale === 'zh' ? '状态' : 'Status', value: item.status },
                { label: locale === 'zh' ? '成交数量' : 'Filled Qty', value: item.filledQty || '--' },
                { label: locale === 'zh' ? '来源' : 'Source', value: item.source },
                { label: locale === 'zh' ? '时间' : 'Time', value: new Date(item.createdAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US') },
              ]}
            />
          ))}
        </InspectionListPanel>
        <InspectionListPanel
          title={locale === 'zh' ? '订单生命周期' : 'Order Lifecycle'}
          copy={locale === 'zh' ? '查看当前执行计划下每笔订单的 lifecycle 变化。' : 'Inspect lifecycle changes for every order under the selected execution plan.'}
          badge={String(selectedOrderStates.length)}
        >
            {!selectedEntry ? <InspectionStatus>{locale === 'zh' ? '先从账本中选择一个 execution plan。' : 'Select an execution plan from the ledger first.'}</InspectionStatus> : null}
            {selectedEntry && !selectedOrderStates.length ? <InspectionStatus>{locale === 'zh' ? '当前 plan 还没有订单 lifecycle 记录。' : 'No order lifecycle records exist for this plan yet.'}</InspectionStatus> : null}
            {selectedOrderStates.map((item) => (
              <InspectionSelectableRow
                key={item.id}
                leadTitle={`${item.symbol} · ${item.side}`}
                leadCopy={item.summary}
                metrics={[
                  { label: locale === 'zh' ? '状态' : 'Status', value: item.lifecycleStatus },
                  { label: locale === 'zh' ? '数量' : 'Qty', value: item.qty },
                  { label: locale === 'zh' ? '已成交' : 'Filled', value: item.filledQty },
                  { label: locale === 'zh' ? '均价' : 'Avg Fill', value: item.avgFillPrice ?? '--' },
                  { label: locale === 'zh' ? 'Broker ID' : 'Broker ID', value: item.brokerOrderId || '--' },
                ]}
              />
            ))}
        </InspectionListPanel>
        <InspectionListPanel
          title={executionCollectionConfigs.audit.title}
          copy={executionCollectionConfigs.audit.copy}
          badge={executionCollectionConfigs.audit.badge}
          badgeClassName={executionCollectionConfigs.audit.badgeClassName}
        >
            {auditLoading ? <InspectionStatus>{executionCollectionConfigs.audit.loadingMessage}</InspectionStatus> : null}
            {!auditLoading && !selectedEntry ? <InspectionStatus>{executionCollectionConfigs.audit.emptySelectionMessage}</InspectionStatus> : null}
            {!auditLoading && selectedEntry && !selectedExecutionAuditItems.length ? <InspectionStatus>{executionCollectionConfigs.audit.emptyItemsMessage}</InspectionStatus> : null}
            {selectedExecutionAuditItems.map((item) => (
              <InspectionSelectableRow
                key={item.id}
                metrics={[
                  { label: locale === 'zh' ? '标题' : 'Title', value: item.title },
                  { label: locale === 'zh' ? '操作人' : 'Actor', value: item.actor },
                  { label: locale === 'zh' ? '类型' : 'Type', value: item.type },
                  { label: locale === 'zh' ? '时间' : 'Time', value: new Date(item.createdAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US') },
                ]}
                actions={(
                  <button
                    type="button"
                    className="inline-action"
                    disabled={selectedAuditEventId === item.id}
                    onClick={() => setSelectedAuditEventId(item.id)}
                  >
                    {selectedAuditEventId === item.id
                      ? (locale === 'zh' ? '已选中' : 'Selected')
                      : (locale === 'zh' ? '查看' : 'Inspect')}
                  </button>
                )}
              />
            ))}
        </InspectionListPanel>
        <InspectionPanel
          title={executionAuditEventInspection.title}
          copy={executionAuditEventInspection.copy}
          badge={selectedAuditEvent?.type || '--'}
          badgeClassName="badge-warn"
        >
          {executionAuditEventInspection.emptyMessage ? (
            <InspectionStatus>{executionAuditEventInspection.emptyMessage}</InspectionStatus>
          ) : (
            <div className="status-stack">
              {executionAuditEventInspection.metrics.map((metric) => (
                <div key={metric.label} className="status-row"><span>{metric.label}</span><strong>{metric.value}</strong></div>
              ))}
              <InspectionStatus>{executionAuditEventInspection.detail}</InspectionStatus>
            </div>
          )}
        </InspectionPanel>
        <InspectionPanel
          title={executionWorkflowInspection.title}
          copy={executionWorkflowInspection.copy}
          badge={selectedWorkflow?.status || '--'}
        >
          {!selectedEntry ? (
            <InspectionStatus>{executionWorkflowInspection.emptyMessage}</InspectionStatus>
          ) : executionDataLoading ? (
            <InspectionStatus>{executionWorkflowInspection.loadingMessage}</InspectionStatus>
          ) : !selectedWorkflow ? (
            <InspectionStatus>{executionWorkflowInspection.emptyMessage}</InspectionStatus>
          ) : (
            <div className="status-stack">
              {executionWorkflowInspection.metrics.map((metric) => (
                <div key={metric.label} className="status-row"><span>{metric.label}</span><strong>{metric.value}</strong></div>
              ))}
              {selectedWorkflow.steps.length ? (
                <div className="focus-list">
                  {selectedWorkflow.steps.map((step) => (
                    <InspectionSelectableRow
                      key={step.key}
                      metrics={[
                        { label: locale === 'zh' ? '步骤' : 'Step', value: step.key },
                        { label: locale === 'zh' ? '状态' : 'Status', value: step.status },
                      ]}
                      actions={(
                        <button
                          type="button"
                          className="inline-action"
                          disabled={selectedWorkflowStepKey === step.key}
                          onClick={() => setSelectedWorkflowStepKey(step.key)}
                        >
                          {selectedWorkflowStepKey === step.key
                            ? (locale === 'zh' ? '已选中' : 'Selected')
                            : (locale === 'zh' ? '查看' : 'Inspect')}
                        </button>
                      )}
                    />
                  ))}
                </div>
              ) : (
                <InspectionStatus>--</InspectionStatus>
              )}
            </div>
          )}
        </InspectionPanel>
        <InspectionPanel
          title={executionWorkflowStepInspection.title}
          copy={executionWorkflowStepInspection.copy}
          badge={selectedWorkflowStep?.status || '--'}
          badgeClassName="badge-info"
        >
          {executionWorkflowStepInspection.emptyMessage ? (
            <InspectionStatus>{executionWorkflowStepInspection.emptyMessage}</InspectionStatus>
          ) : (
            <div className="status-stack">
              {executionWorkflowStepInspection.metrics.map((metric) => (
                <div key={metric.label} className="status-row"><span>{metric.label}</span><strong>{metric.value}</strong></div>
              ))}
              <InspectionStatus>{executionWorkflowStepInspection.guidance}</InspectionStatus>
            </div>
          )}
        </InspectionPanel>
        <InspectionListPanel
          title={executionCollectionConfigs.actions.title}
          copy={executionCollectionConfigs.actions.copy}
          badge={executionCollectionConfigs.actions.badge}
          badgeClassName={executionCollectionConfigs.actions.badgeClassName}
        >
            {executionDataLoading ? <InspectionStatus>{executionCollectionConfigs.actions.loadingMessage}</InspectionStatus> : null}
            {!executionDataLoading && !selectedEntry ? <InspectionStatus>{executionCollectionConfigs.actions.emptySelectionMessage}</InspectionStatus> : null}
            {!executionDataLoading && selectedEntry && !selectedExecutionActions.length ? <InspectionStatus>{executionCollectionConfigs.actions.emptyItemsMessage}</InspectionStatus> : null}
            {selectedExecutionActions.map((item) => (
              <InspectionMetricsRow
                key={item.id}
                metrics={[
                  { label: locale === 'zh' ? '动作' : 'Action', value: item.type },
                  { label: locale === 'zh' ? '标的' : 'Symbol', value: item.symbol || '--' },
                  { label: locale === 'zh' ? '操作人' : 'Actor', value: item.actor },
                  { label: locale === 'zh' ? '时间' : 'Time', value: new Date(item.createdAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US') },
                ]}
              />
            ))}
        </InspectionListPanel>
        <InspectionPanel
          title={executionSnapshotInspection.title}
          copy={executionSnapshotInspection.copy}
          badge={selectedAccountSnapshot?.provider || '--'}
          badgeClassName="badge-ok"
        >
          {executionSnapshotInspection.emptyMessage ? (
            <InspectionStatus>{executionSnapshotInspection.emptyMessage}</InspectionStatus>
          ) : (
            <div className="status-stack">
              <div className="status-row"><span>{locale === 'zh' ? '提供商' : 'Provider'}</span><strong>{selectedAccountSnapshot.provider}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '周期' : 'Cycle'}</span><strong>{selectedAccountSnapshot.cycle}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '状态' : 'Status'}</span><strong>{selectedAccountSnapshot.connected ? 'connected' : 'disconnected'}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '现金' : 'Cash'}</span><strong>{Number(selectedAccountSnapshot.account?.cash || 0).toFixed(0)}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '持仓数' : 'Positions'}</span><strong>{selectedAccountSnapshot.positions.length}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '订单数' : 'Orders'}</span><strong>{selectedAccountSnapshot.orders.length}</strong></div>
              <InspectionStatus>{selectedAccountSnapshot.message}</InspectionStatus>
            </div>
          )}
        </InspectionPanel>
        <InspectionListPanel
          title={executionCollectionConfigs.versions.title}
          copy={executionCollectionConfigs.versions.copy}
          badge={executionCollectionConfigs.versions.badge}
          badgeClassName={executionCollectionConfigs.versions.badgeClassName}
        >
            {!selectedEntry ? <InspectionStatus>{executionCollectionConfigs.versions.emptySelectionMessage}</InspectionStatus> : null}
            {selectedEntry && !selectedExecutionVersionItems.length ? <InspectionStatus>{executionCollectionConfigs.versions.emptyItemsMessage}</InspectionStatus> : null}
            {selectedExecutionVersionItems.map((item) => {
              const orderCount = typeof item.metadata?.orderCount === 'number' ? item.metadata.orderCount : null;
              const capital = typeof item.metadata?.capital === 'number' ? item.metadata.capital : null;
              const riskStatus = typeof item.metadata?.riskStatus === 'string' ? item.metadata.riskStatus : '--';
              const approvalState = typeof item.metadata?.approvalState === 'string' ? item.metadata.approvalState : '--';
              return (
                <InspectionMetricsRow
                  key={item.id}
                  metrics={[
                    { label: locale === 'zh' ? '时间' : 'Time', value: new Date(item.createdAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US') },
                    { label: locale === 'zh' ? '风控' : 'Risk', value: riskStatus },
                    { label: locale === 'zh' ? '审批' : 'Approval', value: approvalState },
                    { label: locale === 'zh' ? '订单数' : 'Orders', value: orderCount ?? '--' },
                    { label: locale === 'zh' ? '资金规模' : 'Capital', value: capital !== null ? capital.toFixed(0) : '--' },
                  ]}
                />
              );
            })}
        </InspectionListPanel>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.pendingApprovals}</div><div className="panel-copy">{locale === 'zh' ? '人工确认开启时，live 订单先进入这里，批准后才会发往 broker。' : 'When manual approval is enabled, live orders stay here until you release them to the broker.'}</div></div><div className={`panel-badge ${state.approvalQueue.length ? 'badge-warn' : 'badge-muted'}`}>{state.approvalQueue.length}</div></div>
          <ApprovalQueueTable onApprove={approveLiveIntent} onReject={rejectLiveIntent} canReview={canApproveExecution} />
          {actionGuardNotice?.permission === 'execution:approve' ? (
            <div className="status-copy">{formatActionGuardNotice(locale, actionGuardNotice)}</div>
          ) : null}
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.paperOrders}</div><div className="panel-copy">{locale === 'zh' ? '策略测试账户最近 12 笔委托。' : 'Latest 12 orders from the paper account.'}</div></div><div className="panel-badge badge-muted">PAPER</div></div>
          <OrdersTable accountKey="paper" />
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.liveOrderState}</div><div className="panel-copy">{locale === 'zh' ? '查看远程订单状态、部分成交、撤单与成交回报。' : 'Track remote order states, partial fills, cancels, and fill feedback.'}</div></div><div className="panel-badge badge-ok">LIVE</div></div>
          <OrdersTable accountKey="live" />
          {actionGuardNotice?.action === 'cancel-live-order' ? (
            <div className="status-copy">{formatActionGuardNotice(locale, actionGuardNotice)}</div>
          ) : null}
        </article>
      </section>
    </>
  );
}
