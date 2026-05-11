export type RiskPolicyMode = 'paper' | 'live' | 'both';

export type RiskPolicyDimension =
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

export type RiskPolicyRule = {
  dimension: RiskPolicyDimension;
  limit: number | string[];
  mode: RiskPolicyMode;
  severity: 'warning' | 'blocker';
};

export type RiskPolicy = {
  id: string;
  name: string;
  description: string;
  rules: RiskPolicyRule[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type RiskViolation = {
  dimension: RiskPolicyDimension;
  limit: number | string[];
  actual: number | string;
  severity: 'warning' | 'blocker';
  message: string;
};

export type RiskAssessmentResult = {
  id: string;
  entityType: 'promotion' | 'execution' | 'order_batch';
  entityId: string;
  policyId: string;
  passed: boolean;
  violations: RiskViolation[];
  assessedAt: string;
  metadata: Record<string, unknown>;
};

export type KillSwitchState = {
  active: boolean;
  activatedAt: string | null;
  activatedBy: string | null;
  reason: string | null;
};
