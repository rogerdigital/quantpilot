import { executeStateWorkflow } from '../../../../../packages/task-workflow-engine/src/index.mjs';
import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.mjs';
import { queueRiskScan } from '../../domains/risk/services/scan-service.mjs';
import { getSession } from '../auth/service.mjs';
import { recordCycleRun } from '../../control-plane/task-orchestrator/services/cycle-service.mjs';

export async function runStateCycle(previousState, context) {
  return executeStateWorkflow(previousState, {
    ...controlPlaneRuntime,
    getOperatorName: () => getSession().user.name,
    getBrokerHealth: context.getBrokerHealth,
    executeBrokerCycle: context.executeBrokerCycle,
    getMarketSnapshot: context.getMarketSnapshot,
    queueRiskScan,
    recordCycleRun,
  }, {
    actor: 'state-runner',
  });
}
