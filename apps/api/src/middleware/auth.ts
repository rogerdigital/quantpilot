import type { Context, Next } from 'hono';
import { verifyToken } from '../modules/auth/jwt-service.js';

interface AuthUser {
  id: string;
  permissions: string[];
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

const PUBLIC_PATHS = new Set([
  '/api/health',
  '/api/modules',
  '/api/architecture',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/session',
  '/api/auth/permissions',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/password-reset',
]);

export async function authMiddleware(c: Context, next: Next) {
  const path = new URL(c.req.url).pathname;

  if (PUBLIC_PATHS.has(path) || path.startsWith('/api/auth/')) {
    return next();
  }

  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    return next();
  }

  if (!authHeader.startsWith('Bearer ')) {
    return c.json({ ok: false, message: 'Invalid authorization header format' }, 401);
  }

  try {
    const token = authHeader.slice(7);
    const payload = await verifyToken(token);
    c.set('user', {
      id: (payload.userId as string) || '',
      permissions: Array.isArray(payload.permissions) ? (payload.permissions as string[]) : [],
    });
  } catch {
    return c.json({ ok: false, message: 'Invalid or expired token' }, 401);
  }

  return next();
}
