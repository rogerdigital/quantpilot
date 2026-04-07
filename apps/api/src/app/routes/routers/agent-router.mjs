import { hasPermission } from '../../../modules/auth/service.mjs';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.mjs';
import {
  approveAgentActionRequest,
  createSessionActionRequest,
  listAgentActionRequests,
  queueAgentActionRequest,
  rejectAgentActionRequest,
} from '../../../domains/agent/services/action-request-service.mjs';
import { runAgentAnalysis } from '../../../domains/agent/services/analysis-service.mjs';
import { createAgentInstruction } from '../../../domains/agent/services/instruction-service.mjs';
import { parseAgentIntent } from '../../../domains/agent/services/intent-service.mjs';
import { createAgentPlan } from '../../../domains/agent/services/planning-service.mjs';
import { resolveAgentAuthority, saveAgentPolicy } from '../../../domains/agent/services/policy-service.mjs';
import { getAgentSessionDetail, listAgentSessionsSnapshot } from '../../../domains/agent/services/session-service.mjs';
import { getAgentOperatorTimeline, getAgentWorkbench } from '../../../domains/agent/services/workbench-service.mjs';
import { listAgentTools, executeAgentTool } from '../../../domains/agent/services/tools-service.mjs';

export async function handleAgentRoutes({ req, reqUrl, res, readJsonBody, writeJson }) {
  const writeForbidden = (permission, action = '') => writeForbiddenJson(writeJson, res, permission, action);

  if (req.method === 'GET' && reqUrl.pathname === '/api/agent/authority') {
    writeJson(res, 200, resolveAgentAuthority({
      accountId: reqUrl.searchParams.get('accountId') || 'all',
      strategyId: reqUrl.searchParams.get('strategyId') || 'all',
      actionType: reqUrl.searchParams.get('actionType') || 'all',
      environment: reqUrl.searchParams.get('environment') || 'paper',
      riskMode: reqUrl.searchParams.get('riskMode') || 'healthy',
      anomalyMode: reqUrl.searchParams.get('anomalyMode') || 'healthy',
    }));
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/agent/policies') {
    const body = await readJsonBody(req);
    writeJson(res, 200, saveAgentPolicy(body || {}));
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/agent/instructions') {
    const body = await readJsonBody(req);
    writeJson(res, 200, createAgentInstruction(body || {}));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/agent/tools') {
    writeJson(res, 200, listAgentTools());
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/agent/tools/execute') {
    const body = await readJsonBody(req);
    const result = executeAgentTool(body);
    writeJson(res, result.ok ? 200 : 403, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/agent/intent') {
    const body = await readJsonBody(req);
    const result = parseAgentIntent(body);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/agent/plans') {
    const body = await readJsonBody(req);
    const result = createAgentPlan(body);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/agent/analysis-runs') {
    const body = await readJsonBody(req);
    const result = runAgentAnalysis(body);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/agent/sessions') {
    writeJson(res, 200, listAgentSessionsSnapshot(Number(reqUrl.searchParams.get('limit') || 20)));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/agent/workbench') {
    writeJson(res, 200, getAgentWorkbench({
      limit: reqUrl.searchParams.get('limit'),
      hours: reqUrl.searchParams.get('hours'),
    }));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.endsWith('/timeline') && reqUrl.pathname.startsWith('/api/agent/sessions/')) {
    const sessionId = reqUrl.pathname.split('/').at(-2);
    const result = getAgentOperatorTimeline(sessionId, {
      limit: reqUrl.searchParams.get('limit'),
      hours: reqUrl.searchParams.get('hours'),
    });
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/agent/sessions/')) {
    const sessionId = reqUrl.pathname.split('/').at(-1);
    const result = getAgentSessionDetail(sessionId);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/action-requests') && reqUrl.pathname.startsWith('/api/agent/sessions/')) {
    if (!hasPermission('strategy:write')) { writeForbidden('strategy:write', 'create agent session action requests'); return true; }
    const sessionId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = createSessionActionRequest(sessionId, body);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/agent/action-requests') {
    writeJson(res, 200, listAgentActionRequests());
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/agent/action-requests') {
    if (!hasPermission('strategy:write')) { writeForbidden('strategy:write', 'queue agent action requests'); return true; }
    const body = await readJsonBody(req);
    const result = queueAgentActionRequest(body);
    writeJson(res, result.ok ? 200 : 403, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/approve') && reqUrl.pathname.startsWith('/api/agent/action-requests/')) {
    if (!hasPermission('risk:review')) { writeForbidden('risk:review', 'approve agent action requests'); return true; }
    const requestId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = approveAgentActionRequest(requestId, body);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/reject') && reqUrl.pathname.startsWith('/api/agent/action-requests/')) {
    if (!hasPermission('risk:review')) { writeForbidden('risk:review', 'reject agent action requests'); return true; }
    const requestId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = rejectAgentActionRequest(requestId, body);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  return false;
}
