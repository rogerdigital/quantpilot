import type { GatewayRouteContext } from '../types.js';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.js';
import { hasPermission } from '../../../modules/auth/service.js';
import {
  getSchedulerWorkbench,
  listSchedulerTicks,
  runSchedulerOrchestrationAction,
} from '../../../modules/scheduler/service.js';

export async function handleSchedulerRoutes({ req, reqUrl, res, readJsonBody, writeJson }: GatewayRouteContext) {
  const writeForbidden = (permission: string, action = '') =>
    writeForbiddenJson(writeJson, res, permission, action);

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
    writeJson(
      res,
      200,
      getSchedulerWorkbench({
        limit: reqUrl.searchParams.get('limit'),
        hours: reqUrl.searchParams.get('hours'),
        phase: reqUrl.searchParams.get('phase'),
      })
    );
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/scheduler/actions') {
    if (!(await hasPermission('execution:approve', req.headers.authorization))) {
      writeForbidden('execution:approve', 'run scheduler orchestration actions');
      return true;
    }
    const body = (await readJsonBody(req)) as Record<string, any> | undefined;
    const result = runSchedulerOrchestrationAction(body);
    writeJson(res, result?.ok === false ? 400 : 200, result);
    return true;
  }

  return false;
}
