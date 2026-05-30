import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  appendIncidentNote,
  approveExecutionPlan,
  bulkUpdateExecutionQueue,
  bulkUpdateIncidentQueue,
  cancelExecutionPlan,
  compensateExecutionPlan,
  fetchIncidentDetail,
  ingestBrokerExecutionEvent,
  queueExecutionCandidateHandoff,
  reconcileExecutionPlan,
  recoverExecutionPlan,
  settleExecutionPlan,
  syncExecutionPlan,
  updateIncident,
} from '../../../app/api/controlPlane.ts';
import { ApprovalQueueTable, OrdersTable } from '../../../components/business/ConsoleTables.tsx';
import { TopMeta } from '../../../components/layout/ConsoleChrome.tsx';
import { useAuditFeed } from '../../../modules/console/useAuditFeed.ts';
import { copy, useLocale } from '../../../modules/console/console.i18n.tsx';
import { translateEngineStatus } from '../../../modules/console/console.utils.ts';
import { readDeepLinkParams } from '../../../modules/console/deepLinks.ts';
import { getExecutionCollectionConfigs } from '../../../modules/console/executionCollectionConfigs.ts';
import {
  getExecutionAuditEventInspectionConfig,
  getExecutionDetailInspectionConfig,
  getExecutionSnapshotInspectionConfig,
  getExecutionWorkflowInspectionConfig,
  getExecutionWorkflowStepInspectionConfig,
} from '../../../modules/console/executionInspectionConfigs.ts';
import {
  collectExecutionIncidentIds,
  type ExecutionQueueFocusKey,
  filterExecutionEntriesByQueueFocus,
  getExecutionQueueFocusOptions,
} from '../../../modules/console/executionOperations.ts';
import { useExecutionConsoleData } from '../../../modules/console/useExecutionConsoleData.ts';
import { useExecutionDetailPanels } from '../../../modules/console/useExecutionDetailPanels.ts';
import { useSyncedQuerySelection } from '../../../modules/console/useSyncedQuerySelection.ts';
import { formatActionGuardNotice } from '../../../modules/permissions/permissionCopy.ts';
import { useResearchNavigationContext } from '../../../modules/research/useResearchNavigationContext.ts';
import { useTradingSystem } from '../../../store/trading-system/TradingSystemProvider.tsx';
import { BulkQueueActionsPanel } from '../components/BulkQueueActionsPanel.tsx';
import { ExecutionDashboardPanel } from '../components/ExecutionDashboardPanel.tsx';
import { ExecutionPlanDetailPanel } from '../components/ExecutionPlanDetailPanel.tsx';
import { ExecutionSummaryPanel } from '../components/ExecutionSummaryPanel.tsx';
import { IncidentTriagePanel } from '../components/IncidentTriagePanel.tsx';
import {
  InspectionListPanel,
  InspectionMetricsRow,
  InspectionPanel,
  InspectionSelectableRow,
  InspectionStatus,
} from '../components/InspectionPanels.tsx';

