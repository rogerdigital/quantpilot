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
    accessStatus: string;
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
    healthStatus?: string;
  } | null;
  issuedAt: string;
};

export type UserRoleTemplate = {
  id: string;
  label: string;
  summary: string;
  defaultPermissions: string[];
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
  health: {
    status: string;
    connected: boolean;
    requiresAttention: boolean;
    mismatch: boolean;
    lastCheckedAt: string;
    lastError: string;
  };
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
  roleTemplates: UserRoleTemplate[];
  accessSummary: {
    role: string;
    status: string;
    defaultPermissions: string[];
    effectivePermissions: string[];
    addedPermissions: string[];
    removedPermissions: string[];
    sessionPermissions: string[];
    sessionAddedPermissions: string[];
    sessionRemovedPermissions: string[];
    isSessionAligned: boolean;
  };
};

export type UserAccountSnapshot = UserAccountProfileSnapshot & {
  subscription: {
    plan: string;
    status: string;
  };
  brokerBindings: UserBrokerBinding[];
  brokerSummary: {
    total: number;
    connected: number;
    requiresAttention: number;
    liveBindings: number;
    paperBindings: number;
    defaultBindingId: string;
    defaultProvider: string;
    defaultStatus: string;
    defaultHealthStatus: string;
    lastSyncAt: string;
  };
  session: OperatorSession;
  updatedAt: string;
};

export type UserPreferencesUpdateSnapshot = {
  ok: boolean;
  preferences: UserAccountProfileSnapshot['preferences'];
  session?: OperatorSession;
};

export type UserAccessUpdateSnapshot = {
  ok: boolean;
  access: UserAccountProfileSnapshot['access'];
  accessSummary?: UserAccountProfileSnapshot['accessSummary'];
  session?: OperatorSession;
};

export type UserProfileUpdateSnapshot = {
  ok: boolean;
  profile: UserAccountProfileSnapshot['profile'];
  session?: OperatorSession;
};

export type UserBrokerBindingsSnapshot = {
  ok: boolean;
  bindings: UserBrokerBinding[];
  summary?: UserAccountSnapshot['brokerSummary'];
  accessSummary?: UserAccountProfileSnapshot['accessSummary'];
};

