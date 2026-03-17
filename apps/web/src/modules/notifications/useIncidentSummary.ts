import { useEffect, useState } from 'react';
import { fetchIncidentSummary } from '../../app/api/controlPlane.ts';
import type { IncidentSummaryResponse } from '@shared-types/trading.ts';

type IncidentSummaryOptions = {
  hours?: number | null;
  limit?: number;
  owner?: string;
  refreshKey?: number;
  severity?: string;
  source?: string;
  status?: string;
};

const EMPTY_SUMMARY: IncidentSummaryResponse['summary'] = {
  total: 0,
  open: 0,
  investigating: 0,
  mitigated: 0,
  resolved: 0,
  critical: 0,
  warn: 0,
  info: 0,
  unassigned: 0,
  stale: 0,
  unacknowledged: 0,
  missingNotes: 0,
  bySource: [],
  byOwner: [],
  ageBuckets: [],
  response: {
    acknowledged: 0,
    ackOverdue: 0,
    blockedTasks: 0,
    activeTasks: 0,
    unresolvedCritical: 0,
    ownerHotspots: 0,
  },
  nextActions: [],
};

export function useIncidentSummary(options: IncidentSummaryOptions = {}) {
  const [summary, setSummary] = useState<IncidentSummaryResponse['summary']>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const {
    hours = null,
    limit = 500,
    owner = '',
    refreshKey = 0,
    severity = '',
    source = '',
    status = '',
  } = options;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchIncidentSummary({
      hours,
      limit,
      owner,
      severity,
      source,
      status,
    })
      .then((payload) => {
        if (mounted) {
          setSummary(payload?.summary || EMPTY_SUMMARY);
        }
      })
      .catch(() => {
        if (mounted) {
          setSummary(EMPTY_SUMMARY);
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
  }, [hours, limit, owner, refreshKey, severity, source, status]);

  return { summary, loading };
}
