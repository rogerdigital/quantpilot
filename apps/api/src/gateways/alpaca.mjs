import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { appendAuditRecord, listAuditRecords } from '../modules/audit/service.mjs';
import { getSession } from '../modules/auth/service.mjs';
import { listModules } from '../modules/registry.mjs';
import { listNotifications } from '../modules/notification/service.mjs';
import { listRiskEvents } from '../modules/risk/service.mjs';
import { listSchedulerTicks } from '../modules/scheduler/service.mjs';
import { runCycle } from '../modules/task-orchestrator/cycle-runner.mjs';
import { runStateCycle } from '../modules/task-orchestrator/state-runner.mjs';
import { listCycles, recordAction, recordCycleRun } from '../modules/task-orchestrator/service.mjs';

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

const GATEWAY_PORT = Number(process.env.GATEWAY_PORT || 8787);
const ALPACA_KEY_ID = process.env.ALPACA_KEY_ID || '';
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY || '';
const ALPACA_USE_PAPER = `${process.env.ALPACA_USE_PAPER || 'true'}` !== 'false';
const ALPACA_DATA_FEED = process.env.ALPACA_DATA_FEED || 'iex';
const ALPACA_TRADING_BASE = ALPACA_USE_PAPER ? 'https://paper-api.alpaca.markets' : 'https://api.alpaca.markets';
const ALPACA_DATA_BASE = 'https://data.alpaca.markets';
const BROKER_ADAPTER = process.env.BROKER_ADAPTER || 'alpaca';
const BROKER_UPSTREAM_URL = (process.env.BROKER_UPSTREAM_URL || '').replace(/\/$/, '');
const BROKER_UPSTREAM_API_KEY = process.env.BROKER_UPSTREAM_API_KEY || '';
const BROKER_UPSTREAM_AUTH_SCHEME = process.env.BROKER_UPSTREAM_AUTH_SCHEME || 'Bearer';

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

function alpacaHeaders(withJson = false) {
  return {
    Accept: 'application/json',
    ...(withJson ? { 'Content-Type': 'application/json' } : {}),
    'APCA-API-KEY-ID': ALPACA_KEY_ID,
    'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
  };
}

function ensureConfigured() {
  return Boolean(ALPACA_KEY_ID && ALPACA_SECRET_KEY);
}

function customBrokerHeaders(withJson = false) {
  return {
    Accept: 'application/json',
    ...(withJson ? { 'Content-Type': 'application/json' } : {}),
    ...(BROKER_UPSTREAM_API_KEY ? { Authorization: `${BROKER_UPSTREAM_AUTH_SCHEME} ${BROKER_UPSTREAM_API_KEY}` } : {}),
  };
}

function ensureCustomBrokerConfigured() {
  return Boolean(BROKER_UPSTREAM_URL);
}

async function getBrokerHealthSnapshot() {
  return {
    adapter: BROKER_ADAPTER,
    connected: BROKER_ADAPTER === 'custom-http' ? ensureCustomBrokerConfigured() : ensureConfigured(),
    customBrokerConfigured: ensureCustomBrokerConfigured(),
    alpacaConfigured: ensureConfigured(),
  };
}

