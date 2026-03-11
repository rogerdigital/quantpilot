import {
  advanceLocalState,
  applyControlPlaneResolution,
  buildCyclePayload,
} from '../../trading-engine/src/runtime.mjs';

function startWorkflow(context, payload) {
  if (typeof context.startWorkflow === 'function') {
    return context.startWorkflow(payload);
  }
  return context.startWorkflowRun(payload);
}

function completeWorkflow(context, workflowRunId, patch) {
  if (typeof context.completeWorkflow === 'function') {
    return context.completeWorkflow(workflowRunId, patch);
  }
  return context.completeWorkflowRun(workflowRunId, patch);
}

function failWorkflow(context, workflowRunId, error, patch) {
  if (typeof context.failWorkflow === 'function') {
    return context.failWorkflow(workflowRunId, error, patch);
  }
  return context.failWorkflowRun(workflowRunId, error, patch);
}

function getBrokerProvider(state) {
  return state?.integrationStatus?.broker?.provider || 'simulated';
}

function getMarketProvider(state) {
  return state?.integrationStatus?.marketData?.provider || 'simulated';
}

function getTrackedSymbols(state) {
  return Array.isArray(state?.stockStates)
    ? state.stockStates.map((stock) => stock.symbol).filter(Boolean)
    : [];
}

function buildMockBacktestMetrics(strategy, runId) {
  const seed = String(runId || strategy.id)
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const variance = (seed % 9) / 10;
  const annualizedReturnPct = Number((Math.max(strategy.expectedReturnPct - 2 + variance, 4)).toFixed(1));
  const maxDrawdownPct = Number((Math.max(strategy.maxDrawdownPct + (seed % 4) * 0.6, 4)).toFixed(1));
  const sharpe = Number((Math.max(strategy.sharpe - 0.15 + variance / 4, 0.4)).toFixed(2));
  const winRatePct = Number((52 + (seed % 10) * 1.1).toFixed(1));
  const turnoverPct = Number((110 + (seed % 7) * 14).toFixed(0));
  const status = maxDrawdownPct > 10 || sharpe < 1 ? 'needs_review' : 'completed';

  return {
    status,
    annualizedReturnPct,
    maxDrawdownPct,
    sharpe,
    winRatePct,
    turnoverPct,
    summary: status === 'needs_review'
      ? `${strategy.name} completed with elevated review pressure because drawdown or Sharpe is outside the current promotion gate.`
      : `${strategy.name} completed inside the current research promotion envelope.`,
  };
}

async function executeStrategyExecutionWorkflow(payload, context, options = {}) {
  const workflow = options.workflow || startWorkflow(context, {
    workflowId: 'task-orchestrator.strategy-execution',
    workflowType: 'task-orchestrator',
    actor: payload.requestedBy || context.getOperatorName(),
    trigger: options.trigger || 'api',
    payload,
    maxAttempts: Number(payload.maxAttempts || 3),
    steps: [
      { key: 'load-strategy-candidate', status: 'running' },
      { key: 'evaluate-risk', status: 'pending' },
      { key: 'persist-execution-plan', status: 'pending' },
      { key: 'enqueue-risk-scan', status: 'pending' },
    ],
  });

  try {
    const candidate = await context.buildStrategyExecutionCandidate(payload);
    const riskDecision = await context.assessExecutionCandidate(candidate);
    const plan = await context.recordExecutionPlan({
      workflowRunId: workflow.id,
      strategyId: candidate.strategyId,
      strategyName: candidate.strategyName,
      mode: candidate.mode,
      status: riskDecision.riskStatus === 'blocked' ? 'blocked' : 'ready',
      approvalState: riskDecision.approvalState,
      riskStatus: riskDecision.riskStatus,
      summary: riskDecision.summary,
      capital: candidate.capital,
      orderCount: candidate.orders.length,
      orders: candidate.orders,
      actor: payload.requestedBy || context.getOperatorName(),
      metadata: {
        ...candidate.metadata,
        metrics: candidate.metrics,
        reasons: riskDecision.reasons,
      },
    });

    context.queueRiskScan({
      cycle: 0,
      mode: payload.mode || 'paper',
      riskLevel: riskDecision.riskStatus === 'blocked' ? 'RISK OFF' : 'NORMAL',
      pendingApprovals: riskDecision.approvalState === 'required' ? plan.orderCount : 0,
      brokerConnected: true,
      marketConnected: true,
      paperExposure: 0,
      liveExposure: payload.mode === 'live' ? 100 : 0,
      routeHint: riskDecision.summary,
      source: 'strategy-execution',
    });

    const persistedWorkflow = completeWorkflow(context, workflow.id, {
      steps: [
        { key: 'load-strategy-candidate', status: 'completed', strategyId: candidate.strategyId },
        { key: 'evaluate-risk', status: 'completed', riskStatus: riskDecision.riskStatus },
        { key: 'persist-execution-plan', status: 'completed', executionPlanId: plan.id },
        { key: 'enqueue-risk-scan', status: 'completed' },
      ],
      result: {
        ok: true,
        executionPlanId: plan.id,
        riskStatus: riskDecision.riskStatus,
        orderCount: plan.orderCount,
      },
    });

    return {
      ok: true,
      executionPlan: plan,
      riskDecision,
      workflow: persistedWorkflow,
    };
  } catch (error) {
    const failedWorkflow = failWorkflow(context, workflow.id, error instanceof Error ? error.message : 'unknown strategy execution error', {
      steps: [
        { key: 'load-strategy-candidate', status: 'failed' },
        { key: 'evaluate-risk', status: 'skipped' },
        { key: 'persist-execution-plan', status: 'skipped' },
        { key: 'enqueue-risk-scan', status: 'skipped' },
      ],
    });
    throw Object.assign(error instanceof Error ? error : new Error('strategy execution workflow failed'), {
      workflowId: failedWorkflow?.id,
    });
  }
}

