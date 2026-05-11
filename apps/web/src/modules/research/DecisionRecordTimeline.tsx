import type { DecisionRecord } from '@shared-types/lifecycle.ts';

export function DecisionRecordTimeline({
  records,
  locale,
}: {
  records: DecisionRecord[];
  locale: 'zh' | 'en';
}) {
  const labels = {
    zh: {
      title: '决策时间线',
      empty: '暂无决策记录',
      actor: '决策人',
      action: '操作',
      reason: '原因',
      entity: '对象',
    },
    en: {
      title: 'Decision Timeline',
      empty: 'No decision records',
      actor: 'Actor',
      action: 'Action',
      reason: 'Reason',
      entity: 'Entity',
    },
  }[locale];

  if (!records || records.length === 0) {
    return (
      <section className="decision-record-timeline">
        <h3>{labels.title}</h3>
        <p className="empty-state">{labels.empty}</p>
      </section>
    );
  }

  return (
    <section className="decision-record-timeline">
      <h3>{labels.title}</h3>
      <ol className="timeline-list">
        {records.map((r) => (
          <li key={r.id} className="timeline-entry" data-action={r.action}>
            <time className="timeline-time">{r.timestamp}</time>
            <div className="timeline-content">
              <span className="timeline-actor">
                {r.actor} ({r.role})
              </span>
              <span className="timeline-action">{r.action}</span>
              <span className="timeline-entity">
                {r.entityType}:{r.entityId}
              </span>
              <span className="timeline-reason">{r.reason}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
