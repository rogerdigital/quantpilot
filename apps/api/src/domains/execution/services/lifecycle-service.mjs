import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';
import { getExecutionPlanDetail } from './query-service.mjs';

function buildBrokerOrders(orderStates = [], status = 'submitted') {
  return orderStates.map((item) => ({
    id: item.brokerOrderId || item.id,
    symbol: item.symbol,
    side: item.side,
    qty: item.qty,
    type: 'market',
    status,
  }));
}

function summarizeLifecycle(strategyName, lifecycleStatus) {
  if (lifecycleStatus === 'submitted') return `Submitted execution orders for ${strategyName}.`;
  if (lifecycleStatus === 'partial_fill') return `Execution for ${strategyName} is partially filled.`;
  if (lifecycleStatus === 'filled') return `Execution for ${strategyName} is fully filled.`;
  if (lifecycleStatus === 'cancelled') return `Execution for ${strategyName} was cancelled.`;
  if (lifecycleStatus === 'failed') return `Execution for ${strategyName} failed during routing.`;
  return `Execution lifecycle updated for ${strategyName}.`;
}

export function approveExecutionPlan(planId, payload = {}) {
  const detail = getExecutionPlanDetail(planId);
  if (!detail?.plan) {
    return {
      ok: false,
      error: 'execution plan not found',
      message: `Unknown execution plan: ${planId || 'missing planId'}`,
    };
  }

  const { plan, executionRun, orderStates } = detail;
  if (plan.lifecycleStatus !== 'awaiting_approval') {
    return {
      ok: false,
      error: 'execution plan not awaiting approval',
      message: `Execution plan ${plan.id} is currently ${plan.lifecycleStatus}.`,
    };
  }

  const now = new Date().toISOString();
  const updatedOrders = orderStates.map((item, index) => controlPlaneRuntime.updateExecutionOrderState(item.id, {
    lifecycleStatus: 'submitted',
    brokerOrderId: item.brokerOrderId || `broker-${plan.id}-${index + 1}`,
    submittedAt: now,
    summary: `Submitted ${item.side} ${item.symbol} after operator approval.`,
  })).filter(Boolean);
  const nextRun = executionRun
    ? controlPlaneRuntime.updateExecutionRun(executionRun.id, {
      lifecycleStatus: 'submitted',
      submittedOrderCount: updatedOrders.length,
      summary: summarizeLifecycle(plan.strategyName, 'submitted'),
      metadata: {
        approvedBy: payload.actor || 'execution-desk',
      },
    })
    : null;
  const nextPlan = controlPlaneRuntime.updateExecutionPlan(plan.id, {
    lifecycleStatus: 'submitted',
    approvalState: 'not_required',
    executionRunId: nextRun?.id || plan.executionRunId,
    summary: summarizeLifecycle(plan.strategyName, 'submitted'),
    updatedAt: now,
  });

  const runtime = controlPlaneRuntime.recordExecutionRuntime({
    cycleId: plan.workflowRunId || plan.id,
    cycle: 0,
    executionPlanId: plan.id,
    executionRunId: nextRun?.id || '',
    mode: plan.mode,
    brokerAdapter: 'simulated',
    brokerConnected: true,
    marketConnected: true,
    submittedOrderCount: updatedOrders.length,
    rejectedOrderCount: 0,
    openOrderCount: updatedOrders.length,
    positionCount: 0,
    cash: Number(plan.capital || 0),
    buyingPower: Number(plan.capital || 0),
    equity: Number(plan.capital || 0),
    message: summarizeLifecycle(plan.strategyName, 'submitted'),
    orders: buildBrokerOrders(updatedOrders, 'submitted'),
    positions: [],
    actor: payload.actor || 'execution-desk',
    createdAt: now,
  });

  controlPlaneRuntime.recordOperatorAction({
    type: 'execution.approve-plan',
    actor: payload.actor || 'execution-desk',
    title: `Approved execution plan for ${plan.strategyName}`,
    detail: summarizeLifecycle(plan.strategyName, 'submitted'),
    symbol: plan.strategyId,
    level: 'info',
    metadata: {
      executionPlanId: plan.id,
      executionRunId: nextRun?.id || '',
    },
  });

  if (plan.handoffId) {
    controlPlaneRuntime.updateExecutionCandidateHandoff(plan.handoffId, {
      handoffStatus: 'converted',
      updatedAt: now,
      metadata: {
        executionPlanId: plan.id,
        executionRunId: nextRun?.id || '',
      },
    });
  }

  return {
    ok: true,
    plan: nextPlan,
    executionRun: nextRun,
    orderStates: controlPlaneRuntime.listExecutionOrderStates(80, { executionPlanId: plan.id }),
    runtime,
  };
}

