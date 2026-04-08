import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';

export function recordExecutionPlan(payload) {
  return controlPlaneRuntime.recordExecutionPlan(payload);
}
