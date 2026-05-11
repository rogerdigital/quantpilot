import type { Dataset } from '@shared-types/data-science.ts';

export function DatasetRegistryPanel({
  datasets,
  locale,
}: {
  datasets: Dataset[];
  locale: 'zh' | 'en';
}) {
  const labels = {
    zh: {
      title: '数据集注册',
      name: '名称',
      category: '类别',
      owner: '负责人',
      frequency: '更新频率',
      freshness: '最近更新',
      activeVersion: '活跃版本',
      noDatasets: '暂无已注册数据集',
      stale: '过期',
      fresh: '正常',
    },
    en: {
      title: 'Dataset Registry',
      name: 'Name',
      category: 'Category',
      owner: 'Owner',
      frequency: 'Frequency',
      freshness: 'Freshness',
      activeVersion: 'Active Version',
      noDatasets: 'No registered datasets',
      stale: 'Stale',
      fresh: 'Fresh',
    },
  }[locale];

  if (datasets.length === 0) {
    return (
      <section className="dataset-registry-panel">
        <h3>{labels.title}</h3>
        <p className="empty-state">{labels.noDatasets}</p>
      </section>
    );
  }

  return (
    <section className="dataset-registry-panel">
      <h3>{labels.title}</h3>
      <table className="dataset-table">
        <thead>
          <tr>
            <th>{labels.name}</th>
            <th>{labels.category}</th>
            <th>{labels.owner}</th>
            <th>{labels.frequency}</th>
            <th>{labels.freshness}</th>
            <th>{labels.activeVersion}</th>
          </tr>
        </thead>
        <tbody>
          {datasets.map((ds) => {
            const lastIngestion = ds.source.lastSuccessfulIngestion;
            const isFresh =
              lastIngestion && Date.now() - new Date(lastIngestion).getTime() < 86400000;
            return (
              <tr key={ds.id} data-freshness={isFresh ? 'fresh' : 'stale'}>
                <td>{ds.name}</td>
                <td>{ds.category}</td>
                <td>{ds.owner}</td>
                <td>{ds.source.ingestionFrequency}</td>
                <td className={isFresh ? 'status-fresh' : 'status-stale'}>
                  {isFresh ? labels.fresh : labels.stale}
                </td>
                <td>{ds.activeVersionId || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
