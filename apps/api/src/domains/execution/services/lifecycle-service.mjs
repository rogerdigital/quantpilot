import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';
import { getExecutionPlanDetail } from './query-service.mjs';

const ACTIVE_ORDER_LIFECYCLES = new Set(['submitted', 'acknowledged']);
const ACTIVE_PLAN_LIFECYCLES = new Set(['submitted', 'acknowledged', 'partial_fill']);

function summarizeLifecycle(strategyName, lifecycleStatus) {
  if (lifecycleStatus === 'submitted') return `Submitted execution orders for ${strategyName}.`;
  if (lifecycleStatus === 'acknowledged') return `Broker acknowledged execution orders for ${strategyName}.`;
  if (lifecycleStatus === 'partial_fill') return `Execution for ${strategyName} is partially filled.`;
  if (lifecycleStatus === 'filled') return `Execution for ${strategyName} is fully filled.`;
  if (lifecycleStatus === 'cancelled') return `Execution for ${strategyName} was cancelled before completion.`;
  if (lifecycleStatus === 'failed') return `Execution for ${strategyName} failed during routing.`;
  if (lifecycleStatus === 'blocked') return `Execution for ${strategyName} was blocked by guardrails.`;
  return `Execution lifecycle updated for ${strategyName}.`;
}

function buildBrokerOrders(orderStates = []) {
  return orderStates.map((item) => ({
    id: item.brokerOrderId || item.id,
    symbol: item.symbol,
    side: item.side,
    qty: item.qty,
    filledQty: item.filledQty,
    filledAvgPrice: item.avgFillPrice || undefined,
    type: 'market',
    status: item.lifecycleStatus,
    submittedAt: item.submittedAt || undefined,
    updatedAt: item.updatedAt || undefined,
    cancelable: ACTIVE_ORDER_LIFECYCLES.has(item.lifecycleStatus),
    source: 'execution-lifecycle',
  }));
}

function buildBrokerPositions(orderStates = []) {
  return orderStates
    .filter((item) => item.filledQty > 0)
    .map((item) => ({
      symbol: item.symbol,
      qty: item.side === 'BUY' ? item.filledQty : -item.filledQty,
      avgEntryPrice: Number(item.avgFillPrice || 0),
      marketValue: Number(((item.avgFillPrice || 0) * item.filledQty).toFixed(2)),
      unrealizedPnl: 0,
      side: item.side === 'BUY' ? 'LONG' : 'SHORT',
    }));
}

function summarizeOrderBook(orderStates = []) {
  return orderStates.reduce((acc, item) => {
    if (item.lifecycleStatus === 'planned') acc.planned += 1;
    if (item.lifecycleStatus === 'submitted') acc.submitted += 1;
    if (item.lifecycleStatus === 'acknowledged') acc.acknowledged += 1;
    if (item.lifecycleStatus === 'filled') acc.filled += 1;
    if (item.lifecycleStatus === 'rejected') acc.rejected += 1;
    if (item.lifecycleStatus === 'cancelled') acc.cancelled += 1;
    return acc;
  }, {
    planned: 0,
    submitted: 0,
    acknowledged: 0,
    filled: 0,
    rejected: 0,
    cancelled: 0,
  });
}

function deriveLifecycleFromOrders(orderStates = [], fallback = 'submitted') {
  if (!orderStates.length) return fallback;
  const counts = summarizeOrderBook(orderStates);
  if (counts.filled === orderStates.length) return 'filled';
  if (counts.filled > 0 && (counts.submitted > 0 || counts.acknowledged > 0)) return 'partial_fill';
  if (counts.acknowledged > 0 && counts.submitted === 0 && counts.filled === 0) return 'acknowledged';
  if (counts.acknowledged > 0 && counts.submitted > 0) return 'acknowledged';
  if (counts.submitted > 0) return 'submitted';
  if (counts.cancelled === orderStates.length) return 'cancelled';
  if (counts.rejected === orderStates.length) return 'failed';
  if (counts.planned === orderStates.length) return 'awaiting_approval';
  return fallback;
}

