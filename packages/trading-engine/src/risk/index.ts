import { buildRemoteSellIntent, sellPosition } from '../execution/index.js';

export { calcBeta, calcHHI } from './beta-calculator.js';
export {
  analyzeSectorConcentration,
  type CorrelationAlert,
  type CorrelationMatrix,
  type CorrelationMethod,
  type CorrelationPair,
  calcCorrelationMatrix,
  calcRollingCorrelation,
  detectCorrelationRegimeChange,
  type SectorConcentration,
} from './correlation-matrix.js';
export {
  buildCustomScenario,
  getPredefinedScenarios,
  getScenarioById,
  type PositionInput,
  runMultiScenarioTest,
  runStressTest,
  type StressScenario,
  type StressTestResult,
} from './stress-test.js';
export {
  type ConfidenceLevel,
  calcCVaR,
  calcHistoricalVaR,
  calcMonteCarloVaR,
  calcParametricVaR,
  calcPortfolioVaR,
  scaleVaRHorizon,
  type TimeHorizon,
  type VaRMethod,
  type VaRResult,
} from './var-calculator.js';

export function riskOffIfNeeded(state: any, brokerSupportsRemoteExecution: boolean) {
  const liveRiskIntents = [];
  const avgVol =
    state.stockStates.reduce(
      (sum: number, stock: any) => sum + Math.abs(stock.features.intraday || 0),
      0
    ) / state.stockStates.length;
  if (state.toggles.riskGuard && avgVol > 1.8) {
    state.riskLevel = 'RISK OFF';
    const paperHoldingSymbol = Object.keys(state.accounts.paper.holdings)[0];
    const paperStock = state.stockStates.find((item: any) => item.symbol === paperHoldingSymbol);
    if (paperStock) {
      sellPosition(state.accounts.paper, paperStock, 0.3, 'Risk Guard', state);
    }
    if (state.toggles.liveTrade) {
      const liveHoldingSymbol = Object.keys(state.accounts.live.holdings)[0];
      const liveStock = state.stockStates.find((item: any) => item.symbol === liveHoldingSymbol);
      if (liveStock) {
        if (brokerSupportsRemoteExecution) {
          const liveIntent = buildRemoteSellIntent(
            state,
            state.accounts.live,
            liveStock,
            0.3,
            'Risk Guard'
          );
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
