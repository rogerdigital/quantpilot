import { useEffect, useState } from 'react';
import type {
  ExecutionPlanDetailResponse,
  IncidentEvidenceItem,
  RiskEventDetailResponse,
  WorkflowRunDetailResponse,
} from '@shared-types/trading.ts';
import { fetchExecutionPlanDetail, fetchRiskEventDetail, fetchWorkflowRunDetail } from '../../app/api/controlPlane.ts';

type ArtifactInspectorState = {
  executionPlan: ExecutionPlanDetailResponse['plan'];
  latestRuntime: ExecutionPlanDetailResponse['latestRuntime'];
  riskEvent: RiskEventDetailResponse['event'];
  workflow: WorkflowRunDetailResponse['workflow'];
};

const EMPTY_STATE: ArtifactInspectorState = {
  executionPlan: null,
  latestRuntime: null,
  riskEvent: null,
  workflow: null,
};

export function useIncidentArtifactInspector(
  item: IncidentEvidenceItem | null,
  refreshKey = 0,
) {
  const [state, setState] = useState<ArtifactInspectorState>(EMPTY_STATE);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!item) {
      setState(EMPTY_STATE);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    const workflowRunId = typeof item.metadata?.workflowRunId === 'string'
      ? item.metadata.workflowRunId
      : (item.kind === 'workflow-run' ? item.id : '');
    const executionPlanId = typeof item.metadata?.executionPlanId === 'string'
      ? item.metadata.executionPlanId
      : (item.kind === 'execution-plan' ? item.id : '');
    const riskEventId = typeof item.metadata?.riskEventId === 'string'
      ? item.metadata.riskEventId
      : (item.kind === 'risk-event' ? item.id : '');

    Promise.all([
      workflowRunId ? fetchWorkflowRunDetail(workflowRunId).catch(() => ({ ok: false, workflow: null })) : Promise.resolve({ ok: false, workflow: null }),
      executionPlanId ? fetchExecutionPlanDetail(executionPlanId).catch(() => ({ ok: false, plan: null, workflow: null, latestRuntime: null })) : Promise.resolve({ ok: false, plan: null, workflow: null, latestRuntime: null }),
      riskEventId ? fetchRiskEventDetail(riskEventId).catch(() => ({ ok: false, event: null })) : Promise.resolve({ ok: false, event: null }),
    ])
      .then(([workflowResponse, executionResponse, riskResponse]) => {
        if (!mounted) return;
        setState({
          workflow: workflowResponse.workflow || executionResponse.workflow || null,
          executionPlan: executionResponse.plan || null,
          latestRuntime: executionResponse.latestRuntime || null,
          riskEvent: riskResponse.event || null,
        });
      })
      .catch(() => {
        if (mounted) {
          setState(EMPTY_STATE);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [item?.id, item?.kind, refreshKey]);

  return {
    ...state,
    loading,
  };
}
