import { queueWorkflow } from '../../../control-plane/task-orchestrator/services/workflow-service.mjs';
import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';
import { listBacktestRuns } from '../../backtest/services/runs-service.mjs';
import { listExecutionPlans } from '../../execution/services/query-service.mjs';
import { listRiskEvents } from '../../risk/services/feed-service.mjs';
import { listStrategyCatalog } from '../../strategy/services/catalog-service.mjs';

const ALLOWED_AGENT_REQUEST_TYPES = new Set([
  'prepare_execution_plan',
  'explain_risk',
  'review_backtest',
  'agent_trim',
  'agent_exit',
  'agent_cancel',
  'agent_risk_reduce',
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
      metadata: payload.metadata || {},
    },
    maxAttempts: Number(payload.maxAttempts || 2),
  });

  return {
    ok: true,
    workflow,
  };
}

function inferActionRequestType(intent = {}) {
  if (intent.kind === 'request_execution_prep') return 'prepare_execution_plan';
  if (intent.kind === 'request_backtest_review') return 'review_backtest';
  if (intent.kind === 'request_risk_explanation') return 'explain_risk';
  return '';
}

function resolveHandoffTarget(intent = {}, session = {}) {
  if (intent.targetId) {
    return {
      ok: true,
      targetId: intent.targetId,
      targetType: intent.targetType || 'unknown',
    };
  }

  if (intent.kind === 'request_execution_prep') {
    const strategy = listStrategyCatalog().strategies[0] || null;
    if (strategy) {
      return {
        ok: true,
        targetId: strategy.id,
        targetType: 'strategy',
      };
    }
  }

  if (intent.kind === 'request_backtest_review') {
    const run = listBacktestRuns().runs.find((item) => item.status === 'needs_review')
      || listBacktestRuns().runs[0]
      || null;
    if (run) {
      return {
        ok: true,
        targetId: run.id,
        targetType: 'backtest_run',
      };
    }
  }

  if (intent.kind === 'request_risk_explanation') {
    const riskEvent = listRiskEvents(20).find((item) => item.status === 'risk-off' || item.status === 'attention')
      || listRiskEvents(20)[0]
      || null;
    if (riskEvent) {
      return {
        ok: true,
        targetId: riskEvent.id,
        targetType: 'risk_event',
      };
    }
    const plan = listExecutionPlans(20)[0] || null;
    if (plan) {
      return {
        ok: true,
        targetId: plan.id,
        targetType: 'execution_plan',
      };
    }
  }

  return {
    ok: false,
    message: `Session ${session.id || 'unknown'} does not currently have a resolvable action-request target.`,
  };
}

