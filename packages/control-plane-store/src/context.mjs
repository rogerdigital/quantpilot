import { createAuditRepository } from './repositories/audit-repo.mjs';
import { createCycleRepository } from './repositories/cycle-repo.mjs';
import { createExecutionPlanRepository } from './repositories/execution-plan-repo.mjs';
import { createNotificationRepository } from './repositories/notification-repo.mjs';
import { createOperatorActionRepository } from './repositories/operator-action-repo.mjs';
import { createRiskRepository } from './repositories/risk-repo.mjs';
import { createSchedulerRepository } from './repositories/scheduler-repo.mjs';
import { createWorkflowRepository } from './repositories/workflow-repo.mjs';
import { controlPlaneStore } from './store.mjs';

export function createControlPlaneContext(store = controlPlaneStore) {
  return {
    store,
    audit: createAuditRepository(store),
    cycles: createCycleRepository(store),
    executionPlans: createExecutionPlanRepository(store),
    notifications: createNotificationRepository(store),
    operatorActions: createOperatorActionRepository(store),
    risk: createRiskRepository(store),
    scheduler: createSchedulerRepository(store),
    workflows: createWorkflowRepository(store),
  };
}

export const controlPlaneContext = createControlPlaneContext();
