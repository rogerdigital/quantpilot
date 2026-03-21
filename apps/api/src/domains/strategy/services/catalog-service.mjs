import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';
import { buildStrategyExecutionCandidate } from './execution-candidate-service.mjs';
import { assessExecutionCandidate } from '../../risk/services/assessment-service.mjs';
import { refreshBacktestSummary } from '../../backtest/services/summary-service.mjs';

function buildPromotionReadiness(strategy, latestResult) {
  if (!strategy) return null;
  if (strategy.status === 'archived') {
    return {
      level: 'blocked',
      headline: 'Archived strategies cannot be promoted.',
      recommendedAction: 'restore_strategy',
      reasons: ['restore the strategy before research promotion or execution planning'],
    };
  }
  if (!latestResult) {
    return {
      level: 'blocked',
      headline: 'A fresh backtest result is required before promotion.',
      recommendedAction: 'queue_backtest',
      reasons: ['no versioned backtest result exists for this strategy'],
    };
  }
  if (latestResult.status === 'failed') {
    return {
      level: 'blocked',
      headline: 'The latest backtest result failed and blocks promotion.',
      recommendedAction: 'inspect_backtest',
      reasons: ['review the failed result and re-run the research task'],
    };
  }
  if (latestResult.status === 'needs_review') {
    return {
      level: 'review',
      headline: 'The latest backtest result still requires manual review.',
      recommendedAction: 'review_backtest',
      reasons: ['complete the operator review before promoting or routing execution'],
    };
  }
  if (strategy.status === 'draft' || strategy.status === 'researching') {
    return {
      level: 'review',
      headline: 'The result is healthy, but the strategy is still below candidate stage.',
      recommendedAction: 'promote_strategy',
      reasons: ['promote the strategy lifecycle before preparing execution plans'],
    };
  }
  return {
    level: 'ready',
    headline: 'This strategy is ready for downstream execution planning.',
    recommendedAction: 'prepare_execution',
    reasons: ['latest result is healthy and the lifecycle stage can support downstream routing'],
  };
}

function buildReplayTimeline(strategy, inputs = {}) {
  const {
    auditItems = [],
    runs = [],
    results = [],
    evaluations = [],
    reports = [],
    tasks = [],
    workflows = [],
    governanceActions = [],
  } = inputs;

  const items = [
    ...auditItems.map((item) => ({
      id: `audit-${item.id}`,
      eventType: 'audit',
      lane: 'Registry',
      title: item.title,
      detail: item.detail,
      at: item.createdAt,
      reference: strategy.id,
      metrics: [
        { label: 'Status', value: typeof item.metadata?.status === 'string' ? item.metadata.status : '--' },
        { label: 'Actor', value: item.actor || '--' },
      ],
    })),
    ...tasks.map((task) => ({
      id: `task-${task.id}`,
      eventType: 'task',
      lane: 'Research Task',
      title: task.title,
      detail: task.summary,
      at: task.updatedAt || task.createdAt,
      reference: task.id,
      linkedRunId: task.runId || '',
      linkedWorkflowRunId: task.workflowRunId || '',
      metrics: [
        { label: 'Type', value: task.taskType },
        { label: 'Status', value: task.status },
      ],
    })),
    ...workflows.map((workflow) => ({
      id: `workflow-${workflow.id}`,
      eventType: 'workflow',
      lane: 'Workflow',
      title: workflow.title || workflow.workflowId,
      detail: workflow.summary || workflow.result?.message || 'Workflow activity recorded for the research chain.',
      at: workflow.updatedAt || workflow.createdAt,
      reference: workflow.id,
      linkedWorkflowRunId: workflow.id,
      metrics: [
        { label: 'Status', value: workflow.status || '--' },
        { label: 'Workflow', value: workflow.workflowId || '--' },
      ],
    })),
    ...runs.map((run) => ({
      id: `run-${run.id}`,
      eventType: 'run',
      lane: 'Backtest',
      title: `${run.windowLabel} · ${run.status}`,
      detail: run.summary,
      at: run.completedAt || run.reviewedAt || run.updatedAt || run.startedAt,
      reference: run.id,
      linkedRunId: run.id,
      linkedWorkflowRunId: run.workflowRunId || '',
      metrics: [
        { label: 'Return', value: run.status === 'completed' || run.status === 'needs_review' ? `${run.annualizedReturnPct.toFixed(1)}%` : '--' },
        { label: 'Sharpe', value: run.status === 'completed' || run.status === 'needs_review' ? run.sharpe.toFixed(2) : '--' },
      ],
    })),
    ...results.map((result) => ({
      id: `result-${result.id}`,
      eventType: 'result',
      lane: 'Result',
      title: `v${result.version} · ${result.stage}`,
      detail: result.summary,
      at: result.updatedAt || result.generatedAt,
      reference: result.runId,
      linkedRunId: result.runId,
      linkedWorkflowRunId: result.workflowRunId || '',
      linkedResultId: result.id,
      metrics: [
        { label: 'Status', value: result.status },
        { label: 'Excess', value: `${result.excessReturnPct.toFixed(1)}%` },
      ],
    })),
    ...evaluations.map((evaluation) => ({
      id: `evaluation-${evaluation.id}`,
      eventType: 'evaluation',
      lane: 'Evaluation',
      title: `${evaluation.verdict} · ${evaluation.readiness}`,
      detail: evaluation.summary,
      at: evaluation.createdAt,
      reference: evaluation.runId,
      linkedRunId: evaluation.runId,
      linkedResultId: evaluation.resultId || '',
      metrics: [
        { label: 'Band', value: evaluation.scoreBand },
        { label: 'Action', value: evaluation.recommendedAction || '--' },
      ],
    })),
    ...reports.map((report) => ({
      id: `report-${report.id}`,
      eventType: 'report',
      lane: 'Report',
      title: report.title,
      detail: report.executiveSummary || report.promotionCall || 'Research report asset generated.',
      at: report.updatedAt || report.createdAt,
      reference: report.runId,
      linkedRunId: report.runId,
      linkedWorkflowRunId: report.workflowRunId || '',
      linkedResultId: report.resultId || '',
      metrics: [
        { label: 'Verdict', value: report.verdict },
        { label: 'Readiness', value: report.readiness },
      ],
    })),
    ...governanceActions.map((action) => ({
      id: `governance-${action.id}`,
      eventType: 'governance',
      lane: 'Governance',
      title: action.title,
      detail: action.detail,
      at: action.createdAt,
      reference: typeof action.metadata?.primaryId === 'string' ? action.metadata.primaryId : strategy.id,
      metrics: [
        { label: 'Level', value: action.level || '--' },
        { label: 'Actor', value: action.actor || '--' },
      ],
    })),
  ];

  return items
    .sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime())
    .slice(0, 24);
}

