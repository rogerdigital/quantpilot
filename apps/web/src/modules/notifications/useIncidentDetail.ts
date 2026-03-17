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

const EMPTY_OPERATIONS: IncidentDetailResponse['operations'] = {
  ageHours: 0,
  stale: false,
  ackState: 'pending',
  blockedTasks: 0,
  activeTasks: 0,
  pendingTasks: 0,
  linkedEvidence: 0,
  latestActor: '',
  latestActivityAt: '',
  nextAction: {
    key: 'monitor',
    label: 'Monitor response',
    detail: 'Keep the incident moving while evidence and ownership stay current.',
  },
  handoff: {
    owner: '',
    queue: 'unassigned',
    summary: 'Assign an owner before the incident leaves triage.',
  },
};

export function useIncidentDetail(incidentId: string, refreshKey = 0) {
  const [incident, setIncident] = useState<IncidentFeedItem | null>(null);
  const [notes, setNotes] = useState<IncidentNoteItem[]>([]);
  const [tasks, setTasks] = useState<IncidentDetailResponse['tasks']>({
    summary: {
      total: 0,
      pending: 0,
      inProgress: 0,
      done: 0,
      blocked: 0,
    },
    items: [],
  });
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
  const [operations, setOperations] = useState<IncidentDetailResponse['operations']>(EMPTY_OPERATIONS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!incidentId) {
      setIncident(null);
      setNotes([]);
      setTasks({
        summary: {
          total: 0,
          pending: 0,
          inProgress: 0,
          done: 0,
          blocked: 0,
        },
        items: [],
      });
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
      setOperations(EMPTY_OPERATIONS);
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
        setTasks(payload?.tasks || {
          summary: {
            total: 0,
            pending: 0,
            inProgress: 0,
            done: 0,
            blocked: 0,
          },
          items: [],
        });
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
        setOperations(payload?.operations || EMPTY_OPERATIONS);
      })
      .catch(() => {
        if (!mounted) return;
        setIncident(null);
        setNotes([]);
        setTasks({
          summary: {
            total: 0,
            pending: 0,
            inProgress: 0,
            done: 0,
            blocked: 0,
          },
          items: [],
        });
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
        setOperations(EMPTY_OPERATIONS);
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

  return { incident, notes, tasks, activity, evidence, operations, loading };
}
