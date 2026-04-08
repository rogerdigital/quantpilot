import { recordMonitoringStatusSnapshot } from '../../../api/src/modules/monitoring/service.js';

export async function runMonitoringScanTask(config, dependencies = {}) {
  const scanMonitoring = dependencies.recordMonitoringSnapshot || recordMonitoringStatusSnapshot;
  const result = await scanMonitoring({
    getBrokerHealth: dependencies.getBrokerHealth,
  });

  return {
    worker: config.name,
    kind: 'monitoring-scan',
    timestamp: result.generatedAt || new Date().toISOString(),
    summary: result.alerts?.length
      ? `Recorded monitoring snapshot with ${result.alerts.length} active alerts.`
      : 'Recorded monitoring snapshot without active alerts.',
    alertCount: result.alerts?.length || 0,
    snapshot: result.snapshot,
  };
}
