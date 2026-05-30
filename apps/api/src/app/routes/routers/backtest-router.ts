import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.js';
import { hasPermission } from '../../../modules/auth/service.js';
import {
  createBacktestRun,
  evaluateBacktestRun,
  getBacktestResult,
  getBacktestRun,
  getBacktestSummary,
  listBacktestResults,
  listBacktestRuns,
  reviewBacktestRun,
} from '../core-data.js';
import type { GatewayRouteContext } from '../types.js';

export async function handleBacktestRoutes({
  req,
  reqUrl,
  res,
  readJsonBody,
  writeJson,
}: GatewayRouteContext) {
  const writeForbidden = (permission: string, action = '') =>
    writeForbiddenJson(writeJson, res, permission, action);

  if (req.method === 'GET' && reqUrl.pathname === '/api/backtest/summary') {
    writeJson(res, 200, getBacktestSummary());
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/backtest/results') {
    writeJson(res, 200, listBacktestResults());
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/backtest/results/summary') {
    writeJson(res, 200, getBacktestSummary());
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/backtest/results/')) {
    const resultId = reqUrl.pathname.split('/').at(-1);
    const result = getBacktestResult(resultId);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/backtest/runs') {
    writeJson(res, 200, listBacktestRuns());
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/backtest/runs/')) {
    const runId = reqUrl.pathname.split('/').at(-1);
    const result = getBacktestRun(runId);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/backtest/runs') {
    if (!(await hasPermission('strategy:write', req.headers.authorization))) {
      writeForbidden('strategy:write', 'queue backtest runs');
      return true;
    }
    const body = (await readJsonBody(req)) as Record<string, any> | undefined;
    const result = createBacktestRun(body);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  if (
    req.method === 'POST' &&
    reqUrl.pathname.endsWith('/evaluate') &&
    reqUrl.pathname.startsWith('/api/backtest/runs/')
  ) {
    if (!(await hasPermission('risk:review', req.headers.authorization))) {
      writeForbidden('risk:review', 'evaluate research results for promotion');
      return true;
    }
    const runId = reqUrl.pathname.split('/').at(-2);
    const result = evaluateBacktestRun(runId);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (
    req.method === 'POST' &&
    reqUrl.pathname.endsWith('/review') &&
    reqUrl.pathname.startsWith('/api/backtest/runs/')
  ) {
    if (!(await hasPermission('risk:review', req.headers.authorization))) {
      writeForbidden('risk:review', 'review backtest runs');
      return true;
    }
    const runId = reqUrl.pathname.split('/').at(-2);
    const body = (await readJsonBody(req)) as Record<string, any> | undefined;
    const result = reviewBacktestRun(runId, body);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  return false;
}
