import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';
import { createAgentPlan } from './planning-service.mjs';
import { executeAgentTool } from './tools-service.mjs';

function summarizeToolData(tool, data = {}) {
  switch (tool) {
    case 'strategy.catalog.list':
      return `${Array.isArray(data.strategies) ? data.strategies.length : 0} strategy entries loaded.`;
    case 'backtest.summary.get':
      return `${Number(data.completedRuns || 0)} completed backtests and ${Number(data.reviewQueue || 0)} pending reviews.`;
    case 'backtest.runs.list':
      return `${Array.isArray(data.runs) ? data.runs.length : 0} backtest runs loaded.`;
    case 'risk.events.list':
      return `${Array.isArray(data.events) ? data.events.length : 0} risk events loaded.`;
    case 'execution.plans.list':
      return `${Array.isArray(data.plans) ? data.plans.length : 0} execution plans loaded.`;
    default:
      return 'Tool result loaded.';
  }
}

function buildEvidenceFromToolResult(result) {
  return {
    kind: 'tool_result',
    title: result.tool,
    summary: result.summary,
    source: result.tool,
    sourceId: result.tool,
    metadata: {
      keys: Object.keys(result.data || {}),
    },
  };
}

function buildAnalysisNarrative(intent, toolResults = []) {
  const resultMap = Object.fromEntries(toolResults.map((item) => [item.tool, item]));
  const backtestSummary = resultMap['backtest.summary.get']?.data || {};
  const backtestRuns = resultMap['backtest.runs.list']?.data?.runs || [];
  const riskEvents = resultMap['risk.events.list']?.data?.events || [];
  const executionPlans = resultMap['execution.plans.list']?.data?.plans || [];
  const strategies = resultMap['strategy.catalog.list']?.data?.strategies || [];

  switch (intent.kind) {
    case 'request_execution_prep': {
      const targetStrategy = strategies.find((item) => item.id === intent.targetId) || null;
      const existingPlans = executionPlans.filter((item) => item.strategyId === intent.targetId);
      const reviewQueue = Number(backtestSummary.reviewQueue || 0);
      const thesis = existingPlans.length > 0
        ? 'Execution readiness needs review because the strategy already has persisted execution plans.'
        : 'Execution readiness can be reviewed through the controlled action path.';
      const rationale = [
        targetStrategy
          ? `Strategy ${targetStrategy.name || targetStrategy.id} is available in the strategy catalog.`
          : 'No target strategy was matched from the prompt, so this remains a general execution-prep review.',
        reviewQueue > 0
          ? `${reviewQueue} research items are still in review, so downstream execution should stay gated.`
          : 'No outstanding research review queue was found in the backtest summary.',
        existingPlans.length > 0
          ? `${existingPlans.length} execution plans already exist for this strategy.`
          : 'No persisted execution plans were found for this strategy.',
      ];
      const warnings = [];
      if (reviewQueue > 0) warnings.push('Pending research reviews still need operator attention before action handoff.');
      if (existingPlans.length > 0) warnings.push('Avoid creating duplicate execution requests without reviewing existing plans.');
      return {
        summary: thesis,
        conclusion: thesis,
        explanation: {
          thesis,
          rationale,
          warnings,
          recommendedNextStep: 'If posture still looks acceptable, queue a controlled execution-plan request instead of direct execution.',
        },
      };
    }
    case 'request_risk_explanation': {
      const elevatedEvents = riskEvents.filter((item) => item.status === 'risk-off' || item.status === 'attention');
      const thesis = elevatedEvents.length > 0
        ? 'Risk posture is elevated and should be reviewed before any downstream action.'
        : 'Risk posture looks stable from the current event feed.';
      return {
        summary: thesis,
        conclusion: thesis,
        explanation: {
          thesis,
          rationale: [
            `${riskEvents.length} recent risk events were loaded from the control plane.`,
            `${executionPlans.length} execution plans were checked for overlapping approval posture.`,
          ],
          warnings: elevatedEvents.length > 0
            ? ['Recent elevated risk events are still active in the control plane.']
            : [],
          recommendedNextStep: elevatedEvents.length > 0
            ? 'Review the risk console and linked execution approvals before requesting action.'
            : 'Continue with read-only review or prepare a controlled follow-up if new evidence appears.',
        },
      };
    }
    case 'request_backtest_review': {
      const pendingRuns = backtestRuns.filter((item) => item.status === 'needs_review');
      const thesis = pendingRuns.length > 0
        ? 'Backtest review backlog remains and should be cleared before promotion or execution prep.'
        : 'Backtest posture looks stable from the current run summary.';
      return {
        summary: thesis,
        conclusion: thesis,
        explanation: {
          thesis,
          rationale: [
            `${Number(backtestSummary.completedRuns || 0)} completed backtests are currently tracked.`,
            `${pendingRuns.length} recent backtest runs still require manual review.`,
          ],
          warnings: pendingRuns.length > 0 ? ['Manual backtest review is still pending.'] : [],
          recommendedNextStep: pendingRuns.length > 0
            ? 'Review the pending run before promoting or preparing execution.'
            : 'Use the result as supporting research context for the next controlled action.',
        },
      };
    }
    default: {
      const thesis = 'Read-only analysis completed using the current strategy and research context.';
      return {
        summary: thesis,
        conclusion: thesis,
        explanation: {
          thesis,
          rationale: [
            `${strategies.length} strategies were available in the catalog snapshot.`,
            `${Number(backtestSummary.completedRuns || 0)} completed backtests were visible in the summary feed.`,
          ],
          warnings: [],
          recommendedNextStep: 'Refine the prompt or create a more specific plan if a controlled follow-up is needed.',
        },
      };
    }
  }
}

