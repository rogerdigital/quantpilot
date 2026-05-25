import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.js';
import { hasPermission } from '../../../modules/auth/service.js';
import {
  createOperationsMaintenanceBackup,
  getOperationsMaintenanceSnapshot,
  releaseWorkflowMaintenanceBacklog,
  restoreOperationsMaintenanceBackup,
} from '../../../modules/operations/maintenance-service.js';
import { getOperationsWorkbench } from '../../../modules/operations/service.js';
import type { GatewayRouteContext } from '../types.js';

export async function handleOperationsRoutes({
  req,
  reqUrl,
  res,
  readJsonBody,
  writeJson,
  gatewayDependencies,
}: GatewayRouteContext) {
  const writeForbidden = (permission: string, action = '') =>
    writeForbiddenJson(writeJson, res, permission, action);
  const canMaintain = async () => hasPermission('operations:maintain', req.headers.authorization);

  if (req.method === 'GET' && reqUrl.pathname === '/api/operations/workbench') {
    const summary = await getOperationsWorkbench({
      getBrokerHealth: gatewayDependencies.getBrokerHealth,
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
    });
    writeJson(res, 200, summary);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/operations/maintenance') {
    if (!(await canMaintain())) {
      writeForbidden('operations:maintain', 'inspect control-plane maintenance posture');
      return true;
    }
    const summary = await getOperationsMaintenanceSnapshot({
      getBrokerHealth: gatewayDependencies.getBrokerHealth,
      limit: reqUrl.searchParams.get('limit'),
    });
    writeJson(res, 200, summary);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/operations/maintenance/backup') {
    if (!(await canMaintain())) {
      writeForbidden('operations:maintain', 'export control-plane backups');
      return true;
    }
    writeJson(res, 200, createOperationsMaintenanceBackup());
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/operations/maintenance/restore') {
    if (!(await canMaintain())) {
      writeForbidden('operations:maintain', 'restore control-plane backups');
      return true;
    }
    const body = (await readJsonBody(req)) as Record<string, any> | undefined;
    writeJson(res, 200, restoreOperationsMaintenanceBackup(body || {}));
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/operations/maintenance/repair/workflows') {
    if (!(await canMaintain())) {
      writeForbidden('operations:maintain', 'repair workflow retry backlog');
      return true;
    }
    const body = (await readJsonBody(req)) as Record<string, any> | undefined;
    writeJson(res, 200, releaseWorkflowMaintenanceBacklog(body || {}));
    return true;
  }

  return false;
}
