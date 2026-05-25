import type { Context } from 'hono';
import { createChildLogger } from '../lib/logger.js';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { timing } from 'hono/timing';
import { rateLimit } from '../middleware/rate-limit.js';
import { requestId } from '../middleware/request-id.js';

const log = createChildLogger('hono-gateway');

export function createHonoApp() {
  const app = new Hono();

  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
    : ['http://localhost:8080'];

  app.use(
    '*',
    cors({
      origin: corsOrigins,
      allowMethods: ['GET', 'POST', 'DELETE'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    })
  );

  app.use('*', requestId());
  app.use('*', rateLimit());
  app.use('*', honoLogger());
  app.use('*', timing());

  app.onError((err, c: Context) => {
    const reqId = (c as any).get?.('reqId') as string | undefined;
    const status = (err as any).status ?? 500;
    const level = status >= 500 ? 'error' : 'warn';

    log[level](
      { err, reqId, path: c.req.path, method: c.req.method, status },
      'request error'
    );

    const message =
      status >= 500 ? 'Internal server error' : err.message || 'Request failed';

    return c.json(
      { ok: false, message, ...(reqId ? { reqId } : {}) },
      status as 400
    );
  });

  app.notFound((c) => {
    const reqId = (c as any).get?.('reqId') as string | undefined;
    return c.json(
      { ok: false, message: 'Not found', ...(reqId ? { reqId } : {}) },
      404
    );
  });

  return app;
}