export type UserBrokerBindingSaveSnapshot = {
  ok: boolean;
  binding: UserBrokerBinding;
  bindings?: UserBrokerBinding[];
  summary?: UserAccountSnapshot['brokerSummary'];
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

export type ExecutionPlanDetailResponse = {
  ok: boolean;
  plan: ExecutionPlanRecord | null;
  workflow: WorkflowRunRecord | null;
  latestRuntime: ExecutionRuntimeEvent | null;
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
  baseline?: boolean;
  champion?: boolean;
  baselineUpdatedAt?: string;
  championUpdatedAt?: string;
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
  latestResult?: BacktestResultRecord | null;
  recentResults?: BacktestResultRecord[];
  latestEvaluation?: ResearchEvaluationRecord | null;
  recentEvaluations?: ResearchEvaluationRecord[];
  latestReport?: ResearchReportRecord | null;
  recentReports?: ResearchReportRecord[];
  researchTasks?: ResearchTaskRecord[];
  workflows?: WorkflowRunRecord[];
  governanceActions?: ResearchGovernanceActionRecord[];
  replaySummary?: {
    totalEvents: number;
    registryEvents: number;
    researchEvents: number;
    reviewEvents: number;
    governanceEvents: number;
    executionEvents: number;
    latestAt: string;
    latestRunId: string;
    latestResultId: string;
    latestEvaluationId: string;
    latestReportId: string;
  };
  replayTimeline?: Array<{
    id: string;
    eventType: 'audit' | 'task' | 'workflow' | 'run' | 'result' | 'evaluation' | 'report' | 'governance' | 'execution';
    lane: string;
    title: string;
    detail: string;
    at: string;
    reference: string;
    linkedRunId?: string;
    linkedWorkflowRunId?: string;
    linkedResultId?: string;
    metrics: Array<{
      label: string;
      value: string;
    }>;
  }>;
  promotionReadiness?: {
    level: 'ready' | 'review' | 'blocked';
    headline: string;
    recommendedAction: string;
    reasons: string[];
  } | null;
  executionCandidatePreview?: {
    mode: 'paper' | 'live';
    capital: number;
    orderCount: number;
    riskStatus: 'approved' | 'review' | 'blocked';
    approvalState: 'not_required' | 'required';
    summary: string;
    reasons: string[];
    orders: StrategyExecutionOrder[];
  } | null;
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

export type ResearchTaskRecord = {
  id: string;
  taskType: 'backtest-run' | 'parameter-optimization' | 'research-report' | 'strategy-evaluation';
  status: 'queued' | 'running' | 'completed' | 'needs_review' | 'failed' | 'canceled';
  title: string;
  summary: string;
  strategyId: string;
  strategyName: string;
  workflowRunId: string;
  runId: string;
  windowLabel: string;
  requestedBy: string;
  lastActor: string;
  resultLabel: string;
  latestCheckpoint: string;
  priority: 'normal' | 'high';
  createdAt: string;
  updatedAt: string;
  startedAt: string;
  completedAt: string;
  metadata: Record<string, unknown>;
};

export type ResearchTaskSummarySnapshot = {
  total: number;
  queued: number;
  running: number;
  needsReview: number;
  completed: number;
  failed: number;
  active: number;
  byType: Array<{
    taskType: string;
    count: number;
  }>;
  byStrategy: Array<{
    strategyId: string;
    strategyName: string;
    count: number;
    activeCount: number;
  }>;
};

export type BacktestResultRecord = {
  id: string;
  runId: string;
  workflowRunId: string;
  strategyId: string;
  strategyName: string;
  windowLabel: string;
  status: 'completed' | 'needs_review' | 'failed';
  stage: 'generated' | 'reviewed' | 'replayed';
  version: number;
  generatedAt: string;
  summary: string;
  annualizedReturnPct: number;
  maxDrawdownPct: number;
  sharpe: number;
  winRatePct: number;
  turnoverPct: number;
  benchmarkReturnPct: number;
  excessReturnPct: number;
  reviewVerdict: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type BacktestResultSummarySnapshot = {
  total: number;
  completed: number;
  needsReview: number;
  failed: number;
  averageSharpe: number;
  averageReturnPct: number;
  averageExcessReturnPct: number;
  latestGeneratedAt: string;
};

export type ResearchEvaluationRecord = {
  id: string;
  runId: string;
  resultId: string;
  strategyId: string;
  strategyName: string;
  verdict: 'promote' | 'prepare_execution' | 'rework' | 'blocked';
  scoreBand: 'strong' | 'watch' | 'weak';
  readiness: 'candidate' | 'paper' | 'live' | 'hold';
  recommendedAction: string;
  summary: string;
  actor: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type ResearchEvaluationSummarySnapshot = {
  total: number;
  promote: number;
  prepareExecution: number;
  rework: number;
  blocked: number;
  latestCreatedAt: string;
  byStrategy: Array<{
    strategyId: string;
    strategyName: string;
    count: number;
    latestVerdict: string;
  }>;
};

export type ResearchReportRecord = {
  id: string;
  evaluationId: string;
  workflowRunId: string;
  runId: string;
  resultId: string;
  strategyId: string;
  strategyName: string;
  title: string;
  verdict: 'promote' | 'prepare_execution' | 'rework' | 'blocked';
  readiness: 'candidate' | 'paper' | 'live' | 'hold';
  executiveSummary: string;
  promotionCall: string;
  executionPreparation: string;
  riskNotes: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type ResearchReportSummarySnapshot = {
  total: number;
  promote: number;
  prepareExecution: number;
  rework: number;
  blocked: number;
  latestCreatedAt: string;
  byStrategy: Array<{
    strategyId: string;
    strategyName: string;
    count: number;
    latestVerdict: string;
  }>;
};

export type ResearchWorkbenchLaneSnapshot = {
  key: 'ready-promote' | 'ready-execution' | 'await-report' | 'await-evaluation' | 'blocked';
  label: string;
  count: number;
  headline: string;
  strategyIds: string[];
};

export type ResearchWorkbenchQueueEntry = {
  strategyId: string;
  strategyName: string;
  strategyStatus: string;
  latestRunId: string;
  latestRunLabel: string;
  latestResultId: string;
  latestResultStage: string;
  latestResultStatus: string;
  evaluationVerdict: string;
  reportVerdict: string;
  readiness: string;
  recommendedAction: string;
  reportStatus: 'ready' | 'pending' | 'missing';
  reportTaskStatus: string;
  annualizedReturnPct: number | null;
  maxDrawdownPct: number | null;
  sharpe: number | null;
  excessReturnPct: number | null;
  updatedAt: string;
};

export type ResearchWorkbenchComparisonEntry = {
  strategyId: string;
  strategyName: string;
  strategyStatus: string;
  baseline: boolean;
  champion: boolean;
  latestRunId: string;
  latestRunLabel: string;
  resultVersion: number | null;
  resultStage: string;
  resultStatus: string;
  annualizedReturnPct: number | null;
  maxDrawdownPct: number | null;
  sharpe: number | null;
  excessReturnPct: number | null;
  baselineReturnGapPct: number | null;
  baselineSharpeGap: number | null;
  baselineDrawdownGapPct: number | null;
  championReturnGapPct: number | null;
  championSharpeGap: number | null;
  championDrawdownGapPct: number | null;
  comparisonBand: 'baseline' | 'champion' | 'outperforming_baseline' | 'challenger' | 'trailing' | 'forming';
  evaluationVerdict: string;
  reportVerdict: string;
  promotionReadiness: string;
  recommendedAction: string;
  updatedAt: string;
};

export type ResearchWorkbenchCoverageEntry = {
  strategyId: string;
  strategyName: string;
  strategyStatus: string;
  baseline: boolean;
  champion: boolean;
  coverage: 'full' | 'report_pending' | 'evaluation_pending' | 'result_pending';
  note: string;
  latestRunId: string;
  updatedAt: string;
};

export type ResearchGovernanceActionRecord = {
  id: string;
  type: string;
  title: string;
  detail: string;
  actor: string;
  level: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type ResearchWorkbenchSnapshot = {
  ok: boolean;
  asOf: string;
  summary: {
    totalStrategies: number;
    activeStrategies: number;
    candidateStrategies: number;
    readyToPromote: number;
    readyForExecution: number;
    waitingForReport: number;
    needsEvaluation: number;
    blocked: number;
    staleStrategies: number;
    baselines: number;
    champions: number;
  };
  comparisonSummary: {
    baselineStrategyId: string;
    baselineStrategyName: string;
    championStrategyId: string;
    championStrategyName: string;
    baselineUpdatedAt: string;
    championUpdatedAt: string;
    comparedStrategies: number;
    outperformingBaseline: number;
    nearChampion: number;
    trailingBaseline: number;
  };
  lanes: ResearchWorkbenchLaneSnapshot[];
  actionSummary: {
    total: number;
    promote: number;
    refreshBacktests: number;
    evaluate: number;
    latestCreatedAt: string;
  };
  recentActions: ResearchGovernanceActionRecord[];
  promotionQueue: ResearchWorkbenchQueueEntry[];
  comparisons: ResearchWorkbenchComparisonEntry[];
  comparisonInsights: Array<{
    strategyId: string;
    strategyName: string;
    strategyStatus: string;
    comparisonBand: 'baseline' | 'champion' | 'outperforming_baseline' | 'challenger' | 'trailing' | 'forming';
    headline: string;
    detail: string;
    baselineReturnGapPct: number | null;
    championReturnGapPct: number | null;
    baselineSharpeGap: number | null;
    championSharpeGap: number | null;
    updatedAt: string;
  }>;
  coverage: ResearchWorkbenchCoverageEntry[];
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
  researchTask?: ResearchTaskRecord | null;
  latestResult?: BacktestResultRecord | null;
  results?: BacktestResultRecord[];
  latestEvaluation?: ResearchEvaluationRecord | null;
  evaluations?: ResearchEvaluationRecord[];
  latestReport?: ResearchReportRecord | null;
  reports?: ResearchReportRecord[];
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
  taskSummary: ResearchTaskSummarySnapshot;
  resultSummary: BacktestResultSummarySnapshot;
  evaluationSummary?: ResearchEvaluationSummarySnapshot;
  reportSummary?: ResearchReportSummarySnapshot;
  workbench?: ResearchWorkbenchSnapshot;
  strategies: StrategyCatalogItem[];
  runs: BacktestRunItem[];
  tasks: ResearchTaskRecord[];
  results: BacktestResultRecord[];
  evaluations?: ResearchEvaluationRecord[];
  reports?: ResearchReportRecord[];
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

export type OperationsWorkbenchResponse = {
  ok: boolean;
  generatedAt: string;
  status: string;
  summary: {
    criticalSignals: number;
    warnSignals: number;
    queuePressure: number;
    openIncidents: number;
    staleIncidents: number;
    unassignedIncidents: number;
    schedulerAttention: number;
  };
  lanes: Array<{
    key: 'monitoring' | 'incidents' | 'scheduler' | 'connectivity' | 'control-plane';
    title: string;
    status: string;
    detail: string;
    primaryCount: number;
    secondaryCount: number;
    updatedAt: string;
  }>;
  runbook: Array<{
    key: 'stabilize-connectivity' | 'drain-queues' | 'triage-critical-incidents' | 'assign-incident-owners' | 'clear-stale-incidents' | 'review-scheduler-attention' | 'follow-control-plane-trail';
    priority: 'now' | 'next';
    title: string;
    detail: string;
    count: number;
  }>;
  recent: {
    incident: IncidentRecord | null;
    monitoringAlert: MonitoringAlertRecord | null;
    notification: {
      id: string;
      level: string;
      title: string;
      message: string;
      source: string;
      createdAt: string;
      metadata?: Record<string, unknown>;
    } | null;
    auditRecord: {
      id: string;
      type: string;
      actor: string;
      title: string;
      detail: string;
      createdAt: string;
      metadata?: Record<string, unknown>;
    } | null;
    schedulerTick: {
      id: string;
      phase: string;
      status: string;
      title: string;
      message: string;
      worker: string;
      createdAt: string;
      metadata?: Record<string, unknown>;
    } | null;
  };
};

export type RiskWorkbenchResponse = {
  ok: boolean;
  generatedAt: string;
  posture: {
    status: 'healthy' | 'warn' | 'critical';
    title: string;
    detail: string;
  };
  summary: {
    openRiskEvents: number;
    riskOffEvents: number;
    approvalRequired: number;
    blockedExecutions: number;
    reviewBacktests: number;
    openRiskIncidents: number;
    liveExposurePct: number;
    liveEquity: number;
    brokerConnected: boolean;
  };
  lanes: Array<{
    key: 'risk-events' | 'execution-review' | 'backtest-review' | 'incidents' | 'broker';
    title: string;
    status: string;
    detail: string;
    primaryCount: number;
    secondaryCount: number;
    updatedAt: string;
  }>;
  reviewQueue: {
    executionPlans: ExecutionPlanRecord[];
    backtestRuns: BacktestRunItem[];
    incidents: IncidentRecord[];
  };
  recent: {
    riskEvents: Array<NonNullable<MonitoringStatusSnapshot['recent']['latestRiskEvent']>>;
    executionPlans: ExecutionPlanRecord[];
    backtestRuns: BacktestRunItem[];
    incidents: IncidentRecord[];
    brokerSnapshot: BrokerAccountSnapshotRecord | null;
  };
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

export type IncidentActivityRecord = {
  id: string;
  incidentId: string;
  kind: 'opened' | 'status-changed' | 'owner-changed' | 'severity-changed' | 'summary-updated' | 'links-updated' | 'note-added' | 'task-updated';
  title: string;
  detail: string;
  actor: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type IncidentTaskRecord = {
  id: string;
  incidentId: string;
  title: string;
  detail: string;
  status: 'pending' | 'in_progress' | 'done' | 'blocked';
  owner: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string;
  metadata?: Record<string, unknown>;
};

export type IncidentEvidenceItem = {
  id: string;
  kind: 'monitoring-alert' | 'notification' | 'audit' | 'operator-action' | 'scheduler-tick' | 'risk-event' | 'workflow-run' | 'execution-plan';
  title: string;
  detail: string;
  timestamp: string;
  source: string;
  level: string;
  status: string;
  linked: boolean;
  metadata?: Record<string, unknown>;
};

export type IncidentEvidenceSummary = {
  total: number;
  linked: number;
  monitoringAlerts: number;
  notifications: number;
  audits: number;
  operatorActions: number;
  schedulerTicks: number;
  riskEvents: number;
  workflowRuns: number;
  executionPlans: number;
};

export type IncidentsResponse = {
  ok: boolean;
  incidents: IncidentRecord[];
};

export type IncidentSummaryResponse = {
  ok: boolean;
  summary: {
    total: number;
    open: number;
    investigating: number;
    mitigated: number;
    resolved: number;
    critical: number;
    warn: number;
    info: number;
    unassigned: number;
    stale: number;
    unacknowledged: number;
    missingNotes: number;
    bySource: Array<{
      source: string;
      count: number;
    }>;
    byOwner: Array<{
      owner: string;
      count: number;
      openCount: number;
      criticalCount: number;
      blockedTaskCount: number;
      staleCount: number;
      unacknowledgedCount: number;
    }>;
    ageBuckets: Array<{
      bucket: 'lt_1h' | 'lt_6h' | 'lt_24h' | 'gte_24h';
      count: number;
    }>;
    response: {
      acknowledged: number;
      ackOverdue: number;
      blockedTasks: number;
      activeTasks: number;
      unresolvedCritical: number;
      ownerHotspots: number;
    };
    nextActions: Array<{
      key: 'assign-owner' | 'acknowledge' | 'resolve-blocker' | 'capture-evidence' | 'closeout';
      count: number;
    }>;
  };
};

export type IncidentBulkUpdateResponse = {
  ok: boolean;
  updatedIds: string[];
  incidents: IncidentRecord[];
  notesAdded: number;
};

export type IncidentDetailResponse = {
  ok: boolean;
  incident: IncidentRecord;
  notes: IncidentNoteRecord[];
  tasks: {
    summary: {
      total: number;
      pending: number;
      inProgress: number;
      done: number;
      blocked: number;
    };
    items: IncidentTaskRecord[];
  };
  activity: {
    summary: {
      total: number;
      notes: number;
      statusChanges: number;
      ownerChanges: number;
      severityChanges: number;
      latestAt: string;
    };
    timeline: IncidentActivityRecord[];
  };
  evidence: {
    summary: IncidentEvidenceSummary;
    timeline: IncidentEvidenceItem[];
  };
  operations: {
    ageHours: number;
    stale: boolean;
    ackState: 'pending' | 'acknowledged' | 'overdue';
    blockedTasks: number;
    activeTasks: number;
    pendingTasks: number;
    linkedEvidence: number;
    latestActor: string;
    latestActivityAt: string;
    nextAction: {
      key: 'assign-owner' | 'acknowledge' | 'resolve-blocker' | 'capture-evidence' | 'closeout' | 'monitor';
      label: string;
      detail: string;
    };
    handoff: {
      owner: string;
      queue: 'unassigned' | 'owned' | 'resolved';
      summary: string;
    };
  };
};

export type RiskEventDetailResponse = {
  ok: boolean;
  event: MonitoringStatusSnapshot['recent']['latestRiskEvent'] | null;
};

export type WorkflowRunDetailResponse = {
  ok: boolean;
  workflow: WorkflowRunRecord | null;
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
  researchTask?: ResearchTaskRecord | null;
  latestResult?: BacktestResultRecord | null;
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
  refreshSession: () => Promise<OperatorSession | null>;
  actionGuardNotice: { permission: string; action: string } | null;
  clearActionGuardNotice: () => void;
  setMode: (mode: TradingState['mode']) => void;
  updateToggle: (key: keyof TradingState['toggles'], value: boolean) => void;
  cancelLiveOrder: (orderId: string) => Promise<void>;
  approveLiveIntent: (clientOrderId: string) => void;
  rejectLiveIntent: (clientOrderId: string) => void;
};

export type AppLocale = 'zh' | 'en';
