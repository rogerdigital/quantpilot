import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildDeepLink } from '../../modules/console/deepLinks.ts';
import { useTradingSystem } from '../../store/trading-system/TradingSystemProvider.tsx';
import { formatActionGuardNotice } from '../../modules/permissions/permissionCopy.ts';
import { useRiskWorkbench } from '../../modules/risk/useRiskWorkbench.ts';
import { SectionHeader, TopMeta } from '../console/components/ConsoleChrome.tsx';
import { ApprovalQueueTable, BrokerSnapshotPositionsTable, PositionsTable } from '../console/components/ConsoleTables.tsx';
import { InspectionEmpty, InspectionPanel, InspectionSelectableRow } from '../console/components/InspectionPanels.tsx';
import { useSummary } from '../console/hooks.ts';
import { copy, useLocale } from '../console/i18n.tsx';
import { fmtCurrency, fmtDateTime, integrationTone, riskTone } from '../console/utils.ts';

function RiskPage() {
  const { state, approveLiveIntent, rejectLiveIntent, hasPermission, actionGuardNotice } = useTradingSystem();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const canApproveExecution = hasPermission('execution:approve');
  const { paper, live } = useSummary();
  const { data: workbench, loading, error } = useRiskWorkbench(state.controlPlane.lastSyncAt);
  const [selectedRiskEventId, setSelectedRiskEventId] = useState('');
  const brokerSnapshot = workbench.recent.brokerSnapshot;
  const liveEquity = Number(brokerSnapshot?.account?.equity || workbench.summary.liveEquity || live.nav);
  const liveExposure = workbench.summary.liveExposurePct || live.exposure;
  const selectedRiskEvent = workbench.recent.riskEvents.find((item) => item.id === selectedRiskEventId) || workbench.recent.riskEvents[0] || null;
  const riskIncidentCount = workbench.reviewQueue.incidents.length;
  const selectedLaneStatus = useMemo(
    () => workbench.lanes.find((item) => item.key === 'risk-events')?.status || workbench.posture.status,
    [workbench.lanes, workbench.posture.status],
  );

  useEffect(() => {
    if (!workbench.recent.riskEvents.length) {
      setSelectedRiskEventId('');
      return;
    }
    if (!workbench.recent.riskEvents.some((item) => item.id === selectedRiskEventId)) {
      setSelectedRiskEventId(workbench.recent.riskEvents[0]?.id || '');
    }
  }, [selectedRiskEventId, workbench.recent.riskEvents]);

  function openExecutionDetail(planId: string, strategyId?: string) {
    navigate(buildDeepLink('/execution', {
      plan: planId,
      strategy: strategyId,
      source: 'risk',
    }));
  }

  function openBacktestDetail(runId: string, strategyId?: string) {
    navigate(buildDeepLink('/backtest', {
      run: runId,
      strategy: strategyId,
      source: 'risk',
    }));
  }

  function openIncident(incidentId: string) {
    navigate(buildDeepLink('/notifications', {
      incident: incidentId,
      source: 'risk',
    }));
  }

  return (
    <>
      <SectionHeader routeKey="risk" />
      <TopMeta items={[
        { label: copy[locale].terms.riskLevel, value: workbench.posture.title || state.riskLevel, accent: true },
        { label: copy[locale].labels.marketState, value: workbench.summary.brokerConnected ? copy[locale].labels.connected : copy[locale].labels.fallback },
        { label: copy[locale].terms.pendingApprovals, value: String(workbench.summary.approvalRequired) },
      ]} />

      <section className="metrics-grid">
        <article className="metric-tile"><div className="tile-label">{locale === 'zh' ? '组合风险' : 'Portfolio Risk'}</div><div className={`tile-value tone-${riskTone(selectedLaneStatus)}`}>{workbench.posture.status}</div><div className="tile-sub">{workbench.posture.detail || (locale === 'zh' ? '当前系统风控结论' : 'Current system risk posture')}</div></article>
        <article className="metric-tile"><div className="tile-label">{locale === 'zh' ? '模拟盘暴露' : 'Paper Exposure'}</div><div className="tile-value">{paper.exposure.toFixed(1)}%</div><div className="tile-sub">{fmtCurrency(paper.nav)}</div></article>
        <article className="metric-tile"><div className="tile-label">{locale === 'zh' ? '实盘暴露' : 'Live Exposure'}</div><div className="tile-value">{liveExposure.toFixed(1)}%</div><div className="tile-sub">{fmtCurrency(liveEquity)}</div></article>
        <article className="metric-tile"><div className="tile-label">{locale === 'zh' ? '接入健康' : 'Connectivity'}</div><div className={`tile-value tone-${integrationTone(Boolean(brokerSnapshot?.connected ?? workbench.summary.brokerConnected), false, true)}`}>{brokerSnapshot?.connected ? copy[locale].labels.connected : copy[locale].labels.localMirror}</div><div className="tile-sub">{locale === 'zh' ? '风险页现在优先消费后端 risk workbench 聚合快照' : 'The risk console now prioritizes the backend risk workbench snapshot.'}</div></article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? 'Risk Workbench' : 'Risk Workbench'}</div><div className="panel-copy">{locale === 'zh' ? '把风险事件、执行复核、研究复核和 incident 收敛到同一份后端风险快照。' : 'Aggregate risk events, execution review, research review, and incidents into one backend risk snapshot.'}</div></div><div className={`panel-badge badge-${riskTone(workbench.posture.status)}`}>{workbench.posture.status}</div></div>
          <div className="focus-list">
            {error ? <div className="status-copy">{locale === 'zh' ? `风险工作台加载失败：${error}` : `Failed to load risk workbench: ${error}`}</div> : null}
            {loading ? <div className="status-copy">{locale === 'zh' ? '正在同步风险工作台...' : 'Syncing risk workbench...'}</div> : null}
            {!loading ? workbench.lanes.map((lane) => (
              <div className="focus-row" key={lane.key}>
                <div className="symbol-cell">
                  <strong>{lane.title}</strong>
                  <span>{lane.detail}</span>
                </div>
                <div className="focus-metric"><span>{locale === 'zh' ? '状态' : 'Status'}</span><strong>{lane.status}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '主计数' : 'Primary'}</span><strong>{lane.primaryCount}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '次计数' : 'Secondary'}</span><strong>{lane.secondaryCount}</strong></div>
              </div>
            )) : null}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '服务端复核队列' : 'Server Review Queue'}</div><div className="panel-copy">{locale === 'zh' ? '优先查看真正由后端风险与执行边界驱动的待复核对象。' : 'Prioritize the review items that are actually driven by backend risk and execution boundaries.'}</div></div><div className={`panel-badge ${workbench.summary.approvalRequired || workbench.summary.reviewBacktests || riskIncidentCount ? 'badge-warn' : 'badge-muted'}`}>{workbench.summary.approvalRequired + workbench.summary.reviewBacktests + riskIncidentCount}</div></div>
          <div className="focus-list">
            {workbench.reviewQueue.executionPlans.slice(0, 3).map((plan) => (
              <InspectionSelectableRow
                key={plan.id}
                metrics={[
                  { label: locale === 'zh' ? '执行计划' : 'Execution Plan', value: plan.strategyName },
                  { label: locale === 'zh' ? '风控' : 'Risk', value: plan.riskStatus },
                  { label: locale === 'zh' ? '审批' : 'Approval', value: plan.approvalState },
                  { label: locale === 'zh' ? '订单数' : 'Orders', value: String(plan.orderCount) },
                ]}
                actions={<button type="button" className="inline-action" onClick={() => openExecutionDetail(plan.id, plan.strategyId)}>{locale === 'zh' ? '打开执行详情' : 'Open Execution Detail'}</button>}
              />
            ))}
            {workbench.reviewQueue.backtestRuns.slice(0, 2).map((run) => (
              <InspectionSelectableRow
                key={run.id}
                metrics={[
                  { label: locale === 'zh' ? '回测' : 'Backtest', value: run.strategyName },
                  { label: locale === 'zh' ? '状态' : 'Status', value: run.status },
                  { label: locale === 'zh' ? 'Sharpe' : 'Sharpe', value: run.sharpe.toFixed(2) },
                  { label: locale === 'zh' ? '回撤' : 'Drawdown', value: `${run.maxDrawdownPct.toFixed(1)}%` },
                ]}
                actions={<button type="button" className="inline-action" onClick={() => openBacktestDetail(run.id, run.strategyId)}>{locale === 'zh' ? '打开回测详情' : 'Open Backtest Detail'}</button>}
              />
            ))}
            {workbench.reviewQueue.incidents.slice(0, 2).map((incident) => (
              <InspectionSelectableRow
                key={incident.id}
                metrics={[
                  { label: locale === 'zh' ? 'Incident' : 'Incident', value: incident.title },
                  { label: locale === 'zh' ? '级别' : 'Severity', value: incident.severity },
                  { label: locale === 'zh' ? '状态' : 'Status', value: incident.status },
                  { label: locale === 'zh' ? '负责人' : 'Owner', value: incident.owner || '--' },
                ]}
                actions={<button type="button" className="inline-action" onClick={() => openIncident(incident.id)}>{locale === 'zh' ? '打开排查台' : 'Open Investigation'}</button>}
              />
            ))}
            {!workbench.reviewQueue.executionPlans.length && !workbench.reviewQueue.backtestRuns.length && !workbench.reviewQueue.incidents.length ? <div className="empty-cell">{locale === 'zh' ? '当前没有服务端复核队列项。' : 'No server-backed review items are waiting right now.'}</div> : null}
          </div>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.pendingApprovals}</div><div className="panel-copy">{locale === 'zh' ? '保留当前 sandbox runtime 的实盘确认队列，用于前端交易沙盒演示。' : 'Keep the current sandbox runtime approval gate for the frontend trading sandbox.'}</div></div><div className={`panel-badge ${state.approvalQueue.length ? 'badge-warn' : 'badge-muted'}`}>{state.approvalQueue.length}</div></div>
          <ApprovalQueueTable onApprove={approveLiveIntent} onReject={rejectLiveIntent} canReview={canApproveExecution} />
          {actionGuardNotice?.permission === 'execution:approve' ? <div className="status-copy">{formatActionGuardNotice(locale, actionGuardNotice)}</div> : null}
        </article>
        <InspectionPanel
          title={locale === 'zh' ? '风险事件流' : 'Risk Event Stream'}
          copy={locale === 'zh' ? '从后端 risk workbench 中查看最近风险扫描事件，并把焦点固定到单条风控记录。' : 'Inspect the latest risk scan events from the backend risk workbench and pin focus on a single record.'}
          badge={selectedRiskEvent?.status || '--'}
        >
          {!workbench.recent.riskEvents.length ? (
            <InspectionEmpty>{loading ? (locale === 'zh' ? '正在加载风险事件...' : 'Loading risk events...') : (locale === 'zh' ? '暂无风险事件' : 'No risk events yet.')}</InspectionEmpty>
          ) : (
            <div className="focus-list">
              {workbench.recent.riskEvents.map((item) => (
                <InspectionSelectableRow
                  key={item.id}
                  metrics={[
                    { label: locale === 'zh' ? '事件' : 'Event', value: item.title },
                    { label: locale === 'zh' ? '状态' : 'Status', value: item.status },
                    { label: locale === 'zh' ? '级别' : 'Level', value: item.level },
                    { label: locale === 'zh' ? '时间' : 'Time', value: fmtDateTime(item.createdAt, locale) },
                  ]}
                  actions={<button type="button" className="inline-action" disabled={selectedRiskEventId === item.id} onClick={() => setSelectedRiskEventId(item.id)}>{selectedRiskEventId === item.id ? (locale === 'zh' ? '已选中' : 'Selected') : (locale === 'zh' ? '聚焦' : 'Focus')}</button>}
                />
              ))}
              {selectedRiskEvent ? (
                <div className="status-stack">
                  <div className="status-row"><span>{locale === 'zh' ? '来源' : 'Source'}</span><strong>{selectedRiskEvent.source}</strong></div>
                  <div className="status-row"><span>{locale === 'zh' ? '风险级别' : 'Risk Level'}</span><strong>{selectedRiskEvent.riskLevel}</strong></div>
                  <div className="status-row"><span>{locale === 'zh' ? '周期' : 'Cycle'}</span><strong>{selectedRiskEvent.cycle}</strong></div>
                  <div className="status-copy">{selectedRiskEvent.message}</div>
                </div>
              ) : null}
            </div>
          )}
        </InspectionPanel>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '模拟盘持仓风险' : 'Paper Position Risk'}</div><div className="panel-copy">{locale === 'zh' ? '用现有持仓视图观察策略侧的仓位暴露。' : 'Use the existing holdings view to inspect strategy-side position exposure.'}</div></div><div className="panel-badge badge-muted">PAPER</div></div>
          <PositionsTable accountKey="paper" />
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '实盘持仓风险' : 'Live Position Risk'}</div><div className="panel-copy">{locale === 'zh' ? '这里现在直接消费 risk workbench 聚合回来的 broker 快照和 live 暴露。' : 'This panel now consumes the broker snapshot and live exposure aggregated by the risk workbench.'}</div></div><div className="panel-badge badge-ok">LIVE</div></div>
          <BrokerSnapshotPositionsTable positions={brokerSnapshot?.positions || []} />
          {!brokerSnapshot ? <div className="status-copy">{locale === 'zh' ? '当前还没有后端 broker 快照。' : 'No backend broker snapshot has been recorded yet.'}</div> : null}
        </article>
      </section>
    </>
  );
}

export default RiskPage;
