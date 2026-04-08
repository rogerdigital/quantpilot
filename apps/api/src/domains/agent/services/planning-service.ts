import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';
import { parseAgentIntent } from './intent-service.js';

function buildPlanSteps(intent = {}) {
  switch (intent.kind) {
    case 'request_backtest_review':
      return [
        {
          kind: 'read',
          title: 'Load backtest center summary',
          status: 'pending',
          toolName: 'backtest.summary.get',
          description: 'Read the research summary before inspecting individual runs.',
          outputSummary: '',
          metadata: {
            domain: 'backtest',
          },
        },
        {
          kind: 'read',
          title: 'Load recent backtest runs',
          status: 'pending',
          toolName: 'backtest.runs.list',
          description: 'Inspect recent run outcomes and review posture.',
          outputSummary: '',
          metadata: {
            domain: 'backtest',
          },
        },
        {
          kind: 'explain',
          title: 'Summarize research posture',
          status: 'pending',
          toolName: '',
          description: 'Explain what is healthy, blocked, or needs operator review.',
          outputSummary: '',
          metadata: {
            deliverable: 'backtest-review-summary',
          },
        },
      ];
    case 'request_execution_prep':
      return [
        {
          kind: 'read',
          title: 'Load strategy catalog context',
          status: 'pending',
          toolName: 'strategy.catalog.list',
          description: 'Read lifecycle stage, readiness, and research posture for the target strategy.',
          outputSummary: '',
          metadata: {
            domain: 'strategy',
          },
        },
        {
          kind: 'read',
          title: 'Load backtest center summary',
          status: 'pending',
          toolName: 'backtest.summary.get',
          description: 'Confirm recent research activity and pending reviews.',
          outputSummary: '',
          metadata: {
            domain: 'backtest',
          },
        },
        {
          kind: 'read',
          title: 'Load execution plan posture',
          status: 'pending',
          toolName: 'execution.plans.list',
          description: 'Check whether the strategy already has active or blocked execution plans.',
          outputSummary: '',
          metadata: {
            domain: 'execution',
          },
        },
        {
          kind: 'request_action',
          title: 'Prepare controlled action handoff',
          status: 'pending',
          toolName: '',
          description: 'If posture is acceptable, recommend a gated action request instead of direct execution.',
          outputSummary: '',
          metadata: {
            proposedActionRequestType: 'prepare_execution_plan',
          },
        },
      ];
    case 'request_risk_explanation':
      return [
        {
          kind: 'read',
          title: 'Load recent risk events',
          status: 'pending',
          toolName: 'risk.events.list',
          description: 'Inspect the most recent risk signals and review-level alerts.',
          outputSummary: '',
          metadata: {
            domain: 'risk',
          },
        },
        {
          kind: 'read',
          title: 'Load execution plan posture',
          status: 'pending',
          toolName: 'execution.plans.list',
          description: 'Correlate active approvals and execution posture with current risk signals.',
          outputSummary: '',
          metadata: {
            domain: 'execution',
          },
        },
        {
          kind: 'explain',
          title: 'Explain current risk posture',
          status: 'pending',
          toolName: '',
          description: 'Produce a concise explanation with warnings and next-step guidance.',
          outputSummary: '',
          metadata: {
            deliverable: 'risk-explanation',
          },
        },
      ];
    case 'request_scheduler_action':
      return [
        {
          kind: 'read',
          title: 'Load recent risk signals',
          status: 'pending',
          toolName: 'risk.events.list',
          description: 'Use current risk posture as context for scheduler review.',
          outputSummary: '',
          metadata: {
            domain: 'risk',
          },
        },
        {
          kind: 'read',
          title: 'Load execution plan posture',
          status: 'pending',
          toolName: 'execution.plans.list',
          description: 'Check whether approvals or blocked plans coincide with scheduler attention.',
          outputSummary: '',
          metadata: {
            domain: 'execution',
          },
        },
        {
          kind: 'request_action',
          title: 'Recommend scheduler runbook action',
          status: 'pending',
          toolName: '',
          description: 'Produce a reviewed scheduler recommendation instead of directly mutating scheduler state.',
          outputSummary: '',
          metadata: {
            proposedActionRequestType: 'scheduler_review',
          },
        },
      ];
    default:
      return [
        {
          kind: 'read',
          title: 'Load strategy catalog context',
          status: 'pending',
          toolName: 'strategy.catalog.list',
          description: 'Read the current strategy catalog and lifecycle posture.',
          outputSummary: '',
          metadata: {
            domain: 'strategy',
          },
        },
        {
          kind: 'read',
          title: 'Load backtest center summary',
          status: 'pending',
          toolName: 'backtest.summary.get',
          description: 'Read current research coverage and backlog posture.',
          outputSummary: '',
          metadata: {
            domain: 'backtest',
          },
        },
        {
          kind: 'explain',
          title: 'Summarize findings',
          status: 'pending',
          toolName: '',
          description: 'Prepare a concise read-only analysis with next-step suggestions.',
          outputSummary: '',
          metadata: {
            deliverable: 'general-analysis',
          },
        },
      ];
  }
}

function buildPlanSummary(intent = {}) {
  switch (intent.kind) {
    case 'request_backtest_review':
      return 'Review recent research outputs and explain whether a backtest needs operator attention.';
    case 'request_execution_prep':
      return 'Check research, execution, and approval posture before preparing a controlled execution request.';
    case 'request_risk_explanation':
      return 'Explain the current risk posture using recent risk and execution signals.';
    case 'request_scheduler_action':
      return 'Review scheduler-adjacent posture and prepare a controlled recommendation.';
    default:
      return 'Read current platform context and prepare a concise analysis plan.';
  }
}

export function createAgentPlan(payload = {}) {
  const parsed = payload.intent
    ? {
      ok: true,
      session: payload.sessionId ? controlPlaneRuntime.getAgentSession(payload.sessionId) : null,
      intent: payload.intent,
    }
    : parseAgentIntent(payload);

  if (!parsed.ok) {
    return parsed;
  }

  const session = parsed.session || (payload.sessionId ? controlPlaneRuntime.getAgentSession(payload.sessionId) : null);
  if (!session) {
    return {
      ok: false,
      error: 'missing_session',
      message: 'Agent planning requires a persisted session.',
    };
  }

  const intent = parsed.intent;
  const plan = controlPlaneRuntime.recordAgentPlan({
    sessionId: session.id,
    status: 'ready',
    summary: buildPlanSummary(intent),
    requiresApproval: intent.requiresApproval,
    requestedBy: payload.requestedBy || session.requestedBy || 'operator',
    steps: buildPlanSteps(intent),
    metadata: {
      intentKind: intent.kind,
      targetType: intent.targetType,
      targetId: intent.targetId,
      requestedMode: intent.requestedMode,
      source: 'agent-planner',
    },
  });

  const updatedSession = controlPlaneRuntime.updateAgentSession(session.id, {
    status: 'ready',
    latestIntent: intent,
    latestPlanId: plan.id,
    metadata: {
      planCreatedAt: plan.createdAt,
    },
  });
  controlPlaneRuntime.recordAgentSessionMessage({
    sessionId: session.id,
    role: 'assistant',
    kind: 'plan',
    title: 'Plan prepared',
    body: buildPlanSummary(intent),
    requestedBy: payload.requestedBy || session.requestedBy || 'agent',
    metadata: {
      agentPlanId: plan.id,
      requiresApproval: plan.requiresApproval,
      stepCount: plan.steps.length,
      intentKind: intent.kind,
    },
  });

  return {
    ok: true,
    session: updatedSession || session,
    intent,
    plan,
  };
}
