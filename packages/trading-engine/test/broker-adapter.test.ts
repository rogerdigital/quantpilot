import assert from 'node:assert/strict';
import test from 'node:test';

import { validateBrokerEnv } from '../src/execution/broker-adapter.ts';
import { createSimulatedBrokerAdapter } from '../src/execution/simulated-broker-adapter.ts';

test('simulated broker adapter: submit and fill order', async () => {
  const adapter = createSimulatedBrokerAdapter({ seed: 1 });
  const result = await adapter.submitOrder({
    clientOrderId: 'test-1',
    symbol: 'AAPL',
    side: 'BUY',
    qty: 10,
    price: 150,
    orderType: 'limit',
    timeInForce: 'day',
  });
  assert.equal(result.status, 'filled');
  assert.equal(result.filledQty, 10);
  assert.equal(result.avgFillPrice, 150);
});

test('simulated broker adapter: fetch positions after buy', async () => {
  const adapter = createSimulatedBrokerAdapter({ seed: 10 });
  await adapter.submitOrder({
    clientOrderId: 'pos-1',
    symbol: 'MSFT',
    side: 'BUY',
    qty: 20,
    price: 400,
    orderType: 'market',
    timeInForce: 'day',
  });
  const positions = await adapter.fetchPositions();
  assert.equal(positions.length, 1);
  assert.equal(positions[0].symbol, 'MSFT');
  assert.equal(positions[0].qty, 20);
});

test('simulated broker adapter: fetch account reflects trades', async () => {
  const adapter = createSimulatedBrokerAdapter({ seed: 20 });
  const before = await adapter.fetchAccount();
  assert.equal(before.cash, 1_000_000);
  await adapter.submitOrder({
    clientOrderId: 'acct-1',
    symbol: 'AAPL',
    side: 'BUY',
    qty: 10,
    price: 100,
    orderType: 'limit',
    timeInForce: 'day',
  });
  const after = await adapter.fetchAccount();
  assert.equal(after.cash, 999_000);
});

test('simulated broker adapter: cancel open order', async () => {
  const adapter = createSimulatedBrokerAdapter({ seed: 30 });
  await adapter.submitOrder({
    clientOrderId: 'cancel-1',
    symbol: 'TSLA',
    side: 'BUY',
    qty: 5,
    price: 200,
    orderType: 'limit',
    timeInForce: 'day',
  });
  const cancelResult = await adapter.cancelOrder('cancel-1');
  assert.equal(cancelResult.success, false);
  assert.ok(cancelResult.reason?.includes('Cannot cancel'));
});

test('simulated broker adapter: cancel unknown order', async () => {
  const adapter = createSimulatedBrokerAdapter({ seed: 40 });
  const result = await adapter.cancelOrder('unknown-1');
  assert.equal(result.success, false);
  assert.equal(result.reason, 'Order not found');
});

test('simulated broker adapter: fetch order status', async () => {
  const adapter = createSimulatedBrokerAdapter({ seed: 50 });
  await adapter.submitOrder({
    clientOrderId: 'status-1',
    symbol: 'AAPL',
    side: 'BUY',
    qty: 10,
    price: 150,
    orderType: 'limit',
    timeInForce: 'day',
  });
  const status = await adapter.fetchOrderStatus('status-1');
  assert.ok(status);
  assert.equal(status.clientOrderId, 'status-1');
  assert.equal(status.status, 'filled');
});

test('simulated broker adapter: reconcile aligned fills', async () => {
  const adapter = createSimulatedBrokerAdapter({ seed: 60 });
  await adapter.submitOrder({
    clientOrderId: 'recon-1',
    symbol: 'GOOGL',
    side: 'BUY',
    qty: 5,
    price: 2800,
    orderType: 'limit',
    timeInForce: 'day',
  });
  const result = await adapter.reconcileFills([
    { clientOrderId: 'recon-1', filledQty: 5, avgFillPrice: 2800 },
  ]);
  assert.equal(result.aligned, true);
  assert.equal(result.mismatches.length, 0);
});

test('simulated broker adapter: reconcile detects mismatch', async () => {
  const adapter = createSimulatedBrokerAdapter({ seed: 70 });
  await adapter.submitOrder({
    clientOrderId: 'recon-2',
    symbol: 'AMZN',
    side: 'BUY',
    qty: 3,
    price: 3500,
    orderType: 'limit',
    timeInForce: 'day',
  });
  const result = await adapter.reconcileFills([
    { clientOrderId: 'recon-2', filledQty: 2, avgFillPrice: 3500 },
  ]);
  assert.equal(result.aligned, false);
  assert.equal(result.mismatches.length, 1);
  assert.equal(result.mismatches[0].field, 'filledQty');
});

test('simulated broker adapter: requiresServerEnv is false', () => {
  const adapter = createSimulatedBrokerAdapter();
  assert.equal(adapter.requiresServerEnv, false);
  assert.equal(adapter.name, 'simulated');
});

test('validateBrokerEnv: identifies missing keys', () => {
  const result = validateBrokerEnv(
    { API_KEY: 'abc', API_SECRET: undefined },
    ['API_KEY', 'API_SECRET', 'BASE_URL']
  );
  assert.equal(result.valid, false);
  assert.deepEqual(result.missing, ['API_SECRET', 'BASE_URL']);
});

test('validateBrokerEnv: passes with all keys present', () => {
  const result = validateBrokerEnv(
    { API_KEY: 'abc', API_SECRET: 'def' },
    ['API_KEY', 'API_SECRET']
  );
  assert.equal(result.valid, true);
  assert.equal(result.missing.length, 0);
});
