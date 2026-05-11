import type { OrderPlan, PolicyRule, PortfolioSnapshot } from './policy.js';
import { checkOrderPlanAgainstPolicy, checkPortfolioAgainstPolicy } from './policy.js';

export type AssessmentSeverity = 'pass' | 'warning' | 'blocker';

export type AssessmentFinding = {
  dimension: string;
  severity: AssessmentSeverity;
  message: string;
  actual: number | string;
  limit: number | string[];
};

export type AssessmentResult = {
  entityType: 'promotion' | 'execution' | 'order_batch';
  entityId: string;
  passed: boolean;
  overallSeverity: AssessmentSeverity;
  findings: AssessmentFinding[];
  assessedAt: string;
};

export type PromotionAssessmentInput = {
  entityId: string;
  portfolio: PortfolioSnapshot;
  rules: PolicyRule[];
  mode: 'paper' | 'live';
};

export type ExecutionAssessmentInput = {
  entityId: string;
  orderPlan: OrderPlan;
  portfolio: PortfolioSnapshot;
  rules: PolicyRule[];
};

export function assessPromotion(input: PromotionAssessmentInput): AssessmentResult {
  const portfolioCheck = checkPortfolioAgainstPolicy(input.portfolio, input.rules, input.mode);

  const findings: AssessmentFinding[] = portfolioCheck.violations.map((v) => ({
    dimension: v.dimension,
    severity: v.severity === 'blocker' ? 'blocker' : 'warning',
    message: v.message,
    actual: v.actual,
    limit: v.limit,
  }));

  const hasBlocker = findings.some((f) => f.severity === 'blocker');
  const hasWarning = findings.some((f) => f.severity === 'warning');

  return {
    entityType: 'promotion',
    entityId: input.entityId,
    passed: !hasBlocker,
    overallSeverity: hasBlocker ? 'blocker' : hasWarning ? 'warning' : 'pass',
    findings,
    assessedAt: new Date().toISOString(),
  };
}

export function assessExecution(input: ExecutionAssessmentInput): AssessmentResult {
  const mode = input.orderPlan.tradingMode;
  const portfolioCheck = checkPortfolioAgainstPolicy(input.portfolio, input.rules, mode);
  const orderCheck = checkOrderPlanAgainstPolicy(input.orderPlan, input.rules);

  const findings: AssessmentFinding[] = [
    ...portfolioCheck.violations,
    ...orderCheck.violations,
  ].map((v) => ({
    dimension: v.dimension,
    severity: v.severity === 'blocker' ? ('blocker' as const) : ('warning' as const),
    message: v.message,
    actual: v.actual,
    limit: v.limit,
  }));

  const hasBlocker = findings.some((f) => f.severity === 'blocker');
  const hasWarning = findings.some((f) => f.severity === 'warning');

  return {
    entityType: 'execution',
    entityId: input.entityId,
    passed: !hasBlocker,
    overallSeverity: hasBlocker ? 'blocker' : hasWarning ? 'warning' : 'pass',
    findings,
    assessedAt: new Date().toISOString(),
  };
}

export function assessOrderBatch(
  entityId: string,
  orderPlan: OrderPlan,
  rules: PolicyRule[]
): AssessmentResult {
  const check = checkOrderPlanAgainstPolicy(orderPlan, rules);

  const findings: AssessmentFinding[] = check.violations.map((v) => ({
    dimension: v.dimension,
    severity: v.severity === 'blocker' ? ('blocker' as const) : ('warning' as const),
    message: v.message,
    actual: v.actual,
    limit: v.limit,
  }));

  const hasBlocker = findings.some((f) => f.severity === 'blocker');
  const hasWarning = findings.some((f) => f.severity === 'warning');

  return {
    entityType: 'order_batch',
    entityId,
    passed: !hasBlocker,
    overallSeverity: hasBlocker ? 'blocker' : hasWarning ? 'warning' : 'pass',
    findings,
    assessedAt: new Date().toISOString(),
  };
}
