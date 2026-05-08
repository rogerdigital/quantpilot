export {
  type AttributionResult,
  type BrinsonResult,
  calcBrinsonAttribution,
  calcFactorExposures,
  calcRollingExposures,
  type FactorExposure,
  type RollingExposure,
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
  calcCommission,
} from './commission.js';
export { runBacktestEngine } from './engine.js';
export {
  calcSlippage,
  type SlippageConfig,
  type SlippageInput,
  type SlippageResult,
} from './slippage.js';
export type {
  BacktestConfig,
  BacktestResult,
  BacktestTrade,
  CommissionModel,
  DailyEquityPoint,
  SlippageModel,
} from './types.js';
