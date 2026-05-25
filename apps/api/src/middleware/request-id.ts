import { randomUUID } from 'node:crypto';
import type { MiddlewareHandler } from 'hono';

export const requestId = (): MiddlewareHandler => async (c, next) => {
  const reqId = c.req.header('X-Request-Id') || randomUUID();
  c.header('X-Request-Id', reqId);
  c.set('reqId', reqId);
  await next();
};
