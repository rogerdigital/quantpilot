import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { invokeGatewayRoute } from './helpers/invoke-gateway.mjs';
import { createTradingState } from './helpers/create-trading-state.mjs';

const namespace = `control-plane-api-test-${randomUUID()}`;
process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE = namespace;

const fakeBrokerHealth = {
  adapter: 'simulated',
  connected: true,
  customBrokerConfigured: false,
  alpacaConfigured: false,
};

const fakeBrokerExecution = {
  connected: true,
  message: 'test broker execution ok',
  submittedOrders: [],
  rejectedOrders: [],
  snapshot: {
    connected: true,
    message: 'test broker state ok',
    account: {
      cash: 80000,
      buyingPower: 80000,
      equity: 80000,
    },
    positions: [],
    orders: [],
  },
};

const fakeMarketSnapshot = {
  label: 'Injected Test Market',
  connected: true,
  message: 'test market snapshot ok',
  quotes: [],
};

const [{ createGatewayHandler }, { createControlPlaneContext }, { createControlPlaneStore }] = await Promise.all([
  import('../src/gateways/alpaca.mjs'),
  import('../../../packages/control-plane-store/src/context.mjs'),
  import('../../../packages/control-plane-store/src/store.mjs'),
]);

const handler = createGatewayHandler({
  getBrokerHealth: async () => fakeBrokerHealth,
  executeBrokerCycle: async () => fakeBrokerExecution,
  getMarketSnapshot: async () => fakeMarketSnapshot,
});
const context = createControlPlaneContext(createControlPlaneStore({ namespace }));

test.after(() => {
  rmSync(join(process.cwd(), '.quantpilot-runtime', namespace), { recursive: true, force: true });
  delete process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE;
});

test('GET /api/notification/events returns seeded notifications', async () => {
  context.notifications.appendNotification({
    id: 'notif-api-test',
    title: 'API notification',
    message: 'seeded notification',
    source: 'test',
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/notification/events',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.events[0].id, 'notif-api-test');
});

test('GET /api/risk/events returns seeded risk events', async () => {
  context.risk.appendRiskEvent({
    id: 'risk-api-test',
    title: 'Risk event',
    message: 'seeded risk event',
    cycle: 88,
    riskLevel: 'RISK OFF',
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/risk/events',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.events[0].id, 'risk-api-test');
});

test('GET /api/strategy/catalog returns research strategies', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/strategy/catalog',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(Array.isArray(response.json.strategies), true);
  assert.equal(response.json.strategies.some((item) => item.status === 'candidate'), true);
});

test('GET /api/backtest/summary returns structured research summary', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/backtest/summary',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(typeof response.json.completedRuns, 'number');
  assert.equal(typeof response.json.averageSharpe, 'number');
});

test('GET /api/backtest/runs returns structured backtest runs', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/backtest/runs',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(Array.isArray(response.json.runs), true);
  assert.equal(response.json.runs.some((item) => item.status === 'completed'), true);
});

test('GET /api/agent/tools returns allowlisted read-only tools', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/agent/tools',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(Array.isArray(response.json.tools), true);
  assert.equal(response.json.tools.some((item) => item.name === 'execution.plans.list'), true);
  assert.equal(response.json.tools.every((item) => item.access === 'read'), true);
});

test('GET /api/architecture returns the seven-layer architecture summary', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/architecture',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.architecture.summary.layerCount, 7);
  assert.equal(response.json.architecture.layers.some((item) => item.id === 'frontend'), true);
  assert.equal(response.json.architecture.layers.some((item) => item.id === 'backend' && item.moduleCount >= 1), true);
  assert.equal(
    response.json.architecture.layers.some(
      (item) => item.id === 'agent' && item.modules.some((module) => module.id === 'agent'),
    ),
    true,
  );
});

test('GET /api/auth/session returns account-backed session data', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/auth/session',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.user.id, 'operator-demo');
  assert.equal(Array.isArray(response.json.user.permissions), true);
  assert.equal(typeof response.json.preferences.timezone, 'string');
});

