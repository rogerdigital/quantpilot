import { useTradingSystem } from '../../../store/trading-system/TradingSystemProvider.tsx';
import { ChartCanvas, SectionHeader } from '../components/ConsoleChrome.tsx';
import { UniverseTable } from '../components/ConsoleTables.tsx';
import { useSettingsNavigation } from '../hooks.ts';
import { copy, useLocale } from '../i18n.tsx';

export function MarketPage() {
  const { state } = useTradingSystem();
  const { locale } = useLocale();
  const goToSettings = useSettingsNavigation();

  return (
    <>
      <SectionHeader routeKey="market" />
      <section className="panel-grid panel-grid-wide">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.marketPulse}</div><div className="panel-copy">{locale === 'zh' ? '观察当前股票池强弱分布和行情接入状态。' : 'Track universe momentum and current market data connectivity.'}</div><button type="button" className="inline-link" onClick={() => goToSettings('integrations')}>{copy[locale].labels.integrations}</button></div><div className="panel-badge badge-info">MARKET</div></div>
          <ChartCanvas kind="signal" />
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.universeMonitor}</div><div className="panel-copy">{locale === 'zh' ? '查看价格、评分和当前决策方向。' : 'Review pricing, scores, and current decision posture.'}</div></div><div className="panel-badge badge-info">{state.stockStates.length} SYMBOLS</div></div>
          <UniverseTable />
        </article>
      </section>
    </>
  );
}
