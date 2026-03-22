import { describe, expect, it } from 'vitest';
import {
  collectExecutionIncidentIds,
  filterExecutionEntriesByQueueFocus,
  getExecutionQueueFocusOptions,
  mapExecutionNextActionToFocus,
} from './executionOperations.ts';

const baseEntries = [
  {
    plan: { id: 'plan-1' },
    linkedIncidents: [{ id: 'incident-1', status: 'open' }],
  },
  {
    plan: { id: 'plan-2' },
    linkedIncidents: [{ id: 'incident-2', status: 'resolved' }],
  },
  {
    plan: { id: 'plan-3' },
    linkedIncidents: [{ id: 'incident-3', status: 'investigating' }],
  },
] as any;

describe('executionOperations helpers', () => {
  it('filters ledger entries by queue focus', () => {
    const filtered = filterExecutionEntriesByQueueFocus(baseEntries, 'incidents', {
      queues: {
        approvals: [],
        retryEligible: [],
        compensation: [],
        compensationAutomation: [],
        incidents: [baseEntries[0], baseEntries[2]],
        activeRouting: [],
      },
      ownerLoad: [],
      nextActions: [],
    });

    expect(filtered.map((entry) => entry.plan.id)).toEqual(['plan-1', 'plan-3']);
  });

  it('collects only unresolved execution incident ids for selected plans', () => {
    expect(collectExecutionIncidentIds(baseEntries, ['plan-1', 'plan-2', 'plan-3'])).toEqual(['incident-1', 'incident-3']);
  });

  it('maps execution next actions into queue focuses', () => {
    expect(mapExecutionNextActionToFocus('clear-approvals')).toBe('approvals');
    expect(mapExecutionNextActionToFocus('run-compensation-automation')).toBe('compensationAutomation');
    expect(mapExecutionNextActionToFocus('watch-active-routing')).toBe('activeRouting');
  });

  it('builds queue focus labels and counts', () => {
    const options = getExecutionQueueFocusOptions('en', {
      queues: {
        approvals: [baseEntries[0]],
        retryEligible: [],
        compensation: [baseEntries[1]],
        compensationAutomation: [baseEntries[2]],
        incidents: [baseEntries[0], baseEntries[2]],
        activeRouting: [],
      },
      ownerLoad: [],
      nextActions: [],
    });

    expect(options.find((item) => item.key === 'approvals')?.count).toBe(1);
    expect(options.find((item) => item.key === 'incidents')?.count).toBe(2);
    expect(options[0]?.key).toBe('all');
  });
});
