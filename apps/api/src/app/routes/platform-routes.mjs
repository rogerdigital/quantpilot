import {
  approveAgentActionRequest,
  executeAgentTool,
  listAgentActionRequests,
  listAgentTools,
  queueAgentActionRequest,
  rejectAgentActionRequest,
} from '../../modules/agent/service.mjs';
import { getBacktestSummary, listBacktestRuns } from '../../modules/backtest/service.mjs';
import { listExecutionPlans } from '../../modules/execution/service.mjs';
import { getSession } from '../../modules/auth/service.mjs';
import { describeArchitecture, listArchitectureLayers, listModules } from '../../modules/registry.mjs';
import { listStrategyCatalog } from '../../modules/strategy/service.mjs';

export async function handlePlatformRoutes(context) {
  const { req, reqUrl, res, config, readJsonBody, writeJson } = context;

  if (req.method === 'GET' && reqUrl.pathname === '/api/health') {
    writeJson(res, 200, {
      ok: true,
      architectureLayers: listArchitectureLayers().length,
      modules: listModules().length,
      brokerAdapter: config.brokerAdapter,
      alpacaConfigured: Boolean(config.alpacaKeyId && config.alpacaSecretKey),
      alpacaUsePaper: config.alpacaUsePaper,
      alpacaDataFeed: config.alpacaDataFeed,
    });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/auth/session') {
    writeJson(res, 200, getSession());
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/modules') {
    writeJson(res, 200, {
      ok: true,
      modules: listModules(),
    });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/architecture') {
    writeJson(res, 200, {
      ok: true,
      architecture: describeArchitecture(),
    });
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

  if (req.method === 'GET' && reqUrl.pathname === '/api/agent/action-requests') {
    writeJson(res, 200, listAgentActionRequests());
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/agent/action-requests') {
    const body = await readJsonBody(req);
    const result = queueAgentActionRequest(body);
    writeJson(res, result.ok ? 200 : 403, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/approve') && reqUrl.pathname.startsWith('/api/agent/action-requests/')) {
    const requestId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = approveAgentActionRequest(requestId, body);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/reject') && reqUrl.pathname.startsWith('/api/agent/action-requests/')) {
    const requestId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = rejectAgentActionRequest(requestId, body);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/strategy/catalog') {
    writeJson(res, 200, listStrategyCatalog());
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/backtest/summary') {
    writeJson(res, 200, getBacktestSummary());
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/backtest/runs') {
    writeJson(res, 200, listBacktestRuns());
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/execution/plans') {
    writeJson(res, 200, {
      ok: true,
      plans: listExecutionPlans(),
    });
    return true;
  }

  return false;
}
