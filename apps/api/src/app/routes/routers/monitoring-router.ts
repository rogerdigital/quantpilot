// @ts-nocheck
import {
  getMonitoringStatus,
  listMonitoringAlerts,
  listMonitoringSnapshots,
} from '../../../modules/monitoring/service.js';

export async function handleMonitoringRoutes({ req, reqUrl, res, writeJson, gatewayDependencies }) {
  if (req.method === 'GET' && reqUrl.pathname === '/api/monitoring/status') {
    const summary = await getMonitoringStatus({
      getBrokerHealth: gatewayDependencies.getBrokerHealth,
    });
    writeJson(res, 200, summary);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/monitoring/snapshots') {
    writeJson(
      res,
      200,
      listMonitoringSnapshots({
        limit: reqUrl.searchParams.get('limit'),
        status: reqUrl.searchParams.get('status'),
        hours: reqUrl.searchParams.get('hours'),
      })
    );
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/monitoring/alerts') {
    writeJson(
      res,
      200,
      listMonitoringAlerts({
        limit: reqUrl.searchParams.get('limit'),
        snapshotId: reqUrl.searchParams.get('snapshotId'),
        source: reqUrl.searchParams.get('source'),
        level: reqUrl.searchParams.get('level'),
        hours: reqUrl.searchParams.get('hours'),
      })
    );
    return true;
  }

  return false;
}
