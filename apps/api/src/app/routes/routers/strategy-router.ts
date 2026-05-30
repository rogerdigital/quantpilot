import {
  createExecutionHandoff,
  getMarketProviderStatus,
  getStrategy,
  listExecutionHandoffs,
  listStrategies,
  promoteStrategy,
  queueExecutionHandoff,
  saveStrategy,
} from '../core-data.js';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.js';
import { hasPermission } from '../../../modules/auth/service.js';
import type { GatewayRouteContext } from '../types.js';

export async function handleStrategyRoutes({
  req,
  reqUrl,
  res,
  readJsonBody,
  writeJson,
}: GatewayRouteContext) {
  const writeForbidden = (permission: string, action = '') =>
    writeForbiddenJson(writeJson, res, permission, action);

  if (req.method === 'GET' && reqUrl.pathname === '/api/market/provider-status') {
    writeJson(res, 200, { ok: true, status: getMarketProviderStatus() });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/strategy/catalog') {
    writeJson(res, 200, listStrategies());
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/strategy/catalog/')) {
    const strategyId = reqUrl.pathname.split('/').at(-1)!;
    const result = getStrategy(strategyId);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/strategy/catalog') {
    if (!(await hasPermission('strategy:write', req.headers.authorization))) {
      writeForbidden('strategy:write', 'save strategy catalog entries');
      return true;
    }
    const body = (await readJsonBody(req)) as Record<string, unknown> | undefined;
    const result = saveStrategy(body);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  if (
    req.method === 'POST' &&
    reqUrl.pathname.endsWith('/promote') &&
    reqUrl.pathname.startsWith('/api/strategy/catalog/')
  ) {
    if (!(await hasPermission('strategy:write', req.headers.authorization))) {
      writeForbidden('strategy:write', 'promote the strategy');
      return true;
    }
    const strategyId = reqUrl.pathname.split('/').at(-2)!;
    const body = (await readJsonBody(req)) as Record<string, unknown> | undefined;
    const result = promoteStrategy(strategyId, body);
    writeJson(res, result.ok ? 200 : 409, result);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/execution-candidates') {
    writeJson(res, 200, listExecutionHandoffs());
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/research/execution-candidates') {
    if (!(await hasPermission('strategy:write', req.headers.authorization))) {
      writeForbidden('strategy:write', 'create execution handoffs');
      return true;
    }
    const body = (await readJsonBody(req)) as Record<string, any>;
    const result = createExecutionHandoff(body.strategyId, body);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  if (
    req.method === 'POST' &&
    reqUrl.pathname.startsWith('/api/research/execution-candidates/') &&
    reqUrl.pathname.endsWith('/queue')
  ) {
    if (!(await hasPermission('execution:approve', req.headers.authorization))) {
      writeForbidden('execution:approve', 'queue execution handoffs');
      return true;
    }
    const handoffId = reqUrl.pathname.split('/').at(-2)!;
    const result = queueExecutionHandoff(handoffId);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  return false;
}
