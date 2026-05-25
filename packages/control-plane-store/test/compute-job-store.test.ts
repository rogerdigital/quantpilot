import assert from 'node:assert/strict';
import test from 'node:test';

import type {
  ComputeArtifact,
  ComputeJob,
  ComputeJobLogEvent,
  ComputeWorkerHeartbeat,
} from '../../shared-types/src/compute.ts';
import { ComputeJobStore } from '../src/compute-job-store.js';

function makeJob(overrides: Partial<ComputeJob> = {}): ComputeJob {
  return {
    id: overrides.id || 'job-1',
    type: 'backtest',
    status: 'queued',
    owner: 'researcher@desk',
    resource: {
      cpu: 4,
      memoryMb: 8192,
      gpuCount: 0,
      estimatedDurationMs: 300_000,
      priority: 'normal',
    },
    params: { strategyId: 'strat-1' },
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

test('ComputeJobStore: enqueue and retrieve', () => {
  const store = new ComputeJobStore();
  const job = store.enqueue(makeJob());
  assert.equal(job.status, 'queued');
  const retrieved = store.get('job-1');
  assert.equal(retrieved?.id, 'job-1');
});

test('ComputeJobStore: list and listByStatus', () => {
  const store = new ComputeJobStore();
  store.enqueue(makeJob({ id: 'j1' }));
  store.enqueue(makeJob({ id: 'j2' }));
  assert.equal(store.list().length, 2);
  assert.equal(store.listByStatus('queued').length, 2);
  assert.equal(store.listByStatus('running').length, 0);
});

test('ComputeJobStore: lease job', () => {
  const store = new ComputeJobStore();
  store.enqueue(makeJob());
  const leased = store.lease('job-1', 'worker-1', 60_000);
  assert.equal(leased?.status, 'leased');
  assert.equal(leased?.leasedBy, 'worker-1');
  assert.ok(leased?.leaseExpiresAt);
});

test('ComputeJobStore: lease rejects non-queued job', () => {
  const store = new ComputeJobStore();
  store.enqueue(makeJob());
  store.lease('job-1', 'worker-1', 60_000);
  const second = store.lease('job-1', 'worker-2', 60_000);
  assert.equal(second, null);
});

test('ComputeJobStore: start transitions leased to running', () => {
  const store = new ComputeJobStore();
  store.enqueue(makeJob());
  store.lease('job-1', 'worker-1', 60_000);
  const running = store.start('job-1');
  assert.equal(running?.status, 'running');
  assert.ok(running?.startedAt);
});

test('ComputeJobStore: heartbeat updates running job', () => {
  const store = new ComputeJobStore();
  store.enqueue(makeJob());
  store.lease('job-1', 'worker-1', 60_000);
  store.start('job-1');
  const hb: ComputeWorkerHeartbeat = {
    workerId: 'worker-1',
    jobId: 'job-1',
    progress: 0.5,
    message: '50%',
    timestamp: new Date().toISOString(),
  };
  const updated = store.heartbeat('job-1', hb);
  assert.equal(updated?.heartbeat?.progress, 0.5);
});

test('ComputeJobStore: append log', () => {
  const store = new ComputeJobStore();
  store.enqueue(makeJob());
  const log: ComputeJobLogEvent = {
    id: 'log-1',
    jobId: 'job-1',
    level: 'info',
    message: 'Starting',
    timestamp: new Date().toISOString(),
  };
  const updated = store.appendLog('job-1', log);
  assert.equal(updated?.logs.length, 1);
  assert.equal(updated?.logs[0].message, 'Starting');
});

test('ComputeJobStore: attach artifact', () => {
  const store = new ComputeJobStore();
  store.enqueue(makeJob());
  const artifact: ComputeArtifact = {
    id: 'art-1',
    jobId: 'job-1',
    name: 'report.json',
    mimeType: 'application/json',
    sizeBytes: 1024,
    path: '/artifacts/report.json',
    createdAt: new Date().toISOString(),
  };
  const updated = store.attachArtifact('job-1', artifact);
  assert.equal(updated?.artifacts.length, 1);
  assert.equal(updated?.artifacts[0].name, 'report.json');
});

test('ComputeJobStore: mark completion', () => {
  const store = new ComputeJobStore();
  store.enqueue(makeJob());
  store.lease('job-1', 'worker-1', 60_000);
  store.start('job-1');
  const completed = store.complete('job-1', { sharpe: 1.5 });
  assert.equal(completed?.status, 'succeeded');
  assert.deepEqual(completed?.result, { sharpe: 1.5 });
  assert.ok(completed?.completedAt);
});

test('ComputeJobStore: mark failure', () => {
  const store = new ComputeJobStore();
  store.enqueue(makeJob());
  store.lease('job-1', 'worker-1', 60_000);
  store.start('job-1');
  const failed = store.fail('job-1', 'OOM killed');
  assert.equal(failed?.status, 'failed');
  assert.equal(failed?.error, 'OOM killed');
});

test('ComputeJobStore: mark timeout', () => {
  const store = new ComputeJobStore();
  store.enqueue(makeJob());
  store.lease('job-1', 'worker-1', 60_000);
  store.start('job-1');
  const timedOut = store.timeout('job-1');
  assert.equal(timedOut?.status, 'timeout');
});

test('ComputeJobStore: cancel queued job', () => {
  const store = new ComputeJobStore();
  store.enqueue(makeJob());
  const cancelled = store.cancel('job-1');
  assert.equal(cancelled?.status, 'cancelled');
});

test('ComputeJobStore: expired lease can be recovered', () => {
  const store = new ComputeJobStore();
  store.enqueue(makeJob());
  store.lease('job-1', 'worker-1', 1);

  const before = store.recoverExpiredLeases();
  assert.equal(before.length, 0);

  const wait = Date.now() + 50;
  while (Date.now() < wait) {
    /* spin */
  }

  const recovered = store.recoverExpiredLeases();
  assert.equal(recovered.length, 1);
  assert.equal(recovered[0].status, 'queued');
  assert.equal(recovered[0].leasedBy, null);
  assert.equal(recovered[0].leaseExpiresAt, null);

  const reLease = store.lease('job-1', 'worker-2', 60_000);
  assert.equal(reLease?.leasedBy, 'worker-2');
});
