import assert from 'node:assert/strict';
import test from 'node:test';

import type {
  ComputeArtifact,
  ComputeJob,
  ComputeJobLogEvent,
  ComputeQueue,
  ComputeResourceRequest,
  ComputeWorkerHeartbeat,
} from '../../shared-types/src/compute.ts';

test('ComputeJob: can construct a valid job record', () => {
  const resource: ComputeResourceRequest = {
    cpu: 4,
    memoryMb: 8192,
    gpuCount: 0,
    estimatedDurationMs: 300_000,
    priority: 'normal',
  };
  const job: ComputeJob = {
    id: 'job-1',
    type: 'backtest',
    status: 'queued',
    owner: 'researcher@desk',
    workspaceId: 'ws-1',
    linkedEntityId: 'bt-run-1',
    linkedEntityType: 'backtest',
    resource,
    params: { strategyId: 'strat-1', window: '2y' },
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
  };
  assert.equal(job.status, 'queued');
  assert.equal(job.type, 'backtest');
  assert.equal(job.resource.priority, 'normal');
  assert.equal(job.linkedEntityType, 'backtest');
});

test('ComputeResourceRequest: supports GPU and priority', () => {
  const resource: ComputeResourceRequest = {
    cpu: 8,
    memoryMb: 32768,
    gpuCount: 2,
    estimatedDurationMs: 1_800_000,
    priority: 'high',
  };
  assert.equal(resource.gpuCount, 2);
  assert.equal(resource.priority, 'high');
});

test('ComputeArtifact: valid artifact record', () => {
  const artifact: ComputeArtifact = {
    id: 'art-1',
    jobId: 'job-1',
    name: 'backtest-report.json',
    mimeType: 'application/json',
    sizeBytes: 4096,
    path: '/artifacts/job-1/backtest-report.json',
    createdAt: new Date().toISOString(),
  };
  assert.equal(artifact.jobId, 'job-1');
  assert.equal(artifact.mimeType, 'application/json');
});

test('ComputeJobLogEvent: append-only log entry', () => {
  const log: ComputeJobLogEvent = {
    id: 'log-1',
    jobId: 'job-1',
    level: 'info',
    message: 'Starting backtest run',
    timestamp: new Date().toISOString(),
    metadata: { step: 'init' },
  };
  assert.equal(log.level, 'info');
  assert.equal(log.metadata?.step, 'init');
});

test('ComputeWorkerHeartbeat: valid heartbeat', () => {
  const heartbeat: ComputeWorkerHeartbeat = {
    workerId: 'worker-1',
    jobId: 'job-1',
    progress: 0.45,
    message: '45% complete',
    timestamp: new Date().toISOString(),
  };
  assert.equal(heartbeat.progress, 0.45);
  assert.equal(heartbeat.workerId, 'worker-1');
});

test('ComputeQueue: valid queue state', () => {
  const queue: ComputeQueue = {
    id: 'queue-main',
    name: 'default',
    maxConcurrency: 4,
    activeJobs: 2,
    queuedJobs: 5,
    totalCompleted: 100,
    totalFailed: 3,
  };
  assert.equal(queue.maxConcurrency, 4);
  assert.equal(queue.activeJobs, 2);
});

test('ComputeJob: links to research and model entities', () => {
  const job: ComputeJob = {
    id: 'job-2',
    type: 'model_training',
    status: 'running',
    owner: 'ml@desk',
    linkedEntityId: 'model-1',
    linkedEntityType: 'model',
    resource: {
      cpu: 8,
      memoryMb: 16384,
      gpuCount: 1,
      estimatedDurationMs: 3_600_000,
      priority: 'high',
    },
    params: { epochs: 100 },
    result: null,
    error: null,
    artifacts: [],
    logs: [],
    heartbeat: {
      workerId: 'gpu-worker-1',
      jobId: 'job-2',
      progress: 0.1,
      message: 'Epoch 10/100',
      timestamp: new Date().toISOString(),
    },
    retrySafe: false,
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    completedAt: null,
    leasedAt: new Date().toISOString(),
    leasedBy: 'gpu-worker-1',
    leaseExpiresAt: new Date(Date.now() + 600_000).toISOString(),
    timeoutMs: 7_200_000,
  };
  assert.equal(job.linkedEntityType, 'model');
  assert.equal(job.heartbeat?.progress, 0.1);
  assert.equal(job.retrySafe, false);
});
