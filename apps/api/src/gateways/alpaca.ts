import { createServer } from 'node:http';
import { handlePlatformRoutes } from '../app/routes/platform-routes.js';
import type { GatewayRouteContext } from '../app/routes/types.js';
import { createChildLogger } from '../lib/logger.js';
import { authenticate, writeAuthFailure } from '../middleware/authenticate.js';
import {
  apiCache,
  buildCacheKey,
  getCacheStats,
  getCacheTtl,
  getInvalidationPatterns,
  shouldCache,
  shouldInvalidate,
} from '../middleware/cache.js';
import { rateLimitHttp } from '../middleware/rate-limit-http.js';
import { requestIdHttp } from '../middleware/request-id-http.js';
import {
  executeBrokerCycle,
  getBrokerHealthSnapshot,
  getMarketSnapshot,
  handleBrokerState,
  handleCancelOrder,
  handleHistoricalBars,
  handleSnapshots,
  handleSubmitOrders,
  handleUnifiedBrokerCancel,
  handleUnifiedBrokerState,
  handleUnifiedBrokerSubmit,
  readJsonBody,
  writeJson,
} from './alpaca-client.js';
import { createGatewayConfig } from './alpaca-config.js';

export {
  executeBrokerCycle,
  getBrokerHealthSnapshot,
  getMarketSnapshot,
  readJsonBody,
  writeJson,
} from './alpaca-client.js';
export type { GatewayConfig } from './alpaca-config.js';
export { createGatewayConfig } from './alpaca-config.js';

const log = createChildLogger('gateway');

