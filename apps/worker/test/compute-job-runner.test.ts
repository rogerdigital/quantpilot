// @ts-nocheck

import assert from 'node:assert/strict';
import test from 'node:test';
import { ComputeJobStore } from '../../../packages/control-plane-store/src/compute-job-store.js';
import { backtestJobHandler } from '../src/job-handlers/backtest-job-handler.js';
import { dataQualityJobHandler } from '../src/job-handlers/data-quality-job-handler.js';
import { reportJobHandler } from '../src/job-handlers/report-job-handler.js';
import { runJobRunnerTask } from '../src/job-runner.js';

const workerConfig = {
  name: 'test-worker',
  intervalMs: 5000,
  once: true,
  notificationBatchSize: 20,
  riskScanBatchSize: 20,
  workflowBatchSize: 20,
  taskTimeoutMs: 10000,
  continueOnTaskFailure: true,
  jobRunner: {
    enabled: true,
    leaseDurationMs: 60_000,
    maxJobsPerTick: 5,
  },
};

function makeJob(overrides = {}) {
  return {
    id: overrides.id || 'job-1',
    type: overrides.type || 'backtest',
    status: 'queued',
    owner: 'researcher@desk',
    resource: {
      cpu: 4,
      memoryMb: 8192,
      gpuCount: 0,
      estimatedDurationMs: 300_000,
      priority: 'normal',
    },
    params: overrides.params || { strategyId: 'strat-1', window: '2y' },
    result: null,
    error: null,
    artifacts: [],
    logs: [],
    heartbeat: null,
    retrySafe: true,
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    leasedAt: null,
    leasedBy: null,
    leaseExpiresAt: null,
    timeoutMs: 600_000,
    ...overrides,
  };
}

test('job runner processes a queued backtest job to completion', async () => {
  const store = new ComputeJobStore();
  store.enqueue(makeJob());

  const result = await runJobRunnerTask(
    workerConfig,
    { store },
    {
      leaseDurationMs: 60_000,
      maxJobsPerTick: 5,
    }
  );

  assert.equal(result.ok, true);
  assert.equal(result.processed, 1);
  assert.equal(result.succeeded, 1);

  const job = store.get('job-1');
  assert.equal(job.status, 'succeeded');
  assert.ok(job.result.sharpe);
  assert.ok(job.artifacts.length > 0);
  assert.ok(job.logs.length > 0);
});

test('job runner processes data quality job', async () => {
  const store = new ComputeJobStore();
  store.enqueue(makeJob({ id: 'dq-1', type: 'data_quality', params: { datasetId: 'ds-1' } }));

  const result = await runJobRunnerTask(
    workerConfig,
    { store },
    {
      leaseDurationMs: 60_000,
      maxJobsPerTick: 5,
    }
  );

  assert.equal(result.succeeded, 1);
  const job = store.get('dq-1');
  assert.equal(job.status, 'succeeded');
  assert.equal(job.result.datasetId, 'ds-1');
});

test('job runner processes report job', async () => {
  const store = new ComputeJobStore();
  store.enqueue(makeJob({ id: 'rpt-1', type: 'report', params: { reportType: 'monthly' } }));

  const result = await runJobRunnerTask(
    workerConfig,
    { store },
    {
      leaseDurationMs: 60_000,
      maxJobsPerTick: 5,
    }
  );

  assert.equal(result.succeeded, 1);
  const job = store.get('rpt-1');
  assert.equal(job.status, 'succeeded');
  assert.equal(job.result.reportType, 'monthly');
});

test('job runner fails job with unknown handler type', async () => {
  const store = new ComputeJobStore();
  store.enqueue(makeJob({ id: 'unk-1', type: 'custom' }));

  const result = await runJobRunnerTask(
    workerConfig,
    { store },
    {
      leaseDurationMs: 60_000,
      maxJobsPerTick: 5,
    }
  );

  assert.equal(result.failed, 1);
  const job = store.get('unk-1');
  assert.equal(job.status, 'failed');
  assert.ok(job.error.includes('No handler'));
});

