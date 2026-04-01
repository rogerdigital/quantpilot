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

type InspectionMetricItem = {
  label: string;
  value: ReactNode;
};

type InspectionMetricsRowProps = {
  leadTitle?: ReactNode;
  leadCopy?: ReactNode;
  metrics: InspectionMetricItem[];
};

type InspectionSelectableRowProps = {
  leadTitle?: ReactNode;
  leadCopy?: ReactNode;
  metrics: InspectionMetricItem[];
  actions?: ReactNode;
};

export function InspectionMetricsRow({ leadTitle, leadCopy, metrics }: InspectionMetricsRowProps) {
  return (
    <div className="focus-row">
      {leadTitle || leadCopy ? (
        <div className="symbol-cell">
          {leadTitle ? <strong>{leadTitle}</strong> : null}
          {leadCopy ? <span>{leadCopy}</span> : null}
        </div>
      ) : null}
      {metrics.map((metric) => (
        <div className="focus-metric" key={metric.label}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function InspectionSelectableRow({ leadTitle, leadCopy, metrics, actions }: InspectionSelectableRowProps) {
  return (
    <div className="focus-row">
      {leadTitle || leadCopy ? (
        <div className="symbol-cell">
          {leadTitle ? <strong>{leadTitle}</strong> : null}
          {leadCopy ? <span>{leadCopy}</span> : null}
        </div>
      ) : null}
      {metrics.map((metric) => (
        <div className="focus-metric" key={metric.label}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
        </div>
      ))}
      {actions ? (
        <div className="focus-metric">
          <span>Actions</span>
          <div className="inspection-actions">{actions}</div>
        </div>
      ) : null}
    </div>
  );
}

type InspectionNoticeProps = {
  children: ReactNode;
};

export function InspectionEmpty({ children }: InspectionNoticeProps) {
  return <div className="empty-cell">{children}</div>;
}

export function InspectionStatus({ children }: InspectionNoticeProps) {
  return <div className="status-copy">{children}</div>;
}
