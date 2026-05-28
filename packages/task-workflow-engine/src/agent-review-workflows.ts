export type AgentReviewType =
  | 'research_idea_critique'
  | 'backtest_overfit_review'
  | 'risk_violation_explanation'
  | 'promotion_memo_draft'
  | 'execution_incident_summary';

export type AgentReviewRequest = {
  reviewType: AgentReviewType;
  targetId: string;
  requestedBy: string;
  context?: Record<string, unknown>;
};

export type AgentReviewResult = {
  ok: boolean;
  reviewType: AgentReviewType;
  targetId: string;
  verdict: string;
  summary: string;
  evidenceCitations: Array<{ kind: string; ref: string; label: string }>;
  recommendations: string[];
  generatedAt: string;
};

const REVIEW_WORKFLOW_MAP: Record<AgentReviewType, string> = {
  research_idea_critique: 'task-orchestrator.agent-review.idea-critique',
  backtest_overfit_review: 'task-orchestrator.agent-review.overfit-review',
  risk_violation_explanation: 'task-orchestrator.agent-review.risk-violation',
  promotion_memo_draft: 'task-orchestrator.agent-review.promotion-memo',
  execution_incident_summary: 'task-orchestrator.agent-review.incident-summary',
};

const VALID_REVIEW_TYPES = new Set(Object.keys(REVIEW_WORKFLOW_MAP));

export function isValidReviewType(type: string): type is AgentReviewType {
  return VALID_REVIEW_TYPES.has(type);
}

export function getReviewWorkflowId(type: AgentReviewType): string {
  return REVIEW_WORKFLOW_MAP[type];
}

function startWorkflow(context: any, payload: any) {
  if (typeof context.startWorkflow === 'function') {
    return context.startWorkflow(payload);
  }
  return context.startWorkflowRun(payload);
}

function completeWorkflow(context: any, workflowRunId: any, patch: any) {
  if (typeof context.completeWorkflow === 'function') {
    return context.completeWorkflow(workflowRunId, patch);
  }
  return context.completeWorkflowRun(workflowRunId, patch);
}

function failWorkflow(context: any, workflowRunId: any, error: any, patch: any) {
  if (typeof context.failWorkflow === 'function') {
    return context.failWorkflow(workflowRunId, error, patch);
  }
  return context.failWorkflowRun(workflowRunId, error, patch);
}

function buildIdeaCritique(context: any, request: AgentReviewRequest): AgentReviewResult {
  const idea = context.getResearchIdea?.(request.targetId);
  const title = idea?.title || request.targetId;
  const status = idea?.status || 'unknown';

  const evidenceCitations = [];
  if (idea) {
    evidenceCitations.push({ kind: 'dataset', ref: request.targetId, label: `Idea: ${title}` });
  }

  const hasExperiments = (context.listExperimentsByIdea?.(request.targetId) || []).length > 0;
  const verdict = hasExperiments ? 'has_supporting_evidence' : 'needs_experiment';
  const summary = hasExperiments
    ? `Research idea "${title}" has supporting experiments. Consider proceeding to backtest.`
    : `Research idea "${title}" (status: ${status}) lacks experimental evidence. Recommend designing an experiment first.`;

  return {
    ok: true,
    reviewType: 'research_idea_critique',
    targetId: request.targetId,
    verdict,
    summary,
    evidenceCitations,
    recommendations: hasExperiments
      ? ['Proceed to backtest phase', 'Document hypothesis validation']
      : ['Design controlled experiment', 'Define measurable success criteria'],
    generatedAt: new Date().toISOString(),
  };
}