export function settleExecutionPlan(planId, payload = {}) {
  const detail = getExecutionPlanDetail(planId);
  if (!detail?.plan) {
    return {
      ok: false,
      error: 'execution plan not found',
      message: `Unknown execution plan: ${planId || 'missing planId'}`,
    };
  }

  const { plan, executionRun, orderStates } = detail;
  if (!['submitted', 'partial_fill'].includes(plan.lifecycleStatus)) {
    return {
      ok: false,
      error: 'execution plan not active',
      message: `Execution plan ${plan.id} is currently ${plan.lifecycleStatus}.`,
    };
  }

  const outcome = payload.outcome || 'filled';
  const now = new Date().toISOString();
  let lifecycleStatus = 'filled';
  if (outcome === 'partial_fill') lifecycleStatus = 'partial_fill';
  if (outcome === 'cancelled') lifecycleStatus = 'cancelled';
  if (outcome === 'failed') lifecycleStatus = 'failed';

  const updatedOrders = orderStates.map((item, index) => {
    const partiallyFilledQty = Math.max(1, Math.floor(item.qty / 2));
    const filledQty = lifecycleStatus === 'filled' ? item.qty : (lifecycleStatus === 'partial_fill' ? partiallyFilledQty : 0);
    const orderLifecycle = lifecycleStatus === 'filled'
      ? 'filled'
      : (lifecycleStatus === 'partial_fill' ? (index % 2 === 0 ? 'filled' : 'submitted') : (lifecycleStatus === 'cancelled' ? 'cancelled' : 'rejected'));
    return controlPlaneRuntime.updateExecutionOrderState(item.id, {
      lifecycleStatus: orderLifecycle,
      filledQty,
      avgFillPrice: orderLifecycle === 'filled' ? Number((100 + index * 2.15).toFixed(2)) : null,
      acknowledgedAt: now,
      filledAt: orderLifecycle === 'filled' ? now : '',
      summary: `${item.symbol} moved to ${orderLifecycle}.`,
      updatedAt: now,
    });
  }).filter(Boolean);

  const filledOrderCount = updatedOrders.filter((item) => item.lifecycleStatus === 'filled').length;
  const rejectedOrderCount = updatedOrders.filter((item) => item.lifecycleStatus === 'rejected').length;
  const nextRun = executionRun
    ? controlPlaneRuntime.updateExecutionRun(executionRun.id, {
      lifecycleStatus,
      filledOrderCount,
      rejectedOrderCount,
      completedAt: ['filled', 'cancelled', 'failed'].includes(lifecycleStatus) ? now : '',
      summary: summarizeLifecycle(plan.strategyName, lifecycleStatus),
      metadata: {
        settledBy: payload.actor || 'execution-desk',
        outcome,
      },
    })
    : null;
  const nextPlan = controlPlaneRuntime.updateExecutionPlan(plan.id, {
    lifecycleStatus,
    summary: summarizeLifecycle(plan.strategyName, lifecycleStatus),
    updatedAt: now,
  });

  const runtime = controlPlaneRuntime.recordExecutionRuntime({
    cycleId: plan.workflowRunId || plan.id,
    cycle: 0,
    executionPlanId: plan.id,
    executionRunId: nextRun?.id || '',
    mode: plan.mode,
    brokerAdapter: 'simulated',
    brokerConnected: true,
    marketConnected: true,
    submittedOrderCount: updatedOrders.filter((item) => item.lifecycleStatus === 'submitted').length,
    rejectedOrderCount,
    openOrderCount: updatedOrders.filter((item) => item.lifecycleStatus === 'submitted').length,
    positionCount: filledOrderCount,
    cash: Math.max(0, Number(plan.capital || 0) - filledOrderCount * 1000),
    buyingPower: Math.max(0, Number(plan.capital || 0) - filledOrderCount * 1000),
    equity: Number(plan.capital || 0),
    message: summarizeLifecycle(plan.strategyName, lifecycleStatus),
    orders: buildBrokerOrders(updatedOrders, lifecycleStatus === 'filled' ? 'filled' : (lifecycleStatus === 'partial_fill' ? 'submitted' : lifecycleStatus)),
    positions: updatedOrders
      .filter((item) => item.lifecycleStatus === 'filled')
      .map((item) => ({
        symbol: item.symbol,
        qty: item.filledQty,
        side: item.side === 'BUY' ? 'LONG' : 'SHORT',
        avgEntryPrice: Number(item.avgFillPrice || 0),
        marketValue: Number(((item.avgFillPrice || 0) * item.filledQty).toFixed(2)),
        unrealizedPnl: 0,
      })),
    actor: payload.actor || 'execution-desk',
    createdAt: now,
  });

  controlPlaneRuntime.recordOperatorAction({
    type: 'execution.settle-plan',
    actor: payload.actor || 'execution-desk',
    title: `Settled execution plan for ${plan.strategyName}`,
    detail: summarizeLifecycle(plan.strategyName, lifecycleStatus),
    symbol: plan.strategyId,
    level: lifecycleStatus === 'failed' ? 'warn' : 'info',
    metadata: {
      executionPlanId: plan.id,
      executionRunId: nextRun?.id || '',
      outcome,
    },
  });

  return {
    ok: true,
    plan: nextPlan,
    executionRun: nextRun,
    orderStates: controlPlaneRuntime.listExecutionOrderStates(80, { executionPlanId: plan.id }),
    runtime,
  };
}
