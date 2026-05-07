export interface CommissionConfig {
  model: 'fixed' | 'per_share' | 'percentage' | 'tiered';
  fixedAmount?: number; // For fixed model: flat fee per trade
  perShareAmount?: number; // For per_share model: e.g., 0.005 = $0.005/share
  percentage?: number; // For percentage model: e.g., 0.001 = 0.1%
  minCommission?: number; // Minimum commission per trade
  maxCommission?: number; // Maximum commission per trade
}

export interface CommissionInput {
  quantity: number;
  price: number;
  side: 'buy' | 'sell';
}

export interface CommissionResult {
  commission: number;
  commissionPct: number; // Commission as percentage of trade value
}

/**
 * Fixed commission model: flat fee per trade regardless of size.
 */
export function calcFixedCommission(
  input: CommissionInput,
  config: CommissionConfig
): CommissionResult {
  const fixedAmount = config.fixedAmount ?? 1.0;
  const tradeValue = input.quantity * input.price;
  const commission = applyCaps(fixedAmount, config);

  return {
    commission,
    commissionPct: tradeValue > 0 ? commission / tradeValue : 0,
  };
}

/**
 * Per-share commission model: fee per share traded.
 * Common in US equity markets (e.g., $0.005/share).
 */
export function calcPerShareCommission(
  input: CommissionInput,
  config: CommissionConfig
): CommissionResult {
  const perShare = config.perShareAmount ?? 0.005;
  const tradeValue = input.quantity * input.price;
  const rawCommission = input.quantity * perShare;
  const commission = applyCaps(rawCommission, config);

  return {
    commission,
    commissionPct: tradeValue > 0 ? commission / tradeValue : 0,
  };
}

/**
 * Percentage commission model: fee as percentage of trade value.
 * Common in crypto and some brokerages.
 */
export function calcPercentageCommission(
  input: CommissionInput,
  config: CommissionConfig
): CommissionResult {
  const percentage = config.percentage ?? 0.001; // 0.1%
  const tradeValue = input.quantity * input.price;
  const rawCommission = tradeValue * percentage;
  const commission = applyCaps(rawCommission, config);

  return {
    commission,
    commissionPct: tradeValue > 0 ? commission / tradeValue : 0,
  };
}

/**
 * Tiered commission model: rate decreases with volume.
 * Tiers based on monthly trading volume (simplified: per-trade).
 */
export function calcTieredCommission(
  input: CommissionInput,
  config: CommissionConfig
): CommissionResult {
  const tradeValue = input.quantity * input.price;

  // Simplified tier structure
  let rate: number;
  if (tradeValue > 1_000_000) {
    rate = 0.0005; // 0.05% for large trades
  } else if (tradeValue > 100_000) {
    rate = 0.0008; // 0.08% for medium trades
  } else {
    rate = 0.001; // 0.1% for small trades
  }

  const rawCommission = tradeValue * rate;
  const commission = applyCaps(rawCommission, config);

  return {
    commission,
    commissionPct: tradeValue > 0 ? commission / tradeValue : 0,
  };
}

/**
 * Apply min/max caps to commission.
 */
function applyCaps(commission: number, config: CommissionConfig): number {
  let result = commission;
  if (config.minCommission !== undefined) {
    result = Math.max(result, config.minCommission);
  }
  if (config.maxCommission !== undefined) {
    result = Math.min(result, config.maxCommission);
  }
  return result;
}

/**
 * Calculate commission using the configured model.
 */
export function calcCommission(input: CommissionInput, config: CommissionConfig): CommissionResult {
  switch (config.model) {
    case 'per_share':
      return calcPerShareCommission(input, config);
    case 'percentage':
      return calcPercentageCommission(input, config);
    case 'tiered':
      return calcTieredCommission(input, config);
    case 'fixed':
    default:
      return calcFixedCommission(input, config);
  }
}
