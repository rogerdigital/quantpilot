import type { ReactNode } from 'react';
import { InspectionStatus } from '../../pages/console/components/InspectionPanels.tsx';
import { ResearchDetailInspectionPanel } from './ResearchDetailInspectionPanel.tsx';

type StatusMetric = {
  label: string;
  value: ReactNode;
};

export function ResearchEventInspectionPanel(props: {
  title: string;
  copy: string;
  badge: ReactNode;
  badgeClassName?: string;
  emptyMessage?: string | null;
  metrics: StatusMetric[];
  detail?: ReactNode;
  guidance?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <ResearchDetailInspectionPanel
      title={props.title}
      copy={props.copy}
      badge={props.badge}
      badgeClassName={props.badgeClassName}
      emptyMessage={props.emptyMessage}
      metrics={props.metrics}
    >
      {props.detail ? <InspectionStatus>{props.detail}</InspectionStatus> : null}
      {props.guidance ? <InspectionStatus>{props.guidance}</InspectionStatus> : null}
      {props.actions}
      {props.children}
    </ResearchDetailInspectionPanel>
  );
}
