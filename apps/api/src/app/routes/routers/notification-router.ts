import { listNotifications } from '../../../modules/notification/service.js';
import type { GatewayRouteContext } from '../types.js';

export function handleNotificationRoutes({ req, reqUrl, res, writeJson }: GatewayRouteContext) {
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

  return false;
}