function buildReplaySummary(timeline = []) {
  return timeline.reduce((acc, item) => {
    acc.totalEvents += 1;
    if (item.eventType === 'audit') acc.registryEvents += 1;
    if (item.eventType === 'run' || item.eventType === 'result' || item.eventType === 'task' || item.eventType === 'workflow') acc.researchEvents += 1;
    if (item.eventType === 'evaluation' || item.eventType === 'report') acc.reviewEvents += 1;
    if (item.eventType === 'governance') acc.governanceEvents += 1;
    if (item.eventType === 'execution') acc.executionEvents += 1;
    if (!acc.latestAt) acc.latestAt = item.at || '';
    if (!acc.latestRunId && item.linkedRunId) acc.latestRunId = item.linkedRunId;
    if (!acc.latestResultId && item.linkedResultId) acc.latestResultId = item.linkedResultId;
    if (!acc.latestEvaluationId && item.eventType === 'evaluation') acc.latestEvaluationId = item.id.replace('evaluation-', '');
    if (!acc.latestReportId && item.eventType === 'report') acc.latestReportId = item.id.replace('report-', '');
    return acc;
  }, {
    totalEvents: 0,
    registryEvents: 0,
    researchEvents: 0,
    reviewEvents: 0,
    governanceEvents: 0,
    executionEvents: 0,
    latestAt: '',
    latestRunId: '',
    latestResultId: '',
    latestEvaluationId: '',
    latestReportId: '',
  });
}

export function listStrategyCatalog() {
  const strategies = controlPlaneRuntime.listStrategyCatalog();
  const asOf = strategies[0]?.updatedAt || new Date().toISOString();

  return {
    ok: true,
    asOf,
    strategies,
  };
}

export function getStrategyCatalogItem(strategyId) {
  return controlPlaneRuntime.getStrategyCatalogItem(strategyId);
}

