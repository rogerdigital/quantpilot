import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';

export function listExecutionPlans(limit = 50, filter = {}) {
  return controlPlaneRuntime.listExecutionPlans(limit, filter);
}

export function getExecutionPlan(planId) {
  return controlPlaneRuntime.getExecutionPlan(planId);
}

export function getExecutionPlanDetail(planId) {
  const plan = controlPlaneRuntime.getExecutionPlan(planId);
  if (!plan) return null;
  const workflow = plan.workflowRunId ? controlPlaneRuntime.getWorkflowRun(plan.workflowRunId) : null;
  const latestRuntime = controlPlaneRuntime.listExecutionRuntimeEvents(60)
    .find((event) => event.mode === plan.mode && event.createdAt >= plan.createdAt) || null;

  return {
    plan,
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
    const latestRuntime = runtimeEvents.find((event) => event.mode === plan.mode && event.createdAt >= plan.createdAt) || null;

    return {
      plan,
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
