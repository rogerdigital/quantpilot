import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { invokeGatewayRoute } from './helpers/invoke-gateway.js';

const namespace = `stage-3-baseline-test-${randomUUID()}`;
process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE = namespace;

const [{ createGatewayHandler }, { createControlPlaneContext }, { createControlPlaneStore }] = await Promise.all([
  import('../src/gateways/alpaca.js'),
  import('../../../packages/control-plane-store/src/context.js'),
  import('../../../packages/control-plane-store/src/store.js'),
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
    message: 'stage 3 baseline broker ok',
    submittedOrders: [],
    rejectedOrders: [],
    snapshot: {
      connected: true,
      message: 'stage 3 baseline snapshot ok',
      account: {
        cash: 118000,
        buyingPower: 130000,
        equity: 121500,
      },
      positions: [{ symbol: 'AAPL', qty: 10, avgCost: 189.5 }],
      orders: [{ id: 'stage3-broker-order-1', symbol: 'AAPL', side: 'BUY', qty: 10, filledQty: 10, status: 'filled' }],
    },
  }),
  getMarketSnapshot: async () => ({
    label: 'Stage 3 Baseline Market',
    connected: true,
    message: 'stage 3 baseline market ok',
    quotes: [],
  }),
});
const context = createControlPlaneContext(createControlPlaneStore({ namespace }));

test.after(() => {
  rmSync(join(process.cwd(), '.quantpilot-runtime', namespace), { recursive: true, force: true });
  delete process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE;
});

function seedExecutionChain(suffix) {
  const planId = `stage3-plan-${suffix}`;
  const runId = `stage3-run-${suffix}`;
  const workflowId = `stage3-workflow-${suffix}`;
  const handoffId = `stage3-handoff-${suffix}`;
  const orderId = `stage3-order-1-${suffix}`;
  const brokerOrderId = `stage3-broker-order-1-${suffix}`;
  const runtimeId = `stage3-runtime-${suffix}`;
  const cycleId = `stage3-cycle-${suffix}`;
  const snapshotId = `stage3-snapshot-${suffix}`;
  const incidentId = `stage3-incident-${suffix}`;
  const createdAt = '2026-03-22T09:00:00.000Z';
  context.executionPlans.appendExecutionPlan({
    id: planId,
    workflowRunId: workflowId,
    handoffId,
    executionRunId: runId,
    strategyId: 'stage3-strategy',
    strategyName: 'Stage 3 Execution Strategy',
    mode: 'paper',
    status: 'active',
    lifecycleStatus: 'partial_fill',
    approvalState: 'approved',
    riskStatus: 'approved',
    summary: 'Stage 3 execution plan is active.',
    capital: 120000,
    orderCount: 1,
    owner: 'execution-desk',
    orders: [{ symbol: 'AAPL', side: 'BUY', qty: 10, weight: 1, rationale: 'baseline execution route' }],
    metadata: {},
    createdAt,
    updatedAt: '2026-03-22T09:08:00.000Z',
  });
  context.executionRuns.appendExecutionRun({
    id: runId,
    executionPlanId: planId,
    workflowRunId: workflowId,
    strategyId: 'stage3-strategy',
    strategyName: 'Stage 3 Execution Strategy',
    mode: 'paper',
    lifecycleStatus: 'partial_fill',
    submittedOrderCount: 1,
    filledOrderCount: 1,
    rejectedOrderCount: 0,
    summary: 'Execution run is waiting for reconciliation and incident triage.',
    owner: 'execution-desk',
    orderCount: 1,
    metadata: {},
    createdAt,
    updatedAt: '2026-03-22T09:08:00.000Z',
    completedAt: '',
  });
  context.executionRuns.appendExecutionOrderStates([{
    id: orderId,
    executionPlanId: planId,
    executionRunId: runId,
    symbol: 'AAPL',
    side: 'BUY',
    qty: 10,
    weight: 1,
    lifecycleStatus: 'partial_fill',
    brokerOrderId,
    avgFillPrice: 189.5,
    filledQty: 10,
    summary: 'Broker partially filled the order and left drift for reconciliation.',
    submittedAt: createdAt,
    acknowledgedAt: '2026-03-22T09:02:00.000Z',
    filledAt: '2026-03-22T09:06:00.000Z',
    metadata: {},
    createdAt,
    updatedAt: '2026-03-22T09:06:00.000Z',
  }]);
  context.executionRuntime.appendExecutionRuntimeEvent({
    id: runtimeId,
    cycleId,
    cycle: 1,
    executionPlanId: planId,
    executionRunId: runId,
    brokerAdapter: 'alpaca',
    brokerConnected: true,
    marketConnected: true,
    mode: 'paper',
    submittedOrderCount: 1,
    rejectedOrderCount: 0,
    openOrderCount: 0,
    positionCount: 1,
    cash: 118000,
    buyingPower: 130000,
    equity: 121500,
    message: 'Runtime reflects partial fill posture.',
    metadata: {},
    createdAt: '2026-03-22T09:07:00.000Z',
  });
  context.executionRuntime.appendBrokerAccountSnapshot({
    id: snapshotId,
    cycleId,
    cycle: 1,
    executionPlanId: planId,
    executionRunId: runId,
    provider: 'alpaca',
    connected: true,
    message: 'Stage 3 baseline snapshot.',
    account: {
      cash: 117250,
      buyingPower: 128500,
      equity: 120900,
    },
    orders: [{ id: brokerOrderId, symbol: 'AAPL', side: 'BUY', qty: 10, filledQty: 10, status: 'filled' }],
    positions: [{ symbol: 'AAPL', qty: 9, avgCost: 189.5 }],
    createdAt: '2026-03-22T09:09:00.000Z',
  });
  context.executionRuntime.appendBrokerExecutionEvent({
    id: `stage3-event-ack-${suffix}`,
    executionPlanId: planId,
    executionRunId: runId,
    source: 'broker-webhook',
    eventType: 'acknowledged',
    symbol: 'AAPL',
    brokerOrderId,
    status: 'processed',
    message: 'Broker acknowledged the execution order.',
    createdAt: '2026-03-22T09:02:00.000Z',
  });
  context.executionRuntime.appendBrokerExecutionEvent({
    id: `stage3-event-fill-${suffix}`,
    executionPlanId: planId,
    executionRunId: runId,
    source: 'broker-webhook',
    eventType: 'partial_fill',
    symbol: 'AAPL',
    brokerOrderId,
    status: 'processed',
    filledQty: 10,
    avgFillPrice: 189.5,
    message: 'Broker reported a fill that now needs reconciliation.',
    createdAt: '2026-03-22T09:06:00.000Z',
  });
  context.incidents.appendIncident({
    id: incidentId,
    source: 'execution',
    severity: 'critical',
    status: 'investigating',
    title: 'Execution reconciliation drift',
    summary: 'Execution desk is reconciling position drift after broker fill.',
    owner: 'execution-desk',
    acknowledgedAt: '2026-03-22T09:10:00.000Z',
    links: [
      { entityType: 'execution-plan', entityId: planId },
      { entityType: 'execution-run', entityId: runId },
    ],
    createdAt: '2026-03-22T09:10:00.000Z',
    updatedAt: '2026-03-22T09:12:00.000Z',
  });
  context.incidents.appendIncidentNote(incidentId, {
    id: `stage3-note-${suffix}`,
    author: 'execution-desk',
    body: 'Execution desk has started triage from the execution console.',
    createdAt: '2026-03-22T09:12:00.000Z',
  });

  return {
    planId,
    incidentId,
  };
}

