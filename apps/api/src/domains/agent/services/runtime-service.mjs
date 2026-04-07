import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';

export function queueAgentDailyRun(payload = {}) {
  return controlPlaneRuntime.queueAgentDailyRun(payload);
}

export function runAgentDailyCycle(payload = {}) {
  const run = controlPlaneRuntime.appendAgentDailyRun({
    ...payload,
    status: 'running',
  });

  controlPlaneRuntime.recordAgentAuthorityEvent({
    severity: 'info',
    eventType: 'restored',
    previousMode: 'manual_only',
    nextMode: 'manual_only',
    reason: `Agent daily run ${run.kind} started.`,
  });

  return controlPlaneRuntime.updateAgentDailyRun(run.id, {
    status: 'completed',
    updatedAt: new Date().toISOString(),
  });
}
