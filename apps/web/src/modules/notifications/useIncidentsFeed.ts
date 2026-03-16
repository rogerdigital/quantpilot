import { useEffect, useState } from 'react';
import { fetchIncidents } from '../../app/api/controlPlane.ts';

export type IncidentFeedItem = {
  id: string;
  title: string;
  summary: string;
  status: string;
  severity: string;
  source: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
  acknowledgedAt: string;
  resolvedAt: string;
  noteCount: number;
  latestNotePreview: string;
  links: Array<Record<string, unknown>>;
  tags: string[];
  metadata?: Record<string, unknown>;
};

type IncidentsFeedOptions = {
  hours?: number | null;
  limit?: number;
  owner?: string;
  refreshKey?: number;
  severity?: string;
  source?: string;
  status?: string;
};

export function useIncidentsFeed(options: IncidentsFeedOptions = {}) {
  const [items, setItems] = useState<IncidentFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    hours = null,
    limit = 50,
    owner = '',
    refreshKey = 0,
    severity = '',
    source = '',
    status = '',
  } = options;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchIncidents({
      hours,
      limit,
      owner,
      severity,
      source,
      status,
    })
      .then((payload) => {
        if (mounted) {
          setItems(Array.isArray(payload?.incidents) ? payload.incidents : []);
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
  }, [hours, limit, owner, refreshKey, severity, source, status]);

  return { items, loading };
}
