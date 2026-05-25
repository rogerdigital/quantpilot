import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';

export function listWorkflows(limit = 50) {
  return controlPlaneRuntime.listWorkflowRuns(limit);
}

export function getWorkflow(workflowRunId: string) {
  return controlPlaneRuntime.getWorkflowRun(workflowRunId);
}

export function startWorkflow(payload: any) {
  return controlPlaneRuntime.startWorkflowRun(payload);
}

export function completeWorkflow(workflowRunId: string, patch: Record<string, any> = {}) {
  return controlPlaneRuntime.completeWorkflowRun(workflowRunId, patch);
}

export function failWorkflow(workflowRunId: string, error: any, patch: Record<string, any> = {}) {
  return controlPlaneRuntime.failWorkflowRun(workflowRunId, error, patch);
}

export function queueWorkflow(payload: any) {
  return controlPlaneRuntime.enqueueWorkflowRun(payload);
}

export function resumeWorkflow(workflowRunId: string, patch: Record<string, any> = {}) {
  return controlPlaneRuntime.resumeWorkflowRun(workflowRunId, patch);
}

export function cancelWorkflow(workflowRunId: string, patch: Record<string, any> = {}) {
  return controlPlaneRuntime.cancelWorkflowRun(workflowRunId, patch);
}

export function releaseScheduledWorkflows(options: Record<string, any> = {}) {
  return controlPlaneRuntime.releaseScheduledWorkflowRuns(options);
}