async function executeAgentActionRequestWorkflow(payload, context, options = {}) {
  const workflow = options.workflow || startWorkflow(context, {
    workflowId: 'task-orchestrator.agent-action-request',
    workflowType: 'task-orchestrator',
    actor: payload.requestedBy || context.getOperatorName(),
    trigger: options.trigger || 'agent',
    payload,
    maxAttempts: Number(payload.maxAttempts || 2),
    steps: [
      { key: 'validate-request', status: 'running' },
      { key: 'assess-risk-gate', status: 'pending' },
      { key: 'persist-action-request', status: 'pending' },
      { key: 'fanout-review-notification', status: 'pending' },
    ],
  });

  try {
    const gate = await context.assessAgentActionRequestRisk(payload);
    const request = await context.recordAgentActionRequest({
      workflowRunId: workflow.id,
      requestType: payload.requestType,
      targetId: payload.targetId || '',
      status: gate.status,
      approvalState: gate.approvalState,
      riskStatus: gate.riskStatus,
      summary: gate.summary || payload.summary || `${payload.requestType} request submitted by Agent.`,
      rationale: payload.rationale || '',
      requestedBy: payload.requestedBy || context.getOperatorName(),
      metadata: {
        channel: 'agent',
        reasons: gate.reasons,
      },
    });

    const persistedWorkflow = completeWorkflow(context, workflow.id, {
      steps: [
        { key: 'validate-request', status: 'completed', requestType: payload.requestType },
        { key: 'assess-risk-gate', status: 'completed', riskStatus: gate.riskStatus, approvalState: gate.approvalState },
        { key: 'persist-action-request', status: 'completed', agentActionRequestId: request.id },
        { key: 'fanout-review-notification', status: 'completed' },
      ],
      result: {
        ok: true,
        agentActionRequestId: request.id,
        status: request.status,
        riskStatus: request.riskStatus,
      },
    });

    return {
      ok: true,
      request,
      workflow: persistedWorkflow,
    };
  } catch (error) {
    const failedWorkflow = failWorkflow(context, workflow.id, error instanceof Error ? error.message : 'unknown agent action request error', {
      steps: [
        { key: 'validate-request', status: 'failed' },
        { key: 'assess-risk-gate', status: 'skipped' },
        { key: 'persist-action-request', status: 'skipped' },
        { key: 'fanout-review-notification', status: 'skipped' },
      ],
      retryable: false,
    });
    throw Object.assign(error instanceof Error ? error : new Error('agent action request workflow failed'), {
      workflowId: failedWorkflow?.id,
    });
  }
}

