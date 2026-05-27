import { createAgentAnalysisRunEntry, matchesScopeFilter, trimAndSave } from '../shared.js';

const FILENAME = 'agent-analysis-runs.json';

export function createAgentAnalysisRunRepository(store: any) {
  return {
    listAgentAnalysisRuns(limit = 50, filter: any = {}) {
      return store
        .readCollection(FILENAME)
        .filter((item: any) => {
          if (!matchesScopeFilter(item, filter)) return false;
          if (filter.status && item.status !== filter.status) return false;
          if (filter.sessionId && item.sessionId !== filter.sessionId) return false;
          if (filter.planId && item.planId !== filter.planId) return false;
          return true;
        })
        .slice(0, limit);
    },
    getAgentAnalysisRun(runId: any) {
      return store.readCollection(FILENAME).find((item: any) => item.id === runId) || null;
    },
    getLatestAgentAnalysisRunForSession(sessionId: any) {
      return (
        store.readCollection(FILENAME).find((item: any) => item.sessionId === sessionId) || null
      );
    },
    appendAgentAnalysisRun(payload: any = {}) {
      const runs = store.readCollection(FILENAME);
      const entry = createAgentAnalysisRunEntry(payload);
      runs.unshift(entry);
      trimAndSave(store, FILENAME, runs, 200);
      return entry;
    },
    updateAgentAnalysisRun(runId: any, patch: any = {}) {
      const runs = store.readCollection(FILENAME);
      const index = runs.findIndex((item: any) => item.id === runId);
      if (index === -1) return null;
      const current = runs[index];
      const next = {
        ...current,
        ...patch,
        toolCalls: Array.isArray(patch.toolCalls) ? patch.toolCalls : current.toolCalls,
        evidence: Array.isArray(patch.evidence) ? patch.evidence : current.evidence,
        explanation: patch.explanation
          ? {
              ...current.explanation,
              ...patch.explanation,
            }
          : current.explanation,
        metadata: patch.metadata ? { ...current.metadata, ...patch.metadata } : current.metadata,
        updatedAt: patch.updatedAt || new Date().toISOString(),
      };
      runs[index] = next;
      trimAndSave(store, FILENAME, runs, 200);
      return next;
    },
  };
}
