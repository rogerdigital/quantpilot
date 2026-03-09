import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.mjs';

export function listExecutionPlans(limit = 50) {
  return controlPlaneRuntime.listExecutionPlans(limit);
}

export function recordExecutionPlan(payload) {
  return controlPlaneRuntime.recordExecutionPlan(payload);
}
