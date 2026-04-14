// @ts-nocheck
import { addSseConnection } from '../../../modules/sse/sse-manager.js';

const KEEPALIVE_INTERVAL_MS = 30_000;

export async function handleSseRoutes({ req, reqUrl, res }) {
  if (req.method !== 'GET' || reqUrl.pathname !== '/api/sse/state') {
    return false;
  }

  addSseConnection(res);

  // Send keepalive pings every 30s to prevent proxy timeouts
  const pingInterval = setInterval(() => {
    try {
      res.write('event: ping\ndata: {}\n\n');
    } catch {
      clearInterval(pingInterval);
    }
  }, KEEPALIVE_INTERVAL_MS);

  res.on('close', () => {
    clearInterval(pingInterval);
  });

  // Do NOT call writeJson — keep the connection open
  return true;
}
