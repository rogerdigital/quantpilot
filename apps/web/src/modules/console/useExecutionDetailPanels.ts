import type {
  BrokerAccountSnapshotRecord,
  ExecutionLedgerEntry,
  WorkflowRunRecord,
} from '@shared-types/trading.ts';
import type { AuditFeedItem } from '../audit/useAuditFeed.ts';
import type { OperatorActionItem } from './useExecutionConsoleData.ts';

export function useExecutionDetailPanels(options: {
  selectedPlanId: string;
  selectedAuditEventId: string;
  selectedWorkflowStepKey: string;
  ledgerEntries: ExecutionLedgerEntry[];
  auditItems: AuditFeedItem[];
  operatorActions: OperatorActionItem[];
  workflowRuns: WorkflowRunRecord[];
  accountSnapshots: BrokerAccountSnapshotRecord[];
}) {
  const {
    selectedPlanId,
    selectedAuditEventId,
    selectedWorkflowStepKey,
    ledgerEntries,
    auditItems,
    operatorActions,
    workflowRuns,
    accountSnapshots,
  } = options;

  const selectedEntry =
    ledgerEntries.find((entry) => entry.plan.id === selectedPlanId) || ledgerEntries[0] || null;
  const selectedSymbols = selectedEntry
    ? [...new Set(selectedEntry.plan.orders.map((order) => order.symbol))]
    : [];
  const selectedExecutionAuditItems = selectedEntry
    ? auditItems
        .filter((item) => item.type === 'execution-plan')
        .filter((item) => {
          const strategyId =
            typeof item.metadata?.strategyId === 'string' ? item.metadata.strategyId : '';
          return strategyId === selectedEntry.plan.strategyId;
        })
        .slice(0, 6)
    : [];
  const selectedExecutionVersionItems = selectedExecutionAuditItems.filter(
    (item) =>
      typeof item.metadata?.orderCount === 'number' ||
      typeof item.metadata?.capital === 'number' ||
      typeof item.metadata?.riskStatus === 'string'
  );
  const selectedExecutionActions = selectedEntry
    ? operatorActions
        .filter(
          (item) =>
            item.type === 'approve-intent' ||
            item.type === 'reject-intent' ||
            item.type === 'cancel-order'
        )
        .filter((item) => selectedSymbols.includes(item.symbol))
        .slice(0, 6)
    : [];
  const selectedWorkflow = selectedEntry?.plan.workflowRunId
    ? workflowRuns.find((workflow) => workflow.id === selectedEntry.plan.workflowRunId) || null
    : null;
  const selectedAccountSnapshot = selectedEntry?.latestRuntime
    ? accountSnapshots.find((snapshot) => snapshot.cycle === selectedEntry.latestRuntime?.cycle) ||
      accountSnapshots[0] ||
      null
    : accountSnapshots[0] || null;
  const selectedAuditEvent =
    selectedExecutionAuditItems.find((item) => item.id === selectedAuditEventId) ||
    selectedExecutionAuditItems[0] ||
    null;
  const selectedWorkflowStep =
    selectedWorkflow?.steps.find((step) => step.key === selectedWorkflowStepKey) ||
    selectedWorkflow?.steps[0] ||
    null;

  return {
    selectedEntry,
    selectedExecutionAuditItems,
    selectedExecutionVersionItems,
    selectedExecutionActions,
    selectedWorkflow,
    selectedAccountSnapshot,
    selectedAuditEvent,
    selectedWorkflowStep,
  };
}
