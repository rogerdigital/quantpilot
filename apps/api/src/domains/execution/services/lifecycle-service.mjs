import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';
import { syncExecutionExceptionState } from './exception-policy-service.mjs';
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
  const account = {
    cash: Number(residualCapital.toFixed(2)),
    buyingPower: Number(residualCapital.toFixed(2)),
    equity: Number(Number(plan.capital || 0).toFixed(2)),
  };

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
    cash: account.cash,
    buyingPower: account.buyingPower,
    equity: account.equity,
    account,
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

function buildBrokerEventHeadline(strategyName, eventType, symbol) {
  const symbolLabel = symbol ? ` ${symbol}` : '';
  if (eventType === 'acknowledged') return `Broker acknowledged${symbolLabel} for ${strategyName}.`;
  if (eventType === 'partial_fill') return `Broker reported a partial fill${symbolLabel} for ${strategyName}.`;
  if (eventType === 'filled') return `Broker reported a full fill${symbolLabel} for ${strategyName}.`;
  if (eventType === 'rejected') return `Broker rejected${symbolLabel} for ${strategyName}.`;
  if (eventType === 'cancelled') return `Broker cancelled${symbolLabel} for ${strategyName}.`;
  return `Broker event recorded for ${strategyName}.`;
}

function getBrokerEventTargets(orderStates = [], payload = {}) {
  const brokerOrderId = payload.brokerOrderId || '';
  const symbol = payload.symbol || '';
  const filtered = orderStates.filter((item) => {
    if (brokerOrderId && item.brokerOrderId === brokerOrderId) return true;
    if (!brokerOrderId && symbol && item.symbol === symbol) return true;
    return false;
  });

  if (filtered.length) return filtered;
  if (brokerOrderId || symbol) return [];

  return orderStates.filter((item) => ['submitted', 'acknowledged', 'planned'].includes(item.lifecycleStatus));
}

