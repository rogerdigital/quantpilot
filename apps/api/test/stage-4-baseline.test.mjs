import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { invokeGatewayRoute } from './helpers/invoke-gateway.mjs';

const namespace = `stage-4-baseline-test-${randomUUID()}`;
process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE = namespace;

const [{ createGatewayHandler }, { createControlPlaneContext }, { createControlPlaneStore }] = await Promise.all([
  import('../src/gateways/alpaca.mjs'),
  import('../../../packages/control-plane-store/src/context.mjs'),
  import('../../../packages/control-plane-store/src/store.mjs'),
]);

const handler = createGatewayHandler({
  getBrokerHealth: async () => ({
    adapter: 'simulated',
    connected: true,
    customBrokerConfigured: false,
    alpacaConfigured: false,
  }),
  executeBrokerCycle: async () => ({
    connected: true,
    message: 'stage 4 baseline broker ok',
    submittedOrders: [],
    rejectedOrders: [],
    snapshot: {
      connected: true,
      message: 'stage 4 baseline snapshot ok',
      account: {
        cash: 91000,
        buyingPower: 98000,
        equity: 104500,
      },
      positions: [{ symbol: 'NVDA', qty: 18, avgCost: 812.4, marketValue: 15120 }],
      orders: [],
    },
  }),
  getMarketSnapshot: async () => ({
    label: 'Stage 4 Baseline Market',
    connected: true,
    message: 'stage 4 baseline market ok',
    quotes: [],
  }),
});
const context = createControlPlaneContext(createControlPlaneStore({ namespace }));

test.after(() => {
  rmSync(join(process.cwd(), '.quantpilot-runtime', namespace), { recursive: true, force: true });
  delete process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE;
});

