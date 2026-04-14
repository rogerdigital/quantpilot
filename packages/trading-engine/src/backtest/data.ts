import { STOCK_UNIVERSE } from '../core/constants.js';

type OhlcvBar = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function seededNoise(seed: number, step: number): number {
  const raw = Math.sin(seed * 12.9898 + step * 78.233) * 43758.5453;
  return raw - Math.floor(raw); // 0..1
}

function isWeekday(date: Date): boolean {
  const d = date.getDay();
  return d !== 0 && d !== 6;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function dateDiff(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/**
 * Generate deterministic historical OHLCV bars for a symbol between startDate and endDate.
 * Uses the same seededNoise algorithm as the live market simulation.
 */
export function generateHistoricalOhlcv(
  symbol: string,
  startDate: string,
  endDate: string
): OhlcvBar[] {
  const stock = STOCK_UNIVERSE.find((s) => s.symbol === symbol);
  const basePrice = stock?.price ?? 100;
  const drift = stock?.drift ?? 0.08;
  const volatility = stock?.volatility ?? 1.5;
  const symbolSeed = symbol.split('').reduce((s, c) => s + c.charCodeAt(0), 0);

  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = dateDiff(start, end);

  // Walk forward from a pre-start price so the series looks continuous
  // Pre-warm with 60 days before start to get stable initial price
  const warmup = 60;
  let price = basePrice * (0.82 + seededNoise(symbolSeed, 999) * 0.36);

  for (let i = 0; i < warmup; i++) {
    const noise = (seededNoise(symbolSeed, i) - 0.5) * 2;
    price = price * (1 + drift * 0.0003 + noise * (volatility / 100) * 0.02);
  }

  const bars: OhlcvBar[] = [];
  let dayIndex = warmup;

  for (let i = 0; i <= totalDays; i++) {
    const current = addDays(start, i);
    if (!isWeekday(current)) continue;

    const noise = (seededNoise(symbolSeed, dayIndex + 1) - 0.5) * 2;
    const noise2 = (seededNoise(symbolSeed, dayIndex + 100) - 0.5) * 2;
    const noise3 = seededNoise(symbolSeed, dayIndex + 200);
    const noise4 = seededNoise(symbolSeed, dayIndex + 300);
    const noise5 = seededNoise(symbolSeed, dayIndex + 400);

    const close = price * (1 + drift * 0.0003 + noise * (volatility / 100) * 0.02);
    const open = price * (1 + noise2 * 0.005);
    const high = Math.max(open, close) * (1 + noise3 * 0.008);
    const low = Math.min(open, close) * (1 - noise4 * 0.008);
    const volume = Math.round(1e6 * (1 + noise5 * 0.5));

    bars.push({
      time: current.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });

    price = close;
    dayIndex++;
  }

  return bars;
}
