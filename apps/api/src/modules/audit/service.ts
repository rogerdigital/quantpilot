// @ts-nocheck
import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.js';

function parseLimit(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveSince(hours) {
  const parsed = Number(hours);
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  return new Date(Date.now() - parsed * 60 * 60 * 1000).toISOString();
}

export function listAuditRecords(options = {}) {
  return controlPlaneRuntime.listAuditRecords(parseLimit(options.limit, 50), {
    type: options.type || '',
    since: resolveSince(options.hours),
  });
}

export function appendAuditRecord(record) {
  return controlPlaneRuntime.appendAuditRecord(record);
}
