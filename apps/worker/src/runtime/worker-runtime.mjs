import { readWorkerConfig } from '../config.mjs';
import { runHeartbeatTask } from '../tasks/heartbeat-task.mjs';
import { runNotificationDispatchTask } from '../tasks/notification-dispatch-task.mjs';
import { runRiskScanTask } from '../tasks/risk-scan-task.mjs';
import { runSchedulerTickTask } from '../tasks/scheduler-tick-task.mjs';
import { runWorkflowExecutionTask } from '../tasks/workflow-execution-task.mjs';
import { runWorkflowMaintenanceTask } from '../tasks/workflow-maintenance-task.mjs';

async function runTick(config) {
  const results = [
    await runWorkflowMaintenanceTask(config),
    await runWorkflowExecutionTask(config),
    await runSchedulerTickTask(config),
    await runRiskScanTask(config),
    await runNotificationDispatchTask(config),
    await runHeartbeatTask(config),
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
