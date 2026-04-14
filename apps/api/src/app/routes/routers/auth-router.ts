// @ts-nocheck
import { createHash } from 'node:crypto';
import { listPermissionDescriptors } from '../../../modules/auth/permission-catalog.js';
import { getSession } from '../../../modules/auth/service.js';
import { signToken } from '../../../modules/auth/jwt-service.js';

function sha256hex(value) {
  return createHash('sha256').update(value).digest('hex');
}

export async function handleAuthRoutes({ req, reqUrl, res, readJsonBody, writeJson }) {
  if (req.method === 'GET' && reqUrl.pathname === '/api/auth/session') {
    writeJson(res, 200, getSession());
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/auth/permissions') {
    writeJson(res, 200, { ok: true, permissions: listPermissionDescriptors() });
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/auth/login') {
    const body = await readJsonBody(req);
    const { username, password } = body || {};

    const expectedUsername = process.env.DEMO_USERNAME ?? 'admin';
    const expectedPasswordHash = sha256hex(process.env.DEMO_PASSWORD ?? 'changeme');

    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      username !== expectedUsername ||
      sha256hex(password) !== expectedPasswordHash
    ) {
      writeJson(res, 401, { ok: false, message: 'Invalid credentials' });
      return true;
    }

    const permissions = [
      'dashboard:read',
      'strategy:write',
      'risk:review',
      'execution:approve',
      'account:write',
    ];
    const expiresIn = '8h';
    const token = await signToken({ userId: username, permissions }, expiresIn);
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    writeJson(res, 200, { ok: true, token, expiresAt });
    return true;
  }

  return false;
}
