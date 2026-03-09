import { controlPlaneRuntime } from '../../../../packages/control-plane-runtime/src/index.mjs';
import { executeQueuedWorkflow } from '../../../../packages/task-workflow-engine/src/index.mjs';

function createWorkerExecutionContext() {
  return {
    ...controlPlaneRuntime,
    getOperatorName: () => 'Workflow Worker',
    getBrokerHealth: async () => ({
      adapter: 'simulated',
      connected: false,
      customBrokerConfigured: false,
      alpacaConfigured: false,
    }),
    executeBrokerCycle: async () => ({
      connected: false,
      message: 'workflow worker is running in offline execution mode',
      submittedOrders: [],
      rejectedOrders: [],
      snapshot: {
        connected: false,
        message: 'workflow worker offline snapshot',
        orders: [],
        positions: [],
        account: null,
      },
    }),
    getMarketSnapshot: async () => ({
      label: 'Worker Simulated Market',
      connected: true,
      message: 'workflow worker simulated market snapshot',
      quotes: [],
    }),
    queueRiskScan: (payload) => controlPlaneRuntime.enqueueRiskScan(payload),
  };
}

export async function runWorkflowExecutionTask(config, dependencies = {}) {
  const claimQueuedWorkflows = dependencies.claimQueuedWorkflows || controlPlaneRuntime.claimQueuedWorkflowRuns;
  const executeWorkflow = dependencies.executeWorkflow || executeQueuedWorkflow;
  const context = dependencies.context || createWorkerExecutionContext();
  const claimResult = claimQueuedWorkflows({
    worker: config.name,
    limit: config.workflowBatchSize,
  });

  const executions = [];
  for (const workflow of claimResult.workflows) {
    executions.push(await executeWorkflow(workflow, context));
  }

  return {
    worker: config.name,
    kind: 'workflow-execution',
    timestamp: new Date().toISOString(),
    summary: claimResult.claimedCount
      ? `Executed ${claimResult.claimedCount} queued workflow runs.`
      : 'No queued workflow runs were ready.',
    claimedCount: claimResult.claimedCount,
    executions,
  };
}
