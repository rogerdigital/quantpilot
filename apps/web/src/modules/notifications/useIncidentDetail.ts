import { useEffect, useState } from 'react';
import { fetchIncidentDetail } from '../../app/api/controlPlane.ts';
import type { IncidentFeedItem } from './useIncidentsFeed.ts';
import type { IncidentDetailResponse } from '@shared-types/trading.ts';

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
  const [activity, setActivity] = useState<IncidentDetailResponse['activity']>({
    summary: {
      total: 0,
      notes: 0,
      statusChanges: 0,
      ownerChanges: 0,
      severityChanges: 0,
      latestAt: '',
    },
    timeline: [],
  });
  const [evidence, setEvidence] = useState<IncidentDetailResponse['evidence']>({
    summary: {
      total: 0,
      linked: 0,
      monitoringAlerts: 0,
      notifications: 0,
      audits: 0,
      operatorActions: 0,
      schedulerTicks: 0,
      riskEvents: 0,
      workflowRuns: 0,
      executionPlans: 0,
    },
    timeline: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!incidentId) {
      setIncident(null);
      setNotes([]);
      setActivity({
        summary: {
          total: 0,
          notes: 0,
          statusChanges: 0,
          ownerChanges: 0,
          severityChanges: 0,
          latestAt: '',
        },
        timeline: [],
      });
      setEvidence({
        summary: {
          total: 0,
          linked: 0,
          monitoringAlerts: 0,
          notifications: 0,
          audits: 0,
          operatorActions: 0,
          schedulerTicks: 0,
          riskEvents: 0,
          workflowRuns: 0,
          executionPlans: 0,
        },
        timeline: [],
      });
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
        setActivity(payload?.activity || {
          summary: {
            total: 0,
            notes: 0,
            statusChanges: 0,
            ownerChanges: 0,
            severityChanges: 0,
            latestAt: '',
          },
          timeline: [],
        });
        setEvidence(payload?.evidence || {
          summary: {
            total: 0,
            linked: 0,
            monitoringAlerts: 0,
            notifications: 0,
            audits: 0,
            operatorActions: 0,
            schedulerTicks: 0,
            riskEvents: 0,
            workflowRuns: 0,
            executionPlans: 0,
          },
          timeline: [],
        });
      })
      .catch(() => {
        if (!mounted) return;
        setIncident(null);
        setNotes([]);
        setActivity({
          summary: {
            total: 0,
            notes: 0,
            statusChanges: 0,
            ownerChanges: 0,
            severityChanges: 0,
            latestAt: '',
          },
          timeline: [],
        });
        setEvidence({
          summary: {
            total: 0,
            linked: 0,
            monitoringAlerts: 0,
            notifications: 0,
            audits: 0,
            operatorActions: 0,
            schedulerTicks: 0,
            riskEvents: 0,
            workflowRuns: 0,
            executionPlans: 0,
          },
          timeline: [],
        });
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

  return { incident, notes, activity, evidence, loading };
}
