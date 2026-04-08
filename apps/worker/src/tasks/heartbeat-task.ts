// @ts-nocheck
import { controlPlaneRuntime } from '../../../../packages/control-plane-runtime/src/index.js';

export async function runHeartbeatTask(config, dependencies = {}) {
  const recordWorkerHeartbeat = dependencies.recordWorkerHeartbeat || controlPlaneRuntime.recordWorkerHeartbeat;
  const heartbeat = recordWorkerHeartbeat({
    worker: config.name,
    kind: 'heartbeat',
    summary: 'Worker skeleton is online. Queue-backed tasks will be moved here in later rounds.',
    metadata: {
      intervalMs: Number(config.intervalMs || 0),
      once: Boolean(config.once),
    },
  });
  return {
    worker: config.name,
    kind: 'heartbeat',
    timestamp: heartbeat.createdAt,
    summary: heartbeat.summary,
    heartbeat,
  };
}
