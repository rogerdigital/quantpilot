import { controlPlaneRuntime } from '../../../../packages/control-plane-runtime/src/index.js';

export async function runRiskScanTask(config, dependencies = {}) {
  const flushRiskScans = dependencies.flushQueuedRiskScans || controlPlaneRuntime.dispatchPendingRiskScans;
  const result = flushRiskScans({
    worker: config.name,
    limit: config.riskScanBatchSize,
  });
  return {
    worker: config.name,
    kind: 'risk-scan',
    timestamp: new Date().toISOString(),
    summary: result.dispatchedCount
      ? `Processed ${result.dispatchedCount} risk scan jobs.`
      : 'No pending risk scan jobs.',
    dispatchedCount: result.dispatchedCount,
  };
}
