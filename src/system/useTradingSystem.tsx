import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { runtimeConfig } from '../config/runtime.ts';
import { createBrokerProvider } from '../providers/broker.ts';
import { createMarketDataProvider } from '../providers/marketData.ts';
import type { AccountState, BrokerOrder, BrokerProvider, BrokerSnapshot, Holding, MarketDataProvider, StockState, TradingState, TradingSystemContextValue } from '../types/trading.ts';

const TradingSystemContext = createContext<TradingSystemContextValue | null>(null);

const APP_CONFIG = {
  refreshMs: runtimeConfig.refreshMs,
  maxPositionWeight: 0.24,
  targetCashBuffer: 0.18,
  buyThreshold: 74,
  sellThreshold: 38,
  liveSyncRatio: 0.62,
};

const STOCK_UNIVERSE = [
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

const INITIAL_SERIES_LENGTH = 48;
const OPEN_ORDER_STATUSES = new Set(['new', 'accepted', 'pending_new', 'partially_filled']);

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

function createTickerState(ticker: any, index: number): StockState {
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

function createAccount(id: string, label: string, cash: number, holdings: Record<string, Holding>): AccountState {
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
  const map: Record<string, string> = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') map[part.type] = part.value;
  });
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    time: `${map.hour}:${map.minute}:${map.second}`,
  };
}

function sanitizeQuoteNumber(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function scoreStock(stock: StockState) {
  const history = stock.history;
  const last = history.at(-1);
  const prev = history.at(-2);
  const short = history.slice(-5).reduce((sum, value) => sum + value, 0) / 5;
  const long = history.slice(-18).reduce((sum, value) => sum + value, 0) / 18;
  const momentum = (last / history[Math.max(history.length - 8, 0)] - 1) * 100;
  const intraday = (last / prev - 1) * 100;
  const volatility = Math.abs(intraday) * 8 + stock.volatility * 6;
  const trend = (short / long - 1) * 100;
  const score = 52 + trend * 8 + momentum * 1.6 - volatility * 0.7 + stock.drift * 28;
  stock.features = { short, long, momentum, intraday, volatility, trend };
  stock.score = Math.max(0, Math.min(100, score));
  if (stock.score >= APP_CONFIG.buyThreshold) {
    stock.signal = 'BUY';
    stock.actionText = 'Add candidate';
  } else if (stock.score <= APP_CONFIG.sellThreshold) {
    stock.signal = 'SELL';
    stock.actionText = 'Trim or exit';
  } else {
    stock.signal = 'HOLD';
    stock.actionText = 'Hold and watch';
  }
}

function updateTicker(stock: StockState, index: number, cycle: number, riskGuard: boolean) {
  const noise = (seededNoise(index + 1, cycle + 1) - 0.5) * (stock.volatility / 100);
  const directional = Math.sin((cycle + index * 3) / 6) * (stock.drift / 100);
  const shock = riskGuard && index === cycle % STOCK_UNIVERSE.length ? -0.003 : 0;
  const next = stock.price * (1 + noise + directional + shock);
  stock.prevClose = stock.price;
  stock.price = Math.max(next, 3);
  stock.history.push(+stock.price.toFixed(2));
  if (stock.history.length > 80) stock.history.shift();
  stock.high = Math.max(...stock.history.slice(-20));
  stock.low = Math.min(...stock.history.slice(-20));
  stock.volume = Math.round(stock.volume * (0.97 + seededNoise(index, cycle) * 0.08));
  stock.turnover = stock.volume * stock.price;
  scoreStock(stock);
}

function computeAccount(account: AccountState, stockStates: StockState[]) {
  let marketValue = 0;
  Object.entries(account.holdings).forEach(([symbol, holding]) => {
    const stock = stockStates.find((item) => item.symbol === symbol);
    if (stock) marketValue += stock.price * holding.shares;
  });
  account.nav = account.cash + marketValue;
  account.exposure = account.nav ? marketValue / account.nav * 100 : 0;
  account.equitySeries.push({ value: account.nav, label: account.label });
  if (account.equitySeries.length > 36) account.equitySeries.shift();
  const base = account.equitySeries[0]?.value || account.nav;
  account.pnlPct = base ? (account.nav / base - 1) * 100 : 0;
}

function initialState(): TradingState {
  const stockStates = STOCK_UNIVERSE.map(createTickerState);
  stockStates.forEach(scoreStock);
  return {
    config: APP_CONFIG,
    mode: 'autopilot',
    toggles: {
      autoTrade: true,
      liveTrade: true,
      riskGuard: true,
      manualApproval: true,
    },
    cycle: 0,
    orderSeq: 1,
    marketClock: '',
    engineStatus: 'BOOTING',
    riskLevel: 'NORMAL',
    decisionSummary: '',
    decisionCopy: '',
    routeCopy: '',
    integrationStatus: {
      marketData: {
        provider: runtimeConfig.marketDataProvider,
        label: '',
        connected: true,
        message: '',
      },
      broker: {
        provider: runtimeConfig.brokerProvider,
        label: '',
        connected: true,
        message: '',
      },
    },
    stockStates,
    accounts: {
      paper: createAccount('paper', 'Paper', 120000, {
        AAPL: { shares: 42, avgCost: 198.6 },
        NVDA: { shares: 12, avgCost: 801.2 },
        JPM: { shares: 26, avgCost: 186.7 },
      }),
      live: createAccount('live', 'Live Account', 80000, {
        MSFT: { shares: 18, avgCost: 401.5 },
        AMZN: { shares: 24, avgCost: 171.1 },
      }),
    },
    approvalQueue: [],
    pendingLiveIntents: [],
    brokerOrderStatusMap: {},
    activityLog: [],
  };
}

function cloneState(state: TradingState): TradingState {
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
        holdings: Object.fromEntries(Object.entries(state.accounts.paper.holdings).map(([k, v]) => [k, { ...v }])),
        orders: state.accounts.paper.orders.map((order) => ({ ...order })),
        equitySeries: state.accounts.paper.equitySeries.map((point) => ({ ...point })),
      },
      live: {
        ...state.accounts.live,
        holdings: Object.fromEntries(Object.entries(state.accounts.live.holdings).map(([k, v]) => [k, { ...v }])),
        orders: state.accounts.live.orders.map((order) => ({ ...order })),
        equitySeries: state.accounts.live.equitySeries.map((point) => ({ ...point })),
      },
    },
    approvalQueue: state.approvalQueue.map((order) => ({ ...order })),
    pendingLiveIntents: state.pendingLiveIntents.map((order) => ({ ...order })),
    activityLog: state.activityLog.map((entry) => ({ ...entry })),
  };
}

