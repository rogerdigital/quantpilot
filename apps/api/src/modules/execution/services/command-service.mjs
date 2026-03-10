import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';

export function recordExecutionPlan(payload) {
  return controlPlaneRuntime.recordExecutionPlan(payload);
}
