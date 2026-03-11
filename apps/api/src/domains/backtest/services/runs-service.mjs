import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';
import { queueWorkflow } from '../../../control-plane/task-orchestrator/services/workflow-service.mjs';
import { getStrategyCatalogItem } from '../../strategy/services/catalog-service.mjs';
import { refreshBacktestSummary } from './summary-service.mjs';

function defaultWindowLabel() {
  return '2024-01-01 -> 2026-03-01';
}

export function listBacktestRuns() {
  const runs = controlPlaneRuntime.listBacktestRuns();
  return {
    ok: true,
    asOf: runs[0]?.updatedAt || new Date().toISOString(),
    runs,
  };
}

export function getBacktestRunItem(runId) {
  return controlPlaneRuntime.getBacktestRun(runId);
}

export function createBacktestRun(payload = {}) {
  const strategy = getStrategyCatalogItem(payload.strategyId);
  if (!strategy) {
    return {
      ok: false,
      error: 'unknown strategy',
      message: `Unknown strategy: ${payload.strategyId || 'missing strategyId'}`,
    };
  }

  const workflow = queueWorkflow({
    workflowId: 'task-orchestrator.backtest-run',
    workflowType: 'task-orchestrator',
    actor: payload.requestedBy || 'operator',
    trigger: 'api',
    payload: {
      strategyId: strategy.id,
      windowLabel: payload.windowLabel || defaultWindowLabel(),
      requestedBy: payload.requestedBy || 'operator',
    },
    maxAttempts: Number(payload.maxAttempts || 2),
  });

  const run = controlPlaneRuntime.appendBacktestRun({
    workflowRunId: workflow.id,
    strategyId: strategy.id,
    strategyName: strategy.name,
    status: 'queued',
    windowLabel: payload.windowLabel || defaultWindowLabel(),
    requestedBy: payload.requestedBy || 'operator',
    summary: `${strategy.name} was queued for research execution.`,
  });

  controlPlaneRuntime.appendAuditRecord({
    type: 'backtest-run.created',
    actor: payload.requestedBy || 'operator',
    title: `Backtest queued for ${strategy.name}`,
    detail: `Research workflow ${workflow.id} was queued for ${strategy.id}.`,
    metadata: {
      runId: run.id,
      workflowRunId: workflow.id,
      strategyId: strategy.id,
    },
  });

  controlPlaneRuntime.enqueueNotification({
    level: 'info',
    source: 'research-control',
    title: 'Backtest queued',
    message: `${strategy.name} was added to the backtest queue.`,
    metadata: {
      runId: run.id,
      workflowRunId: workflow.id,
      strategyId: strategy.id,
    },
  });

  refreshBacktestSummary();

  return {
    ok: true,
    run,
    workflow,
  };
}

export function updateBacktestRun(runId, patch = {}) {
  const updated = controlPlaneRuntime.updateBacktestRun(runId, patch);
  if (!updated) {
    return {
      ok: false,
      error: 'backtest run not found',
    };
  }
  refreshBacktestSummary();
  return {
    ok: true,
    run: updated,
  };
}

export function reviewBacktestRun(runId, payload = {}) {
  const current = controlPlaneRuntime.getBacktestRun(runId);
  if (!current) {
    return {
      ok: false,
      error: 'backtest run not found',
    };
  }

  const nextStatus = current.status === 'failed' ? 'failed' : 'completed';
  const reviewed = controlPlaneRuntime.updateBacktestRun(runId, {
    status: nextStatus,
    reviewedAt: new Date().toISOString(),
    reviewedBy: payload.reviewedBy || 'operator',
    summary: payload.summary || current.summary,
    completedAt: current.completedAt || new Date().toISOString(),
  });

  controlPlaneRuntime.appendAuditRecord({
    type: 'backtest-run.reviewed',
    actor: payload.reviewedBy || 'operator',
    title: `Backtest run ${reviewed.id} reviewed`,
    detail: payload.summary || reviewed.summary,
    metadata: {
      runId: reviewed.id,
      status: reviewed.status,
      strategyId: reviewed.strategyId,
      windowLabel: reviewed.windowLabel,
      annualizedReturnPct: reviewed.annualizedReturnPct,
      maxDrawdownPct: reviewed.maxDrawdownPct,
      sharpe: reviewed.sharpe,
      winRatePct: reviewed.winRatePct,
      turnoverPct: reviewed.turnoverPct,
    },
  });

  refreshBacktestSummary();

  return {
    ok: true,
    run: reviewed,
  };
}
