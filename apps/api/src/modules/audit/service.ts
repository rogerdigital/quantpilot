import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.js';

function parseLimit(value: any, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveSince(hours: any): string {
  const parsed = Number(hours);
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  return new Date(Date.now() - parsed * 60 * 60 * 1000).toISOString();
}

export function listAuditRecords(options: Record<string, any> = {}) {
  return controlPlaneRuntime.listAuditRecords(parseLimit(options.limit, 50), {
    type: options.type || '',
    since: resolveSince(options.hours),
  });
}

export function appendAuditRecord(record: any) {
  return controlPlaneRuntime.appendAuditRecord(record);
}
