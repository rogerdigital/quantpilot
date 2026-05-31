import type { PromotionGate } from '@shared-types/trading.ts';

export function PromotionGateChecklist({
  gates,
  locale,
}: {
  gates: PromotionGate[];
  locale: 'zh' | 'en';
}) {
  const labels = {
    zh: {
      title: '晋级门控清单',
      empty: '无门控数据',
      gate: '门控',
      status: '状态',
      evaluatedBy: '评估方',
      reason: '说明',
    },
    en: {
      title: 'Promotion Gate Checklist',
      empty: 'No gate data',
      gate: 'Gate',
      status: 'Status',
      evaluatedBy: 'Evaluated By',
      reason: 'Reason',
    },
  }[locale];

  if (!gates || gates.length === 0) {
    return (
      <section className="promotion-gate-checklist">
        <h3>{labels.title}</h3>
        <p className="empty-state">{labels.empty}</p>
      </section>
    );
  }

  return (
    <section className="promotion-gate-checklist">
      <h3>{labels.title}</h3>
      <table className="gate-table">
        <thead>
          <tr>
            <th>{labels.gate}</th>
            <th>{labels.status}</th>
            <th>{labels.evaluatedBy}</th>
            <th>{labels.reason}</th>
          </tr>
        </thead>
        <tbody>
          {gates.map((g) => (
            <tr key={g.key} data-gate-status={g.status}>
              <td>{g.label}</td>
              <td className={`gate-status gate-status-${g.status}`}>{g.status}</td>
              <td>{g.evaluatedBy}</td>
              <td>{g.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
