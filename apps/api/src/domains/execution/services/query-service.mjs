import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';

function groupBySymbol(items = [], qtySelector = () => 0) {
  return items.reduce((acc, item) => {
    const symbol = item.symbol || 'UNKNOWN';
    acc[symbol] = Number((acc[symbol] || 0) + Number(qtySelector(item) || 0));
    return acc;
  }, {});
}

function buildExecutionReconciliation(orderStates = [], snapshot = null) {
  if (!snapshot) {
    return {
      status: 'missing_snapshot',
      issueCount: 1,
      latestSnapshotAt: '',
      orderCountDelta: orderStates.length,
      filledQtyDelta: orderStates.reduce((sum, item) => sum + Number(item.filledQty || 0), 0),
      positionDelta: orderStates.filter((item) => Number(item.filledQty || 0) > 0).length,
      issues: [{
        id: 'missing-snapshot',
        kind: 'snapshot',
        severity: 'warn',
        title: 'Broker snapshot missing',
        detail: 'No broker account snapshot has been recorded for this execution plan yet.',
        expected: 'A broker account snapshot linked to the plan',
        actual: 'No linked snapshot found',
      }],
    };
  }

  const issues = [];
  const snapshotOrders = Array.isArray(snapshot.orders) ? snapshot.orders : [];
  const snapshotPositions = Array.isArray(snapshot.positions) ? snapshot.positions : [];
  const filledOrders = orderStates.filter((item) => item.lifecycleStatus === 'filled');
  const orderCountDelta = Math.abs(orderStates.length - snapshotOrders.length);

  if (orderCountDelta > 0) {
    issues.push({
      id: 'order-count-delta',
      kind: 'orders',
      severity: 'warn',
      title: 'Broker order count drift',
      detail: 'The number of persisted execution orders does not match the linked broker snapshot.',
      expected: String(orderStates.length),
      actual: String(snapshotOrders.length),
    });
  }

  const expectedFilledBySymbol = groupBySymbol(filledOrders, (item) => item.filledQty || item.qty || 0);
  const actualFilledBySymbol = groupBySymbol(snapshotOrders, (item) => item.filledQty || 0);
  const symbolKeys = Array.from(new Set([...Object.keys(expectedFilledBySymbol), ...Object.keys(actualFilledBySymbol)]));
  let filledQtyDelta = 0;
  symbolKeys.forEach((symbol) => {
    const expected = Number(expectedFilledBySymbol[symbol] || 0);
    const actual = Number(actualFilledBySymbol[symbol] || 0);
    const delta = Math.abs(expected - actual);
    filledQtyDelta += delta;
    if (delta > 0) {
      issues.push({
        id: `fill-delta-${symbol}`,
        kind: 'fills',
        severity: 'warn',
        title: `Fill drift for ${symbol}`,
        detail: 'Persisted order fill quantity differs from the broker snapshot.',
        expected: String(expected),
        actual: String(actual),
      });
    }
  });

  const expectedPositionsBySymbol = groupBySymbol(filledOrders, (item) => {
    const qty = Number(item.filledQty || item.qty || 0);
    return item.side === 'SELL' ? -qty : qty;
  });
  const actualPositionsBySymbol = groupBySymbol(snapshotPositions, (item) => Number(item.qty || 0));
  const positionKeys = Array.from(new Set([...Object.keys(expectedPositionsBySymbol), ...Object.keys(actualPositionsBySymbol)]));
  let positionDelta = 0;
  positionKeys.forEach((symbol) => {
    const expected = Number(expectedPositionsBySymbol[symbol] || 0);
    const actual = Number(actualPositionsBySymbol[symbol] || 0);
    const delta = Math.abs(expected - actual);
    positionDelta += delta;
    if (delta > 0) {
      issues.push({
        id: `position-delta-${symbol}`,
        kind: 'positions',
        severity: delta >= 5 ? 'critical' : 'warn',
        title: `Position drift for ${symbol}`,
        detail: 'Expected filled quantity does not match the broker position snapshot.',
        expected: String(expected),
        actual: String(actual),
      });
    }
  });

  const status = issues.length === 0
    ? 'aligned'
    : (issues.some((item) => item.severity === 'critical') || positionDelta >= 5 ? 'drift' : 'attention');

  return {
    status,
    issueCount: issues.length,
    latestSnapshotAt: snapshot.createdAt || '',
    orderCountDelta,
    filledQtyDelta,
    positionDelta,
    issues,
  };
}

