import { useTradingSystem } from '../../../store/trading-system/TradingSystemProvider.tsx';
import { useLatestBrokerSnapshot } from '../../../hooks/useLatestBrokerSnapshot.ts';
import { useMarketProviderStatus } from '../../../hooks/useMarketProviderStatus.ts';
import { useMonitoringStatus } from '../../../hooks/useMonitoringStatus.ts';
import { useSettingsNavigation, useSummary } from '../../../modules/console/console.hooks.ts';
import { copy, useLocale } from '../../../modules/console/console.i18n.tsx';
import { ChartCanvas, EmptyState, TopMeta } from '../../../components/layout/ConsoleChrome.tsx';
import {
  connectionLabel,
  fmtCurrency,
  fmtDateTime,
  fmtPct,
  integrationTone,
  riskTone,
  toggleTone,
  topSignalLabel,
  translateEngineStatus,
  translateOrderStatus,
  translateMonitoringStatus,
  translateRiskLevel,
  translateRuntimeText,
  translateMode,
  translateSignal,
  translateSide,
  monitoringTone,
} from '../../../modules/console/console.utils.ts';

export function OverviewPage() {
  const { state } = useTradingSystem();
  const { locale } = useLocale();
  const goToSettings = useSettingsNavigation();
  const { paper, live, totalNav, totalPnlPct, positionCount } = useSummary();
  const { snapshot } = useLatestBrokerSnapshot(state.controlPlane.lastSyncAt);
  const { status: marketStatus } = useMarketProviderStatus(state.controlPlane.lastSyncAt);
  const { status: monitoringStatus, loading: monitoringLoading } = useMonitoringStatus(state.controlPlane.lastSyncAt);
  const buyCount = state.stockStates.filter((stock) => stock.signal === 'BUY').length;
  const sellCount = state.stockStates.filter((stock) => stock.signal === 'SELL').length;
  const pendingApprovals = state.approvalQueue.length;
  const openLiveOrders = state.accounts.live.orders.filter((order) => ['new', 'accepted', 'pending_new', 'partially_filled'].includes(String(order.status || '').toLowerCase())).length;
  const strongestSignal = topSignalLabel(state.stockStates, locale);
  const topSignals = state.stockStates
    .slice()
    .sort((a, b) => {
      const aBias = a.signal === 'HOLD' ? Math.abs(a.score - 50) : a.signal === 'BUY' ? a.score : 100 - a.score;
      const bBias = b.signal === 'HOLD' ? Math.abs(b.score - 50) : b.signal === 'BUY' ? b.score : 100 - b.score;
      return bBias - aBias;
    })
    .slice(0, 5);
  const recentOrders = [...state.accounts.live.orders, ...state.accounts.paper.orders]
    .slice()
    .sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.submittedAt || 0).getTime();
      const bTime = new Date(b.updatedAt || b.submittedAt || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 6);
  const liveMirrorNav = Number(snapshot?.account?.equity || live.nav);
  const brokerConnected = Boolean(snapshot?.connected ?? state.integrationStatus.broker.connected);
  const marketConnected = marketStatus?.connected ?? state.integrationStatus.marketData.connected;
  const marketDegraded = marketStatus?.fallback ?? !marketConnected;
  const monitoringWorkerLag = monitoringStatus?.services.worker.lagSeconds;
  const monitoringWorkflowBacklog = (monitoringStatus?.services.workflows.queued || 0) + (monitoringStatus?.services.workflows.running || 0) + (monitoringStatus?.services.workflows.retryScheduled || 0);
  const monitoringQueueBacklog = (monitoringStatus?.services.queues.pendingNotificationJobs || 0)
    + (monitoringStatus?.services.queues.pendingRiskScanJobs || 0)
    + (monitoringStatus?.services.queues.pendingAgentReviews || 0);
  const monitoringAlert = monitoringStatus?.alerts[0] || null;
  const monitoringUpdatedAt = monitoringStatus?.generatedAt || monitoringStatus?.recent.latestWorkerHeartbeat?.createdAt || '';

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">{copy[locale].desk.overview}</div>
          <h1>{copy[locale].heroTitle}</h1>
          <p className="topbar-copy">{copy[locale].pages.overview[1]}</p>
        </div>
        <TopMeta items={[
          { label: copy[locale].labels.marketClock, value: state.marketClock },
          { label: copy[locale].labels.systemStatus, value: translateEngineStatus(locale, state.engineStatus), accent: true },
          { label: copy[locale].labels.mode, value: translateMode(locale, state.mode) },
        ]} />
      </header>

      <section className="overview-hero-grid">
        <article className="hero-card hero-card-primary overview-command-card">
          <div className="overview-command-frame">
            <div className="card-eyebrow">{copy[locale].overview.commandDeckEyebrow}</div>
            <div className="overview-command-head">
              <div>
                <div className="overview-command-title">{copy[locale].slogans.commandCenter}</div>
                <div className="overview-command-copy">{translateRuntimeText(locale, state.routeCopy)}</div>
              </div>
              <div className={`status-chip status-chip-large tone-${riskTone(state.riskLevel)}`}><span className="status-dot" aria-hidden="true" />{translateRiskLevel(locale, state.riskLevel)}</div>
            </div>
            <div className="overview-command-core">
              <div className="overview-command-summary">
                <div className="hero-headline">
                  <div className="hero-value">{fmtCurrency(totalNav)}</div>
                  <div className={`hero-change ${totalPnlPct >= 0 ? 'text-up' : 'text-down'}`}>{fmtPct(totalPnlPct)}</div>
                </div>
                <div className="overview-command-note">
                  <span>{copy[locale].terms.tradeDecision}</span>
                  <strong>{translateRuntimeText(locale, state.decisionSummary)}</strong>
                  <p>{translateRuntimeText(locale, state.decisionCopy)}</p>
                </div>
              </div>
              <div className="overview-command-aside">
                <div className="overview-brief-card">
                  <span>{copy[locale].terms.latestDecision}</span>
                  <strong>{strongestSignal}</strong>
                </div>
                <div className="overview-brief-card">
                  <span>{copy[locale].terms.pendingApprovals}</span>
                  <strong>{pendingApprovals}</strong>
                </div>
                <div className="overview-brief-card">
                  <span>{copy[locale].overview.openLiveOrders}</span>
                  <strong>{openLiveOrders}</strong>
                </div>
              </div>
            </div>
            <div className="overview-command-strip">
              <div className="overview-stat">
                <span>{copy[locale].terms.paperNav}</span>
                <strong>{fmtCurrency(paper.nav)}</strong>
              </div>
              <div className="overview-stat">
                <span>{copy[locale].terms.liveMirror}</span>
                <strong>{fmtCurrency(liveMirrorNav)}</strong>
              </div>
              <div className="overview-stat">
                <span>{copy[locale].terms.signalSummary}</span>
                <strong>{buyCount} / {sellCount}</strong>
              </div>
              <div className="overview-stat">
                <span>{copy[locale].terms.activityToday}</span>
                <strong>{state.activityLog.length}</strong>
              </div>
            </div>
          </div>
        </article>

        <article className="hero-card overview-kpi-card">
          <div className="card-eyebrow">{copy[locale].overview.exposureEyebrow}</div>
          <div className="overview-kpi-title">{copy[locale].overview.exposureTitle}</div>
          <div className="mini-metric">{positionCount}</div>
          <div className="mini-copy">{copy[locale].labels.positions}</div>
          <div className="overview-kpi-grid">
            <div><span>{copy[locale].labels.paper}</span><strong>{paper.exposure.toFixed(1)}%</strong></div>
            <div><span>{copy[locale].labels.live}</span><strong>{live.exposure.toFixed(1)}%</strong></div>
          </div>
          <div className="overview-kpi-note">{copy[locale].overview.exposureNote}</div>
        </article>

        <article className="hero-card overview-kpi-card">
          <div className="card-eyebrow">{copy[locale].overview.workflowEyebrow}</div>
          <div className="overview-kpi-title">{copy[locale].overview.workflowTitle}</div>
          <div className="mini-metric">{openLiveOrders}</div>
          <div className="mini-copy">{copy[locale].overview.openLiveOrders}</div>
          <div className="overview-kpi-grid">
            <div><span>{copy[locale].terms.activityToday}</span><strong>{state.activityLog.length}</strong></div>
            <div><span>{copy[locale].terms.pendingApprovals}</span><strong>{pendingApprovals}</strong></div>
          </div>
          <div className="overview-kpi-note">{copy[locale].overview.workflowNote}</div>
        </article>
      </section>

      <section className="panel-grid panel-grid-terminal overview-desk-grid">
        <article className="panel overview-primary-panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.equityCurve}</div><div className="panel-copy">{locale === 'zh' ? '用一个主图盯盘总资产变化，并将信号、仓位和执行后果收敛到同一观察面。' : 'Use one primary chart to track consolidated NAV, then read signal, exposure, and execution impact from the same desk.'}</div></div><div className="panel-badge badge-ok">{copy[locale].overview.liveDeskBadge}</div></div>
          <div className="overview-panel-flow">
            <ChartCanvas kind="equity" />
            <div className="overview-inline-metrics">
              <div className="overview-inline-metric"><span>{copy[locale].labels.marketState}</span><strong>{connectionLabel(locale, marketConnected, marketDegraded)}</strong></div>
              <div className="overview-inline-metric"><span>{copy[locale].labels.brokerState}</span><strong>{connectionLabel(locale, brokerConnected, false, true)}</strong></div>
              <div className="overview-inline-metric"><span>{copy[locale].terms.tradeDecision}</span><strong>{translateRuntimeText(locale, state.decisionSummary)}</strong></div>
            </div>
            <div className="overview-primary-note">
              <span>{copy[locale].overview.deskBrief}</span>
              <strong>{translateRuntimeText(locale, state.routeCopy)}</strong>
              <p>{translateRuntimeText(locale, state.decisionCopy)}</p>
            </div>
          </div>
        </article>
        <article className="panel overview-side-panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.executionSummary}</div><div className="panel-copy">{locale === 'zh' ? '把模式、风控、接入与最新动作压缩成一个侧边监控面板。' : 'Compress mode, risk, connectivity, and the latest action into one desk-side monitor.'}</div></div><div className="panel-badge badge-muted">{copy[locale].overview.opsBadge}</div></div>
          <div className="status-stack">
            <div className="panel-subtitle">{copy[locale].overview.autonomyControls}</div>
            <div className="overview-ops-cluster">
              <button type="button" className="status-row status-row-button" onClick={() => goToSettings('switches')}><span>{copy[locale].labels.autoTrade}</span><strong className={`status-chip tone-${toggleTone(state.toggles.autoTrade)}`}>{state.toggles.autoTrade ? copy[locale].labels.enabled : copy[locale].labels.disabled}</strong></button>
              <button type="button" className="status-row status-row-button" onClick={() => goToSettings('switches')}><span>{copy[locale].labels.allowLive}</span><strong className={`status-chip tone-${toggleTone(state.toggles.liveTrade)}`}>{state.toggles.liveTrade ? copy[locale].labels.enabled : copy[locale].labels.disabled}</strong></button>
              <button type="button" className="status-row status-row-button" onClick={() => goToSettings('switches')}><span>{copy[locale].labels.manualApproval}</span><strong className={`status-chip tone-${toggleTone(state.toggles.manualApproval)}`}>{state.toggles.manualApproval ? copy[locale].labels.enabled : copy[locale].labels.disabled}</strong></button>
            </div>
            <div className="panel-subtitle">{copy[locale].overview.systemPulse}</div>
            <div className="overview-ops-cluster">
              <div className="status-row"><span>{locale === 'zh' ? '系统健康' : 'System health'}</span><strong className={`status-chip tone-${monitoringTone(monitoringStatus?.status)}`}>{monitoringLoading ? (locale === 'zh' ? '加载中' : 'Loading') : translateMonitoringStatus(locale, monitoringStatus?.status)}</strong></div>
              <div className="status-row"><span>{copy[locale].labels.positions}</span><strong>{positionCount}</strong></div>
              <div className="status-row"><span>{copy[locale].terms.activityToday}</span><strong>{state.activityLog.length}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? 'Worker 心跳' : 'Worker heartbeat'}</span><strong>{monitoringWorkerLag === null || monitoringWorkerLag === undefined ? '--' : `${monitoringWorkerLag}s`}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? 'Workflow 积压' : 'Workflow backlog'}</span><strong>{monitoringWorkflowBacklog}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '待处理队列' : 'Pending queues'}</span><strong>{monitoringQueueBacklog}</strong></div>
            </div>
            <div className="panel-subtitle">{copy[locale].overview.connectivity}</div>
            <div className="overview-ops-cluster">
              <button type="button" className="status-row status-row-button" onClick={() => goToSettings('integrations')}><span>{copy[locale].labels.marketState}</span><strong className={`status-chip tone-${integrationTone(marketConnected, marketDegraded)}`}>{connectionLabel(locale, marketConnected, marketDegraded)}</strong></button>
              <button type="button" className="status-row status-row-button" onClick={() => goToSettings('integrations')}><span>{copy[locale].labels.brokerState}</span><strong className={`status-chip tone-${integrationTone(brokerConnected, false, true)}`}>{connectionLabel(locale, brokerConnected, false, true)}</strong></button>
            </div>
            <div className="panel-subtitle">{copy[locale].overview.deskNotes}</div>
            <div className="overview-ops-cluster">
              <div className="status-copy">{monitoringAlert ? `${locale === 'zh' ? '当前告警' : 'Current alert'}: ${monitoringAlert.message}` : (locale === 'zh' ? '当前没有新的监控告警。' : 'No monitoring alerts right now.')}</div>
              <div className="status-copy">{monitoringUpdatedAt ? `${locale === 'zh' ? '监控更新时间' : 'Monitoring updated'}: ${fmtDateTime(monitoringUpdatedAt, locale)}` : (locale === 'zh' ? '监控摘要尚未返回。' : 'Monitoring summary has not returned yet.')}</div>
              <div className="status-copy">{translateRuntimeText(locale, state.decisionCopy)}</div>
              <div className="status-copy">{state.activityLog[0] ? `${locale === 'zh' ? '最新动作' : 'Latest action'}: ${translateRuntimeText(locale, state.activityLog[0].title)}` : translateRuntimeText(locale, '当前没有新的执行记录。')}</div>
            </div>
          </div>
        </article>
      </section>

      <section className="panel-grid panel-grid-terminal-bottom overview-blotter-grid">
        <article className="panel overview-blotter-card">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.focusList}</div><div className="panel-copy">{locale === 'zh' ? '像交易员的 watchlist 一样，只保留最值得人工复核的机会。' : 'Keep a trader-style watchlist with only the opportunities worth immediate review.'}</div></div><div className="panel-badge badge-muted">{copy[locale].overview.watchlistBadge}</div></div>
          <div className="focus-list focus-list-terminal overview-blotter-list">
            {topSignals.map((stock) => {
              const pct = (stock.price / stock.prevClose - 1) * 100;
              return (
                <div className="focus-row" key={stock.symbol}>
                  <div className="symbol-cell">
                    <strong>{stock.symbol}</strong>
                    <span>{stock.name}</span>
                  </div>
                  <div className="focus-metric">
                    <span>{stock.price.toFixed(2)}</span>
                    <span className={pct >= 0 ? 'text-up' : 'text-down'}>{fmtPct(pct)}</span>
                  </div>
                  <div className="focus-metric">
                    <span>{copy[locale].labels.score}</span>
                    <strong>{stock.score.toFixed(1)}</strong>
                  </div>
                  <span className={`signal-chip signal-${stock.signal.toLowerCase()}`}>{translateSignal(locale, stock.signal)}</span>
                </div>
              );
            })}
          </div>
        </article>
        <article className="panel overview-blotter-card">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.recentOrders}</div><div className="panel-copy">{locale === 'zh' ? '首页保留精简 blotter，只看最新委托、账户归属和状态变化。' : 'Keep a compact blotter on the home desk to review the latest order flow and status changes.'}</div></div><div className="panel-badge badge-info">{recentOrders.length || 0} {copy[locale].labels.orders}</div></div>
          <div className="focus-list focus-list-terminal overview-blotter-list">
            {recentOrders.length ? recentOrders.map((order, index) => (
              <div className="focus-row" key={`${order.id || order.symbol}-${index}`}>
                <div className="symbol-cell">
                  <strong>{order.symbol}</strong>
                  <span>{order.account === 'live' ? copy[locale].labels.live : copy[locale].labels.paper}</span>
                </div>
                <div className="focus-metric">
                  <span className={order.side === 'BUY' ? 'text-up' : 'text-down'}>{translateSide(locale, order.side)}</span>
                  <span>{order.qty}</span>
                </div>
                <div className="focus-metric">
                  <span>{copy[locale].labels.status}</span>
                  <strong>{translateOrderStatus(locale, order.status)}</strong>
                </div>
                <span className="table-note">{fmtDateTime(order.updatedAt || order.submittedAt, locale)}</span>
              </div>
            )) : <EmptyState message={copy[locale].terms.noOrders} />}
          </div>
        </article>
      </section>
    </>
  );
}