function logEvent(state: TradingState, kind: string, title: string, copy: string) {
  const now = chinaNow();
  state.activityLog.unshift({ kind, title, copy, time: now.time });
  state.activityLog = state.activityLog.slice(0, 40);
}

function createOrderRecord(state: TradingState, accountId: string, side: string, symbol: string, qty: number, price: number, status: string, tag: string, extra: Partial<BrokerOrder> = {}): BrokerOrder {
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

function reserveIntentOnShadowAccount(account: AccountState, intent: BrokerOrder) {
  if (intent.side === 'BUY') {
    const cost = (intent.price || 0) * intent.qty;
    account.buyingPower = Math.max(0, account.buyingPower - cost);
    return;
  }
  const holding = account.holdings[intent.symbol];
  if (!holding) return;
  holding.shares = Math.max(0, holding.shares - intent.qty);
  if (!holding.shares) delete account.holdings[intent.symbol];
}

function prependOrder(account: AccountState, order: BrokerOrder) {
  account.orders.unshift(order);
  account.orders = account.orders.slice(0, 50);
}

function applyQuotePatch(stockStates: StockState[], quotes: Array<any>) {
  if (!quotes.length) return;
  const quoteMap = new Map(quotes.map((quote) => [quote.symbol, quote]));
  stockStates.forEach((stock) => {
    const nextQuote = quoteMap.get(stock.symbol);
    if (!nextQuote) return;
    stock.prevClose = sanitizeQuoteNumber(nextQuote.prevClose, stock.prevClose);
    stock.price = sanitizeQuoteNumber(nextQuote.price, stock.price);
    stock.high = sanitizeQuoteNumber(nextQuote.high, Math.max(stock.high, stock.price));
    stock.low = sanitizeQuoteNumber(nextQuote.low, Math.min(stock.low, stock.price));
    stock.volume = sanitizeQuoteNumber(nextQuote.volume, stock.volume);
    stock.turnover = sanitizeQuoteNumber(nextQuote.turnover, stock.turnover);
    stock.history.push(+stock.price.toFixed(2));
    if (stock.history.length > 80) stock.history.shift();
    scoreStock(stock);
  });
}

function buyPosition(account: AccountState, stock: StockState, ratio: number, tag: string, state: TradingState): BrokerOrder | null {
  const lot = stock.lotSize || 1;
  const budget = Math.max(account.nav * ratio, 0);
  const shares = Math.floor(Math.min(account.cash, budget) / stock.price / lot) * lot;
  if (shares <= 0) return null;
  const cost = shares * stock.price;
  account.cash -= cost;
  account.buyingPower = account.cash;
  if (!account.holdings[stock.symbol]) account.holdings[stock.symbol] = { shares: 0, avgCost: stock.price };
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

function sellPosition(account: AccountState, stock: StockState, ratio: number, tag: string, state: TradingState): BrokerOrder | null {
  const holding = account.holdings[stock.symbol];
  if (!holding || holding.shares <= 0) return null;
  const lot = stock.lotSize || 1;
  const shares = Math.floor(holding.shares * ratio / lot) * lot || Math.floor(holding.shares / lot) * lot || holding.shares;
  const actualShares = Math.min(holding.shares, shares);
  if (actualShares <= 0) return null;
  account.cash += actualShares * stock.price;
  account.buyingPower = account.cash;
  account.realizedPnl += (stock.price - holding.avgCost) * actualShares;
  holding.shares -= actualShares;
  if (holding.shares <= 0) delete account.holdings[stock.symbol];
  const order = createOrderRecord(state, account.id, 'SELL', stock.symbol, actualShares, stock.price, 'filled', tag, {
    cancelable: false,
  });
  prependOrder(account, order);
  logEvent(state, 'sell', `${tag} Sell ${stock.symbol}`, `${stock.name} ${actualShares} shares @ ${stock.price.toFixed(2)}`);
  return order;
}

function buildRemoteBuyIntent(state: TradingState, account: AccountState, stock: StockState, ratio: number, tag: string): BrokerOrder | null {
  if (hasBlockingLiveOrder(state, stock.symbol, 'BUY')) return null;
  const budget = Math.max(account.nav * ratio, 0);
  const qty = Math.max(Math.floor(Math.min(account.buyingPower, budget) / stock.price), 0);
  if (qty <= 0) return null;
  return createRemoteIntent(state, 'BUY', stock.symbol, qty, stock.price, tag);
}

function buildRemoteSellIntent(state: TradingState, account: AccountState, stock: StockState, ratio: number, tag: string): BrokerOrder | null {
  if (hasBlockingLiveOrder(state, stock.symbol, 'SELL')) return null;
  const holding = account.holdings[stock.symbol];
  if (!holding || holding.shares <= 0) return null;
  const qty = Math.max(Math.floor(holding.shares * ratio), 1);
  return createRemoteIntent(state, 'SELL', stock.symbol, Math.min(holding.shares, qty), stock.price, tag);
}

function riskOffIfNeeded(state: TradingState, brokerSupportsRemoteExecution: boolean): BrokerOrder[] {
  const liveRiskIntents: BrokerOrder[] = [];
  const avgVol = state.stockStates.reduce((sum, stock) => sum + Math.abs(stock.features.intraday || 0), 0) / state.stockStates.length;
  if (state.toggles.riskGuard && avgVol > 1.8) {
    state.riskLevel = 'RISK OFF';
    const paperHoldingSymbol = Object.keys(state.accounts.paper.holdings)[0];
    const paperStock = state.stockStates.find((item) => item.symbol === paperHoldingSymbol);
    if (paperStock) sellPosition(state.accounts.paper, paperStock, 0.3, 'Risk Guard', state);

    if (state.toggles.liveTrade) {
      const liveHoldingSymbol = Object.keys(state.accounts.live.holdings)[0];
      const liveStock = state.stockStates.find((item) => item.symbol === liveHoldingSymbol);
      if (liveStock) {
        if (brokerSupportsRemoteExecution) {
          const liveIntent = buildRemoteSellIntent(state, state.accounts.live, liveStock, 0.3, 'Risk Guard');
          if (liveIntent) liveRiskIntents.push(liveIntent);
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

function executeStrategy(state: TradingState, brokerSupportsRemoteExecution: boolean): { executedOrders: BrokerOrder[]; liveIntents: BrokerOrder[] } {
  const ranked = state.stockStates.slice().sort((a, b) => b.score - a.score);
  const topBuy = ranked.filter((stock) => stock.signal === 'BUY').slice(0, 3);
  const topSell = ranked.filter((stock) => stock.signal === 'SELL').slice(0, 3);
  const executedOrders: BrokerOrder[] = [];
  const liveIntents: BrokerOrder[] = [];
  const liveShadow: AccountState = {
    ...state.accounts.live,
    holdings: Object.fromEntries(Object.entries(state.accounts.live.holdings).map(([symbol, holding]) => [symbol, { ...holding }])),
    orders: state.accounts.live.orders.map((order) => ({ ...order })),
    equitySeries: state.accounts.live.equitySeries.map((point) => ({ ...point })),
  };

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

  if (!state.toggles.autoTrade) return { executedOrders, liveIntents };

  topBuy.forEach((stock, index) => {
    const weight = Math.max(APP_CONFIG.maxPositionWeight - index * 0.05, 0.08);
    const paperOrder = buyPosition(state.accounts.paper, stock, weight, 'Paper', state);
    if (paperOrder) executedOrders.push(paperOrder);
    if (!state.toggles.liveTrade) return;
    if (brokerSupportsRemoteExecution) {
      const liveIntent = buildRemoteBuyIntent(state, liveShadow, stock, weight * APP_CONFIG.liveSyncRatio, 'Live Sandbox');
      if (liveIntent) {
        liveIntents.push(liveIntent);
        reserveIntentOnShadowAccount(liveShadow, liveIntent);
      }
    } else {
      const liveOrder = buyPosition(state.accounts.live, stock, weight * APP_CONFIG.liveSyncRatio, 'Live Account', state);
      if (liveOrder) executedOrders.push(liveOrder);
    }
  });

  topSell.forEach((stock) => {
    const paperOrder = sellPosition(state.accounts.paper, stock, 0.5, 'Paper', state);
    if (paperOrder) executedOrders.push(paperOrder);
    if (!state.toggles.liveTrade) return;
    if (brokerSupportsRemoteExecution) {
      const liveIntent = buildRemoteSellIntent(state, liveShadow, stock, 0.5, 'Live Sandbox');
      if (liveIntent) {
        liveIntents.push(liveIntent);
        reserveIntentOnShadowAccount(liveShadow, liveIntent);
      }
    } else {
      const liveOrder = sellPosition(state.accounts.live, stock, 0.5, 'Live Account', state);
      if (liveOrder) executedOrders.push(liveOrder);
    }
  });

  return { executedOrders, liveIntents };
}

function applyRemoteOrderSubmissions(state: TradingState, orders: BrokerOrder[]) {
  if (!orders?.length) return;
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
  if (!orders) return;
  const nextOrders = orders.map((order) => ({
    ...order,
    account: 'live',
    tag: 'Remote',
  }));
  const nextMap = {};
  nextOrders.forEach((order) => {
    nextMap[order.id] = {
      status: order.status,
      filledQty: order.filledQty,
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

function applyBrokerSnapshot(state: TradingState, snapshot: BrokerSnapshot | undefined) {
  if (!snapshot) return;
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
  if (Array.isArray(snapshot.orders)) syncRemoteOrders(state, snapshot.orders);
}

async function advanceState(previousState: TradingState, providers: { marketData: MarketDataProvider; broker: BrokerProvider }): Promise<TradingState> {
  const state = cloneState(previousState);
  state.cycle += 1;
  const now = chinaNow();
  state.marketClock = `${now.date} ${now.time}`;
  state.engineStatus = state.mode === 'manual' ? 'MANUAL READY' : 'LIVE EXECUTION';
  state.stockStates.forEach((stock, index) => updateTicker(stock, index, state.cycle, state.toggles.riskGuard));

  const marketSnapshot = await providers.marketData.getQuotePatch(state.stockStates);
  state.integrationStatus.marketData = {
    provider: providers.marketData.id,
    label: providers.marketData.label,
    connected: marketSnapshot.connected,
    message: marketSnapshot.message,
  };
  applyQuotePatch(state.stockStates, marketSnapshot.quotes || []);

  const riskIntents = riskOffIfNeeded(state, providers.broker.supportsRemoteExecution);

  const { liveIntents } = executeStrategy(state, providers.broker.supportsRemoteExecution);
  const nextPendingMap = new Map<string, BrokerOrder>();
  const nextApprovalMap = new Map<string, BrokerOrder>();
  state.pendingLiveIntents.forEach((order) => {
    if (order.clientOrderId) nextPendingMap.set(order.clientOrderId, order);
  });
  state.approvalQueue.forEach((order) => {
    if (order.clientOrderId) nextApprovalMap.set(order.clientOrderId, order);
  });
  const newlyCreatedIntents = [...riskIntents, ...liveIntents];
  if (state.toggles.manualApproval) {
    newlyCreatedIntents.forEach((order) => {
      if (order.clientOrderId) nextApprovalMap.set(order.clientOrderId, order);
    });
  } else {
    newlyCreatedIntents.forEach((order) => {
      if (order.clientOrderId) nextPendingMap.set(order.clientOrderId, order);
    });
    state.approvalQueue.forEach((order) => {
      if (order.clientOrderId) nextPendingMap.set(order.clientOrderId, order);
    });
    nextApprovalMap.clear();
  }
  state.pendingLiveIntents = Array.from(nextPendingMap.values());
  state.approvalQueue = Array.from(nextApprovalMap.values());

  const brokerMessages: string[] = [];
  if (state.toggles.liveTrade && providers.broker.supportsRemoteExecution) {
    const submitSnapshot = await providers.broker.submitOrders({ orders: state.pendingLiveIntents });
    brokerMessages.push(submitSnapshot.message);
    applyRemoteOrderSubmissions(state, submitSnapshot.orders || []);
    (submitSnapshot.rejectedOrders || []).forEach((order) => {
      logEvent(state, 'info', `Remote order rejected ${order.symbol}`, `${order.side} ${order.qty} shares were rejected by broker.`);
    });
  }

  const brokerSnapshot = await providers.broker.syncState({ state });
  brokerMessages.push(brokerSnapshot.message);
  state.integrationStatus.broker = {
    provider: providers.broker.id,
    label: providers.broker.label,
    connected: brokerSnapshot.connected,
    message: brokerMessages.filter(Boolean).join(' '),
  };
  applyBrokerSnapshot(state, brokerSnapshot);

  computeAccount(state.accounts.paper, state.stockStates);
  computeAccount(state.accounts.live, state.stockStates);
  return state;
}

export function TradingSystemProvider({ children }: { children: React.ReactNode }) {
  const providersRef = useRef({
    marketData: createMarketDataProvider(runtimeConfig),
    broker: createBrokerProvider(runtimeConfig),
  });
  const [state, setState] = useState(() => {
    const base = initialState();
    base.integrationStatus.marketData.label = providersRef.current.marketData.label;
    base.integrationStatus.marketData.message = 'Waiting for the first market sync.';
    base.integrationStatus.broker.label = providersRef.current.broker.label;
    base.integrationStatus.broker.message = 'Waiting for the first broker sync.';
    computeAccount(base.accounts.paper, base.stockStates);
    computeAccount(base.accounts.live, base.stockStates);
    logEvent(base, 'info', 'System Started', 'The trading engine finished universe initialization and account loading.');
    return base;
  });
  const stateRef = useRef(state);
  const busyRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let cancelled = false;

    const runCycle = async () => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        const nextState = await advanceState(stateRef.current, providersRef.current);
        if (!cancelled) {
          stateRef.current = nextState;
          setState(nextState);
        }
      } finally {
        busyRef.current = false;
      }
    };

    runCycle();
    timerRef.current = window.setInterval(runCycle, APP_CONFIG.refreshMs);
    return () => {
      cancelled = true;
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const setMode = (mode) => {
    setState((current) => {
      const next = { ...current, mode, engineStatus: mode === 'manual' ? 'MANUAL READY' : 'LIVE EXECUTION' };
      stateRef.current = next;
      return next;
    });
  };

  const updateToggle = (key, value) => {
    setState((current) => {
      const next = {
        ...current,
        toggles: { ...current.toggles, [key]: value },
      };
      stateRef.current = next;
      return next;
    });
  };

  const cancelLiveOrder = async (orderId) => {
    if (!providersRef.current.broker.supportsRemoteExecution || !orderId || busyRef.current) return;
    busyRef.current = true;
    try {
      const cancelSnapshot = await providersRef.current.broker.cancelOrder(orderId);
      const synced = await providersRef.current.broker.syncState({ state: stateRef.current });
      const nextState = cloneState(stateRef.current);
      nextState.integrationStatus.broker = {
        provider: providersRef.current.broker.id,
        label: providersRef.current.broker.label,
        connected: synced.connected,
        message: `${cancelSnapshot.message} ${synced.message}`.trim(),
      };
      logEvent(nextState, 'info', `Cancel request ${orderId}`, cancelSnapshot.message);
      applyBrokerSnapshot(nextState, synced);
      computeAccount(nextState.accounts.paper, nextState.stockStates);
      computeAccount(nextState.accounts.live, nextState.stockStates);
      stateRef.current = nextState;
      setState(nextState);
    } finally {
      busyRef.current = false;
    }
  };

  const approveLiveIntent = (clientOrderId) => {
    if (!clientOrderId) return;
    setState((current) => {
      const next = cloneState(current);
      const order = next.approvalQueue.find((item) => item.clientOrderId === clientOrderId);
      if (!order) return current;
      next.approvalQueue = next.approvalQueue.filter((item) => item.clientOrderId !== clientOrderId);
      next.pendingLiveIntents = [...next.pendingLiveIntents, order];
      logEvent(next, 'info', `Approval granted ${order.symbol}`, `${order.side} ${order.qty} shares moved to broker submission queue.`);
      stateRef.current = next;
      return next;
    });
  };

  const rejectLiveIntent = (clientOrderId) => {
    if (!clientOrderId) return;
    setState((current) => {
      const next = cloneState(current);
      const order = next.approvalQueue.find((item) => item.clientOrderId === clientOrderId);
      if (!order) return current;
      next.approvalQueue = next.approvalQueue.filter((item) => item.clientOrderId !== clientOrderId);
      logEvent(next, 'info', `Approval rejected ${order.symbol}`, `${order.side} ${order.qty} shares were rejected before broker submission.`);
      stateRef.current = next;
      return next;
    });
  };

  return (
    <TradingSystemContext.Provider value={{ state, setMode, updateToggle, cancelLiveOrder, approveLiveIntent, rejectLiveIntent }}>
      {children}
    </TradingSystemContext.Provider>
  );
}

export function useTradingSystem() {
  const context = useContext(TradingSystemContext);
  if (!context) throw new Error('useTradingSystem must be used inside TradingSystemProvider');
  return context;
}
