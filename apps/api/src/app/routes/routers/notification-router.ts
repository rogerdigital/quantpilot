// @ts-nocheck
import { listNotifications } from '../../../modules/notification/service.js';

export function handleNotificationRoutes({ req, reqUrl, res, writeJson }) {
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
