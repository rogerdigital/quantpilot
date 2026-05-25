import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { invokeGatewayRoute } from './helpers/invoke-gateway.js';

const namespace = `compliance-test-${randomUUID()}`;
process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE = namespace;

const [{ createGatewayHandler }, { createControlPlaneContext }, { createControlPlaneStore }] =
  await Promise.all([
    import('../src/gateways/alpaca.js'),
    import('../../../packages/control-plane-store/src/context.js'),
    import('../../../packages/control-plane-store/src/store.js'),
  ]);

const handler = createGatewayHandler({
  getBrokerHealth: async () => ({ adapter: 'simulated', connected: true }),
  executeBrokerCycle: async () => ({
    connected: true,
    message: 'ok',
    submittedOrders: [],
    rejectedOrders: [],
    snapshot: {
      connected: true,
      message: 'ok',
      account: { cash: 0, buyingPower: 0, equity: 0 },
      positions: [],
      orders: [],
    },
  }),
  getMarketSnapshot: async () => ({ label: 'Test', connected: true, message: 'ok', quotes: [] }),
});

createControlPlaneContext(createControlPlaneStore({ namespace }));

test.after(() => {
  rmSync(join(process.cwd(), '.quantpilot-runtime', namespace), { recursive: true, force: true });
  delete process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE;
});

test('POST /api/compliance/reports creates a draft report', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/compliance/reports',
    body: {
      reportType: 'strategy_promotion',
      title: 'Q1 Promotion Audit',
      summary: 'All strategy promotions in Q1',
      generatedBy: 'compliance-officer',
    },
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.json.ok, true);
  assert.equal(res.json.report.reportType, 'strategy_promotion');
  assert.equal(res.json.report.status, 'draft');
});

test('POST /api/compliance/reports rejects invalid reportType', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/compliance/reports',
    body: { reportType: 'invalid_type', title: 'Bad' },
  });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json.ok, false);
});

test('GET /api/compliance/reports lists all reports', async () => {
  // Create two reports
  await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/compliance/reports',
    body: { reportType: 'risk_breach', title: 'Risk Report' },
  });
  await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/compliance/reports',
    body: { reportType: 'agent_action', title: 'Agent Report' },
  });

  const res = await invokeGatewayRoute(handler, {
    method: 'GET',
    path: '/api/compliance/reports',
  });
  assert.equal(res.statusCode, 200);
  assert.ok(res.json.reports.length >= 2);
});

test('GET /api/compliance/reports filters by reportType', async () => {
  const res = await invokeGatewayRoute(handler, {
    method: 'GET',
    path: '/api/compliance/reports?reportType=risk_breach',
  });
  assert.equal(res.statusCode, 200);
  assert.ok(res.json.reports.every((r) => r.reportType === 'risk_breach'));
});

test('POST entries, finalize, and export lifecycle', async () => {
  const createRes = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/compliance/reports',
    body: {
      reportType: 'execution_incident',
      title: 'Incident Lifecycle Test',
      generatedBy: 'tester',
    },
  });
  const reportId = createRes.json.report.id;

  // Append entry
  const entryRes = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/compliance/reports/${reportId}/entries`,
    body: { actor: 'operator', action: 'acknowledged', detail: 'Incident acknowledged' },
  });
  assert.equal(entryRes.statusCode, 200);
  assert.equal(entryRes.json.report.entries.length, 1);

  // Finalize
  const finalizeRes = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/compliance/reports/${reportId}/finalize`,
  });
  assert.equal(finalizeRes.statusCode, 200);
  assert.equal(finalizeRes.json.report.status, 'final');

  // Export
  const exportRes = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/compliance/reports/${reportId}/export`,
  });
  assert.equal(exportRes.statusCode, 200);
  assert.equal(exportRes.json.report.status, 'exported');
});

test('export fails on non-finalized report', async () => {
  const createRes = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/compliance/reports',
    body: { reportType: 'dataset_lineage', title: 'Draft Only' },
  });
  const reportId = createRes.json.report.id;

  const exportRes = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/compliance/reports/${reportId}/export`,
  });
  assert.equal(exportRes.statusCode, 400);
});

test('all 6 report types are accepted', async () => {
  const types = [
    'strategy_promotion',
    'live_trading_approval',
    'risk_breach',
    'execution_incident',
    'agent_action',
    'dataset_lineage',
  ];
  for (const reportType of types) {
    const res = await invokeGatewayRoute(handler, {
      method: 'POST',
      path: '/api/compliance/reports',
      body: { reportType, title: `${reportType} test` },
    });
    assert.equal(res.statusCode, 201, `Failed for type: ${reportType}`);
  }
});
