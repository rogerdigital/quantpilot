/* eslint-disable @typescript-eslint/no-explicit-any */
import { controlPlaneContext } from './context.js';

const _ctx = controlPlaneContext as any;

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
export { createCollaborationRepository } from './repositories/collaboration-repo.js';
export { createCycleRepository } from './repositories/cycle-repo.js';
export { createExecutionCandidateHandoffRepository } from './repositories/execution-candidate-handoff-repo.js';
export { createExecutionPlanRepository } from './repositories/execution-plan-repo.js';
export { createExecutionRunRepository } from './repositories/execution-run-repo.js';
export { createExecutionRuntimeRepository } from './repositories/execution-runtime-repo.js';
export { createIncidentRepository } from './repositories/incident-repo.js';
export { createMarketProviderRepository } from './repositories/market-provider-repo.js';
export { createNotificationRepository } from './repositories/notification-repo.js';
export { createOperatorActionRepository } from './repositories/operator-action-repo.js';
export { createPaperJournalRepository } from './repositories/paper-journal-repo.js';
export { createResearchSummaryRepository } from './repositories/research-summary-repo.js';
export { createRiskRepository } from './repositories/risk-repo.js';
export { createSchedulerRepository } from './repositories/scheduler-repo.js';
export { createStrategyMarketplaceRepository } from './repositories/strategy-marketplace-repo.js';
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

export const listAuditRecords = (...args: any[]) => (_ctx.audit as any).listAuditRecords(...args);
export const appendAuditRecord = (...args: any[]) => (_ctx.audit as any).appendAuditRecord(...args);
export const listAgentActionRequests = (...args: any[]) =>
  _ctx.agentActionRequests.listAgentActionRequests(...args);
export const getAgentActionRequest = (...args: any[]) =>
  _ctx.agentActionRequests.getAgentActionRequest(...args);
export const appendAgentActionRequest = (...args: any[]) =>
  _ctx.agentActionRequests.appendAgentActionRequest(...args);
export const updateAgentActionRequest = (...args: any[]) =>
  _ctx.agentActionRequests.updateAgentActionRequest(...args);
export const listAgentAnalysisRuns = (...args: any[]) =>
  _ctx.agentAnalysisRuns.listAgentAnalysisRuns(...args);
export const getAgentAnalysisRun = (...args: any[]) =>
  _ctx.agentAnalysisRuns.getAgentAnalysisRun(...args);
export const getLatestAgentAnalysisRunForSession = (...args: any[]) =>
  _ctx.agentAnalysisRuns.getLatestAgentAnalysisRunForSession(...args);
export const appendAgentAnalysisRun = (...args: any[]) =>
  _ctx.agentAnalysisRuns.appendAgentAnalysisRun(...args);
export const updateAgentAnalysisRun = (...args: any[]) =>
  _ctx.agentAnalysisRuns.updateAgentAnalysisRun(...args);
export const listAgentAuthorityEvents = (...args: any[]) =>
  _ctx.agentAuthorityEvent.listAgentAuthorityEvents(...args);
export const getAgentAuthorityEvent = (...args: any[]) =>
  _ctx.agentAuthorityEvent.getAgentAuthorityEvent(...args);
export const appendAgentAuthorityEvent = (...args: any[]) =>
  _ctx.agentAuthorityEvent.appendAgentAuthorityEvent(...args);
export const updateAgentAuthorityEvent = (...args: any[]) =>
  _ctx.agentAuthorityEvent.updateAgentAuthorityEvent(...args);
export const listAgentDailyRuns = (...args: any[]) =>
  _ctx.agentDailyRun.listAgentDailyRuns(...args);
export const getAgentDailyRun = (...args: any[]) => _ctx.agentDailyRun.getAgentDailyRun(...args);
export const appendAgentDailyRun = (...args: any[]) =>
  _ctx.agentDailyRun.appendAgentDailyRun(...args);
export const updateAgentDailyRun = (...args: any[]) =>
  _ctx.agentDailyRun.updateAgentDailyRun(...args);
export const listAgentInstructions = (...args: any[]) =>
  _ctx.agentInstruction.listAgentInstructions(...args);
export const getAgentInstruction = (...args: any[]) =>
  _ctx.agentInstruction.getAgentInstruction(...args);
export const appendAgentInstruction = (...args: any[]) =>
  _ctx.agentInstruction.appendAgentInstruction(...args);
export const updateAgentInstruction = (...args: any[]) =>
  _ctx.agentInstruction.updateAgentInstruction(...args);
export const listAgentPolicies = (...args: any[]) => _ctx.agentPolicy.listAgentPolicies(...args);
export const getAgentPolicy = (...args: any[]) => _ctx.agentPolicy.getAgentPolicy(...args);
export const appendAgentPolicy = (...args: any[]) => _ctx.agentPolicy.appendAgentPolicy(...args);
export const updateAgentPolicy = (...args: any[]) => _ctx.agentPolicy.updateAgentPolicy(...args);
export const listAgentPlans = (...args: any[]) => _ctx.agentPlans.listAgentPlans(...args);
export const getAgentPlan = (...args: any[]) => _ctx.agentPlans.getAgentPlan(...args);
export const getLatestAgentPlanForSession = (...args: any[]) =>
  _ctx.agentPlans.getLatestAgentPlanForSession(...args);
