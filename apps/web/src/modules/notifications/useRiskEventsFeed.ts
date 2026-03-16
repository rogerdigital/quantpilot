import { useEffect, useState } from 'react';
import { fetchRiskEvents } from '../../app/api/controlPlane.ts';

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
  metadata?: Record<string, unknown>;
};

type RiskEventsFeedOptions = {
  level?: string;
  refreshKey?: number;
  status?: string;
};

export function useRiskEventsFeed(options: RiskEventsFeedOptions = {}) {
  const [items, setItems] = useState<RiskEventFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    level = '',
    refreshKey = 0,
    status = '',
  } = options;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchRiskEvents()
      .then((payload) => {
        if (!mounted) return;
        const next = (Array.isArray(payload?.events) ? payload.events : [])
          .filter((item) => !level || item.level === level)
          .filter((item) => !status || item.status === status);
        setItems(next);
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
  }, [level, refreshKey, status]);

  return { items, loading };
}
