import { runCycle } from './cycle-runner.mjs';

function chinaNow() {
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

function logEvent(state, kind, title, copy) {
  const now = chinaNow();
  state.activityLog.unshift({ kind, title, copy, time: now.time });
  state.activityLog = state.activityLog.slice(0, 40);
}

function computeAccount(account, stockStates) {
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

function seededNoise(index, step) {
  const base = Math.sin(index * 12.9898 + step * 78.233) * 43758.5453;
  return base - Math.floor(base);
}

function sanitizeQuoteNumber(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function scoreStock(stock, config) {
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

function updateTicker(stock, index, cycle, riskGuard, stockCount, config) {
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

function applyQuotePatch(stockStates, quotes, config) {
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

function createOrderRecord(state, accountId, side, symbol, qty, price, status, tag, extra = {}) {
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

function prependOrder(account, order) {
  account.orders.unshift(order);
  account.orders = account.orders.slice(0, 50);
}

function reserveIntentOnShadowAccount(account, intent) {
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

function buyPosition(account, stock, ratio, tag, state) {
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

function sellPosition(account, stock, ratio, tag, state) {
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
    || state.accounts.live.orders.some((order) => order.symbol === symbol && order.side === side && ['new', 'accepted', 'pending_new', 'partially_filled'].includes(String(order.status || '').toLowerCase()));
}

function buildRemoteBuyIntent(state, account, stock, ratio, tag) {
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

function buildRemoteSellIntent(state, account, stock, ratio, tag) {
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

function riskOffIfNeeded(state, brokerSupportsRemoteExecution) {
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

function executeStrategy(state, brokerSupportsRemoteExecution) {
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

function applyRemoteOrderSubmissions(state, orders) {
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
  });
  state.brokerOrderStatusMap = nextMap;
  state.accounts.live.orders = nextOrders.slice(0, 50);
  state.approvalQueue = state.approvalQueue.filter((intent) => !nextOrders.some((order) => (
    order.clientOrderId && intent.clientOrderId === order.clientOrderId
  ) || (
    order.symbol === intent.symbol && order.side === intent.side && ['new', 'accepted', 'pending_new', 'partially_filled'].includes(String(order.status || '').toLowerCase())
  )));
  state.pendingLiveIntents = state.pendingLiveIntents.filter((intent) => !nextOrders.some((order) => (
    order.clientOrderId && intent.clientOrderId === order.clientOrderId
  ) || (
    order.symbol === intent.symbol && order.side === intent.side && ['new', 'accepted', 'pending_new', 'partially_filled'].includes(String(order.status || '').toLowerCase())
  )));
}

function applyBrokerSnapshot(state, snapshot) {
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

function applyControlPlaneResolution(state, resolution) {
  state.controlPlane = { ...resolution.controlPlane };
  state.integrationStatus.broker.connected = resolution.brokerHealth.connected;
  state.integrationStatus.broker.message = resolution.brokerExecution.message || resolution.controlPlane.routeHint;
  state.routeCopy = resolution.controlPlane.routeHint || state.routeCopy;
  applyRemoteOrderSubmissions(state, resolution.brokerExecution.submittedOrders || []);
  (resolution.brokerExecution.rejectedOrders || []).forEach((order) => {
    logEvent(state, 'info', `Remote order rejected ${order.symbol}`, `${order.side} ${order.qty} shares were rejected by broker.`);
  });
  applyBrokerSnapshot(state, resolution.brokerExecution.snapshot);
  computeAccount(state.accounts.paper, state.stockStates);
  computeAccount(state.accounts.live, state.stockStates);
}

function buildCyclePayload(state) {
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

export async function runStateCycle(previousState, context) {
  const state = structuredClone(previousState);
  const brokerSupportsRemoteExecution = state.integrationStatus.broker.provider !== 'simulated';
  state.cycle += 1;
  const now = chinaNow();
  state.marketClock = `${now.date} ${now.time}`;
  state.engineStatus = state.mode === 'manual' ? 'MANUAL READY' : 'LIVE EXECUTION';
  state.stockStates.forEach((stock, index) => updateTicker(stock, index, state.cycle, state.toggles.riskGuard, state.stockStates.length, state.config));

  const marketSnapshot = await context.getMarketSnapshot({
    provider: state.integrationStatus.marketData.provider,
    symbols: state.stockStates.map((stock) => stock.symbol),
  });
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

  const resolution = await runCycle(buildCyclePayload(state), context);
  applyControlPlaneResolution(state, resolution);

  return {
    ok: true,
    state,
    resolution,
  };
}
