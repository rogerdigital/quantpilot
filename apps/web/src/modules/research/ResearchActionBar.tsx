import type { ReactNode } from 'react';

export function ResearchActionBar(props: { children: ReactNode }) {
  return <div className="settings-actions">{props.children}</div>;
}

export function ResearchActionButton(props: {
  label: string;
  onClick: () => void;
  priority?: 'default' | 'primary';
}) {
  return (
    <button
      type="button"
      className={
        props.priority === 'primary' ? 'inline-action inline-action-approve' : 'inline-action'
      }
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}
