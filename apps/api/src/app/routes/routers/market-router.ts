// @ts-nocheck

/**
 * GET /api/market/ohlcv?symbol=AAPL&timeframe=1D&limit=100
 *
 * Returns historical OHLCV bars for the given symbol.
 * In simulation mode: generates deterministic bars using seeded math.
 * With Alpaca connected: proxies to Alpaca Bars API (future integration point).
 */

const STOCK_BASE_PRICES = {
  AAPL: 212.4,
  MSFT: 413.8,
  NVDA: 884.1,
  AMZN: 188.4,
  GOOGL: 170.6,
  META: 510.3,
  TSLA: 177.9,
  JPM: 213.5,
  UNH: 515.2,
  SPY: 521.0,
};

const STOCK_PARAMS = {
  AAPL: { drift: 0.12, volatility: 1.5 },
  MSFT: { drift: 0.11, volatility: 1.2 },
  NVDA: { drift: 0.18, volatility: 2.7 },
  AMZN: { drift: 0.13, volatility: 1.8 },
  GOOGL: { drift: 0.1, volatility: 1.4 },
  META: { drift: 0.14, volatility: 2.1 },
  TSLA: { drift: 0.09, volatility: 3.2 },
  JPM: { drift: 0.08, volatility: 1.1 },
  UNH: { drift: 0.09, volatility: 1.0 },
  SPY: { drift: 0.07, volatility: 0.8 },
};

function seededNoise(seed, step) {
  const raw = Math.sin(seed * 12.9898 + step * 78.233) * 43758.5453;
  return raw - Math.floor(raw); // 0..1
}

function isWeekday(date) {
  const d = date.getDay();
  return d !== 0 && d !== 6;
}

function generateOhlcv(symbol, limit) {
  const basePrice = STOCK_BASE_PRICES[symbol] ?? 100;
  const params = STOCK_PARAMS[symbol] ?? { drift: 0.08, volatility: 1.5 };
  const symbolSeed = symbol.split('').reduce((s, c) => s + c.charCodeAt(0), 0);

  // Collect 'limit' trading days going backward from today
  const dates = [];
  const cursor = new Date();
  while (dates.length < limit) {
    if (isWeekday(cursor)) {
      dates.unshift(cursor.toISOString().split('T')[0]);
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  // Walk forward building price series
  const bars = [];
  let price = basePrice * (0.85 + seededNoise(symbolSeed, 0) * 0.3); // randomize start
  for (let i = 0; i < dates.length; i++) {
    const noise = (seededNoise(symbolSeed, i + 1) - 0.5) * 2; // -1..1
    const noise2 = (seededNoise(symbolSeed, i + 100) - 0.5) * 2;
    const noise3 = seededNoise(symbolSeed, i + 200);
    const noise4 = seededNoise(symbolSeed, i + 300);
    const noise5 = seededNoise(symbolSeed, i + 400);

    const driftFactor = 1 + params.drift * 0.0003;
    const close = price * (driftFactor + noise * (params.volatility / 100) * 0.02);
    const open = price * (1 + noise2 * 0.005);
    const high = Math.max(open, close) * (1 + noise3 * 0.008);
    const low = Math.min(open, close) * (1 - noise4 * 0.008);
    const volume = Math.round(1e6 * (1 + noise5 * 0.5));

    bars.push({
      time: dates[i],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });

    price = close;
  }

  return bars;
}

export async function handleMarketRoutes({ req, reqUrl, res, writeJson }) {
  if (req.method !== 'GET' || reqUrl.pathname !== '/api/market/ohlcv') {
    return false;
  }

  const symbol = (reqUrl.searchParams.get('symbol') || 'SPY').toUpperCase();
  const timeframe = reqUrl.searchParams.get('timeframe') || '1D';
  const limit = Math.min(parseInt(reqUrl.searchParams.get('limit') || '100', 10), 500);

  try {
    const bars = generateOhlcv(symbol, limit);
    writeJson(res, 200, { symbol, timeframe, bars });
  } catch (err) {
    writeJson(res, 500, { ok: false, message: err.message || 'Failed to generate OHLCV data' });
  }

  return true;
}
