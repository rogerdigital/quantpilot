import { executeCycleWorkflow } from '../../../../../packages/task-workflow-engine/src/index.mjs';
import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.mjs';
import { getSession } from '../../modules/auth/service.mjs';
import { recordCycleRun } from './services/cycle-service.mjs';

export async function runCycle(payload, context) {
  return executeCycleWorkflow(payload, {
    ...controlPlaneRuntime,
    getOperatorName: () => getSession().user.name,
    recordCycleRun,
    getBrokerHealth: context.getBrokerHealth,
    executeBrokerCycle: context.executeBrokerCycle,
  });
}
