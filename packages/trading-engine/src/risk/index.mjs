import { buildRemoteSellIntent, sellPosition } from '../execution/index.mjs';

export function riskOffIfNeeded(state, brokerSupportsRemoteExecution) {
  const liveRiskIntents = [];
  const avgVol = state.stockStates.reduce((sum, stock) => sum + Math.abs(stock.features.intraday || 0), 0) / state.stockStates.length;
  if (state.toggles.riskGuard && avgVol > 1.8) {
    state.riskLevel = 'RISK OFF';
    const paperHoldingSymbol = Object.keys(state.accounts.paper.holdings)[0];
    const paperStock = state.stockStates.find((item) => item.symbol === paperHoldingSymbol);
    if (paperStock) {
      sellPosition(state.accounts.paper, paperStock, 0.3, 'Risk Guard', state);
    }
    if (state.toggles.liveTrade) {
      const liveHoldingSymbol = Object.keys(state.accounts.live.holdings)[0];
      const liveStock = state.stockStates.find((item) => item.symbol === liveHoldingSymbol);
      if (liveStock) {
        if (brokerSupportsRemoteExecution) {
          const liveIntent = buildRemoteSellIntent(state, state.accounts.live, liveStock, 0.3, 'Risk Guard');
          if (liveIntent) {
            liveRiskIntents.push(liveIntent);
          }
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
