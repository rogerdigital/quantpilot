export function ExecutionEvidencePanel({
  evidence,
  locale,
}: {
  evidence: {
    strategyVersion?: string;
    promotionRequestId?: string;
    riskAssessmentId?: string;
    brokerAccountId?: string;
    approvalState?: string;
    riskStatus?: string;
    reconciliationStatus?: string;
  } | null;
  locale: 'zh' | 'en';
}) {
  const labels = {
    zh: {
      title: '执行证据链',
      empty: '暂无证据链数据',
      strategyVersion: '策略版本',
      promotionRequest: '升级申请',
      riskAssessment: '风控评估',
      brokerAccount: '券商账户',
      approval: '审批状态',
      risk: '风控状态',
      reconciliation: '对账状态',
    },
    en: {
      title: 'Execution Evidence Chain',
      empty: 'No evidence chain data',
      strategyVersion: 'Strategy Version',
      promotionRequest: 'Promotion Request',
      riskAssessment: 'Risk Assessment',
      brokerAccount: 'Broker Account',
      approval: 'Approval State',
      risk: 'Risk Status',
      reconciliation: 'Reconciliation',
    },
  }[locale];

  if (!evidence) {
    return (
      <section className="execution-evidence-panel">
        <h3>{labels.title}</h3>
        <p className="empty-state">{labels.empty}</p>
      </section>
    );
  }

  return (
    <section className="execution-evidence-panel">
      <h3>{labels.title}</h3>
      <div className="evidence-chain">
        <div className="evidence-field">
          <span className="field-label">{labels.strategyVersion}</span>
          <span className="field-value">{evidence.strategyVersion || '--'}</span>
        </div>
        <div className="evidence-field">
          <span className="field-label">{labels.promotionRequest}</span>
          <span className="field-value">{evidence.promotionRequestId || '--'}</span>
        </div>
        <div className="evidence-field">
          <span className="field-label">{labels.riskAssessment}</span>
          <span className="field-value">{evidence.riskAssessmentId || '--'}</span>
        </div>
        <div className="evidence-field">
          <span className="field-label">{labels.brokerAccount}</span>
          <span className="field-value">{evidence.brokerAccountId || '--'}</span>
        </div>
        <div className="evidence-field">
          <span className="field-label">{labels.approval}</span>
          <span className="field-value">{evidence.approvalState || '--'}</span>
        </div>
        <div className="evidence-field">
          <span className="field-label">{labels.risk}</span>
          <span className="field-value">{evidence.riskStatus || '--'}</span>
        </div>
        <div className="evidence-field">
          <span className="field-label">{labels.reconciliation}</span>
          <span className="field-value">{evidence.reconciliationStatus || '--'}</span>
        </div>
      </div>
    </section>
  );
}
