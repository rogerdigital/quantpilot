import { executeStateWorkflow } from '../../../../../packages/task-workflow-engine/src/index.mjs';
import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.mjs';
import { queueRiskScan } from '../risk/service.mjs';
import { getSession } from '../auth/service.mjs';
import { recordCycleRun } from './service.mjs';

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
