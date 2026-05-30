import { controlPlaneContext } from '../../control-plane-store/src/context.js';

export function createControlPlaneRuntime(context = controlPlaneContext) {
  function getCurrentScope() {
    const tenant = context.userAccount?.getTenant?.() || null;
    const workspace = context.userAccount?.getCurrentWorkspace?.() || null;
    return {
      tenantId: workspace?.tenantId || tenant?.id || '',
      workspaceId: workspace?.id || '',
    };
  }

  function withScopeMetadata(payload: any = {}, extraMetadata: any = {}) {
    const scope = getCurrentScope();
    return {
      ...payload,
      metadata: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        ...(payload.metadata || {}),
        ...extraMetadata,
      },
    };
  }

  function withScopeMetaRecord(metadata: any = {}) {
    const scope = getCurrentScope();
    return {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...metadata,
    };
  }

  function withScopedFilter(filter: any = {}, options: any = {}) {
    if (filter.allScopes || filter.scope === 'all') {
      return filter;
    }

    const scope = getCurrentScope();
    return {
      includeUnscoped: options.includeUnscoped ?? true,
      ...filter,
      tenantId: filter.tenantId ?? scope.tenantId,
      workspaceId: filter.workspaceId ?? scope.workspaceId,
    };
  }

  function isVisibleInCurrentScope(item: any, options: any = {}) {
    if (!item) return null;

    const filter = withScopedFilter({}, options);
    const tenantId = item?.metadata?.tenantId || item?.tenantId || '';
    const workspaceId = item?.metadata?.workspaceId || item?.workspaceId || '';
    const includeUnscoped = filter.includeUnscoped !== false;

    if (!tenantId && !workspaceId) {
      return includeUnscoped ? item : null;
    }
    if (filter.tenantId && tenantId && tenantId !== filter.tenantId) {
      return null;
    }
    if (filter.workspaceId && workspaceId && workspaceId !== filter.workspaceId) {
      return null;
    }
    if (filter.tenantId && !tenantId) {
      return includeUnscoped ? item : null;
    }
    if (filter.workspaceId && !workspaceId) {
      return includeUnscoped ? item : null;
    }

    return item;
  }

  function fanoutWorkflowEvent(level: any, title: any, message: any, metadata: any = {}) {
    context.audit.appendAuditRecord({
      type: 'workflow',
      actor: metadata.actor || 'task-orchestrator',
      title,
      detail: message,
      metadata: withScopeMetaRecord(metadata),
    });

    context.notifications.enqueueNotification({
      level,
      source: 'workflow-control',
      title,
      message,
      metadata: withScopeMetaRecord(metadata),
    });
  }

  function syncExecutionPlanForWorkflow(workflowRunId: any, patch: any = {}) {
    if (!workflowRunId || !context.executionPlans?.findExecutionPlanByWorkflowRunId) return null;
    const existing = context.executionPlans.findExecutionPlanByWorkflowRunId(workflowRunId);
    if (!existing) return null;
    return context.executionPlans.updateExecutionPlan(existing.id, patch);
  }

  function buildAgentAuthorityState(options: any = {}) {
    const policyFilter = withScopedFilter({
      accountId: options.accountId,
      strategyId: options.strategyId,
      actionType: options.actionType,
      environment: options.environment,
    });
    const eventFilter = withScopedFilter({
      accountId: options.accountId,
      strategyId: options.strategyId,
      actionType: options.actionType,
      sessionId: options.sessionId,
      policyId: options.policyId,
    });
    const latestPolicy = context.agentPolicy.listAgentPolicies(1, policyFilter)[0] || null;
    const latestEvent =
      context.agentAuthorityEvent.listAgentAuthorityEvents(1, eventFilter)[0] || null;
    const now = new Date().toISOString();

    if (latestEvent) {
      return {
        mode: latestEvent.nextMode,
        reason: latestEvent.reason || 'Recent authority event recorded.',
        updatedAt: latestEvent.createdAt || now,
        policy: latestPolicy,
        latestEvent,
      };
    }

    if (latestPolicy) {
      return {
        mode: latestPolicy.authority,
        reason: 'Derived from the latest active policy.',
        updatedAt: latestPolicy.updatedAt || latestPolicy.createdAt || now,
        policy: latestPolicy,
        latestEvent: null,
      };
    }

    return {
      mode: 'manual_only',
      reason: 'No agent governance policy configured.',
      updatedAt: now,
      policy: null,
      latestEvent: null,
    };
  }

  function buildAgentDailyBiasState(options: any = {}) {
    const activeAt = options.activeAt || new Date().toISOString();
    const instructionFilter = withScopedFilter({
      sessionId: options.sessionId,
      requestedBy: options.requestedBy,
      kind: options.kind,
      activeOnly: true,
      activeAt,
    });
    const instructions = context.agentInstruction.listAgentInstructions(
      Number.isFinite(options.instructionLimit) ? options.instructionLimit : 20,
      instructionFilter
    );
    const latestInstruction = instructions[0] || null;

    return {
      instructions,
      summary:
        latestInstruction?.title ||
        (instructions.length > 0
          ? `${instructions.length} active instructions`
          : 'No active daily bias instructions.'),
      updatedAt: latestInstruction?.createdAt || activeAt,
    };
  }

  return {
    listAgentSessions(limit = 50, filter: any = {}) {
      return context.agentSessions.listAgentSessions(limit, withScopedFilter(filter));
    },
    getAgentSession(sessionId: any) {
      return isVisibleInCurrentScope(context.agentSessions.getAgentSession(sessionId));
    },
    appendAgentSession(payload: any = {}) {
      return context.agentSessions.appendAgentSession(withScopeMetadata(payload));
    },
    recordAgentSession(payload: any = {}) {
      const session = context.agentSessions.appendAgentSession(withScopeMetadata(payload));

      context.audit.appendAuditRecord({
        type: 'agent-session',
        actor: session.requestedBy,
        title: `Agent session opened`,
        detail: session.title || 'Agent collaboration session created.',
        metadata: withScopeMetaRecord({
          agentSessionId: session.id,
          status: session.status,
          latestIntentKind: session.latestIntent.kind,
        }),
      });

      return session;
    },
    updateAgentSession(sessionId: any, patch: any = {}) {
      return context.agentSessions.updateAgentSession(sessionId, patch);
    },
    listAgentSessionMessages(sessionId: any, limit = 100, filter: any = {}) {
      return context.agentSessionMessages.listAgentSessionMessages(
        sessionId,
        limit,
        withScopedFilter(filter)
      );
    },
    appendAgentSessionMessage(payload: any = {}) {
      return context.agentSessionMessages.appendAgentSessionMessage(withScopeMetadata(payload));
    },
    recordAgentSessionMessage(payload: any = {}) {
      const message = context.agentSessionMessages.appendAgentSessionMessage(
        withScopeMetadata(payload)
      );

      context.audit.appendAuditRecord({
        type: 'agent-message',
        actor: message.requestedBy,
        title: `Agent message recorded`,
        detail: message.title || message.body || 'Agent session message persisted.',
        metadata: withScopeMetaRecord({
          agentSessionId: message.sessionId,
          agentMessageId: message.id,
          role: message.role,
          kind: message.kind,
        }),
      });

      return message;
    },
    listAgentPlans(limit = 50, filter: any = {}) {
      return context.agentPlans.listAgentPlans(limit, withScopedFilter(filter));
    },
    getAgentPlan(planId: any) {
      return isVisibleInCurrentScope(context.agentPlans.getAgentPlan(planId));
    },
    getLatestAgentPlanForSession(sessionId: any) {
      return context.agentPlans.getLatestAgentPlanForSession(sessionId);
    },
    appendAgentPlan(payload: any = {}) {
      return context.agentPlans.appendAgentPlan(withScopeMetadata(payload));
    },
    recordAgentPlan(payload: any = {}) {
      const plan = context.agentPlans.appendAgentPlan(withScopeMetadata(payload));
      if (plan.sessionId) {
        context.agentSessions.updateAgentSession(plan.sessionId, {
          latestPlanId: plan.id,
          status: plan.status === 'completed' ? 'ready' : 'running',
        });
      }

      context.audit.appendAuditRecord({
        type: 'agent-plan',
        actor: plan.requestedBy,
        title: `Agent plan prepared`,
        detail: plan.summary || 'Agent plan persisted.',
        metadata: withScopeMetaRecord({
          agentPlanId: plan.id,
          agentSessionId: plan.sessionId,
          requiresApproval: plan.requiresApproval,
          stepCount: plan.steps.length,
        }),
      });

      return plan;
    },
    updateAgentPlan(planId: any, patch: any = {}) {
      return context.agentPlans.updateAgentPlan(planId, patch);
    },
    listAgentAnalysisRuns(limit = 50, filter: any = {}) {
      return context.agentAnalysisRuns.listAgentAnalysisRuns(limit, withScopedFilter(filter));
    },
    getAgentAnalysisRun(runId: any) {
      return isVisibleInCurrentScope(context.agentAnalysisRuns.getAgentAnalysisRun(runId));
    },
    getLatestAgentAnalysisRunForSession(sessionId: any) {
      return context.agentAnalysisRuns.getLatestAgentAnalysisRunForSession(sessionId);
    },
    appendAgentAnalysisRun(payload: any = {}) {
      return context.agentAnalysisRuns.appendAgentAnalysisRun(withScopeMetadata(payload));
    },
    recordAgentAnalysisRun(payload: any = {}) {
      const run = context.agentAnalysisRuns.appendAgentAnalysisRun(withScopeMetadata(payload));
      if (run.sessionId) {
        context.agentSessions.updateAgentSession(run.sessionId, {
          latestAnalysisRunId: run.id,
          status: run.status === 'completed' ? 'completed' : 'running',
        });
      }

      context.audit.appendAuditRecord({
        type: 'agent-analysis-run',
        actor: run.requestedBy,
        title: `Agent analysis ${run.status}`,
        detail: run.summary || 'Agent analysis run persisted.',
        metadata: withScopeMetaRecord({
          agentAnalysisRunId: run.id,
          agentSessionId: run.sessionId,
          agentPlanId: run.planId,
          toolCallCount: run.toolCalls.length,
          evidenceCount: run.evidence.length,
        }),
      });

      return run;
    },
    updateAgentAnalysisRun(runId: any, patch: any = {}) {
      return context.agentAnalysisRuns.updateAgentAnalysisRun(runId, patch);
    },
    listAgentActionRequests(limit = 50, filter: any = {}) {
      return context.agentActionRequests.listAgentActionRequests(limit, withScopedFilter(filter));
    },
    getAgentActionRequest(requestId: any) {
      return isVisibleInCurrentScope(context.agentActionRequests.getAgentActionRequest(requestId));
    },
    appendAgentActionRequest(payload: any) {
      return context.agentActionRequests.appendAgentActionRequest(withScopeMetadata(payload));
    },
    recordAgentActionRequest(payload: any) {
      const request = context.agentActionRequests.appendAgentActionRequest(
        withScopeMetadata(payload)
      );

      context.audit.appendAuditRecord({
        type: 'agent-action-request',
        actor: payload.requestedBy || 'agent',
        title: `Agent requested ${request.requestType}`,
        detail: request.summary || 'Agent action request submitted.',
        metadata: withScopeMetaRecord({
          targetId: request.targetId,
          approvalState: request.approvalState,
          riskStatus: request.riskStatus,
          workflowRunId: request.workflowRunId,
        }),
      });

      context.notifications.enqueueNotification({
        level: 'warn',
        source: 'agent-control',
        title: `Agent action request submitted`,
        message:
          request.summary || `${request.requestType} request is waiting for operator review.`,
        metadata: withScopeMetaRecord({
          agentActionRequestId: request.id,
          requestType: request.requestType,
          targetId: request.targetId,
        }),
      });

      return request;
    },
    updateAgentActionRequest(requestId: any, patch: any = {}) {
      return context.agentActionRequests.updateAgentActionRequest(requestId, patch);
    },
    listAgentPolicies(limit = 50, filter: any = {}) {
      return context.agentPolicy.listAgentPolicies(limit, withScopedFilter(filter));
    },
    getAgentPolicy(policyId: any) {
      return isVisibleInCurrentScope(context.agentPolicy.getAgentPolicy(policyId));
    },
    appendAgentPolicy(payload: any = {}) {
      return context.agentPolicy.appendAgentPolicy(withScopeMetadata(payload));
    },
    saveAgentPolicy(payload: any = {}) {
      return context.agentPolicy.upsertAgentPolicy(withScopeMetadata(payload));
    },
    recordAgentPolicy(payload: any = {}) {
      return this.saveAgentPolicy(payload);
    },
    updateAgentPolicy(policyId: any, patch: any = {}) {
      return context.agentPolicy.updateAgentPolicy(policyId, patch);
    },
    listAgentInstructions(limit = 50, filter: any = {}) {
      return context.agentInstruction.listAgentInstructions(limit, withScopedFilter(filter));
    },
    getAgentInstruction(instructionId: any) {
      return isVisibleInCurrentScope(context.agentInstruction.getAgentInstruction(instructionId));
    },
    appendAgentInstruction(payload: any = {}) {
      return context.agentInstruction.appendAgentInstruction(withScopeMetadata(payload));
    },
    recordAgentInstruction(payload: any = {}) {
      return context.agentInstruction.appendAgentInstruction(withScopeMetadata(payload));
    },
    updateAgentInstruction(instructionId: any, patch: any = {}) {
      return context.agentInstruction.updateAgentInstruction(instructionId, patch);
    },
    listAgentDailyRuns(limit = 50, filter: any = {}) {
      return context.agentDailyRun.listAgentDailyRuns(limit, withScopedFilter(filter));
    },
    getAgentDailyRun(runId: any) {
      return isVisibleInCurrentScope(context.agentDailyRun.getAgentDailyRun(runId));
    },
    appendAgentDailyRun(payload: any = {}) {
      return context.agentDailyRun.appendAgentDailyRun(withScopeMetadata(payload));
    },
    recordAgentDailyRun(payload: any = {}) {
      return context.agentDailyRun.appendAgentDailyRun(withScopeMetadata(payload));
    },
    updateAgentDailyRun(runId: any, patch: any = {}) {
      return context.agentDailyRun.updateAgentDailyRun(runId, patch);
    },
    queueAgentDailyRun(payload: any = {}) {
      const run = this.appendAgentDailyRun({
        ...payload,
        status: 'queued',
      });
      const workflow = this.enqueueWorkflowRun({
        workflowId: 'task-orchestrator.agent-daily-run',
        workflowType: 'task-orchestrator',
        actor: payload.requestedBy || 'system',
        trigger: payload.trigger || 'schedule',
        payload: {
          runId: run.id,
          kind: run.kind,
          accountId: run.accountId,
          strategyId: run.strategyId,
          requestedBy: run.requestedBy,
        },
        maxAttempts: 2,
      });
      return { ok: true, run, workflow };
    },
    listAgentAuthorityEvents(limit = 50, filter: any = {}) {
      return context.agentAuthorityEvent.listAgentAuthorityEvents(limit, withScopedFilter(filter));
    },
    getAgentAuthorityEvent(eventId: any) {
      return isVisibleInCurrentScope(context.agentAuthorityEvent.getAgentAuthorityEvent(eventId));
    },
    appendAgentAuthorityEvent(payload: any = {}) {
      return context.agentAuthorityEvent.appendAgentAuthorityEvent(withScopeMetadata(payload));
    },
    recordAgentAuthorityEvent(payload: any = {}) {
      return context.agentAuthorityEvent.appendAgentAuthorityEvent(withScopeMetadata(payload));
    },
    updateAgentAuthorityEvent(eventId: any, patch: any = {}) {
      return context.agentAuthorityEvent.updateAgentAuthorityEvent(eventId, patch);
    },
    getAgentGovernanceSnapshot(options: any = {}) {
      const eventLimit = Number.isFinite(options.eventLimit) ? options.eventLimit : 20;
      const runLimit = Number.isFinite(options.runLimit) ? options.runLimit : 20;
      const authorityEvents = this.listAgentAuthorityEvents(eventLimit, {
        accountId: options.accountId,
        strategyId: options.strategyId,
        actionType: options.actionType,
        sessionId: options.sessionId,
        policyId: options.policyId,
      });
      const dailyRuns = this.listAgentDailyRuns(runLimit, {
        accountId: options.accountId,
        strategyId: options.strategyId,
        requestedBy: options.requestedBy,
      });

      return {
        authorityState: buildAgentAuthorityState(options),
        dailyBias: buildAgentDailyBiasState(options),
        authorityEvents,
        dailyRuns,
      };
    },
    listBacktestRuns(limit = 100, filter: any = {}) {
      return context.backtestRuns.listBacktestRuns(limit, filter);
    },
    listBacktestResults(limit = 100, filter: any = {}) {
      return context.backtestResults.listBacktestResults(limit, filter);
    },
    listBacktestResultsForRun(runId: any, limit = 20) {
      return context.backtestResults.listBacktestResultsForRun(runId, limit);
    },
    getBacktestResult(resultId: any) {
      return context.backtestResults.getBacktestResult(resultId);
    },
    getLatestBacktestResultForRun(runId: any) {
      return context.backtestResults.getLatestBacktestResultForRun(runId);
    },
    appendBacktestResult(payload: any = {}) {
      return context.backtestResults.appendBacktestResult(withScopeMetadata(payload));
    },
    listResearchEvaluations(limit = 100, filter: any = {}) {
      return context.researchEvaluations.listResearchEvaluations(limit, filter);
    },
    getResearchEvaluation(evaluationId: any) {
      return context.researchEvaluations.getResearchEvaluation(evaluationId);
    },
    getLatestEvaluationForRun(runId: any) {
      return context.researchEvaluations.getLatestEvaluationForRun(runId);
    },
    getLatestEvaluationForStrategy(strategyId: any) {
      return context.researchEvaluations.getLatestEvaluationForStrategy(strategyId);
    },
    appendResearchEvaluation(payload: any = {}) {
      return context.researchEvaluations.appendResearchEvaluation(withScopeMetadata(payload));
    },
    listResearchReports(limit = 100, filter: any = {}) {
      return context.researchReports.listResearchReports(limit, filter);
    },
    getResearchReport(reportId: any) {
      return context.researchReports.getResearchReport(reportId);
    },
    getLatestResearchReportForRun(runId: any) {
      return context.researchReports.getLatestResearchReportForRun(runId);
    },
    getLatestResearchReportForStrategy(strategyId: any) {
      return context.researchReports.getLatestResearchReportForStrategy(strategyId);
    },
    appendResearchReport(payload: any = {}) {
      return context.researchReports.appendResearchReport(withScopeMetadata(payload));
    },
    getBacktestRun(runId: any) {
      return context.backtestRuns.getBacktestRun(runId);
    },
    findBacktestRunByWorkflowRunId(workflowRunId: any) {
      return context.backtestRuns.findBacktestRunByWorkflowRunId(workflowRunId);
    },
    appendBacktestRun(payload: any) {
      return context.backtestRuns.appendBacktestRun(withScopeMetadata(payload));
    },
    updateBacktestRun(runId: any, patch: any = {}) {
      return context.backtestRuns.updateBacktestRun(runId, patch);
    },
    listAuditRecords(limit = 50, filter: any = {}) {
      return context.audit.listAuditRecords(limit, withScopedFilter(filter));
    },
    appendAuditRecord(record: any) {
      return context.audit.appendAuditRecord({
        ...record,
        metadata: withScopeMetaRecord(record.metadata || {}),
      });
    },
    listCycleRecords(limit = 30) {
      return context.cycles.listCycleRecords(limit);
    },
    appendCycleRecord(payload: any) {
      return context.cycles.appendCycleRecord(withScopeMetadata(payload));
    },
    recordCycleRun(payload: any) {
      const entry = context.cycles.appendCycleRecord(withScopeMetadata(payload));

      context.audit.appendAuditRecord({
        type: 'cycle',
        actor: 'task-orchestrator',
        title: `Cycle ${entry.cycle} completed`,
        detail: entry.decisionSummary || 'Cycle completed without a new priority decision.',
        metadata: withScopeMetaRecord({
          mode: entry.mode,
          riskLevel: entry.riskLevel,
          pendingApprovals: entry.pendingApprovals,
          liveIntentCount: entry.liveIntentCount,
        }),
      });

      if (entry.pendingApprovals > 0) {
        context.notifications.enqueueNotification({
          level: 'warn',
          source: 'task-orchestrator',
          title: `Cycle ${entry.cycle} requires approval`,
          message: `${entry.pendingApprovals} live actions are waiting for review.`,
          metadata: withScopeMetaRecord({ cycle: entry.cycle }),
        });
      }

      if (!entry.brokerConnected || !entry.marketConnected) {
        context.notifications.enqueueNotification({
          level: 'warn',
          source: 'task-orchestrator',
          title: `Cycle ${entry.cycle} degraded`,
          message:
            'One or more platform integrations are disconnected or running in fallback mode.',
          metadata: withScopeMetaRecord({
            cycle: entry.cycle,
            brokerConnected: entry.brokerConnected,
            marketConnected: entry.marketConnected,
          }),
        });
      }

      return entry;
    },
    listOperatorActions(limit = 50, filter: any = {}) {
      return context.operatorActions.listOperatorActions(limit, withScopedFilter(filter));
    },
    appendOperatorAction(payload: any) {
      return context.operatorActions.appendOperatorAction(withScopeMetadata(payload));
    },
    recordOperatorAction(payload: any) {
      const action = context.operatorActions.appendOperatorAction(withScopeMetadata(payload));

      context.audit.appendAuditRecord({
        type: action.type,
        actor: action.actor,
        title: action.title,
        detail: action.detail,
        metadata: withScopeMetaRecord({ symbol: action.symbol, level: action.level }),
      });

      context.notifications.enqueueNotification({
        level: action.level,
        source: 'control-plane',
        title: action.title,
        message: action.detail,
        metadata: withScopeMetaRecord({ symbol: action.symbol, type: action.type }),
      });

      return action;
    },
    listExecutionPlans(limit = 50, filter: any = {}) {
      return context.executionPlans.listExecutionPlans(limit, filter);
    },
    listExecutionCandidateHandoffs(limit = 50, filter: any = {}) {
      return context.executionCandidateHandoffs.listExecutionCandidateHandoffs(limit, filter);
    },
    getExecutionCandidateHandoff(handoffId: any) {
      return context.executionCandidateHandoffs.getExecutionCandidateHandoff(handoffId);
    },
    getLatestExecutionCandidateHandoffForStrategy(strategyId: any) {
      return context.executionCandidateHandoffs.getLatestExecutionCandidateHandoffForStrategy(
        strategyId
      );
    },
    appendExecutionCandidateHandoff(payload: any) {
      return context.executionCandidateHandoffs.appendExecutionCandidateHandoff(
        withScopeMetadata(payload)
      );
    },
    updateExecutionCandidateHandoff(handoffId: any, patch: any = {}) {
      return context.executionCandidateHandoffs.updateExecutionCandidateHandoff(handoffId, patch);
    },
    getExecutionPlan(planId: any) {
      return context.executionPlans.getExecutionPlan(planId);
    },
    findExecutionPlanByWorkflowRunId(workflowRunId: any) {
      return context.executionPlans.findExecutionPlanByWorkflowRunId(workflowRunId);
    },
    listExecutionRuns(limit = 50, filter: any = {}) {
      return context.executionRuns.listExecutionRuns(limit, filter);
    },
    getExecutionRun(runId: any) {
      return context.executionRuns.getExecutionRun(runId);
    },
    getExecutionRunByPlanId(executionPlanId: any) {
      return context.executionRuns.getExecutionRunByPlanId(executionPlanId);
    },
    listExecutionOrderStates(limit = 200, filter: any = {}) {
      return context.executionRuns.listExecutionOrderStates(limit, filter);
    },
    appendExecutionRun(payload: any) {
      return context.executionRuns.appendExecutionRun(withScopeMetadata(payload));
    },
    appendExecutionOrderStates(entries: any[] = []) {
      return context.executionRuns.appendExecutionOrderStates(
        entries.map((entry: any) => withScopeMetadata(entry)) as any
      );
    },
    updateExecutionRun(runId: any, patch: any = {}) {
      return context.executionRuns.updateExecutionRun(runId, patch);
    },
    updateExecutionOrderState(orderStateId: any, patch: any = {}) {
      return context.executionRuns.updateExecutionOrderState(orderStateId, patch);
    },
    appendExecutionPlan(payload: any) {
      return context.executionPlans.appendExecutionPlan(withScopeMetadata(payload));
    },
    updateExecutionPlan(planId: any, patch: any = {}) {
      return context.executionPlans.updateExecutionPlan(planId, patch);
    },
    recordExecutionPlan(payload: any) {
      const plan = context.executionPlans.appendExecutionPlan(withScopeMetadata(payload));

      context.audit.appendAuditRecord({
        type: 'execution-plan',
        actor: payload.actor || 'strategy-worker',
        title: `Execution plan created for ${plan.strategyName}`,
        detail: plan.summary || 'Execution plan generated.',
        metadata: withScopeMetaRecord({
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
        }),
      });

      context.notifications.enqueueNotification({
        level:
          plan.riskStatus === 'approved'
            ? 'info'
            : plan.riskStatus === 'blocked'
              ? 'critical'
              : 'warn',
        source: 'execution-planner',
        title: `Execution plan ${plan.riskStatus}`,
        message: plan.summary || `${plan.strategyName} generated an execution plan.`,
        metadata: withScopeMetaRecord({
          executionPlanId: plan.id,
          strategyId: plan.strategyId,
          workflowRunId: plan.workflowRunId,
        }),
      });

      return plan;
    },
    recordExecutionRun(payload: any) {
      const run = context.executionRuns.appendExecutionRun(withScopeMetadata(payload));
      context.audit.appendAuditRecord({
        type: 'execution-run',
        actor: payload.actor || 'execution-desk',
        title: `Execution run ${run.lifecycleStatus}`,
        detail: run.summary || `Execution run created for ${run.strategyName}.`,
        metadata: withScopeMetaRecord({
          executionRunId: run.id,
          executionPlanId: run.executionPlanId,
          workflowRunId: run.workflowRunId,
          lifecycleStatus: run.lifecycleStatus,
          orderCount: run.orderCount,
        }),
      });
      return run;
    },
    listExecutionRuntimeEvents(limit = 50) {
      return context.executionRuntime.listExecutionRuntimeEvents(limit);
    },
    appendExecutionRuntimeEvent(payload: any) {
      return context.executionRuntime.appendExecutionRuntimeEvent(withScopeMetadata(payload));
    },
    listBrokerAccountSnapshots(limit = 50) {
      return context.executionRuntime.listBrokerAccountSnapshots(limit);
    },
    appendBrokerAccountSnapshot(payload: any) {
      return context.executionRuntime.appendBrokerAccountSnapshot(withScopeMetadata(payload));
    },
    listBrokerExecutionEvents(limit = 50, filter: any = {}) {
      return context.executionRuntime.listBrokerExecutionEvents(limit, filter);
    },
    appendBrokerExecutionEvent(payload: any) {
      return context.executionRuntime.appendBrokerExecutionEvent(withScopeMetadata(payload));
    },
    recordExecutionRuntime(payload: any) {
      const runtimeEvent = context.executionRuntime.appendExecutionRuntimeEvent(
        withScopeMetadata(payload)
      );
      const brokerSnapshot = context.executionRuntime.appendBrokerAccountSnapshot(
        withScopeMetadata({
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
        })
      );

      context.audit.appendAuditRecord({
        type: 'execution-runtime',
        actor: payload.actor || 'task-orchestrator',
        title: `Execution runtime synced for cycle ${payload.cycle}`,
        detail: payload.message || 'Execution runtime snapshot recorded.',
        metadata: withScopeMetaRecord({
          cycleId: payload.cycleId,
          submittedOrderCount: payload.submittedOrderCount,
          rejectedOrderCount: payload.rejectedOrderCount,
          brokerConnected: payload.brokerConnected,
        }),
      });

      return {
        runtimeEvent,
        brokerSnapshot,
      };
    },
    getMarketProviderStatus() {
      return context.marketProviders.getMarketProviderStatus();
    },
    updateMarketProviderStatus(snapshot: any = {}) {
      return context.marketProviders.updateMarketProviderStatus(snapshot);
    },
    listMonitoringSnapshots(limit = 50, filter: any = {}) {
      return context.monitoring.listMonitoringSnapshots(limit, withScopedFilter(filter));
    },
    listMonitoringAlerts(limit = 100, filter: any = {}) {
      return context.monitoring.listMonitoringAlerts(limit, withScopedFilter(filter));
    },
    recordMonitoringSnapshot(payload: any = {}) {
      return context.monitoring.recordMonitoringSnapshot(withScopeMetadata(payload));
    },
    listIncidents(limit = 50, filter: any = {}) {
      return context.incidents.listIncidents(limit, withScopedFilter(filter));
    },
    getIncident(incidentId: any) {
      return isVisibleInCurrentScope(context.incidents.getIncident(incidentId));
    },
    listIncidentActivities(incidentId: any, limit = 100) {
      return context.incidents.listIncidentActivities(incidentId, limit);
    },
    listIncidentTasks(incidentId: any, limit = 100) {
      return context.incidents.listIncidentTasks(incidentId, limit);
    },
    listIncidentNotes(incidentId: any, limit = 100) {
      return context.incidents.listIncidentNotes(incidentId, limit);
    },
    appendIncident(payload: any = {}) {
      return context.incidents.appendIncident(withScopeMetadata(payload));
    },
    recordIncident(payload: any = {}) {
      const incident = context.incidents.appendIncident(withScopeMetadata(payload));

      context.audit.appendAuditRecord({
        type: 'incident',
        actor: payload.actor || incident.owner || 'operator',
        title: `Incident opened: ${incident.title}`,
        detail: incident.summary || 'Incident created from the investigation console.',
        metadata: withScopeMetaRecord({
          incidentId: incident.id,
          severity: incident.severity,
          status: incident.status,
          source: incident.source,
          owner: incident.owner,
          links: incident.links,
        }),
      });

      context.notifications.enqueueNotification({
        level: incident.severity === 'critical' ? 'critical' : 'warn',
        source: 'control-plane',
        title: 'Incident opened',
        message: incident.title,
        metadata: withScopeMetaRecord({
          incidentId: incident.id,
          severity: incident.severity,
          status: incident.status,
          source: incident.source,
        }),
      });

      return incident;
    },
    updateIncident(incidentId: any, patch: any = {}) {
      return context.incidents.updateIncident(incidentId, patch);
    },
    transitionIncident(incidentId: any, patch: any = {}) {
      const incident = context.incidents.updateIncident(incidentId, patch);
      if (!incident) return null;

      context.audit.appendAuditRecord({
        type: 'incident.transition',
        actor: patch.actor || incident.owner || 'operator',
        title: `Incident ${incident.status}`,
        detail: patch.summary || incident.summary || incident.title,
        metadata: withScopeMetaRecord({
          incidentId: incident.id,
          severity: incident.severity,
          status: incident.status,
          owner: incident.owner,
          source: incident.source,
        }),
      });

      context.notifications.enqueueNotification({
        level: incident.status === 'resolved' ? 'info' : incident.severity,
        source: 'control-plane',
        title: `Incident ${incident.status}`,
        message: incident.title,
        metadata: withScopeMetaRecord({
          incidentId: incident.id,
          severity: incident.severity,
          status: incident.status,
          owner: incident.owner,
        }),
      });

      return incident;
    },
    appendIncidentNote(incidentId: any, payload: any = {}) {
      return context.incidents.appendIncidentNote(incidentId, withScopeMetadata(payload));
    },
    appendIncidentTask(incidentId: any, payload: any = {}) {
      return context.incidents.appendIncidentTask(incidentId, withScopeMetadata(payload));
    },
    updateIncidentTask(incidentId: any, taskId: any, payload: any = {}) {
      return context.incidents.updateIncidentTask(incidentId, taskId, payload);
    },
    recordIncidentNote(incidentId: any, payload: any = {}) {
      const note = context.incidents.appendIncidentNote(incidentId, withScopeMetadata(payload));
      if (!note) return null;
      const incident = context.incidents.getIncident(incidentId);

      context.audit.appendAuditRecord({
        type: 'incident.note',
        actor: payload.author || 'operator',
        title: 'Incident note added',
        detail: note.body,
        metadata: withScopeMetaRecord({
          incidentId,
          incidentTitle: incident?.title || '',
        }),
      });

      return {
        note,
        incident,
      };
    },
    recordIncidentTask(incidentId: any, payload: any = {}) {
      return context.incidents.appendIncidentTask(incidentId, withScopeMetadata(payload));
    },
    transitionIncidentTask(incidentId: any, taskId: any, payload: any = {}) {
      return context.incidents.updateIncidentTask(incidentId, taskId, payload);
    },
    listNotifications(limit = 50, filter: any = {}) {
      return context.notifications.listNotifications(limit, withScopedFilter(filter));
    },
    appendNotification(event: any) {
      return context.notifications.appendNotification(withScopeMetadata(event));
    },
    enqueueNotification(event: any) {
      return context.notifications.enqueueNotification(withScopeMetadata(event));
    },
    listNotificationJobs(limit = 50) {
      return context.notifications.listNotificationJobs(limit);
    },
    dispatchPendingNotifications(options: any = {}) {
      return context.notifications.dispatchPendingNotifications(options);
    },
    getResearchSummary() {
      return context.researchSummary.getResearchSummary();
    },
    updateResearchSummary(summary: any = {}) {
      return context.researchSummary.updateResearchSummary(summary);
    },
    listResearchTasks(limit = 100, filter: any = {}) {
      return context.researchTasks.listResearchTasks(limit, filter);
    },
    getResearchTask(taskId: any) {
      return context.researchTasks.getResearchTask(taskId);
    },
    findResearchTaskByWorkflowRunId(workflowRunId: any) {
      return context.researchTasks.findResearchTaskByWorkflowRunId(workflowRunId);
    },
    findResearchTaskByRunId(runId: any) {
      return context.researchTasks.findResearchTaskByRunId(runId);
    },
    appendResearchTask(payload: any = {}) {
      return context.researchTasks.appendResearchTask(withScopeMetadata(payload));
    },
    updateResearchTask(taskId: any, patch: any = {}) {
      return context.researchTasks.updateResearchTask(taskId, patch);
    },
    upsertResearchTask(payload: any = {}) {
      return context.researchTasks.upsertResearchTask(withScopeMetadata(payload));
    },
    listRiskEvents(limit = 50, filter: any = {}) {
      return context.risk.listRiskEvents(limit, withScopedFilter(filter));
    },
    appendRiskEvent(event: any) {
      return context.risk.appendRiskEvent(withScopeMetadata(event));
    },
    enqueueRiskScan(payload: any) {
      return context.risk.enqueueRiskScan(withScopeMetadata(payload));
    },
    listRiskScanJobs(limit = 50) {
      return context.risk.listRiskScanJobs(limit);
    },
    dispatchPendingRiskScans(options: any = {}) {
      return context.risk.dispatchPendingRiskScans(options);
    },
    listSchedulerTicks(limit = 50, filter: any = {}) {
      return context.scheduler.listSchedulerTicks(limit, withScopedFilter(filter));
    },
    recordSchedulerTick(options: any = {}) {
      return context.scheduler.recordSchedulerTick(options);
    },
    listStrategyCatalog(limit = 100) {
      return context.strategyCatalog.listStrategies(limit);
    },
    getStrategyCatalogItem(strategyId: any) {
      return context.strategyCatalog.getStrategy(strategyId);
    },
    upsertStrategyCatalogItem(payload: any = {}) {
      return context.strategyCatalog.upsertStrategy(payload);
    },
    getUserAccount() {
      return context.userAccount.getUserAccount();
    },
    getUserProfile() {
      return context.userAccount.getUserProfile();
    },
    getTenant() {
      return context.userAccount.getTenant();
    },
    listWorkspaces() {
      return context.userAccount.listWorkspaces();
    },
    getCurrentWorkspace() {
      return context.userAccount.getCurrentWorkspace();
    },
    updateUserProfile(patch: any = {}) {
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
    getUserRoleTemplate(roleId: any) {
      return context.userAccount.getRoleTemplate(roleId);
    },
    getBrokerBindingSummary() {
      return context.userAccount.getBrokerSummary();
    },
    updateUserPreferences(patch: any = {}) {
      return context.userAccount.updateUserPreferences(patch);
    },
    updateUserAccess(patch: any = {}) {
      return context.userAccount.updateUserAccess(patch);
    },
    upsertUserRoleTemplate(payload: any = {}) {
      return context.userAccount.upsertRoleTemplate(payload);
    },
    upsertWorkspace(payload: any = {}) {
      return context.userAccount.upsertWorkspace(payload);
    },
    setCurrentWorkspace(workspaceId: any) {
      return context.userAccount.setCurrentWorkspace(workspaceId);
    },
    deleteUserRoleTemplate(roleId: any) {
      return context.userAccount.deleteRoleTemplate(roleId);
    },
    listBrokerBindings() {
      return context.userAccount.listBrokerBindings();
    },
    upsertBrokerBinding(payload: any = {}) {
      return context.userAccount.upsertBrokerBinding(payload);
    },
    setDefaultBrokerBinding(bindingId: any) {
      return context.userAccount.setDefaultBrokerBinding(bindingId);
    },
    deleteBrokerBinding(bindingId: any) {
      return context.userAccount.deleteBrokerBinding(bindingId);
    },
    listWorkerHeartbeats(limit = 50, filter: any = {}) {
      return context.workerHeartbeats.listWorkerHeartbeats(limit, withScopedFilter(filter));
    },
    getLatestWorkerHeartbeat(worker = '') {
      return (
        this.listWorkerHeartbeats(120).find((item: any) => !worker || item.worker === worker) ||
        null
      );
    },
    recordWorkerHeartbeat(payload: any = {}) {
      return context.workerHeartbeats.recordWorkerHeartbeat(payload);
    },
    listWorkflowRuns(limit = 50, filter: any = {}) {
      return context.workflows.listWorkflowRuns(limit, withScopedFilter(filter));
    },
    getWorkflowRun(workflowRunId: any) {
      return isVisibleInCurrentScope(context.workflows.getWorkflowRun(workflowRunId));
    },
    startWorkflowRun(payload: any) {
      return context.workflows.appendWorkflowRun({
        ...withScopeMetadata(payload),
        status: payload.status || 'running',
        attempt: Number(payload.attempt || 1),
        startedAt: payload.startedAt || new Date().toISOString(),
        nextRunAt: payload.nextRunAt || new Date().toISOString(),
      });
    },
    enqueueWorkflowRun(payload: any) {
      return context.workflows.appendWorkflowRun({
        ...withScopeMetadata(payload),
        status: payload.status || 'queued',
        startedAt: '',
        nextRunAt: payload.nextRunAt || new Date().toISOString(),
      });
    },
    completeWorkflowRun(workflowRunId: any, patch: any = {}) {
      return context.workflows.updateWorkflowRun(workflowRunId, {
        ...patch,
        status: 'completed',
        completedAt: patch.completedAt || new Date().toISOString(),
        lockedBy: '',
        lockedAt: '',
      });
    },
    failWorkflowRun(workflowRunId: any, error: any, patch: any = {}) {
      const current = context.workflows.getWorkflowRun(workflowRunId);
      const nextAttempt = Number(current?.attempt || 1);
      const maxAttempts = Number(current?.maxAttempts || patch.maxAttempts || 3);
      const canRetry = patch.retryable !== false && nextAttempt < maxAttempts;
      const failedAt = patch.failedAt || new Date().toISOString();
      const workflow = context.workflows.updateWorkflowRun(workflowRunId, {
        ...patch,
        status: canRetry ? 'retry_scheduled' : 'failed',
        failedAt,
        nextRunAt: canRetry
          ? patch.nextRunAt || new Date(Date.now() + 60_000).toISOString()
          : patch.nextRunAt || '',
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
          canRetry
            ? `Workflow retry scheduled ${workflow.workflowId}`
            : `Workflow failed ${workflow.workflowId}`,
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
    resumeWorkflowRun(workflowRunId: any, patch: any = {}) {
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
    cancelWorkflowRun(workflowRunId: any, patch: any = {}) {
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
    releaseScheduledWorkflowRuns(options: any = {}) {
      const result = context.workflows.releaseScheduledWorkflowRuns(options);
      result.workflows.forEach((workflow: any) => {
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
    claimQueuedWorkflowRuns(options: any = {}) {
      return context.workflows.claimQueuedWorkflowRuns(options);
    },
  };
}

export const controlPlaneRuntime = createControlPlaneRuntime();
export const getUserAccount = (...args: any[]) =>
  (controlPlaneRuntime as any).getUserAccount(...args);
export const getUserProfile = (...args: any[]) =>
  (controlPlaneRuntime as any).getUserProfile(...args);
export const getTenant = (...args: any[]) => (controlPlaneRuntime as any).getTenant(...args);
export const listWorkspaces = (...args: any[]) =>
  (controlPlaneRuntime as any).listWorkspaces(...args);
export const getCurrentWorkspace = (...args: any[]) =>
  (controlPlaneRuntime as any).getCurrentWorkspace(...args);
export const updateUserProfile = (...args: any[]) =>
  (controlPlaneRuntime as any).updateUserProfile(...args);
export const getUserPreferences = (...args: any[]) =>
  (controlPlaneRuntime as any).getUserPreferences(...args);
export const getUserAccess = (...args: any[]) =>
  (controlPlaneRuntime as any).getUserAccess(...args);
export const getUserAccessSummary = (...args: any[]) =>
  (controlPlaneRuntime as any).getUserAccessSummary(...args);
export const listUserRoleTemplates = (...args: any[]) =>
  (controlPlaneRuntime as any).listUserRoleTemplates(...args);
export const getUserRoleTemplate = (...args: any[]) =>
  (controlPlaneRuntime as any).getUserRoleTemplate(...args);
export const getBrokerBindingSummary = (...args: any[]) =>
  (controlPlaneRuntime as any).getBrokerBindingSummary(...args);
export const updateUserPreferences = (...args: any[]) =>
  (controlPlaneRuntime as any).updateUserPreferences(...args);
export const updateUserAccess = (...args: any[]) =>
  (controlPlaneRuntime as any).updateUserAccess(...args);
export const upsertUserRoleTemplate = (...args: any[]) =>
  (controlPlaneRuntime as any).upsertUserRoleTemplate(...args);
export const deleteUserRoleTemplate = (...args: any[]) =>
  (controlPlaneRuntime as any).deleteUserRoleTemplate(...args);
export const upsertWorkspace = (...args: any[]) =>
  (controlPlaneRuntime as any).upsertWorkspace(...args);
export const setCurrentWorkspace = (...args: any[]) =>
  (controlPlaneRuntime as any).setCurrentWorkspace(...args);
export const listBrokerBindings = (...args: any[]) =>
  (controlPlaneRuntime as any).listBrokerBindings(...args);
export const upsertBrokerBinding = (...args: any[]) =>
  (controlPlaneRuntime as any).upsertBrokerBinding(...args);
export const setDefaultBrokerBinding = (...args: any[]) =>
  (controlPlaneRuntime as any).setDefaultBrokerBinding(...args);
export const deleteBrokerBinding = (...args: any[]) =>
  (controlPlaneRuntime as any).deleteBrokerBinding(...args);
export const listExecutionRuntimeEvents = (...args: any[]) =>
  (controlPlaneRuntime as any).listExecutionRuntimeEvents(...args);
export const listBrokerAccountSnapshots = (...args: any[]) =>
  (controlPlaneRuntime as any).listBrokerAccountSnapshots(...args);
export const listBrokerExecutionEvents = (...args: any[]) =>
  (controlPlaneRuntime as any).listBrokerExecutionEvents(...args);
export const listAgentPolicies = (...args: any[]) =>
  (controlPlaneRuntime as any).listAgentPolicies(...args);
export const getAgentPolicy = (...args: any[]) =>
  (controlPlaneRuntime as any).getAgentPolicy(...args);
export const appendAgentPolicy = (...args: any[]) =>
  (controlPlaneRuntime as any).appendAgentPolicy(...args);
export const saveAgentPolicy = (...args: any[]) =>
  (controlPlaneRuntime as any).saveAgentPolicy(...args);
export const recordAgentPolicy = (...args: any[]) =>
  (controlPlaneRuntime as any).recordAgentPolicy(...args);
export const updateAgentPolicy = (...args: any[]) =>
  (controlPlaneRuntime as any).updateAgentPolicy(...args);
export const listAgentInstructions = (...args: any[]) =>
  (controlPlaneRuntime as any).listAgentInstructions(...args);
export const getAgentInstruction = (...args: any[]) =>
  (controlPlaneRuntime as any).getAgentInstruction(...args);
export const appendAgentInstruction = (...args: any[]) =>
  (controlPlaneRuntime as any).appendAgentInstruction(...args);
export const recordAgentInstruction = (...args: any[]) =>
  (controlPlaneRuntime as any).recordAgentInstruction(...args);
export const updateAgentInstruction = (...args: any[]) =>
  (controlPlaneRuntime as any).updateAgentInstruction(...args);
export const listAgentDailyRuns = (...args: any[]) =>
  (controlPlaneRuntime as any).listAgentDailyRuns(...args);
export const getAgentDailyRun = (...args: any[]) =>
  (controlPlaneRuntime as any).getAgentDailyRun(...args);
export const appendAgentDailyRun = (...args: any[]) =>
  (controlPlaneRuntime as any).appendAgentDailyRun(...args);
export const recordAgentDailyRun = (...args: any[]) =>
  (controlPlaneRuntime as any).recordAgentDailyRun(...args);
export const updateAgentDailyRun = (...args: any[]) =>
  (controlPlaneRuntime as any).updateAgentDailyRun(...args);
export const queueAgentDailyRun = (...args: any[]) =>
  (controlPlaneRuntime as any).queueAgentDailyRun(...args);
export const listAgentAuthorityEvents = (...args: any[]) =>
  (controlPlaneRuntime as any).listAgentAuthorityEvents(...args);
export const getAgentAuthorityEvent = (...args: any[]) =>
  (controlPlaneRuntime as any).getAgentAuthorityEvent(...args);
export const appendAgentAuthorityEvent = (...args: any[]) =>
  (controlPlaneRuntime as any).appendAgentAuthorityEvent(...args);
export const recordAgentAuthorityEvent = (...args: any[]) =>
  (controlPlaneRuntime as any).recordAgentAuthorityEvent(...args);
export const updateAgentAuthorityEvent = (...args: any[]) =>
  (controlPlaneRuntime as any).updateAgentAuthorityEvent(...args);
export const getAgentGovernanceSnapshot = (...args: any[]) =>
  (controlPlaneRuntime as any).getAgentGovernanceSnapshot(...args);
export const listExecutionRuns = (...args: any[]) =>
  (controlPlaneRuntime as any).listExecutionRuns(...args);
export const getExecutionRun = (...args: any[]) =>
  (controlPlaneRuntime as any).getExecutionRun(...args);
export const getExecutionRunByPlanId = (...args: any[]) =>
  (controlPlaneRuntime as any).getExecutionRunByPlanId(...args);
export const listExecutionOrderStates = (...args: any[]) =>
  (controlPlaneRuntime as any).listExecutionOrderStates(...args);
export const listExecutionCandidateHandoffs = (...args: any[]) =>
  (controlPlaneRuntime as any).listExecutionCandidateHandoffs(...args);
export const getExecutionCandidateHandoff = (...args: any[]) =>
  (controlPlaneRuntime as any).getExecutionCandidateHandoff(...args);
export const getLatestExecutionCandidateHandoffForStrategy = (...args: any[]) =>
  (controlPlaneRuntime as any).getLatestExecutionCandidateHandoffForStrategy(...args);
export const appendExecutionCandidateHandoff = (...args: any[]) =>
  (controlPlaneRuntime as any).appendExecutionCandidateHandoff(...args);
export const updateExecutionCandidateHandoff = (...args: any[]) =>
  (controlPlaneRuntime as any).updateExecutionCandidateHandoff(...args);
export const recordExecutionRun = (...args: any[]) =>
  (controlPlaneRuntime as any).recordExecutionRun(...args);
export const updateExecutionRun = (...args: any[]) =>
  (controlPlaneRuntime as any).updateExecutionRun(...args);
export const updateExecutionOrderState = (...args: any[]) =>
  (controlPlaneRuntime as any).updateExecutionOrderState(...args);
export const updateExecutionPlan = (...args: any[]) =>
  (controlPlaneRuntime as any).updateExecutionPlan(...args);
export const appendBrokerExecutionEvent = (...args: any[]) =>
  (controlPlaneRuntime as any).appendBrokerExecutionEvent(...args);
export const listBacktestRuns = (...args: any[]) =>
  (controlPlaneRuntime as any).listBacktestRuns(...args);
export const listBacktestResults = (...args: any[]) =>
  (controlPlaneRuntime as any).listBacktestResults(...args);
export const listBacktestResultsForRun = (...args: any[]) =>
  (controlPlaneRuntime as any).listBacktestResultsForRun(...args);
export const getBacktestResult = (...args: any[]) =>
  (controlPlaneRuntime as any).getBacktestResult(...args);
export const getLatestBacktestResultForRun = (...args: any[]) =>
  (controlPlaneRuntime as any).getLatestBacktestResultForRun(...args);
export const appendBacktestResult = (...args: any[]) =>
  (controlPlaneRuntime as any).appendBacktestResult(...args);
export const listResearchEvaluations = (...args: any[]) =>
  (controlPlaneRuntime as any).listResearchEvaluations(...args);
export const getResearchEvaluation = (...args: any[]) =>
  (controlPlaneRuntime as any).getResearchEvaluation(...args);
export const getLatestEvaluationForRun = (...args: any[]) =>
  (controlPlaneRuntime as any).getLatestEvaluationForRun(...args);
export const getLatestEvaluationForStrategy = (...args: any[]) =>
  (controlPlaneRuntime as any).getLatestEvaluationForStrategy(...args);
export const appendResearchEvaluation = (...args: any[]) =>
  (controlPlaneRuntime as any).appendResearchEvaluation(...args);
export const listResearchReports = (...args: any[]) =>
  (controlPlaneRuntime as any).listResearchReports(...args);
export const getResearchReport = (...args: any[]) =>
  (controlPlaneRuntime as any).getResearchReport(...args);
export const getLatestResearchReportForRun = (...args: any[]) =>
  (controlPlaneRuntime as any).getLatestResearchReportForRun(...args);
export const getLatestResearchReportForStrategy = (...args: any[]) =>
  (controlPlaneRuntime as any).getLatestResearchReportForStrategy(...args);
export const appendResearchReport = (...args: any[]) =>
  (controlPlaneRuntime as any).appendResearchReport(...args);
export const getBacktestRun = (...args: any[]) =>
  (controlPlaneRuntime as any).getBacktestRun(...args);
export const findBacktestRunByWorkflowRunId = (...args: any[]) =>
  (controlPlaneRuntime as any).findBacktestRunByWorkflowRunId(...args);
export const appendBacktestRun = (...args: any[]) =>
  (controlPlaneRuntime as any).appendBacktestRun(...args);
export const updateBacktestRun = (...args: any[]) =>
  (controlPlaneRuntime as any).updateBacktestRun(...args);
export const getResearchSummary = (...args: any[]) =>
  (controlPlaneRuntime as any).getResearchSummary(...args);
export const updateResearchSummary = (...args: any[]) =>
  (controlPlaneRuntime as any).updateResearchSummary(...args);
export const listResearchTasks = (...args: any[]) =>
  (controlPlaneRuntime as any).listResearchTasks(...args);
export const getResearchTask = (...args: any[]) =>
  (controlPlaneRuntime as any).getResearchTask(...args);
export const findResearchTaskByWorkflowRunId = (...args: any[]) =>
  (controlPlaneRuntime as any).findResearchTaskByWorkflowRunId(...args);
export const findResearchTaskByRunId = (...args: any[]) =>
  (controlPlaneRuntime as any).findResearchTaskByRunId(...args);
export const appendResearchTask = (...args: any[]) =>
  (controlPlaneRuntime as any).appendResearchTask(...args);
export const updateResearchTask = (...args: any[]) =>
  (controlPlaneRuntime as any).updateResearchTask(...args);
export const upsertResearchTask = (...args: any[]) =>
  (controlPlaneRuntime as any).upsertResearchTask(...args);
export const listStrategyCatalog = (...args: any[]) =>
  (controlPlaneRuntime as any).listStrategyCatalog(...args);
export const getStrategyCatalogItem = (...args: any[]) =>
  (controlPlaneRuntime as any).getStrategyCatalogItem(...args);
export const upsertStrategyCatalogItem = (...args: any[]) =>
  (controlPlaneRuntime as any).upsertStrategyCatalogItem(...args);
export const getMarketProviderStatus = (...args: any[]) =>
  (controlPlaneRuntime as any).getMarketProviderStatus(...args);
export const updateMarketProviderStatus = (...args: any[]) =>
  (controlPlaneRuntime as any).updateMarketProviderStatus(...args);
export const listMonitoringSnapshots = (...args: any[]) =>
  (controlPlaneRuntime as any).listMonitoringSnapshots(...args);
export const listMonitoringAlerts = (...args: any[]) =>
  (controlPlaneRuntime as any).listMonitoringAlerts(...args);
export const listIncidents = (...args: any[]) =>
  (controlPlaneRuntime as any).listIncidents(...args);
export const getIncident = (...args: any[]) => (controlPlaneRuntime as any).getIncident(...args);
export const listIncidentNotes = (...args: any[]) =>
  (controlPlaneRuntime as any).listIncidentNotes(...args);
export const appendIncident = (...args: any[]) =>
  (controlPlaneRuntime as any).appendIncident(...args);
export const recordIncident = (...args: any[]) =>
  (controlPlaneRuntime as any).recordIncident(...args);
export const updateIncident = (...args: any[]) =>
  (controlPlaneRuntime as any).updateIncident(...args);
export const transitionIncident = (...args: any[]) =>
  (controlPlaneRuntime as any).transitionIncident(...args);
export const appendIncidentNote = (...args: any[]) =>
  (controlPlaneRuntime as any).appendIncidentNote(...args);
export const recordIncidentNote = (...args: any[]) =>
  (controlPlaneRuntime as any).recordIncidentNote(...args);
export const listWorkerHeartbeats = (...args: any[]) =>
  (controlPlaneRuntime as any).listWorkerHeartbeats(...args);
export const getLatestWorkerHeartbeat = (...args: any[]) =>
  (controlPlaneRuntime as any).getLatestWorkerHeartbeat(...args);
export const listWorkflowRuns = (...args: any[]) =>
  (controlPlaneRuntime as any).listWorkflowRuns(...args);
export const getWorkflowRun = (...args: any[]) =>
  (controlPlaneRuntime as any).getWorkflowRun(...args);

export { refreshBacktestSummary } from '../../../apps/api/src/domains/backtest/services/summary-service.js';
// Domain service re-exports for worker decoupling (no apps/api cross-imports needed)
export { recordExecutionPlan } from '../../../apps/api/src/domains/execution/services/command-service.js';
export {
  assessAgentActionRequestRisk,
  assessExecutionCandidate,
} from '../../../apps/api/src/domains/risk/services/assessment-service.js';
export { buildStrategyExecutionCandidate } from '../../../apps/api/src/domains/strategy/services/execution-candidate-service.js';

// Notification channels
export {
  buildWebhookPayload,
  createDefaultPreference,
  createWebSocketMessage,
  type EmailConfig,
  type EmailDeliveryResult,
  type EmailMessage,
  type EmailTemplate,
  getEnabledChannels,
  isQuietHours,
  type NotificationChannel,
  type NotificationEventType,
  type NotificationPreference,
  renderEmailTemplate,
  sendEmail,
  sendWebhook,
  setEventRouting,
  shouldSendNotification,
  signPayload,
  updateChannelConfig,
  verifySignature,
  type WebhookConfig,
  type WebhookDeliveryResult,
  type WebhookPayload,
  WebSocketChannelManager,
  type WebSocketClient,
  type WebSocketConfig,
  type WebSocketDeliveryResult,
  type WebSocketMessage,
} from './domains/notifications/index.js';
