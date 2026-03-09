import {
  listSchedulerTicks as listStoredSchedulerTicks,
  recordSchedulerTick,
} from '../../../../../packages/control-plane-store/src/index.mjs';

export function listSchedulerTicks(limit = 50) {
  return listStoredSchedulerTicks(limit);
}

export function runSchedulerTick(options = {}) {
  return recordSchedulerTick(options);
}
