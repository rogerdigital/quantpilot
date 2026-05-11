export type StrategyPackageManifest = {
  name: string;
  version: string;
  owner: string;
  description: string;
  requiredDatasets: string[];
  requiredFeatures: string[];
  supportedMarkets: string[];
  riskRequirements: StrategyRiskRequirements;
  backtestSpecs: StrategyBacktestSpecs;
  expectedArtifacts: string[];
  permissionsRequested: StrategyPermission[];
  metadata: Record<string, unknown>;
};

export type StrategyRiskRequirements = {
  maxDrawdownPct: number;
  maxPositionPct: number;
  maxLeverage: number;
  requiresKillSwitch: boolean;
};

export type StrategyBacktestSpecs = {
  minHistoryMonths: number;
  requiredMetrics: string[];
  minimumSharpe: number;
  outOfSamplePct: number;
};

export type StrategyPermission =
  | 'research:read'
  | 'backtest:run'
  | 'paper:execute'
  | 'live:execute'
  | 'risk:configure';

export type StrategyPackageValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};
