import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.mjs';

export function listAuditRecords(limit = 50) {
  return controlPlaneRuntime.listAuditRecords(limit);
}

export function appendAuditRecord(record) {
  return controlPlaneRuntime.appendAuditRecord(record);
}
