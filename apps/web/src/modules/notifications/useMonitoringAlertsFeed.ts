import type { MonitoringAlertRecord } from '@shared-types/trading.ts';
import { useEffect, useState } from 'react';
import { fetchMonitoringAlerts } from '../../app/api/controlPlane.ts';

type MonitoringAlertsFeedOptions = {
  hours?: number | null;
  level?: string;
  limit?: number;
  snapshotId?: string;
  source?: string;
};

export function useMonitoringAlertsFeed(options: MonitoringAlertsFeedOptions = {}) {
  const [items, setItems] = useState<MonitoringAlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { hours = null, level = '', limit = 100, snapshotId = '', source = '' } = options;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchMonitoringAlerts({
      hours,
      level,
      limit,
      snapshotId,
      source,
    })
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
  }, [hours, level, limit, snapshotId, source]);

  return { items, loading };
}