export function getStrategyCatalogDetail(strategyId) {
  const strategy = controlPlaneRuntime.getStrategyCatalogItem(strategyId);
  if (!strategy) {
    return {
      ok: false,
      error: 'strategy not found',
      message: `Unknown strategy: ${strategyId || 'missing strategyId'}`,
    };
  }

  const recentRuns = controlPlaneRuntime.listBacktestRuns(20, { strategyId: strategy.id });
  const recentResults = controlPlaneRuntime.listBacktestResults(20, { strategyId: strategy.id });
  const latestResult = recentResults[0] || null;
  const latestEvaluation = controlPlaneRuntime.getLatestEvaluationForStrategy(strategy.id);
  const recentEvaluations = controlPlaneRuntime.listResearchEvaluations(20, { strategyId: strategy.id });
  const recentReports = controlPlaneRuntime.listResearchReports(20, { strategyId: strategy.id });
  const latestReport = recentReports[0] || null;
  const researchTasks = controlPlaneRuntime.listResearchTasks(20, { strategyId: strategy.id });
  const workflowRunIds = Array.from(new Set([
    ...recentRuns.map((item) => item.workflowRunId).filter(Boolean),
    ...recentResults.map((item) => item.workflowRunId).filter(Boolean),
    ...recentReports.map((item) => item.workflowRunId).filter(Boolean),
    ...researchTasks.map((item) => item.workflowRunId).filter(Boolean),
  ]));
  const workflows = controlPlaneRuntime.listWorkflowRuns(60, {})
    .filter((item) => workflowRunIds.includes(item.id))
    .slice(0, 20);
  const governanceActions = controlPlaneRuntime.listOperatorActions(80, {})
    .filter((item) => item.type?.startsWith('research-governance.'))
    .filter((item) => {
      if (item.symbol === strategy.id) return true;
      const successes = Array.isArray(item.metadata?.successes) ? item.metadata.successes : [];
      return successes.some((entry) => entry && typeof entry === 'object' && entry.strategyId === strategy.id);
    })
    .slice(0, 20);
  const strategyAuditItems = controlPlaneRuntime.listAuditRecords(80, {})
    .filter((item) => item.type === 'strategy-catalog.saved')
    .filter((item) => item.metadata?.strategyId === strategy.id)
    .slice(0, 20);
  const replayTimeline = buildReplayTimeline(strategy, {
    auditItems: strategyAuditItems,
    runs: recentRuns,
    results: recentResults,
    evaluations: recentEvaluations,
    reports: recentReports,
    tasks: researchTasks,
    workflows,
    governanceActions,
  });
  const replaySummary = buildReplaySummary(replayTimeline);
  let executionCandidatePreview = null;
  try {
    const candidate = buildStrategyExecutionCandidate({
      strategyId: strategy.id,
      mode: 'paper',
      capital: 50000,
      requestedBy: 'strategy-catalog.detail',
    });
    const riskDecision = assessExecutionCandidate(candidate);
    executionCandidatePreview = {
      mode: candidate.mode,
      capital: candidate.capital,
      orderCount: candidate.orders.length,
      riskStatus: riskDecision.riskStatus,
      approvalState: riskDecision.approvalState,
      summary: riskDecision.summary,
      reasons: riskDecision.reasons,
      orders: candidate.orders,
    };
  } catch {
    executionCandidatePreview = null;
  }

  return {
    ok: true,
    strategy,
    latestRun: recentRuns[0] || null,
    recentRuns,
    latestResult,
    recentResults,
    latestEvaluation,
    recentEvaluations,
    latestReport,
    recentReports,
    researchTasks,
    workflows,
    governanceActions,
    replaySummary,
    replayTimeline,
    promotionReadiness: buildPromotionReadiness(strategy, latestResult),
    executionCandidatePreview,
  };
}

export function saveStrategyCatalogItem(payload = {}) {
  if (!payload.id || !payload.name) {
    return {
      ok: false,
      error: 'invalid strategy payload',
      message: 'strategy id and name are required',
    };
  }

  const strategy = controlPlaneRuntime.upsertStrategyCatalogItem(payload);

  controlPlaneRuntime.appendAuditRecord({
    type: 'strategy-catalog.saved',
    actor: payload.updatedBy || 'operator',
    title: `Strategy catalog saved for ${strategy.name}`,
    detail: `Strategy ${strategy.id} is now registered with status ${strategy.status}.`,
    metadata: {
      strategyId: strategy.id,
      status: strategy.status,
      family: strategy.family,
      timeframe: strategy.timeframe,
      universe: strategy.universe,
      score: strategy.score,
      expectedReturnPct: strategy.expectedReturnPct,
      maxDrawdownPct: strategy.maxDrawdownPct,
      sharpe: strategy.sharpe,
    },
  });

  controlPlaneRuntime.enqueueNotification({
    level: 'info',
    source: 'strategy-catalog',
    title: 'Strategy catalog updated',
    message: `${strategy.name} was saved to the strategy registry.`,
    metadata: {
      strategyId: strategy.id,
      status: strategy.status,
    },
  });

  refreshBacktestSummary('strategy-catalog.save');

  return {
    ok: true,
    strategy,
  };
}
