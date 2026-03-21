import { useEffect, useState } from 'react';
import type { BrokerAccountSnapshotRecord, ExecutionCandidateHandoffRecord, ExecutionLedgerEntry, ExecutionRuntimeEvent, WorkflowRunRecord } from '@shared-types/trading.ts';
import {
  fetchExecutionAccountSnapshots,
  fetchExecutionCandidateHandoffs,
  fetchExecutionLedger,
  fetchExecutionRuntime,
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
  workflowRuns: WorkflowRunRecord[];
  operatorActions: OperatorActionItem[];
  loading: boolean;
  error: string;
};

export function useExecutionConsoleData(refreshKey?: string | number) {
  const [state, setState] = useState<ExecutionConsoleDataState>({
    runtimeEvents: [],
    accountSnapshots: [],
    handoffs: [],
    ledgerEntries: [],
    workflowRuns: [],
    operatorActions: [],
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
      fetchTaskWorkflows(),
      fetchOperatorActions(),
    ])
      .then(([runtimeResponse, snapshotResponse, handoffResponse, ledgerResponse, workflowResponse, actionResponse]) => {
        if (!active) return;
        setState({
          runtimeEvents: Array.isArray(runtimeResponse?.events) ? runtimeResponse.events : [],
          accountSnapshots: Array.isArray(snapshotResponse?.snapshots) ? snapshotResponse.snapshots : [],
          handoffs: Array.isArray(handoffResponse?.handoffs) ? handoffResponse.handoffs : [],
          ledgerEntries: Array.isArray(ledgerResponse?.entries) ? ledgerResponse.entries : [],
          workflowRuns: Array.isArray(workflowResponse?.workflows) ? workflowResponse.workflows : [],
          operatorActions: Array.isArray(actionResponse?.actions) ? actionResponse.actions : [],
          loading: false,
          error: '',
        });
      })
      .catch((error) => {
        if (!active) return;
        setState({
          runtimeEvents: [],
          accountSnapshots: [],
          handoffs: [],
          ledgerEntries: [],
          workflowRuns: [],
          operatorActions: [],
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
