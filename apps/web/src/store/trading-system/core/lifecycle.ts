import type { BrokerOrder, BrokerProvider, MarketDataProvider, TradingState } from '@shared-types/trading.ts';
import { applyQuotePatch, updateTicker } from './market.ts';
import { riskOffIfNeeded } from './risk.ts';
import { computeAccount, cloneState, chinaNow } from './shared.ts';
import { executeStrategy } from './strategy.ts';

export async function advanceState(previousState: TradingState, providers: { marketData: MarketDataProvider; broker: BrokerProvider }): Promise<TradingState> {
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
