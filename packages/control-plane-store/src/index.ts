// @ts-nocheck
import { controlPlaneContext } from './context.js';

export { controlPlaneContext, createControlPlaneContext } from './context.js';
export {
  CONTROL_PLANE_FILE_MANIFEST,
  exportControlPlaneBackup,
  getControlPlaneIntegrityReport,
  restoreControlPlaneBackup,
  runControlPlaneMigrations,
} from './maintenance.js';
export { createAgentActionRequestRepository } from './repositories/agent-action-request-repo.js';
export { createAgentAnalysisRunRepository } from './repositories/agent-analysis-run-repo.js';
export { createAgentAuthorityEventRepository } from './repositories/agent-authority-event-repo.js';
export { createAgentDailyRunRepository } from './repositories/agent-daily-run-repo.js';
export { createAgentInstructionRepository } from './repositories/agent-instruction-repo.js';
export { createAgentPlanRepository } from './repositories/agent-plan-repo.js';
export { createAgentPolicyRepository } from './repositories/agent-policy-repo.js';
export { createAgentSessionMessageRepository } from './repositories/agent-session-message-repo.js';
export { createAgentSessionRepository } from './repositories/agent-session-repo.js';
export { createAuditRepository } from './repositories/audit-repo.js';
export { createBacktestRunRepository } from './repositories/backtest-run-repo.js';
export { createCycleRepository } from './repositories/cycle-repo.js';
export { createExecutionCandidateHandoffRepository } from './repositories/execution-candidate-handoff-repo.js';
export { createExecutionPlanRepository } from './repositories/execution-plan-repo.js';
export { createExecutionRunRepository } from './repositories/execution-run-repo.js';
export { createExecutionRuntimeRepository } from './repositories/execution-runtime-repo.js';
export { createIncidentRepository } from './repositories/incident-repo.js';
export { createMarketProviderRepository } from './repositories/market-provider-repo.js';
export { createNotificationRepository } from './repositories/notification-repo.js';
export { createOperatorActionRepository } from './repositories/operator-action-repo.js';
export { createResearchSummaryRepository } from './repositories/research-summary-repo.js';
export { createRiskRepository } from './repositories/risk-repo.js';
export { createSchedulerRepository } from './repositories/scheduler-repo.js';
export { createStrategyRepository } from './repositories/strategy-repo.js';
export { createUserAccountRepository } from './repositories/user-account-repo.js';
export { createWorkflowRepository } from './repositories/workflow-repo.js';
export {
  controlPlaneStore,
  createControlPlaneStorageAdapter,
  createControlPlaneStore,
  getControlPlanePersistenceStatus,
  getControlPlaneStorageConfig,
  listSupportedControlPlaneAdapters,
} from './store.js';

export const listAuditRecords = (...args) => controlPlaneContext.audit.listAuditRecords(...args);
export const appendAuditRecord = (...args) => controlPlaneContext.audit.appendAuditRecord(...args);
export const listAgentActionRequests = (...args) =>
  controlPlaneContext.agentActionRequests.listAgentActionRequests(...args);
export const getAgentActionRequest = (...args) =>
  controlPlaneContext.agentActionRequests.getAgentActionRequest(...args);
export const appendAgentActionRequest = (...args) =>
  controlPlaneContext.agentActionRequests.appendAgentActionRequest(...args);
export const updateAgentActionRequest = (...args) =>
  controlPlaneContext.agentActionRequests.updateAgentActionRequest(...args);
export const listAgentAnalysisRuns = (...args) =>
  controlPlaneContext.agentAnalysisRuns.listAgentAnalysisRuns(...args);
export const getAgentAnalysisRun = (...args) =>
  controlPlaneContext.agentAnalysisRuns.getAgentAnalysisRun(...args);
export const getLatestAgentAnalysisRunForSession = (...args) =>
  controlPlaneContext.agentAnalysisRuns.getLatestAgentAnalysisRunForSession(...args);
export const appendAgentAnalysisRun = (...args) =>
  controlPlaneContext.agentAnalysisRuns.appendAgentAnalysisRun(...args);
