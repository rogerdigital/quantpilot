import type { ReactNode } from 'react';
import { InspectionMetricsRow } from '../../pages/console/components/InspectionPanels.tsx';

type SnapshotMetric = {
  label: string;
  value: ReactNode;
};

export function ResearchVersionSnapshotRow(props: {
  leadTitle: ReactNode;
  leadCopy?: ReactNode;
  metrics: SnapshotMetric[];
}) {
  return (
    <InspectionMetricsRow
      leadTitle={props.leadTitle}
      leadCopy={props.leadCopy}
      metrics={props.metrics}
    />
  );
}
