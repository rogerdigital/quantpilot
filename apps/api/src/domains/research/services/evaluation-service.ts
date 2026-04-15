// @ts-nocheck
import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';
import { queueWorkflow } from '../../../control-plane/task-orchestrator/services/workflow-service.js';
import { refreshBacktestSummary } from '../../backtest/services/summary-service.js';
import { assessExecutionCandidate } from '../../risk/services/assessment-service.js';
import {
  getStrategyCatalogDetail,
  getStrategyCatalogItem,
} from '../../strategy/services/catalog-service.js';
import { buildStrategyExecutionCandidate } from '../../strategy/services/execution-candidate-service.js';

function parseLimit(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveSince(hours) {
  const parsed = Number(hours);
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  return new Date(Date.now() - parsed * 60 * 60 * 1000).toISOString();
}

function getNextStrategyStage(status) {
  if (status === 'draft') return 'researching';
  if (status === 'researching') return 'candidate';
  if (status === 'candidate') return 'paper';
  if (status === 'paper') return 'live';
  return '';
}

function buildEvaluationForRun(_run, result, strategy, payload = {}) {
  const benchmarkGapPct = Number(
    (result.annualizedReturnPct - result.benchmarkReturnPct).toFixed(1)
  );
  const drawdownBufferPct = Number((12 - result.maxDrawdownPct).toFixed(1));
  const scoreBand =
    result.sharpe >= 1.2 && result.maxDrawdownPct <= 10
      ? 'strong'
      : result.sharpe >= 0.95 && result.maxDrawdownPct <= 12
        ? 'watch'
        : 'weak';

  if (result.status === 'failed') {
    return {
      verdict: 'blocked',
      scoreBand: 'weak',
      readiness: 'hold',
      recommendedAction: 'rerun_backtest',
      summary:
        'The latest backtest result failed and blocks promotion until the research issue is resolved.',
      metadata: {
        benchmarkGapPct,
        drawdownBufferPct,
        reasons: ['backtest result status is failed'],
      },
    };
  }

  if (result.status === 'needs_review') {
    return {
      verdict: 'blocked',
      scoreBand,
      readiness: 'hold',
      recommendedAction: 'complete_review',
      summary:
        'The latest result still requires manual review before any promotion decision can be finalized.',
      metadata: {
        benchmarkGapPct,
        drawdownBufferPct,
        reasons: ['manual review is still pending'],
      },
    };
  }

  if (scoreBand === 'weak' || benchmarkGapPct < 1.5) {
    return {
      verdict: 'rework',
      scoreBand,
      readiness: 'hold',
      recommendedAction: 'tune_strategy',
      summary:
        'The result is not strong enough for promotion and should return to research tuning.',
      metadata: {
        benchmarkGapPct,
        drawdownBufferPct,
        reasons: [
          scoreBand === 'weak' ? 'risk-adjusted quality is below the promotion floor' : '',
          benchmarkGapPct < 1.5 ? 'excess return is too small to justify promotion' : '',
        ].filter(Boolean),
      },
    };
  }

  if (strategy.status === 'draft' || strategy.status === 'researching') {
    return {
      verdict: 'promote',
      scoreBand,
      readiness: 'candidate',
      recommendedAction: 'promote_to_candidate',
      summary: 'The reviewed result is healthy enough to move the strategy into candidate stage.',
      metadata: {
        benchmarkGapPct,
        drawdownBufferPct,
        reasons: ['promote the strategy into the formal candidate funnel'],
      },
    };
  }

  if (strategy.status === 'candidate') {
    return {
      verdict: 'promote',
      scoreBand,
      readiness: 'paper',
      recommendedAction: 'promote_to_paper',
      summary: 'The reviewed result supports moving the strategy into paper execution preparation.',
      metadata: {
        benchmarkGapPct,
        drawdownBufferPct,
        reasons: ['candidate quality now supports downstream paper routing'],
      },
    };
  }

  const liveCandidate = buildStrategyExecutionCandidate({
    strategyId: strategy.id,
    mode: 'live',
    capital: 50000,
    requestedBy: payload.actor || 'research-evaluation',
  });
  const liveRisk = assessExecutionCandidate(liveCandidate);
  if (liveRisk.riskStatus === 'blocked') {
    return {
      verdict: 'rework',
      scoreBand,
      readiness: 'hold',
      recommendedAction: 'improve_risk_profile',
      summary:
        'The result is healthy, but live execution prep is still blocked by the current risk gate.',
      metadata: {
        benchmarkGapPct,
        drawdownBufferPct,
        reasons: liveRisk.reasons,
        liveRiskStatus: liveRisk.riskStatus,
      },
    };
  }

  return {
    verdict: 'prepare_execution',
    scoreBand,
    readiness: strategy.status === 'paper' ? 'live' : 'paper',
    recommendedAction: strategy.status === 'paper' ? 'prepare_live_execution' : 'prepare_execution',
    summary:
      strategy.status === 'paper'
        ? 'The reviewed result and lifecycle state can now support live execution preparation.'
        : 'The reviewed result is ready for downstream execution preparation.',
    metadata: {
      benchmarkGapPct,
      drawdownBufferPct,
      reasons: liveRisk.reasons,
      liveRiskStatus: liveRisk.riskStatus,
      liveApprovalState: liveRisk.approvalState,
    },
  };
}

function syncEvaluationTask(run, evaluation, actor) {
  return controlPlaneRuntime.upsertResearchTask({
    taskType: 'strategy-evaluation',
    status: evaluation.verdict === 'blocked' ? 'needs_review' : 'completed',
    title: `Evaluation: ${run.strategyName}`,
    summary: evaluation.summary,
    strategyId: run.strategyId,
    strategyName: run.strategyName,
    workflowRunId: run.workflowRunId || '',
    runId: run.id,
    windowLabel: run.windowLabel,
    requestedBy: actor,
    lastActor: actor,
    resultLabel: evaluation.verdict,
    latestCheckpoint: evaluation.recommendedAction,
    priority: evaluation.verdict === 'blocked' ? 'high' : 'normal',
    completedAt: new Date().toISOString(),
    metadata: {
      evaluationId: evaluation.id,
      readiness: evaluation.readiness,
      scoreBand: evaluation.scoreBand,
    },
  });
}

export function listResearchEvaluations(options = {}) {
  const limit = parseLimit(options.limit, 100);
  const since = resolveSince(options.hours);
  const evaluations = controlPlaneRuntime.listResearchEvaluations(limit, {
    runId: options.runId || '',
    resultId: options.resultId || '',
    strategyId: options.strategyId || '',
    verdict: options.verdict || '',
    since,
  });

  return {
    ok: true,
    asOf: evaluations[0]?.createdAt || new Date().toISOString(),
    evaluations,
  };
}

export function getResearchEvaluationSummary(options = {}) {
  const limit = parseLimit(options.limit, 200);
  const since = resolveSince(options.hours);
  const evaluations = controlPlaneRuntime.listResearchEvaluations(limit, {
    strategyId: options.strategyId || '',
    verdict: options.verdict || '',
    since,
  });

  const summary = {
    total: evaluations.length,
    promote: 0,
    prepareExecution: 0,
    rework: 0,
    blocked: 0,
    latestCreatedAt: evaluations[0]?.createdAt || '',
    byStrategy: [],
  };

  const strategyCounts = new Map();
  evaluations.forEach((evaluation) => {
    if (evaluation.verdict === 'promote') summary.promote += 1;
    if (evaluation.verdict === 'prepare_execution') summary.prepareExecution += 1;
    if (evaluation.verdict === 'rework') summary.rework += 1;
    if (evaluation.verdict === 'blocked') summary.blocked += 1;

    const current = strategyCounts.get(evaluation.strategyId) || {
      strategyId: evaluation.strategyId,
      strategyName: evaluation.strategyName,
      count: 0,
      latestVerdict: evaluation.verdict,
    };
    current.count += 1;
    strategyCounts.set(evaluation.strategyId, current);
  });
  summary.byStrategy = [...strategyCounts.values()].sort((left, right) => right.count - left.count);

  return {
    ok: true,
    asOf: summary.latestCreatedAt || new Date().toISOString(),
    summary,
  };
}

export function evaluateBacktestRun(runId, payload = {}) {
  const run = controlPlaneRuntime.getBacktestRun(runId);
  if (!run) {
    return {
      ok: false,
      error: 'backtest run not found',
      message: `Unknown backtest run: ${runId || 'missing runId'}`,
    };
  }
  const result = controlPlaneRuntime.getLatestBacktestResultForRun(run.id);
  if (!result) {
    return {
      ok: false,
      error: 'backtest result not found',
      message: `No versioned result exists for backtest run ${run.id}`,
    };
  }
  const strategy = getStrategyCatalogItem(run.strategyId);
  if (!strategy) {
    return {
      ok: false,
      error: 'strategy not found',
      message: `Unknown strategy: ${run.strategyId || 'missing strategyId'}`,
    };
  }

  const actor = payload.actor || 'research-operator';
  const draft = buildEvaluationForRun(run, result, strategy, { actor });
  const evaluation = controlPlaneRuntime.appendResearchEvaluation({
    runId: run.id,
    resultId: result.id,
    strategyId: run.strategyId,
    strategyName: run.strategyName,
    verdict: draft.verdict,
    scoreBand: draft.scoreBand,
    readiness: draft.readiness,
    recommendedAction: draft.recommendedAction,
    summary: payload.summary || draft.summary,
    actor,
    metadata: {
      resultVersion: result.version,
      resultStage: result.stage,
      strategyStatus: strategy.status,
      windowLabel: run.windowLabel,
      note: payload.note || '',
      ...draft.metadata,
    },
  });

  const task = syncEvaluationTask(run, evaluation, actor);
  const reportWorkflow = queueWorkflow({
    workflowId: 'task-orchestrator.research-report',
    workflowType: 'task-orchestrator',
    actor,
    trigger: 'api',
    payload: {
      evaluationId: evaluation.id,
      runId: run.id,
      resultId: result.id,
      strategyId: strategy.id,
      requestedBy: actor,
    },
    maxAttempts: 2,
  });
  controlPlaneRuntime.upsertResearchTask({
    taskType: 'research-report',
    status: 'queued',
    title: `Report: ${run.strategyName}`,
    summary: `Research report queued after evaluation verdict ${evaluation.verdict}.`,
    strategyId: run.strategyId,
    strategyName: run.strategyName,
    workflowRunId: reportWorkflow.id,
    runId: run.id,
    windowLabel: run.windowLabel,
    requestedBy: actor,
    lastActor: actor,
    resultLabel: 'queued',
    latestCheckpoint: 'Queued for asynchronous report generation.',
    priority: evaluation.verdict === 'blocked' ? 'high' : 'normal',
    metadata: {
      evaluationId: evaluation.id,
      verdict: evaluation.verdict,
      recommendedAction: evaluation.recommendedAction,
    },
  });

  controlPlaneRuntime.appendAuditRecord({
    type: 'research-evaluation.completed',
    actor,
    title: `Research evaluation completed for ${run.strategyName}`,
    detail: evaluation.summary,
    metadata: {
      evaluationId: evaluation.id,
      runId: run.id,
      resultId: result.id,
      strategyId: strategy.id,
      verdict: evaluation.verdict,
      readiness: evaluation.readiness,
      recommendedAction: evaluation.recommendedAction,
    },
  });

  controlPlaneRuntime.enqueueNotification({
    level: evaluation.verdict === 'blocked' ? 'warn' : 'info',
    source: 'research-evaluation',
    title: `Research evaluation ${evaluation.verdict}`,
    message: evaluation.summary,
    metadata: {
      evaluationId: evaluation.id,
      runId: run.id,
      resultId: result.id,
      strategyId: strategy.id,
      taskId: task.id,
    },
  });

  return {
    ok: true,
    evaluation,
    task,
    reportWorkflow,
    run,
    result,
    strategy,
  };
}

export function promoteStrategyFromEvaluation(strategyId, payload = {}) {
  const strategy = getStrategyCatalogItem(strategyId);
  if (!strategy) {
    return {
      ok: false,
      error: 'strategy not found',
      message: `Unknown strategy: ${strategyId || 'missing strategyId'}`,
    };
  }

  const evaluation = payload.evaluationId
    ? controlPlaneRuntime.getResearchEvaluation(payload.evaluationId)
    : controlPlaneRuntime.getLatestEvaluationForStrategy(strategyId);
  if (!evaluation) {
    return {
      ok: false,
      error: 'research evaluation not found',
      message: 'A completed research evaluation is required before promotion.',
    };
  }
  if (evaluation.strategyId !== strategyId) {
    return {
      ok: false,
      error: 'evaluation strategy mismatch',
      message: 'The selected evaluation does not belong to this strategy.',
    };
  }
  if (!['promote', 'prepare_execution'].includes(evaluation.verdict)) {
    return {
      ok: false,
      error: 'promotion blocked',
      message: `Latest evaluation verdict is ${evaluation.verdict} and does not allow promotion.`,
    };
  }

  const nextStatus = payload.nextStatus || getNextStrategyStage(strategy.status);
  if (!nextStatus) {
    return {
      ok: false,
      error: 'no promotion target',
      message: `Strategy ${strategy.id} cannot be promoted from ${strategy.status}.`,
    };
  }

  const promoted = controlPlaneRuntime.upsertStrategyCatalogItem({
    ...strategy,
    status: nextStatus,
    updatedBy: payload.actor || 'operator',
  });

  controlPlaneRuntime.appendAuditRecord({
    type: 'strategy-catalog.promoted',
    actor: payload.actor || 'operator',
    title: `Strategy ${promoted.name} promoted to ${nextStatus}`,
    detail: payload.summary || evaluation.summary,
    metadata: {
      strategyId: promoted.id,
      fromStatus: strategy.status,
      toStatus: nextStatus,
      evaluationId: evaluation.id,
      verdict: evaluation.verdict,
      readiness: evaluation.readiness,
    },
  });

  controlPlaneRuntime.enqueueNotification({
    level: 'info',
    source: 'strategy-promotion',
    title: 'Strategy promoted',
    message: `${promoted.name} moved from ${strategy.status} to ${nextStatus}.`,
    metadata: {
      strategyId: promoted.id,
      fromStatus: strategy.status,
      toStatus: nextStatus,
      evaluationId: evaluation.id,
    },
  });

  refreshBacktestSummary('research-evaluation.promote');

  return {
    ok: true,
    strategy: promoted,
    evaluation,
    detail: getStrategyCatalogDetail(promoted.id),
  };
}
