import type { ReactNode } from 'react';
import { InspectionSelectableRow } from '../../pages/console/components/InspectionPanels.tsx';

type TimelineMetric = {
  label: string;
  value: ReactNode;
};

export function ResearchTimelineEventRow(props: {
  locale: 'zh' | 'en';
  id: string;
  title: string;
  detail: string;
  selectedId: string;
  metrics: TimelineMetric[];
  onInspect: (id: string) => void;
}) {
  const { locale, id, title, detail, selectedId, metrics, onInspect } = props;
  const selected = selectedId === id;

  return (
    <InspectionSelectableRow
      leadTitle={title}
      leadCopy={detail}
      metrics={metrics}
      actions={(
        <button
          type="button"
          className="inline-action"
          disabled={selected}
          onClick={() => onInspect(id)}
        >
          {selected
            ? (locale === 'zh' ? '已选中' : 'Selected')
            : (locale === 'zh' ? '查看' : 'Inspect')}
        </button>
      )}
    />
  );
}
