// @ts-nocheck
import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';
import { createBacktestRun } from '../../backtest/services/runs-service.js';
import { listStrategyCatalog } from '../../strategy/services/catalog-service.js';
import { evaluateBacktestRun, promoteStrategyFromEvaluation } from './evaluation-service.js';

function parseLimit(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveSince(hours) {
  const parsed = Number(hours);
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  return new Date(Date.now() - parsed * 60 * 60 * 1000).toISOString();
}

function classifyCoverage(latestResult, latestEvaluation, latestReport) {
  if (!latestResult) {
    return {
      coverage: 'result_pending',
      note: 'A fresh result version is still required.',
    };
  }
  if (
    !latestEvaluation ||
    new Date(latestEvaluation.createdAt).getTime() <
      new Date(latestResult.updatedAt || latestResult.generatedAt).getTime()
  ) {
    return {
      coverage: 'evaluation_pending',
      note: 'The latest result has not been turned into a formal evaluation yet.',
    };
  }
  if (
    !latestReport ||
    new Date(latestReport.updatedAt || latestReport.createdAt).getTime() <
      new Date(latestEvaluation.createdAt).getTime()
  ) {
    return {
      coverage: 'report_pending',
      note: 'A report asset is still pending for the latest evaluation.',
    };
  }
  return {
    coverage: 'full',
    note: 'Result, evaluation, and report assets are aligned.',
  };
}

function computeLane(latestResult, latestEvaluation, latestReport) {
  const coverage = classifyCoverage(latestResult, latestEvaluation, latestReport);

  if (coverage.coverage === 'result_pending' || coverage.coverage === 'evaluation_pending') {
    return 'await-evaluation';
  }
  if (coverage.coverage === 'report_pending') {
    return 'await-report';
  }
  if (latestEvaluation?.verdict === 'promote') {
    return 'ready-promote';
  }
  if (latestEvaluation?.verdict === 'prepare_execution') {
    return 'ready-execution';
  }
  return 'blocked';
}

function buildLaneHeadline(key, count) {
  if (key === 'ready-promote') return `${count} strategies are ready for lifecycle promotion.`;
  if (key === 'ready-execution') return `${count} strategies can move into execution preparation.`;
  if (key === 'await-report') return `${count} strategies are waiting for report asset generation.`;
  if (key === 'await-evaluation') return `${count} strategies still need a fresh evaluation.`;
  return `${count} strategies remain blocked or in research rework.`;
}

function roundMetric(value) {
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100) / 100;
}

function subtractMetric(current, reference) {
  if (!Number.isFinite(current) || !Number.isFinite(reference)) return null;
  return roundMetric(current - reference);
}

function invertGap(current, reference) {
  if (!Number.isFinite(current) || !Number.isFinite(reference)) return null;
  return roundMetric(reference - current);
}

function resolveComparisonBand(item) {
  if (item.champion) return 'champion';
  if (item.baseline) return 'baseline';

  const baselineReturnGap = item.baselineReturnGapPct;
  const baselineSharpeGap = item.baselineSharpeGap;
  const baselineDrawdownGap = item.baselineDrawdownGapPct;
  const championReturnGap = item.championReturnGapPct;
  const championSharpeGap = item.championSharpeGap;

  if (
    Number.isFinite(baselineReturnGap) &&
    Number.isFinite(baselineSharpeGap) &&
    Number.isFinite(baselineDrawdownGap) &&
    baselineReturnGap >= 0 &&
    baselineSharpeGap >= 0 &&
    baselineDrawdownGap >= -1.5
  ) {
    return 'outperforming_baseline';
  }

  if (
    Number.isFinite(championReturnGap) &&
    Number.isFinite(championSharpeGap) &&
    championReturnGap >= -2.5 &&
    championSharpeGap >= -0.2
  ) {
    return 'challenger';
  }

  if (
    Number.isFinite(baselineReturnGap) &&
    Number.isFinite(baselineSharpeGap) &&
    (baselineReturnGap <= -3 || baselineSharpeGap <= -0.25)
  ) {
    return 'trailing';
  }

  return 'forming';
}

