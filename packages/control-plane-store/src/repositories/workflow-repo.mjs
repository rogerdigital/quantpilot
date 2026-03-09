import { createWorkflowRunEntry, trimAndSave } from '../shared.mjs';

const FILENAME = 'workflow-runs.json';

export function createWorkflowRepository(store) {
  return {
    listWorkflowRuns(limit = 50, filter = {}) {
      return store.readCollection(FILENAME)
        .filter((item) => {
          if (filter.status && item.status !== filter.status) return false;
          if (filter.workflowId && item.workflowId !== filter.workflowId) return false;
          return true;
        })
        .slice(0, limit);
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
    releaseScheduledWorkflowRuns(options = {}) {
      const worker = options.worker || 'quantpilot-worker';
      const limit = Number.isFinite(options.limit) ? options.limit : 20;
      const nowIso = options.now || new Date().toISOString();
      const workflows = store.readCollection(FILENAME);
      let releasedCount = 0;

      workflows.forEach((workflow, index) => {
        if (releasedCount >= limit) return;
        if (workflow.status !== 'retry_scheduled') return;
        if ((workflow.nextRunAt || nowIso) > nowIso) return;
        workflows[index] = {
          ...workflow,
          status: 'queued',
          lockedBy: worker,
          lockedAt: nowIso,
          updatedAt: nowIso,
        };
        releasedCount += 1;
      });

      if (releasedCount > 0) {
        trimAndSave(store, FILENAME, workflows, 120);
      }

      return {
        worker,
        releasedCount,
        workflows: workflows.filter((item) => item.lockedBy === worker && item.lockedAt === nowIso).slice(0, limit),
      };
    },
    claimQueuedWorkflowRuns(options = {}) {
      const worker = options.worker || 'quantpilot-worker';
      const limit = Number.isFinite(options.limit) ? options.limit : 10;
      const nowIso = options.now || new Date().toISOString();
      const workflowId = options.workflowId || '';
      const workflows = store.readCollection(FILENAME);
      const claimed = [];

      workflows.forEach((workflow, index) => {
        if (claimed.length >= limit) return;
        if (workflow.status !== 'queued') return;
        if ((workflow.nextRunAt || nowIso) > nowIso) return;
        if (workflowId && workflow.workflowId !== workflowId) return;
        const next = {
          ...workflow,
          status: 'running',
          attempt: Number(workflow.attempt || 0) + 1,
          lockedBy: worker,
          lockedAt: nowIso,
          startedAt: workflow.startedAt || nowIso,
          updatedAt: nowIso,
        };
        workflows[index] = next;
        claimed.push(next);
      });

      if (claimed.length > 0) {
        trimAndSave(store, FILENAME, workflows, 120);
      }

      return {
        worker,
        claimedCount: claimed.length,
        workflows: claimed,
      };
    },
  };
}
