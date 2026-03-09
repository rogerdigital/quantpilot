import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.mjs';

export function listRiskEvents(limit = 50) {
  return controlPlaneRuntime.listRiskEvents(limit);
}

export function queueRiskScan(payload) {
  return controlPlaneRuntime.enqueueRiskScan(payload);
}

export function listQueuedRiskScans(limit = 50) {
  return controlPlaneRuntime.listRiskScanJobs(limit);
}

export function flushQueuedRiskScans(options = {}) {
  return controlPlaneRuntime.dispatchPendingRiskScans(options);
}
