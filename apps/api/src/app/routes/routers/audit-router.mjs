import { appendAuditRecord, listAuditRecords } from '../../../modules/audit/service.mjs';

export async function handleAuditRoutes({ req, reqUrl, res, readJsonBody, writeJson }) {
  if (req.method === 'GET' && reqUrl.pathname === '/api/audit/records') {
    writeJson(res, 200, {
      ok: true,
      records: listAuditRecords({
        limit: reqUrl.searchParams.get('limit'),
        type: reqUrl.searchParams.get('type'),
        hours: reqUrl.searchParams.get('hours'),
      }),
    });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/audit/records') {
    const body = await readJsonBody(req);
    writeJson(res, 200, { ok: true, record: appendAuditRecord(body) });
    return true;
  }

  return false;
}
