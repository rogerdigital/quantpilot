import {
  approveAgentActionRequest,
  createSessionActionRequest,
  listAgentActionRequests,
  queueAgentActionRequest,
  rejectAgentActionRequest,
} from '../../domains/agent/services/action-request-service.mjs';
import { runAgentAnalysis } from '../../domains/agent/services/analysis-service.mjs';
import { parseAgentIntent } from '../../domains/agent/services/intent-service.mjs';
import { createAgentPlan } from '../../domains/agent/services/planning-service.mjs';
import { getAgentSessionDetail, listAgentSessionsSnapshot } from '../../domains/agent/services/session-service.mjs';
import { getAgentOperatorTimeline, getAgentWorkbench } from '../../domains/agent/services/workbench-service.mjs';
import { listAgentTools, executeAgentTool } from '../../domains/agent/services/tools-service.mjs';
import { getBacktestSummary } from '../../domains/backtest/services/summary-service.mjs';
import { getBacktestResultDetail, getBacktestResultSummary, listBacktestResults } from '../../domains/backtest/services/results-service.mjs';
import { createBacktestRun, getBacktestRunDetail, listBacktestRuns, reviewBacktestRun } from '../../domains/backtest/services/runs-service.mjs';
import { getResearchHubSnapshot, getResearchTaskDetail, getResearchTaskSummary, listResearchTasks } from '../../domains/research/services/task-service.mjs';
import { evaluateBacktestRun, getResearchEvaluationSummary, listResearchEvaluations, promoteStrategyFromEvaluation } from '../../domains/research/services/evaluation-service.mjs';
import { getResearchReportSummary, listResearchReports } from '../../domains/research/services/report-service.mjs';
import { getResearchWorkbenchSnapshot, listResearchGovernanceActions, runResearchGovernanceAction } from '../../domains/research/services/workbench-service.mjs';
import { getExecutionPlanDetail, getExecutionWorkbench, getLatestBrokerAccountSnapshot, listBrokerAccountSnapshots, listBrokerExecutionEvents, listExecutionLedger, listExecutionPlans, listExecutionRuntimeEvents } from '../../domains/execution/services/query-service.mjs';
import { approveExecutionPlan, bulkOperateExecutionPlans, cancelExecutionPlan, compensateExecutionPlan, ingestBrokerExecutionEvent, reconcileExecutionPlan, recoverExecutionPlan, settleExecutionPlan, syncExecutionPlan } from '../../domains/execution/services/lifecycle-service.mjs';
import { getSession, hasPermission } from '../../modules/auth/service.mjs';
import { listPermissionDescriptors, writeForbiddenJson } from '../../modules/auth/permission-catalog.mjs';
import { getMonitoringStatus, listMonitoringAlerts, listMonitoringSnapshots } from '../../modules/monitoring/service.mjs';
import { getOperationsWorkbench } from '../../modules/operations/service.mjs';
import {
  createOperationsMaintenanceBackup,
  getOperationsMaintenanceSnapshot,
  releaseWorkflowMaintenanceBacklog,
  restoreOperationsMaintenanceBackup,
} from '../../modules/operations/maintenance-service.mjs';
import { describeArchitecture, listArchitectureLayers, listModules } from '../../modules/registry.mjs';
import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.mjs';
import {
  getBrokerBindingsSnapshot,
  getBrokerBindingRuntimeSnapshot,
  getUserAccountSnapshot,
  getUserProfileSnapshot,
  getUserRoleTemplatesSnapshot,
  getUserWorkspaceSnapshot,
  patchUserProfile,
  patchUserAccess,
  patchUserPreferences,
  removeUserRoleTemplate,
  removeBrokerBinding,
  saveBrokerBinding,
  saveUserRoleTemplate,
  saveWorkspace,
  selectCurrentWorkspace,
  setPrimaryBrokerBinding,
  syncBrokerBindingRuntime,
} from '../../modules/user-account/service.mjs';
import { getStrategyCatalogDetail, listStrategyCatalog, saveStrategyCatalogItem } from '../../domains/strategy/services/catalog-service.mjs';
import { createExecutionCandidateHandoff, listExecutionCandidateHandoffs, queueExecutionCandidateHandoff } from '../../domains/strategy/services/execution-handoff-service.mjs';