function seedRiskSchedulerMiddleware() {
  const nowIso = new Date().toISOString();
  context.risk.appendRiskEvent({
    id: 'stage4-risk-off',
    title: 'Stage 4 risk-off',
    message: 'live exposure breached the risk fence',
    cycle: 14,
    riskLevel: 'RISK OFF',
    status: 'risk-off',
    level: 'critical',
    source: 'risk-monitor',
    createdAt: nowIso,
    metadata: {
      schedulerTickId: 'stage4-scheduler-drift',
      schedulerPhase: 'INTRADAY',
    },
  });
  context.risk.appendRiskEvent({
    id: 'stage4-compliance',
    title: 'Compliance review pending',
    message: 'policy review is still pending on the risk path',
    cycle: 14,
    riskLevel: 'REVIEW',
    status: 'approval-required',
    level: 'warn',
    source: 'risk-policy',
    createdAt: nowIso,
  });
  context.executionPlans.appendExecutionPlan({
    id: 'stage4-plan',
    workflowRunId: 'stage4-workflow',
    strategyId: 'stage4-strategy',
    strategyName: 'Stage 4 Strategy',
    mode: 'live',
    status: 'blocked',
    approvalState: 'required',
    riskStatus: 'blocked',
    summary: 'Execution is blocked by stage 4 risk posture.',
    capital: 28000,
    orderCount: 1,
    orders: [],
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  context.backtestRuns.appendBacktestRun({
    id: 'stage4-backtest',
    strategyId: 'stage4-strategy',
    strategyName: 'Stage 4 Strategy',
    status: 'needs_review',
    summary: 'Backtest still needs review on the risk path.',
    windowLabel: '2025-01-01 -> 2026-03-01',
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  context.incidents.appendIncident({
    id: 'stage4-risk-incident',
    title: 'Stage 4 risk incident',
    summary: 'Shared risk/scheduler escalation',
    severity: 'critical',
    source: 'risk',
    status: 'open',
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  context.scheduler.recordSchedulerTick({
    id: 'stage4-scheduler-drift',
    worker: 'stage4-worker',
    phase: 'INTRADAY',
    status: 'warn',
    title: 'Intraday scheduler drift',
    message: 'scheduler drift is affecting the risk middleware path',
    createdAt: nowIso,
  });
  context.notifications.appendNotification({
    id: 'stage4-scheduler-note',
    level: 'warn',
    source: 'scheduler',
    title: 'Scheduler warning',
    message: 'stage 4 scheduler warning',
    createdAt: nowIso,
  });
  context.cycles.appendCycleRecord({
    id: 'stage4-cycle',
    cycle: 14,
    mode: 'autopilot',
    riskLevel: 'REVIEW',
    decisionSummary: 'stage 4 cycle drift',
    pendingApprovals: 2,
    brokerConnected: true,
    marketConnected: false,
    createdAt: nowIso,
  });
  context.executionRuntime.appendBrokerAccountSnapshot({
    id: 'stage4-broker-snapshot',
    cycleId: 'stage4-cycle',
    cycle: 14,
    provider: 'alpaca',
    connected: true,
    account: {
      cash: 91000,
      buyingPower: 98000,
      equity: 104500,
    },
    positions: [{ symbol: 'NVDA', qty: 18, avgCost: 812.4, marketValue: 15120 }],
    orders: [],
    createdAt: nowIso,
  });
}

test('stage 4 baseline exposes stable risk and scheduler workbench contracts', async () => {
  seedRiskSchedulerMiddleware();

  const [riskWorkbench, schedulerWorkbench] = await Promise.all([
    invokeGatewayRoute(handler, { path: '/api/risk/workbench?hours=168&limit=8' }),
    invokeGatewayRoute(handler, { path: '/api/scheduler/workbench?hours=168&limit=8' }),
  ]);

  assert.equal(riskWorkbench.statusCode, 200);
  assert.equal(riskWorkbench.json.ok, true);
  assert.equal(typeof riskWorkbench.json.summary.riskOffEvents, 'number');
  assert.equal(Array.isArray(riskWorkbench.json.runbook), true);
  assert.equal(Array.isArray(riskWorkbench.json.reviewQueue.riskEvents), true);
  assert.equal(Array.isArray(riskWorkbench.json.reviewQueue.schedulerTicks), true);
  assert.equal(riskWorkbench.json.linkage.summary.linkedSchedulerTicks >= 1, true);

  assert.equal(schedulerWorkbench.statusCode, 200);
  assert.equal(schedulerWorkbench.json.ok, true);
  assert.equal(typeof schedulerWorkbench.json.summary.cycleAttention, 'number');
  assert.equal(Array.isArray(schedulerWorkbench.json.runbook), true);
  assert.equal(Array.isArray(schedulerWorkbench.json.queue.notifications), true);
  assert.equal(Array.isArray(schedulerWorkbench.json.queue.riskEvents), true);
  assert.equal(schedulerWorkbench.json.linkage.summary.linkedRiskEvents >= 1, true);
});

test('stage 4 baseline exposes stable risk and scheduler action contracts', async () => {
  seedRiskSchedulerMiddleware();

  const [riskAction, schedulerAction] = await Promise.all([
    invokeGatewayRoute(handler, {
      method: 'POST',
      path: '/api/risk/actions',
      body: {
        actionKey: 'release-emergency-brake',
        actor: 'stage4-risk-operator',
        hours: 168,
        limit: 8,
      },
    }),
    invokeGatewayRoute(handler, {
      method: 'POST',
      path: '/api/scheduler/actions',
      body: {
        actionKey: 'align-risk-window',
        actor: 'stage4-scheduler-operator',
        hours: 168,
        limit: 8,
      },
    }),
  ]);

  assert.equal(riskAction.statusCode, 200);
  assert.equal(riskAction.json.ok, true);
  assert.equal(riskAction.json.action.key, 'release-emergency-brake');
  assert.equal(riskAction.json.operatorAction.type, 'risk.policy.release-emergency-brake');
  assert.equal(typeof riskAction.json.riskEvent.id, 'string');
  assert.equal(Array.isArray(riskAction.json.action.linkedIncidentIds), true);
  assert.equal(riskAction.json.workbench.ok, true);

  assert.equal(schedulerAction.statusCode, 200);
  assert.equal(schedulerAction.json.ok, true);
  assert.equal(schedulerAction.json.action.key, 'align-risk-window');
  assert.equal(schedulerAction.json.operatorAction.type, 'scheduler.orchestration.align-risk-window');
  assert.equal(typeof schedulerAction.json.schedulerTick.emitted, 'boolean');
  assert.equal(
    schedulerAction.json.schedulerTick.tick === null || typeof schedulerAction.json.schedulerTick.tick?.id === 'string',
    true,
  );
  assert.equal(Array.isArray(schedulerAction.json.action.touchedIncidentIds), true);
  assert.equal(schedulerAction.json.workbench.ok, true);
});
