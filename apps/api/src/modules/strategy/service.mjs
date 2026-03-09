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

function buildTemplateOrders(strategy) {
  if (strategy.family === 'trend') {
    return [
      { symbol: 'NVDA', side: 'BUY', weight: 0.4, rationale: 'Primary momentum leader with persistent relative strength.' },
      { symbol: 'MSFT', side: 'BUY', weight: 0.35, rationale: 'Large-cap trend confirmation with lower volatility.' },
      { symbol: 'AMZN', side: 'BUY', weight: 0.25, rationale: 'Secondary breakout confirmation inside the same regime.' },
    ];
  }
  if (strategy.family === 'mean-reversion') {
    return [
      { symbol: 'SPY', side: 'BUY', weight: 0.5, rationale: 'Oversold index basket mean reversion candidate.' },
      { symbol: 'QQQ', side: 'BUY', weight: 0.3, rationale: 'Higher beta leg for rebound capture.' },
      { symbol: 'IWM', side: 'SELL', weight: 0.2, rationale: 'Relative weakness hedge against failed bounce.' },
    ];
  }
  if (strategy.family === 'portfolio') {
    return [
      { symbol: 'QQQ', side: 'BUY', weight: 0.3, rationale: 'Momentum sleeve leader in current factor ranking.' },
      { symbol: 'TLT', side: 'BUY', weight: 0.25, rationale: 'Rates hedge inside multi-factor allocation.' },
      { symbol: 'GLD', side: 'BUY', weight: 0.2, rationale: 'Diversifier against equity volatility regime shift.' },
      { symbol: 'XLE', side: 'BUY', weight: 0.25, rationale: 'Carry and trend alignment inside rotation basket.' },
    ];
  }
  return [
    { symbol: 'BTCUSD', side: 'BUY', weight: 0.45, rationale: 'Primary breakout asset for crypto momentum expression.' },
    { symbol: 'ETHUSD', side: 'BUY', weight: 0.35, rationale: 'Liquidity support for secondary breakout continuation.' },
    { symbol: 'SOLUSD', side: 'BUY', weight: 0.2, rationale: 'Higher beta sleeve for upside convexity.' },
  ];
}

export function buildStrategyExecutionCandidate(payload) {
  const strategy = getStrategyCatalogItem(payload.strategyId);
  if (!strategy) {
    throw new Error(`Unknown strategy: ${payload.strategyId}`);
  }

  const capital = Number(payload.capital || 0);
  const orders = buildTemplateOrders(strategy).map((item) => ({
    ...item,
    qty: Math.max(Math.round((capital * item.weight) / 1000), 1),
  }));

  return {
    strategyId: strategy.id,
    strategyName: strategy.name,
    mode: payload.mode || 'paper',
    capital,
    status: strategy.status,
    metrics: {
      score: strategy.score,
      expectedReturnPct: strategy.expectedReturnPct,
      maxDrawdownPct: strategy.maxDrawdownPct,
      sharpe: strategy.sharpe,
    },
    orders,
    summary: `${strategy.name} generated ${orders.length} candidate orders for ${payload.mode || 'paper'} mode.`,
    metadata: {
      family: strategy.family,
      timeframe: strategy.timeframe,
      universe: strategy.universe,
      requestedBy: payload.requestedBy || 'operator',
    },
  };
}
