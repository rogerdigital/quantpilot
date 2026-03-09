function readNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function readWorkerConfig() {
  return {
    name: process.env.QUANTPILOT_WORKER_NAME || 'quantpilot-task-worker',
    intervalMs: readNumber(process.env.QUANTPILOT_WORKER_INTERVAL_MS, 15000),
    once: process.env.QUANTPILOT_WORKER_ONCE === '1',
    notificationBatchSize: readNumber(process.env.QUANTPILOT_WORKER_NOTIFICATION_BATCH, 20),
  };
}
