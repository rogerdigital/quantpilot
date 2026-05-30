import type { ResearchIdea } from '@shared-types/trading.ts';

const STATUS_LABELS: Record<string, string> = {
  idea: 'Idea',
  dataset_selected: 'Dataset Selected',
  features_defined: 'Features Defined',
  experiment_running: 'Experiment Running',
  experiment_reviewed: 'Experiment Reviewed',
  strategy_candidate: 'Strategy Candidate',
  backtest_ready: 'Backtest Ready',
  risk_review: 'Risk Review',
  paper_ready: 'Paper Ready',
  live_review: 'Live Review',
  live_enabled: 'Live Enabled',
  monitored: 'Monitored',
  retired: 'Retired',
};

export function ResearchIdeaLifecyclePanel({
  ideas,
  locale,
}: {
  ideas: ResearchIdea[];
  locale: 'zh' | 'en';
}) {
  const labels = {
    zh: {
      title: '研究管线',
      empty: '暂无研究想法',
      status: '状态',
      hypothesis: '假设',
      decisions: '决策记录',
      owner: '负责人',
    },
    en: {
      title: 'Research Pipeline',
      empty: 'No research ideas',
      status: 'Status',
      hypothesis: 'Hypothesis',
      decisions: 'Decisions',
      owner: 'Owner',
    },
  }[locale];

  if (ideas.length === 0) {
    return (
      <section className="research-lifecycle-panel">
        <h3>{labels.title}</h3>
        <p className="empty-state">{labels.empty}</p>
      </section>
    );
  }

  const statusGroups = new Map<string, number>();
  for (const idea of ideas) {
    statusGroups.set(idea.status, (statusGroups.get(idea.status) || 0) + 1);
  }

  return (
    <section className="research-lifecycle-panel">
      <h3>{labels.title}</h3>
      <div className="pipeline-summary">
        {Array.from(statusGroups.entries()).map(([status, count]) => (
          <span key={status} className="pipeline-stage" data-status={status}>
            {STATUS_LABELS[status] || status}: {count}
          </span>
        ))}
      </div>
      <table className="lifecycle-table">
        <thead>
          <tr>
            <th>{labels.hypothesis}</th>
            <th>{labels.status}</th>
            <th>{labels.owner}</th>
            <th>{labels.decisions}</th>
          </tr>
        </thead>
        <tbody>
          {ideas.map((idea) => (
            <tr key={idea.id} data-status={idea.status}>
              <td>{idea.hypothesis.statement}</td>
              <td>{STATUS_LABELS[idea.status] || idea.status}</td>
              <td>{idea.owner}</td>
              <td>{idea.decisionRecords.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
