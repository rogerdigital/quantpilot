import type { StockState } from '@shared-types/trading.ts';
import { APP_CONFIG, INITIAL_SERIES_LENGTH, STOCK_UNIVERSE } from './config.ts';

function seededNoise(index: number, step: number) {
  const base = Math.sin(index * 12.9898 + step * 78.233) * 43758.5453;
  return base - Math.floor(base);
}

function buildPriceSeries(basePrice: number, index: number) {
  const series = [];
  let price = basePrice;
  for (let i = 0; i < INITIAL_SERIES_LENGTH; i += 1) {
    const shock = (seededNoise(index, i) - 0.5) * 0.018;
    const drift = Math.sin((i + index) / 7) * 0.0032;
    price *= 1 + shock + drift;
    series.push(+price.toFixed(2));
  }
  return series;
}

function sanitizeQuoteNumber(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function createTickerState(ticker: StockState, index: number): StockState {
  const history = buildPriceSeries(ticker.price, index);
  const lastPrice = history[history.length - 1];
  return {
    ...ticker,
    price: lastPrice,
    prevClose: history[history.length - 2],
    high: Math.max(...history.slice(-8)),
    low: Math.min(...history.slice(-8)),
    volume: 1000000 + index * 240000,
    turnover: (1000000 + index * 240000) * lastPrice,
    history,
    signal: 'HOLD',
    actionText: 'Watch for engine review',
    score: 50,
    features: {},
  };
}

export function scoreStock(stock: StockState) {
  const history = stock.history;
  const last = history.at(-1) || stock.price;
  const prev = history.at(-2) || stock.prevClose || stock.price;
  const short = history.slice(-5).reduce((sum, value) => sum + value, 0) / 5;
  const long = history.slice(-18).reduce((sum, value) => sum + value, 0) / 18;
  const momentum = (last / history[Math.max(history.length - 8, 0)] - 1) * 100;
  const intraday = (last / prev - 1) * 100;
  const volatility = Math.abs(intraday) * 8 + stock.volatility * 6;
  const trend = (short / long - 1) * 100;
  const score = 52 + trend * 8 + momentum * 1.6 - volatility * 0.7 + stock.drift * 28;
  stock.features = { short, long, momentum, intraday, volatility, trend };
  stock.score = Math.max(0, Math.min(100, score));
  if (stock.score >= APP_CONFIG.buyThreshold) {
    stock.signal = 'BUY';
    stock.actionText = 'Add candidate';
  } else if (stock.score <= APP_CONFIG.sellThreshold) {
    stock.signal = 'SELL';
    stock.actionText = 'Trim or exit';
  } else {
    stock.signal = 'HOLD';
    stock.actionText = 'Hold and watch';
  }
}

export function updateTicker(stock: StockState, index: number, cycle: number, riskGuard: boolean) {
  const noise = (seededNoise(index + 1, cycle + 1) - 0.5) * (stock.volatility / 100);
  const directional = Math.sin((cycle + index * 3) / 6) * (stock.drift / 100);
  const shock = riskGuard && index === cycle % STOCK_UNIVERSE.length ? -0.003 : 0;
  const next = stock.price * (1 + noise + directional + shock);
  stock.prevClose = stock.price;
  stock.price = Math.max(next, 3);
  stock.history.push(+stock.price.toFixed(2));
  if (stock.history.length > 80) {
    stock.history.shift();
  }
  stock.high = Math.max(...stock.history.slice(-20));
  stock.low = Math.min(...stock.history.slice(-20));
  stock.volume = Math.round(stock.volume * (0.97 + seededNoise(index, cycle) * 0.08));
  stock.turnover = stock.volume * stock.price;
  scoreStock(stock);
}

export function applyQuotePatch(
  stockStates: StockState[],
  quotes: Array<{ symbol: string; price: number; prevClose: number; high: number; low: number; volume: number; turnover: number }>
) {
  if (!quotes.length) {
    return;
  }
  const quoteMap = new Map(quotes.map((quote) => [quote.symbol, quote]));
  stockStates.forEach((stock) => {
    const nextQuote = quoteMap.get(stock.symbol);
    if (!nextQuote) {
      return;
    }
    stock.prevClose = sanitizeQuoteNumber(nextQuote.prevClose, stock.prevClose);
    stock.price = sanitizeQuoteNumber(nextQuote.price, stock.price);
    stock.high = sanitizeQuoteNumber(nextQuote.high, Math.max(stock.high, stock.price));
    stock.low = sanitizeQuoteNumber(nextQuote.low, Math.min(stock.low, stock.price));
    stock.volume = sanitizeQuoteNumber(nextQuote.volume, stock.volume);
    stock.turnover = sanitizeQuoteNumber(nextQuote.turnover, stock.turnover);
    stock.history.push(+stock.price.toFixed(2));
    if (stock.history.length > 80) {
      stock.history.shift();
    }
    scoreStock(stock);
  });
}

export function createInitialStockStates() {
  const stockStates = STOCK_UNIVERSE.map((ticker, index) => createTickerState(ticker as StockState, index));
  stockStates.forEach(scoreStock);
  return stockStates;
}
