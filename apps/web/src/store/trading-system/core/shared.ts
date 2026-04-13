import type { AccountState, BrokerOrder, StockState, TradingState } from '@shared-types/trading.ts';
import {
  chinaNow as sharedChinaNow,
  cloneState as sharedCloneState,
  computeAccount as sharedComputeAccount,
  createAccount as sharedCreateAccount,
  createOrderRecord as sharedCreateOrderRecord,
  logEvent as sharedLogEvent,
  prependOrder as sharedPrependOrder,
  reserveIntentOnShadowAccount as sharedReserveIntentOnShadowAccount,
} from '../../../../../../packages/trading-engine/src/runtime.js';

export function createAccount(
  id: string,
  label: string,
  cash: number,
  holdings: Record<string, { shares: number; avgCost: number }>
): AccountState {
  return sharedCreateAccount(id, label, cash, holdings);
}

export function chinaNow() {
  return sharedChinaNow();
}

export function computeAccount(account: AccountState, stockStates: StockState[]) {
  sharedComputeAccount(account, stockStates);
}

export function cloneState(state: TradingState): TradingState {
  return sharedCloneState(state);
}

export function logEvent(state: TradingState, kind: string, title: string, copy: string) {
  sharedLogEvent(state, kind, title, copy);
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
  return sharedCreateOrderRecord(state, accountId, side, symbol, qty, price, status, tag, extra);
}

export function reserveIntentOnShadowAccount(account: AccountState, intent: BrokerOrder) {
  sharedReserveIntentOnShadowAccount(account, intent);
}

export function prependOrder(account: AccountState, order: BrokerOrder) {
  sharedPrependOrder(account, order);
}