export const updateAgentAnalysisRun = (...args) =>
  controlPlaneContext.agentAnalysisRuns.updateAgentAnalysisRun(...args);
export const listAgentAuthorityEvents = (...args) =>
  controlPlaneContext.agentAuthorityEvent.listAgentAuthorityEvents(...args);
export const getAgentAuthorityEvent = (...args) =>
  controlPlaneContext.agentAuthorityEvent.getAgentAuthorityEvent(...args);
export const appendAgentAuthorityEvent = (...args) =>
  controlPlaneContext.agentAuthorityEvent.appendAgentAuthorityEvent(...args);
export const updateAgentAuthorityEvent = (...args) =>
  controlPlaneContext.agentAuthorityEvent.updateAgentAuthorityEvent(...args);
export const listAgentDailyRuns = (...args) =>
  controlPlaneContext.agentDailyRun.listAgentDailyRuns(...args);
export const getAgentDailyRun = (...args) =>
  controlPlaneContext.agentDailyRun.getAgentDailyRun(...args);
export const appendAgentDailyRun = (...args) =>
  controlPlaneContext.agentDailyRun.appendAgentDailyRun(...args);
export const updateAgentDailyRun = (...args) =>
  controlPlaneContext.agentDailyRun.updateAgentDailyRun(...args);
export const listAgentInstructions = (...args) =>
  controlPlaneContext.agentInstruction.listAgentInstructions(...args);
export const getAgentInstruction = (...args) =>
  controlPlaneContext.agentInstruction.getAgentInstruction(...args);
export const appendAgentInstruction = (...args) =>
  controlPlaneContext.agentInstruction.appendAgentInstruction(...args);
export const updateAgentInstruction = (...args) =>
  controlPlaneContext.agentInstruction.updateAgentInstruction(...args);
export const listAgentPolicies = (...args) =>
  controlPlaneContext.agentPolicy.listAgentPolicies(...args);
export const getAgentPolicy = (...args) => controlPlaneContext.agentPolicy.getAgentPolicy(...args);
export const appendAgentPolicy = (...args) =>
  controlPlaneContext.agentPolicy.appendAgentPolicy(...args);
export const updateAgentPolicy = (...args) =>
  controlPlaneContext.agentPolicy.updateAgentPolicy(...args);
export const listAgentPlans = (...args) => controlPlaneContext.agentPlans.listAgentPlans(...args);
export const getAgentPlan = (...args) => controlPlaneContext.agentPlans.getAgentPlan(...args);
export const getLatestAgentPlanForSession = (...args) =>
  controlPlaneContext.agentPlans.getLatestAgentPlanForSession(...args);
export const appendAgentPlan = (...args) => controlPlaneContext.agentPlans.appendAgentPlan(...args);
export const updateAgentPlan = (...args) => controlPlaneContext.agentPlans.updateAgentPlan(...args);
export const listAgentSessions = (...args) =>
  controlPlaneContext.agentSessions.listAgentSessions(...args);
export const getAgentSession = (...args) =>
  controlPlaneContext.agentSessions.getAgentSession(...args);
export const appendAgentSession = (...args) =>
  controlPlaneContext.agentSessions.appendAgentSession(...args);
export const updateAgentSession = (...args) =>
  controlPlaneContext.agentSessions.updateAgentSession(...args);
export const listAgentSessionMessages = (...args) =>
  controlPlaneContext.agentSessionMessages.listAgentSessionMessages(...args);
export const appendAgentSessionMessage = (...args) =>
  controlPlaneContext.agentSessionMessages.appendAgentSessionMessage(...args);
export const listBacktestRuns = (...args) =>
  controlPlaneContext.backtestRuns.listBacktestRuns(...args);
export const getBacktestRun = (...args) => controlPlaneContext.backtestRuns.getBacktestRun(...args);
export const findBacktestRunByWorkflowRunId = (...args) =>
  controlPlaneContext.backtestRuns.findBacktestRunByWorkflowRunId(...args);
export const appendBacktestRun = (...args) =>
  controlPlaneContext.backtestRuns.appendBacktestRun(...args);
export const updateBacktestRun = (...args) =>
  controlPlaneContext.backtestRuns.updateBacktestRun(...args);
