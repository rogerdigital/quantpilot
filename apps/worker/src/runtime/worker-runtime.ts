import { readWorkerConfig, type WorkerConfig } from '../config.js';
import { runJobRunnerTask } from '../job-runner.js';
import { runHeartbeatTask } from '../tasks/heartbeat-task.js';
import { runMonitoringScanTask } from '../tasks/monitoring-scan-task.js';
import { runNotificationDispatchTask } from '../tasks/notification-dispatch-task.js';
import { runRiskScanTask } from '../tasks/risk-scan-task.js';
import { runSchedulerTickTask } from '../tasks/scheduler-tick-task.js';
import { runWorkflowExecutionTask } from '../tasks/workflow-execution-task.js';
import { runWorkflowMaintenanceTask } from '../tasks/workflow-maintenance-task.js';

export type WorkerTaskResult = {
  worker: string;
  kind: string;
  timestamp: string;
  summary: string;
  ok?: boolean;
};

export type WorkerTaskEntry = {
  kind: string;
  run: () => Promise<WorkerTaskResult>;
};

function createDefaultTaskEntries(config: WorkerConfig): WorkerTaskEntry[] {
  const entries: WorkerTaskEntry[] = [
    { kind: 'workflow-maintenance', run: () => runWorkflowMaintenanceTask(config) },
    { kind: 'workflow-execution', run: () => runWorkflowExecutionTask(config) },
    { kind: 'scheduler-tick', run: () => runSchedulerTickTask(config) },
    { kind: 'risk-scan', run: () => runRiskScanTask(config) },
    { kind: 'heartbeat', run: () => runHeartbeatTask(config) },
    { kind: 'monitoring-scan', run: () => runMonitoringScanTask(config) },
    { kind: 'notification-dispatch', run: () => runNotificationDispatchTask(config) },
  ];
  if (config.jobRunner.enabled) {
    entries.push({
      kind: 'compute-job-runner',
      run: () =>
        runJobRunnerTask(
          config,
          {},
          {
            leaseDurationMs: config.jobRunner.leaseDurationMs,
            maxJobsPerTick: config.jobRunner.maxJobsPerTick,
          }
        ),
    });
  }
  return entries;
}

function failureResult(config: WorkerConfig, kind: string, summary: string): WorkerTaskResult {
  return {
    worker: config.name,
    kind,
    timestamp: new Date().toISOString(),
    summary,
    ok: false,
  };
}

export async function runTaskWithTimeout(
  entry: WorkerTaskEntry,
  config: WorkerConfig
): Promise<WorkerTaskResult> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<WorkerTaskResult>((resolve) => {
    timeoutId = setTimeout(() => {
      resolve(failureResult(config, entry.kind, `Task timed out after ${config.taskTimeoutMs}ms`));
    }, config.taskTimeoutMs);
  });

  try {
    const result = await Promise.race([entry.run(), timeout]);
    return { ...result, ok: result.ok !== false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown worker task failure';
    return failureResult(config, entry.kind, message);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function runTick(
  config: WorkerConfig,
  taskEntries: WorkerTaskEntry[] = createDefaultTaskEntries(config)
): Promise<WorkerTaskResult[]> {
  const results: WorkerTaskResult[] = [];

  for (const entry of taskEntries) {
    const result = await runTaskWithTimeout(entry, config);
    results.push(result);
    if (result.ok === false && !config.continueOnTaskFailure) break;
  }

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
