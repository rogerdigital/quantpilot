import { createAuditRepository } from './repositories/audit-repo.mjs';
import { createAgentActionRequestRepository } from './repositories/agent-action-request-repo.mjs';
import { createAgentAnalysisRunRepository } from './repositories/agent-analysis-run-repo.mjs';
import { createAgentAuthorityEventRepository } from './repositories/agent-authority-event-repo.mjs';
import { createAgentDailyRunRepository } from './repositories/agent-daily-run-repo.mjs';
import { createAgentInstructionRepository } from './repositories/agent-instruction-repo.mjs';
import { createAgentPolicyRepository } from './repositories/agent-policy-repo.mjs';
import { createAgentPlanRepository } from './repositories/agent-plan-repo.mjs';
import { createAgentSessionMessageRepository } from './repositories/agent-session-message-repo.mjs';
import { createAgentSessionRepository } from './repositories/agent-session-repo.mjs';
import { createBacktestRunRepository } from './repositories/backtest-run-repo.mjs';
import { createBacktestResultRepository } from './repositories/backtest-result-repo.mjs';
import { createCycleRepository } from './repositories/cycle-repo.mjs';
import { createExecutionPlanRepository } from './repositories/execution-plan-repo.mjs';
import { createExecutionRunRepository } from './repositories/execution-run-repo.mjs';
import { createExecutionRuntimeRepository } from './repositories/execution-runtime-repo.mjs';
import { createExecutionCandidateHandoffRepository } from './repositories/execution-candidate-handoff-repo.mjs';
import { createIncidentRepository } from './repositories/incident-repo.mjs';
import { createMarketProviderRepository } from './repositories/market-provider-repo.mjs';
import { createMonitoringRepository } from './repositories/monitoring-repo.mjs';
import { createNotificationRepository } from './repositories/notification-repo.mjs';
import { createOperatorActionRepository } from './repositories/operator-action-repo.mjs';
import { createResearchSummaryRepository } from './repositories/research-summary-repo.mjs';
import { createResearchEvaluationRepository } from './repositories/research-evaluation-repo.mjs';
import { createResearchReportRepository } from './repositories/research-report-repo.mjs';
import { createResearchTaskRepository } from './repositories/research-task-repo.mjs';
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
    storageAdapter: store.describeAdapter ? store.describeAdapter() : (store.adapter || {
      kind: 'custom',
      label: 'Custom Store',
    }),
    agentActionRequests: createAgentActionRequestRepository(store),
    agentAnalysisRuns: createAgentAnalysisRunRepository(store),
    agentAuthorityEvent: createAgentAuthorityEventRepository(store),
    agentDailyRun: createAgentDailyRunRepository(store),
    agentInstruction: createAgentInstructionRepository(store),
    agentPolicy: createAgentPolicyRepository(store),
    agentPlans: createAgentPlanRepository(store),
    agentSessionMessages: createAgentSessionMessageRepository(store),
    agentSessions: createAgentSessionRepository(store),
    audit: createAuditRepository(store),
    backtestResults: createBacktestResultRepository(store),
    backtestRuns: createBacktestRunRepository(store),
    cycles: createCycleRepository(store),
    executionPlans: createExecutionPlanRepository(store),
    executionRuns: createExecutionRunRepository(store),
    executionCandidateHandoffs: createExecutionCandidateHandoffRepository(store),
    executionRuntime: createExecutionRuntimeRepository(store),
    incidents: createIncidentRepository(store),
    marketProviders: createMarketProviderRepository(store),
    monitoring: createMonitoringRepository(store),
    notifications: createNotificationRepository(store),
    operatorActions: createOperatorActionRepository(store),
    researchEvaluations: createResearchEvaluationRepository(store),
    researchReports: createResearchReportRepository(store),
    researchSummary: createResearchSummaryRepository(store),
    researchTasks: createResearchTaskRepository(store),
    risk: createRiskRepository(store),
    scheduler: createSchedulerRepository(store),
    strategyCatalog: createStrategyRepository(store),
    userAccount: createUserAccountRepository(store),
    workerHeartbeats: createWorkerHeartbeatRepository(store),
    workflows: createWorkflowRepository(store),
  };
}

export const controlPlaneContext = createControlPlaneContext();
