import { appendAuditRecord, listAuditRecords } from '../../modules/audit/service.mjs';
import { hasPermission } from '../../modules/auth/service.mjs';
import { writeForbiddenJson } from '../../modules/auth/permission-catalog.mjs';
import { appendIncidentNote, appendIncidentTask, bulkUpdateIncidents, createIncident, getIncidentDetail, getIncidentSummary, listIncidents, updateIncident, updateIncidentTask } from '../../modules/incidents/service.mjs';
import { listNotifications } from '../../modules/notification/service.mjs';
import { getRiskEvent, listRiskEvents } from '../../domains/risk/services/feed-service.mjs';
import { runRiskPolicyAction } from '../../domains/risk/services/policy-action-service.mjs';
import { getRiskWorkbench } from '../../domains/risk/services/workbench-service.mjs';
import { getSchedulerWorkbench, listSchedulerTicks, runSchedulerOrchestrationAction } from '../../modules/scheduler/service.mjs';
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
  const writeForbidden = (permission, action = '') => writeForbiddenJson(writeJson, res, permission, action);
  const requirePermission = (permission, action = '') => {
    if (!hasPermission(permission)) {
      writeForbidden(permission, action);
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

  if (req.method === 'GET' && reqUrl.pathname === '/api/incidents') {
    writeJson(res, 200, {
      ok: true,
      incidents: listIncidents({
        limit: reqUrl.searchParams.get('limit'),
        owner: reqUrl.searchParams.get('owner'),
        severity: reqUrl.searchParams.get('severity'),
        source: reqUrl.searchParams.get('source'),
        status: reqUrl.searchParams.get('status'),
        hours: reqUrl.searchParams.get('hours'),
      }),
    });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/incidents/summary') {
    writeJson(res, 200, {
      ok: true,
      summary: getIncidentSummary({
        limit: reqUrl.searchParams.get('limit'),
        owner: reqUrl.searchParams.get('owner'),
        severity: reqUrl.searchParams.get('severity'),
        source: reqUrl.searchParams.get('source'),
        status: reqUrl.searchParams.get('status'),
        hours: reqUrl.searchParams.get('hours'),
      }),
    });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/incidents') {
    const body = await readJsonBody(req);
    writeJson(res, 200, {
      ok: true,
      incident: createIncident(body),
    });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/incidents/bulk') {
    const body = await readJsonBody(req);
    const result = bulkUpdateIncidents(body);
    writeJson(res, 200, {
      ok: true,
      ...result,
    });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/incidents/')) {
    const parts = reqUrl.pathname.split('/').filter(Boolean);
    if (parts.length === 3) {
      const detail = getIncidentDetail(parts.at(-1), {
        activityLimit: reqUrl.searchParams.get('activityLimit'),
        noteLimit: reqUrl.searchParams.get('noteLimit'),
        taskLimit: reqUrl.searchParams.get('taskLimit'),
      });
      writeJson(res, detail ? 200 : 404, detail
        ? { ok: true, ...detail }
        : { ok: false, message: 'incident not found' });
      return true;
    }
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/notes') && reqUrl.pathname.startsWith('/api/incidents/')) {
    const incidentId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = appendIncidentNote(incidentId, body);
    writeJson(res, result ? 200 : 404, result
      ? { ok: true, ...result }
      : { ok: false, message: 'incident not found' });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/tasks') && reqUrl.pathname.startsWith('/api/incidents/')) {
    const incidentId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const task = appendIncidentTask(incidentId, body);
    writeJson(res, task ? 200 : 404, task
      ? { ok: true, task }
      : { ok: false, message: 'incident not found' });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.includes('/tasks/') && reqUrl.pathname.startsWith('/api/incidents/')) {
    const parts = reqUrl.pathname.split('/').filter(Boolean);
    if (parts.length === 5) {
      const incidentId = parts[2];
      const taskId = parts[4];
      const body = await readJsonBody(req);
      const task = updateIncidentTask(incidentId, taskId, body);
      writeJson(res, task ? 200 : 404, task
        ? { ok: true, task }
        : { ok: false, message: 'incident task not found' });
      return true;
    }
  }

  if (req.method === 'POST' && reqUrl.pathname.startsWith('/api/incidents/')) {
    const parts = reqUrl.pathname.split('/').filter(Boolean);
    if (parts.length === 3) {
      const incidentId = parts.at(-1);
      const body = await readJsonBody(req);
      const incident = updateIncident(incidentId, body);
      writeJson(res, incident ? 200 : 404, incident
        ? { ok: true, incident }
        : { ok: false, message: 'incident not found' });
      return true;
    }
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

  if (req.method === 'GET' && reqUrl.pathname === '/api/risk/workbench') {
    writeJson(res, 200, getRiskWorkbench({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
    }));
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/risk/actions') {
    if (!requirePermission('risk:review', 'run risk policy actions')) return true;
    const body = await readJsonBody(req);
    const result = runRiskPolicyAction(body);
    writeJson(res, result?.ok === false ? 400 : 200, result);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/risk/events/')) {
    const eventId = reqUrl.pathname.split('/').at(-1);
    const event = getRiskEvent(eventId);
    writeJson(res, event ? 200 : 404, event
      ? { ok: true, event }
      : { ok: false, message: 'risk event not found' });
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

  if (req.method === 'GET' && reqUrl.pathname === '/api/scheduler/workbench') {
    writeJson(res, 200, getSchedulerWorkbench({
      limit: reqUrl.searchParams.get('limit'),
      hours: reqUrl.searchParams.get('hours'),
      phase: reqUrl.searchParams.get('phase'),
    }));
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/scheduler/actions') {
    if (!requirePermission('execution:approve', 'run scheduler orchestration actions')) return true;
    const body = await readJsonBody(req);
    const result = runSchedulerOrchestrationAction(body);
    writeJson(res, result?.ok === false ? 400 : 200, result);
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
    if (!requirePermission('execution:approve', 'resume or cancel workflows')) return true;
    const body = await readJsonBody(req);
    writeJson(res, 200, {
      ok: true,
      action: recordAction(body),
    });
    return true;
  }

  return false;
}
