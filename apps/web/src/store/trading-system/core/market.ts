import type { StockState } from '@shared-types/trading.ts';
import { createInitialStockStates as sharedCreateInitialStockStates, createTickerState as sharedCreateTickerState, applyQuotePatch as sharedApplyQuotePatch, scoreStock as sharedScoreStock, updateTicker as sharedUpdateTicker } from '../../../../../../packages/trading-engine/src/runtime.js';
import { APP_CONFIG } from './config.ts';

export function createTickerState(ticker: StockState, index: number): StockState {
  return sharedCreateTickerState(ticker, index);
}

export function scoreStock(stock: StockState) {
  sharedScoreStock(stock, APP_CONFIG);
}

export function updateTicker(stock: StockState, index: number, cycle: number, riskGuard: boolean) {
  sharedUpdateTicker(stock, index, cycle, riskGuard, 10, APP_CONFIG);
}

export function applyQuotePatch(
  stockStates: StockState[],
  quotes: Array<{ symbol: string; price: number; prevClose: number; high: number; low: number; volume: number; turnover: number }>
) {
  sharedApplyQuotePatch(stockStates, quotes, APP_CONFIG);
}

export function createInitialStockStates() {
  return sharedCreateInitialStockStates(APP_CONFIG);
}
