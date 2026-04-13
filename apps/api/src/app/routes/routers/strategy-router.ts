// @ts-nocheck

import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';
import { promoteStrategyFromEvaluation } from '../../../domains/research/services/evaluation-service.js';
import {
  getStrategyCatalogDetail,
  listStrategyCatalog,
  saveStrategyCatalogItem,
} from '../../../domains/strategy/services/catalog-service.js';
import {
  createExecutionCandidateHandoff,
  listExecutionCandidateHandoffs,
  queueExecutionCandidateHandoff,
} from '../../../domains/strategy/services/execution-handoff-service.js';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.js';
import { hasPermission } from '../../../modules/auth/service.js';

export async function handleStrategyRoutes({ req, reqUrl, res, readJsonBody, writeJson }) {
  const writeForbidden = (permission, action = '') =>
    writeForbiddenJson(writeJson, res, permission, action);

  if (req.method === 'GET' && reqUrl.pathname === '/api/market/provider-status') {
    writeJson(res, 200, { ok: true, status: controlPlaneRuntime.getMarketProviderStatus() });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/strategy/catalog') {
    writeJson(res, 200, listStrategyCatalog());
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/strategy/catalog/')) {
    const strategyId = reqUrl.pathname.split('/').at(-1);
    const result = getStrategyCatalogDetail(strategyId);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/strategy/catalog') {
    if (!hasPermission('strategy:write')) {
      writeForbidden('strategy:write', 'save strategy catalog entries');
      return true;
    }
    const body = await readJsonBody(req);
    const result = saveStrategyCatalogItem(body);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  if (
    req.method === 'POST' &&
    reqUrl.pathname.endsWith('/promote') &&
    reqUrl.pathname.startsWith('/api/strategy/catalog/')
  ) {
    if (!hasPermission('strategy:write')) {
      writeForbidden('strategy:write', 'promote the strategy from a research evaluation');
      return true;
    }
    const strategyId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = promoteStrategyFromEvaluation(strategyId, body);
    writeJson(res, result.ok ? 200 : 409, result);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/execution-candidates') {
    writeJson(
      res,
      200,
      listExecutionCandidateHandoffs({
        limit: reqUrl.searchParams.get('limit'),
        hours: reqUrl.searchParams.get('hours'),
        handoffStatus: reqUrl.searchParams.get('handoffStatus'),
        mode: reqUrl.searchParams.get('mode'),
      })
    );
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/research/execution-candidates') {
    if (!hasPermission('strategy:write')) {
      writeForbidden('strategy:write', 'create execution handoffs');
      return true;
    }
    const body = await readJsonBody(req);
    const result = createExecutionCandidateHandoff(body.strategyId, body);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  if (
    req.method === 'POST' &&
    reqUrl.pathname.startsWith('/api/research/execution-candidates/') &&
    reqUrl.pathname.endsWith('/queue')
  ) {
    if (!hasPermission('execution:approve')) {
      writeForbidden('execution:approve', 'queue execution handoffs');
      return true;
    }
    const handoffId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = queueExecutionCandidateHandoff(handoffId, body);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  return false;
}