test('GET /api/user-account/profile returns profile and preferences', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/user-account/profile',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.profile.email, 'operator@quantpilot.local');
  assert.equal(typeof response.json.preferences.defaultMode, 'string');
});

test('POST /api/user-account/profile updates persisted profile data', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/user-account/profile',
    body: {
      name: 'Operator One',
      organization: 'QuantPilot Research',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.profile.name, 'Operator One');
  assert.equal(response.json.profile.organization, 'QuantPilot Research');
});

test('POST /api/user-account/preferences updates persisted preferences', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/user-account/preferences',
    body: {
      locale: 'en-US',
      notificationChannels: ['inbox', 'email'],
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.preferences.locale, 'en-US');
  assert.equal(response.json.preferences.notificationChannels.includes('email'), true);
});

test('account write routes reject requests without account:write permission', async () => {
  context.userAccount.updateUserProfile({
    role: 'viewer',
  });

  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/user-account/preferences',
    body: {
      locale: 'zh-CN',
    },
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.json.ok, false);

  context.userAccount.updateUserProfile({
    role: 'admin',
  });
});

test('POST /api/user-account/broker-bindings upserts broker bindings', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/user-account/broker-bindings',
    body: {
      id: 'binding-live',
      provider: 'custom-http',
      label: 'Live Broker',
      environment: 'live',
      accountId: 'live-main',
      status: 'connected',
      permissions: ['read', 'trade'],
      isDefault: true,
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.binding.id, 'binding-live');

  const listResponse = await invokeGatewayRoute(handler, {
    path: '/api/user-account/broker-bindings',
  });
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.json.ok, true);
  assert.equal(listResponse.json.bindings.some((item) => item.id === 'binding-live' && item.isDefault), true);
});

test('POST /api/agent/tools/execute runs an allowlisted read-only tool', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/agent/tools/execute',
    body: {
      tool: 'backtest.summary.get',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.tool, 'backtest.summary.get');
  assert.equal(typeof response.json.summary, 'string');
});

test('POST /api/agent/tools/execute rejects non-allowlisted tools', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/agent/tools/execute',
    body: {
      tool: 'execution.plan.create',
    },
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.json.ok, false);
});

test('POST /api/agent/action-requests queues an agent action request workflow', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/agent/action-requests',
    body: {
      requestType: 'prepare_execution_plan',
      targetId: 'ema-cross-us',
      summary: 'Agent asks for execution plan review.',
      rationale: 'Strategy score has improved.',
      requestedBy: 'agent',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.workflow.workflowId, 'task-orchestrator.agent-action-request');
});

test('POST /api/agent/action-requests rejects unsupported request types', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/agent/action-requests',
    body: {
      requestType: 'direct_execute',
      targetId: 'ema-cross-us',
      requestedBy: 'agent',
    },
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.json.ok, false);
});

