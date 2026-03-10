import type { AgentToolDefinition, AgentToolExecutionResult } from '@shared-types/trading.ts';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    ...init,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchAgentTools(): Promise<{ ok: boolean; tools: AgentToolDefinition[] }> {
  return fetchJson('/api/agent/tools', {
    method: 'GET',
  });
}

export async function executeAgentTool(payload: {
  tool: string;
  args?: Record<string, unknown>;
}): Promise<AgentToolExecutionResult> {
  return fetchJson('/api/agent/tools/execute', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
