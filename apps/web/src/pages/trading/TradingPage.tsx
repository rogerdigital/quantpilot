import { useState } from 'react';
import { ChartCanvas, EmptyState, TabPanel } from '../../components/layout/ConsoleChrome.tsx';
import { copy, useLocale } from '../../modules/console/console.i18n.tsx';
import {
  fmtCurrency,
  fmtDateTime,
  fmtPct,
  translateOrderStatus,
  translateSide,
  translateSignal,
} from '../../modules/console/console.utils.ts';
import { useTradingSystem } from '../../store/trading-system/TradingSystemProvider.tsx';
import {
  blotterPanel,
  chartBody,
  chartPanel,
  chartPanelHead,
  chartSignalCard,
  chartSignalStrip,
  chartTimeframeBtn,
  chartTimeframeBtnActive,
  chartToolbar,
  orderTypeTab,
  orderTypeTabActive,
  orderTypeTabs,
  tradeBtnRow,
  tradeBuyBtn,
  tradeInfoRow,
  tradeInput,
  tradeInputGroup,
  tradeInputLabel,
  tradePanel,
  tradePanelTitle,
  tradeSellBtn,
  tradingGrid,
  tradingHeader,
  tradingHeaderChange,
  tradingHeaderPrice,
  tradingHeaderStat,
  tradingHeaderStats,
  tradingHeaderSymbol,
  tradingShell,
  watchlistHead,
  watchlistItem,
  watchlistItemActive,
  watchlistList,
  watchlistPanel,
} from './TradingPage.css.ts';

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D'] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

type OrderType = 'limit' | 'market' | 'stop';

