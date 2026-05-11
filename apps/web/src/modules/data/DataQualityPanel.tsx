import type { DataQualityReport } from '@shared-types/data-science.ts';

export function DataQualityPanel({
  reports,
  locale,
}: {
  reports: DataQualityReport[];
  locale: 'zh' | 'en';
}) {
  const blockers = reports.filter((r) => r.overallStatus === 'blocker');
  const warnings = reports.filter((r) => r.overallStatus === 'warning');
  const healthy = reports.filter((r) => r.overallStatus === 'pass');

  const labels = {
    zh: {
      title: '数据质量',
      blockers: '阻断项',
      warnings: '警告',
      healthy: '正常',
      noReports: '暂无质量报告',
      dataset: '数据集版本',
      severity: '等级',
      passed: '通过',
      failed: '未通过',
    },
    en: {
      title: 'Data Quality',
      blockers: 'Blockers',
      warnings: 'Warnings',
      healthy: 'Healthy',
      noReports: 'No quality reports available',
      dataset: 'Dataset Version',
      severity: 'Severity',
      passed: 'Passed',
      failed: 'Failed',
    },
  }[locale];

  if (reports.length === 0) {
    return (
      <section className="data-quality-panel">
        <h3>{labels.title}</h3>
        <p className="empty-state">{labels.noReports}</p>
      </section>
    );
  }

  return (
    <section className="data-quality-panel">
      <h3>{labels.title}</h3>
      <div className="quality-summary">
        <span className="quality-stat blocker">
          {labels.blockers}: {blockers.length}
        </span>
        <span className="quality-stat warning">
          {labels.warnings}: {warnings.length}
        </span>
        <span className="quality-stat healthy">
          {labels.healthy}: {healthy.length}
        </span>
      </div>
      <table className="quality-table">
        <thead>
          <tr>
            <th>{labels.dataset}</th>
            <th>{labels.severity}</th>
            <th>{labels.passed}</th>
            <th>{labels.failed}</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            const passedCount = report.checks.filter((c) => c.passed).length;
            const failedCount = report.checks.filter((c) => !c.passed).length;
            return (
              <tr key={report.versionId} data-severity={report.overallStatus}>
                <td>{report.versionId}</td>
                <td>{report.overallStatus}</td>
                <td>{passedCount}</td>
                <td>{failedCount}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
