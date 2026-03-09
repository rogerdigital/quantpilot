export type ProviderKind = 'simulated' | 'custom-http' | 'alpaca';

export type RuntimeConfig = {
  refreshMs: number;
  marketDataProvider: ProviderKind;
  marketDataHttpUrl: string;
  brokerProvider: ProviderKind;
  brokerHttpUrl: string;
  alpacaProxyBase: string;
};

export type Quote = {
  symbol: string;
  price: number;
  prevClose: number;
  high: number;
  low: number;
  volume: number;
  turnover: number;
};

export type MarketDataSnapshot = {
  connected: boolean;
  fallback: boolean;
  message: string;
  quotes: Quote[];
};

export type MarketDataProvider = {
  id: ProviderKind;
  label: string;
  getQuotePatch: (stockStates: StockState[]) => Promise<MarketDataSnapshot>;
};

export type BrokerOrder = {
  id?: string;
  clientOrderId?: string;
  account?: string;
  side: string;
  symbol: string;
  qty: number;
  filledQty?: number;
  filledAvgPrice?: number;
  price?: number;
  status?: string;
  submittedAt?: string;
  updatedAt?: string;
  cancelable?: boolean;
  source?: string;
  tag?: string;
};

export type BrokerAccountSnapshot = {
  cash: number;
  buyingPower: number;
  equity: number;
};

export type BrokerPositionSnapshot = {
  symbol: string;
  qty: number;
  avgCost: number;
  marketValue?: number;
};

export type BrokerSnapshot = {
  connected: boolean;
  message: string;
  orders?: BrokerOrder[];
  account?: BrokerAccountSnapshot | null;
  positions?: BrokerPositionSnapshot[];
};

export type BrokerProvider = {
  id: ProviderKind;
  label: string;
  supportsRemoteExecution: boolean;
  submitOrders: ({ orders }: { orders: BrokerOrder[] }) => Promise<{ connected: boolean; message: string; orders: BrokerOrder[]; rejectedOrders?: BrokerOrder[] }>;
  syncState: ({ state }?: { state?: TradingState }) => Promise<BrokerSnapshot>;
  cancelOrder: (orderId: string) => Promise<{ connected: boolean; message: string }>;
};

export type StockTicker = {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  drift: number;
  volatility: number;
  lotSize: number;
};

export type StockState = StockTicker & {
  prevClose: number;
  high: number;
  low: number;
  volume: number;
  turnover: number;
  history: number[];
  signal: 'BUY' | 'HOLD' | 'SELL';
  actionText: string;
  score: number;
  features: Record<string, number>;
};

export type Holding = {
  shares: number;
  avgCost: number;
};

export type AccountState = {
  id: string;
  label: string;
  cash: number;
  buyingPower: number;
  holdings: Record<string, Holding>;
  orders: BrokerOrder[];
  equitySeries: Array<{ value: number; label: string }>;
  pnlPct: number;
  exposure: number;
  nav: number;
  realizedPnl: number;
};

export type TradingState = {
  config: {
    refreshMs: number;
    maxPositionWeight: number;
    targetCashBuffer: number;
    buyThreshold: number;
    sellThreshold: number;
    liveSyncRatio: number;
  };
  mode: 'autopilot' | 'hybrid' | 'manual';
  toggles: {
    autoTrade: boolean;
    liveTrade: boolean;
    riskGuard: boolean;
    manualApproval: boolean;
  };
  cycle: number;
  orderSeq: number;
  marketClock: string;
  engineStatus: string;
  riskLevel: string;
  decisionSummary: string;
  decisionCopy: string;
  routeCopy: string;
  integrationStatus: {
    marketData: { provider: string; label: string; connected: boolean; message: string };
    broker: { provider: string; label: string; connected: boolean; message: string };
  };
  stockStates: StockState[];
  accounts: {
    paper: AccountState;
    live: AccountState;
  };
  approvalQueue: BrokerOrder[];
  pendingLiveIntents: BrokerOrder[];
  brokerOrderStatusMap: Record<string, { status: string; filledQty: number }>;
  activityLog: Array<{ kind: string; title: string; copy: string; time: string }>;
  controlPlane: {
    lastCycleId: string;
    lastStatus: string;
    operator: string;
    notificationCount: number;
    auditCount: number;
    routeHint: string;
    lastSyncAt: string;
  };
};

