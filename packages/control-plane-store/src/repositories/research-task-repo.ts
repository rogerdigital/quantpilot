import { createResearchTaskEntry, trimAndSave } from '../shared.js';

const FILENAME = 'research-tasks.json';

function parseTimestamp(value: any) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSince(value: any) {
  if (!value) return 0;
  return parseTimestamp(value);
}

export function createResearchTaskRepository(store: any) {
  function readTasks() {
    return store.readCollection(FILENAME).map((item: any) => createResearchTaskEntry(item));
  }

  function writeTasks(tasks: any) {
    trimAndSave(
      store,
      FILENAME,
      tasks.map((item: any) => createResearchTaskEntry(item)),
      400
    );
  }

  function findTaskIndex(tasks: any, payload: any = {}) {
    if (payload.id) {
      const byId = tasks.findIndex((item: any) => item.id === payload.id);
      if (byId !== -1) return byId;
    }
    if (payload.workflowRunId) {
      const byWorkflow = tasks.findIndex(
        (item: any) => item.workflowRunId === payload.workflowRunId
      );
      if (byWorkflow !== -1) return byWorkflow;
    }
    if (payload.runId) {
      const byRun = tasks.findIndex((item: any) => item.runId === payload.runId);
      if (byRun !== -1) return byRun;
    }
    return -1;
  }

  return {
    listResearchTasks(limit = 100, filter: any = {}) {
      const sinceMs = normalizeSince(filter.since);
      return readTasks()
        .filter((item: any) => !filter.taskType || item.taskType === filter.taskType)
        .filter((item: any) => !filter.status || item.status === filter.status)
        .filter((item: any) => !filter.strategyId || item.strategyId === filter.strategyId)
        .filter((item: any) => !filter.workflowRunId || item.workflowRunId === filter.workflowRunId)
        .filter((item: any) => !filter.runId || item.runId === filter.runId)
        .filter(
          (item: any) => !sinceMs || parseTimestamp(item.updatedAt || item.createdAt) >= sinceMs
        )
        .slice(0, limit);
    },
    getResearchTask(taskId: any) {
      return readTasks().find((item: any) => item.id === taskId) || null;
    },
    findResearchTaskByWorkflowRunId(workflowRunId: any) {
      return readTasks().find((item: any) => item.workflowRunId === workflowRunId) || null;
    },
    findResearchTaskByRunId(runId: any) {
      return readTasks().find((item: any) => item.runId === runId) || null;
    },
    appendResearchTask(payload: any = {}) {
      const tasks = readTasks();
      const entry = createResearchTaskEntry(payload);
      tasks.unshift(entry);
      writeTasks(tasks);
      return entry;
    },
    updateResearchTask(taskId: any, patch: any = {}) {
      const tasks = readTasks();
      const index = tasks.findIndex((item: any) => item.id === taskId);
      if (index === -1) return null;
      const current = tasks[index];
      tasks[index] = createResearchTaskEntry({
        ...current,
        ...patch,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: patch.updatedAt || new Date().toISOString(),
        metadata: patch.metadata ? { ...current.metadata, ...patch.metadata } : current.metadata,
      });
      writeTasks(tasks);
      return tasks[index];
    },
    upsertResearchTask(payload: any = {}) {
      const tasks = readTasks();
      const index = findTaskIndex(tasks, payload);
      if (index === -1) {
        const entry = createResearchTaskEntry(payload);
        tasks.unshift(entry);
        writeTasks(tasks);
        return entry;
      }
      const current = tasks[index];
      tasks[index] = createResearchTaskEntry({
        ...current,
        ...payload,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: payload.updatedAt || new Date().toISOString(),
        metadata: payload.metadata
          ? { ...current.metadata, ...payload.metadata }
          : current.metadata,
      });
      writeTasks(tasks);
      return tasks[index];
    },
  };
}
