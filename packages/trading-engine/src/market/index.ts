import { DEFAULT_ENGINE_CONFIG, STOCK_UNIVERSE } from '../core/constants.js';
import { createTickerState } from '../core/shared.js';

function sanitizeQuoteNumber(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function scoreStock(stock, config = DEFAULT_ENGINE_CONFIG) {
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
  if (stock.score >= config.buyThreshold) {
    stock.signal = 'BUY';
    stock.actionText = 'Add candidate';
  } else if (stock.score <= config.sellThreshold) {
    stock.signal = 'SELL';
    stock.actionText = 'Trim or exit';
  } else {
    stock.signal = 'HOLD';
    stock.actionText = 'Hold and watch';
  }
}

export function createInitialStockStates(config = DEFAULT_ENGINE_CONFIG) {
  const stockStates = STOCK_UNIVERSE.map((ticker, index) => createTickerState(ticker, index));
  stockStates.forEach((stock) => scoreStock(stock, config));
  return stockStates;
}

function seededNoise(index, step) {
  const base = Math.sin(index * 12.9898 + step * 78.233) * 43758.5453;
  return base - Math.floor(base);
}

export function updateTicker(stock, index, cycle, riskGuard, stockCount, config = DEFAULT_ENGINE_CONFIG) {
  const noise = (seededNoise(index + 1, cycle + 1) - 0.5) * (stock.volatility / 100);
  const directional = Math.sin((cycle + index * 3) / 6) * (stock.drift / 100);
  const shock = riskGuard && index === cycle % stockCount ? -0.003 : 0;
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
  scoreStock(stock, config);
}

export function applyQuotePatch(stockStates, quotes, config = DEFAULT_ENGINE_CONFIG) {
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
    scoreStock(stock, config);
  });
}
