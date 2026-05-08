import type { BarInterval, NormalizedBar, Tick } from './feed-manager.js';

interface PartialBar {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  startTime: number;
  tickCount: number;
}

const INTERVAL_MS: Record<BarInterval, number> = {
  '1s': 1000,
  '1m': 60_000,
  '5m': 300_000,
  '15m': 900_000,
  '1h': 3_600_000,
  '1d': 86_400_000,
};

export interface BarAggregatorConfig {
  interval: BarInterval;
  validateBars: boolean;
  marketOpenHour: number;
  marketCloseHour: number;
  timezone: string;
}

const DEFAULT_CONFIG: BarAggregatorConfig = {
  interval: '1m',
  validateBars: true,
  marketOpenHour: 9,
  marketCloseHour: 16,
  timezone: 'America/New_York',
};

export class BarAggregator {
  private config: BarAggregatorConfig;
  private partialBars = new Map<string, PartialBar>();
  private completedBars: NormalizedBar[] = [];
  private barCallbacks: ((bar: NormalizedBar) => void)[] = [];

  constructor(config?: Partial<BarAggregatorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  onBar(callback: (bar: NormalizedBar) => void): void {
    this.barCallbacks.push(callback);
  }

  processTick(tick: Tick): NormalizedBar | null {
    const tickTime = new Date(tick.timestamp).getTime();
    const intervalMs = INTERVAL_MS[this.config.interval];
    const barStartTime = Math.floor(tickTime / intervalMs) * intervalMs;
    const key = `${tick.symbol}-${barStartTime}`;

    let partial = this.partialBars.get(key);
    if (!partial) {
      this.flushBarsForSymbol(tick.symbol, barStartTime);
      partial = {
        symbol: tick.symbol,
        open: tick.price,
        high: tick.price,
        low: tick.price,
        close: tick.price,
        volume: tick.volume,
        startTime: barStartTime,
        tickCount: 1,
      };
      this.partialBars.set(key, partial);
    } else {
      partial.high = Math.max(partial.high, tick.price);
      partial.low = Math.min(partial.low, tick.price);
      partial.close = tick.price;
      partial.volume += tick.volume;
      partial.tickCount += 1;
    }

    return null;
  }

  private flushBarsForSymbol(symbol: string, newStartTime: number): void {
    for (const [key, partial] of this.partialBars) {
      if (partial.symbol === symbol && partial.startTime < newStartTime) {
        const bar = this.createBar(partial);
        if (bar) {
          this.completedBars.push(bar);
          for (const cb of this.barCallbacks) cb(bar);
        }
        this.partialBars.delete(key);
      }
    }
  }

  private createBar(partial: PartialBar): NormalizedBar | null {
    if (partial.tickCount === 0) return null;

    const bar: NormalizedBar = {
      symbol: partial.symbol,
      open: parseFloat(partial.open.toFixed(2)),
      high: parseFloat(partial.high.toFixed(2)),
      low: parseFloat(partial.low.toFixed(2)),
      close: parseFloat(partial.close.toFixed(2)),
      volume: Math.round(partial.volume),
      timestamp: new Date(partial.startTime).toISOString(),
      interval: this.config.interval,
    };

    if (this.config.validateBars && !validateBar(bar)) {
      return null;
    }

    return bar;
  }

  flush(): NormalizedBar[] {
    const bars: NormalizedBar[] = [];
    for (const [, partial] of this.partialBars) {
      const bar = this.createBar(partial);
      if (bar) {
        bars.push(bar);
        this.completedBars.push(bar);
      }
    }
    this.partialBars.clear();
    return bars;
  }

  getCompletedBars(symbol?: string): NormalizedBar[] {
    if (symbol) return this.completedBars.filter((b) => b.symbol === symbol);
    return [...this.completedBars];
  }

  getPendingBar(symbol: string): PartialBar | null {
    for (const partial of this.partialBars.values()) {
      if (partial.symbol === symbol) return { ...partial };
    }
    return null;
  }

  clear(): void {
    this.partialBars.clear();
    this.completedBars = [];
  }
}

export function validateBar(bar: NormalizedBar): boolean {
  if (bar.high < bar.open || bar.high < bar.close) return false;
  if (bar.low > bar.open || bar.low > bar.close) return false;
  if (bar.low > bar.high) return false;
  if (bar.volume < 0) return false;
  return true;
}

export function getIntervalMs(interval: BarInterval): number {
  return INTERVAL_MS[interval];
}

export function isMarketHours(timestamp: string, config?: Partial<BarAggregatorConfig>): boolean {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const date = new Date(timestamp);
  const hour = date.getHours();
  return hour >= cfg.marketOpenHour && hour < cfg.marketCloseHour;
}
