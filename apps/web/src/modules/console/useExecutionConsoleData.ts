import type {
  BrokerAccountSnapshotRecord,
  ExecutionCandidateHandoffRecord,
  ExecutionLedgerEntry,
  ExecutionRuntimeEvent,
  ExecutionWorkbenchResponse,
  WorkflowRunRecord,
} from '@shared-types/trading.ts';
import { useEffect, useState } from 'react';
import {
  fetchExecutionAccountSnapshots,
  fetchExecutionCandidateHandoffs,
  fetchExecutionLedger,
  fetchExecutionRuntime,
  fetchExecutionWorkbench,
  fetchOperatorActions,
  fetchTaskWorkflows,
} from '../../app/api/controlPlane.ts';

export type OperatorActionItem = {
  id: string;
  type: string;
  symbol: string;
  detail: string;
  actor: string;
  title: string;
  level: string;
  createdAt: string;
};

type ExecutionConsoleDataState = {
  runtimeEvents: ExecutionRuntimeEvent[];
  accountSnapshots: BrokerAccountSnapshotRecord[];
  handoffs: ExecutionCandidateHandoffRecord[];
  ledgerEntries: ExecutionLedgerEntry[];
  workbench: ExecutionWorkbenchResponse | null;
  workflowRuns: WorkflowRunRecord[];
  operatorActions: OperatorActionItem[];
  evidence: {
    strategyVersion?: string;
    promotionRequestId?: string;
    riskAssessmentId?: string;
    brokerAccountId?: string;
    approvalState?: string;
    riskStatus?: string;
    reconciliationStatus?: string;
  } | null;
  recoveryPlan: {
    orderId: string;
    cases: string[];
    actions: Array<{ case: string; action: string; detail: string; timestamp: string }>;
    resolved: boolean;
    escalated: boolean;
  } | null;
  loading: boolean;
  error: string;
};

export function useExecutionConsoleData(refreshKey?: string | number) {
  const [state, setState] = useState<ExecutionConsoleDataState>({
    runtimeEvents: [],
    accountSnapshots: [],
    handoffs: [],
    ledgerEntries: [],
    workbench: null,
    workflowRuns: [],
    operatorActions: [],
    evidence: null,
    recoveryPlan: null,
    loading: true,
    error: '',
  });

  useEffect(() => {
    let active = true;
    setState((current) => ({
      ...current,
      loading: true,
      error: '',
    }));

    Promise.all([
      fetchExecutionRuntime(),
      fetchExecutionAccountSnapshots(),
      fetchExecutionCandidateHandoffs(),
      fetchExecutionLedger(),
      fetchExecutionWorkbench(),
      fetchTaskWorkflows(),
      fetchOperatorActions(),
    ])
      .then(
        ([
          runtimeResponse,
          snapshotResponse,
          handoffResponse,
          ledgerResponse,
          workbenchResponse,
          workflowResponse,
          actionResponse,
        ]) => {
          if (!active) return;
          const entries = Array.isArray(workbenchResponse?.entries)
            ? workbenchResponse.entries
            : Array.isArray(ledgerResponse?.entries)
              ? ledgerResponse.entries
              : [];
          const firstPlan = entries[0]?.plan;
          setState({
            runtimeEvents: Array.isArray(runtimeResponse?.events) ? runtimeResponse.events : [],
            accountSnapshots: Array.isArray(snapshotResponse?.snapshots)
              ? snapshotResponse.snapshots
              : [],
            handoffs: Array.isArray(handoffResponse?.handoffs) ? handoffResponse.handoffs : [],
            ledgerEntries: entries,
            workbench: workbenchResponse?.ok ? workbenchResponse : null,
            workflowRuns: Array.isArray(workflowResponse?.workflows)
              ? workflowResponse.workflows
              : [],
            operatorActions: Array.isArray(actionResponse?.actions) ? actionResponse.actions : [],
            evidence: firstPlan
              ? {
                  strategyVersion: firstPlan.strategyVersion,
                  promotionRequestId: firstPlan.promotionRequestId,
                  riskAssessmentId: firstPlan.riskAssessmentId,
                  brokerAccountId: firstPlan.brokerAccountId,
                  approvalState: firstPlan.approvalState,
                  riskStatus: firstPlan.riskStatus,
                }
              : null,
            recoveryPlan: workbenchResponse?.recoveryPlan ?? null,
            loading: false,
            error: '',
          });
        }
      )
      .catch((error) => {
        if (!active) return;
        setState({
          runtimeEvents: [],
          accountSnapshots: [],
          handoffs: [],
          ledgerEntries: [],
          workbench: null,
          workflowRuns: [],
          operatorActions: [],
          evidence: null,
          recoveryPlan: null,
          loading: false,
          error: error instanceof Error ? error.message : 'unknown error',
        });
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  return state;
}
