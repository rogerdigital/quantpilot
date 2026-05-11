import type { ExperimentRun } from '@shared-types/experiments.ts';

export function ExperimentComparisonPanel({
  runs,
  locale,
}: {
  runs: ExperimentRun[];
  locale: 'zh' | 'en';
}) {
  const labels = {
    zh: {
      title: '实验对比',
      empty: '暂无可对比的实验运行',
      run: '运行',
      status: '状态',
      metrics: '指标',
      candidate: '候选',
      dataset: '数据集版本',
      feature: '特征版本',
    },
    en: {
      title: 'Experiment Comparison',
      empty: 'No experiment runs to compare',
      run: 'Run',
      status: 'Status',
      metrics: 'Metrics',
      candidate: 'Candidate',
      dataset: 'Dataset Version',
      feature: 'Feature Version',
    },
  }[locale];

  if (runs.length === 0) {
    return (
      <section className="experiment-comparison-panel">
        <h3>{labels.title}</h3>
        <p className="empty-state">{labels.empty}</p>
      </section>
    );
  }

  const allMetricNames = Array.from(new Set(runs.flatMap((r) => r.metrics.map((m) => m.name))));

  return (
    <section className="experiment-comparison-panel">
      <h3>{labels.title}</h3>
      <table className="comparison-table">
        <thead>
          <tr>
            <th>{labels.run}</th>
            <th>{labels.dataset}</th>
            <th>{labels.feature}</th>
            <th>{labels.status}</th>
            <th>{labels.candidate}</th>
            {allMetricNames.map((name) => (
              <th key={name}>{name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id} data-candidate={run.isCandidate ? 'true' : 'false'}>
              <td>{run.id}</td>
              <td>{run.snapshot.datasetVersionId}</td>
              <td>{run.snapshot.featureVersionId}</td>
              <td>{run.status}</td>
              <td>{run.isCandidate ? '✓' : '—'}</td>
              {allMetricNames.map((name) => {
                const metric = run.metrics.find((m) => m.name === name);
                const value = metric?.value.kind === 'scalar' ? metric.value.value.toFixed(4) : '—';
                return <td key={name}>{value}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
