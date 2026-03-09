import {
  appendAuditRecord as appendStoredAuditRecord,
  listAuditRecords as listStoredAuditRecords,
} from '../../../../../packages/control-plane-store/src/index.mjs';

export function listAuditRecords(limit = 50) {
  return listStoredAuditRecords(limit);
}

export function appendAuditRecord(record) {
  return appendStoredAuditRecord(record);
}
