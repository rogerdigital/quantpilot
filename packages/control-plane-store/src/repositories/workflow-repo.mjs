import { createWorkflowRunEntry, trimAndSave } from '../shared.mjs';

const FILENAME = 'workflow-runs.json';

export function createWorkflowRepository(store) {
  return {
    listWorkflowRuns(limit = 50) {
      return store.readCollection(FILENAME).slice(0, limit);
    },
    getWorkflowRun(workflowRunId) {
      return store.readCollection(FILENAME).find((item) => item.id === workflowRunId) || null;
    },
    appendWorkflowRun(payload) {
      const workflows = store.readCollection(FILENAME);
      const entry = createWorkflowRunEntry(payload);
      workflows.unshift(entry);
      trimAndSave(store, FILENAME, workflows, 120);
      return entry;
    },
    updateWorkflowRun(workflowRunId, patch) {
      const workflows = store.readCollection(FILENAME);
      const index = workflows.findIndex((item) => item.id === workflowRunId);
      if (index === -1) {
        return null;
      }
      const current = workflows[index];
      const next = {
        ...current,
        ...patch,
        steps: Array.isArray(patch.steps) ? patch.steps : current.steps,
        result: patch.result === undefined ? current.result : patch.result,
        updatedAt: patch.updatedAt || new Date().toISOString(),
      };
      workflows[index] = next;
      trimAndSave(store, FILENAME, workflows, 120);
      return next;
    },
  };
}