function buildRuntimeSnapshot(plan, executionRun, orderStates, actor, message, now) {
  const counts = summarizeOrderBook(orderStates);
  const positions = buildBrokerPositions(orderStates);
  const deployedCapital = orderStates.reduce((sum, item) => {
    if (item.filledQty <= 0) return sum;
    return sum + Number((item.avgFillPrice || 0) * item.filledQty);
  }, 0);
  const residualCapital = Math.max(0, Number(plan.capital || 0) - deployedCapital);

  return controlPlaneRuntime.recordExecutionRuntime({
    cycleId: plan.workflowRunId || plan.id,
    cycle: 0,
    executionPlanId: plan.id,
    executionRunId: executionRun?.id || '',
    mode: plan.mode,
    brokerAdapter: plan.metadata?.brokerAdapter || 'simulated',
    brokerConnected: true,
    marketConnected: true,
    submittedOrderCount: counts.submitted + counts.acknowledged + counts.filled,
    rejectedOrderCount: counts.rejected,
    openOrderCount: counts.submitted + counts.acknowledged,
    positionCount: positions.length,
    cash: residualCapital,
    buyingPower: residualCapital,
    equity: Number(plan.capital || 0),
    message,
    orders: buildBrokerOrders(orderStates),
    positions,
    actor,
    createdAt: now,
  });
}

function refreshExecutionAggregate(plan, executionRun, orderStates, payload = {}) {
  const now = payload.now || new Date().toISOString();
  const actor = payload.actor || 'execution-desk';
  const nextLifecycle = deriveLifecycleFromOrders(orderStates, plan.lifecycleStatus);
  const counts = summarizeOrderBook(orderStates);
  const summary = payload.summary || summarizeLifecycle(plan.strategyName, nextLifecycle);
  const completedAt = ['filled', 'cancelled', 'failed'].includes(nextLifecycle) ? now : '';
  const nextRun = executionRun
    ? controlPlaneRuntime.updateExecutionRun(executionRun.id, {
      lifecycleStatus: nextLifecycle,
      submittedOrderCount: counts.submitted + counts.acknowledged + counts.filled,
      filledOrderCount: counts.filled,
      rejectedOrderCount: counts.rejected,
      summary,
      completedAt,
      metadata: payload.metadata || {},
      updatedAt: now,
    })
    : null;
  const nextPlan = controlPlaneRuntime.updateExecutionPlan(plan.id, {
    lifecycleStatus: nextLifecycle,
    approvalState: nextLifecycle === 'awaiting_approval' ? plan.approvalState : 'not_required',
    executionRunId: nextRun?.id || plan.executionRunId,
    summary,
    metadata: payload.metadata ? { ...(plan.metadata || {}), ...payload.metadata } : plan.metadata,
    updatedAt: now,
  });
  const runtime = buildRuntimeSnapshot(nextPlan || plan, nextRun || executionRun, orderStates, actor, summary, now);

  return {
    plan: nextPlan,
    executionRun: nextRun,
    orderStates,
    runtime,
    lifecycleStatus: nextLifecycle,
  };
}

function loadMutableExecutionPlan(planId, errorMessage) {
  const detail = getExecutionPlanDetail(planId);
  if (!detail?.plan) {
    return {
      ok: false,
      error: 'execution plan not found',
      message: `Unknown execution plan: ${planId || 'missing planId'}`,
    };
  }
  if (!detail.executionRun) {
    return {
      ok: false,
      error: 'execution run not found',
      message: errorMessage || `Execution plan ${detail.plan.id} does not have an execution run yet.`,
    };
  }
  return {
    ok: true,
    detail,
  };
}

export function approveExecutionPlan(planId, payload = {}) {
  const loaded = loadMutableExecutionPlan(planId);
  if (!loaded.ok) return loaded;

  const { plan, executionRun, orderStates } = loaded.detail;
  if (plan.lifecycleStatus !== 'awaiting_approval') {
    return {
      ok: false,
      error: 'execution plan not awaiting approval',
      message: `Execution plan ${plan.id} is currently ${plan.lifecycleStatus}.`,
    };
  }

  const now = new Date().toISOString();
  const updatedOrders = orderStates
    .map((item, index) => controlPlaneRuntime.updateExecutionOrderState(item.id, {
      lifecycleStatus: 'submitted',
      brokerOrderId: item.brokerOrderId || `broker-${plan.id}-${index + 1}`,
      summary: `Submitted ${item.side} ${item.symbol} after operator approval.`,
      submittedAt: now,
      updatedAt: now,
    }))
    .filter(Boolean);

  const result = refreshExecutionAggregate(plan, executionRun, updatedOrders, {
    actor: payload.actor,
    now,
    summary: summarizeLifecycle(plan.strategyName, 'submitted'),
    metadata: {
      approvedBy: payload.actor || 'execution-desk',
      transition: 'approve',
    },
  });

  controlPlaneRuntime.recordOperatorAction({
    type: 'execution.approve-plan',
    actor: payload.actor || 'execution-desk',
    title: `Approved execution plan for ${plan.strategyName}`,
    detail: result.plan?.summary || summarizeLifecycle(plan.strategyName, 'submitted'),
    symbol: plan.strategyId,
    level: 'info',
    metadata: {
      executionPlanId: plan.id,
      executionRunId: result.executionRun?.id || executionRun.id,
    },
  });

  if (plan.handoffId) {
    controlPlaneRuntime.updateExecutionCandidateHandoff(plan.handoffId, {
      handoffStatus: 'converted',
      updatedAt: now,
      metadata: {
        executionPlanId: plan.id,
        executionRunId: result.executionRun?.id || executionRun.id,
      },
    });
  }

  return {
    ok: true,
    ...result,
  };
}

