import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from '../../control-plane-store/test/helpers/memory-store.mjs';
import { createControlPlaneContext } from '../../control-plane-store/src/context.mjs';
import { createControlPlaneRuntime } from '../src/index.mjs';

test('control plane runtime delegates notification and audit operations', () => {
  const runtime = createControlPlaneRuntime(createControlPlaneContext(createMemoryStore()));

  const notification = runtime.appendNotification({
    title: 'Runtime notification',
    message: 'delegated through runtime',
    source: 'runtime-test',
  });
  const audit = runtime.appendAuditRecord({
    type: 'runtime-test',
    actor: 'runtime-test',
    title: 'Runtime audit',
    detail: 'delegated audit append',
  });

  assert.equal(runtime.listNotifications()[0].id, notification.id);
  assert.equal(runtime.listAuditRecords()[0].id, audit.id);
});

test('control plane runtime dispatches queued jobs through injected context', () => {
  const runtime = createControlPlaneRuntime(createControlPlaneContext(createMemoryStore()));

  runtime.enqueueNotification({
    title: 'Queued notification',
    message: 'queued through runtime',
    source: 'runtime-test',
  });
  runtime.enqueueRiskScan({
    cycle: 3,
    mode: 'autopilot',
    riskLevel: 'RISK OFF',
    pendingApprovals: 0,
    brokerConnected: true,
    marketConnected: true,
    paperExposure: 64,
    liveExposure: 18,
    routeHint: 'runtime path',
  });

  const notificationResult = runtime.dispatchPendingNotifications({ worker: 'runtime-worker' });
  const riskResult = runtime.dispatchPendingRiskScans({ worker: 'runtime-worker' });

  assert.equal(notificationResult.dispatchedCount, 1);
  assert.equal(riskResult.dispatchedCount, 1);
  assert.equal(runtime.listNotifications()[0].source, 'risk-monitor');
  assert.equal(runtime.listRiskEvents()[0].status, 'risk-off');
});
