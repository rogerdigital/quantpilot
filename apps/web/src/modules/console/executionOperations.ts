import type {
  ExecutionLedgerEntry,
  ExecutionWorkbenchResponse,
} from '../../../../../packages/shared-types/src/trading.ts';

export type ExecutionQueueFocusKey =
  | 'all'
  | 'approvals'
  | 'retryEligible'
  | 'compensation'
  | 'compensationAutomation'
  | 'incidents'
  | 'activeRouting';

export function getExecutionQueueFocusOptions(
  locale: string,
  operations: ExecutionWorkbenchResponse['operations'] | null | undefined
): Array<{ key: ExecutionQueueFocusKey; label: string; count: number }> {
  const queues = operations?.queues;
  return [
    { key: 'all', label: locale === 'zh' ? '全部计划' : 'All Plans', count: 0 },
    {
      key: 'approvals',
      label: locale === 'zh' ? '审批队列' : 'Approvals',
      count: queues?.approvals.length ?? 0,
    },
    {
      key: 'retryEligible',
      label: locale === 'zh' ? '重试队列' : 'Retry Queue',
      count: queues?.retryEligible.length ?? 0,
    },
    {
      key: 'compensationAutomation',
      label: locale === 'zh' ? '自动补偿' : 'Auto Comp',
      count: queues?.compensationAutomation.length ?? 0,
    },
    {
      key: 'compensation',
      label: locale === 'zh' ? '补偿队列' : 'Compensation',
      count: queues?.compensation.length ?? 0,
    },
    {
      key: 'incidents',
      label: locale === 'zh' ? 'Incident 队列' : 'Incidents',
      count: queues?.incidents.length ?? 0,
    },
    {
      key: 'activeRouting',
      label: locale === 'zh' ? '活跃路由' : 'Active Routing',
      count: queues?.activeRouting.length ?? 0,
    },
  ];
}

export function filterExecutionEntriesByQueueFocus(
  entries: ExecutionLedgerEntry[],
  focus: ExecutionQueueFocusKey,
  operations: ExecutionWorkbenchResponse['operations'] | null | undefined
): ExecutionLedgerEntry[] {
  if (focus === 'all' || !operations) return entries;
  const queueEntries = operations.queues[focus] || [];
  const queueIds = new Set(queueEntries.map((entry) => entry.plan.id));
  return entries.filter((entry) => queueIds.has(entry.plan.id));
}

export function mapExecutionNextActionToFocus(
  key: ExecutionWorkbenchResponse['operations']['nextActions'][number]['key']
): ExecutionQueueFocusKey {
  if (key === 'clear-approvals') return 'approvals';
  if (key === 'retry-rejected-orders') return 'retryEligible';
  if (key === 'run-compensation-automation') return 'compensationAutomation';
  if (key === 'reconcile-drift') return 'compensation';
  if (key === 'triage-execution-incidents') return 'incidents';
  return 'activeRouting';
}

export function collectExecutionIncidentIds(
  entries: ExecutionLedgerEntry[],
  planIds: string[]
): string[] {
  const targetPlanIds = new Set(planIds);
  const incidentIds = new Set<string>();
  entries.forEach((entry) => {
    if (!targetPlanIds.has(entry.plan.id)) return;
    (entry.linkedIncidents || []).forEach((incident) => {
      if (incident.status !== 'resolved') {
        incidentIds.add(incident.id);
      }
    });
  });
  return [...incidentIds];
}