export function syncExecutionPlan(planId, payload = {}) {
  const loaded = loadMutableExecutionPlan(planId);
  if (!loaded.ok) return loaded;

  const { plan, executionRun, orderStates } = loaded.detail;
  if (!ACTIVE_PLAN_LIFECYCLES.has(plan.lifecycleStatus)) {
    return {
      ok: false,
      error: 'execution plan not active',
      message: `Execution plan ${plan.id} is currently ${plan.lifecycleStatus}.`,
    };
  }

  const scenario = payload.scenario || 'acknowledge';
  const now = new Date().toISOString();
  const updatedOrders = orderStates
    .map((item, index) => {
      if (scenario === 'acknowledge' && item.lifecycleStatus === 'submitted') {
        return controlPlaneRuntime.updateExecutionOrderState(item.id, {
          lifecycleStatus: 'acknowledged',
          summary: `Broker acknowledged ${item.side} ${item.symbol}.`,
          acknowledgedAt: now,
          updatedAt: now,
        });
      }
      if (scenario === 'partial_fill' && ACTIVE_ORDER_LIFECYCLES.has(item.lifecycleStatus)) {
        const shouldFill = index % 2 === 0;
        return controlPlaneRuntime.updateExecutionOrderState(item.id, {
          lifecycleStatus: shouldFill ? 'filled' : 'acknowledged',
          acknowledgedAt: now,
          filledQty: shouldFill ? item.qty : Math.max(item.filledQty, Math.floor(item.qty / 2)),
          avgFillPrice: shouldFill || item.avgFillPrice ? Number((100 + index * 3.1).toFixed(2)) : item.avgFillPrice,
          filledAt: shouldFill ? now : item.filledAt,
          summary: shouldFill
            ? `${item.symbol} fully filled after broker sync.`
            : `${item.symbol} partially filled and remains open.`,
          updatedAt: now,
        });
      }
      if (scenario === 'filled' && ACTIVE_ORDER_LIFECYCLES.has(item.lifecycleStatus)) {
        return controlPlaneRuntime.updateExecutionOrderState(item.id, {
          lifecycleStatus: 'filled',
          acknowledgedAt: item.acknowledgedAt || now,
          filledQty: item.qty,
          avgFillPrice: Number((100 + index * 3.1).toFixed(2)),
          filledAt: now,
          summary: `${item.symbol} fully filled after broker sync.`,
          updatedAt: now,
        });
      }
      if (scenario === 'failed' && ACTIVE_ORDER_LIFECYCLES.has(item.lifecycleStatus)) {
        return controlPlaneRuntime.updateExecutionOrderState(item.id, {
          lifecycleStatus: 'rejected',
          summary: `${item.symbol} was rejected by the broker.`,
          acknowledgedAt: item.acknowledgedAt || now,
          updatedAt: now,
        });
      }
      return item;
    })
    .filter(Boolean);

  const result = refreshExecutionAggregate(plan, executionRun, updatedOrders, {
    actor: payload.actor,
    now,
    summary: summarizeLifecycle(plan.strategyName, deriveLifecycleFromOrders(updatedOrders, plan.lifecycleStatus)),
    metadata: {
      syncedBy: payload.actor || 'execution-desk',
      scenario,
    },
  });

  controlPlaneRuntime.recordOperatorAction({
    type: 'execution.sync-plan',
    actor: payload.actor || 'execution-desk',
    title: `Synced execution plan for ${plan.strategyName}`,
    detail: result.plan?.summary || summarizeLifecycle(plan.strategyName, result.lifecycleStatus),
    symbol: plan.strategyId,
    level: result.lifecycleStatus === 'failed' ? 'warn' : 'info',
    metadata: {
      executionPlanId: plan.id,
      executionRunId: result.executionRun?.id || executionRun.id,
      scenario,
    },
  });

  return {
    ok: true,
    ...result,
  };
}

