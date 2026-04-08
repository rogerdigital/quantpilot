import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';

export function listCycles(limit = 30) {
  return controlPlaneRuntime.listCycleRecords(limit);
}

export function recordCycleRun(payload) {
  return controlPlaneRuntime.recordCycleRun(payload);
}
