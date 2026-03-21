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
    listBacktestRuns(limit = 100, filter = {}) {
      return context.backtestRuns.listBacktestRuns(limit, filter);
    },
    listBacktestResults(limit = 100, filter = {}) {
      return context.backtestResults.listBacktestResults(limit, filter);
    },
    listBacktestResultsForRun(runId, limit = 20) {
      return context.backtestResults.listBacktestResultsForRun(runId, limit);
    },
    getBacktestResult(resultId) {
      return context.backtestResults.getBacktestResult(resultId);
    },
    getLatestBacktestResultForRun(runId) {
      return context.backtestResults.getLatestBacktestResultForRun(runId);
    },
    appendBacktestResult(payload = {}) {
      return context.backtestResults.appendBacktestResult(payload);
    },
    listResearchEvaluations(limit = 100, filter = {}) {
      return context.researchEvaluations.listResearchEvaluations(limit, filter);
    },
    getResearchEvaluation(evaluationId) {
      return context.researchEvaluations.getResearchEvaluation(evaluationId);
    },
    getLatestEvaluationForRun(runId) {
      return context.researchEvaluations.getLatestEvaluationForRun(runId);
    },
    getLatestEvaluationForStrategy(strategyId) {
      return context.researchEvaluations.getLatestEvaluationForStrategy(strategyId);
    },
    appendResearchEvaluation(payload = {}) {
      return context.researchEvaluations.appendResearchEvaluation(payload);
    },
    listResearchReports(limit = 100, filter = {}) {
      return context.researchReports.listResearchReports(limit, filter);
    },
    getResearchReport(reportId) {
      return context.researchReports.getResearchReport(reportId);
    },
    getLatestResearchReportForRun(runId) {
      return context.researchReports.getLatestResearchReportForRun(runId);
    },
    getLatestResearchReportForStrategy(strategyId) {
      return context.researchReports.getLatestResearchReportForStrategy(strategyId);
    },
    appendResearchReport(payload = {}) {
      return context.researchReports.appendResearchReport(payload);
    },
    getBacktestRun(runId) {
      return context.backtestRuns.getBacktestRun(runId);
    },
    findBacktestRunByWorkflowRunId(workflowRunId) {
      return context.backtestRuns.findBacktestRunByWorkflowRunId(workflowRunId);
    },
    appendBacktestRun(payload) {
      return context.backtestRuns.appendBacktestRun(payload);
    },
    updateBacktestRun(runId, patch = {}) {
      return context.backtestRuns.updateBacktestRun(runId, patch);
    },
    listAuditRecords(limit = 50, filter = {}) {
      return context.audit.listAuditRecords(limit, filter);
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
    listOperatorActions(limit = 50, filter = {}) {
      return context.operatorActions.listOperatorActions(limit, filter);
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
    listExecutionCandidateHandoffs(limit = 50, filter = {}) {
      return context.executionCandidateHandoffs.listExecutionCandidateHandoffs(limit, filter);
    },
    getExecutionCandidateHandoff(handoffId) {
      return context.executionCandidateHandoffs.getExecutionCandidateHandoff(handoffId);
    },
    getLatestExecutionCandidateHandoffForStrategy(strategyId) {
      return context.executionCandidateHandoffs.getLatestExecutionCandidateHandoffForStrategy(strategyId);
    },
    appendExecutionCandidateHandoff(payload) {
      return context.executionCandidateHandoffs.appendExecutionCandidateHandoff(payload);
    },
    updateExecutionCandidateHandoff(handoffId, patch = {}) {
      return context.executionCandidateHandoffs.updateExecutionCandidateHandoff(handoffId, patch);
    },
    getExecutionPlan(planId) {
      return context.executionPlans.getExecutionPlan(planId);
    },
    findExecutionPlanByWorkflowRunId(workflowRunId) {
      return context.executionPlans.findExecutionPlanByWorkflowRunId(workflowRunId);
    },
    listExecutionRuns(limit = 50, filter = {}) {
      return context.executionRuns.listExecutionRuns(limit, filter);
    },
    getExecutionRun(runId) {
      return context.executionRuns.getExecutionRun(runId);
    },
    getExecutionRunByPlanId(executionPlanId) {
      return context.executionRuns.getExecutionRunByPlanId(executionPlanId);
    },
    listExecutionOrderStates(limit = 200, filter = {}) {
      return context.executionRuns.listExecutionOrderStates(limit, filter);
    },
    appendExecutionRun(payload) {
      return context.executionRuns.appendExecutionRun(payload);
    },
    appendExecutionOrderStates(entries = []) {
      return context.executionRuns.appendExecutionOrderStates(entries);
    },
    updateExecutionRun(runId, patch = {}) {
      return context.executionRuns.updateExecutionRun(runId, patch);
    },
    updateExecutionOrderState(orderStateId, patch = {}) {
      return context.executionRuns.updateExecutionOrderState(orderStateId, patch);
    },
    appendExecutionPlan(payload) {
      return context.executionPlans.appendExecutionPlan(payload);
    },
    updateExecutionPlan(planId, patch = {}) {
      return context.executionPlans.updateExecutionPlan(planId, patch);
    },
    recordExecutionPlan(payload) {
      const plan = context.executionPlans.appendExecutionPlan(payload);

      context.audit.appendAuditRecord({
        type: 'execution-plan',
        actor: payload.actor || 'strategy-worker',
        title: `Execution plan created for ${plan.strategyName}`,
        detail: plan.summary || 'Execution plan generated.',
        metadata: {
          executionPlanId: plan.id,
          strategyId: plan.strategyId,
          mode: plan.mode,
          status: plan.status,
          riskStatus: plan.riskStatus,
          approvalState: plan.approvalState,
          orderCount: plan.orderCount,
          capital: plan.capital,
          summary: plan.summary,
          metrics: plan.metadata?.metrics || {},
          reasons: plan.metadata?.reasons || [],
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
    recordExecutionRun(payload) {
      const run = context.executionRuns.appendExecutionRun(payload);
      context.audit.appendAuditRecord({
        type: 'execution-run',
        actor: payload.actor || 'execution-desk',
        title: `Execution run ${run.lifecycleStatus}`,
        detail: run.summary || `Execution run created for ${run.strategyName}.`,
        metadata: {
          executionRunId: run.id,
          executionPlanId: run.executionPlanId,
          workflowRunId: run.workflowRunId,
          lifecycleStatus: run.lifecycleStatus,
          orderCount: run.orderCount,
        },
      });
      return run;
    },
    listExecutionRuntimeEvents(limit = 50) {
      return context.executionRuntime.listExecutionRuntimeEvents(limit);
    },
    appendExecutionRuntimeEvent(payload) {
      return context.executionRuntime.appendExecutionRuntimeEvent(payload);
    },
    listBrokerAccountSnapshots(limit = 50) {
      return context.executionRuntime.listBrokerAccountSnapshots(limit);
    },
    appendBrokerAccountSnapshot(payload) {
      return context.executionRuntime.appendBrokerAccountSnapshot(payload);
    },
    listBrokerExecutionEvents(limit = 50, filter = {}) {
      return context.executionRuntime.listBrokerExecutionEvents(limit, filter);
    },
    appendBrokerExecutionEvent(payload) {
      return context.executionRuntime.appendBrokerExecutionEvent(payload);
    },
    recordExecutionRuntime(payload) {
      const runtimeEvent = context.executionRuntime.appendExecutionRuntimeEvent(payload);
      const brokerSnapshot = context.executionRuntime.appendBrokerAccountSnapshot({
        cycleId: payload.cycleId,
        cycle: payload.cycle,
        executionPlanId: payload.executionPlanId,
        executionRunId: payload.executionRunId,
        provider: payload.brokerAdapter,
        connected: payload.brokerConnected,
        account: payload.account || null,
        positions: payload.positions || [],
        orders: payload.orders || [],
        message: payload.message,
        createdAt: payload.createdAt,
      });

      context.audit.appendAuditRecord({
        type: 'execution-runtime',
        actor: payload.actor || 'task-orchestrator',
        title: `Execution runtime synced for cycle ${payload.cycle}`,
        detail: payload.message || 'Execution runtime snapshot recorded.',
        metadata: {
          cycleId: payload.cycleId,
          submittedOrderCount: payload.submittedOrderCount,
          rejectedOrderCount: payload.rejectedOrderCount,
          brokerConnected: payload.brokerConnected,
        },
      });

      return {
        runtimeEvent,
        brokerSnapshot,
      };
    },
    getMarketProviderStatus() {
      return context.marketProviders.getMarketProviderStatus();
    },
    updateMarketProviderStatus(snapshot = {}) {
      return context.marketProviders.updateMarketProviderStatus(snapshot);
    },
    listMonitoringSnapshots(limit = 50, filter = {}) {
      return context.monitoring.listMonitoringSnapshots(limit, filter);
    },
    listMonitoringAlerts(limit = 100, filter = {}) {
      return context.monitoring.listMonitoringAlerts(limit, filter);
    },
    recordMonitoringSnapshot(payload = {}) {
      return context.monitoring.recordMonitoringSnapshot(payload);
    },
    listIncidents(limit = 50, filter = {}) {
      return context.incidents.listIncidents(limit, filter);
    },
    getIncident(incidentId) {
      return context.incidents.getIncident(incidentId);
    },
    listIncidentActivities(incidentId, limit = 100) {
      return context.incidents.listIncidentActivities(incidentId, limit);
    },
    listIncidentTasks(incidentId, limit = 100) {
      return context.incidents.listIncidentTasks(incidentId, limit);
    },
    listIncidentNotes(incidentId, limit = 100) {
      return context.incidents.listIncidentNotes(incidentId, limit);
    },
    appendIncident(payload = {}) {
      return context.incidents.appendIncident(payload);
    },
    recordIncident(payload = {}) {
      const incident = context.incidents.appendIncident(payload);

      context.audit.appendAuditRecord({
        type: 'incident',
        actor: payload.actor || incident.owner || 'operator',
        title: `Incident opened: ${incident.title}`,
        detail: incident.summary || 'Incident created from the investigation console.',
        metadata: {
          incidentId: incident.id,
          severity: incident.severity,
          status: incident.status,
          source: incident.source,
          owner: incident.owner,
          links: incident.links,
        },
      });

      context.notifications.enqueueNotification({
        level: incident.severity === 'critical' ? 'critical' : 'warn',
        source: 'control-plane',
        title: 'Incident opened',
        message: incident.title,
        metadata: {
          incidentId: incident.id,
          severity: incident.severity,
          status: incident.status,
          source: incident.source,
        },
      });

      return incident;
    },
    updateIncident(incidentId, patch = {}) {
      return context.incidents.updateIncident(incidentId, patch);
    },
    transitionIncident(incidentId, patch = {}) {
      const incident = context.incidents.updateIncident(incidentId, patch);
      if (!incident) return null;

      context.audit.appendAuditRecord({
        type: 'incident.transition',
        actor: patch.actor || incident.owner || 'operator',
        title: `Incident ${incident.status}`,
        detail: patch.summary || incident.summary || incident.title,
        metadata: {
          incidentId: incident.id,
          severity: incident.severity,
          status: incident.status,
          owner: incident.owner,
          source: incident.source,
        },
      });

      context.notifications.enqueueNotification({
        level: incident.status === 'resolved' ? 'info' : incident.severity,
        source: 'control-plane',
        title: `Incident ${incident.status}`,
        message: incident.title,
        metadata: {
          incidentId: incident.id,
          severity: incident.severity,
          status: incident.status,
          owner: incident.owner,
        },
      });

      return incident;
    },
    appendIncidentNote(incidentId, payload = {}) {
      return context.incidents.appendIncidentNote(incidentId, payload);
    },
    appendIncidentTask(incidentId, payload = {}) {
      return context.incidents.appendIncidentTask(incidentId, payload);
    },
    updateIncidentTask(incidentId, taskId, payload = {}) {
      return context.incidents.updateIncidentTask(incidentId, taskId, payload);
    },
    recordIncidentNote(incidentId, payload = {}) {
      const note = context.incidents.appendIncidentNote(incidentId, payload);
      if (!note) return null;
      const incident = context.incidents.getIncident(incidentId);

      context.audit.appendAuditRecord({
        type: 'incident.note',
        actor: payload.author || 'operator',
        title: 'Incident note added',
        detail: note.body,
        metadata: {
          incidentId,
          incidentTitle: incident?.title || '',
        },
      });

      return {
        note,
        incident,
      };
    },
    recordIncidentTask(incidentId, payload = {}) {
      return context.incidents.appendIncidentTask(incidentId, payload);
    },
    transitionIncidentTask(incidentId, taskId, payload = {}) {
      return context.incidents.updateIncidentTask(incidentId, taskId, payload);
    },
    listNotifications(limit = 50, filter = {}) {
      return context.notifications.listNotifications(limit, filter);
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
    getResearchSummary() {
      return context.researchSummary.getResearchSummary();
    },
    updateResearchSummary(summary = {}) {
      return context.researchSummary.updateResearchSummary(summary);
    },
    listResearchTasks(limit = 100, filter = {}) {
      return context.researchTasks.listResearchTasks(limit, filter);
    },
    getResearchTask(taskId) {
      return context.researchTasks.getResearchTask(taskId);
    },
    findResearchTaskByWorkflowRunId(workflowRunId) {
      return context.researchTasks.findResearchTaskByWorkflowRunId(workflowRunId);
    },
    findResearchTaskByRunId(runId) {
      return context.researchTasks.findResearchTaskByRunId(runId);
    },
    appendResearchTask(payload = {}) {
      return context.researchTasks.appendResearchTask(payload);
    },
    updateResearchTask(taskId, patch = {}) {
      return context.researchTasks.updateResearchTask(taskId, patch);
    },
    upsertResearchTask(payload = {}) {
      return context.researchTasks.upsertResearchTask(payload);
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
    listSchedulerTicks(limit = 50, filter = {}) {
      return context.scheduler.listSchedulerTicks(limit, filter);
    },
    recordSchedulerTick(options = {}) {
      return context.scheduler.recordSchedulerTick(options);
    },
    listStrategyCatalog(limit = 100) {
      return context.strategyCatalog.listStrategies(limit);
    },
    getStrategyCatalogItem(strategyId) {
      return context.strategyCatalog.getStrategy(strategyId);
    },
    upsertStrategyCatalogItem(payload = {}) {
      return context.strategyCatalog.upsertStrategy(payload);
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
    getUserAccess() {
      return context.userAccount.getUserAccess();
    },
    getUserAccessSummary(sessionPermissions = null) {
      return context.userAccount.getAccessSummary(sessionPermissions);
    },
    listUserRoleTemplates() {
      return context.userAccount.listRoleTemplates();
    },
    getBrokerBindingSummary() {
      return context.userAccount.getBrokerSummary();
    },
    updateUserPreferences(patch = {}) {
      return context.userAccount.updateUserPreferences(patch);
    },
    updateUserAccess(patch = {}) {
      return context.userAccount.updateUserAccess(patch);
    },
    listBrokerBindings() {
      return context.userAccount.listBrokerBindings();
    },
    upsertBrokerBinding(payload = {}) {
      return context.userAccount.upsertBrokerBinding(payload);
    },
    setDefaultBrokerBinding(bindingId) {
      return context.userAccount.setDefaultBrokerBinding(bindingId);
    },
    deleteBrokerBinding(bindingId) {
      return context.userAccount.deleteBrokerBinding(bindingId);
    },
    listWorkerHeartbeats(limit = 50) {
      return context.workerHeartbeats.listWorkerHeartbeats(limit);
    },
    getLatestWorkerHeartbeat(worker = '') {
      return context.workerHeartbeats.getLatestWorkerHeartbeat(worker);
    },
    recordWorkerHeartbeat(payload = {}) {
      return context.workerHeartbeats.recordWorkerHeartbeat(payload);
    },
    listWorkflowRuns(limit = 50, filter = {}) {
      return context.workflows.listWorkflowRuns(limit, filter);
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
export const getUserAccess = (...args) => controlPlaneRuntime.getUserAccess(...args);
export const getUserAccessSummary = (...args) => controlPlaneRuntime.getUserAccessSummary(...args);
export const listUserRoleTemplates = (...args) => controlPlaneRuntime.listUserRoleTemplates(...args);
export const getBrokerBindingSummary = (...args) => controlPlaneRuntime.getBrokerBindingSummary(...args);
export const updateUserPreferences = (...args) => controlPlaneRuntime.updateUserPreferences(...args);
export const updateUserAccess = (...args) => controlPlaneRuntime.updateUserAccess(...args);
export const listBrokerBindings = (...args) => controlPlaneRuntime.listBrokerBindings(...args);
export const upsertBrokerBinding = (...args) => controlPlaneRuntime.upsertBrokerBinding(...args);
export const setDefaultBrokerBinding = (...args) => controlPlaneRuntime.setDefaultBrokerBinding(...args);
export const deleteBrokerBinding = (...args) => controlPlaneRuntime.deleteBrokerBinding(...args);
export const listExecutionRuntimeEvents = (...args) => controlPlaneRuntime.listExecutionRuntimeEvents(...args);
export const listBrokerAccountSnapshots = (...args) => controlPlaneRuntime.listBrokerAccountSnapshots(...args);
export const listBrokerExecutionEvents = (...args) => controlPlaneRuntime.listBrokerExecutionEvents(...args);
export const listExecutionRuns = (...args) => controlPlaneRuntime.listExecutionRuns(...args);
export const getExecutionRun = (...args) => controlPlaneRuntime.getExecutionRun(...args);
export const getExecutionRunByPlanId = (...args) => controlPlaneRuntime.getExecutionRunByPlanId(...args);
export const listExecutionOrderStates = (...args) => controlPlaneRuntime.listExecutionOrderStates(...args);
export const listExecutionCandidateHandoffs = (...args) => controlPlaneRuntime.listExecutionCandidateHandoffs(...args);
export const getExecutionCandidateHandoff = (...args) => controlPlaneRuntime.getExecutionCandidateHandoff(...args);
export const getLatestExecutionCandidateHandoffForStrategy = (...args) => controlPlaneRuntime.getLatestExecutionCandidateHandoffForStrategy(...args);
export const appendExecutionCandidateHandoff = (...args) => controlPlaneRuntime.appendExecutionCandidateHandoff(...args);
export const updateExecutionCandidateHandoff = (...args) => controlPlaneRuntime.updateExecutionCandidateHandoff(...args);
export const recordExecutionRun = (...args) => controlPlaneRuntime.recordExecutionRun(...args);
export const updateExecutionRun = (...args) => controlPlaneRuntime.updateExecutionRun(...args);
export const updateExecutionOrderState = (...args) => controlPlaneRuntime.updateExecutionOrderState(...args);
export const updateExecutionPlan = (...args) => controlPlaneRuntime.updateExecutionPlan(...args);
export const appendBrokerExecutionEvent = (...args) => controlPlaneRuntime.appendBrokerExecutionEvent(...args);
export const listBacktestRuns = (...args) => controlPlaneRuntime.listBacktestRuns(...args);
export const listBacktestResults = (...args) => controlPlaneRuntime.listBacktestResults(...args);
export const listBacktestResultsForRun = (...args) => controlPlaneRuntime.listBacktestResultsForRun(...args);
export const getBacktestResult = (...args) => controlPlaneRuntime.getBacktestResult(...args);
export const getLatestBacktestResultForRun = (...args) => controlPlaneRuntime.getLatestBacktestResultForRun(...args);
export const appendBacktestResult = (...args) => controlPlaneRuntime.appendBacktestResult(...args);
export const listResearchEvaluations = (...args) => controlPlaneRuntime.listResearchEvaluations(...args);
export const getResearchEvaluation = (...args) => controlPlaneRuntime.getResearchEvaluation(...args);
export const getLatestEvaluationForRun = (...args) => controlPlaneRuntime.getLatestEvaluationForRun(...args);
export const getLatestEvaluationForStrategy = (...args) => controlPlaneRuntime.getLatestEvaluationForStrategy(...args);
export const appendResearchEvaluation = (...args) => controlPlaneRuntime.appendResearchEvaluation(...args);
export const listResearchReports = (...args) => controlPlaneRuntime.listResearchReports(...args);
export const getResearchReport = (...args) => controlPlaneRuntime.getResearchReport(...args);
export const getLatestResearchReportForRun = (...args) => controlPlaneRuntime.getLatestResearchReportForRun(...args);
export const getLatestResearchReportForStrategy = (...args) => controlPlaneRuntime.getLatestResearchReportForStrategy(...args);
export const appendResearchReport = (...args) => controlPlaneRuntime.appendResearchReport(...args);
export const getBacktestRun = (...args) => controlPlaneRuntime.getBacktestRun(...args);
export const findBacktestRunByWorkflowRunId = (...args) => controlPlaneRuntime.findBacktestRunByWorkflowRunId(...args);
export const appendBacktestRun = (...args) => controlPlaneRuntime.appendBacktestRun(...args);
export const updateBacktestRun = (...args) => controlPlaneRuntime.updateBacktestRun(...args);
export const getResearchSummary = (...args) => controlPlaneRuntime.getResearchSummary(...args);
export const updateResearchSummary = (...args) => controlPlaneRuntime.updateResearchSummary(...args);
export const listResearchTasks = (...args) => controlPlaneRuntime.listResearchTasks(...args);
export const getResearchTask = (...args) => controlPlaneRuntime.getResearchTask(...args);
export const findResearchTaskByWorkflowRunId = (...args) => controlPlaneRuntime.findResearchTaskByWorkflowRunId(...args);
export const findResearchTaskByRunId = (...args) => controlPlaneRuntime.findResearchTaskByRunId(...args);
export const appendResearchTask = (...args) => controlPlaneRuntime.appendResearchTask(...args);
export const updateResearchTask = (...args) => controlPlaneRuntime.updateResearchTask(...args);
export const upsertResearchTask = (...args) => controlPlaneRuntime.upsertResearchTask(...args);
export const listStrategyCatalog = (...args) => controlPlaneRuntime.listStrategyCatalog(...args);
export const getStrategyCatalogItem = (...args) => controlPlaneRuntime.getStrategyCatalogItem(...args);
export const upsertStrategyCatalogItem = (...args) => controlPlaneRuntime.upsertStrategyCatalogItem(...args);
export const getMarketProviderStatus = (...args) => controlPlaneRuntime.getMarketProviderStatus(...args);
export const updateMarketProviderStatus = (...args) => controlPlaneRuntime.updateMarketProviderStatus(...args);
export const listMonitoringSnapshots = (...args) => controlPlaneRuntime.listMonitoringSnapshots(...args);
export const listMonitoringAlerts = (...args) => controlPlaneRuntime.listMonitoringAlerts(...args);
export const listIncidents = (...args) => controlPlaneRuntime.listIncidents(...args);
export const getIncident = (...args) => controlPlaneRuntime.getIncident(...args);
export const listIncidentNotes = (...args) => controlPlaneRuntime.listIncidentNotes(...args);
export const appendIncident = (...args) => controlPlaneRuntime.appendIncident(...args);
export const recordIncident = (...args) => controlPlaneRuntime.recordIncident(...args);
export const updateIncident = (...args) => controlPlaneRuntime.updateIncident(...args);
export const transitionIncident = (...args) => controlPlaneRuntime.transitionIncident(...args);
export const appendIncidentNote = (...args) => controlPlaneRuntime.appendIncidentNote(...args);
export const recordIncidentNote = (...args) => controlPlaneRuntime.recordIncidentNote(...args);
export const listWorkerHeartbeats = (...args) => controlPlaneRuntime.listWorkerHeartbeats(...args);
export const getLatestWorkerHeartbeat = (...args) => controlPlaneRuntime.getLatestWorkerHeartbeat(...args);
export const listWorkflowRuns = (...args) => controlPlaneRuntime.listWorkflowRuns(...args);
export const getWorkflowRun = (...args) => controlPlaneRuntime.getWorkflowRun(...args);
