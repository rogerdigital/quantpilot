import type { ReactNode } from 'react';
import { InspectionEmpty, InspectionListPanel } from '../../pages/console/components/InspectionPanels.tsx';

export function ResearchCollectionPanel(props: {
  title: string;
  copy: string;
  badge: ReactNode;
  badgeClassName?: string;
  terminal?: boolean;
  hasSelection?: boolean;
  selectionEmptyMessage?: string | null;
  loading?: boolean;
  loadingMessage?: string | null;
  isEmpty?: boolean;
  emptyMessage?: string | null;
  children?: ReactNode;
}) {
  const showSelectionEmpty = props.hasSelection === false && props.selectionEmptyMessage;
  const showLoading = !showSelectionEmpty && props.loading && props.loadingMessage;
  const showEmpty = !showSelectionEmpty && !showLoading && props.isEmpty && props.emptyMessage;

  return (
    <InspectionListPanel
      title={props.title}
      copy={props.copy}
      badge={props.badge}
      badgeClassName={props.badgeClassName}
      terminal={props.terminal}
    >
      {showSelectionEmpty ? <InspectionEmpty>{props.selectionEmptyMessage}</InspectionEmpty> : null}
      {showLoading ? <InspectionEmpty>{props.loadingMessage}</InspectionEmpty> : null}
      {showEmpty ? <InspectionEmpty>{props.emptyMessage}</InspectionEmpty> : null}
      {!showSelectionEmpty && !showLoading ? props.children : null}
    </InspectionListPanel>
  );
}
