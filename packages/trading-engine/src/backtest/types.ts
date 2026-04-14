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
  slippagePct: number; // default 0.001
  commissionPct: number; // default 0.001
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
