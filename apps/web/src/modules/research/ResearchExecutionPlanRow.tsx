import type { ExecutionLedgerEntry } from '@shared-types/trading.ts';
import { InspectionMetricsRow, InspectionSelectableRow } from '../../pages/console/components/InspectionPanels.tsx';

export function ResearchExecutionPlanRow(props: {
  locale: 'zh' | 'en';
  entry: ExecutionLedgerEntry;
  actionLabel?: string;
  onAction?: (planId: string) => void;
}) {
  const { locale, entry, actionLabel, onAction } = props;
  const metrics = [
    { label: locale === 'zh' ? '计划状态' : 'Plan status', value: entry.plan.status },
    { label: locale === 'zh' ? '风控' : 'Risk', value: entry.plan.riskStatus },
    { label: locale === 'zh' ? 'Workflow' : 'Workflow', value: entry.workflow?.status || '--' },
    {
      label: locale === 'zh' ? '运行时' : 'Runtime',
      value: entry.latestRuntime
        ? `${entry.latestRuntime.submittedOrderCount}/${entry.latestRuntime.openOrderCount}`
        : '--',
    },
  ];
  const leadCopy = entry.latestRuntime?.message || `${entry.plan.orderCount} ${locale === 'zh' ? '笔订单候选' : 'candidate orders'}`;

  if (onAction) {
    return (
      <InspectionSelectableRow
        leadTitle={entry.plan.summary}
        leadCopy={leadCopy}
        metrics={metrics}
        actions={(
          <button
            type="button"
            className="inline-action"
            onClick={() => onAction(entry.plan.id)}
          >
            {actionLabel || (locale === 'zh' ? '打开执行详情' : 'Open Execution Detail')}
          </button>
        )}
      />
    );
  }

  return (
    <InspectionMetricsRow
      leadTitle={entry.plan.summary}
      leadCopy={leadCopy}
      metrics={metrics}
    />
  );
}
