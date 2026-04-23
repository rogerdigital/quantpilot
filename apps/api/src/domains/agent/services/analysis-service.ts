import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';
import type { LLMMessage, LLMTool } from '../../../../../../packages/llm-provider/src/index.js';
import { createLLMProvider } from '../../../../../../packages/llm-provider/src/index.js';
import { listActiveAgentInstructions } from './instruction-service.js';
import type { AgentIntent } from './intent-service.js';
import { createAgentPlan } from './planning-service.js';
import { ANALYSIS_SYSTEM_PROMPT } from './prompts.js';
import { executeAgentTool } from './tools-service.js';

type ToolExecutionResult = {
  ok: boolean;
  tool: string;
  summary: string;
  data?: Record<string, unknown>;
};

type ToolCallLogEntry = {
  tool: string;
  input: Record<string, unknown>;
  result: ToolExecutionResult;
};

type AnalysisNarrative = {
  thesis: string;
  rationale: string[];
  warnings: string[];
  strategy?: Record<string, unknown> | null;
  recommendedNextStep: string;
  requiresAction: boolean;
  actionType: string;
};

type AnalysisLoopResult = {
  narrative: AnalysisNarrative;
  toolCallLog: ToolCallLogEntry[];
};

type RunAgentAnalysisPayload = {
  planId?: string;
  sessionId?: string;
  requestedBy?: string;
  intent?: AgentIntent;
};

const LLM_TOOLS: LLMTool[] = [
  {
    name: 'strategy_catalog_list',
    description:
      'List all trading strategies in the catalog with their current status and metrics.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'backtest_summary_get',
    description:
      'Get the backtest center summary: total runs, pending reviews, and health metrics.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'backtest_runs_list',
    description:
      'List recent backtest runs with performance metrics like Sharpe ratio and max drawdown.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by status: needs_review, completed, failed',
          enum: ['needs_review', 'completed', 'failed'],
        },
      },
      required: [],
    },
  },
  {
    name: 'risk_events_list',
    description: 'List recent risk events and alerts from the risk monitoring system.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max number of events to return (default 10)' },
      },
      required: [],
    },
  },
  {
    name: 'execution_plans_list',
    description: 'List execution plans and their current approval/review status.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max number of plans to return (default 10)' },
      },
      required: [],
    },
  },
  {
    name: 'market_quotes_get',
    description: 'Get current market quotes and price data for one or more stock symbols.',
    inputSchema: {
      type: 'object',
      properties: {
        symbols: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of ticker symbols e.g. ["AAPL", "NVDA"]',
        },
      },
      required: ['symbols'],
    },
  },
  {
    name: 'market_history_get',
    description: 'Get historical OHLCV (Open/High/Low/Close/Volume) price data for a symbol.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Ticker symbol e.g. "AAPL"' },
        days: {
          type: 'number',
          description: 'Number of calendar days of history (default 30)',
        },
      },
      required: ['symbol'],
    },
  },
];

