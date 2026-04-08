import { executeCycleWorkflow } from '../../../../../packages/task-workflow-engine/src/index.js';
import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.js';
import { getSession } from '../../modules/auth/service.js';
import { recordCycleRun } from './services/cycle-service.js';

export async function runCycle(payload, context) {
  return executeCycleWorkflow(payload, {
    ...controlPlaneRuntime,
    getOperatorName: () => getSession().user.name,
    recordCycleRun,
    getBrokerHealth: context.getBrokerHealth,
    executeBrokerCycle: context.executeBrokerCycle,
  });
}
