import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '../../modules/console/console.i18n.tsx';
import * as s from './AnalyticsPage.css.js';

interface PerformanceSummary {
  totalReturn: number;
  cagr: number;
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  tradingDays: number;
  totalTrades: number;
}

interface AnalyticsData {
  summary: PerformanceSummary;
  equityCurve: number[];
  drawdownSeries: number[];
  monthlyReturns: Record<string, Record<string, number>>;
  tradeDistribution: { range: string; count: number }[];
}

export function AnalyticsPage() {
  const { locale } = useLocale();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('1Y');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/performance?range=${timeRange}`);
      const result = await res.json();

      if (result.ok) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className={s.loadingState}>
        {locale === 'zh' ? '加载分析数据...' : 'Loading analytics...'}
      </div>
    );
  }

  if (!data) {
    return (
      <div className={s.loadingState}>
        {locale === 'zh' ? '暂无分析数据' : 'No analytics data available'}
      </div>
    );
  }

  const { summary } = data;

  const metrics = [
    {
      label: locale === 'zh' ? '总收益' : 'Total Return',
      value: `${(summary.totalReturn * 100).toFixed(2)}%`,
      color: summary.totalReturn >= 0 ? 'var(--buy)' : 'var(--sell)',
    },
    {
      label: 'CAGR',
      value: `${(summary.cagr * 100).toFixed(2)}%`,
      color: summary.cagr >= 0 ? 'var(--buy)' : 'var(--sell)',
    },
    {
      label: 'Sharpe',
      value: summary.sharpe.toFixed(2),
      color:
        summary.sharpe >= 1 ? 'var(--buy)' : summary.sharpe >= 0 ? 'var(--text)' : 'var(--sell)',
    },
    {
      label: 'Sortino',
      value: summary.sortino.toFixed(2),
      color:
        summary.sortino >= 1 ? 'var(--buy)' : summary.sortino >= 0 ? 'var(--text)' : 'var(--sell)',
    },
    {
      label: locale === 'zh' ? '最大回撤' : 'Max Drawdown',
      value: `${(summary.maxDrawdown * 100).toFixed(2)}%`,
      color: 'var(--sell)',
    },
    {
      label: locale === 'zh' ? '胜率' : 'Win Rate',
      value: `${(summary.winRate * 100).toFixed(1)}%`,
      color: summary.winRate >= 0.5 ? 'var(--buy)' : 'var(--text)',
    },
    {
      label: locale === 'zh' ? '盈亏比' : 'Profit Factor',
      value: summary.profitFactor === Infinity ? '∞' : summary.profitFactor.toFixed(2),
      color:
        summary.profitFactor >= 1.5
          ? 'var(--buy)'
          : summary.profitFactor >= 1
            ? 'var(--text)'
            : 'var(--sell)',
    },
    {
      label: locale === 'zh' ? '交易天数' : 'Trading Days',
      value: String(summary.tradingDays),
      color: 'var(--text)',
    },
  ];

  return (
    <div className={s.pageLayout}>
      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>{locale === 'zh' ? '绩效分析' : 'Performance Analytics'}</h1>
          <p className={s.pageSubtitle}>
            {locale === 'zh'
              ? '全面的策略绩效指标和风险分析'
              : 'Comprehensive strategy performance metrics and risk analysis'}
          </p>
        </div>

        {/* Time range selector */}
        <div className={s.timeRangeGroup}>
          {['1M', '3M', '6M', '1Y', 'ALL'].map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={`${s.timeRangeBtn} ${timeRange === range ? s.timeRangeBtnActive : ''}`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className={s.metricsGrid}>
        {metrics.map((metric) => (
          <div key={metric.label} className={s.metricCard}>
            <div className={s.metricLabel}>{metric.label}</div>
            <div className={s.metricValue} style={{ color: metric.color }}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className={s.chartsGrid}>
        <div className={s.chartPanel}>
          <h3 className={s.chartTitle}>{locale === 'zh' ? '净值曲线' : 'Equity Curve'}</h3>
          <div className={s.chartPlaceholder}>
            {locale === 'zh' ? '图表组件待集成' : 'Chart component to be integrated'}
          </div>
        </div>

        <div className={s.chartPanel}>
          <h3 className={s.chartTitle}>{locale === 'zh' ? '回撤曲线' : 'Drawdown Chart'}</h3>
          <div className={s.chartPlaceholder}>
            {locale === 'zh' ? '图表组件待集成' : 'Chart component to be integrated'}
          </div>
        </div>
      </div>

      {/* Monthly returns heatmap */}
      <div className={s.heatmapPanel}>
        <h3 className={s.chartTitle}>
          {locale === 'zh' ? '月度收益热力图' : 'Monthly Returns Heatmap'}
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className={s.heatmapTable}>
            <thead>
              <tr>
                <th className={`${s.heatmapTh} ${s.heatmapThLeft}`}>
                  {locale === 'zh' ? '年份' : 'Year'}
                </th>
                {[
                  'Jan',
                  'Feb',
                  'Mar',
                  'Apr',
                  'May',
                  'Jun',
                  'Jul',
                  'Aug',
                  'Sep',
                  'Oct',
                  'Nov',
                  'Dec',
                ].map((month) => (
                  <th key={month} className={s.heatmapTh}>
                    {month}
                  </th>
                ))}
                <th className={s.heatmapTh} style={{ fontWeight: 700 }}>
                  {locale === 'zh' ? '全年' : 'YTD'}
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.monthlyReturns)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([year, months]) => {
                  const yearTotal = Object.values(months).reduce((acc, r) => acc + r, 0);
                  return (
                    <tr key={year}>
                      <td className={s.heatmapTd} style={{ textAlign: 'left', fontWeight: 600 }}>
                        {year}
                      </td>
                      {Array.from({ length: 12 }, (_, i) => {
                        const monthKey = String(i + 1).padStart(2, '0');
                        const ret = months[monthKey] || 0;
                        const bgColor =
                          ret > 0
                            ? 'rgba(16, 185, 129, 0.15)'
                            : ret < 0
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'transparent';
                        return (
                          <td
                            key={monthKey}
                            className={s.heatmapTd}
                            style={{
                              background: bgColor,
                              color:
                                ret !== 0
                                  ? ret > 0
                                    ? 'var(--buy)'
                                    : 'var(--sell)'
                                  : 'var(--muted)',
                            }}
                          >
                            {ret !== 0 ? `${(ret * 100).toFixed(1)}%` : '-'}
                          </td>
                        );
                      })}
                      <td
                        className={s.heatmapTd}
                        style={{
                          fontWeight: 700,
                          color: yearTotal >= 0 ? 'var(--buy)' : 'var(--sell)',
                        }}
                      >
                        {`${(yearTotal * 100).toFixed(1)}%`}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade distribution */}
      <div className={s.distributionSection}>
        <h3 className={s.chartTitle}>{locale === 'zh' ? '交易分布' : 'Trade Distribution'}</h3>
        <div className={s.distributionGrid}>
          {data.tradeDistribution.map((bucket) => (
            <div key={bucket.range} className={s.distributionItem}>
              <div className={s.distributionLabel}>{bucket.range}</div>
              <div className={s.distributionValue}>{bucket.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
