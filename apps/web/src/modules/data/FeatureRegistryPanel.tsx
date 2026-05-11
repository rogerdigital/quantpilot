import type { FeatureSet } from '@shared-types/data-science.ts';

export function FeatureRegistryPanel({
  features,
  locale,
}: {
  features: FeatureSet[];
  locale: 'zh' | 'en';
}) {
  const labels = {
    zh: {
      title: '特征库',
      name: '名称',
      owner: '负责人',
      versions: '版本数',
      lineage: '血缘状态',
      leakageRisk: '泄漏风险',
      noFeatures: '暂无已注册特征集',
      tracked: '已追踪',
      untracked: '未追踪',
      hasRisk: '有风险',
      safe: '安全',
    },
    en: {
      title: 'Feature Registry',
      name: 'Name',
      owner: 'Owner',
      versions: 'Versions',
      lineage: 'Lineage',
      leakageRisk: 'Leakage Risk',
      noFeatures: 'No registered feature sets',
      tracked: 'Tracked',
      untracked: 'Untracked',
      hasRisk: 'At Risk',
      safe: 'Safe',
    },
  }[locale];

  if (features.length === 0) {
    return (
      <section className="feature-registry-panel">
        <h3>{labels.title}</h3>
        <p className="empty-state">{labels.noFeatures}</p>
      </section>
    );
  }

  return (
    <section className="feature-registry-panel">
      <h3>{labels.title}</h3>
      <table className="feature-table">
        <thead>
          <tr>
            <th>{labels.name}</th>
            <th>{labels.owner}</th>
            <th>{labels.versions}</th>
            <th>{labels.lineage}</th>
            <th>{labels.leakageRisk}</th>
          </tr>
        </thead>
        <tbody>
          {features.map((fs) => {
            const hasLineage = fs.versions.some(
              (v) => v.lineage.sourceDatasetVersionIds.length > 0
            );
            const hasLeakageRisk = fs.versions.some((v) => v.lineage.leakageRisk);
            return (
              <tr key={fs.id} data-leakage={hasLeakageRisk ? 'risk' : 'safe'}>
                <td>{fs.name}</td>
                <td>{fs.owner}</td>
                <td>{fs.versions.length}</td>
                <td>{hasLineage ? labels.tracked : labels.untracked}</td>
                <td className={hasLeakageRisk ? 'leakage-risk' : 'leakage-safe'}>
                  {hasLeakageRisk ? labels.hasRisk : labels.safe}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
