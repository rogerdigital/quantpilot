export type WorkerConfig = {
  name: string;
  intervalMs: number;
  once: boolean;
  notificationBatchSize: number;
  riskScanBatchSize: number;
  workflowBatchSize: number;
  taskTimeoutMs: number;
  continueOnTaskFailure: boolean;
  jobRunner: {
    enabled: boolean;
    leaseDurationMs: number;
    maxJobsPerTick: number;
  };
};

function readNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function readWorkerConfig(): WorkerConfig {
  return {
    name: process.env.QUANTPILOT_WORKER_NAME || 'quantpilot-task-worker',
    intervalMs: readNumber(process.env.QUANTPILOT_WORKER_INTERVAL_MS, 15000),
    once: process.env.QUANTPILOT_WORKER_ONCE === '1',
    notificationBatchSize: readNumber(process.env.QUANTPILOT_WORKER_NOTIFICATION_BATCH, 20),
    riskScanBatchSize: readNumber(process.env.QUANTPILOT_WORKER_RISK_SCAN_BATCH, 20),
    workflowBatchSize: readNumber(process.env.QUANTPILOT_WORKER_WORKFLOW_BATCH, 20),
    taskTimeoutMs: readNumber(process.env.QUANTPILOT_WORKER_TASK_TIMEOUT_MS, 10000),
    continueOnTaskFailure: process.env.QUANTPILOT_WORKER_CONTINUE_ON_FAILURE !== '0',
    jobRunner: {
      enabled: process.env.QUANTPILOT_WORKER_JOB_RUNNER !== '0',
      leaseDurationMs: readNumber(process.env.QUANTPILOT_WORKER_JOB_LEASE_MS, 300_000),
      maxJobsPerTick: readNumber(process.env.QUANTPILOT_WORKER_JOB_MAX_PER_TICK, 1),
    },
  };
}
