export type ResearchAssistantTaskType =
  | 'idea_critique'
  | 'backtest_review'
  | 'overfit_review'
  | 'risk_review'
  | 'execution_review'
  | 'promotion_memo'
  | 'incident_summary'
  | 'dataset_quality_summary'
  | 'experiment_comparison'
  | 'recovery_memo';

export type ResearchAssistantTaskStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'rejected';

export type AgentEvidenceCitation = {
  id: string;
  kind:
    | 'dataset'
    | 'experiment'
    | 'backtest'
    | 'risk_assessment'
    | 'execution_record'
    | 'model'
    | 'promotion';
  entityId: string;
  entityLabel: string;
  summary: string;
  relevance: 'primary' | 'supporting' | 'contextual';
};

export type AgentActionBoundary = {
  tool: string;
  allowed: boolean;
  reason: string;
  category: 'read' | 'write' | 'approve' | 'execute' | 'delete';
};

export type AgentResearchSuggestion = {
  id: string;
  taskId: string;
  kind: 'hypothesis' | 'feature' | 'experiment_design' | 'risk_flag' | 'improvement' | 'next_step';
  title: string;
  body: string;
  confidence: 'high' | 'medium' | 'low';
  citations: AgentEvidenceCitation[];
  accepted: boolean | null;
  acceptedBy: string | null;
  acceptedAt: string | null;
};

export type AgentRiskReview = {
  id: string;
  taskId: string;
  entityId: string;
  entityType: 'strategy' | 'execution_plan' | 'promotion_request' | 'backtest_run';
  verdict: 'pass' | 'warn' | 'block';
  summary: string;
  findings: Array<{
    dimension: string;
    severity: 'info' | 'warn' | 'critical';
    message: string;
    citation: AgentEvidenceCitation | null;
  }>;
  citations: AgentEvidenceCitation[];
  reviewedAt: string;
};

export type AgentExecutionReview = {
  id: string;
  taskId: string;
  executionPlanId: string;
  verdict: 'proceed' | 'hold' | 'escalate';
  summary: string;
  concerns: Array<{
    area: string;
    severity: 'info' | 'warn' | 'critical';
    message: string;
  }>;
  citations: AgentEvidenceCitation[];
  reviewedAt: string;
};

export type ResearchAssistantTask = {
  id: string;
  type: ResearchAssistantTaskType;
  status: ResearchAssistantTaskStatus;
  requestedBy: string;
  targetEntityId: string;
  targetEntityType: string;
  prompt: string;
  result: {
    summary: string;
    suggestions: AgentResearchSuggestion[];
    riskReview: AgentRiskReview | null;
    executionReview: AgentExecutionReview | null;
    citations: AgentEvidenceCitation[];
  } | null;
  error: string | null;
  boundaries: AgentActionBoundary[];
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};
