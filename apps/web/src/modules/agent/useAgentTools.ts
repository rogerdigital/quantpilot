import { useEffect, useState } from 'react';
import type { AgentToolDefinition, AgentToolExecutionResult } from '@shared-types/trading.ts';
import { executeAgentTool, fetchAgentTools } from './agentTools.service.ts';

type AgentToolsState = {
  tools: AgentToolDefinition[];
  preview: AgentToolExecutionResult | null;
  loading: boolean;
  error: string;
};

export function useAgentTools() {
  const [state, setState] = useState<AgentToolsState>({
    tools: [],
    preview: null,
    loading: true,
    error: '',
  });

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetchAgentTools(),
      executeAgentTool({ tool: 'backtest.summary.get' }),
    ]).then(([toolList, preview]) => {
      if (cancelled) return;
      setState({
        tools: toolList.tools,
        preview,
        loading: false,
        error: '',
      });
    }).catch((error) => {
      if (cancelled) return;
      setState({
        tools: [],
        preview: null,
        loading: false,
        error: error instanceof Error ? error.message : 'unknown error',
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
