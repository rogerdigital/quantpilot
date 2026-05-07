/**
 * Historical simulation VaR and CVaR calculators.
 * All inputs are daily log-returns (negative = loss).
 */

export type VaRMethod = 'historical' | 'parametric' | 'monte_carlo';
export type ConfidenceLevel = 0.95 | 0.99;
export type TimeHorizon = 1 | 5 | 10 | 30;

export interface VaRResult {
  var95: number;
  var99: number;
  cvar95: number;
  cvar99: number;
  method: VaRMethod;
  horizon: TimeHorizon;
  sampleSize: number;
}

const Z_SCORES: Record<number, number> = {
  0.95: 1.645,
  0.99: 2.326,
};

/**
 * Historical VaR at given confidence level.
 * Returns the loss at the confidence percentile as a positive decimal (e.g. 0.023 = 2.3%).
 */
export function calcHistoricalVaR(returns: number[], confidence = 0.95): number {
  if (!returns.length) return 0;
  const sorted = [...returns].sort((a, b) => a - b);
  const idx = Math.max(0, Math.floor((1 - confidence) * sorted.length) - 1);
  return -sorted[idx];
}

/**
 * Conditional VaR (Expected Shortfall) at given confidence level.
 * Returns the mean loss in the tail below VaR as a positive decimal.
 */
export function calcCVaR(returns: number[], confidence = 0.95): number {
  if (!returns.length) return 0;
  const sorted = [...returns].sort((a, b) => a - b);
  const cutoff = Math.max(1, Math.floor((1 - confidence) * sorted.length));
  const tail = sorted.slice(0, cutoff);
  return -(tail.reduce((s, r) => s + r, 0) / tail.length);
}

/**
 * Parametric VaR using variance-covariance method.
 * Assumes normal distribution of returns.
 */
export function calcParametricVaR(returns: number[], confidence = 0.95): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((s, v) => s + v, 0) / returns.length;
  const variance = returns.reduce((s, v) => s + (v - mean) ** 2, 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);
  const z = Z_SCORES[confidence] ?? 1.645;
  return -(mean - z * stdDev);
}

/**
 * Monte Carlo VaR using simulation.
 * Generates simulated returns based on historical mean and std dev.
 */
export function calcMonteCarloVaR(
  returns: number[],
  confidence = 0.95,
  simulations = 10_000,
  seed?: number
): number {
  if (returns.length < 2) return 0;

  const mean = returns.reduce((s, v) => s + v, 0) / returns.length;
  const variance = returns.reduce((s, v) => s + (v - mean) ** 2, 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);

  let state = seed ?? 42;
  const nextRandom = () => {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return (state >>> 0) / 0xffffffff;
  };

  const boxMuller = () => {
    const u1 = nextRandom();
    const u2 = nextRandom();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };

  const simulated: number[] = [];
  for (let i = 0; i < simulations; i++) {
    simulated.push(mean + stdDev * boxMuller());
  }

  return calcHistoricalVaR(simulated, confidence);
}

/**
 * Scale VaR to a longer time horizon using square-root-of-time rule.
 */
export function scaleVaRHorizon(dailyVaR: number, horizon: TimeHorizon): number {
  return dailyVaR * Math.sqrt(horizon);
}

/**
 * Calculate comprehensive VaR metrics for a portfolio.
 */
export function calcPortfolioVaR(
  returns: number[],
  method: VaRMethod = 'historical',
  horizon: TimeHorizon = 1,
  simulations?: number
): VaRResult {
  let var95: number;
  let var99: number;

  switch (method) {
    case 'parametric':
      var95 = calcParametricVaR(returns, 0.95);
      var99 = calcParametricVaR(returns, 0.99);
      break;
    case 'monte_carlo':
      var95 = calcMonteCarloVaR(returns, 0.95, simulations);
      var99 = calcMonteCarloVaR(returns, 0.99, simulations);
      break;
    default:
      var95 = calcHistoricalVaR(returns, 0.95);
      var99 = calcHistoricalVaR(returns, 0.99);
  }

  if (horizon > 1) {
    var95 = scaleVaRHorizon(var95, horizon);
    var99 = scaleVaRHorizon(var99, horizon);
  }

  const cvar95 = calcCVaR(returns, 0.95);
  const cvar99 = calcCVaR(returns, 0.99);

  return {
    var95: parseFloat(var95.toFixed(6)),
    var99: parseFloat(var99.toFixed(6)),
    cvar95: parseFloat((horizon > 1 ? scaleVaRHorizon(cvar95, horizon) : cvar95).toFixed(6)),
    cvar99: parseFloat((horizon > 1 ? scaleVaRHorizon(cvar99, horizon) : cvar99).toFixed(6)),
    method,
    horizon,
    sampleSize: returns.length,
  };
}
