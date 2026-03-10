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

export function useOperatorActionsFeed() {
  const [items, setItems] = useState<OperatorActionFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchOperatorActions()
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
  }, []);

  return { items, loading };
}
