import assert from 'node:assert/strict';
import test from 'node:test';

import { createAlgoOrder, transitionOrder } from '../src/execution/order-lifecycle.ts';
import {
  buildRecoveryPlan,
  diagnoseRecoveryCase,
  executeRecoveryAction,
} from '../src/execution/recovery.ts';
import { createSimulatedBrokerAdapter } from '../src/execution/simulated-broker-adapter.ts';

test('diagnoseRecoveryCase: submit_failed when pending and broker unreachable', () => {
  const order = createAlgoOrder('r1', 'twap', 'AAPL', 'BUY', 100, {});
  const cases = diagnoseRecoveryCase(order, false);
  assert.ok(cases.includes('submit_failed'));
});

test('diagnoseRecoveryCase: ack_lost when submitted with no ack event', () => {
  const order = createAlgoOrder('r2', 'vwap', 'MSFT', 'BUY', 50, {});
  transitionOrder(order, 'submitted');
  const cases = diagnoseRecoveryCase(order, true);
  assert.ok(cases.includes('ack_lost'));
});

test('diagnoseRecoveryCase: partial_fill when not fully filled', () => {
  const order = createAlgoOrder('r3', 'twap', 'AAPL', 'BUY', 100, {});
  transitionOrder(order, 'submitted');
  transitionOrder(order, 'partial_fill');
  order.filledQty = 40;
  const cases = diagnoseRecoveryCase(order, true);
  assert.ok(cases.includes('partial_fill'));
});

test('diagnoseRecoveryCase: position_mismatch when reconciliation fails', () => {
  const order = createAlgoOrder('r4', 'iceberg', 'TSLA', 'SELL', 30, {});
  order.reconciliationStatus = 'mismatch';
  const cases = diagnoseRecoveryCase(order, true);
  assert.ok(cases.includes('position_mismatch'));
});

test('buildRecoveryPlan: creates appropriate actions per case', () => {
  const order = createAlgoOrder('r5', 'twap', 'AAPL', 'BUY', 100, {});
  const plan = buildRecoveryPlan(order, ['submit_failed', 'position_mismatch']);
  assert.equal(plan.orderId, 'r5');
  assert.equal(plan.actions.length, 2);
  assert.equal(plan.actions[0].action, 'retry_submit');
  assert.equal(plan.actions[1].action, 'reconcile');
  assert.equal(plan.resolved, false);
});

test('executeRecoveryAction: query_status returns broker state', async () => {
  const adapter = createSimulatedBrokerAdapter({ seed: 100 });
  await adapter.submitOrder({
    clientOrderId: 'algo-twap-AAPL-r6',
    symbol: 'AAPL',
    side: 'BUY',
    qty: 10,
    price: 150,
    orderType: 'limit',
    timeInForce: 'day',
  });

  const order = createAlgoOrder('r6', 'twap', 'AAPL', 'BUY', 10, {});
  transitionOrder(order, 'submitted');

  const result = await executeRecoveryAction(
    { case: 'ack_lost', orderId: 'r6', action: 'query_status', detail: '', timestamp: '' },
    order,
    adapter
  );
  assert.equal(result.success, true);
  assert.ok(result.detail.includes('filled'));
});

test('executeRecoveryAction: reconcile detects aligned state', async () => {
  const adapter = createSimulatedBrokerAdapter({ seed: 110 });
  await adapter.submitOrder({
    clientOrderId: 'algo-vwap-MSFT-r7',
    symbol: 'MSFT',
    side: 'BUY',
    qty: 5,
    price: 400,
    orderType: 'limit',
    timeInForce: 'day',
  });

  const order = createAlgoOrder('r7', 'vwap', 'MSFT', 'BUY', 5, {});
  order.filledQty = 5;
  order.avgFillPrice = 400;

  const result = await executeRecoveryAction(
    { case: 'position_mismatch', orderId: 'r7', action: 'reconcile', detail: '', timestamp: '' },
    order,
    adapter
  );
  assert.equal(result.success, true);
  assert.ok(result.detail.includes('aligned'));
});

test('executeRecoveryAction: resume when order exists at broker', async () => {
  const adapter = createSimulatedBrokerAdapter({ seed: 120 });
  await adapter.submitOrder({
    clientOrderId: 'algo-twap-GOOGL-r8',
    symbol: 'GOOGL',
    side: 'BUY',
    qty: 2,
    price: 2800,
    orderType: 'limit',
    timeInForce: 'day',
  });

  const order = createAlgoOrder('r8', 'twap', 'GOOGL', 'BUY', 2, {});
  transitionOrder(order, 'submitted');

  const result = await executeRecoveryAction(
    { case: 'gateway_restart', orderId: 'r8', action: 'resume', detail: '', timestamp: '' },
    order,
    adapter
  );
  assert.equal(result.success, true);
  assert.ok(result.detail.includes('Resumed'));
});

test('executeRecoveryAction: force_cancel on filled order fails', async () => {
  const adapter = createSimulatedBrokerAdapter({ seed: 130 });
  await adapter.submitOrder({
    clientOrderId: 'algo-iceberg-AMZN-r9',
    symbol: 'AMZN',
    side: 'BUY',
    qty: 1,
    price: 3500,
    orderType: 'limit',
    timeInForce: 'day',
  });

  const order = createAlgoOrder('r9', 'iceberg', 'AMZN', 'BUY', 1, {});
  transitionOrder(order, 'submitted');

  const result = await executeRecoveryAction(
    { case: 'cancel_rejected', orderId: 'r9', action: 'force_cancel', detail: '', timestamp: '' },
    order,
    adapter
  );
  assert.equal(result.success, false);
});
