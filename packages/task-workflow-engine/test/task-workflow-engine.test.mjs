import test from 'node:test';
import assert from 'node:assert/strict';
import { createControlPlaneContext } from '../../control-plane-store/src/context.mjs';
import { createMemoryStore } from '../../control-plane-store/test/helpers/memory-store.mjs';
import { createControlPlaneRuntime } from '../../control-plane-runtime/src/index.mjs';
import { createTradingState } from '../../../apps/api/test/helpers/create-trading-state.mjs';
import { executeCycleWorkflow, executeQueuedWorkflow, executeStateWorkflow } from '../src/index.mjs';

function createEngineContext() {
  const runtime = createControlPlaneRuntime(createControlPlaneContext(createMemoryStore()));
  return {
    ...runtime,
    getOperatorName: () => 'Workflow Test Operator',
    queueRiskScan: (payload) => runtime.enqueueRiskScan(payload),
    getBrokerHealth: async () => ({
      adapter: 'simulated',
      connected: true,
      customBrokerConfigured: false,
      alpacaConfigured: false,
    }),
    executeBrokerCycle: async () => ({
      connected: true,
      message: 'engine test broker ok',
      submittedOrders: [],
      rejectedOrders: [],
      snapshot: {
        connected: true,
        message: 'engine test broker state ok',
        orders: [],
        positions: [],
        account: { cash: 100000, buyingPower: 100000, equity: 100000 },
      },
    }),
    getMarketSnapshot: async () => ({
      label: 'Workflow Test Market',
      connected: true,
      message: 'workflow test market ok',
      quotes: [],
    }),
  };
}

test('cycle workflow execution persists a completed workflow', async () => {
  const context = createEngineContext();
  const result = await executeCycleWorkflow({
    cycle: 3,
    mode: 'autopilot',
    riskLevel: 'NORMAL',
    decisionSummary: 'engine cycle',
    marketClock: '2026-03-10 10:00:00',
    pendingApprovals: 0,
    liveIntentCount: 0,
    brokerConnected: true,
    marketConnected: true,
    liveTradeEnabled: false,
    pendingLiveIntents: [],
  }, context);

  assert.equal(result.ok, true);
  assert.equal(result.workflow.status, 'completed');
  assert.equal(context.listWorkflowRuns()[0].workflowId, 'task-orchestrator.cycle-run');
});

test('state workflow execution persists a completed workflow and nested cycle run', async () => {
  const context = createEngineContext();
  const result = await executeStateWorkflow(createTradingState(), context);

  assert.equal(result.ok, true);
  assert.equal(result.workflow.workflowId, 'task-orchestrator.state-run');
  assert.equal(context.listWorkflowRuns().some((item) => item.workflowId === 'task-orchestrator.cycle-run'), true);
});

test('queued workflow dispatcher executes manual-review workflows', async () => {
  const context = createEngineContext();
  const queued = context.enqueueWorkflowRun({
    workflowId: 'task-orchestrator.manual-review',
    status: 'queued',
  });
  const claimed = context.claimQueuedWorkflowRuns({ worker: 'engine-worker' });

  const result = await executeQueuedWorkflow(claimed.workflows[0], context);

  assert.equal(queued.workflowId, 'task-orchestrator.manual-review');
  assert.equal(result.workflow.status, 'completed');
});
