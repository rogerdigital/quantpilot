import { useEffect, useState } from 'react';
import type { BrokerAccountSnapshotRecord, ExecutionLedgerEntry, ExecutionRuntimeEvent, WorkflowRunRecord } from '@shared-types/trading.ts';
import {
  fetchExecutionAccountSnapshots,
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
      fetchExecutionLedger(),
      fetchTaskWorkflows(),
      fetchOperatorActions(),
    ])
      .then(([runtimeResponse, snapshotResponse, ledgerResponse, workflowResponse, actionResponse]) => {
        if (!active) return;
        setState({
          runtimeEvents: Array.isArray(runtimeResponse?.events) ? runtimeResponse.events : [],
          accountSnapshots: Array.isArray(snapshotResponse?.snapshots) ? snapshotResponse.snapshots : [],
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
