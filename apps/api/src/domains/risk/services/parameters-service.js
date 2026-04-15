// @ts-nocheck
/**
 * Risk parameters service — manages user-configurable risk thresholds.
 * Stored in memory (survives the process lifetime, resets on restart).
 * Defaults match the platform's conservative initial setup.
 */

export const DEFAULT_RISK_PARAMS = {
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

let _params = { ...DEFAULT_RISK_PARAMS };

export function getRiskParameters() {
  return { ...DEFAULT_RISK_PARAMS, ..._params };
}

export function updateRiskParameters(patch = {}) {
  const allowed = new Set(Object.keys(DEFAULT_RISK_PARAMS));
  const updates = {};

  for (const [key, value] of Object.entries(patch)) {
    if (!allowed.has(key)) continue;
    const defaultVal = DEFAULT_RISK_PARAMS[key];
    if (typeof defaultVal === 'number' && typeof value === 'number' && isFinite(value)) {
      updates[key] = value;
    } else if (typeof defaultVal === 'boolean' && typeof value === 'boolean') {
      updates[key] = value;
    }
  }

  _params = { ..._params, ...updates };
  return getRiskParameters();
}

export function resetRiskParameters() {
  _params = { ...DEFAULT_RISK_PARAMS };
  return getRiskParameters();
}
