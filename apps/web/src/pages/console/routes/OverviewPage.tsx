import { useTradingSystem } from '../../../store/trading-system/TradingSystemProvider.tsx';
import { useLatestBrokerSnapshot } from '../../../hooks/useLatestBrokerSnapshot.ts';
import { useSettingsNavigation, useSummary } from '../hooks.ts';
import { copy, useLocale } from '../i18n.tsx';
import { ChartCanvas, TopMeta } from '../components/ConsoleChrome.tsx';
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
  translateRiskLevel,
  translateRuntimeText,
  translateMode,
  translateSignal,
  translateSide,
} from '../utils.ts';

export function OverviewPage() {
  const { state } = useTradingSystem();
  const { locale } = useLocale();
  const goToSettings = useSettingsNavigation();
  const { paper, live, totalNav, totalPnlPct, positionCount } = useSummary();
  const { snapshot } = useLatestBrokerSnapshot(state.controlPlane.lastSyncAt);
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
          <div className="card-eyebrow">Command Deck</div>
          <div className="overview-command-head">
            <div>
              <div className="overview-command-title">{copy[locale].slogans.commandCenter}</div>
              <div className="overview-command-copy">{translateRuntimeText(locale, state.routeCopy)}</div>
            </div>
            <div className={`status-chip status-chip-large tone-${riskTone(state.riskLevel)}`}><span className="status-dot" aria-hidden="true" />{translateRiskLevel(locale, state.riskLevel)}</div>
          </div>
          <div className="hero-headline">
            <div className="hero-value">{fmtCurrency(totalNav)}</div>
            <div className={`hero-change ${totalPnlPct >= 0 ? 'text-up' : 'text-down'}`}>{fmtPct(totalPnlPct)}</div>
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
              <span>{copy[locale].terms.latestDecision}</span>
              <strong>{strongestSignal}</strong>
            </div>
          </div>
        </article>

        <article className="hero-card overview-kpi-card">
          <div className="card-eyebrow">Exposure</div>
          <div className="mini-metric">{positionCount}</div>
          <div className="mini-copy">{copy[locale].labels.positions}</div>
          <div className="overview-kpi-grid">
            <div><span>{copy[locale].labels.paper}</span><strong>{paper.exposure.toFixed(1)}%</strong></div>
            <div><span>{copy[locale].labels.live}</span><strong>{live.exposure.toFixed(1)}%</strong></div>
          </div>
        </article>

        <article className="hero-card overview-kpi-card">
          <div className="card-eyebrow">Workflow</div>
          <div className="mini-metric">{openLiveOrders}</div>
          <div className="mini-copy">{locale === 'zh' ? '未完成实盘订单' : 'Open live orders'}</div>
          <div className="overview-kpi-grid">
            <div><span>{copy[locale].terms.activityToday}</span><strong>{state.activityLog.length}</strong></div>
            <div><span>{copy[locale].terms.pendingApprovals}</span><strong>{pendingApprovals}</strong></div>
          </div>
        </article>
      </section>

      <section className="panel-grid panel-grid-terminal overview-desk-grid">
        <article className="panel overview-primary-panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.equityCurve}</div><div className="panel-copy">{locale === 'zh' ? '用一个主图盯盘总资产变化，并将信号、仓位和执行后果收敛到同一观察面。' : 'Use one primary chart to track consolidated NAV, then read signal, exposure, and execution impact from the same desk.'}</div></div><div className="panel-badge badge-ok">LIVE DESK</div></div>
          <ChartCanvas kind="equity" />
          <div className="overview-inline-metrics">
            <div className="overview-inline-metric"><span>{copy[locale].labels.marketState}</span><strong>{connectionLabel(locale, state.integrationStatus.marketData.connected, true)}</strong></div>
            <div className="overview-inline-metric"><span>{copy[locale].labels.brokerState}</span><strong>{connectionLabel(locale, brokerConnected, false, true)}</strong></div>
            <div className="overview-inline-metric"><span>{copy[locale].terms.tradeDecision}</span><strong>{translateRuntimeText(locale, state.decisionSummary)}</strong></div>
          </div>
        </article>
        <article className="panel overview-side-panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.executionSummary}</div><div className="panel-copy">{locale === 'zh' ? '把模式、风控、接入与最新动作压缩成一个侧边监控面板。' : 'Compress mode, risk, connectivity, and the latest action into one desk-side monitor.'}</div></div><div className="panel-badge badge-muted">OPS</div></div>
          <div className="status-stack">
            <button type="button" className="status-row status-row-button" onClick={() => goToSettings('switches')}><span>{copy[locale].labels.autoTrade}</span><strong className={`status-chip tone-${toggleTone(state.toggles.autoTrade)}`}>{state.toggles.autoTrade ? copy[locale].labels.enabled : copy[locale].labels.disabled}</strong></button>
            <button type="button" className="status-row status-row-button" onClick={() => goToSettings('switches')}><span>{copy[locale].labels.allowLive}</span><strong className={`status-chip tone-${toggleTone(state.toggles.liveTrade)}`}>{state.toggles.liveTrade ? copy[locale].labels.enabled : copy[locale].labels.disabled}</strong></button>
            <button type="button" className="status-row status-row-button" onClick={() => goToSettings('switches')}><span>{copy[locale].labels.manualApproval}</span><strong className={`status-chip tone-${toggleTone(state.toggles.manualApproval)}`}>{state.toggles.manualApproval ? copy[locale].labels.enabled : copy[locale].labels.disabled}</strong></button>
            <div className="status-row"><span>{copy[locale].labels.positions}</span><strong>{positionCount}</strong></div>
            <div className="status-row"><span>{copy[locale].terms.activityToday}</span><strong>{state.activityLog.length}</strong></div>
            <button type="button" className="status-row status-row-button" onClick={() => goToSettings('integrations')}><span>{copy[locale].labels.marketState}</span><strong className={`status-chip tone-${integrationTone(state.integrationStatus.marketData.connected, true)}`}>{connectionLabel(locale, state.integrationStatus.marketData.connected, true)}</strong></button>
            <button type="button" className="status-row status-row-button" onClick={() => goToSettings('integrations')}><span>{copy[locale].labels.brokerState}</span><strong className={`status-chip tone-${integrationTone(brokerConnected, false, true)}`}>{connectionLabel(locale, brokerConnected, false, true)}</strong></button>
            <div className="status-copy">{translateRuntimeText(locale, state.decisionCopy)}</div>
            <div className="status-copy">{state.activityLog[0] ? `${locale === 'zh' ? '最新动作' : 'Latest action'}: ${translateRuntimeText(locale, state.activityLog[0].title)}` : translateRuntimeText(locale, '当前没有新的执行记录。')}</div>
          </div>
        </article>
      </section>

      <section className="panel-grid panel-grid-terminal-bottom overview-blotter-grid">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.focusList}</div><div className="panel-copy">{locale === 'zh' ? '像交易员的 watchlist 一样，只保留最值得人工复核的机会。' : 'Keep a trader-style watchlist with only the opportunities worth immediate review.'}</div></div><div className="panel-badge badge-muted">WATCHLIST</div></div>
          <div className="focus-list focus-list-terminal">
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
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.recentOrders}</div><div className="panel-copy">{locale === 'zh' ? '首页保留精简 blotter，只看最新委托、账户归属和状态变化。' : 'Keep a compact blotter on the home desk to review the latest order flow and status changes.'}</div></div><div className="panel-badge badge-info">{recentOrders.length || 0} {copy[locale].labels.orders}</div></div>
          <div className="focus-list focus-list-terminal">
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
            )) : <div className="empty-cell">{copy[locale].terms.noOrders}</div>}
          </div>
        </article>
      </section>
    </>
  );
}
