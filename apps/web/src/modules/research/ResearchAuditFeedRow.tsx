import type { ReactNode } from 'react';
import { InspectionSelectableRow } from '../../pages/console/components/InspectionPanels.tsx';
import type { AuditFeedItem } from '../audit/useAuditFeed.ts';

type AuditMetric = {
  label: string;
  value: ReactNode;
};

export function ResearchAuditFeedRow(props: {
  locale: 'zh' | 'en';
  item: AuditFeedItem;
  metrics?: AuditMetric[];
  selected?: boolean;
  formatDateTime: (value: string, locale: 'zh' | 'en') => string;
  onInspect?: (auditId: string) => void;
}) {
  const { locale, item, metrics = [], selected = false, formatDateTime, onInspect } = props;

  return (
    <InspectionSelectableRow
      leadTitle={item.title}
      leadCopy={item.detail}
      metrics={[
        ...metrics,
        { label: locale === 'zh' ? '操作人' : 'Actor', value: item.actor },
        { label: locale === 'zh' ? '时间' : 'Time', value: formatDateTime(item.createdAt, locale) },
      ]}
      actions={
        onInspect ? (
          <button
            type="button"
            className="inline-action"
            disabled={selected}
            onClick={() => onInspect(item.id)}
          >
            {selected
              ? locale === 'zh'
                ? '已选中'
                : 'Selected'
              : locale === 'zh'
                ? '查看'
                : 'Inspect'}
          </button>
        ) : null
      }
    />
  );
}
