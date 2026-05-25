import {
  describeArchitecture,
  listArchitectureLayers,
  listModules,
} from '../../../modules/registry.js';
import type { GatewayRouteContext } from '../types.js';

export function handleHealthRoutes({ req, reqUrl, res, config, writeJson }: GatewayRouteContext) {
  const cfg = config as Record<string, any>;
  if (req.method === 'GET' && reqUrl.pathname === '/api/health') {
    writeJson(res, 200, {
      ok: true,
      architectureLayers: listArchitectureLayers().length,
      modules: listModules().length,
      tradingMode: cfg.tradingMode,
      brokerAdapter: cfg.brokerAdapter,
      brokerConfigured:
        cfg.brokerAdapter === 'custom-http'
          ? Boolean(cfg.brokerUpstreamUrl)
          : Boolean(cfg.alpacaKeyId && cfg.alpacaSecretKey),
      liveTradingEnabled: Boolean(cfg.liveTradingEnabled),
      alpacaConfigured: Boolean(cfg.alpacaKeyId && cfg.alpacaSecretKey),
      alpacaUsePaper: cfg.alpacaUsePaper,
      alpacaDataFeed: cfg.alpacaDataFeed,
    });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/modules') {
    writeJson(res, 200, { ok: true, modules: listModules() });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/architecture') {
    writeJson(res, 200, { ok: true, architecture: describeArchitecture() });
    return true;
  }

  return false;
}
