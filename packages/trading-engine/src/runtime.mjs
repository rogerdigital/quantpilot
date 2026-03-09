export const DEFAULT_ENGINE_CONFIG = {
  maxPositionWeight: 0.24,
  targetCashBuffer: 0.18,
  buyThreshold: 74,
  sellThreshold: 38,
  liveSyncRatio: 0.62,
};

export const STOCK_UNIVERSE = [
  { symbol: 'AAPL', name: 'Apple', sector: '消费电子', price: 212.4, drift: 0.12, volatility: 1.5, lotSize: 1 },
  { symbol: 'MSFT', name: 'Microsoft', sector: '软件', price: 413.8, drift: 0.11, volatility: 1.2, lotSize: 1 },
  { symbol: 'NVDA', name: 'NVIDIA', sector: '芯片', price: 884.1, drift: 0.18, volatility: 2.7, lotSize: 1 },
  { symbol: 'AMZN', name: 'Amazon', sector: '电商云计算', price: 178.9, drift: 0.1, volatility: 1.8, lotSize: 1 },
  { symbol: 'META', name: 'Meta', sector: '互联网广告', price: 492.7, drift: 0.13, volatility: 1.9, lotSize: 1 },
  { symbol: 'GOOGL', name: 'Alphabet', sector: '搜索 AI', price: 168.2, drift: 0.1, volatility: 1.5, lotSize: 1 },
  { symbol: 'TSLA', name: 'Tesla', sector: '汽车新能源', price: 192.4, drift: 0.16, volatility: 2.9, lotSize: 1 },
  { symbol: 'JPM', name: 'JPMorgan', sector: '金融', price: 198.6, drift: 0.07, volatility: 1.0, lotSize: 1 },
  { symbol: 'XOM', name: 'Exxon Mobil', sector: '能源', price: 113.1, drift: 0.05, volatility: 1.1, lotSize: 1 },
  { symbol: 'UNH', name: 'UnitedHealth', sector: '医疗', price: 498.3, drift: 0.08, volatility: 1.3, lotSize: 1 },
];

export const INITIAL_SERIES_LENGTH = 48;
export const OPEN_ORDER_STATUSES = new Set(['new', 'accepted', 'pending_new', 'partially_filled']);

export function chinaNow() {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const map = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  });
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    time: `${map.hour}:${map.minute}:${map.second}`,
  };
}

function seededNoise(index, step) {
  const base = Math.sin(index * 12.9898 + step * 78.233) * 43758.5453;
  return base - Math.floor(base);
}

function buildPriceSeries(basePrice, index) {
  const series = [];
  let price = basePrice;
  for (let i = 0; i < INITIAL_SERIES_LENGTH; i += 1) {
    const shock = (seededNoise(index, i) - 0.5) * 0.018;
    const drift = Math.sin((i + index) / 7) * 0.0032;
    price *= 1 + shock + drift;
    series.push(+price.toFixed(2));
  }
  return series;
}

