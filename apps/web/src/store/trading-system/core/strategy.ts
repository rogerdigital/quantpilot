import type { AccountState, BrokerOrder, TradingState } from '@shared-types/trading.ts';
import { APP_CONFIG } from './config.ts';
import { buildRemoteBuyIntent, buildRemoteSellIntent, buyPosition, sellPosition } from './execution.ts';
import { reserveIntentOnShadowAccount } from './shared.ts';

export function executeStrategy(state: TradingState, brokerSupportsRemoteExecution: boolean): { liveIntents: BrokerOrder[] } {
  const ranked = state.stockStates.slice().sort((a, b) => b.score - a.score);
  const topBuy = ranked.filter((stock) => stock.signal === 'BUY').slice(0, 3);
  const topSell = ranked.filter((stock) => stock.signal === 'SELL').slice(0, 3);
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

  if (!state.toggles.autoTrade) {
    return { liveIntents };
  }

  topBuy.forEach((stock, index) => {
    const weight = Math.max(APP_CONFIG.maxPositionWeight - index * 0.05, 0.08);
    buyPosition(state.accounts.paper, stock, weight, 'Paper', state);
    if (!state.toggles.liveTrade) {
      return;
    }
    if (brokerSupportsRemoteExecution) {
      const liveIntent = buildRemoteBuyIntent(state, liveShadow, stock, weight * APP_CONFIG.liveSyncRatio, 'Live Sandbox');
      if (liveIntent) {
        liveIntents.push(liveIntent);
        reserveIntentOnShadowAccount(liveShadow, liveIntent);
      }
    } else {
      buyPosition(state.accounts.live, stock, weight * APP_CONFIG.liveSyncRatio, 'Live Account', state);
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