export const listCycleRecords = (...args) => controlPlaneContext.cycles.listCycleRecords(...args);
export const appendCycleRecord = (...args) => controlPlaneContext.cycles.appendCycleRecord(...args);
export const listOperatorActions = (...args) =>
  controlPlaneContext.operatorActions.listOperatorActions(...args);
export const appendOperatorAction = (...args) =>
  controlPlaneContext.operatorActions.appendOperatorAction(...args);
export const listExecutionPlans = (...args) =>
  controlPlaneContext.executionPlans.listExecutionPlans(...args);
export const getExecutionPlan = (...args) =>
  controlPlaneContext.executionPlans.getExecutionPlan(...args);
export const findExecutionPlanByWorkflowRunId = (...args) =>
  controlPlaneContext.executionPlans.findExecutionPlanByWorkflowRunId(...args);
export const appendExecutionPlan = (...args) =>
  controlPlaneContext.executionPlans.appendExecutionPlan(...args);
export const updateExecutionPlan = (...args) =>
  controlPlaneContext.executionPlans.updateExecutionPlan(...args);
export const listExecutionRuns = (...args) =>
  controlPlaneContext.executionRuns.listExecutionRuns(...args);
export const getExecutionRun = (...args) =>
  controlPlaneContext.executionRuns.getExecutionRun(...args);
export const getExecutionRunByPlanId = (...args) =>
  controlPlaneContext.executionRuns.getExecutionRunByPlanId(...args);
export const appendExecutionRun = (...args) =>
  controlPlaneContext.executionRuns.appendExecutionRun(...args);
export const updateExecutionRun = (...args) =>
  controlPlaneContext.executionRuns.updateExecutionRun(...args);
export const listExecutionOrderStates = (...args) =>
  controlPlaneContext.executionRuns.listExecutionOrderStates(...args);
export const appendExecutionOrderStates = (...args) =>
  controlPlaneContext.executionRuns.appendExecutionOrderStates(...args);
export const updateExecutionOrderState = (...args) =>
  controlPlaneContext.executionRuns.updateExecutionOrderState(...args);
export const listExecutionCandidateHandoffs = (...args) =>
  controlPlaneContext.executionCandidateHandoffs.listExecutionCandidateHandoffs(...args);
export const getExecutionCandidateHandoff = (...args) =>
  controlPlaneContext.executionCandidateHandoffs.getExecutionCandidateHandoff(...args);
export const getLatestExecutionCandidateHandoffForStrategy = (...args) =>
  controlPlaneContext.executionCandidateHandoffs.getLatestExecutionCandidateHandoffForStrategy(
    ...args
  );
export const appendExecutionCandidateHandoff = (...args) =>
  controlPlaneContext.executionCandidateHandoffs.appendExecutionCandidateHandoff(...args);
export const updateExecutionCandidateHandoff = (...args) =>
  controlPlaneContext.executionCandidateHandoffs.updateExecutionCandidateHandoff(...args);
export const listExecutionRuntimeEvents = (...args) =>
  controlPlaneContext.executionRuntime.listExecutionRuntimeEvents(...args);
export const appendExecutionRuntimeEvent = (...args) =>
  controlPlaneContext.executionRuntime.appendExecutionRuntimeEvent(...args);
export const listBrokerAccountSnapshots = (...args) =>
  controlPlaneContext.executionRuntime.listBrokerAccountSnapshots(...args);
export const appendBrokerAccountSnapshot = (...args) =>
  controlPlaneContext.executionRuntime.appendBrokerAccountSnapshot(...args);
export const listIncidents = (...args) => controlPlaneContext.incidents.listIncidents(...args);
export const getIncident = (...args) => controlPlaneContext.incidents.getIncident(...args);
export const listIncidentActivities = (...args) =>
  controlPlaneContext.incidents.listIncidentActivities(...args);
export const listIncidentNotes = (...args) =>
  controlPlaneContext.incidents.listIncidentNotes(...args);
export const listIncidentTasks = (...args) =>
  controlPlaneContext.incidents.listIncidentTasks(...args);
