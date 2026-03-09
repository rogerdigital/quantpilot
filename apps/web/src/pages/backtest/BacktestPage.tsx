import { useResearchHub } from '../../hooks/useResearchHub.ts';
import { useTradingSystem } from '../../store/trading-system/TradingSystemProvider.tsx';
import { ChartCanvas, SectionHeader, TopMeta } from '../console/components/ConsoleChrome.tsx';
import { useSummary } from '../console/hooks.ts';
import { copy, useLocale } from '../console/i18n.tsx';
import { fmtPct, translateMode, translateRiskLevel, translateRuntimeText } from '../console/utils.ts';

function fmtDateTime(value: string, locale: 'zh' | 'en') {
  if (!value) return '--';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
}

export default function BacktestPage() {
  const { state } = useTradingSystem();
  const { locale } = useLocale();
  const { totalPnlPct } = useSummary();
  const { data, loading, error } = useResearchHub();
  const buyCount = state.stockStates.filter((stock) => stock.signal === 'BUY').length;
  const sellCount = state.stockStates.filter((stock) => stock.signal === 'SELL').length;

  return (
    <>
      <SectionHeader routeKey="backtest" />
      <TopMeta items={[
        { label: copy[locale].labels.marketClock, value: state.marketClock },
        { label: copy[locale].labels.mode, value: translateMode(locale, state.mode) },
        { label: copy[locale].terms.riskLevel, value: translateRiskLevel(locale, state.riskLevel), accent: true },
      ]} />

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '研究权益曲线' : 'Research Equity Curve'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '保留当前运行时权益曲线，作为研究中心的快速上下文；正式回测结果改为从后端研究服务读取。'
                  : 'Keep the runtime equity curve as quick context while formal research outputs are pulled from the backend research service.'}
              </div>
            </div>
            <div className="panel-badge badge-info">BACKTEST</div>
          </div>
          <ChartCanvas kind="equity" />
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '研究中心摘要' : 'Research Center Summary'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '把策略候选、回测队列和人工复核压力压缩成一个平台级概览。'
                  : 'Compress candidate strategies, backtest queue, and review pressure into one platform-level summary.'}
              </div>
            </div>
            <div className="panel-badge badge-warn">{data?.summary.dataSource ? 'SERVICE' : 'LOCAL'}</div>
          </div>
          <div className="status-stack">
            <div className="status-row"><span>{locale === 'zh' ? '候选买入' : 'Candidate buys'}</span><strong>{buyCount}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '候选减仓' : 'Candidate trims'}</span><strong>{sellCount}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '组合收益' : 'Portfolio return'}</span><strong>{fmtPct(totalPnlPct)}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '研究模式' : 'Research mode'}</span><strong>{translateMode(locale, state.mode)}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '已完成回测' : 'Completed runs'}</span><strong>{data?.summary.completedRuns ?? '--'}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '待复核' : 'Review queue'}</span><strong>{data?.summary.reviewQueue ?? '--'}</strong></div>
            <div className="status-copy">{translateRuntimeText(locale, state.decisionCopy)}</div>
            {loading ? <div className="status-copy">{locale === 'zh' ? '正在同步研究服务...' : 'Syncing research service...'}</div> : null}
            {error ? <div className="status-copy">{locale === 'zh' ? `研究服务不可用：${error}` : `Research service unavailable: ${error}`}</div> : null}
          </div>
        </article>
      </section>

      <section className="metrics-grid">
        <article className="metric-tile"><div className="tile-label">{locale === 'zh' ? '候选策略' : 'Candidate Strategies'}</div><div className="tile-value">{data?.summary.candidateStrategies ?? '--'}</div><div className="tile-sub">{locale === 'zh' ? '进入评审与晋级漏斗' : 'Inside the promotion funnel'}</div></article>
        <article className="metric-tile"><div className="tile-label">{locale === 'zh' ? '运行中回测' : 'Running Backtests'}</div><div className="tile-value">{data?.summary.runningRuns ?? '--'}</div><div className="tile-sub">{locale === 'zh' ? '由任务编排层继续接管' : 'To be owned by task orchestration'}</div></article>
        <article className="metric-tile"><div className="tile-label">{locale === 'zh' ? '平均 Sharpe' : 'Average Sharpe'}</div><div className="tile-value">{data?.summary.averageSharpe?.toFixed(2) ?? '--'}</div><div className="tile-sub">{locale === 'zh' ? '基于已完成回测' : 'Across completed runs'}</div></article>
        <article className="metric-tile"><div className="tile-label">{locale === 'zh' ? '平均收益率' : 'Average Return'}</div><div className="tile-value">{data?.summary.averageReturnPct !== undefined ? fmtPct(data.summary.averageReturnPct) : '--'}</div><div className="tile-sub">{data?.summary.asOf ? fmtDateTime(data.summary.asOf, locale) : (locale === 'zh' ? '等待同步' : 'Pending sync')}</div></article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '候选策略注册表' : 'Candidate Strategy Registry'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '后端返回策略目录，作为后续策略管理、参数优化和晋级流程的统一入口。'
                  : 'The backend now returns a strategy catalog that can become the source of truth for strategy management and promotion.'}
              </div>
            </div>
            <div className="panel-badge badge-info">{data?.strategies.length ?? 0}</div>
          </div>
          <div className="focus-list focus-list-terminal">
            {!loading && !data?.strategies.length ? <div className="empty-cell">{locale === 'zh' ? '暂无策略目录' : 'No strategy catalog entries yet.'}</div> : null}
            {data?.strategies.map((item) => (
              <div className="focus-row" key={item.id}>
                <div className="symbol-cell">
                  <strong>{item.name}</strong>
                  <span>{item.summary}</span>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '阶段' : 'Stage'}</span>
                  <strong>{item.status}</strong>
                </div>
                <div className="focus-metric">
                  <span>Sharpe</span>
                  <strong>{item.sharpe.toFixed(2)}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '回撤' : 'Drawdown'}</span>
                  <strong>{fmtPct(item.maxDrawdownPct)}</strong>
                </div>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '回测运行队列' : 'Backtest Run Queue'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '把 queued / running / completed / needs_review 明确拆开，为后续 worker 和审批闸门接管做准备。'
                  : 'Separate queued, running, completed, and needs_review runs now so worker ownership and review gates can plug in later.'}
              </div>
            </div>
            <div className="panel-badge badge-warn">{data?.runs.length ?? 0}</div>
          </div>
          <div className="focus-list focus-list-terminal">
            {!loading && !data?.runs.length ? <div className="empty-cell">{locale === 'zh' ? '暂无回测运行记录' : 'No backtest runs yet.'}</div> : null}
            {data?.runs.map((run) => (
              <div className="focus-row" key={run.id}>
                <div className="symbol-cell">
                  <strong>{run.strategyName}</strong>
                  <span>{run.windowLabel} · {run.summary}</span>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '状态' : 'Status'}</span>
                  <strong>{run.status}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '收益' : 'Return'}</span>
                  <strong>{run.status === 'completed' || run.status === 'needs_review' ? fmtPct(run.annualizedReturnPct) : '--'}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '更新时间' : 'Updated'}</span>
                  <strong>{fmtDateTime(run.completedAt || run.startedAt, locale)}</strong>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