function buildOverfitReview(context: any, request: AgentReviewRequest): AgentReviewResult {
  const run = context.getBacktestRun?.(request.targetId);
  const strategyName = run?.strategyName || 'Unknown';
  const sharpe = run?.sharpe ?? 0;
  const maxDrawdown = run?.maxDrawdownPct ?? 0;
  const winRate = run?.winRatePct ?? 0;
  const turnover = run?.turnoverPct ?? 0;

  const evidenceCitations = [];
  if (run) {
    evidenceCitations.push({
      kind: 'backtest',
      ref: request.targetId,
      label: `Backtest: ${strategyName}`,
    });
  }

  const overfitSignals = [];
  if (sharpe > 3.0) overfitSignals.push(`Unusually high Sharpe (${sharpe.toFixed(2)})`);
  if (winRate > 75) overfitSignals.push(`Win rate above 75% (${winRate.toFixed(1)}%)`);
  if (turnover > 500) overfitSignals.push(`Excessive turnover (${turnover.toFixed(0)}%)`);
  if (maxDrawdown < 2 && sharpe > 2)
    overfitSignals.push('Suspiciously low drawdown with high returns');

  const verdict = overfitSignals.length > 0 ? 'overfit_risk_detected' : 'acceptable';
  const summary =
    overfitSignals.length > 0
      ? `Backtest "${strategyName}" shows ${overfitSignals.length} overfit signal(s): ${overfitSignals.join('; ')}.`
      : `Backtest "${strategyName}" metrics are within acceptable ranges (Sharpe ${sharpe.toFixed(2)}, DD ${maxDrawdown.toFixed(1)}%).`;

  return {
    ok: true,
    reviewType: 'backtest_overfit_review',
    targetId: request.targetId,
    verdict,
    summary,
    evidenceCitations,
    recommendations:
      overfitSignals.length > 0
        ? [
            'Run out-of-sample validation',
            'Check parameter sensitivity',
            'Review data snooping risk',
          ]
        : ['Proceed to promotion review if risk profile acceptable'],
    generatedAt: new Date().toISOString(),
  };
}

function buildRiskViolationExplanation(
  context: any,
  request: AgentReviewRequest
): AgentReviewResult {
  const event = context.getRiskEvent?.(request.targetId);
  const level = event?.level || 'unknown';
  const title = event?.title || request.targetId;

  const evidenceCitations = [];
  if (event) {
    evidenceCitations.push({
      kind: 'risk_assessment',
      ref: request.targetId,
      label: `Risk event: ${title}`,
    });
  }

  const verdict = level === 'critical' ? 'critical_violation' : 'policy_breach';
  const summary = event
    ? `Risk event "${title}" (level: ${level}) triggered a policy violation. ${event.message || ''}`
    : `Risk event ${request.targetId} could not be resolved. Manual review required.`;

  return {
    ok: true,
    reviewType: 'risk_violation_explanation',
    targetId: request.targetId,
    verdict,
    summary,
    evidenceCitations,
    recommendations: [
      'Review triggering conditions',
      'Verify affected positions or strategies',
      level === 'critical' ? 'Escalate to risk committee' : 'Document remediation steps',
    ],
    generatedAt: new Date().toISOString(),
  };
}

function buildPromotionMemo(context: any, request: AgentReviewRequest): AgentReviewResult {
  const strategy = context.getStrategyCatalogItem?.(request.targetId);
  const name = strategy?.name || request.targetId;
  const status = strategy?.status || 'unknown';

  const evidenceCitations = [];
  if (strategy) {
    evidenceCitations.push({
      kind: 'promotion',
      ref: request.targetId,
      label: `Strategy: ${name}`,
    });
  }

  const runs = context.listBacktestRuns?.() || [];
  const strategyRuns = runs.filter(
    (r: any) => r.strategyId === request.targetId && r.status === 'completed'
  );
  const latestRun = strategyRuns[0];

  if (latestRun) {
    evidenceCitations.push({
      kind: 'backtest',
      ref: latestRun.id,
      label: `Latest backtest: Sharpe ${latestRun.sharpe?.toFixed(2) || 'N/A'}`,
    });
  }

  const meetsGate = latestRun && latestRun.sharpe >= 1.0 && latestRun.maxDrawdownPct <= 15;
  const verdict = meetsGate ? 'promotion_recommended' : 'promotion_deferred';
  const summary = meetsGate
    ? `Strategy "${name}" meets promotion criteria. Latest backtest: Sharpe ${latestRun.sharpe.toFixed(2)}, max DD ${latestRun.maxDrawdownPct.toFixed(1)}%.`
    : `Strategy "${name}" (status: ${status}) does not currently meet promotion gates. ${latestRun ? `Sharpe ${latestRun.sharpe.toFixed(2)}, DD ${latestRun.maxDrawdownPct.toFixed(1)}%.` : 'No completed backtests found.'}`;

  return {
    ok: true,
    reviewType: 'promotion_memo_draft',
    targetId: request.targetId,
    verdict,
    summary,
    evidenceCitations,
    recommendations: meetsGate
      ? ['Submit promotion request', 'Prepare paper trading allocation']
      : ['Address backtest gaps', 'Rerun with updated parameters'],
    generatedAt: new Date().toISOString(),
  };
}

