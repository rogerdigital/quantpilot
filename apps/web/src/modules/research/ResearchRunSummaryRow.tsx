import type { BacktestRunItem } from '@shared-types/trading.ts';
import { InspectionMetricsRow } from '../../pages/console/components/InspectionPanels.tsx';

export function ResearchRunSummaryRow(props: {
  locale: 'zh' | 'en';
  run: BacktestRunItem;
}) {
  const { locale, run } = props;
  const hasPerformance = run.status === 'completed' || run.status === 'needs_review';

  return (
    <InspectionMetricsRow
      leadTitle={run.windowLabel}
      leadCopy={run.summary}
      metrics={[
        { label: locale === 'zh' ? '状态' : 'Status', value: run.status },
        { label: locale === 'zh' ? '收益' : 'Return', value: hasPerformance ? `${run.annualizedReturnPct.toFixed(1)}%` : '--' },
        { label: 'Sharpe', value: hasPerformance ? run.sharpe.toFixed(2) : '--' },
        { label: locale === 'zh' ? '工作流' : 'Workflow', value: run.workflowRunId || '--' },
      ]}
    />
  );
}
