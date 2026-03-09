import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.mjs';

export function listCycles(limit = 30) {
  return controlPlaneRuntime.listCycleRecords(limit);
}

export function recordCycleRun(payload) {
  return controlPlaneRuntime.recordCycleRun(payload);
}

export function recordAction(payload) {
  return controlPlaneRuntime.recordOperatorAction(payload);
}

export function listActions(limit = 50) {
  return controlPlaneRuntime.listOperatorActions(limit);
}

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
