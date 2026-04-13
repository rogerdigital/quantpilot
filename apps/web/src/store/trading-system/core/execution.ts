import type {
  AccountState,
  BrokerOrder,
  BrokerSnapshot,
  StockState,
  TradingState,
} from '@shared-types/trading.ts';
import {
  applyBrokerSnapshot as sharedApplyBrokerSnapshot,
  applyRemoteOrderSubmissions as sharedApplyRemoteOrderSubmissions,
  buildRemoteBuyIntent as sharedBuildRemoteBuyIntent,
  buildRemoteSellIntent as sharedBuildRemoteSellIntent,
  buyPosition as sharedBuyPosition,
  sellPosition as sharedSellPosition,
} from '../../../../../../packages/trading-engine/src/runtime.js';

export function buyPosition(
  account: AccountState,
  stock: StockState,
  ratio: number,
  tag: string,
  state: TradingState
): BrokerOrder | null {
  return sharedBuyPosition(account, stock, ratio, tag, state);
}

export function sellPosition(
  account: AccountState,
  stock: StockState,
  ratio: number,
  tag: string,
  state: TradingState
): BrokerOrder | null {
  return sharedSellPosition(account, stock, ratio, tag, state);
}

export function buildRemoteBuyIntent(
  state: TradingState,
  account: AccountState,
  stock: StockState,
  ratio: number,
  tag: string
): BrokerOrder | null {
  return sharedBuildRemoteBuyIntent(state, account, stock, ratio, tag);
}

export function buildRemoteSellIntent(
  state: TradingState,
  account: AccountState,
  stock: StockState,
  ratio: number,
  tag: string
): BrokerOrder | null {
  return sharedBuildRemoteSellIntent(state, account, stock, ratio, tag);
}

export function applyRemoteOrderSubmissions(state: TradingState, orders: BrokerOrder[]) {
  sharedApplyRemoteOrderSubmissions(state, orders);
}

export function applyBrokerSnapshot(state: TradingState, snapshot: BrokerSnapshot | undefined) {
  sharedApplyBrokerSnapshot(state, snapshot);
}
