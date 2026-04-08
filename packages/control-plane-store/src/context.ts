import { createAuditRepository } from './repositories/audit-repo.js';
import { createAgentActionRequestRepository } from './repositories/agent-action-request-repo.js';
import { createAgentAnalysisRunRepository } from './repositories/agent-analysis-run-repo.js';
import { createAgentAuthorityEventRepository } from './repositories/agent-authority-event-repo.js';
import { createAgentDailyRunRepository } from './repositories/agent-daily-run-repo.js';
import { createAgentInstructionRepository } from './repositories/agent-instruction-repo.js';
import { createAgentPolicyRepository } from './repositories/agent-policy-repo.js';
import { createAgentPlanRepository } from './repositories/agent-plan-repo.js';
import { createAgentSessionMessageRepository } from './repositories/agent-session-message-repo.js';
import { createAgentSessionRepository } from './repositories/agent-session-repo.js';
import { createBacktestRunRepository } from './repositories/backtest-run-repo.js';
import { createBacktestResultRepository } from './repositories/backtest-result-repo.js';
import { createCycleRepository } from './repositories/cycle-repo.js';
import { createExecutionPlanRepository } from './repositories/execution-plan-repo.js';
import { createExecutionRunRepository } from './repositories/execution-run-repo.js';
import { createExecutionRuntimeRepository } from './repositories/execution-runtime-repo.js';
import { createExecutionCandidateHandoffRepository } from './repositories/execution-candidate-handoff-repo.js';
import { createIncidentRepository } from './repositories/incident-repo.js';
import { createMarketProviderRepository } from './repositories/market-provider-repo.js';
import { createMonitoringRepository } from './repositories/monitoring-repo.js';
import { createNotificationRepository } from './repositories/notification-repo.js';
import { createOperatorActionRepository } from './repositories/operator-action-repo.js';
import { createResearchSummaryRepository } from './repositories/research-summary-repo.js';
import { createResearchEvaluationRepository } from './repositories/research-evaluation-repo.js';
import { createResearchReportRepository } from './repositories/research-report-repo.js';
import { createResearchTaskRepository } from './repositories/research-task-repo.js';
import { createRiskRepository } from './repositories/risk-repo.js';
import { createSchedulerRepository } from './repositories/scheduler-repo.js';
import { createStrategyRepository } from './repositories/strategy-repo.js';
import { createUserAccountRepository } from './repositories/user-account-repo.js';
import { createWorkerHeartbeatRepository } from './repositories/worker-heartbeat-repo.js';
import { createWorkflowRepository } from './repositories/workflow-repo.js';
import { controlPlaneStore } from './store.js';

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
