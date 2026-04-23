import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';
import { createLLMProvider } from '../../../../../../packages/llm-provider/src/index.js';
import { type AgentIntent, parseAgentIntent } from './intent-service.js';
import { PLANNING_SYSTEM_PROMPT } from './prompts.js';

type PlanStep = {
  kind: string;
  title: string;
  toolName: string;
  description: string;
  outputSummary: string;
  status?: string;
  metadata: Record<string, unknown>;
};

type CreateAgentPlanPayload = {
  sessionId?: string;
  requestedBy?: string;
  intent?: AgentIntent;
  prompt?: string;
  targetId?: string;
};

const AVAILABLE_TOOLS_DESCRIPTION = `
Read tools:
- strategy.catalog.list: List all strategies
- backtest.summary.get: Get backtest statistics
- backtest.runs.list: List recent backtest runs
- risk.events.list: List risk events
- execution.plans.list: List execution plans
- market.quotes.get: Get current market quotes (args: {symbols: string[]})
- market.history.get: Get historical OHLCV (args: {symbol: string, days: number})

Action tools:
- execution.paper.submit: Submit paper trade (args: {symbol, side, qty, orderType})
- execution.live.request: Request live trade approval (args: {symbol, side, qty, rationale})
- backtest.queue: Queue a backtest (args: {strategyDescription, symbols, days})
`;

function buildFallbackSteps(intent: Partial<AgentIntent> = {}): PlanStep[] {
  const baseReadSteps: PlanStep[] = [
    {
      kind: 'read',
      title: 'Load strategy catalog',
      toolName: 'strategy.catalog.list',
      description: 'Read strategy catalog.',
      outputSummary: '',
      metadata: { domain: 'strategy' },
    },
    {
      kind: 'read',
      title: 'Load backtest summary',
      toolName: 'backtest.summary.get',
      description: 'Check research posture.',
      outputSummary: '',
      metadata: { domain: 'backtest' },
    },
  ];

  switch (intent.kind) {
    case 'execute_trade':
      return [
        {
          kind: 'read',
          title: 'Get market quote',
          toolName: 'market.quotes.get',
          description: 'Get current price for the target symbol.',
          outputSummary: '',
          metadata: { domain: 'market' },
        },
        {
          kind: 'read',
          title: 'Load risk events',
          toolName: 'risk.events.list',
          description: 'Check risk posture before execution.',
          outputSummary: '',
          metadata: { domain: 'risk' },
        },
        {
          kind: 'execute',
          title: 'Submit paper order',
          toolName: 'execution.paper.submit',
          description: 'Submit order to paper account.',
          outputSummary: '',
          metadata: { domain: 'execution' },
        },
      ];
    case 'build_strategy':
      return [
        {
          kind: 'read',
          title: 'Load market context',
          toolName: 'market.quotes.get',
          description: 'Get current quotes for analysis.',
          outputSummary: '',
          metadata: { domain: 'market' },
        },
        {
          kind: 'read',
          title: 'Load strategy catalog',
          toolName: 'strategy.catalog.list',
          description: 'Check existing strategies.',
          outputSummary: '',
          metadata: { domain: 'strategy' },
        },
        {
          kind: 'explain',
          title: 'Build strategy plan',
          toolName: '',
          description: 'Generate strategy based on user description.',
          outputSummary: '',
          metadata: { deliverable: 'strategy-plan' },
        },
      ];
    case 'request_backtest_review':
      return [
        {
          kind: 'read',
          title: 'Load backtest summary',
          toolName: 'backtest.summary.get',
          description: 'Read research summary.',
          outputSummary: '',
          metadata: { domain: 'backtest' },
        },
        {
          kind: 'read',
          title: 'Load recent runs',
          toolName: 'backtest.runs.list',
          description: 'Inspect run outcomes.',
          outputSummary: '',
          metadata: { domain: 'backtest' },
        },
        {
          kind: 'explain',
          title: 'Summarize research posture',
          toolName: '',
          description: 'Explain findings.',
          outputSummary: '',
          metadata: { deliverable: 'backtest-review' },
        },
      ];
    case 'request_risk_explanation':
      return [
        {
          kind: 'read',
          title: 'Load risk events',
          toolName: 'risk.events.list',
          description: 'Inspect risk signals.',
          outputSummary: '',
          metadata: { domain: 'risk' },
        },
        {
          kind: 'read',
          title: 'Load execution posture',
          toolName: 'execution.plans.list',
          description: 'Correlate risk with execution.',
          outputSummary: '',
          metadata: { domain: 'execution' },
        },
        {
          kind: 'explain',
          title: 'Explain risk posture',
          toolName: '',
          description: 'Produce risk explanation.',
          outputSummary: '',
          metadata: { deliverable: 'risk-explanation' },
        },
      ];
    case 'request_execution_prep':
      return [
        {
          kind: 'read',
          title: 'Load strategy catalog',
          toolName: 'strategy.catalog.list',
          description: 'Read strategy state and readiness.',
          outputSummary: '',
          metadata: { domain: 'strategy' },
        },
        {
          kind: 'read',
          title: 'Load execution plans',
          toolName: 'execution.plans.list',
          description: 'Check existing execution plans.',
          outputSummary: '',
          metadata: { domain: 'execution' },
        },
        {
          kind: 'read',
          title: 'Load risk events',
          toolName: 'risk.events.list',
          description: 'Review risk posture before prep.',
          outputSummary: '',
          metadata: { domain: 'risk' },
        },
        {
          kind: 'explain',
          title: 'Prepare execution readiness summary',
          toolName: '',
          description: 'Summarize execution readiness.',
          outputSummary: '',
          metadata: { deliverable: 'execution-prep' },
        },
      ];
    default:
      return [
        ...baseReadSteps,
        {
          kind: 'explain',
          title: 'Summarize findings',
          toolName: '',
          description: 'Prepare read-only analysis.',
          outputSummary: '',
          metadata: { deliverable: 'general-analysis' },
        },
      ];
  }
}