export function cancelExecutionPlan(planId, payload = {}) {
  const loaded = loadMutableExecutionPlan(planId);
  if (!loaded.ok) return loaded;

  const { plan, executionRun, orderStates } = loaded.detail;
  if (!['awaiting_approval', 'submitted', 'acknowledged'].includes(plan.lifecycleStatus)) {
    return {
      ok: false,
      error: 'execution plan cannot be cancelled',
      message: `Execution plan ${plan.id} is currently ${plan.lifecycleStatus}.`,
    };
  }

  const now = new Date().toISOString();
  const updatedOrders = orderStates
    .map((item) => controlPlaneRuntime.updateExecutionOrderState(item.id, {
      lifecycleStatus: 'cancelled',
      summary: `Cancelled ${item.side} ${item.symbol} before completion.`,
      updatedAt: now,
    }))
    .filter(Boolean);

  const result = refreshExecutionAggregate(plan, executionRun, updatedOrders, {
    actor: payload.actor,
    now,
    summary: summarizeLifecycle(plan.strategyName, 'cancelled'),
    metadata: {
      cancelledBy: payload.actor || 'execution-desk',
      reason: payload.reason || 'operator_cancelled',
    },
  });

  controlPlaneRuntime.recordOperatorAction({
    type: 'execution.cancel-plan',
    actor: payload.actor || 'execution-desk',
    title: `Cancelled execution plan for ${plan.strategyName}`,
    detail: result.plan?.summary || summarizeLifecycle(plan.strategyName, 'cancelled'),
    symbol: plan.strategyId,
    level: 'warn',
    metadata: {
      executionPlanId: plan.id,
      executionRunId: result.executionRun?.id || executionRun.id,
      reason: payload.reason || 'operator_cancelled',
    },
  });

  return {
    ok: true,
    ...result,
  };
}

export function reconcileExecutionPlan(planId, payload = {}) {
  const detail = getExecutionPlanDetail(planId);
  if (!detail?.plan) {
    return {
      ok: false,
      error: 'execution plan not found',
      message: `Unknown execution plan: ${planId || 'missing planId'}`,
    };
  }

  const now = new Date().toISOString();
  const reconciliation = detail.reconciliation || {
    status: 'missing_snapshot',
    issueCount: 1,
    latestSnapshotAt: '',
    orderCountDelta: detail.orderStates.length,
    filledQtyDelta: 0,
    positionDelta: 0,
    issues: [],
  };
  const level = reconciliation.status === 'drift'
    ? 'warn'
    : (reconciliation.status === 'attention' || reconciliation.status === 'missing_snapshot' ? 'warn' : 'info');
  const title = reconciliation.status === 'aligned'
    ? `Execution reconciliation aligned for ${detail.plan.strategyName}`
    : `Execution reconciliation flagged ${detail.plan.strategyName}`;
  const detailMessage = reconciliation.status === 'aligned'
    ? 'Broker snapshot, order lifecycle, and position totals are aligned.'
    : `Found ${reconciliation.issueCount} reconciliation issue(s) across broker snapshot, order lifecycle, or positions.`;

  controlPlaneRuntime.recordOperatorAction({
    type: 'execution.reconcile-plan',
    actor: payload.actor || 'execution-desk',
    title,
    detail: detailMessage,
    symbol: detail.plan.strategyId,
    level,
    metadata: {
      executionPlanId: detail.plan.id,
      executionRunId: detail.executionRun?.id || '',
      reconciliationStatus: reconciliation.status,
      issueCount: reconciliation.issueCount,
    },
  });

  controlPlaneRuntime.appendAuditRecord({
    type: 'execution-reconciliation',
    actor: payload.actor || 'execution-desk',
    title,
    detail: detailMessage,
    metadata: {
      executionPlanId: detail.plan.id,
      executionRunId: detail.executionRun?.id || '',
      reconciliationStatus: reconciliation.status,
      issueCount: reconciliation.issueCount,
      orderCountDelta: reconciliation.orderCountDelta,
      filledQtyDelta: reconciliation.filledQtyDelta,
      positionDelta: reconciliation.positionDelta,
      issues: reconciliation.issues,
    },
    createdAt: now,
  });

  return {
    ok: true,
    plan: detail.plan,
    executionRun: detail.executionRun,
    reconciliation,
    latestSnapshot: detail.latestSnapshot || null,
    reviewedAt: now,
  };
}

