export type PolicyDimension =
  | 'max_gross_exposure'
  | 'max_net_exposure'
  | 'max_single_name_weight'
  | 'max_sector_exposure'
  | 'max_leverage'
  | 'max_drawdown'
  | 'max_daily_loss'
  | 'max_turnover'
  | 'max_order_notional'
  | 'allowed_universe'
  | 'allowed_modes';

export type PolicyRule = {
  dimension: PolicyDimension;
  limit: number | string[];
  mode: 'paper' | 'live' | 'both';
  severity: 'warning' | 'blocker';
};

export type PolicyViolation = {
  dimension: PolicyDimension;
  limit: number | string[];
  actual: number | string;
  severity: 'warning' | 'blocker';
  message: string;
};

export type PolicyCheckResult = {
  passed: boolean;
  violations: PolicyViolation[];
};

export type PortfolioSnapshot = {
  positions: { symbol: string; weight: number; sector?: string }[];
  grossExposure: number;
  netExposure: number;
  leverage: number;
  drawdownPct: number;
  dailyLossPct: number;
  turnoverPct: number;
};

export type OrderPlan = {
  orders: { symbol: string; notional: number; side: 'buy' | 'sell' }[];
  tradingMode: 'paper' | 'live';
};

function checkNumericRule(rule: PolicyRule, actual: number, label: string): PolicyViolation | null {
  const limit = rule.limit as number;
  if (actual > limit) {
    return {
      dimension: rule.dimension,
      limit: rule.limit,
      actual,
      severity: rule.severity,
      message: `${label}: ${actual.toFixed(4)} exceeds limit ${limit}`,
    };
  }
  return null;
}

export function checkPortfolioAgainstPolicy(
  portfolio: PortfolioSnapshot,
  rules: PolicyRule[],
  mode: 'paper' | 'live'
): PolicyCheckResult {
  const violations: PolicyViolation[] = [];

  for (const rule of rules) {
    if (rule.mode !== 'both' && rule.mode !== mode) continue;

    switch (rule.dimension) {
      case 'max_gross_exposure': {
        const v = checkNumericRule(rule, portfolio.grossExposure, 'Gross exposure');
        if (v) violations.push(v);
        break;
      }
      case 'max_net_exposure': {
        const v = checkNumericRule(rule, Math.abs(portfolio.netExposure), 'Net exposure');
        if (v) violations.push(v);
        break;
      }
      case 'max_single_name_weight': {
        for (const pos of portfolio.positions) {
          const v = checkNumericRule(rule, Math.abs(pos.weight), `Position ${pos.symbol}`);
          if (v) violations.push(v);
        }
        break;
      }
      case 'max_sector_exposure': {
        const sectorWeights = new Map<string, number>();
        for (const pos of portfolio.positions) {
          const sector = pos.sector || 'unknown';
          sectorWeights.set(sector, (sectorWeights.get(sector) || 0) + Math.abs(pos.weight));
        }
        for (const [sector, weight] of sectorWeights) {
          const v = checkNumericRule(rule, weight, `Sector ${sector}`);
          if (v) violations.push(v);
        }
        break;
      }
      case 'max_leverage': {
        const v = checkNumericRule(rule, portfolio.leverage, 'Leverage');
        if (v) violations.push(v);
        break;
      }
      case 'max_drawdown': {
        const v = checkNumericRule(rule, portfolio.drawdownPct, 'Drawdown');
        if (v) violations.push(v);
        break;
      }
      case 'max_daily_loss': {
        const v = checkNumericRule(rule, portfolio.dailyLossPct, 'Daily loss');
        if (v) violations.push(v);
        break;
      }
      case 'max_turnover': {
        const v = checkNumericRule(rule, portfolio.turnoverPct, 'Turnover');
        if (v) violations.push(v);
        break;
      }
    }
  }

  return { passed: violations.filter((v) => v.severity === 'blocker').length === 0, violations };
}

export function checkOrderPlanAgainstPolicy(
  plan: OrderPlan,
  rules: PolicyRule[]
): PolicyCheckResult {
  const violations: PolicyViolation[] = [];
  const mode = plan.tradingMode;

  for (const rule of rules) {
    if (rule.mode !== 'both' && rule.mode !== mode) continue;

    if (rule.dimension === 'max_order_notional') {
      for (const order of plan.orders) {
        const v = checkNumericRule(rule, order.notional, `Order ${order.symbol}`);
        if (v) violations.push(v);
      }
    }

    if (rule.dimension === 'allowed_universe') {
      const allowed = rule.limit as string[];
      for (const order of plan.orders) {
        if (!allowed.includes(order.symbol)) {
          violations.push({
            dimension: rule.dimension,
            limit: rule.limit,
            actual: order.symbol,
            severity: rule.severity,
            message: `Symbol ${order.symbol} not in allowed universe`,
          });
        }
      }
    }

    if (rule.dimension === 'allowed_modes') {
      const allowed = rule.limit as string[];
      if (!allowed.includes(mode)) {
        violations.push({
          dimension: rule.dimension,
          limit: rule.limit,
          actual: mode,
          severity: rule.severity,
          message: `Trading mode '${mode}' not allowed`,
        });
      }
    }
  }

  return { passed: violations.filter((v) => v.severity === 'blocker').length === 0, violations };
}
