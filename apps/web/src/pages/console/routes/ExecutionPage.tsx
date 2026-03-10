import { useEffect, useState } from 'react';
import { fetchExecutionAccountSnapshots, fetchExecutionLedger, fetchExecutionRuntime } from '../../../app/api/controlPlane.ts';
import { useTradingSystem } from '../../../store/trading-system/TradingSystemProvider.tsx';
import { TopMeta } from '../components/ConsoleChrome.tsx';
import { ActivityLog, ApprovalQueueTable, OrdersTable } from '../components/ConsoleTables.tsx';
import { onShortcutKeyDown, useSettingsNavigation } from '../hooks.ts';
import { copy, useLocale } from '../i18n.tsx';
import { modeTone, translateEngineStatus, translateMode, translateRiskLevel, translateRuntimeText } from '../utils.ts';
import type { BrokerAccountSnapshotRecord, ExecutionLedgerEntry, ExecutionRuntimeEvent } from '@shared-types/trading.ts';

export function ExecutionPage() {
  const { state, approveLiveIntent, rejectLiveIntent, hasPermission } = useTradingSystem();
  const { locale } = useLocale();
  const goToSettings = useSettingsNavigation();
  const canApproveExecution = hasPermission('execution:approve');
  const [runtimeEvents, setRuntimeEvents] = useState<ExecutionRuntimeEvent[]>([]);
  const [accountSnapshots, setAccountSnapshots] = useState<BrokerAccountSnapshotRecord[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<ExecutionLedgerEntry[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([fetchExecutionRuntime(), fetchExecutionAccountSnapshots(), fetchExecutionLedger()])
      .then(([runtimeResponse, snapshotResponse, ledgerResponse]) => {
        if (!active) return;
        setRuntimeEvents(runtimeResponse.events);
        setAccountSnapshots(snapshotResponse.snapshots);
        setLedgerEntries(ledgerResponse.entries);
      })
      .catch(() => {
        if (!active) return;
        setRuntimeEvents([]);
        setAccountSnapshots([]);
        setLedgerEntries([]);
      });
    return () => {
      active = false;
    };
  }, [state.controlPlane.lastSyncAt]);

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
              </div>
            ))}
            {!ledgerEntries.length ? <div className="status-copy">{locale === 'zh' ? '尚无 execution ledger 数据。' : 'No execution ledger data yet.'}</div> : null}
          </div>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.pendingApprovals}</div><div className="panel-copy">{locale === 'zh' ? '人工确认开启时，live 订单先进入这里，批准后才会发往 broker。' : 'When manual approval is enabled, live orders stay here until you release them to the broker.'}</div></div><div className={`panel-badge ${state.approvalQueue.length ? 'badge-warn' : 'badge-muted'}`}>{state.approvalQueue.length}</div></div>
          <ApprovalQueueTable onApprove={approveLiveIntent} onReject={rejectLiveIntent} canReview={canApproveExecution} />
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.paperOrders}</div><div className="panel-copy">{locale === 'zh' ? '策略测试账户最近 12 笔委托。' : 'Latest 12 orders from the paper account.'}</div></div><div className="panel-badge badge-muted">PAPER</div></div>
          <OrdersTable accountKey="paper" />
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.liveOrderState}</div><div className="panel-copy">{locale === 'zh' ? '查看远程订单状态、部分成交、撤单与成交回报。' : 'Track remote order states, partial fills, cancels, and fill feedback.'}</div></div><div className="panel-badge badge-ok">LIVE</div></div>
          <OrdersTable accountKey="live" />
        </article>
      </section>
    </>
  );
}
