import { controlPlaneContext } from '../../control-plane-store/src/context.mjs';

export function createControlPlaneRuntime(context = controlPlaneContext) {
  return {
    listAuditRecords(limit = 50) {
      return context.audit.listAuditRecords(limit);
    },
    appendAuditRecord(record) {
      return context.audit.appendAuditRecord(record);
    },
    listCycleRecords(limit = 30) {
      return context.cycles.listCycleRecords(limit);
    },
    appendCycleRecord(payload) {
      return context.cycles.appendCycleRecord(payload);
    },
    recordCycleRun(payload) {
      const entry = context.cycles.appendCycleRecord(payload);

      context.audit.appendAuditRecord({
        type: 'cycle',
        actor: 'task-orchestrator',
        title: `Cycle ${entry.cycle} completed`,
        detail: entry.decisionSummary || 'Cycle completed without a new priority decision.',
        metadata: {
          mode: entry.mode,
          riskLevel: entry.riskLevel,
          pendingApprovals: entry.pendingApprovals,
          liveIntentCount: entry.liveIntentCount,
        },
      });

      if (entry.pendingApprovals > 0) {
        context.notifications.enqueueNotification({
          level: 'warn',
          source: 'task-orchestrator',
          title: `Cycle ${entry.cycle} requires approval`,
          message: `${entry.pendingApprovals} live actions are waiting for review.`,
          metadata: { cycle: entry.cycle },
        });
      }

      if (!entry.brokerConnected || !entry.marketConnected) {
        context.notifications.enqueueNotification({
          level: 'warn',
          source: 'task-orchestrator',
          title: `Cycle ${entry.cycle} degraded`,
          message: 'One or more platform integrations are disconnected or running in fallback mode.',
          metadata: {
            cycle: entry.cycle,
            brokerConnected: entry.brokerConnected,
            marketConnected: entry.marketConnected,
          },
        });
      }

      return entry;
    },
    listOperatorActions(limit = 50) {
      return context.operatorActions.listOperatorActions(limit);
    },
    appendOperatorAction(payload) {
      return context.operatorActions.appendOperatorAction(payload);
    },
    recordOperatorAction(payload) {
      const action = context.operatorActions.appendOperatorAction(payload);

      context.audit.appendAuditRecord({
        type: action.type,
        actor: action.actor,
        title: action.title,
        detail: action.detail,
        metadata: { symbol: action.symbol, level: action.level },
      });

      context.notifications.enqueueNotification({
        level: action.level,
        source: 'control-plane',
        title: action.title,
        message: action.detail,
        metadata: { symbol: action.symbol, type: action.type },
      });

      return action;
    },
    listNotifications(limit = 50) {
      return context.notifications.listNotifications(limit);
    },
    appendNotification(event) {
      return context.notifications.appendNotification(event);
    },
    enqueueNotification(event) {
      return context.notifications.enqueueNotification(event);
    },
    listNotificationJobs(limit = 50) {
      return context.notifications.listNotificationJobs(limit);
    },
    dispatchPendingNotifications(options = {}) {
      return context.notifications.dispatchPendingNotifications(options);
    },
    listRiskEvents(limit = 50) {
      return context.risk.listRiskEvents(limit);
    },
    appendRiskEvent(event) {
      return context.risk.appendRiskEvent(event);
    },
    enqueueRiskScan(payload) {
      return context.risk.enqueueRiskScan(payload);
    },
    listRiskScanJobs(limit = 50) {
      return context.risk.listRiskScanJobs(limit);
    },
    dispatchPendingRiskScans(options = {}) {
      return context.risk.dispatchPendingRiskScans(options);
    },
    listSchedulerTicks(limit = 50) {
      return context.scheduler.listSchedulerTicks(limit);
    },
    recordSchedulerTick(options = {}) {
      return context.scheduler.recordSchedulerTick(options);
    },
    listWorkflowRuns(limit = 50) {
      return context.workflows.listWorkflowRuns(limit);
    },
    getWorkflowRun(workflowRunId) {
      return context.workflows.getWorkflowRun(workflowRunId);
    },
    startWorkflowRun(payload) {
      return context.workflows.appendWorkflowRun({
        ...payload,
        status: payload.status || 'running',
      });
    },
    completeWorkflowRun(workflowRunId, patch = {}) {
      return context.workflows.updateWorkflowRun(workflowRunId, {
        ...patch,
        status: 'completed',
        completedAt: patch.completedAt || new Date().toISOString(),
      });
    },
    failWorkflowRun(workflowRunId, error, patch = {}) {
      return context.workflows.updateWorkflowRun(workflowRunId, {
        ...patch,
        status: 'failed',
        failedAt: patch.failedAt || new Date().toISOString(),
        error: error || patch.error || null,
      });
    },
  };
}

export const controlPlaneRuntime = createControlPlaneRuntime();
