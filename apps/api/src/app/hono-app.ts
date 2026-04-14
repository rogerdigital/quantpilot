// @ts-nocheck
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { timing } from 'hono/timing';

export function createHonoApp() {
  const app = new Hono();

  app.use(
    '*',
    cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'DELETE'],
      allowHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use('*', logger());
  app.use('*', timing());

  app.onError((err, c) => {
    console.error('[hono-gateway]', err.message);
    return c.json({ ok: false, message: err.message }, 500);
  });

  app.notFound((c) => c.json({ ok: false, message: 'Not found' }, 404));

  return app;
}
