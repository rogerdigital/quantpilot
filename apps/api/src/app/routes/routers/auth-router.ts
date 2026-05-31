import { getSession } from '../../../modules/auth/service.js';
import type { GatewayRouteContext } from '../types.js';

export async function handleAuthRoutes({ req, reqUrl, res, writeJson }: GatewayRouteContext) {
  if (req.method === 'GET' && reqUrl.pathname === '/api/auth/session') {
    writeJson(res, 200, getSession());
    return true;
  }

  return false;
}
