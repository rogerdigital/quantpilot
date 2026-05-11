// @ts-nocheck
import { AuditReportStore } from '../../../../../../packages/control-plane-store/src/audit-report-store.js';

const auditReportStore = new AuditReportStore();

export { auditReportStore };

export async function handleComplianceRoutes({ req, reqUrl, res, readJsonBody, writeJson }) {
  if (req.method === 'POST' && reqUrl.pathname === '/api/compliance/reports') {
    const body = await readJsonBody(req);
    const { organizationId, reportType, title, summary, generatedBy, metadata } = body || {};

    if (!reportType || !title) {
      writeJson(res, 400, { ok: false, message: 'Missing reportType or title' });
      return true;
    }

    const validTypes = [
      'strategy_promotion',
      'live_trading_approval',
      'risk_breach',
      'execution_incident',
      'agent_action',
      'dataset_lineage',
    ];
    if (!validTypes.includes(reportType)) {
      writeJson(res, 400, {
        ok: false,
        message: `Invalid reportType. Must be one of: ${validTypes.join(', ')}`,
      });
      return true;
    }

    const now = new Date().toISOString();
    const report = auditReportStore.createReport({
      id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      organizationId: organizationId || 'default',
      reportType,
      title,
      summary: summary || '',
      generatedBy: generatedBy || 'system',
      status: 'draft',
      entries: [],
      createdAt: now,
      updatedAt: now,
      metadata: metadata || {},
    });

    writeJson(res, 201, { ok: true, report });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/compliance/reports') {
    const organizationId = reqUrl.searchParams.get('organizationId') || undefined;
    const reportType = reqUrl.searchParams.get('reportType') || undefined;
    const reports = auditReportStore.listReports(organizationId, reportType);
    writeJson(res, 200, { ok: true, reports });
    return true;
  }

  const reportMatch = reqUrl.pathname.match(/^\/api\/compliance\/reports\/([^/]+)$/);
  if (req.method === 'GET' && reportMatch) {
    const report = auditReportStore.getReport(reportMatch[1]);
    if (!report) {
      writeJson(res, 404, { ok: false, message: 'Report not found' });
      return true;
    }
    writeJson(res, 200, { ok: true, report });
    return true;
  }

  const entryMatch = reqUrl.pathname.match(/^\/api\/compliance\/reports\/([^/]+)\/entries$/);
  if (req.method === 'POST' && entryMatch) {
    const body = await readJsonBody(req);
    const { actor, action, detail, evidenceRef } = body || {};

    if (!actor || !action) {
      writeJson(res, 400, { ok: false, message: 'Missing actor or action' });
      return true;
    }

    const report = auditReportStore.appendEntry(entryMatch[1], {
      timestamp: new Date().toISOString(),
      actor,
      action,
      detail: detail || '',
      evidenceRef,
    });

    if (!report) {
      writeJson(res, 404, { ok: false, message: 'Report not found' });
      return true;
    }

    writeJson(res, 200, { ok: true, report });
    return true;
  }

  const finalizeMatch = reqUrl.pathname.match(/^\/api\/compliance\/reports\/([^/]+)\/finalize$/);
  if (req.method === 'POST' && finalizeMatch) {
    const report = auditReportStore.finalizeReport(finalizeMatch[1]);
    if (!report) {
      writeJson(res, 404, { ok: false, message: 'Report not found' });
      return true;
    }
    writeJson(res, 200, { ok: true, report });
    return true;
  }

  const exportMatch = reqUrl.pathname.match(/^\/api\/compliance\/reports\/([^/]+)\/export$/);
  if (req.method === 'POST' && exportMatch) {
    const report = auditReportStore.exportReport(exportMatch[1]);
    if (!report) {
      writeJson(res, 400, { ok: false, message: 'Report not found or not finalized' });
      return true;
    }
    writeJson(res, 200, { ok: true, report });
    return true;
  }

  return false;
}
