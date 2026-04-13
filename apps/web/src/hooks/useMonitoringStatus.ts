import type { MonitoringStatusSnapshot } from '@shared-types/trading.ts';
import { useEffect, useState } from 'react';
import { fetchMonitoringStatus } from '../app/api/controlPlane.ts';

export function useMonitoringStatus(refreshKey?: string) {
  const [status, setStatus] = useState<MonitoringStatusSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetchMonitoringStatus()
      .then((payload) => {
        if (mounted) {
          setStatus(payload || null);
        }
      })
      .catch(() => {
        if (mounted) {
          setStatus(null);
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
  }, [refreshKey]);

  return { status, loading };
}
