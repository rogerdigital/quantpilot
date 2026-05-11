export {
  type AttributionBreakdown,
  type AttributionResult,
  type BrinsonResult,
  calcBrinsonAttribution,
  calcFactorExposures,
  calcRollingExposures,
  calcSectorAttribution,
  calcSignalAttribution,
  calcTurnoverAttribution,
  type FactorExposure,
  type RollingExposure,
  type SectorHolding,
  type SignalContribution,
} from './attribution.js';
export {
  type BenchmarkResult,
  calcBenchmarkComparison,
  calcBenchmarkFromEquityCurves,
} from './benchmark.js';
export {
  type CommissionConfig,
  type CommissionInput,
  type CommissionResult,
  calcBpsCommission,
  calcCommission,
} from './commission.js';
export { runBacktestEngine } from './engine.js';
export {
  calcRegimePerformance,
  classifyRegimes,
  type RegimeBucket,
  type RegimeClassification,
  type RegimeConfig,
  type RegimePerformance,
} from './regime.js';
export {
  assessRobustness,
  detectDrawdownClusters,
  type RobustnessInput,
  type RobustnessReport,
  runParameterSensitivity,
  runWalkForwardAnalysis,
} from './robustness.js';
export {
  calcSlippage,
  calcVolatilitySlippage,
  type SlippageConfig,
  type SlippageInput,
  type SlippageResult,
} from './slippage.js';
export { computeSpecHash, type SpecHashInput } from './spec-hash.js';
export type {
  BacktestConfig,
  BacktestResult,
  BacktestTrade,
  CommissionModel,
  DailyEquityPoint,
  SlippageModel,
} from './types.js';
