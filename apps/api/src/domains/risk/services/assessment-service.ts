import { listBacktestRuns } from '../../backtest/services/runs-service.js';
import { listExecutionPlans } from '../../execution/services/query-service.js';
import { getStrategyCatalogItem } from '../../strategy/services/catalog-service.js';
import { listRiskEvents } from './feed-service.js';

export function assessExecutionCandidate(candidate) {
  const needsReview = candidate.mode === 'live'
    && (candidate.status !== 'paper' && candidate.status !== 'live');
  const blockedByDrawdown = candidate.metrics.maxDrawdownPct > 12;
  const blockedBySharpe = candidate.metrics.sharpe < 0.9;

  if (blockedByDrawdown || blockedBySharpe) {
    return {
      riskStatus: 'blocked',
      approvalState: 'required',
      summary: 'Risk rejected the execution candidate because risk-adjusted quality is below the current floor.',
      reasons: [
        blockedByDrawdown ? `max drawdown ${candidate.metrics.maxDrawdownPct}% exceeds 12%` : '',
        blockedBySharpe ? `sharpe ${candidate.metrics.sharpe} is below 0.9` : '',
      ].filter(Boolean),
    };
  }

  if (needsReview) {
    return {
      riskStatus: 'review',
      approvalState: 'required',
      summary: 'Risk requires manual review before this strategy can route toward live execution.',
      reasons: [`strategy status ${candidate.status} is not yet promoted to paper/live`],
    };
  }

  return {
    riskStatus: 'approved',
    approvalState: candidate.mode === 'live' ? 'required' : 'not_required',
    summary: candidate.mode === 'live'
      ? 'Risk approved the strategy candidate and marked it ready for live approval.'
      : 'Risk approved the strategy candidate for paper execution.',
    reasons: [],
  };
}

export function assessAgentActionRequestRisk(payload = {}) {
  if (payload.requestType === 'prepare_execution_plan') {
    const strategy = getStrategyCatalogItem(payload.targetId);
    if (!strategy) {
      return {
        riskStatus: 'blocked',
        approvalState: 'rejected',
        status: 'rejected',
        summary: 'Risk blocked the request because the target strategy does not exist.',
        reasons: ['unknown strategy target'],
      };
    }
    if (strategy.status === 'archived') {
      return {
        riskStatus: 'blocked',
        approvalState: 'rejected',
        status: 'rejected',
        summary: 'Risk blocked the request because the target strategy is archived.',
        reasons: ['archived strategy cannot be routed into execution planning'],
      };
    }
    if (strategy.maxDrawdownPct > 12 || strategy.sharpe < 0.9) {
      return {
        riskStatus: 'blocked',
        approvalState: 'rejected',
        status: 'rejected',
        summary: 'Risk blocked the request because the target strategy is below the current quality floor.',
        reasons: ['strategy risk metrics are below threshold'],
      };
    }
    return {
      riskStatus: strategy.status === 'paper' || strategy.status === 'live' ? 'approved' : 'review',
      approvalState: 'required',
      status: 'pending_review',
      summary: 'Risk accepted the request, but operator approval is required before execution planning can proceed.',
      reasons: [],
    };
  }

  if (payload.requestType === 'review_backtest') {
    const run = listBacktestRuns().runs.find((item) => item.id === payload.targetId);
    if (!run) {
      return {
        riskStatus: 'blocked',
        approvalState: 'rejected',
        status: 'rejected',
        summary: 'Risk blocked the request because the target backtest run does not exist.',
        reasons: ['unknown backtest run target'],
      };
    }
    return {
      riskStatus: run.status === 'needs_review' ? 'review' : 'approved',
      approvalState: 'required',
      status: 'pending_review',
      summary: 'Risk accepted the backtest review request and routed it to operator approval.',
      reasons: [],
    };
  }

  if (payload.requestType === 'explain_risk') {
    const hasTarget = listExecutionPlans(20).some((item) => item.id === payload.targetId)
      || listRiskEvents(20).some((item) => item.id === payload.targetId);
    if (!hasTarget) {
      return {
        riskStatus: 'blocked',
        approvalState: 'rejected',
        status: 'rejected',
        summary: 'Risk blocked the explanation request because the target record does not exist.',
        reasons: ['unknown risk/execution target'],
      };
    }
    return {
      riskStatus: 'approved',
      approvalState: 'required',
      status: 'pending_review',
      summary: 'Risk accepted the explanation request and requires operator approval before Agent follow-up.',
      reasons: [],
    };
  }

  return {
    riskStatus: 'blocked',
    approvalState: 'rejected',
    status: 'rejected',
    summary: 'Risk blocked the request because the request type is unsupported.',
    reasons: ['unsupported request type'],
  };
}
