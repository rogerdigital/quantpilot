import { useNavigate, useParams } from 'react-router-dom';
import { ChartCanvas, EmptyState } from '../../components/layout/ConsoleChrome.tsx';
import { copy, useLocale } from '../../modules/console/console.i18n.tsx';
import { translateRuntimeText } from '../../modules/console/console.utils.ts';
import { useStrategyDetail } from '../../modules/research/useStrategyDetail.ts';
import {
  detailBackRow,
  detailChartPanel,
  detailGrid,
  detailHeader,
  detailHeaderActions,
  detailHeaderMeta,
  detailKvRow,
  detailKvTable,
  detailMetricCard,
  detailMetricLabel,
  detailMetricsGrid,
  detailMetricValue,
  detailPanel,
  detailPanelHead,
  detailRunRow,
  detailRunTable,
  detailStageBadge,
  detailStageBadgeVariants,
} from './StrategyDetailPage.css.ts';

function stageTone(status: string): string {
  if (status === 'live') return 'live';
  if (status === 'paper') return 'paper';
  if (status === 'candidate') return 'candidate';
  if (status === 'researching') return 'researching';
  return 'draft';
}

function fmtPct(value: number | undefined) {
  if (value === undefined || value === null) return '--';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function fmtNum(value: number | undefined, decimals = 2) {
  if (value === undefined || value === null) return '--';
  return value.toFixed(decimals);
}

function fmtDate(value: string | undefined, locale: 'zh' | 'en') {
  if (!value) return '--';
  return new Date(value).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US');
}

export function StrategyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { locale } = useLocale();
  const { data, loading, error } = useStrategyDetail(id ?? '');

  const strategy = data?.strategy;
  const latestResult = data?.latestResult;
  const recentRuns = data?.recentRuns ?? [];

  if (loading) {
    return (
      <div style={{ padding: '40px 24px' }}>
        <div className="eyebrow">{locale === 'zh' ? '加载中...' : 'Loading...'}</div>
      </div>
    );
  }

  if (error || !strategy) {
    return (
      <div style={{ padding: '40px 24px' }}>
        <button type="button" className={detailBackRow} onClick={() => navigate('/strategies')}>
          ← {locale === 'zh' ? '返回策略工作台' : 'Back to Strategies'}
        </button>
        <EmptyState message={error || (locale === 'zh' ? '策略不存在' : 'Strategy not found')} />
      </div>
    );
  }

  const tone = stageTone(strategy.status);
  const returnPct = latestResult?.annualizedReturnPct ?? strategy.expectedReturnPct;
  const maxDD = latestResult?.maxDrawdownPct ?? strategy.maxDrawdownPct;
  const sharpe = latestResult?.sharpe ?? strategy.sharpe;
  const winRate = latestResult?.winRatePct;

  return (
    <>
      <div className={detailHeader}>
        <button type="button" className={detailBackRow} onClick={() => navigate('/strategies')}>
          ← {locale === 'zh' ? '策略工作台' : 'Strategies'}
        </button>
        <div className={detailHeaderMeta}>
          <div>
            <div className="eyebrow">
              {strategy.family} · {strategy.timeframe} · {strategy.universe}
            </div>
            <h1 style={{ margin: '6px 0 0', fontSize: 'clamp(22px, 3vw, 36px)' }}>
              {strategy.name}
            </h1>
          </div>
          <div className={detailHeaderActions}>
            <span
              className={`${detailStageBadge} ${detailStageBadgeVariants[tone as keyof typeof detailStageBadgeVariants]}`}
            >
              {strategy.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className={detailMetricsGrid}>
        <div className={detailMetricCard}>
          <div className={detailMetricLabel}>{locale === 'zh' ? '年化收益' : 'Annual Return'}</div>
          <div className={`${detailMetricValue}${returnPct >= 0 ? ' text-up' : ' text-down'}`}>
            {fmtPct(returnPct)}
          </div>
        </div>
        <div className={detailMetricCard}>
          <div className={detailMetricLabel}>{locale === 'zh' ? '最大回撤' : 'Max Drawdown'}</div>
          <div className={`${detailMetricValue} text-down`}>{fmtPct(-Math.abs(maxDD))}</div>
        </div>
        <div className={detailMetricCard}>
          <div className={detailMetricLabel}>Sharpe</div>
          <div className={detailMetricValue}>{fmtNum(sharpe)}</div>
        </div>
        <div className={detailMetricCard}>
          <div className={detailMetricLabel}>{locale === 'zh' ? '胜率' : 'Win Rate'}</div>
          <div className={detailMetricValue}>{winRate !== undefined ? fmtPct(winRate) : '--'}</div>
        </div>
      </div>

      <div className={detailChartPanel}>
        <div className={detailPanelHead}>
          <div className="panel-title">{locale === 'zh' ? '资产权益曲线' : 'Equity Curve'}</div>
          <div className="panel-badge badge-muted">CHART</div>
        </div>
        <ChartCanvas kind="equity" />
      </div>

      <div className={detailGrid}>
        <article className={detailPanel}>
          <div className={detailPanelHead}>
            <div className="panel-title">{locale === 'zh' ? '策略参数' : 'Parameters'}</div>
          </div>
          <div className={detailKvTable}>
            <div className={detailKvRow}>
              <span>{locale === 'zh' ? '策略 ID' : 'Strategy ID'}</span>
              <strong>{strategy.id}</strong>
            </div>
            <div className={detailKvRow}>
              <span>{locale === 'zh' ? '类型' : 'Family'}</span>
              <strong>{strategy.family}</strong>
            </div>
            <div className={detailKvRow}>
              <span>{locale === 'zh' ? '周期' : 'Timeframe'}</span>
              <strong>{strategy.timeframe}</strong>
            </div>
            <div className={detailKvRow}>
              <span>{locale === 'zh' ? '股票池' : 'Universe'}</span>
              <strong>{strategy.universe}</strong>
            </div>
            <div className={detailKvRow}>
              <span>{locale === 'zh' ? '评分' : 'Score'}</span>
              <strong>{strategy.score}</strong>
            </div>
            {strategy.dataSource && (
              <div className={detailKvRow}>
                <span>{locale === 'zh' ? '数据源' : 'Data Source'}</span>
                <strong>{strategy.dataSource}</strong>
              </div>
            )}
            {strategy.updatedAt && (
              <div className={detailKvRow}>
                <span>{locale === 'zh' ? '最近更新' : 'Last Updated'}</span>
                <strong>{fmtDate(strategy.updatedAt, locale)}</strong>
              </div>
            )}
            {strategy.summary && (
              <div className={detailKvRow} style={{ alignItems: 'flex-start' }}>
                <span>{locale === 'zh' ? '简介' : 'Summary'}</span>
                <strong style={{ textAlign: 'right' }}>
                  {translateRuntimeText(locale, strategy.summary)}
                </strong>
              </div>
            )}
          </div>
        </article>

        <article className={detailPanel}>
          <div className={detailPanelHead}>
            <div className="panel-title">{locale === 'zh' ? '最近回测' : 'Recent Backtests'}</div>
            <div className="panel-badge badge-muted">{recentRuns.length}</div>
          </div>
          {recentRuns.length === 0 ? (
            <EmptyState message={locale === 'zh' ? '暂无回测记录' : 'No backtest runs yet'} />
          ) : (
            <div className={detailRunTable}>
              {recentRuns.slice(0, 8).map((run) => (
                <div className={detailRunRow} key={run.id}>
                  <div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-strong)',
                        fontFamily: 'var(--font-data)',
                      }}
                    >
                      {run.windowLabel}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                      {fmtDate(run.startedAt, locale)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      className={`${run.annualizedReturnPct >= 0 ? 'text-up' : 'text-down'}`}
                      style={{ fontSize: '13px', fontFamily: 'var(--font-data)', fontWeight: 700 }}
                    >
                      {fmtPct(run.annualizedReturnPct)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      Sharpe {fmtNum(run.sharpe)}
                    </div>
                  </div>
                  <span
                    className={`signal-chip signal-${run.status === 'completed' ? 'buy' : run.status === 'failed' ? 'sell' : 'hold'}`}
                    style={{ fontSize: '10px' }}
                  >
                    {run.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </>
  );
}