async function executeBacktestRunWorkflow(payload, context, options = {}) {
  const workflow = options.workflow || startWorkflow(context, {
    workflowId: 'task-orchestrator.backtest-run',
    workflowType: 'task-orchestrator',
    actor: payload.requestedBy || context.getOperatorName(),
    trigger: options.trigger || 'api',
    payload,
    maxAttempts: Number(payload.maxAttempts || 2),
    steps: [
      { key: 'load-strategy', status: 'running' },
      { key: 'mark-run-running', status: 'pending' },
      { key: 'produce-backtest-result', status: 'pending' },
      { key: 'refresh-research-summary', status: 'pending' },
    ],
  });

  const existingRun = context.findBacktestRunByWorkflowRunId?.(workflow.id);

  try {
    const strategy = context.getStrategyCatalogItem(payload.strategyId);
    if (!strategy) {
      throw new Error(`Unknown strategy: ${payload.strategyId}`);
    }

    const run = existingRun || context.appendBacktestRun({
      workflowRunId: workflow.id,
      strategyId: strategy.id,
      strategyName: strategy.name,
      status: 'queued',
      windowLabel: payload.windowLabel || '2024-01-01 -> 2026-03-01',
      requestedBy: payload.requestedBy || context.getOperatorName(),
      summary: `${strategy.name} was reconstructed from workflow state before execution.`,
    });

    const runningRun = context.updateBacktestRun(run.id, {
      status: 'running',
      startedAt: run.startedAt || new Date().toISOString(),
      summary: `${strategy.name} is running inside the research workflow executor.`,
    });

    const metrics = buildMockBacktestMetrics(strategy, run.id);
    const completedRun = context.updateBacktestRun(run.id, {
      ...metrics,
      completedAt: new Date().toISOString(),
    });
    const summary = context.refreshBacktestSummary?.('task-workflow-engine.backtest-run') || null;

    context.appendAuditRecord?.({
      type: 'backtest-run.completed',
      actor: payload.requestedBy || context.getOperatorName(),
      title: `Backtest completed for ${strategy.name}`,
      detail: completedRun.summary,
      metadata: {
        runId: completedRun.id,
        workflowRunId: workflow.id,
        status: completedRun.status,
        strategyId: completedRun.strategyId,
        windowLabel: completedRun.windowLabel,
        annualizedReturnPct: completedRun.annualizedReturnPct,
        maxDrawdownPct: completedRun.maxDrawdownPct,
        sharpe: completedRun.sharpe,
        winRatePct: completedRun.winRatePct,
        turnoverPct: completedRun.turnoverPct,
      },
    });

    context.enqueueNotification?.({
      level: completedRun.status === 'needs_review' ? 'warn' : 'info',
      source: 'research-control',
      title: completedRun.status === 'needs_review' ? 'Backtest requires review' : 'Backtest completed',
      message: completedRun.summary,
      metadata: {
        runId: completedRun.id,
        workflowRunId: workflow.id,
        strategyId: completedRun.strategyId,
      },
    });

    const persistedWorkflow = completeWorkflow(context, workflow.id, {
      steps: [
        { key: 'load-strategy', status: 'completed', strategyId: strategy.id },
        { key: 'mark-run-running', status: 'completed', runId: runningRun.id },
        { key: 'produce-backtest-result', status: 'completed', statusLabel: completedRun.status },
        { key: 'refresh-research-summary', status: 'completed' },
      ],
      result: {
        ok: true,
        runId: completedRun.id,
        status: completedRun.status,
        summaryAsOf: summary?.asOf || '',
      },
    });

    return {
      ok: true,
      run: completedRun,
      summary,
      workflow: persistedWorkflow,
    };
  } catch (error) {
    if (existingRun) {
      context.updateBacktestRun(existingRun.id, {
        status: 'failed',
        completedAt: new Date().toISOString(),
        summary: error instanceof Error ? error.message : 'unknown backtest workflow error',
      });
      context.refreshBacktestSummary?.('task-workflow-engine.backtest-run');
    }

    const failedWorkflow = failWorkflow(context, workflow.id, error instanceof Error ? error.message : 'unknown backtest workflow error', {
      steps: [
        { key: 'load-strategy', status: 'failed' },
        { key: 'mark-run-running', status: 'skipped' },
        { key: 'produce-backtest-result', status: 'skipped' },
        { key: 'refresh-research-summary', status: 'skipped' },
      ],
    });
    throw Object.assign(error instanceof Error ? error : new Error('backtest workflow failed'), {
      workflowId: failedWorkflow?.id,
    });
  }
}

