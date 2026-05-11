export function ExecutionRecoveryPanel({
  recoveryPlan,
  locale,
}: {
  recoveryPlan: {
    orderId: string;
    cases: string[];
    actions: Array<{ case: string; action: string; detail: string; timestamp: string }>;
    resolved: boolean;
    escalated: boolean;
  } | null;
  locale: 'zh' | 'en';
}) {
  const labels = {
    zh: {
      title: '执行恢复控制台',
      empty: '当前没有需要恢复的执行',
      order: '订单',
      cases: '问题诊断',
      actions: '恢复动作',
      status: '状态',
      resolved: '已恢复',
      escalated: '已升级',
      pending: '待处理',
    },
    en: {
      title: 'Execution Recovery Console',
      empty: 'No executions require recovery',
      order: 'Order',
      cases: 'Diagnosed Cases',
      actions: 'Recovery Actions',
      status: 'Status',
      resolved: 'Resolved',
      escalated: 'Escalated',
      pending: 'Pending',
    },
  }[locale];

  if (!recoveryPlan) {
    return (
      <section className="execution-recovery-panel">
        <h3>{labels.title}</h3>
        <p className="empty-state">{labels.empty}</p>
      </section>
    );
  }

  const statusLabel = recoveryPlan.resolved
    ? labels.resolved
    : recoveryPlan.escalated
      ? labels.escalated
      : labels.pending;

  return (
    <section className="execution-recovery-panel">
      <h3>{labels.title}</h3>
      <div className="recovery-header">
        <span className="recovery-order">
          {labels.order}: {recoveryPlan.orderId}
        </span>
        <span
          className={`recovery-status recovery-${recoveryPlan.resolved ? 'resolved' : recoveryPlan.escalated ? 'escalated' : 'pending'}`}
        >
          {statusLabel}
        </span>
      </div>
      <div className="recovery-cases">
        <h4>{labels.cases}</h4>
        <ul>
          {recoveryPlan.cases.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
      <div className="recovery-actions">
        <h4>{labels.actions}</h4>
        <table className="recovery-actions-table">
          <thead>
            <tr>
              <th>{labels.cases}</th>
              <th>{labels.actions}</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {recoveryPlan.actions.map((a, i) => (
              <tr key={i}>
                <td>{a.case}</td>
                <td>{a.action}</td>
                <td>{a.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
