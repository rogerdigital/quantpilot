export type PlatformEventType =
  | 'dataset_ingested'
  | 'data_quality_failed'
  | 'experiment_started'
  | 'experiment_completed'
  | 'backtest_completed'
  | 'promotion_submitted'
  | 'promotion_approved'
  | 'promotion_rejected'
  | 'risk_breach_detected'
  | 'execution_plan_submitted'
  | 'order_lifecycle_changed'
  | 'agent_review_produced'
  | 'kill_switch_triggered';

export type PlatformEventSeverity = 'info' | 'warning' | 'critical';

export type PlatformEvent = {
  id: string;
  type: PlatformEventType;
  severity: PlatformEventSeverity;
  timestamp: string;
  source: string;
  payload: Record<string, unknown>;
  correlationId?: string;
  namespace?: string;
};
