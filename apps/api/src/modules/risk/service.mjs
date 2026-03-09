import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.mjs';

export function listRiskEvents(limit = 50) {
  return controlPlaneRuntime.listRiskEvents(limit);
}

export function queueRiskScan(payload) {
  return controlPlaneRuntime.enqueueRiskScan(payload);
}

export function listQueuedRiskScans(limit = 50) {
  return controlPlaneRuntime.listRiskScanJobs(limit);
}

export function flushQueuedRiskScans(options = {}) {
  return controlPlaneRuntime.dispatchPendingRiskScans(options);
}

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
