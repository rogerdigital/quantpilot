export type OhlcvBar = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type SlippageModel = {
  model: 'fixed' | 'volume' | 'spread' | 'volatility_adjusted';
  fixedPct?: number;
  volumeImpact?: number;
  spreadBps?: number;
  volatilityMultiplier?: number;
};

export type CommissionModel = {
  model: 'fixed' | 'per_share' | 'percentage' | 'tiered' | 'bps';
  fixedAmount?: number;
  perShareAmount?: number;
  percentage?: number;
  bps?: number;
  minCommission?: number;
  maxCommission?: number;
};

export type BacktestConfig = {
  strategyId: string;
  runId: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;
  initialCapital: number; // default 100000
  universe: string[]; // symbols
  buyThreshold: number; // default 74
  sellThreshold: number; // default 38
  maxPositionWeight: number; // default 0.24
  slippagePct: number; // default 0.001 (for backward compatibility)
  commissionPct: number; // default 0.001 (for backward compatibility)
  /** Advanced slippage model. If provided, overrides slippagePct. */
  slippageModel?: SlippageModel;
  /** Advanced commission model. If provided, overrides commissionPct. */
  commissionModel?: CommissionModel;
  /** Optional pre-fetched bars per symbol. If provided, skips synthetic data generation. */
  externalBars?: Record<string, OhlcvBar[]>;
};

export type DailyEquityPoint = {
  date: string;
  equity: number;
  cash: number;
};

export type BacktestTrade = {
  date: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  pnl: number;
};

export type BacktestResult = {
  status: 'completed' | 'needs_review' | 'failed';
  annualizedReturnPct: number;
  maxDrawdownPct: number;
  sharpe: number;
  winRatePct: number;
  turnoverPct: number;
  equityCurve: DailyEquityPoint[];
  tradeCount: number;
};
