import { startGatewayServer } from './app/index.js';

async function main() {
  if (process.env.USE_HONO === 'true') {
    const { createHonoApp } = await import('./app/hono-app.js');
    const { serve } = await import('@hono/node-server');
    const { createExecutionHonoRouter } = await import(
      './app/routes/hono/execution-hono-router.js'
    );
    const app = createHonoApp();
    const port = Number(process.env.GATEWAY_PORT || 8787);
    app.route('/api/execution', createExecutionHonoRouter());
    serve({ fetch: app.fetch, port }, () => {
      console.log(`[hono-gateway] listening on :${port}`);
    });
  } else {
    startGatewayServer();
  }
}

main();