export const appendAgentPlan = (...args: any[]) => _ctx.agentPlans.appendAgentPlan(...args);
export const updateAgentPlan = (...args: any[]) => _ctx.agentPlans.updateAgentPlan(...args);
export const listAgentSessions = (...args: any[]) => _ctx.agentSessions.listAgentSessions(...args);
export const getAgentSession = (...args: any[]) => _ctx.agentSessions.getAgentSession(...args);
export const appendAgentSession = (...args: any[]) =>
  _ctx.agentSessions.appendAgentSession(...args);
export const updateAgentSession = (...args: any[]) =>
  _ctx.agentSessions.updateAgentSession(...args);
export const listAgentSessionMessages = (...args: any[]) =>
  _ctx.agentSessionMessages.listAgentSessionMessages(...args);
export const appendAgentSessionMessage = (...args: any[]) =>
  _ctx.agentSessionMessages.appendAgentSessionMessage(...args);
export const listBacktestRuns = (...args: any[]) => _ctx.backtestRuns.listBacktestRuns(...args);
export const getBacktestRun = (...args: any[]) => _ctx.backtestRuns.getBacktestRun(...args);
export const findBacktestRunByWorkflowRunId = (...args: any[]) =>
  _ctx.backtestRuns.findBacktestRunByWorkflowRunId(...args);
export const appendBacktestRun = (...args: any[]) => _ctx.backtestRuns.appendBacktestRun(...args);
export const updateBacktestRun = (...args: any[]) => _ctx.backtestRuns.updateBacktestRun(...args);
export const listCycleRecords = (...args: any[]) => _ctx.cycles.listCycleRecords(...args);
export const appendCycleRecord = (...args: any[]) => _ctx.cycles.appendCycleRecord(...args);
export const listOperatorActions = (...args: any[]) =>
  _ctx.operatorActions.listOperatorActions(...args);
export const appendOperatorAction = (...args: any[]) =>
  _ctx.operatorActions.appendOperatorAction(...args);
export const listExecutionPlans = (...args: any[]) =>
  _ctx.executionPlans.listExecutionPlans(...args);
export const getExecutionPlan = (...args: any[]) => _ctx.executionPlans.getExecutionPlan(...args);
export const findExecutionPlanByWorkflowRunId = (...args: any[]) =>
  _ctx.executionPlans.findExecutionPlanByWorkflowRunId(...args);
export const appendExecutionPlan = (...args: any[]) =>
  _ctx.executionPlans.appendExecutionPlan(...args);
export const updateExecutionPlan = (...args: any[]) =>
  _ctx.executionPlans.updateExecutionPlan(...args);
export const listExecutionRuns = (...args: any[]) => _ctx.executionRuns.listExecutionRuns(...args);
export const getExecutionRun = (...args: any[]) => _ctx.executionRuns.getExecutionRun(...args);
export const getExecutionRunByPlanId = (...args: any[]) =>
  _ctx.executionRuns.getExecutionRunByPlanId(...args);
export const appendExecutionRun = (...args: any[]) =>
  _ctx.executionRuns.appendExecutionRun(...args);
export const updateExecutionRun = (...args: any[]) =>
  _ctx.executionRuns.updateExecutionRun(...args);
export const listExecutionOrderStates = (...args: any[]) =>
  _ctx.executionRuns.listExecutionOrderStates(...args);
export const appendExecutionOrderStates = (...args: any[]) =>
  _ctx.executionRuns.appendExecutionOrderStates(...args);
export const updateExecutionOrderState = (...args: any[]) =>
  _ctx.executionRuns.updateExecutionOrderState(...args);
export const listExecutionCandidateHandoffs = (...args: any[]) =>
  _ctx.executionCandidateHandoffs.listExecutionCandidateHandoffs(...args);
export const getExecutionCandidateHandoff = (...args: any[]) =>
  _ctx.executionCandidateHandoffs.getExecutionCandidateHandoff(...args);
export const getLatestExecutionCandidateHandoffForStrategy = (...args: any[]) =>
  _ctx.executionCandidateHandoffs.getLatestExecutionCandidateHandoffForStrategy(...args);
export const appendExecutionCandidateHandoff = (...args: any[]) =>
  _ctx.executionCandidateHandoffs.appendExecutionCandidateHandoff(...args);
export const updateExecutionCandidateHandoff = (...args: any[]) =>
  _ctx.executionCandidateHandoffs.updateExecutionCandidateHandoff(...args);
export const listExecutionRuntimeEvents = (...args: any[]) =>
  _ctx.executionRuntime.listExecutionRuntimeEvents(...args);
