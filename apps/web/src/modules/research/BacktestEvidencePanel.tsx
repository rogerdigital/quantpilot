import type { BacktestRunResult, BacktestSpec } from '@shared-types/backtest.ts';

export function BacktestEvidencePanel({
  spec,
  result,
  locale,
}: {
  spec: BacktestSpec | null;
  result: BacktestRunResult | null;
  locale: 'zh' | 'en';
}) {
  const labels = {
    zh: {
      title: '回测证据面板',
      empty: '选择一条回测记录查看详情',
      specHash: '规格哈希',
      strategy: '策略版本',
      dataset: '数据集版本',
      feature: '特征版本',
      benchmark: '基准',
      window: '时间窗口',
      cadence: '再平衡',
      capital: '初始资金',
      cost: '成本模型',
      slippage: '滑点模型',
      constraints: '风险约束',
      result: '回测结果',
      sharpe: 'Sharpe',
      sortino: 'Sortino',
      calmar: 'Calmar',
      return: '年化收益',
      drawdown: '最大回撤',
      winRate: '胜率',
      turnover: '换手率',
      trades: '交易次数',
      holdingDays: '持仓天数',
      profitFactor: '盈亏比',
    },
    en: {
      title: 'Backtest Evidence Panel',
      empty: 'Select a backtest run to view details',
      specHash: 'Spec Hash',
      strategy: 'Strategy Version',
      dataset: 'Dataset Version',
      feature: 'Feature Version',
      benchmark: 'Benchmark',
      window: 'Time Range',
      cadence: 'Rebalance Cadence',
      capital: 'Initial Capital',
      cost: 'Cost Model',
      slippage: 'Slippage Model',
      constraints: 'Risk Constraints',
      result: 'Backtest Result',
      sharpe: 'Sharpe',
      sortino: 'Sortino',
      calmar: 'Calmar',
      return: 'Annualized Return',
      drawdown: 'Max Drawdown',
      winRate: 'Win Rate',
      turnover: 'Turnover',
      trades: 'Trade Count',
      holdingDays: 'Avg Holding Days',
      profitFactor: 'Profit Factor',
    },
  }[locale];

  if (!spec) {
    return (
      <section className="backtest-evidence-panel">
        <h3>{labels.title}</h3>
        <p className="empty-state">{labels.empty}</p>
      </section>
    );
  }

  return (
    <section className="backtest-evidence-panel">
      <h3>{labels.title}</h3>
      <div className="evidence-grid">
        <div className="evidence-item">
          <span className="evidence-label">{labels.specHash}</span>
          <code className="evidence-value">{spec.specHash}</code>
        </div>
        <div className="evidence-item">
          <span className="evidence-label">{labels.strategy}</span>
          <span className="evidence-value">{spec.strategyVersionId}</span>
        </div>
        <div className="evidence-item">
          <span className="evidence-label">{labels.dataset}</span>
          <span className="evidence-value">{spec.datasetVersionId}</span>
        </div>
        <div className="evidence-item">
          <span className="evidence-label">{labels.feature}</span>
          <span className="evidence-value">{spec.featureVersionId}</span>
        </div>
        <div className="evidence-item">
          <span className="evidence-label">{labels.benchmark}</span>
          <span className="evidence-value">{spec.benchmark}</span>
        </div>
        <div className="evidence-item">
          <span className="evidence-label">{labels.window}</span>
          <span className="evidence-value">
            {spec.timeRange.start} — {spec.timeRange.end}
          </span>
        </div>
        <div className="evidence-item">
          <span className="evidence-label">{labels.cadence}</span>
          <span className="evidence-value">{spec.rebalanceCadence}</span>
        </div>
        <div className="evidence-item">
          <span className="evidence-label">{labels.capital}</span>
          <span className="evidence-value">{spec.initialCapital.toLocaleString()}</span>
        </div>
        <div className="evidence-item">
          <span className="evidence-label">{labels.cost}</span>
          <span className="evidence-value">
            {spec.costModel.label} ({spec.costModel.model})
          </span>
        </div>
        <div className="evidence-item">
          <span className="evidence-label">{labels.slippage}</span>
          <span className="evidence-value">
            {spec.slippageModel.label} ({spec.slippageModel.model})
          </span>
        </div>
        <div className="evidence-item">
          <span className="evidence-label">{labels.constraints}</span>
          <span className="evidence-value">
            pos:{spec.riskConstraints.maxPositionWeight} sector:
            {spec.riskConstraints.maxSectorExposure} dd:{spec.riskConstraints.maxDrawdownLimit} lev:
            {spec.riskConstraints.maxLeverage}
          </span>
        </div>
      </div>
      {result ? (
        <>
          <h4>{labels.result}</h4>
          <div className="evidence-grid">
            <div className="evidence-item">
              <span className="evidence-label">{labels.return}</span>
              <span className="evidence-value">{result.annualizedReturnPct.toFixed(2)}%</span>
            </div>
            <div className="evidence-item">
              <span className="evidence-label">{labels.drawdown}</span>
              <span className="evidence-value">{result.maxDrawdownPct.toFixed(2)}%</span>
            </div>
            <div className="evidence-item">
              <span className="evidence-label">{labels.sharpe}</span>
              <span className="evidence-value">{result.sharpe.toFixed(4)}</span>
            </div>
            <div className="evidence-item">
              <span className="evidence-label">{labels.sortino}</span>
              <span className="evidence-value">{result.sortino.toFixed(4)}</span>
            </div>
            <div className="evidence-item">
              <span className="evidence-label">{labels.calmar}</span>
              <span className="evidence-value">{result.calmar.toFixed(4)}</span>
            </div>
            <div className="evidence-item">
              <span className="evidence-label">{labels.winRate}</span>
              <span className="evidence-value">{result.winRatePct.toFixed(1)}%</span>
            </div>
            <div className="evidence-item">
              <span className="evidence-label">{labels.turnover}</span>
              <span className="evidence-value">{result.turnoverPct.toFixed(1)}%</span>
            </div>
            <div className="evidence-item">
              <span className="evidence-label">{labels.trades}</span>
              <span className="evidence-value">{result.tradeCount}</span>
            </div>
            <div className="evidence-item">
              <span className="evidence-label">{labels.holdingDays}</span>
              <span className="evidence-value">{result.avgHoldingDays.toFixed(1)}</span>
            </div>
            <div className="evidence-item">
              <span className="evidence-label">{labels.profitFactor}</span>
              <span className="evidence-value">{result.profitFactor.toFixed(2)}</span>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