async function executeLLMToolCall(
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<ToolExecutionResult> {
  const dotName = (() => {
    switch (toolName) {
      case 'strategy_catalog_list':
        return 'strategy.catalog.list';
      case 'backtest_summary_get':
        return 'backtest.summary.get';
      case 'backtest_runs_list':
        return 'backtest.runs.list';
      case 'risk_events_list':
        return 'risk.events.list';
      case 'execution_plans_list':
        return 'execution.plans.list';
      case 'market_quotes_get':
        return 'market.quotes.get';
      case 'market_history_get':
        return 'market.history.get';
      default:
        return toolName;
    }
  })();

  return executeAgentTool({
    tool: dotName,
    args: toolInput || {},
  }) as Promise<ToolExecutionResult>;
}

function serializeToolResult(result: ToolExecutionResult): string {
  if (!result.ok) return `Error: ${result.summary}`;
  const data = result.data || {};
  return JSON.stringify(data, null, 2).slice(0, 3000);
}

function buildAnalysisPrompt(intent: AgentIntent, dailyBias: Array<{ body: string }>): string {
  const biasNote = dailyBias.length
    ? `\n\nActive daily bias instructions:\n${dailyBias.map((item) => `- ${item.body}`).join('\n')}`
    : '';

  return `Analyze the user's trading request and provide actionable recommendations.

User's intent: ${intent.summary}
Intent kind: ${intent.kind}
${intent.extractedStrategy ? `Strategy description: ${intent.extractedStrategy.description}` : ''}
${intent.extractedTrade ? `Requested trade: ${intent.extractedTrade.side} ${intent.extractedTrade.symbol || 'unspecified'}` : ''}
${biasNote}

Please use the available tools to gather relevant data, then provide your analysis in the required JSON format.`;
}

function buildFallbackNarrative(
  _intent: AgentIntent,
  toolResults: ToolExecutionResult[] = []
): AnalysisNarrative {
  const resultMap = Object.fromEntries(toolResults.map((result) => [result.tool, result]));
  const strategies = (resultMap['strategy.catalog.list']?.data?.strategies as unknown[]) || [];
  const backtestSummary = resultMap['backtest.summary.get']?.data || {};
  const riskEvents =
    (resultMap['risk.events.list']?.data?.events as Array<{ status?: string }>) || [];

  const elevatedRisk = riskEvents.some(
    (event) => event.status === 'risk-off' || event.status === 'attention'
  );
  const thesis = elevatedRisk
    ? 'Risk posture is elevated. Review risk events before taking action.'
    : `Analysis complete. Found ${strategies.length} strategies and ${Number(backtestSummary.completedRuns || 0)} completed backtests.`;

  return {
    thesis,
    rationale: [
      `${strategies.length} strategies available in catalog.`,
      `${Number(backtestSummary.completedRuns || 0)} completed backtests tracked.`,
      `${riskEvents.length} recent risk events checked.`,
    ],
    warnings: elevatedRisk ? ['Elevated risk events are active. Proceed with caution.'] : [],
    recommendedNextStep: elevatedRisk
      ? 'Review the risk console before requesting any action.'
      : 'Refine your request for more specific analysis.',
    requiresAction: false,
    actionType: 'none',
  };
}

async function runLLMAnalysisLoop(
  intent: AgentIntent,
  dailyBias: Array<{ body: string }>
): Promise<AnalysisLoopResult | null> {
  const llm = createLLMProvider();
  if (!llm) return null;

  const messages: LLMMessage[] = [
    { role: 'user', content: buildAnalysisPrompt(intent, dailyBias) },
  ];
  const toolCallLog: ToolCallLogEntry[] = [];
  const maxRounds = 5;

  for (let round = 0; round < maxRounds; round++) {
    const response = await llm.chatWithTools(messages, LLM_TOOLS, {
      systemPrompt: ANALYSIS_SYSTEM_PROMPT,
      maxTokens: 4096,
      temperature: 0.2,
    });

    if (!response.ok) {
      console.error('[analysis-service] LLM error in round', round, response.error);
      return null;
    }

    if (response.stopReason === 'tool_use' && response.toolCalls?.length) {
      const assistantContent: Array<Record<string, unknown>> = [];
      if (response.content) {
        assistantContent.push({ type: 'text', text: response.content });
      }
      for (const toolCall of response.toolCalls) {
        assistantContent.push({
          type: 'tool_use',
          id: toolCall.id,
          name: toolCall.name,
          input: toolCall.input,
        });
      }
      messages.push({ role: 'assistant', content: assistantContent });

      const toolResultContent: Array<Record<string, unknown>> = [];
      for (const toolCall of response.toolCalls) {
        const result = await executeLLMToolCall(toolCall.name, toolCall.input);
        toolCallLog.push({ tool: toolCall.name, input: toolCall.input, result });
        toolResultContent.push({
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: serializeToolResult(result),
        });
      }
      messages.push({ role: 'user', content: toolResultContent });
      continue;
    }

    const finalContent = response.content?.trim() || '';
    try {
      const jsonStr = finalContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      const parsed = JSON.parse(jsonStr) as Partial<AnalysisNarrative>;
      return {
        narrative: {
          thesis: parsed.thesis || 'Analysis complete.',
          rationale: Array.isArray(parsed.rationale) ? parsed.rationale : [],
          warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
          strategy: parsed.strategy || null,
          recommendedNextStep: parsed.recommendedNextStep || '',
          requiresAction: Boolean(parsed.requiresAction),
          actionType: parsed.actionType || 'none',
        },
        toolCallLog,
      };
    } catch (parseErr: unknown) {
      console.error(
        '[analysis-service] Failed to parse LLM JSON response:',
        parseErr instanceof Error ? parseErr.message : 'unknown_error'
      );
      console.error('[analysis-service] Raw content:', finalContent.slice(0, 500));
      return null;
    }
  }

  console.error('[analysis-service] Exceeded max tool call rounds');
  return null;
}

export async function runAgentAnalysis(payload: RunAgentAnalysisPayload = {}) {
  const planned: any = payload.planId
    ? {
        ok: true,
        session: payload.sessionId ? controlPlaneRuntime.getAgentSession(payload.sessionId) : null,
        intent: payload.intent || null,
        plan: controlPlaneRuntime.getAgentPlan(payload.planId),
      }
    : await createAgentPlan(payload);

  if (!planned.ok) return planned;

  const plan = planned.plan || controlPlaneRuntime.getAgentPlan(payload.planId);
  const session =
    planned.session ||
    (plan?.sessionId ? controlPlaneRuntime.getAgentSession(plan.sessionId) : null);
  const intent = planned.intent || session?.latestIntent || null;

  if (!plan || !session || !intent) {
    return {
      ok: false,
      error: 'missing_analysis_context',
      message: 'Agent analysis requires a session, intent, and plan.',
    };
  }

  controlPlaneRuntime.updateAgentSession(session.id, { status: 'running' });
  controlPlaneRuntime.recordAgentSessionMessage({
    sessionId: session.id,
    role: 'system',
    kind: 'analysis_status',
    title: 'Analysis started',
    body: 'Gathering data and reasoning with AI...',
    requestedBy: payload.requestedBy || session.requestedBy || 'agent',
    metadata: { agentPlanId: plan.id, status: 'running' },
  });
  controlPlaneRuntime.updateAgentPlan(plan.id, {
    status: 'running',
    steps: plan.steps.map((step: Record<string, unknown>) => ({
      ...step,
      status: step.toolName ? 'running' : step.status,
    })),
  });

  const dailyBias = listActiveAgentInstructions({
    sessionId: session.id,
    kind: 'daily_bias',
  }) as Array<{ body: string }>;

  let analysisResult = await runLLMAnalysisLoop(intent as AgentIntent, dailyBias);

  const toolResults: ToolExecutionResult[] = [];
  if (!analysisResult) {
    controlPlaneRuntime.recordAgentSessionMessage({
      sessionId: session.id,
      role: 'system',
      kind: 'analysis_status',
      title: 'Using rule-based analysis',
      body: 'LLM unavailable. Using built-in analysis engine.',
      requestedBy: payload.requestedBy || session.requestedBy || 'agent',
      metadata: { agentPlanId: plan.id },
    });

    for (const step of plan.steps as Array<Record<string, unknown>>) {
      if (!step.toolName) continue;
      const args =
        step.toolName === 'risk.events.list'
          ? { limit: 12 }
          : step.toolName === 'execution.plans.list'
            ? { limit: 12 }
            : step.toolName === 'backtest.runs.list' && intent.kind === 'request_backtest_review'
              ? { status: 'needs_review' }
              : {};
      const result = (await executeAgentTool({
        tool: String(step.toolName),
        args,
      })) as ToolExecutionResult;
      toolResults.push(result);
    }

    analysisResult = {
      narrative: buildFallbackNarrative(intent as AgentIntent, toolResults),
      toolCallLog: toolResults.map((result) => ({
        tool: result.tool,
        input: {},
        result,
      })),
    };
  }

  const { narrative, toolCallLog } = analysisResult;

  const llmToolCalls = toolCallLog.map((entry) => ({
    tool: entry.tool,
    status: entry.result?.ok ? 'completed' : 'failed',
    summary: entry.result?.summary || '',
    metadata: { dataKeys: Object.keys(entry.result?.data || {}) },
  }));

  const evidence = toolCallLog
    .filter((entry) => entry.result?.ok)
    .map((entry) => ({
      kind: 'tool_result',
      title: entry.tool,
      summary: entry.result?.summary || '',
      source: entry.tool,
      sourceId: entry.tool,
      metadata: { keys: Object.keys(entry.result?.data || {}) },
    }));

  const finalizedSteps = (plan.steps as Array<Record<string, unknown>>).map((step) => ({
    ...step,
    status: 'completed',
    outputSummary:
      step.kind === 'explain'
        ? narrative.thesis
        : step.kind === 'request_action'
          ? narrative.recommendedNextStep
          : llmToolCalls.find((toolCall) => toolCall.tool === step.toolName)?.summary ||
            'Completed.',
  }));

  const completedAt = new Date().toISOString();
  const explanation = {
    thesis: narrative.thesis,
    rationale: narrative.rationale,
    warnings: narrative.warnings,
    recommendedNextStep: narrative.recommendedNextStep,
    strategy: narrative.strategy || null,
    requiresAction: narrative.requiresAction,
    actionType: narrative.actionType,
  };

  const run = controlPlaneRuntime.recordAgentAnalysisRun({
    sessionId: session.id,
    planId: plan.id,
    status: 'completed',
    summary: narrative.thesis,
    conclusion: narrative.thesis,
    requestedBy: payload.requestedBy || session.requestedBy || 'operator',
    toolCalls: llmToolCalls,
    evidence,
    explanation,
    metadata: {
      intentKind: intent.kind,
      targetType: intent.targetType,
      targetId: intent.targetId,
      source: 'agent-analysis-llm',
      hasStrategy: Boolean(narrative.strategy),
    },
    completedAt,
  });

  const updatedPlan = controlPlaneRuntime.updateAgentPlan(plan.id, {
    status: 'completed',
    steps: finalizedSteps,
    metadata: { latestAnalysisRunId: run.id },
  });
  const updatedSession = controlPlaneRuntime.updateAgentSession(session.id, {
    status: 'completed',
    latestAnalysisRunId: run.id,
    metadata: { latestAnalysisCompletedAt: completedAt },
  });

  controlPlaneRuntime.recordAgentSessionMessage({
    sessionId: session.id,
    role: 'system',
    kind: 'analysis_status',
    title: 'Summarizing findings',
    body: 'Summarizing findings and preparing recommendations.',
    requestedBy: payload.requestedBy || session.requestedBy || 'agent',
    metadata: { agentPlanId: plan.id, agentAnalysisRunId: run.id },
  });

  controlPlaneRuntime.recordAgentSessionMessage({
    sessionId: session.id,
    role: 'assistant',
    kind: 'analysis_result',
    title: narrative.thesis,
    body: [
      narrative.thesis,
      ...narrative.rationale,
      ...narrative.warnings,
      narrative.recommendedNextStep ? `Next: ${narrative.recommendedNextStep}` : '',
    ]
      .filter(Boolean)
      .join(' '),
    requestedBy: payload.requestedBy || session.requestedBy || 'agent',
    metadata: {
      agentPlanId: plan.id,
      agentAnalysisRunId: run.id,
      status: 'completed',
      toolCallCount: llmToolCalls.length,
      hasStrategy: Boolean(narrative.strategy),
      requiresAction: narrative.requiresAction,
      actionType: narrative.actionType,
    },
  });
  controlPlaneRuntime.recordAgentSessionMessage({
    sessionId: session.id,
    role: 'system',
    kind: 'analysis_status',
    title: plan.requiresApproval ? 'Ready for approval' : 'Analysis ready',
    body: plan.requiresApproval
      ? 'Ready for approval once you request a controlled handoff.'
      : 'Analysis complete. Ask a follow-up or take action.',
    requestedBy: payload.requestedBy || session.requestedBy || 'agent',
    metadata: {
      agentPlanId: plan.id,
      agentAnalysisRunId: run.id,
      requiresApproval: plan.requiresApproval,
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
