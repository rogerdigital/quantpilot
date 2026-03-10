const STRATEGY_CATALOG = [
  {
    id: 'ema-cross-us',
    name: 'US Trend Ema Cross',
    family: 'trend',
    timeframe: '15m / 1d',
    universe: 'NASDAQ 100',
    status: 'candidate',
    score: 87,
    expectedReturnPct: 18.4,
    maxDrawdownPct: 9.8,
    sharpe: 1.42,
    summary: 'Uses medium-term trend confirmation and liquidity filters to stage long-only entries on large-cap momentum names.',
  },
  {
    id: 'rsi-revert-index',
    name: 'Index RSI Revert',
    family: 'mean-reversion',
    timeframe: '1h',
    universe: 'SPY / QQQ / IWM',
    status: 'researching',
    score: 74,
    expectedReturnPct: 12.1,
    maxDrawdownPct: 7.4,
    sharpe: 1.08,
    summary: 'Targets short-lived oversold rebounds with strict exit timing and volatility-aware sizing.',
  },
  {
    id: 'multi-factor-rotation',
    name: 'Multi Factor Rotation',
    family: 'portfolio',
    timeframe: '1d / 1w',
    universe: 'ETF Rotation Basket',
    status: 'paper',
    score: 91,
    expectedReturnPct: 22.6,
    maxDrawdownPct: 8.9,
    sharpe: 1.67,
    summary: 'Blends momentum, volatility, and carry signals to rotate capital across a constrained ETF basket.',
  },
  {
    id: 'breakout-crypto',
    name: 'Crypto Breakout Pulse',
    family: 'momentum',
    timeframe: '5m / 1h',
    universe: 'BTC / ETH / SOL',
    status: 'draft',
    score: 63,
    expectedReturnPct: 28.2,
    maxDrawdownPct: 15.7,
    sharpe: 0.94,
    summary: 'Captures breakout continuation on liquid crypto pairs, still pending slippage and overnight risk calibration.',
  },
];

export function listStrategyCatalog() {
  return {
    ok: true,
    asOf: '2026-03-10T09:30:00.000Z',
    strategies: STRATEGY_CATALOG,
  };
}

export function getStrategyCatalogItem(strategyId) {
  return STRATEGY_CATALOG.find((item) => item.id === strategyId) || null;
}
