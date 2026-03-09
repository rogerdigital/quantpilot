import { useTradingSystem } from '../../../store/trading-system/TradingSystemProvider.tsx';
import { ChartCanvas, TopMeta } from '../components/ConsoleChrome.tsx';
import { UniverseTable } from '../components/ConsoleTables.tsx';
import { onShortcutKeyDown, useSettingsNavigation } from '../hooks.ts';
import { copy, useLocale } from '../i18n.tsx';
import { translateMode, translateRiskLevel, translateRuntimeText } from '../utils.ts';

export function SignalsPage() {
  const { state } = useTradingSystem();
  const { locale } = useLocale();
  const goToSettings = useSettingsNavigation();

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">{copy[locale].desk.signals}</div>
          <h1>{copy[locale].pages.signals[0]}</h1>
          <p className="topbar-copy">{copy[locale].pages.signals[1]}</p>
        </div>
        <TopMeta items={[
          { label: copy[locale].labels.marketClock, value: state.marketClock },
          { label: copy[locale].labels.latestSignal, value: `${state.stockStates.filter((stock) => stock.signal === 'BUY').length} / ${state.stockStates.filter((stock) => stock.signal === 'SELL').length}` },
          { label: copy[locale].terms.riskLevel, value: translateRiskLevel(locale, state.riskLevel) },
        ]} />
      </header>

      <section className="hero-grid two-up">
        <div className="hero-card"><div className="card-eyebrow">{copy[locale].terms.signalSummary}</div><div className="mini-metric">{translateRuntimeText(locale, state.decisionSummary)}</div><div className="mini-copy">{translateRuntimeText(locale, state.decisionCopy)}</div><button type="button" className="inline-link" onClick={() => goToSettings('policy')}>{copy[locale].labels.policy}</button></div>
        <article
          className="hero-card shortcut-surface"
          role="button"
          tabIndex={0}
          onClick={() => goToSettings('system-mode')}
          onKeyDown={(event) => onShortcutKeyDown(event, () => goToSettings('system-mode'))}
        ><div className="card-eyebrow">{copy[locale].terms.executionRoute}</div><div className="mini-metric">{translateMode(locale, state.mode)}</div><div className="mini-copy">{translateRuntimeText(locale, state.routeCopy)}</div></article>
      </section>

      <section className="panel-grid panel-grid-wide">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.signalDistribution}</div><div className="panel-copy">{locale === 'zh' ? '查看当前周期的买入、持有、卖出占比。' : 'Inspect the current buy / hold / sell mix.'}</div></div><div className="panel-badge badge-warn">SIGNAL</div></div>
          <ChartCanvas kind="signal" />
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.universeScores}</div><div className="panel-copy">{locale === 'zh' ? '评分越高越偏向买入，越低越偏向减仓。' : 'Higher scores bias toward buys; lower scores bias toward exits.'}</div></div><div className="panel-badge badge-info">{state.stockStates.length} SYMBOLS</div></div>
          <UniverseTable />
        </article>
      </section>
    </>
  );
}
