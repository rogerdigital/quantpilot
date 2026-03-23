import { useEffect, useState } from 'react';
import type { SchedulerWorkbenchResponse } from '@shared-types/trading.ts';
import { fetchSchedulerWorkbench } from '../../app/api/controlPlane.ts';

const EMPTY_WORKBENCH: SchedulerWorkbenchResponse = {
  ok: true,
  generatedAt: '',
  posture: {
    status: 'healthy',
    title: '',
    detail: '',
    currentPhase: '',
    lastTickAt: '',
  },
  summary: {
    totalTicks: 0,
    attentionTicks: 0,
    criticalTicks: 0,
    phaseChanges: 0,
    preOpenTicks: 0,
    intradayTicks: 0,
    postCloseTicks: 0,
    offHoursTicks: 0,
    openIncidents: 0,
    cycleAttention: 0,
    schedulerNotifications: 0,
    riskSignals: 0,
  },
  lanes: [],
  runbook: [],
  queue: {
    attentionTicks: [],
    incidents: [],
    notifications: [],
    cycleRecords: [],
    riskEvents: [],
  },
  recent: {
    ticks: [],
    incidents: [],
    notifications: [],
    cycleRecords: [],
    riskEvents: [],
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

export function useSchedulerWorkbench(options: {
  hours?: number | null;
  limit?: number;
  refreshKey?: number;
} = {}) {
  const [workbench, setWorkbench] = useState<SchedulerWorkbenchResponse>(EMPTY_WORKBENCH);
  const [loading, setLoading] = useState(true);
  const {
    hours = 24,
    limit = 40,
    refreshKey = 0,
  } = options;

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetchSchedulerWorkbench({
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
