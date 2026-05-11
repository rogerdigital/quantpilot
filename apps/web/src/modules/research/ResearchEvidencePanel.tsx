import type { ResearchIdea } from '@shared-types/research.ts';

export function ResearchEvidencePanel({
  idea,
  locale,
}: {
  idea: ResearchIdea | null;
  locale: 'zh' | 'en';
}) {
  const labels = {
    zh: {
      title: '证据链',
      empty: '选择一个研究想法查看证据链',
      hypothesis: '假设',
      datasets: '数据集',
      features: '特征集',
      experiments: '实验',
      backtests: '回测',
      noLinks: '未关联',
    },
    en: {
      title: 'Evidence Chain',
      empty: 'Select a research idea to view evidence chain',
      hypothesis: 'Hypothesis',
      datasets: 'Datasets',
      features: 'Feature Sets',
      experiments: 'Experiments',
      backtests: 'Backtests',
      noLinks: 'None linked',
    },
  }[locale];

  if (!idea) {
    return (
      <section className="research-evidence-panel">
        <h3>{labels.title}</h3>
        <p className="empty-state">{labels.empty}</p>
      </section>
    );
  }

  return (
    <section className="research-evidence-panel">
      <h3>{labels.title}</h3>
      <div className="evidence-chain">
        <div className="evidence-item">
          <span className="evidence-label">{labels.hypothesis}</span>
          <span className="evidence-value">{idea.hypothesis.statement}</span>
        </div>
        <div className="evidence-item">
          <span className="evidence-label">{labels.datasets}</span>
          <span className="evidence-value">
            {idea.linkedDatasetIds.length > 0 ? idea.linkedDatasetIds.join(', ') : labels.noLinks}
          </span>
        </div>
        <div className="evidence-item">
          <span className="evidence-label">{labels.features}</span>
          <span className="evidence-value">
            {idea.linkedFeatureSetIds.length > 0
              ? idea.linkedFeatureSetIds.join(', ')
              : labels.noLinks}
          </span>
        </div>
        <div className="evidence-item">
          <span className="evidence-label">{labels.experiments}</span>
          <span className="evidence-value">
            {idea.linkedExperimentIds.length > 0
              ? idea.linkedExperimentIds.join(', ')
              : labels.noLinks}
          </span>
        </div>
        <div className="evidence-item">
          <span className="evidence-label">{labels.backtests}</span>
          <span className="evidence-value">
            {idea.linkedBacktestIds.length > 0 ? idea.linkedBacktestIds.join(', ') : labels.noLinks}
          </span>
        </div>
      </div>
    </section>
  );
}
