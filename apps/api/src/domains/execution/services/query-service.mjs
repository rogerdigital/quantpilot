import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';

export function listExecutionPlans(limit = 50, filter = {}) {
  return controlPlaneRuntime.listExecutionPlans(limit, filter);
}

export function getExecutionPlan(planId) {
  return controlPlaneRuntime.getExecutionPlan(planId);
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
