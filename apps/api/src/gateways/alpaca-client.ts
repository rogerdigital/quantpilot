import type { IncomingMessage, ServerResponse } from 'node:http';
import type { GatewayConfig } from './alpaca-config.js';

export function writeJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin':
      process.env.CORS_ORIGINS?.split(',')[0]?.trim() || 'http://localhost:8080',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  });
  res.end(JSON.stringify(payload));
}

export function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk: Buffer) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) reject(new Error('body too large'));
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('invalid json'));
      }
    });
    req.on('error', reject);
  });
}

function alpacaHeaders(config: GatewayConfig, withJson = false) {
  return {
    Accept: 'application/json',
    ...(withJson ? { 'Content-Type': 'application/json' } : {}),
    'APCA-API-KEY-ID': config.alpacaKeyId,
    'APCA-API-SECRET-KEY': config.alpacaSecretKey,
  };
}

function ensureConfigured(config: GatewayConfig) {
  return Boolean(config.alpacaKeyId && config.alpacaSecretKey);
}

function customBrokerHeaders(config: GatewayConfig, withJson = false) {
  return {
    Accept: 'application/json',
    ...(withJson ? { 'Content-Type': 'application/json' } : {}),
    ...(config.brokerUpstreamApiKey
      ? { Authorization: `${config.brokerUpstreamAuthScheme} ${config.brokerUpstreamApiKey}` }
      : {}),
  };
}

function ensureCustomBrokerConfigured(config: GatewayConfig) {
  return Boolean(config.brokerUpstreamUrl);
}

export async function getBrokerHealthSnapshot(config: GatewayConfig) {
  return {
    adapter: config.brokerAdapter,
    connected:
      config.brokerAdapter === 'custom-http'
        ? ensureCustomBrokerConfigured(config)
        : ensureConfigured(config),
    customBrokerConfigured: ensureCustomBrokerConfigured(config),
    alpacaConfigured: ensureConfigured(config),
  };
}

export async function executeBrokerCycle(
  config: GatewayConfig,
  { liveTradeEnabled, orders }: { liveTradeEnabled: boolean; orders: unknown[] }
) {
  const baseUrl = `http://127.0.0.1:${config.gatewayPort}`;
  const submittedOrders: unknown[] = [];
  const rejectedOrders: unknown[] = [];
  const messages: string[] = [];

  if (liveTradeEnabled && Array.isArray(orders) && orders.length) {
    const submitResponse = await fetch(`${baseUrl}/api/broker/orders`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        orders,
      }),
    });
    const submitPayload = (await submitResponse.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    messages.push(
      (submitPayload?.message as string) || `Broker order submission HTTP ${submitResponse.status}`
    );
    submittedOrders.push(...(Array.isArray(submitPayload?.orders) ? submitPayload.orders : []));
    rejectedOrders.push(
      ...(Array.isArray(submitPayload?.rejectedOrders) ? submitPayload.rejectedOrders : [])
    );
  }

  const stateResponse = await fetch(`${baseUrl}/api/broker/state`, {
    headers: {
      Accept: 'application/json',
    },
  });
  const statePayload = (await stateResponse.json().catch(() => ({}))) as Record<string, unknown>;
  if (statePayload?.message) {
    messages.push(statePayload.message as string);
  }

  return {
    connected: Boolean(stateResponse.ok && statePayload),
    message: messages.filter(Boolean).join(' '),
    submittedOrders,
    rejectedOrders,
    snapshot: stateResponse.ok
      ? {
          connected: true,
          message: (statePayload?.message as string) || 'Broker state sync succeeded.',
          account: statePayload?.account || null,
          positions: Array.isArray(statePayload?.positions) ? statePayload.positions : [],
          orders: Array.isArray(statePayload?.orders) ? statePayload.orders : [],
        }
      : {
          connected: false,
          message:
            (statePayload?.message as string) ||
            `Broker state sync failed with HTTP ${stateResponse.status}.`,
        },
  };
}

export async function getMarketSnapshot(
  config: GatewayConfig,
  { provider, symbols }: { provider: string; symbols: string[] }
) {
  if (!Array.isArray(symbols) || !symbols.length || provider === 'simulated') {
    return {
      label: provider === 'simulated' ? 'Local Simulated Market Data' : 'Market Data',
      connected: true,
      fallback: provider !== 'simulated',
      message: 'Using the local simulated market data stream.',
      quotes: [],
    };
  }

  if (provider === 'alpaca') {
    const upstream = new URL(`http://127.0.0.1:${config.gatewayPort}/api/alpaca/market/snapshots`);
    upstream.searchParams.set('symbols', symbols.join(','));
    const response = await fetch(upstream, {
      headers: {
        Accept: 'application/json',
      },
    });
    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    return {
      label: 'Alpaca Market Data via Gateway',
      connected: Boolean(response.ok),
      fallback: !response.ok,
      message: (payload?.message as string) || `Market snapshot HTTP ${response.status}`,
      quotes: Array.isArray(payload?.quotes) ? payload.quotes : [],
    };
  }

  return {
    label: 'HTTP Market Gateway',
    connected: false,
    fallback: true,
    message:
      'Custom HTTP market snapshot is not implemented on the backend yet. Falling back to simulated prices.',
    quotes: [],
  };
}

