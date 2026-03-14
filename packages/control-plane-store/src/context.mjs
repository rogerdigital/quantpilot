import { createAuditRepository } from './repositories/audit-repo.mjs';
import { createAgentActionRequestRepository } from './repositories/agent-action-request-repo.mjs';
import { createBacktestRunRepository } from './repositories/backtest-run-repo.mjs';
import { createCycleRepository } from './repositories/cycle-repo.mjs';
import { createExecutionPlanRepository } from './repositories/execution-plan-repo.mjs';
import { createExecutionRuntimeRepository } from './repositories/execution-runtime-repo.mjs';
import { createMarketProviderRepository } from './repositories/market-provider-repo.mjs';
import { createMonitoringRepository } from './repositories/monitoring-repo.mjs';
import { createNotificationRepository } from './repositories/notification-repo.mjs';
import { createOperatorActionRepository } from './repositories/operator-action-repo.mjs';
import { createResearchSummaryRepository } from './repositories/research-summary-repo.mjs';
import { createRiskRepository } from './repositories/risk-repo.mjs';
import { createSchedulerRepository } from './repositories/scheduler-repo.mjs';
import { createStrategyRepository } from './repositories/strategy-repo.mjs';
import { createUserAccountRepository } from './repositories/user-account-repo.mjs';
import { createWorkerHeartbeatRepository } from './repositories/worker-heartbeat-repo.mjs';
import { createWorkflowRepository } from './repositories/workflow-repo.mjs';
import { controlPlaneStore } from './store.mjs';

export function createControlPlaneContext(store = controlPlaneStore) {
  return {
    store,
    agentActionRequests: createAgentActionRequestRepository(store),
    audit: createAuditRepository(store),
    backtestRuns: createBacktestRunRepository(store),
    cycles: createCycleRepository(store),
    executionPlans: createExecutionPlanRepository(store),
    executionRuntime: createExecutionRuntimeRepository(store),
    marketProviders: createMarketProviderRepository(store),
    monitoring: createMonitoringRepository(store),
    notifications: createNotificationRepository(store),
    operatorActions: createOperatorActionRepository(store),
    researchSummary: createResearchSummaryRepository(store),
    risk: createRiskRepository(store),
    scheduler: createSchedulerRepository(store),
    strategyCatalog: createStrategyRepository(store),
    userAccount: createUserAccountRepository(store),
    workerHeartbeats: createWorkerHeartbeatRepository(store),
    workflows: createWorkflowRepository(store),
  };
}

export const controlPlaneContext = createControlPlaneContext();
