import type { ExecutionLedgerEntry, WorkflowRunRecord } from '@shared-types/trading.ts';
import { useEffect, useState } from 'react';
import { fetchExecutionLedger, fetchTaskWorkflows } from '../../app/api/controlPlane.ts';
import { useAuditFeed } from '../audit/useAuditFeed.ts';
import { useResearchHub } from './useResearchHub.ts';

type ResearchWorkspaceDataState = {
  executionEntries: ExecutionLedgerEntry[];
  workflowRuns: WorkflowRunRecord[];
  loading: boolean;
};

export function useResearchWorkspaceData(options?: {
  refreshKey?: string | number;
  includeWorkflows?: boolean;
}) {
  const refreshKey = options?.refreshKey;
  const includeWorkflows = options?.includeWorkflows ?? false;
  const researchHub = useResearchHub(refreshKey);
  const auditFeed = useAuditFeed(refreshKey);
  const [state, setState] = useState<ResearchWorkspaceDataState>({
    executionEntries: [],
    workflowRuns: [],
    loading: true,
  });

  useEffect(() => {
    let active = true;
    setState((current) => ({
      ...current,
      loading: true,
    }));

    const requests = includeWorkflows
      ? Promise.all([fetchExecutionLedger(), fetchTaskWorkflows()])
      : Promise.all([
          fetchExecutionLedger(),
          Promise.resolve({ workflows: [] as WorkflowRunRecord[] }),
        ]);

    requests
      .then(([ledgerPayload, workflowPayload]) => {
        if (!active) return;
        setState({
          executionEntries: Array.isArray(ledgerPayload?.entries) ? ledgerPayload.entries : [],
          workflowRuns: Array.isArray(workflowPayload?.workflows) ? workflowPayload.workflows : [],
          loading: false,
        });
      })
      .catch(() => {
        if (!active) return;
        setState({
          executionEntries: [],
          workflowRuns: [],
          loading: false,
        });
      });

    return () => {
      active = false;
    };
  }, [includeWorkflows, refreshKey]);

  return {
    ...researchHub,
    auditItems: auditFeed.items,
    auditLoading: auditFeed.loading,
    executionEntries: state.executionEntries,
    workflowRuns: state.workflowRuns,
    workspaceLoading: state.loading,
  };
}
