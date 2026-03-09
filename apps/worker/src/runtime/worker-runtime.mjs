import { readWorkerConfig } from '../config.mjs';
import { runHeartbeatTask } from '../tasks/heartbeat-task.mjs';

async function runTick(config) {
  const result = await runHeartbeatTask(config);
  console.info(`[worker:${result.worker}] ${result.kind} ${result.timestamp} ${result.summary}`);
  return result;
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
