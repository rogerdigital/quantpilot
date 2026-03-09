const auditRecords = [];

export function listAuditRecords(limit = 50) {
  return auditRecords.slice(0, limit);
}

export function appendAuditRecord(record) {
  const entry = {
    id: `audit-${Date.now()}-${auditRecords.length + 1}`,
    type: record.type || 'system',
    actor: record.actor || 'system',
    title: record.title || 'Untitled audit event',
    detail: record.detail || '',
    createdAt: record.createdAt || new Date().toISOString(),
    metadata: record.metadata || {},
  };
  auditRecords.unshift(entry);
  auditRecords.splice(100);
  return entry;
}
