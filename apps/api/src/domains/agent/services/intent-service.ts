import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.js';
import { createLLMProvider } from '../../../../../../packages/llm-provider/src/index.js';
import { INTENT_SYSTEM_PROMPT } from './prompts.js';

type ExtractedStrategy = {
  description: string;
  symbols: string[];
  style: string;
};

type ExtractedTrade = {
  symbol: string;
  side: string;
  sizeHint: string;
};

export type AgentIntent = {
  kind: string;
  summary: string;
  targetType: string;
  targetId: string;
  extractedStrategy: ExtractedStrategy | null;
  extractedTrade: ExtractedTrade | null;
  urgency: string;
  requiresApproval: boolean;
  requestedMode: string;
  confidence: number;
  metadata: Record<string, unknown>;
};

type ParseAgentIntentPayload = {
  prompt?: string;
  requestedBy?: string;
  sessionId?: string;
  targetId?: string;
};

function normalizePrompt(prompt = ''): string {
  return String(prompt || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function createSessionTitle(prompt: string): string {
  const trimmed = normalizePrompt(prompt);
  if (!trimmed) return 'Agent collaboration session';
  return trimmed.length > 72 ? `${trimmed.slice(0, 69)}...` : trimmed;
}

function inferIntentFromRules(prompt: string, explicitTargetId = ''): AgentIntent {
  const normalized = prompt.toLowerCase();
  const urgency = /(urgent|immediately|asap|now|立刻|马上|尽快)/.test(normalized)
    ? 'high'
    : /(today|tomorrow|before open|开盘前|盘前)/.test(normalized)
      ? 'normal'
      : 'low';

  if (/(buy|sell|购买|卖出|下单|买入|买|卖)/.test(normalized)) {
    return {
      kind: 'execute_trade',
      summary: 'User wants to execute a trade.',
      targetType: 'symbol',
      targetId: explicitTargetId || '',
      extractedStrategy: null,
      extractedTrade: {
        symbol: '',
        side: /sell|卖/.test(normalized) ? 'sell' : 'buy',
        sizeHint: 'unspecified',
      },
      urgency,
      requiresApproval: false,
      requestedMode: 'execute_paper',
      confidence: 0.6,
      metadata: { source: 'rule_fallback' },
    };
  }

  if (
    /(执行计划|准备执行|execution prep|prepare execution|execution plan|execution-prep|exec prep)/.test(
      normalized
    )
  ) {
    const requiresApproval = /(审批|approval|approve|需要审批|is.*approval|confirm.*approval)/.test(
      normalized
    );
    const idMatch = prompt.match(/[\w-]{4,}(?:[-.][\w-]+)+/);
    const targetId = explicitTargetId || (idMatch ? idMatch[0] : '');
    return {
      kind: 'request_execution_prep',
      summary: 'Prepare an execution plan for a strategy.',
      targetType: 'strategy',
      targetId,
      extractedStrategy: null,
      extractedTrade: null,
      urgency,
      requiresApproval,
      requestedMode: requiresApproval ? 'request_live' : 'execute_paper',
      confidence: 0.75,
      metadata: { source: 'rule_fallback' },
    };
  }

  if (
    /(策略|strategy|构建|build|设计|create.*strat|momentum|value|mean reversion)/.test(normalized)
  ) {
    return {
      kind: 'build_strategy',
      summary: 'User wants to build a trading strategy.',
      targetType: 'unknown',
      targetId: explicitTargetId || '',
      extractedStrategy: { description: prompt, symbols: [], style: 'general' },
      extractedTrade: null,
      urgency,
      requiresApproval: false,
      requestedMode: 'read_only',
      confidence: 0.6,
      metadata: { source: 'rule_fallback' },
    };
  }

  if (/(回测|backtest|research|评估|evaluation|review run|review result)/.test(normalized)) {
    return {
      kind: 'request_backtest_review',
      summary: 'Review research and backtest posture.',
      targetType: 'backtest_run',
      targetId: explicitTargetId || '',
      extractedStrategy: null,
      extractedTrade: null,
      urgency,
      requiresApproval: false,
      requestedMode: 'read_only',
      confidence: 0.7,
      metadata: { source: 'rule_fallback' },
    };
  }

  if (/(风控|risk|drawdown|回撤|compliance|explain risk|风险)/.test(normalized)) {
    return {
      kind: 'request_risk_explanation',
      summary: 'Explain the current risk posture.',
      targetType: 'unknown',
      targetId: explicitTargetId || '',
      extractedStrategy: null,
      extractedTrade: null,
      urgency,
      requiresApproval: false,
      requestedMode: 'read_only',
      confidence: 0.7,
      metadata: { source: 'rule_fallback' },
    };
  }

  return {
    kind: 'read_only_analysis',
    summary: 'Read current platform context and summarize findings.',
    targetType: 'unknown',
    targetId: explicitTargetId || '',
    extractedStrategy: null,
    extractedTrade: null,
    urgency,
    requiresApproval: false,
    requestedMode: 'read_only',
    confidence: 0.4,
    metadata: { source: 'rule_fallback' },
  };
}

async function inferIntentWithLLM(prompt: string, explicitTargetId = ''): Promise<AgentIntent> {
  const llm = createLLMProvider();
  if (!llm) {
    return inferIntentFromRules(prompt, explicitTargetId);
  }

  const contextNote = explicitTargetId
    ? `\n\nContext: The user has pre-selected target ID: ${explicitTargetId}`
    : '';

  const response = await llm.chat(
    [{ role: 'user', content: `User request: "${prompt}"${contextNote}` }],
    {
      systemPrompt: INTENT_SYSTEM_PROMPT,
      maxTokens: 1024,
      temperature: 0.1,
    }
  );

  if (!response.ok) {
    console.error('[intent-service] LLM error, falling back to rules:', response.error);
    return inferIntentFromRules(prompt, explicitTargetId);
  }

  try {
    const parsed = JSON.parse(response.content.trim()) as Partial<AgentIntent>;
    return {
      kind: parsed.kind || 'read_only_analysis',
      summary: parsed.summary || prompt,
      targetType: parsed.targetType || 'unknown',
      targetId: parsed.targetId || explicitTargetId || '',
      extractedStrategy: parsed.extractedStrategy || null,
      extractedTrade: parsed.extractedTrade || null,
      urgency: parsed.urgency || 'low',
      requiresApproval: Boolean(parsed.requiresApproval),
      requestedMode: parsed.requestedMode || 'read_only',
      confidence: parsed.confidence || 0.8,
      metadata: {
        source: 'llm',
        model: llm.model,
        provider: llm.provider,
      },
    };
  } catch (parseErr: unknown) {
    console.error(
      '[intent-service] JSON parse error, falling back to rules:',
      parseErr instanceof Error ? parseErr.message : 'unknown_error'
    );
    return inferIntentFromRules(prompt, explicitTargetId);
  }
}

export async function parseAgentIntent(payload: ParseAgentIntentPayload = {}) {
  const prompt = normalizePrompt(payload.prompt);
  if (!prompt) {
    return {
      ok: false,
      error: 'missing_prompt',
      message: 'Agent intent parsing requires a non-empty prompt.',
    };
  }

  const requestedBy = payload.requestedBy || 'operator';
  const existingSession = payload.sessionId
    ? controlPlaneRuntime.getAgentSession(payload.sessionId)
    : null;
  const intent = await inferIntentWithLLM(prompt, payload.targetId || '');

  const session = existingSession
    ? controlPlaneRuntime.updateAgentSession(existingSession.id, {
        prompt,
        requestedBy,
        title: existingSession.title || createSessionTitle(prompt),
        status: 'ready',
        latestIntent: intent,
        metadata: {
          intentParsedAt: new Date().toISOString(),
          intentSource: intent.metadata?.source || 'unknown',
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
          intentSource: intent.metadata?.source || 'unknown',
        },
      });

  controlPlaneRuntime.recordAgentSessionMessage({
    sessionId: session.id,
    role: 'user',
    kind: 'prompt',
    title: 'Analysis request',
    body: prompt,
    requestedBy,
    metadata: { source: 'agent-intent-parser' },
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
      confidence: intent.confidence,
      intentSource: intent.metadata?.source,
    },
  });

  return { ok: true, session, intent };
}
