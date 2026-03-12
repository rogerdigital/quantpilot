import type { StrategyCatalogItem } from '@shared-types/trading.ts';
import { InspectionSelectableRow } from '../../pages/console/components/InspectionPanels.tsx';

export function StrategyCatalogRow(props: {
  locale: 'zh' | 'en';
  item: StrategyCatalogItem;
  nextStage?: string | null;
  canWriteStrategy: boolean;
  saving: boolean;
  promotingId: string;
  selectedStrategyId: string;
  onEdit: (item: StrategyCatalogItem) => void;
  onPromote: (item: StrategyCatalogItem) => void;
  onArchiveToggle: (item: StrategyCatalogItem) => void;
  onInspect: (strategyId: string) => void;
}) {
  const { locale, item, nextStage, canWriteStrategy, saving, promotingId, selectedStrategyId } = props;
  const isBusy = saving || promotingId === item.id;
  const isSelected = selectedStrategyId === item.id;

  return (
    <InspectionSelectableRow
      leadTitle={item.name}
      leadCopy={item.summary}
      metrics={[
        { label: locale === 'zh' ? '阶段' : 'Stage', value: item.status },
        { label: 'Sharpe', value: item.sharpe.toFixed(2) },
        { label: locale === 'zh' ? '预期收益' : 'Expected return', value: `${item.expectedReturnPct.toFixed(1)}%` },
      ]}
      actions={(
        <div className="action-group">
          <button
            type="button"
            className="inline-action"
            disabled={!canWriteStrategy || isBusy}
            onClick={() => props.onEdit(item)}
          >
            {locale === 'zh' ? '编辑' : 'Edit'}
          </button>
          {nextStage ? (
            <button
              type="button"
              className="inline-action inline-action-approve"
              disabled={!canWriteStrategy || isBusy}
              onClick={() => props.onPromote(item)}
            >
              {promotingId === item.id
                ? (locale === 'zh' ? '晋级中...' : 'Promoting...')
                : (locale === 'zh' ? `晋级到 ${nextStage}` : `Promote to ${nextStage}`)}
            </button>
          ) : null}
          <button
            type="button"
            className={item.status === 'archived' ? 'inline-action inline-action-approve' : 'inline-action'}
            disabled={!canWriteStrategy || isBusy}
            onClick={() => props.onArchiveToggle(item)}
          >
            {promotingId === item.id
              ? (item.status === 'archived'
                  ? (locale === 'zh' ? '恢复中...' : 'Restoring...')
                  : (locale === 'zh' ? '归档中...' : 'Archiving...'))
              : (item.status === 'archived'
                  ? (locale === 'zh' ? '恢复到 draft' : 'Restore to draft')
                  : (locale === 'zh' ? '归档' : 'Archive'))}
          </button>
          <button
            type="button"
            className="inline-action"
            disabled={isSelected}
            onClick={() => props.onInspect(item.id)}
          >
            {isSelected
              ? (locale === 'zh' ? '已选中' : 'Selected')
              : (locale === 'zh' ? '查看' : 'Inspect')}
          </button>
        </div>
      )}
    />
  );
}