function resolveToolArgs(step = {}, intent = {}) {
  if (step.toolName === 'risk.events.list') {
    return { limit: 12 };
  }
  if (step.toolName === 'execution.plans.list') {
    return { limit: 12 };
  }
  if (step.toolName === 'backtest.runs.list') {
    return intent.kind === 'request_backtest_review' ? { status: 'needs_review' } : {};
  }
  return {};
}

export function runAgentAnalysis(payload = {}) {
  const planned = payload.planId
    ? {
      ok: true,
      session: payload.sessionId ? controlPlaneRuntime.getAgentSession(payload.sessionId) : null,
      intent: payload.intent || null,
      plan: controlPlaneRuntime.getAgentPlan(payload.planId),
    }
    : createAgentPlan(payload);

  if (!planned.ok) {
    return planned;
  }

  const plan = planned.plan || controlPlaneRuntime.getAgentPlan(payload.planId);
  const session = planned.session || (plan?.sessionId ? controlPlaneRuntime.getAgentSession(plan.sessionId) : null);
  const intent = planned.intent || session?.latestIntent || null;

  if (!plan || !session || !intent) {
    return {
      ok: false,
      error: 'missing_analysis_context',
      message: 'Agent analysis requires a session, intent, and plan.',
    };
  }

  const runningSteps = plan.steps.map((step) => ({
    ...step,
    status: step.toolName ? 'running' : step.status,
  }));

  controlPlaneRuntime.updateAgentSession(session.id, {
    status: 'running',
  });
  controlPlaneRuntime.recordAgentSessionMessage({
    sessionId: session.id,
    role: 'system',
    kind: 'analysis_status',
    title: 'Analysis started',
    body: 'Intent parsed and plan execution started against allowlisted read-only tools.',
    requestedBy: payload.requestedBy || session.requestedBy || 'agent',
    metadata: {
      agentPlanId: plan.id,
      status: 'running',
    },
  });
  controlPlaneRuntime.updateAgentPlan(plan.id, {
    status: 'running',
    steps: runningSteps,
  });

  const toolResults = [];
  const completedSteps = runningSteps.map((step) => {
    if (!step.toolName) {
      return step;
    }
    const result = executeAgentTool({
      tool: step.toolName,
      args: resolveToolArgs(step, intent),
    });
    toolResults.push(result);
    return {
      ...step,
      status: result.ok ? 'completed' : 'failed',
      outputSummary: result.summary,
      metadata: {
        ...step.metadata,
        executedTool: result.tool,
      },
    };
  });

  const narrative = buildAnalysisNarrative(intent, toolResults);
  const finalizedSteps = completedSteps.map((step) => {
    if (step.kind === 'explain') {
      return {
        ...step,
        status: 'completed',
        outputSummary: narrative.explanation.thesis,
      };
    }
    if (step.kind === 'request_action') {
      return {
        ...step,
        status: 'completed',
        outputSummary: narrative.explanation.recommendedNextStep,
      };
    }
    return step;
  });

  const planStatus = finalizedSteps.some((step) => step.status === 'failed') ? 'failed' : 'completed';
  const runStatus = planStatus === 'failed' ? 'failed' : 'completed';
  const completedAt = new Date().toISOString();

  const run = controlPlaneRuntime.recordAgentAnalysisRun({
    sessionId: session.id,
    planId: plan.id,
    status: runStatus,
    summary: narrative.summary,
    conclusion: narrative.conclusion,
    requestedBy: payload.requestedBy || session.requestedBy || 'operator',
    toolCalls: toolResults.map((item) => ({
      tool: item.tool,
      status: item.ok ? 'completed' : 'failed',
      summary: item.summary,
      metadata: {
        dataKeys: Object.keys(item.data || {}),
      },
    })),
    evidence: toolResults.map((item) => buildEvidenceFromToolResult(item)),
    explanation: narrative.explanation,
    metadata: {
      intentKind: intent.kind,
      targetType: intent.targetType,
      targetId: intent.targetId,
      source: 'agent-analysis-runner',
    },
    completedAt,
  });

  const updatedPlan = controlPlaneRuntime.updateAgentPlan(plan.id, {
    status: planStatus,
    steps: finalizedSteps,
    metadata: {
      latestAnalysisRunId: run.id,
    },
  });
  const updatedSession = controlPlaneRuntime.updateAgentSession(session.id, {
    status: runStatus === 'completed' ? 'completed' : 'failed',
    latestAnalysisRunId: run.id,
    metadata: {
      latestAnalysisCompletedAt: completedAt,
    },
  });
  controlPlaneRuntime.recordAgentSessionMessage({
    sessionId: session.id,
    role: 'assistant',
    kind: 'analysis_result',
    title: narrative.explanation.thesis || 'Analysis completed',
    body: [
      narrative.summary || '',
      ...(Array.isArray(narrative.explanation?.rationale) ? narrative.explanation.rationale : []),
      ...(Array.isArray(narrative.explanation?.warnings) ? narrative.explanation.warnings : []),
      narrative.explanation?.recommendedNextStep ? `Next step: ${narrative.explanation.recommendedNextStep}` : '',
    ].filter(Boolean).join(' '),
    requestedBy: payload.requestedBy || session.requestedBy || 'agent',
    metadata: {
      agentPlanId: plan.id,
      agentAnalysisRunId: run.id,
      status: runStatus,
      toolCallCount: toolResults.length,
    },
  });

  return {
    ok: true,
    session: updatedSession || session,
    intent,
    plan: updatedPlan || plan,
    run,
  };
}
