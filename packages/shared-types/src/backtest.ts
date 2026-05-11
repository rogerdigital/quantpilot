export type BacktestCostModel = {
  model: 'fixed' | 'per_share' | 'percentage' | 'tiered' | 'bps';
  fixedAmount?: number;
  perShareAmount?: number;
  percentage?: number;
  bps?: number;
  minCommission?: number;
  maxCommission?: number;
  label: string;
};

export type BacktestSlippageModel = {
  model: 'fixed' | 'volume' | 'spread' | 'volatility_adjusted';
  fixedPct?: number;
  volumeImpact?: number;
  spreadBps?: number;
  volatilityMultiplier?: number;
  label: string;
};

export type BacktestRiskConstraints = {
  maxPositionWeight: number;
  maxSectorExposure: number;
  maxDrawdownLimit: number;
  maxLeverage: number;
};

export type BacktestSpec = {
  id: string;
  strategyVersionId: string;
  datasetVersionId: string;
  featureVersionId: string;
  benchmark: string;
  timeRange: { start: string; end: string };
  rebalanceCadence: 'daily' | 'weekly' | 'monthly';
  costModel: BacktestCostModel;
  slippageModel: BacktestSlippageModel;
  riskConstraints: BacktestRiskConstraints;
  universe: string[];
  initialCapital: number;
  seed: number;
  specHash: string;
};

export type BacktestRunRecord = {
  id: string;
  specId: string;
  spec: BacktestSpec;
  status: 'queued' | 'running' | 'completed' | 'failed';
  result: BacktestRunResult | null;
  startedAt: string;
  completedAt: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type BacktestRunResult = {
  annualizedReturnPct: number;
  maxDrawdownPct: number;
  sharpe: number;
  sortino: number;
  calmar: number;
  winRatePct: number;
  turnoverPct: number;
  tradeCount: number;
  avgHoldingDays: number;
  profitFactor: number;
};

export type RegimeBucket = 'bull' | 'bear' | 'sideways' | 'high_vol' | 'low_vol';

export type RegimePerformance = {
  regime: RegimeBucket;
  periodCount: number;
  annualizedReturn: number;
  sharpe: number;
  maxDrawdown: number;
};

export type AttributionBreakdown = {
  source: string;
  contribution: number;
  weight: number;
};

export type RobustnessReport = {
  parameterSensitivity: Array<{ parameter: string; sharpeRange: [number, number] }>;
  walkForwardSharpe: number[];
  inSampleSharpe: number;
  outOfSampleSharpe: number;
  drawdownClusters: number;
  turnoverExplosion: boolean;
  lowTradeCount: boolean;
  overfitRisk: 'low' | 'medium' | 'high';
};
