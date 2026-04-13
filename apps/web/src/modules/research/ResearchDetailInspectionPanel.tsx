import type { ReactNode } from 'react';
import {
  InspectionEmpty,
  InspectionPanel,
} from '../../pages/console/components/InspectionPanels.tsx';
import { ResearchStatusStack } from './ResearchStatusStack.tsx';

type StatusMetric = {
  label: string;
  value: ReactNode;
};

export function ResearchDetailInspectionPanel(props: {
  title: string;
  copy: string;
  badge: ReactNode;
  badgeClassName?: string;
  emptyMessage?: string | null;
  metrics: StatusMetric[];
  messages?: ReactNode[];
  children?: ReactNode;
}) {
  return (
    <InspectionPanel
      title={props.title}
      copy={props.copy}
      badge={props.badge}
      badgeClassName={props.badgeClassName}
    >
      {props.emptyMessage ? (
        <InspectionEmpty>{props.emptyMessage}</InspectionEmpty>
      ) : (
        <ResearchStatusStack metrics={props.metrics} messages={props.messages}>
          {props.children}
        </ResearchStatusStack>
      )}
    </InspectionPanel>
  );
}
