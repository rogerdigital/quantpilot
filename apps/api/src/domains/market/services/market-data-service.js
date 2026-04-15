// @ts-nocheck
/**
 * Market data service — fetches from Alpaca when configured, falls back to
 * trading-engine synthetic data when QUANTPILOT_USE_MOCK_DATA=true or no credentials.
 */
import { generateHistoricalOhlcv } from '../../../../../../packages/trading-engine/src/backtest/data.js';

const ALPACA_DATA_BASE = 'https://data.alpaca.markets';
const ALPACA_KEY_ID = () => process.env.ALPACA_KEY_ID || '';
const ALPACA_SECRET_KEY = () => process.env.ALPACA_SECRET_KEY || '';
const ALPACA_DATA_FEED = () => process.env.ALPACA_DATA_FEED || 'iex';
const USE_MOCK = () =>
  process.env.QUANTPILOT_USE_MOCK_DATA === 'true' ||
  !ALPACA_KEY_ID() ||
  !ALPACA_SECRET_KEY();

function alpacaHeaders() {
  return {
    Accept: 'application/json',
    'APCA-API-KEY-ID': ALPACA_KEY_ID(),
    'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY(),
  };
}

function normalizeAlpacaBar(bar) {
  return {
    time: bar.t ? bar.t.split('T')[0] : '',
    open: Number(bar.o || 0),
    high: Number(bar.h || 0),
    low: Number(bar.l || 0),
    close: Number(bar.c || 0),
    volume: Number(bar.v || 0),
  };
}

/**
 * Get historical OHLCV bars for a symbol.
 * Uses Alpaca API when credentials are configured, otherwise synthetic data.
 *
 * @param {string} symbol - Ticker symbol e.g. "AAPL"
 * @param {number} days - Number of calendar days of history
 * @param {string} [timeframe] - "1Day" | "1Hour" | "15Min" (default: "1Day")
 * @returns {Promise<{ok: boolean, symbol: string, bars: Array, source: string}>}
 */
export async function getHistoricalBars(symbol, days = 90, timeframe = '1Day') {
  if (!symbol) {
    return { ok: false, symbol: '', bars: [], source: 'none', error: 'symbol is required' };
  }

  const upperSymbol = symbol.toUpperCase();

  if (USE_MOCK()) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const bars = generateHistoricalOhlcv(
      upperSymbol,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    return { ok: true, symbol: upperSymbol, bars, source: 'synthetic', timeframe };
  }

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const url = new URL(`/v2/stocks/${encodeURIComponent(upperSymbol)}/bars`, ALPACA_DATA_BASE);
    url.searchParams.set('timeframe', timeframe);
    url.searchParams.set('start', startDate.toISOString().split('T')[0]);
    url.searchParams.set('end', endDate.toISOString().split('T')[0]);
    url.searchParams.set('limit', String(Math.min(days, 1000)));
    url.searchParams.set('feed', ALPACA_DATA_FEED());
    url.searchParams.set('sort', 'asc');

    const response = await fetch(url.toString(), { headers: alpacaHeaders() });

    if (!response.ok) {
      // Fallback to synthetic data on API error
      console.warn(`[market-data] Alpaca bars error HTTP ${response.status} for ${upperSymbol}, using synthetic fallback`);
      const endD = new Date();
      const startD = new Date();
      startD.setDate(startD.getDate() - days);
      const bars = generateHistoricalOhlcv(upperSymbol, startD.toISOString().split('T')[0], endD.toISOString().split('T')[0]);
      return { ok: true, symbol: upperSymbol, bars, source: 'synthetic_fallback', timeframe };
    }

    const payload = await response.json();
    const bars = Array.isArray(payload?.bars) ? payload.bars.map(normalizeAlpacaBar) : [];

    if (bars.length === 0) {
      // Symbol might not be in Alpaca universe, use synthetic
      const endD = new Date();
      const startD = new Date();
      startD.setDate(startD.getDate() - days);
      const syntheticBars = generateHistoricalOhlcv(upperSymbol, startD.toISOString().split('T')[0], endD.toISOString().split('T')[0]);
      return { ok: true, symbol: upperSymbol, bars: syntheticBars, source: 'synthetic_fallback', timeframe };
    }

    return { ok: true, symbol: upperSymbol, bars, source: 'alpaca', timeframe };
  } catch (err) {
    console.error('[market-data] Error fetching bars:', err.message);
    const endD = new Date();
    const startD = new Date();
    startD.setDate(startD.getDate() - days);
    const bars = generateHistoricalOhlcv(upperSymbol, startD.toISOString().split('T')[0], endD.toISOString().split('T')[0]);
    return { ok: true, symbol: upperSymbol, bars, source: 'synthetic_fallback', timeframe };
  }
}

/**
 * Get current market snapshots for multiple symbols.
 * Returns from Alpaca when configured, otherwise returns empty (upstream from Worker sync).
 */
export async function getMarketQuotes(symbols = []) {
  if (!symbols.length) return { ok: false, quotes: [], error: 'No symbols provided' };
  if (USE_MOCK()) return { ok: true, quotes: [], source: 'none', note: 'Mock mode: quotes come from Worker market sync' };

  try {
    const url = new URL('/v2/stocks/snapshots', ALPACA_DATA_BASE);
    url.searchParams.set('symbols', symbols.join(','));
    url.searchParams.set('feed', ALPACA_DATA_FEED());

    const response = await fetch(url.toString(), { headers: alpacaHeaders() });
    if (!response.ok) return { ok: false, quotes: [], error: `Alpaca snapshots HTTP ${response.status}` };

    const payload = await response.json();
    const quotes = Object.entries(payload?.snapshots || {}).map(([sym, snap]) => {
      const price = Number(snap?.minuteBar?.c ?? snap?.latestTrade?.p ?? snap?.dailyBar?.c ?? 0);
      const prevClose = Number(snap?.prevDailyBar?.c ?? snap?.dailyBar?.o ?? price);
      const change = price - prevClose;
      const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;
      return {
        symbol: sym,
        price,
        change: parseFloat(change.toFixed(2)),
        changePct: parseFloat(changePct.toFixed(2)),
        volume: Number(snap?.dailyBar?.v ?? 0),
      };
    });

    return { ok: true, quotes, source: 'alpaca' };
  } catch (err) {
    return { ok: false, quotes: [], error: err.message };
  }
}
