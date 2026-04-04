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
  metadata?: Record<string, unknown>;
};

export type TenantRecord = {
  id: string;
  key: string;
  label: string;
  status: 'active' | 'suspended';
};

export type WorkspaceRecord = {
  id: string;
  tenantId: string;
  key: string;
  label: string;
  description: string;
  role: string;
  grants?: string[];
  revokes?: string[];
  defaultPermissions?: string[];
  effectivePermissions?: string[];
  status: 'active' | 'archived';
  isDefault: boolean;
  isCurrent: boolean;
};

export type OperatorSession = {
  ok: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    organization: string;
    tenantId: string;
    workspaceId: string;
    permissions: string[];
    accessStatus: string;
  };
  tenant: TenantRecord | null;
  workspace: WorkspaceRecord | null;
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
  system?: boolean;
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
  tenant: TenantRecord | null;
  currentWorkspace: WorkspaceRecord | null;
  workspaces: WorkspaceRecord[];
  access: {
    role: string;
    status: string;
    permissions: string[];
    grants?: string[];
    revokes?: string[];
    defaultPermissions?: string[];
    effectivePermissions?: string[];
    roleTemplateId?: string;
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
    roleLabel?: string;
    status: string;
    defaultPermissions: string[];
    effectivePermissions: string[];
    workspaceRole?: string;
    workspaceLabel?: string;
    workspaceDefaultPermissions?: string[];
    workspaceEffectivePermissions?: string[];
    scopedPermissions?: string[];
    grants?: string[];
    revokes?: string[];
    workspaceGrants?: string[];
    workspaceRevokes?: string[];
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

export type UserRoleTemplateSnapshot = {
  ok: boolean;
  roleTemplates: UserRoleTemplate[];
};

export type UserWorkspaceSnapshot = {
  ok: boolean;
  tenant: TenantRecord | null;
  currentWorkspace: WorkspaceRecord | null;
  workspaces: WorkspaceRecord[];
};

export type UserWorkspaceUpdateSnapshot = {
  ok: boolean;
  tenant: TenantRecord | null;
  currentWorkspace: WorkspaceRecord | null;
  workspaces: WorkspaceRecord[];
  session?: OperatorSession;
  error?: string;
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
  executionPlanId: string;
  executionRunId: string;
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
  executionPlanId: string;
  executionRunId: string;
  provider: string;
  connected: boolean;
  account: BrokerAccountSnapshot | null;
  positions: BrokerPositionSnapshot[];
  orders: BrokerOrder[];
  message: string;
  createdAt: string;
};

export type BrokerExecutionEventRecord = {
  id: string;
  executionPlanId: string;
  executionRunId: string;
  brokerOrderId: string;
  symbol: string;
  eventType: 'acknowledged' | 'partial_fill' | 'filled' | 'rejected' | 'cancelled';
  status: string;
  filledQty: number;
  avgFillPrice: number | null;
  source: string;
  actor: string;
  headline: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type ExecutionOrderStateRecord = {
  id: string;
  executionPlanId: string;
  executionRunId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: number;
  weight: number;
  lifecycleStatus: 'planned' | 'submitted' | 'acknowledged' | 'filled' | 'rejected' | 'cancelled';
  brokerOrderId: string;
  avgFillPrice: number | null;
  filledQty: number;
  summary: string;
  createdAt: string;
  updatedAt: string;
  submittedAt: string;
  acknowledgedAt: string;
  filledAt: string;
  metadata: Record<string, unknown>;
};

export type ExecutionRunRecord = {
  id: string;
  executionPlanId: string;
  workflowRunId: string;
  strategyId: string;
  strategyName: string;
  mode: 'paper' | 'live';
  lifecycleStatus: 'planned' | 'awaiting_approval' | 'routing' | 'submitted' | 'acknowledged' | 'partial_fill' | 'filled' | 'blocked' | 'cancelled' | 'failed';
  summary: string;
  owner: string;
  orderCount: number;
  submittedOrderCount: number;
  filledOrderCount: number;
  rejectedOrderCount: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string;
  metadata: Record<string, unknown>;
};

export type ExecutionReconciliationIssue = {
  id: string;
  kind: 'snapshot' | 'orders' | 'fills' | 'positions' | 'account' | 'capital' | 'cadence';
  severity: 'info' | 'warn' | 'critical';
  title: string;
  detail: string;
  expected: string;
  actual: string;
};

export type ExecutionReconciliationRecord = {
  status: 'aligned' | 'attention' | 'drift' | 'missing_snapshot';
  issueCount: number;
  latestSnapshotAt: string;
  orderCountDelta: number;
  filledQtyDelta: number;
  positionDelta: number;
  cashDelta: number;
  buyingPowerDelta: number;
  equityDelta: number;
  deployedCapital: number;
  residualCapital: number;
  accountStatus: 'aligned' | 'attention' | 'drift' | 'missing_snapshot';
  cadence: {
    status: 'live' | 'stale' | 'missing_runtime';
    runtimeAt: string;
    snapshotLagMinutes: number;
  };
  issues: ExecutionReconciliationIssue[];
};

export type ExecutionRecoveryRecord = {
  status: 'ready' | 'monitor' | 'blocked';
  recommendedAction: 'resume_workflow' | 'reroute_orders' | 'reconcile' | 'open_incident' | 'none';
  headline: string;
  reasons: string[];
};

export type ExecutionCompensationStepRecord = {
  key: 'refresh-reconciliation' | 'sync-incident' | 'operator-followup';
  title: string;
  detail: string;
  automated: boolean;
  status: 'pending' | 'ready' | 'completed' | 'blocked';
};

export type ExecutionCompensationRecord = {
  status: 'not_needed' | 'queued' | 'ready' | 'running' | 'completed' | 'escalated';
  mode: 'none' | 'manual_review' | 'auto_reconcile' | 'auto_reconcile_and_escalate' | 'incident_followup';
  autoExecutable: boolean;
  recommendedAction: 'reconcile' | 'open_incident' | 'none';
  headline: string;
  reasons: string[];
  linkedIncidentId: string;
  linkedIncidentStatus: string;
  lastAutomatedAt: string;
  steps: ExecutionCompensationStepRecord[];
};

export type ExecutionExceptionPolicyRecord = {
  status: 'stable' | 'attention' | 'retrying' | 'compensation' | 'incident';
  category: 'none' | 'broker_reject' | 'broker_cancel' | 'workflow_retry' | 'reconciliation_drift' | 'mixed';
  retryEligible: boolean;
  retryCount: number;
  retryLimit: number;
  remainingRetries: number;
  recommendedAction: 'resume_workflow' | 'reroute_orders' | 'reconcile' | 'open_incident' | 'none';
  incidentRecommended: boolean;
  linkedIncidentId: string;
  linkedIncidentStatus: string;
  linkedIncidentCount: number;
  latestBrokerEventId: string;
  latestBrokerEventType: string;
  headline: string;
  reasons: string[];
};

export type ExecutionLedgerEntry = {
  plan: ExecutionPlanRecord;
  executionRun: ExecutionRunRecord | null;
  orderStates: ExecutionOrderStateRecord[];
  workflow: {
    id: string;
    workflowId: string;
    status: string;
    updatedAt: string;
    completedAt: string;
    failedAt: string;
  } | null;
  latestRuntime: ExecutionRuntimeEvent | null;
  latestSnapshot?: BrokerAccountSnapshotRecord | null;
  brokerEvents?: BrokerExecutionEventRecord[];
  reconciliation?: ExecutionReconciliationRecord | null;
  compensation?: ExecutionCompensationRecord | null;
  exceptionPolicy?: ExecutionExceptionPolicyRecord | null;
  recovery?: ExecutionRecoveryRecord | null;
  linkedIncidents?: IncidentRecord[];
};

export type LatestBrokerAccountSnapshotResponse = {
  ok: boolean;
  snapshot: BrokerAccountSnapshotRecord | null;
};

export type ExecutionPlanDetailResponse = {
  ok: boolean;
  plan: ExecutionPlanRecord | null;
  executionRun: ExecutionRunRecord | null;
  orderStates: ExecutionOrderStateRecord[];
  workflow: WorkflowRunRecord | null;
  latestRuntime: ExecutionRuntimeEvent | null;
  latestSnapshot?: BrokerAccountSnapshotRecord | null;
  brokerEvents?: BrokerExecutionEventRecord[];
  reconciliation?: ExecutionReconciliationRecord | null;
  compensation?: ExecutionCompensationRecord | null;
  exceptionPolicy?: ExecutionExceptionPolicyRecord | null;
  recovery?: ExecutionRecoveryRecord | null;
  linkedIncidents?: IncidentRecord[];
};

export type ExecutionWorkbenchResponse = {
  ok: boolean;
  asOf: string;
  summary: {
    totalPlans: number;
    awaitingApproval: number;
    routing: number;
    submitted: number;
    acknowledged: number;
    filled: number;
    blocked: number;
    cancelled: number;
    failed: number;
    aligned: number;
    attention: number;
    drift: number;
    missingSnapshot: number;
    totalOpenOrders: number;
    syncedPositions: number;
    recoverablePlans: number;
    retryScheduledWorkflows: number;
    interventionNeeded: number;
    retryEligiblePlans?: number;
    compensationPlans?: number;
    compensationReadyPlans?: number;
    escalatedCompensationPlans?: number;
    incidentLinkedPlans?: number;
    brokerRejectPlans?: number;
    brokerEvents: number;
    rejectedBrokerEvents: number;
    fillEvents: number;
  };
  operations: {
    queues: {
      approvals: ExecutionLedgerEntry[];
      retryEligible: ExecutionLedgerEntry[];
      compensation: ExecutionLedgerEntry[];
      compensationAutomation: ExecutionLedgerEntry[];
      incidents: ExecutionLedgerEntry[];
      activeRouting: ExecutionLedgerEntry[];
    };
    ownerLoad: Array<{
      owner: string;
      total: number;
      approvals: number;
      retryEligible: number;
      compensation: number;
      compensationAutomation: number;
      incidents: number;
      activeRouting: number;
    }>;
    nextActions: Array<{
      key: 'clear-approvals' | 'retry-rejected-orders' | 'run-compensation-automation' | 'reconcile-drift' | 'triage-execution-incidents' | 'watch-active-routing';
      priority: 'now' | 'next';
      title: string;
      detail: string;
      count: number;
    }>;
  };
  entries: ExecutionLedgerEntry[];
};

export type ExecutionBulkActionResult = {
  planId: string;
  ok: boolean;
  action: 'approve' | 'reconcile' | 'compensate' | 'recover' | 'cancel';
  lifecycleStatus: string;
  compensationStatus: string;
  incidentId: string;
  error?: string;
};

export type ExecutionBulkActionResponse = {
  ok: boolean;
  action: 'approve' | 'reconcile' | 'compensate' | 'recover' | 'cancel';
  updatedIds: string[];
  results: ExecutionBulkActionResult[];
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
  latestExecutionHandoff?: ExecutionCandidateHandoffRecord | null;
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

export type ExecutionCandidateHandoffRecord = {
  id: string;
  strategyId: string;
  strategyName: string;
  strategyStatus: string;
  runId: string;
  resultId: string;
  evaluationId: string;
  reportId: string;
  mode: 'paper' | 'live';
  capital: number;
  orderCount: number;
  baseline: boolean;
  champion: boolean;
  readiness: 'candidate' | 'paper' | 'live' | 'hold';
  verdict: 'promote' | 'prepare_execution' | 'rework' | 'blocked' | '';
  riskStatus: 'approved' | 'review' | 'blocked';
  approvalState: 'not_required' | 'required';
  handoffStatus: 'ready' | 'queued' | 'converted' | 'blocked';
  owner: string;
  summary: string;
  reasons: string[];
  orders: StrategyExecutionOrder[];
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type ExecutionCandidateHandoffSnapshot = {
  ok: boolean;
  asOf: string;
  summary: {
    total: number;
    ready: number;
    queued: number;
    blocked: number;
    paper: number;
    live: number;
  };
  handoffs: ExecutionCandidateHandoffRecord[];
};

export type ExecutionPlanRecord = {
  id: string;
  workflowRunId: string;
  handoffId: string;
  executionRunId: string;
  strategyId: string;
  strategyName: string;
  mode: 'paper' | 'live';
  status: 'draft' | 'ready' | 'blocked';
  lifecycleStatus: 'planned' | 'awaiting_approval' | 'routing' | 'submitted' | 'acknowledged' | 'partial_fill' | 'filled' | 'blocked' | 'cancelled' | 'failed';
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

export type AgentSessionStatus = 'draft' | 'ready' | 'running' | 'waiting_approval' | 'completed' | 'failed';
export type AgentMessageRole = 'system' | 'user' | 'assistant';
export type AgentMessageKind =
  | 'prompt'
  | 'intent'
  | 'plan'
  | 'analysis_status'
  | 'analysis_result'
  | 'approval_note'
  | 'system_note';

export type AgentIntentKind =
  | 'unknown'
  | 'read_only_analysis'
  | 'request_backtest_review'
  | 'request_execution_prep'
  | 'request_risk_explanation'
  | 'request_scheduler_action';

export type AgentIntentRecord = {
  kind: AgentIntentKind;
  summary: string;
  targetType: 'strategy' | 'backtest_run' | 'execution_plan' | 'risk_event' | 'scheduler_window' | 'incident' | 'unknown';
  targetId: string;
  urgency: 'low' | 'normal' | 'high';
  requiresApproval: boolean;
  requestedMode: 'read_only' | 'prepare_action';
  metadata: Record<string, unknown>;
};

export type AgentPlanStep = {
  id: string;
  kind: 'read' | 'analyze' | 'explain' | 'request_action';
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  toolName: string;
  description: string;
  outputSummary: string;
  metadata: Record<string, unknown>;
};

export type AgentPlanRecord = {
  id: string;
  sessionId: string;
  status: 'draft' | 'ready' | 'running' | 'completed' | 'failed';
  summary: string;
  requiresApproval: boolean;
  requestedBy: string;
  steps: AgentPlanStep[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AgentEvidenceRecord = {
  id: string;
  kind: 'tool_result' | 'domain_snapshot' | 'risk_note' | 'incident_context' | 'operator_note';
  title: string;
  summary: string;
  source: string;
  sourceId: string;
  metadata: Record<string, unknown>;
};

export type AgentAnalysisRunRecord = {
  id: string;
  sessionId: string;
  planId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  summary: string;
  conclusion: string;
  requestedBy: string;
  toolCalls: Array<{
    tool: string;
    status: 'pending' | 'completed' | 'failed';
    summary: string;
    metadata: Record<string, unknown>;
  }>;
  evidence: AgentEvidenceRecord[];
  explanation: {
    thesis: string;
    rationale: string[];
    warnings: string[];
    recommendedNextStep: string;
  };
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt: string;
};

export type AgentSessionMessageRecord = {
  id: string;
  sessionId: string;
  role: AgentMessageRole;
  kind: AgentMessageKind;
  title: string;
  body: string;
  requestedBy: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type AgentSessionRecord = {
  id: string;
  status: AgentSessionStatus;
  title: string;
  prompt: string;
  requestedBy: string;
  latestIntent: AgentIntentRecord;
  latestPlanId: string;
  latestAnalysisRunId: string;
  latestActionRequestId: string;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
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

export type AgentAuthorityMode =
  | 'full_auto'
  | 'bounded_auto'
  | 'ask_first'
  | 'manual_only'
  | 'stopped';

export type AgentAuthorityState = {
  mode: AgentAuthorityMode;
  reason: string;
  updatedAt: string;
  accountId?: string;
  strategyId?: string;
  actionType?: string;
  latestEvent?: AgentAuthorityEventRecord;
  policy?: AgentPolicyRecord;
};

export type AgentInstructionKind =
  | 'conversation'
  | 'daily_bias'
  | 'market_intel'
  | 'watch_focus'
  | 'strategy_change_request';

export type AgentDailyBiasState = {
  summary: string;
  updatedAt: string;
  instructions: AgentInstructionRecord[];
  accountId?: string;
  strategyId?: string;
  actionType?: string;
};

export type AgentDailyRunKind =
  | 'pre_market'
  | 'intraday_monitor'
  | 'post_market'
  | 'operator_update'
  | 'risk_event'
  | 'execution_event'
  | 'market_event';

export type AgentPolicyRecord = {
  id: string;
  accountId: string;
  strategyId: string;
  actionType: string;
  environment: 'paper' | 'live' | 'all';
  authority: AgentAuthorityMode;
  singleActionMaxNotional: number;
  singleActionMaxEquityPct: number;
  strategyExposureMaxPct: number;
  dailyAutoActionLimit: number;
  dailyLossLimitPct: number;
  maxDrawdownLimitPct: number;
  createdAt: string;
  updatedAt: string;
};

export type AgentInstructionRecord = {
  id: string;
  sessionId: string;
  kind: AgentInstructionKind;
  title: string;
  body: string;
  requestedBy: string;
  activeUntil: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type AgentDailyRunRecord = {
  id: string;
  kind: AgentDailyRunKind;
  status: 'queued' | 'running' | 'completed' | 'failed';
  trigger: 'schedule' | 'event';
  accountId?: string;
  strategyId?: string;
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type AgentAuthorityEventRecord = {
  id: string;
  severity: 'info' | 'warn' | 'critical';
  eventType: 'downgraded' | 'stopped' | 'restored' | 'blocked';
  previousMode: AgentAuthorityMode;
  nextMode: AgentAuthorityMode;
  reason: string;
  createdAt: string;
  accountId?: string;
  strategyId?: string;
  actionType?: string;
  sessionId?: string;
  policyId?: string;
  metadata: Record<string, unknown>;
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
  governanceSummary?: ResearchWorkbenchSnapshot['actionSummary'];
  handoffSummary?: ExecutionCandidateHandoffSnapshot['summary'];
  strategies: StrategyCatalogItem[];
  runs: BacktestRunItem[];
  tasks: ResearchTaskRecord[];
  results: BacktestResultRecord[];
  evaluations?: ResearchEvaluationRecord[];
  reports?: ResearchReportRecord[];
  governanceActions?: ResearchGovernanceActionRecord[];
  handoffs?: ExecutionCandidateHandoffRecord[];
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
      activeWorkers: number;
      staleWorkers: number;
      latestHeartbeatAt: string;
    };
    workflows: {
      status: string;
      total: number;
      active: number;
      queued: number;
      running: number;
      retryScheduled: number;
      failed: number;
      completed: number;
      canceled: number;
      oldestQueuedAgeSeconds: number | null;
      oldestRetryAgeSeconds: number | null;
      lastCompletedAt: string;
      lastFailedAt: string;
      failureRate: number;
    };
    queues: {
      status: string;
      pendingNotificationJobs: number;
      pendingRiskScanJobs: number;
      pendingAgentReviews: number;
      retryScheduledWorkflows: number;
      totalPending: number;
      backlogStatus: 'healthy' | 'warn' | 'critical';
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

export type ControlPlaneAdapterSnapshot = {
  kind: string;
  label: string;
  namespace: string;
  persistence?: string;
};

export type ControlPlaneMigrationRecord = {
  id: string;
  appliedAt?: string;
  fromVersion?: number | null;
  toVersion?: number | null;
};

export type ControlPlanePendingMigration = {
  id: string;
  fromVersion?: number | null;
  toVersion?: number | null;
};

export type ControlPlanePersistenceSnapshot = {
  adapter: ControlPlaneAdapterSnapshot;
  manifest: {
    schemaVersion: number | null;
    persistence?: string;
    storageModel?: string;
    initializedAt?: string;
    updatedAt?: string;
    migrations: ControlPlaneMigrationRecord[];
  } | null;
  migrationPlan: {
    adapter?: ControlPlaneAdapterSnapshot;
    currentVersion: number | null;
    targetVersion: number | null;
    pending: ControlPlanePendingMigration[];
    upToDate: boolean;
  };
};

export type OperationsMaintenanceResponse = {
  ok: boolean;
  generatedAt: string;
  storageAdapter: ControlPlaneAdapterSnapshot;
  integrity: {
    ok: boolean;
    generatedAt: string;
    status: string;
    adapter: ControlPlaneAdapterSnapshot;
    persistence: ControlPlanePersistenceSnapshot;
    files: Array<{
      filename: string;
      label: string;
      kind: string;
      keyCount?: number;
      recordCount?: number;
    }>;
    issues: Array<{
      level: string;
      code: string;
      filename: string;
      message: string;
      metadata?: Record<string, unknown>;
    }>;
    summary: {
      fileCount: number;
      collectionFiles: number;
      objectFiles: number;
      totalRecords: number;
      duplicateIdCount: number;
      missingIdCount: number;
      malformedRecordCount: number;
      retryScheduledWorkflows: number;
      failedWorkflows: number;
      pendingNotificationJobs: number;
      pendingRiskScanJobs: number;
      pendingAgentReviews: number;
    };
  };
  backlog: {
    pendingNotificationJobs: number;
    pendingRiskScanJobs: number;
    pendingAgentReviews: number;
    retryScheduledWorkflows: number;
    failedWorkflows: number;
    totalPending: number;
    backlogStatus: string;
  };
  recentFailedWorkflows: WorkflowRunRecord[];
  recentRetryScheduledWorkflows: WorkflowRunRecord[];
  supportedRepairs: Array<{
    key: string;
    label: string;
    detail: string;
  }>;
};

export type OperationsPersistencePosture = {
  posture: 'healthy' | 'attention' | 'degraded';
  headline: string;
  detail: string;
  adapter: ControlPlaneAdapterSnapshot;
  storageModel: string;
  schemaVersion: number | null;
  currentVersion: number | null;
  targetVersion: number | null;
  pendingCount: number;
  upToDate: boolean;
  recommendedAction: string;
  latestMigration: ControlPlaneMigrationRecord | null;
  links: {
    maintenance: string;
    settings: string;
  };
};

export type OperationsWorkbenchResponse = {
  ok: boolean;
  generatedAt: string;
  status: string;
  summary: {
    criticalSignals: number;
    warnSignals: number;
    queuePressure: number;
    queueBacklogStatus: 'healthy' | 'warn' | 'critical';
    openIncidents: number;
    staleIncidents: number;
    unassignedIncidents: number;
    schedulerAttention: number;
    retryScheduledWorkflows: number;
    staleWorkers: number;
    activeWorkers: number;
    workflowFailureRate: number;
  };
  observability: {
    posture: 'healthy' | 'warn' | 'critical';
    headline: string;
    detail: string;
    queueBacklogStatus: 'healthy' | 'warn' | 'critical';
    oldestQueuedAgeSeconds: number | null;
    oldestRetryAgeSeconds: number | null;
    lastCompletedWorkflowAt: string;
    workerLagSeconds: number | null;
  };
  persistence: OperationsPersistencePosture;
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
    concentrationPct: number;
    drawdownAlerts: number;
    complianceAlerts: number;
    emergencyActions: number;
    schedulerAttention: number;
  };
  lanes: Array<{
    key: 'risk-events' | 'execution-review' | 'backtest-review' | 'incidents' | 'portfolio' | 'drawdown' | 'compliance' | 'emergency' | 'scheduler' | 'broker';
    title: string;
    status: string;
    detail: string;
    primaryCount: number;
    secondaryCount: number;
    updatedAt: string;
  }>;
  runbook: Array<{
    key: 'review-risk-off' | 'clear-review-queue' | 'inspect-live-exposure' | 'triage-risk-incidents' | 'review-scheduler-drift' | 'check-compliance-alerts' | 'release-emergency-brake';
    priority: 'now' | 'next';
    title: string;
    detail: string;
    count: number;
  }>;
  reviewQueue: {
    riskEvents: Array<NonNullable<MonitoringStatusSnapshot['recent']['latestRiskEvent']>>;
    executionPlans: ExecutionPlanRecord[];
    backtestRuns: BacktestRunItem[];
    incidents: IncidentRecord[];
    schedulerTicks: Array<NonNullable<MonitoringStatusSnapshot['recent']['latestSchedulerTick']>>;
  };
  recent: {
    riskEvents: Array<NonNullable<MonitoringStatusSnapshot['recent']['latestRiskEvent']>>;
    executionPlans: ExecutionPlanRecord[];
    backtestRuns: BacktestRunItem[];
    incidents: IncidentRecord[];
    brokerSnapshot: BrokerAccountSnapshotRecord | null;
    schedulerTicks: Array<NonNullable<MonitoringStatusSnapshot['recent']['latestSchedulerTick']>>;
  };
  linkage: RiskSchedulerLinkageSnapshot;
};

export type RiskRunbookActionKey =
  | 'review-risk-off'
  | 'clear-review-queue'
  | 'inspect-live-exposure'
  | 'triage-risk-incidents'
  | 'review-scheduler-drift'
  | 'check-compliance-alerts'
  | 'release-emergency-brake';

export type RiskPolicyActionResponse = {
  ok: boolean;
  action: {
    key: RiskRunbookActionKey;
    actor: string;
    title: string;
    detail: string;
    level: 'info' | 'warn' | 'critical';
    executedAt: string;
    linkedIncidentIds: string[];
    linkedRiskEventIds: string[];
    linkedExecutionPlanIds: string[];
    linkedBacktestRunIds: string[];
    linkedSchedulerTickIds: string[];
  };
  operatorAction: {
    id: string;
    type: string;
    actor: string;
    title: string;
    detail: string;
    level: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
  };
  riskEvent: NonNullable<MonitoringStatusSnapshot['recent']['latestRiskEvent']>;
  incidents: IncidentRecord[];
  workbench: RiskWorkbenchResponse;
};

export type RiskSchedulerLinkageSnapshot = {
  posture: {
    status: 'healthy' | 'warn' | 'critical';
    title: string;
    detail: string;
  };
  summary: {
    linkedRiskEvents: number;
    linkedSchedulerTicks: number;
    linkedIncidents: number;
    linkedNotifications: number;
    cycleAttention: number;
    currentPhaseAttention: number;
    riskOffLinked: number;
    complianceLinked: number;
    activePhase: string;
  };
  lanes: Array<{
    key: 'current-window' | 'risk-events' | 'scheduler-ticks' | 'incidents' | 'cycles' | 'notifications';
    title: string;
    status: string;
    detail: string;
    primaryCount: number;
    secondaryCount: number;
    updatedAt: string;
  }>;
  runbook: Array<{
    key: 'focus-linked-window' | 'review-linked-risk' | 'triage-linked-incidents' | 'align-cycle-posture' | 'clear-linked-notifications';
    priority: 'now' | 'next';
    title: string;
    detail: string;
    count: number;
  }>;
  queue: {
    riskEvents: Array<NonNullable<MonitoringStatusSnapshot['recent']['latestRiskEvent']>>;
    schedulerTicks: Array<NonNullable<MonitoringStatusSnapshot['recent']['latestSchedulerTick']>>;
    incidents: IncidentRecord[];
    notifications: Array<{
      id: string;
      level: string;
      title: string;
      message: string;
      source: string;
      createdAt: string;
      metadata?: Record<string, unknown>;
    }>;
    cycleRecords: Array<{
      id: string;
      cycle: number;
      mode: string;
      riskLevel: string;
      decisionSummary: string;
      pendingApprovals: number;
      brokerConnected: boolean;
      marketConnected: boolean;
      createdAt: string;
    }>;
  };
};

export type SchedulerRunbookActionKey =
  | 'review-current-window'
  | 'triage-scheduler-incidents'
  | 'clear-scheduler-signals'
  | 'follow-cycle-drift'
  | 'align-risk-window'
  | 'review-off-hours-watch';

export type SchedulerOrchestrationActionResponse = {
  ok: boolean;
  action: {
    key: SchedulerRunbookActionKey;
    actor: string;
    title: string;
    detail: string;
    level: 'info' | 'warn' | 'critical';
    phase: string;
    executedAt: string;
    touchedIncidentIds: string[];
    touchedNotificationIds: string[];
    touchedRiskEventIds: string[];
    touchedCycleIds: string[];
  };
  operatorAction: {
    id: string;
    type: string;
    actor: string;
    title: string;
    detail: string;
    level: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
  };
  schedulerTick: NonNullable<MonitoringStatusSnapshot['recent']['latestSchedulerTick']>;
  cycleRecord: {
    id: string;
    cycle: number;
    mode: string;
    riskLevel: string;
    decisionSummary: string;
    pendingApprovals: number;
    brokerConnected: boolean;
    marketConnected: boolean;
    createdAt: string;
  } | null;
  incidents: IncidentRecord[];
  workbench: SchedulerWorkbenchResponse;
};

export type SchedulerWorkbenchResponse = {
  ok: boolean;
  generatedAt: string;
  posture: {
    status: 'healthy' | 'warn' | 'critical';
    title: string;
    detail: string;
    currentPhase: string;
    lastTickAt: string;
  };
  summary: {
    totalTicks: number;
    attentionTicks: number;
    criticalTicks: number;
    phaseChanges: number;
    preOpenTicks: number;
    intradayTicks: number;
    postCloseTicks: number;
    offHoursTicks: number;
    openIncidents: number;
    cycleAttention: number;
    schedulerNotifications: number;
    riskSignals: number;
  };
  lanes: Array<{
    key: 'pre-open' | 'intraday' | 'post-close' | 'off-hours' | 'incidents' | 'cycles' | 'notifications' | 'risk';
    title: string;
    status: string;
    detail: string;
    primaryCount: number;
    secondaryCount: number;
    updatedAt: string;
  }>;
  runbook: Array<{
    key: 'review-current-window' | 'triage-scheduler-incidents' | 'clear-scheduler-signals' | 'follow-cycle-drift' | 'align-risk-window' | 'review-off-hours-watch';
    priority: 'now' | 'next';
    title: string;
    detail: string;
    count: number;
  }>;
  queue: {
    attentionTicks: Array<NonNullable<MonitoringStatusSnapshot['recent']['latestSchedulerTick']>>;
    incidents: IncidentRecord[];
    notifications: Array<{
      id: string;
      level: string;
      title: string;
      message: string;
      source: string;
      createdAt: string;
      metadata?: Record<string, unknown>;
    }>;
    cycleRecords: Array<{
      id: string;
      cycle: number;
      mode: string;
      riskLevel: string;
      decisionSummary: string;
      pendingApprovals: number;
      brokerConnected: boolean;
      marketConnected: boolean;
      createdAt: string;
    }>;
    riskEvents: Array<NonNullable<MonitoringStatusSnapshot['recent']['latestRiskEvent']>>;
  };
  recent: {
    ticks: Array<NonNullable<MonitoringStatusSnapshot['recent']['latestSchedulerTick']>>;
    incidents: IncidentRecord[];
    notifications: Array<{
      id: string;
      level: string;
      title: string;
      message: string;
      source: string;
      createdAt: string;
      metadata?: Record<string, unknown>;
    }>;
    cycleRecords: Array<{
      id: string;
      cycle: number;
      mode: string;
      riskLevel: string;
      decisionSummary: string;
      pendingApprovals: number;
      brokerConnected: boolean;
      marketConnected: boolean;
      createdAt: string;
    }>;
    riskEvents: Array<NonNullable<MonitoringStatusSnapshot['recent']['latestRiskEvent']>>;
  };
  linkage: RiskSchedulerLinkageSnapshot;
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
