// @ts-nocheck
import { readWorkerConfig } from '../config.js';
import { runHeartbeatTask } from '../tasks/heartbeat-task.js';
import { runMonitoringScanTask } from '../tasks/monitoring-scan-task.js';
import { runNotificationDispatchTask } from '../tasks/notification-dispatch-task.js';
import { runRiskScanTask } from '../tasks/risk-scan-task.js';
import { runSchedulerTickTask } from '../tasks/scheduler-tick-task.js';
import { runWorkflowExecutionTask } from '../tasks/workflow-execution-task.js';
import { runWorkflowMaintenanceTask } from '../tasks/workflow-maintenance-task.js';

async function runTick(config) {
  const results = [
    await runWorkflowMaintenanceTask(config),
    await runWorkflowExecutionTask(config),
    await runSchedulerTickTask(config),
    await runRiskScanTask(config),
    await runHeartbeatTask(config),
    await runMonitoringScanTask(config),
    await runNotificationDispatchTask(config),
  ];
  results.forEach((result) => {
    console.info(`[worker:${result.worker}] ${result.kind} ${result.timestamp} ${result.summary}`);
  });
  return results;
}

export async function startWorker() {
  const config = readWorkerConfig();
  console.info(`[worker:${config.name}] starting with interval ${config.intervalMs}ms`);
  await runTick(config);
  if (config.once) {
    console.info(`[worker:${config.name}] exiting after single tick`);
    return;
  }

  setInterval(() => {
    runTick(config).catch((error) => {
      console.error(`[worker:${config.name}] tick failed`, error);
    });
  }, config.intervalMs);
}
