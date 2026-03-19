import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';
import { queueWorkflow } from '../../../control-plane/task-orchestrator/services/workflow-service.mjs';
import { getStrategyCatalogItem } from '../../strategy/services/catalog-service.mjs';
import { refreshBacktestSummary } from './summary-service.mjs';

function buildBacktestResultFromRun(run, patch = {}) {
  if (!run || !run.completedAt) return null;
  return controlPlaneRuntime.appendBacktestResult({
    runId: run.id,
    workflowRunId: run.workflowRunId || '',
    strategyId: run.strategyId,
    strategyName: run.strategyName,
    windowLabel: run.windowLabel,
    status: patch.status || run.status,
    stage: patch.stage || 'generated',
    generatedAt: patch.generatedAt || run.completedAt || new Date().toISOString(),
    summary: patch.summary || run.summary,
    annualizedReturnPct: run.annualizedReturnPct,
    maxDrawdownPct: run.maxDrawdownPct,
    sharpe: run.sharpe,
    winRatePct: run.winRatePct,
    turnoverPct: run.turnoverPct,
    benchmarkReturnPct: Number(patch.benchmarkReturnPct ?? Math.max(run.annualizedReturnPct - 4.5, 0).toFixed(1)),
    excessReturnPct: Number(patch.excessReturnPct ?? 0),
    reviewVerdict: patch.reviewVerdict || '',
    metadata: {
      reviewedAt: run.reviewedAt || '',
      reviewedBy: run.reviewedBy || '',
      dataSource: run.dataSource || '',
      ...patch.metadata,
    },
  });
}

function defaultWindowLabel() {
  return '2024-01-01 -> 2026-03-01';
}

function syncResearchTaskFromRun(run, patch = {}) {
  if (!run) return null;
  return controlPlaneRuntime.upsertResearchTask({
    taskType: 'backtest-run',
    title: `Backtest: ${run.strategyName}`,
    status: patch.status || run.status,
    strategyId: run.strategyId,
    strategyName: run.strategyName,
    workflowRunId: run.workflowRunId || '',
    runId: run.id,
    windowLabel: run.windowLabel,
    requestedBy: run.requestedBy || 'operator',
    lastActor: patch.lastActor || run.reviewedBy || run.requestedBy || 'operator',
    resultLabel: patch.resultLabel || run.status,
    latestCheckpoint: patch.latestCheckpoint || run.summary,
    startedAt: patch.startedAt || run.startedAt || '',
    completedAt: patch.completedAt ?? run.completedAt ?? '',
    summary: patch.summary || run.summary,
    metadata: {
      annualizedReturnPct: run.annualizedReturnPct,
      maxDrawdownPct: run.maxDrawdownPct,
      sharpe: run.sharpe,
      winRatePct: run.winRatePct,
      turnoverPct: run.turnoverPct,
      reviewedAt: run.reviewedAt || '',
      reviewedBy: run.reviewedBy || '',
      dataSource: run.dataSource || '',
      ...patch.metadata,
    },
  });
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

export function getBacktestRunDetail(runId) {
  const run = controlPlaneRuntime.getBacktestRun(runId);
  if (!run) {
    return {
      ok: false,
      error: 'backtest run not found',
      message: `Unknown backtest run: ${runId || 'missing runId'}`,
    };
  }

  const strategy = run.strategyId ? getStrategyCatalogItem(run.strategyId) : null;
  const workflow = run.workflowRunId ? controlPlaneRuntime.getWorkflowRun(run.workflowRunId) : null;
  const results = controlPlaneRuntime.listBacktestResultsForRun(run.id, 20);

  return {
    ok: true,
    run,
    strategy,
    workflow,
    researchTask: controlPlaneRuntime.findResearchTaskByRunId(run.id) || null,
    latestResult: results[0] || null,
    results,
  };
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
  const researchTask = syncResearchTaskFromRun(run, {
    status: 'queued',
    latestCheckpoint: `${strategy.name} was admitted into the research task backbone.`,
    metadata: {
      workflowId: workflow.workflowId,
    },
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
    researchTask,
    latestResult: null,
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
  let latestResult = controlPlaneRuntime.getLatestBacktestResultForRun(updated.id);
  if (!latestResult && updated.completedAt) {
    latestResult = buildBacktestResultFromRun(updated, {
      stage: 'generated',
      excessReturnPct: Number((updated.annualizedReturnPct - Math.max(updated.annualizedReturnPct - 4.5, 0)).toFixed(1)),
      metadata: {
        source: 'backtest-runs.update',
      },
    });
  }
  syncResearchTaskFromRun(updated, {
    status: updated.status,
    latestCheckpoint: updated.summary,
  });
  return {
    ok: true,
    run: updated,
    latestResult: latestResult || null,
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
  const benchmarkReturnPct = Math.max(reviewed.annualizedReturnPct - 4.5, 0);
  const latestResult = buildBacktestResultFromRun(reviewed, {
    stage: 'reviewed',
    summary: payload.summary || reviewed.summary,
    reviewVerdict: reviewed.status === 'completed' ? 'approved' : 'rejected',
    benchmarkReturnPct,
    excessReturnPct: Number((reviewed.annualizedReturnPct - benchmarkReturnPct).toFixed(1)),
    metadata: {
      source: 'backtest-runs.review',
      reviewAction: 'manual-review',
    },
  });
  const researchTask = syncResearchTaskFromRun(reviewed, {
    status: reviewed.status,
    lastActor: payload.reviewedBy || 'operator',
    completedAt: reviewed.completedAt || '',
    latestCheckpoint: payload.summary || reviewed.summary,
    metadata: {
      reviewAction: 'manual-review',
    },
  });

  return {
    ok: true,
    run: reviewed,
    researchTask,
    latestResult: latestResult || null,
  };
}
