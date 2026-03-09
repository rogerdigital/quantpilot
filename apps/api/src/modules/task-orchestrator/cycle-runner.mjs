import { getSession } from '../auth/service.mjs';
import { listAuditRecords } from '../audit/service.mjs';
import { listNotifications } from '../notification/service.mjs';
import { completeWorkflow, failWorkflow, recordCycleRun, startWorkflow } from './service.mjs';

export async function runCycle(payload, context) {
  const workflow = startWorkflow({
    workflowId: 'task-orchestrator.cycle-run',
    workflowType: 'task-orchestrator',
    actor: getSession().user.name,
    trigger: 'api',
    payload: {
      cycle: payload.cycle,
      mode: payload.mode,
      riskLevel: payload.riskLevel,
    },
    steps: [
      { key: 'record-cycle', status: 'running' },
      { key: 'execute-broker-cycle', status: 'pending' },
      { key: 'resolve-control-plane', status: 'pending' },
    ],
  });

  try {
    const cycle = recordCycleRun(payload);
    const session = getSession();
    const notifications = listNotifications(10);
    const auditCount = listAuditRecords(10).length;
    const brokerExecution = await context.executeBrokerCycle({
      liveTradeEnabled: Boolean(payload.liveTradeEnabled),
      orders: Array.isArray(payload.pendingLiveIntents) ? payload.pendingLiveIntents : [],
    });
    const brokerHealth = await context.getBrokerHealth();
    const marketConnected = Boolean(payload.marketConnected);

    const lastStatus = cycle.pendingApprovals > 0
      ? 'REVIEW'
      : (!brokerExecution.connected || !brokerHealth.connected || !marketConnected)
        ? 'DEGRADED'
        : 'HEALTHY';

    const routeHint = cycle.pendingApprovals > 0
      ? 'Control plane is holding live actions for manual approval.'
      : (!brokerHealth.connected || !marketConnected)
        ? 'Control plane detected degraded connectivity and is routing through fallback-aware execution.'
        : 'Control plane confirmed the cycle and kept the default execution route.';

    const resolution = {
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
      brokerExecution,
    };

    const persistedWorkflow = completeWorkflow(workflow.id, {
      steps: [
        { key: 'record-cycle', status: 'completed', refId: cycle.id },
        { key: 'execute-broker-cycle', status: 'completed' },
        { key: 'resolve-control-plane', status: 'completed', statusLabel: lastStatus },
      ],
      result: {
        ok: true,
        cycleId: cycle.id,
        lastStatus,
        brokerConnected: brokerHealth.connected,
      },
    });

    return {
      ...resolution,
      workflow: persistedWorkflow,
    };
  } catch (error) {
    const failedWorkflow = failWorkflow(workflow.id, error instanceof Error ? error.message : 'unknown workflow error', {
      steps: [
        { key: 'record-cycle', status: 'failed' },
        { key: 'execute-broker-cycle', status: 'skipped' },
        { key: 'resolve-control-plane', status: 'skipped' },
      ],
    });
    throw Object.assign(error instanceof Error ? error : new Error('cycle workflow failed'), {
      workflowId: failedWorkflow?.id,
    });
  }
}
