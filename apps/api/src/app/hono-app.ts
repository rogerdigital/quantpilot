import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { timing } from 'hono/timing';
import { rateLimit } from '../middleware/rate-limit.js';

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
  app.use('*', logger());
  app.use('*', timing());

  app.onError((err, c) => {
    console.error('[hono-gateway]', err.message);
    return c.json({ ok: false, message: 'Internal server error' }, 500);
  });

  app.notFound((c) => c.json({ ok: false, message: 'Not found' }, 404));

  return app;
}
