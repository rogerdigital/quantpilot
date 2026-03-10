import { fetchJson, jsonHeaders } from '../../app/api/http.ts';
import type { AgentToolDefinition, AgentToolExecutionResult } from '@shared-types/trading.ts';

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
