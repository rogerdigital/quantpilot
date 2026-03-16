import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';

export function recordAction(payload) {
  return controlPlaneRuntime.recordOperatorAction(payload);
}

function parseLimit(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveSince(hours) {
  const parsed = Number(hours);
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  return new Date(Date.now() - parsed * 60 * 60 * 1000).toISOString();
}

export function listActions(options = {}) {
  return controlPlaneRuntime.listOperatorActions(parseLimit(options.limit, 50), {
    level: options.level || '',
    since: resolveSince(options.hours),
  });
}
