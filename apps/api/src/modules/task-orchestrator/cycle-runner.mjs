import { getSession } from '../auth/service.mjs';
import { listAuditRecords } from '../audit/service.mjs';
import { listNotifications } from '../notification/service.mjs';
import { recordCycleRun } from './service.mjs';

export async function runCycle(payload, context) {
  const cycle = recordCycleRun(payload);
  const session = getSession();
  const notifications = listNotifications(10);
  const auditCount = listAuditRecords(10).length;
  const brokerHealth = await context.getBrokerHealth();
  const marketConnected = Boolean(payload.marketConnected);

  const lastStatus = cycle.pendingApprovals > 0
    ? 'REVIEW'
    : (!brokerHealth.connected || !marketConnected)
      ? 'DEGRADED'
      : 'HEALTHY';

  const routeHint = cycle.pendingApprovals > 0
    ? 'Control plane is holding live actions for manual approval.'
    : (!brokerHealth.connected || !marketConnected)
      ? 'Control plane detected degraded connectivity and is routing through fallback-aware execution.'
      : 'Control plane confirmed the cycle and kept the default execution route.';

  return {
    ok: true,
    cycle: {
      id: cycle.id,
      cycle: cycle.cycle,
      mode: cycle.mode,
      riskLevel: cycle.riskLevel,
      createdAt: cycle.createdAt,
    },
    controlPlane: {
      lastCycleId: cycle.id,
      lastStatus,
      operator: session.user.name,
      notificationCount: notifications.length,
      auditCount,
      routeHint,
      lastSyncAt: new Date().toISOString(),
    },
    notifications,
    brokerHealth,
  };
}
