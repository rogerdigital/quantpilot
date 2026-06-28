/**
 * Performance analytics module for quantitative trading
 */

/**
 * Calculate daily returns from equity curve
 * @param {number[]} equityCurve - Array of equity values
 * @returns {number[]} Daily returns
 */
export function calculateDailyReturns(equityCurve: number[]) {
  if (equityCurve.length < 2) return [];

  const returns = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const prev = equityCurve[i - 1];
    if (prev > 0) {
      returns.push((equityCurve[i] - prev) / prev);
    } else {
      returns.push(0);
    }
  }
  return returns;
}

/**
 * Calculate cumulative returns
 * @param {number[]} returns - Daily returns
 * @returns {number[]} Cumulative returns
 */
export function calculateCumulativeReturns(returns: number[]) {
  let cumulative = 1;
  return returns.map((r) => {
    cumulative *= 1 + r;
    return cumulative - 1;
  });
}

/**
 * Calculate annualized return (CAGR)
 * @param {number} totalReturn - Total return (e.g., 0.5 for 50%)
 * @param {number} tradingDays - Number of trading days
 * @returns {number} Annualized return
 */
export function calculateCAGR(totalReturn: number, tradingDays: number) {
  if (tradingDays <= 0) return 0;
  const years = tradingDays / 252;
  return (1 + totalReturn) ** (1 / years) - 1;
}

/**
 * Calculate Sharpe ratio
 * @param {number[]} returns - Daily returns
 * @param {number} riskFreeRate - Annual risk-free rate (default: 0.02)
 * @returns {number} Sharpe ratio
 */
export function calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.02) {
  if (returns.length === 0) return 0;

  const dailyRf = riskFreeRate / 252;
  const excessReturns = returns.map((r) => r - dailyRf);
  const mean = excessReturns.reduce((s, r) => s + r, 0) / excessReturns.length;
  const variance = excessReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / excessReturns.length;
  const std = Math.sqrt(variance);

  if (std === 0) return 0;
  return (mean / std) * Math.sqrt(252);
}

/**
 * Calculate Sortino ratio
 * @param {number[]} returns - Daily returns
 * @param {number} riskFreeRate - Annual risk-free rate
 * @returns {number} Sortino ratio
 */
export function calculateSortinoRatio(returns: number[], riskFreeRate: number = 0.02) {
  if (returns.length === 0) return 0;

  const dailyRf = riskFreeRate / 252;
  const excessReturns = returns.map((r) => r - dailyRf);
  const mean = excessReturns.reduce((s, r) => s + r, 0) / excessReturns.length;
  const downsideReturns = excessReturns.filter((r) => r < 0);

  if (downsideReturns.length === 0) return mean > 0 ? Infinity : 0;

  const downsideVariance = downsideReturns.reduce((s, r) => s + r * r, 0) / downsideReturns.length;
  const downsideStd = Math.sqrt(downsideVariance);

  if (downsideStd === 0) return 0;
  return (mean / downsideStd) * Math.sqrt(252);
}

/**
 * Calculate maximum drawdown
 * @param {number[]} equityCurve - Equity values
 * @returns {Object} Max drawdown info
 */
export function calculateMaxDrawdown(equityCurve: number[]) {
  if (equityCurve.length < 2) {
    return { maxDrawdown: 0, peakIndex: 0, troughIndex: 0, peak: 0, trough: 0 };
  }

  let peak = equityCurve[0];
  let peakIndex = 0;
  let maxDrawdown = 0;
  let maxDdPeakIndex = 0;
  let maxDdTroughIndex = 0;

  for (let i = 1; i < equityCurve.length; i++) {
    if (equityCurve[i] > peak) {
      peak = equityCurve[i];
      peakIndex = i;
    }

    const drawdown = (peak - equityCurve[i]) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDdPeakIndex = peakIndex;
      maxDdTroughIndex = i;
    }
  }

  return {
    maxDrawdown,
    peakIndex: maxDdPeakIndex,
    troughIndex: maxDdTroughIndex,
    peak: equityCurve[maxDdPeakIndex],
    trough: equityCurve[maxDdTroughIndex],
    duration: maxDdTroughIndex - maxDdPeakIndex,
  };
}

/**
 * Calculate drawdown series
 * @param {number[]} equityCurve - Equity values
 * @returns {number[]} Drawdown percentages
 */
export function calculateDrawdownSeries(equityCurve: number[]) {
  if (equityCurve.length === 0) return [];

  let peak = equityCurve[0];
  return equityCurve.map((equity) => {
    if (equity > peak) peak = equity;
    return peak > 0 ? (equity - peak) / peak : 0;
  });
}

/**
 * Calculate Calmar ratio
 * @param {number} cagr - Compound annual growth rate
 * @param {number} maxDrawdown - Maximum drawdown
 * @returns {number} Calmar ratio
 */
export function calculateCalmarRatio(cagr: number, maxDrawdown: number) {
  if (maxDrawdown === 0) return cagr > 0 ? Infinity : 0;
  return cagr / maxDrawdown;
}

/**
 * Calculate Omega ratio
 * @param {number[]} returns - Daily returns
 * @param {number} threshold - Return threshold (default: 0)
 * @returns {number} Omega ratio
 */
export function calculateOmegaRatio(returns: number[], threshold: number = 0) {
  if (returns.length === 0) return 0;

  const gains = returns.filter((r) => r > threshold).reduce((s, r) => s + (r - threshold), 0);
  const losses = returns.filter((r) => r < threshold).reduce((s, r) => s + (threshold - r), 0);

  if (losses === 0) return gains > 0 ? Infinity : 1;
  return gains / losses;
}

