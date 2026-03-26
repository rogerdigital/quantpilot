import { useEffect, useState } from 'react';
import { ApiPermissionError } from '../../app/api/http.ts';
import { formatMissingPermission } from '../permissions/permissionCopy.ts';
import type { AgentToolDefinition } from '@shared-types/trading.ts';
import { fetchAgentSessionDetail, fetchAgentTools, fetchAgentWorkbench, runAgentAnalysis, type AgentSessionDetailPayload, type AgentWorkbenchPayload } from './agentTools.service.ts';

type AgentToolsState = {
  tools: AgentToolDefinition[];
  workbench: AgentWorkbenchPayload | null;
  sessionDetail: AgentSessionDetailPayload | null;
  selectedSessionId: string;
  loading: boolean;
  running: boolean;
  error: string;
};

export function useAgentTools() {
  const [state, setState] = useState<AgentToolsState>({
    tools: [],
    workbench: null,
    sessionDetail: null,
    selectedSessionId: '',
    loading: true,
    running: false,
    error: '',
  });

  const load = async (sessionId = '') => {
    const [toolList, workbench] = await Promise.all([
      fetchAgentTools(),
      fetchAgentWorkbench(),
    ]);
    const nextSessionId = sessionId
      || state.selectedSessionId
      || String(workbench.queues.recentSessions[0]?.id || '');
    const detail = nextSessionId ? await fetchAgentSessionDetail(nextSessionId) : null;

    setState((current) => ({
      ...current,
      tools: toolList.tools,
      workbench,
      sessionDetail: detail,
      selectedSessionId: nextSessionId,
      loading: false,
      error: '',
    }));
  };

  useEffect(() => {
    let cancelled = false;

    setState((current) => ({
      ...current,
      loading: true,
    }));

    load().catch((error) => {
      if (cancelled) return;
      setState((current) => ({
        ...current,
        tools: [],
        workbench: null,
        sessionDetail: null,
        loading: false,
        error: error instanceof ApiPermissionError && error.missingPermission
          ? `${formatMissingPermission('en', error.missingPermission)}.`
          : (error instanceof Error ? error.message : 'unknown error'),
      }));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectSession = async (sessionId: string) => {
    if (!sessionId) return;
    setState((current) => ({
      ...current,
      selectedSessionId: sessionId,
      loading: true,
    }));
    try {
      const detail = await fetchAgentSessionDetail(sessionId);
      setState((current) => ({
        ...current,
        sessionDetail: detail,
        selectedSessionId: sessionId,
        loading: false,
        error: '',
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : 'unknown error',
      }));
    }
  };

  const runPrompt = async (prompt: string, requestedBy?: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return null;

    setState((current) => ({
      ...current,
      running: true,
      error: '',
    }));

    try {
      const result = await runAgentAnalysis({
        prompt: trimmed,
        requestedBy,
      });
      await load(result.session.id);
      setState((current) => ({
        ...current,
        running: false,
      }));
      return result;
    } catch (error) {
      setState((current) => ({
        ...current,
        running: false,
        error: error instanceof ApiPermissionError && error.missingPermission
          ? `${formatMissingPermission('en', error.missingPermission)}.`
          : (error instanceof Error ? error.message : 'unknown error'),
      }));
      return null;
    }
  };

  return {
    ...state,
    refresh: () => load(state.selectedSessionId),
    selectSession,
    runPrompt,
  };
}