function buildIncidentSummary(context: any, request: AgentReviewRequest): AgentReviewResult {
  const incident = context.getIncident?.(request.targetId);
  const title = incident?.title || request.targetId;
  const severity = incident?.severity || 'unknown';
  const status = incident?.status || 'unknown';

  const evidenceCitations = [];
  if (incident) {
    evidenceCitations.push({
      kind: 'execution_record',
      ref: request.targetId,
      label: `Incident: ${title}`,
    });
  }

  const verdict =
    status === 'resolved'
      ? 'resolved'
      : severity === 'critical'
        ? 'needs_escalation'
        : 'needs_investigation';
  const summary = incident
    ? `Execution incident "${title}" (severity: ${severity}, status: ${status}). ${incident.summary || ''}`
    : `Incident ${request.targetId} not found. Manual investigation required.`;

  return {
    ok: true,
    reviewType: 'execution_incident_summary',
    targetId: request.targetId,
    verdict,
    summary,
    evidenceCitations,
    recommendations: [
      status === 'resolved' ? 'Archive and document learnings' : 'Continue investigation',
      severity === 'critical' ? 'Notify operations team' : 'Monitor for recurrence',
    ],
    generatedAt: new Date().toISOString(),
  };
}

const REVIEW_BUILDERS: Record<
  AgentReviewType,
  (ctx: any, req: AgentReviewRequest) => AgentReviewResult
> = {
  research_idea_critique: buildIdeaCritique,
  backtest_overfit_review: buildOverfitReview,
  risk_violation_explanation: buildRiskViolationExplanation,
  promotion_memo_draft: buildPromotionMemo,
  execution_incident_summary: buildIncidentSummary,
};

export async function executeAgentReviewWorkflow(
  request: AgentReviewRequest,
  context: any,
  options: { workflow?: any; trigger?: string } = {}
) {
  const workflowId = getReviewWorkflowId(request.reviewType);
  const workflow =
    options.workflow ||
    startWorkflow(context, {
      workflowId,
      workflowType: 'task-orchestrator',
      actor: request.requestedBy,
      trigger: options.trigger || 'api',
      payload: request,
      maxAttempts: 1,
      steps: [
        { key: 'gather-evidence', status: 'running' },
        { key: 'generate-review', status: 'pending' },
        { key: 'persist-result', status: 'pending' },
      ],
    });

  try {
    const builder = REVIEW_BUILDERS[request.reviewType];
    if (!builder) {
      throw new Error(`No review builder for type: ${request.reviewType}`);
    }

    const result = builder(context, request);

    context.appendAuditRecord?.({
      type: 'agent-review.completed',
      actor: request.requestedBy,
      title: `Agent review: ${request.reviewType}`,
      detail: result.summary,
      metadata: {
        reviewType: request.reviewType,
        targetId: request.targetId,
        verdict: result.verdict,
        workflowRunId: workflow.id,
      },
    });

    context.enqueueNotification?.({
      level:
        result.verdict.includes('critical') || result.verdict.includes('escalation')
          ? 'warn'
          : 'info',
      source: 'agent-review',
      title: `Agent review completed: ${request.reviewType}`,
      message: result.summary,
      metadata: {
        reviewType: request.reviewType,
        targetId: request.targetId,
        verdict: result.verdict,
      },
    });

    const persistedWorkflow = completeWorkflow(context, workflow.id, {
      steps: [
        { key: 'gather-evidence', status: 'completed', citations: result.evidenceCitations.length },
        { key: 'generate-review', status: 'completed', verdict: result.verdict },
        { key: 'persist-result', status: 'completed' },
      ],
      result: { ok: true, verdict: result.verdict, reviewType: request.reviewType },
    });

    return { ...result, workflow: persistedWorkflow };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'agent review workflow failed';
    const failedWorkflow = failWorkflow(context, workflow.id, errMsg, {
      steps: [
        { key: 'gather-evidence', status: 'failed' },
        { key: 'generate-review', status: 'skipped' },
        { key: 'persist-result', status: 'skipped' },
      ],
    });
    return {
      ok: false,
      reviewType: request.reviewType,
      targetId: request.targetId,
      verdict: 'error',
      summary: errMsg,
      evidenceCitations: [],
      recommendations: [],
      generatedAt: new Date().toISOString(),
      workflow: failedWorkflow,
    };
  }
}
