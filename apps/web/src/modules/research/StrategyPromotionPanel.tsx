import type { PromotionRequest } from '@shared-types/lifecycle.ts';

export function StrategyPromotionPanel({
  promotion,
  locale,
}: {
  promotion: PromotionRequest | null;
  locale: 'zh' | 'en';
}) {
  const labels = {
    zh: {
      title: '策略晋级状态',
      empty: '无晋级请求',
      status: '当前状态',
      requestedBy: '申请人',
      createdAt: '创建时间',
      decisions: '决策记录',
      noDecisions: '暂无决策',
      actor: '决策人',
      action: '操作',
      reason: '原因',
    },
    en: {
      title: 'Strategy Promotion Status',
      empty: 'No promotion request',
      status: 'Current Status',
      requestedBy: 'Requested By',
      createdAt: 'Created At',
      decisions: 'Decisions',
      noDecisions: 'No decisions yet',
      actor: 'Actor',
      action: 'Action',
      reason: 'Reason',
    },
  }[locale];

  if (!promotion) {
    return (
      <section className="strategy-promotion-panel">
        <h3>{labels.title}</h3>
        <p className="empty-state">{labels.empty}</p>
      </section>
    );
  }

  return (
    <section className="strategy-promotion-panel">
      <h3>{labels.title}</h3>
      <div className="promotion-summary">
        <div className="promotion-field">
          <span className="field-label">{labels.status}</span>
          <span className="field-value" data-status={promotion.status}>
            {promotion.status.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="promotion-field">
          <span className="field-label">{labels.requestedBy}</span>
          <span className="field-value">{promotion.requestedBy}</span>
        </div>
        <div className="promotion-field">
          <span className="field-label">{labels.createdAt}</span>
          <span className="field-value">{promotion.createdAt}</span>
        </div>
      </div>
      <h4>{labels.decisions}</h4>
      {promotion.decisions.length === 0 ? (
        <p className="empty-state">{labels.noDecisions}</p>
      ) : (
        <table className="decisions-table">
          <thead>
            <tr>
              <th>{labels.actor}</th>
              <th>{labels.action}</th>
              <th>{labels.reason}</th>
            </tr>
          </thead>
          <tbody>
            {promotion.decisions.map((d) => (
              <tr key={d.id}>
                <td>{d.actor}</td>
                <td>{d.action.replace(/_/g, ' ')}</td>
                <td>{d.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
