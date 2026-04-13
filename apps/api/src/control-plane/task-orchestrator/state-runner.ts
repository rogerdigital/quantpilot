// @ts-nocheck

import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.js';
import { executeStateWorkflow } from '../../../../../packages/task-workflow-engine/src/index.js';
import { queueRiskScan } from '../../domains/risk/services/scan-service.js';
import { getSession } from '../../modules/auth/service.js';
import { recordCycleRun } from './services/cycle-service.js';

export async function runStateCycle(previousState, context) {
  return executeStateWorkflow(
    previousState,
    {
      ...controlPlaneRuntime,
      getOperatorName: () => getSession().user.name,
      getBrokerHealth: context.getBrokerHealth,
      executeBrokerCycle: context.executeBrokerCycle,
      getMarketSnapshot: context.getMarketSnapshot,
      queueRiskScan,
      recordCycleRun,
    },
    {
      actor: 'state-runner',
    }
  );
}
