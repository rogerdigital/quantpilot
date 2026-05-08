export type CorrelationMethod = 'pearson' | 'spearman';

export interface CorrelationPair {
  symbolA: string;
  symbolB: string;
  correlation: number;
  isHigh: boolean;
}

export interface CorrelationMatrix {
  symbols: string[];
  matrix: number[][];
  method: CorrelationMethod;
  windowSize: number;
  highCorrelationPairs: CorrelationPair[];
  sectorConcentration: SectorConcentration[];
}

export interface SectorConcentration {
  sector: string;
  symbols: string[];
  avgCorrelation: number;
  weight: number;
  alert: boolean;
}

export interface CorrelationAlert {
  type: 'high_correlation' | 'concentration' | 'regime_change';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  symbols?: string[];
  value?: number;
}

const HIGH_CORRELATION_THRESHOLD = 0.7;
const CONCENTRATION_THRESHOLD = 0.4;
const REGIME_CHANGE_THRESHOLD = 0.3;

function calcPearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  const meanX = x.reduce((s, v) => s + v, 0) / n;
  const meanY = y.reduce((s, v) => s + v, 0) / n;

  let cov = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    cov += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }

  const denom = Math.sqrt(varX * varY);
  return denom > 0 ? cov / denom : 0;
}

function calcSpearman(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  const rankArr = (arr: number[]): number[] => {
    const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const ranks = new Array(arr.length);
    for (let i = 0; i < sorted.length; i++) {
      ranks[sorted[i].i] = i + 1;
    }
    return ranks;
  };

  const rankX = rankArr(x.slice(0, n));
  const rankY = rankArr(y.slice(0, n));

  return calcPearson(rankX, rankY);
}

export function calcCorrelationMatrix(
  symbolReturns: Record<string, number[]>,
  method: CorrelationMethod = 'pearson',
  windowSize = 60
): CorrelationMatrix {
  const symbols = Object.keys(symbolReturns).sort();
  const n = symbols.length;
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    matrix[i][i] = 1;
    for (let j = i + 1; j < n; j++) {
      const returnsI = symbolReturns[symbols[i]].slice(-windowSize);
      const returnsJ = symbolReturns[symbols[j]].slice(-windowSize);
      const corr =
        method === 'spearman' ? calcSpearman(returnsI, returnsJ) : calcPearson(returnsI, returnsJ);
      matrix[i][j] = parseFloat(corr.toFixed(4));
      matrix[j][i] = matrix[i][j];
    }
  }

  const highCorrelationPairs: CorrelationPair[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(matrix[i][j]) >= HIGH_CORRELATION_THRESHOLD) {
        highCorrelationPairs.push({
          symbolA: symbols[i],
          symbolB: symbols[j],
          correlation: matrix[i][j],
          isHigh: true,
        });
      }
    }
  }

  return {
    symbols,
    matrix,
    method,
    windowSize,
    highCorrelationPairs,
    sectorConcentration: [],
  };
}

export function calcRollingCorrelation(
  returnsA: number[],
  returnsB: number[],
  windowSize: number,
  method: CorrelationMethod = 'pearson'
): { date: string; correlation: number }[] {
  const results: { date: string; correlation: number }[] = [];
  const n = Math.min(returnsA.length, returnsB.length);

  for (let i = windowSize; i <= n; i++) {
    const windowA = returnsA.slice(i - windowSize, i);
    const windowB = returnsB.slice(i - windowSize, i);
    const corr =
      method === 'spearman' ? calcSpearman(windowA, windowB) : calcPearson(windowA, windowB);
    results.push({
      date: String(i),
      correlation: parseFloat(corr.toFixed(4)),
    });
  }

  return results;
}

export function detectCorrelationRegimeChange(
  rollingCorrelations: { date: string; correlation: number }[],
  lookback: number = 20
): CorrelationAlert[] {
  const alerts: CorrelationAlert[] = [];
  if (rollingCorrelations.length < lookback * 2) return alerts;

  const recent = rollingCorrelations.slice(-lookback);
  const prior = rollingCorrelations.slice(-lookback * 2, -lookback);

  const recentAvg = recent.reduce((s, v) => s + v.correlation, 0) / recent.length;
  const priorAvg = prior.reduce((s, v) => s + v.correlation, 0) / prior.length;
  const shift = Math.abs(recentAvg - priorAvg);

  if (shift > REGIME_CHANGE_THRESHOLD) {
    alerts.push({
      type: 'regime_change',
      message: `Correlation regime shift detected: ${(priorAvg * 100).toFixed(1)}% → ${(recentAvg * 100).toFixed(1)}%`,
      severity: shift > 0.5 ? 'critical' : 'warning',
      value: shift,
    });
  }

  return alerts;
}

export function analyzeSectorConcentration(
  positions: { symbol: string; sector: string; weight: number }[],
  correlationMatrix: CorrelationMatrix
): SectorConcentration[] {
  const sectorMap = new Map<string, { symbols: string[]; totalWeight: number }>();

  for (const pos of positions) {
    const existing = sectorMap.get(pos.sector) ?? { symbols: [], totalWeight: 0 };
    existing.symbols.push(pos.symbol);
    existing.totalWeight += pos.weight;
    sectorMap.set(pos.sector, existing);
  }

  const concentrations: SectorConcentration[] = [];

  for (const [sector, data] of sectorMap) {
    const indices = data.symbols
      .map((s) => correlationMatrix.symbols.indexOf(s))
      .filter((i) => i >= 0);

    let totalCorr = 0;
    let pairCount = 0;
    for (let i = 0; i < indices.length; i++) {
      for (let j = i + 1; j < indices.length; j++) {
        totalCorr += Math.abs(correlationMatrix.matrix[indices[i]][indices[j]]);
        pairCount++;
      }
    }

    const avgCorrelation = pairCount > 0 ? totalCorr / pairCount : 0;

    concentrations.push({
      sector,
      symbols: data.symbols,
      avgCorrelation: parseFloat(avgCorrelation.toFixed(4)),
      weight: parseFloat(data.totalWeight.toFixed(4)),
      alert: data.totalWeight > CONCENTRATION_THRESHOLD,
    });
  }

  return concentrations.sort((a, b) => b.weight - a.weight);
}