export function createGatewayHandler(options: Record<string, unknown> = {}) {
  const config = createGatewayConfig(options);
  const gatewayDependencies: GatewayRouteContext['gatewayDependencies'] = {
    getBrokerHealth:
      (options.getBrokerHealth as () => unknown) || (() => getBrokerHealthSnapshot(config)),
    executeBrokerCycle:
      (options.executeBrokerCycle as (payload: unknown) => unknown) ||
      ((payload) =>
        executeBrokerCycle(config, payload as Parameters<typeof executeBrokerCycle>[1])),
    getMarketSnapshot:
      (options.getMarketSnapshot as (payload: unknown) => unknown) ||
      ((payload) => getMarketSnapshot(config, payload as Parameters<typeof getMarketSnapshot>[1])),
  };
  return async function gatewayHandler(
    req: import('node:http').IncomingMessage,
    res: import('node:http').ServerResponse
  ) {
    const reqId = requestIdHttp(req, res);
    try {
      if (req.method === 'OPTIONS') {
        writeJson(res, 204, {});
        return;
      }
      if (!rateLimitHttp(req, res)) {
        return;
      }
      const originalUrl = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
      let isVersioned = false;
      let pathname = originalUrl.pathname;
      if (pathname.startsWith('/api/v1/')) {
        pathname = pathname.replace('/api/v1/', '/api/');
        isVersioned = true;
      }
      const reqUrl = originalUrl;
      const versionedPathname = pathname;
      Object.defineProperty(reqUrl, 'pathname', { value: versionedPathname, writable: false });

      const authResult = await authenticate(req, reqUrl.pathname);
      if (!authResult.ok) {
        writeAuthFailure(res, authResult);
        return;
      }

      const routeContext: GatewayRouteContext = {
        req,
        method: req.method || 'GET',
        url: reqUrl,
        reqUrl,
        res,
        config,
        readJsonBody,
        writeJson,
        gatewayDependencies,
        userAccount: authResult.user,
      };
      if (!isVersioned && reqUrl.pathname.startsWith('/api/')) {
        res.setHeader('Deprecation', 'true');
        res.setHeader('Sunset', 'Sat, 01 Nov 2025 00:00:00 GMT');
        res.setHeader('Link', `</api/v1${reqUrl.pathname.slice(4)}>; rel="successor-version"`);
      }

      if (req.method === 'GET' && reqUrl.pathname === '/api/system/cache-stats') {
        writeJson(res, 200, { ok: true, cache: getCacheStats() });
        return;
      }

      if (shouldInvalidate(req.method!)) {
        const patterns = getInvalidationPatterns(reqUrl.pathname);
        for (const pattern of patterns) {
          apiCache.invalidatePattern(pattern);
        }
      }

      let cachedResponse: unknown = null;
      let cacheKey = '';
      const isCacheable = shouldCache(req.method!, reqUrl.pathname);
      if (isCacheable) {
        cacheKey = buildCacheKey(req.method!, reqUrl.pathname, reqUrl.search, authResult.user?.id);
        const cached = apiCache.get(cacheKey);
        if (cached) {
          res.setHeader('X-Cache', 'HIT');
          res.setHeader('X-Cache-Key', cacheKey);
          writeJson(res, 200, cached.data);
          return;
        }
        res.setHeader('X-Cache', 'MISS');
        const originalWriteJson = writeJson;
        const cachingWriteJson = (
          res: import('node:http').ServerResponse,
          statusCode: number,
          data: unknown
        ) => {
          if (statusCode === 200) {
            cachedResponse = data;
          }
          originalWriteJson(res, statusCode, data);
        };
        routeContext.writeJson = cachingWriteJson;
      }

      if (await handlePlatformRoutes(routeContext)) {
        if (isCacheable && cachedResponse) {
          const ttl = getCacheTtl(reqUrl.pathname);
          apiCache.set(cacheKey, cachedResponse, ttl);
        }
        return;
      }
      if (req.method === 'GET' && reqUrl.pathname === '/api/broker/health') {
        const brokerHealth = await getBrokerHealthSnapshot(config);
        writeJson(res, 200, {
          ok: true,
          brokerAdapter: brokerHealth.adapter,
          customBrokerConfigured: brokerHealth.customBrokerConfigured,
          alpacaConfigured: brokerHealth.alpacaConfigured,
          connected: brokerHealth.connected,
        });
        return;
      }
      if (req.method === 'POST' && reqUrl.pathname === '/api/broker/orders') {
        await handleUnifiedBrokerSubmit(config, req, res);
        return;
      }
      if (req.method === 'GET' && reqUrl.pathname === '/api/broker/state') {
        await handleUnifiedBrokerState(config, res);
        return;
      }
      if (req.method === 'DELETE' && reqUrl.pathname.startsWith('/api/broker/orders/')) {
        const orderId = reqUrl.pathname.split('/').at(-1);
        await handleUnifiedBrokerCancel(config, orderId!, res);
        return;
      }
      if (req.method === 'GET' && reqUrl.pathname === '/api/alpaca/market/snapshots') {
        await handleSnapshots(config, reqUrl, res);
        return;
      }
      if (req.method === 'GET' && reqUrl.pathname === '/api/alpaca/market/bars') {
        await handleHistoricalBars(config, reqUrl, res);
        return;
      }
      if (req.method === 'POST' && reqUrl.pathname === '/api/alpaca/broker/orders') {
        await handleSubmitOrders(config, req, res);
        return;
      }
      if (req.method === 'GET' && reqUrl.pathname === '/api/alpaca/broker/state') {
        await handleBrokerState(config, res);
        return;
      }
      if (req.method === 'DELETE' && reqUrl.pathname.startsWith('/api/alpaca/broker/orders/')) {
        const orderId = reqUrl.pathname.split('/').at(-1);
        await handleCancelOrder(config, orderId!, res);
        return;
      }
      writeJson(res, 404, { message: 'not found' });
    } catch (error) {
      log.error({ err: error, reqId, path: req.url, method: req.method }, 'request error');
      // Never leak internal error details to the client on 5xx responses.
      writeJson(res, 500, { message: 'Internal server error', ...(reqId ? { reqId } : {}) });
    }
  };
}

export function createGatewayServer(options: Record<string, unknown> = {}) {
  return createServer(createGatewayHandler(options));
}

export function startGatewayServer(options: Record<string, unknown> = {}) {
  const config = createGatewayConfig(options);
  const server = createGatewayServer(options);
  server.listen(config.gatewayPort, '127.0.0.1', () => {
    log.info({ port: config.gatewayPort }, 'gateway listening');
  });
  return server;
}