test('job runner processes multiple jobs sequentially in one tick', async () => {
  const store = new ComputeJobStore();
  store.enqueue(makeJob({ id: 'j1', type: 'backtest' }));
  store.enqueue(makeJob({ id: 'j2', type: 'data_quality', params: { datasetId: 'ds-2' } }));
  store.enqueue(makeJob({ id: 'j3', type: 'report', params: { reportType: 'weekly' } }));

  const result = await runJobRunnerTask(
    workerConfig,
    { store },
    {
      leaseDurationMs: 60_000,
      maxJobsPerTick: 5,
    }
  );

  assert.equal(result.processed, 3);
  assert.equal(result.succeeded, 3);
  assert.equal(store.get('j1').status, 'succeeded');
  assert.equal(store.get('j2').status, 'succeeded');
  assert.equal(store.get('j3').status, 'succeeded');
});

test('job runner respects maxJobsPerTick limit', async () => {
  const store = new ComputeJobStore();
  store.enqueue(makeJob({ id: 'j1' }));
  store.enqueue(makeJob({ id: 'j2' }));
  store.enqueue(makeJob({ id: 'j3' }));

  const result = await runJobRunnerTask(
    workerConfig,
    { store },
    {
      leaseDurationMs: 60_000,
      maxJobsPerTick: 1,
    }
  );

  assert.equal(result.processed, 1);
  assert.equal(store.get('j1').status, 'succeeded');
  assert.equal(store.get('j2').status, 'queued');
  assert.equal(store.get('j3').status, 'queued');
});

test('job runner stops on failure when continueOnTaskFailure is false', async () => {
  const store = new ComputeJobStore();
  store.enqueue(makeJob({ id: 'j1', type: 'custom' }));
  store.enqueue(makeJob({ id: 'j2', type: 'backtest' }));

  const strictConfig = { ...workerConfig, continueOnTaskFailure: false };
  const result = await runJobRunnerTask(
    strictConfig,
    { store },
    {
      leaseDurationMs: 60_000,
      maxJobsPerTick: 5,
    }
  );

  assert.equal(result.processed, 1);
  assert.equal(result.failed, 1);
  assert.equal(store.get('j2').status, 'queued');
});

test('job runner recovers expired leases before processing', async () => {
  const store = new ComputeJobStore();
  store.enqueue(makeJob({ id: 'expired-1' }));
  store.lease('expired-1', 'dead-worker', 1);

  const wait = Date.now() + 5;
  while (Date.now() < wait) {
    /* spin */
  }

  const result = await runJobRunnerTask(
    workerConfig,
    { store },
    {
      leaseDurationMs: 60_000,
      maxJobsPerTick: 5,
    }
  );

  assert.equal(result.succeeded, 1);
  assert.equal(store.get('expired-1').status, 'succeeded');
});

test('job runner records heartbeat progress during execution', async () => {
  const store = new ComputeJobStore();
  store.enqueue(makeJob({ id: 'hb-1' }));

  await runJobRunnerTask(
    workerConfig,
    { store },
    {
      leaseDurationMs: 60_000,
      maxJobsPerTick: 5,
    }
  );

  const job = store.get('hb-1');
  assert.equal(job.status, 'succeeded');
  assert.equal(job.heartbeat.progress, 1.0);
  assert.equal(job.heartbeat.workerId, 'test-worker');
});

test('job runner handles handler exceptions gracefully', async () => {
  const failingHandler = {
    type: 'backtest',
    concurrencySafe: false,
    async run() {
      throw new Error('Simulated crash');
    },
  };

  const store = new ComputeJobStore();
  store.enqueue(makeJob({ id: 'crash-1' }));

  const result = await runJobRunnerTask(
    workerConfig,
    {
      store,
      handlers: [failingHandler, dataQualityJobHandler, reportJobHandler],
    },
    {
      leaseDurationMs: 60_000,
      maxJobsPerTick: 5,
    }
  );

  assert.equal(result.failed, 1);
  const job = store.get('crash-1');
  assert.equal(job.status, 'failed');
  assert.equal(job.error, 'Simulated crash');
});
