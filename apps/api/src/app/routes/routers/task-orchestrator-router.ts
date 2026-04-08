import { hasPermission } from '../../../modules/auth/service.js';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.js';
import { runCycle } from '../../../control-plane/task-orchestrator/cycle-runner.js';
import { runStateCycle } from '../../../control-plane/task-orchestrator/state-runner.js';
import {
  cancelWorkflow,
  getWorkflow,
  listWorkflows,
  queueWorkflow,
  resumeWorkflow,
} from '../../../control-plane/task-orchestrator/services/workflow-service.js';
import { listActions, recordAction } from '../../../control-plane/task-orchestrator/services/action-service.js';
import { listCycles, recordCycleRun } from '../../../control-plane/task-orchestrator/services/cycle-service.js';

export async function handleTaskOrchestratorRoutes({ req, reqUrl, res, readJsonBody, writeJson, gatewayDependencies }) {
  const writeForbidden = (permission, action = '') => writeForbiddenJson(writeJson, res, permission, action);
  const requirePermission = (permission, action = '') => {
    if (!hasPermission(permission)) { writeForbidden(permission, action); return false; }
    return true;
  };

  if (req.method === 'GET' && reqUrl.pathname === '/api/task-orchestrator/cycles') {
    writeJson(res, 200, { ok: true, cycles: listCycles() });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/task-orchestrator/cycles') {
    const body = await readJsonBody(req);
    writeJson(res, 200, { ok: true, cycle: recordCycleRun(body) });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/task-orchestrator/cycles/queue') {
    const body = await readJsonBody(req);
    writeJson(res, 200, {
      ok: true,
      workflow: queueWorkflow({
        workflowId: 'task-orchestrator.cycle-run',
        workflowType: 'task-orchestrator',
        actor: 'api-queue',
        trigger: 'api',
        payload: body,
        maxAttempts: Number(body.maxAttempts || 3),
      }),
    });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/task-orchestrator/cycles/run') {
    const body = await readJsonBody(req);
    writeJson(res, 200, await runCycle(body, {
      getBrokerHealth: gatewayDependencies.getBrokerHealth,
      executeBrokerCycle: gatewayDependencies.executeBrokerCycle,
    }));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/task-orchestrator/workflows') {
    writeJson(res, 200, { ok: true, workflows: listWorkflows() });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/task-orchestrator/workflows/')) {
    const workflowRunId = reqUrl.pathname.split('/').at(-1);
    const workflow = getWorkflow(workflowRunId);
    writeJson(res, workflow ? 200 : 404, workflow
      ? { ok: true, workflow }
      : { ok: false, message: 'workflow not found' });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/task-orchestrator/workflows/queue') {
    const body = await readJsonBody(req);
    writeJson(res, 200, { ok: true, workflow: queueWorkflow(body) });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/resume') && reqUrl.pathname.startsWith('/api/task-orchestrator/workflows/')) {
    if (!requirePermission('execution:approve', 'record operator actions')) return true;
    const workflowRunId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const workflow = resumeWorkflow(workflowRunId, body);
    writeJson(res, workflow ? 200 : 404, workflow
      ? { ok: true, workflow }
      : { ok: false, message: 'workflow not found' });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/cancel') && reqUrl.pathname.startsWith('/api/task-orchestrator/workflows/')) {
    if (!requirePermission('execution:approve', 'run control-plane cycles')) return true;
    const workflowRunId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const workflow = cancelWorkflow(workflowRunId, body);
    writeJson(res, workflow ? 200 : 404, workflow
      ? { ok: true, workflow }
      : { ok: false, message: 'workflow not found' });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/task-orchestrator/actions') {
    writeJson(res, 200, {
      ok: true,
      actions: listActions({
        limit: reqUrl.searchParams.get('limit'),
        level: reqUrl.searchParams.get('level'),
        hours: reqUrl.searchParams.get('hours'),
      }),
    });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/task-orchestrator/actions') {
    if (!requirePermission('execution:approve', 'resume or cancel workflows')) return true;
    const body = await readJsonBody(req);
    writeJson(res, 200, { ok: true, action: recordAction(body) });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/task-orchestrator/state/queue') {
    const body = await readJsonBody(req);
    writeJson(res, 200, {
      ok: true,
      workflow: queueWorkflow({
        workflowId: 'task-orchestrator.state-run',
        workflowType: 'task-orchestrator',
        actor: 'api-queue',
        trigger: 'api',
        payload: { state: body.state },
        maxAttempts: Number(body.maxAttempts || 3),
      }),
    });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/task-orchestrator/state/run') {
    const body = await readJsonBody(req);
    writeJson(res, 200, await runStateCycle(body?.state, {
      getBrokerHealth: gatewayDependencies.getBrokerHealth,
      executeBrokerCycle: gatewayDependencies.executeBrokerCycle,
      getMarketSnapshot: gatewayDependencies.getMarketSnapshot,
    }));
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/strategy/execute') {
    if (!requirePermission('strategy:write', 'queue workflows')) return true;
    const body = await readJsonBody(req);
    writeJson(res, 200, {
      ok: true,
      workflow: queueWorkflow({
        workflowId: 'task-orchestrator.strategy-execution',
        workflowType: 'task-orchestrator',
        actor: body.requestedBy || 'api-queue',
        trigger: 'api',
        payload: {
          strategyId: body.strategyId,
          mode: body.mode || 'paper',
          capital: Number(body.capital || 0),
          requestedBy: body.requestedBy || 'operator',
        },
        maxAttempts: Number(body.maxAttempts || 3),
      }),
    });
    return true;
  }

  return false;
}
