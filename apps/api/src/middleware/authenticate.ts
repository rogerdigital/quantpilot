import type { IncomingMessage, ServerResponse } from 'node:http';
import { verifyToken } from '../modules/auth/jwt-service.js';

/**
 * Paths that bypass authentication entirely (health checks, auth endpoints).
 * Kept in sync with the legacy Hono authMiddleware PUBLIC_PATHS.
 */
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

export interface AuthResult {
  ok: true;
  user: { id: string; permissions: string[] } | null;
}

export interface AuthFailure {
  ok: false;
  status: number;
  message: string;
}

/**
 * Authenticate a native http request.
 *
 * Local-first policy: requests without an `Authorization` header are allowed
 * through as a local operator (no user identity attached). When a Bearer token
 * IS provided it must validate, otherwise the request is rejected with 401.
 * This lets the local console work unauthenticated while still enforcing real
 * credentials when they are presented (e.g. once a token is minted).
 */
export async function authenticate(
  req: IncomingMessage,
  pathname: string
): Promise<AuthResult | AuthFailure> {
  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith('/api/auth/')) {
    return { ok: true, user: null };
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return { ok: true, user: null };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return { ok: false, status: 401, message: 'Invalid authorization header format' };
  }

  try {
    const token = authHeader.slice(7);
    const payload = await verifyToken(token);
    return {
      ok: true,
      user: {
        id: (payload.userId as string) || '',
        permissions: Array.isArray(payload.permissions) ? (payload.permissions as string[]) : [],
      },
    };
  } catch {
    return { ok: false, status: 401, message: 'Invalid or expired token' };
  }
}

export function writeAuthFailure(res: ServerResponse, failure: AuthFailure): void {
  res.writeHead(failure.status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ ok: false, message: failure.message }));
}
