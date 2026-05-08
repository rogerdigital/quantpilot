import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '../../modules/console/console.i18n.tsx';

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
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
        {locale === 'zh' ? '加载分析数据...' : 'Loading analytics...'}
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
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
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1
            style={{
              font: '700 24px/1.2 var(--font-ui)',
              color: 'var(--text)',
              marginBottom: '8px',
            }}
          >
            {locale === 'zh' ? '绩效分析' : 'Performance Analytics'}
          </h1>
          <p style={{ font: '400 14px/1.5 var(--font-ui)', color: 'var(--muted)' }}>
            {locale === 'zh'
              ? '全面的策略绩效指标和风险分析'
              : 'Comprehensive strategy performance metrics and risk analysis'}
          </p>
        </div>

        {/* Time range selector */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {['1M', '3M', '6M', '1Y', 'ALL'].map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              style={{
                padding: '6px 12px',
                background: timeRange === range ? 'var(--accent)' : 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                color: timeRange === range ? '#fff' : 'var(--muted)',
                font: '600 12px/1 var(--font-data)',
                cursor: 'pointer',
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {metrics.map((metric) => (
          <div
            key={metric.label}
            style={{
              padding: '16px',
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                font: '400 11px/1 var(--font-ui)',
                color: 'var(--muted)',
                marginBottom: '8px',
              }}
            >
              {metric.label}
            </div>
            <div style={{ font: '700 20px/1 var(--font-data)', color: metric.color }}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts placeholder */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Equity curve */}
        <div
          style={{
            padding: '20px',
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            minHeight: '300px',
          }}
        >
          <h3
            style={{
              font: '600 14px/1.3 var(--font-ui)',
              color: 'var(--text)',
              marginBottom: '16px',
            }}
          >
            {locale === 'zh' ? '净值曲线' : 'Equity Curve'}
          </h3>
          <div
            style={{
              height: '250px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--muted)',
              font: '400 13px/1 var(--font-ui)',
            }}
          >
            {locale === 'zh' ? '图表组件待集成' : 'Chart component to be integrated'}
          </div>
        </div>

        {/* Drawdown chart */}
        <div
          style={{
            padding: '20px',
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            minHeight: '300px',
          }}
        >
          <h3
            style={{
              font: '600 14px/1.3 var(--font-ui)',
              color: 'var(--text)',
              marginBottom: '16px',
            }}
          >
            {locale === 'zh' ? '回撤曲线' : 'Drawdown Chart'}
          </h3>
          <div
            style={{
              height: '250px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--muted)',
              font: '400 13px/1 var(--font-ui)',
            }}
          >
            {locale === 'zh' ? '图表组件待集成' : 'Chart component to be integrated'}
          </div>
        </div>
      </div>

      {/* Monthly returns heatmap */}
      <div
        style={{
          padding: '20px',
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius)',
          marginBottom: '24px',
        }}
      >
        <h3
          style={{
            font: '600 14px/1.3 var(--font-ui)',
            color: 'var(--text)',
            marginBottom: '16px',
          }}
        >
          {locale === 'zh' ? '月度收益热力图' : 'Monthly Returns Heatmap'}
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              font: '400 12px/1.4 var(--font-data)',
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    padding: '8px',
                    textAlign: 'left',
                    color: 'var(--muted)',
                    borderBottom: '1px solid var(--line)',
                  }}
                >
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
                  <th
                    key={month}
                    style={{
                      padding: '8px',
                      textAlign: 'center',
                      color: 'var(--muted)',
                      borderBottom: '1px solid var(--line)',
                    }}
                  >
                    {month}
                  </th>
                ))}
                <th
                  style={{
                    padding: '8px',
                    textAlign: 'center',
                    color: 'var(--muted)',
                    borderBottom: '1px solid var(--line)',
                    fontWeight: 700,
                  }}
                >
                  {locale === 'zh' ? '全年' : 'YTD'}
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.monthlyReturns)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([year, months]) => {
                  const yearTotal = Object.values(months).reduce((s, r) => s + r, 0);
                  return (
                    <tr key={year}>
                      <td
                        style={{
                          padding: '8px',
                          fontWeight: 600,
                          borderBottom: '1px solid var(--line)',
                        }}
                      >
                        {year}
                      </td>
                      {Array.from({ length: 12 }, (_, i) => {
                        const monthKey = String(i + 1).padStart(2, '0');
                        const ret = months[monthKey] || 0;
                        const bgColor =
                          ret > 0
                            ? 'rgba(0, 232, 157, 0.2)'
                            : ret < 0
                              ? 'rgba(255, 51, 88, 0.2)'
                              : 'transparent';
                        return (
                          <td
                            key={monthKey}
                            style={{
                              padding: '8px',
                              textAlign: 'center',
                              background: bgColor,
                              color:
                                ret !== 0
                                  ? ret > 0
                                    ? 'var(--buy)'
                                    : 'var(--sell)'
                                  : 'var(--muted)',
                              borderBottom: '1px solid var(--line)',
                            }}
                          >
                            {ret !== 0 ? `${(ret * 100).toFixed(1)}%` : '-'}
                          </td>
                        );
                      })}
                      <td
                        style={{
                          padding: '8px',
                          textAlign: 'center',
                          fontWeight: 700,
                          color: yearTotal >= 0 ? 'var(--buy)' : 'var(--sell)',
                          borderBottom: '1px solid var(--line)',
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
      <div
        style={{
          padding: '20px',
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius)',
        }}
      >
        <h3
          style={{
            font: '600 14px/1.3 var(--font-ui)',
            color: 'var(--text)',
            marginBottom: '16px',
          }}
        >
          {locale === 'zh' ? '交易分布' : 'Trade Distribution'}
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '8px',
          }}
        >
          {data.tradeDistribution.map((bucket) => (
            <div
              key={bucket.range}
              style={{
                padding: '12px',
                background: 'var(--panel-2)',
                borderRadius: 'var(--radius)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  font: '400 11px/1 var(--font-ui)',
                  color: 'var(--muted)',
                  marginBottom: '4px',
                }}
              >
                {bucket.range}
              </div>
              <div style={{ font: '600 16px/1 var(--font-data)', color: 'var(--text)' }}>
                {bucket.count}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
