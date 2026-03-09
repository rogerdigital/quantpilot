import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.mjs';

export function listSchedulerTicks(limit = 50) {
  return controlPlaneRuntime.listSchedulerTicks(limit);
}

export function runSchedulerTick(options = {}) {
  return controlPlaneRuntime.recordSchedulerTick(options);
}
