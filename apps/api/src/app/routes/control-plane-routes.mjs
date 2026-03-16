import { appendAuditRecord, listAuditRecords } from '../../modules/audit/service.mjs';
import { hasPermission } from '../../modules/auth/service.mjs';
import { listNotifications } from '../../modules/notification/service.mjs';
import { listRiskEvents } from '../../domains/risk/services/feed-service.mjs';
import { listSchedulerTicks } from '../../modules/scheduler/service.mjs';
import { runCycle } from '../../control-plane/task-orchestrator/cycle-runner.mjs';
import { runStateCycle } from '../../control-plane/task-orchestrator/state-runner.mjs';
import {
  cancelWorkflow,
  getWorkflow,
  listWorkflows,
  queueWorkflow,
  resumeWorkflow,
} from '../../control-plane/task-orchestrator/services/workflow-service.mjs';
import { listActions, recordAction } from '../../control-plane/task-orchestrator/services/action-service.mjs';
import { listCycles, recordCycleRun } from '../../control-plane/task-orchestrator/services/cycle-service.mjs';

export async function handleControlPlaneRoutes(context) {
  const { req, reqUrl, res, readJsonBody, writeJson, gatewayDependencies } = context;
  const writeForbidden = (permission) => {
    writeJson(res, 403, {
      ok: false,
      error: 'forbidden',
      missingPermission: permission,
      message: `missing required permission: ${permission}`,
    });
  };
  const requirePermission = (permission) => {
    if (!hasPermission(permission)) {
      writeForbidden(permission);
      return false;
    }
    return true;
  };

  if (req.method === 'GET' && reqUrl.pathname === '/api/audit/records') {
    writeJson(res, 200, {
      ok: true,
      records: listAuditRecords({
        limit: reqUrl.searchParams.get('limit'),
        type: reqUrl.searchParams.get('type'),
        hours: reqUrl.searchParams.get('hours'),
      }),
    });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/audit/records') {
    const body = await readJsonBody(req);
    writeJson(res, 200, {
      ok: true,
      record: appendAuditRecord(body),
    });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/notification/events') {
    writeJson(res, 200, {
      ok: true,
      events: listNotifications({
        limit: reqUrl.searchParams.get('limit'),
        level: reqUrl.searchParams.get('level'),
        source: reqUrl.searchParams.get('source'),
        hours: reqUrl.searchParams.get('hours'),
      }),
    });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/risk/events') {
    writeJson(res, 200, {
      ok: true,
      events: listRiskEvents(),
    });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/scheduler/ticks') {
    writeJson(res, 200, {
      ok: true,
      ticks: listSchedulerTicks({
        limit: reqUrl.searchParams.get('limit'),
        phase: reqUrl.searchParams.get('phase'),
        hours: reqUrl.searchParams.get('hours'),
      }),
    });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/task-orchestrator/cycles') {
    writeJson(res, 200, {
      ok: true,
      cycles: listCycles(),
    });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/task-orchestrator/workflows') {
    writeJson(res, 200, {
      ok: true,
      workflows: listWorkflows(),
    });
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
    writeJson(res, 200, {
      ok: true,
      workflow: queueWorkflow(body),
    });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/resume') && reqUrl.pathname.startsWith('/api/task-orchestrator/workflows/')) {
    if (!requirePermission('execution:approve')) return true;
    const workflowRunId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const workflow = resumeWorkflow(workflowRunId, body);
    writeJson(res, workflow ? 200 : 404, workflow
      ? { ok: true, workflow }
      : { ok: false, message: 'workflow not found' });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/cancel') && reqUrl.pathname.startsWith('/api/task-orchestrator/workflows/')) {
    if (!requirePermission('execution:approve')) return true;
    const workflowRunId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const workflow = cancelWorkflow(workflowRunId, body);
    writeJson(res, workflow ? 200 : 404, workflow
      ? { ok: true, workflow }
      : { ok: false, message: 'workflow not found' });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/task-orchestrator/cycles') {
    const body = await readJsonBody(req);
    writeJson(res, 200, {
      ok: true,
      cycle: recordCycleRun(body),
    });
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

  if (req.method === 'POST' && reqUrl.pathname === '/api/task-orchestrator/state/queue') {
    const body = await readJsonBody(req);
    writeJson(res, 200, {
      ok: true,
      workflow: queueWorkflow({
        workflowId: 'task-orchestrator.state-run',
        workflowType: 'task-orchestrator',
        actor: 'api-queue',
        trigger: 'api',
        payload: {
          state: body.state,
        },
        maxAttempts: Number(body.maxAttempts || 3),
      }),
    });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/strategy/execute') {
    if (!requirePermission('strategy:write')) return true;
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

  if (req.method === 'POST' && reqUrl.pathname === '/api/task-orchestrator/state/run') {
    const body = await readJsonBody(req);
    writeJson(res, 200, await runStateCycle(body?.state, {
      getBrokerHealth: gatewayDependencies.getBrokerHealth,
      executeBrokerCycle: gatewayDependencies.executeBrokerCycle,
      getMarketSnapshot: gatewayDependencies.getMarketSnapshot,
    }));
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
    if (!requirePermission('execution:approve')) return true;
    const body = await readJsonBody(req);
    writeJson(res, 200, {
      ok: true,
      action: recordAction(body),
    });
    return true;
  }

  return false;
}
