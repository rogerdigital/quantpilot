import type { MonitoringSnapshotRecord } from '@shared-types/trading.ts';
import { useEffect, useState } from 'react';
import { fetchMonitoringSnapshots } from '../../app/api/controlPlane.ts';

type MonitoringSnapshotsFeedOptions = {
  hours?: number | null;
  limit?: number;
  status?: string;
};

export function useMonitoringSnapshotsFeed(options: MonitoringSnapshotsFeedOptions = {}) {
  const [items, setItems] = useState<MonitoringSnapshotRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { hours = null, limit = 50, status = '' } = options;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchMonitoringSnapshots({
      hours,
      limit,
      status,
    })
      .then((payload) => {
        if (mounted) {
          setItems(Array.isArray(payload?.snapshots) ? payload.snapshots : []);
        }
      })
      .catch(() => {
        if (mounted) {
          setItems([]);
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
  }, [hours, limit, status]);

  return { items, loading };
}
