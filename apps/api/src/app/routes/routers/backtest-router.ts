// @ts-nocheck

import {
  getBacktestResultDetail,
  getBacktestResultSummary,
  listBacktestResults,
} from '../../../domains/backtest/services/results-service.js';
import {
  createBacktestRun,
  getBacktestRunDetail,
  listBacktestRuns,
  reviewBacktestRun,
} from '../../../domains/backtest/services/runs-service.js';
import { getBacktestSummary } from '../../../domains/backtest/services/summary-service.js';
import { evaluateBacktestRun } from '../../../domains/research/services/evaluation-service.js';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.js';
import { hasPermission } from '../../../modules/auth/service.js';

export async function handleBacktestRoutes({ req, reqUrl, res, readJsonBody, writeJson }) {
  const writeForbidden = (permission, action = '') =>
    writeForbiddenJson(writeJson, res, permission, action);

  if (req.method === 'GET' && reqUrl.pathname === '/api/backtest/summary') {
    writeJson(res, 200, getBacktestSummary());
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/backtest/results') {
    writeJson(
      res,
      200,
      listBacktestResults({
        hours: reqUrl.searchParams.get('hours'),
        limit: reqUrl.searchParams.get('limit'),
        runId: reqUrl.searchParams.get('runId'),
        strategyId: reqUrl.searchParams.get('strategyId'),
        workflowRunId: reqUrl.searchParams.get('workflowRunId'),
        status: reqUrl.searchParams.get('status'),
        stage: reqUrl.searchParams.get('stage'),
      })
    );
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/backtest/results/summary') {
    writeJson(
      res,
      200,
      getBacktestResultSummary({
        hours: reqUrl.searchParams.get('hours'),
        limit: reqUrl.searchParams.get('limit'),
        strategyId: reqUrl.searchParams.get('strategyId'),
        status: reqUrl.searchParams.get('status'),
        stage: reqUrl.searchParams.get('stage'),
      })
    );
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/backtest/results/')) {
    const resultId = reqUrl.pathname.split('/').at(-1);
    const result = getBacktestResultDetail(resultId);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/backtest/runs') {
    writeJson(res, 200, listBacktestRuns());
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/backtest/runs/')) {
    const runId = reqUrl.pathname.split('/').at(-1);
    const result = getBacktestRunDetail(runId);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/backtest/runs') {
    if (!hasPermission('strategy:write')) {
      writeForbidden('strategy:write', 'queue backtest runs');
      return true;
    }
    const body = await readJsonBody(req);
    const result = createBacktestRun(body);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  if (
    req.method === 'POST' &&
    reqUrl.pathname.endsWith('/evaluate') &&
    reqUrl.pathname.startsWith('/api/backtest/runs/')
  ) {
    if (!hasPermission('risk:review')) {
      writeForbidden('risk:review', 'evaluate research results for promotion');
      return true;
    }
    const runId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = evaluateBacktestRun(runId, body);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (
    req.method === 'POST' &&
    reqUrl.pathname.endsWith('/review') &&
    reqUrl.pathname.startsWith('/api/backtest/runs/')
  ) {
    if (!hasPermission('risk:review')) {
      writeForbidden('risk:review', 'review backtest runs');
      return true;
    }
    const runId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = reviewBacktestRun(runId, body);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  return false;
}
