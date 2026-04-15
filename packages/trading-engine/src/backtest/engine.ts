import { generateHistoricalOhlcv } from './data.js';
import {
  calcAnnualizedReturn,
  calcDailyReturns,
  calcMaxDrawdown,
  calcSharpe,
  calcTurnover,
  calcWinRate,
} from './metrics.js';
import type { BacktestConfig, BacktestResult, BacktestTrade, DailyEquityPoint, OhlcvBar } from './types.js';

type Holding = {
  qty: number;
  avgCost: number;
};

/**
 * Inline scoring: mirrors scoreStock() logic without mutating external state.
 * Returns score (0-100) and signal ('BUY' | 'HOLD' | 'SELL').
 */
function scoreFromHistory(
  history: number[],
  drift: number,
  volatilityParam: number,
  buyThreshold: number,
  sellThreshold: number
): { score: number; signal: 'BUY' | 'HOLD' | 'SELL' } {
  if (history.length < 5) return { score: 50, signal: 'HOLD' };
  const last = history.at(-1)!;
  const prev = history.at(-2) ?? last;
  const short = history.slice(-5).reduce((s, v) => s + v, 0) / 5;
  const long = history.slice(-18).reduce((s, v) => s + v, 0) / Math.min(18, history.length);
  const momentum = (last / history[Math.max(history.length - 8, 0)] - 1) * 100;
  const intraday = (last / prev - 1) * 100;
  const volatility = Math.abs(intraday) * 8 + volatilityParam * 6;
  const trend = (short / long - 1) * 100;
  const rawScore = 52 + trend * 8 + momentum * 1.6 - volatility * 0.7 + drift * 28;
  const score = Math.max(0, Math.min(100, rawScore));
  const signal = score >= buyThreshold ? 'BUY' : score <= sellThreshold ? 'SELL' : 'HOLD';
  return { score, signal };
}

type SymbolState = {
  symbol: string;
  drift: number;
  volatilityParam: number;
  bars: Map<string, { open: number; high: number; low: number; close: number; volume: number }>;
  tradingDates: string[];
  history: number[];
};

