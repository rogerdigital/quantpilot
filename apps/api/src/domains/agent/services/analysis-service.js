// @ts-nocheck
import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';
import { createLLMProvider } from '../../../../../../packages/llm-provider/src/index.js';
import { listActiveAgentInstructions } from './instruction-service.js';
import { createAgentPlan } from './planning-service.js';
import { executeAgentTool } from './tools-service.js';
import { ANALYSIS_SYSTEM_PROMPT } from './prompts.js';

/**
 * Tool definitions for LLM function/tool calling.
 * These map to executeAgentTool() implementations.
 */
const LLM_TOOLS = [
  {
    name: 'strategy_catalog_list',
    description: 'List all trading strategies in the catalog with their current status and metrics.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'backtest_summary_get',
    description: 'Get the backtest center summary: total runs, pending reviews, and health metrics.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'backtest_runs_list',
    description: 'List recent backtest runs with performance metrics like Sharpe ratio and max drawdown.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status: needs_review, completed, failed', enum: ['needs_review', 'completed', 'failed'] },
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
        symbols: { type: 'array', items: { type: 'string' }, description: 'List of ticker symbols e.g. ["AAPL", "NVDA"]' },
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
        days: { type: 'number', description: 'Number of calendar days of history (default 30)' },
      },
      required: ['symbol'],
    },
  },
];

/**
 * Map LLM tool name (underscore format) to executeAgentTool dot-format names.
 */
function llmToolNameToAgentTool(name) {
  return name.replace(/_/g, '.').replace(/\.list$/, 's.list').replace(/\.get$/, '.get');
}

/**
 * Execute a single tool call from LLM and return the result.
 */
async function executeLLMToolCall(toolName, toolInput) {
  const dotName = (() => {
    switch (toolName) {
      case 'strategy_catalog_list': return 'strategy.catalog.list';
      case 'backtest_summary_get': return 'backtest.summary.get';
      case 'backtest_runs_list': return 'backtest.runs.list';
      case 'risk_events_list': return 'risk.events.list';
      case 'execution_plans_list': return 'execution.plans.list';
      case 'market_quotes_get': return 'market.quotes.get';
      case 'market_history_get': return 'market.history.get';
      default: return toolName;
    }
  })();

  return executeAgentTool({ tool: dotName, args: toolInput || {} });
}

/**
 * Serialize tool results for LLM context (keep it concise).
 */
function serializeToolResult(result) {
  if (!result.ok) return `Error: ${result.summary}`;
  const data = result.data || {};
  return JSON.stringify(data, null, 2).slice(0, 3000);
}

/**
 * Build the initial analysis prompt with intent context.
 */
function buildAnalysisPrompt(intent, dailyBias) {
  const biasNote = dailyBias?.length
    ? `\n\nActive daily bias instructions:\n${dailyBias.map((b) => `- ${b.body}`).join('\n')}`
    : '';

  return `Analyze the user's trading request and provide actionable recommendations.

User's intent: ${intent.summary}
Intent kind: ${intent.kind}
${intent.extractedStrategy ? `Strategy description: ${intent.extractedStrategy.description}` : ''}
${intent.extractedTrade ? `Requested trade: ${intent.extractedTrade.side} ${intent.extractedTrade.symbol || 'unspecified'}` : ''}
${biasNote}

Please use the available tools to gather relevant data, then provide your analysis in the required JSON format.`;
}

/**
 * Rule-based fallback narrative when LLM is unavailable.
 */
