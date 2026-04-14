import type { BacktestTrade, DailyEquityPoint } from './types.js';

function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}

function std(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

export function calcDailyReturns(curve: DailyEquityPoint[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < curve.length; i++) {
    const prev = curve[i - 1].equity;
    if (prev === 0) continue;
    returns.push(Math.log(curve[i].equity / prev));
  }
  return returns;
}

export function calcSharpe(returns: number[], riskFreeAnnual = 0.045): number {
  if (returns.length < 2) return 0;
  const annualRf = riskFreeAnnual / 252;
  const excess = returns.map((r) => r - annualRf);
  const s = std(excess);
  if (s === 0) return 0;
  return (mean(excess) * 252) / (s * Math.sqrt(252));
}

export function calcMaxDrawdown(curve: DailyEquityPoint[]): number {
  let peak = -Infinity;
  let maxDd = 0;
  for (const { equity } of curve) {
    if (equity > peak) peak = equity;
    const dd = peak > 0 ? (peak - equity) / peak : 0;
    if (dd > maxDd) maxDd = dd;
  }
  return maxDd * 100; // percentage
}

export function calcAnnualizedReturn(
  startEquity: number,
  endEquity: number,
  tradingDays: number
): number {
  if (tradingDays <= 0 || startEquity <= 0) return 0;
  return ((endEquity / startEquity) ** (252 / tradingDays) - 1) * 100;
}

export function calcWinRate(trades: BacktestTrade[]): number {
  const sells = trades.filter((t) => t.side === 'sell');
  if (!sells.length) return 0;
  return (sells.filter((t) => t.pnl > 0).length / sells.length) * 100;
}

export function calcTurnover(
  trades: BacktestTrade[],
  initialCapital: number,
  tradingDays: number
): number {
  if (!tradingDays || !initialCapital) return 0;
  const totalNotional = trades.reduce((s, t) => s + t.qty * t.price, 0);
  return (totalNotional / (initialCapital * (tradingDays / 252))) * 100;
}
