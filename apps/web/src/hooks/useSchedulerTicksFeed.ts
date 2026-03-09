import { useEffect, useState } from 'react';
import { fetchSchedulerTicks } from '../services/controlPlane.ts';

export type SchedulerTickFeedItem = {
  id: string;
  phase: string;
  status: string;
  title: string;
  message: string;
  worker: string;
  createdAt: string;
};

export function useSchedulerTicksFeed() {
  const [items, setItems] = useState<SchedulerTickFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchSchedulerTicks()
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
  }, []);

  return { items, loading };
}
