import type { GatewayRouteContext } from '../types.js';

function generateDemoPerformanceData(range: string) {
  const daysMap: Record<string, number> = { '1M': 22, '3M': 66, '6M': 126, '1Y': 252, ALL: 504 };
  const days = daysMap[range] || 252;

  // Generate equity curve with realistic random walk
  const equityCurve = [100000];
  for (let i = 1; i < days; i++) {
    const drift = 0.0003;
    const volatility = 0.015;
    const change = drift + volatility * (Math.random() * 2 - 1);
    equityCurve.push(equityCurve[i - 1] * (1 + change));
  }

  const finalEquity = equityCurve[equityCurve.length - 1];
  const totalReturn = (finalEquity - equityCurve[0]) / equityCurve[0];
  const years = days / 252;
  const cagr = (1 + totalReturn) ** (1 / years) - 1;

  // Generate daily returns
  const dailyReturns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    dailyReturns.push((equityCurve[i] - equityCurve[i - 1]) / equityCurve[i - 1]);
  }

  const mean = dailyReturns.reduce((s: number, r: number) => s + r, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((s: number, r: number) => s + (r - mean) ** 2, 0) / dailyReturns.length;
  const std = Math.sqrt(variance);
  const sharpe = std > 0 ? (mean / std) * Math.sqrt(252) : 0;

  const negReturns = dailyReturns.filter((r) => r < 0);
  const downVar =
    negReturns.length > 0 ? negReturns.reduce((s: number, r: number) => s + r * r, 0) / negReturns.length : 0;
  const sortino =
    downVar > 0 ? (mean / Math.sqrt(downVar)) * Math.sqrt(252) : sharpe > 0 ? Infinity : 0;

  // Max drawdown
  let peak = equityCurve[0];
  let maxDd = 0;
  const drawdownSeries = equityCurve.map((eq) => {
    if (eq > peak) peak = eq;
    const dd = peak > 0 ? (eq - peak) / peak : 0;
    if (dd < maxDd) maxDd = dd;
    return dd;
  });

  // Trade metrics
  const totalTrades = Math.floor(days * 0.3);
  const tradePnLs = Array.from({ length: totalTrades }, () => (Math.random() * 2 - 0.4) * 2000);
  const wins = tradePnLs.filter((p) => p > 0);
  const losses = tradePnLs.filter((p) => p < 0);
  const winRate = wins.length / totalTrades;
  const grossProfit = wins.reduce((s: number, p: number) => s + p, 0);
  const grossLoss = Math.abs(losses.reduce((s: number, p: number) => s + p, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  // Monthly returns
  const monthlyReturns: Record<number, Record<string, number>> = {};
  let monthStart = equityCurve[0];
  let currentMonth = 0;
  for (let i = 0; i < equityCurve.length; i++) {
    const month = Math.floor(i / 22);
    if (month !== currentMonth) {
      const year = 2024 + Math.floor(currentMonth / 12);
      const m = String((currentMonth % 12) + 1).padStart(2, '0');
      if (!monthlyReturns[year]) monthlyReturns[year] = {};
      monthlyReturns[year][m] = monthStart > 0 ? (equityCurve[i - 1] - monthStart) / monthStart : 0;
      monthStart = equityCurve[i];
      currentMonth = month;
    }
  }
  // Final month
  const year = 2024 + Math.floor(currentMonth / 12);
  const m = String((currentMonth % 12) + 1).padStart(2, '0');
  if (!monthlyReturns[year]) monthlyReturns[year] = {};
  monthlyReturns[year][m] =
    monthStart > 0 ? (equityCurve[equityCurve.length - 1] - monthStart) / monthStart : 0;

  // Trade distribution
  const buckets = [
    { range: '< -5%', min: -Infinity, max: -0.05 },
    { range: '-5% ~ -3%', min: -0.05, max: -0.03 },
    { range: '-3% ~ -1%', min: -0.03, max: -0.01 },
    { range: '-1% ~ 0%', min: -0.01, max: 0 },
    { range: '0% ~ 1%', min: 0, max: 0.01 },
    { range: '1% ~ 3%', min: 0.01, max: 0.03 },
    { range: '3% ~ 5%', min: 0.03, max: 0.05 },
    { range: '> 5%', min: 0.05, max: Infinity },
  ];
  const tradeDistribution = buckets.map((b) => ({
    range: b.range,
    count: tradePnLs.filter((p) => {
      const pct = p / 100000;
      return pct >= b.min && pct < b.max;
    }).length,
  }));

  return {
    summary: {
      totalReturn,
      cagr,
      sharpe,
      sortino,
      maxDrawdown: Math.abs(maxDd),
      winRate,
      profitFactor,
      tradingDays: days,
      totalTrades,
    },
    equityCurve: equityCurve.slice(-252),
    drawdownSeries: drawdownSeries.slice(-252),
    monthlyReturns,
    tradeDistribution,
  };
}

export async function handleAnalyticsRoutes({ req, reqUrl, res, writeJson }: GatewayRouteContext) {
  // GET /api/analytics/performance
  if (req.method === 'GET' && reqUrl.pathname === '/api/analytics/performance') {
    const range = reqUrl.searchParams.get('range') || '1Y';
    const data = generateDemoPerformanceData(range);
    writeJson(res, 200, { ok: true, data });
    return true;
  }

  return false;
}
