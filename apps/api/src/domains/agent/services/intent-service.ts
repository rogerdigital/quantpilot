// @ts-nocheck
import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';
import { listBacktestRuns } from '../../backtest/services/runs-service.js';
import { listExecutionPlans } from '../../execution/services/query-service.js';
import { listRiskEvents } from '../../risk/services/feed-service.js';
import { listStrategyCatalog } from '../../strategy/services/catalog-service.js';

function normalizePrompt(prompt = '') {
  return String(prompt || '').replace(/\s+/g, ' ').trim();
}

function createSessionTitle(prompt) {
  const trimmed = normalizePrompt(prompt);
  if (!trimmed) return 'Agent collaboration session';
  return trimmed.length > 72 ? `${trimmed.slice(0, 69)}...` : trimmed;
}

function findStrategyTarget(prompt, explicitTargetId = '') {
  if (explicitTargetId) {
    return {
      targetType: 'strategy',
      targetId: explicitTargetId,
    };
  }

  const normalized = prompt.toLowerCase();
  const snapshot = listStrategyCatalog();
  const matched = snapshot.strategies.find((item) => normalized.includes(item.id.toLowerCase())
    || normalized.includes(String(item.name || '').toLowerCase()));
  if (!matched) {
    return {
      targetType: 'unknown',
      targetId: '',
    };
  }

  return {
    targetType: 'strategy',
    targetId: matched.id,
  };
}

function findBacktestTarget(prompt, explicitTargetId = '') {
  if (explicitTargetId) {
    return {
      targetType: 'backtest_run',
      targetId: explicitTargetId,
    };
  }

  const normalized = prompt.toLowerCase();
  const snapshot = listBacktestRuns();
  const matched = snapshot.runs.find((item) => normalized.includes(item.id.toLowerCase())
    || normalized.includes(String(item.strategyId || '').toLowerCase())
    || normalized.includes(String(item.strategyName || '').toLowerCase()));

  return {
    targetType: matched ? 'backtest_run' : 'unknown',
    targetId: matched?.id || '',
  };
}

function findExecutionTarget(prompt, explicitTargetId = '') {
  if (explicitTargetId) {
    return {
      targetType: 'strategy',
      targetId: explicitTargetId,
    };
  }

  const fromStrategy = findStrategyTarget(prompt);
  if (fromStrategy.targetId) {
    return fromStrategy;
  }

  const normalized = prompt.toLowerCase();
  const plans = listExecutionPlans(30);
  const matchedPlan = plans.find((item) => normalized.includes(item.id.toLowerCase())
    || normalized.includes(String(item.strategyId || '').toLowerCase())
    || normalized.includes(String(item.strategyName || '').toLowerCase()));
  if (matchedPlan) {
    return {
      targetType: 'execution_plan',
      targetId: matchedPlan.id,
    };
  }

  return {
    targetType: 'unknown',
    targetId: '',
  };
}

function findRiskTarget(prompt, explicitTargetId = '') {
  if (explicitTargetId) {
    return {
      targetType: 'risk_event',
      targetId: explicitTargetId,
    };
  }

  const normalized = prompt.toLowerCase();
  const events = listRiskEvents(30);
  const matched = events.find((item) => normalized.includes(item.id.toLowerCase())
    || normalized.includes(String(item.title || '').toLowerCase())
    || normalized.includes(String(item.message || '').toLowerCase()));
  if (matched) {
    return {
      targetType: 'risk_event',
      targetId: matched.id,
    };
  }

  return findStrategyTarget(prompt);
}

function inferUrgency(prompt) {
  const normalized = prompt.toLowerCase();
  if (/(urgent|immediately|asap|now|立刻|马上|尽快)/.test(normalized)) return 'high';
  if (/(today|tomorrow|before open|开盘前|盘前)/.test(normalized)) return 'normal';
  return 'low';
}

