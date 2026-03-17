import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';

function parseLimit(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveSince(hours) {
  const parsed = Number(hours);
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  return new Date(Date.now() - parsed * 60 * 60 * 1000).toISOString();
}

function parseTimestamp(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortByRecency(items) {
  return items.slice().sort((left, right) => parseTimestamp(right.updatedAt || right.createdAt) - parseTimestamp(left.updatedAt || left.createdAt));
}

function takeLatest(items, limit) {
  return sortByRecency(items).slice(0, limit);
}

function getLiveExposure(snapshot) {
  const equity = Number(snapshot?.account?.equity || 0);
  const marketValue = Array.isArray(snapshot?.positions)
    ? snapshot.positions.reduce((sum, item) => sum + Number(item.marketValue || 0), 0)
    : 0;
  return {
    equity,
    marketValue,
    exposurePct: equity > 0 ? (marketValue / equity) * 100 : 0,
  };
}

function resolvePosture(input) {
  if (input.blockedExecutions > 0 || input.riskOffEvents > 0 || input.criticalIncidents > 0) {
    return {
      status: 'critical',
      title: 'Risk posture needs intervention',
      detail: 'Blocked execution candidates, unresolved risk-off events, or critical risk incidents still need operator action.',
    };
  }

  if (input.approvalRequired > 0 || input.reviewBacktests > 0 || input.openRiskEvents > 0 || input.openRiskIncidents > 0) {
    return {
      status: 'warn',
      title: 'Risk posture requires review',
      detail: 'Approval-required executions, review queues, or unresolved risk events remain in the operator path.',
    };
  }

  return {
    status: 'healthy',
    title: 'Risk posture is stable',
    detail: 'Risk scans, review queues, and live-side exposure are currently inside the active platform guardrails.',
  };
}

export function getRiskWorkbench(options = {}) {
  const limit = parseLimit(options.limit, 80);
  const since = resolveSince(options.hours);
  const riskEvents = controlPlaneRuntime.listRiskEvents(200)
    .filter((item) => !since || parseTimestamp(item.createdAt) >= parseTimestamp(since));
  const executionPlans = controlPlaneRuntime.listExecutionPlans(120);
  const backtestRuns = controlPlaneRuntime.listBacktestRuns(120);
  const incidents = controlPlaneRuntime.listIncidents(120, { since });
  const brokerSnapshot = controlPlaneRuntime.listBrokerAccountSnapshots(1)[0] || null;

  const unresolvedRiskEvents = riskEvents.filter((item) => item.status !== 'healthy');
  const riskOffEvents = riskEvents.filter((item) => item.status === 'risk-off');
  const approvalRequiredPlans = executionPlans.filter((item) => item.approvalState === 'required' || item.riskStatus === 'review');
  const blockedExecutionPlans = executionPlans.filter((item) => item.riskStatus === 'blocked' || item.status === 'blocked');
  const reviewBacktests = backtestRuns.filter((item) => item.status === 'needs_review');
  const riskIncidents = incidents.filter((item) => item.status !== 'resolved')
    .filter((item) => item.source === 'risk' || item.metadata?.riskEventId);
  const criticalIncidents = riskIncidents.filter((item) => item.severity === 'critical');
  const exposure = getLiveExposure(brokerSnapshot);
  const posture = resolvePosture({
    openRiskEvents: unresolvedRiskEvents.length,
    riskOffEvents: riskOffEvents.length,
    approvalRequired: approvalRequiredPlans.length,
    blockedExecutions: blockedExecutionPlans.length,
    reviewBacktests: reviewBacktests.length,
    openRiskIncidents: riskIncidents.length,
    criticalIncidents: criticalIncidents.length,
  });
  const generatedAt = new Date().toISOString();

  return {
    ok: true,
    generatedAt,
    posture,
    summary: {
      openRiskEvents: unresolvedRiskEvents.length,
      riskOffEvents: riskOffEvents.length,
      approvalRequired: approvalRequiredPlans.length,
      blockedExecutions: blockedExecutionPlans.length,
      reviewBacktests: reviewBacktests.length,
      openRiskIncidents: riskIncidents.length,
      liveExposurePct: exposure.exposurePct,
      liveEquity: exposure.equity,
      brokerConnected: Boolean(brokerSnapshot?.connected),
    },
    lanes: [
      {
        key: 'risk-events',
        title: 'Risk Events',
        status: riskOffEvents.length ? 'critical' : (unresolvedRiskEvents.length ? 'warn' : 'healthy'),
        detail: `${unresolvedRiskEvents.length} unresolved risk events with ${riskOffEvents.length} risk-off escalations.`,
        primaryCount: unresolvedRiskEvents.length,
        secondaryCount: riskOffEvents.length,
        updatedAt: riskEvents[0]?.createdAt || generatedAt,
      },
      {
        key: 'execution-review',
        title: 'Execution Review',
        status: blockedExecutionPlans.length ? 'critical' : (approvalRequiredPlans.length ? 'warn' : 'healthy'),
        detail: `${approvalRequiredPlans.length} execution plans require manual review and ${blockedExecutionPlans.length} are blocked.`,
        primaryCount: approvalRequiredPlans.length,
        secondaryCount: blockedExecutionPlans.length,
        updatedAt: executionPlans[0]?.updatedAt || generatedAt,
      },
      {
        key: 'backtest-review',
        title: 'Backtest Review',
        status: reviewBacktests.length ? 'warn' : 'healthy',
        detail: `${reviewBacktests.length} backtest runs still need operator explanation or approval.`,
        primaryCount: reviewBacktests.length,
        secondaryCount: backtestRuns.filter((item) => item.status === 'running').length,
        updatedAt: backtestRuns[0]?.updatedAt || generatedAt,
      },
      {
        key: 'incidents',
        title: 'Risk Incidents',
        status: criticalIncidents.length ? 'critical' : (riskIncidents.length ? 'warn' : 'healthy'),
        detail: `${riskIncidents.length} unresolved incidents are linked to the risk console path.`,
        primaryCount: riskIncidents.length,
        secondaryCount: criticalIncidents.length,
        updatedAt: riskIncidents[0]?.updatedAt || generatedAt,
      },
      {
        key: 'broker',
        title: 'Live Exposure',
        status: brokerSnapshot?.connected ? 'healthy' : 'warn',
        detail: brokerSnapshot
          ? `${exposure.exposurePct.toFixed(1)}% live exposure across ${brokerSnapshot.positions.length} synced positions.`
          : 'No backend broker snapshot has been recorded yet.',
        primaryCount: brokerSnapshot?.positions?.length || 0,
        secondaryCount: brokerSnapshot?.orders?.length || 0,
        updatedAt: brokerSnapshot?.createdAt || generatedAt,
      },
    ],
    reviewQueue: {
      executionPlans: takeLatest(approvalRequiredPlans, limit),
      backtestRuns: takeLatest(reviewBacktests, limit),
      incidents: takeLatest(riskIncidents, limit),
    },
    recent: {
      riskEvents: takeLatest(riskEvents, limit),
      executionPlans: takeLatest(executionPlans, limit),
      backtestRuns: takeLatest(backtestRuns, limit),
      incidents: takeLatest(riskIncidents, limit),
      brokerSnapshot,
    },
  };
}
