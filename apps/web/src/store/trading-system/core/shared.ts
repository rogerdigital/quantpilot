import type { AccountState, BrokerOrder, StockState, TradingState } from '@shared-types/trading.ts';

export function createAccount(id: string, label: string, cash: number, holdings: Record<string, { shares: number; avgCost: number }>): AccountState {
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

export function computeAccount(account: AccountState, stockStates: StockState[]) {
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

export function cloneState(state: TradingState): TradingState {
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

export function logEvent(state: TradingState, kind: string, title: string, copy: string) {
  const now = chinaNow();
  state.activityLog.unshift({ kind, title, copy, time: now.time });
  state.activityLog = state.activityLog.slice(0, 40);
}

export function createOrderRecord(
  state: TradingState,
  accountId: string,
  side: string,
  symbol: string,
  qty: number,
  price: number,
  status: string,
  tag: string,
  extra: Partial<BrokerOrder> = {}
): BrokerOrder {
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

export function reserveIntentOnShadowAccount(account: AccountState, intent: BrokerOrder) {
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

export function prependOrder(account: AccountState, order: BrokerOrder) {
  account.orders.unshift(order);
  account.orders = account.orders.slice(0, 50);
}
