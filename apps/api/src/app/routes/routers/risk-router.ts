import { hasPermission } from '../../../modules/auth/service.js';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.js';
import { getRiskEvent, listRiskEvents } from '../../../domains/risk/services/feed-service.js';
import { runRiskPolicyAction } from '../../../domains/risk/services/policy-action-service.js';
import { getRiskWorkbench } from '../../../domains/risk/services/workbench-service.js';

export async function handleRiskRoutes({ req, reqUrl, res, readJsonBody, writeJson }) {
  const writeForbidden = (permission, action = '') => writeForbiddenJson(writeJson, res, permission, action);

  if (req.method === 'GET' && reqUrl.pathname === '/api/risk/events') {
    writeJson(res, 200, { ok: true, events: listRiskEvents() });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/risk/workbench') {
    writeJson(res, 200, getRiskWorkbench({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
    }));
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/risk/actions') {
    if (!hasPermission('risk:review')) { writeForbidden('risk:review', 'run risk policy actions'); return true; }
    const body = await readJsonBody(req);
    const result = runRiskPolicyAction(body);
    writeJson(res, result?.ok === false ? 400 : 200, result);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/risk/events/')) {
    const eventId = reqUrl.pathname.split('/').at(-1);
    const event = getRiskEvent(eventId);
    writeJson(res, event ? 200 : 404, event
      ? { ok: true, event }
      : { ok: false, message: 'risk event not found' });
    return true;
  }

  return false;
}
