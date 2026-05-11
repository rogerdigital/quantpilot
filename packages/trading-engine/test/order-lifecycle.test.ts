import assert from 'node:assert/strict';
import test from 'node:test';

import {
  checkTimeout,
  createAlgoOrder,
  isActive,
  isTerminal,
  reconcileOrder,
  transitionOrder,
  updateAlgoFill,
  updateLegFill,
  validateTransition,
} from '../src/execution/order-lifecycle.ts';

test('validateTransition: valid transitions', () => {
  assert.equal(validateTransition('pending', 'submitted'), true);
  assert.equal(validateTransition('submitted', 'partial_fill'), true);
  assert.equal(validateTransition('partial_fill', 'filled'), true);
  assert.equal(validateTransition('submitted', 'cancelled'), true);
});

test('validateTransition: invalid transitions', () => {
  assert.equal(validateTransition('filled', 'cancelled'), false);
  assert.equal(validateTransition('pending', 'filled'), false);
  assert.equal(validateTransition('rejected', 'submitted'), false);
});

test('createAlgoOrder: includes lifecycle event and evidence fields', () => {
  const order = createAlgoOrder('o1', 'twap', 'AAPL', 'BUY', 100, { slices: 5 }, undefined, {
    strategyVersion: 'v2.1',
    promotionRequestId: 'promo-1',
    riskAssessmentId: 'ra-1',
    brokerAccountId: 'broker-1',
  });
  assert.equal(order.status, 'pending');
  assert.equal(order.strategyVersion, 'v2.1');
  assert.equal(order.promotionRequestId, 'promo-1');
  assert.equal(order.riskAssessmentId, 'ra-1');
  assert.equal(order.brokerAccountId, 'broker-1');
  assert.equal(order.reconciliationStatus, 'pending');
  assert.equal(order.lifecycleEvents.length, 1);
  assert.equal(order.lifecycleEvents[0].type, 'created');
});

test('transitionOrder: records lifecycle event', () => {
  const order = createAlgoOrder('o2', 'vwap', 'MSFT', 'SELL', 50, {});
  const result = transitionOrder(order, 'submitted');
  assert.equal(result.success, true);
  assert.equal(result.currentStatus, 'submitted');
  assert.equal(order.lifecycleEvents.length, 2);
  assert.equal(order.lifecycleEvents[1].type, 'submitted');
});

test('transitionOrder: rejected records reason in event', () => {
  const order = createAlgoOrder('o3', 'iceberg', 'TSLA', 'BUY', 200, {});
  transitionOrder(order, 'submitted');
  const result = transitionOrder(order, 'rejected', 'Insufficient margin');
  assert.equal(result.success, true);
  assert.equal(order.rejectReason, 'Insufficient margin');
  const rejEvent = order.lifecycleEvents.find((e) => e.type === 'rejected');
  assert.equal(rejEvent?.detail, 'Insufficient margin');
});

test('transitionOrder: invalid transition fails without adding event', () => {
  const order = createAlgoOrder('o4', 'twap', 'AAPL', 'BUY', 100, {});
  transitionOrder(order, 'submitted');
  transitionOrder(order, 'filled');
  const eventCountBefore = order.lifecycleEvents.length;
  const result = transitionOrder(order, 'submitted');
  assert.equal(result.success, false);
  assert.equal(order.lifecycleEvents.length, eventCountBefore);
});

test('updateLegFill: updates average price correctly', () => {
  const leg = {
    symbol: 'AAPL',
    side: 'BUY' as const,
    qty: 100,
    filledQty: 0,
    filledAvgPrice: 0,
    status: 'submitted' as const,
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  updateLegFill(leg, 50, 150);
  assert.equal(leg.filledQty, 50);
  assert.equal(leg.filledAvgPrice, 150);
  updateLegFill(leg, 50, 160);
  assert.equal(leg.filledQty, 100);
  assert.equal(leg.filledAvgPrice, 155);
  assert.equal(leg.status, 'filled');
});

test('updateAlgoFill: transitions to partial_fill then filled', () => {
  const order = createAlgoOrder('o5', 'twap', 'AAPL', 'BUY', 100, {});
  order.legs.push({
    symbol: 'AAPL',
    side: 'BUY',
    qty: 100,
    filledQty: 0,
    filledAvgPrice: 0,
    status: 'submitted',
    submittedAt: order.createdAt,
    updatedAt: order.createdAt,
  });
  transitionOrder(order, 'submitted');

  let result = updateAlgoFill(order, 0, 40, 150);
  assert.equal(result.success, true);
  assert.equal(order.status, 'partial_fill');

  result = updateAlgoFill(order, 0, 60, 155);
  assert.equal(result.success, true);
  assert.equal(order.status, 'filled');
});

test('checkTimeout: respects timeout window', () => {
  const order = createAlgoOrder('o6', 'vwap', 'GOOGL', 'BUY', 10, {}, 1000);
  transitionOrder(order, 'submitted');
  assert.equal(checkTimeout(order), false);

  order.createdAt = new Date(Date.now() - 2000).toISOString();
  assert.equal(checkTimeout(order), true);
});

test('isTerminal and isActive: correct classification', () => {
  assert.equal(isTerminal('filled'), true);
  assert.equal(isTerminal('cancelled'), true);
  assert.equal(isTerminal('pending'), false);
  assert.equal(isActive('pending'), true);
  assert.equal(isActive('submitted'), true);
  assert.equal(isActive('filled'), false);
});

test('reconcileOrder: aligned when quantities match', () => {
  const order = createAlgoOrder('o7', 'twap', 'AAPL', 'BUY', 100, {});
  order.legs.push({
    symbol: 'AAPL',
    side: 'BUY',
    qty: 100,
    filledQty: 0,
    filledAvgPrice: 0,
    status: 'submitted',
    submittedAt: order.createdAt,
    updatedAt: order.createdAt,
  });
  transitionOrder(order, 'submitted');
  updateAlgoFill(order, 0, 100, 150);

  const result = reconcileOrder(order, 100, 150);
  assert.equal(result.aligned, true);
  assert.equal(order.reconciliationStatus, 'aligned');
  assert.ok(order.lifecycleEvents.some((e) => e.type === 'reconciled'));
});

test('reconcileOrder: mismatch when quantities differ', () => {
  const order = createAlgoOrder('o8', 'vwap', 'MSFT', 'SELL', 50, {});
  order.legs.push({
    symbol: 'MSFT',
    side: 'SELL',
    qty: 50,
    filledQty: 0,
    filledAvgPrice: 0,
    status: 'submitted',
    submittedAt: order.createdAt,
    updatedAt: order.createdAt,
  });
  transitionOrder(order, 'submitted');
  updateAlgoFill(order, 0, 50, 300);

  const result = reconcileOrder(order, 45, 300);
  assert.equal(result.aligned, false);
  assert.equal(order.reconciliationStatus, 'mismatch');
  assert.ok(order.lifecycleEvents.some((e) => e.type === 'mismatch'));
});
