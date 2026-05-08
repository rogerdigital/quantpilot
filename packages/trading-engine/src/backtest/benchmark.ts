export interface BenchmarkResult {
  alpha: number; // Jensen's alpha (annualized)
  beta: number; // Portfolio beta vs benchmark
  informationRatio: number; // Active return / tracking error
  trackingError: number; // Std dev of active returns
  upCapture: number; // Upside capture ratio
  downCapture: number; // Downside capture ratio
  relativeDrawdown: number; // Max relative drawdown vs benchmark
}

/**
 * Calculate benchmark comparison metrics.
 */
export function calcBenchmarkComparison(
  portfolioReturns: number[],
  benchmarkReturns: number[],
  riskFreeRate: number = 0.02 / 252 // Daily risk-free rate (2% annual)
): BenchmarkResult {
  const n = Math.min(portfolioReturns.length, benchmarkReturns.length);
  if (n < 2) {
    return {
      alpha: 0,
      beta: 1,
      informationRatio: 0,
      trackingError: 0,
      upCapture: 100,
      downCapture: 100,
      relativeDrawdown: 0,
    };
  }

  // Calculate active returns
  const activeReturns: number[] = [];
  for (let i = 0; i < n; i++) {
    activeReturns.push(portfolioReturns[i] - benchmarkReturns[i]);
  }

  // Beta: covariance(portfolio, benchmark) / variance(benchmark)
  const avgPortfolio = portfolioReturns.reduce((s, v) => s + v, 0) / n;
  const avgBenchmark = benchmarkReturns.reduce((s, v) => s + v, 0) / n;

  let covariance = 0;
  let benchmarkVariance = 0;
  for (let i = 0; i < n; i++) {
    const dp = portfolioReturns[i] - avgPortfolio;
    const db = benchmarkReturns[i] - avgBenchmark;
    covariance += dp * db;
    benchmarkVariance += db * db;
  }
  const beta = benchmarkVariance > 0 ? covariance / benchmarkVariance : 1;

  // Alpha: Jensen's alpha (annualized)
  const avgActive = activeReturns.reduce((s, v) => s + v, 0) / n;
  const alpha = (avgActive - riskFreeRate * (1 - beta)) * 252;

  // Tracking error: std dev of active returns
  const activeMean = avgActive;
  const trackingError =
    Math.sqrt(activeReturns.reduce((s, v) => s + (v - activeMean) ** 2, 0) / n) * Math.sqrt(252);

  // Information ratio
  const informationRatio = trackingError > 0 ? (avgActive * 252) / trackingError : 0;

  // Up/Down capture ratios
  let upPortfolio = 0;
  let upBenchmark = 0;
  let downPortfolio = 0;
  let downBenchmark = 0;
  let upCount = 0;
  let downCount = 0;

  for (let i = 0; i < n; i++) {
    if (benchmarkReturns[i] > 0) {
      upPortfolio += portfolioReturns[i];
      upBenchmark += benchmarkReturns[i];
      upCount++;
    } else if (benchmarkReturns[i] < 0) {
      downPortfolio += portfolioReturns[i];
      downBenchmark += benchmarkReturns[i];
      downCount++;
    }
  }

  const upCapture =
    upCount > 0 && upBenchmark !== 0
      ? (upPortfolio / upCount / (upBenchmark / upCount)) * 100
      : 100;

  const downCapture =
    downCount > 0 && downBenchmark !== 0
      ? (downPortfolio / downCount / (downBenchmark / downCount)) * 100
      : 100;

  // Relative drawdown: max cumulative active return drawdown
  let cumActive = 0;
  let peakCumActive = 0;
  let maxRelativeDrawdown = 0;
  for (const ar of activeReturns) {
    cumActive += ar;
    if (cumActive > peakCumActive) peakCumActive = cumActive;
    const dd = peakCumActive - cumActive;
    if (dd > maxRelativeDrawdown) maxRelativeDrawdown = dd;
  }

  return {
    alpha: parseFloat(alpha.toFixed(4)),
    beta: parseFloat(beta.toFixed(4)),
    informationRatio: parseFloat(informationRatio.toFixed(4)),
    trackingError: parseFloat((trackingError * 100).toFixed(2)),
    upCapture: parseFloat(upCapture.toFixed(2)),
    downCapture: parseFloat(downCapture.toFixed(2)),
    relativeDrawdown: parseFloat((maxRelativeDrawdown * 100).toFixed(2)),
  };
}

/**
 * Calculate benchmark metrics from equity curves.
 */
export function calcBenchmarkFromEquityCurves(
  portfolioEquity: number[],
  benchmarkEquity: number[],
  riskFreeRate?: number
): BenchmarkResult {
  // Convert equity curves to returns
  const portfolioReturns: number[] = [];
  const benchmarkReturns: number[] = [];

  for (let i = 1; i < portfolioEquity.length; i++) {
    portfolioReturns.push(portfolioEquity[i] / portfolioEquity[i - 1] - 1);
  }
  for (let i = 1; i < benchmarkEquity.length; i++) {
    benchmarkReturns.push(benchmarkEquity[i] / benchmarkEquity[i - 1] - 1);
  }

  return calcBenchmarkComparison(portfolioReturns, benchmarkReturns, riskFreeRate);
}
