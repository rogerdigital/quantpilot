import { useEffect, useState } from 'react';
import { fetchSchedulerTicks } from '../../app/api/controlPlane.ts';

export type SchedulerTickFeedItem = {
  id: string;
  phase: string;
  status: string;
  title: string;
  message: string;
  worker: string;
  createdAt: string;
};

type SchedulerTicksFeedOptions = {
  hours?: number | null;
  limit?: number;
  phase?: string;
};

export function useSchedulerTicksFeed(options: SchedulerTicksFeedOptions = {}) {
  const [items, setItems] = useState<SchedulerTickFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { hours = null, limit = 50, phase = '' } = options;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchSchedulerTicks({
      hours,
      limit,
      phase,
    })
      .then((payload) => {
        if (mounted) {
          setItems(Array.isArray(payload?.ticks) ? payload.ticks : []);
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
  }, [hours, limit, phase]);

  return { items, loading };
}
