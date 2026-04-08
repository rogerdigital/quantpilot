// @ts-nocheck
import { getSession } from '../../../modules/auth/service.js';
import { listPermissionDescriptors } from '../../../modules/auth/permission-catalog.js';

export function handleAuthRoutes({ req, reqUrl, res, writeJson }) {
  if (req.method === 'GET' && reqUrl.pathname === '/api/auth/session') {
    writeJson(res, 200, getSession());
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/auth/permissions') {
    writeJson(res, 200, { ok: true, permissions: listPermissionDescriptors() });
    return true;
  }

  return false;
}
