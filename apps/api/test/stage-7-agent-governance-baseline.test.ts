// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { invokeGatewayRoute as invokeGateway } from './helpers/invoke-gateway.js';

const namespace = `stage-7-agent-governance-baseline-test-${randomUUID()}`;
process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE = namespace;

const [{ createGatewayHandler }, { createControlPlaneContext }, { createControlPlaneStore }] = await Promise.all([
  import('../src/gateways/alpaca.js'),
  import('../../../packages/control-plane-store/src/context.js'),
  import('../../../packages/control-plane-store/src/store.js'),
]);

const handler = createGatewayHandler({
  getBrokerHealth: async () => ({
    adapter: 'simulated',
    connected: true,
    customBrokerConfigured: false,
    alpacaConfigured: false,
  }),
  executeBrokerCycle: async () => ({
    connected: true,
    message: 'stage 7 baseline broker ok',
    submittedOrders: [],
    rejectedOrders: [],
    snapshot: {
      connected: true,
      message: 'stage 7 baseline snapshot ok',
      account: {
        cash: 100000,
        buyingPower: 100000,
        equity: 100000,
      },
      positions: [],
      orders: [],
    },
  }),
  getMarketSnapshot: async () => ({
    label: 'Stage 7 Baseline Market',
    connected: true,
    message: 'stage 7 baseline market ok',
    quotes: [],
  }),
});
createControlPlaneContext(createControlPlaneStore({ namespace }));

test.after(() => {
  rmSync(join(process.cwd(), '.quantpilot-runtime', namespace), { recursive: true, force: true });
  delete process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE;
});

test('stage 7 baseline exposes agent governance contracts', async () => {
  const response = await invokeGateway(handler, {
    method: 'GET',
    path: '/api/agent/workbench',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(typeof response.json.authorityState?.mode, 'string');
  assert.equal(typeof response.json.authorityState?.reason, 'string');
  assert.equal(typeof response.json.dailyBias?.updatedAt, 'string');
  assert.equal(Array.isArray(response.json.dailyBias?.instructions), true);
  assert.equal(Array.isArray(response.json.authorityEvents), true);
  assert.equal(Array.isArray(response.json.dailyRuns), true);
});
