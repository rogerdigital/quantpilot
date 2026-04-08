// @ts-nocheck
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { handleControlPlaneRoutes } from '../app/routes/control-plane-routes.js';
import { handlePlatformRoutes } from '../app/routes/platform-routes.js';

function loadEnvFile(pathname) {
  if (!existsSync(pathname)) return;
  const text = readFileSync(pathname, 'utf8');
  text.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const index = trimmed.indexOf('=');
    if (index === -1) return;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (key && !process.env[key]) process.env[key] = value;
  });
}

loadEnvFile(join(process.cwd(), '.env'));

function createGatewayConfig(overrides = {}) {
  const gatewayPort = Number(overrides.gatewayPort || process.env.GATEWAY_PORT || 8787);
  const alpacaKeyId = overrides.alpacaKeyId ?? process.env.ALPACA_KEY_ID ?? '';
  const alpacaSecretKey = overrides.alpacaSecretKey ?? process.env.ALPACA_SECRET_KEY ?? '';
  const alpacaUsePaper = `${overrides.alpacaUsePaper ?? process.env.ALPACA_USE_PAPER ?? 'true'}` !== 'false';
  const alpacaDataFeed = overrides.alpacaDataFeed ?? process.env.ALPACA_DATA_FEED ?? 'iex';
  const brokerAdapter = overrides.brokerAdapter ?? process.env.BROKER_ADAPTER ?? 'alpaca';
  const brokerUpstreamUrl = (overrides.brokerUpstreamUrl ?? process.env.BROKER_UPSTREAM_URL ?? '').replace(/\/$/, '');
  return {
    gatewayPort,
    alpacaKeyId,
    alpacaSecretKey,
    alpacaUsePaper,
    alpacaDataFeed,
    alpacaTradingBase: alpacaUsePaper ? 'https://paper-api.alpaca.markets' : 'https://api.alpaca.markets',
    alpacaDataBase: 'https://data.alpaca.markets',
    brokerAdapter,
    brokerUpstreamUrl,
    brokerUpstreamApiKey: overrides.brokerUpstreamApiKey ?? process.env.BROKER_UPSTREAM_API_KEY ?? '',
    brokerUpstreamAuthScheme: overrides.brokerUpstreamAuthScheme ?? process.env.BROKER_UPSTREAM_AUTH_SCHEME ?? 'Bearer',
  };
}

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
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

function alpacaHeaders(config, withJson = false) {
  return {
    Accept: 'application/json',
    ...(withJson ? { 'Content-Type': 'application/json' } : {}),
    'APCA-API-KEY-ID': config.alpacaKeyId,
    'APCA-API-SECRET-KEY': config.alpacaSecretKey,
  };
}

function ensureConfigured(config) {
  return Boolean(config.alpacaKeyId && config.alpacaSecretKey);
}

function customBrokerHeaders(config, withJson = false) {
  return {
    Accept: 'application/json',
    ...(withJson ? { 'Content-Type': 'application/json' } : {}),
    ...(config.brokerUpstreamApiKey ? { Authorization: `${config.brokerUpstreamAuthScheme} ${config.brokerUpstreamApiKey}` } : {}),
  };
}

function ensureCustomBrokerConfigured(config) {
  return Boolean(config.brokerUpstreamUrl);
}

async function getBrokerHealthSnapshot(config) {
  return {
    adapter: config.brokerAdapter,
    connected: config.brokerAdapter === 'custom-http' ? ensureCustomBrokerConfigured(config) : ensureConfigured(config),
    customBrokerConfigured: ensureCustomBrokerConfigured(config),
    alpacaConfigured: ensureConfigured(config),
  };
}

