// @ts-nocheck
import {
  describeArchitecture,
  listArchitectureLayers,
  listModules,
} from '../../../modules/registry.js';

export function handleHealthRoutes({ req, reqUrl, res, config, writeJson }) {
  if (req.method === 'GET' && reqUrl.pathname === '/api/health') {
    writeJson(res, 200, {
      ok: true,
      architectureLayers: listArchitectureLayers().length,
      modules: listModules().length,
      tradingMode: config.tradingMode,
      brokerAdapter: config.brokerAdapter,
      brokerConfigured:
        config.brokerAdapter === 'custom-http'
          ? Boolean(config.brokerUpstreamUrl)
          : Boolean(config.alpacaKeyId && config.alpacaSecretKey),
      liveTradingEnabled: Boolean(config.liveTradingEnabled),
      alpacaConfigured: Boolean(config.alpacaKeyId && config.alpacaSecretKey),
      alpacaUsePaper: config.alpacaUsePaper,
      alpacaDataFeed: config.alpacaDataFeed,
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
