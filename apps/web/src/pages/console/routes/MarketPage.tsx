import { useMarketProviderStatus } from '../../../hooks/useMarketProviderStatus.ts';
import { useTradingSystem } from '../../../store/trading-system/TradingSystemProvider.tsx';
import { ChartCanvas, SectionHeader } from '../components/ConsoleChrome.tsx';
import { UniverseTable } from '../components/ConsoleTables.tsx';
import { useSettingsNavigation } from '../hooks.ts';
import { copy, useLocale } from '../i18n.tsx';
import { connectionLabel, fmtDateTime, integrationTone, translateProviderLabel } from '../utils.ts';

export function MarketPage() {
  const { state } = useTradingSystem();
  const { locale } = useLocale();
  const goToSettings = useSettingsNavigation();
  const { status, loading } = useMarketProviderStatus(state.controlPlane.lastSyncAt);
  const marketConnected = status?.connected ?? state.integrationStatus.marketData.connected;
  const marketFallback = status?.fallback ?? !marketConnected;
  const providerLabel = translateProviderLabel(
    locale,
    status?.provider === 'alpaca'
      ? 'Alpaca Market Data via Gateway'
      : status?.provider === 'custom-http'
        ? 'HTTP 行情网关'
        : '本地模拟行情',
  );

  return (
    <>
      <SectionHeader routeKey="market" />
      <section className="panel-grid panel-grid-wide">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.marketPulse}</div><div className="panel-copy">{locale === 'zh' ? '观察当前股票池强弱分布和行情接入状态。' : 'Track universe momentum and current market data connectivity.'}</div><button type="button" className="inline-link" onClick={() => goToSettings('integrations')}>{copy[locale].labels.integrations}</button></div><div className="panel-badge badge-info">MARKET</div></div>
          <ChartCanvas kind="signal" />
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '后端行情接入状态' : 'Backend Market Provider Status'}</div><div className="panel-copy">{locale === 'zh' ? '这里显示 worker 最近一次写入的行情接入事实源，而不是页面本地推断。' : 'This panel shows the latest market provider status written by the backend worker, not only the page-local runtime guess.'}</div></div><div className={`panel-badge badge-${integrationTone(marketConnected, marketFallback)}`}>{marketConnected ? 'ONLINE' : 'FALLBACK'}</div></div>
          <div className="status-stack">
            <div className="status-row"><span>{locale === 'zh' ? 'Provider' : 'Provider'}</span><strong>{providerLabel}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '连接状态' : 'Connectivity'}</span><strong>{connectionLabel(locale, marketConnected, marketFallback)}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? 'Fallback' : 'Fallback'}</span><strong>{marketFallback ? 'ON' : 'OFF'}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? 'Symbol 数量' : 'Symbol count'}</span><strong>{status?.symbolCount ?? 0}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '最近同步' : 'Last sync'}</span><strong>{fmtDateTime(status?.asOf, locale)}</strong></div>
            <div className="status-copy">{status?.message || state.integrationStatus.marketData.message}</div>
            {loading ? <div className="status-copy">{locale === 'zh' ? '正在同步后端行情状态...' : 'Syncing backend market status...'}</div> : null}
          </div>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.universeMonitor}</div><div className="panel-copy">{locale === 'zh' ? '查看价格、评分和当前决策方向。' : 'Review pricing, scores, and current decision posture.'}</div></div><div className="panel-badge badge-info">{state.stockStates.length} SYMBOLS</div></div>
          <UniverseTable />
        </article>
      </section>
    </>
  );
}
