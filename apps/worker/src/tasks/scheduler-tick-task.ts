// @ts-nocheck
import { controlPlaneRuntime } from '../../../../packages/control-plane-runtime/src/index.js';

export async function runSchedulerTickTask(config, dependencies = {}) {
  const recordSchedulerTick =
    dependencies.runSchedulerTick || controlPlaneRuntime.recordSchedulerTick;
  const result = recordSchedulerTick({
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