function buildExecutionLedgerEntry(plan, runtimeEvents = [], snapshots = []) {
  const workflow = plan.workflowRunId ? controlPlaneRuntime.getWorkflowRun(plan.workflowRunId) : null;
  const latestRuntime = runtimeEvents.find((event) => event.executionPlanId === plan.id) || null;
  const latestSnapshot = snapshots.find((item) => item.executionPlanId === plan.id) || null;
  const brokerEvents = controlPlaneRuntime.listBrokerExecutionEvents(8, { executionPlanId: plan.id });
  const executionRun = controlPlaneRuntime.getExecutionRunByPlanId(plan.id);
  const orderStates = controlPlaneRuntime.listExecutionOrderStates(80, { executionPlanId: plan.id });
  const reconciliation = buildExecutionReconciliation(orderStates, latestSnapshot);
  const recovery = buildExecutionRecovery(plan, workflow, reconciliation);

  return {
    plan,
    executionRun,
    orderStates,
    workflow: workflow ? {
      id: workflow.id,
      workflowId: workflow.workflowId,
      status: workflow.status,
      updatedAt: workflow.updatedAt,
      completedAt: workflow.completedAt,
      failedAt: workflow.failedAt,
    } : null,
    latestRuntime,
    latestSnapshot,
    brokerEvents,
    reconciliation,
    recovery,
  };
}

function buildExecutionRecovery(plan, workflow, reconciliation) {
  const reasons = [];

  if (workflow?.status === 'retry_scheduled') {
    reasons.push('The linked workflow is waiting for retry release.');
    return {
      status: 'ready',
      recommendedAction: 'resume_workflow',
      headline: 'Workflow retry is waiting for operator recovery.',
      reasons,
    };
  }

  if (workflow?.status === 'failed' || workflow?.status === 'canceled') {
    reasons.push(`Workflow is ${workflow.status} and needs to be resumed before execution can continue.`);
    return {
      status: 'ready',
      recommendedAction: 'resume_workflow',
      headline: 'Failed execution workflow can be resumed.',
      reasons,
    };
  }

  if (plan.lifecycleStatus === 'failed' || plan.lifecycleStatus === 'cancelled') {
    reasons.push(`Plan lifecycle is ${plan.lifecycleStatus} and orders can be rerouted from the execution desk.`);
    return {
      status: 'ready',
      recommendedAction: 'reroute_orders',
      headline: 'Execution orders can be rerouted.',
      reasons,
    };
  }

  if (reconciliation?.status && reconciliation.status !== 'aligned') {
    reasons.push(`Reconciliation status is ${reconciliation.status}.`);
    return {
      status: reconciliation.status === 'drift' ? 'ready' : 'monitor',
      recommendedAction: 'reconcile',
      headline: 'Execution needs reconciliation review.',
      reasons,
    };
  }

  return {
    status: 'monitor',
    recommendedAction: 'none',
    headline: 'Execution is inside the current recovery guardrails.',
    reasons,
  };
}

export function listExecutionPlans(limit = 50, filter = {}) {
  return controlPlaneRuntime.listExecutionPlans(limit, filter);
}

export function listExecutionRuns(limit = 50, filter = {}) {
  return controlPlaneRuntime.listExecutionRuns(limit, filter);
}

export function getExecutionPlan(planId) {
  return controlPlaneRuntime.getExecutionPlan(planId);
}

export function getExecutionPlanDetail(planId) {
  const plan = controlPlaneRuntime.getExecutionPlan(planId);
  if (!plan) return null;
  return buildExecutionLedgerEntry(
    plan,
    controlPlaneRuntime.listExecutionRuntimeEvents(60),
    controlPlaneRuntime.listBrokerAccountSnapshots(60),
  );
}

export function findExecutionPlanByWorkflowRunId(workflowRunId) {
  return controlPlaneRuntime.findExecutionPlanByWorkflowRunId(workflowRunId);
}

