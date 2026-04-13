import { useEffect, useState } from 'react';
import { fetchAuditRecords } from '../../app/api/controlPlane.ts';

export type AuditRecordFeedItem = {
  id: string;
  type: string;
  actor: string;
  title: string;
  detail: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

type AuditRecordsFeedOptions = {
  hours?: number | null;
  limit?: number;
  type?: string;
};

export function useAuditRecordsFeed(options: AuditRecordsFeedOptions = {}) {
  const [items, setItems] = useState<AuditRecordFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { hours = null, limit = 50, type = '' } = options;

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetchAuditRecords({
      hours,
      limit,
      type,
    })
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
  }, [hours, limit, type]);

  return { items, loading };
}
