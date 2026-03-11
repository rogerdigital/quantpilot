import { useEffect, useState } from 'react';
import { fetchExecutionAccountSnapshots, fetchExecutionLedger, fetchExecutionRuntime, fetchOperatorActions, fetchTaskWorkflows } from '../../../app/api/controlPlane.ts';
import { useAuditFeed } from '../../../modules/audit/useAuditFeed.ts';
import { useTradingSystem } from '../../../store/trading-system/TradingSystemProvider.tsx';
import { TopMeta } from '../components/ConsoleChrome.tsx';
import { ActivityLog, ApprovalQueueTable, OrdersTable } from '../components/ConsoleTables.tsx';
import { onShortcutKeyDown, useSettingsNavigation } from '../hooks.ts';
import { copy, useLocale } from '../i18n.tsx';
import { modeTone, translateEngineStatus, translateMode, translateRiskLevel, translateRuntimeText } from '../utils.ts';
import type { BrokerAccountSnapshotRecord, ExecutionLedgerEntry, ExecutionRuntimeEvent, WorkflowRunRecord } from '@shared-types/trading.ts';

export function ExecutionPage() {
  const { state, approveLiveIntent, rejectLiveIntent, hasPermission, actionGuardNotice } = useTradingSystem();
  const { locale } = useLocale();
  const goToSettings = useSettingsNavigation();
  const canApproveExecution = hasPermission('execution:approve');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [runtimeEvents, setRuntimeEvents] = useState<ExecutionRuntimeEvent[]>([]);
  const [accountSnapshots, setAccountSnapshots] = useState<BrokerAccountSnapshotRecord[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<ExecutionLedgerEntry[]>([]);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRunRecord[]>([]);
  const [workflowLoading, setWorkflowLoading] = useState(true);
  const [operatorActions, setOperatorActions] = useState<Array<{
    id: string;
    type: string;
    symbol: string;
    detail: string;
    actor: string;
    title: string;
    level: string;
    createdAt: string;
  }>>([]);
  const [actionsLoading, setActionsLoading] = useState(true);
  const { items: auditItems, loading: auditLoading } = useAuditFeed(state.controlPlane.lastSyncAt);
  const selectedEntry = ledgerEntries.find((entry) => entry.plan.id === selectedPlanId) || ledgerEntries[0] || null;
  const selectedSymbols = selectedEntry ? [...new Set(selectedEntry.plan.orders.map((order) => order.symbol))] : [];
  const selectedExecutionAuditItems = selectedEntry
    ? auditItems
      .filter((item) => item.type === 'execution-plan')
      .filter((item) => {
        const strategyId = typeof item.metadata?.strategyId === 'string' ? item.metadata.strategyId : '';
        return strategyId === selectedEntry.plan.strategyId;
      })
      .slice(0, 6)
    : [];
  const selectedExecutionActions = selectedEntry
    ? operatorActions
      .filter((item) => item.type === 'approve-intent' || item.type === 'reject-intent' || item.type === 'cancel-order')
      .filter((item) => selectedSymbols.includes(item.symbol))
      .slice(0, 6)
    : [];
  const selectedWorkflow = selectedEntry?.plan.workflowRunId
    ? workflowRuns.find((workflow) => workflow.id === selectedEntry.plan.workflowRunId) || null
    : null;
  const selectedAccountSnapshot = selectedEntry?.latestRuntime
    ? accountSnapshots.find((snapshot) => snapshot.cycle === selectedEntry.latestRuntime?.cycle) || accountSnapshots[0] || null
    : accountSnapshots[0] || null;

  useEffect(() => {
    let active = true;
    setWorkflowLoading(true);
    setActionsLoading(true);
    Promise.all([fetchExecutionRuntime(), fetchExecutionAccountSnapshots(), fetchExecutionLedger(), fetchTaskWorkflows(), fetchOperatorActions()])
      .then(([runtimeResponse, snapshotResponse, ledgerResponse, workflowResponse, actionResponse]) => {
        if (!active) return;
        setRuntimeEvents(runtimeResponse.events);
        setAccountSnapshots(snapshotResponse.snapshots);
        setLedgerEntries(ledgerResponse.entries);
        setWorkflowRuns(Array.isArray(workflowResponse.workflows) ? workflowResponse.workflows : []);
        setOperatorActions(Array.isArray(actionResponse.actions) ? actionResponse.actions : []);
      })
      .catch(() => {
        if (!active) return;
        setRuntimeEvents([]);
        setAccountSnapshots([]);
        setLedgerEntries([]);
        setWorkflowRuns([]);
        setOperatorActions([]);
      })
      .finally(() => {
        if (!active) return;
        setWorkflowLoading(false);
        setActionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [state.controlPlane.lastSyncAt]);

  useEffect(() => {
    if (!ledgerEntries.length) {
      setSelectedPlanId('');
      return;
    }
    if (!selectedPlanId || !ledgerEntries.some((entry) => entry.plan.id === selectedPlanId)) {
      setSelectedPlanId(ledgerEntries[0].plan.id);
    }
  }, [ledgerEntries, selectedPlanId]);

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
            {runtimeEvents.slice(0, 6).map((event) => (
              <div key={event.id} className="focus-row">
                <div className="focus-metric"><span>{locale === 'zh' ? '周期' : 'Cycle'}</span><strong>{event.cycle}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '已提交' : 'Submitted'}</span><strong>{event.submittedOrderCount}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '持仓数' : 'Positions'}</span><strong>{event.positionCount}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '权益' : 'Equity'}</span><strong>{event.equity.toFixed(0)}</strong></div>
              </div>
            ))}
            {!runtimeEvents.length ? <div className="status-copy">{locale === 'zh' ? '尚无后端执行记录。执行一个周期后这里会出现服务端快照。' : 'No backend execution records yet. Run a cycle to persist server-side snapshots.'}</div> : null}
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
            {!accountSnapshots.length ? <div className="status-copy">{locale === 'zh' ? '尚无 broker 账户快照。' : 'No broker account snapshots yet.'}</div> : null}
          </div>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '执行计划账本' : 'Execution Plan Ledger'}</div><div className="panel-copy">{locale === 'zh' ? '把 execution plan、workflow 状态和最新服务端执行结果放到同一视图。' : 'A single view for execution plans, workflow status, and the latest backend execution result.'}</div></div><div className="panel-badge badge-info">{ledgerEntries.length}</div></div>
          <div className="focus-list">
            {ledgerEntries.slice(0, 6).map((entry) => (
              <div key={entry.plan.id} className="focus-row">
                <div className="focus-metric"><span>{locale === 'zh' ? '策略' : 'Strategy'}</span><strong>{entry.plan.strategyName}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '计划状态' : 'Plan'}</span><strong>{entry.plan.status}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '工作流' : 'Workflow'}</span><strong>{entry.workflow?.status || '--'}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '最近执行' : 'Latest Runtime'}</span><strong>{entry.latestRuntime ? `${entry.latestRuntime.submittedOrderCount}/${entry.latestRuntime.openOrderCount}` : '--'}</strong></div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '详情' : 'Details'}</span>
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
                </div>
              </div>
            ))}
            {!ledgerEntries.length ? <div className="status-copy">{locale === 'zh' ? '尚无 execution ledger 数据。' : 'No execution ledger data yet.'}</div> : null}
          </div>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '选中执行计划详情' : 'Selected Execution Detail'}</div><div className="panel-copy">{locale === 'zh' ? '聚合展示单条 execution plan 的模式、风控、订单规模和运行时结果。' : 'Aggregate one execution plan’s mode, risk state, order count, and runtime result in one place.'}</div></div><div className="panel-badge badge-info">{selectedEntry?.plan.riskStatus || '--'}</div></div>
          {!selectedEntry ? (
            <div className="status-copy">{locale === 'zh' ? '当前没有可查看的执行计划。' : 'No execution plan is available for inspection.'}</div>
          ) : (
            <div className="status-stack">
              <div className="status-row"><span>{locale === 'zh' ? '策略' : 'Strategy'}</span><strong>{selectedEntry.plan.strategyName}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '模式' : 'Mode'}</span><strong>{selectedEntry.plan.mode}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '计划状态' : 'Plan status'}</span><strong>{selectedEntry.plan.status}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '审批状态' : 'Approval'}</span><strong>{selectedEntry.plan.approvalState}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '订单数' : 'Order count'}</span><strong>{selectedEntry.plan.orderCount}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '资金规模' : 'Capital'}</span><strong>{selectedEntry.plan.capital.toFixed(0)}</strong></div>
              <div className="status-copy">{selectedEntry.plan.summary}</div>
              <div className="status-copy">
                {selectedEntry.latestRuntime
                  ? (locale === 'zh'
                      ? `最新执行：提交 ${selectedEntry.latestRuntime.submittedOrderCount}，未成交 ${selectedEntry.latestRuntime.openOrderCount}，权益 ${selectedEntry.latestRuntime.equity.toFixed(0)}`
                      : `Latest runtime: submitted ${selectedEntry.latestRuntime.submittedOrderCount}, open ${selectedEntry.latestRuntime.openOrderCount}, equity ${selectedEntry.latestRuntime.equity.toFixed(0)}`)
                  : (locale === 'zh'
                      ? '当前计划还没有服务端执行结果。'
                      : 'No backend execution result is attached to this plan yet.')}
              </div>
            </div>
          )}
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '选中执行审计轨迹' : 'Selected Execution Audit'}</div><div className="panel-copy">{locale === 'zh' ? '按策略 ID 聚合当前选中 execution plan 对应的审计留痕。' : 'Aggregate audit trail for the selected execution plan by strategy id.'}</div></div><div className="panel-badge badge-warn">{selectedExecutionAuditItems.length}</div></div>
          <div className="focus-list">
            {auditLoading ? <div className="status-copy">{locale === 'zh' ? '正在加载执行审计...' : 'Loading execution audit...'}</div> : null}
            {!auditLoading && !selectedEntry ? <div className="status-copy">{locale === 'zh' ? '先从执行计划账本选择一条记录。' : 'Select an execution plan from the ledger first.'}</div> : null}
            {!auditLoading && selectedEntry && !selectedExecutionAuditItems.length ? <div className="status-copy">{locale === 'zh' ? '当前执行计划暂无审计留痕。' : 'No audit records exist for the selected execution plan yet.'}</div> : null}
            {selectedExecutionAuditItems.map((item) => (
              <div key={item.id} className="focus-row">
                <div className="focus-metric"><span>{locale === 'zh' ? '标题' : 'Title'}</span><strong>{item.title}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '操作人' : 'Actor'}</span><strong>{item.actor}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '类型' : 'Type'}</span><strong>{item.type}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '时间' : 'Time'}</span><strong>{new Date(item.createdAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}</strong></div>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '选中执行工作流' : 'Selected Execution Workflow'}</div><div className="panel-copy">{locale === 'zh' ? '查看 strategy-execution workflow 的状态、尝试次数和步骤进度。' : 'Inspect strategy-execution workflow status, attempts, and step progress.'}</div></div><div className="panel-badge badge-info">{selectedWorkflow?.status || '--'}</div></div>
          {!selectedEntry ? (
            <div className="status-copy">{locale === 'zh' ? '先从执行计划账本选择一条记录。' : 'Select an execution plan from the ledger first.'}</div>
          ) : workflowLoading ? (
            <div className="status-copy">{locale === 'zh' ? '正在加载执行工作流...' : 'Loading execution workflow...'}</div>
          ) : !selectedWorkflow ? (
            <div className="status-copy">{locale === 'zh' ? '当前执行计划还没有可见的 workflow 详情。' : 'No workflow detail is available for the selected execution plan yet.'}</div>
          ) : (
            <div className="status-stack">
              <div className="status-row"><span>{locale === 'zh' ? '工作流 ID' : 'Workflow ID'}</span><strong>{selectedWorkflow.id}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '状态' : 'Status'}</span><strong>{selectedWorkflow.status}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '尝试次数' : 'Attempts'}</span><strong>{selectedWorkflow.attempt}/{selectedWorkflow.maxAttempts}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '触发方式' : 'Trigger'}</span><strong>{selectedWorkflow.trigger}</strong></div>
              <div className="status-copy">{selectedWorkflow.steps.map((step) => `${step.key}:${step.status}`).join(' | ') || '--'}</div>
            </div>
          )}
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '选中审批动作历史' : 'Selected Approval Actions'}</div><div className="panel-copy">{locale === 'zh' ? '按当前 execution plan 的订单标的聚合 approve / reject / cancel 动作历史。' : 'Aggregate approve, reject, and cancel actions by the selected execution plan’s order symbols.'}</div></div><div className="panel-badge badge-warn">{selectedExecutionActions.length}</div></div>
          <div className="focus-list">
            {actionsLoading ? <div className="status-copy">{locale === 'zh' ? '正在加载审批动作历史...' : 'Loading approval actions...'}</div> : null}
            {!actionsLoading && !selectedEntry ? <div className="status-copy">{locale === 'zh' ? '先从执行计划账本选择一条记录。' : 'Select an execution plan from the ledger first.'}</div> : null}
            {!actionsLoading && selectedEntry && !selectedExecutionActions.length ? <div className="status-copy">{locale === 'zh' ? '当前执行计划还没有关联的审批动作。' : 'No approval actions are associated with the selected execution plan yet.'}</div> : null}
            {selectedExecutionActions.map((item) => (
              <div key={item.id} className="focus-row">
                <div className="focus-metric"><span>{locale === 'zh' ? '动作' : 'Action'}</span><strong>{item.type}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '标的' : 'Symbol'}</span><strong>{item.symbol || '--'}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '操作人' : 'Actor'}</span><strong>{item.actor}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '时间' : 'Time'}</span><strong>{new Date(item.createdAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}</strong></div>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '选中 Broker 快照' : 'Selected Broker Snapshot'}</div><div className="panel-copy">{locale === 'zh' ? '优先关联当前 plan 最新 runtime 所在周期的 broker snapshot；若不存在则回退到最新快照。' : 'Prefer the broker snapshot from the selected plan’s latest runtime cycle, then fall back to the latest snapshot.'}</div></div><div className="panel-badge badge-ok">{selectedAccountSnapshot?.provider || '--'}</div></div>
          {!selectedEntry ? (
            <div className="status-copy">{locale === 'zh' ? '先从执行计划账本选择一条记录。' : 'Select an execution plan from the ledger first.'}</div>
          ) : !selectedAccountSnapshot ? (
            <div className="status-copy">{locale === 'zh' ? '当前没有可用的 broker 快照。' : 'No broker snapshot is available for the selected execution plan.'}</div>
          ) : (
            <div className="status-stack">
              <div className="status-row"><span>{locale === 'zh' ? '提供商' : 'Provider'}</span><strong>{selectedAccountSnapshot.provider}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '周期' : 'Cycle'}</span><strong>{selectedAccountSnapshot.cycle}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '状态' : 'Status'}</span><strong>{selectedAccountSnapshot.connected ? 'connected' : 'disconnected'}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '现金' : 'Cash'}</span><strong>{Number(selectedAccountSnapshot.account?.cash || 0).toFixed(0)}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '持仓数' : 'Positions'}</span><strong>{selectedAccountSnapshot.positions.length}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '订单数' : 'Orders'}</span><strong>{selectedAccountSnapshot.orders.length}</strong></div>
              <div className="status-copy">{selectedAccountSnapshot.message}</div>
            </div>
          )}
        </article>
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