interface AlpacaOrder {
  id: string;
  client_order_id: string;
  side: string;
  symbol: string;
  qty: string;
  filled_qty: string;
  filled_avg_price: string;
  status: string;
  submitted_at: string;
  updated_at: string;
}

function normalizeAlpacaOrder(order: AlpacaOrder) {
  return {
    id: order.id,
    clientOrderId: order.client_order_id,
    side: String(order.side || '').toUpperCase(),
    symbol: order.symbol,
    qty: Number(order.qty || 0),
    filledQty: Number(order.filled_qty || 0),
    filledAvgPrice: Number(order.filled_avg_price || 0),
    status: order.status || 'unknown',
    submittedAt: order.submitted_at || '',
    updatedAt: order.updated_at || order.submitted_at || '',
    cancelable: ['new', 'accepted', 'pending_new', 'partially_filled'].includes(order.status),
    source: 'alpaca',
  };
}

function normalizeRejectedOrder(order: Record<string, unknown>, reason: string) {
  return {
    clientOrderId: (order?.clientOrderId as string) || '',
    side: String(order?.side || '').toUpperCase(),
    symbol: (order?.symbol as string) || '',
    qty: Number(order?.qty || 0),
    price: Number(order?.price || 0),
    status: 'rejected',
    source: 'alpaca',
    tag: reason,
  };
}

function normalizeAlpacaPosition(position: {
  symbol: string;
  qty: string;
  avg_entry_price: string;
  market_value: string;
}) {
  return {
    symbol: position.symbol,
    qty: Number(position.qty || 0),
    avgCost: Number(position.avg_entry_price || 0),
    marketValue: Number(position.market_value || 0),
  };
}

function normalizeAlpacaSnapshot(symbol: string, snapshot: Record<string, unknown>) {
  const minuteBar = snapshot?.minuteBar as Record<string, number> | undefined;
  const latestTrade = snapshot?.latestTrade as Record<string, number> | undefined;
  const dailyBar = snapshot?.dailyBar as Record<string, number> | undefined;
  const prevDailyBar = snapshot?.prevDailyBar as Record<string, number> | undefined;

  const price = Number(minuteBar?.c ?? latestTrade?.p ?? dailyBar?.c);
  if (!Number.isFinite(price) || price <= 0) return null;
  const prevClose = Number(prevDailyBar?.c ?? dailyBar?.o ?? price);
  const high = Number(dailyBar?.h ?? minuteBar?.h ?? price);
  const low = Number(dailyBar?.l ?? minuteBar?.l ?? price);
  const volume = Number(dailyBar?.v ?? minuteBar?.v ?? 0);
  return {
    symbol,
    price,
    prevClose,
    high,
    low,
    volume,
    turnover: volume * price,
  };
}

function normalizeAlpacaBar(bar: {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}) {
  return {
    time: bar.t ? bar.t.split('T')[0] : '',
    open: Number(bar.o || 0),
    high: Number(bar.h || 0),
    low: Number(bar.l || 0),
    close: Number(bar.c || 0),
    volume: Number(bar.v || 0),
  };
}

export async function handleHistoricalBars(
  config: GatewayConfig,
  reqUrl: URL,
  res: ServerResponse
) {
  if (!ensureConfigured(config)) {
    writeJson(res, 503, { message: 'Alpaca credentials are not configured.', bars: [] });
    return;
  }
  const symbol = reqUrl.searchParams.get('symbol') || '';
  const timeframe = reqUrl.searchParams.get('timeframe') || '1Day';
  const start = reqUrl.searchParams.get('start') || '';
  const end = reqUrl.searchParams.get('end') || '';
  const limit = reqUrl.searchParams.get('limit') || '252';

  if (!symbol) {
    writeJson(res, 400, { message: 'symbol is required', bars: [] });
    return;
  }

  const upstream = new URL(`/v2/stocks/${encodeURIComponent(symbol)}/bars`, config.alpacaDataBase);
  upstream.searchParams.set('timeframe', timeframe);
  if (start) upstream.searchParams.set('start', start);
  if (end) upstream.searchParams.set('end', end);
  upstream.searchParams.set('limit', limit);
  upstream.searchParams.set('feed', config.alpacaDataFeed);
  upstream.searchParams.set('sort', 'asc');

  const response = await fetch(upstream, { headers: alpacaHeaders(config, false) });
  if (!response.ok) {
    writeJson(res, response.status, {
      message: `Alpaca bars error: HTTP ${response.status}`,
      bars: [],
    });
    return;
  }
  const payload = (await response.json()) as {
    bars: { t: string; o: number; h: number; l: number; c: number; v: number }[];
  };
  const bars = Array.isArray(payload?.bars) ? payload.bars.map(normalizeAlpacaBar) : [];
  writeJson(res, 200, {
    symbol,
    timeframe,
    bars,
    message: `Loaded ${bars.length} bars for ${symbol}`,
  });
}

