// @ts-nocheck
import { hasPermission } from '../../../modules/auth/service.js';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.js';
import {
  getExecutionPlanDetail,
  getExecutionWorkbench,
  getLatestBrokerAccountSnapshot,
  listBrokerAccountSnapshots,
  listBrokerExecutionEvents,
  listExecutionLedger,
  listExecutionPlans,
  listExecutionRuntimeEvents,
} from '../../../domains/execution/services/query-service.js';
import {
  approveExecutionPlan,
  bulkOperateExecutionPlans,
  cancelExecutionPlan,
  compensateExecutionPlan,
  ingestBrokerExecutionEvent,
  reconcileExecutionPlan,
  recoverExecutionPlan,
  settleExecutionPlan,
  syncExecutionPlan,
} from '../../../domains/execution/services/lifecycle-service.js';

export async function handleExecutionRoutes({ req, reqUrl, res, readJsonBody, writeJson }) {
  const writeForbidden = (permission, action = '') => writeForbiddenJson(writeJson, res, permission, action);
  const requireApproval = (action) => {
    if (!hasPermission('execution:approve')) { writeForbidden('execution:approve', action); return false; }
    return true;
  };

  if (req.method === 'GET' && reqUrl.pathname === '/api/execution/plans') {
    writeJson(res, 200, { ok: true, plans: listExecutionPlans() });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/execution/workbench') {
    writeJson(res, 200, getExecutionWorkbench());
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/execution/plans/bulk') {
    if (!requireApproval('run bulk execution actions')) return true;
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
    writeJson(res, 200, { ok: true, events: listExecutionRuntimeEvents() });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/execution/account-snapshots') {
    writeJson(res, 200, { ok: true, snapshots: listBrokerAccountSnapshots() });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/execution/account-snapshots/latest') {
    writeJson(res, 200, { ok: true, snapshot: getLatestBrokerAccountSnapshot() });
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
    writeJson(res, 200, { ok: true, entries: listExecutionLedger() });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/approve') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!requireApproval('approve execution plans')) return true;
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = approveExecutionPlan(planId, body);
    writeJson(res, result.ok ? 200 : 409, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/settle') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!requireApproval('settle execution plans')) return true;
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = settleExecutionPlan(planId, body);
    writeJson(res, result.ok ? 200 : 409, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/sync') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!requireApproval('sync execution plans')) return true;
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = syncExecutionPlan(planId, body);
    writeJson(res, result.ok ? 200 : 409, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/broker-events') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!requireApproval('ingest broker execution events')) return true;
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = ingestBrokerExecutionEvent(planId, body);
    writeJson(res, result.ok ? 200 : 409, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/cancel') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!requireApproval('cancel execution plans')) return true;
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = cancelExecutionPlan(planId, body);
    writeJson(res, result.ok ? 200 : 409, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/reconcile') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!requireApproval('reconcile execution plans')) return true;
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = reconcileExecutionPlan(planId, body);
    writeJson(res, result.ok ? 200 : 409, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/compensate') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!requireApproval('run execution compensation automation')) return true;
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = compensateExecutionPlan(planId, body);
    writeJson(res, result.ok ? 200 : 409, result);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname.endsWith('/recover') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!requireApproval('recover execution plans')) return true;
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = recoverExecutionPlan(planId, body);
    writeJson(res, result.ok ? 200 : 409, result);
    return true;
  }

  return false;
}
