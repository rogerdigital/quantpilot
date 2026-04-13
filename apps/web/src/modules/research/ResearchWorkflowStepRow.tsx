import type { WorkflowStepRecord } from '@shared-types/trading.ts';
import { InspectionSelectableRow } from '../../pages/console/components/InspectionPanels.tsx';

export function ResearchWorkflowStepRow(props: {
  locale: 'zh' | 'en';
  step: WorkflowStepRecord;
  selectedStepKey: string;
  onInspect: (stepKey: string) => void;
}) {
  const { locale, step, selectedStepKey, onInspect } = props;
  const selected = selectedStepKey === step.key;

  return (
    <InspectionSelectableRow
      metrics={[
        { label: locale === 'zh' ? '步骤' : 'Step', value: step.key },
        { label: locale === 'zh' ? '状态' : 'Status', value: step.status },
      ]}
      actions={
        <button
          type="button"
          className="inline-action"
          disabled={selected}
          onClick={() => onInspect(step.key)}
        >
          {selected
            ? locale === 'zh'
              ? '已选中'
              : 'Selected'
            : locale === 'zh'
              ? '查看'
              : 'Inspect'}
        </button>
      }
    />
  );
}
