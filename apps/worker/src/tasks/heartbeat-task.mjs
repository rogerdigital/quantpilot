export async function runHeartbeatTask(config) {
  return {
    worker: config.name,
    kind: 'heartbeat',
    timestamp: new Date().toISOString(),
    summary: 'Worker skeleton is online. Queue-backed tasks will be moved here in later rounds.',
  };
}
