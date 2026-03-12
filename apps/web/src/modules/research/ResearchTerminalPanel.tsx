import type { ReactNode } from 'react';

export function ResearchTerminalPanel(props: {
  title: string;
  copy: string;
  badge: ReactNode;
  badgeClassName?: string;
  loading?: boolean;
  loadingMessage?: string | null;
  isEmpty?: boolean;
  emptyMessage?: string | null;
  footer?: ReactNode;
  children?: ReactNode;
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
      <div className="focus-list focus-list-terminal">
        {props.loading && props.loadingMessage ? <div className="empty-cell">{props.loadingMessage}</div> : null}
        {!props.loading && props.isEmpty && props.emptyMessage ? <div className="empty-cell">{props.emptyMessage}</div> : null}
        {!props.loading ? props.children : null}
      </div>
      {props.footer}
    </article>
  );
}