export const appendExecutionRuntimeEvent = (...args: any[]) =>
  _ctx.executionRuntime.appendExecutionRuntimeEvent(...args);
export const listBrokerAccountSnapshots = (...args: any[]) =>
  _ctx.executionRuntime.listBrokerAccountSnapshots(...args);
export const appendBrokerAccountSnapshot = (...args: any[]) =>
  _ctx.executionRuntime.appendBrokerAccountSnapshot(...args);
export const listIncidents = (...args: any[]) => _ctx.incidents.listIncidents(...args);
export const getIncident = (...args: any[]) => _ctx.incidents.getIncident(...args);
export const listIncidentActivities = (...args: any[]) =>
  _ctx.incidents.listIncidentActivities(...args);
export const listIncidentNotes = (...args: any[]) => _ctx.incidents.listIncidentNotes(...args);
export const listIncidentTasks = (...args: any[]) => _ctx.incidents.listIncidentTasks(...args);
export const appendIncident = (...args: any[]) => _ctx.incidents.appendIncident(...args);
export const updateIncident = (...args: any[]) => _ctx.incidents.updateIncident(...args);
export const appendIncidentNote = (...args: any[]) => _ctx.incidents.appendIncidentNote(...args);
export const appendIncidentTask = (...args: any[]) => _ctx.incidents.appendIncidentTask(...args);
export const updateIncidentTask = (...args: any[]) => _ctx.incidents.updateIncidentTask(...args);
export const getMarketProviderStatus = (...args: any[]) =>
  _ctx.marketProviders.getMarketProviderStatus(...args);
export const updateMarketProviderStatus = (...args: any[]) =>
  _ctx.marketProviders.updateMarketProviderStatus(...args);
export const listNotifications = (...args: any[]) => _ctx.notifications.listNotifications(...args);
export const appendNotification = (...args: any[]) =>
  _ctx.notifications.appendNotification(...args);
export const enqueueNotification = (...args: any[]) =>
  _ctx.notifications.enqueueNotification(...args);
export const listNotificationJobs = (...args: any[]) =>
  _ctx.notifications.listNotificationJobs(...args);
export const dispatchPendingNotifications = (...args: any[]) =>
  _ctx.notifications.dispatchPendingNotifications(...args);
export const getResearchSummary = (...args: any[]) =>
  _ctx.researchSummary.getResearchSummary(...args);
export const updateResearchSummary = (...args: any[]) =>
  _ctx.researchSummary.updateResearchSummary(...args);
export const listRiskEvents = (...args: any[]) => _ctx.risk.listRiskEvents(...args);
export const appendRiskEvent = (...args: any[]) => _ctx.risk.appendRiskEvent(...args);
export const enqueueRiskScan = (...args: any[]) => _ctx.risk.enqueueRiskScan(...args);
export const listRiskScanJobs = (...args: any[]) => _ctx.risk.listRiskScanJobs(...args);
export const dispatchPendingRiskScans = (...args: any[]) =>
  _ctx.risk.dispatchPendingRiskScans(...args);
export const listSchedulerTicks = (...args: any[]) => _ctx.scheduler.listSchedulerTicks(...args);
export const recordSchedulerTick = (...args: any[]) => _ctx.scheduler.recordSchedulerTick(...args);
export const listStrategies = (...args: any[]) => _ctx.strategyCatalog.listStrategies(...args);
export const getStrategy = (...args: any[]) => _ctx.strategyCatalog.getStrategy(...args);
export const upsertStrategy = (...args: any[]) => _ctx.strategyCatalog.upsertStrategy(...args);
export const getUserAccount = (...args: any[]) => _ctx.userAccount.getUserAccount(...args);
export const getUserProfile = (...args: any[]) => _ctx.userAccount.getUserProfile(...args);
export const updateUserProfile = (...args: any[]) => _ctx.userAccount.updateUserProfile(...args);
export const getUserPreferences = (...args: any[]) => _ctx.userAccount.getUserPreferences(...args);
export const updateUserPreferences = (...args: any[]) =>
  _ctx.userAccount.updateUserPreferences(...args);
export const listBrokerBindings = (...args: any[]) => _ctx.userAccount.listBrokerBindings(...args);
export const upsertBrokerBinding = (...args: any[]) =>
  _ctx.userAccount.upsertBrokerBinding(...args);
export const listWorkflowRuns = (...args: any[]) => _ctx.workflows.listWorkflowRuns(...args);
export const getWorkflowRun = (...args: any[]) => _ctx.workflows.getWorkflowRun(...args);
export const appendWorkflowRun = (...args: any[]) => _ctx.workflows.appendWorkflowRun(...args);
export const updateWorkflowRun = (...args: any[]) => _ctx.workflows.updateWorkflowRun(...args);
export const releaseScheduledWorkflowRuns = (...args: any[]) =>
  _ctx.workflows.releaseScheduledWorkflowRuns(...args);
export const claimQueuedWorkflowRuns = (...args: any[]) =>
  _ctx.workflows.claimQueuedWorkflowRuns(...args);