export type ControlPlaneNotification = {
  id: string;
  level: string;
  title: string;
  message: string;
  source: string;
  createdAt: string;
};

export type StrategyCatalogItem = {
  id: string;
  name: string;
  family: string;
  timeframe: string;
  universe: string;
  status: 'draft' | 'researching' | 'candidate' | 'paper' | 'live';
  score: number;
  expectedReturnPct: number;
  maxDrawdownPct: number;
  sharpe: number;
  summary: string;
};

export type StrategyCatalogSnapshot = {
  ok: boolean;
  asOf: string;
  strategies: StrategyCatalogItem[];
};

export type BacktestRunItem = {
  id: string;
  strategyId: string;
  strategyName: string;
  status: 'queued' | 'running' | 'completed' | 'needs_review';
  windowLabel: string;
  startedAt: string;
  completedAt?: string;
  annualizedReturnPct: number;
  maxDrawdownPct: number;
  sharpe: number;
  winRatePct: number;
  turnoverPct: number;
  summary: string;
};

export type BacktestSummarySnapshot = {
  ok: boolean;
  asOf: string;
  queuedRuns: number;
  runningRuns: number;
  completedRuns: number;
  candidateStrategies: number;
  promotedStrategies: number;
  averageSharpe: number;
  averageReturnPct: number;
  reviewQueue: number;
  dataSource: string;
};

export type StrategyExecutionOrder = {
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: number;
  weight: number;
  rationale: string;
};

export type StrategyExecutionRequest = {
  strategyId: string;
  mode: 'paper' | 'live';
  capital: number;
  requestedBy?: string;
};

export type ExecutionPlanRecord = {
  id: string;
  workflowRunId: string;
  strategyId: string;
  strategyName: string;
  mode: 'paper' | 'live';
  status: 'draft' | 'ready' | 'blocked';
  approvalState: 'pending' | 'not_required' | 'required';
  riskStatus: 'approved' | 'review' | 'blocked';
  summary: string;
  capital: number;
  orderCount: number;
  orders: StrategyExecutionOrder[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ControlPlaneResolution = {
  ok: boolean;
  cycle: {
    id: string;
    cycle: number;
    mode: string;
    riskLevel: string;
    createdAt: string;
  };
  controlPlane: TradingState['controlPlane'];
  notifications: ControlPlaneNotification[];
  brokerHealth: {
    adapter: string;
    connected: boolean;
    customBrokerConfigured: boolean;
    alpacaConfigured: boolean;
  };
  brokerExecution: {
    connected: boolean;
    message: string;
    submittedOrders: BrokerOrder[];
    rejectedOrders: BrokerOrder[];
    snapshot?: BrokerSnapshot;
  };
};

export type CycleRunPayload = {
  cycle: number;
  mode: string;
  riskLevel: string;
  decisionSummary: string;
  marketClock: string;
  pendingApprovals: number;
  liveIntentCount: number;
  brokerConnected: boolean;
  marketConnected: boolean;
  liveTradeEnabled: boolean;
  pendingLiveIntents: BrokerOrder[];
};

export type StateCycleResult = {
  ok: boolean;
  state: TradingState;
  resolution: ControlPlaneResolution;
};

export type ResearchHubSnapshot = {
  ok: boolean;
  asOf: string;
  summary: BacktestSummarySnapshot;
  strategies: StrategyCatalogItem[];
  runs: BacktestRunItem[];
};

export type TradingSystemContextValue = {
  state: TradingState;
  setMode: (mode: TradingState['mode']) => void;
  updateToggle: (key: keyof TradingState['toggles'], value: boolean) => void;
  cancelLiveOrder: (orderId: string) => Promise<void>;
  approveLiveIntent: (clientOrderId: string) => void;
  rejectLiveIntent: (clientOrderId: string) => void;
};

export type AppLocale = 'zh' | 'en';
