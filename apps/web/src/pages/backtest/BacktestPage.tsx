import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ApiPermissionError } from '../../app/api/controlPlane.ts';
import { ChartCanvas, SectionHeader, TopMeta } from '../../components/layout/ConsoleChrome.tsx';
import { useSummary } from '../../modules/console/console.hooks.ts';
import { copy, useLocale } from '../../modules/console/console.i18n.tsx';
import {
  fmtPct,
  translateMode,
  translateRiskLevel,
  translateRuntimeText,
} from '../../modules/console/console.utils.ts';
import { readDeepLinkParams } from '../../modules/console/deepLinks.ts';
import { useSyncedQuerySelection } from '../../modules/console/useSyncedQuerySelection.ts';
import {
  formatPermissionDisabled,
  formatPermissionError,
} from '../../modules/permissions/permissionCopy.ts';
import { BacktestCandidateStrategyRow } from '../../modules/research/BacktestCandidateStrategyRow.tsx';
import { BacktestRunQueueRow } from '../../modules/research/BacktestRunQueueRow.tsx';
import {
  ResearchActionBar,
  ResearchActionButton,
} from '../../modules/research/ResearchActionBar.tsx';
import { ResearchAuditFeedRow } from '../../modules/research/ResearchAuditFeedRow.tsx';
import { ResearchCollectionPanel } from '../../modules/research/ResearchCollectionPanel.tsx';
import { ResearchDetailInspectionPanel } from '../../modules/research/ResearchDetailInspectionPanel.tsx';
import { ResearchEventInspectionPanel } from '../../modules/research/ResearchEventInspectionPanel.tsx';
import { ResearchExecutionPlanRow } from '../../modules/research/ResearchExecutionPlanRow.tsx';
import { ResearchStatusPanel } from '../../modules/research/ResearchStatusPanel.tsx';
import { ResearchTerminalPanel } from '../../modules/research/ResearchTerminalPanel.tsx';
import { ResearchVersionSnapshotRow } from '../../modules/research/ResearchVersionSnapshotRow.tsx';
import { ResearchWorkflowStepRow } from '../../modules/research/ResearchWorkflowStepRow.tsx';
import {
  evaluateBacktestRunItem,
  queueBacktestRun,
  reviewBacktestRun,
} from '../../modules/research/research.service.ts';
import { getBacktestCollectionConfigs } from '../../modules/research/researchCollectionConfigs.ts';
import { getBacktestDetailInspectionConfig } from '../../modules/research/researchDetailConfigs.ts';
import {
  getWorkflowInspectionConfig,
  getWorkflowStepInspectionConfig,
} from '../../modules/research/researchInspectionConfigs.ts';
import { getBacktestStatusConfig } from '../../modules/research/researchStatusConfigs.ts';
import { getBacktestTerminalConfigs } from '../../modules/research/researchTerminalConfigs.tsx';
import { useBacktestDetailPanels } from '../../modules/research/useBacktestDetailPanels.ts';
import { useBacktestRunDetail } from '../../modules/research/useBacktestRunDetail.ts';
import { useResearchNavigationContext } from '../../modules/research/useResearchNavigationContext.ts';
import { useResearchPollingPolicy } from '../../modules/research/useResearchPollingPolicy.ts';
import { useResearchWorkspaceData } from '../../modules/research/useResearchWorkspaceData.ts';
import { useTradingSystem } from '../../store/trading-system/TradingSystemProvider.tsx';
import { InspectionStatus } from '../console/components/InspectionPanels.tsx';

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

