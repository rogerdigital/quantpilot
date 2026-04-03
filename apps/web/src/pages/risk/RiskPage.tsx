import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RiskPolicyActionResponse, RiskRunbookActionKey } from '@shared-types/trading.ts';
import { buildDeepLink } from '../../modules/console/deepLinks.ts';
import { useTradingSystem } from '../../store/trading-system/TradingSystemProvider.tsx';
import { formatActionGuardNotice } from '../../modules/permissions/permissionCopy.ts';
import { runRiskPolicyAction } from '../../app/api/controlPlane.ts';
import { useRiskWorkbench } from '../../modules/risk/useRiskWorkbench.ts';
import { SectionHeader, TopMeta } from '../../components/layout/ConsoleChrome.tsx';
import { ApprovalQueueTable, BrokerSnapshotPositionsTable, PositionsTable } from '../../components/business/ConsoleTables.tsx';
import { InspectionEmpty, InspectionPanel, InspectionSelectableRow } from '../console/components/InspectionPanels.tsx';
import { useSummary } from '../../modules/console/console.hooks.ts';
import { copy, useLocale } from '../../modules/console/console.i18n.tsx';
import { fmtCurrency, fmtDateTime, integrationTone, riskTone } from '../../modules/console/console.utils.ts';

function RiskPage() {
  const { state, approveLiveIntent, rejectLiveIntent, hasPermission, actionGuardNotice } = useTradingSystem();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const canApproveExecution = hasPermission('execution:approve');
  const canReviewRisk = hasPermission('risk:review');
  const { paper, live } = useSummary();
  const [riskActionBusy, setRiskActionBusy] = useState(false);
  const [riskActionRefreshKey, setRiskActionRefreshKey] = useState(0);
  const [riskActionResult, setRiskActionResult] = useState<RiskPolicyActionResponse['action'] | null>(null);
  const { data: workbench, loading, error } = useRiskWorkbench(`${state.controlPlane.lastSyncAt}:${riskActionRefreshKey}`);
  const [selectedRiskEventId, setSelectedRiskEventId] = useState('');
  const [selectedSchedulerTickId, setSelectedSchedulerTickId] = useState('');
  const brokerSnapshot = workbench.recent.brokerSnapshot;
  const liveEquity = Number(brokerSnapshot?.account?.equity || workbench.summary.liveEquity || live.nav);
  const liveExposure = workbench.summary.liveExposurePct || live.exposure;
  const selectedRiskEvent = workbench.recent.riskEvents.find((item) => item.id === selectedRiskEventId) || workbench.recent.riskEvents[0] || null;
  const selectedSchedulerTick = workbench.recent.schedulerTicks.find((item) => item.id === selectedSchedulerTickId) || workbench.recent.schedulerTicks[0] || null;
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

  useEffect(() => {
    if (!workbench.recent.schedulerTicks.length) {
      setSelectedSchedulerTickId('');
      return;
    }
    if (!workbench.recent.schedulerTicks.some((item) => item.id === selectedSchedulerTickId)) {
      setSelectedSchedulerTickId(workbench.recent.schedulerTicks[0]?.id || '');
    }
  }, [selectedSchedulerTickId, workbench.recent.schedulerTicks]);

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

  function focusRiskRunbook(key: RiskRunbookActionKey) {
    if (key === 'review-risk-off') {
      const riskOff = workbench.recent.riskEvents.find((item) => item.status === 'risk-off') || workbench.reviewQueue.riskEvents[0];
      if (riskOff) setSelectedRiskEventId(riskOff.id);
      return;
    }
    if (key === 'clear-review-queue') {
      const plan = workbench.reviewQueue.executionPlans[0];
      if (plan) {
        openExecutionDetail(plan.id, plan.strategyId);
        return;
      }
      const run = workbench.reviewQueue.backtestRuns[0];
      if (run) openBacktestDetail(run.id, run.strategyId);
      return;
    }
    if (key === 'triage-risk-incidents') {
      const incident = workbench.reviewQueue.incidents[0];
      if (incident) openIncident(incident.id);
      return;
    }
    if (key === 'review-scheduler-drift') {
      const tick = workbench.reviewQueue.schedulerTicks[0] || workbench.recent.schedulerTicks[0];
      if (tick) setSelectedSchedulerTickId(tick.id);
      return;
    }
    if (key === 'check-compliance-alerts') {
      const compliance = workbench.recent.riskEvents.find((item) => `${item.title} ${item.message}`.toLowerCase().includes('compliance') || `${item.title} ${item.message}`.toLowerCase().includes('policy'));
      if (compliance) setSelectedRiskEventId(compliance.id);
      return;
    }
    if (key === 'release-emergency-brake') {
      const blocked = workbench.reviewQueue.executionPlans.find((item) => item.riskStatus === 'blocked' || item.status === 'blocked') || workbench.reviewQueue.executionPlans[0];
      if (blocked) openExecutionDetail(blocked.id, blocked.strategyId);
    }
  }

  async function executeRiskRunbook(key: RiskRunbookActionKey) {
    setRiskActionBusy(true);
    try {
      const response = await runRiskPolicyAction({
        actionKey: key,
        actor: state.controlPlane.operator,
        hours: 168,
        limit: 8,
      });
      setRiskActionResult(response.action);
      setRiskActionRefreshKey((value) => value + 1);
      focusRiskRunbook(key);
    } finally {
      setRiskActionBusy(false);
    }
  }

  function focusRiskLinkageRunbook(key: (typeof workbench.linkage.runbook)[number]['key']) {
    if (key === 'focus-linked-window') {
      const tick = workbench.linkage.queue.schedulerTicks[0] || workbench.recent.schedulerTicks[0];
      if (tick) setSelectedSchedulerTickId(tick.id);
      return;
    }
    if (key === 'review-linked-risk') {
      const event = workbench.linkage.queue.riskEvents[0] || workbench.recent.riskEvents[0];
      if (event) setSelectedRiskEventId(event.id);
      return;
    }
    if (key === 'triage-linked-incidents') {
      const incident = workbench.linkage.queue.incidents[0] || workbench.reviewQueue.incidents[0];
      if (incident) openIncident(incident.id);
      return;
    }
    if (key === 'align-cycle-posture') {
      navigate(buildDeepLink('/notifications', {
        source: 'risk-scheduler-linkage',
        scheduler: workbench.linkage.summary.activePhase || 'INTRADAY',
      }));
      return;
    }
    navigate(buildDeepLink('/notifications', {
      source: 'scheduler',
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
        <article className="metric-tile"><div className="tile-label">{locale === 'zh' ? '集中度' : 'Concentration'}</div><div className="tile-value">{workbench.summary.concentrationPct.toFixed(1)}%</div><div className="tile-sub">{locale === 'zh' ? '按最大持仓 / 权益估算' : 'Largest position as a share of equity'}</div></article>
        <article className="metric-tile"><div className="tile-label">{locale === 'zh' ? '合规提示' : 'Compliance Alerts'}</div><div className={`tile-value tone-${workbench.summary.complianceAlerts ? 'warn' : 'ok'}`}>{workbench.summary.complianceAlerts}</div><div className="tile-sub">{locale === 'zh' ? '策略、事件或 incident 中的合规/策略提示' : 'Policy or compliance-linked signals across risk events and incidents'}</div></article>
        <article className="metric-tile"><div className="tile-label">{locale === 'zh' ? '应急动作' : 'Emergency Actions'}</div><div className={`tile-value tone-${workbench.summary.emergencyActions ? 'risk' : 'ok'}`}>{workbench.summary.emergencyActions}</div><div className="tile-sub">{locale === 'zh' ? 'blocked execution + risk-off 的合并姿态' : 'Combined blocked-execution and risk-off posture'}</div></article>
        <article className="metric-tile"><div className="tile-label">{locale === 'zh' ? '调度关注' : 'Scheduler Attention'}</div><div className={`tile-value tone-${workbench.summary.schedulerAttention ? 'warn' : 'ok'}`}>{workbench.summary.schedulerAttention}</div><div className="tile-sub">{locale === 'zh' ? '会影响风控中台节奏的 scheduler attention' : 'Scheduler attention that can impact the risk middleware flow'}</div></article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? 'Risk Workbench' : 'Risk Workbench'}</div><div className="panel-copy">{locale === 'zh' ? '把风险事件、执行复核、研究复核和 incident 收敛到同一份后端风险快照。' : 'Aggregate risk events, execution review, research review, and incidents into one backend risk snapshot.'}</div></div><div className={`panel-badge badge-${riskTone(workbench.posture.status)}`}>{workbench.posture.status}</div></div>
          <div className="status-stack">
            <div className="status-row"><span>{locale === 'zh' ? '最近策略动作' : 'Last Policy Action'}</span><strong>{riskActionResult?.title || '--'}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '执行时间' : 'Executed At'}</span><strong>{fmtDateTime(riskActionResult?.executedAt || '', locale)}</strong></div>
            {riskActionResult ? <div className="status-copy">{riskActionResult.detail}</div> : null}
          </div>
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
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? 'Risk Runbook' : 'Risk Runbook'}</div><div className="panel-copy">{locale === 'zh' ? '把 risk-off、review queue、合规提示和调度异常压成中台处置建议。' : 'Turn risk-off, review queue, compliance alerts, and scheduler drift into operator-ready middleware actions.'}</div></div><div className={`panel-badge badge-${riskTone(workbench.posture.status)}`}>{workbench.runbook.length}</div></div>
          <div className="focus-list">
            {workbench.runbook.map((item) => (
              <div className="focus-row" key={item.key}>
                <div className="symbol-cell">
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
                <div className="focus-metric"><span>{locale === 'zh' ? '优先级' : 'Priority'}</span><strong>{item.priority}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '计数' : 'Count'}</span><strong>{item.count}</strong></div>
                <div className="settings-chip-row">
                  <button type="button" className="inline-action" onClick={() => focusRiskRunbook(item.key)}>
                    {locale === 'zh' ? '聚焦路径' : 'Focus Action'}
                  </button>
                  <button type="button" className="inline-action" disabled={!canReviewRisk || riskActionBusy} onClick={() => void executeRiskRunbook(item.key)}>
                    {riskActionBusy ? (locale === 'zh' ? '执行中...' : 'Running...') : (locale === 'zh' ? '运行策略' : 'Run Policy')}
                  </button>
                </div>
              </div>
            ))}
            {!workbench.runbook.length ? <div className="empty-cell">{locale === 'zh' ? '当前没有额外的 risk runbook 动作。' : 'No extra risk runbook actions are queued right now.'}</div> : null}
            {actionGuardNotice?.permission === 'risk:review' ? <div className="status-copy">{formatActionGuardNotice(locale, actionGuardNotice)}</div> : null}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? 'Risk Scheduler Linkage' : 'Risk Scheduler Linkage'}</div><div className="panel-copy">{locale === 'zh' ? '把同一条风控问题在 risk 与 scheduler 两侧的上下文收成一份联动视图。' : 'Collapse the shared risk and scheduler context for the same middleware issue into one linkage view.'}</div></div><div className={`panel-badge badge-${riskTone(workbench.linkage.posture.status)}`}>{workbench.linkage.summary.linkedRiskEvents + workbench.linkage.summary.linkedSchedulerTicks}</div></div>
          <div className="focus-list">
            <div className="focus-row">
              <div className="focus-metric"><span>{locale === 'zh' ? '当前窗口' : 'Active Phase'}</span><strong>{workbench.linkage.summary.activePhase || '--'}</strong></div>
              <div className="focus-metric"><span>{locale === 'zh' ? 'Linked Risk' : 'Linked Risk'}</span><strong>{workbench.linkage.summary.linkedRiskEvents}</strong></div>
              <div className="focus-metric"><span>{locale === 'zh' ? 'Linked Scheduler' : 'Linked Scheduler'}</span><strong>{workbench.linkage.summary.linkedSchedulerTicks}</strong></div>
              <div className="focus-metric"><span>{locale === 'zh' ? 'Incidents' : 'Incidents'}</span><strong>{workbench.linkage.summary.linkedIncidents}</strong></div>
              <div className="focus-metric"><span>{locale === 'zh' ? 'Cycle Drift' : 'Cycle Drift'}</span><strong>{workbench.linkage.summary.cycleAttention}</strong></div>
            </div>
            <div className="status-copy">{workbench.linkage.posture.detail || (locale === 'zh' ? '当前还没有明显的 risk/scheduler 联动异常。' : 'No material risk/scheduler linkage drift is active right now.')}</div>
            {workbench.linkage.runbook.map((item) => (
              <div className="focus-row" key={item.key}>
                <div className="symbol-cell">
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
                <div className="focus-metric"><span>{locale === 'zh' ? '优先级' : 'Priority'}</span><strong>{item.priority}</strong></div>
                <div className="focus-metric"><span>{locale === 'zh' ? '计数' : 'Count'}</span><strong>{item.count}</strong></div>
                <button type="button" className="inline-action" onClick={() => focusRiskLinkageRunbook(item.key)}>
                  {locale === 'zh' ? '执行建议' : 'Focus Action'}
                </button>
              </div>
            ))}
            {!workbench.linkage.runbook.length ? <div className="empty-cell">{locale === 'zh' ? '当前没有额外的 risk/scheduler linkage 动作。' : 'No extra risk/scheduler linkage actions are queued right now.'}</div> : null}
          </div>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '风控中台队列' : 'Risk Middleware Queue'}</div><div className="panel-copy">{locale === 'zh' ? '把风控事件、执行复核、回测复核、incident 和 scheduler attention 收到同一个队列视角里。' : 'Read risk events, execution review, backtest review, incidents, and scheduler attention through one middleware queue view.'}</div></div><div className="panel-badge badge-info">{workbench.reviewQueue.riskEvents.length + workbench.reviewQueue.executionPlans.length + workbench.reviewQueue.backtestRuns.length + workbench.reviewQueue.incidents.length + workbench.reviewQueue.schedulerTicks.length}</div></div>
          <div className="focus-list">
            <div className="focus-row">
              <div className="focus-metric"><span>{locale === 'zh' ? '风险事件' : 'Risk Events'}</span><strong>{workbench.reviewQueue.riskEvents.length}</strong></div>
              <div className="focus-metric"><span>{locale === 'zh' ? '执行复核' : 'Execution Review'}</span><strong>{workbench.reviewQueue.executionPlans.length}</strong></div>
              <div className="focus-metric"><span>{locale === 'zh' ? '回测复核' : 'Backtest Review'}</span><strong>{workbench.reviewQueue.backtestRuns.length}</strong></div>
              <div className="focus-metric"><span>{locale === 'zh' ? 'Incident' : 'Incidents'}</span><strong>{workbench.reviewQueue.incidents.length}</strong></div>
              <div className="focus-metric"><span>{locale === 'zh' ? '调度' : 'Scheduler'}</span><strong>{workbench.reviewQueue.schedulerTicks.length}</strong></div>
            </div>
            {workbench.reviewQueue.schedulerTicks.slice(0, 3).map((item) => (
              <InspectionSelectableRow
                key={item.id}
                metrics={[
                  { label: locale === 'zh' ? '调度窗口' : 'Phase', value: item.phase },
                  { label: locale === 'zh' ? '状态' : 'Status', value: item.status },
                  { label: locale === 'zh' ? '标题' : 'Title', value: item.title },
                  { label: locale === 'zh' ? '时间' : 'Time', value: fmtDateTime(item.createdAt, locale) },
                ]}
                actions={<button type="button" className="inline-action" disabled={selectedSchedulerTickId === item.id} onClick={() => setSelectedSchedulerTickId(item.id)}>{selectedSchedulerTickId === item.id ? (locale === 'zh' ? '已聚焦' : 'Focused') : (locale === 'zh' ? '聚焦' : 'Focus')}</button>}
              />
            ))}
            {selectedSchedulerTick ? (
              <div className="status-stack">
                <div className="status-row"><span>{locale === 'zh' ? '窗口' : 'Phase'}</span><strong>{selectedSchedulerTick.phase}</strong></div>
                <div className="status-row"><span>{locale === 'zh' ? '状态' : 'Status'}</span><strong>{selectedSchedulerTick.status}</strong></div>
                <div className="status-row"><span>{locale === 'zh' ? 'Worker' : 'Worker'}</span><strong>{selectedSchedulerTick.worker}</strong></div>
                <div className="status-copy">{selectedSchedulerTick.message}</div>
              </div>
            ) : null}
            {!workbench.reviewQueue.schedulerTicks.length ? <div className="empty-cell">{locale === 'zh' ? '当前没有 scheduler attention。' : 'No scheduler attention items are queued right now.'}</div> : null}
          </div>
        </article>
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