/**
 * Calculate win rate and profit factor
 * @param {number[]} tradePnLs - Array of trade P&L values
 * @returns {Object} Win rate and profit factor
 */
export function calculateTradeMetrics(tradePnLs: number[]) {
  if (tradePnLs.length === 0) {
    return { winRate: 0, profitFactor: 0, avgWin: 0, avgLoss: 0, expectancy: 0 };
  }

  const wins = tradePnLs.filter((p) => p > 0);
  const losses = tradePnLs.filter((p) => p < 0);

  const winRate = wins.length / tradePnLs.length;
  const grossProfit = wins.reduce((s, p) => s + p, 0);
  const grossLoss = Math.abs(losses.reduce((s, p) => s + p, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  const expectancy = tradePnLs.reduce((s, p) => s + p, 0) / tradePnLs.length;

  return { winRate, profitFactor, avgWin, avgLoss, expectancy };
}

/**
 * Calculate monthly returns heatmap data
 * @param {number[]} equityCurve - Equity values
 * @param {Date[]} dates - Corresponding dates
 * @returns {Object} Monthly returns by year and month
 */
export function calculateMonthlyReturns(equityCurve: number[], dates: Date[]) {
  if (equityCurve.length < 2 || dates.length < 2) return {};

  const monthlyData: Record<string, { start: number; end: number }> = {};

  for (let i = 1; i < equityCurve.length; i++) {
    const year = dates[i].getFullYear();
    const month = dates[i].getMonth();
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;

    if (!monthlyData[key]) {
      monthlyData[key] = { start: equityCurve[i - 1], end: equityCurve[i] };
    } else {
      monthlyData[key].end = equityCurve[i];
    }
  }

  // Calculate returns
  const monthlyReturns: Record<string, Record<string, number>> = {};
  for (const [key, data] of Object.entries(monthlyData)) {
    const [year, month] = key.split('-');
    if (!monthlyReturns[year]) monthlyReturns[year] = {};
    monthlyReturns[year][month] = data.end > 0 ? (data.end - data.start) / data.start : 0;
  }

  return monthlyReturns;
}

/**
 * Calculate up/down capture ratio
 * @param {number[]} strategyReturns - Strategy returns
 * @param {number[]} benchmarkReturns - Benchmark returns
 * @returns {Object} Up and down capture ratios
 */
export function calculateCaptureRatio(strategyReturns: number[], benchmarkReturns: number[]) {
  if (strategyReturns.length !== benchmarkReturns.length || strategyReturns.length === 0) {
    return { upCapture: 0, downCapture: 0 };
  }

  let upStrategy = 0;
  let upBenchmark = 0;
  let downStrategy = 0;
  let downBenchmark = 0;
  let upCount = 0;
  let downCount = 0;

  for (let i = 0; i < strategyReturns.length; i++) {
    if (benchmarkReturns[i] > 0) {
      upStrategy += strategyReturns[i];
      upBenchmark += benchmarkReturns[i];
      upCount++;
    } else if (benchmarkReturns[i] < 0) {
      downStrategy += strategyReturns[i];
      downBenchmark += benchmarkReturns[i];
      downCount++;
    }
  }

  const upCapture =
    upCount > 0 && upBenchmark !== 0 ? upStrategy / upCount / (upBenchmark / upCount) : 0;
  const downCapture =
    downCount > 0 && downBenchmark !== 0
      ? downStrategy / downCount / (downBenchmark / downCount)
      : 0;

  return { upCapture, downCapture };
}

/**
 * Generate comprehensive performance report
 * @param {Object} params
 * @param {number[]} params.equityCurve - Equity values
 * @param {Date[]} params.dates - Corresponding dates
 * @param {number[]} [params.tradePnLs] - Individual trade P&Ls
 * @param {number[]} [params.benchmarkReturns] - Benchmark returns
 * @returns {Object} Performance report
 */
export function generatePerformanceReport({
  equityCurve,
  dates,
  tradePnLs = [],
  benchmarkReturns = [],
}: {
  equityCurve: number[];
  dates: Date[];
  tradePnLs?: number[];
  benchmarkReturns?: number[];
}) {
  const dailyReturns = calculateDailyReturns(equityCurve);
  const totalReturn =
    equityCurve.length > 1
      ? (equityCurve[equityCurve.length - 1] - equityCurve[0]) / equityCurve[0]
      : 0;
  const tradingDays = dailyReturns.length;
  const cagr = calculateCAGR(totalReturn, tradingDays);
  const sharpe = calculateSharpeRatio(dailyReturns);
  const sortino = calculateSortinoRatio(dailyReturns);
  const maxDd = calculateMaxDrawdown(equityCurve);
  const calmar = calculateCalmarRatio(cagr, maxDd.maxDrawdown);
  const omega = calculateOmegaRatio(dailyReturns);
  const tradeMetrics = calculateTradeMetrics(tradePnLs);
  const monthlyReturns = calculateMonthlyReturns(equityCurve, dates);

  let captureRatio = { upCapture: 0, downCapture: 0 };
  if (benchmarkReturns.length > 0) {
    captureRatio = calculateCaptureRatio(dailyReturns, benchmarkReturns);
  }

  return {
    summary: {
      totalReturn,
      cagr,
      sharpe,
      sortino,
      calmar,
      omega,
      maxDrawdown: maxDd.maxDrawdown,
      tradingDays,
    },
    drawdown: maxDd,
    trades: tradeMetrics,
    monthlyReturns,
    captureRatio,
    equityCurve: equityCurve.slice(-252), // Last year
    dailyReturns: dailyReturns.slice(-252),
    generatedAt: new Date().toISOString(),
  };
}
