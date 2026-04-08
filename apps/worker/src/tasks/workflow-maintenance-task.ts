import { controlPlaneRuntime } from '../../../../packages/control-plane-runtime/src/index.js';

export async function runWorkflowMaintenanceTask(config, dependencies = {}) {
  const releaseWorkflows = dependencies.releaseScheduledWorkflows || controlPlaneRuntime.releaseScheduledWorkflowRuns;
  const result = releaseWorkflows({
    worker: config.name,
    limit: config.workflowBatchSize,
  });
  return {
    worker: config.name,
    kind: 'workflow-maintenance',
    timestamp: new Date().toISOString(),
    summary: result.releasedCount
      ? `Re-queued ${result.releasedCount} scheduled workflow runs.`
      : 'No scheduled workflow runs were ready.',
    releasedCount: result.releasedCount,
  };
}
