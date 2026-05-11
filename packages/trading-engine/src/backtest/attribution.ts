export type AttributionBreakdown = {
  source: string;
  contribution: number;
  weight: number;
};

export interface FactorExposure {
  factor: string;
  exposure: number; // Beta or weight (-1 to 1+)
  contribution: number; // Contribution to return (%)
}

export interface BrinsonResult {
  allocationEffect: number; // Asset allocation contribution
  selectionEffect: number; // Security selection contribution
  interactionEffect: number; // Interaction term
  totalActiveReturn: number; // Total active return vs benchmark
}

export interface RollingExposure {
  date: string;
  exposures: Record<string, number>;
}

export interface AttributionResult {
  factors: FactorExposure[];
  brinson: BrinsonResult;
  rolling: RollingExposure[];
}

/**
 * Calculate factor exposures using regression-like decomposition.
 * Simplified model: each stock has known factor loadings.
 */
export function calcFactorExposures(
  portfolioReturns: number[],
  factorReturns: Record<string, number[]>,
  weights: number[]
): FactorExposure[] {
  const factors: FactorExposure[] = [];

  for (const [factor, returns] of Object.entries(factorReturns)) {
    if (returns.length === 0) continue;

    // Calculate weighted average factor exposure
    let totalExposure = 0;
    let totalWeight = 0;
    for (let i = 0; i < weights.length && i < returns.length; i++) {
      totalExposure += weights[i] * returns[i];
      totalWeight += weights[i];
    }

    const exposure = totalWeight > 0 ? totalExposure / totalWeight : 0;

    // Contribution = exposure * factor return
    const avgFactorReturn = returns.reduce((s, v) => s + v, 0) / returns.length;
    const contribution = exposure * avgFactorReturn * 100;

    factors.push({
      factor,
      exposure: parseFloat(exposure.toFixed(4)),
      contribution: parseFloat(contribution.toFixed(2)),
    });
  }

  return factors;
}

/**
 * Calculate Brinson attribution (active return decomposition).
 * Portfolio vs benchmark decomposition into allocation, selection, interaction.
 */
export function calcBrinsonAttribution(
  portfolioWeights: number[],
  benchmarkWeights: number[],
  portfolioReturns: number[],
  benchmarkReturns: number[]
): BrinsonResult {
  const n = Math.min(portfolioWeights.length, benchmarkWeights.length);

  let allocationEffect = 0;
  let selectionEffect = 0;
  let interactionEffect = 0;

  const benchmarkTotalReturn = benchmarkReturns.reduce((s, v) => s + v, 0) / n;

  for (let i = 0; i < n; i++) {
    const wp = portfolioWeights[i];
    const wb = benchmarkWeights[i];
    const rp = portfolioReturns[i] || 0;
    const rb = benchmarkReturns[i] || 0;

    // Allocation: (wp - wb) * (rb - Rb)
    allocationEffect += (wp - wb) * (rb - benchmarkTotalReturn);

    // Selection: wb * (rp - rb)
    selectionEffect += wb * (rp - rb);

    // Interaction: (wp - wb) * (rp - rb)
    interactionEffect += (wp - wb) * (rp - rb);
  }

  const totalActiveReturn = allocationEffect + selectionEffect + interactionEffect;

  return {
    allocationEffect: parseFloat((allocationEffect * 100).toFixed(2)),
    selectionEffect: parseFloat((selectionEffect * 100).toFixed(2)),
    interactionEffect: parseFloat((interactionEffect * 100).toFixed(2)),
    totalActiveReturn: parseFloat((totalActiveReturn * 100).toFixed(2)),
  };
}

/**
 * Calculate rolling factor exposures over a window.
 */
export function calcRollingExposures(
  dates: string[],
  factorReturns: Record<string, number[]>,
  windowSize: number = 60
): RollingExposure[] {
  const rolling: RollingExposure[] = [];

  for (let i = windowSize; i <= dates.length; i++) {
    const windowDates = dates.slice(i - windowSize, i);
    const exposures: Record<string, number> = {};

    for (const [factor, returns] of Object.entries(factorReturns)) {
      const windowReturns = returns.slice(i - windowSize, i);
      if (windowReturns.length > 0) {
        // Simple average exposure over window
        const avgReturn = windowReturns.reduce((s, v) => s + v, 0) / windowReturns.length;
        const volatility = Math.sqrt(
          windowReturns.reduce((s, v) => s + (v - avgReturn) ** 2, 0) / windowReturns.length
        );
        exposures[factor] = volatility > 0 ? avgReturn / volatility : 0;
      }
    }

    rolling.push({
      date: windowDates[windowDates.length - 1],
      exposures,
    });
  }

  return rolling;
}

export type SectorHolding = {
  sector: string;
  weight: number;
  return: number;
};

export function calcSectorAttribution(holdings: SectorHolding[]): AttributionBreakdown[] {
  const totalReturn = holdings.reduce((s, h) => s + h.weight * h.return, 0);
  return holdings.map((h) => ({
    source: h.sector,
    contribution: parseFloat((h.weight * h.return).toFixed(6)),
    weight: h.weight,
  }));
}

export type SignalContribution = {
  signal: string;
  weight: number;
  return: number;
};

export function calcSignalAttribution(signals: SignalContribution[]): AttributionBreakdown[] {
  return signals.map((s) => ({
    source: s.signal,
    contribution: parseFloat((s.weight * s.return).toFixed(6)),
    weight: s.weight,
  }));
}

export function calcTurnoverAttribution(
  periodWeights: Array<{ date: string; weights: number[] }>
): { avgTurnover: number; turnoverByPeriod: Array<{ date: string; turnover: number }> } {
  if (periodWeights.length < 2) {
    return { avgTurnover: 0, turnoverByPeriod: [] };
  }

  const turnoverByPeriod: Array<{ date: string; turnover: number }> = [];

  for (let i = 1; i < periodWeights.length; i++) {
    const prev = periodWeights[i - 1].weights;
    const curr = periodWeights[i].weights;
    const n = Math.max(prev.length, curr.length);
    let turnover = 0;
    for (let j = 0; j < n; j++) {
      turnover += Math.abs((curr[j] || 0) - (prev[j] || 0));
    }
    turnoverByPeriod.push({ date: periodWeights[i].date, turnover: turnover / 2 });
  }

  const avgTurnover =
    turnoverByPeriod.reduce((s, t) => s + t.turnover, 0) / turnoverByPeriod.length;

  return { avgTurnover: parseFloat(avgTurnover.toFixed(4)), turnoverByPeriod };
}