export async function executeCycleWorkflow(payload, context, options = {}) {
  const workflow = options.workflow || startWorkflow(context, {
    workflowId: 'task-orchestrator.cycle-run',
    workflowType: 'task-orchestrator',
    actor: context.getOperatorName(),
    trigger: options.trigger || 'api',
    payload: {
      cycle: payload.cycle,
      mode: payload.mode,
      riskLevel: payload.riskLevel,
    },
    maxAttempts: Number(payload.maxAttempts || 3),
    steps: [
      { key: 'record-cycle', status: 'running' },
      { key: 'execute-broker-cycle', status: 'pending' },
      { key: 'resolve-control-plane', status: 'pending' },
    ],
  });

  try {
    const cycle = await context.recordCycleRun(payload);
    const notifications = context.listNotifications(10);
    const auditCount = context.listAuditRecords(10).length;
    const brokerExecution = await context.executeBrokerCycle({
      liveTradeEnabled: Boolean(payload.liveTradeEnabled),
      orders: Array.isArray(payload.pendingLiveIntents) ? payload.pendingLiveIntents : [],
    });
    const brokerHealth = await context.getBrokerHealth();
    const marketConnected = Boolean(payload.marketConnected);
    const brokerSnapshot = brokerExecution.snapshot || {};
    context.recordExecutionRuntime?.({
      cycleId: cycle.id,
      cycle: cycle.cycle,
      mode: cycle.mode,
      brokerAdapter: brokerHealth.adapter || 'simulated',
      brokerConnected: brokerHealth.connected,
      marketConnected,
      submittedOrderCount: Array.isArray(brokerExecution.submittedOrders) ? brokerExecution.submittedOrders.length : 0,
      rejectedOrderCount: Array.isArray(brokerExecution.rejectedOrders) ? brokerExecution.rejectedOrders.length : 0,
      openOrderCount: Array.isArray(brokerSnapshot.orders) ? brokerSnapshot.orders.length : 0,
      positionCount: Array.isArray(brokerSnapshot.positions) ? brokerSnapshot.positions.length : 0,
      cash: Number(brokerSnapshot.account?.cash || 0),
      buyingPower: Number(brokerSnapshot.account?.buyingPower || 0),
      equity: Number(brokerSnapshot.account?.equity || 0),
      message: brokerExecution.message,
      account: brokerSnapshot.account || null,
      positions: brokerSnapshot.positions || [],
      orders: brokerSnapshot.orders || [],
      actor: context.getOperatorName(),
    });

    const lastStatus = cycle.pendingApprovals > 0
      ? 'REVIEW'
      : (!brokerExecution.connected || !brokerHealth.connected || !marketConnected)
        ? 'DEGRADED'
        : 'HEALTHY';

    const routeHint = cycle.pendingApprovals > 0
      ? 'Control plane is holding live actions for manual approval.'
      : (!brokerHealth.connected || !marketConnected)
        ? 'Control plane detected degraded connectivity and is routing through fallback-aware execution.'
        : 'Control plane confirmed the cycle and kept the default execution route.';

    const resolution = {
      ok: true,
      cycle: {
        id: cycle.id,
        cycle: cycle.cycle,
        mode: cycle.mode,
        riskLevel: cycle.riskLevel,
        createdAt: cycle.createdAt,
      },
      controlPlane: {
        lastCycleId: cycle.id,
        lastStatus,
        operator: context.getOperatorName(),
        notificationCount: notifications.length,
        auditCount,
        routeHint,
        lastSyncAt: new Date().toISOString(),
      },
      notifications,
      brokerHealth,
      brokerExecution,
    };

    const persistedWorkflow = completeWorkflow(context, workflow.id, {
      steps: [
        { key: 'record-cycle', status: 'completed', refId: cycle.id },
        { key: 'execute-broker-cycle', status: 'completed' },
        { key: 'resolve-control-plane', status: 'completed', statusLabel: lastStatus },
      ],
      result: {
        ok: true,
        cycleId: cycle.id,
        lastStatus,
        brokerConnected: brokerHealth.connected,
      },
    });

    return {
      ...resolution,
      workflow: persistedWorkflow,
    };
  } catch (error) {
    const failedWorkflow = failWorkflow(context, workflow.id, error instanceof Error ? error.message : 'unknown workflow error', {
      steps: [
        { key: 'record-cycle', status: 'failed' },
        { key: 'execute-broker-cycle', status: 'skipped' },
        { key: 'resolve-control-plane', status: 'skipped' },
      ],
    });
    throw Object.assign(error instanceof Error ? error : new Error('cycle workflow failed'), {
      workflowId: failedWorkflow?.id,
    });
  }
}

