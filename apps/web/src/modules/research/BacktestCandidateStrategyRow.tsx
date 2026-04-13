import type { StrategyCatalogItem } from '@shared-types/trading.ts';
import { InspectionMetricsRow } from '../../pages/console/components/InspectionPanels.tsx';

export function BacktestCandidateStrategyRow(props: {
  locale: 'zh' | 'en';
  item: StrategyCatalogItem;
  canQueueBacktest: boolean;
  submittingStrategyId: string;
  formatPercent: (value: number) => string;
  onQueue: (strategyId: string) => void;
}) {
  const { locale, item, canQueueBacktest, submittingStrategyId } = props;

  return (
    <InspectionMetricsRow
      leadTitle={item.name}
      leadCopy={item.summary}
      metrics={[
        { label: locale === 'zh' ? '阶段' : 'Stage', value: item.status },
        { label: 'Sharpe', value: item.sharpe.toFixed(2) },
        {
          label: locale === 'zh' ? '回撤' : 'Drawdown',
          value: props.formatPercent(item.maxDrawdownPct),
        },
        {
          label: locale === 'zh' ? '动作' : 'Action',
          value: (
            <button
              type="button"
              className="inline-action inline-action-approve"
              disabled={!canQueueBacktest || submittingStrategyId === item.id}
              onClick={() => props.onQueue(item.id)}
            >
              {submittingStrategyId === item.id
                ? locale === 'zh'
                  ? '提交中...'
                  : 'Queueing...'
                : locale === 'zh'
                  ? '发起回测'
                  : 'Queue Backtest'}
            </button>
          ),
        },
      ]}
    />
  );
}
