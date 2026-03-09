import { runSchedulerTick } from '../../../api/src/modules/scheduler/service.mjs';

export async function runSchedulerTickTask(config) {
  const result = runSchedulerTick({
    worker: config.name,
  });
  return {
    worker: config.name,
    kind: 'scheduler-tick',
    timestamp: new Date().toISOString(),
    summary: result.emitted
      ? `Scheduler recorded ${result.phase} tick.`
      : `Scheduler stayed in ${result.phase} without a new bucket event.`,
    emitted: result.emitted,
    phase: result.phase,
  };
}
