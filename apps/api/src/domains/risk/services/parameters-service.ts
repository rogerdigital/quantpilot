type RiskParameters = {
  maxPositionWeight: number;
  maxDrawdownPct: number;
  dailyLossStopPct: number;
  sharpeFloor: number;
  liveOrderRequiresApproval: boolean;
};

/**
 * Risk parameters service — manages user-configurable risk thresholds.
 * Stored in memory (survives the process lifetime, resets on restart).
 * Defaults match the platform's conservative initial setup.
 */
export const DEFAULT_RISK_PARAMS: RiskParameters = {
  /** Maximum single-position weight as a fraction (0.05 = 5%) */
  maxPositionWeight: 0.05,
  /** Maximum allowed drawdown % before blocking a candidate */
  maxDrawdownPct: 12,
  /** Daily portfolio loss % that triggers a hard stop */
  dailyLossStopPct: 5,
  /** Minimum Sharpe ratio required to pass risk gate */
  sharpeFloor: 0.9,
  /** Whether live orders always require manual approval */
  liveOrderRequiresApproval: true,
};

let _params: RiskParameters = { ...DEFAULT_RISK_PARAMS };

export function getRiskParameters(): RiskParameters {
  return { ...DEFAULT_RISK_PARAMS, ..._params };
}

export function updateRiskParameters(patch: Partial<RiskParameters> = {}): RiskParameters {
  const allowed = new Set(Object.keys(DEFAULT_RISK_PARAMS));
  const updates: Partial<RiskParameters> = {};

  for (const [key, value] of Object.entries(patch)) {
    if (!allowed.has(key)) continue;
    const typedKey = key as keyof RiskParameters;
    const defaultVal = DEFAULT_RISK_PARAMS[typedKey];
    if (typeof defaultVal === 'number' && typeof value === 'number' && isFinite(value)) {
      updates[typedKey] = value as never;
    } else if (typeof defaultVal === 'boolean' && typeof value === 'boolean') {
      updates[typedKey] = value as never;
    }
  }

  _params = { ..._params, ...updates };
  return getRiskParameters();
}

export function resetRiskParameters(): RiskParameters {
  _params = { ...DEFAULT_RISK_PARAMS };
  return getRiskParameters();
}