function getWorkbenchLaneLabel(locale: 'zh' | 'en', key: string) {
  if (locale === 'zh') {
    if (key === 'ready-promote') return '可晋级';
    if (key === 'ready-execution') return '可进入执行准备';
    if (key === 'await-report') return '待生成报告';
    if (key === 'await-evaluation') return '待生成评估';
    return '阻塞或返工';
  }
  if (key === 'ready-promote') return 'Ready For Promotion';
  if (key === 'ready-execution') return 'Ready For Execution Prep';
  if (key === 'await-report') return 'Awaiting Reports';
  if (key === 'await-evaluation') return 'Awaiting Evaluation';
  return 'Blocked Or Rework';
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
  const [evaluatingRunId, setEvaluatingRunId] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [runFilter, setRunFilter] = useState<
    'all' | 'queued' | 'running' | 'completed' | 'needs_review'
  >('all');
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
  const taskSummary = data?.taskSummary || {
    total: 0,
    queued: 0,
    running: 0,
    needsReview: 0,
    completed: 0,
    failed: 0,
    active: 0,
    byType: [],
    byStrategy: [],
  };
  const workbenchSummary = data?.workbench?.summary || {
    totalStrategies: 0,
    activeStrategies: 0,
    candidateStrategies: 0,
    readyToPromote: 0,
    readyForExecution: 0,
    waitingForReport: 0,
    needsEvaluation: 0,
    blocked: 0,
    staleStrategies: 0,
  };
  const workbenchLanes = data?.workbench?.lanes || [];
  const promotionQueue = data?.workbench?.promotionQueue || [];
  const comparisonRows = data?.workbench?.comparisons || [];
  const coverageRows = data?.workbench?.coverage || [];
  const governanceActions = data?.governanceActions || [];
  const governanceSummary = data?.governanceSummary || {
    total: 0,
    promote: 0,
    refreshBacktests: 0,
    evaluate: 0,
    latestCreatedAt: '',
  };
  const handoffs = data?.handoffs || [];
  const handoffSummary = data?.handoffSummary || {
    total: 0,
    ready: 0,
    queued: 0,
    blocked: 0,
    paper: 0,
    live: 0,
  };
  const filteredTasks =
    data?.tasks?.filter((task) => {
      if (runFilter !== 'all' && task.status !== runFilter) {
        return false;
      }
      if (!searchTerm.trim()) {
        return true;
      }
      const keyword = searchTerm.trim().toLowerCase();
      return (
        task.title.toLowerCase().includes(keyword) ||
        task.strategyName.toLowerCase().includes(keyword) ||
        task.strategyId.toLowerCase().includes(keyword) ||
        task.windowLabel.toLowerCase().includes(keyword) ||
        task.workflowRunId.toLowerCase().includes(keyword)
      );
    }) || [];
  const filteredRuns =
    data?.runs.filter((run) => {
      if (runFilter !== 'all' && run.status !== runFilter) {
        return false;
      }
      if (!searchTerm.trim()) {
        return true;
      }
      const keyword = searchTerm.trim().toLowerCase();
      return (
        run.strategyName.toLowerCase().includes(keyword) ||
        run.strategyId.toLowerCase().includes(keyword) ||
        run.windowLabel.toLowerCase().includes(keyword)
      );
    }) || [];
  const hasActiveRuns = Boolean(
    data?.runs.some((run) => run.status === 'queued' || run.status === 'running')
  );
  const { requestRefresh, pollingIntervalMs } = useResearchPollingPolicy({
    enabled: true,
    active: hasActiveRuns,
    onRefresh: () => setRefreshKey((current) => current + 1),
  });
  const visibleRunIds = filteredRuns.map((run) => run.id);
  const visibleWorkflowIds = filteredRuns.map((run) => run.workflowRunId).filter(Boolean);
  const backtestAuditItems = auditItems
    .filter(
      (item) =>
        item.type === 'backtest-run.created' ||
        item.type === 'backtest-run.completed' ||
        item.type === 'backtest-run.reviewed'
    )
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
  const { selectedId: selectedRunId, setSelectedId: setSelectedRunId } = useSyncedQuerySelection({
    itemIds: filteredRuns.map((run) => run.id),
    queryKey: 'run',
    requestedId: requestedRunId,
    searchParams,
    setSearchParams,
  });
  const selectedRun =
    filteredRuns.find((run) => run.id === selectedRunId) || filteredRuns[0] || null;
  const {
    data: runDetail,
    loading: runDetailLoading,
    error: runDetailError,
  } = useBacktestRunDetail(selectedRun?.id || '', refreshKey);
  const { selectedId: selectedAuditEventId, setSelectedId: setSelectedAuditEventId } =
    useSyncedQuerySelection({
      itemIds: selectedRun
        ? auditItems
            .filter((item) => {
              const runId = typeof item.metadata?.runId === 'string' ? item.metadata.runId : '';
              return runId === selectedRun.id;
            })
            .slice(0, 6)
            .map((item) => item.id)
        : [],
      queryKey: 'audit',
      requestedId: requestedAuditEventId,
      searchParams,
      setSearchParams,
    });
  const { selectedId: selectedWorkflowStepKey, setSelectedId: setSelectedWorkflowStepKey } =
    useSyncedQuerySelection({
      itemIds:
        (
          runDetail?.workflow ||
          (selectedRun?.workflowRunId
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
    latestEvaluation,
    evaluations,
    latestReport,
    reports,
  } = useBacktestDetailPanels({
    selectedRun,
    runDetail,
    auditItems,
    workflowRuns,
    executionEntries,
    selectedAuditEventId,
    selectedWorkflowStepKey,
  });
  const selectedWorkflowInspection = getWorkflowInspectionConfig(
    locale,
    selectedRun,
    selectedWorkflow,
    fmtDateTime
  );
  const selectedWorkflowStepInspection = getWorkflowStepInspectionConfig(
    locale,
    selectedWorkflow,
    selectedWorkflowStep
  );
  const selectedBacktestDetailInspection = getBacktestDetailInspectionConfig(
    locale,
    selectedRun,
    selectedRunSnapshot,
    selectedWorkflow,
    runDetail,
    fmtPct
  );
  const backtestCollectionConfigs = getBacktestCollectionConfigs(locale, Boolean(selectedRun), {
    audit: selectedRunAuditItems.length,
    execution: selectedRunExecutionEntries.length,
    versions: selectedRunVersionItems.length,
  });
  const backtestTerminalConfigs = getBacktestTerminalConfigs({
    locale,
    loading,
    auditLoading,
    workspaceLoading,
    strategyCount: data?.strategies.length ?? 0,
    filteredRunCount: filteredRuns.length,
    taskCount: filteredTasks.length,
    activeTaskCount: taskSummary.active,
    auditCount: backtestAuditItems.length,
    workflowCount: visibleWorkflowRuns.length,
    windowLabel,
    canReviewBacktest,
  });
  const backtestStatusConfig = getBacktestStatusConfig({
    locale,
    dataSourceBadge: data?.summary.dataSource ? 'SERVICE' : 'LOCAL',
    buyCount,
    sellCount,
    portfolioReturn: fmtPct(totalPnlPct),
    researchMode: translateMode(locale, state.mode),
    completedRuns: data?.summary.completedRuns,
    reviewQueue: data?.summary.reviewQueue,
    decisionCopy: translateRuntimeText(locale, state.decisionCopy),
    actionMessage,
    actionError,
    loading,
    error,
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
          : `Queued backtest for ${result.run.strategyName} with window ${result.run.windowLabel}. Workflow ${result.workflow.id} is now pending.`
      );
      requestRefresh();
    } catch (requestError) {
      if (requestError instanceof ApiPermissionError) {
        setActionError(
          formatPermissionError(
            locale,
            requestError,
            '回测提交失败',
            'Backtest queue failed',
            '回测操作',
            'Backtest action'
          )
        );
      } else {
        setActionError(
          locale === 'zh'
            ? `提交回测失败：${requestError instanceof Error ? requestError.message : 'unknown error'}`
            : `Failed to queue backtest: ${requestError instanceof Error ? requestError.message : 'unknown error'}`
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
        summary:
          locale === 'zh'
            ? '操作员已完成回测复核，允许进入后续研究晋级。'
            : 'Operator completed the backtest review and cleared it for downstream research promotion.',
      });
      setActionMessage(
        locale === 'zh'
          ? `已完成 ${result.run.strategyName} 的人工复核。`
          : `Completed operator review for ${result.run.strategyName}.`
      );
      requestRefresh();
    } catch (requestError) {
      if (requestError instanceof ApiPermissionError) {
        setActionError(
          formatPermissionError(
            locale,
            requestError,
            '复核操作失败',
            'Review action failed',
            '复核操作',
            'Review action'
          )
        );
      } else {
        setActionError(
          locale === 'zh'
            ? `回测复核失败：${requestError instanceof Error ? requestError.message : 'unknown error'}`
            : `Failed to review backtest: ${requestError instanceof Error ? requestError.message : 'unknown error'}`
        );
      }
    } finally {
      setReviewingRunId('');
    }
  };

  const handleEvaluateRun = async (runId: string) => {
    setEvaluatingRunId(runId);
    setActionMessage('');
    setActionError('');
    try {
      const result = await evaluateBacktestRunItem(runId, {
        actor: session?.user.id || 'research-operator',
        summary:
          locale === 'zh'
            ? '研究负责人已完成结果评估，并同步给后续晋级与执行准备流程。'
            : 'Research lead completed the evaluation and synced it into promotion and execution preparation.',
      });
      setActionMessage(
        locale === 'zh'
          ? `已完成研究评估，当前结论：${result.evaluation.verdict}。`
          : `Completed research evaluation with verdict ${result.evaluation.verdict}.`
      );
      requestRefresh();
    } catch (requestError) {
      if (requestError instanceof ApiPermissionError) {
        setActionError(
          formatPermissionError(
            locale,
            requestError,
            '评估操作失败',
            'Evaluation action failed',
            '研究评估',
            'Research evaluation'
          )
        );
      } else {
        setActionError(
          locale === 'zh'
            ? `研究评估失败：${requestError instanceof Error ? requestError.message : 'unknown error'}`
            : `Failed to evaluate research run: ${requestError instanceof Error ? requestError.message : 'unknown error'}`
        );
      }
    } finally {
      setEvaluatingRunId('');
    }
  };

  return (
    <>
      <SectionHeader routeKey="backtest" />
      <TopMeta
        items={[
          { label: copy[locale].labels.marketClock, value: state.marketClock },
          { label: copy[locale].labels.mode, value: translateMode(locale, state.mode) },
          {
            label: copy[locale].terms.riskLevel,
            value: translateRiskLevel(locale, state.riskLevel),
            accent: true,
          },
        ]}
      />

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">
                {locale === 'zh' ? '回测参数' : 'Backtest Parameters'}
              </div>
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
          {!canQueueBacktest ? (
            <div className="status-copy">
              {formatPermissionDisabled(
                locale,
                'strategy:write',
                '调整或提交回测参数',
                'adjust or submit backtest parameters'
              )}
            </div>
          ) : null}
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">
                {locale === 'zh' ? '研究权益曲线' : 'Research Equity Curve'}
              </div>
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
        <ResearchStatusPanel
          title={locale === 'zh' ? '研究中心摘要' : 'Research Center Summary'}
          copy={
            locale === 'zh'
              ? '把策略候选、回测队列和人工复核压力压缩成一个平台级概览。'
              : 'Compress candidate strategies, backtest queue, and review pressure into one platform-level summary.'
          }
          badge={backtestStatusConfig.badge}
          badgeClassName="panel-badge badge-warn"
          metrics={backtestStatusConfig.metrics}
          messages={backtestStatusConfig.messages}
        />
      </section>

      <section className="metrics-grid">
        <article className="metric-tile">
          <div className="tile-label">{locale === 'zh' ? '候选策略' : 'Candidate Strategies'}</div>
          <div className="tile-value">{data?.summary.candidateStrategies ?? '--'}</div>
          <div className="tile-sub">
            {locale === 'zh' ? '进入评审与晋级漏斗' : 'Inside the promotion funnel'}
          </div>
        </article>
        <article className="metric-tile">
          <div className="tile-label">{locale === 'zh' ? '运行中回测' : 'Running Backtests'}</div>
          <div className="tile-value">{data?.summary.runningRuns ?? '--'}</div>
          <div className="tile-sub">
            {locale === 'zh' ? '由任务编排层继续接管' : 'To be owned by task orchestration'}
          </div>
        </article>
        <article className="metric-tile">
          <div className="tile-label">
            {locale === 'zh' ? '活跃研究任务' : 'Active Research Tasks'}
          </div>
          <div className="tile-value">{taskSummary.active}</div>
          <div className="tile-sub">
            {locale === 'zh'
              ? 'queued / running / needs_review'
              : 'queued / running / needs_review'}
          </div>
        </article>
        <article className="metric-tile">
          <div className="tile-label">{locale === 'zh' ? '平均 Sharpe' : 'Average Sharpe'}</div>
          <div className="tile-value">{data?.summary.averageSharpe?.toFixed(2) ?? '--'}</div>
          <div className="tile-sub">
            {locale === 'zh' ? '基于已完成回测' : 'Across completed runs'}
          </div>
        </article>
        <article className="metric-tile">
          <div className="tile-label">{locale === 'zh' ? '平均收益率' : 'Average Return'}</div>
          <div className="tile-value">
            {data?.summary.averageReturnPct !== undefined
              ? fmtPct(data.summary.averageReturnPct)
              : '--'}
          </div>
          <div className="tile-sub">
            {data?.summary.asOf
              ? fmtDateTime(data.summary.asOf, locale)
              : locale === 'zh'
                ? '等待同步'
                : 'Pending sync'}
          </div>
        </article>
        <article className="metric-tile">
          <div className="tile-label">
            {locale === 'zh' ? '平均超额收益' : 'Average Excess Return'}
          </div>
          <div className="tile-value">
            {data?.resultSummary ? fmtPct(data.resultSummary.averageExcessReturnPct) : '--'}
          </div>
          <div className="tile-sub">
            {locale === 'zh' ? '来自结果模型' : 'Derived from result versions'}
          </div>
        </article>
        <article className="metric-tile">
          <div className="tile-label">
            {locale === 'zh' ? '研究评估结论' : 'Research Evaluations'}
          </div>
          <div className="tile-value">{data?.evaluationSummary?.total ?? '--'}</div>
          <div className="tile-sub">
            {locale === 'zh' ? '连接晋级与执行准备' : 'Bridges promotion and execution prep'}
          </div>
        </article>
        <article className="metric-tile">
          <div className="tile-label">{locale === 'zh' ? '研究报告资产' : 'Research Reports'}</div>
          <div className="tile-value">{data?.reportSummary?.total ?? '--'}</div>
          <div className="tile-sub">
            {locale === 'zh' ? '异步沉淀后的研究交付物' : 'Asynchronous research deliverables'}
          </div>
        </article>
        <article className="metric-tile">
          <div className="tile-label">{locale === 'zh' ? '待评估策略' : 'Awaiting Evaluation'}</div>
          <div className="tile-value">{workbenchSummary.needsEvaluation}</div>
          <div className="tile-sub">
            {locale === 'zh'
              ? '结果已出但治理链路未完成'
              : 'Results exist but governance is not complete'}
          </div>
        </article>
        <article className="metric-tile">
          <div className="tile-label">{locale === 'zh' ? '待出报告策略' : 'Awaiting Reports'}</div>
          <div className="tile-value">{workbenchSummary.waitingForReport}</div>
          <div className="tile-sub">
            {locale === 'zh'
              ? '评估已完成，等待异步资产沉淀'
              : 'Evaluations are done, waiting on async assets'}
          </div>
        </article>
        <article className="metric-tile">
          <div className="tile-label">{locale === 'zh' ? '治理动作' : 'Governance Actions'}</div>
          <div className="tile-value">{governanceSummary.total}</div>
          <div className="tile-sub">
            {governanceSummary.latestCreatedAt
              ? fmtDateTime(governanceSummary.latestCreatedAt, locale)
              : locale === 'zh'
                ? '等待治理动作'
                : 'Waiting for governance activity'}
          </div>
        </article>
        <article className="metric-tile">
          <div className="tile-label">
            {locale === 'zh' ? '执行交接对象' : 'Execution Handoffs'}
          </div>
          <div className="tile-value">{handoffSummary.total}</div>
          <div className="tile-sub">
            {locale === 'zh'
              ? '研究链路正式移交到执行台'
              : 'Formal research packages handed into execution'}
          </div>
        </article>
        <article className="metric-tile">
          <div className="tile-label">
            {locale === 'zh' ? '研究任务失败' : 'Failed Research Tasks'}
          </div>
          <div className="tile-value">{taskSummary.failed}</div>
          <div className="tile-sub">
            {locale === 'zh'
              ? '阶段 2 统一失败面板入口'
              : 'The unified failure entrypoint for stage 2'}
          </div>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">
                {locale === 'zh' ? '研究运营台' : 'Research Operations Workbench'}
              </div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '把结果、评估、报告和晋级治理统一收成一份服务端快照，避免在页面里手动拼接研究运营状态。'
                  : 'Collapse results, evaluations, reports, and promotion governance into one backend snapshot instead of reconstructing research operations in the page.'}
              </div>
            </div>
            <div className="panel-badge badge-info">
              {data?.workbench?.asOf ? fmtDateTime(data.workbench.asOf, locale) : 'WORKBENCH'}
            </div>
          </div>
          <div className="status-stack">
            <div className="status-row">
              <span>{locale === 'zh' ? '可晋级策略' : 'Ready To Promote'}</span>
              <strong>{workbenchSummary.readyToPromote}</strong>
            </div>
            <div className="status-row">
              <span>{locale === 'zh' ? '可进入执行准备' : 'Ready For Execution Prep'}</span>
              <strong>{workbenchSummary.readyForExecution}</strong>
            </div>
            <div className="status-row">
              <span>{locale === 'zh' ? '待评估' : 'Awaiting Evaluation'}</span>
              <strong>{workbenchSummary.needsEvaluation}</strong>
            </div>
            <div className="status-row">
              <span>{locale === 'zh' ? '待出报告' : 'Awaiting Reports'}</span>
              <strong>{workbenchSummary.waitingForReport}</strong>
            </div>
            <div className="status-row">
              <span>{locale === 'zh' ? '阻塞或返工' : 'Blocked Or Rework'}</span>
              <strong>{workbenchSummary.blocked}</strong>
            </div>
            <div className="status-row">
              <span>{locale === 'zh' ? '陈旧策略' : 'Stale Strategies'}</span>
              <strong>{workbenchSummary.staleStrategies}</strong>
            </div>
          </div>
          {workbenchLanes.length ? (
            <div className="focus-list">
              {workbenchLanes.map((lane) => (
                <div className="focus-row" key={lane.key}>
                  <div className="symbol-cell">
                    <strong>{getWorkbenchLaneLabel(locale, lane.key)}</strong>
                    <span>{lane.headline}</span>
                  </div>
                  <div className="focus-metric">
                    <span>{locale === 'zh' ? '数量' : 'Count'}</span>
                    <strong>{lane.count}</strong>
                  </div>
                  <div className="focus-metric">
                    <span>{locale === 'zh' ? '策略' : 'Strategies'}</span>
                    <strong>{lane.strategyIds.slice(0, 3).join(', ') || '--'}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="status-copy">
              {locale === 'zh'
                ? '当前还没有研究运营快照。'
                : 'No research workbench snapshot is available yet.'}
            </div>
          )}
        </article>
        <ResearchCollectionPanel
          title={locale === 'zh' ? '晋级治理队列' : 'Promotion Governance Queue'}
          copy={
            locale === 'zh'
              ? '把 ready / pending / blocked 的研究资产统一排进一个动作队列，直接跳到策略或回测详情继续处理。'
              : 'Place ready, pending, and blocked research assets into one action queue so the next review step is obvious.'
          }
          badge={promotionQueue.length}
          terminal
          isEmpty={promotionQueue.length === 0}
          emptyMessage={
            locale === 'zh' ? '当前还没有研究治理队列。' : 'No governance queue is available yet.'
          }
        >
          {promotionQueue.map((item) => (
            <div className="focus-row" key={item.strategyId}>
              <div className="symbol-cell">
                <strong>{item.strategyName}</strong>
                <span>
                  {item.strategyStatus} · {item.latestRunLabel || item.strategyId}
                </span>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '评估' : 'Evaluation'}</span>
                <strong>{item.evaluationVerdict}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '报告' : 'Report'}</span>
                <strong>
                  {item.reportStatus === 'ready' ? item.reportVerdict : item.reportStatus}
                </strong>
              </div>
              <div className="focus-metric">
                <span>Sharpe</span>
                <strong>{item.sharpe !== null ? item.sharpe.toFixed(2) : '--'}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '超额收益' : 'Excess'}</span>
                <strong>
                  {item.excessReturnPct !== null ? fmtPct(item.excessReturnPct) : '--'}
                </strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '动作' : 'Action'}</span>
                <strong>{item.recommendedAction}</strong>
              </div>
              <div className="action-group">
                <button
                  type="button"
                  className="inline-action"
                  onClick={() => researchNavigation.openStrategyDetail(item.strategyId)}
                >
                  {locale === 'zh' ? '打开策略' : 'Open Strategy'}
                </button>
                {item.latestRunId ? (
                  <button
                    type="button"
                    className="inline-action"
                    onClick={() => setSelectedRunId(item.latestRunId)}
                  >
                    {locale === 'zh' ? '查看回测' : 'Inspect Run'}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </ResearchCollectionPanel>
        <ResearchCollectionPanel
          title={locale === 'zh' ? '结果对比榜' : 'Research Comparison Board'}
          copy={
            locale === 'zh'
              ? '按超额收益和 Sharpe 对当前策略进行横向比较，让研究工作台具备真正的结果治理视角。'
              : 'Compare strategies by excess return and Sharpe so the research workspace can operate as a governance board, not just a list of runs.'
          }
          badge={comparisonRows.length}
          terminal
          isEmpty={comparisonRows.length === 0}
          emptyMessage={
            locale === 'zh'
              ? '当前还没有可对比的研究结果。'
              : 'No comparable research results are available yet.'
          }
        >
          {comparisonRows.map((item) => (
            <ResearchVersionSnapshotRow
              key={item.strategyId}
              leadTitle={`${item.strategyName} · ${item.strategyStatus}`}
              leadCopy={`${item.recommendedAction} · ${item.latestRunLabel || item.latestRunId || '--'}`}
              metrics={[
                {
                  label: locale === 'zh' ? '超额收益' : 'Excess Return',
                  value: item.excessReturnPct !== null ? fmtPct(item.excessReturnPct) : '--',
                },
                {
                  label: locale === 'zh' ? '收益/回撤' : 'Return / Drawdown',
                  value:
                    item.annualizedReturnPct !== null && item.maxDrawdownPct !== null
                      ? `${fmtPct(item.annualizedReturnPct)} / ${fmtPct(item.maxDrawdownPct)}`
                      : '--',
                },
                { label: 'Sharpe', value: item.sharpe !== null ? item.sharpe.toFixed(2) : '--' },
                {
                  label: locale === 'zh' ? '评估/报告' : 'Evaluation / Report',
                  value: `${item.evaluationVerdict} / ${item.reportVerdict}`,
                },
              ]}
            />
          ))}
        </ResearchCollectionPanel>
        <ResearchCollectionPanel
          title={locale === 'zh' ? '研究资产覆盖度' : 'Research Asset Coverage'}
          copy={
            locale === 'zh'
              ? '直接查看每个策略当前缺哪一层研究资产，方便快速判断是缺 result、evaluation 还是 report。'
              : 'See which research asset layer is missing per strategy so operators know whether result, evaluation, or report coverage is incomplete.'
          }
          badge={coverageRows.length}
          terminal
          isEmpty={coverageRows.length === 0}
          emptyMessage={
            locale === 'zh'
              ? '当前没有研究资产覆盖信息。'
              : 'No research asset coverage data is available yet.'
          }
        >
          {coverageRows.map((item) => (
            <ResearchVersionSnapshotRow
              key={item.strategyId}
              leadTitle={`${item.strategyName} · ${item.coverage}`}
              leadCopy={item.note}
              metrics={[
                { label: locale === 'zh' ? '阶段' : 'Stage', value: item.strategyStatus },
                {
                  label: locale === 'zh' ? '最近 run' : 'Latest run',
                  value: item.latestRunId || '--',
                },
                {
                  label: locale === 'zh' ? '更新时间' : 'Updated',
                  value: fmtDateTime(item.updatedAt, locale),
                },
              ]}
            />
          ))}
        </ResearchCollectionPanel>
        <ResearchCollectionPanel
          title={locale === 'zh' ? '研究治理留痕' : 'Research Governance Trail'}
          copy={
            locale === 'zh'
              ? '把批量晋级、补跑回测、补做评估和基线/冠军切换统一沉淀成一条治理动作历史。'
              : 'Capture promotion, refresh, evaluation, and baseline/champion updates as one governance action history.'
          }
          badge={governanceActions.length}
          terminal
          isEmpty={governanceActions.length === 0}
          emptyMessage={
            locale === 'zh'
              ? '当前还没有研究治理动作。'
              : 'No governance activity has been recorded yet.'
          }
        >
          {governanceActions.map((item) => (
            <ResearchVersionSnapshotRow
              key={item.id}
              leadTitle={`${item.title} · ${item.actor}`}
              leadCopy={item.detail}
              metrics={[
                { label: locale === 'zh' ? '级别' : 'Level', value: item.level },
                {
                  label: locale === 'zh' ? '时间' : 'Created',
                  value: fmtDateTime(item.createdAt, locale),
                },
                {
                  label: locale === 'zh' ? '晋级/补跑/评估' : 'Promote / Refresh / Evaluate',
                  value: `${governanceSummary.promote} / ${governanceSummary.refreshBacktests} / ${governanceSummary.evaluate}`,
                },
              ]}
            />
          ))}
        </ResearchCollectionPanel>
        <ResearchCollectionPanel
          title={locale === 'zh' ? '执行交接队列' : 'Execution Handoff Queue'}
          copy={
            locale === 'zh'
              ? '查看哪些策略已经完成研究闭环并形成正式交接对象，直接跳到策略详情或执行台继续处理。'
              : 'Review which strategies have become formal execution handoffs and jump straight into strategy detail or the execution desk.'
          }
          badge={handoffs.length}
          terminal
          isEmpty={handoffs.length === 0}
          emptyMessage={
            locale === 'zh'
              ? '当前还没有研究交接对象。'
              : 'No execution handoffs are available yet.'
          }
        >
          {handoffs.map((item) => (
            <div className="focus-row" key={item.id}>
              <div className="symbol-cell">
                <strong>{item.strategyName}</strong>
                <span>{item.summary}</span>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '状态' : 'Handoff'}</span>
                <strong>{item.handoffStatus}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '模式' : 'Mode'}</span>
                <strong>{item.mode}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '审批/风险' : 'Approval / Risk'}</span>
                <strong>
                  {item.approvalState} / {item.riskStatus}
                </strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '订单' : 'Orders'}</span>
                <strong>{item.orderCount}</strong>
              </div>
              <div className="action-group">
                <button
                  type="button"
                  className="inline-action"
                  onClick={() => researchNavigation.openStrategyDetail(item.strategyId)}
                >
                  {locale === 'zh' ? '打开策略' : 'Open Strategy'}
                </button>
                {item.runId ? (
                  <button
                    type="button"
                    className="inline-action"
                    onClick={() => setSelectedRunId(item.runId)}
                  >
                    {locale === 'zh' ? '查看回测' : 'Inspect Run'}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="inline-action"
                  onClick={() =>
                    navigate(
                      `/execution?strategy=${item.strategyId}&handoff=${item.id}&source=backtest`
                    )
                  }
                >
                  {locale === 'zh' ? '打开执行台' : 'Open Execution Desk'}
                </button>
              </div>
            </div>
          ))}
        </ResearchCollectionPanel>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">
                {locale === 'zh' ? '回测筛选器' : 'Backtest Filters'}
              </div>
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
              <select
                value={runFilter}
                onChange={(event) => setRunFilter(event.target.value as typeof runFilter)}
              >
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
                placeholder={
                  locale === 'zh'
                    ? '按策略名、ID 或窗口筛选'
                    : 'Filter by strategy name, id, or window'
                }
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
        <ResearchTerminalPanel {...backtestTerminalConfigs.catalog}>
          {data?.strategies.map((item) => (
            <BacktestCandidateStrategyRow
              key={item.id}
              locale={locale}
              item={item}
              canQueueBacktest={canQueueBacktest}
              submittingStrategyId={submittingStrategyId}
              formatPercent={fmtPct}
              onQueue={handleQueueBacktest}
            />
          ))}
        </ResearchTerminalPanel>
        <ResearchTerminalPanel {...backtestTerminalConfigs.queue}>
          {filteredRuns.map((run) => (
            <BacktestRunQueueRow
              key={run.id}
              locale={locale}
              run={run}
              selectedRunId={selectedRunId}
              canReviewBacktest={canReviewBacktest}
              reviewingRunId={reviewingRunId}
              formatDateTime={fmtDateTime}
              formatPercent={fmtPct}
              onReview={handleReviewRun}
              onInspect={setSelectedRunId}
            />
          ))}
        </ResearchTerminalPanel>
        <ResearchTerminalPanel {...backtestTerminalConfigs.tasks}>
          {filteredTasks.map((task) => (
            <div className="focus-row" key={task.id}>
              <div className="symbol-cell">
                <strong>{task.title}</strong>
                <span>{task.id}</span>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '状态' : 'Status'}</span>
                <strong>{task.status}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '策略' : 'Strategy'}</span>
                <strong>{task.strategyName || '--'}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '检查点' : 'Checkpoint'}</span>
                <strong>{task.latestCheckpoint || '--'}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '工作流' : 'Workflow'}</span>
                <strong>{task.workflowRunId || '--'}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '更新时间' : 'Updated'}</span>
                <strong>{fmtDateTime(task.updatedAt || task.createdAt, locale)}</strong>
              </div>
            </div>
          ))}
        </ResearchTerminalPanel>
        <ResearchTerminalPanel {...backtestTerminalConfigs.activity}>
          {backtestAuditItems.map((item) => {
            const runId = typeof item.metadata?.runId === 'string' ? item.metadata.runId : '--';
            const status = typeof item.metadata?.status === 'string' ? item.metadata.status : '--';
            const workflowRunId =
              typeof item.metadata?.workflowRunId === 'string' ? item.metadata.workflowRunId : '--';
            return (
              <ResearchAuditFeedRow
                key={item.id}
                locale={locale}
                item={item}
                formatDateTime={fmtDateTime}
                metrics={[
                  { label: 'Run ID', value: runId },
                  { label: locale === 'zh' ? '状态' : 'Status', value: status },
                  { label: locale === 'zh' ? '工作流' : 'Workflow', value: workflowRunId },
                ]}
              />
            );
          })}
        </ResearchTerminalPanel>
        <ResearchTerminalPanel {...backtestTerminalConfigs.workflows}>
          {visibleWorkflowRuns.map((workflow) => {
            const completedSteps = workflow.steps.filter(
              (step) => step.status === 'completed'
            ).length;
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
                  <strong>
                    {workflow.attempt}/{workflow.maxAttempts}
                  </strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '步骤' : 'Steps'}</span>
                  <strong>
                    {completedSteps}/{workflow.steps.length || 0}
                  </strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '更新时间' : 'Updated'}</span>
                  <strong>{fmtDateTime(workflow.updatedAt || workflow.createdAt, locale)}</strong>
                </div>
              </div>
            );
          })}
        </ResearchTerminalPanel>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">
                {locale === 'zh' ? '研究任务分布' : 'Research Task Distribution'}
              </div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '把研究任务总量、活跃量和按策略分布提前拉平，后面阶段 2 的研究晋级、评估和推广都会复用这条骨架。'
                  : 'Flatten the research task totals, active pressure, and strategy spread now so later stage-2 evaluation and promotion flows can reuse the same backbone.'}
              </div>
            </div>
            <div className="panel-badge badge-warn">{taskSummary.total}</div>
          </div>
          <div className="status-stack">
            <div className="status-row">
              <span>{locale === 'zh' ? '排队任务' : 'Queued Tasks'}</span>
              <strong>{taskSummary.queued}</strong>
            </div>
            <div className="status-row">
              <span>{locale === 'zh' ? '运行中任务' : 'Running Tasks'}</span>
              <strong>{taskSummary.running}</strong>
            </div>
            <div className="status-row">
              <span>{locale === 'zh' ? '待复核任务' : 'Needs Review'}</span>
              <strong>{taskSummary.needsReview}</strong>
            </div>
            <div className="status-row">
              <span>{locale === 'zh' ? '已完成任务' : 'Completed Tasks'}</span>
              <strong>{taskSummary.completed}</strong>
            </div>
            <div className="status-row">
              <span>{locale === 'zh' ? '失败任务' : 'Failed Tasks'}</span>
              <strong>{taskSummary.failed}</strong>
            </div>
            {taskSummary.byStrategy.slice(0, 3).map((item) => (
              <div key={item.strategyId || item.strategyName} className="status-row">
                <span>{item.strategyName}</span>
                <strong>
                  {locale === 'zh'
                    ? `${item.activeCount}/${item.count} 活跃`
                    : `${item.activeCount}/${item.count} active`}
                </strong>
              </div>
            ))}
          </div>
        </article>
        <ResearchDetailInspectionPanel
          title={locale === 'zh' ? '选中回测详情' : 'Selected Backtest Detail'}
          copy={
            locale === 'zh'
              ? '把单条 run 的回测结果、审计留痕和 workflow 进度聚合到一个视图，减少跨面板对照。'
              : 'Aggregate one run’s result metrics, audit trail, and workflow progress into a single detail view.'
          }
          badge={selectedRun?.status || '--'}
          emptyMessage={selectedBacktestDetailInspection.emptyMessage}
          metrics={selectedBacktestDetailInspection.metrics}
        >
          <ResearchActionBar>
            <ResearchActionButton
              label={locale === 'zh' ? '打开策略详情' : 'Open Strategy Detail'}
              priority="primary"
              onClick={() =>
                researchNavigation.openStrategyDetail(
                  selectedRunSnapshot?.strategyId || selectedRun?.strategyId || ''
                )
              }
            />
            {selectedRunSnapshot ? (
              <ResearchActionButton
                label={
                  evaluatingRunId === selectedRunSnapshot.id
                    ? locale === 'zh'
                      ? '正在评估...'
                      : 'Evaluating...'
                    : locale === 'zh'
                      ? '评估晋级结论'
                      : 'Evaluate Promotion'
                }
                onClick={() => {
                  if (!canReviewBacktest || evaluatingRunId === selectedRunSnapshot.id) return;
                  void handleEvaluateRun(selectedRunSnapshot.id);
                }}
              />
            ) : null}
            {sourcePage === 'strategies' && requestedStrategyId ? (
              <ResearchActionButton
                label={locale === 'zh' ? '返回策略时间线' : 'Return to Strategy Timeline'}
                onClick={() => researchNavigation.returnToStrategyTimeline()}
              />
            ) : null}
            {selectedRunExecutionEntries[0] ? (
              <ResearchActionButton
                label={locale === 'zh' ? '打开执行详情' : 'Open Execution Detail'}
                onClick={() =>
                  researchNavigation.openExecutionDetail(selectedRunExecutionEntries[0].plan.id, {
                    strategyId: selectedRunSnapshot?.strategyId || '',
                    runId: selectedRunSnapshot?.id || '',
                    source: 'backtest',
                  })
                }
              />
            ) : null}
          </ResearchActionBar>
          {runDetailLoading ? (
            <InspectionStatus>
              {locale === 'zh' ? '正在同步回测详情...' : 'Syncing backtest detail...'}
            </InspectionStatus>
          ) : null}
          {runDetailError ? (
            <InspectionStatus>
              {locale === 'zh'
                ? `回测详情加载失败：${runDetailError}`
                : `Failed to load backtest detail: ${runDetailError}`}
            </InspectionStatus>
          ) : null}
          <InspectionStatus>{selectedBacktestDetailInspection.summary}</InspectionStatus>
        </ResearchDetailInspectionPanel>
        <ResearchEventInspectionPanel
          title={locale === 'zh' ? '评估与晋级建议' : 'Evaluation And Promotion Guidance'}
          copy={
            locale === 'zh'
              ? '把回测结果评估结论沉淀成正式对象，再驱动策略晋级和执行准备。'
              : 'Turn the reviewed backtest result into a formal evaluation object that can drive promotion and execution preparation.'
          }
          badge={latestEvaluation?.verdict || '--'}
          badgeClassName="badge-info"
          emptyMessage={
            !selectedRun
              ? locale === 'zh'
                ? '先从回测队列选择一条记录。'
                : 'Select a run from the queue first.'
              : !latestEvaluation
                ? locale === 'zh'
                  ? '当前 run 还没有评估结论，先发起评估。'
                  : 'No evaluation exists for this run yet. Start an evaluation first.'
                : null
          }
          metrics={[
            {
              label: locale === 'zh' ? '结论' : 'Verdict',
              value: latestEvaluation?.verdict || '--',
            },
            {
              label: locale === 'zh' ? '准备度' : 'Readiness',
              value: latestEvaluation?.readiness || '--',
            },
            {
              label: locale === 'zh' ? '评分带' : 'Score band',
              value: latestEvaluation?.scoreBand || '--',
            },
            {
              label: locale === 'zh' ? '推荐动作' : 'Recommended action',
              value: latestEvaluation?.recommendedAction || '--',
            },
          ]}
          detail={latestEvaluation?.summary}
          guidance={
            locale === 'zh'
              ? '评估完成后，策略页会直接复用这条正式结论来决定是否允许晋级。'
              : 'Once completed, the strategy workspace reuses this evaluation record to decide whether promotion is allowed.'
          }
        />
        <ResearchEventInspectionPanel
          title={locale === 'zh' ? '最新研究报告' : 'Latest Research Report'}
          copy={
            locale === 'zh'
              ? '评估完成后，研究报告会转成异步任务并沉淀成可复用资产。'
              : 'After evaluation, the research report is generated through an asynchronous task and stored as a reusable asset.'
          }
          badge={latestReport?.verdict || '--'}
          badgeClassName="badge-warn"
          emptyMessage={
            !selectedRun
              ? locale === 'zh'
                ? '先从回测队列选择一条记录。'
                : 'Select a run from the queue first.'
              : !latestReport
                ? locale === 'zh'
                  ? '当前 run 还没有生成研究报告，等待 report workflow 完成。'
                  : 'No research report exists for this run yet. Wait for the report workflow to complete.'
                : null
          }
          metrics={[
            { label: locale === 'zh' ? '结论' : 'Verdict', value: latestReport?.verdict || '--' },
            {
              label: locale === 'zh' ? '准备度' : 'Readiness',
              value: latestReport?.readiness || '--',
            },
            {
              label: locale === 'zh' ? '创建时间' : 'Created',
              value: latestReport ? fmtDateTime(latestReport.createdAt, locale) : '--',
            },
          ]}
          detail={latestReport?.executiveSummary}
          guidance={latestReport?.promotionCall || undefined}
        />
        <ResearchCollectionPanel {...backtestCollectionConfigs.audit}>
          {selectedRunAuditItems.map((item) => (
            <ResearchAuditFeedRow
              key={item.id}
              locale={locale}
              item={item}
              formatDateTime={fmtDateTime}
              selected={selectedAuditEventId === item.id}
              onInspect={setSelectedAuditEventId}
              metrics={[{ label: locale === 'zh' ? '类型' : 'Type', value: item.type }]}
            />
          ))}
        </ResearchCollectionPanel>
        <ResearchEventInspectionPanel
          title={locale === 'zh' ? '选中研究事件' : 'Selected Research Event'}
          copy={
            locale === 'zh'
              ? '钻取当前回测审计事件，便于把 run、审计和 workflow 三条线对到同一个节点。'
              : 'Inspect the selected backtest audit event so the run, audit, and workflow can be aligned to one node.'
          }
          badge={selectedAuditEvent?.type || '--'}
          badgeClassName="badge-warn"
          emptyMessage={
            !selectedRun
              ? locale === 'zh'
                ? '先从回测队列选择一条记录。'
                : 'Select a run from the queue first.'
              : !selectedAuditEvent
                ? locale === 'zh'
                  ? '当前 run 还没有可钻取的研究事件。'
                  : 'No research event is available for inspection yet.'
                : null
          }
          metrics={[
            { label: locale === 'zh' ? '标题' : 'Title', value: selectedAuditEvent?.title || '--' },
            { label: locale === 'zh' ? '类型' : 'Type', value: selectedAuditEvent?.type || '--' },
            {
              label: locale === 'zh' ? '操作人' : 'Actor',
              value: selectedAuditEvent?.actor || '--',
            },
            {
              label: locale === 'zh' ? '时间' : 'Time',
              value: selectedAuditEvent ? fmtDateTime(selectedAuditEvent.createdAt, locale) : '--',
            },
          ]}
          detail={selectedAuditEvent?.detail}
        />
        <ResearchEventInspectionPanel
          title={locale === 'zh' ? '选中回测工作流' : 'Selected Workflow'}
          copy={
            locale === 'zh'
              ? '查看当前 run 对应的 task orchestrator 工作流状态和步骤进度。'
              : 'Inspect the task-orchestrator workflow state and step progress for the selected run.'
          }
          badge={selectedWorkflow?.status || '--'}
          emptyMessage={selectedWorkflowInspection.emptyMessage}
          metrics={selectedWorkflowInspection.metrics}
          guidance={selectedWorkflowInspection.guidance}
        >
          {selectedWorkflow?.steps.length ? (
            <div className="focus-list">
              {selectedWorkflow.steps.map((step) => (
                <ResearchWorkflowStepRow
                  key={step.key}
                  locale={locale}
                  step={step}
                  selectedStepKey={selectedWorkflowStepKey}
                  onInspect={setSelectedWorkflowStepKey}
                />
              ))}
            </div>
          ) : selectedWorkflow ? (
            <InspectionStatus>
              {locale === 'zh' ? '尚未记录步骤进度。' : 'No workflow steps recorded yet.'}
            </InspectionStatus>
          ) : null}
        </ResearchEventInspectionPanel>
        <ResearchEventInspectionPanel
          title={locale === 'zh' ? '选中工作流步骤' : 'Selected Workflow Step'}
          copy={
            locale === 'zh'
              ? '把当前 workflow 节点单独展开，便于深链定位到具体步骤。'
              : 'Expand the current workflow node so deep links can target a specific step.'
          }
          badge={selectedWorkflowStep?.status || '--'}
          badgeClassName="badge-info"
          emptyMessage={selectedWorkflowStepInspection.emptyMessage}
          metrics={selectedWorkflowStepInspection.metrics}
          guidance={selectedWorkflowStepInspection.guidance}
        />
        <ResearchCollectionPanel {...backtestCollectionConfigs.execution}>
          {selectedRunExecutionEntries.map((entry) => (
            <ResearchExecutionPlanRow
              key={entry.plan.id}
              locale={locale}
              entry={entry}
              actionLabel={locale === 'zh' ? '打开执行详情' : 'Open Execution Detail'}
              onAction={(planId) =>
                researchNavigation.openExecutionDetail(planId, {
                  strategyId: selectedRunSnapshot?.strategyId || '',
                  runId: selectedRunSnapshot?.id || '',
                  source: 'backtest',
                })
              }
            />
          ))}
        </ResearchCollectionPanel>
        <ResearchCollectionPanel {...backtestCollectionConfigs.versions}>
          {selectedRunVersionItems.map((item) => {
            return (
              <ResearchVersionSnapshotRow
                key={item.id}
                leadTitle={`${fmtDateTime(item.generatedAt, locale)} · v${item.version}`}
                leadCopy={item.summary}
                metrics={[
                  { label: locale === 'zh' ? '阶段' : 'Stage', value: item.stage },
                  {
                    label: locale === 'zh' ? '收益/回撤' : 'Return / Drawdown',
                    value: `${item.annualizedReturnPct.toFixed(1)}% / ${item.maxDrawdownPct.toFixed(1)}%`,
                  },
                  { label: 'Sharpe', value: item.sharpe.toFixed(2) },
                  {
                    label: locale === 'zh' ? '超额收益' : 'Excess Return',
                    value: `${item.excessReturnPct.toFixed(1)}%`,
                  },
                  {
                    label: locale === 'zh' ? '胜率' : 'Win Rate',
                    value: `${item.winRatePct.toFixed(1)}%`,
                  },
                ]}
              />
            );
          })}
        </ResearchCollectionPanel>
        <ResearchCollectionPanel
          title={locale === 'zh' ? '研究评估记录' : 'Research Evaluations'}
          copy={
            locale === 'zh'
              ? '显示当前 run 已完成的评估记录，作为晋级和执行准备的正式依据。'
              : 'Show the completed evaluation records for the selected run as the formal basis for promotion and execution prep.'
          }
          badge={evaluations.length}
          emptyMessage={
            !selectedRun
              ? locale === 'zh'
                ? '先从回测队列选择一条记录。'
                : 'Select a run from the queue first.'
              : null
          }
        >
          {evaluations.map((item) => (
            <ResearchVersionSnapshotRow
              key={item.id}
              leadTitle={`${fmtDateTime(item.createdAt, locale)} · ${item.verdict}`}
              leadCopy={item.summary}
              metrics={[
                { label: locale === 'zh' ? '准备度' : 'Readiness', value: item.readiness },
                { label: locale === 'zh' ? '评分带' : 'Score band', value: item.scoreBand },
                {
                  label: locale === 'zh' ? '推荐动作' : 'Recommended action',
                  value: item.recommendedAction,
                },
                { label: locale === 'zh' ? '评估人' : 'Actor', value: item.actor },
              ]}
            />
          ))}
        </ResearchCollectionPanel>
        <ResearchCollectionPanel
          title={locale === 'zh' ? '研究报告资产' : 'Research Report Assets'}
          copy={
            locale === 'zh'
              ? '查看异步生成的研究报告，作为后续晋级、执行准备和沟通同步的统一交付物。'
              : 'Review asynchronously generated research reports as the shared deliverable for promotion, execution preparation, and operator handoff.'
          }
          badge={reports.length}
          emptyMessage={
            !selectedRun
              ? locale === 'zh'
                ? '先从回测队列选择一条记录。'
                : 'Select a run from the queue first.'
              : null
          }
        >
          {reports.map((item) => (
            <ResearchVersionSnapshotRow
              key={item.id}
              leadTitle={`${fmtDateTime(item.createdAt, locale)} · ${item.title}`}
              leadCopy={item.executiveSummary}
              metrics={[
                { label: locale === 'zh' ? '结论' : 'Verdict', value: item.verdict },
                { label: locale === 'zh' ? '准备度' : 'Readiness', value: item.readiness },
                {
                  label: locale === 'zh' ? '晋级建议' : 'Promotion call',
                  value: item.promotionCall,
                },
                {
                  label: locale === 'zh' ? '执行准备' : 'Execution prep',
                  value: item.executionPreparation,
                },
              ]}
            />
          ))}
        </ResearchCollectionPanel>
      </section>
    </>
  );
}

export default BacktestPage;