export async function handlePlatformRoutes(context) {
  const { req, reqUrl, res, config, readJsonBody, writeJson } = context;
  const writeForbidden = (permission, action = '') => writeForbiddenJson(writeJson, res, permission, action);
  const canWriteAccount = () => hasPermission('account:write');
  const canMaintainOperations = () => hasPermission('operations:maintain');

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

  if (req.method === 'GET' && reqUrl.pathname === '/api/operations/maintenance') {
    if (!canMaintainOperations()) {
      writeForbidden('operations:maintain', 'inspect control-plane maintenance posture');
      return true;
    }
    const summary = await getOperationsMaintenanceSnapshot({
      getBrokerHealth: context.gatewayDependencies.getBrokerHealth,
      limit: reqUrl.searchParams.get('limit'),
    });
    writeJson(res, 200, summary);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/operations/maintenance/backup') {
    if (!canMaintainOperations()) {
      writeForbidden('operations:maintain', 'export control-plane backups');
      return true;
    }
    writeJson(res, 200, createOperationsMaintenanceBackup());
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/operations/maintenance/restore') {
    if (!canMaintainOperations()) {
      writeForbidden('operations:maintain', 'restore control-plane backups');
      return true;
    }
    const body = await readJsonBody(req);
    writeJson(res, 200, restoreOperationsMaintenanceBackup(body || {}));
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/operations/maintenance/repair/workflows') {
    if (!canMaintainOperations()) {
      writeForbidden('operations:maintain', 'repair workflow retry backlog');
      return true;
    }
    const body = await readJsonBody(req);
    writeJson(res, 200, releaseWorkflowMaintenanceBacklog(body || {}));
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

  if (req.method === 'GET' && reqUrl.pathname === '/api/user-account/roles') {
    writeJson(res, 200, getUserRoleTemplatesSnapshot());
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/user-account/workspaces') {
    writeJson(res, 200, getUserWorkspaceSnapshot());
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

  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/roles') {
    if (!canWriteAccount()) {
      writeForbidden('account:write', 'save role templates');
      return true;
    }
    const body = await readJsonBody(req);
    const result = saveUserRoleTemplate(body);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/workspaces') {
    if (!canWriteAccount()) {
      writeForbidden('account:write', 'save workspaces');
      return true;
    }
    const body = await readJsonBody(req);
    const result = saveWorkspace(body);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/workspaces/current') {
    if (!canWriteAccount()) {
      writeForbidden('account:write', 'switch workspaces');
      return true;
    }
    const body = await readJsonBody(req);
    const result = selectCurrentWorkspace(body.workspaceId);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'DELETE' && reqUrl.pathname.startsWith('/api/user-account/roles/')) {
    if (!canWriteAccount()) {
      writeForbidden('account:write', 'delete role templates');
      return true;
    }
    const roleId = reqUrl.pathname.split('/').at(-1);
    const result = removeUserRoleTemplate(roleId);
    writeJson(res, result.ok ? 200 : 400, result);
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
    if (!hasPermission('strategy:write')) {
      writeForbidden('strategy:write', 'create agent session action requests');
      return true;
    }
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

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/execution-candidates') {
    writeJson(res, 200, listExecutionCandidateHandoffs({
      limit: reqUrl.searchParams.get('limit'),
      hours: reqUrl.searchParams.get('hours'),
      handoffStatus: reqUrl.searchParams.get('handoffStatus'),
      mode: reqUrl.searchParams.get('mode'),
    }));
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

  if (req.method === 'POST' && reqUrl.pathname.startsWith('/api/research/execution-candidates/') && reqUrl.pathname.endsWith('/queue')) {
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

  if (req.method === 'GET' && reqUrl.pathname === '/api/backtest/summary') {
    writeJson(res, 200, getBacktestSummary());
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/backtest/results') {
    writeJson(res, 200, listBacktestResults({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
      runId: reqUrl.searchParams.get('runId'),
      strategyId: reqUrl.searchParams.get('strategyId'),
      workflowRunId: reqUrl.searchParams.get('workflowRunId'),
      status: reqUrl.searchParams.get('status'),
      stage: reqUrl.searchParams.get('stage'),
    }));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/backtest/results/summary') {
    writeJson(res, 200, getBacktestResultSummary({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
      strategyId: reqUrl.searchParams.get('strategyId'),
      status: reqUrl.searchParams.get('status'),
      stage: reqUrl.searchParams.get('stage'),
    }));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/backtest/results/')) {
    const resultId = reqUrl.pathname.split('/').at(-1);
    const result = getBacktestResultDetail(resultId);
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/hub') {
    writeJson(res, 200, getResearchHubSnapshot({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
    }));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/workbench') {
    writeJson(res, 200, getResearchWorkbenchSnapshot({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
    }));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/governance/actions') {
    writeJson(res, 200, listResearchGovernanceActions({
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

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/evaluations') {
    writeJson(res, 200, listResearchEvaluations({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
      runId: reqUrl.searchParams.get('runId'),
      resultId: reqUrl.searchParams.get('resultId'),
      strategyId: reqUrl.searchParams.get('strategyId'),
      verdict: reqUrl.searchParams.get('verdict'),
    }));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/evaluations/summary') {
    writeJson(res, 200, getResearchEvaluationSummary({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
      strategyId: reqUrl.searchParams.get('strategyId'),
      verdict: reqUrl.searchParams.get('verdict'),
    }));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/reports') {
    writeJson(res, 200, listResearchReports({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
      evaluationId: reqUrl.searchParams.get('evaluationId'),
      workflowRunId: reqUrl.searchParams.get('workflowRunId'),
      runId: reqUrl.searchParams.get('runId'),
      resultId: reqUrl.searchParams.get('resultId'),
      strategyId: reqUrl.searchParams.get('strategyId'),
      verdict: reqUrl.searchParams.get('verdict'),
    }));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/reports/summary') {
    writeJson(res, 200, getResearchReportSummary({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
      strategyId: reqUrl.searchParams.get('strategyId'),
      verdict: reqUrl.searchParams.get('verdict'),
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

  if (req.method === 'POST' && reqUrl.pathname === '/api/research/governance/actions') {
    const body = await readJsonBody(req);
    if (body.action === 'promote_strategies' || body.action === 'queue_backtests') {
      if (!hasPermission('strategy:write')) {
        writeForbidden('strategy:write', 'run research governance strategy actions');
        return true;
      }
    }
    if (body.action === 'evaluate_runs' && !hasPermission('risk:review')) {
      writeForbidden('risk:review', 'run research governance evaluation actions');
      return true;
    }
    const result = runResearchGovernanceAction(body);
    writeJson(res, result.ok ? 200 : 400, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/evaluate') && reqUrl.pathname.startsWith('/api/backtest/runs/')) {
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

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/promote') && reqUrl.pathname.startsWith('/api/strategy/catalog/')) {
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

  if (req.method === 'GET' && reqUrl.pathname === '/api/execution/plans') {
    writeJson(res, 200, {
      ok: true,
      plans: listExecutionPlans(),
    });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/execution/workbench') {
    writeJson(res, 200, getExecutionWorkbench());
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/execution/plans/bulk') {
    if (!hasPermission('execution:approve')) {
      writeForbidden('execution:approve', 'run bulk execution actions');
      return true;
    }
    const body = await readJsonBody(req);
    const result = bulkOperateExecutionPlans(body);
    writeJson(res, result.ok ? 200 : 400, result);
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

  if (req.method === 'GET' && reqUrl.pathname === '/api/execution/broker-events') {
    writeJson(res, 200, {
      ok: true,
      events: listBrokerExecutionEvents(
        Number(reqUrl.searchParams.get('limit') || 40),
        {
          executionPlanId: reqUrl.searchParams.get('executionPlanId') || '',
          executionRunId: reqUrl.searchParams.get('executionRunId') || '',
          symbol: reqUrl.searchParams.get('symbol') || '',
          eventType: reqUrl.searchParams.get('eventType') || '',
        },
      ),
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

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/approve') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!hasPermission('execution:approve')) {
      writeForbidden('execution:approve', 'approve execution plans');
      return true;
    }
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = approveExecutionPlan(planId, body);
    writeJson(res, result.ok ? 200 : 409, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/settle') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!hasPermission('execution:approve')) {
      writeForbidden('execution:approve', 'settle execution plans');
      return true;
    }
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = settleExecutionPlan(planId, body);
    writeJson(res, result.ok ? 200 : 409, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/sync') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!hasPermission('execution:approve')) {
      writeForbidden('execution:approve', 'sync execution plans');
      return true;
    }
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = syncExecutionPlan(planId, body);
    writeJson(res, result.ok ? 200 : 409, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/broker-events') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!hasPermission('execution:approve')) {
      writeForbidden('execution:approve', 'ingest broker execution events');
      return true;
    }
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = ingestBrokerExecutionEvent(planId, body);
    writeJson(res, result.ok ? 200 : 409, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/cancel') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!hasPermission('execution:approve')) {
      writeForbidden('execution:approve', 'cancel execution plans');
      return true;
    }
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = cancelExecutionPlan(planId, body);
    writeJson(res, result.ok ? 200 : 409, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/reconcile') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!hasPermission('execution:approve')) {
      writeForbidden('execution:approve', 'reconcile execution plans');
      return true;
    }
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = reconcileExecutionPlan(planId, body);
    writeJson(res, result.ok ? 200 : 409, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/compensate') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!hasPermission('execution:approve')) {
      writeForbidden('execution:approve', 'run execution compensation automation');
      return true;
    }
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = compensateExecutionPlan(planId, body);
    writeJson(res, result.ok ? 200 : 409, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/recover') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!hasPermission('execution:approve')) {
      writeForbidden('execution:approve', 'recover execution plans');
      return true;
    }
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = recoverExecutionPlan(planId, body);
    writeJson(res, result.ok ? 200 : 409, result);
    return true;
  }

  return false;
}
