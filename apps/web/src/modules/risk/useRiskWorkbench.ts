import type { RiskWorkbenchResponse } from '@shared-types/trading.ts';
import { useEffect, useState } from 'react';
import { fetchRiskWorkbench } from '../../app/api/controlPlane.ts';

const EMPTY_WORKBENCH: RiskWorkbenchResponse = {
  ok: true,
  generatedAt: '',
  posture: {
    status: 'healthy',
    title: '',
    detail: '',
  },
  summary: {
    openRiskEvents: 0,
    riskOffEvents: 0,
    approvalRequired: 0,
    blockedExecutions: 0,
    reviewBacktests: 0,
    openRiskIncidents: 0,
    liveExposurePct: 0,
    liveEquity: 0,
    brokerConnected: false,
    concentrationPct: 0,
    drawdownAlerts: 0,
    complianceAlerts: 0,
    emergencyActions: 0,
    schedulerAttention: 0,
  },
  lanes: [],
  runbook: [],
  reviewQueue: {
    riskEvents: [],
    executionPlans: [],
    backtestRuns: [],
    incidents: [],
    schedulerTicks: [],
  },
  recent: {
    riskEvents: [],
    executionPlans: [],
    backtestRuns: [],
    incidents: [],
    brokerSnapshot: null,
    schedulerTicks: [],
  },
  linkage: {
    posture: {
      status: 'healthy',
      title: '',
      detail: '',
    },
    summary: {
      linkedRiskEvents: 0,
      linkedSchedulerTicks: 0,
      linkedIncidents: 0,
      linkedNotifications: 0,
      cycleAttention: 0,
      currentPhaseAttention: 0,
      riskOffLinked: 0,
      complianceLinked: 0,
      activePhase: '',
    },
    lanes: [],
    runbook: [],
    queue: {
      riskEvents: [],
      schedulerTicks: [],
      incidents: [],
      notifications: [],
      cycleRecords: [],
    },
  },
};

export function useRiskWorkbench(refreshKey?: string | number) {
  const [data, setData] = useState<RiskWorkbenchResponse>(EMPTY_WORKBENCH);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    fetchRiskWorkbench({ hours: 168, limit: 8 })
      .then((payload) => {
        if (!active) return;
        setData(payload);
      })
      .catch((nextError) => {
        if (!active) return;
        setData(EMPTY_WORKBENCH);
        setError(nextError instanceof Error ? nextError.message : 'unknown error');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  return { data, loading, error };
}
