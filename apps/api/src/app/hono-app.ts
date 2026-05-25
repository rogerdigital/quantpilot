import { createChildLogger } from '../lib/logger.js';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { timing } from 'hono/timing';
import { rateLimit } from '../middleware/rate-limit.js';

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
      allowHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use('*', rateLimit());
  app.use('*', honoLogger());
  app.use('*', timing());

  app.onError((err, c) => {
    log.error({ err, path: c.req.path, method: c.req.method }, 'request error');
    return c.json({ ok: false, message: 'Internal server error' }, 500);
  });

  app.notFound((c) => c.json({ ok: false, message: 'Not found' }, 404));

  return app;
}
