// @ts-nocheck
import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';
import { buildExecutionExceptionPolicy, listLinkedExecutionIncidents } from './exception-policy-service.js';

function groupBySymbol(items = [], qtySelector = () => 0) {
  return items.reduce((acc, item) => {
    const symbol = item.symbol || 'UNKNOWN';
    acc[symbol] = Number((acc[symbol] || 0) + Number(qtySelector(item) || 0));
    return acc;
  }, {});
}

function round2(value) {
  return Number(Number(value || 0).toFixed(2));
}

function buildExecutionReconciliation(orderStates = [], snapshot = null, latestRuntime = null, plan = null) {
  if (!snapshot) {
    return {
      status: 'missing_snapshot',
      issueCount: 1,
      latestSnapshotAt: '',
      orderCountDelta: orderStates.length,
      filledQtyDelta: orderStates.reduce((sum, item) => sum + Number(item.filledQty || 0), 0),
      positionDelta: orderStates.filter((item) => Number(item.filledQty || 0) > 0).length,
      cashDelta: latestRuntime ? round2(latestRuntime.cash) : 0,
      buyingPowerDelta: latestRuntime ? round2(latestRuntime.buyingPower) : 0,
      equityDelta: latestRuntime ? round2(latestRuntime.equity) : round2(plan?.capital || 0),
      deployedCapital: round2(orderStates.reduce((sum, item) => sum + Number(item.filledQty || 0) * Number(item.avgFillPrice || 0), 0)),
      residualCapital: round2(Math.max(0, Number(plan?.capital || 0) - orderStates.reduce((sum, item) => sum + Number(item.filledQty || 0) * Number(item.avgFillPrice || 0), 0))),
      accountStatus: 'missing_snapshot',
      cadence: {
        status: latestRuntime ? 'stale' : 'missing_runtime',
        runtimeAt: latestRuntime?.createdAt || '',
        snapshotLagMinutes: 0,
      },
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
  const deployedCapital = round2(filledOrders.reduce((sum, item) => sum + Number(item.filledQty || item.qty || 0) * Number(item.avgFillPrice || 0), 0));
  const residualCapital = round2(Math.max(0, Number(plan?.capital || 0) - deployedCapital));
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

  const runtimeCash = Number(latestRuntime?.cash || residualCapital);
  const runtimeBuyingPower = Number(latestRuntime?.buyingPower || residualCapital);
  const runtimeEquity = Number(latestRuntime?.equity || (Number(plan?.capital || 0) || deployedCapital + residualCapital));
  const hasSnapshotAccount = snapshot.account
    && Number.isFinite(Number(snapshot.account.cash))
    && Number.isFinite(Number(snapshot.account.buyingPower))
    && Number.isFinite(Number(snapshot.account.equity));
  const snapshotCash = hasSnapshotAccount ? Number(snapshot.account.cash) : runtimeCash;
  const snapshotBuyingPower = hasSnapshotAccount ? Number(snapshot.account.buyingPower) : runtimeBuyingPower;
  const snapshotEquity = hasSnapshotAccount ? Number(snapshot.account.equity) : runtimeEquity;
  const cashDelta = round2(Math.abs(runtimeCash - snapshotCash));
  const buyingPowerDelta = round2(Math.abs(runtimeBuyingPower - snapshotBuyingPower));
  const equityDelta = round2(Math.abs(runtimeEquity - snapshotEquity));

  if (hasSnapshotAccount && cashDelta > 0) {
    issues.push({
      id: 'cash-delta',
      kind: 'account',
      severity: cashDelta >= 1000 ? 'critical' : 'warn',
      title: 'Cash drift detected',
      detail: 'Persisted execution runtime cash does not match the broker account snapshot.',
      expected: String(round2(runtimeCash)),
      actual: String(round2(snapshotCash)),
    });
  }

  if (hasSnapshotAccount && buyingPowerDelta > 0) {
    issues.push({
      id: 'buying-power-delta',
      kind: 'account',
      severity: buyingPowerDelta >= 1000 ? 'critical' : 'warn',
      title: 'Buying power drift detected',
      detail: 'Persisted execution runtime buying power does not match the broker account snapshot.',
      expected: String(round2(runtimeBuyingPower)),
      actual: String(round2(snapshotBuyingPower)),
    });
  }

  if (hasSnapshotAccount && equityDelta > 0) {
    issues.push({
      id: 'equity-delta',
      kind: 'capital',
      severity: equityDelta >= 1000 ? 'critical' : 'warn',
      title: 'Equity drift detected',
      detail: 'Persisted execution runtime equity does not match the broker account snapshot.',
      expected: String(round2(runtimeEquity)),
      actual: String(round2(snapshotEquity)),
    });
  }

  const runtimeAt = Date.parse(latestRuntime?.createdAt || '');
  const snapshotAt = Date.parse(snapshot.createdAt || '');
  const snapshotLagMinutes = Number.isFinite(runtimeAt) && Number.isFinite(snapshotAt)
    ? Math.max(0, Math.round((snapshotAt - runtimeAt) / (60 * 1000)))
    : 0;
  const cadenceStatus = !latestRuntime
    ? 'missing_runtime'
    : (snapshotLagMinutes > 15 ? 'stale' : 'live');

  if (cadenceStatus === 'stale') {
    issues.push({
      id: 'snapshot-cadence-stale',
      kind: 'cadence',
      severity: snapshotLagMinutes > 60 ? 'critical' : 'warn',
      title: 'Account snapshot cadence is stale',
      detail: 'The linked broker snapshot lags too far behind the latest execution runtime update.',
      expected: 'Snapshot within 15 minutes of runtime update',
      actual: `${snapshotLagMinutes} minutes`,
    });
  }

  const status = issues.length === 0
    ? 'aligned'
    : (issues.some((item) => item.severity === 'critical') || positionDelta >= 5 ? 'drift' : 'attention');
  const accountStatus = (cashDelta === 0 && buyingPowerDelta === 0 && equityDelta === 0 && cadenceStatus !== 'stale')
    ? 'aligned'
    : ((cashDelta >= 1000 || buyingPowerDelta >= 1000 || equityDelta >= 1000 || cadenceStatus === 'stale') ? 'drift' : 'attention');

  return {
    status,
    issueCount: issues.length,
    latestSnapshotAt: snapshot.createdAt || '',
    orderCountDelta,
    filledQtyDelta,
    positionDelta,
    cashDelta,
    buyingPowerDelta,
    equityDelta,
    deployedCapital,
    residualCapital,
    accountStatus,
    cadence: {
      status: cadenceStatus,
      runtimeAt: latestRuntime?.createdAt || '',
      snapshotLagMinutes,
    },
    issues,
  };
}

function buildExecutionCompensation(detail, exceptionPolicy = null, linkedIncidents = []) {
  const policy = exceptionPolicy || detail.exceptionPolicy || null;
  const reconciliation = detail.reconciliation || null;
  const openIncident = (Array.isArray(linkedIncidents) ? linkedIncidents : []).find((incident) => incident.status !== 'resolved') || null;
  const lastAutomatedAt = detail.plan?.metadata?.compensation?.lastAutomatedAt || '';
  const reasons = [];
  const steps = [];
  let status = 'not_needed';
  let mode = 'none';
  let autoExecutable = false;
  let recommendedAction = 'none';
  let headline = 'Execution compensation automation is not needed.';

  const needsReconciliation = Boolean(reconciliation && ['attention', 'drift', 'missing_snapshot'].includes(reconciliation.status));
  const needsEscalation = Boolean(
    (!openIncident && (policy?.incidentRecommended || policy?.recommendedAction === 'open_incident'))
    || (policy?.status === 'compensation' && !openIncident),
  );

  if (policy?.status === 'stable' && !needsReconciliation) {
    return {
      status,
      mode,
      autoExecutable,
      recommendedAction,
      headline,
      reasons,
      linkedIncidentId: '',
      linkedIncidentStatus: '',
      lastAutomatedAt,
      steps,
    };
  }

  if (policy?.status === 'attention' || reconciliation?.status === 'attention' || reconciliation?.status === 'missing_snapshot') {
    status = 'queued';
    mode = 'manual_review';
    recommendedAction = 'reconcile';
    headline = 'Execution needs manual compensation review.';
    reasons.push('Reconciliation needs operator review before automation can safely proceed.');
  }

  if (policy?.status === 'compensation' || (policy?.status === 'incident' && policy?.category === 'reconciliation_drift')) {
    status = openIncident ? 'escalated' : 'ready';
    mode = needsEscalation ? 'auto_reconcile_and_escalate' : 'auto_reconcile';
    autoExecutable = needsReconciliation;
    recommendedAction = 'reconcile';
    headline = openIncident
      ? 'Execution compensation is already escalated and needs incident follow-up.'
      : 'Execution compensation can automate reconciliation before operator follow-up.';
    reasons.push(...(policy?.reasons || []));
  }

  if (policy?.status === 'incident' && openIncident && mode === 'none') {
    status = 'escalated';
    mode = 'incident_followup';
    recommendedAction = 'open_incident';
    headline = 'Execution is already escalated into an incident and needs follow-up.';
    reasons.push(`Incident ${openIncident.id} is already tracking this execution exception.`);
  }

  if (needsReconciliation) {
    steps.push({
      key: 'refresh-reconciliation',
      title: 'Refresh reconciliation',
      detail: 'Capture the latest order, position, and account drift before compensation closes out.',
      automated: true,
      status: autoExecutable ? 'ready' : 'pending',
    });
  }

  if (needsEscalation || openIncident) {
    steps.push({
      key: 'sync-incident',
      title: openIncident ? 'Sync linked incident' : 'Escalate into incident',
      detail: openIncident
        ? 'Keep the linked execution incident aligned with the latest compensation posture.'
        : 'Open and link an execution incident if reconciliation drift still needs escalation.',
      automated: true,
      status: autoExecutable ? 'ready' : (openIncident ? 'completed' : 'pending'),
    });
  }

  if (status !== 'not_needed') {
    steps.push({
      key: 'operator-followup',
      title: 'Operator follow-up',
      detail: openIncident
        ? 'Hand off the compensated execution to the incident owner for final closeout.'
        : 'Review the compensated execution and clear any remaining broker or risk follow-up.',
      automated: false,
      status: openIncident ? 'ready' : 'pending',
    });
  }

  return {
    status,
    mode,
    autoExecutable,
    recommendedAction,
    headline,
    reasons,
    linkedIncidentId: openIncident?.id || '',
    linkedIncidentStatus: openIncident?.status || '',
    lastAutomatedAt,
    steps,
  };
}

function buildExecutionLedgerEntry(plan, runtimeEvents = [], snapshots = []) {
  const workflow = plan.workflowRunId ? controlPlaneRuntime.getWorkflowRun(plan.workflowRunId) : null;
  const latestRuntime = runtimeEvents.find((event) => event.executionPlanId === plan.id) || null;
  const latestSnapshot = snapshots.find((item) => item.executionPlanId === plan.id) || null;
  const brokerEvents = controlPlaneRuntime.listBrokerExecutionEvents(8, { executionPlanId: plan.id });
  const executionRun = controlPlaneRuntime.getExecutionRunByPlanId(plan.id);
  const orderStates = controlPlaneRuntime.listExecutionOrderStates(80, { executionPlanId: plan.id });
  const reconciliation = buildExecutionReconciliation(orderStates, latestSnapshot, latestRuntime, plan);
  const linkedIncidents = listLinkedExecutionIncidents({
    plan,
    executionRun,
    workflow,
    orderStates,
    brokerEvents,
    reconciliation,
  }, { limit: 120 });
  const exceptionPolicy = buildExecutionExceptionPolicy({
    plan,
    executionRun,
    workflow,
    orderStates,
    brokerEvents,
    reconciliation,
    linkedIncidents,
  });
  const compensation = buildExecutionCompensation({
    plan,
    executionRun,
    workflow,
    orderStates,
    brokerEvents,
    reconciliation,
  }, exceptionPolicy, linkedIncidents);
  const recovery = buildExecutionRecovery(plan, workflow, reconciliation, exceptionPolicy);

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
    compensation,
    exceptionPolicy,
    recovery,
    linkedIncidents,
  };
}

function buildExecutionRecovery(plan, workflow, reconciliation, exceptionPolicy = null) {
  const reasons = [];

  if (exceptionPolicy?.status === 'incident') {
    reasons.push(...(exceptionPolicy.reasons || []));
    return {
      status: 'blocked',
      recommendedAction: exceptionPolicy.linkedIncidentId ? 'reconcile' : 'open_incident',
      headline: exceptionPolicy.headline,
      reasons,
    };
  }

  if (exceptionPolicy?.status === 'compensation') {
    reasons.push(...(exceptionPolicy.reasons || []));
    return {
      status: 'ready',
      recommendedAction: 'reconcile',
      headline: exceptionPolicy.headline,
      reasons,
    };
  }

  if (exceptionPolicy?.status === 'retrying' && exceptionPolicy.recommendedAction === 'reroute_orders') {
    reasons.push(...(exceptionPolicy.reasons || []));
    return {
      status: 'ready',
      recommendedAction: 'reroute_orders',
      headline: exceptionPolicy.headline,
      reasons,
    };
  }

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
    reasons: exceptionPolicy?.reasons?.length ? exceptionPolicy.reasons : reasons,
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
    retryEligiblePlans: 0,
    compensationPlans: 0,
    compensationReadyPlans: 0,
    escalatedCompensationPlans: 0,
    incidentLinkedPlans: 0,
    brokerRejectPlans: 0,
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
    if (entry.exceptionPolicy?.retryEligible) summary.retryEligiblePlans += 1;
    if (entry.exceptionPolicy?.status === 'compensation') summary.compensationPlans += 1;
    if (entry.compensation?.autoExecutable) summary.compensationReadyPlans += 1;
    if (entry.compensation?.status === 'escalated') summary.escalatedCompensationPlans += 1;
    if (entry.exceptionPolicy?.linkedIncidentId) summary.incidentLinkedPlans += 1;
    if (entry.exceptionPolicy?.category === 'broker_reject' || entry.exceptionPolicy?.category === 'mixed') summary.brokerRejectPlans += 1;
    summary.brokerEvents += Array.isArray(entry.brokerEvents) ? entry.brokerEvents.length : 0;
    summary.rejectedBrokerEvents += Array.isArray(entry.brokerEvents)
      ? entry.brokerEvents.filter((item) => item.eventType === 'rejected').length
      : 0;
    summary.fillEvents += Array.isArray(entry.brokerEvents)
      ? entry.brokerEvents.filter((item) => item.eventType === 'partial_fill' || item.eventType === 'filled').length
      : 0;
  });

  const queues = {
    approvals: ledger.filter((entry) => (entry.executionRun?.lifecycleStatus || entry.plan.lifecycleStatus) === 'awaiting_approval').slice(0, 8),
    retryEligible: ledger.filter((entry) => entry.exceptionPolicy?.retryEligible).slice(0, 8),
    compensation: ledger.filter((entry) => entry.exceptionPolicy?.status === 'compensation').slice(0, 8),
    compensationAutomation: ledger.filter((entry) => entry.compensation?.autoExecutable).slice(0, 8),
    incidents: ledger.filter((entry) => Boolean(entry.exceptionPolicy?.linkedIncidentId) || entry.exceptionPolicy?.status === 'incident').slice(0, 8),
    activeRouting: ledger.filter((entry) => ['submitted', 'acknowledged', 'partial_fill'].includes(entry.executionRun?.lifecycleStatus || entry.plan.lifecycleStatus)).slice(0, 8),
  };

  const ownerBuckets = new Map();
  ledger.forEach((entry) => {
    const owner = entry.executionRun?.owner || 'unassigned';
    const bucket = ownerBuckets.get(owner) || {
      owner,
      total: 0,
      approvals: 0,
      retryEligible: 0,
      compensation: 0,
      compensationAutomation: 0,
      incidents: 0,
      activeRouting: 0,
    };
    bucket.total += 1;
    if ((entry.executionRun?.lifecycleStatus || entry.plan.lifecycleStatus) === 'awaiting_approval') bucket.approvals += 1;
    if (entry.exceptionPolicy?.retryEligible) bucket.retryEligible += 1;
    if (entry.exceptionPolicy?.status === 'compensation') bucket.compensation += 1;
    if (entry.compensation?.autoExecutable) bucket.compensationAutomation += 1;
    if (Boolean(entry.exceptionPolicy?.linkedIncidentId) || entry.exceptionPolicy?.status === 'incident') bucket.incidents += 1;
    if (['submitted', 'acknowledged', 'partial_fill'].includes(entry.executionRun?.lifecycleStatus || entry.plan.lifecycleStatus)) bucket.activeRouting += 1;
    ownerBuckets.set(owner, bucket);
  });

  const nextActions = [];
  if (queues.approvals.length) {
    nextActions.push({
      key: 'clear-approvals',
      priority: queues.approvals.length >= 3 ? 'now' : 'next',
      title: 'Clear execution approvals',
      detail: 'Approval-gated execution plans are waiting before they can enter broker routing.',
      count: queues.approvals.length,
    });
  }
  if (queues.retryEligible.length) {
    nextActions.push({
      key: 'retry-rejected-orders',
      priority: 'now',
      title: 'Retry rejected orders',
      detail: 'Retry-eligible execution plans have remaining budget and can be rerouted from the desk.',
      count: queues.retryEligible.length,
    });
  }
  if (queues.compensation.length) {
    nextActions.push({
      key: 'reconcile-drift',
      priority: 'now',
      title: 'Resolve compensation queue',
      detail: 'Execution plans with broker drift or mixed fill/reject posture need reconciliation before closeout.',
      count: queues.compensation.length,
    });
  }
  if (queues.compensationAutomation.length) {
    nextActions.push({
      key: 'run-compensation-automation',
      priority: 'now',
      title: 'Run compensation automation',
      detail: 'Auto-executable compensation plans can refresh reconciliation and sync incidents before manual follow-up.',
      count: queues.compensationAutomation.length,
    });
  }
  if (queues.incidents.length) {
    nextActions.push({
      key: 'triage-execution-incidents',
      priority: 'now',
      title: 'Triage execution incidents',
      detail: 'Execution exceptions have already escalated into incidents and need active operator ownership.',
      count: queues.incidents.length,
    });
  }
  if (queues.activeRouting.length) {
    nextActions.push({
      key: 'watch-active-routing',
      priority: 'next',
      title: 'Watch active routing',
      detail: 'Submitted and partially filled plans should stay under execution watch until broker state converges.',
      count: queues.activeRouting.length,
    });
  }

  return {
    ok: true,
    asOf: ledger[0]?.plan.updatedAt || new Date().toISOString(),
    summary,
    operations: {
      queues,
      ownerLoad: [...ownerBuckets.values()]
        .sort((left, right) => right.incidents - left.incidents
          || right.compensation - left.compensation
          || right.retryEligible - left.retryEligible
          || right.approvals - left.approvals
          || right.total - left.total)
        .slice(0, 8),
      nextActions,
    },
    entries: ledger,
  };
}
