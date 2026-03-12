import type { BacktestRunItem } from '@shared-types/trading.ts';
import { InspectionSelectableRow } from '../../pages/console/components/InspectionPanels.tsx';

export function BacktestRunQueueRow(props: {
  locale: 'zh' | 'en';
  run: BacktestRunItem;
  selectedRunId: string;
  canReviewBacktest: boolean;
  reviewingRunId: string;
  formatDateTime: (value?: string, locale?: 'zh' | 'en') => string;
  formatPercent: (value: number) => string;
  onReview: (runId: string) => void;
  onInspect: (runId: string) => void;
}) {
  const { locale, run, selectedRunId, canReviewBacktest, reviewingRunId } = props;

  return (
    <InspectionSelectableRow
      leadTitle={run.strategyName}
      leadCopy={`${run.windowLabel} · ${run.summary}`}
      metrics={[
        { label: locale === 'zh' ? '状态' : 'Status', value: run.status },
        {
          label: locale === 'zh' ? '收益' : 'Return',
          value: run.status === 'completed' || run.status === 'needs_review' ? props.formatPercent(run.annualizedReturnPct) : '--',
        },
        {
          label: locale === 'zh' ? '更新时间' : 'Updated',
          value: props.formatDateTime(run.completedAt || run.startedAt, locale),
        },
        {
          label: locale === 'zh' ? '复核' : 'Review',
          value: run.status === 'needs_review'
            ? (
              <button
                type="button"
                className="inline-action"
                disabled={!canReviewBacktest || reviewingRunId === run.id}
                onClick={() => props.onReview(run.id)}
              >
                {reviewingRunId === run.id
                  ? (locale === 'zh' ? '处理中...' : 'Reviewing...')
                  : (locale === 'zh' ? '人工复核' : 'Approve Review')}
              </button>
            )
            : (locale === 'zh' ? '无' : 'None'),
        },
      ]}
      actions={(
        <button
          type="button"
          className="inline-action"
          disabled={selectedRunId === run.id}
          onClick={() => props.onInspect(run.id)}
        >
          {selectedRunId === run.id
            ? (locale === 'zh' ? '已选中' : 'Selected')
            : (locale === 'zh' ? '查看' : 'Inspect')}
        </button>
      )}
    />
  );
}
