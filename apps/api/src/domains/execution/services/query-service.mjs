import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';

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
  const workflow = plan.workflowRunId ? controlPlaneRuntime.getWorkflowRun(plan.workflowRunId) : null;
  const latestRuntime = controlPlaneRuntime.listExecutionRuntimeEvents(60)
    .find((event) => event.executionPlanId === plan.id) || null;
  const executionRun = controlPlaneRuntime.getExecutionRunByPlanId(plan.id);
  const orderStates = controlPlaneRuntime.listExecutionOrderStates(80, { executionPlanId: plan.id });

  return {
    plan,
    executionRun,
    orderStates,
    workflow,
    latestRuntime,
  };
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

export function getLatestBrokerAccountSnapshot() {
  return controlPlaneRuntime.listBrokerAccountSnapshots(1)[0] || null;
}

export function listExecutionLedger(limit = 20) {
  const plans = controlPlaneRuntime.listExecutionPlans(limit);
  const runtimeEvents = controlPlaneRuntime.listExecutionRuntimeEvents(60);

  return plans.map((plan) => {
    const workflow = plan.workflowRunId ? controlPlaneRuntime.getWorkflowRun(plan.workflowRunId) : null;
    const latestRuntime = runtimeEvents.find((event) => event.executionPlanId === plan.id) || null;
    const executionRun = controlPlaneRuntime.getExecutionRunByPlanId(plan.id);
    const orderStates = controlPlaneRuntime.listExecutionOrderStates(80, { executionPlanId: plan.id });

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
    };
  });
}

export function getExecutionWorkbench(limit = 40) {
  const ledger = listExecutionLedger(limit);
  const summary = {
    totalPlans: ledger.length,
    awaitingApproval: 0,
    routing: 0,
    submitted: 0,
    filled: 0,
    blocked: 0,
    failed: 0,
  };

  ledger.forEach((entry) => {
    const lifecycle = entry.executionRun?.lifecycleStatus || entry.plan.lifecycleStatus || 'planned';
    if (lifecycle === 'awaiting_approval') summary.awaitingApproval += 1;
    if (lifecycle === 'routing') summary.routing += 1;
    if (lifecycle === 'submitted' || lifecycle === 'partial_fill') summary.submitted += 1;
    if (lifecycle === 'filled') summary.filled += 1;
    if (lifecycle === 'blocked' || entry.plan.riskStatus === 'blocked') summary.blocked += 1;
    if (lifecycle === 'failed' || lifecycle === 'cancelled') summary.failed += 1;
  });

  return {
    ok: true,
    asOf: ledger[0]?.plan.updatedAt || new Date().toISOString(),
    summary,
    entries: ledger,
  };
}
