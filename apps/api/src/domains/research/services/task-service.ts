// @ts-nocheck
import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';
import {
  getBacktestResultSummary,
  listBacktestResults,
} from '../../backtest/services/results-service.js';
import { listBacktestRuns } from '../../backtest/services/runs-service.js';
import { getBacktestSummary } from '../../backtest/services/summary-service.js';
import { listStrategyCatalog } from '../../strategy/services/catalog-service.js';
import { listExecutionCandidateHandoffs } from '../../strategy/services/execution-handoff-service.js';
import { getResearchEvaluationSummary, listResearchEvaluations } from './evaluation-service.js';
import { getResearchReportSummary, listResearchReports } from './report-service.js';
import {
  getResearchGovernanceActionSummary,
  getResearchWorkbenchSnapshot,
  listResearchGovernanceActions,
} from './workbench-service.js';

function parseLimit(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveSince(hours) {
  const parsed = Number(hours);
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  return new Date(Date.now() - parsed * 60 * 60 * 1000).toISOString();
}

export function listResearchTasks(options = {}) {
  const limit = parseLimit(options.limit, 100);
  const since = resolveSince(options.hours);
  const tasks = controlPlaneRuntime.listResearchTasks(limit, {
    taskType: options.taskType || '',
    status: options.status || '',
    strategyId: options.strategyId || '',
    workflowRunId: options.workflowRunId || '',
    runId: options.runId || '',
    since,
  });
  return {
    ok: true,
    asOf: tasks[0]?.updatedAt || new Date().toISOString(),
    tasks,
  };
}

export function getResearchTaskDetail(taskId) {
  const task = controlPlaneRuntime.getResearchTask(taskId);
  if (!task) {
    return {
      ok: false,
      error: 'research task not found',
      message: `Unknown research task: ${taskId || 'missing taskId'}`,
    };
  }

  const run = task.runId ? controlPlaneRuntime.getBacktestRun(task.runId) : null;
  const workflow = task.workflowRunId
    ? controlPlaneRuntime.getWorkflowRun(task.workflowRunId)
    : null;
  const strategy = task.strategyId
    ? controlPlaneRuntime.getStrategyCatalogItem(task.strategyId)
    : null;

  return {
    ok: true,
    task,
    run,
    workflow,
    strategy,
  };
}

export function getResearchTaskSummary(options = {}) {
  const limit = parseLimit(options.limit, 200);
  const since = resolveSince(options.hours);
  const tasks = controlPlaneRuntime.listResearchTasks(limit, {
    taskType: options.taskType || '',
    strategyId: options.strategyId || '',
    since,
  });

  const summary = {
    total: tasks.length,
    queued: 0,
    running: 0,
    needsReview: 0,
    completed: 0,
    failed: 0,
    byType: [],
    byStrategy: [],
    active: 0,
  };

  const typeCounts = new Map();
  const strategyCounts = new Map();

  tasks.forEach((task) => {
    if (task.status === 'queued') summary.queued += 1;
    if (task.status === 'running') summary.running += 1;
    if (task.status === 'needs_review') summary.needsReview += 1;
    if (task.status === 'completed') summary.completed += 1;
    if (task.status === 'failed') summary.failed += 1;
    if (['queued', 'running', 'needs_review'].includes(task.status)) summary.active += 1;

    typeCounts.set(task.taskType, (typeCounts.get(task.taskType) || 0) + 1);
    const strategyKey = task.strategyId || 'unassigned';
    strategyCounts.set(strategyKey, {
      strategyId: task.strategyId || '',
      strategyName: task.strategyName || 'Unknown Strategy',
      count: (strategyCounts.get(strategyKey)?.count || 0) + 1,
      activeCount:
        (strategyCounts.get(strategyKey)?.activeCount || 0) +
        (['queued', 'running', 'needs_review'].includes(task.status) ? 1 : 0),
    });
  });

  summary.byType = [...typeCounts.entries()].map(([taskType, count]) => ({ taskType, count }));
  summary.byStrategy = [...strategyCounts.values()].sort(
    (left, right) => right.activeCount - left.activeCount || right.count - left.count
  );

  return {
    ok: true,
    asOf: tasks[0]?.updatedAt || new Date().toISOString(),
    summary,
  };
}

export function getResearchHubSnapshot(options = {}) {
  const tasks = listResearchTasks(options);
  const taskSummary = getResearchTaskSummary(options);
  const results = listBacktestResults(options);
  const resultSummary = getBacktestResultSummary(options);
  const evaluations = listResearchEvaluations(options);
  const evaluationSummary = getResearchEvaluationSummary(options);
  const reports = listResearchReports(options);
  const reportSummary = getResearchReportSummary(options);
  const workbench = getResearchWorkbenchSnapshot(options);
  const governance = listResearchGovernanceActions(options);
  const governanceSummary = getResearchGovernanceActionSummary(options);
  const handoffs = listExecutionCandidateHandoffs(options);
  const summary = getBacktestSummary();
  const strategies = listStrategyCatalog();
  const runs = listBacktestRuns();

  return {
    ok: true,
    asOf: summary.asOf,
    summary,
    taskSummary: taskSummary.summary,
    resultSummary: resultSummary.summary,
    evaluationSummary: evaluationSummary.summary,
    reportSummary: reportSummary.summary,
    workbench,
    governanceSummary: governanceSummary.summary,
    handoffSummary: handoffs.summary,
    strategies: strategies.strategies,
    runs: runs.runs,
    tasks: tasks.tasks,
    results: results.results,
    evaluations: evaluations.evaluations,
    reports: reports.reports,
    governanceActions: governance.actions,
    handoffs: handoffs.handoffs,
  };
}
