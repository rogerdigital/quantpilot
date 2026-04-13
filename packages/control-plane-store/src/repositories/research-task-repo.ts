// @ts-nocheck
import { createResearchTaskEntry, trimAndSave } from '../shared.js';

const FILENAME = 'research-tasks.json';

function parseTimestamp(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSince(value) {
  if (!value) return 0;
  return parseTimestamp(value);
}

export function createResearchTaskRepository(store) {
  function readTasks() {
    return store.readCollection(FILENAME).map((item) => createResearchTaskEntry(item));
  }

  function writeTasks(tasks) {
    trimAndSave(
      store,
      FILENAME,
      tasks.map((item) => createResearchTaskEntry(item)),
      400
    );
  }

  function findTaskIndex(tasks, payload = {}) {
    if (payload.id) {
      const byId = tasks.findIndex((item) => item.id === payload.id);
      if (byId !== -1) return byId;
    }
    if (payload.workflowRunId) {
      const byWorkflow = tasks.findIndex((item) => item.workflowRunId === payload.workflowRunId);
      if (byWorkflow !== -1) return byWorkflow;
    }
    if (payload.runId) {
      const byRun = tasks.findIndex((item) => item.runId === payload.runId);
      if (byRun !== -1) return byRun;
    }
    return -1;
  }

  return {
    listResearchTasks(limit = 100, filter = {}) {
      const sinceMs = normalizeSince(filter.since);
      return readTasks()
        .filter((item) => !filter.taskType || item.taskType === filter.taskType)
        .filter((item) => !filter.status || item.status === filter.status)
        .filter((item) => !filter.strategyId || item.strategyId === filter.strategyId)
        .filter((item) => !filter.workflowRunId || item.workflowRunId === filter.workflowRunId)
        .filter((item) => !filter.runId || item.runId === filter.runId)
        .filter((item) => !sinceMs || parseTimestamp(item.updatedAt || item.createdAt) >= sinceMs)
        .slice(0, limit);
    },
    getResearchTask(taskId) {
      return readTasks().find((item) => item.id === taskId) || null;
    },
    findResearchTaskByWorkflowRunId(workflowRunId) {
      return readTasks().find((item) => item.workflowRunId === workflowRunId) || null;
    },
    findResearchTaskByRunId(runId) {
      return readTasks().find((item) => item.runId === runId) || null;
    },
    appendResearchTask(payload = {}) {
      const tasks = readTasks();
      const entry = createResearchTaskEntry(payload);
      tasks.unshift(entry);
      writeTasks(tasks);
      return entry;
    },
    updateResearchTask(taskId, patch = {}) {
      const tasks = readTasks();
      const index = tasks.findIndex((item) => item.id === taskId);
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
    upsertResearchTask(payload = {}) {
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
