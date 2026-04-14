/**
 * Historical simulation VaR and CVaR calculators.
 * All inputs are daily log-returns (negative = loss).
 */

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
