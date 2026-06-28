import { INITIAL_SERIES_LENGTH } from './constants.js';

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
  const map: Record<string, string> = {};
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

function seededNoise(index: number, step: number) {
  const base = Math.sin(index * 12.9898 + step * 78.233) * 43758.5453;
  return base - Math.floor(base);
}

function buildPriceSeries(basePrice: number, index: number) {
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

export function createAccount(
  id: string,
  label: string,
  cash: number,
  holdings: Record<string, any> = {}
) {
  return {
    id,
    label,
    cash,
    initialCapital: cash,
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

export function createTickerState(ticker: any, index: number) {
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

export function computeAccount(account: any, stockStates: any) {
  let marketValue = 0;
  Object.entries(account.holdings).forEach(([symbol, holding]: [string, any]) => {
    const stock = stockStates.find((item: any) => item.symbol === symbol);
    if (stock) {
      marketValue += stock.price * holding.shares;
    }
  });
  account.nav = account.cash + marketValue;
  account.exposure = account.nav ? (marketValue / account.nav) * 100 : 0;
  account.equitySeries.push({ value: account.nav, label: account.label });
  if (account.equitySeries.length > 36) {
    account.equitySeries.shift();
  }
  // PnL percentage is measured against the initial capital, not the first
  // point of the (truncated) equity series — otherwise the base drifts once
  // the series is trimmed past 36 entries.
  const base = account.initialCapital ?? account.equitySeries[0]?.value ?? account.nav;
  account.pnlPct = base ? (account.nav / base - 1) * 100 : 0;
}

export function cloneState(state: any) {
  return {
    ...state,
    integrationStatus: {
      marketData: { ...state.integrationStatus.marketData },
      broker: { ...state.integrationStatus.broker },
    },
    brokerOrderStatusMap: { ...state.brokerOrderStatusMap },
    stockStates: state.stockStates.map((stock: any) => ({
      ...stock,
      history: [...stock.history],
      features: { ...stock.features },
    })),
    accounts: {
      paper: {
        ...state.accounts.paper,
        holdings: Object.fromEntries(
          Object.entries(state.accounts.paper.holdings).map(([symbol, holding]: [string, any]) => [
            symbol,
            { ...holding },
          ])
        ),
        orders: state.accounts.paper.orders.map((order: any) => ({ ...order })),
        equitySeries: state.accounts.paper.equitySeries.map((point: any) => ({ ...point })),
      },
      live: {
        ...state.accounts.live,
        holdings: Object.fromEntries(
          Object.entries(state.accounts.live.holdings).map(([symbol, holding]: [string, any]) => [
            symbol,
            { ...holding },
          ])
        ),
        orders: state.accounts.live.orders.map((order: any) => ({ ...order })),
        equitySeries: state.accounts.live.equitySeries.map((point: any) => ({ ...point })),
      },
    },
    approvalQueue: state.approvalQueue.map((order: any) => ({ ...order })),
    pendingLiveIntents: state.pendingLiveIntents.map((order: any) => ({ ...order })),
    activityLog: state.activityLog.map((entry: any) => ({ ...entry })),
    controlPlane: { ...state.controlPlane },
  };
}

export function logEvent(state: any, kind: string, title: string, copy: string) {
  const now = chinaNow();
  state.activityLog.unshift({ kind, title, copy, time: now.time });
  state.activityLog = state.activityLog.slice(0, 40);
}

export function createOrderRecord(
  state: any,
  accountId: string,
  side: string,
  symbol: string,
  qty: number,
  price: number,
  status: string,
  tag: string,
  extra: Record<string, any> = {}
) {
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

export function reserveIntentOnShadowAccount(account: any, intent: any) {
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

export function prependOrder(account: any, order: any) {
  account.orders.unshift(order);
  account.orders = account.orders.slice(0, 50);
}
