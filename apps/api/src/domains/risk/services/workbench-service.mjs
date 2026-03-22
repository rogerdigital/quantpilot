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
  const largestPosition = Array.isArray(snapshot?.positions)
    ? snapshot.positions.reduce((max, item) => Math.max(max, Number(item.marketValue || 0)), 0)
    : 0;
  return {
    equity,
    marketValue,
    exposurePct: equity > 0 ? (marketValue / equity) * 100 : 0,
    concentrationPct: equity > 0 ? (largestPosition / equity) * 100 : 0,
  };
}

function isSchedulerAttention(status = '') {
  return ['warn', 'critical', 'phase-change'].includes(status);
}

function createRunbook(input) {
  const items = [];

  if (input.riskOffEvents > 0) {
    items.push({
      key: 'review-risk-off',
      priority: 'now',
      title: 'Review risk-off escalations',
      detail: 'Risk-off events are actively blocking execution and need operator explanation.',
      count: input.riskOffEvents,
    });
  }

  if (input.approvalRequired > 0 || input.reviewBacktests > 0) {
    items.push({
      key: 'clear-review-queue',
      priority: 'now',
      title: 'Clear review queue',
      detail: 'Execution approvals and research review backlog still sit on the risk path.',
      count: input.approvalRequired + input.reviewBacktests,
    });
  }

  if (input.concentrationPct >= 20 || input.liveExposurePct >= 60) {
    items.push({
      key: 'inspect-live-exposure',
      priority: 'next',
      title: 'Inspect live exposure',
      detail: 'Portfolio concentration or live exposure is approaching the current risk guardrails.',
      count: Math.max(input.liveExposurePct >= 60 ? 1 : 0, input.concentrationPct >= 20 ? 1 : 0),
    });
  }

  if (input.openRiskIncidents > 0) {
    items.push({
      key: 'triage-risk-incidents',
      priority: input.criticalIncidents > 0 ? 'now' : 'next',
      title: 'Triage risk incidents',
      detail: 'Unresolved risk incidents still need ownership, notes, or mitigation updates.',
      count: input.openRiskIncidents,
    });
  }

  if (input.schedulerAttention > 0) {
    items.push({
      key: 'review-scheduler-drift',
      priority: 'next',
      title: 'Review scheduler drift',
      detail: 'Scheduler attention items can affect pre-open, intraday, or post-close risk workflows.',
      count: input.schedulerAttention,
    });
  }

  if (input.complianceAlerts > 0) {
    items.push({
      key: 'check-compliance-alerts',
      priority: 'now',
      title: 'Check compliance alerts',
      detail: 'Policy-linked risk signals or incidents indicate a compliance review is still pending.',
      count: input.complianceAlerts,
    });
  }

  if (input.blockedExecutions > 0 || input.riskOffEvents > 0) {
    items.push({
      key: 'release-emergency-brake',
      priority: 'now',
      title: 'Review emergency brake',
      detail: 'Blocked execution plans or active risk-off signals imply the emergency brake remains engaged.',
      count: input.blockedExecutions + input.riskOffEvents,
    });
  }

  return items;
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
  const schedulerTicks = controlPlaneRuntime.listSchedulerTicks(80, { since });

  const unresolvedRiskEvents = riskEvents.filter((item) => item.status !== 'healthy');
  const riskOffEvents = riskEvents.filter((item) => item.status === 'risk-off');
  const drawdownAlerts = riskEvents.filter((item) => {
    const message = `${item.title} ${item.message}`.toLowerCase();
    return message.includes('drawdown');
  });
  const complianceAlerts = riskEvents.filter((item) => {
    const message = `${item.title} ${item.message}`.toLowerCase();
    return message.includes('compliance') || message.includes('policy');
  });
  const approvalRequiredPlans = executionPlans.filter((item) => item.approvalState === 'required' || item.riskStatus === 'review');
  const blockedExecutionPlans = executionPlans.filter((item) => item.riskStatus === 'blocked' || item.status === 'blocked');
  const reviewBacktests = backtestRuns.filter((item) => item.status === 'needs_review');
  const riskIncidents = incidents.filter((item) => item.status !== 'resolved')
    .filter((item) => item.source === 'risk' || item.metadata?.riskEventId);
  const criticalIncidents = riskIncidents.filter((item) => item.severity === 'critical');
  const schedulerAttention = schedulerTicks.filter((item) => isSchedulerAttention(item.status));
  const exposure = getLiveExposure(brokerSnapshot);
  const emergencyActions = blockedExecutionPlans.length + riskOffEvents.length;
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
      concentrationPct: exposure.concentrationPct,
      drawdownAlerts: drawdownAlerts.length,
      complianceAlerts: complianceAlerts.length,
      emergencyActions,
      schedulerAttention: schedulerAttention.length,
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
        key: 'portfolio',
        title: 'Portfolio Exposure',
        status: exposure.concentrationPct >= 20 || exposure.exposurePct >= 60 ? 'warn' : 'healthy',
        detail: `${exposure.exposurePct.toFixed(1)}% live exposure with ${exposure.concentrationPct.toFixed(1)}% in the largest position.`,
        primaryCount: Number(exposure.exposurePct.toFixed(1)),
        secondaryCount: Number(exposure.concentrationPct.toFixed(1)),
        updatedAt: brokerSnapshot?.createdAt || generatedAt,
      },
      {
        key: 'drawdown',
        title: 'Drawdown Review',
        status: drawdownAlerts.length ? 'warn' : 'healthy',
        detail: `${drawdownAlerts.length} drawdown-related signals still need review or explanation.`,
        primaryCount: drawdownAlerts.length,
        secondaryCount: reviewBacktests.length,
        updatedAt: drawdownAlerts[0]?.createdAt || backtestRuns[0]?.updatedAt || generatedAt,
      },
      {
        key: 'compliance',
        title: 'Compliance Guardrails',
        status: complianceAlerts.length ? 'warn' : 'healthy',
        detail: `${complianceAlerts.length} compliance or policy-linked alerts are still on the risk path.`,
        primaryCount: complianceAlerts.length,
        secondaryCount: riskIncidents.filter((item) => (item.tags || []).includes('compliance')).length,
        updatedAt: complianceAlerts[0]?.createdAt || riskIncidents[0]?.updatedAt || generatedAt,
      },
      {
        key: 'emergency',
        title: 'Emergency Brake',
        status: emergencyActions ? 'critical' : 'healthy',
        detail: `${blockedExecutionPlans.length} blocked execution plans and ${riskOffEvents.length} risk-off signals influence the emergency posture.`,
        primaryCount: blockedExecutionPlans.length,
        secondaryCount: riskOffEvents.length,
        updatedAt: blockedExecutionPlans[0]?.updatedAt || riskOffEvents[0]?.createdAt || generatedAt,
      },
      {
        key: 'scheduler',
        title: 'Scheduler Attention',
        status: schedulerAttention.some((item) => item.status === 'critical') ? 'critical' : (schedulerAttention.length ? 'warn' : 'healthy'),
        detail: `${schedulerAttention.length} scheduler ticks need attention across the risk middleware path.`,
        primaryCount: schedulerAttention.length,
        secondaryCount: schedulerTicks.filter((item) => item.phase === 'INTRADAY').length,
        updatedAt: schedulerTicks[0]?.createdAt || generatedAt,
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
    runbook: createRunbook({
      riskOffEvents: riskOffEvents.length,
      approvalRequired: approvalRequiredPlans.length,
      reviewBacktests: reviewBacktests.length,
      liveExposurePct: exposure.exposurePct,
      concentrationPct: exposure.concentrationPct,
      openRiskIncidents: riskIncidents.length,
      criticalIncidents: criticalIncidents.length,
      schedulerAttention: schedulerAttention.length,
      complianceAlerts: complianceAlerts.length,
      blockedExecutions: blockedExecutionPlans.length,
    }),
    reviewQueue: {
      riskEvents: takeLatest(unresolvedRiskEvents, limit),
      executionPlans: takeLatest(approvalRequiredPlans, limit),
      backtestRuns: takeLatest(reviewBacktests, limit),
      incidents: takeLatest(riskIncidents, limit),
      schedulerTicks: takeLatest(schedulerAttention, limit),
    },
    recent: {
      riskEvents: takeLatest(riskEvents, limit),
      executionPlans: takeLatest(executionPlans, limit),
      backtestRuns: takeLatest(backtestRuns, limit),
      incidents: takeLatest(riskIncidents, limit),
      brokerSnapshot,
      schedulerTicks: takeLatest(schedulerTicks, limit),
    },
  };
}
