import type { BacktestRunDetailSnapshot, BacktestRunItem, ExecutionLedgerEntry, WorkflowRunRecord } from '@shared-types/trading.ts';
import type { AuditFeedItem } from '../audit/useAuditFeed.ts';

export function useBacktestDetailPanels(options: {
  selectedRun: BacktestRunItem | null;
  runDetail: BacktestRunDetailSnapshot | null;
  auditItems: AuditFeedItem[];
  workflowRuns: WorkflowRunRecord[];
  executionEntries: ExecutionLedgerEntry[];
  selectedAuditEventId: string;
  selectedWorkflowStepKey: string;
}) {
  const {
    selectedRun,
    runDetail,
    auditItems,
    workflowRuns,
    executionEntries,
    selectedAuditEventId,
    selectedWorkflowStepKey,
  } = options;

  const selectedRunSnapshot = runDetail?.run || selectedRun;
  const selectedRunAuditItems = selectedRun
    ? auditItems
      .filter((item) => {
        const runId = typeof item.metadata?.runId === 'string' ? item.metadata.runId : '';
        return runId === selectedRun.id;
      })
      .slice(0, 6)
    : [];
  const selectedRunVersionItems = runDetail?.results || [];
  const selectedRunExecutionEntries = executionEntries
    .filter((entry) => entry.plan.strategyId === selectedRunSnapshot?.strategyId)
    .slice(0, 6);
  const selectedWorkflow = runDetail?.workflow
    || (selectedRun?.workflowRunId
      ? workflowRuns.find((workflow) => workflow.id === selectedRun.workflowRunId) || null
      : null);
  const selectedAuditEvent = selectedRunAuditItems.find((item) => item.id === selectedAuditEventId) || selectedRunAuditItems[0] || null;
  const selectedWorkflowStep = selectedWorkflow?.steps.find((step) => step.key === selectedWorkflowStepKey) || selectedWorkflow?.steps[0] || null;

  return {
    selectedRunSnapshot,
    selectedRunAuditItems,
    selectedRunVersionItems,
    selectedRunExecutionEntries,
    selectedWorkflow,
    selectedAuditEvent,
    selectedWorkflowStep,
  };
}
