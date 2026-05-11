export type ResearchStatus =
  | 'idea'
  | 'dataset_selected'
  | 'features_defined'
  | 'experiment_running'
  | 'experiment_reviewed'
  | 'strategy_candidate'
  | 'backtest_ready'
  | 'risk_review'
  | 'paper_ready'
  | 'live_review'
  | 'live_enabled'
  | 'monitored'
  | 'retired';

export type ResearchOwnerRole =
  | 'researcher'
  | 'strategist'
  | 'risk_officer'
  | 'execution_lead'
  | 'platform_engineer';

export type ResearchDecisionRecord = {
  id: string;
  actor: string;
  role: ResearchOwnerRole;
  action: string;
  reason: string;
  evidenceLinks: string[];
  timestamp: string;
  metadata: Record<string, unknown>;
};

export type ResearchHypothesis = {
  statement: string;
  rationale: string;
  expectedOutcome: string;
  falsificationCriteria: string;
  relatedLiterature: string[];
};

export type ResearchIdea = {
  id: string;
  workspaceId: string;
  title: string;
  hypothesis: ResearchHypothesis;
  market: string;
  assetUniverse: string[];
  timeHorizon: string;
  status: ResearchStatus;
  owner: string;
  ownerRole: ResearchOwnerRole;
  tags: string[];
  decisionRecords: ResearchDecisionRecord[];
  linkedDatasetIds: string[];
  linkedFeatureSetIds: string[];
  linkedExperimentIds: string[];
  linkedBacktestIds: string[];
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type ResearchWorkspace = {
  id: string;
  title: string;
  description: string;
  owner: string;
  ownerRole: ResearchOwnerRole;
  status: 'active' | 'archived';
  ideas: ResearchIdea[];
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};