export function runBacktestEngine(config: BacktestConfig): BacktestResult {
  const {
    strategyId: _strategyId,
    runId: _runId,
    startDate,
    endDate,
    initialCapital,
    universe,
    buyThreshold,
    sellThreshold,
    maxPositionWeight,
    slippagePct,
    commissionPct,
  } = config;

  // Build per-symbol OHLCV maps
  const symbolStates: SymbolState[] = universe.map((symbol) => {
    // Use external bars if provided (from Alpaca), otherwise generate synthetic data
    const rawBars: OhlcvBar[] = config.externalBars?.[symbol]
      ? config.externalBars[symbol]
      : generateHistoricalOhlcv(symbol, startDate, endDate);
    const bars = new Map(rawBars.map((b) => [b.time, b]));
    const tradingDates = rawBars.map((b) => b.time);

    // Approximate drift/volatility from STOCK_UNIVERSE constants via name match
    const driftMap: Record<string, { drift: number; volatility: number }> = {
      AAPL: { drift: 0.12, volatility: 1.5 },
      MSFT: { drift: 0.11, volatility: 1.2 },
      NVDA: { drift: 0.18, volatility: 2.7 },
      AMZN: { drift: 0.13, volatility: 1.8 },
      META: { drift: 0.14, volatility: 2.1 },
      GOOGL: { drift: 0.1, volatility: 1.5 },
      TSLA: { drift: 0.09, volatility: 3.2 },
      JPM: { drift: 0.08, volatility: 1.1 },
      UNH: { drift: 0.08, volatility: 1.3 },
      XOM: { drift: 0.05, volatility: 1.1 },
    };
    const params = driftMap[symbol] ?? { drift: 0.08, volatility: 1.5 };

    return {
      symbol,
      drift: params.drift,
      volatilityParam: params.volatility,
      bars,
      tradingDates,
      history: [],
    };
  });

  // Collect all unique trading dates across all symbols, sorted
  const allDatesSet = new Set<string>();
  for (const s of symbolStates) {
    for (const d of s.tradingDates) {
      allDatesSet.add(d);
    }
  }
  const allDates = [...allDatesSet].sort();

  let cash = initialCapital;
  const holdings: Map<string, Holding> = new Map();
  const equityCurve: DailyEquityPoint[] = [];
  const trades: BacktestTrade[] = [];

  for (const date of allDates) {
    // Update price histories
    symbolStates.forEach((ss) => {
      const bar = ss.bars.get(date);
      if (bar) ss.history.push(bar.close);
    });

    // Current market prices
    const prices: Map<string, number> = new Map();
    symbolStates.forEach((ss) => {
      const bar = ss.bars.get(date);
      if (bar) prices.set(ss.symbol, bar.close);
    });

    // Calculate portfolio equity
    let portfolioValue = cash;
    for (const [sym, holding] of holdings) {
      const price = prices.get(sym);
      if (price) portfolioValue += holding.qty * price;
    }

    // Score each symbol and generate orders
    for (const ss of symbolStates) {
      if (ss.history.length < 5) continue;

      const bar = ss.bars.get(date);
      if (!bar) continue;

      const { signal } = scoreFromHistory(
        ss.history,
        ss.drift,
        ss.volatilityParam,
        buyThreshold,
        sellThreshold
      );

      const currentPrice = bar.close;
      const holding = holdings.get(ss.symbol);
      const currentPositionValue = holding ? holding.qty * currentPrice : 0;
      const currentWeight = portfolioValue > 0 ? currentPositionValue / portfolioValue : 0;

      if (signal === 'BUY' && currentWeight < maxPositionWeight * 0.85) {
        // Buy up to maxPositionWeight
        const targetValue = portfolioValue * maxPositionWeight;
        const buyValue = Math.min(targetValue - currentPositionValue, cash * 0.95);
        if (buyValue > 100) {
          const execPrice = currentPrice * (1 + slippagePct);
          const commission = buyValue * commissionPct;
          const qty = Math.floor((buyValue - commission) / execPrice);
          if (qty > 0) {
            const cost = qty * execPrice + commission;
            cash -= cost;
            const existing = holdings.get(ss.symbol);
            if (existing) {
              const totalQty = existing.qty + qty;
              existing.avgCost = (existing.qty * existing.avgCost + qty * execPrice) / totalQty;
              existing.qty = totalQty;
            } else {
              holdings.set(ss.symbol, { qty, avgCost: execPrice });
            }
            trades.push({ date, symbol: ss.symbol, side: 'buy', qty, price: execPrice, pnl: 0 });
          }
        }
      } else if (signal === 'SELL' && holding && holding.qty > 0) {
        // Sell 50% of position
        const sellQty = Math.floor(holding.qty * 0.5);
        if (sellQty > 0) {
          const execPrice = currentPrice * (1 - slippagePct);
          const commission = sellQty * execPrice * commissionPct;
          const proceeds = sellQty * execPrice - commission;
          const pnl = (execPrice - holding.avgCost) * sellQty - commission;
          cash += proceeds;
          holding.qty -= sellQty;
          if (holding.qty <= 0) holdings.delete(ss.symbol);
          trades.push({
            date,
            symbol: ss.symbol,
            side: 'sell',
            qty: sellQty,
            price: execPrice,
            pnl,
          });
        }
      }
    }

    // Recompute equity after trades
    let equity = cash;
    for (const [sym, holding] of holdings) {
      const price = prices.get(sym) ?? 0;
      equity += holding.qty * price;
    }
    equityCurve.push({ date, equity, cash });
  }

  // Calculate metrics
  const tradingDays = equityCurve.length;
  const startEquity = equityCurve[0]?.equity ?? initialCapital;
  const endEquity = equityCurve.at(-1)?.equity ?? initialCapital;

  const dailyReturns = calcDailyReturns(equityCurve);
  const sharpe = calcSharpe(dailyReturns);
  const maxDrawdownPct = calcMaxDrawdown(equityCurve);
  const annualizedReturnPct = calcAnnualizedReturn(startEquity, endEquity, tradingDays);
  const winRatePct = calcWinRate(trades);
  const turnoverPct = calcTurnover(trades, initialCapital, tradingDays);

  const status = maxDrawdownPct > 10 || sharpe < 1 ? 'needs_review' : 'completed';

  return {
    status,
    annualizedReturnPct: parseFloat(annualizedReturnPct.toFixed(2)),
    maxDrawdownPct: parseFloat(maxDrawdownPct.toFixed(2)),
    sharpe: parseFloat(sharpe.toFixed(3)),
    winRatePct: parseFloat(winRatePct.toFixed(1)),
    turnoverPct: parseFloat(turnoverPct.toFixed(1)),
    equityCurve,
    tradeCount: trades.length,
  };
}
