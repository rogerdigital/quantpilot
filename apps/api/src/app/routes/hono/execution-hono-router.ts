// @ts-nocheck
import { Hono } from 'hono';
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
import { hasPermission } from '../../../modules/auth/service.js';

function requireApproval(c, action = '') {
  if (!hasPermission('execution:approve')) {
    return c.json(
      { ok: false, message: `Permission 'execution:approve' required to ${action}` },
      403
    );
  }
  return null;
}

export function createExecutionHonoRouter() {
  const router = new Hono();

  router.get('/plans', (c) => {
    return c.json({ ok: true, plans: listExecutionPlans() });
  });

  router.get('/workbench', (c) => {
    return c.json(getExecutionWorkbench());
  });

  router.post('/plans/bulk', async (c) => {
    const denied = requireApproval(c, 'run bulk execution actions');
    if (denied) return denied;
    const body = await c.req.json();
    const result = bulkOperateExecutionPlans(body);
    return c.json(result, result.ok ? 200 : 400);
  });

  router.get('/plans/:planId', (c) => {
    const planId = c.req.param('planId');
    const detail = getExecutionPlanDetail(planId);
    return detail
      ? c.json({ ok: true, ...detail })
      : c.json({ ok: false, message: 'execution plan not found' }, 404);
  });

  router.get('/runtime', (c) => {
    return c.json({ ok: true, events: listExecutionRuntimeEvents() });
  });

  router.get('/account-snapshots', (c) => {
    return c.json({ ok: true, snapshots: listBrokerAccountSnapshots() });
  });

  router.get('/account-snapshots/latest', (c) => {
    return c.json({ ok: true, snapshot: getLatestBrokerAccountSnapshot() });
  });

  router.get('/broker-events', (c) => {
    const q = c.req.query;
    return c.json({
      ok: true,
      events: listBrokerExecutionEvents(Number(q('limit') || 40), {
        executionPlanId: q('executionPlanId') || '',
        executionRunId: q('executionRunId') || '',
        symbol: q('symbol') || '',
        eventType: q('eventType') || '',
      }),
    });
  });

  router.get('/ledger', (c) => {
    return c.json({ ok: true, entries: listExecutionLedger() });
  });

  router.post('/plans/:planId/approve', async (c) => {
    const denied = requireApproval(c, 'approve execution plans');
    if (denied) return denied;
    const planId = c.req.param('planId');
    const body = await c.req.json();
    const result = approveExecutionPlan(planId, body);
    return c.json(result, result.ok ? 200 : 409);
  });

  router.post('/plans/:planId/settle', async (c) => {
    const denied = requireApproval(c, 'settle execution plans');
    if (denied) return denied;
    const planId = c.req.param('planId');
    const body = await c.req.json();
    const result = settleExecutionPlan(planId, body);
    return c.json(result, result.ok ? 200 : 409);
  });

  router.post('/plans/:planId/sync', async (c) => {
    const denied = requireApproval(c, 'sync execution plans');
    if (denied) return denied;
    const planId = c.req.param('planId');
    const body = await c.req.json();
    const result = syncExecutionPlan(planId, body);
    return c.json(result, result.ok ? 200 : 409);
  });

  router.post('/plans/:planId/broker-events', async (c) => {
    const denied = requireApproval(c, 'ingest broker execution events');
    if (denied) return denied;
    const planId = c.req.param('planId');
    const body = await c.req.json();
    const result = ingestBrokerExecutionEvent(planId, body);
    return c.json(result, result.ok ? 200 : 409);
  });

  router.post('/plans/:planId/cancel', async (c) => {
    const denied = requireApproval(c, 'cancel execution plans');
    if (denied) return denied;
    const planId = c.req.param('planId');
    const body = await c.req.json();
    const result = cancelExecutionPlan(planId, body);
    return c.json(result, result.ok ? 200 : 409);
  });

  router.post('/plans/:planId/reconcile', async (c) => {
    const denied = requireApproval(c, 'reconcile execution plans');
    if (denied) return denied;
    const planId = c.req.param('planId');
    const body = await c.req.json();
    const result = reconcileExecutionPlan(planId, body);
    return c.json(result, result.ok ? 200 : 409);
  });

  router.post('/plans/:planId/compensate', async (c) => {
    const denied = requireApproval(c, 'run execution compensation automation');
    if (denied) return denied;
    const planId = c.req.param('planId');
    const body = await c.req.json();
    const result = compensateExecutionPlan(planId, body);
    return c.json(result, result.ok ? 200 : 409);
  });

  router.post('/plans/:planId/recover', async (c) => {
    const denied = requireApproval(c, 'recover execution plans');
    if (denied) return denied;
    const planId = c.req.param('planId');
    const body = await c.req.json();
    const result = recoverExecutionPlan(planId, body);
    return c.json(result, result.ok ? 200 : 409);
  });

  return router;
}
