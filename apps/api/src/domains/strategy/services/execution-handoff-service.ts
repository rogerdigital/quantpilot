import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';
import { buildStrategyExecutionCandidate } from './execution-candidate-service.js';
import { assessExecutionCandidate } from '../../risk/services/assessment-service.js';
import { getStrategyCatalogDetail } from './catalog-service.js';
import { queueWorkflow } from '../../../control-plane/task-orchestrator/services/workflow-service.js';

function parseLimit(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveSince(hours) {
  const parsed = Number(hours);
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  return new Date(Date.now() - parsed * 60 * 60 * 1000).toISOString();
}

function resolveHandoffStatus(detail, riskDecision) {
  if (!detail.latestEvaluation || !detail.latestResult) return 'blocked';
  if (!['promote', 'prepare_execution'].includes(detail.latestEvaluation.verdict)) return 'blocked';
  if (riskDecision.riskStatus === 'blocked') return 'blocked';
  return 'ready';
}

function buildHandoffRecord(detail, payload = {}) {
  const candidate = buildStrategyExecutionCandidate({
    strategyId: detail.strategy.id,
    mode: payload.mode || 'paper',
    capital: Number(payload.capital || 50000),
    requestedBy: payload.actor || 'research-operator',
  });
  const riskDecision = assessExecutionCandidate(candidate);
  return {
    strategyId: detail.strategy.id,
    strategyName: detail.strategy.name,
    strategyStatus: detail.strategy.status,
    runId: detail.latestRun?.id || '',
    resultId: detail.latestResult?.id || '',
    evaluationId: detail.latestEvaluation?.id || '',
    reportId: detail.latestReport?.id || '',
    mode: candidate.mode,
    capital: candidate.capital,
    orderCount: candidate.orders.length,
    baseline: Boolean(detail.strategy.baseline),
    champion: Boolean(detail.strategy.champion),
    readiness: detail.latestEvaluation?.readiness || 'hold',
    verdict: detail.latestEvaluation?.verdict || '',
    riskStatus: riskDecision.riskStatus,
    approvalState: riskDecision.approvalState,
    handoffStatus: resolveHandoffStatus(detail, riskDecision),
    owner: payload.owner || '',
    summary: payload.summary || riskDecision.summary || candidate.summary,
    reasons: [
      ...(detail.promotionReadiness?.reasons || []),
      ...(riskDecision.reasons || []),
      ...(detail.executionCandidatePreview?.reasons || []),
    ].filter(Boolean),
    orders: candidate.orders,
    metadata: {
      requestedBy: payload.actor || 'research-operator',
      latestReportTitle: detail.latestReport?.title || '',
      latestReportVerdict: detail.latestReport?.verdict || '',
    },
  };
}

function recordHandoffAction(type, handoff, actor, detail, metadata = {}) {
  return controlPlaneRuntime.recordOperatorAction({
    type: `execution-handoff.${type}`,
    actor,
    title: `Execution handoff: ${type}`,
    detail,
    symbol: handoff.strategyId || handoff.id,
    level: handoff.handoffStatus === 'blocked' ? 'warn' : 'info',
    metadata: {
      handoffId: handoff.id,
      strategyId: handoff.strategyId,
      mode: handoff.mode,
      handoffStatus: handoff.handoffStatus,
      ...metadata,
    },
  });
}

export function createExecutionCandidateHandoff(strategyId, payload = {}) {
  const detail = getStrategyCatalogDetail(strategyId);
  if (!detail.ok) return detail;

  const handoff = controlPlaneRuntime.appendExecutionCandidateHandoff(buildHandoffRecord(detail, payload));
  const action = recordHandoffAction(
    'created',
    handoff,
    payload.actor || 'research-operator',
    `Created execution handoff for ${handoff.strategyName}.`,
  );

  return {
    ok: true,
    handoff,
    action,
  };
}

export function queueExecutionCandidateHandoff(handoffId, payload = {}) {
  const handoff = controlPlaneRuntime.getExecutionCandidateHandoff(handoffId);
  if (!handoff) {
    return {
      ok: false,
      error: 'handoff not found',
      message: `Unknown execution handoff: ${handoffId}`,
    };
  }

  const workflow = queueWorkflow({
    workflowId: 'task-orchestrator.strategy-execution',
    workflowType: 'task-orchestrator',
    actor: payload.actor || 'execution-desk',
    trigger: 'api',
    payload: {
      strategyId: handoff.strategyId,
      mode: handoff.mode,
      capital: handoff.capital,
      requestedBy: payload.actor || 'execution-desk',
      handoffId: handoff.id,
    },
    maxAttempts: Number(payload.maxAttempts || 3),
  });

  const updated = controlPlaneRuntime.updateExecutionCandidateHandoff(handoffId, {
    handoffStatus: 'queued',
    owner: payload.owner || handoff.owner,
    metadata: {
      workflowRunId: workflow.id,
    },
  });

  const action = recordHandoffAction(
    'queued',
    updated,
    payload.actor || 'execution-desk',
    `Queued execution workflow for ${updated.strategyName} from research handoff.`,
    {
      workflowRunId: workflow.id,
    },
  );

  return {
    ok: true,
    handoff: updated,
    workflow,
    action,
  };
}

export function listExecutionCandidateHandoffs(options = {}) {
  const limit = parseLimit(options.limit, 30);
  const since = resolveSince(options.hours);
  const handoffs = controlPlaneRuntime.listExecutionCandidateHandoffs(limit, {
    since,
    handoffStatus: options.handoffStatus || '',
    mode: options.mode || '',
  });
  const summary = handoffs.reduce((acc, item) => {
    acc.total += 1;
    if (item.handoffStatus === 'ready') acc.ready += 1;
    if (item.handoffStatus === 'queued' || item.handoffStatus === 'converted') acc.queued += 1;
    if (item.handoffStatus === 'blocked') acc.blocked += 1;
    if (item.mode === 'paper') acc.paper += 1;
    if (item.mode === 'live') acc.live += 1;
    return acc;
  }, {
    total: 0,
    ready: 0,
    queued: 0,
    blocked: 0,
    paper: 0,
    live: 0,
  });

  return {
    ok: true,
    asOf: handoffs[0]?.updatedAt || new Date().toISOString(),
    summary,
    handoffs,
  };
}
