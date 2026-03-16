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

export type OperatorSession = {
  ok: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    organization: string;
    permissions: string[];
  };
  preferences: {
    locale: string;
    timezone: string;
    theme: string;
    defaultMode: string;
    riskReviewRequired: boolean;
    notificationChannels: string[];
  };
  brokerBinding: {
    id: string;
    provider: string;
    label: string;
    environment: string;
    status: string;
  } | null;
  issuedAt: string;
};

export type UserBrokerBinding = {
  id: string;
  provider: string;
  label: string;
  environment: string;
  accountId: string;
  status: string;
  permissions: string[];
  lastSyncAt: string;
  isDefault: boolean;
  metadata: Record<string, unknown>;
};

export type UserAccountProfileSnapshot = {
  ok: boolean;
  profile: {
    id: string;
    name: string;
    email: string;
    role: string;
    organization: string;
    timezone: string;
    locale: string;
  };
  access: {
    role: string;
    status: string;
    permissions: string[];
  };
  preferences: {
    locale: string;
    timezone: string;
    theme: string;
    defaultMode: string;
    riskReviewRequired: boolean;
    notificationChannels: string[];
  };
};

export type UserPreferencesUpdateSnapshot = {
  ok: boolean;
  preferences: UserAccountProfileSnapshot['preferences'];
};

export type UserAccessUpdateSnapshot = {
  ok: boolean;
  access: UserAccountProfileSnapshot['access'];
};

export type UserProfileUpdateSnapshot = {
  ok: boolean;
  profile: UserAccountProfileSnapshot['profile'];
};

export type UserBrokerBindingsSnapshot = {
  ok: boolean;
  bindings: UserBrokerBinding[];
};

export type UserBrokerBindingSaveSnapshot = {
  ok: boolean;
  binding: UserBrokerBinding;
  bindings?: UserBrokerBinding[];
  error?: string;
};

export type UserBrokerBindingRuntimeSnapshot = {
  ok: boolean;
  binding: UserBrokerBinding;
  runtime: {
    adapter: string;
    connected: boolean;
    customBrokerConfigured: boolean;
    alpacaConfigured: boolean;
    status: string;
    lastCheckedAt: string;
    mismatch: boolean;
  };
};

export type UserBrokerBindingDeleteSnapshot = {
  ok: boolean;
  binding?: UserBrokerBinding;
  bindings?: UserBrokerBinding[];
  error?: string;
};

