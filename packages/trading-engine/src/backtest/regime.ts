export type RegimeBucket = 'bull' | 'bear' | 'sideways' | 'high_vol' | 'low_vol';

export type RegimePerformance = {
  regime: RegimeBucket;
  periodCount: number;
  annualizedReturn: number;
  sharpe: number;
  maxDrawdown: number;
};

export type RegimeClassification = {
  date: string;
  regime: RegimeBucket;
  dailyReturn: number;
};

export type RegimeConfig = {
  bullThreshold: number;
  bearThreshold: number;
  highVolThreshold: number;
  lowVolThreshold: number;
  lookbackWindow: number;
};

const DEFAULT_CONFIG: RegimeConfig = {
  bullThreshold: 0.1,
  bearThreshold: -0.1,
  highVolThreshold: 0.25,
  lowVolThreshold: 0.1,
  lookbackWindow: 63,
};

export function classifyRegimes(
  dates: string[],
  benchmarkReturns: number[],
  config: Partial<RegimeConfig> = {}
): RegimeClassification[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const n = dates.length;
  const classifications: RegimeClassification[] = [];

  for (let i = 0; i < n; i++) {
    const windowStart = Math.max(0, i - cfg.lookbackWindow + 1);
    const window = benchmarkReturns.slice(windowStart, i + 1);

    const cumReturn = window.reduce((acc, r) => acc * (1 + r), 1) - 1;
    const annualizedReturn = cumReturn * (252 / window.length);

    const mean = window.reduce((s, v) => s + v, 0) / window.length;
    const variance = window.reduce((s, v) => s + (v - mean) ** 2, 0) / window.length;
    const annualizedVol = Math.sqrt(variance * 252);

    let regime: RegimeBucket;
    if (annualizedVol > cfg.highVolThreshold) {
      regime = 'high_vol';
    } else if (annualizedVol < cfg.lowVolThreshold) {
      regime = 'low_vol';
    } else if (annualizedReturn > cfg.bullThreshold) {
      regime = 'bull';
    } else if (annualizedReturn < cfg.bearThreshold) {
      regime = 'bear';
    } else {
      regime = 'sideways';
    }

    classifications.push({ date: dates[i], regime, dailyReturn: benchmarkReturns[i] });
  }

  return classifications;
}

export function calcRegimePerformance(
  portfolioReturns: number[],
  classifications: RegimeClassification[]
): RegimePerformance[] {
  const n = Math.min(portfolioReturns.length, classifications.length);
  const buckets: Record<RegimeBucket, number[]> = {
    bull: [],
    bear: [],
    sideways: [],
    high_vol: [],
    low_vol: [],
  };

  for (let i = 0; i < n; i++) {
    buckets[classifications[i].regime].push(portfolioReturns[i]);
  }

  const results: RegimePerformance[] = [];
  for (const [regime, returns] of Object.entries(buckets) as [RegimeBucket, number[]][]) {
    if (returns.length === 0) continue;

    const mean = returns.reduce((s, v) => s + v, 0) / returns.length;
    const annualizedReturn = mean * 252;
    const variance = returns.reduce((s, v) => s + (v - mean) ** 2, 0) / returns.length;
    const annualizedVol = Math.sqrt(variance * 252);
    const sharpe = annualizedVol > 0 ? annualizedReturn / annualizedVol : 0;

    let maxDrawdown = 0;
    let peak = 1;
    let equity = 1;
    for (const r of returns) {
      equity *= 1 + r;
      if (equity > peak) peak = equity;
      const dd = (peak - equity) / peak;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    results.push({
      regime,
      periodCount: returns.length,
      annualizedReturn: parseFloat(annualizedReturn.toFixed(4)),
      sharpe: parseFloat(sharpe.toFixed(4)),
      maxDrawdown: parseFloat(maxDrawdown.toFixed(4)),
    });
  }

  return results;
}