function buildComparisonInsight(item) {
  if (item.comparisonBand === 'champion') {
    return {
      strategyId: item.strategyId,
      strategyName: item.strategyName,
      strategyStatus: item.strategyStatus,
      comparisonBand: item.comparisonBand,
      headline: `${item.strategyName} is the current champion.`,
      detail: 'Use this strategy as the current promotion ceiling and execution-prep reference.',
      baselineReturnGapPct: item.baselineReturnGapPct,
      championReturnGapPct: item.championReturnGapPct,
      baselineSharpeGap: item.baselineSharpeGap,
      championSharpeGap: item.championSharpeGap,
      updatedAt: item.updatedAt,
    };
  }

  if (item.comparisonBand === 'baseline') {
    return {
      strategyId: item.strategyId,
      strategyName: item.strategyName,
      strategyStatus: item.strategyStatus,
      comparisonBand: item.comparisonBand,
      headline: `${item.strategyName} anchors the baseline envelope.`,
      detail:
        'Use this strategy as the minimum acceptable research package for refreshes and challenger review.',
      baselineReturnGapPct: item.baselineReturnGapPct,
      championReturnGapPct: item.championReturnGapPct,
      baselineSharpeGap: item.baselineSharpeGap,
      championSharpeGap: item.championSharpeGap,
      updatedAt: item.updatedAt,
    };
  }

  if (item.comparisonBand === 'outperforming_baseline') {
    return {
      strategyId: item.strategyId,
      strategyName: item.strategyName,
      strategyStatus: item.strategyStatus,
      comparisonBand: item.comparisonBand,
      headline: `${item.strategyName} is outperforming the baseline pack.`,
      detail:
        'Return, Sharpe, and drawdown are all within the current promotion envelope versus the baseline.',
      baselineReturnGapPct: item.baselineReturnGapPct,
      championReturnGapPct: item.championReturnGapPct,
      baselineSharpeGap: item.baselineSharpeGap,
      championSharpeGap: item.championSharpeGap,
      updatedAt: item.updatedAt,
    };
  }

  if (item.comparisonBand === 'challenger') {
    return {
      strategyId: item.strategyId,
      strategyName: item.strategyName,
      strategyStatus: item.strategyStatus,
      comparisonBand: item.comparisonBand,
      headline: `${item.strategyName} is closing in on the champion.`,
      detail:
        'Performance is near the current champion and should stay in the next comparison and promotion review cycle.',
      baselineReturnGapPct: item.baselineReturnGapPct,
      championReturnGapPct: item.championReturnGapPct,
      baselineSharpeGap: item.baselineSharpeGap,
      championSharpeGap: item.championSharpeGap,
      updatedAt: item.updatedAt,
    };
  }

  if (item.comparisonBand === 'trailing') {
    return {
      strategyId: item.strategyId,
      strategyName: item.strategyName,
      strategyStatus: item.strategyStatus,
      comparisonBand: item.comparisonBand,
      headline: `${item.strategyName} is trailing the baseline envelope.`,
      detail:
        'This strategy needs a refresh result, rework, or a narrower evaluation scope before promotion governance.',
      baselineReturnGapPct: item.baselineReturnGapPct,
      championReturnGapPct: item.championReturnGapPct,
      baselineSharpeGap: item.baselineSharpeGap,
      championSharpeGap: item.championSharpeGap,
      updatedAt: item.updatedAt,
    };
  }

  return {
    strategyId: item.strategyId,
    strategyName: item.strategyName,
    strategyStatus: item.strategyStatus,
    comparisonBand: item.comparisonBand,
    headline: `${item.strategyName} is still forming its comparison package.`,
    detail:
      'The latest result set is incomplete or too fresh to classify against the baseline and champion ladder.',
    baselineReturnGapPct: item.baselineReturnGapPct,
    championReturnGapPct: item.championReturnGapPct,
    baselineSharpeGap: item.baselineSharpeGap,
    championSharpeGap: item.championSharpeGap,
    updatedAt: item.updatedAt,
  };
}

export function listResearchGovernanceActions(options = {}) {
  const limit = parseLimit(options.limit, 30);
  const since = resolveSince(options.hours);
  const actions = controlPlaneRuntime
    .listOperatorActions(limit * 3, { since })
    .filter((item) => item.type?.startsWith('research-governance.'))
    .slice(0, limit);

  return {
    ok: true,
    asOf: actions[0]?.createdAt || new Date().toISOString(),
    actions,
  };
}