export const appendIncident = (...args) => controlPlaneContext.incidents.appendIncident(...args);
export const updateIncident = (...args) => controlPlaneContext.incidents.updateIncident(...args);
export const appendIncidentNote = (...args) =>
  controlPlaneContext.incidents.appendIncidentNote(...args);
export const appendIncidentTask = (...args) =>
  controlPlaneContext.incidents.appendIncidentTask(...args);
export const updateIncidentTask = (...args) =>
  controlPlaneContext.incidents.updateIncidentTask(...args);
export const getMarketProviderStatus = (...args) =>
  controlPlaneContext.marketProviders.getMarketProviderStatus(...args);
export const updateMarketProviderStatus = (...args) =>
  controlPlaneContext.marketProviders.updateMarketProviderStatus(...args);
export const listNotifications = (...args) =>
  controlPlaneContext.notifications.listNotifications(...args);
export const appendNotification = (...args) =>
  controlPlaneContext.notifications.appendNotification(...args);
export const enqueueNotification = (...args) =>
  controlPlaneContext.notifications.enqueueNotification(...args);
export const listNotificationJobs = (...args) =>
  controlPlaneContext.notifications.listNotificationJobs(...args);
export const dispatchPendingNotifications = (...args) =>
  controlPlaneContext.notifications.dispatchPendingNotifications(...args);
export const getResearchSummary = (...args) =>
  controlPlaneContext.researchSummary.getResearchSummary(...args);
export const updateResearchSummary = (...args) =>
  controlPlaneContext.researchSummary.updateResearchSummary(...args);
export const listRiskEvents = (...args) => controlPlaneContext.risk.listRiskEvents(...args);
export const appendRiskEvent = (...args) => controlPlaneContext.risk.appendRiskEvent(...args);
export const enqueueRiskScan = (...args) => controlPlaneContext.risk.enqueueRiskScan(...args);
export const listRiskScanJobs = (...args) => controlPlaneContext.risk.listRiskScanJobs(...args);
export const dispatchPendingRiskScans = (...args) =>
  controlPlaneContext.risk.dispatchPendingRiskScans(...args);
export const listSchedulerTicks = (...args) =>
  controlPlaneContext.scheduler.listSchedulerTicks(...args);
export const recordSchedulerTick = (...args) =>
  controlPlaneContext.scheduler.recordSchedulerTick(...args);
export const listStrategies = (...args) =>
  controlPlaneContext.strategyCatalog.listStrategies(...args);
export const getStrategy = (...args) => controlPlaneContext.strategyCatalog.getStrategy(...args);
export const upsertStrategy = (...args) =>
  controlPlaneContext.strategyCatalog.upsertStrategy(...args);
export const getUserAccount = (...args) => controlPlaneContext.userAccount.getUserAccount(...args);
export const getUserProfile = (...args) => controlPlaneContext.userAccount.getUserProfile(...args);
export const updateUserProfile = (...args) =>
  controlPlaneContext.userAccount.updateUserProfile(...args);
export const getUserPreferences = (...args) =>
  controlPlaneContext.userAccount.getUserPreferences(...args);
export const updateUserPreferences = (...args) =>
  controlPlaneContext.userAccount.updateUserPreferences(...args);
export const listBrokerBindings = (...args) =>
  controlPlaneContext.userAccount.listBrokerBindings(...args);
export const upsertBrokerBinding = (...args) =>
  controlPlaneContext.userAccount.upsertBrokerBinding(...args);
export const listWorkflowRuns = (...args) =>
  controlPlaneContext.workflows.listWorkflowRuns(...args);
export const getWorkflowRun = (...args) => controlPlaneContext.workflows.getWorkflowRun(...args);
export const appendWorkflowRun = (...args) =>
  controlPlaneContext.workflows.appendWorkflowRun(...args);
export const updateWorkflowRun = (...args) =>
  controlPlaneContext.workflows.updateWorkflowRun(...args);
export const releaseScheduledWorkflowRuns = (...args) =>
  controlPlaneContext.workflows.releaseScheduledWorkflowRuns(...args);
export const claimQueuedWorkflowRuns = (...args) =>
  controlPlaneContext.workflows.claimQueuedWorkflowRuns(...args);
