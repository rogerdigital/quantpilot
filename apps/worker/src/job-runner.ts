import { randomUUID } from 'node:crypto';
import { ComputeJobStore } from '../../../packages/control-plane-store/src/compute-job-store.js';
import type { WorkerConfig } from './config.js';
import { backtestJobHandler } from './job-handlers/backtest-job-handler.js';
import { dataQualityJobHandler } from './job-handlers/data-quality-job-handler.js';
import { reportJobHandler } from './job-handlers/report-job-handler.js';
import type { JobHandler, JobHandlerContext } from './job-handlers/types.js';

const DEFAULT_HANDLERS: JobHandler[] = [
  backtestJobHandler,
  dataQualityJobHandler,
  reportJobHandler,
];

export type JobRunnerConfig = {
  leaseDurationMs: number;
  maxJobsPerTick: number;
};

export type JobRunnerDependencies = {
  store?: ComputeJobStore;
  handlers?: JobHandler[];
};

const defaultJobRunnerConfig: JobRunnerConfig = {
  leaseDurationMs: 300_000,
  maxJobsPerTick: 1,
};

let sharedStore: ComputeJobStore | null = null;

export function getComputeJobStore(): ComputeJobStore {
  if (!sharedStore) {
    sharedStore = new ComputeJobStore();
  }
  return sharedStore;
}

export function resetComputeJobStore(store?: ComputeJobStore): void {
  sharedStore = store || null;
}

export async function runJobRunnerTask(
  workerConfig: WorkerConfig,
  dependencies: JobRunnerDependencies = {},
  runnerConfig: JobRunnerConfig = defaultJobRunnerConfig
) {
  const store = dependencies.store || getComputeJobStore();
  const handlers = dependencies.handlers || DEFAULT_HANDLERS;
  const handlerMap = new Map(handlers.map((h) => [h.type, h]));

  store.recoverExpiredLeases();

  const queued = store.listByStatus('queued');
  const toProcess = queued.slice(0, runnerConfig.maxJobsPerTick);

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const job of toProcess) {
    const handler = handlerMap.get(job.type);
    if (!handler) {
      const leased = store.lease(job.id, workerConfig.name, runnerConfig.leaseDurationMs);
      if (leased) {
        store.fail(job.id, `No handler registered for job type: ${job.type}`);
      }
      failed++;
      processed++;
      if (!workerConfig.continueOnTaskFailure) break;
      continue;
    }

    const leased = store.lease(job.id, workerConfig.name, runnerConfig.leaseDurationMs);
    if (!leased) continue;

    store.start(job.id);

    const context: JobHandlerContext = {
      appendLog(level, message, metadata) {
        store.appendLog(job.id, {
          id: `log-${randomUUID()}`,
          jobId: job.id,
          level: level as 'debug' | 'info' | 'warn' | 'error',
          message,
          timestamp: new Date().toISOString(),
          metadata,
        });
      },
      attachArtifact(artifact) {
        store.attachArtifact(job.id, {
          id: `art-${randomUUID()}`,
          jobId: job.id,
          name: artifact.name,
          mimeType: artifact.mimeType,
          sizeBytes: artifact.sizeBytes,
          path: artifact.path,
          createdAt: new Date().toISOString(),
        });
      },
      reportProgress(progress, message) {
        store.heartbeat(job.id, {
          workerId: workerConfig.name,
          jobId: job.id,
          progress,
          message,
          timestamp: new Date().toISOString(),
        });
      },
    };

    const timeoutMs = job.timeoutMs || workerConfig.taskTimeoutMs;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<'timeout'>((resolve) => {
      timeoutId = setTimeout(() => resolve('timeout'), timeoutMs);
    });

    try {
      const raceResult = await Promise.race([handler.run(job, context), timeoutPromise]);

      if (raceResult === 'timeout') {
        store.timeout(job.id);
        failed++;
      } else if (raceResult.ok) {
        store.complete(job.id, raceResult.result || {});
        succeeded++;
      } else {
        store.fail(job.id, raceResult.error || 'Handler returned failure');
        failed++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      store.fail(job.id, message);
      failed++;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    processed++;

    if (!workerConfig.continueOnTaskFailure && failed > 0) break;
  }

  return {
    worker: workerConfig.name,
    kind: 'compute-job-runner',
    timestamp: new Date().toISOString(),
    summary: `Processed ${processed} jobs (${succeeded} succeeded, ${failed} failed)`,
    ok: failed === 0,
    processed,
    succeeded,
    failed,
  };
}