export async function handleSnapshots(config: GatewayConfig, reqUrl: URL, res: ServerResponse) {
  if (!ensureConfigured(config)) {
    writeJson(res, 503, {
      message: 'Alpaca credentials are not configured on gateway.',
      quotes: [],
    });
    return;
  }
  const symbols = reqUrl.searchParams.get('symbols') || '';
  const upstream = new URL('/v2/stocks/snapshots', config.alpacaDataBase);
  upstream.searchParams.set('symbols', symbols);
  upstream.searchParams.set('feed', config.alpacaDataFeed);
  const response = await fetch(upstream, { headers: alpacaHeaders(config, false) });
  if (!response.ok) {
    writeJson(res, response.status, {
      message: `alpaca market error: HTTP ${response.status}`,
      quotes: [],
    });
    return;
  }
  const payload = (await response.json()) as { snapshots?: Record<string, unknown> };
  const quotes = Object.entries(payload?.snapshots || {})
    .map(([symbol, snapshot]) =>
      normalizeAlpacaSnapshot(symbol, snapshot as Record<string, unknown>)
    )
    .filter(Boolean);
  writeJson(res, 200, { message: `gateway market sync ok (${quotes.length})`, quotes });
}

export async function handleSubmitOrders(
  config: GatewayConfig,
  req: IncomingMessage,
  res: ServerResponse
) {
  if (!ensureConfigured(config)) {
    writeJson(res, 503, {
      message: 'Alpaca credentials are not configured on gateway.',
      orders: [],
    });
    return;
  }
  const body = (await readJsonBody(req)) as Record<string, unknown>;
  const orders = Array.isArray(body?.orders) ? body.orders : [];
  const results: unknown[] = [];
  const rejectedOrders: unknown[] = [];
  for (const [index, order] of orders.entries()) {
    const o = order as Record<string, unknown>;
    const response = await fetch(`${config.alpacaTradingBase}/v2/orders`, {
      method: 'POST',
      headers: alpacaHeaders(config, true),
      body: JSON.stringify({
        symbol: o.symbol,
        qty: String(o.qty),
        side: String(o.side || '').toLowerCase(),
        type: 'market',
        time_in_force: 'day',
        client_order_id:
          o.clientOrderId || `qs-${o.account || 'live'}-${o.symbol}-${Date.now()}-${index}`,
      }),
    });
    if (!response.ok) {
      rejectedOrders.push(
        normalizeRejectedOrder(o, `alpaca submit error: HTTP ${response.status}`)
      );
      continue;
    }
    results.push(normalizeAlpacaOrder((await response.json()) as AlpacaOrder));
  }
  const message = rejectedOrders.length
    ? `gateway submitted ${results.length} orders, rejected ${rejectedOrders.length}`
    : `gateway submitted ${results.length} orders`;
  writeJson(res, 200, { message, orders: results, rejectedOrders });
}

export async function handleBrokerState(config: GatewayConfig, res: ServerResponse) {
  if (!ensureConfigured(config)) {
    writeJson(res, 503, { message: 'Alpaca credentials are not configured on gateway.' });
    return;
  }
  const [accountRes, positionsRes, ordersRes] = await Promise.all([
    fetch(`${config.alpacaTradingBase}/v2/account`, { headers: alpacaHeaders(config, false) }),
    fetch(`${config.alpacaTradingBase}/v2/positions`, { headers: alpacaHeaders(config, false) }),
    fetch(`${config.alpacaTradingBase}/v2/orders?status=all&direction=desc&limit=50`, {
      headers: alpacaHeaders(config, false),
    }),
  ]);
  if (!accountRes.ok || !positionsRes.ok || !ordersRes.ok) {
    const status =
      [accountRes.status, positionsRes.status, ordersRes.status].find((item) => item >= 400) || 502;
    writeJson(res, status, {
      message: `alpaca state error: account=${accountRes.status} positions=${positionsRes.status} orders=${ordersRes.status}`,
    });
    return;
  }
  const [account, positions, orders] = await Promise.all([
    accountRes.json() as Promise<Record<string, unknown>>,
    positionsRes.json() as Promise<
      { symbol: string; qty: string; avg_entry_price: string; market_value: string }[]
    >,
    ordersRes.json() as Promise<AlpacaOrder[]>,
  ]);
  writeJson(res, 200, {
    message: 'gateway broker state sync ok',
    account: {
      cash: Number((account as Record<string, unknown>).cash || 0),
      buyingPower: Number((account as Record<string, unknown>).buying_power || 0),
      equity: Number((account as Record<string, unknown>).equity || 0),
    },
    positions: Array.isArray(positions) ? positions.map(normalizeAlpacaPosition) : [],
    orders: Array.isArray(orders) ? orders.map(normalizeAlpacaOrder) : [],
  });
}