function applyBrokerEventToOrder(item, payload, now) {
  const eventType = payload.eventType || 'acknowledged';
  if (eventType === 'acknowledged') {
    return controlPlaneRuntime.updateExecutionOrderState(item.id, {
      lifecycleStatus: 'acknowledged',
      brokerOrderId: item.brokerOrderId || payload.brokerOrderId || item.id,
      summary: payload.message || `Broker acknowledged ${item.side} ${item.symbol}.`,
      acknowledgedAt: item.acknowledgedAt || now,
      updatedAt: now,
      metadata: {
        ...(item.metadata || {}),
        brokerEventType: eventType,
        externalEventId: payload.externalEventId || '',
      },
    });
  }

  if (eventType === 'partial_fill') {
    const nextFilledQty = Math.min(
      item.qty,
      Math.max(Number(payload.filledQty || 0), Math.max(item.filledQty || 0, Math.ceil(item.qty / 2))),
    );
    return controlPlaneRuntime.updateExecutionOrderState(item.id, {
      lifecycleStatus: nextFilledQty >= item.qty ? 'filled' : 'acknowledged',
      brokerOrderId: item.brokerOrderId || payload.brokerOrderId || item.id,
      summary: payload.message || `Broker reported a partial fill for ${item.side} ${item.symbol}.`,
      acknowledgedAt: item.acknowledgedAt || now,
      filledQty: nextFilledQty,
      avgFillPrice: Number.isFinite(payload.avgFillPrice) ? Number(payload.avgFillPrice) : item.avgFillPrice,
      filledAt: nextFilledQty > 0 ? now : item.filledAt,
      updatedAt: now,
      metadata: {
        ...(item.metadata || {}),
        brokerEventType: eventType,
        externalEventId: payload.externalEventId || '',
      },
    });
  }

  if (eventType === 'filled') {
    return controlPlaneRuntime.updateExecutionOrderState(item.id, {
      lifecycleStatus: 'filled',
      brokerOrderId: item.brokerOrderId || payload.brokerOrderId || item.id,
      summary: payload.message || `Broker reported a full fill for ${item.side} ${item.symbol}.`,
      acknowledgedAt: item.acknowledgedAt || now,
      filledQty: Number(payload.filledQty || item.qty),
      avgFillPrice: Number.isFinite(payload.avgFillPrice) ? Number(payload.avgFillPrice) : item.avgFillPrice,
      filledAt: now,
      updatedAt: now,
      metadata: {
        ...(item.metadata || {}),
        brokerEventType: eventType,
        externalEventId: payload.externalEventId || '',
      },
    });
  }

  if (eventType === 'rejected') {
    return controlPlaneRuntime.updateExecutionOrderState(item.id, {
      lifecycleStatus: 'rejected',
      brokerOrderId: item.brokerOrderId || payload.brokerOrderId || item.id,
      summary: payload.message || `${item.symbol} was rejected by the broker.`,
      acknowledgedAt: item.acknowledgedAt || now,
      updatedAt: now,
      metadata: {
        ...(item.metadata || {}),
        brokerEventType: eventType,
        externalEventId: payload.externalEventId || '',
        rejectReason: payload.reason || 'broker_reported_rejection',
      },
    });
  }

  if (eventType === 'cancelled') {
    return controlPlaneRuntime.updateExecutionOrderState(item.id, {
      lifecycleStatus: 'cancelled',
      brokerOrderId: item.brokerOrderId || payload.brokerOrderId || item.id,
      summary: payload.message || `${item.symbol} was cancelled by the broker.`,
      acknowledgedAt: item.acknowledgedAt || now,
      updatedAt: now,
      metadata: {
        ...(item.metadata || {}),
        brokerEventType: eventType,
        externalEventId: payload.externalEventId || '',
        cancelReason: payload.reason || 'broker_reported_cancel',
      },
    });
  }

  return item;
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

function finalizeExecutionExceptionState(planId, options = {}) {
  const nextDetail = getExecutionPlanDetail(planId);
  if (!nextDetail?.plan) {
    return {
      detail: nextDetail,
      exceptionPolicy: null,
      incident: null,
    };
  }

  const synced = syncExecutionExceptionState(nextDetail, options);
  const detail = getExecutionPlanDetail(planId);
  return {
    detail,
    exceptionPolicy: synced.policy,
    incident: synced.incident || null,
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

  const exceptionState = finalizeExecutionExceptionState(plan.id, {
    actor: payload.actor || 'execution-desk',
    resolveOnStable: true,
  });

  return {
    ok: true,
    ...result,
    exceptionPolicy: exceptionState.exceptionPolicy,
    incident: exceptionState.incident,
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

  const exceptionState = finalizeExecutionExceptionState(plan.id, {
    actor: payload.actor || 'execution-desk',
    resolveOnStable: scenario === 'filled' || scenario === 'acknowledge',
  });

  return {
    ok: true,
    ...result,
    exceptionPolicy: exceptionState.exceptionPolicy,
    incident: exceptionState.incident,
  };
}

export function ingestBrokerExecutionEvent(planId, payload = {}) {
  const loaded = loadMutableExecutionPlan(planId, `Execution plan ${planId} does not have an execution run for broker event ingestion.`);
  if (!loaded.ok) return loaded;

  const { plan, executionRun, orderStates } = loaded.detail;
  const targets = getBrokerEventTargets(orderStates, payload);
  if (!targets.length) {
    return {
      ok: false,
      error: 'broker event target not found',
      message: `No execution orders matched broker event routing for plan ${plan.id}.`,
    };
  }

  const now = new Date().toISOString();
  const actor = payload.actor || 'broker-ingestion';
  const updatedOrders = orderStates.map((item) => {
    if (!targets.some((target) => target.id === item.id)) return item;
    return applyBrokerEventToOrder(item, payload, now);
  });

  const headline = buildBrokerEventHeadline(plan.strategyName, payload.eventType, payload.symbol || targets[0]?.symbol || '');
  const result = refreshExecutionAggregate(plan, executionRun, updatedOrders, {
    actor,
    now,
    summary: payload.message || headline,
    metadata: {
      ingestedBrokerEvent: payload.eventType,
      externalEventId: payload.externalEventId || '',
      affectedOrders: targets.map((item) => item.id),
    },
  });

  const event = controlPlaneRuntime.appendBrokerExecutionEvent({
    executionPlanId: plan.id,
    executionRunId: executionRun.id,
    brokerOrderId: payload.brokerOrderId || targets[0]?.brokerOrderId || '',
    symbol: payload.symbol || targets[0]?.symbol || '',
    eventType: payload.eventType,
    status: result.lifecycleStatus,
    filledQty: Number(payload.filledQty || 0),
    avgFillPrice: Number.isFinite(payload.avgFillPrice) ? Number(payload.avgFillPrice) : null,
    source: payload.source || 'broker-webhook',
    actor,
    headline,
    message: payload.message || headline,
    metadata: {
      externalEventId: payload.externalEventId || '',
      affectedOrderIds: targets.map((item) => item.id),
      lifecycleStatus: result.lifecycleStatus,
    },
    createdAt: now,
  });

  controlPlaneRuntime.recordOperatorAction({
    type: 'execution.ingest-broker-event',
    actor,
    title: `Recorded broker ${payload.eventType} event for ${plan.strategyName}`,
    detail: payload.message || headline,
    symbol: payload.symbol || plan.strategyId,
    level: payload.eventType === 'rejected' ? 'warn' : 'info',
    metadata: {
      executionPlanId: plan.id,
      executionRunId: executionRun.id,
      brokerEventId: event.id,
      brokerEventType: payload.eventType,
      externalEventId: payload.externalEventId || '',
    },
  });

  const exceptionState = finalizeExecutionExceptionState(plan.id, {
    actor,
    brokerEvent: event,
    resolveOnStable: payload.eventType === 'filled',
  });

  return {
    ok: true,
    brokerEvent: event,
    ...result,
    exceptionPolicy: exceptionState.exceptionPolicy,
    incident: exceptionState.incident,
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

  const exceptionState = finalizeExecutionExceptionState(plan.id, {
    actor: payload.actor || 'execution-desk',
  });

  return {
    ok: true,
    ...result,
    exceptionPolicy: exceptionState.exceptionPolicy,
    incident: exceptionState.incident,
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
    cashDelta: 0,
    buyingPowerDelta: 0,
    equityDelta: 0,
    deployedCapital: 0,
    residualCapital: Number(detail.plan.capital || 0),
    accountStatus: 'missing_snapshot',
    cadence: {
      status: 'missing_runtime',
      runtimeAt: '',
      snapshotLagMinutes: 0,
    },
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
      cashDelta: reconciliation.cashDelta,
      buyingPowerDelta: reconciliation.buyingPowerDelta,
      equityDelta: reconciliation.equityDelta,
      deployedCapital: reconciliation.deployedCapital,
      residualCapital: reconciliation.residualCapital,
      accountStatus: reconciliation.accountStatus,
      cadence: reconciliation.cadence,
      issues: reconciliation.issues,
    },
    createdAt: now,
  });

  const exceptionState = finalizeExecutionExceptionState(detail.plan.id, {
    actor: payload.actor || 'execution-desk',
    resolveOnStable: reconciliation.status === 'aligned',
  });

  return {
    ok: true,
    plan: detail.plan,
    executionRun: detail.executionRun,
    reconciliation,
    latestSnapshot: detail.latestSnapshot || null,
    reviewedAt: now,
    exceptionPolicy: exceptionState.exceptionPolicy,
    incident: exceptionState.incident,
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
    const exceptionState = finalizeExecutionExceptionState(detail.plan.id, {
      actor,
      resolveOnStable: false,
    });
    return {
      ok: true,
      workflow,
      recoveryAction: 'resume_workflow',
      detail: exceptionState.detail,
      exceptionPolicy: exceptionState.exceptionPolicy,
      incident: exceptionState.incident,
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

    const exceptionState = finalizeExecutionExceptionState(detail.plan.id, {
      actor,
      resolveOnStable: reopenedLifecycle === 'submitted',
    });
    return {
      ok: true,
      recoveryAction: 'reroute_orders',
      ...result,
      exceptionPolicy: exceptionState.exceptionPolicy,
      incident: exceptionState.incident,
    };
  }

  if (recovery.recommendedAction === 'reconcile') {
    const reconcileResult = reconcileExecutionPlan(planId, payload);
    return {
      ...reconcileResult,
      recoveryAction: 'reconcile',
    };
  }

  if (recovery.recommendedAction === 'open_incident') {
    const exceptionState = finalizeExecutionExceptionState(detail.plan.id, {
      actor,
      resolveOnStable: false,
    });
    return {
      ok: true,
      recoveryAction: 'open_incident',
      detail: exceptionState.detail,
      exceptionPolicy: exceptionState.exceptionPolicy,
      incident: exceptionState.incident,
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