export function getResearchGovernanceActionSummary(options = {}) {
  const actions = listResearchGovernanceActions({
    hours: options.hours,
    limit: parseLimit(options.limit, 60),
  }).actions;

  const summary = {
    total: actions.length,
    promote: 0,
    refreshBacktests: 0,
    evaluate: 0,
    latestCreatedAt: actions[0]?.createdAt || '',
  };

  actions.forEach((item) => {
    if (item.type === 'research-governance.promote-strategies') summary.promote += 1;
    if (item.type === 'research-governance.queue-backtests') summary.refreshBacktests += 1;
    if (item.type === 'research-governance.evaluate-runs') summary.evaluate += 1;
  });

  return {
    ok: true,
    asOf: summary.latestCreatedAt || new Date().toISOString(),
    summary,
  };
}

function recordGovernanceAction(type, actor, detail, metadata = {}) {
  return controlPlaneRuntime.recordOperatorAction({
    type: `research-governance.${type}`,
    actor,
    title: `Research governance: ${type}`,
    detail,
    symbol: metadata.primaryId || '',
    level: metadata.failures > 0 ? 'warn' : 'info',
    metadata,
  });
}

export function runResearchGovernanceAction(payload = {}) {
  const action = payload.action || '';
  const actor = payload.actor || 'research-operator';
  const strategyIds = Array.isArray(payload.strategyIds) ? payload.strategyIds.filter(Boolean) : [];
  const runIds = Array.isArray(payload.runIds) ? payload.runIds.filter(Boolean) : [];

  if (!action) {
    return {
      ok: false,
      error: 'missing action',
      message: 'A governance action is required.',
    };
  }

  const successes = [];
  const failures = [];

  if (action === 'promote_strategies') {
    strategyIds.forEach((strategyId) => {
      const result = promoteStrategyFromEvaluation(strategyId, {
        actor,
        summary: payload.summary || `Governance workbench promoted ${strategyId}.`,
      });
      if (result.ok) successes.push({ strategyId, status: result.strategy?.status || '' });
      else failures.push({ strategyId, error: result.message || result.error || 'unknown error' });
    });
    const actionRecord = recordGovernanceAction(
      'promote-strategies',
      actor,
      `Promoted ${successes.length} strategies from the governance workbench.`,
      {
        primaryId: strategyIds[0] || '',
        action,
        successes,
        failures,
        successCount: successes.length,
        failuresCount: failures.length,
      }
    );
    return { ok: true, action: actionRecord, successes, failures };
  }

  if (action === 'queue_backtests') {
    strategyIds.forEach((strategyId) => {
      const result = createBacktestRun({
        strategyId,
        windowLabel: payload.windowLabel || '',
        requestedBy: actor,
      });
      if (result.ok)
        successes.push({
          strategyId,
          runId: result.run?.id || '',
          workflowRunId: result.workflow?.id || '',
        });
      else failures.push({ strategyId, error: result.message || result.error || 'unknown error' });
    });
    const actionRecord = recordGovernanceAction(
      'queue-backtests',
      actor,
      `Queued ${successes.length} backtests from the governance workbench.`,
      {
        primaryId: strategyIds[0] || '',
        action,
        windowLabel: payload.windowLabel || '',
        successes,
        failures,
        successCount: successes.length,
        failuresCount: failures.length,
      }
    );
    return { ok: true, action: actionRecord, successes, failures };
  }

  if (action === 'evaluate_runs') {
    runIds.forEach((runId) => {
      const result = evaluateBacktestRun(runId, {
        actor,
        summary: payload.summary || `Governance workbench evaluated ${runId}.`,
      });
      if (result.ok)
        successes.push({
          runId,
          strategyId: result.run?.strategyId || '',
          verdict: result.evaluation?.verdict || '',
        });
      else failures.push({ runId, error: result.message || result.error || 'unknown error' });
    });
    const actionRecord = recordGovernanceAction(
      'evaluate-runs',
      actor,
      `Evaluated ${successes.length} research runs from the governance workbench.`,
      {
        primaryId: runIds[0] || '',
        action,
        successes,
        failures,
        successCount: successes.length,
        failuresCount: failures.length,
      }
    );
    return { ok: true, action: actionRecord, successes, failures };
  }

  if (action === 'set_baseline' || action === 'set_champion') {
    strategyIds.forEach((strategyId) => {
      const strategy = controlPlaneRuntime.getStrategyCatalogItem(strategyId);
      if (!strategy) {
        failures.push({ strategyId, error: 'strategy not found' });
        return;
      }

      if (action === 'set_baseline') {
        controlPlaneRuntime.listStrategyCatalog(200).forEach((item) => {
          if (item.baseline && item.id !== strategyId) {
            controlPlaneRuntime.upsertStrategyCatalogItem({
              ...item,
              baseline: false,
              baselineUpdatedAt: new Date().toISOString(),
            });
          }
        });
      }

      if (action === 'set_champion') {
        controlPlaneRuntime.listStrategyCatalog(200).forEach((item) => {
          if (item.champion && item.id !== strategyId) {
            controlPlaneRuntime.upsertStrategyCatalogItem({
              ...item,
              champion: false,
              championUpdatedAt: new Date().toISOString(),
            });
          }
        });
      }

      const updated = controlPlaneRuntime.upsertStrategyCatalogItem({
        ...strategy,
        baseline: action === 'set_baseline' ? true : strategy.baseline,
        champion: action === 'set_champion' ? true : strategy.champion,
        baselineUpdatedAt:
          action === 'set_baseline' ? new Date().toISOString() : strategy.baselineUpdatedAt,
        championUpdatedAt:
          action === 'set_champion' ? new Date().toISOString() : strategy.championUpdatedAt,
        updatedBy: actor,
      });
      successes.push({
        strategyId,
        baseline: Boolean(updated.baseline),
        champion: Boolean(updated.champion),
      });
    });

    const actionRecord = recordGovernanceAction(
      action === 'set_baseline' ? 'set-baseline' : 'set-champion',
      actor,
      `${action === 'set_baseline' ? 'Updated baseline' : 'Updated champion'} for ${successes.length} strategies from the governance workbench.`,
      {
        primaryId: strategyIds[0] || '',
        action,
        successes,
        failures,
        successCount: successes.length,
        failuresCount: failures.length,
      }
    );
    return { ok: true, action: actionRecord, successes, failures };
  }

  return {
    ok: false,
    error: 'unsupported action',
    message: `Unsupported governance action: ${action}`,
  };
}