export function listExecutionRuntimeEvents(limit = 50) {
  return controlPlaneRuntime.listExecutionRuntimeEvents(limit);
}

export function listBrokerAccountSnapshots(limit = 50) {
  return controlPlaneRuntime.listBrokerAccountSnapshots(limit);
}

export function listBrokerExecutionEvents(limit = 50, filter = {}) {
  return controlPlaneRuntime.listBrokerExecutionEvents(limit, filter);
}

export function getLatestBrokerAccountSnapshot() {
  return controlPlaneRuntime.listBrokerAccountSnapshots(1)[0] || null;
}

export function listExecutionLedger(limit = 20) {
  const plans = controlPlaneRuntime.listExecutionPlans(limit);
  const runtimeEvents = controlPlaneRuntime.listExecutionRuntimeEvents(60);
  const snapshots = controlPlaneRuntime.listBrokerAccountSnapshots(60);

  return plans.map((plan) => buildExecutionLedgerEntry(plan, runtimeEvents, snapshots));
}

export function getExecutionWorkbench(limit = 40) {
  const ledger = listExecutionLedger(limit);
  const summary = {
    totalPlans: ledger.length,
    awaitingApproval: 0,
    routing: 0,
    submitted: 0,
    acknowledged: 0,
    filled: 0,
    blocked: 0,
    cancelled: 0,
    failed: 0,
    aligned: 0,
    attention: 0,
    drift: 0,
    missingSnapshot: 0,
    totalOpenOrders: 0,
    syncedPositions: 0,
    recoverablePlans: 0,
    retryScheduledWorkflows: 0,
    interventionNeeded: 0,
    brokerEvents: 0,
    rejectedBrokerEvents: 0,
    fillEvents: 0,
  };

  ledger.forEach((entry) => {
    const lifecycle = entry.executionRun?.lifecycleStatus || entry.plan.lifecycleStatus || 'planned';
    if (lifecycle === 'awaiting_approval') summary.awaitingApproval += 1;
    if (lifecycle === 'routing') summary.routing += 1;
    if (lifecycle === 'submitted' || lifecycle === 'partial_fill') summary.submitted += 1;
    if (lifecycle === 'acknowledged') summary.acknowledged += 1;
    if (lifecycle === 'filled') summary.filled += 1;
    if (lifecycle === 'blocked' || entry.plan.riskStatus === 'blocked') summary.blocked += 1;
    if (lifecycle === 'cancelled') summary.cancelled += 1;
    if (lifecycle === 'failed') summary.failed += 1;
    const reconciliation = entry.reconciliation?.status || 'missing_snapshot';
    if (reconciliation === 'aligned') summary.aligned += 1;
    if (reconciliation === 'attention') summary.attention += 1;
    if (reconciliation === 'drift') summary.drift += 1;
    if (reconciliation === 'missing_snapshot') summary.missingSnapshot += 1;
    summary.totalOpenOrders += entry.orderStates.filter((item) => ['submitted', 'acknowledged'].includes(item.lifecycleStatus)).length;
    summary.syncedPositions += Array.isArray(entry.latestSnapshot?.positions) ? entry.latestSnapshot.positions.length : 0;
    if (entry.workflow?.status === 'retry_scheduled') summary.retryScheduledWorkflows += 1;
    if (entry.recovery?.status === 'ready') summary.recoverablePlans += 1;
    if (entry.recovery?.recommendedAction !== 'none') summary.interventionNeeded += 1;
    summary.brokerEvents += Array.isArray(entry.brokerEvents) ? entry.brokerEvents.length : 0;
    summary.rejectedBrokerEvents += Array.isArray(entry.brokerEvents)
      ? entry.brokerEvents.filter((item) => item.eventType === 'rejected').length
      : 0;
    summary.fillEvents += Array.isArray(entry.brokerEvents)
      ? entry.brokerEvents.filter((item) => item.eventType === 'partial_fill' || item.eventType === 'filled').length
      : 0;
  });

  return {
    ok: true,
    asOf: ledger[0]?.plan.updatedAt || new Date().toISOString(),
    summary,
    entries: ledger,
  };
}