async function executeBrokerCycle(config, { liveTradeEnabled, orders }) {
  const baseUrl = `http://127.0.0.1:${config.gatewayPort}`;
  const submittedOrders = [];
  const rejectedOrders = [];
  const messages = [];

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
    const submitPayload = await submitResponse.json().catch(() => ({}));
    messages.push(submitPayload?.message || `Broker order submission HTTP ${submitResponse.status}`);
    submittedOrders.push(...(Array.isArray(submitPayload?.orders) ? submitPayload.orders : []));
    rejectedOrders.push(...(Array.isArray(submitPayload?.rejectedOrders) ? submitPayload.rejectedOrders : []));
  }

  const stateResponse = await fetch(`${baseUrl}/api/broker/state`, {
    headers: {
      Accept: 'application/json',
    },
  });
  const statePayload = await stateResponse.json().catch(() => ({}));
  if (statePayload?.message) {
    messages.push(statePayload.message);
  }

  return {
    connected: Boolean(stateResponse.ok && statePayload),
    message: messages.filter(Boolean).join(' '),
    submittedOrders,
    rejectedOrders,
    snapshot: stateResponse.ok ? {
      connected: true,
      message: statePayload?.message || 'Broker state sync succeeded.',
      account: statePayload?.account || null,
      positions: Array.isArray(statePayload?.positions) ? statePayload.positions : [],
      orders: Array.isArray(statePayload?.orders) ? statePayload.orders : [],
    } : {
      connected: false,
      message: statePayload?.message || `Broker state sync failed with HTTP ${stateResponse.status}.`,
    },
  };
}

async function getMarketSnapshot(config, { provider, symbols }) {
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
    const payload = await response.json().catch(() => ({}));
    return {
      label: 'Alpaca Market Data via Gateway',
      connected: Boolean(response.ok),
      fallback: !response.ok,
      message: payload?.message || `Market snapshot HTTP ${response.status}`,
      quotes: Array.isArray(payload?.quotes) ? payload.quotes : [],
    };
  }

  return {
    label: 'HTTP Market Gateway',
    connected: false,
    fallback: true,
    message: 'Custom HTTP market snapshot is not implemented on the backend yet. Falling back to simulated prices.',
    quotes: [],
  };
}

