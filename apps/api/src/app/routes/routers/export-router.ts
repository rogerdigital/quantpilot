import { controlPlaneContext } from '../../../../../../packages/control-plane-store/src/context.js';
import { createExportService } from '../../../domains/export/services/export-service.js';
import type { GatewayRouteContext } from '../types.js';

function sendExport(res: any, result: any) {
  if (!result) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, message: 'Resource not found' }));
    return;
  }
  res.writeHead(200, {
    'Content-Type': result.contentType,
    'Content-Disposition': `attachment; filename="${result.filename}"`,
  });
  res.end(result.body);
}

export async function handleExportRoutes({ req, reqUrl, res, writeJson }: GatewayRouteContext) {
  const store = controlPlaneContext.store as any;
  const exportService = createExportService(store);

  // GET /api/export/strategies/:id
  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/export/strategies/')) {
    const parts = reqUrl.pathname.split('/');
    const id = parts[parts.length - 1];
    const format = reqUrl.searchParams.get('format') || 'json';
    const result = exportService.exportStrategy(id, format);
    sendExport(res, result);
    return true;
  }

  // GET /api/export/backtest/:id
  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/export/backtest/')) {
    const parts = reqUrl.pathname.split('/');
    const id = parts[parts.length - 1];
    const format = reqUrl.searchParams.get('format') || 'json';
    const result = exportService.exportBacktest(id, format);
    sendExport(res, result);
    return true;
  }

  // GET /api/export/trades
  if (req.method === 'GET' && reqUrl.pathname === '/api/export/trades') {
    const from = reqUrl.searchParams.get('from');
    const to = reqUrl.searchParams.get('to');
    const format = reqUrl.searchParams.get('format') || 'csv';
    const result = exportService.exportTrades(from, to, format);
    sendExport(res, result);
    return true;
  }

  // GET /api/export/analytics
  if (req.method === 'GET' && reqUrl.pathname === '/api/export/analytics') {
    const format = reqUrl.searchParams.get('format') || 'csv';
    const result = exportService.exportAnalytics(format);
    sendExport(res, result);
    return true;
  }

  return false;
}
