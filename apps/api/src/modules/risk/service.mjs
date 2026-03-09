import {
  dispatchPendingRiskScans,
  enqueueRiskScan,
  listRiskEvents as listStoredRiskEvents,
  listRiskScanJobs,
} from '../../../../../packages/control-plane-store/src/index.mjs';

export function listRiskEvents(limit = 50) {
  return listStoredRiskEvents(limit);
}

export function queueRiskScan(payload) {
  return enqueueRiskScan(payload);
}

export function listQueuedRiskScans(limit = 50) {
  return listRiskScanJobs(limit);
}

export function flushQueuedRiskScans(options = {}) {
  return dispatchPendingRiskScans(options);
}