function normalizeAlpacaOrder(order) {
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

function normalizeRejectedOrder(order, reason) {
  return {
    clientOrderId: order?.clientOrderId || '',
    side: String(order?.side || '').toUpperCase(),
    symbol: order?.symbol || '',
    qty: Number(order?.qty || 0),
    price: Number(order?.price || 0),
    status: 'rejected',
    source: 'alpaca',
    tag: reason,
  };
}

function normalizeAlpacaPosition(position) {
  return {
    symbol: position.symbol,
    qty: Number(position.qty || 0),
    avgCost: Number(position.avg_entry_price || 0),
    marketValue: Number(position.market_value || 0),
  };
}

function normalizeAlpacaSnapshot(symbol, snapshot) {
  const price = Number(snapshot?.minuteBar?.c ?? snapshot?.latestTrade?.p ?? snapshot?.dailyBar?.c);
  if (!Number.isFinite(price) || price <= 0) return null;
  const prevClose = Number(snapshot?.prevDailyBar?.c ?? snapshot?.dailyBar?.o ?? price);
  const high = Number(snapshot?.dailyBar?.h ?? snapshot?.minuteBar?.h ?? price);
  const low = Number(snapshot?.dailyBar?.l ?? snapshot?.minuteBar?.l ?? price);
  const volume = Number(snapshot?.dailyBar?.v ?? snapshot?.minuteBar?.v ?? 0);
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

async function handleSnapshots(config, reqUrl, res) {
  if (!ensureConfigured(config)) {
    writeJson(res, 503, { message: 'Alpaca credentials are not configured on gateway.', quotes: [] });
    return;
  }
  const symbols = reqUrl.searchParams.get('symbols') || '';
  const upstream = new URL('/v2/stocks/snapshots', config.alpacaDataBase);
  upstream.searchParams.set('symbols', symbols);
  upstream.searchParams.set('feed', config.alpacaDataFeed);
  const response = await fetch(upstream, { headers: alpacaHeaders(config, false) });
  if (!response.ok) {
    writeJson(res, response.status, { message: `alpaca market error: HTTP ${response.status}`, quotes: [] });
    return;
  }
  const payload = await response.json();
  const quotes = Object.entries(payload?.snapshots || {})
    .map(([symbol, snapshot]) => normalizeAlpacaSnapshot(symbol, snapshot))
    .filter(Boolean);
  writeJson(res, 200, { message: `gateway market sync ok (${quotes.length})`, quotes });
}

async function handleSubmitOrders(config, req, res) {
  if (!ensureConfigured(config)) {
    writeJson(res, 503, { message: 'Alpaca credentials are not configured on gateway.', orders: [] });
    return;
  }
  const body = await readJsonBody(req);
  const orders = Array.isArray(body?.orders) ? body.orders : [];
  const results = [];
  const rejectedOrders = [];
  for (const [index, order] of orders.entries()) {
    const response = await fetch(`${config.alpacaTradingBase}/v2/orders`, {
      method: 'POST',
      headers: alpacaHeaders(config, true),
      body: JSON.stringify({
        symbol: order.symbol,
        qty: String(order.qty),
        side: String(order.side || '').toLowerCase(),
        type: 'market',
        time_in_force: 'day',
        client_order_id: order.clientOrderId || `qs-${order.account || 'live'}-${order.symbol}-${Date.now()}-${index}`,
      }),
    });
    if (!response.ok) {
      rejectedOrders.push(normalizeRejectedOrder(order, `alpaca submit error: HTTP ${response.status}`));
      continue;
    }
    results.push(normalizeAlpacaOrder(await response.json()));
  }
  const message = rejectedOrders.length
    ? `gateway submitted ${results.length} orders, rejected ${rejectedOrders.length}`
    : `gateway submitted ${results.length} orders`;
  writeJson(res, 200, { message, orders: results, rejectedOrders });
}

async function handleBrokerState(config, res) {
  if (!ensureConfigured(config)) {
    writeJson(res, 503, { message: 'Alpaca credentials are not configured on gateway.' });
    return;
  }
  const [accountRes, positionsRes, ordersRes] = await Promise.all([
    fetch(`${config.alpacaTradingBase}/v2/account`, { headers: alpacaHeaders(config, false) }),
    fetch(`${config.alpacaTradingBase}/v2/positions`, { headers: alpacaHeaders(config, false) }),
    fetch(`${config.alpacaTradingBase}/v2/orders?status=all&direction=desc&limit=50`, { headers: alpacaHeaders(config, false) }),
  ]);
  if (!accountRes.ok || !positionsRes.ok || !ordersRes.ok) {
    const status = [accountRes.status, positionsRes.status, ordersRes.status].find((item) => item >= 400) || 502;
    writeJson(res, status, { message: `alpaca state error: account=${accountRes.status} positions=${positionsRes.status} orders=${ordersRes.status}` });
    return;
  }
  const [account, positions, orders] = await Promise.all([
    accountRes.json(),
    positionsRes.json(),
    ordersRes.json(),
  ]);
  writeJson(res, 200, {
    message: 'gateway broker state sync ok',
    account: {
      cash: Number(account.cash || 0),
      buyingPower: Number(account.buying_power || 0),
      equity: Number(account.equity || 0),
    },
    positions: Array.isArray(positions) ? positions.map(normalizeAlpacaPosition) : [],
    orders: Array.isArray(orders) ? orders.map(normalizeAlpacaOrder) : [],
  });
}

async function handleCancelOrder(config, orderId, res) {
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

async function handleCustomBrokerSubmit(config, req, res) {
  if (!ensureCustomBrokerConfigured(config)) {
    writeJson(res, 503, { message: 'Custom broker upstream is not configured on gateway.', orders: [], rejectedOrders: [] });
    return;
  }
  const body = await readJsonBody(req);
  const response = await fetch(`${config.brokerUpstreamUrl}/orders`, {
    method: 'POST',
    headers: customBrokerHeaders(config, true),
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  writeJson(res, response.ok ? 200 : response.status, {
    message: payload?.message || (response.ok ? 'custom broker submit ok' : `custom broker submit error: HTTP ${response.status}`),
    orders: Array.isArray(payload?.orders) ? payload.orders : [],
    rejectedOrders: Array.isArray(payload?.rejectedOrders) ? payload.rejectedOrders : [],
  });
}

async function handleCustomBrokerState(config, res) {
  if (!ensureCustomBrokerConfigured(config)) {
    writeJson(res, 503, { message: 'Custom broker upstream is not configured on gateway.' });
    return;
  }
  const response = await fetch(`${config.brokerUpstreamUrl}/state`, {
    headers: customBrokerHeaders(config, false),
  });
  const payload = await response.json().catch(() => ({}));
  writeJson(res, response.ok ? 200 : response.status, {
    message: payload?.message || (response.ok ? 'custom broker state sync ok' : `custom broker state error: HTTP ${response.status}`),
    account: payload?.account || null,
    positions: Array.isArray(payload?.positions) ? payload.positions : [],
    orders: Array.isArray(payload?.orders) ? payload.orders : [],
  });
}

async function handleCustomBrokerCancel(config, orderId, res) {
  if (!ensureCustomBrokerConfigured(config)) {
    writeJson(res, 503, { message: 'Custom broker upstream is not configured on gateway.' });
    return;
  }
  const response = await fetch(`${config.brokerUpstreamUrl}/orders/${orderId}`, {
    method: 'DELETE',
    headers: customBrokerHeaders(config, false),
  });
  const payload = await response.json().catch(() => ({}));
  writeJson(res, response.ok ? 200 : response.status, {
    message: payload?.message || (response.ok ? `custom broker cancel accepted for ${orderId}` : `custom broker cancel error: HTTP ${response.status}`),
  });
}

async function handleUnifiedBrokerSubmit(config, req, res) {
  if (config.brokerAdapter === 'custom-http') {
    await handleCustomBrokerSubmit(config, req, res);
    return;
  }
  await handleSubmitOrders(config, req, res);
}

async function handleUnifiedBrokerState(config, res) {
  if (config.brokerAdapter === 'custom-http') {
    await handleCustomBrokerState(config, res);
    return;
  }
  await handleBrokerState(config, res);
}

async function handleUnifiedBrokerCancel(config, orderId, res) {
  if (config.brokerAdapter === 'custom-http') {
    await handleCustomBrokerCancel(config, orderId, res);
    return;
  }
  await handleCancelOrder(config, orderId, res);
}

export function createGatewayHandler(options = {}) {
  const config = createGatewayConfig(options);
  const gatewayDependencies = {
    getBrokerHealth: options.getBrokerHealth || (() => getBrokerHealthSnapshot(config)),
    executeBrokerCycle: options.executeBrokerCycle || ((payload) => executeBrokerCycle(config, payload)),
    getMarketSnapshot: options.getMarketSnapshot || ((payload) => getMarketSnapshot(config, payload)),
  };
  return async function gatewayHandler(req, res) {
    try {
    if (req.method === 'OPTIONS') {
      writeJson(res, 204, {});
      return;
    }
    const reqUrl = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
    const routeContext = {
      req,
      reqUrl,
      res,
      config,
      readJsonBody,
      writeJson,
      gatewayDependencies,
    };
    if (await handlePlatformRoutes(routeContext)) {
      return;
    }
    if (await handleControlPlaneRoutes(routeContext)) {
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
      await handleUnifiedBrokerCancel(config, orderId, res);
      return;
    }
    if (req.method === 'GET' && reqUrl.pathname === '/api/alpaca/market/snapshots') {
      await handleSnapshots(config, reqUrl, res);
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
      await handleCancelOrder(config, orderId, res);
      return;
    }
    writeJson(res, 404, { message: 'not found' });
  } catch (error) {
    writeJson(res, 500, { message: error instanceof Error ? error.message : 'unknown gateway error' });
  }
  };
}

export function createGatewayServer(options = {}) {
  return createServer(createGatewayHandler(options));
}

export function startGatewayServer(options = {}) {
  const config = createGatewayConfig(options);
  const server = createGatewayServer(config);
  server.listen(config.gatewayPort, '127.0.0.1', () => {
    console.log(`Quant Studio gateway listening on http://127.0.0.1:${config.gatewayPort}`);
  });
  return server;
}
