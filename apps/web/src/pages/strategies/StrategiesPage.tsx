import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ApiPermissionError } from '../../app/api/controlPlane.ts';
import { UniverseTable } from '../../components/business/ConsoleTables.tsx';
import { ChartCanvas, SectionHeader, TopMeta } from '../../components/layout/ConsoleChrome.tsx';
import { onShortcutKeyDown, useSettingsNavigation } from '../../modules/console/console.hooks.ts';
import { copy, useLocale } from '../../modules/console/console.i18n.tsx';
import { translateMode, translateRuntimeText } from '../../modules/console/console.utils.ts';
import { readDeepLinkParams } from '../../modules/console/deepLinks.ts';
import { useSyncedQuerySelection } from '../../modules/console/useSyncedQuerySelection.ts';
import {
  formatPermissionDisabled,
  formatPermissionError,
} from '../../modules/permissions/permissionCopy.ts';
import {
  ResearchActionBar,
  ResearchActionButton,
} from '../../modules/research/ResearchActionBar.tsx';
import { ResearchAuditFeedRow } from '../../modules/research/ResearchAuditFeedRow.tsx';
import { ResearchCollectionPanel } from '../../modules/research/ResearchCollectionPanel.tsx';
import { ResearchDetailInspectionPanel } from '../../modules/research/ResearchDetailInspectionPanel.tsx';
import { ResearchEventInspectionPanel } from '../../modules/research/ResearchEventInspectionPanel.tsx';
import { ResearchExecutionPlanRow } from '../../modules/research/ResearchExecutionPlanRow.tsx';
import { ResearchRunSummaryRow } from '../../modules/research/ResearchRunSummaryRow.tsx';
import { ResearchStatusPanel } from '../../modules/research/ResearchStatusPanel.tsx';
import { ResearchTerminalPanel } from '../../modules/research/ResearchTerminalPanel.tsx';
import { ResearchTimelineEventRow } from '../../modules/research/ResearchTimelineEventRow.tsx';
import { ResearchVersionSnapshotRow } from '../../modules/research/ResearchVersionSnapshotRow.tsx';
import {
  createExecutionCandidateHandoff,
  promoteStrategyCatalogItem,
  runResearchGovernanceAction,
  saveStrategyCatalogItem,
} from '../../modules/research/research.service.ts';
import { getStrategyCollectionConfigs } from '../../modules/research/researchCollectionConfigs.ts';
import { getStrategyDetailInspectionConfig } from '../../modules/research/researchDetailConfigs.ts';
import {
  getStrategyTimelineActionLabel,
  getStrategyTimelineGuidance,
} from '../../modules/research/researchEventInspection.tsx';
import { getStrategyTimelineInspectionConfig } from '../../modules/research/researchInspectionConfigs.ts';
import { getStrategyStatusConfig } from '../../modules/research/researchStatusConfigs.ts';
import { getStrategyTerminalConfigs } from '../../modules/research/researchTerminalConfigs.tsx';
import { StrategyCatalogRow } from '../../modules/research/StrategyCatalogRow.tsx';
import { useResearchNavigationContext } from '../../modules/research/useResearchNavigationContext.ts';
import { useResearchPollingPolicy } from '../../modules/research/useResearchPollingPolicy.ts';
import { useResearchWorkspaceData } from '../../modules/research/useResearchWorkspaceData.ts';
import { useStrategyDetail } from '../../modules/research/useStrategyDetail.ts';
import { useStrategyDetailPanels } from '../../modules/research/useStrategyDetailPanels.ts';
import { useTradingSystem } from '../../store/trading-system/TradingSystemProvider.tsx';
import {
  InspectionEmpty,
  InspectionListPanel,
  InspectionMetricsRow,
  InspectionPanel,
  InspectionSelectableRow,
  InspectionStatus,
} from '../console/components/InspectionPanels.tsx';

const STRATEGY_STAGE_FLOW = ['draft', 'researching', 'candidate', 'paper', 'live'] as const;

function getNextStrategyStage(status: string) {
  const index = STRATEGY_STAGE_FLOW.indexOf(status as (typeof STRATEGY_STAGE_FLOW)[number]);
  if (index === -1 || index === STRATEGY_STAGE_FLOW.length - 1) {
    return null;
  }
  return STRATEGY_STAGE_FLOW[index + 1];
}

function formatDateTime(value: string, locale: 'zh' | 'en') {
  return new Date(value).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US');
}

