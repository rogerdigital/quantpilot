// @ts-nocheck
import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';

function parseLimit(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveSince(hours) {
  const parsed = Number(hours);
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  return new Date(Date.now() - parsed * 60 * 60 * 1000).toISOString();
}

export function listResearchReports(options = {}) {
  const limit = parseLimit(options.limit, 100);
  const since = resolveSince(options.hours);
  const reports = controlPlaneRuntime.listResearchReports(limit, {
    evaluationId: options.evaluationId || '',
    workflowRunId: options.workflowRunId || '',
    runId: options.runId || '',
    resultId: options.resultId || '',
    strategyId: options.strategyId || '',
    verdict: options.verdict || '',
    since,
  });

  return {
    ok: true,
    asOf: reports[0]?.createdAt || new Date().toISOString(),
    reports,
  };
}

export function getResearchReportSummary(options = {}) {
  const limit = parseLimit(options.limit, 200);
  const since = resolveSince(options.hours);
  const reports = controlPlaneRuntime.listResearchReports(limit, {
    strategyId: options.strategyId || '',
    verdict: options.verdict || '',
    since,
  });

  const summary = {
    total: reports.length,
    promote: 0,
    prepareExecution: 0,
    rework: 0,
    blocked: 0,
    latestCreatedAt: reports[0]?.createdAt || '',
    byStrategy: [],
  };

  const strategyCounts = new Map();
  reports.forEach((report) => {
    if (report.verdict === 'promote') summary.promote += 1;
    if (report.verdict === 'prepare_execution') summary.prepareExecution += 1;
    if (report.verdict === 'rework') summary.rework += 1;
    if (report.verdict === 'blocked') summary.blocked += 1;

    const current = strategyCounts.get(report.strategyId) || {
      strategyId: report.strategyId,
      strategyName: report.strategyName,
      count: 0,
      latestVerdict: report.verdict,
    };
    current.count += 1;
    strategyCounts.set(report.strategyId, current);
  });
  summary.byStrategy = [...strategyCounts.values()].sort((left, right) => right.count - left.count);

  return {
    ok: true,
    asOf: summary.latestCreatedAt || new Date().toISOString(),
    summary,
  };
}
