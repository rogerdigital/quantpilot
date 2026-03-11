import type { ReactNode } from 'react';

type InspectionPanelProps = {
  title: string;
  copy: string;
  badge: ReactNode;
  children: ReactNode;
  badgeClassName?: string;
};

type InspectionListPanelProps = InspectionPanelProps & {
  terminal?: boolean;
};

export function InspectionPanel({ title, copy, badge, children, badgeClassName = 'badge-info' }: InspectionPanelProps) {
  return (
    <article className="panel">
      <div className="panel-head">
        <div>
          <div className="panel-title">{title}</div>
          <div className="panel-copy">{copy}</div>
        </div>
        <div className={`panel-badge ${badgeClassName}`}>{badge}</div>
      </div>
      {children}
    </article>
  );
}

export function InspectionListPanel({ title, copy, badge, terminal = false, children, badgeClassName }: InspectionListPanelProps) {
  return (
    <InspectionPanel title={title} copy={copy} badge={badge} badgeClassName={badgeClassName}>
      <div className={terminal ? 'focus-list focus-list-terminal' : 'focus-list'}>
        {children}
      </div>
    </InspectionPanel>
  );
}
