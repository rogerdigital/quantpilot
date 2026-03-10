import { useEffect, useState } from 'react';
import { fetchRiskEvents } from '../../services/controlPlane.ts';

export type RiskEventFeedItem = {
  id: string;
  level: string;
  status: string;
  title: string;
  message: string;
  cycle: number;
  riskLevel: string;
  source: string;
  createdAt: string;
};

export function useRiskEventsFeed() {
  const [items, setItems] = useState<RiskEventFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchRiskEvents()
      .then((payload) => {
        if (mounted) {
          setItems(Array.isArray(payload?.events) ? payload.events : []);
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
