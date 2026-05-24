import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';

export function recordExecutionPlan(payload: Record<string, any>) {
  return controlPlaneRuntime.recordExecutionPlan(payload);
}
