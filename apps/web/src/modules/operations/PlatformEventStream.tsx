import type { PlatformEvent } from '@shared-types/platform-events.ts';

type Props = {
  events: PlatformEvent[];
  maxVisible?: number;
};

const SEVERITY_COLORS: Record<string, string> = {
  info: 'var(--text-muted)',
  warning: 'var(--accent-amber, #f59e0b)',
  critical: 'var(--accent-red, #ef4444)',
};

export function PlatformEventStream({ events, maxVisible = 20 }: Props) {
  const visible = events.slice(0, maxVisible);

  if (visible.length === 0) {
    return <div data-testid="event-stream-empty">No platform events recorded.</div>;
  }

  return (
    <div data-testid="event-stream">
      <h3>Platform Events</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {visible.map((event) => (
          <li
            key={event.id}
            data-testid={`event-${event.type}`}
            style={{
              borderLeft: `3px solid ${SEVERITY_COLORS[event.severity] || '#888'}`,
              padding: '4px 8px',
              marginBottom: '4px',
            }}
          >
            <span style={{ fontWeight: 600 }}>{event.type}</span>
            <span style={{ marginLeft: 8, opacity: 0.7 }}>{event.source}</span>
            <span style={{ marginLeft: 8, fontSize: '0.85em', opacity: 0.5 }}>
              {event.timestamp}
            </span>
          </li>
        ))}
      </ul>
      {events.length > maxVisible && (
        <div data-testid="event-stream-overflow">+{events.length - maxVisible} more events</div>
      )}
    </div>
  );
}
