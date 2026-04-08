import { getStrategyCatalogItem } from './catalog-service.js';

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
  if (strategy.status === 'archived') {
    throw new Error(`Strategy ${payload.strategyId} is archived and cannot produce execution candidates`);
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