export async function executeStateWorkflow(previousState, context, options = {}) {
  const workflow = options.workflow || startWorkflow(context, {
    workflowId: 'task-orchestrator.state-run',
    workflowType: 'task-orchestrator',
    actor: options.actor || 'state-runner',
    trigger: options.trigger || 'api',
    payload: {
      cycle: Number(previousState?.cycle || 0) + 1,
      mode: previousState?.mode || 'autopilot',
      state: previousState,
    },
    maxAttempts: Number(options.maxAttempts || 3),
    steps: [
      { key: 'load-market-snapshot', status: 'running' },
      { key: 'advance-local-state', status: 'pending' },
      { key: 'resolve-cycle', status: 'pending' },
      { key: 'enqueue-risk-scan', status: 'pending' },
    ],
  });

  try {
    const marketSnapshot = await context.getMarketSnapshot({
      provider: getMarketProvider(previousState),
      symbols: getTrackedSymbols(previousState),
    });
    context.updateMarketProviderStatus?.({
      provider: getMarketProvider(previousState),
      connected: marketSnapshot.connected,
      fallback: marketSnapshot.fallback,
      message: marketSnapshot.message,
      symbolCount: Array.isArray(marketSnapshot.quotes) ? marketSnapshot.quotes.length : 0,
      asOf: new Date().toISOString(),
    });

    const state = advanceLocalState(previousState, {
      marketSnapshot,
      brokerSupportsRemoteExecution: getBrokerProvider(previousState) !== 'simulated',
    });

    const resolution = await executeCycleWorkflow(buildCyclePayload(state), context, {
      trigger: 'workflow',
    });
    applyControlPlaneResolution(state, resolution);
    context.queueRiskScan({
      cycle: state.cycle,
      mode: state.mode,
      riskLevel: state.riskLevel,
      pendingApprovals: state.approvalQueue.length,
      brokerConnected: state.integrationStatus.broker.connected,
      marketConnected: state.integrationStatus.marketData.connected,
      paperExposure: state.accounts.paper.exposure,
      liveExposure: state.accounts.live.exposure,
      routeHint: state.controlPlane.routeHint,
      source: 'state-runner',
    });

    const persistedWorkflow = completeWorkflow(context, workflow.id, {
      steps: [
        { key: 'load-market-snapshot', status: 'completed' },
        { key: 'advance-local-state', status: 'completed', cycle: state.cycle },
        { key: 'resolve-cycle', status: 'completed', workflowId: resolution.workflow?.id || '' },
        { key: 'enqueue-risk-scan', status: 'completed' },
      ],
      result: {
        ok: true,
        cycle: state.cycle,
        lastStatus: state.controlPlane.lastStatus,
        riskLevel: state.riskLevel,
      },
    });

    return {
      ok: true,
      state,
      resolution,
      workflow: persistedWorkflow,
    };
  } catch (error) {
    const failedWorkflow = failWorkflow(context, workflow.id, error instanceof Error ? error.message : 'unknown state workflow error', {
      steps: [
        { key: 'load-market-snapshot', status: 'failed' },
        { key: 'advance-local-state', status: 'skipped' },
        { key: 'resolve-cycle', status: 'skipped' },
        { key: 'enqueue-risk-scan', status: 'skipped' },
      ],
    });
    throw Object.assign(error instanceof Error ? error : new Error('state workflow failed'), {
      workflowId: failedWorkflow?.id,
    });
  }
}

export async function executeQueuedWorkflow(workflowRun, context) {
  if (workflowRun.workflowId === 'task-orchestrator.backtest-run') {
    return executeBacktestRunWorkflow(workflowRun.payload, context, {
      workflow: workflowRun,
      trigger: 'worker',
    });
  }
  if (workflowRun.workflowId === 'task-orchestrator.agent-action-request') {
    return executeAgentActionRequestWorkflow(workflowRun.payload, context, {
      workflow: workflowRun,
      trigger: 'worker',
    });
  }
  if (workflowRun.workflowId === 'task-orchestrator.strategy-execution') {
    return executeStrategyExecutionWorkflow(workflowRun.payload, context, {
      workflow: workflowRun,
      trigger: 'worker',
    });
  }
  if (workflowRun.workflowId === 'task-orchestrator.cycle-run') {
    return executeCycleWorkflow(workflowRun.payload, context, {
      workflow: workflowRun,
      trigger: 'worker',
    });
  }
  if (workflowRun.workflowId === 'task-orchestrator.state-run') {
    return executeStateWorkflow(workflowRun.payload?.state || workflowRun.payload, context, {
      workflow: workflowRun,
      trigger: 'worker',
      actor: 'workflow-worker',
    });
  }
  if (workflowRun.workflowId === 'task-orchestrator.manual-review') {
    return {
      ok: true,
      workflow: completeWorkflow(context, workflowRun.id, {
        steps: [{ key: 'manual-review', status: 'completed' }],
        result: { ok: true, manual: true },
      }),
    };
  }
  return {
    ok: false,
    workflow: failWorkflow(context, workflowRun.id, `No executor registered for ${workflowRun.workflowId}`, {
      retryable: false,
      steps: [{ key: 'dispatch', status: 'failed' }],
    }),
  };
}