function sanitizeQuoteNumber(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function createAccount(id, label, cash, holdings) {
  return {
    id,
    label,
    cash,
    buyingPower: cash,
    holdings: { ...holdings },
    orders: [],
    equitySeries: [],
    pnlPct: 0,
    exposure: 0,
    nav: cash,
    realizedPnl: 0,
  };
}

export function createTickerState(ticker, index) {
  const history = buildPriceSeries(ticker.price, index);
  const lastPrice = history[history.length - 1];
  return {
    ...ticker,
    price: lastPrice,
    prevClose: history[history.length - 2],
    high: Math.max(...history.slice(-8)),
    low: Math.min(...history.slice(-8)),
    volume: 1000000 + index * 240000,
    turnover: (1000000 + index * 240000) * lastPrice,
    history,
    signal: 'HOLD',
    actionText: 'Watch for engine review',
    score: 50,
    features: {},
  };
}

export function createInitialStockStates(config = DEFAULT_ENGINE_CONFIG) {
  const stockStates = STOCK_UNIVERSE.map((ticker, index) => createTickerState(ticker, index));
  stockStates.forEach((stock) => scoreStock(stock, config));
  return stockStates;
}

export function computeAccount(account, stockStates) {
  let marketValue = 0;
  Object.entries(account.holdings).forEach(([symbol, holding]) => {
    const stock = stockStates.find((item) => item.symbol === symbol);
    if (stock) {
      marketValue += stock.price * holding.shares;
    }
  });
  account.nav = account.cash + marketValue;
  account.exposure = account.nav ? marketValue / account.nav * 100 : 0;
  account.equitySeries.push({ value: account.nav, label: account.label });
  if (account.equitySeries.length > 36) {
    account.equitySeries.shift();
  }
  const base = account.equitySeries[0]?.value || account.nav;
  account.pnlPct = base ? (account.nav / base - 1) * 100 : 0;
}

export function cloneState(state) {
  return {
    ...state,
    integrationStatus: {
      marketData: { ...state.integrationStatus.marketData },
      broker: { ...state.integrationStatus.broker },
    },
    brokerOrderStatusMap: { ...state.brokerOrderStatusMap },
    stockStates: state.stockStates.map((stock) => ({
      ...stock,
      history: [...stock.history],
      features: { ...stock.features },
    })),
    accounts: {
      paper: {
        ...state.accounts.paper,
        holdings: Object.fromEntries(Object.entries(state.accounts.paper.holdings).map(([symbol, holding]) => [symbol, { ...holding }])),
        orders: state.accounts.paper.orders.map((order) => ({ ...order })),
        equitySeries: state.accounts.paper.equitySeries.map((point) => ({ ...point })),
      },
      live: {
        ...state.accounts.live,
        holdings: Object.fromEntries(Object.entries(state.accounts.live.holdings).map(([symbol, holding]) => [symbol, { ...holding }])),
        orders: state.accounts.live.orders.map((order) => ({ ...order })),
        equitySeries: state.accounts.live.equitySeries.map((point) => ({ ...point })),
      },
    },
    approvalQueue: state.approvalQueue.map((order) => ({ ...order })),
    pendingLiveIntents: state.pendingLiveIntents.map((order) => ({ ...order })),
    activityLog: state.activityLog.map((entry) => ({ ...entry })),
    controlPlane: { ...state.controlPlane },
  };
}

export function logEvent(state, kind, title, copy) {
  const now = chinaNow();
  state.activityLog.unshift({ kind, title, copy, time: now.time });
  state.activityLog = state.activityLog.slice(0, 40);
}

export function createOrderRecord(state, accountId, side, symbol, qty, price, status, tag, extra = {}) {
  const now = new Date().toISOString();
  const id = extra.id || `local-${accountId}-${state.orderSeq}`;
  state.orderSeq += 1;
  return {
    id,
    clientOrderId: extra.clientOrderId || id,
    account: accountId,
    side: String(side).toUpperCase(),
    symbol,
    qty,
    filledQty: extra.filledQty ?? qty,
    filledAvgPrice: extra.filledAvgPrice ?? price,
    price,
    status,
    submittedAt: extra.submittedAt || now,
    updatedAt: extra.updatedAt || now,
    cancelable: extra.cancelable || false,
    source: extra.source || 'local',
    tag,
  };
}

export function reserveIntentOnShadowAccount(account, intent) {
  if (intent.side === 'BUY') {
    const cost = (intent.price || 0) * intent.qty;
    account.buyingPower = Math.max(0, account.buyingPower - cost);
    return;
  }
  const holding = account.holdings[intent.symbol];
  if (!holding) {
    return;
  }
  holding.shares = Math.max(0, holding.shares - intent.qty);
  if (!holding.shares) {
    delete account.holdings[intent.symbol];
  }
}

export function prependOrder(account, order) {
  account.orders.unshift(order);
  account.orders = account.orders.slice(0, 50);
}

export function scoreStock(stock, config = DEFAULT_ENGINE_CONFIG) {
  const history = stock.history;
  const last = history.at(-1) || stock.price;
  const prev = history.at(-2) || stock.prevClose || stock.price;
  const short = history.slice(-5).reduce((sum, value) => sum + value, 0) / 5;
  const long = history.slice(-18).reduce((sum, value) => sum + value, 0) / 18;
  const momentum = (last / history[Math.max(history.length - 8, 0)] - 1) * 100;
  const intraday = (last / prev - 1) * 100;
  const volatility = Math.abs(intraday) * 8 + stock.volatility * 6;
  const trend = (short / long - 1) * 100;
  const score = 52 + trend * 8 + momentum * 1.6 - volatility * 0.7 + stock.drift * 28;
  stock.features = { short, long, momentum, intraday, volatility, trend };
  stock.score = Math.max(0, Math.min(100, score));
  if (stock.score >= config.buyThreshold) {
    stock.signal = 'BUY';
    stock.actionText = 'Add candidate';
  } else if (stock.score <= config.sellThreshold) {
    stock.signal = 'SELL';
    stock.actionText = 'Trim or exit';
  } else {
    stock.signal = 'HOLD';
    stock.actionText = 'Hold and watch';
  }
}

export function updateTicker(stock, index, cycle, riskGuard, stockCount, config = DEFAULT_ENGINE_CONFIG) {
  const noise = (seededNoise(index + 1, cycle + 1) - 0.5) * (stock.volatility / 100);
  const directional = Math.sin((cycle + index * 3) / 6) * (stock.drift / 100);
  const shock = riskGuard && index === cycle % stockCount ? -0.003 : 0;
  const next = stock.price * (1 + noise + directional + shock);
  stock.prevClose = stock.price;
  stock.price = Math.max(next, 3);
  stock.history.push(+stock.price.toFixed(2));
  if (stock.history.length > 80) {
    stock.history.shift();
  }
  stock.high = Math.max(...stock.history.slice(-20));
  stock.low = Math.min(...stock.history.slice(-20));
  stock.volume = Math.round(stock.volume * (0.97 + seededNoise(index, cycle) * 0.08));
  stock.turnover = stock.volume * stock.price;
  scoreStock(stock, config);
}

export function applyQuotePatch(stockStates, quotes, config = DEFAULT_ENGINE_CONFIG) {
  if (!quotes.length) {
    return;
  }
  const quoteMap = new Map(quotes.map((quote) => [quote.symbol, quote]));
  stockStates.forEach((stock) => {
    const nextQuote = quoteMap.get(stock.symbol);
    if (!nextQuote) {
      return;
    }
    stock.prevClose = sanitizeQuoteNumber(nextQuote.prevClose, stock.prevClose);
    stock.price = sanitizeQuoteNumber(nextQuote.price, stock.price);
    stock.high = sanitizeQuoteNumber(nextQuote.high, Math.max(stock.high, stock.price));
    stock.low = sanitizeQuoteNumber(nextQuote.low, Math.min(stock.low, stock.price));
    stock.volume = sanitizeQuoteNumber(nextQuote.volume, stock.volume);
    stock.turnover = sanitizeQuoteNumber(nextQuote.turnover, stock.turnover);
    stock.history.push(+stock.price.toFixed(2));
    if (stock.history.length > 80) {
      stock.history.shift();
    }
    scoreStock(stock, config);
  });
}

function createRemoteIntent(state, side, symbol, qty, price, tag) {
  const seq = state.orderSeq;
  const clientOrderId = `sandbox-live-${String(side).toLowerCase()}-${symbol}-${seq}`;
  return createOrderRecord(state, 'live', side, symbol, qty, price, 'pending_submit', tag, {
    id: `intent-${clientOrderId}`,
    clientOrderId,
    filledQty: 0,
    filledAvgPrice: 0,
    cancelable: false,
    source: 'intent',
  });
}

function hasBlockingLiveOrder(state, symbol, side) {
  return state.approvalQueue.some((order) => order.symbol === symbol && order.side === side)
    || state.pendingLiveIntents.some((order) => order.symbol === symbol && order.side === side)
    || state.accounts.live.orders.some((order) => order.symbol === symbol && order.side === side && OPEN_ORDER_STATUSES.has(String(order.status || '').toLowerCase()));
}

export function buyPosition(account, stock, ratio, tag, state) {
  const lot = stock.lotSize || 1;
  const budget = Math.max(account.nav * ratio, 0);
  const shares = Math.floor(Math.min(account.cash, budget) / stock.price / lot) * lot;
  if (shares <= 0) {
    return null;
  }
  const cost = shares * stock.price;
  account.cash -= cost;
  account.buyingPower = account.cash;
  if (!account.holdings[stock.symbol]) {
    account.holdings[stock.symbol] = { shares: 0, avgCost: stock.price };
  }
  const holding = account.holdings[stock.symbol];
  const totalCost = holding.avgCost * holding.shares + cost;
  holding.shares += shares;
  holding.avgCost = totalCost / holding.shares;
  const order = createOrderRecord(state, account.id, 'BUY', stock.symbol, shares, stock.price, 'filled', tag, {
    cancelable: false,
  });
  prependOrder(account, order);
  logEvent(state, 'buy', `${tag} Buy ${stock.symbol}`, `${stock.name} ${shares} shares @ ${stock.price.toFixed(2)}`);
  return order;
}

export function sellPosition(account, stock, ratio, tag, state) {
  const holding = account.holdings[stock.symbol];
  if (!holding || holding.shares <= 0) {
    return null;
  }
  const lot = stock.lotSize || 1;
  const shares = Math.floor(holding.shares * ratio / lot) * lot || Math.floor(holding.shares / lot) * lot || holding.shares;
  const actualShares = Math.min(holding.shares, shares);
  if (actualShares <= 0) {
    return null;
  }
  account.cash += actualShares * stock.price;
  account.buyingPower = account.cash;
  account.realizedPnl += (stock.price - holding.avgCost) * actualShares;
  holding.shares -= actualShares;
  if (holding.shares <= 0) {
    delete account.holdings[stock.symbol];
  }
  const order = createOrderRecord(state, account.id, 'SELL', stock.symbol, actualShares, stock.price, 'filled', tag, {
    cancelable: false,
  });
  prependOrder(account, order);
  logEvent(state, 'sell', `${tag} Sell ${stock.symbol}`, `${stock.name} ${actualShares} shares @ ${stock.price.toFixed(2)}`);
  return order;
}

export function buildRemoteBuyIntent(state, account, stock, ratio, tag) {
  if (hasBlockingLiveOrder(state, stock.symbol, 'BUY')) {
    return null;
  }
  const budget = Math.max(account.nav * ratio, 0);
  const qty = Math.max(Math.floor(Math.min(account.buyingPower, budget) / stock.price), 0);
  if (qty <= 0) {
    return null;
  }
  return createRemoteIntent(state, 'BUY', stock.symbol, qty, stock.price, tag);
}

export function buildRemoteSellIntent(state, account, stock, ratio, tag) {
  if (hasBlockingLiveOrder(state, stock.symbol, 'SELL')) {
    return null;
  }
  const holding = account.holdings[stock.symbol];
  if (!holding || holding.shares <= 0) {
    return null;
  }
  const qty = Math.max(Math.floor(holding.shares * ratio), 1);
  return createRemoteIntent(state, 'SELL', stock.symbol, Math.min(holding.shares, qty), stock.price, tag);
}

export function applyRemoteOrderSubmissions(state, orders) {
  if (!orders?.length) {
    return;
  }
  const acceptedClientOrderIds = new Set(orders.map((order) => order.clientOrderId).filter(Boolean));
  state.pendingLiveIntents = state.pendingLiveIntents.filter((order) => !acceptedClientOrderIds.has(order.clientOrderId));
  state.approvalQueue = state.approvalQueue.filter((order) => !acceptedClientOrderIds.has(order.clientOrderId));
  orders.forEach((order) => {
    const normalized = createOrderRecord(
      state,
      'live',
      order.side,
      order.symbol,
      order.qty,
      order.filledAvgPrice || order.price || 0,
      order.status || 'new',
      'Alpaca',
      {
        id: order.id,
        clientOrderId: order.clientOrderId,
        filledQty: order.filledQty || 0,
        filledAvgPrice: order.filledAvgPrice || 0,
        submittedAt: order.submittedAt,
        updatedAt: order.updatedAt,
        cancelable: order.cancelable,
        source: order.source || 'broker',
      }
    );
    prependOrder(state.accounts.live, normalized);
  });
}

function syncRemoteOrders(state, orders) {
  if (!orders) {
    return;
  }
  const nextOrders = orders.map((order) => ({
    ...order,
    account: 'live',
    tag: 'Remote',
  }));
  const nextMap = {};
  nextOrders.forEach((order) => {
    if (!order.id) {
      return;
    }
    nextMap[order.id] = {
      status: order.status || 'unknown',
      filledQty: order.filledQty || 0,
    };
    const previous = state.brokerOrderStatusMap[order.id];
    if (!previous) {
      logEvent(state, 'info', `Broker received order ${order.symbol}`, `${order.side} ${order.qty} shares, status ${order.status}`);
      return;
    }
    if (previous.status !== order.status || previous.filledQty !== order.filledQty) {
      logEvent(
        state,
        order.status === 'filled' ? 'buy' : 'info',
        `Order status updated ${order.symbol}`,
        `${order.side} ${order.filledQty}/${order.qty} shares, status ${order.status}`
      );
    }
  });
  state.brokerOrderStatusMap = nextMap;
  state.accounts.live.orders = nextOrders.slice(0, 50);
  state.approvalQueue = state.approvalQueue.filter((intent) => !nextOrders.some((order) => (
    order.clientOrderId && intent.clientOrderId === order.clientOrderId
  ) || (
    order.symbol === intent.symbol && order.side === intent.side && OPEN_ORDER_STATUSES.has(String(order.status || '').toLowerCase())
  )));
  state.pendingLiveIntents = state.pendingLiveIntents.filter((intent) => !nextOrders.some((order) => (
    order.clientOrderId && intent.clientOrderId === order.clientOrderId
  ) || (
    order.symbol === intent.symbol && order.side === intent.side && OPEN_ORDER_STATUSES.has(String(order.status || '').toLowerCase())
  )));
}

export function applyBrokerSnapshot(state, snapshot) {
  if (!snapshot) {
    return;
  }
  const live = state.accounts.live;
  if (snapshot.account) {
    live.cash = Number.isFinite(snapshot.account.cash) ? snapshot.account.cash : live.cash;
    live.buyingPower = Number.isFinite(snapshot.account.buyingPower) ? snapshot.account.buyingPower : live.cash;
  }
  if (Array.isArray(snapshot.positions)) {
    const nextHoldings = {};
    snapshot.positions.forEach((position) => {
      if (position.qty > 0) {
        nextHoldings[position.symbol] = {
          shares: position.qty,
          avgCost: position.avgCost,
        };
      }
    });
    live.holdings = nextHoldings;
  }
  if (Array.isArray(snapshot.orders)) {
    syncRemoteOrders(state, snapshot.orders);
  }
}

export function riskOffIfNeeded(state, brokerSupportsRemoteExecution) {
  const liveRiskIntents = [];
  const avgVol = state.stockStates.reduce((sum, stock) => sum + Math.abs(stock.features.intraday || 0), 0) / state.stockStates.length;
  if (state.toggles.riskGuard && avgVol > 1.8) {
    state.riskLevel = 'RISK OFF';
    const paperHoldingSymbol = Object.keys(state.accounts.paper.holdings)[0];
    const paperStock = state.stockStates.find((item) => item.symbol === paperHoldingSymbol);
    if (paperStock) {
      sellPosition(state.accounts.paper, paperStock, 0.3, 'Risk Guard', state);
    }
    if (state.toggles.liveTrade) {
      const liveHoldingSymbol = Object.keys(state.accounts.live.holdings)[0];
      const liveStock = state.stockStates.find((item) => item.symbol === liveHoldingSymbol);
      if (liveStock) {
        if (brokerSupportsRemoteExecution) {
          const liveIntent = buildRemoteSellIntent(state, state.accounts.live, liveStock, 0.3, 'Risk Guard');
          if (liveIntent) {
            liveRiskIntents.push(liveIntent);
          }
        } else {
          sellPosition(state.accounts.live, liveStock, 0.3, 'Risk Guard', state);
        }
      }
    }
  } else {
    state.riskLevel = 'NORMAL';
  }
  return liveRiskIntents;
}

export function executeStrategy(state, brokerSupportsRemoteExecution) {
  const ranked = state.stockStates.slice().sort((a, b) => b.score - a.score);
  const topBuy = ranked.filter((stock) => stock.signal === 'BUY').slice(0, 3);
  const topSell = ranked.filter((stock) => stock.signal === 'SELL').slice(0, 3);
  const liveIntents = [];
  const liveShadow = structuredClone(state.accounts.live);

  state.pendingLiveIntents.forEach((intent) => reserveIntentOnShadowAccount(liveShadow, intent));

  state.decisionSummary = topBuy.length
    ? `Priority buys: ${topBuy.map((item) => item.symbol).join(' / ')}`
    : 'No new strong buy signals in this cycle';
  state.decisionCopy = topSell.length
    ? `Trim alert: ${topSell.map((item) => item.symbol).join(' / ')}`
    : 'No high-risk positions under the sell threshold.';
  state.routeCopy = state.toggles.liveTrade
    ? (brokerSupportsRemoteExecution ? 'Paper execution is active and remote live orders are submitted in sync.' : 'The system writes to both the paper and local live accounts.')
    : 'Only the paper account is executing. Live execution is paused.';

  if (!state.toggles.autoTrade) {
    return { liveIntents };
  }

  topBuy.forEach((stock, index) => {
    const weight = Math.max(state.config.maxPositionWeight - index * 0.05, 0.08);
    buyPosition(state.accounts.paper, stock, weight, 'Paper', state);
    if (!state.toggles.liveTrade) {
      return;
    }
    if (brokerSupportsRemoteExecution) {
      const liveIntent = buildRemoteBuyIntent(state, liveShadow, stock, weight * state.config.liveSyncRatio, 'Live Sandbox');
      if (liveIntent) {
        liveIntents.push(liveIntent);
        reserveIntentOnShadowAccount(liveShadow, liveIntent);
      }
    } else {
      buyPosition(state.accounts.live, stock, weight * state.config.liveSyncRatio, 'Live Account', state);
    }
  });

  topSell.forEach((stock) => {
    sellPosition(state.accounts.paper, stock, 0.5, 'Paper', state);
    if (!state.toggles.liveTrade) {
      return;
    }
    if (brokerSupportsRemoteExecution) {
      const liveIntent = buildRemoteSellIntent(state, liveShadow, stock, 0.5, 'Live Sandbox');
      if (liveIntent) {
        liveIntents.push(liveIntent);
        reserveIntentOnShadowAccount(liveShadow, liveIntent);
      }
    } else {
      sellPosition(state.accounts.live, stock, 0.5, 'Live Account', state);
    }
  });

  return { liveIntents };
}

export function applyControlPlaneResolution(state, resolution) {
  const previousCycleId = state.controlPlane.lastCycleId;
  state.controlPlane = {
    ...resolution.controlPlane,
  };
  state.integrationStatus.broker.connected = resolution.brokerHealth.connected;
  state.integrationStatus.broker.message = resolution.brokerExecution.message || resolution.controlPlane.routeHint;
  if (resolution.controlPlane.routeHint) {
    state.routeCopy = resolution.controlPlane.routeHint;
  }
  applyRemoteOrderSubmissions(state, resolution.brokerExecution.submittedOrders || []);
  (resolution.brokerExecution.rejectedOrders || []).forEach((order) => {
    logEvent(state, 'info', `Remote order rejected ${order.symbol}`, `${order.side} ${order.qty} shares were rejected by broker.`);
  });
  applyBrokerSnapshot(state, resolution.brokerExecution.snapshot);
  computeAccount(state.accounts.paper, state.stockStates);
  computeAccount(state.accounts.live, state.stockStates);
  if (resolution.cycle?.id && resolution.cycle.id !== previousCycleId) {
    logEvent(
      state,
      'info',
      `Control plane synced cycle ${resolution.cycle.cycle}`,
      resolution.controlPlane.routeHint || `Control plane status ${resolution.controlPlane.lastStatus}.`
    );
  }
}

export function buildCyclePayload(state) {
  return {
    cycle: state.cycle,
    mode: state.mode,
    riskLevel: state.riskLevel,
    decisionSummary: state.decisionSummary,
    marketClock: state.marketClock,
    pendingApprovals: state.approvalQueue.length,
    liveIntentCount: state.pendingLiveIntents.length,
    brokerConnected: state.integrationStatus.broker.connected,
    marketConnected: state.integrationStatus.marketData.connected,
    liveTradeEnabled: state.toggles.liveTrade,
    pendingLiveIntents: state.pendingLiveIntents,
  };
}

export function advanceLocalState(previousState, { marketSnapshot, brokerSupportsRemoteExecution }) {
  const state = cloneState(previousState);
  state.cycle += 1;
  const now = chinaNow();
  state.marketClock = `${now.date} ${now.time}`;
  state.engineStatus = state.mode === 'manual' ? 'MANUAL READY' : 'LIVE EXECUTION';
  state.stockStates.forEach((stock, index) => updateTicker(stock, index, state.cycle, state.toggles.riskGuard, state.stockStates.length, state.config));
  state.integrationStatus.marketData = {
    provider: state.integrationStatus.marketData.provider,
    label: marketSnapshot.label || state.integrationStatus.marketData.label,
    connected: marketSnapshot.connected,
    message: marketSnapshot.message,
  };
  applyQuotePatch(state.stockStates, marketSnapshot.quotes || [], state.config);

  const riskIntents = riskOffIfNeeded(state, brokerSupportsRemoteExecution);
  const { liveIntents } = executeStrategy(state, brokerSupportsRemoteExecution);
  const nextPendingMap = new Map();
  const nextApprovalMap = new Map();

  state.pendingLiveIntents.forEach((order) => {
    if (order.clientOrderId) {
      nextPendingMap.set(order.clientOrderId, order);
    }
  });
  state.approvalQueue.forEach((order) => {
    if (order.clientOrderId) {
      nextApprovalMap.set(order.clientOrderId, order);
    }
  });

  const newlyCreatedIntents = [...riskIntents, ...liveIntents];
  if (state.toggles.manualApproval) {
    newlyCreatedIntents.forEach((order) => {
      if (order.clientOrderId) {
        nextApprovalMap.set(order.clientOrderId, order);
      }
    });
  } else {
    newlyCreatedIntents.forEach((order) => {
      if (order.clientOrderId) {
        nextPendingMap.set(order.clientOrderId, order);
      }
    });
    state.approvalQueue.forEach((order) => {
      if (order.clientOrderId) {
        nextPendingMap.set(order.clientOrderId, order);
      }
    });
    nextApprovalMap.clear();
  }

  state.pendingLiveIntents = Array.from(nextPendingMap.values());
  state.approvalQueue = Array.from(nextApprovalMap.values());
  computeAccount(state.accounts.paper, state.stockStates);
  computeAccount(state.accounts.live, state.stockStates);
  return state;
}
