import { useEffect, useState } from 'react';
import type { WorkflowRunRecord } from '@shared-types/trading.ts';
import { ApiPermissionError, fetchTaskWorkflows } from '../../app/api/controlPlane.ts';
import { useAuditFeed } from '../../modules/audit/useAuditFeed.ts';
import { queueBacktestRun, reviewBacktestRun } from '../../modules/research/research.service.ts';
import { useResearchHub } from '../../modules/research/useResearchHub.ts';
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

const WINDOW_PRESETS = [
  '2024-01-01 -> 2026-03-01',
  '2023-01-01 -> 2024-12-31',
  '2025-01-01 -> 2026-03-01',
] as const;

function BacktestPage() {
  const { state, session, hasPermission } = useTradingSystem();
  const { locale } = useLocale();
  const { totalPnlPct } = useSummary();
  const [refreshKey, setRefreshKey] = useState(0);
  const [submittingStrategyId, setSubmittingStrategyId] = useState('');
  const [reviewingRunId, setReviewingRunId] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [runFilter, setRunFilter] = useState<'all' | 'queued' | 'running' | 'completed' | 'needs_review'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [windowLabel, setWindowLabel] = useState('2024-01-01 -> 2026-03-01');
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRunRecord[]>([]);
  const [workflowLoading, setWorkflowLoading] = useState(true);
  const { data, loading, error } = useResearchHub(refreshKey);
  const { items: auditItems, loading: auditLoading } = useAuditFeed(refreshKey);
  const buyCount = state.stockStates.filter((stock) => stock.signal === 'BUY').length;
  const sellCount = state.stockStates.filter((stock) => stock.signal === 'SELL').length;
  const canQueueBacktest = hasPermission('strategy:write');
  const canReviewBacktest = hasPermission('risk:review');
  const filteredRuns = data?.runs.filter((run) => {
    if (runFilter !== 'all' && run.status !== runFilter) {
      return false;
    }
    if (!searchTerm.trim()) {
      return true;
    }
    const keyword = searchTerm.trim().toLowerCase();
    return run.strategyName.toLowerCase().includes(keyword)
      || run.strategyId.toLowerCase().includes(keyword)
      || run.windowLabel.toLowerCase().includes(keyword);
  }) || [];
  const hasActiveRuns = Boolean(data?.runs.some((run) => run.status === 'queued' || run.status === 'running'));
  const visibleRunIds = filteredRuns.map((run) => run.id);
  const visibleWorkflowIds = filteredRuns.map((run) => run.workflowRunId).filter(Boolean);
  const backtestAuditItems = auditItems
    .filter((item) => item.type === 'backtest-run.created' || item.type === 'backtest-run.completed' || item.type === 'backtest-run.reviewed')
    .filter((item) => {
      const runId = typeof item.metadata?.runId === 'string' ? item.metadata.runId : '';
      return !visibleRunIds.length || visibleRunIds.includes(runId);
    })
    .slice(0, 10);
  const visibleWorkflowRuns = workflowRuns
    .filter((workflow) => workflow.workflowId === 'task-orchestrator.backtest-run')
    .filter((workflow) => !visibleWorkflowIds.length || visibleWorkflowIds.includes(workflow.id))
    .slice(0, 10);

  useEffect(() => {
    const pollMs = hasActiveRuns ? 5000 : 15000;
    const timer = window.setInterval(() => {
      setRefreshKey((current) => current + 1);
    }, pollMs);
    return () => window.clearInterval(timer);
  }, [hasActiveRuns]);

  useEffect(() => {
    let active = true;
    setWorkflowLoading(true);

    fetchTaskWorkflows()
      .then((payload) => {
        if (!active) return;
        setWorkflowRuns(Array.isArray(payload?.workflows) ? payload.workflows : []);
      })
      .catch(() => {
        if (!active) return;
        setWorkflowRuns([]);
      })
      .finally(() => {
        if (!active) return;
        setWorkflowLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const handleQueueBacktest = async (strategyId: string) => {
    setSubmittingStrategyId(strategyId);
    setActionMessage('');
    setActionError('');
    try {
      const result = await queueBacktestRun({
        strategyId,
        windowLabel,
        requestedBy: session?.user.id || 'operator',
      });
      setActionMessage(
        locale === 'zh'
          ? `已提交回测任务 ${result.run.strategyName}，窗口 ${result.run.windowLabel}，工作流 ${result.workflow.id} 已入队。`
          : `Queued backtest for ${result.run.strategyName} with window ${result.run.windowLabel}. Workflow ${result.workflow.id} is now pending.`,
      );
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      if (requestError instanceof ApiPermissionError) {
        setActionError(
          locale === 'zh'
            ? `回测操作被拦截：当前会话缺少 ${requestError.missingPermission || 'strategy:write'} 权限。`
            : `Backtest action blocked: this session is missing ${requestError.missingPermission || 'strategy:write'} permission.`,
        );
      } else {
        setActionError(
          locale === 'zh'
            ? `提交回测失败：${requestError instanceof Error ? requestError.message : 'unknown error'}`
            : `Failed to queue backtest: ${requestError instanceof Error ? requestError.message : 'unknown error'}`,
        );
      }
    } finally {
      setSubmittingStrategyId('');
    }
  };

  const handleReviewRun = async (runId: string) => {
    setReviewingRunId(runId);
    setActionMessage('');
    setActionError('');
    try {
      const result = await reviewBacktestRun(runId, {
        reviewedBy: session?.user.id || 'risk-operator',
        summary: locale === 'zh'
          ? '操作员已完成回测复核，允许进入后续研究晋级。'
          : 'Operator completed the backtest review and cleared it for downstream research promotion.',
      });
      setActionMessage(
        locale === 'zh'
          ? `已完成 ${result.run.strategyName} 的人工复核。`
          : `Completed operator review for ${result.run.strategyName}.`,
      );
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      if (requestError instanceof ApiPermissionError) {
        setActionError(
          locale === 'zh'
            ? `复核操作被拦截：当前会话缺少 ${requestError.missingPermission || 'risk:review'} 权限。`
            : `Review action blocked: this session is missing ${requestError.missingPermission || 'risk:review'} permission.`,
        );
      } else {
        setActionError(
          locale === 'zh'
            ? `回测复核失败：${requestError instanceof Error ? requestError.message : 'unknown error'}`
            : `Failed to review backtest: ${requestError instanceof Error ? requestError.message : 'unknown error'}`,
        );
      }
    } finally {
      setReviewingRunId('');
    }
  };

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
              <div className="panel-title">{locale === 'zh' ? '回测参数' : 'Backtest Parameters'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '统一设置本次发起回测使用的时间窗口，候选策略列表会复用这个参数。'
                  : 'Set the date window used by the next backtest request. The candidate strategy list reuses this parameter.'}
              </div>
            </div>
            <div className="panel-badge badge-info">PARAMS</div>
          </div>
          <div className="settings-form-grid">
            <label className="settings-field settings-field-wide">
              <span>{locale === 'zh' ? '时间窗口' : 'Window Label'}</span>
              <input
                disabled={!canQueueBacktest || Boolean(submittingStrategyId)}
                value={windowLabel}
                onChange={(event) => setWindowLabel(event.target.value)}
                placeholder="2024-01-01 -> 2026-03-01"
              />
            </label>
          </div>
          <div className="action-group">
            {WINDOW_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className="inline-action"
                disabled={!canQueueBacktest || Boolean(submittingStrategyId)}
                onClick={() => setWindowLabel(preset)}
              >
                {preset}
              </button>
            ))}
          </div>
          {!canQueueBacktest ? <div className="status-copy">{locale === 'zh' ? '当前会话缺少 strategy:write 权限，不能调整或提交回测参数。' : 'This session is missing strategy:write permission, so backtest parameters stay read-only.'}</div> : null}
        </article>
      </section>

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
            {actionMessage ? <div className="status-copy">{actionMessage}</div> : null}
            {actionError ? <div className="status-copy">{actionError}</div> : null}
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
              <div className="panel-title">{locale === 'zh' ? '回测筛选器' : 'Backtest Filters'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '按状态和关键字收窄研究队列，页面会在活跃任务期间自动轮询。'
                  : 'Filter the research queue by status and keyword. Active queues auto-refresh in the background.'}
              </div>
            </div>
            <div className="panel-badge badge-info">{hasActiveRuns ? 'AUTO POLL' : 'IDLE'}</div>
          </div>
          <div className="settings-form-grid">
            <label className="settings-field">
              <span>{locale === 'zh' ? '状态' : 'Status'}</span>
              <select value={runFilter} onChange={(event) => setRunFilter(event.target.value as typeof runFilter)}>
                <option value="all">{locale === 'zh' ? '全部' : 'All'}</option>
                <option value="queued">queued</option>
                <option value="running">running</option>
                <option value="completed">completed</option>
                <option value="needs_review">needs_review</option>
              </select>
            </label>
            <label className="settings-field settings-field-wide">
              <span>{locale === 'zh' ? '关键字' : 'Keyword'}</span>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={locale === 'zh' ? '按策略名、ID 或窗口筛选' : 'Filter by strategy name, id, or window'}
              />
            </label>
          </div>
          <div className="status-copy">
            {locale === 'zh'
              ? `当前展示 ${filteredRuns.length} 条记录，轮询频率 ${hasActiveRuns ? '5 秒' : '15 秒'}。`
              : `Showing ${filteredRuns.length} runs. Polling every ${hasActiveRuns ? '5 seconds' : '15 seconds'}.`}
          </div>
        </article>
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
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '动作' : 'Action'}</span>
                  <button
                    type="button"
                    className="inline-action inline-action-approve"
                    disabled={!canQueueBacktest || submittingStrategyId === item.id}
                    onClick={() => handleQueueBacktest(item.id)}
                  >
                    {submittingStrategyId === item.id
                      ? (locale === 'zh' ? '提交中...' : 'Queueing...')
                      : (locale === 'zh' ? '发起回测' : 'Queue Backtest')}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="status-copy">
            {locale === 'zh'
              ? `当前发起回测会复用窗口 ${windowLabel}。`
              : `New backtests currently reuse the window ${windowLabel}.`}
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
            <div className="panel-badge badge-warn">{filteredRuns.length}</div>
          </div>
          <div className="focus-list focus-list-terminal">
            {!loading && !filteredRuns.length ? <div className="empty-cell">{locale === 'zh' ? '当前筛选条件下没有回测记录' : 'No backtest runs match the current filter.'}</div> : null}
            {filteredRuns.map((run) => (
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
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '复核' : 'Review'}</span>
                  {run.status === 'needs_review' ? (
                    <button
                      type="button"
                      className="inline-action"
                      disabled={!canReviewBacktest || reviewingRunId === run.id}
                      onClick={() => handleReviewRun(run.id)}
                    >
                      {reviewingRunId === run.id
                        ? (locale === 'zh' ? '处理中...' : 'Reviewing...')
                        : (locale === 'zh' ? '人工复核' : 'Approve Review')}
                    </button>
                  ) : (
                    <strong>{locale === 'zh' ? '无' : 'None'}</strong>
                  )}
                </div>
              </div>
            ))}
          </div>
          {!canReviewBacktest ? <div className="status-copy">{locale === 'zh' ? '当前会话缺少 risk:review 权限，不能处理待复核回测。' : 'This session is missing risk:review permission, so review-queue runs stay read-only.'}</div> : null}
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '研究操作历史' : 'Research Activity Feed'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '把回测入队、worker 完成和人工复核的审计记录汇总到同一面板，并跟随当前筛选条件联动。'
                  : 'Aggregate queue, worker completion, and manual review audit records into one panel that follows the current run filter.'}
              </div>
            </div>
            <div className="panel-badge badge-info">AUDIT</div>
          </div>
          <div className="focus-list focus-list-terminal">
            {auditLoading ? <div className="empty-cell">{locale === 'zh' ? '正在加载研究操作历史...' : 'Loading research activity...'}</div> : null}
            {!auditLoading && !backtestAuditItems.length ? <div className="empty-cell">{locale === 'zh' ? '当前筛选条件下没有研究操作历史。' : 'No research activity for the current filter.'}</div> : null}
            {backtestAuditItems.map((item) => {
              const runId = typeof item.metadata?.runId === 'string' ? item.metadata.runId : '--';
              const status = typeof item.metadata?.status === 'string' ? item.metadata.status : '--';
              const workflowRunId = typeof item.metadata?.workflowRunId === 'string' ? item.metadata.workflowRunId : '--';
              return (
                <div className="focus-row" key={item.id}>
                  <div className="symbol-cell">
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </div>
                  <div className="focus-metric">
                    <span>{locale === 'zh' ? 'Run ID' : 'Run ID'}</span>
                    <strong>{runId}</strong>
                  </div>
                  <div className="focus-metric">
                    <span>{locale === 'zh' ? '状态' : 'Status'}</span>
                    <strong>{status}</strong>
                  </div>
                  <div className="focus-metric">
                    <span>{locale === 'zh' ? '工作流' : 'Workflow'}</span>
                    <strong>{workflowRunId}</strong>
                  </div>
                  <div className="focus-metric">
                    <span>{locale === 'zh' ? '时间' : 'Time'}</span>
                    <strong>{fmtDateTime(item.createdAt, locale)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '研究工作流状态' : 'Research Workflow State'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '直接读取 task orchestrator 的 workflow runs，把回测记录和编排层状态、尝试次数、步骤进度放在同一视图。'
                  : 'Read task-orchestrator workflow runs directly so each backtest can be viewed alongside orchestration status, attempt count, and step progress.'}
              </div>
            </div>
            <div className="panel-badge badge-warn">{visibleWorkflowRuns.length}</div>
          </div>
          <div className="focus-list focus-list-terminal">
            {workflowLoading ? <div className="empty-cell">{locale === 'zh' ? '正在加载研究工作流...' : 'Loading research workflows...'}</div> : null}
            {!workflowLoading && !visibleWorkflowRuns.length ? <div className="empty-cell">{locale === 'zh' ? '当前筛选条件下没有研究工作流。' : 'No research workflows for the current filter.'}</div> : null}
            {visibleWorkflowRuns.map((workflow) => {
              const completedSteps = workflow.steps.filter((step) => step.status === 'completed').length;
              return (
                <div className="focus-row" key={workflow.id}>
                  <div className="symbol-cell">
                    <strong>{workflow.id}</strong>
                    <span>{workflow.workflowId}</span>
                  </div>
                  <div className="focus-metric">
                    <span>{locale === 'zh' ? '状态' : 'Status'}</span>
                    <strong>{workflow.status}</strong>
                  </div>
                  <div className="focus-metric">
                    <span>{locale === 'zh' ? '尝试' : 'Attempt'}</span>
                    <strong>{workflow.attempt}/{workflow.maxAttempts}</strong>
                  </div>
                  <div className="focus-metric">
                    <span>{locale === 'zh' ? '步骤' : 'Steps'}</span>
                    <strong>{completedSteps}/{workflow.steps.length || 0}</strong>
                  </div>
                  <div className="focus-metric">
                    <span>{locale === 'zh' ? '更新时间' : 'Updated'}</span>
                    <strong>{fmtDateTime(workflow.updatedAt || workflow.createdAt, locale)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </>
  );
}

export default BacktestPage;
