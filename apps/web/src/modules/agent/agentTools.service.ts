import { fetchJson, jsonHeaders } from '../../app/api/http.ts';
import type { AgentToolDefinition, AgentToolExecutionResult } from '@shared-types/trading.ts';

export type AgentWorkbenchPayload = {
  ok: boolean;
  asOf: string;
  summary: {
    sessions: number;
    completedSessions: number;
    runningSessions: number;
    failedAnalyses: number;
    pendingActionRequests: number;
    latestUpdatedAt: string;
  };
  lanes: Array<{
    key: string;
    title: string;
    status: string;
    detail: string;
    primaryCount: number;
    secondaryCount: number;
    updatedAt: string;
  }>;
  runbook: Array<{
    key: string;
    priority: string;
    title: string;
    detail: string;
    count: number;
  }>;
  queues: {
    pendingActionRequests: Array<Record<string, unknown>>;
    recentSessions: Array<Record<string, unknown>>;
    recentAnalysisRuns: Array<Record<string, unknown>>;
  };
  recentExplanations: Array<{
    sessionId: string;
    analysisRunId: string;
    thesis: string;
    summary: string;
    recommendedNextStep: string;
    warningCount: number;
    createdAt: string;
  }>;
  operatorTimeline: Array<{
    lane: string;
    title: string;
    detail: string;
    actor: string;
    at: string;
  }>;
};

export type AgentSessionDetailPayload = {
  ok: boolean;
  session: {
    id: string;
    status: string;
    title: string;
    prompt: string;
    requestedBy: string;
    latestIntent: {
      kind: string;
      summary: string;
      targetType: string;
      targetId: string;
      urgency: string;
      requiresApproval: boolean;
      requestedMode: string;
    };
    latestPlanId: string;
    latestAnalysisRunId: string;
    latestActionRequestId: string;
  };
  latestPlan: {
    id: string;
    status: string;
    summary: string;
    requiresApproval: boolean;
    steps: Array<{
      id: string;
      kind: string;
      title: string;
      status: string;
      toolName: string;
      description: string;
      outputSummary: string;
    }>;
  } | null;
  latestAnalysisRun: {
    id: string;
    status: string;
    summary: string;
    conclusion: string;
    toolCalls: Array<{
      tool: string;
      status: string;
      summary: string;
    }>;
    explanation: {
      thesis: string;
      rationale: string[];
      warnings: string[];
      recommendedNextStep: string;
    };
    evidence: Array<{
      id: string;
      title: string;
      summary: string;
      source: string;
    }>;
  } | null;
  linkedRequests: Array<Record<string, unknown>>;
  linkedNotifications: Array<Record<string, unknown>>;
  linkedOperatorActions: Array<Record<string, unknown>>;
  timeline: Array<{
    id: string;
    lane: string;
    title: string;
    detail: string;
    status: string;
    actor: string;
    at: string;
  }>;
};

export type AgentAnalysisRunPayload = {
  ok: boolean;
  session: AgentSessionDetailPayload['session'];
  intent: {
    kind: string;
    summary: string;
    targetType: string;
    targetId: string;
    urgency: string;
    requiresApproval: boolean;
    requestedMode: string;
  };
  plan: NonNullable<AgentSessionDetailPayload['latestPlan']>;
  run: NonNullable<AgentSessionDetailPayload['latestAnalysisRun']>;
};

export async function fetchAgentTools(): Promise<{ ok: boolean; tools: AgentToolDefinition[] }> {
  return fetchJson('/api/agent/tools', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
}

export async function executeAgentTool(payload: {
  tool: string;
  args?: Record<string, unknown>;
}): Promise<AgentToolExecutionResult> {
  return fetchJson('/api/agent/tools/execute', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function fetchAgentWorkbench(): Promise<AgentWorkbenchPayload> {
  return fetchJson('/api/agent/workbench', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
}

export async function fetchAgentSessionDetail(sessionId: string): Promise<AgentSessionDetailPayload> {
  return fetchJson(`/api/agent/sessions/${sessionId}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
}

export async function runAgentAnalysis(payload: {
  prompt: string;
  requestedBy?: string;
}): Promise<AgentAnalysisRunPayload> {
  return fetchJson('/api/agent/analysis-runs', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}