export function getResearchWorkbenchSnapshot(options = {}) {
  const limit = parseLimit(options.limit, 20);
  const since = resolveSince(options.hours);
  const strategyPayload = listStrategyCatalog();
  const strategies = (strategyPayload.strategies || []).filter(
    (strategy) => strategy.status !== 'archived'
  );
  const results = controlPlaneRuntime.listBacktestResults(300, { since });
  const evaluations = controlPlaneRuntime.listResearchEvaluations(300, { since });
  const reports = controlPlaneRuntime.listResearchReports(300, { since });
  const reportTasks = controlPlaneRuntime.listResearchTasks(300, {
    taskType: 'research-report',
    since,
  });

  const latestResultByStrategy = new Map();
  results.forEach((result) => {
    if (!latestResultByStrategy.has(result.strategyId))
      latestResultByStrategy.set(result.strategyId, result);
  });

  const latestEvaluationByStrategy = new Map();
  evaluations.forEach((evaluation) => {
    if (!latestEvaluationByStrategy.has(evaluation.strategyId))
      latestEvaluationByStrategy.set(evaluation.strategyId, evaluation);
  });

  const latestReportByStrategy = new Map();
  reports.forEach((report) => {
    if (!latestReportByStrategy.has(report.strategyId))
      latestReportByStrategy.set(report.strategyId, report);
  });

  const reportTaskByStrategy = new Map();
  reportTasks.forEach((task) => {
    if (!reportTaskByStrategy.has(task.strategyId)) reportTaskByStrategy.set(task.strategyId, task);
  });

  const summary = {
    totalStrategies: strategyPayload.strategies?.length || 0,
    activeStrategies: strategies.length,
    candidateStrategies: strategies.filter(
      (item) => item.status === 'candidate' || item.status === 'paper'
    ).length,
    readyToPromote: 0,
    readyForExecution: 0,
    waitingForReport: 0,
    needsEvaluation: 0,
    blocked: 0,
    staleStrategies: 0,
    baselines: 0,
    champions: 0,
  };

  const laneBuckets = new Map([
    ['ready-promote', []],
    ['ready-execution', []],
    ['await-report', []],
    ['await-evaluation', []],
    ['blocked', []],
  ]);
  const queue = [];
  const comparisons = [];
  const coverage = [];
  const staleThreshold = Date.now() - 7 * 24 * 60 * 60 * 1000;

  strategies.forEach((strategy) => {
    const latestResult = latestResultByStrategy.get(strategy.id) || null;
    const latestEvaluation = latestEvaluationByStrategy.get(strategy.id) || null;
    const latestReport = latestReportByStrategy.get(strategy.id) || null;
    const latestReportTask = reportTaskByStrategy.get(strategy.id) || null;
    const currentCoverage = classifyCoverage(latestResult, latestEvaluation, latestReport);
    const laneKey = computeLane(latestResult, latestEvaluation, latestReport);
    const latestTimestamp =
      latestReport?.updatedAt ||
      latestReport?.createdAt ||
      latestEvaluation?.createdAt ||
      latestResult?.updatedAt ||
      latestResult?.generatedAt ||
      strategy.updatedAt ||
      strategy.createdAt;

    laneBuckets.get(laneKey).push(strategy.id);
    if (laneKey === 'ready-promote') summary.readyToPromote += 1;
    if (laneKey === 'ready-execution') summary.readyForExecution += 1;
    if (laneKey === 'await-report') summary.waitingForReport += 1;
    if (laneKey === 'await-evaluation') summary.needsEvaluation += 1;
    if (laneKey === 'blocked') summary.blocked += 1;
    if (new Date(latestTimestamp).getTime() < staleThreshold) summary.staleStrategies += 1;
    if (strategy.baseline) summary.baselines += 1;
    if (strategy.champion) summary.champions += 1;

    queue.push({
      strategyId: strategy.id,
      strategyName: strategy.name,
      strategyStatus: strategy.status,
      latestRunId: latestResult?.runId || latestEvaluation?.runId || latestReport?.runId || '',
      latestRunLabel: latestResult?.windowLabel || '',
      latestResultId: latestResult?.id || '',
      latestResultStage: latestResult?.stage || '--',
      latestResultStatus: latestResult?.status || '--',
      evaluationVerdict: latestEvaluation?.verdict || '--',
      reportVerdict: latestReport?.verdict || '--',
      readiness: latestEvaluation?.readiness || latestReport?.readiness || '--',
      recommendedAction: latestEvaluation?.recommendedAction || currentCoverage.note,
      reportStatus:
        currentCoverage.coverage === 'full'
          ? 'ready'
          : currentCoverage.coverage === 'report_pending'
            ? 'pending'
            : 'missing',
      reportTaskStatus: latestReportTask?.status || '--',
      annualizedReturnPct: latestResult?.annualizedReturnPct ?? null,
      maxDrawdownPct: latestResult?.maxDrawdownPct ?? null,
      sharpe: latestResult?.sharpe ?? null,
      excessReturnPct: latestResult?.excessReturnPct ?? null,
      updatedAt: latestTimestamp,
    });

    comparisons.push({
      strategyId: strategy.id,
      strategyName: strategy.name,
      strategyStatus: strategy.status,
      baseline: Boolean(strategy.baseline),
      champion: Boolean(strategy.champion),
      latestRunId: latestResult?.runId || '',
      latestRunLabel: latestResult?.windowLabel || '',
      resultVersion: latestResult?.version ?? null,
      resultStage: latestResult?.stage || '--',
      resultStatus: latestResult?.status || '--',
      annualizedReturnPct: latestResult?.annualizedReturnPct ?? null,
      maxDrawdownPct: latestResult?.maxDrawdownPct ?? null,
      sharpe: latestResult?.sharpe ?? null,
      excessReturnPct: latestResult?.excessReturnPct ?? null,
      baselineReturnGapPct: null,
      baselineSharpeGap: null,
      baselineDrawdownGapPct: null,
      championReturnGapPct: null,
      championSharpeGap: null,
      championDrawdownGapPct: null,
      comparisonBand: 'forming',
      evaluationVerdict: latestEvaluation?.verdict || '--',
      reportVerdict: latestReport?.verdict || '--',
      promotionReadiness: laneKey,
      recommendedAction: latestEvaluation?.recommendedAction || currentCoverage.note,
      updatedAt: latestTimestamp,
    });

    coverage.push({
      strategyId: strategy.id,
      strategyName: strategy.name,
      strategyStatus: strategy.status,
      baseline: Boolean(strategy.baseline),
      champion: Boolean(strategy.champion),
      coverage: currentCoverage.coverage,
      note: currentCoverage.note,
      latestRunId: latestResult?.runId || latestEvaluation?.runId || latestReport?.runId || '',
      updatedAt: latestTimestamp,
    });
  });

  const lanes = [
    { key: 'ready-promote', label: 'Ready For Promotion' },
    { key: 'ready-execution', label: 'Ready For Execution Prep' },
    { key: 'await-report', label: 'Awaiting Reports' },
    { key: 'await-evaluation', label: 'Awaiting Evaluation' },
    { key: 'blocked', label: 'Blocked Or Rework' },
  ].map((lane) => ({
    ...lane,
    count: laneBuckets.get(lane.key).length,
    headline: buildLaneHeadline(lane.key, laneBuckets.get(lane.key).length),
    strategyIds: laneBuckets.get(lane.key),
  }));
  const recentActions = listResearchGovernanceActions(options).actions;
  const actionSummary = getResearchGovernanceActionSummary(options).summary;
  const baselineEntry = comparisons.find((item) => item.baseline) || null;
  const championEntry = comparisons.find((item) => item.champion) || null;

  const enrichedComparisons = comparisons.map((item) => {
    const baselineReturnGapPct = baselineEntry
      ? subtractMetric(item.annualizedReturnPct, baselineEntry.annualizedReturnPct)
      : null;
    const baselineSharpeGap = baselineEntry
      ? subtractMetric(item.sharpe, baselineEntry.sharpe)
      : null;
    const baselineDrawdownGapPct = baselineEntry
      ? invertGap(item.maxDrawdownPct, baselineEntry.maxDrawdownPct)
      : null;
    const championReturnGapPct = championEntry
      ? subtractMetric(item.annualizedReturnPct, championEntry.annualizedReturnPct)
      : null;
    const championSharpeGap = championEntry
      ? subtractMetric(item.sharpe, championEntry.sharpe)
      : null;
    const championDrawdownGapPct = championEntry
      ? invertGap(item.maxDrawdownPct, championEntry.maxDrawdownPct)
      : null;
    const enriched = {
      ...item,
      baselineReturnGapPct,
      baselineSharpeGap,
      baselineDrawdownGapPct,
      championReturnGapPct,
      championSharpeGap,
      championDrawdownGapPct,
    };
    return {
      ...enriched,
      comparisonBand: resolveComparisonBand(enriched),
    };
  });

  const comparisonSummary = {
    baselineStrategyId: baselineEntry?.strategyId || '',
    baselineStrategyName: baselineEntry?.strategyName || '',
    championStrategyId: championEntry?.strategyId || '',
    championStrategyName: championEntry?.strategyName || '',
    baselineUpdatedAt: baselineEntry?.updatedAt || '',
    championUpdatedAt: championEntry?.updatedAt || '',
    comparedStrategies: enrichedComparisons.filter((item) => item.resultVersion !== null).length,
    outperformingBaseline: enrichedComparisons.filter(
      (item) => item.comparisonBand === 'outperforming_baseline'
    ).length,
    nearChampion: enrichedComparisons.filter((item) => item.comparisonBand === 'challenger').length,
    trailingBaseline: enrichedComparisons.filter((item) => item.comparisonBand === 'trailing')
      .length,
  };

  const comparisonInsights = enrichedComparisons
    .map((item) => buildComparisonInsight(item))
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, limit);

  return {
    ok: true,
    asOf: queue[0]?.updatedAt || new Date().toISOString(),
    summary,
    comparisonSummary,
    lanes,
    actionSummary,
    recentActions,
    promotionQueue: queue
      .sort(
        (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      )
      .slice(0, limit),
    comparisons: enrichedComparisons
      .sort(
        (left, right) =>
          Number(right.champion) - Number(left.champion) ||
          Number(right.baseline) - Number(left.baseline) ||
          (right.excessReturnPct ?? -999) - (left.excessReturnPct ?? -999) ||
          (right.sharpe ?? -999) - (left.sharpe ?? -999)
      )
      .slice(0, limit),
    comparisonInsights,
    coverage: coverage
      .sort(
        (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      )
      .slice(0, limit),
  };
}
