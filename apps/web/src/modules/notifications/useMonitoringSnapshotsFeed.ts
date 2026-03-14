import { useEffect, useState } from 'react';
import { fetchMonitoringSnapshots } from '../../app/api/controlPlane.ts';
import type { MonitoringSnapshotRecord } from '@shared-types/trading.ts';

export function useMonitoringSnapshotsFeed() {
  const [items, setItems] = useState<MonitoringSnapshotRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchMonitoringSnapshots()
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
  }, []);

  return { items, loading };
}
