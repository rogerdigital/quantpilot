import {
  approveAgentActionRequest,
  listAgentActionRequests,
  queueAgentActionRequest,
  rejectAgentActionRequest,
} from '../../domains/agent/services/action-request-service.mjs';
import { listAgentTools, executeAgentTool } from '../../domains/agent/services/tools-service.mjs';
import { getBacktestSummary } from '../../domains/backtest/services/summary-service.mjs';
import { listBacktestRuns } from '../../domains/backtest/services/runs-service.mjs';
import { getLatestBrokerAccountSnapshot, listBrokerAccountSnapshots, listExecutionLedger, listExecutionPlans, listExecutionRuntimeEvents } from '../../domains/execution/services/query-service.mjs';
import { getSession, hasPermission } from '../../modules/auth/service.mjs';
import { describeArchitecture, listArchitectureLayers, listModules } from '../../modules/registry.mjs';
import {
  getBrokerBindingsSnapshot,
  getBrokerBindingRuntimeSnapshot,
  getUserAccountSnapshot,
  getUserProfileSnapshot,
  patchUserProfile,
  patchUserAccess,
  patchUserPreferences,
  removeBrokerBinding,
  saveBrokerBinding,
  setPrimaryBrokerBinding,
  syncBrokerBindingRuntime,
} from '../../modules/user-account/service.mjs';
import { listStrategyCatalog } from '../../domains/strategy/services/catalog-service.mjs';

export async function handlePlatformRoutes(context) {
  const { req, reqUrl, res, config, readJsonBody, writeJson } = context;
  const writeForbidden = (permission) => {
    writeJson(res, 403, {
      ok: false,
      error: 'forbidden',
      missingPermission: permission,
      message: `missing required permission: ${permission}`,
    });
  };
  const canWriteAccount = () => hasPermission('account:write');

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

  if (req.method === 'GET' && reqUrl.pathname === '/api/user-account/profile') {
    writeJson(res, 200, getUserProfileSnapshot());
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/profile') {
    if (!canWriteAccount()) {
      writeForbidden('account:write');
      return true;
    }
    const body = await readJsonBody(req);
    writeJson(res, 200, patchUserProfile(body));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/user-account') {
    writeJson(res, 200, getUserAccountSnapshot());
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/preferences') {
    if (!canWriteAccount()) {
      writeForbidden('account:write');
      return true;
    }
    const body = await readJsonBody(req);
    writeJson(res, 200, patchUserPreferences(body));
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/access') {
    if (!canWriteAccount()) {
      writeForbidden('account:write');
      return true;
    }
    const body = await readJsonBody(req);
    writeJson(res, 200, patchUserAccess(body));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/user-account/broker-bindings') {
    writeJson(res, 200, getBrokerBindingsSnapshot());
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/user-account/broker-bindings/runtime') {
    const result = await getBrokerBindingRuntimeSnapshot(context.gatewayDependencies.getBrokerHealth);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/broker-bindings') {
    if (!canWriteAccount()) {
      writeForbidden('account:write');
      return true;
    }
    const body = await readJsonBody(req);
    const result = saveBrokerBinding(body);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/default') && reqUrl.pathname.startsWith('/api/user-account/broker-bindings/')) {
    if (!canWriteAccount()) {
      writeForbidden('account:write');
      return true;
    }
    const bindingId = reqUrl.pathname.split('/').at(-2);
    const result = setPrimaryBrokerBinding(bindingId);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'DELETE' && reqUrl.pathname.startsWith('/api/user-account/broker-bindings/')) {
    if (!canWriteAccount()) {
      writeForbidden('account:write');
      return true;
    }
    const bindingId = reqUrl.pathname.split('/').at(-1);
    const result = removeBrokerBinding(bindingId);
    writeJson(res, result.ok ? 200 : (result.error === 'default broker binding cannot be deleted' ? 409 : 404), result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/broker-bindings/sync') {
    if (!canWriteAccount()) {
      writeForbidden('account:write');
      return true;
    }
    const result = await syncBrokerBindingRuntime(context.gatewayDependencies.getBrokerHealth);
    writeJson(res, result.ok ? 200 : 404, result);
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
    if (!hasPermission('strategy:write')) {
      writeForbidden('strategy:write');
      return true;
    }
    const body = await readJsonBody(req);
    const result = queueAgentActionRequest(body);
    writeJson(res, result.ok ? 200 : 403, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/approve') && reqUrl.pathname.startsWith('/api/agent/action-requests/')) {
    if (!hasPermission('risk:review')) {
      writeForbidden('risk:review');
      return true;
    }
    const requestId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = approveAgentActionRequest(requestId, body);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/reject') && reqUrl.pathname.startsWith('/api/agent/action-requests/')) {
    if (!hasPermission('risk:review')) {
      writeForbidden('risk:review');
      return true;
    }
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

  if (req.method === 'GET' && reqUrl.pathname === '/api/execution/runtime') {
    writeJson(res, 200, {
      ok: true,
      events: listExecutionRuntimeEvents(),
    });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/execution/account-snapshots') {
    writeJson(res, 200, {
      ok: true,
      snapshots: listBrokerAccountSnapshots(),
    });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/execution/account-snapshots/latest') {
    writeJson(res, 200, {
      ok: true,
      snapshot: getLatestBrokerAccountSnapshot(),
    });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/execution/ledger') {
    writeJson(res, 200, {
      ok: true,
      entries: listExecutionLedger(),
    });
    return true;
  }

  return false;
}