test('GET /api/agent/action-requests returns persisted requests', async () => {
  context.agentActionRequests.appendAgentActionRequest({
    requestType: 'review_backtest',
    targetId: 'bt-ema-cross-20260310',
    status: 'pending_review',
    approvalState: 'pending',
    summary: 'Agent requests backtest review.',
    rationale: 'Drawdown breach needs review.',
    requestedBy: 'agent',
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/agent/action-requests',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(Array.isArray(response.json.requests), true);
  assert.equal(response.json.requests[0].requestType, 'review_backtest');
});

test('POST /api/agent/action-requests/approve queues downstream workflow only after approval', async () => {
  const createResponse = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/agent/action-requests',
    body: {
      requestType: 'prepare_execution_plan',
      targetId: 'ema-cross-us',
      summary: 'Agent asks for execution plan review.',
      rationale: 'Strategy score improved.',
      requestedBy: 'agent',
    },
  });

  const queuedRequestWorkflowId = createResponse.json.workflow.id;
  context.workflows.updateWorkflowRun(queuedRequestWorkflowId, {
    status: 'completed',
  });
  const request = context.agentActionRequests.appendAgentActionRequest({
    workflowRunId: queuedRequestWorkflowId,
    requestType: 'prepare_execution_plan',
    targetId: 'ema-cross-us',
    status: 'pending_review',
    approvalState: 'required',
    riskStatus: 'approved',
    summary: 'Pending review',
    rationale: 'Strategy score improved.',
    requestedBy: 'agent',
  });

  const approveResponse = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/agent/action-requests/${request.id}/approve`,
    body: {
      approvedBy: 'risk-operator',
      mode: 'paper',
      capital: 125000,
    },
  });

  assert.equal(approveResponse.statusCode, 200);
  assert.equal(approveResponse.json.request.status, 'approved');
  assert.equal(approveResponse.json.workflow.workflowId, 'task-orchestrator.strategy-execution');
});

test('POST /api/agent/action-requests/reject marks the request as rejected', async () => {
  const request = context.agentActionRequests.appendAgentActionRequest({
    requestType: 'review_backtest',
    targetId: 'bt-ema-cross-20260310',
    status: 'pending_review',
    approvalState: 'required',
    riskStatus: 'review',
    summary: 'Pending review',
    rationale: 'Review needed',
    requestedBy: 'agent',
  });

  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/agent/action-requests/${request.id}/reject`,
    body: {
      rejectedBy: 'risk-operator',
      reason: 'Not enough context',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.request.status, 'rejected');
  assert.equal(response.json.request.approvalState, 'rejected');
});

test('POST /api/strategy/execute queues a strategy execution workflow', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/strategy/execute',
    body: {
      strategyId: 'ema-cross-us',
      mode: 'paper',
      capital: 150000,
      requestedBy: 'api-test',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.workflow.workflowId, 'task-orchestrator.strategy-execution');
  assert.equal(response.json.workflow.status, 'queued');
});

