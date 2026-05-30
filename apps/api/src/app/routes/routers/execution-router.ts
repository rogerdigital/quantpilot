import {
  bulkUpdateExecutionPlans,
  getExecutionPlan,
  getExecutionWorkbench,
  listBrokerAccountSnapshots,
  listBrokerExecutionEvents,
  listExecutionLedger,
  listExecutionPlans,
  listExecutionRuntimeEvents,
  updateExecutionPlan,
} from '../core-data.js';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.js';
import { hasPermission } from '../../../modules/auth/service.js';
import type { GatewayRouteContext } from '../types.js';

export async function handleExecutionRoutes({
  req,
  reqUrl,
  res,
  readJsonBody,
  writeJson,
}: GatewayRouteContext) {
  const writeForbidden = (permission: string, action = '') =>
    writeForbiddenJson(writeJson, res, permission, action);
  const requireApproval = async (action: string) => {
    if (!(await hasPermission('execution:approve', req.headers.authorization))) {
      writeForbidden('execution:approve', action);
      return false;
    }
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
    if (!(await requireApproval('run bulk execution actions'))) return true;
    const body = (await readJsonBody(req)) as Record<string, unknown> | undefined;
    writeJson(res, 200, bulkUpdateExecutionPlans(body));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    const planId = reqUrl.pathname.split('/').at(-1)!;
    const detail = getExecutionPlan(planId);
    writeJson(
      res,
      detail ? 200 : 404,
      detail ? { ok: true, ...detail } : { ok: false, message: 'execution plan not found' }
    );
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
    writeJson(res, 200, { ok: true, snapshot: listBrokerAccountSnapshots(1)[0] || null });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/execution/broker-events') {
    writeJson(res, 200, { ok: true, events: listBrokerExecutionEvents() });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/execution/ledger') {
    writeJson(res, 200, { ok: true, entries: listExecutionLedger() });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/execution/paper-promotion/')) {
    const strategyId = reqUrl.pathname.split('/').at(-1) || 'default';
    writeJson(res, 200, {
      ok: true,
      readiness: { strategyId, ready: false, reasons: ['Paper promotion is out of Lite scope.'] },
      report: { strategyId, observations: [] },
    });
    return true;
  }

  const planAction = reqUrl.pathname.match(/^\/api\/execution\/plans\/([^/]+)\/([^/]+)$/);
  if (req.method === 'POST' && planAction) {
    if (!(await requireApproval(`run execution action ${planAction[2]}`))) return true;
    const body = (await readJsonBody(req)) as Record<string, unknown> | undefined;
    const result = updateExecutionPlan(planAction[1], {
      status: planAction[2],
      lastAction: planAction[2],
      metadata: body || {},
    });
    writeJson(res, result.ok ? 200 : 404, result);
    return true;
  }

  return false;
}
