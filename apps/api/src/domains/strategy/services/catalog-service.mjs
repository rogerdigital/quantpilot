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