export function TradingPage() {
  const { state } = useTradingSystem();
  const { locale } = useLocale();

  const [selectedSymbol, setSelectedSymbol] = useState<string>(
    () => state.stockStates[0]?.symbol ?? 'SPY'
  );
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [limitPrice, setLimitPrice] = useState('');
  const [qty, setQty] = useState('');

  const selectedStock = state.stockStates.find((s) => s.symbol === selectedSymbol);
  const priceChange = selectedStock
    ? ((selectedStock.price - selectedStock.prevClose) / selectedStock.prevClose) * 100
    : 0;
  const changeTone = priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'neutral';

  const buyCount = state.stockStates.filter((s) => s.signal === 'BUY').length;
  const holdCount = state.stockStates.filter((s) => s.signal === 'HOLD').length;
  const sellCount = state.stockStates.filter((s) => s.signal === 'SELL').length;

  const allOrders = [
    ...state.accounts.live.orders.map((o) => ({ ...o, account: 'live' as const })),
    ...state.accounts.paper.orders.map((o) => ({ ...o, account: 'paper' as const })),
  ]
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.submittedAt || 0).getTime() -
        new Date(a.updatedAt || a.submittedAt || 0).getTime()
    )
    .slice(0, 20);

  const allPositions = [
    ...Object.entries(state.accounts.live.holdings).map(([symbol, h]) => ({
      symbol,
      ...h,
      account: 'live' as const,
    })),
    ...Object.entries(state.accounts.paper.holdings).map(([symbol, h]) => ({
      symbol,
      ...h,
      account: 'paper' as const,
    })),
  ];

  const orderTypeLabel: Record<OrderType, string> = {
    limit: locale === 'zh' ? '限价' : 'LIMIT',
    market: locale === 'zh' ? '市价' : 'MARKET',
    stop: locale === 'zh' ? '止损' : 'STOP',
  };

  return (
    <div className={tradingShell}>
      {/* Header bar */}
      <div className={tradingHeader}>
        <div className={tradingHeaderSymbol}>
          <div>
            <div className="eyebrow">{locale === 'zh' ? '交易终端' : 'Trading Terminal'}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-data)',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--accent-live)',
                  letterSpacing: '0.04em',
                }}
              >
                {selectedSymbol}
              </span>
              <span className={tradingHeaderPrice}>
                {selectedStock ? selectedStock.price.toFixed(2) : '--'}
              </span>
              <span className={tradingHeaderChange[changeTone]}>
                {priceChange >= 0 ? '+' : ''}
                {fmtPct(priceChange)}
              </span>
            </div>
          </div>
        </div>

        <div className={tradingHeaderStats}>
          <div className={tradingHeaderStat}>
            <span>{locale === 'zh' ? '今日信号' : 'Signals'}</span>
            <strong>
              {buyCount}B / {holdCount}H / {sellCount}S
            </strong>
          </div>
          <div className={tradingHeaderStat}>
            <span>{locale === 'zh' ? '评分' : 'Score'}</span>
            <strong>{selectedStock ? selectedStock.score.toFixed(1) : '--'}</strong>
          </div>
          <div className={tradingHeaderStat}>
            <span>{locale === 'zh' ? '当前信号' : 'Signal'}</span>
            <strong
              style={{
                color:
                  selectedStock?.signal === 'BUY'
                    ? 'var(--buy)'
                    : selectedStock?.signal === 'SELL'
                      ? 'var(--sell)'
                      : 'var(--hold)',
              }}
            >
              {selectedStock ? translateSignal(locale, selectedStock.signal) : '--'}
            </strong>
          </div>
          <div className={tradingHeaderStat}>
            <span>{locale === 'zh' ? '模拟 NAV' : 'Paper NAV'}</span>
            <strong>{fmtCurrency(state.accounts.paper.nav)}</strong>
          </div>
          <div className={tradingHeaderStat}>
            <span>{locale === 'zh' ? '实盘 NAV' : 'Live NAV'}</span>
            <strong>{fmtCurrency(state.accounts.live.nav)}</strong>
          </div>
        </div>
      </div>

      {/* Three-column grid */}
      <div className={tradingGrid}>
        {/* Watchlist */}
        <aside className={watchlistPanel}>
          <div className={watchlistHead}>{locale === 'zh' ? '监控列表' : 'Watchlist'}</div>
          <div className={watchlistList}>
            {state.stockStates.length === 0 ? (
              <EmptyState message={locale === 'zh' ? '无标的' : 'No symbols'} />
            ) : (
              state.stockStates.map((stock) => {
                const chg = ((stock.price - stock.prevClose) / stock.prevClose) * 100;
                const isActive = stock.symbol === selectedSymbol;
                return (
                  <div
                    key={stock.symbol}
                    className={`${watchlistItem}${isActive ? ` ${watchlistItemActive}` : ''}`}
                    onClick={() => setSelectedSymbol(stock.symbol)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedSymbol(stock.symbol)}
                  >
                    <div>
                      <div className="wl-symbol">{stock.symbol}</div>
                      <div className="wl-name">{stock.name}</div>
                    </div>
                    <div>
                      <div className="wl-price">{stock.price.toFixed(2)}</div>
                      <div
                        className="wl-change"
                        style={{ color: chg >= 0 ? 'var(--buy)' : 'var(--sell)' }}
                      >
                        {chg >= 0 ? '+' : ''}
                        {chg.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Chart */}
        <div className={chartPanel}>
          <div className={chartPanelHead}>
            <div
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-strong)',
              }}
            >
              {selectedSymbol}
              <span style={{ color: 'var(--muted)', marginLeft: '8px', fontWeight: 400 }}>
                {locale === 'zh' ? '权益曲线' : 'Equity Curve'}
              </span>
            </div>
            <div className={chartToolbar}>
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  className={`${chartTimeframeBtn}${tf === timeframe ? ` ${chartTimeframeBtnActive}` : ''}`}
                  onClick={() => setTimeframe(tf)}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className={chartBody}>
            <ChartCanvas kind="equity" />

            <div className={chartSignalStrip}>
              <div className={chartSignalCard}>
                <div className="sig-label">BUY</div>
                <div className="sig-value" style={{ color: 'var(--buy)' }}>
                  {buyCount}
                </div>
              </div>
              <div className={chartSignalCard}>
                <div className="sig-label">HOLD</div>
                <div className="sig-value" style={{ color: 'var(--hold)' }}>
                  {holdCount}
                </div>
              </div>
              <div className={chartSignalCard}>
                <div className="sig-label">SELL</div>
                <div className="sig-value" style={{ color: 'var(--sell)' }}>
                  {sellCount}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Panel */}
        <div className={tradePanel}>
          <div className={tradePanelTitle}>{locale === 'zh' ? '下单' : 'Place Order'}</div>

          <div className={orderTypeTabs}>
            {(['limit', 'market', 'stop'] as OrderType[]).map((t) => (
              <button
                key={t}
                type="button"
                className={`${orderTypeTab}${t === orderType ? ` ${orderTypeTabActive}` : ''}`}
                onClick={() => setOrderType(t)}
              >
                {orderTypeLabel[t]}
              </button>
            ))}
          </div>

          {orderType === 'limit' || orderType === 'stop' ? (
            <div className={tradeInputGroup}>
              <div className={tradeInputLabel}>
                {orderType === 'stop'
                  ? locale === 'zh'
                    ? '止损价'
                    : 'Stop Price'
                  : locale === 'zh'
                    ? '限价'
                    : 'Limit Price'}
              </div>
              <input
                type="number"
                className={tradeInput}
                placeholder={selectedStock ? selectedStock.price.toFixed(2) : '0.00'}
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
              />
            </div>
          ) : null}

          <div className={tradeInputGroup}>
            <div className={tradeInputLabel}>{locale === 'zh' ? '数量 (股)' : 'Quantity'}</div>
            <input
              type="number"
              className={tradeInput}
              placeholder="100"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>

          <div className={tradeBtnRow}>
            <button type="button" className={tradeBuyBtn}>
              {locale === 'zh' ? '买入' : 'BUY'}
            </button>
            <button type="button" className={tradeSellBtn}>
              {locale === 'zh' ? '卖出' : 'SELL'}
            </button>
          </div>

          <div style={{ display: 'grid', gap: '0' }}>
            <div className={tradeInfoRow}>
              <span>{locale === 'zh' ? '标的' : 'Symbol'}</span>
              <strong style={{ color: 'var(--accent-live)' }}>{selectedSymbol}</strong>
            </div>
            <div className={tradeInfoRow}>
              <span>{locale === 'zh' ? '现价' : 'Last Price'}</span>
              <strong>{selectedStock ? selectedStock.price.toFixed(2) : '--'}</strong>
            </div>
            <div className={tradeInfoRow}>
              <span>{locale === 'zh' ? '信号' : 'Signal'}</span>
              <strong
                style={{
                  color:
                    selectedStock?.signal === 'BUY'
                      ? 'var(--buy)'
                      : selectedStock?.signal === 'SELL'
                        ? 'var(--sell)'
                        : 'var(--hold)',
                }}
              >
                {selectedStock ? translateSignal(locale, selectedStock.signal) : '--'}
              </strong>
            </div>
            <div className={tradeInfoRow}>
              <span>{locale === 'zh' ? '评分' : 'Score'}</span>
              <strong>{selectedStock ? selectedStock.score.toFixed(1) : '--'}</strong>
            </div>
            <div className={tradeInfoRow}>
              <span>{locale === 'zh' ? '模拟现金' : 'Paper Cash'}</span>
              <strong>{fmtCurrency(state.accounts.paper.cash)}</strong>
            </div>
          </div>

          <div
            style={{
              padding: '10px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--line)',
              background: 'rgba(255, 183, 0, 0.04)',
              fontSize: '11px',
              color: 'var(--muted)',
              lineHeight: 1.5,
            }}
          >
            {locale === 'zh'
              ? '⚠ 下单功能为界面演示，实际委托请通过 Agent 或执行模块处理。'
              : '⚠ Order placement is UI-only. Use the Agent or Execution module to submit real orders.'}
          </div>
        </div>
      </div>

      {/* Bottom blotter */}
      <div className={blotterPanel}>
        <TabPanel
          tabs={[
            {
              key: 'positions',
              label:
                locale === 'zh'
                  ? `持仓 (${allPositions.length})`
                  : `Positions (${allPositions.length})`,
              content: (
                <div className="panel-body panel-body-sm">
                  {allPositions.length === 0 ? (
                    <EmptyState message={copy[locale].terms.noPositions} />
                  ) : (
                    <div className="focus-list focus-list-terminal">
                      {allPositions.map((pos, i) => (
                        <div className="focus-row" key={`${pos.symbol}-${i}`}>
                          <div className="symbol-cell">
                            <strong>{pos.symbol}</strong>
                            <span
                              style={{
                                color: pos.account === 'live' ? 'var(--buy)' : 'var(--accent-live)',
                              }}
                            >
                              {pos.account === 'live'
                                ? copy[locale].labels.live
                                : copy[locale].labels.paper}
                            </span>
                          </div>
                          <div className="focus-metric">
                            <span>{copy[locale].terms.qty}</span>
                            <strong>{pos.shares}</strong>
                          </div>
                          <div className="focus-metric">
                            <span>{copy[locale].terms.avgCost}</span>
                            <strong>{pos.avgCost.toFixed(2)}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'orders',
              label:
                locale === 'zh' ? `委托 (${allOrders.length})` : `Orders (${allOrders.length})`,
              content: (
                <div className="panel-body panel-body-sm">
                  {allOrders.length === 0 ? (
                    <EmptyState message={copy[locale].terms.noOrders} />
                  ) : (
                    <div className="focus-list focus-list-terminal">
                      {allOrders.map((order, i) => (
                        <div className="focus-row" key={`${order.id ?? order.symbol}-${i}`}>
                          <div className="symbol-cell">
                            <strong>{order.symbol}</strong>
                            <span
                              style={{
                                color:
                                  order.account === 'live' ? 'var(--buy)' : 'var(--accent-live)',
                              }}
                            >
                              {order.account === 'live'
                                ? copy[locale].labels.live
                                : copy[locale].labels.paper}
                            </span>
                          </div>
                          <div className="focus-metric">
                            <span className={order.side === 'BUY' ? 'text-up' : 'text-down'}>
                              {translateSide(locale, order.side)}
                            </span>
                            <strong>{order.qty}</strong>
                          </div>
                          <div className="focus-metric">
                            <span>{copy[locale].labels.status}</span>
                            <strong>{translateOrderStatus(locale, order.status)}</strong>
                          </div>
                          <span className="table-note">
                            {fmtDateTime(order.updatedAt || order.submittedAt, locale)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