async function buildLLMSteps(intent: Partial<AgentIntent> = {}): Promise<PlanStep[]> {
  const llm = createLLMProvider();
  if (!llm) {
    return buildFallbackSteps(intent);
  }

  const intentContext = `
Intent kind: ${intent.kind}
Summary: ${intent.summary}
Target: ${intent.targetType} / ${intent.targetId || 'none'}
${intent.extractedStrategy ? `Strategy description: ${intent.extractedStrategy.description}` : ''}
${intent.extractedTrade ? `Trade: ${intent.extractedTrade.side} ${intent.extractedTrade.symbol || 'unspecified'}` : ''}
`;

  const response = await llm.chat(
    [
      {
        role: 'user',
        content: `Create execution steps for this intent:\n${intentContext}\n\nAvailable tools:\n${AVAILABLE_TOOLS_DESCRIPTION}`,
      },
    ],
    {
      systemPrompt: PLANNING_SYSTEM_PROMPT,
      maxTokens: 1024,
      temperature: 0.1,
    }
  );

  if (!response.ok) {
    console.error('[planning-service] LLM error, using fallback steps:', response.error);
    return buildFallbackSteps(intent);
  }

  try {
    const rawSteps = JSON.parse(response.content.trim()) as Array<Partial<PlanStep>>;
    if (!Array.isArray(rawSteps) || rawSteps.length === 0) {
      return buildFallbackSteps(intent);
    }
    return rawSteps.map((step) => ({
      kind: step.kind || 'read',
      title: step.title || 'Step',
      toolName: step.toolName || '',
      description: step.description || '',
      outputSummary: '',
      status: 'pending',
      metadata: step.metadata || {},
    }));
  } catch (parseErr: unknown) {
    console.error(
      '[planning-service] JSON parse error, using fallback steps:',
      parseErr instanceof Error ? parseErr.message : 'unknown_error'
    );
    return buildFallbackSteps(intent);
  }
}

function buildPlanSummary(intent: Partial<AgentIntent> = {}): string {
  switch (intent.kind) {
    case 'execute_trade':
      return `Execute a ${intent.extractedTrade?.side || 'trade'} order${intent.extractedTrade?.symbol ? ` for ${intent.extractedTrade.symbol}` : ''}.`;
    case 'build_strategy':
      return 'Build and analyze a new trading strategy based on user description.';
    case 'request_backtest_review':
      return 'Review recent research outputs and backtest posture.';
    case 'request_execution_prep':
      return 'Prepare execution readiness review for a controlled action request.';
    case 'request_risk_explanation':
      return 'Explain current risk posture using recent signals.';
    default:
      return 'Read current platform context and prepare a concise analysis.';
  }
}

export async function createAgentPlan(payload: CreateAgentPlanPayload = {}) {
  const parsed = payload.intent
    ? {
        ok: true,
        session: payload.sessionId ? controlPlaneRuntime.getAgentSession(payload.sessionId) : null,
        intent: payload.intent,
      }
    : await parseAgentIntent(payload);

  if (!parsed.ok) return parsed;

  const session =
    parsed.session ||
    (payload.sessionId ? controlPlaneRuntime.getAgentSession(payload.sessionId) : null);

  if (!session) {
    return {
      ok: false,
      error: 'missing_session',
      message: 'Agent planning requires a persisted session.',
    };
  }

  const intent = parsed.intent;
  const steps = await buildLLMSteps(intent);
  const requiresApproval = intent.requiresApproval || intent.requestedMode === 'request_live';

  const plan = controlPlaneRuntime.recordAgentPlan({
    sessionId: session.id,
    status: 'ready',
    summary: buildPlanSummary(intent),
    requiresApproval,
    requestedBy: payload.requestedBy || session.requestedBy || 'operator',
    steps: steps.map((step) => ({ ...step, status: 'pending' })),
    metadata: {
      intentKind: intent.kind,
      targetType: intent.targetType,
      targetId: intent.targetId,
      requestedMode: intent.requestedMode,
      source: 'agent-planner-llm',
      confidence: intent.confidence,
    },
  });

  const updatedSession = controlPlaneRuntime.updateAgentSession(session.id, {
    status: 'ready',
    latestIntent: intent,
    latestPlanId: plan.id,
    metadata: { planCreatedAt: plan.createdAt },
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

  return { ok: true, session: updatedSession || session, intent, plan };
}
