export function RiskAssessmentPanel({
  assessments,
  locale,
}: {
  assessments: {
    entityId: string;
    entityType: string;
    passed: boolean;
    overallSeverity: string;
    findings: { dimension: string; message: string; severity: string }[];
  }[];
  locale: 'zh' | 'en';
}) {
  const labels = {
    zh: {
      title: '风险评估',
      empty: '暂无评估记录',
      entity: '对象',
      result: '结果',
      findings: '发现',
      passed: '通过',
      blocked: '阻止',
    },
    en: {
      title: 'Risk Assessments',
      empty: 'No assessments',
      entity: 'Entity',
      result: 'Result',
      findings: 'Findings',
      passed: 'Passed',
      blocked: 'Blocked',
    },
  }[locale];

  if (!assessments || assessments.length === 0) {
    return (
      <section className="risk-assessment-panel">
        <h3>{labels.title}</h3>
        <p className="empty-state">{labels.empty}</p>
      </section>
    );
  }

  return (
    <section className="risk-assessment-panel">
      <h3>{labels.title}</h3>
      {assessments.map((a) => (
        <div key={a.entityId} className="assessment-card" data-severity={a.overallSeverity}>
          <div className="assessment-header">
            <span className="assessment-entity">
              {a.entityType}:{a.entityId}
            </span>
            <span className={`assessment-badge assessment-${a.passed ? 'pass' : 'block'}`}>
              {a.passed ? labels.passed : labels.blocked}
            </span>
          </div>
          {a.findings.length > 0 ? (
            <ul className="assessment-findings">
              {a.findings.map((f, i) => (
                <li key={i} className={`finding-${f.severity}`}>
                  {f.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </section>
  );
}