export async function handleCancelOrder(
  config: GatewayConfig,
  orderId: string,
  res: ServerResponse
) {
  if (!ensureConfigured(config)) {
    writeJson(res, 503, { message: 'Alpaca credentials are not configured on gateway.' });
    return;
  }
  const response = await fetch(`${config.alpacaTradingBase}/v2/orders/${orderId}`, {
    method: 'DELETE',
    headers: alpacaHeaders(config, false),
  });
  if (!response.ok && response.status !== 204) {
    writeJson(res, response.status, { message: `alpaca cancel error: HTTP ${response.status}` });
    return;
  }
  writeJson(res, 200, { message: `gateway cancel request accepted for ${orderId}` });
}

async function handleCustomBrokerSubmit(
  config: GatewayConfig,
  req: IncomingMessage,
  res: ServerResponse
) {
  if (!ensureCustomBrokerConfigured(config)) {
    writeJson(res, 503, {
      message: 'Custom broker upstream is not configured on gateway.',
      orders: [],
      rejectedOrders: [],
    });
    return;
  }
  const body = await readJsonBody(req);
  const response = await fetch(`${config.brokerUpstreamUrl}/orders`, {
    method: 'POST',
    headers: customBrokerHeaders(config, true),
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  writeJson(res, response.ok ? 200 : response.status, {
    message:
      (payload?.message as string) ||
      (response.ok
        ? 'custom broker submit ok'
        : `custom broker submit error: HTTP ${response.status}`),
    orders: Array.isArray(payload?.orders) ? payload.orders : [],
    rejectedOrders: Array.isArray(payload?.rejectedOrders) ? payload.rejectedOrders : [],
  });
}

async function handleCustomBrokerState(config: GatewayConfig, res: ServerResponse) {
  if (!ensureCustomBrokerConfigured(config)) {
    writeJson(res, 503, { message: 'Custom broker upstream is not configured on gateway.' });
    return;
  }
  const response = await fetch(`${config.brokerUpstreamUrl}/state`, {
    headers: customBrokerHeaders(config, false),
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  writeJson(res, response.ok ? 200 : response.status, {
    message:
      (payload?.message as string) ||
      (response.ok
        ? 'custom broker state sync ok'
        : `custom broker state error: HTTP ${response.status}`),
    account: payload?.account || null,
    positions: Array.isArray(payload?.positions) ? payload.positions : [],
    orders: Array.isArray(payload?.orders) ? payload.orders : [],
  });
}

async function handleCustomBrokerCancel(
  config: GatewayConfig,
  orderId: string,
  res: ServerResponse
) {
  if (!ensureCustomBrokerConfigured(config)) {
    writeJson(res, 503, { message: 'Custom broker upstream is not configured on gateway.' });
    return;
  }
  const response = await fetch(`${config.brokerUpstreamUrl}/orders/${orderId}`, {
    method: 'DELETE',
    headers: customBrokerHeaders(config, false),
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  writeJson(res, response.ok ? 200 : response.status, {
    message:
      (payload?.message as string) ||
      (response.ok
        ? `custom broker cancel accepted for ${orderId}`
        : `custom broker cancel error: HTTP ${response.status}`),
  });
}

export async function handleUnifiedBrokerSubmit(
  config: GatewayConfig,
  req: IncomingMessage,
  res: ServerResponse
) {
  if (config.brokerAdapter === 'custom-http') {
    await handleCustomBrokerSubmit(config, req, res);
    return;
  }
  await handleSubmitOrders(config, req, res);
}

export async function handleUnifiedBrokerState(config: GatewayConfig, res: ServerResponse) {
  if (config.brokerAdapter === 'custom-http') {
    await handleCustomBrokerState(config, res);
    return;
  }
  await handleBrokerState(config, res);
}

export async function handleUnifiedBrokerCancel(
  config: GatewayConfig,
  orderId: string,
  res: ServerResponse
) {
  if (config.brokerAdapter === 'custom-http') {
    await handleCustomBrokerCancel(config, orderId, res);
    return;
  }
  await handleCancelOrder(config, orderId, res);
}
