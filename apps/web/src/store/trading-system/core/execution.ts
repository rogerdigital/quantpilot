import type { AccountState, BrokerOrder, BrokerSnapshot, StockState, TradingState } from '@shared-types/trading.ts';
import { OPEN_ORDER_STATUSES } from './config.ts';
import { createOrderRecord, logEvent, prependOrder } from './shared.ts';

function createRemoteIntent(state: TradingState, side: 'BUY' | 'SELL', symbol: string, qty: number, price: number, tag: string): BrokerOrder {
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

function hasBlockingLiveOrder(state: TradingState, symbol: string, side: 'BUY' | 'SELL') {
  return state.approvalQueue.some((order) => order.symbol === symbol && order.side === side)
    || state.pendingLiveIntents.some((order) => order.symbol === symbol && order.side === side)
    || state.accounts.live.orders.some((order) => order.symbol === symbol && order.side === side && OPEN_ORDER_STATUSES.has(String(order.status || '').toLowerCase()));
}

export function buyPosition(account: AccountState, stock: StockState, ratio: number, tag: string, state: TradingState): BrokerOrder | null {
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

export function sellPosition(account: AccountState, stock: StockState, ratio: number, tag: string, state: TradingState): BrokerOrder | null {
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

export function buildRemoteBuyIntent(state: TradingState, account: AccountState, stock: StockState, ratio: number, tag: string): BrokerOrder | null {
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

export function buildRemoteSellIntent(state: TradingState, account: AccountState, stock: StockState, ratio: number, tag: string): BrokerOrder | null {
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

export function applyRemoteOrderSubmissions(state: TradingState, orders: BrokerOrder[]) {
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

function syncRemoteOrders(state: TradingState, orders: BrokerOrder[] | undefined) {
  if (!orders) {
    return;
  }
  const nextOrders = orders.map((order) => ({
    ...order,
    account: 'live',
    tag: 'Remote',
  }));
  const nextMap: TradingState['brokerOrderStatusMap'] = {};
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

export function applyBrokerSnapshot(state: TradingState, snapshot: BrokerSnapshot | undefined) {
  if (!snapshot) {
    return;
  }
  const live = state.accounts.live;
  if (snapshot.account) {
    live.cash = Number.isFinite(snapshot.account.cash) ? snapshot.account.cash : live.cash;
    live.buyingPower = Number.isFinite(snapshot.account.buyingPower) ? snapshot.account.buyingPower : live.cash;
  }
  if (Array.isArray(snapshot.positions)) {
    const nextHoldings: AccountState['holdings'] = {};
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
