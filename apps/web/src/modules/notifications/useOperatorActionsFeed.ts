import { useEffect, useState } from 'react';
import { fetchOperatorActions } from '../../app/api/controlPlane.ts';

export type OperatorActionFeedItem = {
  id: string;
  type: string;
  symbol: string;
  detail: string;
  actor: string;
  title: string;
  level: string;
  createdAt: string;
};

type OperatorActionsFeedOptions = {
  hours?: number | null;
  level?: string;
  limit?: number;
};

export function useOperatorActionsFeed(options: OperatorActionsFeedOptions = {}) {
  const [items, setItems] = useState<OperatorActionFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { hours = null, level = '', limit = 50 } = options;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchOperatorActions({
      hours,
      level,
      limit,
    })
      .then((payload) => {
        if (mounted) {
          setItems(Array.isArray(payload?.actions) ? payload.actions : []);
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
  }, [hours, level, limit]);

  return { items, loading };
}
