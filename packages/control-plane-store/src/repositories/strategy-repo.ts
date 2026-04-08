// @ts-nocheck
import { trimAndSave } from '../shared.js';

const FILENAME = 'strategy-catalog.json';

const DEFAULT_STRATEGY_CATALOG = [
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
    baseline: true,
    champion: false,
    baselineUpdatedAt: '2026-03-10T09:30:00.000Z',
    championUpdatedAt: '',
    dataSource: 'control-plane-store.strategy-catalog',
    updatedAt: '2026-03-10T09:30:00.000Z',
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
    baseline: false,
    champion: false,
    baselineUpdatedAt: '',
    championUpdatedAt: '',
    dataSource: 'control-plane-store.strategy-catalog',
    updatedAt: '2026-03-10T09:30:00.000Z',
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
    baseline: false,
    champion: true,
    baselineUpdatedAt: '',
    championUpdatedAt: '2026-03-10T09:30:00.000Z',
    dataSource: 'control-plane-store.strategy-catalog',
    updatedAt: '2026-03-10T09:30:00.000Z',
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
    baseline: false,
    champion: false,
    baselineUpdatedAt: '',
    championUpdatedAt: '',
    dataSource: 'control-plane-store.strategy-catalog',
    updatedAt: '2026-03-10T09:30:00.000Z',
  },
];

function normalizeEntry(entry = {}) {
  return {
    id: entry.id || '',
    name: entry.name || 'Unknown Strategy',
    family: entry.family || 'general',
    timeframe: entry.timeframe || '',
    universe: entry.universe || '',
    status: entry.status || 'draft',
    score: Number(entry.score || 0),
    expectedReturnPct: Number(entry.expectedReturnPct || 0),
    maxDrawdownPct: Number(entry.maxDrawdownPct || 0),
    sharpe: Number(entry.sharpe || 0),
    summary: entry.summary || '',
    baseline: Boolean(entry.baseline),
    champion: Boolean(entry.champion),
    baselineUpdatedAt: entry.baselineUpdatedAt || '',
    championUpdatedAt: entry.championUpdatedAt || '',
    dataSource: entry.dataSource || 'control-plane-store.strategy-catalog',
    updatedAt: entry.updatedAt || new Date().toISOString(),
  };
}

export function createStrategyRepository(store) {
  function readCatalog() {
    const catalog = store.readCollection(FILENAME);
    if (!catalog.length) {
      store.writeCollection(FILENAME, DEFAULT_STRATEGY_CATALOG);
      return DEFAULT_STRATEGY_CATALOG.map((entry) => ({ ...entry }));
    }
    return catalog.map((entry) => normalizeEntry(entry));
  }

  function writeCatalog(entries) {
    trimAndSave(store, FILENAME, entries.map((entry) => normalizeEntry(entry)), 200);
  }

  return {
    listStrategies(limit = 100) {
      return readCatalog().slice(0, limit);
    },
    getStrategy(strategyId) {
      return readCatalog().find((entry) => entry.id === strategyId) || null;
    },
    upsertStrategy(payload = {}) {
      const catalog = readCatalog();
      const entry = normalizeEntry(payload);
      const index = catalog.findIndex((item) => item.id === entry.id);
      if (index === -1) {
        catalog.unshift(entry);
      } else {
        catalog[index] = {
          ...catalog[index],
          ...entry,
          updatedAt: new Date().toISOString(),
        };
      }
      writeCatalog(catalog);
      return catalog.find((item) => item.id === entry.id) || entry;
    },
  };
}
