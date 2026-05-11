// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildBrokerConnectorStatus,
  createBrokerConnectorCapabilities,
  isAssetClassSupported,
  isOrderTypeSupported,
  validateBrokerConnectorEnv,
} from '../src/connectors/broker-connector.js';

test('createBrokerConnectorCapabilities returns defaults', () => {
  const caps = createBrokerConnectorCapabilities();
  assert.deepEqual(caps.supportedOrderTypes, ['market', 'limit', 'stop']);
  assert.deepEqual(caps.supportedAssetClasses, ['equity']);
  assert.deepEqual(caps.supportedTradingModes, ['paper']);
  assert.equal(caps.supportsShortSelling, false);
  assert.equal(caps.maxConcurrentOrders, 10);
});

test('createBrokerConnectorCapabilities accepts overrides', () => {
  const caps = createBrokerConnectorCapabilities({
    supportedOrderTypes: ['market', 'limit', 'stop', 'trailing_stop'],
    supportedAssetClasses: ['equity', 'crypto'],
    supportedTradingModes: ['paper', 'live'],
    supportsShortSelling: true,
    supportsFractionalShares: true,
    maxConcurrentOrders: 50,
  });
  assert.equal(caps.supportedOrderTypes.length, 4);
  assert.ok(caps.supportedAssetClasses.includes('crypto'));
  assert.ok(caps.supportedTradingModes.includes('live'));
  assert.equal(caps.supportsShortSelling, true);
});

test('validateBrokerConnectorEnv paper mode only needs BROKER_PROVIDER', () => {
  const result = validateBrokerConnectorEnv({ BROKER_PROVIDER: 'alpaca' }, 'paper');
  assert.equal(result.valid, true);
  assert.equal(result.missing.length, 0);
});

test('validateBrokerConnectorEnv live mode requires credentials', () => {
  const result = validateBrokerConnectorEnv({ BROKER_PROVIDER: 'alpaca' }, 'live');
  assert.equal(result.valid, false);
  assert.ok(result.missing.includes('BROKER_API_KEY'));
  assert.ok(result.missing.includes('BROKER_API_SECRET'));
  assert.ok(result.missing.includes('BROKER_ACCOUNT_ID'));
});

test('validateBrokerConnectorEnv live passes with all env vars', () => {
  const result = validateBrokerConnectorEnv(
    {
      BROKER_PROVIDER: 'alpaca',
      BROKER_API_KEY: 'key',
      BROKER_API_SECRET: 'secret',
      BROKER_ACCOUNT_ID: 'acc123',
    },
    'live'
  );
  assert.equal(result.valid, true);
});

test('isOrderTypeSupported checks capabilities', () => {
  const caps = createBrokerConnectorCapabilities();
  assert.equal(isOrderTypeSupported(caps, 'market'), true);
  assert.equal(isOrderTypeSupported(caps, 'limit'), true);
  assert.equal(isOrderTypeSupported(caps, 'trailing_stop'), false);
});

test('isAssetClassSupported checks capabilities', () => {
  const caps = createBrokerConnectorCapabilities({ supportedAssetClasses: ['equity', 'option'] });
  assert.equal(isAssetClassSupported(caps, 'equity'), true);
  assert.equal(isAssetClassSupported(caps, 'option'), true);
  assert.equal(isAssetClassSupported(caps, 'crypto'), false);
});

test('buildBrokerConnectorStatus constructs status object', () => {
  const status = buildBrokerConnectorStatus({
    connectorId: 'broker-alpaca',
    connected: true,
    latencyMs: 15,
    activeOrders: 3,
  });
  assert.equal(status.connectorId, 'broker-alpaca');
  assert.equal(status.connected, true);
  assert.equal(status.latencyMs, 15);
  assert.equal(status.activeOrders, 3);
  assert.equal(status.message, 'Connected');
  assert.ok(status.lastHeartbeat);
});

test('buildBrokerConnectorStatus shows Disconnected when not connected', () => {
  const status = buildBrokerConnectorStatus({
    connectorId: 'broker-ib',
    connected: false,
    latencyMs: 0,
    activeOrders: 0,
  });
  assert.equal(status.message, 'Disconnected');
});

test('connector declares supported order types, asset classes, trading modes', () => {
  const caps = createBrokerConnectorCapabilities({
    supportedOrderTypes: ['market', 'limit', 'stop', 'stop_limit'],
    supportedAssetClasses: ['equity', 'future', 'crypto'],
    supportedTradingModes: ['paper', 'live'],
  });
  assert.equal(caps.supportedOrderTypes.length, 4);
  assert.equal(caps.supportedAssetClasses.length, 3);
  assert.equal(caps.supportedTradingModes.length, 2);
});