export function recoverExecutionPlan(planId, payload = {}) {
  const detail = getExecutionPlanDetail(planId);
  if (!detail?.plan) {
    return {
      ok: false,
      error: 'execution plan not found',
      message: `Unknown execution plan: ${planId || 'missing planId'}`,
    };
  }

  const now = new Date().toISOString();
  const actor = payload.actor || 'execution-desk';
  const recovery = detail.recovery || {
    status: 'blocked',
    recommendedAction: 'none',
    headline: 'No recovery action is available.',
    reasons: [],
  };

  if (recovery.recommendedAction === 'resume_workflow' && detail.workflow?.id) {
    const workflow = controlPlaneRuntime.resumeWorkflowRun(detail.workflow.id, {
      actor,
      trigger: 'execution-recovery',
      updatedAt: now,
    });
    controlPlaneRuntime.recordOperatorAction({
      type: 'execution.recover-plan',
      actor,
      title: `Recovered workflow for ${detail.plan.strategyName}`,
      detail: 'Execution workflow was resumed from the execution recovery console.',
      symbol: detail.plan.strategyId,
      level: 'info',
      metadata: {
        executionPlanId: detail.plan.id,
        workflowRunId: detail.workflow.id,
        recoveryAction: 'resume_workflow',
      },
    });
    return {
      ok: true,
      workflow,
      recoveryAction: 'resume_workflow',
      detail: getExecutionPlanDetail(planId),
    };
  }

  if (recovery.recommendedAction === 'reroute_orders' && detail.executionRun) {
    const reopenedLifecycle = detail.plan.approvalState === 'required' ? 'planned' : 'submitted';
    const updatedOrders = detail.orderStates.map((item, index) => controlPlaneRuntime.updateExecutionOrderState(item.id, {
      lifecycleStatus: reopenedLifecycle,
      brokerOrderId: reopenedLifecycle === 'submitted' ? (item.brokerOrderId || `broker-${detail.plan.id}-retry-${index + 1}`) : '',
      filledQty: 0,
      avgFillPrice: null,
      filledAt: '',
      acknowledgedAt: '',
      submittedAt: reopenedLifecycle === 'submitted' ? now : '',
      summary: reopenedLifecycle === 'submitted'
        ? `Re-routed ${item.side} ${item.symbol} after execution recovery.`
        : `Returned ${item.side} ${item.symbol} to approval review after recovery.`,
      updatedAt: now,
    })).filter(Boolean);

    const result = refreshExecutionAggregate(detail.plan, detail.executionRun, updatedOrders, {
      actor,
      now,
      summary: reopenedLifecycle === 'submitted'
        ? `Recovered ${detail.plan.strategyName} and re-routed orders back to broker sync.`
        : `Recovered ${detail.plan.strategyName} and returned orders to approval review.`,
      metadata: {
        recoveredBy: actor,
        recoveryAction: 'reroute_orders',
      },
    });

    controlPlaneRuntime.recordOperatorAction({
      type: 'execution.recover-plan',
      actor,
      title: `Recovered orders for ${detail.plan.strategyName}`,
      detail: result.plan?.summary || 'Execution recovery rerouted the order set.',
      symbol: detail.plan.strategyId,
      level: 'info',
      metadata: {
        executionPlanId: detail.plan.id,
        executionRunId: detail.executionRun.id,
        recoveryAction: 'reroute_orders',
      },
    });

    return {
      ok: true,
      recoveryAction: 'reroute_orders',
      ...result,
    };
  }

  if (recovery.recommendedAction === 'reconcile') {
    const reconcileResult = reconcileExecutionPlan(planId, payload);
    return {
      ...reconcileResult,
      recoveryAction: 'reconcile',
    };
  }

  return {
    ok: false,
    error: 'execution recovery not available',
    message: `Execution plan ${detail.plan.id} does not currently expose a recovery path.`,
  };
}

export function settleExecutionPlan(planId, payload = {}) {
  if (payload.outcome === 'cancelled') {
    return cancelExecutionPlan(planId, payload);
  }
  return syncExecutionPlan(planId, {
    ...payload,
    scenario: payload.outcome === 'partial_fill'
      ? 'partial_fill'
      : (payload.outcome === 'failed' ? 'failed' : 'filled'),
  });
}
