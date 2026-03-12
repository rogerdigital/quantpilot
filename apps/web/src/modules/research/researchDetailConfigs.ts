import type { BacktestRunDetailSnapshot, BacktestRunItem, StrategyCatalogDetailSnapshot, StrategyCatalogItem, WorkflowRunRecord } from '@shared-types/trading.ts';

export function getStrategyDetailInspectionConfig(
  locale: 'zh' | 'en',
  selectedStrategy: StrategyCatalogItem | null,
  selectedStrategySnapshot: StrategyCatalogItem | null,
  strategyDetail: StrategyCatalogDetailSnapshot | null,
) {
  return {
    emptyMessage: !selectedStrategy
      ? (locale === 'zh' ? '当前没有可查看的策略。' : 'No strategy is available for inspection.')
      : null,
    metrics: [
      { label: locale === 'zh' ? '名称' : 'Name', value: selectedStrategySnapshot?.name || '--' },
      { label: locale === 'zh' ? '家族' : 'Family', value: selectedStrategySnapshot?.family || '--' },
      { label: locale === 'zh' ? '周期' : 'Timeframe', value: selectedStrategySnapshot?.timeframe || '--' },
      { label: locale === 'zh' ? '标的池' : 'Universe', value: selectedStrategySnapshot?.universe || '--' },
      { label: locale === 'zh' ? '预期收益' : 'Expected return', value: selectedStrategySnapshot ? `${selectedStrategySnapshot.expectedReturnPct.toFixed(1)}%` : '--' },
      { label: locale === 'zh' ? '最大回撤' : 'Max drawdown', value: selectedStrategySnapshot ? `${selectedStrategySnapshot.maxDrawdownPct.toFixed(1)}%` : '--' },
      { label: 'Sharpe', value: selectedStrategySnapshot ? selectedStrategySnapshot.sharpe.toFixed(2) : '--' },
      { label: locale === 'zh' ? '最近研究' : 'Latest research', value: strategyDetail?.latestRun?.windowLabel || '--' },
    ],
    summary: selectedStrategySnapshot?.summary || (locale === 'zh' ? '当前策略暂无摘要。' : 'No strategy summary is available yet.'),
  };
}

export function getBacktestDetailInspectionConfig(
  locale: 'zh' | 'en',
  selectedRun: BacktestRunItem | null,
  selectedRunSnapshot: BacktestRunItem | null,
  selectedWorkflow: WorkflowRunRecord | null,
  runDetail: BacktestRunDetailSnapshot | null,
  formatPercent: (value: number) => string,
) {
  const hasPerformance = Boolean(selectedRunSnapshot && (selectedRunSnapshot.status === 'completed' || selectedRunSnapshot.status === 'needs_review'));

  return {
    emptyMessage: !selectedRun
      ? (locale === 'zh' ? '当前没有可查看的回测记录。' : 'No backtest run is available for inspection.')
      : null,
    metrics: [
      { label: locale === 'zh' ? '策略' : 'Strategy', value: selectedRunSnapshot?.strategyName || '--' },
      { label: locale === 'zh' ? '窗口' : 'Window', value: selectedRunSnapshot?.windowLabel || '--' },
      { label: locale === 'zh' ? '收益率' : 'Return', value: selectedRunSnapshot && hasPerformance ? formatPercent(selectedRunSnapshot.annualizedReturnPct) : '--' },
      { label: locale === 'zh' ? '最大回撤' : 'Max Drawdown', value: selectedRunSnapshot && hasPerformance ? formatPercent(selectedRunSnapshot.maxDrawdownPct) : '--' },
      { label: 'Sharpe', value: selectedRunSnapshot && hasPerformance ? selectedRunSnapshot.sharpe.toFixed(2) : '--' },
      { label: locale === 'zh' ? '胜率' : 'Win Rate', value: selectedRunSnapshot && hasPerformance ? formatPercent(selectedRunSnapshot.winRatePct) : '--' },
      { label: locale === 'zh' ? '工作流' : 'Workflow', value: selectedWorkflow?.id || selectedRunSnapshot?.workflowRunId || '--' },
      { label: locale === 'zh' ? '策略阶段' : 'Strategy stage', value: runDetail?.strategy?.status || '--' },
    ],
    summary: selectedRunSnapshot?.summary || (locale === 'zh' ? '当前回测暂无摘要。' : 'No backtest summary is available yet.'),
  };
}
