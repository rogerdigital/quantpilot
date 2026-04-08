import { appendIncidentNote, appendIncidentTask, bulkUpdateIncidents, createIncident, getIncidentDetail, getIncidentSummary, listIncidents, updateIncident, updateIncidentTask } from '../../../modules/incidents/service.js';

export async function handleIncidentsRoutes({ req, reqUrl, res, readJsonBody, writeJson }) {
  if (req.method === 'GET' && reqUrl.pathname === '/api/incidents') {
    writeJson(res, 200, {
      ok: true,
      incidents: listIncidents({
        limit: reqUrl.searchParams.get('limit'),
        owner: reqUrl.searchParams.get('owner'),
        severity: reqUrl.searchParams.get('severity'),
        source: reqUrl.searchParams.get('source'),
        status: reqUrl.searchParams.get('status'),
        hours: reqUrl.searchParams.get('hours'),
      }),
    });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/incidents/summary') {
    writeJson(res, 200, {
      ok: true,
      summary: getIncidentSummary({
        limit: reqUrl.searchParams.get('limit'),
        owner: reqUrl.searchParams.get('owner'),
        severity: reqUrl.searchParams.get('severity'),
        source: reqUrl.searchParams.get('source'),
        status: reqUrl.searchParams.get('status'),
        hours: reqUrl.searchParams.get('hours'),
      }),
    });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/incidents') {
    const body = await readJsonBody(req);
    writeJson(res, 200, { ok: true, incident: createIncident(body) });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/incidents/bulk') {
    const body = await readJsonBody(req);
    writeJson(res, 200, { ok: true, ...bulkUpdateIncidents(body) });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/incidents/')) {
    const parts = reqUrl.pathname.split('/').filter(Boolean);
    if (parts.length === 3) {
      const detail = getIncidentDetail(parts.at(-1), {
        activityLimit: reqUrl.searchParams.get('activityLimit'),
        noteLimit: reqUrl.searchParams.get('noteLimit'),
        taskLimit: reqUrl.searchParams.get('taskLimit'),
      });
      writeJson(res, detail ? 200 : 404, detail
        ? { ok: true, ...detail }
        : { ok: false, message: 'incident not found' });
      return true;
    }
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/notes') && reqUrl.pathname.startsWith('/api/incidents/')) {
    const incidentId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = appendIncidentNote(incidentId, body);
    writeJson(res, result ? 200 : 404, result
      ? { ok: true, ...result }
      : { ok: false, message: 'incident not found' });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/tasks') && reqUrl.pathname.startsWith('/api/incidents/')) {
    const incidentId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const task = appendIncidentTask(incidentId, body);
    writeJson(res, task ? 200 : 404, task
      ? { ok: true, task }
      : { ok: false, message: 'incident not found' });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.includes('/tasks/') && reqUrl.pathname.startsWith('/api/incidents/')) {
    const parts = reqUrl.pathname.split('/').filter(Boolean);
    if (parts.length === 5) {
      const incidentId = parts[2];
      const taskId = parts[4];
      const body = await readJsonBody(req);
      const task = updateIncidentTask(incidentId, taskId, body);
      writeJson(res, task ? 200 : 404, task
        ? { ok: true, task }
        : { ok: false, message: 'incident task not found' });
      return true;
    }
  }

  if (req.method === 'POST' && reqUrl.pathname.startsWith('/api/incidents/')) {
    const parts = reqUrl.pathname.split('/').filter(Boolean);
    if (parts.length === 3) {
      const incidentId = parts.at(-1);
      const body = await readJsonBody(req);
      const incident = updateIncident(incidentId, body);
      writeJson(res, incident ? 200 : 404, incident
        ? { ok: true, incident }
        : { ok: false, message: 'incident not found' });
      return true;
    }
  }

  return false;
}
