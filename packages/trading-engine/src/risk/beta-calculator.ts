/**
 * Beta (relative to benchmark) and HHI concentration calculators.
 */

/**
 * CAPM Beta: Cov(asset, benchmark) / Var(benchmark).
 * Both arrays should be daily log-returns of equal length.
 * Returns 1 if data is insufficient.
 */
export function calcBeta(assetReturns: number[], benchmarkReturns: number[]): number {
  const n = Math.min(assetReturns.length, benchmarkReturns.length);
  if (n < 2) return 1;

  const a = assetReturns.slice(-n);
  const b = benchmarkReturns.slice(-n);

  const meanA = a.reduce((s, x) => s + x, 0) / n;
  const meanB = b.reduce((s, x) => s + x, 0) / n;

  let cov = 0;
  let varB = 0;
  for (let i = 0; i < n; i++) {
    cov  += (a[i] - meanA) * (b[i] - meanB);
    varB += (b[i] - meanB) ** 2;
  }

  return varB === 0 ? 1 : cov / varB;
}

/**
 * Herfindahl-Hirschman Index (HHI) concentration.
 * Weights should sum to 1 (each w = position market value / total portfolio value).
 * Result is in [0, 1]: 0 = perfectly diversified, 1 = single position.
 */
export function calcHHI(weights: number[]): number {
  return weights.reduce((s, w) => s + w * w, 0);
}
