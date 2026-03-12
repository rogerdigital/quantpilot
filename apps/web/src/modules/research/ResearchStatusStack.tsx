import type { ReactNode } from 'react';

type StatusMetric = {
  label: string;
  value: ReactNode;
};

export function ResearchStatusStack(props: {
  metrics: StatusMetric[];
  messages?: ReactNode[];
  children?: ReactNode;
}) {
  const messages = props.messages?.filter(Boolean) || [];

  return (
    <div className="status-stack">
      {props.metrics.map((metric) => (
        <div key={metric.label} className="status-row">
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
        </div>
      ))}
      {messages.map((message, index) => (
        <div key={index} className="status-copy">{message}</div>
      ))}
      {props.children}
    </div>
  );
}
