import type { AttributionBreakdown, RegimePerformance } from '@shared-types/backtest.ts';

export function BacktestAttributionPanel({
  attributions,
  regimePerformance,
  locale,
}: {
  attributions: AttributionBreakdown[];
  regimePerformance: RegimePerformance[];
  locale: 'zh' | 'en';
}) {
  const labels = {
    zh: {
      title: '归因分析',
      empty: '暂无归因数据',
      source: '来源',
      contribution: '贡献',
      weight: '权重',
      regimeTitle: '市场环境表现',
      regime: '环境',
      periods: '周期数',
      return: '年化收益',
      sharpe: 'Sharpe',
      drawdown: '最大回撤',
    },
    en: {
      title: 'Attribution Analysis',
      empty: 'No attribution data available',
      source: 'Source',
      contribution: 'Contribution',
      weight: 'Weight',
      regimeTitle: 'Regime Performance',
      regime: 'Regime',
      periods: 'Periods',
      return: 'Annualized Return',
      sharpe: 'Sharpe',
      drawdown: 'Max Drawdown',
    },
  }[locale];

  if (attributions.length === 0 && regimePerformance.length === 0) {
    return (
      <section className="backtest-attribution-panel">
        <h3>{labels.title}</h3>
        <p className="empty-state">{labels.empty}</p>
      </section>
    );
  }

  return (
    <section className="backtest-attribution-panel">
      <h3>{labels.title}</h3>
      {attributions.length > 0 ? (
        <table className="attribution-table">
          <thead>
            <tr>
              <th>{labels.source}</th>
              <th>{labels.contribution}</th>
              <th>{labels.weight}</th>
            </tr>
          </thead>
          <tbody>
            {attributions.map((a) => (
              <tr key={a.source}>
                <td>{a.source}</td>
                <td>{(a.contribution * 100).toFixed(2)}%</td>
                <td>{(a.weight * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {regimePerformance.length > 0 ? (
        <>
          <h4>{labels.regimeTitle}</h4>
          <table className="regime-table">
            <thead>
              <tr>
                <th>{labels.regime}</th>
                <th>{labels.periods}</th>
                <th>{labels.return}</th>
                <th>{labels.sharpe}</th>
                <th>{labels.drawdown}</th>
              </tr>
            </thead>
            <tbody>
              {regimePerformance.map((rp) => (
                <tr key={rp.regime}>
                  <td>{rp.regime}</td>
                  <td>{rp.periodCount}</td>
                  <td>{(rp.annualizedReturn * 100).toFixed(2)}%</td>
                  <td>{rp.sharpe.toFixed(4)}</td>
                  <td>{(rp.maxDrawdown * 100).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </section>
  );
}