test('stage 3 baseline exposes execution workbench queues, linked incidents, and broker event history', async () => {
  const { planId, incidentId } = seedExecutionChain('a');

  const [workbench, ledger, brokerEvents] = await Promise.all([
    invokeGatewayRoute(handler, { path: '/api/execution/workbench' }),
    invokeGatewayRoute(handler, { path: '/api/execution/ledger' }),
    invokeGatewayRoute(handler, { path: `/api/execution/broker-events?executionPlanId=${planId}&limit=10` }),
  ]);

  assert.equal(workbench.statusCode, 200);
  assert.equal(workbench.json.ok, true);
  assert.equal(typeof workbench.json.summary.compensationPlans, 'number');
  assert.equal(typeof workbench.json.summary.incidentLinkedPlans, 'number');
  assert.equal(Array.isArray(workbench.json.operations.queues.incidents), true);
  assert.equal(Array.isArray(workbench.json.operations.nextActions), true);
  assert.equal(workbench.json.entries.some((entry) => entry.plan.id === planId), true);

  assert.equal(ledger.statusCode, 200);
  assert.equal(ledger.json.ok, true);
  assert.equal(ledger.json.entries.some((entry) => entry.plan.id === planId), true);

  assert.equal(brokerEvents.statusCode, 200);
  assert.equal(brokerEvents.json.ok, true);
  assert.equal(Array.isArray(brokerEvents.json.events), true);
  assert.equal(brokerEvents.json.events.some((event) => event.executionPlanId === planId && event.eventType === 'partial_fill'), true);
});

test('stage 3 baseline exposes execution detail, compensation and incident triage contracts', async () => {
  const { planId, incidentId } = seedExecutionChain('b');

  const detail = await invokeGatewayRoute(handler, {
    path: `/api/execution/plans/${planId}`,
  });

  assert.equal(detail.statusCode, 200);
  assert.equal(detail.json.ok, true);
  assert.equal(detail.json.plan.id, planId);
  assert.equal(Array.isArray(detail.json.brokerEvents), true);
  assert.equal(Array.isArray(detail.json.linkedIncidents), true);
  assert.equal(typeof detail.json.reconciliation.accountStatus, 'string');
  assert.equal(typeof detail.json.compensation.mode, 'string');
  assert.equal(typeof detail.json.recovery.recommendedAction, 'string');

  const bulk = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/incidents/bulk',
    body: {
      incidentIds: [incidentId],
      owner: 'ops-stage3',
      status: 'mitigated',
      actor: 'execution-desk',
      note: 'Bulk triage synced from the execution console baseline.',
    },
  });

  assert.equal(bulk.statusCode, 200);
  assert.equal(bulk.json.ok, true);
  assert.equal(Array.isArray(bulk.json.updatedIds), true);
  assert.equal(bulk.json.updatedIds.includes(incidentId), true);
  assert.equal(bulk.json.notesAdded, 1);

  const incident = await invokeGatewayRoute(handler, {
    path: `/api/incidents/${incidentId}`,
  });

  assert.equal(incident.statusCode, 200);
  assert.equal(incident.json.ok, true);
  assert.equal(incident.json.incident.owner, 'ops-stage3');
  assert.equal(incident.json.incident.status, 'mitigated');
  assert.equal(incident.json.notes.some((note) => note.body.includes('execution console baseline')), true);
  assert.equal(typeof incident.json.operations.nextAction.key, 'string');
});
