import { describeArchitecture, listArchitectureLayers, listModules } from '../../../modules/registry.js';

export function handleHealthRoutes({ req, reqUrl, res, config, writeJson }) {
  if (req.method === 'GET' && reqUrl.pathname === '/api/health') {
    writeJson(res, 200, {
      ok: true,
      architectureLayers: listArchitectureLayers().length,
      modules: listModules().length,
      brokerAdapter: config.brokerAdapter,
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