function StrategiesPage() {
  const { state, session, hasPermission } = useTradingSystem();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const researchNavigation = useResearchNavigationContext(searchParams, navigate);
  const goToSettings = useSettingsNavigation();
  const [registryFilter, setRegistryFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [saving, setSaving] = useState(false);
  const [promotingId, setPromotingId] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [governanceBusy, setGovernanceBusy] = useState('');
  const [selectedGovernanceStrategyIds, setSelectedGovernanceStrategyIds] = useState<string[]>([]);
  const [governanceWindowLabel, setGovernanceWindowLabel] = useState('2024-01-01 -> 2026-03-01');
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState({
    id: 'new-strategy',
    name: '',
    family: 'trend',
    timeframe: '1d',
    universe: 'NASDAQ 100',
    status: 'draft',
    score: '60',
    expectedReturnPct: '10',
    maxDrawdownPct: '8',
    sharpe: '1',
    summary: '',
  });
  const { requestRefresh } = useResearchPollingPolicy({
    onRefresh: () => setRefreshKey((current) => current + 1),
  });
  const { data, loading, error, auditItems, auditLoading, executionEntries, workspaceLoading } =
    useResearchWorkspaceData({ refreshKey });
  const buyCount = state.stockStates.filter((stock) => stock.signal === 'BUY').length;
  const sellCount = state.stockStates.filter((stock) => stock.signal === 'SELL').length;
  const canWriteStrategy = hasPermission('strategy:write');
  const canEvaluateResearch = hasPermission('risk:review');
  const promotedCount =
    data?.strategies.filter((item) => item.status === 'paper' || item.status === 'live').length ||
    0;
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
    baselines: 0,
    champions: 0,
  };
  const promotionQueue = data?.workbench?.promotionQueue || [];
  const comparisonRows = data?.workbench?.comparisons || [];
  const comparisonInsights = data?.workbench?.comparisonInsights || [];
  const comparisonSummary = data?.workbench?.comparisonSummary || {
    baselineStrategyId: '',
    baselineStrategyName: '',
    championStrategyId: '',
    championStrategyName: '',
    baselineUpdatedAt: '',
    championUpdatedAt: '',
    comparedStrategies: 0,
    outperformingBaseline: 0,
    nearChampion: 0,
    trailingBaseline: 0,
  };
  const coverageRows = data?.workbench?.coverage || [];
  const recentGovernanceActions = data?.workbench?.recentActions || [];
  const activeStrategies = data?.strategies.filter((item) => item.status !== 'archived') || [];
  const archivedStrategies = data?.strategies.filter((item) => item.status === 'archived') || [];
  const visibleActiveStrategies = registryFilter === 'archived' ? [] : activeStrategies;
  const visibleArchivedStrategies = registryFilter === 'active' ? [] : archivedStrategies;
  const visibleStrategyIds = [...visibleActiveStrategies, ...visibleArchivedStrategies].map(
    (item) => item.id
  );
  const strategyAuditItems = auditItems
    .filter((item) => item.type === 'strategy-catalog.saved')
    .filter((item) => {
      const strategyId =
        typeof item.metadata?.strategyId === 'string' ? item.metadata.strategyId : '';
      return registryFilter === 'all' ? true : visibleStrategyIds.includes(strategyId);
    })
    .slice(0, 8);
  const { strategyId: requestedStrategyId, timelineId: requestedTimelineId } =
    readDeepLinkParams(searchParams);
  const { selectedId: selectedStrategyId, setSelectedId: setSelectedStrategyId } =
    useSyncedQuerySelection({
      itemIds: [...visibleActiveStrategies, ...visibleArchivedStrategies].map((item) => item.id),
      queryKey: 'strategy',
      requestedId: requestedStrategyId,
      searchParams,
      setSearchParams,
    });
  const selectedStrategy =
    [...visibleActiveStrategies, ...visibleArchivedStrategies].find(
      (item) => item.id === selectedStrategyId
    ) ||
    visibleActiveStrategies[0] ||
    visibleArchivedStrategies[0] ||
    null;
  const {
    data: strategyDetail,
    loading: strategyDetailLoading,
    error: strategyDetailError,
  } = useStrategyDetail(selectedStrategy?.id || '', refreshKey);
  const { selectedId: selectedTimelineId, setSelectedId: setSelectedTimelineId } =
    useSyncedQuerySelection({
      itemIds: selectedStrategy
        ? [
            ...auditItems
              .filter((item) => item.type === 'strategy-catalog.saved')
              .filter((item) => {
                const strategyId =
                  typeof item.metadata?.strategyId === 'string' ? item.metadata.strategyId : '';
                return strategyId === selectedStrategy.id;
              })
              .slice(0, 6)
              .map((item) => `audit-${item.id}`),
            ...(
              strategyDetail?.recentRuns?.slice(0, 6) ||
              data?.runs.filter((item) => item.strategyId === selectedStrategy.id).slice(0, 6) ||
              []
            ).map((run) => `run-${run.id}`),
            ...(strategyDetail?.recentResults?.slice(0, 6) || []).map(
              (result) => `result-${result.id}`
            ),
            ...executionEntries
              .filter((entry) => entry.plan.strategyId === selectedStrategy.id)
              .slice(0, 6)
              .map((entry) => `execution-${entry.plan.id}`),
          ]
        : [],
      queryKey: 'timeline',
      requestedId: requestedTimelineId,
      searchParams,
      setSearchParams,
    });
  const {
    selectedStrategySnapshot,
    selectedStrategyRuns,
    selectedStrategyAuditItems,
    selectedStrategyVersionItems,
    selectedStrategyExecutionEntries,
    selectedStrategyTimelineItems,
    selectedTimelineItem,
    replaySummary,
    latestResult,
    latestReport,
    latestExecutionHandoff,
    promotionReadiness,
    executionCandidatePreview,
  } = useStrategyDetailPanels({
    locale,
    selectedStrategy,
    strategyDetail,
    auditItems,
    executionEntries,
    allRuns: data?.runs || [],
    selectedTimelineId,
  });
  const selectedTimelineActionLabel = getStrategyTimelineActionLabel(
    locale,
    selectedTimelineItem?.eventType
  );
  const selectedTimelineInspection = getStrategyTimelineInspectionConfig(
    locale,
    selectedStrategy,
    selectedTimelineItem,
    formatDateTime
  );
  const selectedStrategyDetailInspection = getStrategyDetailInspectionConfig(
    locale,
    selectedStrategy,
    selectedStrategySnapshot,
    strategyDetail
  );
  const strategyCollectionConfigs = getStrategyCollectionConfigs(
    locale,
    Boolean(selectedStrategy),
    workspaceLoading,
    {
      runs: selectedStrategyRuns.length,
      execution: selectedStrategyExecutionEntries.length,
      audit: selectedStrategyAuditItems.length,
      versions: selectedStrategyVersionItems.length,
    }
  );
  const strategyTerminalConfigs = getStrategyTerminalConfigs({
    locale,
    dataSourceBadge: data?.summary.dataSource ? 'SERVICE' : 'LOCAL',
    loading,
    auditLoading,
    registryFilter,
    activeCount: activeStrategies.length,
    archivedCount: archivedStrategies.length,
    visibleCount: visibleActiveStrategies.length + visibleArchivedStrategies.length,
    activityCount: strategyAuditItems.length,
    onFilterChange: setRegistryFilter,
  });
  const strategyStatusConfig = getStrategyStatusConfig({
    locale,
    catalogSize: data?.strategies.length,
    candidateStrategies: data?.summary.candidateStrategies,
    promotedCount,
    executionRoute: translateMode(locale, state.mode),
    canWriteStrategy,
    loading,
    error,
  });

  const handleFormChange = (key: keyof typeof form, value: string) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSaveStrategy = async () => {
    setSaving(true);
    setSaveMessage('');
    setSaveError('');
    try {
      const result = await saveStrategyCatalogItem({
        ...form,
        score: Number(form.score),
        expectedReturnPct: Number(form.expectedReturnPct),
        maxDrawdownPct: Number(form.maxDrawdownPct),
        sharpe: Number(form.sharpe),
        updatedBy: session?.user.id || 'operator',
      });
      setSaveMessage(
        locale === 'zh'
          ? `策略 ${result.strategy?.name || form.name} 已写入注册表。`
          : `Strategy ${result.strategy?.name || form.name} was saved to the registry.`
      );
      requestRefresh();
    } catch (requestError) {
      if (requestError instanceof ApiPermissionError) {
        setSaveError(
          formatPermissionError(
            locale,
            requestError,
            '保存策略失败',
            'Strategy save failed',
            '保存策略',
            'Strategy save'
          )
        );
      } else {
        setSaveError(
          locale === 'zh'
            ? `保存策略失败：${requestError instanceof Error ? requestError.message : 'unknown error'}`
            : `Failed to save strategy: ${requestError instanceof Error ? requestError.message : 'unknown error'}`
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditStrategy = (strategy: NonNullable<typeof data>['strategies'][number]) => {
    setForm({
      id: strategy.id,
      name: strategy.name,
      family: strategy.family,
      timeframe: strategy.timeframe,
      universe: strategy.universe,
      status: strategy.status,
      score: String(strategy.score),
      expectedReturnPct: String(strategy.expectedReturnPct),
      maxDrawdownPct: String(strategy.maxDrawdownPct),
      sharpe: String(strategy.sharpe),
      summary: strategy.summary,
    });
    setSaveMessage(
      locale === 'zh'
        ? `已将 ${strategy.name} 填充到编辑表单。`
        : `Loaded ${strategy.name} into the edit form.`
    );
    setSaveError('');
  };

  const handlePromoteStrategy = async (
    strategy: NonNullable<typeof data>['strategies'][number]
  ) => {
    const nextStatus = getNextStrategyStage(strategy.status);
    if (!nextStatus) return;

    setPromotingId(strategy.id);
    setSaveMessage('');
    setSaveError('');
    try {
      const result = await promoteStrategyCatalogItem(strategy.id, {
        actor: session?.user.id || 'operator',
        nextStatus,
        summary:
          locale === 'zh'
            ? `操作员依据最新研究评估将策略晋级到 ${nextStatus}。`
            : `Operator promoted the strategy to ${nextStatus} based on the latest research evaluation.`,
      });
      setSaveMessage(
        locale === 'zh'
          ? `策略 ${result.strategy?.name || strategy.name} 已晋级到 ${nextStatus}。`
          : `Strategy ${result.strategy?.name || strategy.name} was promoted to ${nextStatus}.`
      );
      requestRefresh();
    } catch (requestError) {
      if (requestError instanceof ApiPermissionError) {
        setSaveError(
          formatPermissionError(
            locale,
            requestError,
            '策略晋级失败',
            'Strategy promotion failed',
            '策略晋级',
            'Strategy promotion'
          )
        );
      } else {
        setSaveError(
          locale === 'zh'
            ? `策略晋级失败：${requestError instanceof Error ? requestError.message : 'unknown error'}`
            : `Failed to promote strategy: ${requestError instanceof Error ? requestError.message : 'unknown error'}`
        );
      }
    } finally {
      setPromotingId('');
    }
  };

  const handleArchiveStrategy = async (
    strategy: NonNullable<typeof data>['strategies'][number]
  ) => {
    const nextStatus = strategy.status === 'archived' ? 'draft' : 'archived';

    setPromotingId(strategy.id);
    setSaveMessage('');
    setSaveError('');
    try {
      const result = await saveStrategyCatalogItem({
        ...strategy,
        status: nextStatus,
        updatedBy: session?.user.id || 'operator',
      });
      setSaveMessage(
        locale === 'zh'
          ? nextStatus === 'archived'
            ? `策略 ${result.strategy?.name || strategy.name} 已归档。`
            : `策略 ${result.strategy?.name || strategy.name} 已恢复到 draft。`
          : nextStatus === 'archived'
            ? `Strategy ${result.strategy?.name || strategy.name} was archived.`
            : `Strategy ${result.strategy?.name || strategy.name} was restored to draft.`
      );
      requestRefresh();
    } catch (requestError) {
      if (requestError instanceof ApiPermissionError) {
        setSaveError(
          formatPermissionError(
            locale,
            requestError,
            '策略状态更新失败',
            'Failed to update strategy lifecycle state',
            '策略归档',
            'Strategy archive'
          )
        );
      } else {
        setSaveError(
          locale === 'zh'
            ? `策略状态更新失败：${requestError instanceof Error ? requestError.message : 'unknown error'}`
            : `Failed to update strategy lifecycle state: ${requestError instanceof Error ? requestError.message : 'unknown error'}`
        );
      }
    } finally {
      setPromotingId('');
    }
  };

  const selectedGovernanceEntries = promotionQueue.filter((item) =>
    selectedGovernanceStrategyIds.includes(item.strategyId)
  );
  const selectedGovernanceRunIds = selectedGovernanceEntries
    .map((item) => item.latestRunId)
    .filter(Boolean);

  const toggleGovernanceSelection = (strategyId: string) => {
    setSelectedGovernanceStrategyIds((current) =>
      current.includes(strategyId)
        ? current.filter((item) => item !== strategyId)
        : [...current, strategyId]
    );
  };

  const handleGovernanceAction = async (
    action:
      | 'promote_strategies'
      | 'queue_backtests'
      | 'evaluate_runs'
      | 'set_baseline'
      | 'set_champion'
  ) => {
    setGovernanceBusy(action);
    setSaveMessage('');
    setSaveError('');
    try {
      const result = await runResearchGovernanceAction({
        action,
        actor: session?.user.id || 'research-operator',
        strategyIds: selectedGovernanceStrategyIds,
        runIds: action === 'evaluate_runs' ? selectedGovernanceRunIds : [],
        windowLabel: action === 'queue_backtests' ? governanceWindowLabel : '',
      });
      const successCount = result.successes.length;
      const failureCount = result.failures.length;
      setSaveMessage(
        locale === 'zh'
          ? `研究治理动作已完成：成功 ${successCount} 条，失败 ${failureCount} 条。`
          : `Research governance action completed: ${successCount} succeeded, ${failureCount} failed.`
      );
      requestRefresh();
    } catch (requestError) {
      if (requestError instanceof ApiPermissionError) {
        setSaveError(
          formatPermissionError(
            locale,
            requestError,
            '研究治理动作失败',
            'Research governance action failed',
            '研究治理',
            'Research governance'
          )
        );
      } else {
        setSaveError(
          locale === 'zh'
            ? `研究治理动作失败：${requestError instanceof Error ? requestError.message : 'unknown error'}`
            : `Research governance action failed: ${requestError instanceof Error ? requestError.message : 'unknown error'}`
        );
      }
    } finally {
      setGovernanceBusy('');
    }
  };

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">{copy[locale].desk.strategies}</div>
          <h1>{copy[locale].pages.strategies[0]}</h1>
          <p className="topbar-copy">{copy[locale].pages.strategies[1]}</p>
        </div>
        <TopMeta
          items={[
            { label: copy[locale].labels.marketClock, value: state.marketClock },
            { label: copy[locale].terms.signalSummary, value: `${buyCount} / ${sellCount}` },
            { label: copy[locale].labels.mode, value: translateMode(locale, state.mode) },
          ]}
        />
      </header>

      <section className="hero-grid two-up">
        <div className="hero-card hero-card-primary">
          <div className="card-eyebrow">
            {locale === 'zh' ? 'Strategy Registry' : 'Strategy Registry'}
          </div>
          <div className="mini-metric">{translateRuntimeText(locale, state.decisionSummary)}</div>
          <div className="mini-copy">{translateRuntimeText(locale, state.decisionCopy)}</div>
        </div>
        <article
          className="hero-card shortcut-surface"
          role="button"
          tabIndex={0}
          onClick={() => goToSettings('policy')}
          onKeyDown={(event) => onShortcutKeyDown(event, () => goToSettings('policy'))}
        >
          <div className="card-eyebrow">
            {locale === 'zh' ? 'Execution Plan' : 'Execution Plan'}
          </div>
          <div className="mini-metric">{translateMode(locale, state.mode)}</div>
          <div className="mini-copy">{translateRuntimeText(locale, state.routeCopy)}</div>
        </article>
      </section>

      <section className="panel-grid panel-grid-wide">
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{copy[locale].terms.signalDistribution}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '把买入、持有、卖出信号压缩到一个策略视图里。'
                  : 'Compress buy, hold, and sell posture into one strategy view.'}
              </div>
            </div>
            <div className="panel-badge badge-warn">SIGNAL</div>
          </div>
          <ChartCanvas kind="signal" />
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{copy[locale].terms.universeScores}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '在策略工作台里直接复核股票池评分、方向和动作建议。'
                  : 'Review universe scores, direction, and suggested action directly inside the workspace.'}
              </div>
            </div>
            <div className="panel-badge badge-info">{state.stockStates.length} SYMBOLS</div>
          </div>
          <UniverseTable />
        </article>
      </section>

      <section className="panel-grid">
        <ResearchStatusPanel
          title={locale === 'zh' ? '策略研究入口' : 'Research Entry'}
          copy={
            locale === 'zh'
              ? '回测中心已经独立成页，这里保留策略注册、候选集和参数工作区。'
              : 'The backtest center now has its own route, while the strategy layer keeps registry, candidate sets, and parameter workflow.'
          }
          badge="RESEARCH"
          metrics={strategyStatusConfig.metrics}
          messages={strategyStatusConfig.messages}
        />
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">
                {locale === 'zh' ? '注册新策略' : 'Register Strategy'}
              </div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '先提供最小策略元信息写路径，后续再补版本、参数和优化历史。'
                  : 'Start with a minimal metadata write path, then add versioning, parameters, and optimization history later.'}
              </div>
            </div>
            <div className="panel-badge badge-warn">{canWriteStrategy ? 'WRITE' : 'READ ONLY'}</div>
          </div>
          <div className="settings-form-grid">
            <label className="settings-field">
              <span>ID</span>
              <input
                disabled={!canWriteStrategy || saving}
                value={form.id}
                onChange={(event) => handleFormChange('id', event.target.value)}
              />
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '名称' : 'Name'}</span>
              <input
                disabled={!canWriteStrategy || saving}
                value={form.name}
                onChange={(event) => handleFormChange('name', event.target.value)}
              />
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '家族' : 'Family'}</span>
              <input
                disabled={!canWriteStrategy || saving}
                value={form.family}
                onChange={(event) => handleFormChange('family', event.target.value)}
              />
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '周期' : 'Timeframe'}</span>
              <input
                disabled={!canWriteStrategy || saving}
                value={form.timeframe}
                onChange={(event) => handleFormChange('timeframe', event.target.value)}
              />
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '标的池' : 'Universe'}</span>
              <input
                disabled={!canWriteStrategy || saving}
                value={form.universe}
                onChange={(event) => handleFormChange('universe', event.target.value)}
              />
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '阶段' : 'Stage'}</span>
              <select
                disabled={!canWriteStrategy || saving}
                value={form.status}
                onChange={(event) => handleFormChange('status', event.target.value)}
              >
                <option value="draft">draft</option>
                <option value="researching">researching</option>
                <option value="candidate">candidate</option>
                <option value="paper">paper</option>
                <option value="live">live</option>
                <option value="archived">archived</option>
              </select>
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '评分' : 'Score'}</span>
              <input
                disabled={!canWriteStrategy || saving}
                value={form.score}
                onChange={(event) => handleFormChange('score', event.target.value)}
              />
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '预期收益' : 'Expected Return'}</span>
              <input
                disabled={!canWriteStrategy || saving}
                value={form.expectedReturnPct}
                onChange={(event) => handleFormChange('expectedReturnPct', event.target.value)}
              />
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '最大回撤' : 'Max Drawdown'}</span>
              <input
                disabled={!canWriteStrategy || saving}
                value={form.maxDrawdownPct}
                onChange={(event) => handleFormChange('maxDrawdownPct', event.target.value)}
              />
            </label>
            <label className="settings-field">
              <span>Sharpe</span>
              <input
                disabled={!canWriteStrategy || saving}
                value={form.sharpe}
                onChange={(event) => handleFormChange('sharpe', event.target.value)}
              />
            </label>
            <label className="settings-field settings-field-wide">
              <span>{locale === 'zh' ? '摘要' : 'Summary'}</span>
              <input
                disabled={!canWriteStrategy || saving}
                value={form.summary}
                onChange={(event) => handleFormChange('summary', event.target.value)}
              />
            </label>
          </div>
          <div className="settings-actions">
            <button
              type="button"
              className="settings-button"
              disabled={!canWriteStrategy || saving || !form.id || !form.name}
              onClick={handleSaveStrategy}
            >
              {saving
                ? locale === 'zh'
                  ? '保存中...'
                  : 'Saving...'
                : locale === 'zh'
                  ? '写入策略注册表'
                  : 'Save Strategy'}
            </button>
            <div className="status-copy">
              {saveMessage ||
                saveError ||
                (locale === 'zh'
                  ? '写入后会自动刷新后端策略目录。'
                  : 'The backend strategy registry refreshes automatically after save.')}
            </div>
          </div>
        </article>
        <ResearchTerminalPanel {...strategyTerminalConfigs.registry}>
          {visibleActiveStrategies.length ? (
            <div className="status-copy">{locale === 'zh' ? '活跃策略' : 'Active strategies'}</div>
          ) : null}
          {visibleActiveStrategies.map((item) => (
            <StrategyCatalogRow
              key={item.id}
              locale={locale}
              item={item}
              nextStage={getNextStrategyStage(item.status)}
              canWriteStrategy={canWriteStrategy}
              saving={saving}
              promotingId={promotingId}
              selectedStrategyId={selectedStrategyId}
              onEdit={handleEditStrategy}
              onPromote={handlePromoteStrategy}
              onArchiveToggle={handleArchiveStrategy}
              onInspect={setSelectedStrategyId}
            />
          ))}
          {visibleArchivedStrategies.length ? (
            <div className="status-copy">
              {locale === 'zh' ? '已归档策略' : 'Archived strategies'}
            </div>
          ) : null}
          {visibleArchivedStrategies.map((item) => (
            <StrategyCatalogRow
              key={item.id}
              locale={locale}
              item={item}
              nextStage={null}
              canWriteStrategy={canWriteStrategy}
              saving={saving}
              promotingId={promotingId}
              selectedStrategyId={selectedStrategyId}
              onEdit={handleEditStrategy}
              onPromote={handlePromoteStrategy}
              onArchiveToggle={handleArchiveStrategy}
              onInspect={setSelectedStrategyId}
            />
          ))}
        </ResearchTerminalPanel>
        <ResearchTerminalPanel {...strategyTerminalConfigs.activity}>
          {strategyAuditItems.map((item) => {
            const strategyId =
              typeof item.metadata?.strategyId === 'string' ? item.metadata.strategyId : '--';
            const status = typeof item.metadata?.status === 'string' ? item.metadata.status : '--';
            return (
              <ResearchAuditFeedRow
                key={item.id}
                locale={locale}
                item={item}
                formatDateTime={formatDateTime}
                metrics={[
                  { label: locale === 'zh' ? '策略 ID' : 'Strategy ID', value: strategyId },
                  { label: locale === 'zh' ? '状态' : 'Status', value: status },
                ]}
              />
            );
          })}
        </ResearchTerminalPanel>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">
                {locale === 'zh' ? '研究治理总览' : 'Research Governance Overview'}
              </div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '把策略注册表和研究资产治理连接起来，优先暴露哪些策略可以晋级、哪些仍卡在评估或报告层。'
                  : 'Connect the strategy registry to research asset governance so promotion-ready, pending, and blocked strategies are visible from one overview.'}
              </div>
            </div>
            <div className="panel-badge badge-info">
              {data?.workbench?.asOf ? formatDateTime(data.workbench.asOf, locale) : 'GOVERNANCE'}
            </div>
          </div>
          <div className="status-stack">
            <div className="status-row">
              <span>{locale === 'zh' ? '可晋级' : 'Ready To Promote'}</span>
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
              <span>{locale === 'zh' ? '待报告' : 'Awaiting Reports'}</span>
              <strong>{workbenchSummary.waitingForReport}</strong>
            </div>
            <div className="status-row">
              <span>{locale === 'zh' ? '阻塞/返工' : 'Blocked / Rework'}</span>
              <strong>{workbenchSummary.blocked}</strong>
            </div>
            <div className="status-row">
              <span>{locale === 'zh' ? '陈旧策略' : 'Stale Strategies'}</span>
              <strong>{workbenchSummary.staleStrategies}</strong>
            </div>
            <div className="status-row">
              <span>{locale === 'zh' ? '基线策略' : 'Baselines'}</span>
              <strong>{workbenchSummary.baselines}</strong>
            </div>
            <div className="status-row">
              <span>{locale === 'zh' ? '冠军策略' : 'Champions'}</span>
              <strong>{workbenchSummary.champions}</strong>
            </div>
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">
                {locale === 'zh' ? '基线与冠军分析' : 'Baseline And Champion Analysis'}
              </div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '把研究工作台里的 baseline / champion 标记变成正式对比参照，快速识别谁领先、谁接近冠军、谁已经落后于基线。'
                  : 'Turn the baseline and champion markers into formal comparison anchors so operators can see who is leading, who is closing in, and who is now trailing the baseline envelope.'}
              </div>
            </div>
            <div className="panel-badge badge-info">{comparisonSummary.comparedStrategies}</div>
          </div>
          <div className="status-stack">
            <div className="status-row">
              <span>{locale === 'zh' ? '当前基线' : 'Current Baseline'}</span>
              <strong>{comparisonSummary.baselineStrategyName || '--'}</strong>
            </div>
            <div className="status-row">
              <span>{locale === 'zh' ? '当前冠军' : 'Current Champion'}</span>
              <strong>{comparisonSummary.championStrategyName || '--'}</strong>
            </div>
            <div className="status-row">
              <span>{locale === 'zh' ? '可比较策略' : 'Compared Strategies'}</span>
              <strong>{comparisonSummary.comparedStrategies}</strong>
            </div>
            <div className="status-row">
              <span>{locale === 'zh' ? '领先基线' : 'Outperforming Baseline'}</span>
              <strong>{comparisonSummary.outperformingBaseline}</strong>
            </div>
            <div className="status-row">
              <span>{locale === 'zh' ? '接近冠军' : 'Near Champion'}</span>
              <strong>{comparisonSummary.nearChampion}</strong>
            </div>
            <div className="status-row">
              <span>{locale === 'zh' ? '落后基线' : 'Trailing Baseline'}</span>
              <strong>{comparisonSummary.trailingBaseline}</strong>
            </div>
          </div>
          <div className="status-copy">
            {locale === 'zh'
              ? `基线更新时间：${comparisonSummary.baselineUpdatedAt ? formatDateTime(comparisonSummary.baselineUpdatedAt, locale) : '--'}；冠军更新时间：${comparisonSummary.championUpdatedAt ? formatDateTime(comparisonSummary.championUpdatedAt, locale) : '--'}。`
              : `Baseline updated ${comparisonSummary.baselineUpdatedAt ? formatDateTime(comparisonSummary.baselineUpdatedAt, locale) : '--'}; champion updated ${comparisonSummary.championUpdatedAt ? formatDateTime(comparisonSummary.championUpdatedAt, locale) : '--'}.`}
          </div>
        </article>
        <ResearchCollectionPanel
          title={locale === 'zh' ? '策略晋级队列' : 'Strategy Promotion Queue'}
          copy={
            locale === 'zh'
              ? '按研究治理状态查看策略，直接跳到注册表详情或回测详情继续推进。'
              : 'Review strategies by governance state and jump straight into registry detail or backtest detail for the next action.'
          }
          badge={promotionQueue.length}
          terminal
          isEmpty={promotionQueue.length === 0}
          emptyMessage={
            locale === 'zh'
              ? '当前没有策略晋级队列。'
              : 'No strategy promotion queue is available yet.'
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
                <span>{locale === 'zh' ? '选择' : 'Select'}</span>
                <strong>
                  {selectedGovernanceStrategyIds.includes(item.strategyId)
                    ? locale === 'zh'
                      ? '已选'
                      : 'Selected'
                    : '--'}
                </strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '评估' : 'Evaluation'}</span>
                <strong>{item.evaluationVerdict}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '报告任务' : 'Report task'}</span>
                <strong>{item.reportTaskStatus}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '动作' : 'Action'}</span>
                <strong>{item.recommendedAction}</strong>
              </div>
              <div className="action-group">
                <button
                  type="button"
                  className="inline-action"
                  onClick={() => toggleGovernanceSelection(item.strategyId)}
                >
                  {selectedGovernanceStrategyIds.includes(item.strategyId)
                    ? locale === 'zh'
                      ? '取消选择'
                      : 'Deselect'
                    : locale === 'zh'
                      ? '加入批量'
                      : 'Select'}
                </button>
                <button
                  type="button"
                  className="inline-action"
                  onClick={() => setSelectedStrategyId(item.strategyId)}
                >
                  {locale === 'zh' ? '查看策略' : 'Inspect Strategy'}
                </button>
                {item.latestRunId ? (
                  <button
                    type="button"
                    className="inline-action"
                    onClick={() =>
                      researchNavigation.openBacktestDetail(item.latestRunId, {
                        strategyId: item.strategyId,
                        source: 'strategies',
                      })
                    }
                  >
                    {locale === 'zh' ? '打开回测' : 'Open Backtest'}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </ResearchCollectionPanel>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">
                {locale === 'zh' ? '研究治理动作台' : 'Research Governance Actions'}
              </div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '从治理队列中批量推进策略晋级、补跑回测或补做评估，并把动作沉淀到 operator action 历史。'
                  : 'Batch promote strategies, refresh backtests, or evaluate runs directly from the governance queue and persist every action into the operator-action trail.'}
              </div>
            </div>
            <div className="panel-badge badge-warn">{selectedGovernanceStrategyIds.length}</div>
          </div>
          <div className="settings-form-grid">
            <label className="settings-field settings-field-wide">
              <span>{locale === 'zh' ? '回测窗口' : 'Backtest Window'}</span>
              <input
                value={governanceWindowLabel}
                onChange={(event) => setGovernanceWindowLabel(event.target.value)}
                placeholder="2024-01-01 -> 2026-03-01"
                disabled={Boolean(governanceBusy)}
              />
            </label>
          </div>
          <div className="settings-actions">
            <button
              type="button"
              className="settings-button"
              disabled={
                !canWriteStrategy ||
                !selectedGovernanceStrategyIds.length ||
                Boolean(governanceBusy)
              }
              onClick={() => void handleGovernanceAction('promote_strategies')}
            >
              {governanceBusy === 'promote_strategies'
                ? locale === 'zh'
                  ? '晋级中...'
                  : 'Promoting...'
                : locale === 'zh'
                  ? '批量推进策略晋级'
                  : 'Promote Selected Strategies'}
            </button>
            <button
              type="button"
              className="settings-button settings-button-secondary"
              disabled={
                !canWriteStrategy ||
                !selectedGovernanceStrategyIds.length ||
                Boolean(governanceBusy)
              }
              onClick={() => void handleGovernanceAction('queue_backtests')}
            >
              {governanceBusy === 'queue_backtests'
                ? locale === 'zh'
                  ? '排队中...'
                  : 'Queueing...'
                : locale === 'zh'
                  ? '批量补跑回测'
                  : 'Queue Refresh Backtests'}
            </button>
            <button
              type="button"
              className="settings-button settings-button-secondary"
              disabled={
                !canEvaluateResearch || !selectedGovernanceRunIds.length || Boolean(governanceBusy)
              }
              onClick={() => void handleGovernanceAction('evaluate_runs')}
            >
              {governanceBusy === 'evaluate_runs'
                ? locale === 'zh'
                  ? '评估中...'
                  : 'Evaluating...'
                : locale === 'zh'
                  ? '批量补做评估'
                  : 'Evaluate Selected Runs'}
            </button>
            <button
              type="button"
              className="settings-button settings-button-secondary"
              disabled={
                !canWriteStrategy ||
                selectedGovernanceStrategyIds.length !== 1 ||
                Boolean(governanceBusy)
              }
              onClick={() => void handleGovernanceAction('set_baseline')}
            >
              {governanceBusy === 'set_baseline'
                ? locale === 'zh'
                  ? '设置中...'
                  : 'Setting...'
                : locale === 'zh'
                  ? '设为基线'
                  : 'Set Baseline'}
            </button>
            <button
              type="button"
              className="settings-button settings-button-secondary"
              disabled={
                !canWriteStrategy ||
                selectedGovernanceStrategyIds.length !== 1 ||
                Boolean(governanceBusy)
              }
              onClick={() => void handleGovernanceAction('set_champion')}
            >
              {governanceBusy === 'set_champion'
                ? locale === 'zh'
                  ? '设置中...'
                  : 'Setting...'
                : locale === 'zh'
                  ? '设为冠军'
                  : 'Set Champion'}
            </button>
          </div>
          <div className="status-copy">
            {saveMessage ||
              saveError ||
              (locale === 'zh'
                ? `当前已选 ${selectedGovernanceStrategyIds.length} 条策略，关联 ${selectedGovernanceRunIds.length} 条 run。`
                : `${selectedGovernanceStrategyIds.length} strategies and ${selectedGovernanceRunIds.length} runs are currently selected.`)}
          </div>
          {!canWriteStrategy ? (
            <div className="status-copy">
              {formatPermissionDisabled(
                locale,
                'strategy:write',
                '批量推进研究治理动作',
                'run bulk research governance actions'
              )}
            </div>
          ) : null}
          {!canEvaluateResearch ? (
            <div className="status-copy">
              {formatPermissionDisabled(
                locale,
                'risk:review',
                '批量补做研究评估',
                'evaluate selected research runs'
              )}
            </div>
          ) : null}
        </article>
        <ResearchCollectionPanel
          title={locale === 'zh' ? '策略横向对比' : 'Strategy Comparison Board'}
          copy={
            locale === 'zh'
              ? '把最新结果、评估和报告结论汇总成横向对比板，帮助决定下一批应该优先推进哪些策略。'
              : 'Aggregate the latest result, evaluation, and report verdicts into a comparison board to decide which strategies should move next.'
          }
          badge={comparisonRows.length}
          terminal
          isEmpty={comparisonRows.length === 0}
          emptyMessage={
            locale === 'zh'
              ? '当前没有可对比的策略研究资产。'
              : 'No comparable strategy research assets are available yet.'
          }
        >
          {comparisonRows.map((item) => (
            <ResearchVersionSnapshotRow
              key={item.strategyId}
              leadTitle={`${item.strategyName} · ${item.strategyStatus}`}
              leadCopy={`${item.recommendedAction} · ${item.latestRunLabel || item.latestRunId || '--'}`}
              metrics={[
                {
                  label: locale === 'zh' ? '基线/冠军' : 'Baseline / Champion',
                  value: `${item.baseline ? 'baseline' : '--'} / ${item.champion ? 'champion' : '--'}`,
                },
                {
                  label: locale === 'zh' ? '对比带' : 'Comparison Band',
                  value: item.comparisonBand,
                },
                {
                  label: locale === 'zh' ? '收益/回撤' : 'Return / Drawdown',
                  value:
                    item.annualizedReturnPct !== null && item.maxDrawdownPct !== null
                      ? `${item.annualizedReturnPct.toFixed(1)}% / ${item.maxDrawdownPct.toFixed(1)}%`
                      : '--',
                },
                { label: 'Sharpe', value: item.sharpe !== null ? item.sharpe.toFixed(2) : '--' },
                {
                  label: locale === 'zh' ? '超额收益' : 'Excess',
                  value:
                    item.excessReturnPct !== null ? `${item.excessReturnPct.toFixed(1)}%` : '--',
                },
                {
                  label: locale === 'zh' ? '相对基线' : 'Vs Baseline',
                  value:
                    item.baselineReturnGapPct !== null && item.baselineSharpeGap !== null
                      ? `${item.baselineReturnGapPct >= 0 ? '+' : ''}${item.baselineReturnGapPct.toFixed(1)}% / ${item.baselineSharpeGap >= 0 ? '+' : ''}${item.baselineSharpeGap.toFixed(2)}`
                      : '--',
                },
                {
                  label: locale === 'zh' ? '相对冠军' : 'Vs Champion',
                  value:
                    item.championReturnGapPct !== null && item.championSharpeGap !== null
                      ? `${item.championReturnGapPct >= 0 ? '+' : ''}${item.championReturnGapPct.toFixed(1)}% / ${item.championSharpeGap >= 0 ? '+' : ''}${item.championSharpeGap.toFixed(2)}`
                      : '--',
                },
                {
                  label: locale === 'zh' ? '评估/报告' : 'Evaluation / Report',
                  value: `${item.evaluationVerdict} / ${item.reportVerdict}`,
                },
              ]}
            />
          ))}
        </ResearchCollectionPanel>
        <ResearchCollectionPanel
          title={locale === 'zh' ? '对比洞察' : 'Comparison Insights'}
          copy={
            locale === 'zh'
              ? '把横向对比结果转成治理优先级，直接标出哪些策略在挑战冠军、哪些需要回到基线以下做返工。'
              : 'Turn comparison output into governance priorities by highlighting which strategies are challenging the champion and which now need rework below the baseline envelope.'
          }
          badge={comparisonInsights.length}
          terminal
          isEmpty={comparisonInsights.length === 0}
          emptyMessage={
            locale === 'zh'
              ? '当前还没有可生成的对比洞察。'
              : 'No comparison insights are available yet.'
          }
        >
          {comparisonInsights.map((item) => (
            <ResearchVersionSnapshotRow
              key={item.strategyId}
              leadTitle={`${item.strategyName} · ${item.comparisonBand}`}
              leadCopy={item.headline}
              metrics={[
                { label: locale === 'zh' ? '状态' : 'Status', value: item.strategyStatus },
                {
                  label: locale === 'zh' ? '相对基线收益' : 'Baseline Return Gap',
                  value:
                    item.baselineReturnGapPct !== null
                      ? `${item.baselineReturnGapPct >= 0 ? '+' : ''}${item.baselineReturnGapPct.toFixed(1)}%`
                      : '--',
                },
                {
                  label: locale === 'zh' ? '相对冠军收益' : 'Champion Return Gap',
                  value:
                    item.championReturnGapPct !== null
                      ? `${item.championReturnGapPct >= 0 ? '+' : ''}${item.championReturnGapPct.toFixed(1)}%`
                      : '--',
                },
                {
                  label: locale === 'zh' ? 'Sharpe 差值' : 'Sharpe Gap',
                  value:
                    item.baselineSharpeGap !== null
                      ? `${item.baselineSharpeGap >= 0 ? '+' : ''}${item.baselineSharpeGap.toFixed(2)}`
                      : '--',
                },
                {
                  label: locale === 'zh' ? '更新时间' : 'Updated',
                  value: formatDateTime(item.updatedAt, locale),
                },
              ]}
            />
          ))}
        </ResearchCollectionPanel>
        <ResearchCollectionPanel
          title={locale === 'zh' ? '最近治理动作' : 'Recent Governance Actions'}
          copy={
            locale === 'zh'
              ? '展示最近的研究治理批量动作，便于追踪谁在什么时候推进了哪些策略。'
              : 'Review the latest governance actions so it is clear who advanced which strategies and when.'
          }
          badge={recentGovernanceActions.length}
          terminal
          isEmpty={recentGovernanceActions.length === 0}
          emptyMessage={
            locale === 'zh'
              ? '当前还没有治理动作历史。'
              : 'No governance actions have been recorded yet.'
          }
        >
          {recentGovernanceActions.map((item) => (
            <ResearchVersionSnapshotRow
              key={item.id}
              leadTitle={`${item.title} · ${item.actor}`}
              leadCopy={item.detail}
              metrics={[
                { label: locale === 'zh' ? '级别' : 'Level', value: item.level },
                {
                  label: locale === 'zh' ? '时间' : 'Created',
                  value: formatDateTime(item.createdAt, locale),
                },
                {
                  label: locale === 'zh' ? '成功/失败' : 'Success / Failure',
                  value: `${String(item.metadata?.successCount ?? '--')} / ${String(item.metadata?.failuresCount ?? '--')}`,
                },
              ]}
            />
          ))}
        </ResearchCollectionPanel>
        <ResearchCollectionPanel
          title={locale === 'zh' ? '研究资产覆盖缺口' : 'Research Asset Coverage Gaps'}
          copy={
            locale === 'zh'
              ? '直接识别每条策略现在缺失哪一层研究资产，用于安排补评估、补报告或补结果。'
              : 'Identify which research asset layer is missing per strategy so operators can quickly schedule missing results, evaluations, or reports.'
          }
          badge={coverageRows.length}
          terminal
          isEmpty={coverageRows.length === 0}
          emptyMessage={
            locale === 'zh'
              ? '当前没有研究资产覆盖缺口。'
              : 'No research asset coverage gaps are currently recorded.'
          }
        >
          {coverageRows.map((item) => (
            <ResearchVersionSnapshotRow
              key={item.strategyId}
              leadTitle={`${item.strategyName} · ${item.coverage}`}
              leadCopy={item.note}
              metrics={[
                {
                  label: locale === 'zh' ? '基线/冠军' : 'Baseline / Champion',
                  value: `${item.baseline ? 'baseline' : '--'} / ${item.champion ? 'champion' : '--'}`,
                },
                { label: locale === 'zh' ? '阶段' : 'Stage', value: item.strategyStatus },
                {
                  label: locale === 'zh' ? '最近 run' : 'Latest run',
                  value: item.latestRunId || '--',
                },
                {
                  label: locale === 'zh' ? '更新时间' : 'Updated',
                  value: formatDateTime(item.updatedAt, locale),
                },
              ]}
            />
          ))}
        </ResearchCollectionPanel>
      </section>

      <section className="panel-grid">
        <InspectionPanel
          title={locale === 'zh' ? '研究回放摘要' : 'Research Replay Summary'}
          copy={
            locale === 'zh'
              ? '把任务、workflow、run、result、evaluation、report 和治理动作压缩成一份研究回放摘要，先看全局再钻取时间线。'
              : 'Compress tasks, workflows, runs, results, evaluations, reports, and governance actions into one replay summary before drilling into the timeline below.'
          }
          badge={replaySummary?.latestAt ? formatDateTime(replaySummary.latestAt, locale) : '--'}
          badgeClassName="badge-info"
        >
          {!selectedStrategy ? (
            <InspectionEmpty>
              {locale === 'zh'
                ? '先从策略注册表选择一条记录。'
                : 'Select a strategy from the registry first.'}
            </InspectionEmpty>
          ) : null}
          {selectedStrategy ? (
            <>
              <InspectionMetricsRow
                metrics={[
                  {
                    label: locale === 'zh' ? '事件总数' : 'Events',
                    value: replaySummary ? String(replaySummary.totalEvents) : '--',
                  },
                  {
                    label: locale === 'zh' ? '注册表' : 'Registry',
                    value: replaySummary ? String(replaySummary.registryEvents) : '--',
                  },
                  {
                    label: locale === 'zh' ? '研究链路' : 'Research',
                    value: replaySummary ? String(replaySummary.researchEvents) : '--',
                  },
                  {
                    label: locale === 'zh' ? '评估/报告' : 'Review',
                    value: replaySummary ? String(replaySummary.reviewEvents) : '--',
                  },
                  {
                    label: locale === 'zh' ? '治理动作' : 'Governance',
                    value: replaySummary ? String(replaySummary.governanceEvents) : '--',
                  },
                  {
                    label: locale === 'zh' ? '执行承接' : 'Execution',
                    value: replaySummary ? String(replaySummary.executionEvents) : '--',
                  },
                ]}
              />
              <InspectionStatus>
                {replaySummary
                  ? locale === 'zh'
                    ? `最近 run：${replaySummary.latestRunId || '--'}；最近 result：${replaySummary.latestResultId || '--'}；最近 evaluation：${replaySummary.latestEvaluationId || '--'}；最近 report：${replaySummary.latestReportId || '--'}。`
                    : `Latest run: ${replaySummary.latestRunId || '--'}; latest result: ${replaySummary.latestResultId || '--'}; latest evaluation: ${replaySummary.latestEvaluationId || '--'}; latest report: ${replaySummary.latestReportId || '--'}.`
                  : locale === 'zh'
                    ? '当前还没有可汇总的研究回放节点。'
                    : 'No research replay nodes are available yet.'}
              </InspectionStatus>
            </>
          ) : null}
        </InspectionPanel>
        <InspectionListPanel
          title={locale === 'zh' ? '选中策略端到端时间线' : 'Selected Strategy End-to-End Timeline'}
          copy={
            locale === 'zh'
              ? '把策略注册、研究运行和执行承接按时间收敛到一条线，直接查看从研究到执行的推进轨迹。'
              : 'Collapse registry updates, research runs, and execution handoff into one chronological track for the selected strategy.'
          }
          badge={selectedStrategyTimelineItems.length}
          badgeClassName="badge-info"
          terminal
        >
          {!selectedStrategy ? (
            <InspectionEmpty>
              {locale === 'zh'
                ? '先从策略注册表选择一条记录。'
                : 'Select a strategy from the registry first.'}
            </InspectionEmpty>
          ) : null}
          {selectedStrategy && workspaceLoading && auditLoading && loading ? (
            <InspectionEmpty>
              {locale === 'zh' ? '正在汇总策略时间线...' : 'Assembling the strategy timeline...'}
            </InspectionEmpty>
          ) : null}
          {selectedStrategy && !selectedStrategyTimelineItems.length ? (
            <InspectionEmpty>
              {locale === 'zh'
                ? '当前策略还没有可回放的端到端轨迹。'
                : 'No end-to-end activity is available for the selected strategy yet.'}
            </InspectionEmpty>
          ) : null}
          {selectedStrategyTimelineItems.map((item) => (
            <ResearchTimelineEventRow
              key={item.id}
              locale={locale}
              id={item.id}
              title={item.title}
              detail={item.detail}
              selectedId={selectedTimelineId}
              onInspect={setSelectedTimelineId}
              metrics={[
                { label: locale === 'zh' ? '链路' : 'Lane', value: item.lane },
                {
                  label: locale === 'zh' ? '时间' : 'Time',
                  value: formatDateTime(item.at, locale),
                },
                ...item.metrics,
              ]}
            />
          ))}
        </InspectionListPanel>
        <ResearchEventInspectionPanel
          title={locale === 'zh' ? '选中时间线事件' : 'Selected Timeline Event'}
          copy={
            locale === 'zh'
              ? '钻取当前时间线节点，查看它属于哪条链路、对应哪条记录，以及当前应该到哪里继续排查。'
              : 'Inspect the selected timeline node to see which lane it belongs to, which record it references, and where to continue investigation.'
          }
          badge={selectedTimelineItem?.lane || '--'}
          badgeClassName="badge-warn"
          emptyMessage={selectedTimelineInspection.emptyMessage}
          metrics={selectedTimelineInspection.metrics}
          detail={selectedTimelineInspection.detail}
          guidance={getStrategyTimelineGuidance(locale, selectedTimelineItem?.eventType)}
          actions={
            selectedTimelineItem && selectedTimelineActionLabel ? (
              <ResearchActionBar>
                <ResearchActionButton
                  label={selectedTimelineActionLabel}
                  priority="primary"
                  onClick={() => {
                    if (
                      selectedTimelineItem.eventType === 'run' ||
                      selectedTimelineItem.eventType === 'result' ||
                      selectedTimelineItem.eventType === 'evaluation' ||
                      selectedTimelineItem.eventType === 'report' ||
                      selectedTimelineItem.eventType === 'task' ||
                      selectedTimelineItem.eventType === 'workflow'
                    ) {
                      const runId =
                        selectedTimelineItem.eventType === 'run'
                          ? selectedTimelineItem.reference
                          : selectedTimelineItem.linkedRunId || selectedTimelineItem.reference;
                      if (!runId) return;
                      researchNavigation.openBacktestDetail(runId, {
                        strategyId: selectedStrategy?.id || '',
                        timelineId: selectedTimelineItem.id,
                        source: 'strategies',
                      });
                      return;
                    }

                    if (selectedTimelineItem.eventType === 'execution') {
                      researchNavigation.openExecutionDetail(selectedTimelineItem.reference, {
                        strategyId: selectedStrategy?.id || '',
                        timelineId: selectedTimelineItem.id,
                        source: 'strategies',
                      });
                    }
                  }}
                />
              </ResearchActionBar>
            ) : null
          }
        />
        <ResearchDetailInspectionPanel
          title={locale === 'zh' ? '选中策略详情' : 'Selected Strategy Detail'}
          copy={
            locale === 'zh'
              ? '聚合当前策略的阶段、收益预期、风险参数和研究摘要。'
              : 'Aggregate the selected strategy’s stage, expected return, risk profile, and research summary.'
          }
          badge={selectedStrategy?.status || '--'}
          emptyMessage={selectedStrategyDetailInspection.emptyMessage}
          metrics={selectedStrategyDetailInspection.metrics}
        >
          {strategyDetailLoading ? (
            <InspectionStatus>
              {locale === 'zh' ? '正在同步策略详情...' : 'Syncing strategy detail...'}
            </InspectionStatus>
          ) : null}
          {strategyDetailError ? (
            <InspectionStatus>
              {locale === 'zh'
                ? `策略详情加载失败：${strategyDetailError}`
                : `Failed to load strategy detail: ${strategyDetailError}`}
            </InspectionStatus>
          ) : null}
          <InspectionStatus>{selectedStrategyDetailInspection.summary}</InspectionStatus>
        </ResearchDetailInspectionPanel>
        <ResearchEventInspectionPanel
          title={locale === 'zh' ? '最新研究结果' : 'Latest Research Result'}
          copy={
            locale === 'zh'
              ? '直接查看当前策略最近一个结果版本，把 run、result 和晋级上下文对到同一处。'
              : 'Inspect the latest result version for the selected strategy so the run, result, and promotion context stay aligned.'
          }
          badge={latestResult?.status || '--'}
          badgeClassName="badge-info"
          emptyMessage={
            !selectedStrategy
              ? locale === 'zh'
                ? '先从策略注册表选择一条记录。'
                : 'Select a strategy from the registry first.'
              : !latestResult
                ? locale === 'zh'
                  ? '当前策略还没有结果版本。'
                  : 'No result versions are available for this strategy yet.'
                : null
          }
          metrics={[
            {
              label: locale === 'zh' ? '版本' : 'Version',
              value: latestResult ? `v${latestResult.version}` : '--',
            },
            { label: locale === 'zh' ? '阶段' : 'Stage', value: latestResult?.stage || '--' },
            {
              label: locale === 'zh' ? '收益/回撤' : 'Return / Drawdown',
              value: latestResult
                ? `${latestResult.annualizedReturnPct.toFixed(1)}% / ${latestResult.maxDrawdownPct.toFixed(1)}%`
                : '--',
            },
            {
              label: locale === 'zh' ? '超额收益' : 'Excess Return',
              value: latestResult ? `${latestResult.excessReturnPct.toFixed(1)}%` : '--',
            },
          ]}
          detail={latestResult?.summary}
        >
          {latestResult ? (
            <ResearchActionBar>
              <ResearchActionButton
                label={locale === 'zh' ? '打开回测详情' : 'Open Backtest Detail'}
                priority="primary"
                onClick={() =>
                  researchNavigation.openBacktestDetail(latestResult.runId, {
                    strategyId: selectedStrategy?.id || '',
                    source: 'strategies',
                  })
                }
              />
            </ResearchActionBar>
          ) : null}
        </ResearchEventInspectionPanel>
        <ResearchEventInspectionPanel
          title={locale === 'zh' ? '晋级与执行准备' : 'Promotion And Execution Readiness'}
          copy={
            locale === 'zh'
              ? '把最近结果、当前策略阶段和执行候选预估整合到一个动作入口，减少在策略/回测/执行三页来回切换。'
              : 'Combine the latest result, current lifecycle stage, and execution candidate preview into one action surface so less context is lost across strategy, backtest, and execution pages.'
          }
          badge={promotionReadiness?.level || '--'}
          badgeClassName="badge-warn"
          emptyMessage={
            !selectedStrategy
              ? locale === 'zh'
                ? '先从策略注册表选择一条记录。'
                : 'Select a strategy from the registry first.'
              : null
          }
          metrics={[
            {
              label: locale === 'zh' ? '准备度' : 'Readiness',
              value: promotionReadiness?.level || '--',
            },
            {
              label: locale === 'zh' ? '推荐动作' : 'Recommended action',
              value: promotionReadiness?.recommendedAction || '--',
            },
            {
              label: locale === 'zh' ? '最新评估' : 'Latest evaluation',
              value: strategyDetail?.latestEvaluation?.verdict || '--',
            },
            {
              label: locale === 'zh' ? '候选订单数' : 'Candidate orders',
              value: executionCandidatePreview?.orderCount ?? '--',
            },
            {
              label: locale === 'zh' ? '风险状态' : 'Risk',
              value: executionCandidatePreview?.riskStatus || '--',
            },
          ]}
          detail={promotionReadiness?.headline || executionCandidatePreview?.summary}
          guidance={
            (promotionReadiness?.reasons || executionCandidatePreview?.reasons || []).join(' · ') ||
            undefined
          }
        >
          {selectedStrategy && executionCandidatePreview ? (
            <ResearchActionBar>
              <ResearchActionButton
                label={locale === 'zh' ? '查看回测详情' : 'Review Backtest'}
                priority="primary"
                onClick={() =>
                  researchNavigation.openBacktestDetail(
                    strategyDetail?.latestRun?.id || latestResult?.runId || '',
                    {
                      strategyId: selectedStrategy.id,
                      source: 'strategies',
                    }
                  )
                }
              />
              {selectedStrategyExecutionEntries[0] ? (
                <ResearchActionButton
                  label={locale === 'zh' ? '打开执行详情' : 'Open Execution Detail'}
                  onClick={() =>
                    researchNavigation.openExecutionDetail(
                      selectedStrategyExecutionEntries[0].plan.id,
                      {
                        strategyId: selectedStrategy.id,
                        source: 'strategies',
                      }
                    )
                  }
                />
              ) : null}
              <ResearchActionButton
                label={locale === 'zh' ? '移交执行台' : 'Send To Execution Desk'}
                onClick={async () => {
                  if (!selectedStrategy) return;
                  setSaveMessage('');
                  setSaveError('');
                  try {
                    const result = await createExecutionCandidateHandoff({
                      strategyId: selectedStrategy.id,
                      actor: session?.user.id || 'operator',
                      mode: executionCandidatePreview.mode,
                      capital: executionCandidatePreview.capital,
                    });
                    setSaveMessage(
                      locale === 'zh'
                        ? `已为 ${selectedStrategy.name} 创建执行交接对象 ${result.handoff?.id || ''}。`
                        : `Created execution handoff ${result.handoff?.id || ''} for ${selectedStrategy.name}.`
                    );
                    requestRefresh();
                  } catch (error) {
                    setSaveError(error instanceof Error ? error.message : 'unknown error');
                  }
                }}
              />
            </ResearchActionBar>
          ) : null}
        </ResearchEventInspectionPanel>
        <ResearchEventInspectionPanel
          title={locale === 'zh' ? '最新执行交接' : 'Latest Execution Handoff'}
          copy={
            locale === 'zh'
              ? '把研究链路正式交给执行工作台，明确当前 handoff 的状态、风险判定和候选订单规模。'
              : 'Hand the research package into the execution desk with a formal handoff record, including status, risk posture, and candidate order scale.'
          }
          badge={latestExecutionHandoff?.handoffStatus || '--'}
          badgeClassName="badge-info"
          emptyMessage={
            !selectedStrategy
              ? locale === 'zh'
                ? '先从策略注册表选择一条记录。'
                : 'Select a strategy from the registry first.'
              : !latestExecutionHandoff
                ? locale === 'zh'
                  ? '当前还没有正式的执行交接对象。'
                  : 'No formal execution handoff has been created for this strategy yet.'
                : null
          }
          metrics={[
            {
              label: locale === 'zh' ? '模式' : 'Mode',
              value: latestExecutionHandoff?.mode || '--',
            },
            {
              label: locale === 'zh' ? '风险状态' : 'Risk',
              value: latestExecutionHandoff?.riskStatus || '--',
            },
            {
              label: locale === 'zh' ? '审批' : 'Approval',
              value: latestExecutionHandoff?.approvalState || '--',
            },
            {
              label: locale === 'zh' ? '结论' : 'Verdict',
              value: latestExecutionHandoff?.verdict || '--',
            },
            {
              label: locale === 'zh' ? '候选订单' : 'Orders',
              value: latestExecutionHandoff?.orderCount ?? '--',
            },
          ]}
          detail={latestExecutionHandoff?.summary}
          guidance={(latestExecutionHandoff?.reasons || []).join(' · ') || undefined}
        >
          {selectedStrategy && latestExecutionHandoff ? (
            <ResearchActionBar>
              <ResearchActionButton
                label={locale === 'zh' ? '打开执行页面' : 'Open Execution Desk'}
                priority="primary"
                onClick={() =>
                  navigate(`/execution?strategy=${selectedStrategy.id}&source=strategies`)
                }
              />
            </ResearchActionBar>
          ) : null}
        </ResearchEventInspectionPanel>
        <ResearchEventInspectionPanel
          title={locale === 'zh' ? '最新研究报告' : 'Latest Research Report'}
          copy={
            locale === 'zh'
              ? '研究报告由异步 workflow 生成，作为策略晋级和执行准备的统一交付物。'
              : 'Research reports are generated by asynchronous workflows and become the shared deliverable for promotion and execution prep.'
          }
          badge={latestReport?.verdict || '--'}
          badgeClassName="badge-info"
          emptyMessage={
            !selectedStrategy
              ? locale === 'zh'
                ? '先从策略注册表选择一条记录。'
                : 'Select a strategy from the registry first.'
              : !latestReport
                ? locale === 'zh'
                  ? '当前策略还没有研究报告资产。'
                  : 'No research report asset exists for the selected strategy yet.'
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
              value: latestReport?.createdAt
                ? formatDateTime(latestReport.createdAt, locale)
                : '--',
            },
          ]}
          detail={latestReport?.executiveSummary}
          guidance={latestReport?.promotionCall || latestReport?.executionPreparation || undefined}
        />
        <ResearchCollectionPanel {...strategyCollectionConfigs.runs}>
          {selectedStrategyRuns.map((run) => (
            <ResearchRunSummaryRow key={run.id} locale={locale} run={run} />
          ))}
        </ResearchCollectionPanel>
        <ResearchCollectionPanel {...strategyCollectionConfigs.execution}>
          {selectedStrategyExecutionEntries.map((entry) => (
            <ResearchExecutionPlanRow key={entry.plan.id} locale={locale} entry={entry} />
          ))}
        </ResearchCollectionPanel>
        <ResearchCollectionPanel {...strategyCollectionConfigs.audit}>
          {selectedStrategyAuditItems.map((item) => {
            const status = typeof item.metadata?.status === 'string' ? item.metadata.status : '--';
            return (
              <ResearchAuditFeedRow
                key={item.id}
                locale={locale}
                item={item}
                formatDateTime={formatDateTime}
                metrics={[{ label: locale === 'zh' ? '状态' : 'Status', value: status }]}
              />
            );
          })}
        </ResearchCollectionPanel>
        <ResearchCollectionPanel {...strategyCollectionConfigs.versions}>
          {selectedStrategyVersionItems.map((item) => {
            const score = typeof item.metadata?.score === 'number' ? item.metadata.score : null;
            const expectedReturnPct =
              typeof item.metadata?.expectedReturnPct === 'number'
                ? item.metadata.expectedReturnPct
                : null;
            const maxDrawdownPct =
              typeof item.metadata?.maxDrawdownPct === 'number'
                ? item.metadata.maxDrawdownPct
                : null;
            const sharpe = typeof item.metadata?.sharpe === 'number' ? item.metadata.sharpe : null;
            return (
              <ResearchVersionSnapshotRow
                key={item.id}
                leadTitle={formatDateTime(item.createdAt, locale)}
                leadCopy={item.detail}
                metrics={[
                  {
                    label: locale === 'zh' ? '阶段' : 'Stage',
                    value: typeof item.metadata?.status === 'string' ? item.metadata.status : '--',
                  },
                  { label: locale === 'zh' ? '评分' : 'Score', value: score ?? '--' },
                  {
                    label: locale === 'zh' ? '收益/回撤' : 'Return / Drawdown',
                    value:
                      expectedReturnPct !== null && maxDrawdownPct !== null
                        ? `${expectedReturnPct.toFixed(1)}% / ${maxDrawdownPct.toFixed(1)}%`
                        : '--',
                  },
                  { label: 'Sharpe', value: sharpe !== null ? sharpe.toFixed(2) : '--' },
                ]}
              />
            );
          })}
        </ResearchCollectionPanel>
      </section>
    </>
  );
}

export default StrategiesPage;
