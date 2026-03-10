import { queueWorkflow } from '../../../modules/task-orchestrator/service.mjs';
import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';

const ALLOWED_AGENT_REQUEST_TYPES = new Set([
  'prepare_execution_plan',
  'explain_risk',
  'review_backtest',
]);

export function listAgentActionRequests(limit = 50) {
  return {
    ok: true,
    requests: controlPlaneRuntime.listAgentActionRequests(limit),
  };
}

export function recordAgentActionRequest(payload) {
  return controlPlaneRuntime.recordAgentActionRequest(payload);
}

export function queueAgentActionRequest(payload = {}) {
  if (!ALLOWED_AGENT_REQUEST_TYPES.has(payload.requestType)) {
    return {
      ok: false,
      message: `Agent request type ${payload.requestType || 'unknown'} is not allowed.`,
    };
  }

  const workflow = queueWorkflow({
    workflowId: 'task-orchestrator.agent-action-request',
    workflowType: 'task-orchestrator',
    actor: payload.requestedBy || 'agent',
    trigger: 'agent',
    payload: {
      requestType: payload.requestType,
      targetId: payload.targetId || '',
      summary: payload.summary || '',
      rationale: payload.rationale || '',
      requestedBy: payload.requestedBy || 'agent',
    },
    maxAttempts: Number(payload.maxAttempts || 2),
  });

  return {
    ok: true,
    workflow,
  };
}

export function approveAgentActionRequest(requestId, payload = {}) {
  const request = controlPlaneRuntime.getAgentActionRequest(requestId);
  if (!request) {
    return { ok: false, message: 'agent action request not found' };
  }
  if (request.status !== 'pending_review') {
    return { ok: false, message: 'agent action request is not waiting for approval' };
  }

  let downstreamWorkflow = null;
  if (request.requestType === 'prepare_execution_plan') {
    downstreamWorkflow = queueWorkflow({
      workflowId: 'task-orchestrator.strategy-execution',
      workflowType: 'task-orchestrator',
      actor: payload.approvedBy || 'operator',
      trigger: 'agent-approval',
      payload: {
        strategyId: request.targetId,
        mode: payload.mode || 'paper',
        capital: Number(payload.capital || 100000),
        requestedBy: request.requestedBy,
      },
      maxAttempts: 3,
    });
  }

  const updated = controlPlaneRuntime.updateAgentActionRequest(requestId, {
    status: 'approved',
    approvalState: 'approved',
    metadata: {
      approvedBy: payload.approvedBy || 'operator',
      downstreamWorkflowId: downstreamWorkflow?.id || '',
    },
  });

  controlPlaneRuntime.recordOperatorAction({
    type: 'approve-agent-request',
    actor: payload.approvedBy || 'operator',
    title: `Approved agent request ${request.requestType}`,
    detail: `Agent request ${request.id} was approved${downstreamWorkflow ? ' and downstream workflow was queued' : ''}.`,
    level: 'info',
  });

  return {
    ok: true,
    request: updated,
    workflow: downstreamWorkflow,
  };
}

export function rejectAgentActionRequest(requestId, payload = {}) {
  const request = controlPlaneRuntime.getAgentActionRequest(requestId);
  if (!request) {
    return { ok: false, message: 'agent action request not found' };
  }
  if (request.status !== 'pending_review') {
    return { ok: false, message: 'agent action request is not waiting for approval' };
  }

  const updated = controlPlaneRuntime.updateAgentActionRequest(requestId, {
    status: 'rejected',
    approvalState: 'rejected',
    metadata: {
      rejectedBy: payload.rejectedBy || 'operator',
      rejectionReason: payload.reason || '',
    },
  });

  controlPlaneRuntime.recordOperatorAction({
    type: 'reject-agent-request',
    actor: payload.rejectedBy || 'operator',
    title: `Rejected agent request ${request.requestType}`,
    detail: payload.reason || `Agent request ${request.id} was rejected.`,
    level: 'warn',
  });

  return {
    ok: true,
    request: updated,
  };
}
