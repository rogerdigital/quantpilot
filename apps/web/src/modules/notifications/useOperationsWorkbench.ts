import { useEffect, useState } from 'react';
import { fetchOperationsWorkbench } from '../../app/api/controlPlane.ts';
import type { OperationsWorkbenchResponse } from '@shared-types/trading.ts';

const EMPTY_WORKBENCH: OperationsWorkbenchResponse = {
  ok: true,
  generatedAt: '',
  status: 'healthy',
  summary: {
    criticalSignals: 0,
    warnSignals: 0,
    queuePressure: 0,
    queueBacklogStatus: 'healthy',
    openIncidents: 0,
    staleIncidents: 0,
    unassignedIncidents: 0,
    schedulerAttention: 0,
    retryScheduledWorkflows: 0,
    staleWorkers: 0,
    activeWorkers: 0,
    workflowFailureRate: 0,
  },
  observability: {
    posture: 'healthy',
    headline: '',
    detail: '',
    queueBacklogStatus: 'healthy',
    oldestQueuedAgeSeconds: null,
    oldestRetryAgeSeconds: null,
    lastCompletedWorkflowAt: null,
    workerLagSeconds: null,
  },
  persistence: {
    posture: 'healthy',
    headline: '',
    detail: '',
    adapter: {
      kind: 'file',
      label: 'JSON File Store',
      namespace: 'control-plane',
    },
    storageModel: 'filesystem-json',
    schemaVersion: null,
    currentVersion: null,
    targetVersion: null,
    pendingCount: 0,
    upToDate: true,
    recommendedAction: '',
    latestMigration: null,
    links: {
      maintenance: '/notifications#operations-workbench',
      settings: '/settings#persistence-migration',
    },
  },
  lanes: [],
  runbook: [],
  recent: {
    incident: null,
    monitoringAlert: null,
    notification: null,
    auditRecord: null,
    schedulerTick: null,
  },
};

export function useOperationsWorkbench(options: { hours?: number | null; limit?: number; refreshKey?: number } = {}) {
  const [workbench, setWorkbench] = useState<OperationsWorkbenchResponse>(EMPTY_WORKBENCH);
  const [loading, setLoading] = useState(true);
  const {
    hours = 24,
    limit = 120,
    refreshKey = 0,
  } = options;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchOperationsWorkbench({
      hours,
      limit,
    })
      .then((payload) => {
        if (mounted) {
          setWorkbench(payload || EMPTY_WORKBENCH);
        }
      })
      .catch(() => {
        if (mounted) {
          setWorkbench(EMPTY_WORKBENCH);
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
  }, [hours, limit, refreshKey]);

  return { workbench, loading };
}
