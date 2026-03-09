import { flushQueuedRiskScans } from '../../../api/src/modules/risk/service.mjs';

export async function runRiskScanTask(config, dependencies = {}) {
  const flushRiskScans = dependencies.flushQueuedRiskScans || flushQueuedRiskScans;
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
