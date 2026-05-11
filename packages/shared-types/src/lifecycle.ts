export type PromotionStatus =
  | 'draft'
  | 'submitted'
  | 'agent_reviewed'
  | 'risk_reviewed'
  | 'approved_for_paper'
  | 'paper_observed'
  | 'approved_for_live'
  | 'live_limited'
  | 'live_expanded'
  | 'suspended'
  | 'retired';

export type PromotionGateKey =
  | 'research_evidence'
  | 'dataset_quality'
  | 'feature_leakage_check'
  | 'backtest_reproducibility'
  | 'robustness_diagnostics'
  | 'risk_assessment'
  | 'paper_observation'
  | 'live_acknowledgement';

export type PromotionGateStatus = 'pending' | 'passed' | 'failed' | 'waived';

export type PromotionGate = {
  key: PromotionGateKey;
  label: string;
  status: PromotionGateStatus;
  evidenceId: string | null;
  evaluatedAt: string;
  evaluatedBy: string;
  reason: string;
  metadata: Record<string, unknown>;
};

export type PromotionDecisionActor = 'human' | 'agent' | 'system' | 'policy';

export type PromotionDecision = {
  id: string;
  promotionRequestId: string;
  actor: string;
  actorType: PromotionDecisionActor;
  role: string;
  action: 'approve_paper' | 'approve_live' | 'reject' | 'suspend' | 'waive_gate';
  reason: string;
  evidenceLinks: string[];
  timestamp: string;
  metadata: Record<string, unknown>;
};

export type PromotionRequest = {
  id: string;
  strategyCandidateId: string;
  strategyVersionId: string;
  status: PromotionStatus;
  gates: PromotionGate[];
  decisions: PromotionDecision[];
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type StrategyVersionEvidence = {
  researchIdeaId: string;
  experimentRunId: string;
  modelVersionId: string | null;
  backtestRunId: string;
  datasetVersionId: string;
  featureVersionId: string;
  riskAssessmentId: string | null;
};

export type StrategyVersion = {
  id: string;
  strategyCandidateId: string;
  version: number;
  codeVersion: string;
  evidence: StrategyVersionEvidence;
  parameters: Record<string, unknown>;
  status: 'draft' | 'candidate' | 'paper' | 'live' | 'retired';
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type StrategyCandidate = {
  id: string;
  name: string;
  description: string;
  owner: string;
  workspaceId: string;
  activeVersionId: string | null;
  versions: StrategyVersion[];
  latestPromotionRequestId: string | null;
  status: 'draft' | 'candidate' | 'paper' | 'live' | 'suspended' | 'retired';
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type DecisionRecord = {
  id: string;
  entityType:
    | 'research_idea'
    | 'experiment'
    | 'model'
    | 'strategy'
    | 'promotion'
    | 'execution'
    | 'risk';
  entityId: string;
  actor: string;
  actorType: PromotionDecisionActor;
  role: string;
  action: string;
  reason: string;
  evidenceLinks: string[];
  timestamp: string;
  metadata: Record<string, unknown>;
};
