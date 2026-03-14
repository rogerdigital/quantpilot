import { useEffect, useState } from 'react';
import { fetchMonitoringAlerts } from '../../app/api/controlPlane.ts';
import type { MonitoringAlertRecord } from '@shared-types/trading.ts';

export function useMonitoringAlertsFeed() {
  const [items, setItems] = useState<MonitoringAlertRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchMonitoringAlerts()
      .then((payload) => {
        if (mounted) {
          setItems(Array.isArray(payload?.alerts) ? payload.alerts : []);
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
