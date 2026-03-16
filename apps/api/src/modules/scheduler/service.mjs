import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.mjs';

function parseLimit(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveSince(hours) {
  const parsed = Number(hours);
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  return new Date(Date.now() - parsed * 60 * 60 * 1000).toISOString();
}

export function listSchedulerTicks(options = {}) {
  return controlPlaneRuntime.listSchedulerTicks(parseLimit(options.limit, 50), {
    phase: options.phase || '',
    since: resolveSince(options.hours),
  });
}

export function runSchedulerTick(options = {}) {
  return controlPlaneRuntime.recordSchedulerTick(options);
}
