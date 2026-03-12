import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuditFeed } from '../../../modules/audit/useAuditFeed.ts';
import { readDeepLinkParams } from '../../../modules/console/deepLinks.ts';
import { useExecutionConsoleData } from '../../../modules/console/useExecutionConsoleData.ts';
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
  const researchNavigation = useResearchNavigationContext(searchParams, navigate);
  const goToSettings = useSettingsNavigation();
  const canApproveExecution = hasPermission('execution:approve');
  const {
    runtimeEvents,
    accountSnapshots,
    ledgerEntries,
    workflowRuns,
    operatorActions,
    loading: executionDataLoading,
    error: executionDataError,
  } = useExecutionConsoleData(state.controlPlane.lastSyncAt);
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
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '执行计划账本' : 'Execution Plan Ledger'}</div><div className="panel-copy">{locale === 'zh' ? '把 execution plan、workflow 状态和最新服务端执行结果放到同一视图。' : 'A single view for execution plans, workflow status, and the latest backend execution result.'}</div></div><div className="panel-badge badge-info">{ledgerEntries.length}</div></div>
          <div className="focus-list">
            {ledgerEntries.slice(0, 6).map((entry) => (
              <InspectionSelectableRow
                key={entry.plan.id}
                metrics={[
                  { label: locale === 'zh' ? '策略' : 'Strategy', value: entry.plan.strategyName },
                  { label: locale === 'zh' ? '计划状态' : 'Plan', value: entry.plan.status },
                  { label: locale === 'zh' ? '工作流' : 'Workflow', value: entry.workflow?.status || '--' },
                  { label: locale === 'zh' ? '最近执行' : 'Latest Runtime', value: entry.latestRuntime ? `${entry.latestRuntime.submittedOrderCount}/${entry.latestRuntime.openOrderCount}` : '--' },
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
          badge={selectedEntry?.plan.riskStatus || '--'}
        >
          {!selectedEntry ? (
            <InspectionStatus>{executionDetailInspection.emptyMessage}</InspectionStatus>
          ) : (
            <div className="status-stack">
              <div className="status-row"><span>{locale === 'zh' ? '策略' : 'Strategy'}</span><strong>{selectedEntry.plan.strategyName}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '模式' : 'Mode'}</span><strong>{selectedEntry.plan.mode}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '计划状态' : 'Plan status'}</span><strong>{selectedEntry.plan.status}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '审批状态' : 'Approval'}</span><strong>{selectedEntry.plan.approvalState}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '订单数' : 'Order count'}</span><strong>{selectedEntry.plan.orderCount}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '资金规模' : 'Capital'}</span><strong>{selectedEntry.plan.capital.toFixed(0)}</strong></div>
              <div className="settings-actions">
                <button
                  type="button"
                  className="inline-action inline-action-approve"
                  onClick={() => researchNavigation.openStrategyDetail(selectedEntry.plan.strategyId)}
                >
                  {locale === 'zh' ? '打开策略详情' : 'Open Strategy Detail'}
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
              <InspectionStatus>{executionDetailInspection.summary}</InspectionStatus>
              <InspectionStatus>{executionDetailInspection.runtimeMessage}</InspectionStatus>
            </div>
          )}
        </InspectionPanel>
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
            <div className="status-copy">{locale === 'zh' ? '操作已被拦截：当前会话缺少 execution:approve 权限。' : 'Action blocked: this session is missing execution:approve permission.'}</div>
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
            <div className="status-copy">{locale === 'zh' ? '撤单请求未发送：当前会话缺少 execution:approve 权限。' : 'Cancel request was not sent: this session is missing execution:approve permission.'}</div>
          ) : null}
        </article>
      </section>
    </>
  );
}
