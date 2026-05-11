export function RiskPolicyEditor({
  policies,
  locale,
}: {
  policies: {
    id: string;
    name: string;
    rules: { dimension: string; limit: unknown; severity: string }[];
    isActive: boolean;
  }[];
  locale: 'zh' | 'en';
}) {
  const labels = {
    zh: {
      title: '风险策略编辑器',
      empty: '暂无风险策略',
      dimension: '维度',
      limit: '限制',
      severity: '级别',
      active: '生效中',
    },
    en: {
      title: 'Risk Policy Editor',
      empty: 'No risk policies',
      dimension: 'Dimension',
      limit: 'Limit',
      severity: 'Severity',
      active: 'Active',
    },
  }[locale];

  if (!policies || policies.length === 0) {
    return (
      <section className="risk-policy-editor">
        <h3>{labels.title}</h3>
        <p className="empty-state">{labels.empty}</p>
      </section>
    );
  }

  return (
    <section className="risk-policy-editor">
      <h3>{labels.title}</h3>
      {policies.map((p) => (
        <div key={p.id} className="policy-card" data-active={p.isActive}>
          <h4>
            {p.name} {p.isActive ? `(${labels.active})` : ''}
          </h4>
          <table className="policy-rules-table">
            <thead>
              <tr>
                <th>{labels.dimension}</th>
                <th>{labels.limit}</th>
                <th>{labels.severity}</th>
              </tr>
            </thead>
            <tbody>
              {p.rules.map((r, i) => (
                <tr key={i}>
                  <td>{r.dimension}</td>
                  <td>{Array.isArray(r.limit) ? r.limit.join(', ') : String(r.limit)}</td>
                  <td className={`severity-${r.severity}`}>{r.severity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}