function inferIntentFromPrompt(prompt, explicitTargetId = '') {
  const normalized = prompt.toLowerCase();
  const urgency = inferUrgency(prompt);

  if (/(回测|backtest|research|评估|evaluation|review run|review result)/.test(normalized)) {
    const target = findBacktestTarget(prompt, explicitTargetId);
    return {
      kind: 'request_backtest_review',
      summary: 'Review research and backtest posture before promoting or rerunning a strategy.',
      targetType: target.targetType,
      targetId: target.targetId,
      urgency,
      requiresApproval: false,
      requestedMode: 'read_only',
      metadata: {
        matchedDomain: 'backtest',
      },
    };
  }

  if (/(执行计划|execution plan|route|routing|下单|trade prep|prepare execution|执行准备|approve order)/.test(normalized)) {
    const target = findExecutionTarget(prompt, explicitTargetId);
    return {
      kind: 'request_execution_prep',
      summary: 'Prepare an execution-readiness review that can later become a controlled action request.',
      targetType: target.targetType,
      targetId: target.targetId,
      urgency,
      requiresApproval: true,
      requestedMode: 'prepare_action',
      metadata: {
        matchedDomain: 'execution',
        proposedActionRequestType: 'prepare_execution_plan',
      },
    };
  }

  if (/(风控|risk|drawdown|回撤|compliance|explain risk|风险解释|风险说明)/.test(normalized)) {
    const target = findRiskTarget(prompt, explicitTargetId);
    return {
      kind: 'request_risk_explanation',
      summary: 'Explain the current risk posture and the control-plane signals behind it.',
      targetType: target.targetType,
      targetId: target.targetId,
      urgency,
      requiresApproval: false,
      requestedMode: 'read_only',
      metadata: {
        matchedDomain: 'risk',
      },
    };
  }

  if (/(scheduler|schedule|盘前|盘后|window|tick|调度|runbook)/.test(normalized)) {
    return {
      kind: 'request_scheduler_action',
      summary: 'Review scheduler posture and identify whether a controlled orchestration action is needed.',
      targetType: explicitTargetId ? 'scheduler_window' : 'unknown',
      targetId: explicitTargetId || '',
      urgency,
      requiresApproval: true,
      requestedMode: 'prepare_action',
      metadata: {
        matchedDomain: 'scheduler',
      },
    };
  }

  const target = findStrategyTarget(prompt, explicitTargetId);
  return {
    kind: 'read_only_analysis',
    summary: 'Read current platform context and summarize the most relevant findings.',
    targetType: target.targetType,
    targetId: target.targetId,
    urgency,
    requiresApproval: false,
    requestedMode: 'read_only',
    metadata: {
      matchedDomain: target.targetId ? 'strategy' : 'general',
    },
  };
}

export function parseAgentIntent(payload = {}) {
  const prompt = normalizePrompt(payload.prompt);
  if (!prompt) {
    return {
      ok: false,
      error: 'missing_prompt',
      message: 'Agent intent parsing requires a non-empty prompt.',
    };
  }

  const requestedBy = payload.requestedBy || 'operator';
  const existingSession = payload.sessionId ? controlPlaneRuntime.getAgentSession(payload.sessionId) : null;
  const intent = inferIntentFromPrompt(prompt, payload.targetId || '');

  const session = existingSession
    ? controlPlaneRuntime.updateAgentSession(existingSession.id, {
      prompt,
      requestedBy,
      title: existingSession.title || createSessionTitle(prompt),
      status: 'ready',
      latestIntent: intent,
      metadata: {
        intentParsedAt: new Date().toISOString(),
      },
    })
    : controlPlaneRuntime.recordAgentSession({
      title: createSessionTitle(prompt),
      prompt,
      requestedBy,
      status: 'ready',
      latestIntent: intent,
      metadata: {
        source: 'agent-intent-parser',
      },
    });

  controlPlaneRuntime.recordAgentSessionMessage({
    sessionId: session.id,
    role: 'user',
    kind: 'prompt',
    title: 'Analysis request',
    body: prompt,
    requestedBy,
    metadata: {
      source: 'agent-intent-parser',
    },
  });
  controlPlaneRuntime.recordAgentSessionMessage({
    sessionId: session.id,
    role: 'system',
    kind: 'intent',
    title: 'Intent parsed',
    body: intent.summary,
    requestedBy,
    metadata: {
      intentKind: intent.kind,
      targetType: intent.targetType,
      targetId: intent.targetId,
      requestedMode: intent.requestedMode,
    },
  });

  return {
    ok: true,
    session,
    intent,
  };
}
