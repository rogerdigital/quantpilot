import { INITIAL_SERIES_LENGTH } from './constants.mjs';

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
