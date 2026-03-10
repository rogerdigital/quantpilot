import { useTradingSystem } from '../../../store/trading-system/TradingSystemProvider.tsx';
import { useLatestBrokerSnapshot } from '../../../hooks/useLatestBrokerSnapshot.ts';
import { ChartCanvas, TopMeta } from '../components/ConsoleChrome.tsx';
import { PositionsTable } from '../components/ConsoleTables.tsx';
import { onShortcutKeyDown, useSettingsNavigation, useSummary } from '../hooks.ts';
import { copy, useLocale } from '../i18n.tsx';
import { engineTone, fmtCurrency, fmtPct, translateEngineStatus, translateMode, translateRiskLevel, translateRuntimeText } from '../utils.ts';

export function PortfolioPage() {
  const { state } = useTradingSystem();
  const { locale } = useLocale();
  const goToSettings = useSettingsNavigation();
  const { paper, live, totalNav } = useSummary();
  const { snapshot } = useLatestBrokerSnapshot(state.controlPlane.lastSyncAt);
  const liveCash = Number(snapshot?.account?.cash || live.cash);
  const liveBuyingPower = Number(snapshot?.account?.buyingPower || live.buyingPower || live.cash);
  const liveEquity = Number(snapshot?.account?.equity || live.nav);
  const livePositionCount = Array.isArray(snapshot?.positions) ? snapshot.positions.length : 0;

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">{copy[locale].desk.portfolio}</div>
          <h1>{copy[locale].pages.portfolio[0]}</h1>
          <p className="topbar-copy">{copy[locale].pages.portfolio[1]}</p>
        </div>
        <TopMeta items={[
          { label: copy[locale].terms.totalAccountValue, value: fmtCurrency(totalNav) },
          { label: copy[locale].terms.paperPnl, value: fmtPct(paper.pnlPct) },
          { label: copy[locale].terms.livePnl, value: fmtPct(live.pnlPct) },
        ]} />
      </header>

      <section className="metrics-grid">
        <article className="metric-tile"><div className="tile-label">{copy[locale].terms.paperNav}</div><div className="tile-value">{fmtCurrency(paper.nav)}</div><div className="tile-sub">{copy[locale].labels.exposure} {paper.exposure.toFixed(1)}%</div></article>
        <article className="metric-tile"><div className="tile-label">{copy[locale].terms.paperCash}</div><div className="tile-value">{fmtCurrency(paper.cash)}</div><div className="tile-sub">{copy[locale].terms.availableForEntries}</div></article>
        <article className="metric-tile"><div className="tile-label">{locale === 'zh' ? '实盘账户净值' : 'Live NAV'}</div><div className="tile-value">{fmtCurrency(liveEquity)}</div><div className="tile-sub">{locale === 'zh' ? `服务端持仓 ${livePositionCount}` : `${livePositionCount} backend positions`}</div></article>
        <article className="metric-tile"><div className="tile-label">{copy[locale].terms.liveBuyingPower}</div><div className="tile-value">{fmtCurrency(liveBuyingPower)}</div><div className="tile-sub">{fmtCurrency(liveCash)}</div></article>
      </section>

      <section className="panel-grid panel-grid-wide">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '权益走势' : 'Equity Curve'}</div><div className="panel-copy">{locale === 'zh' ? '同步查看两个账户的权益变化。' : 'Track equity changes across both accounts.'}</div></div><div className="panel-badge badge-info">PORTFOLIO</div></div>
          <ChartCanvas kind="equity" />
        </article>
        <article
          className="panel shortcut-surface"
          role="button"
          tabIndex={0}
          onClick={() => goToSettings('system-mode')}
          onKeyDown={(event) => onShortcutKeyDown(event, () => goToSettings('system-mode'))}
        >
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.portfolioState}</div><div className="panel-copy">{locale === 'zh' ? '在组合页同步查看当前风险、模式和决策摘要。' : 'Review current risk, mode, and decision summary alongside holdings.'}</div></div><div className={`panel-badge badge-${engineTone(state.engineStatus)}`}>{translateEngineStatus(locale, state.engineStatus)}</div></div>
          <div className="status-stack">
            <div className="status-row"><span>{copy[locale].terms.riskLevel}</span><strong>{translateRiskLevel(locale, state.riskLevel)}</strong></div>
            <div className="status-row"><span>{copy[locale].labels.mode}</span><strong>{translateMode(locale, state.mode)}</strong></div>
            <div className="status-row"><span>{copy[locale].terms.latestDecision}</span><strong>{translateRuntimeText(locale, state.decisionSummary)}</strong></div>
            <div className="status-copy">{translateRuntimeText(locale, state.decisionCopy)}</div>
          </div>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '模拟盘持仓' : 'Paper Positions'}</div><div className="panel-copy">{locale === 'zh' ? '策略测试账户的当前持仓明细。' : 'Current holdings in the paper account.'}</div></div><div className="panel-badge badge-muted">PAPER</div></div>
          <PositionsTable accountKey="paper" />
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '实盘持仓' : 'Live Positions'}</div><div className="panel-copy">{locale === 'zh' ? '远程 broker 同步回来的持仓状态。' : 'Positions synchronized from the remote broker.'}</div></div><div className="panel-badge badge-ok">LIVE</div></div>
          <PositionsTable accountKey="live" />
        </article>
      </section>
    </>
  );
}