export type ExecutionRuntimeEvent = {
  id: string;
  cycleId: string;
  cycle: number;
  mode: string;
  brokerAdapter: string;
  brokerConnected: boolean;
  marketConnected: boolean;
  submittedOrderCount: number;
  rejectedOrderCount: number;
  openOrderCount: number;
  positionCount: number;
  cash: number;
  buyingPower: number;
  equity: number;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type BrokerAccountSnapshotRecord = {
  id: string;
  cycleId: string;
  cycle: number;
  provider: string;
  connected: boolean;
  account: BrokerAccountSnapshot | null;
  positions: BrokerPositionSnapshot[];
  orders: BrokerOrder[];
  message: string;
  createdAt: string;
};

export type ExecutionLedgerEntry = {
  plan: ExecutionPlanRecord;
  workflow: {
    id: string;
    workflowId: string;
    status: string;
    updatedAt: string;
    completedAt: string;
    failedAt: string;
  } | null;
  latestRuntime: ExecutionRuntimeEvent | null;
};

export type LatestBrokerAccountSnapshotResponse = {
  ok: boolean;
  snapshot: BrokerAccountSnapshotRecord | null;
};

export type StrategyCatalogItem = {
  id: string;
  name: string;
  family: string;
  timeframe: string;
  universe: string;
  status: 'draft' | 'researching' | 'candidate' | 'paper' | 'live' | 'archived';
  score: number;
  expectedReturnPct: number;
  maxDrawdownPct: number;
  sharpe: number;
  summary: string;
  updatedAt?: string;
  dataSource?: string;
};

export type StrategyCatalogSnapshot = {
  ok: boolean;
  asOf: string;
  strategies: StrategyCatalogItem[];
};

export type StrategyCatalogDetailSnapshot = {
  ok: boolean;
  strategy?: StrategyCatalogItem;
  latestRun?: BacktestRunItem | null;
  recentRuns?: BacktestRunItem[];
  error?: string;
  message?: string;
};

export type StrategyCatalogSaveSnapshot = {
  ok: boolean;
  strategy?: StrategyCatalogItem;
  error?: string;
  message?: string;
};

export type BacktestRunItem = {
  id: string;
  strategyId: string;
  strategyName: string;
  workflowRunId?: string;
  status: 'queued' | 'running' | 'completed' | 'needs_review' | 'failed';
  windowLabel: string;
  startedAt: string;
  completedAt?: string;
  annualizedReturnPct: number;
  maxDrawdownPct: number;
  sharpe: number;
  winRatePct: number;
  turnoverPct: number;
  summary: string;
  requestedBy?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  dataSource?: string;
};

export type BacktestSummarySnapshot = {
  ok: boolean;
  asOf: string;
  queuedRuns: number;
  runningRuns: number;
  completedRuns: number;
  failedRuns?: number;
  candidateStrategies: number;
  promotedStrategies: number;
  averageSharpe: number;
  averageReturnPct: number;
  reviewQueue: number;
  dataSource: string;
};

export type BacktestRunDetailSnapshot = {
  ok: boolean;
  run?: BacktestRunItem;
  strategy?: StrategyCatalogItem | null;
  workflow?: WorkflowRunRecord | null;
  error?: string;
  message?: string;
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

export type AgentToolDefinition = {
  name: string;
  category: 'strategy' | 'backtest' | 'risk' | 'execution' | 'control-plane';
  description: string;
  access: 'read';
};

export type AgentToolExecutionResult = {
  ok: boolean;
  tool: string;
  summary: string;
  data: Record<string, unknown>;
};

export type AgentActionRequest = {
  id: string;
  workflowRunId: string;
  requestType: 'prepare_execution_plan' | 'explain_risk' | 'review_backtest';
  targetId: string;
  status: 'submitted' | 'pending_review' | 'approved' | 'rejected';
  approvalState: 'pending' | 'required' | 'approved' | 'rejected' | 'not_required';
  riskStatus: 'pending' | 'approved' | 'review' | 'blocked';
  summary: string;
  rationale: string;
  requestedBy: string;
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

export type MarketProviderStatusSnapshot = {
  asOf: string;
  provider: string;
  connected: boolean;
  fallback: boolean;
  message: string;
  symbolCount: number;
};

export type WorkerHeartbeatRecord = {
  id: string;
  worker: string;
  kind: string;
  summary: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type MonitoringAlertRecord = {
  id: string;
  snapshotId: string;
  status: string;
  level: string;
  source: string;
  message: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type MonitoringSnapshotRecord = {
  id: string;
  status: string;
  generatedAt: string;
  createdAt: string;
  services: Record<string, unknown>;
  recent: Record<string, unknown>;
  alertCount: number;
  metadata?: Record<string, unknown>;
};

export type MonitoringStatusSnapshot = {
  ok: boolean;
  status: string;
  generatedAt: string;
  services: {
    gateway: {
      status: string;
      uptimeSeconds: number;
    };
    broker: {
      status: string;
      adapter: string;
      connected: boolean;
      customBrokerConfigured: boolean;
      alpacaConfigured: boolean;
    };
    market: MarketProviderStatusSnapshot & {
      status: string;
      lagSeconds: number | null;
    };
    worker: {
      status: string;
      message: string;
      lagSeconds: number | null;
      latestHeartbeat: WorkerHeartbeatRecord | null;
    };
    workflows: {
      status: string;
      queued: number;
      running: number;
      retryScheduled: number;
      failed: number;
      completed: number;
      canceled: number;
    };
    queues: {
      status: string;
      pendingNotificationJobs: number;
      pendingRiskScanJobs: number;
      pendingAgentReviews: number;
    };
    risk: {
      status: string;
      riskOff: number;
      approvalRequired: number;
      connectivityDegraded: number;
      healthy: number;
    };
  };
  recent: {
    latestWorkflow: WorkflowRunRecord | null;
    latestWorkerHeartbeat: WorkerHeartbeatRecord | null;
    latestSchedulerTick: {
      id: string;
      phase: string;
      status: string;
      title: string;
      message: string;
      worker: string;
      createdAt: string;
      metadata?: Record<string, unknown>;
    } | null;
    latestRiskEvent: {
      id: string;
      level: string;
      status: string;
      title: string;
      message: string;
      cycle: number;
      riskLevel: string;
      source: string;
      createdAt: string;
      metadata?: Record<string, unknown>;
    } | null;
    latestNotification: {
      id: string;
      level: string;
      title: string;
      message: string;
      source: string;
      createdAt: string;
      metadata?: Record<string, unknown>;
    } | null;
    latestAuditRecord: {
      id: string;
      type: string;
      actor: string;
      title: string;
      detail: string;
      createdAt: string;
      metadata?: Record<string, unknown>;
    } | null;
  };
  alerts: Array<{
    level: string;
    source: string;
    message: string;
  }>;
};

export type MonitoringAlertsResponse = {
  ok: boolean;
  alerts: MonitoringAlertRecord[];
};

export type MonitoringSnapshotsResponse = {
  ok: boolean;
  snapshots: MonitoringSnapshotRecord[];
};

export type IncidentRecord = {
  id: string;
  title: string;
  summary: string;
  status: string;
  severity: string;
  source: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
  acknowledgedAt: string;
  resolvedAt: string;
  noteCount: number;
  latestNotePreview: string;
  links: Array<Record<string, unknown>>;
  tags: string[];
  metadata?: Record<string, unknown>;
};

export type IncidentNoteRecord = {
  id: string;
  incidentId: string;
  body: string;
  author: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type IncidentsResponse = {
  ok: boolean;
  incidents: IncidentRecord[];
};

export type IncidentDetailResponse = {
  ok: boolean;
  incident: IncidentRecord;
  notes: IncidentNoteRecord[];
};

export type BacktestRunCreateRequest = {
  strategyId: string;
  windowLabel?: string;
  requestedBy?: string;
  maxAttempts?: number;
};

export type BacktestRunCreateSnapshot = {
  ok: boolean;
  run: BacktestRunItem;
  workflow: {
    id: string;
    workflowId: string;
    status: string;
  };
};

export type WorkflowStepRecord = {
  key: string;
  status: string;
  [key: string]: unknown;
};

export type WorkflowRunRecord = {
  id: string;
  workflowId: string;
  workflowType: string;
  status: string;
  actor: string;
  trigger: string;
  attempt: number;
  maxAttempts: number;
  nextRunAt: string;
  lockedBy: string;
  lockedAt: string;
  createdAt: string;
  updatedAt: string;
  startedAt: string;
  completedAt: string;
  failedAt: string;
  steps: WorkflowStepRecord[];
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: Record<string, unknown> | string | null;
  metadata: Record<string, unknown>;
};

export type WorkflowRunsSnapshot = {
  ok: boolean;
  workflows: WorkflowRunRecord[];
};

export type TradingSystemContextValue = {
  state: TradingState;
  session: OperatorSession | null;
  hasPermission: (permission: string) => boolean;
  actionGuardNotice: { permission: string; action: string } | null;
  clearActionGuardNotice: () => void;
  setMode: (mode: TradingState['mode']) => void;
  updateToggle: (key: keyof TradingState['toggles'], value: boolean) => void;
  cancelLiveOrder: (orderId: string) => Promise<void>;
  approveLiveIntent: (clientOrderId: string) => void;
  rejectLiveIntent: (clientOrderId: string) => void;
};

export type AppLocale = 'zh' | 'en';
