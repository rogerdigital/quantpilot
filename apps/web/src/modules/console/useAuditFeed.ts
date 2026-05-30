import { useEffect, useState } from 'react';
import { fetchAuditRecords } from '../../app/api/controlPlane.ts';

export type AuditFeedItem = {
  id: string;
  type: string;
  actor: string;
  title: string;
  detail: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export function useAuditFeed(refreshKey?: string | number) {
  const [items, setItems] = useState<AuditFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetchAuditRecords()
      .then((payload) => {
        if (mounted) {
          setItems(Array.isArray(payload?.records) ? payload.records : []);
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
  }, [refreshKey]);

  return { items, loading };
}
