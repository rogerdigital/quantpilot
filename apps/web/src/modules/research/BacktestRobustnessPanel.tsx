import type { RobustnessReport } from '@shared-types/backtest.ts';

export function BacktestRobustnessPanel({
  report,
  locale,
}: {
  report: RobustnessReport | null;
  locale: 'zh' | 'en';
}) {
  const labels = {
    zh: {
      title: '稳健性诊断',
      empty: '暂无稳健性报告',
      overfitRisk: '过拟合风险',
      inSample: '样本内 Sharpe',
      outOfSample: '样本外 Sharpe',
      walkForward: '滚动前推 Sharpe',
      drawdownClusters: '回撤聚类',
      turnoverExplosion: '换手率爆发',
      lowTradeCount: '交易次数不足',
      paramSensitivity: '参数敏感性',
      parameter: '参数',
      sharpeRange: 'Sharpe 区间',
      eligible: '可晋级',
      notEligible: '不可晋级',
      warning: '需关注',
    },
    en: {
      title: 'Robustness Diagnostics',
      empty: 'No robustness report available',
      overfitRisk: 'Overfit Risk',
      inSample: 'In-Sample Sharpe',
      outOfSample: 'Out-of-Sample Sharpe',
      walkForward: 'Walk-Forward Sharpe',
      drawdownClusters: 'Drawdown Clusters',
      turnoverExplosion: 'Turnover Explosion',
      lowTradeCount: 'Low Trade Count',
      paramSensitivity: 'Parameter Sensitivity',
      parameter: 'Parameter',
      sharpeRange: 'Sharpe Range',
      eligible: 'Eligible',
      notEligible: 'Not Eligible',
      warning: 'Warning',
    },
  }[locale];

  if (!report) {
    return (
      <section className="backtest-robustness-panel">
        <h3>{labels.title}</h3>
        <p className="empty-state">{labels.empty}</p>
      </section>
    );
  }

  const promotionEligible =
    report.overfitRisk === 'low' && !report.lowTradeCount && !report.turnoverExplosion;

  return (
    <section className="backtest-robustness-panel">
      <h3>{labels.title}</h3>
      <div className="robustness-summary" data-risk={report.overfitRisk}>
        <span className="robustness-badge">
          {promotionEligible
            ? labels.eligible
            : report.overfitRisk === 'medium'
              ? labels.warning
              : labels.notEligible}
        </span>
        <span className="robustness-risk">
          {labels.overfitRisk}: {report.overfitRisk}
        </span>
      </div>
      <div className="robustness-grid">
        <div className="robustness-item">
          <span className="robustness-label">{labels.inSample}</span>
          <span className="robustness-value">{report.inSampleSharpe.toFixed(4)}</span>
        </div>
        <div className="robustness-item">
          <span className="robustness-label">{labels.outOfSample}</span>
          <span className="robustness-value">{report.outOfSampleSharpe.toFixed(4)}</span>
        </div>
        <div className="robustness-item">
          <span className="robustness-label">{labels.drawdownClusters}</span>
          <span className="robustness-value">{report.drawdownClusters}</span>
        </div>
        <div className="robustness-item">
          <span className="robustness-label">{labels.turnoverExplosion}</span>
          <span className="robustness-value">{report.turnoverExplosion ? 'Yes' : 'No'}</span>
        </div>
        <div className="robustness-item">
          <span className="robustness-label">{labels.lowTradeCount}</span>
          <span className="robustness-value">{report.lowTradeCount ? 'Yes' : 'No'}</span>
        </div>
      </div>
      {report.walkForwardSharpe.length > 0 ? (
        <div className="robustness-section">
          <h4>{labels.walkForward}</h4>
          <div className="walk-forward-row">
            {report.walkForwardSharpe.map((s, i) => (
              <span key={i} className="walk-forward-cell">
                {s.toFixed(4)}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {report.parameterSensitivity.length > 0 ? (
        <div className="robustness-section">
          <h4>{labels.paramSensitivity}</h4>
          <table className="sensitivity-table">
            <thead>
              <tr>
                <th>{labels.parameter}</th>
                <th>{labels.sharpeRange}</th>
              </tr>
            </thead>
            <tbody>
              {report.parameterSensitivity.map((ps) => (
                <tr key={ps.parameter}>
                  <td>{ps.parameter}</td>
                  <td>
                    [{ps.sharpeRange[0].toFixed(4)}, {ps.sharpeRange[1].toFixed(4)}]
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
