import { useEffect, useState } from 'react';
import { fetchIncidentDetail } from '../../app/api/controlPlane.ts';
import type { IncidentFeedItem } from './useIncidentsFeed.ts';

export type IncidentNoteItem = {
  id: string;
  incidentId: string;
  body: string;
  author: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export function useIncidentDetail(incidentId: string, refreshKey = 0) {
  const [incident, setIncident] = useState<IncidentFeedItem | null>(null);
  const [notes, setNotes] = useState<IncidentNoteItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!incidentId) {
      setIncident(null);
      setNotes([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    fetchIncidentDetail(incidentId)
      .then((payload) => {
        if (!mounted) return;
        setIncident(payload?.incident || null);
        setNotes(Array.isArray(payload?.notes) ? payload.notes : []);
      })
      .catch(() => {
        if (!mounted) return;
        setIncident(null);
        setNotes([]);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [incidentId, refreshKey]);

  return { incident, notes, loading };
}