export function ExecutionPage() {
  const { state, approveLiveIntent, rejectLiveIntent, hasPermission, actionGuardNotice } =
    useTradingSystem();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [handoffBusyId, setHandoffBusyId] = useState('');
  const [handoffMessage, setHandoffMessage] = useState('');
  const [planBusyAction, setPlanBusyAction] = useState('');
  const [planMessage, setPlanMessage] = useState('');
  const [incidentBusyAction, setIncidentBusyAction] = useState('');
  const [incidentMessage, setIncidentMessage] = useState('');
  const [incidentNoteDraft, setIncidentNoteDraft] = useState('');
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [queueFocus, setQueueFocus] = useState<ExecutionQueueFocusKey>('all');
  const [selectedIncidentDetail, setSelectedIncidentDetail] = useState<any>(null);
  const researchNavigation = useResearchNavigationContext(searchParams, navigate);
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
  const { selectedId: selectedPlanId, setSelectedId: setSelectedPlanId } = useSyncedQuerySelection({
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
  const { selectedId: selectedAuditEventId, setSelectedId: setSelectedAuditEventId } =
    useSyncedQuerySelection({
      itemIds: executionPanelBase.selectedExecutionAuditItems.map((item) => item.id),
      queryKey: 'audit',
      requestedId: requestedAuditEventId,
      searchParams,
      setSearchParams,
    });
  const { selectedId: selectedWorkflowStepKey, setSelectedId: setSelectedWorkflowStepKey } =
    useSyncedQuerySelection({
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
  const executionAuditEventInspection = getExecutionAuditEventInspectionConfig(
    locale,
    selectedEntry,
    selectedAuditEvent
  );
  const executionWorkflowInspection = getExecutionWorkflowInspectionConfig(
    locale,
    selectedEntry,
    selectedWorkflow,
    executionDataLoading
  );
  const executionWorkflowStepInspection = getExecutionWorkflowStepInspectionConfig(
    locale,
    selectedEntry,
    selectedWorkflowStep
  );
  const executionSnapshotInspection = getExecutionSnapshotInspectionConfig(
    locale,
    selectedEntry,
    selectedAccountSnapshot
  );
  const executionCollectionConfigs = getExecutionCollectionConfigs(locale, {
    audit: selectedExecutionAuditItems.length,
    actions: selectedExecutionActions.length,
    versions: selectedExecutionVersionItems.length,
    evidence: selectedEntry ? 1 : 0,
    recovery: 0,
  });
  const selectedLifecycleStatus =
    selectedEntry?.executionRun?.lifecycleStatus || selectedEntry?.plan.lifecycleStatus || '--';
  const selectedOrderStates = selectedEntry?.orderStates || [];
  const selectedSubmittedCount = selectedEntry?.executionRun?.submittedOrderCount || 0;
  const selectedAcknowledgedCount = selectedOrderStates.filter(
    (item) => item.lifecycleStatus === 'acknowledged'
  ).length;
  const selectedFilledCount = selectedEntry?.executionRun?.filledOrderCount || 0;
  const selectedReconciliation = selectedEntry?.reconciliation;
  const selectedCompensation = selectedEntry?.compensation;
  const selectedExceptionPolicy = selectedEntry?.exceptionPolicy;
  const selectedRecovery = selectedEntry?.recovery;
  const selectedBrokerEvents = selectedEntry?.brokerEvents || [];
  const selectedLinkedIncidents = selectedEntry?.linkedIncidents || [];
  const workbenchSummary = workbench?.summary;
  const workbenchOperations = workbench?.operations;
  const selectedPlanCount = selectedPlanIds.length;
  const selectedIncidentIds = collectExecutionIncidentIds(ledgerEntries, selectedPlanIds);
  const approvalQueueIds =
    workbenchOperations?.queues.approvals.map((entry) => entry.plan.id) || [];
  const retryQueueIds =
    workbenchOperations?.queues.retryEligible.map((entry) => entry.plan.id) || [];
  const compensationQueueIds =
    workbenchOperations?.queues.compensation.map((entry) => entry.plan.id) || [];
  const automationQueueIds =
    workbenchOperations?.queues.compensationAutomation.map((entry) => entry.plan.id) || [];
  const incidentQueueIds =
    workbenchOperations?.queues.incidents.map((entry) => entry.plan.id) || [];
  const queueFocusOptions = getExecutionQueueFocusOptions(locale, workbenchOperations);
  const focusedLedgerEntries = filterExecutionEntriesByQueueFocus(
    ledgerEntries,
    queueFocus,
    workbenchOperations
  );
  const selectedExecutionIncident =
    selectedLinkedIncidents.find((incident) => incident.id === selectedIncidentId) ||
    selectedLinkedIncidents.find((incident) => incident.status !== 'resolved') ||
    selectedLinkedIncidents[0] ||
    null;
  const planSummary = ledgerEntries.reduce(
    (acc, entry) => {
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
    },
    {
      awaitingApproval: 0,
      routing: 0,
      submitted: 0,
      acknowledged: 0,
      filled: 0,
      blocked: 0,
      cancelled: 0,
      failed: 0,
    }
  );

  useEffect(() => {
    const validIds = new Set(ledgerEntries.map((entry) => entry.plan.id));
    setSelectedPlanIds((current) => current.filter((item) => validIds.has(item)));
  }, [ledgerEntries]);

  useEffect(() => {
    const focusedIds = focusedLedgerEntries.map((entry) => entry.plan.id);
    if (!focusedIds.length) return;
    if (!selectedPlanId || !focusedIds.includes(selectedPlanId)) {
      setSelectedPlanId(focusedIds[0]);
    }
  }, [focusedLedgerEntries, selectedPlanId, setSelectedPlanId]);

  useEffect(() => {
    if (!selectedLinkedIncidents.length) {
      setSelectedIncidentId('');
      return;
    }
    if (!selectedLinkedIncidents.some((incident) => incident.id === selectedIncidentId)) {
      setSelectedIncidentId(
        selectedLinkedIncidents.find((incident) => incident.status !== 'resolved')?.id ||
          selectedLinkedIncidents[0]?.id ||
          ''
      );
    }
  }, [selectedIncidentId, selectedLinkedIncidents]);

  useEffect(() => {
    let active = true;
    if (!selectedExecutionIncident?.id) {
      setSelectedIncidentDetail(null);
      return () => {
        active = false;
      };
    }

    fetchIncidentDetail(selectedExecutionIncident.id)
      .then((detail) => {
        if (active) setSelectedIncidentDetail(detail);
      })
      .catch(() => {
        if (active) setSelectedIncidentDetail(null);
      });

    return () => {
      active = false;
    };
  }, [refreshKey, selectedExecutionIncident?.id]);

  function togglePlanSelection(planId: string) {
    setSelectedPlanIds((current) =>
      current.includes(planId) ? current.filter((item) => item !== planId) : [...current, planId]
    );
  }

  function replaceSelection(planIds: string[]) {
    const nextIds = [...new Set(planIds.filter(Boolean))];
    setSelectedPlanIds(nextIds);
  }

  async function runBulkIncidentAction(payload: Record<string, unknown>, successMessage: string) {
    if (!selectedIncidentIds.length) return;
    setIncidentBusyAction('bulk-incident');
    setIncidentMessage('');
    try {
      const result = await bulkUpdateIncidentQueue({
        incidentIds: selectedIncidentIds,
        actor: state.controlPlane.operator,
        ...payload,
      });
      setIncidentMessage(`${successMessage} (${result.updatedIds.length})`);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setIncidentMessage(error instanceof Error ? error.message : 'unknown error');
    } finally {
      setIncidentBusyAction('');
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">{copy[locale].desk.execution}</div>
          <h1>{copy[locale].pages.execution[0]}</h1>
          <p className="topbar-copy">{copy[locale].pages.execution[1]}</p>
        </div>
        <TopMeta
          items={[
            { label: copy[locale].labels.marketClock, value: state.marketClock },
            {
              label: copy[locale].labels.systemStatus,
              value: translateEngineStatus(locale, state.engineStatus),
              accent: true,
            },
            { label: copy[locale].terms.fillCount, value: String(state.activityLog.length) },
          ]}
        />
      </header>

      <ExecutionSummaryPanel locale={locale} state={state} />

      <ExecutionDashboardPanel
        locale={locale}
        workbenchSummary={workbenchSummary}
        workbenchOperations={workbenchOperations}
        planSummary={planSummary}
        ledgerEntries={ledgerEntries}
        runtimeEvents={runtimeEvents}
        accountSnapshots={accountSnapshots}
        executionDataLoading={executionDataLoading}
        executionDataError={executionDataError}
        queueFocus={queueFocus}
        onQueueFocusChange={setQueueFocus}
      />

      <section className="panel-grid panel-grid-wide">
        <BulkQueueActionsPanel
          locale={locale}
          selectedPlanCount={selectedPlanCount}
          approvalQueueIds={approvalQueueIds}
          retryQueueIds={retryQueueIds}
          automationQueueIds={automationQueueIds}
          compensationQueueIds={compensationQueueIds}
          incidentQueueIds={incidentQueueIds}
          selectedPlanIds={selectedPlanIds}
          selectedIncidentIds={selectedIncidentIds}
          canApproveExecution={canApproveExecution}
          operator={state.controlPlane.operator}
          onReplaceSelection={replaceSelection}
          onSetQueueFocus={setQueueFocus}
          onClearSelection={() => setSelectedPlanIds([])}
          onRefresh={() => setRefreshKey((c) => c + 1)}
        />
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">
                {locale === 'zh' ? '研究执行交接台' : 'Research Execution Handoffs'}
              </div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '查看研究侧正式移交过来的执行候选对象，并从这里把它们排队进入 execution workflow。'
                  : 'Review formal handoff objects coming from research and queue them into execution workflows from one place.'}
              </div>
            </div>
            <div className="panel-badge badge-info">{handoffs.length}</div>
          </div>
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
                actions={
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
                      disabled={
                        !canApproveExecution ||
                        handoff.handoffStatus !== 'ready' ||
                        handoffBusyId === handoff.id
                      }
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
                              : `Queued ${handoff.strategyName} handoff into workflow ${result.workflow?.id || ''}.`
                          );
                          setRefreshKey((current) => current + 1);
                        } catch (error) {
                          setHandoffMessage(
                            error instanceof Error ? error.message : 'unknown error'
                          );
                        } finally {
                          setHandoffBusyId('');
                        }
                      }}
                    >
                      {handoffBusyId === handoff.id
                        ? locale === 'zh'
                          ? '排队中...'
                          : 'Queueing...'
                        : locale === 'zh'
                          ? '排队执行'
                          : 'Queue Execution'}
                    </button>
                  </div>
                }
              />
            ))}
            {!handoffs.length ? (
              <div className="status-copy">
                {executionDataLoading
                  ? locale === 'zh'
                    ? '正在同步交接对象...'
                    : 'Syncing handoffs...'
                  : locale === 'zh'
                    ? '当前还没有研究侧移交过来的执行候选对象。'
                    : 'No research execution handoffs are available yet.'}
              </div>
            ) : null}
            {!canApproveExecution ? (
              <div className="status-copy">
                {locale === 'zh'
                  ? '当前没有 execution:approve 权限，无法将交接对象排队到执行 workflow。'
                  : 'You do not have execution:approve permission to queue handoffs into execution workflows.'}
              </div>
            ) : null}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">
                {locale === 'zh' ? '执行计划账本' : 'Execution Plan Ledger'}
              </div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '把 execution plan、workflow 状态和最新服务端执行结果放到同一视图。'
                  : 'A single view for execution plans, workflow status, and the latest backend execution result.'}
              </div>
            </div>
            <div className="panel-badge badge-info">{focusedLedgerEntries.length}</div>
          </div>
          <div className="focus-list">
            <div className="status-copy">
              {locale === 'zh'
                ? `当前聚焦：${queueFocusOptions.find((item) => item.key === queueFocus)?.label || '全部计划'}`
                : `Current focus: ${queueFocusOptions.find((item) => item.key === queueFocus)?.label || 'All Plans'}`}
            </div>
            {focusedLedgerEntries.slice(0, 6).map((entry) => (
              <InspectionSelectableRow
                key={entry.plan.id}
                metrics={[
                  { label: locale === 'zh' ? '策略' : 'Strategy', value: entry.plan.strategyName },
                  {
                    label: locale === 'zh' ? '执行阶段' : 'Lifecycle',
                    value: entry.executionRun?.lifecycleStatus || entry.plan.lifecycleStatus,
                  },
                  {
                    label: locale === 'zh' ? '工作流' : 'Workflow',
                    value: entry.workflow?.status || '--',
                  },
                  {
                    label: locale === 'zh' ? '订单进度' : 'Order Progress',
                    value: entry.executionRun
                      ? `${entry.executionRun.filledOrderCount}/${entry.executionRun.orderCount}`
                      : '--',
                  },
                ]}
                actions={
                  <div className="action-group">
                    <button
                      type="button"
                      className="inline-action"
                      onClick={() => togglePlanSelection(entry.plan.id)}
                    >
                      {selectedPlanIds.includes(entry.plan.id)
                        ? locale === 'zh'
                          ? '取消选择'
                          : 'Deselect'
                        : locale === 'zh'
                          ? '加入批量'
                          : 'Select'}
                    </button>
                    <button
                      type="button"
                      className="inline-action"
                      disabled={selectedPlanId === entry.plan.id}
                      onClick={() => setSelectedPlanId(entry.plan.id)}
                    >
                      {selectedPlanId === entry.plan.id
                        ? locale === 'zh'
                          ? '已选中'
                          : 'Selected'
                        : locale === 'zh'
                          ? '查看'
                          : 'Inspect'}
                    </button>
                  </div>
                }
              />
            ))}
            {!focusedLedgerEntries.length ? (
              <div className="status-copy">
                {executionDataLoading
                  ? locale === 'zh'
                    ? '正在同步执行账本...'
                    : 'Syncing execution ledger...'
                  : locale === 'zh'
                    ? '当前聚焦队列中还没有 execution plan。'
                    : 'No execution plans are available in the current queue focus.'}
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="panel-grid panel-grid-wide">
        <ExecutionPlanDetailPanel
          locale={locale}
          selectedEntry={selectedEntry}
          executionDetailInspection={executionDetailInspection}
          selectedLifecycleStatus={selectedLifecycleStatus}
          selectedSubmittedCount={selectedSubmittedCount}
          selectedAcknowledgedCount={selectedAcknowledgedCount}
          selectedFilledCount={selectedFilledCount}
          selectedReconciliation={selectedReconciliation}
          selectedCompensation={selectedCompensation}
          selectedExceptionPolicy={selectedExceptionPolicy}
          selectedRecovery={selectedRecovery}
          selectedBrokerEvents={selectedBrokerEvents}
          selectedLinkedIncidents={selectedLinkedIncidents}
          canApproveExecution={canApproveExecution}
          sourcePage={sourcePage}
          requestedStrategyId={requestedStrategyId}
          requestedRunId={requestedRunId}
          onApproveExecutionPlan={approveExecutionPlan}
          onSyncExecutionPlan={syncExecutionPlan}
          onIngestBrokerExecutionEvent={ingestBrokerExecutionEvent}
          onSettleExecutionPlan={settleExecutionPlan}
          onCancelExecutionPlan={cancelExecutionPlan}
          onCompensateExecutionPlan={compensateExecutionPlan}
          onReconcileExecutionPlan={reconcileExecutionPlan}
          onRecoverExecutionPlan={recoverExecutionPlan}
          onOpenStrategyDetail={researchNavigation.openStrategyDetail}
          onReturnToStrategyTimeline={researchNavigation.returnToStrategyTimeline}
          onReturnToBacktestDetail={researchNavigation.returnToBacktestDetail}
          onRefresh={() => setRefreshKey((c) => c + 1)}
        />
        <InspectionPanel
          title={locale === 'zh' ? '执行对账结果' : 'Execution Reconciliation'}
          copy={
            locale === 'zh'
              ? '把订单生命周期、成交数量、持仓和账户资金一起对到最新 broker 快照。'
              : 'Align order lifecycle, fills, positions, and account balances against the latest broker snapshot.'
          }
          badge={selectedReconciliation?.status || '--'}
        >
          {!selectedEntry ? (
            <InspectionStatus>
              {locale === 'zh'
                ? '先从账本中选择一个 execution plan。'
                : 'Select an execution plan from the ledger first.'}
            </InspectionStatus>
          ) : !selectedReconciliation ? (
            <InspectionStatus>
              {locale === 'zh'
                ? '当前还没有对账摘要。'
                : 'No reconciliation summary is available yet.'}
            </InspectionStatus>
          ) : (
            <div className="status-stack">
              <div className="status-row">
                <span>{locale === 'zh' ? '对账状态' : 'Status'}</span>
                <strong>{selectedReconciliation.status}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '问题数' : 'Issues'}</span>
                <strong>{selectedReconciliation.issueCount}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '订单偏差' : 'Order Delta'}</span>
                <strong>{selectedReconciliation.orderCountDelta}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '成交偏差' : 'Fill Delta'}</span>
                <strong>{selectedReconciliation.filledQtyDelta}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '持仓偏差' : 'Position Delta'}</span>
                <strong>{selectedReconciliation.positionDelta}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '账户状态' : 'Account Status'}</span>
                <strong>{selectedReconciliation.accountStatus}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '现金偏差' : 'Cash Delta'}</span>
                <strong>{Number(selectedReconciliation.cashDelta || 0).toFixed(2)}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '买力偏差' : 'Buying Power Delta'}</span>
                <strong>{Number(selectedReconciliation.buyingPowerDelta || 0).toFixed(2)}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '权益偏差' : 'Equity Delta'}</span>
                <strong>{Number(selectedReconciliation.equityDelta || 0).toFixed(2)}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '已部署资金' : 'Deployed Capital'}</span>
                <strong>{Number(selectedReconciliation.deployedCapital || 0).toFixed(2)}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '剩余资金' : 'Residual Capital'}</span>
                <strong>{Number(selectedReconciliation.residualCapital || 0).toFixed(2)}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '快照节奏' : 'Snapshot Cadence'}</span>
                <strong>{selectedReconciliation.cadence?.status || 'missing_runtime'}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '快照滞后(分钟)' : 'Snapshot Lag (min)'}</span>
                <strong>{Number(selectedReconciliation.cadence?.snapshotLagMinutes || 0)}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '最新快照' : 'Snapshot'}</span>
                <strong>{selectedReconciliation.latestSnapshotAt || '--'}</strong>
              </div>
              {!selectedReconciliation.issues.length ? (
                <InspectionStatus>
                  {locale === 'zh'
                    ? '当前 execution lifecycle 与 broker snapshot 已对齐。'
                    : 'The current execution lifecycle is aligned with the linked broker snapshot.'}
                </InspectionStatus>
              ) : null}
              {selectedReconciliation.issues.map((item) => (
                <InspectionStatus
                  key={item.id}
                >{`${item.title}: ${item.detail} (${item.expected} / ${item.actual})`}</InspectionStatus>
              ))}
            </div>
          )}
        </InspectionPanel>
        <InspectionPanel
          title={locale === 'zh' ? '自动补偿计划' : 'Compensation Plan'}
          copy={
            locale === 'zh'
              ? '把自动补偿拆成标准步骤，明确哪些动作会自动跑，哪些还要 operator 跟进。'
              : 'Break compensation into standard steps so the desk can see what automation will run and what still needs operator follow-up.'
          }
          badge={selectedCompensation?.status || '--'}
        >
          {!selectedEntry ? (
            <InspectionStatus>
              {locale === 'zh'
                ? '先从账本中选择一个 execution plan。'
                : 'Select an execution plan from the ledger first.'}
            </InspectionStatus>
          ) : !selectedCompensation ? (
            <InspectionStatus>
              {locale === 'zh'
                ? '当前还没有自动补偿计划。'
                : 'No compensation plan is available yet.'}
            </InspectionStatus>
          ) : (
            <div className="status-stack">
              <div className="status-row">
                <span>{locale === 'zh' ? '补偿状态' : 'Status'}</span>
                <strong>{selectedCompensation.status}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '补偿模式' : 'Mode'}</span>
                <strong>{selectedCompensation.mode}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '推荐动作' : 'Recommended Action'}</span>
                <strong>{selectedCompensation.recommendedAction}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '自动可执行' : 'Auto Executable'}</span>
                <strong>
                  {selectedCompensation.autoExecutable
                    ? locale === 'zh'
                      ? '是'
                      : 'Yes'
                    : locale === 'zh'
                      ? '否'
                      : 'No'}
                </strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '关联 Incident' : 'Linked Incident'}</span>
                <strong>{selectedCompensation.linkedIncidentId || '--'}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '最近自动执行' : 'Last Automated'}</span>
                <strong>{selectedCompensation.lastAutomatedAt || '--'}</strong>
              </div>
              <InspectionStatus>{selectedCompensation.headline}</InspectionStatus>
              {selectedCompensation.reasons.map((reason) => (
                <InspectionStatus key={`comp-reason-${reason}`}>{reason}</InspectionStatus>
              ))}
              {selectedCompensation.steps.map((step) => (
                <InspectionStatus key={step.key}>
                  {step.automated ? '[auto]' : '[manual]'} {step.title}: {step.status} ·{' '}
                  {step.detail}
                </InspectionStatus>
              ))}
            </div>
          )}
        </InspectionPanel>
        <IncidentTriagePanel
          locale={locale}
          selectedEntry={selectedEntry}
          selectedExecutionIncident={selectedExecutionIncident}
          selectedLinkedIncidents={selectedLinkedIncidents}
          selectedIncidentId={selectedIncidentId}
          selectedIncidentDetail={selectedIncidentDetail}
          canApproveExecution={canApproveExecution}
          operator={state.controlPlane.operator}
          onSelectedIncidentIdChange={setSelectedIncidentId}
          onUpdateIncident={updateIncident}
          onAppendIncidentNote={appendIncidentNote}
          onRefresh={() => setRefreshKey((c) => c + 1)}
          onNavigate={(path) => navigate(path)}
        />
        <InspectionListPanel
          title={locale === 'zh' ? 'Broker 回报时间线' : 'Broker Event Timeline'}
          copy={
            locale === 'zh'
              ? '查看 broker 侧 ack、fill、reject 和 cancel 回报是如何驱动 order state 聚合的。'
              : 'Review how broker ack, fill, reject, and cancel reports drive order-state aggregation.'
          }
          badge={String(selectedBrokerEvents.length)}
        >
          {!selectedEntry ? (
            <InspectionStatus>
              {locale === 'zh'
                ? '先从账本中选择一个 execution plan。'
                : 'Select an execution plan from the ledger first.'}
            </InspectionStatus>
          ) : null}
          {selectedEntry && !selectedBrokerEvents.length ? (
            <InspectionStatus>
              {locale === 'zh'
                ? '当前 plan 还没有 broker 回报事件。'
                : 'No broker execution events have been recorded for this plan yet.'}
            </InspectionStatus>
          ) : null}
          {selectedBrokerEvents.map((item) => (
            <InspectionMetricsRow
              key={item.id}
              metrics={[
                { label: locale === 'zh' ? '事件' : 'Event', value: item.eventType },
                { label: locale === 'zh' ? '标的' : 'Symbol', value: item.symbol || '--' },
                { label: locale === 'zh' ? '状态' : 'Status', value: item.status },
                {
                  label: locale === 'zh' ? '成交数量' : 'Filled Qty',
                  value: item.filledQty || '--',
                },
                { label: locale === 'zh' ? '来源' : 'Source', value: item.source },
                {
                  label: locale === 'zh' ? '时间' : 'Time',
                  value: new Date(item.createdAt).toLocaleString(
                    locale === 'zh' ? 'zh-CN' : 'en-US'
                  ),
                },
              ]}
            />
          ))}
        </InspectionListPanel>
        <InspectionListPanel
          title={locale === 'zh' ? '订单生命周期' : 'Order Lifecycle'}
          copy={
            locale === 'zh'
              ? '查看当前执行计划下每笔订单的 lifecycle 变化。'
              : 'Inspect lifecycle changes for every order under the selected execution plan.'
          }
          badge={String(selectedOrderStates.length)}
        >
          {!selectedEntry ? (
            <InspectionStatus>
              {locale === 'zh'
                ? '先从账本中选择一个 execution plan。'
                : 'Select an execution plan from the ledger first.'}
            </InspectionStatus>
          ) : null}
          {selectedEntry && !selectedOrderStates.length ? (
            <InspectionStatus>
              {locale === 'zh'
                ? '当前 plan 还没有订单 lifecycle 记录。'
                : 'No order lifecycle records exist for this plan yet.'}
            </InspectionStatus>
          ) : null}
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
                {
                  label: locale === 'zh' ? 'Broker ID' : 'Broker ID',
                  value: item.brokerOrderId || '--',
                },
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
          {auditLoading ? (
            <InspectionStatus>{executionCollectionConfigs.audit.loadingMessage}</InspectionStatus>
          ) : null}
          {!auditLoading && !selectedEntry ? (
            <InspectionStatus>
              {executionCollectionConfigs.audit.emptySelectionMessage}
            </InspectionStatus>
          ) : null}
          {!auditLoading && selectedEntry && !selectedExecutionAuditItems.length ? (
            <InspectionStatus>
              {executionCollectionConfigs.audit.emptyItemsMessage}
            </InspectionStatus>
          ) : null}
          {selectedExecutionAuditItems.map((item) => (
            <InspectionSelectableRow
              key={item.id}
              metrics={[
                { label: locale === 'zh' ? '标题' : 'Title', value: item.title },
                { label: locale === 'zh' ? '操作人' : 'Actor', value: item.actor },
                { label: locale === 'zh' ? '类型' : 'Type', value: item.type },
                {
                  label: locale === 'zh' ? '时间' : 'Time',
                  value: new Date(item.createdAt).toLocaleString(
                    locale === 'zh' ? 'zh-CN' : 'en-US'
                  ),
                },
              ]}
              actions={
                <button
                  type="button"
                  className="inline-action"
                  disabled={selectedAuditEventId === item.id}
                  onClick={() => setSelectedAuditEventId(item.id)}
                >
                  {selectedAuditEventId === item.id
                    ? locale === 'zh'
                      ? '已选中'
                      : 'Selected'
                    : locale === 'zh'
                      ? '查看'
                      : 'Inspect'}
                </button>
              }
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
                <div key={metric.label} className="status-row">
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
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
                <div key={metric.label} className="status-row">
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
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
                      actions={
                        <button
                          type="button"
                          className="inline-action"
                          disabled={selectedWorkflowStepKey === step.key}
                          onClick={() => setSelectedWorkflowStepKey(step.key)}
                        >
                          {selectedWorkflowStepKey === step.key
                            ? locale === 'zh'
                              ? '已选中'
                              : 'Selected'
                            : locale === 'zh'
                              ? '查看'
                              : 'Inspect'}
                        </button>
                      }
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
                <div key={metric.label} className="status-row">
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
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
          {executionDataLoading ? (
            <InspectionStatus>{executionCollectionConfigs.actions.loadingMessage}</InspectionStatus>
          ) : null}
          {!executionDataLoading && !selectedEntry ? (
            <InspectionStatus>
              {executionCollectionConfigs.actions.emptySelectionMessage}
            </InspectionStatus>
          ) : null}
          {!executionDataLoading && selectedEntry && !selectedExecutionActions.length ? (
            <InspectionStatus>
              {executionCollectionConfigs.actions.emptyItemsMessage}
            </InspectionStatus>
          ) : null}
          {selectedExecutionActions.map((item) => (
            <InspectionMetricsRow
              key={item.id}
              metrics={[
                { label: locale === 'zh' ? '动作' : 'Action', value: item.type },
                { label: locale === 'zh' ? '标的' : 'Symbol', value: item.symbol || '--' },
                { label: locale === 'zh' ? '操作人' : 'Actor', value: item.actor },
                {
                  label: locale === 'zh' ? '时间' : 'Time',
                  value: new Date(item.createdAt).toLocaleString(
                    locale === 'zh' ? 'zh-CN' : 'en-US'
                  ),
                },
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
              <div className="status-row">
                <span>{locale === 'zh' ? '提供商' : 'Provider'}</span>
                <strong>{selectedAccountSnapshot.provider}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '周期' : 'Cycle'}</span>
                <strong>{selectedAccountSnapshot.cycle}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '状态' : 'Status'}</span>
                <strong>{selectedAccountSnapshot.connected ? 'connected' : 'disconnected'}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '现金' : 'Cash'}</span>
                <strong>{Number(selectedAccountSnapshot.account?.cash || 0).toFixed(0)}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '买力' : 'Buying Power'}</span>
                <strong>
                  {Number(selectedAccountSnapshot.account?.buyingPower || 0).toFixed(0)}
                </strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '权益' : 'Equity'}</span>
                <strong>{Number(selectedAccountSnapshot.account?.equity || 0).toFixed(0)}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '持仓数' : 'Positions'}</span>
                <strong>{selectedAccountSnapshot.positions.length}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '订单数' : 'Orders'}</span>
                <strong>{selectedAccountSnapshot.orders.length}</strong>
              </div>
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
          {!selectedEntry ? (
            <InspectionStatus>
              {executionCollectionConfigs.versions.emptySelectionMessage}
            </InspectionStatus>
          ) : null}
          {selectedEntry && !selectedExecutionVersionItems.length ? (
            <InspectionStatus>
              {executionCollectionConfigs.versions.emptyItemsMessage}
            </InspectionStatus>
          ) : null}
          {selectedExecutionVersionItems.map((item) => {
            const orderCount =
              typeof item.metadata?.orderCount === 'number' ? item.metadata.orderCount : null;
            const capital =
              typeof item.metadata?.capital === 'number' ? item.metadata.capital : null;
            const riskStatus =
              typeof item.metadata?.riskStatus === 'string' ? item.metadata.riskStatus : '--';
            const approvalState =
              typeof item.metadata?.approvalState === 'string' ? item.metadata.approvalState : '--';
            return (
              <InspectionMetricsRow
                key={item.id}
                metrics={[
                  {
                    label: locale === 'zh' ? '时间' : 'Time',
                    value: new Date(item.createdAt).toLocaleString(
                      locale === 'zh' ? 'zh-CN' : 'en-US'
                    ),
                  },
                  { label: locale === 'zh' ? '风控' : 'Risk', value: riskStatus },
                  { label: locale === 'zh' ? '审批' : 'Approval', value: approvalState },
                  { label: locale === 'zh' ? '订单数' : 'Orders', value: orderCount ?? '--' },
                  {
                    label: locale === 'zh' ? '资金规模' : 'Capital',
                    value: capital !== null ? capital.toFixed(0) : '--',
                  },
                ]}
              />
            );
          })}
        </InspectionListPanel>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{copy[locale].terms.pendingApprovals}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '人工确认开启时，live 订单先进入这里，批准后才会发往 broker。'
                  : 'When manual approval is enabled, live orders stay here until you release them to the broker.'}
              </div>
            </div>
            <div
              className={`panel-badge ${state.approvalQueue.length ? 'badge-warn' : 'badge-muted'}`}
            >
              {state.approvalQueue.length}
            </div>
          </div>
          <ApprovalQueueTable
            onApprove={approveLiveIntent}
            onReject={rejectLiveIntent}
            canReview={canApproveExecution}
          />
          {actionGuardNotice?.permission === 'execution:approve' ? (
            <div className="status-copy">{formatActionGuardNotice(locale, actionGuardNotice)}</div>
          ) : null}
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{copy[locale].terms.paperOrders}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '策略测试账户最近 12 笔委托。'
                  : 'Latest 12 orders from the paper account.'}
              </div>
            </div>
            <div className="panel-badge badge-muted">PAPER</div>
          </div>
          <OrdersTable accountKey="paper" />
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{copy[locale].terms.liveOrderState}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '查看远程订单状态、部分成交、撤单与成交回报。'
                  : 'Track remote order states, partial fills, cancels, and fill feedback.'}
              </div>
            </div>
            <div className="panel-badge badge-ok">LIVE</div>
          </div>
          <OrdersTable accountKey="live" />
          {actionGuardNotice?.action === 'cancel-live-order' ? (
            <div className="status-copy">{formatActionGuardNotice(locale, actionGuardNotice)}</div>
          ) : null}
        </article>
      </section>

      <section className="panel-grid panel-grid-3">
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{copy[locale].terms.algoOrders}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '支持 TWAP、VWAP、冰山单三种算法策略，将大额委托拆分为多笔小单执行。'
                  : 'Supports TWAP, VWAP, and Iceberg strategies to split large orders into smaller legs.'}
              </div>
            </div>
            <div className="panel-badge badge-muted">ALGO</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{copy[locale].terms.algoStrategy}</th>
                  <th>{locale === 'zh' ? '说明' : 'Description'}</th>
                  <th>{copy[locale].terms.legs}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>{copy[locale].terms.twap}</strong>
                  </td>
                  <td className="table-note">
                    {locale === 'zh'
                      ? '等时切片，均匀分配数量'
                      : 'Equal time slices, uniform qty split'}
                  </td>
                  <td>{locale === 'zh' ? '可配置' : 'Configurable'}</td>
                </tr>
                <tr>
                  <td>
                    <strong>{copy[locale].terms.vwap}</strong>
                  </td>
                  <td className="table-note">
                    {locale === 'zh' ? '按成交量分布加权' : 'Weighted by volume profile'}
                  </td>
                  <td>{locale === 'zh' ? '按分布' : 'By profile'}</td>
                </tr>
                <tr>
                  <td>
                    <strong>{copy[locale].terms.iceberg}</strong>
                  </td>
                  <td className="table-note">
                    {locale === 'zh'
                      ? '仅显示部分数量，隐藏真实规模'
                      : 'Display partial qty, hide true size'}
                  </td>
                  <td>{locale === 'zh' ? '按显示量' : 'By display qty'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">
                {locale === 'zh' ? '订单生命周期' : 'Order Lifecycle'}
              </div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '算法委托经过状态机流转，支持部分成交、超时和取消。'
                  : 'Algo orders go through state machine with partial fills, timeout, and cancel support.'}
              </div>
            </div>
            <div className="panel-badge badge-muted">FSM</div>
          </div>
          <div style={{ padding: '12px 16px', fontSize: '13px', lineHeight: '1.8' }}>
            <div>
              <code>pending</code> → <code>submitted</code> → <code>partial_fill</code> →{' '}
              <code>filled</code>
            </div>
            <div style={{ marginTop: '4px', opacity: 0.7 }}>
              ↳ <code>cancelled</code> | <code>rejected</code> | <code>expired</code>
            </div>
            <div style={{ marginTop: '12px', fontSize: '12px', opacity: 0.6 }}>
              {locale === 'zh'
                ? '每个 leg 独立跟踪成交，整体状态由所有 leg 聚合决定。'
                : 'Each leg tracks fills independently; overall status is aggregated from all legs.'}
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '智能路由' : 'Smart Router'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '基于紧急度、费用、延迟和成交率选择最优交易所。'
                  : 'Selects optimal venue based on urgency, fees, latency, and fill rate.'}
              </div>
            </div>
            <div className="panel-badge badge-muted">ROUTE</div>
          </div>
          <div style={{ padding: '12px 16px', fontSize: '13px', lineHeight: '1.8' }}>
            <div>
              <strong>{locale === 'zh' ? '支持交易所' : 'Venues'}:</strong> Alpaca, ARCA, NASDAQ,
              NYSE, BATS, IEX
            </div>
            <div style={{ marginTop: '8px' }}>
              <strong>{locale === 'zh' ? '评分因素' : 'Scoring'}:</strong>
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>
              • {locale === 'zh' ? '高紧急度优先低延迟' : 'High urgency → low latency'}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>
              • {locale === 'zh' ? '限价单优先 maker 返佣' : 'Limit orders → maker rebates'}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>
              • {locale === 'zh' ? '低紧急度优先低费用' : 'Low urgency → low fees'}
            </div>
          </div>
        </article>
      </section>
    </>
  );
}
