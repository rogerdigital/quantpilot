import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';

export function listWorkflows(limit = 50) {
  return controlPlaneRuntime.listWorkflowRuns(limit);
}

export function getWorkflow(workflowRunId) {
  return controlPlaneRuntime.getWorkflowRun(workflowRunId);
}

export function startWorkflow(payload) {
  return controlPlaneRuntime.startWorkflowRun(payload);
}

export function completeWorkflow(workflowRunId, patch = {}) {
  return controlPlaneRuntime.completeWorkflowRun(workflowRunId, patch);
}

export function failWorkflow(workflowRunId, error, patch = {}) {
  return controlPlaneRuntime.failWorkflowRun(workflowRunId, error, patch);
}

export function queueWorkflow(payload) {
  return controlPlaneRuntime.enqueueWorkflowRun(payload);
}

export function resumeWorkflow(workflowRunId, patch = {}) {
  return controlPlaneRuntime.resumeWorkflowRun(workflowRunId, patch);
}

export function cancelWorkflow(workflowRunId, patch = {}) {
  return controlPlaneRuntime.cancelWorkflowRun(workflowRunId, patch);
}

export function releaseScheduledWorkflows(options = {}) {
  return controlPlaneRuntime.releaseScheduledWorkflowRuns(options);
}