async function executeBrokerCycle({ liveTradeEnabled, orders }) {
  const baseUrl = `http://127.0.0.1:${GATEWAY_PORT}`;
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

async function getMarketSnapshot({ provider, symbols }) {
  if (!Array.isArray(symbols) || !symbols.length || provider === 'simulated') {
    return {
      label: provider === 'simulated' ? 'Local Simulated Market Data' : 'Market Data',
      connected: true,
      message: 'Using the local simulated market data stream.',
      quotes: [],
    };
  }

  if (provider === 'alpaca') {
    const upstream = new URL(`http://127.0.0.1:${GATEWAY_PORT}/api/alpaca/market/snapshots`);
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
      message: payload?.message || `Market snapshot HTTP ${response.status}`,
      quotes: Array.isArray(payload?.quotes) ? payload.quotes : [],
    };
  }

  return {
    label: 'HTTP Market Gateway',
    connected: false,
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

async function handleSnapshots(reqUrl, res) {
  if (!ensureConfigured()) {
    writeJson(res, 503, { message: 'Alpaca credentials are not configured on gateway.', quotes: [] });
    return;
  }
  const symbols = reqUrl.searchParams.get('symbols') || '';
  const upstream = new URL('/v2/stocks/snapshots', ALPACA_DATA_BASE);
  upstream.searchParams.set('symbols', symbols);
  upstream.searchParams.set('feed', ALPACA_DATA_FEED);
  const response = await fetch(upstream, { headers: alpacaHeaders(false) });
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

async function handleSubmitOrders(req, res) {
  if (!ensureConfigured()) {
    writeJson(res, 503, { message: 'Alpaca credentials are not configured on gateway.', orders: [] });
    return;
  }
  const body = await readJsonBody(req);
  const orders = Array.isArray(body?.orders) ? body.orders : [];
  const results = [];
  const rejectedOrders = [];
  for (const [index, order] of orders.entries()) {
    const response = await fetch(`${ALPACA_TRADING_BASE}/v2/orders`, {
      method: 'POST',
      headers: alpacaHeaders(true),
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

async function handleBrokerState(res) {
  if (!ensureConfigured()) {
    writeJson(res, 503, { message: 'Alpaca credentials are not configured on gateway.' });
    return;
  }
  const [accountRes, positionsRes, ordersRes] = await Promise.all([
    fetch(`${ALPACA_TRADING_BASE}/v2/account`, { headers: alpacaHeaders(false) }),
    fetch(`${ALPACA_TRADING_BASE}/v2/positions`, { headers: alpacaHeaders(false) }),
    fetch(`${ALPACA_TRADING_BASE}/v2/orders?status=all&direction=desc&limit=50`, { headers: alpacaHeaders(false) }),
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

async function handleCancelOrder(orderId, res) {
  if (!ensureConfigured()) {
    writeJson(res, 503, { message: 'Alpaca credentials are not configured on gateway.' });
    return;
  }
  const response = await fetch(`${ALPACA_TRADING_BASE}/v2/orders/${orderId}`, {
    method: 'DELETE',
    headers: alpacaHeaders(false),
  });
  if (!response.ok && response.status !== 204) {
    writeJson(res, response.status, { message: `alpaca cancel error: HTTP ${response.status}` });
    return;
  }
  writeJson(res, 200, { message: `gateway cancel request accepted for ${orderId}` });
}

async function handleCustomBrokerSubmit(req, res) {
  if (!ensureCustomBrokerConfigured()) {
    writeJson(res, 503, { message: 'Custom broker upstream is not configured on gateway.', orders: [], rejectedOrders: [] });
    return;
  }
  const body = await readJsonBody(req);
  const response = await fetch(`${BROKER_UPSTREAM_URL}/orders`, {
    method: 'POST',
    headers: customBrokerHeaders(true),
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  writeJson(res, response.ok ? 200 : response.status, {
    message: payload?.message || (response.ok ? 'custom broker submit ok' : `custom broker submit error: HTTP ${response.status}`),
    orders: Array.isArray(payload?.orders) ? payload.orders : [],
    rejectedOrders: Array.isArray(payload?.rejectedOrders) ? payload.rejectedOrders : [],
  });
}

async function handleCustomBrokerState(res) {
  if (!ensureCustomBrokerConfigured()) {
    writeJson(res, 503, { message: 'Custom broker upstream is not configured on gateway.' });
    return;
  }
  const response = await fetch(`${BROKER_UPSTREAM_URL}/state`, {
    headers: customBrokerHeaders(false),
  });
  const payload = await response.json().catch(() => ({}));
  writeJson(res, response.ok ? 200 : response.status, {
    message: payload?.message || (response.ok ? 'custom broker state sync ok' : `custom broker state error: HTTP ${response.status}`),
    account: payload?.account || null,
    positions: Array.isArray(payload?.positions) ? payload.positions : [],
    orders: Array.isArray(payload?.orders) ? payload.orders : [],
  });
}

async function handleCustomBrokerCancel(orderId, res) {
  if (!ensureCustomBrokerConfigured()) {
    writeJson(res, 503, { message: 'Custom broker upstream is not configured on gateway.' });
    return;
  }
  const response = await fetch(`${BROKER_UPSTREAM_URL}/orders/${orderId}`, {
    method: 'DELETE',
    headers: customBrokerHeaders(false),
  });
  const payload = await response.json().catch(() => ({}));
  writeJson(res, response.ok ? 200 : response.status, {
    message: payload?.message || (response.ok ? `custom broker cancel accepted for ${orderId}` : `custom broker cancel error: HTTP ${response.status}`),
  });
}

async function handleUnifiedBrokerSubmit(req, res) {
  if (BROKER_ADAPTER === 'custom-http') {
    await handleCustomBrokerSubmit(req, res);
    return;
  }
  await handleSubmitOrders(req, res);
}

async function handleUnifiedBrokerState(res) {
  if (BROKER_ADAPTER === 'custom-http') {
    await handleCustomBrokerState(res);
    return;
  }
  await handleBrokerState(res);
}

async function handleUnifiedBrokerCancel(orderId, res) {
  if (BROKER_ADAPTER === 'custom-http') {
    await handleCustomBrokerCancel(orderId, res);
    return;
  }
  await handleCancelOrder(orderId, res);
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      writeJson(res, 204, {});
      return;
    }
    const reqUrl = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
    if (req.method === 'GET' && reqUrl.pathname === '/api/health') {
      writeJson(res, 200, {
        ok: true,
        modules: listModules().length,
        brokerAdapter: BROKER_ADAPTER,
        alpacaConfigured: ensureConfigured(),
        alpacaUsePaper: ALPACA_USE_PAPER,
        alpacaDataFeed: ALPACA_DATA_FEED,
      });
      return;
    }
    if (req.method === 'GET' && reqUrl.pathname === '/api/auth/session') {
      writeJson(res, 200, getSession());
      return;
    }
    if (req.method === 'GET' && reqUrl.pathname === '/api/modules') {
      writeJson(res, 200, {
        ok: true,
        modules: listModules(),
      });
      return;
    }
    if (req.method === 'GET' && reqUrl.pathname === '/api/audit/records') {
      writeJson(res, 200, {
        ok: true,
        records: listAuditRecords(),
      });
      return;
    }
    if (req.method === 'POST' && reqUrl.pathname === '/api/audit/records') {
      const body = await readJsonBody(req);
      writeJson(res, 200, {
        ok: true,
        record: appendAuditRecord(body),
      });
      return;
    }
    if (req.method === 'GET' && reqUrl.pathname === '/api/notification/events') {
      writeJson(res, 200, {
        ok: true,
        events: listNotifications(),
      });
      return;
    }
    if (req.method === 'GET' && reqUrl.pathname === '/api/risk/events') {
      writeJson(res, 200, {
        ok: true,
        events: listRiskEvents(),
      });
      return;
    }
    if (req.method === 'GET' && reqUrl.pathname === '/api/scheduler/ticks') {
      writeJson(res, 200, {
        ok: true,
        ticks: listSchedulerTicks(),
      });
      return;
    }
    if (req.method === 'GET' && reqUrl.pathname === '/api/task-orchestrator/cycles') {
      writeJson(res, 200, {
        ok: true,
        cycles: listCycles(),
      });
      return;
    }
    if (req.method === 'POST' && reqUrl.pathname === '/api/task-orchestrator/cycles') {
      const body = await readJsonBody(req);
      writeJson(res, 200, {
        ok: true,
        cycle: recordCycleRun(body),
      });
      return;
    }
    if (req.method === 'POST' && reqUrl.pathname === '/api/task-orchestrator/cycles/run') {
      const body = await readJsonBody(req);
      writeJson(res, 200, await runCycle(body, {
        getBrokerHealth: getBrokerHealthSnapshot,
        executeBrokerCycle,
      }));
      return;
    }
    if (req.method === 'POST' && reqUrl.pathname === '/api/task-orchestrator/state/run') {
      const body = await readJsonBody(req);
      writeJson(res, 200, await runStateCycle(body?.state, {
        getBrokerHealth: getBrokerHealthSnapshot,
        executeBrokerCycle,
        getMarketSnapshot,
      }));
      return;
    }
    if (req.method === 'POST' && reqUrl.pathname === '/api/task-orchestrator/actions') {
      const body = await readJsonBody(req);
      writeJson(res, 200, {
        ok: true,
        action: recordAction(body),
      });
      return;
    }
    if (req.method === 'GET' && reqUrl.pathname === '/api/broker/health') {
      const brokerHealth = await getBrokerHealthSnapshot();
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
      await handleUnifiedBrokerSubmit(req, res);
      return;
    }
    if (req.method === 'GET' && reqUrl.pathname === '/api/broker/state') {
      await handleUnifiedBrokerState(res);
      return;
    }
    if (req.method === 'DELETE' && reqUrl.pathname.startsWith('/api/broker/orders/')) {
      const orderId = reqUrl.pathname.split('/').at(-1);
      await handleUnifiedBrokerCancel(orderId, res);
      return;
    }
    if (req.method === 'GET' && reqUrl.pathname === '/api/alpaca/market/snapshots') {
      await handleSnapshots(reqUrl, res);
      return;
    }
    if (req.method === 'POST' && reqUrl.pathname === '/api/alpaca/broker/orders') {
      await handleSubmitOrders(req, res);
      return;
    }
    if (req.method === 'GET' && reqUrl.pathname === '/api/alpaca/broker/state') {
      await handleBrokerState(res);
      return;
    }
    if (req.method === 'DELETE' && reqUrl.pathname.startsWith('/api/alpaca/broker/orders/')) {
      const orderId = reqUrl.pathname.split('/').at(-1);
      await handleCancelOrder(orderId, res);
      return;
    }
    writeJson(res, 404, { message: 'not found' });
  } catch (error) {
    writeJson(res, 500, { message: error instanceof Error ? error.message : 'unknown gateway error' });
  }
});

server.listen(GATEWAY_PORT, '127.0.0.1', () => {
  console.log(`Quant Studio gateway listening on http://127.0.0.1:${GATEWAY_PORT}`);
});