function buildFallbackNarrative(intent, toolResults = []) {
  const resultMap = Object.fromEntries(toolResults.map((r) => [r.tool, r]));
  const strategies = resultMap['strategy.catalog.list']?.data?.strategies || [];
  const backtestSummary = resultMap['backtest.summary.get']?.data || {};
  const riskEvents = resultMap['risk.events.list']?.data?.events || [];
  const executionPlans = resultMap['execution.plans.list']?.data?.plans || [];

  const elevatedRisk = riskEvents.some((e) => e.status === 'risk-off' || e.status === 'attention');
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

/**
 * Run the LLM tool-use loop: gather data → analyze → produce structured report.
 * Max 5 tool call rounds to prevent runaway loops.
 */
async function runLLMAnalysisLoop(intent, dailyBias, sessionId) {
  const llm = createLLMProvider();
  if (!llm) return null;

  const messages = [
    { role: 'user', content: buildAnalysisPrompt(intent, dailyBias) },
  ];

  const toolCallLog = [];
  const MAX_ROUNDS = 5;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const response = await llm.chatWithTools(messages, LLM_TOOLS, {
      systemPrompt: ANALYSIS_SYSTEM_PROMPT,
      maxTokens: 4096,
      temperature: 0.2,
    });

    if (!response.ok) {
      console.error('[analysis-service] LLM error in round', round, response.error);
      return null;
    }

    // If LLM has tool calls, execute them and continue
    if (response.stopReason === 'tool_use' && response.toolCalls?.length > 0) {
      // Add assistant message with tool calls
      const assistantContent = [];
      if (response.content) {
        assistantContent.push({ type: 'text', text: response.content });
      }
      for (const tc of response.toolCalls) {
        assistantContent.push({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.input });
      }
      messages.push({ role: 'assistant', content: assistantContent });

      // Execute all tool calls and collect results
      const toolResultContent = [];
      for (const tc of response.toolCalls) {
        const result = await executeLLMToolCall(tc.name, tc.input);
        toolCallLog.push({ tool: tc.name, input: tc.input, result });

        toolResultContent.push({
          type: 'tool_result',
          tool_use_id: tc.id,
          content: serializeToolResult(result),
        });
      }
      messages.push({ role: 'user', content: toolResultContent });
      continue;
    }

    // LLM has stopped using tools — parse the final JSON response
    const finalContent = response.content?.trim() || '';
    try {
      // Handle markdown code blocks if LLM wraps JSON in ```
      const jsonStr = finalContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      const parsed = JSON.parse(jsonStr);
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
    } catch (parseErr) {
      console.error('[analysis-service] Failed to parse LLM JSON response:', parseErr.message);
      console.error('[analysis-service] Raw content:', finalContent.slice(0, 500));
      return null;
    }
  }

  console.error('[analysis-service] Exceeded max tool call rounds');
  return null;
}

export async function runAgentAnalysis(payload = {}) {
  const planned = payload.planId
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

  // Mark session and plan as running
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
    steps: plan.steps.map((s) => ({ ...s, status: s.toolName ? 'running' : s.status })),
  });

  // Load daily bias instructions
  const dailyBias = listActiveAgentInstructions({ sessionId: session.id, kind: 'daily_bias' });

  // Run LLM analysis loop (with tool calls)
  let analysisResult = await runLLMAnalysisLoop(intent, dailyBias, session.id);

  // Fallback: gather tool data the old way and use rule-based narrative
  const toolResults = [];
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

    for (const step of plan.steps) {
      if (!step.toolName) continue;
      const args = step.toolName === 'risk.events.list' ? { limit: 12 }
        : step.toolName === 'execution.plans.list' ? { limit: 12 }
        : step.toolName === 'backtest.runs.list' && intent.kind === 'request_backtest_review' ? { status: 'needs_review' }
        : {};
      const result = await executeAgentTool({ tool: step.toolName, args });
      toolResults.push(result);
    }

    analysisResult = {
      narrative: buildFallbackNarrative(intent, toolResults),
      toolCallLog: toolResults.map((r) => ({ tool: r.tool, input: {}, result: r })),
    };
  }

  const { narrative, toolCallLog } = analysisResult;

  // Build tool call records for storage
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

  // Mark steps as completed
  const finalizedSteps = plan.steps.map((step) => ({
    ...step,
    status: 'completed',
    outputSummary: step.kind === 'explain' ? narrative.thesis
      : step.kind === 'request_action' ? narrative.recommendedNextStep
      : llmToolCalls.find((tc) => tc.tool === step.toolName)?.summary || 'Completed.',
  }));

  const planStatus = 'completed';
  const runStatus = 'completed';
  const completedAt = new Date().toISOString();

  // Build the full explanation object (compatible with existing UI)
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
    status: runStatus,
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
    status: planStatus,
    steps: finalizedSteps,
    metadata: { latestAnalysisRunId: run.id },
  });
  const updatedSession = controlPlaneRuntime.updateAgentSession(session.id, {
    status: 'completed',
    latestAnalysisRunId: run.id,
    metadata: { latestAnalysisCompletedAt: completedAt },
  });

  // Record the main assistant response message
  controlPlaneRuntime.recordAgentSessionMessage({
    sessionId: session.id,
    role: 'assistant',
    kind: 'analysis_result',
    title: narrative.thesis,
    body: [
      narrative.thesis,
      ...(narrative.rationale || []),
      ...(narrative.warnings || []),
      narrative.recommendedNextStep ? `Next: ${narrative.recommendedNextStep}` : '',
    ].filter(Boolean).join(' '),
    requestedBy: payload.requestedBy || session.requestedBy || 'agent',
    metadata: {
      agentPlanId: plan.id,
      agentAnalysisRunId: run.id,
      status: runStatus,
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
