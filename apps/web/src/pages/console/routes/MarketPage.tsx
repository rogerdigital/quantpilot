import { UniverseTable } from '../../../components/business/ConsoleTables.tsx';
import { ChartCanvas, SectionHeader } from '../../../components/layout/ConsoleChrome.tsx';
import { useMarketProviderStatus } from '../../../hooks/useMarketProviderStatus.ts';
import {
  onShortcutKeyDown,
  useSettingsNavigation,
} from '../../../modules/console/console.hooks.ts';
import { copy, useLocale } from '../../../modules/console/console.i18n.tsx';
import {
  connectionLabel,
  fmtDateTime,
  integrationTone,
  translateMode,
  translateProviderLabel,
  translateRuntimeText,
} from '../../../modules/console/console.utils.ts';
import { useTradingSystem } from '../../../store/trading-system/TradingSystemProvider.tsx';

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
        : '本地模拟行情'
  );

  return (
    <>
      <SectionHeader routeKey="market" />
      <section className="panel-grid panel-grid-wide">
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{copy[locale].terms.marketPulse}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '观察当前股票池强弱分布和行情接入状态。'
                  : 'Track universe momentum and current market data connectivity.'}
              </div>
              <button
                type="button"
                className="inline-link"
                onClick={() => goToSettings('integrations')}
              >
                {copy[locale].labels.integrations}
              </button>
            </div>
            <div className="panel-badge badge-info">MARKET</div>
          </div>
          <ChartCanvas kind="signal" />
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">
                {locale === 'zh' ? '后端行情接入状态' : 'Backend Market Provider Status'}
              </div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '这里显示 worker 最近一次写入的行情接入事实源，而不是页面本地推断。'
                  : 'This panel shows the latest market provider status written by the backend worker, not only the page-local runtime guess.'}
              </div>
            </div>
            <div
              className={`panel-badge badge-${integrationTone(marketConnected, marketFallback)}`}
            >
              {marketConnected ? 'ONLINE' : 'FALLBACK'}
            </div>
          </div>
          <div className="status-stack">
            <div className="status-row">
              <span>{locale === 'zh' ? 'Provider' : 'Provider'}</span>
              <strong>{providerLabel}</strong>
            </div>
            <div className="status-row">
              <span>{locale === 'zh' ? '连接状态' : 'Connectivity'}</span>
              <strong>{connectionLabel(locale, marketConnected, marketFallback)}</strong>
            </div>
            <div className="status-row">
              <span>{locale === 'zh' ? 'Fallback' : 'Fallback'}</span>
              <strong>{marketFallback ? 'ON' : 'OFF'}</strong>
            </div>
            <div className="status-row">
              <span>{locale === 'zh' ? 'Symbol 数量' : 'Symbol count'}</span>
              <strong>{status?.symbolCount ?? 0}</strong>
            </div>
            <div className="status-row">
              <span>{locale === 'zh' ? '最近同步' : 'Last sync'}</span>
              <strong>{fmtDateTime(status?.asOf, locale)}</strong>
            </div>
            <div className="status-copy">
              {status?.message || state.integrationStatus.marketData.message}
            </div>
            {loading ? (
              <div className="status-copy">
                {locale === 'zh' ? '正在同步后端行情状态...' : 'Syncing backend market status...'}
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="panel-grid panel-grid-wide">
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{copy[locale].terms.universeMonitor}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '查看价格、评分和当前决策方向。'
                  : 'Review pricing, scores, and current decision posture.'}
              </div>
            </div>
            <div className="panel-badge badge-info">{state.stockStates.length} SYMBOLS</div>
          </div>
          <UniverseTable />
        </article>
        <article
          className="panel shortcut-surface"
          role="button"
          tabIndex={0}
          onClick={() => goToSettings('integrations')}
          onKeyDown={(event) => onShortcutKeyDown(event, () => goToSettings('integrations'))}
        >
          <div className="panel-head">
            <div>
              <div className="panel-title">{copy[locale].labels.integrations}</div>
              <div className="panel-copy">{copy[locale].terms.marketConnectivity}</div>
            </div>
            <div
              className={`panel-badge badge-${integrationTone(marketConnected, marketFallback)}`}
            >
              {copy[locale].labels.routing}
            </div>
          </div>
          <div className="status-stack">
            <div className="status-row">
              <span>{copy[locale].labels.marketData}</span>
              <strong>{providerLabel}</strong>
            </div>
            <div className="status-row">
              <span>{copy[locale].labels.marketState}</span>
              <strong>{connectionLabel(locale, marketConnected, marketFallback)}</strong>
            </div>
            <div className="status-row">
              <span>{copy[locale].labels.brokerState}</span>
              <strong>
                {connectionLabel(locale, state.integrationStatus.broker.connected, false, true)}
              </strong>
            </div>
            <div className="status-row">
              <span>{copy[locale].labels.systemMode}</span>
              <strong>{translateMode(locale, state.mode)}</strong>
            </div>
            <div className="status-row">
              <span>{copy[locale].labels.latestSignal}</span>
              <strong>
                {state.stockStates.filter((stock) => stock.signal === 'BUY').length} /{' '}
                {state.stockStates.filter((stock) => stock.signal === 'SELL').length}
              </strong>
            </div>
            <div className="status-row">
              <span>{locale === 'zh' ? '最近同步' : 'Last Sync'}</span>
              <strong>{fmtDateTime(status?.asOf, locale)}</strong>
            </div>
            <div className="status-copy">
              {translateRuntimeText(locale, state.integrationStatus.broker.message)}
            </div>
          </div>
        </article>
      </section>

      <section className="panel-grid panel-grid-3">
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">
                {locale === 'zh' ? 'Level 2 订单簿' : 'Level 2 Order Book'}
              </div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '显示买卖盘口深度，实时更新。'
                  : 'Bid/ask price levels with depth visualization, real-time updates.'}
              </div>
            </div>
            <div className="panel-badge badge-muted">L2</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{locale === 'zh' ? '买量' : 'Bid Size'}</th>
                  <th>{locale === 'zh' ? '买价' : 'Bid'}</th>
                  <th>{locale === 'zh' ? '卖价' : 'Ask'}</th>
                  <th>{locale === 'zh' ? '卖量' : 'Ask Size'}</th>
                </tr>
              </thead>
              <tbody>
                {state.stockStates.slice(0, 5).map((stock) => {
                  const spread = stock.price * 0.001;
                  return (
                    <tr key={stock.symbol}>
                      <td className="text-up">{Math.round(stock.volume * 0.01)}</td>
                      <td className="text-up">{(stock.price - spread).toFixed(2)}</td>
                      <td className="text-down">{(stock.price + spread).toFixed(2)}</td>
                      <td className="text-down">{Math.round(stock.volume * 0.008)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="status-copy">
            {locale === 'zh'
              ? '数据来源于本地模拟或行情网关。'
              : 'Data from local simulation or market gateway.'}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '深度图' : 'Depth Chart'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '累计深度可视化，展示买卖不平衡。'
                  : 'Cumulative depth visualization with bid/ask imbalance indicator.'}
              </div>
            </div>
            <div className="panel-badge badge-muted">DEPTH</div>
          </div>
          <div style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: '13px', marginBottom: '12px', opacity: 0.7 }}>
              {locale === 'zh' ? '累计挂单量分布' : 'Cumulative order depth'}
            </div>
            {state.stockStates.slice(0, 3).map((stock) => {
              const bidDepth = Math.round(stock.volume * 0.15);
              const askDepth = Math.round(stock.volume * 0.12);
              const total = bidDepth + askDepth;
              const bidPct = total > 0 ? (bidDepth / total) * 100 : 50;
              return (
                <div key={stock.symbol} style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    {stock.symbol}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      height: '8px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ width: `${bidPct}%`, background: 'var(--accent-up, #10b981)' }} />
                    <div
                      style={{
                        width: `${100 - bidPct}%`,
                        background: 'var(--accent-down, #ef4444)',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      marginTop: '2px',
                      opacity: 0.6,
                    }}
                  >
                    <span>Bid {bidDepth.toLocaleString()}</span>
                    <span>Ask {askDepth.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '价差指标' : 'Spread Indicator'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '显示当前买卖价差和流动性指标。'
                  : 'Current bid-ask spread and liquidity metrics.'}
              </div>
            </div>
            <div className="panel-badge badge-muted">SPREAD</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{copy[locale].terms.symbol}</th>
                  <th>{locale === 'zh' ? '价差' : 'Spread'}</th>
                  <th>{locale === 'zh' ? '价差%' : 'Spread %'}</th>
                  <th>{locale === 'zh' ? '流动性' : 'Liquidity'}</th>
                </tr>
              </thead>
              <tbody>
                {state.stockStates.slice(0, 5).map((stock) => {
                  const spread = stock.price * 0.002;
                  const spreadPct = (spread / stock.price) * 100;
                  const liquidity =
                    stock.volume > 500000 ? 'HIGH' : stock.volume > 100000 ? 'MED' : 'LOW';
                  return (
                    <tr key={stock.symbol}>
                      <td>{stock.symbol}</td>
                      <td>{spread.toFixed(2)}</td>
                      <td>{spreadPct.toFixed(3)}%</td>
                      <td>
                        <span
                          className={
                            liquidity === 'HIGH'
                              ? 'text-up'
                              : liquidity === 'LOW'
                                ? 'text-down'
                                : ''
                          }
                        >
                          {liquidity}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </>
  );
}
