import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { invokeGatewayRoute } from '../../api/test/helpers/invoke-gateway.mjs';
import { createTradingState } from '../../api/test/helpers/create-trading-state.mjs';

const namespace = `worker-workflow-e2e-${randomUUID()}`;
process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE = namespace;

const [
  { createGatewayHandler },
  { runWorkflowExecutionTask },
  { runRiskScanTask },
  { executeQueuedWorkflow },
  { createControlPlaneContext },
  { createControlPlaneStore },
  { createControlPlaneRuntime },
] = await Promise.all([
  import('../../api/src/gateways/alpaca.mjs'),
  import('../src/tasks/workflow-execution-task.mjs'),
  import('../src/tasks/risk-scan-task.mjs'),
  import('../../../packages/task-workflow-engine/src/index.mjs'),
  import('../../../packages/control-plane-store/src/context.mjs'),
  import('../../../packages/control-plane-store/src/store.mjs'),
  import('../../../packages/control-plane-runtime/src/index.mjs'),
]);

const workerConfig = {
  name: 'worker-e2e-test',
  workflowBatchSize: 10,
  riskScanBatchSize: 10,
};

const fakeBrokerHealth = {
  adapter: 'simulated',
  connected: true,
  customBrokerConfigured: false,
  alpacaConfigured: false,
};

const fakeBrokerExecution = {
  connected: true,
  message: 'worker e2e broker execution ok',
  submittedOrders: [],
  rejectedOrders: [],
  snapshot: {
    connected: true,
    message: 'worker e2e broker snapshot ok',
    account: null,
    positions: [],
    orders: [],
  },
};

const fakeMarketSnapshot = {
  label: 'Worker E2E Market',
  connected: true,
  message: 'worker e2e market snapshot ok',
  quotes: [],
};

const context = createControlPlaneContext(createControlPlaneStore({ namespace }));
const runtime = createControlPlaneRuntime(context);
const handler = createGatewayHandler({
  getBrokerHealth: async () => fakeBrokerHealth,
  executeBrokerCycle: async () => fakeBrokerExecution,
  getMarketSnapshot: async () => fakeMarketSnapshot,
});

function createWorkerContext() {
  return {
    ...runtime,
    getOperatorName: () => 'Workflow Worker E2E',
    getBrokerHealth: async () => fakeBrokerHealth,
    executeBrokerCycle: async () => fakeBrokerExecution,
    getMarketSnapshot: async () => fakeMarketSnapshot,
    queueRiskScan: (payload) => runtime.enqueueRiskScan(payload),
  };
}

test.after(() => {
  rmSync(join(process.cwd(), '.quantpilot-runtime', namespace), { recursive: true, force: true });
  delete process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE;
});

test('queued state workflow executes end-to-end through worker and persists downstream risk scan results', async () => {
  const queued = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/task-orchestrator/state/queue',
    body: {
      state: createTradingState(),
    },
  });

  assert.equal(queued.statusCode, 200);
  assert.equal(queued.json.workflow.workflowId, 'task-orchestrator.state-run');
  assert.equal(queued.json.workflow.status, 'queued');

  const execution = await runWorkflowExecutionTask(workerConfig, {
    claimQueuedWorkflows: (options) => runtime.claimQueuedWorkflowRuns({
      ...options,
      now: '2026-03-10T09:10:00.000Z',
    }),
    executeWorkflow: executeQueuedWorkflow,
    context: createWorkerContext(),
  });

  assert.equal(execution.kind, 'workflow-execution');
  assert.equal(execution.claimedCount, 1);
  assert.equal(execution.executions[0].ok, true);

  const workflows = context.workflows.listWorkflowRuns();
  const stateWorkflow = workflows.find((item) => item.id === queued.json.workflow.id);
  const cycleWorkflow = workflows.find((item) => item.workflowId === 'task-orchestrator.cycle-run');

  assert.equal(stateWorkflow.status, 'completed');
  assert.equal(cycleWorkflow.status, 'completed');
  assert.equal(context.cycles.listCycleRecords().length, 1);
  assert.equal(context.risk.listRiskScanJobs().length, 1);

  const riskDispatch = await runRiskScanTask(workerConfig, {
    flushQueuedRiskScans: (options) => runtime.dispatchPendingRiskScans(options),
  });

  assert.equal(riskDispatch.kind, 'risk-scan');
  assert.equal(riskDispatch.dispatchedCount, 1);
  assert.equal(context.risk.listRiskEvents().length, 1);
  assert.equal(context.risk.listRiskEvents()[0].status, 'healthy');
});
