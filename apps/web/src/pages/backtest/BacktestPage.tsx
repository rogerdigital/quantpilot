import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ApiPermissionError } from '../../app/api/controlPlane.ts';
import { readDeepLinkParams } from '../../modules/console/deepLinks.ts';
import { useSyncedQuerySelection } from '../../modules/console/useSyncedQuerySelection.ts';
import { useResearchNavigationContext } from '../../modules/research/useResearchNavigationContext.ts';
import { useResearchPollingPolicy } from '../../modules/research/useResearchPollingPolicy.ts';
import { queueBacktestRun, reviewBacktestRun } from '../../modules/research/research.service.ts';
import { useBacktestRunDetail } from '../../modules/research/useBacktestRunDetail.ts';
import { useBacktestDetailPanels } from '../../modules/research/useBacktestDetailPanels.ts';
import { useResearchWorkspaceData } from '../../modules/research/useResearchWorkspaceData.ts';
import { useTradingSystem } from '../../store/trading-system/TradingSystemProvider.tsx';
import { ChartCanvas, SectionHeader, TopMeta } from '../console/components/ConsoleChrome.tsx';
import { InspectionEmpty, InspectionListPanel, InspectionMetricsRow, InspectionPanel, InspectionSelectableRow, InspectionStatus } from '../console/components/InspectionPanels.tsx';
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const researchNavigation = useResearchNavigationContext(searchParams, navigate);
  const [submittingStrategyId, setSubmittingStrategyId] = useState('');
  const [reviewingRunId, setReviewingRunId] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [runFilter, setRunFilter] = useState<'all' | 'queued' | 'running' | 'completed' | 'needs_review'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [windowLabel, setWindowLabel] = useState('2024-01-01 -> 2026-03-01');
  const [refreshKey, setRefreshKey] = useState(0);
  const {
    data,
    loading,
    error,
    auditItems,
    auditLoading,
    executionEntries,
    workflowRuns,
    workspaceLoading,
  } = useResearchWorkspaceData({ refreshKey, includeWorkflows: true });
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
  const {
    requestRefresh,
    pollingIntervalMs,
  } = useResearchPollingPolicy({
    enabled: true,
    active: hasActiveRuns,
    onRefresh: () => setRefreshKey((current) => current + 1),
  });
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
  const {
    runId: requestedRunId,
    strategyId: requestedStrategyId,
    timelineId: requestedTimelineId,
    sourcePage,
    auditEventId: requestedAuditEventId,
    workflowStepKey: requestedWorkflowStepKey,
  } = readDeepLinkParams(searchParams);
  const {
    selectedId: selectedRunId,
    setSelectedId: setSelectedRunId,
  } = useSyncedQuerySelection({
    itemIds: filteredRuns.map((run) => run.id),
    queryKey: 'run',
    requestedId: requestedRunId,
    searchParams,
    setSearchParams,
  });
  const selectedRun = filteredRuns.find((run) => run.id === selectedRunId) || filteredRuns[0] || null;
  const { data: runDetail, loading: runDetailLoading, error: runDetailError } = useBacktestRunDetail(selectedRun?.id || '', refreshKey);
  const {
    selectedId: selectedAuditEventId,
    setSelectedId: setSelectedAuditEventId,
  } = useSyncedQuerySelection({
    itemIds: (selectedRun
      ? auditItems
        .filter((item) => {
          const runId = typeof item.metadata?.runId === 'string' ? item.metadata.runId : '';
          return runId === selectedRun.id;
        })
        .slice(0, 6)
        .map((item) => item.id)
      : []),
    queryKey: 'audit',
    requestedId: requestedAuditEventId,
    searchParams,
    setSearchParams,
  });
  const {
    selectedId: selectedWorkflowStepKey,
    setSelectedId: setSelectedWorkflowStepKey,
  } = useSyncedQuerySelection({
    itemIds: (runDetail?.workflow
      || (selectedRun?.workflowRunId
        ? workflowRuns.find((workflow) => workflow.id === selectedRun.workflowRunId) || null
        : null)
    )?.steps.map((step) => step.key) || [],
    queryKey: 'step',
    requestedId: requestedWorkflowStepKey,
    searchParams,
    setSearchParams,
  });
  const {
    selectedRunSnapshot,
    selectedRunAuditItems,
    selectedRunVersionItems,
    selectedRunExecutionEntries,
    selectedWorkflow,
    selectedAuditEvent,
    selectedWorkflowStep,
  } = useBacktestDetailPanels({
    selectedRun,
    runDetail,
    auditItems,
    workflowRuns,
    executionEntries,
    selectedAuditEventId,
    selectedWorkflowStepKey,
  });

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
      requestRefresh();
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
      requestRefresh();
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
              ? `当前展示 ${filteredRuns.length} 条记录，轮询频率 ${pollingIntervalMs / 1000} 秒。`
              : `Showing ${filteredRuns.length} runs. Polling every ${pollingIntervalMs / 1000} seconds.`}
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
              <InspectionSelectableRow
                key={run.id}
                leadTitle={run.strategyName}
                leadCopy={`${run.windowLabel} · ${run.summary}`}
                metrics={[
                  { label: locale === 'zh' ? '状态' : 'Status', value: run.status },
                  { label: locale === 'zh' ? '收益' : 'Return', value: run.status === 'completed' || run.status === 'needs_review' ? fmtPct(run.annualizedReturnPct) : '--' },
                  { label: locale === 'zh' ? '更新时间' : 'Updated', value: fmtDateTime(run.completedAt || run.startedAt, locale) },
                  {
                    label: locale === 'zh' ? '复核' : 'Review',
                    value: run.status === 'needs_review'
                      ? (
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
                      )
                      : (locale === 'zh' ? '无' : 'None'),
                  },
                ]}
                actions={(
                  <button
                    type="button"
                    className="inline-action"
                    disabled={selectedRunId === run.id}
                    onClick={() => setSelectedRunId(run.id)}
                  >
                    {selectedRunId === run.id
                      ? (locale === 'zh' ? '已选中' : 'Selected')
                      : (locale === 'zh' ? '查看' : 'Inspect')}
                  </button>
                )}
              />
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
            {workspaceLoading ? <div className="empty-cell">{locale === 'zh' ? '正在加载研究工作流...' : 'Loading research workflows...'}</div> : null}
            {!workspaceLoading && !visibleWorkflowRuns.length ? <div className="empty-cell">{locale === 'zh' ? '当前筛选条件下没有研究工作流。' : 'No research workflows for the current filter.'}</div> : null}
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

      <section className="panel-grid">
        <InspectionPanel
          title={locale === 'zh' ? '选中回测详情' : 'Selected Backtest Detail'}
          copy={locale === 'zh'
            ? '把单条 run 的回测结果、审计留痕和 workflow 进度聚合到一个视图，减少跨面板对照。'
            : 'Aggregate one run’s result metrics, audit trail, and workflow progress into a single detail view.'}
          badge={selectedRun?.status || '--'}
        >
          {!selectedRun ? (
            <InspectionEmpty>{locale === 'zh' ? '当前没有可查看的回测记录。' : 'No backtest run is available for inspection.'}</InspectionEmpty>
          ) : (
            <div className="status-stack">
              <div className="status-row"><span>{locale === 'zh' ? '策略' : 'Strategy'}</span><strong>{selectedRunSnapshot?.strategyName || '--'}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '窗口' : 'Window'}</span><strong>{selectedRunSnapshot?.windowLabel || '--'}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '收益率' : 'Return'}</span><strong>{selectedRunSnapshot && (selectedRunSnapshot.status === 'completed' || selectedRunSnapshot.status === 'needs_review') ? fmtPct(selectedRunSnapshot.annualizedReturnPct) : '--'}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '最大回撤' : 'Max Drawdown'}</span><strong>{selectedRunSnapshot && (selectedRunSnapshot.status === 'completed' || selectedRunSnapshot.status === 'needs_review') ? fmtPct(selectedRunSnapshot.maxDrawdownPct) : '--'}</strong></div>
              <div className="status-row"><span>Sharpe</span><strong>{selectedRunSnapshot && (selectedRunSnapshot.status === 'completed' || selectedRunSnapshot.status === 'needs_review') ? selectedRunSnapshot.sharpe.toFixed(2) : '--'}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '胜率' : 'Win Rate'}</span><strong>{selectedRunSnapshot && (selectedRunSnapshot.status === 'completed' || selectedRunSnapshot.status === 'needs_review') ? fmtPct(selectedRunSnapshot.winRatePct) : '--'}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '工作流' : 'Workflow'}</span><strong>{selectedWorkflow?.id || selectedRunSnapshot?.workflowRunId || '--'}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '策略阶段' : 'Strategy stage'}</span><strong>{runDetail?.strategy?.status || '--'}</strong></div>
              <div className="settings-actions">
                <button
                  type="button"
                  className="inline-action inline-action-approve"
                  onClick={() => researchNavigation.openStrategyDetail(selectedRunSnapshot?.strategyId || selectedRun?.strategyId || '')}
                >
                  {locale === 'zh' ? '打开策略详情' : 'Open Strategy Detail'}
                </button>
                {sourcePage === 'strategies' && requestedStrategyId ? (
                  <button
                    type="button"
                    className="inline-action"
                    onClick={() => researchNavigation.returnToStrategyTimeline()}
                    >
                      {locale === 'zh' ? '返回策略时间线' : 'Return to Strategy Timeline'}
                    </button>
                ) : null}
                {selectedRunExecutionEntries[0] ? (
                  <button
                    type="button"
                    className="inline-action"
                    onClick={() => researchNavigation.openExecutionDetail(selectedRunExecutionEntries[0].plan.id, {
                      strategyId: selectedRunSnapshot?.strategyId || '',
                      runId: selectedRunSnapshot?.id || '',
                      source: 'backtest',
                    })}
                  >
                    {locale === 'zh' ? '打开执行详情' : 'Open Execution Detail'}
                  </button>
                ) : null}
              </div>
              {runDetailLoading ? <InspectionStatus>{locale === 'zh' ? '正在同步回测详情...' : 'Syncing backtest detail...'}</InspectionStatus> : null}
              {runDetailError ? <InspectionStatus>{locale === 'zh' ? `回测详情加载失败：${runDetailError}` : `Failed to load backtest detail: ${runDetailError}`}</InspectionStatus> : null}
              <InspectionStatus>{selectedRunSnapshot?.summary || (locale === 'zh' ? '当前回测暂无摘要。' : 'No backtest summary is available yet.')}</InspectionStatus>
            </div>
          )}
        </InspectionPanel>
        <InspectionListPanel
          title={locale === 'zh' ? '选中回测审计轨迹' : 'Selected Audit Trail'}
          copy={locale === 'zh'
            ? '只展示当前选中 run 的队列、完成和复核记录。'
            : 'Show only the queue, completion, and review records for the selected run.'}
          badge={selectedRunAuditItems.length}
          badgeClassName="badge-warn"
          terminal
        >
            {!selectedRun ? <InspectionEmpty>{locale === 'zh' ? '先从回测队列选择一条记录。' : 'Select a run from the queue first.'}</InspectionEmpty> : null}
            {selectedRun && !selectedRunAuditItems.length ? <InspectionEmpty>{locale === 'zh' ? '当前 run 暂无审计轨迹。' : 'No audit trail exists for the selected run yet.'}</InspectionEmpty> : null}
            {selectedRunAuditItems.map((item) => (
              <InspectionSelectableRow
                key={item.id}
                leadTitle={item.title}
                leadCopy={item.detail}
                metrics={[
                  { label: locale === 'zh' ? '类型' : 'Type', value: item.type },
                  { label: locale === 'zh' ? '操作人' : 'Actor', value: item.actor },
                  { label: locale === 'zh' ? '时间' : 'Time', value: fmtDateTime(item.createdAt, locale) },
                ]}
                actions={(
                  <button
                    type="button"
                    className="inline-action"
                    disabled={selectedAuditEventId === item.id}
                    onClick={() => setSelectedAuditEventId(item.id)}
                  >
                    {selectedAuditEventId === item.id
                      ? (locale === 'zh' ? '已选中' : 'Selected')
                      : (locale === 'zh' ? '查看' : 'Inspect')}
                  </button>
                )}
              />
            ))}
        </InspectionListPanel>
        <InspectionPanel
          title={locale === 'zh' ? '选中研究事件' : 'Selected Research Event'}
          copy={locale === 'zh'
            ? '钻取当前回测审计事件，便于把 run、审计和 workflow 三条线对到同一个节点。'
            : 'Inspect the selected backtest audit event so the run, audit, and workflow can be aligned to one node.'}
          badge={selectedAuditEvent?.type || '--'}
          badgeClassName="badge-warn"
        >
          {!selectedRun ? (
            <InspectionEmpty>{locale === 'zh' ? '先从回测队列选择一条记录。' : 'Select a run from the queue first.'}</InspectionEmpty>
          ) : !selectedAuditEvent ? (
            <InspectionEmpty>{locale === 'zh' ? '当前 run 还没有可钻取的研究事件。' : 'No research event is available for inspection yet.'}</InspectionEmpty>
          ) : (
            <div className="status-stack">
              <div className="status-row"><span>{locale === 'zh' ? '标题' : 'Title'}</span><strong>{selectedAuditEvent.title}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '类型' : 'Type'}</span><strong>{selectedAuditEvent.type}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '操作人' : 'Actor'}</span><strong>{selectedAuditEvent.actor}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '时间' : 'Time'}</span><strong>{fmtDateTime(selectedAuditEvent.createdAt, locale)}</strong></div>
              <InspectionStatus>{selectedAuditEvent.detail}</InspectionStatus>
            </div>
          )}
        </InspectionPanel>
        <InspectionPanel
          title={locale === 'zh' ? '选中回测工作流' : 'Selected Workflow'}
          copy={locale === 'zh'
            ? '查看当前 run 对应的 task orchestrator 工作流状态和步骤进度。'
            : 'Inspect the task-orchestrator workflow state and step progress for the selected run.'}
          badge={selectedWorkflow?.status || '--'}
        >
          {!selectedRun ? (
            <InspectionEmpty>{locale === 'zh' ? '先从回测队列选择一条记录。' : 'Select a run from the queue first.'}</InspectionEmpty>
          ) : !selectedWorkflow ? (
            <InspectionEmpty>{locale === 'zh' ? '当前 run 还没有可见的 workflow 详情。' : 'No workflow detail is available for the selected run yet.'}</InspectionEmpty>
          ) : (
            <div className="status-stack">
              <div className="status-row"><span>{locale === 'zh' ? '工作流 ID' : 'Workflow ID'}</span><strong>{selectedWorkflow.id}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '状态' : 'Status'}</span><strong>{selectedWorkflow.status}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '尝试次数' : 'Attempts'}</span><strong>{selectedWorkflow.attempt}/{selectedWorkflow.maxAttempts}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '触发方式' : 'Trigger'}</span><strong>{selectedWorkflow.trigger}</strong></div>
              {selectedWorkflow.steps.length ? (
                <div className="focus-list">
                  {selectedWorkflow.steps.map((step) => (
                    <InspectionSelectableRow
                      key={step.key}
                      metrics={[
                        { label: locale === 'zh' ? '步骤' : 'Step', value: step.key },
                        { label: locale === 'zh' ? '状态' : 'Status', value: step.status },
                      ]}
                      actions={(
                        <button
                          type="button"
                          className="inline-action"
                          disabled={selectedWorkflowStepKey === step.key}
                          onClick={() => setSelectedWorkflowStepKey(step.key)}
                        >
                          {selectedWorkflowStepKey === step.key
                            ? (locale === 'zh' ? '已选中' : 'Selected')
                            : (locale === 'zh' ? '查看' : 'Inspect')}
                        </button>
                      )}
                    />
                  ))}
                </div>
              ) : (
                <InspectionStatus>{locale === 'zh' ? '尚未记录步骤进度。' : 'No workflow steps recorded yet.'}</InspectionStatus>
              )}
              <InspectionStatus>{locale === 'zh' ? `最近更新时间 ${fmtDateTime(selectedWorkflow.updatedAt || selectedWorkflow.createdAt, locale)}` : `Last updated ${fmtDateTime(selectedWorkflow.updatedAt || selectedWorkflow.createdAt, locale)}`}</InspectionStatus>
            </div>
          )}
        </InspectionPanel>
        <InspectionPanel
          title={locale === 'zh' ? '选中工作流步骤' : 'Selected Workflow Step'}
          copy={locale === 'zh' ? '把当前 workflow 节点单独展开，便于深链定位到具体步骤。' : 'Expand the current workflow node so deep links can target a specific step.'}
          badge={selectedWorkflowStep?.status || '--'}
          badgeClassName="badge-info"
        >
          {!selectedWorkflow ? (
            <InspectionEmpty>{locale === 'zh' ? '先从回测队列选择一条记录。' : 'Select a run from the queue first.'}</InspectionEmpty>
          ) : !selectedWorkflowStep ? (
            <InspectionEmpty>{locale === 'zh' ? '当前工作流还没有可定位的步骤。' : 'No workflow step is available for inspection yet.'}</InspectionEmpty>
          ) : (
            <div className="status-stack">
              <div className="status-row"><span>{locale === 'zh' ? '步骤' : 'Step'}</span><strong>{selectedWorkflowStep.key}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '状态' : 'Status'}</span><strong>{selectedWorkflowStep.status}</strong></div>
              <InspectionStatus>{locale === 'zh' ? `当前深链已定位到步骤 ${selectedWorkflowStep.key}。` : `The current deep link is focused on step ${selectedWorkflowStep.key}.`}</InspectionStatus>
            </div>
          )}
        </InspectionPanel>
        <InspectionListPanel
          title={locale === 'zh' ? '下游执行承接' : 'Downstream Execution Handoff'}
          copy={locale === 'zh'
            ? '查看当前回测所属策略在执行侧的承接情况，确认研究结果是否已经进入 execution plan。'
            : 'Inspect how the selected run’s strategy is handed off downstream and whether it already produced execution plans.'}
          badge={selectedRunExecutionEntries.length}
          badgeClassName="badge-info"
          terminal
        >
          {!selectedRun ? <InspectionEmpty>{locale === 'zh' ? '先从回测队列选择一条记录。' : 'Select a run from the queue first.'}</InspectionEmpty> : null}
          {selectedRun && !selectedRunExecutionEntries.length ? <InspectionEmpty>{locale === 'zh' ? '当前回测对应策略还没有下游执行计划。' : 'No downstream execution plans exist for this run’s strategy yet.'}</InspectionEmpty> : null}
          {selectedRunExecutionEntries.map((entry) => (
            <InspectionSelectableRow
              key={entry.plan.id}
              leadTitle={entry.plan.summary}
              leadCopy={entry.latestRuntime?.message || `${entry.plan.orderCount} ${locale === 'zh' ? '笔订单候选' : 'candidate orders'}`}
              metrics={[
                { label: locale === 'zh' ? '计划状态' : 'Plan', value: entry.plan.status },
                { label: locale === 'zh' ? '风控' : 'Risk', value: entry.plan.riskStatus },
                { label: locale === 'zh' ? '工作流' : 'Workflow', value: entry.workflow?.status || '--' },
                { label: locale === 'zh' ? '运行时' : 'Runtime', value: entry.latestRuntime ? `${entry.latestRuntime.submittedOrderCount}/${entry.latestRuntime.openOrderCount}` : '--' },
              ]}
              actions={(
                <button
                  type="button"
                  className="inline-action"
                  onClick={() => researchNavigation.openExecutionDetail(entry.plan.id, {
                    strategyId: selectedRunSnapshot?.strategyId || '',
                    runId: selectedRunSnapshot?.id || '',
                    source: 'backtest',
                  })}
                >
                  {locale === 'zh' ? '打开执行详情' : 'Open Execution Detail'}
                </button>
              )}
            />
          ))}
        </InspectionListPanel>
        <InspectionListPanel
          title={locale === 'zh' ? '选中回测版本轨迹' : 'Selected Backtest Version History'}
          copy={locale === 'zh'
            ? '从 audit metadata 回放当前 run 在完成和人工复核时落下的关键绩效快照。'
            : 'Replay the selected run’s key performance snapshots from audit metadata when it completed or was reviewed.'}
          badge={selectedRunVersionItems.length}
          badgeClassName="badge-warn"
          terminal
        >
            {!selectedRun ? <InspectionEmpty>{locale === 'zh' ? '先从回测队列选择一条记录。' : 'Select a run from the queue first.'}</InspectionEmpty> : null}
            {selectedRun && !selectedRunVersionItems.length ? <InspectionEmpty>{locale === 'zh' ? '当前 run 还没有可回放的版本快照。' : 'No version snapshots are available for the selected run yet.'}</InspectionEmpty> : null}
            {selectedRunVersionItems.map((item) => {
              const annualizedReturnPct = typeof item.metadata?.annualizedReturnPct === 'number' ? item.metadata.annualizedReturnPct : null;
              const maxDrawdownPct = typeof item.metadata?.maxDrawdownPct === 'number' ? item.metadata.maxDrawdownPct : null;
              const sharpe = typeof item.metadata?.sharpe === 'number' ? item.metadata.sharpe : null;
              const winRatePct = typeof item.metadata?.winRatePct === 'number' ? item.metadata.winRatePct : null;
              return (
                <InspectionMetricsRow
                  key={item.id}
                  leadTitle={fmtDateTime(item.createdAt, locale)}
                  leadCopy={item.detail}
                  metrics={[
                    { label: locale === 'zh' ? '类型' : 'Type', value: item.type },
                    { label: locale === 'zh' ? '收益/回撤' : 'Return / Drawdown', value: annualizedReturnPct !== null && maxDrawdownPct !== null ? `${annualizedReturnPct.toFixed(1)}% / ${maxDrawdownPct.toFixed(1)}%` : '--' },
                    { label: 'Sharpe', value: sharpe !== null ? sharpe.toFixed(2) : '--' },
                    { label: locale === 'zh' ? '胜率' : 'Win Rate', value: winRatePct !== null ? `${winRatePct.toFixed(1)}%` : '--' },
                  ]}
                />
              );
            })}
        </InspectionListPanel>
      </section>
    </>
  );
}

export default BacktestPage;
