import {
  approveAgentActionRequest,
  listAgentActionRequests,
  queueAgentActionRequest,
  rejectAgentActionRequest,
} from '../../domains/agent/services/action-request-service.mjs';
import { listAgentTools, executeAgentTool } from '../../domains/agent/services/tools-service.mjs';
import { getBacktestSummary } from '../../domains/backtest/services/summary-service.mjs';
import { createBacktestRun, getBacktestRunDetail, listBacktestRuns, reviewBacktestRun } from '../../domains/backtest/services/runs-service.mjs';
import { getResearchHubSnapshot, getResearchTaskDetail, getResearchTaskSummary, listResearchTasks } from '../../domains/research/services/task-service.mjs';
import { getExecutionPlanDetail, getLatestBrokerAccountSnapshot, listBrokerAccountSnapshots, listExecutionLedger, listExecutionPlans, listExecutionRuntimeEvents } from '../../domains/execution/services/query-service.mjs';
import { getSession, hasPermission } from '../../modules/auth/service.mjs';
import { listPermissionDescriptors, writeForbiddenJson } from '../../modules/auth/permission-catalog.mjs';
import { getMonitoringStatus, listMonitoringAlerts, listMonitoringSnapshots } from '../../modules/monitoring/service.mjs';
import { getOperationsWorkbench } from '../../modules/operations/service.mjs';
import { describeArchitecture, listArchitectureLayers, listModules } from '../../modules/registry.mjs';
import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.mjs';
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
import { getStrategyCatalogDetail, listStrategyCatalog, saveStrategyCatalogItem } from '../../domains/strategy/services/catalog-service.mjs';

export async function handlePlatformRoutes(context) {
  const { req, reqUrl, res, config, readJsonBody, writeJson } = context;
  const writeForbidden = (permission, action = '') => writeForbiddenJson(writeJson, res, permission, action);
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

  if (req.method === 'GET' && reqUrl.pathname === '/api/monitoring/status') {
    const summary = await getMonitoringStatus({
      getBrokerHealth: context.gatewayDependencies.getBrokerHealth,
    });
    writeJson(res, 200, summary);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/monitoring/snapshots') {
    writeJson(res, 200, listMonitoringSnapshots({
      limit: reqUrl.searchParams.get('limit'),
      status: reqUrl.searchParams.get('status'),
      hours: reqUrl.searchParams.get('hours'),
    }));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/monitoring/alerts') {
    writeJson(res, 200, listMonitoringAlerts({
      limit: reqUrl.searchParams.get('limit'),
      snapshotId: reqUrl.searchParams.get('snapshotId'),
      source: reqUrl.searchParams.get('source'),
      level: reqUrl.searchParams.get('level'),
      hours: reqUrl.searchParams.get('hours'),
    }));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/operations/workbench') {
    const summary = await getOperationsWorkbench({
      getBrokerHealth: context.gatewayDependencies.getBrokerHealth,
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
    });
    writeJson(res, 200, summary);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/auth/session') {
    writeJson(res, 200, getSession());
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/auth/permissions') {
    writeJson(res, 200, {
      ok: true,
      permissions: listPermissionDescriptors(),
    });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/user-account/profile') {
    writeJson(res, 200, getUserProfileSnapshot());
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/profile') {
    if (!canWriteAccount()) {
      writeForbidden('account:write', 'update the account profile');
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
      writeForbidden('account:write', 'update account preferences');
      return true;
    }
    const body = await readJsonBody(req);
    writeJson(res, 200, patchUserPreferences(body));
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/access') {
    if (!canWriteAccount()) {
      writeForbidden('account:write', 'update the access policy');
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
      writeForbidden('account:write', 'save broker bindings');
      return true;
    }
    const body = await readJsonBody(req);
    const result = saveBrokerBinding(body);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/default') && reqUrl.pathname.startsWith('/api/user-account/broker-bindings/')) {
    if (!canWriteAccount()) {
      writeForbidden('account:write', 'change the default broker binding');
      return true;
    }
    const bindingId = reqUrl.pathname.split('/').at(-2);
    const result = setPrimaryBrokerBinding(bindingId);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'DELETE' && reqUrl.pathname.startsWith('/api/user-account/broker-bindings/')) {
    if (!canWriteAccount()) {
      writeForbidden('account:write', 'delete broker bindings');
      return true;
    }
    const bindingId = reqUrl.pathname.split('/').at(-1);
    const result = removeBrokerBinding(bindingId);
    writeJson(res, result.ok ? 200 : (result.error === 'default broker binding cannot be deleted' ? 409 : 404), result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/broker-bindings/sync') {
    if (!canWriteAccount()) {
      writeForbidden('account:write', 'sync broker runtime state');
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
      writeForbidden('strategy:write', 'queue agent action requests');
      return true;
    }
    const body = await readJsonBody(req);
    const result = queueAgentActionRequest(body);
    writeJson(res, result.ok ? 200 : 403, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/approve') && reqUrl.pathname.startsWith('/api/agent/action-requests/')) {
    if (!hasPermission('risk:review')) {
      writeForbidden('risk:review', 'approve agent action requests');
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
      writeForbidden('risk:review', 'reject agent action requests');
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

  if (req.method === 'GET' && reqUrl.pathname === '/api/market/provider-status') {
    writeJson(res, 200, {
      ok: true,
      status: controlPlaneRuntime.getMarketProviderStatus(),
    });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/backtest/summary') {
    writeJson(res, 200, getBacktestSummary());
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/hub') {
    writeJson(res, 200, getResearchHubSnapshot({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
    }));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/tasks') {
    writeJson(res, 200, listResearchTasks({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
      taskType: reqUrl.searchParams.get('taskType'),
      status: reqUrl.searchParams.get('status'),
      strategyId: reqUrl.searchParams.get('strategyId'),
      workflowRunId: reqUrl.searchParams.get('workflowRunId'),
      runId: reqUrl.searchParams.get('runId'),
    }));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/tasks/summary') {
    writeJson(res, 200, getResearchTaskSummary({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
      taskType: reqUrl.searchParams.get('taskType'),
      strategyId: reqUrl.searchParams.get('strategyId'),
    }));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/research/tasks/')) {
    const taskId = reqUrl.pathname.split('/').at(-1);
    const result = getResearchTaskDetail(taskId);
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

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/review') && reqUrl.pathname.startsWith('/api/backtest/runs/')) {
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

  if (req.method === 'GET' && reqUrl.pathname === '/api/execution/plans') {
    writeJson(res, 200, {
      ok: true,
      plans: listExecutionPlans(),
    });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    const planId = reqUrl.pathname.split('/').at(-1);
    const detail = getExecutionPlanDetail(planId);
    writeJson(res, detail ? 200 : 404, detail
      ? { ok: true, ...detail }
      : { ok: false, message: 'execution plan not found' });
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