export function createSessionActionRequest(sessionId, payload = {}) {
  const session = controlPlaneRuntime.getAgentSession(sessionId);
  if (!session) {
    return {
      ok: false,
      error: 'agent_session_not_found',
      message: `Unknown agent session: ${sessionId || 'missing sessionId'}`,
    };
  }

  const plan = session.latestPlanId ? controlPlaneRuntime.getAgentPlan(session.latestPlanId) : null;
  const run = session.latestAnalysisRunId ? controlPlaneRuntime.getAgentAnalysisRun(session.latestAnalysisRunId) : null;
  if (!plan || !run) {
    return {
      ok: false,
      error: 'missing_handoff_context',
      message: 'A controlled action handoff requires a completed plan and analysis run.',
    };
  }

  if (plan.status !== 'completed' || run.status !== 'completed') {
    return {
      ok: false,
      error: 'analysis_not_ready',
      message: 'Run and complete the latest analysis before creating a controlled action request.',
    };
  }

  const requestType = inferActionRequestType(session.latestIntent);
  if (!requestType) {
    return {
      ok: false,
      error: 'unsupported_handoff',
      message: `Intent ${session.latestIntent?.kind || 'unknown'} does not currently support controlled action handoff.`,
    };
  }

  const existingRequest = session.latestActionRequestId
    ? controlPlaneRuntime.getAgentActionRequest(session.latestActionRequestId)
    : null;
  if (existingRequest && ['pending_review', 'approved'].includes(existingRequest.status)) {
    return {
      ok: false,
      error: 'duplicate_handoff',
      message: `A ${existingRequest.status} action request is already linked to this session.`,
      request: existingRequest,
    };
  }

  const target = resolveHandoffTarget(session.latestIntent, session);
  if (!target.ok) {
    return {
      ok: false,
      error: 'missing_handoff_target',
      message: target.message,
    };
  }

  const summary = payload.summary
    || run.explanation?.recommendedNextStep
    || run.explanation?.thesis
    || run.summary
    || plan.summary;
  const rationale = payload.rationale
    || [
      run.explanation?.thesis || '',
      ...(Array.isArray(run.explanation?.rationale) ? run.explanation.rationale : []),
    ]
      .filter(Boolean)
      .join(' ');

  const workflowResult = queueAgentActionRequest({
    requestType,
    targetId: target.targetId,
    summary,
    rationale,
    requestedBy: payload.requestedBy || session.requestedBy || 'agent',
    maxAttempts: payload.maxAttempts,
    metadata: {
      agentSessionId: session.id,
      agentPlanId: plan.id,
      agentAnalysisRunId: run.id,
      intentKind: session.latestIntent?.kind || '',
      targetType: target.targetType,
      requestedMode: session.latestIntent?.requestedMode || '',
      source: 'agent-session-handoff',
    },
  });

  if (!workflowResult.ok) {
    return workflowResult;
  }

  const updatedSession = controlPlaneRuntime.updateAgentSession(session.id, {
    status: 'waiting_approval',
    metadata: {
      pendingActionWorkflowId: workflowResult.workflow.id,
      pendingActionRequestType: requestType,
      pendingActionRequestedAt: new Date().toISOString(),
    },
  });
  controlPlaneRuntime.recordAgentSessionMessage({
    sessionId: session.id,
    role: 'assistant',
    kind: 'approval_note',
    title: 'Approval requested',
    body: summary,
    requestedBy: payload.requestedBy || session.requestedBy || 'agent',
    metadata: {
      requestType,
      targetId: target.targetId,
      targetType: target.targetType,
      workflowRunId: workflowResult.workflow.id,
    },
  });

  return {
    ok: true,
    session: updatedSession || session,
    workflow: workflowResult.workflow,
    handoff: {
      requestType,
      targetId: target.targetId,
      targetType: target.targetType,
      summary,
      rationale,
    },
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

  const AGENT_DIRECT_ACTION_TYPES = ['agent_trim', 'agent_exit', 'agent_cancel', 'agent_risk_reduce'];
  if (AGENT_DIRECT_ACTION_TYPES.includes(request.requestType)) {
    controlPlaneRuntime.recordOperatorAction({
      type: 'agent-action-approved',
      actor: payload.approvedBy || 'operator',
      title: `Approved agent ${request.requestType}`,
      detail: `Agent ${request.requestType} approved. Downstream execution pending P2.`,
      level: 'info',
      metadata: {
        agentActionRequestId: request.id,
        requestType: request.requestType,
        targetId: request.targetId,
      },
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

  if (request.metadata?.agentSessionId) {
    controlPlaneRuntime.updateAgentSession(request.metadata.agentSessionId, {
      status: 'completed',
      latestActionRequestId: request.id,
      metadata: {
        actionRequestApprovedAt: new Date().toISOString(),
        actionRequestApprovedBy: payload.approvedBy || 'operator',
      },
    });
    controlPlaneRuntime.recordAgentSessionMessage({
      sessionId: request.metadata.agentSessionId,
      role: 'system',
      kind: 'approval_note',
      title: 'Action request approved',
      body: `Request ${request.requestType} was approved by ${payload.approvedBy || 'operator'}.`,
      requestedBy: payload.approvedBy || 'operator',
      metadata: {
        agentActionRequestId: request.id,
        downstreamWorkflowId: downstreamWorkflow?.id || '',
      },
    });
  }

  controlPlaneRuntime.recordOperatorAction({
    type: 'approve-agent-request',
    actor: payload.approvedBy || 'operator',
    title: `Approved agent request ${request.requestType}`,
    detail: `Agent request ${request.id} was approved${downstreamWorkflow ? ' and downstream workflow was queued' : ''}.`,
    level: 'info',
    metadata: {
      agentActionRequestId: request.id,
      requestType: request.requestType,
      targetId: request.targetId,
      downstreamWorkflowId: downstreamWorkflow?.id || '',
    },
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

  if (request.metadata?.agentSessionId) {
    controlPlaneRuntime.updateAgentSession(request.metadata.agentSessionId, {
      status: 'completed',
      latestActionRequestId: request.id,
      metadata: {
        actionRequestRejectedAt: new Date().toISOString(),
        actionRequestRejectedBy: payload.rejectedBy || 'operator',
        actionRequestRejectionReason: payload.reason || '',
      },
    });
    controlPlaneRuntime.recordAgentSessionMessage({
      sessionId: request.metadata.agentSessionId,
      role: 'system',
      kind: 'approval_note',
      title: 'Action request rejected',
      body: payload.reason || `Request ${request.requestType} was rejected by ${payload.rejectedBy || 'operator'}.`,
      requestedBy: payload.rejectedBy || 'operator',
      metadata: {
        agentActionRequestId: request.id,
      },
    });
  }

  controlPlaneRuntime.recordOperatorAction({
    type: 'reject-agent-request',
    actor: payload.rejectedBy || 'operator',
    title: `Rejected agent request ${request.requestType}`,
    detail: payload.reason || `Agent request ${request.id} was rejected.`,
    level: 'warn',
    metadata: {
      agentActionRequestId: request.id,
      requestType: request.requestType,
      targetId: request.targetId,
    },
  });

  return {
    ok: true,
    request: updated,
  };
}
