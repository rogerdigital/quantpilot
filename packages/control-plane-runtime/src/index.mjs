import { controlPlaneContext } from '../../control-plane-store/src/context.mjs';

export function createControlPlaneRuntime(context = controlPlaneContext) {
  function fanoutWorkflowEvent(level, title, message, metadata = {}) {
    context.audit.appendAuditRecord({
      type: 'workflow',
      actor: metadata.actor || 'task-orchestrator',
      title,
      detail: message,
      metadata,
    });

    context.notifications.enqueueNotification({
      level,
      source: 'workflow-control',
      title,
      message,
      metadata,
    });
  }

  function syncExecutionPlanForWorkflow(workflowRunId, patch = {}) {
    if (!workflowRunId || !context.executionPlans?.findExecutionPlanByWorkflowRunId) return null;
    const existing = context.executionPlans.findExecutionPlanByWorkflowRunId(workflowRunId);
    if (!existing) return null;
    return context.executionPlans.updateExecutionPlan(existing.id, patch);
  }

  return {
    listAgentActionRequests(limit = 50, filter = {}) {
      return context.agentActionRequests.listAgentActionRequests(limit, filter);
    },
    getAgentActionRequest(requestId) {
      return context.agentActionRequests.getAgentActionRequest(requestId);
    },
    appendAgentActionRequest(payload) {
      return context.agentActionRequests.appendAgentActionRequest(payload);
    },
    recordAgentActionRequest(payload) {
      const request = context.agentActionRequests.appendAgentActionRequest(payload);

      context.audit.appendAuditRecord({
        type: 'agent-action-request',
        actor: payload.requestedBy || 'agent',
        title: `Agent requested ${request.requestType}`,
        detail: request.summary || 'Agent action request submitted.',
        metadata: {
          targetId: request.targetId,
          approvalState: request.approvalState,
          riskStatus: request.riskStatus,
          workflowRunId: request.workflowRunId,
        },
      });

      context.notifications.enqueueNotification({
        level: 'warn',
        source: 'agent-control',
        title: `Agent action request submitted`,
        message: request.summary || `${request.requestType} request is waiting for operator review.`,
        metadata: {
          agentActionRequestId: request.id,
          requestType: request.requestType,
          targetId: request.targetId,
        },
      });

      return request;
    },
    updateAgentActionRequest(requestId, patch = {}) {
      return context.agentActionRequests.updateAgentActionRequest(requestId, patch);
    },
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
    listExecutionPlans(limit = 50, filter = {}) {
      return context.executionPlans.listExecutionPlans(limit, filter);
    },
    getExecutionPlan(planId) {
      return context.executionPlans.getExecutionPlan(planId);
    },
    findExecutionPlanByWorkflowRunId(workflowRunId) {
      return context.executionPlans.findExecutionPlanByWorkflowRunId(workflowRunId);
    },
    appendExecutionPlan(payload) {
      return context.executionPlans.appendExecutionPlan(payload);
    },
    recordExecutionPlan(payload) {
      const plan = context.executionPlans.appendExecutionPlan(payload);

      context.audit.appendAuditRecord({
        type: 'execution-plan',
        actor: payload.actor || 'strategy-worker',
        title: `Execution plan created for ${plan.strategyName}`,
        detail: plan.summary || 'Execution plan generated.',
        metadata: {
          strategyId: plan.strategyId,
          mode: plan.mode,
          riskStatus: plan.riskStatus,
          approvalState: plan.approvalState,
          orderCount: plan.orderCount,
        },
      });

      context.notifications.enqueueNotification({
        level: plan.riskStatus === 'approved' ? 'info' : (plan.riskStatus === 'blocked' ? 'critical' : 'warn'),
        source: 'execution-planner',
        title: `Execution plan ${plan.riskStatus}`,
        message: plan.summary || `${plan.strategyName} generated an execution plan.`,
        metadata: {
          executionPlanId: plan.id,
          strategyId: plan.strategyId,
          workflowRunId: plan.workflowRunId,
        },
      });

      return plan;
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
    getUserAccount() {
      return context.userAccount.getUserAccount();
    },
    getUserProfile() {
      return context.userAccount.getUserProfile();
    },
    updateUserProfile(patch = {}) {
      return context.userAccount.updateUserProfile(patch);
    },
    getUserPreferences() {
      return context.userAccount.getUserPreferences();
    },
    updateUserPreferences(patch = {}) {
      return context.userAccount.updateUserPreferences(patch);
    },
    listBrokerBindings() {
      return context.userAccount.listBrokerBindings();
    },
    upsertBrokerBinding(payload = {}) {
      return context.userAccount.upsertBrokerBinding(payload);
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
        attempt: Number(payload.attempt || 1),
        startedAt: payload.startedAt || new Date().toISOString(),
        nextRunAt: payload.nextRunAt || new Date().toISOString(),
      });
    },
    enqueueWorkflowRun(payload) {
      return context.workflows.appendWorkflowRun({
        ...payload,
        status: payload.status || 'queued',
        startedAt: '',
        nextRunAt: payload.nextRunAt || new Date().toISOString(),
      });
    },
    completeWorkflowRun(workflowRunId, patch = {}) {
      return context.workflows.updateWorkflowRun(workflowRunId, {
        ...patch,
        status: 'completed',
        completedAt: patch.completedAt || new Date().toISOString(),
        lockedBy: '',
        lockedAt: '',
      });
    },
    failWorkflowRun(workflowRunId, error, patch = {}) {
      const current = context.workflows.getWorkflowRun(workflowRunId);
      const nextAttempt = Number(current?.attempt || 1);
      const maxAttempts = Number(current?.maxAttempts || patch.maxAttempts || 3);
      const canRetry = patch.retryable !== false && nextAttempt < maxAttempts;
      const failedAt = patch.failedAt || new Date().toISOString();
      const workflow = context.workflows.updateWorkflowRun(workflowRunId, {
        ...patch,
        status: canRetry ? 'retry_scheduled' : 'failed',
        failedAt,
        nextRunAt: canRetry ? (patch.nextRunAt || new Date(Date.now() + 60_000).toISOString()) : (patch.nextRunAt || ''),
        error: error || patch.error || null,
        lockedBy: '',
        lockedAt: '',
      });
      if (workflow) {
        syncExecutionPlanForWorkflow(workflowRunId, {
          status: 'blocked',
          riskStatus: 'blocked',
          summary: canRetry
            ? `Workflow failed and was scheduled for retry: ${workflow.error}`
            : `Workflow failed permanently: ${workflow.error}`,
          metadata: {
            workflowStatus: workflow.status,
            workflowError: workflow.error,
          },
        });
        fanoutWorkflowEvent(
          canRetry ? 'warn' : 'critical',
          canRetry ? `Workflow retry scheduled ${workflow.workflowId}` : `Workflow failed ${workflow.workflowId}`,
          canRetry
            ? `Workflow ${workflow.workflowId} failed and was scheduled for retry.`
            : `Workflow ${workflow.workflowId} failed without remaining retries.`,
          {
            workflowRunId,
            workflowId: workflow.workflowId,
            status: workflow.status,
            actor: workflow.actor,
            error: workflow.error,
            nextRunAt: workflow.nextRunAt,
          }
        );
      }
      return workflow;
    },
    resumeWorkflowRun(workflowRunId, patch = {}) {
      const current = context.workflows.getWorkflowRun(workflowRunId);
      if (!current) return null;
      const workflow = context.workflows.updateWorkflowRun(workflowRunId, {
        ...patch,
        status: 'queued',
        failedAt: '',
        completedAt: '',
        error: null,
        nextRunAt: patch.nextRunAt || new Date().toISOString(),
        lockedBy: '',
        lockedAt: '',
        attempt: Number(current.attempt || 0),
      });
      if (workflow) {
        syncExecutionPlanForWorkflow(workflowRunId, {
          status: 'draft',
          riskStatus: 'review',
          summary: 'Execution workflow was resumed and is waiting to be processed again.',
          metadata: {
            workflowStatus: workflow.status,
          },
        });
        fanoutWorkflowEvent(
          'info',
          `Workflow resumed ${workflow.workflowId}`,
          `Workflow ${workflow.workflowId} was resumed and re-queued.`,
          {
            workflowRunId,
            workflowId: workflow.workflowId,
            status: workflow.status,
            actor: workflow.actor,
          }
        );
      }
      return workflow;
    },
    cancelWorkflowRun(workflowRunId, patch = {}) {
      const workflow = context.workflows.updateWorkflowRun(workflowRunId, {
        ...patch,
        status: 'canceled',
        completedAt: '',
        failedAt: patch.failedAt || new Date().toISOString(),
        lockedBy: '',
        lockedAt: '',
      });
      if (workflow) {
        syncExecutionPlanForWorkflow(workflowRunId, {
          status: 'blocked',
          riskStatus: 'blocked',
          summary: 'Execution workflow was canceled by an operator or control-plane action.',
          metadata: {
            workflowStatus: workflow.status,
          },
        });
        fanoutWorkflowEvent(
          'warn',
          `Workflow canceled ${workflow.workflowId}`,
          `Workflow ${workflow.workflowId} was canceled.`,
          {
            workflowRunId,
            workflowId: workflow.workflowId,
            status: workflow.status,
            actor: workflow.actor,
          }
        );
      }
      return workflow;
    },
    releaseScheduledWorkflowRuns(options = {}) {
      const result = context.workflows.releaseScheduledWorkflowRuns(options);
      result.workflows.forEach((workflow) => {
        fanoutWorkflowEvent(
          'info',
          `Workflow re-queued ${workflow.workflowId}`,
          `Workflow ${workflow.workflowId} moved from retry schedule back to queued state.`,
          {
            workflowRunId: workflow.id,
            workflowId: workflow.workflowId,
            status: workflow.status,
            actor: workflow.actor,
            worker: result.worker,
          }
        );
      });
      return result;
    },
    claimQueuedWorkflowRuns(options = {}) {
      return context.workflows.claimQueuedWorkflowRuns(options);
    },
  };
}

export const controlPlaneRuntime = createControlPlaneRuntime();
export const getUserAccount = (...args) => controlPlaneRuntime.getUserAccount(...args);
export const getUserProfile = (...args) => controlPlaneRuntime.getUserProfile(...args);
export const updateUserProfile = (...args) => controlPlaneRuntime.updateUserProfile(...args);
export const getUserPreferences = (...args) => controlPlaneRuntime.getUserPreferences(...args);
export const updateUserPreferences = (...args) => controlPlaneRuntime.updateUserPreferences(...args);
export const listBrokerBindings = (...args) => controlPlaneRuntime.listBrokerBindings(...args);
export const upsertBrokerBinding = (...args) => controlPlaneRuntime.upsertBrokerBinding(...args);
