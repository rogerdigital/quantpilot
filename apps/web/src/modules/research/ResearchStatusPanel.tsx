import type { ReactNode } from 'react';
import { ResearchStatusStack } from './ResearchStatusStack.tsx';

type StatusMetric = {
  label: string;
  value: ReactNode;
};

export function ResearchStatusPanel(props: {
  title: string;
  copy: string;
  badge: ReactNode;
  badgeClassName?: string;
  metrics: StatusMetric[];
  messages?: ReactNode[];
}) {
  return (
    <article className="panel">
      <div className="panel-head">
        <div>
          <div className="panel-title">{props.title}</div>
          <div className="panel-copy">{props.copy}</div>
        </div>
        <div className={props.badgeClassName || 'panel-badge badge-muted'}>{props.badge}</div>
      </div>
      <ResearchStatusStack metrics={props.metrics} messages={props.messages} />
    </article>
  );
}