test('GET /api/execution/plans returns persisted execution plans', async () => {
  context.executionPlans.appendExecutionPlan({
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    mode: 'paper',
    status: 'ready',
    approvalState: 'not_required',
    riskStatus: 'approved',
    summary: 'Seed execution plan',
    capital: 100000,
    orderCount: 1,
    orders: [{ symbol: 'NVDA', side: 'BUY', qty: 10, weight: 1, rationale: 'seed' }],
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/execution/plans',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(Array.isArray(response.json.plans), true);
  assert.equal(response.json.plans[0].strategyId, 'ema-cross-us');
});

test('POST /api/task-orchestrator/workflows/:id/resume emits workflow-control notification for recovery', async () => {
  const queued = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/strategy/execute',
    body: {
      strategyId: 'ema-cross-us',
      mode: 'live',
      capital: 150000,
      requestedBy: 'api-test',
    },
  });

  context.workflows.updateWorkflowRun(queued.json.workflow.id, {
    status: 'failed',
    error: 'seeded failure',
  });

  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/task-orchestrator/workflows/${queued.json.workflow.id}/resume`,
    body: {},
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.workflow.status, 'queued');
  assert.equal(context.notifications.listNotificationJobs().some((item) => item.payload.source === 'workflow-control'), true);
});

test('GET /api/scheduler/ticks returns scheduler ticks from shared store', async () => {
  context.scheduler.recordSchedulerTick({
    worker: 'api-test-worker',
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/scheduler/ticks',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ticks.length >= 1, true);
  assert.equal(typeof response.json.ticks[0].phase, 'string');
});

test('POST then GET /api/task-orchestrator/actions persists operator actions', async () => {
  const createResponse = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/actions',
    body: {
      type: 'approve-intent',
      actor: 'api-test',
      title: 'Approve from API test',
      detail: 'approved via gateway route',
      symbol: 'AAPL',
      level: 'info',
    },
  });
  const listResponse = await invokeGatewayRoute(handler, {
    path: '/api/task-orchestrator/actions',
  });

  assert.equal(createResponse.statusCode, 200);
  assert.equal(createResponse.json.action.title, 'Approve from API test');
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.json.actions.some((item) => item.id === createResponse.json.action.id), true);
});

test('GET /api/health exposes gateway module status', async () => {
  const response = await invokeGatewayRoute(handler, {
    path: '/api/health',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.brokerAdapter, 'alpaca');
  assert.equal(response.json.architectureLayers, 7);
  assert.equal(typeof response.json.modules, 'number');
});

test('POST then GET /api/audit/records persists audit entries', async () => {
  const createResponse = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/audit/records',
    body: {
      type: 'test-audit',
      actor: 'api-test',
      title: 'Audit from API test',
      detail: 'audit record created through gateway route',
    },
  });
  const listResponse = await invokeGatewayRoute(handler, {
    path: '/api/audit/records',
  });

  assert.equal(createResponse.statusCode, 200);
  assert.equal(createResponse.json.record.title, 'Audit from API test');
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.json.records.some((item) => item.id === createResponse.json.record.id), true);
});

test('POST then GET /api/task-orchestrator/cycles persists cycle records', async () => {
  const createResponse = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/cycles',
    body: {
      cycle: 21,
      mode: 'hybrid',
      riskLevel: 'NORMAL',
      decisionSummary: 'cycle created from API test',
      marketClock: '2026-03-10 09:30:00',
      pendingApprovals: 0,
      liveIntentCount: 0,
      brokerConnected: true,
      marketConnected: true,
    },
  });
  const listResponse = await invokeGatewayRoute(handler, {
    path: '/api/task-orchestrator/cycles',
  });

  assert.equal(createResponse.statusCode, 200);
  assert.equal(createResponse.json.cycle.cycle, 21);
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.json.cycles.some((item) => item.id === createResponse.json.cycle.id), true);
  assert.equal(context.audit.listAuditRecords().some((item) => item.title.includes('Cycle 21 completed')), true);
  assert.equal(context.notifications.listNotificationJobs().length >= 0, true);
});

test('POST /api/task-orchestrator/cycles/run returns control plane resolution', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/cycles/run',
    body: {
      cycle: 22,
      mode: 'autopilot',
      riskLevel: 'NORMAL',
      decisionSummary: 'resolution route test',
      marketClock: '2026-03-10 09:35:00',
      pendingApprovals: 0,
      liveIntentCount: 0,
      brokerConnected: true,
      marketConnected: true,
      liveTradeEnabled: false,
      pendingLiveIntents: [],
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.controlPlane.lastStatus, 'HEALTHY');
  assert.equal(response.json.brokerExecution.message, 'test broker execution ok');
  assert.equal(response.json.workflow.workflowId, 'task-orchestrator.cycle-run');
  assert.equal(response.json.workflow.status, 'completed');
});

test('POST /api/task-orchestrator/cycles queues review notifications when approvals are pending', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/cycles',
    body: {
      cycle: 23,
      mode: 'autopilot',
      riskLevel: 'NORMAL',
      decisionSummary: 'pending approvals route test',
      marketClock: '2026-03-10 09:40:00',
      pendingApprovals: 2,
      liveIntentCount: 2,
      brokerConnected: true,
      marketConnected: true,
    },
  });

  const notificationJobs = context.notifications.listNotificationJobs();

  assert.equal(response.statusCode, 200);
  assert.equal(notificationJobs.some((job) => job.payload.title.includes('requires approval')), true);
});

test('POST /api/task-orchestrator/state/run returns next state and enqueues risk scan', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/state/run',
    body: {
      state: createTradingState(),
    },
  });

  const riskJobs = context.risk.listRiskScanJobs();

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.state.cycle, 1);
  assert.equal(response.json.resolution.ok, true);
  assert.equal(response.json.state.integrationStatus.marketData.message, 'test market snapshot ok');
  assert.equal(response.json.workflow.workflowId, 'task-orchestrator.state-run');
  assert.equal(response.json.workflow.status, 'completed');
  assert.equal(riskJobs.length >= 1, true);
  assert.equal(riskJobs[0].payload.source, 'state-runner');
});

test('GET /api/task-orchestrator/workflows returns persisted workflow runs', async () => {
  await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/cycles/run',
    body: {
      cycle: 24,
      mode: 'autopilot',
      riskLevel: 'NORMAL',
      decisionSummary: 'workflow list route test',
      marketClock: '2026-03-10 09:45:00',
      pendingApprovals: 0,
      liveIntentCount: 0,
      brokerConnected: true,
      marketConnected: true,
      liveTradeEnabled: false,
      pendingLiveIntents: [],
    },
  });

  const response = await invokeGatewayRoute(handler, {
    path: '/api/task-orchestrator/workflows',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.workflows.some((item) => item.workflowId === 'task-orchestrator.cycle-run'), true);
});

test('GET /api/task-orchestrator/workflows/:id returns a persisted workflow run', async () => {
  const cycleRun = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/cycles/run',
    body: {
      cycle: 25,
      mode: 'autopilot',
      riskLevel: 'NORMAL',
      decisionSummary: 'workflow detail route test',
      marketClock: '2026-03-10 09:50:00',
      pendingApprovals: 0,
      liveIntentCount: 0,
      brokerConnected: true,
      marketConnected: true,
      liveTradeEnabled: false,
      pendingLiveIntents: [],
    },
  });

  const response = await invokeGatewayRoute(handler, {
    path: `/api/task-orchestrator/workflows/${cycleRun.json.workflow.id}`,
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.workflow.id, cycleRun.json.workflow.id);
  assert.equal(response.json.workflow.workflowId, 'task-orchestrator.cycle-run');
});

test('POST /api/task-orchestrator/workflows/queue creates a queued workflow run', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/workflows/queue',
    body: {
      workflowId: 'task-orchestrator.manual-review',
      workflowType: 'task-orchestrator',
      actor: 'api-test',
      trigger: 'manual',
      payload: { symbol: 'AAPL' },
      maxAttempts: 2,
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.workflow.status, 'queued');
  assert.equal(response.json.workflow.workflowId, 'task-orchestrator.manual-review');
});

test('POST /api/task-orchestrator/cycles/queue creates a queued cycle workflow', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/cycles/queue',
    body: {
      cycle: 26,
      mode: 'hybrid',
      riskLevel: 'NORMAL',
      decisionSummary: 'queued cycle route test',
      marketClock: '2026-03-10 10:10:00',
      pendingApprovals: 0,
      liveIntentCount: 0,
      brokerConnected: true,
      marketConnected: true,
      liveTradeEnabled: false,
      pendingLiveIntents: [],
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.workflow.workflowId, 'task-orchestrator.cycle-run');
  assert.equal(response.json.workflow.status, 'queued');
});

test('POST /api/task-orchestrator/state/queue creates a queued state workflow', async () => {
  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/state/queue',
    body: {
      state: createTradingState(),
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.workflow.workflowId, 'task-orchestrator.state-run');
  assert.equal(response.json.workflow.status, 'queued');
});

test('POST /api/task-orchestrator/workflows/:id/resume resumes a failed workflow run', async () => {
  const queued = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/workflows/queue',
    body: {
      workflowId: 'task-orchestrator.resume-test',
      workflowType: 'task-orchestrator',
      actor: 'api-test',
      trigger: 'manual',
    },
  });

  context.workflows.updateWorkflowRun(queued.json.workflow.id, {
    status: 'failed',
    error: 'manual failure',
    failedAt: '2026-03-10T10:00:00.000Z',
  });

  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/task-orchestrator/workflows/${queued.json.workflow.id}/resume`,
    body: {},
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.workflow.status, 'queued');
  assert.equal(response.json.workflow.error, null);
});

test('POST /api/task-orchestrator/workflows/:id/cancel cancels a workflow run', async () => {
  const queued = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/workflows/queue',
    body: {
      workflowId: 'task-orchestrator.cancel-test',
      workflowType: 'task-orchestrator',
      actor: 'api-test',
      trigger: 'manual',
    },
  });

  const response = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/task-orchestrator/workflows/${queued.json.workflow.id}/cancel`,
    body: {},
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.workflow.status, 'canceled');
});
