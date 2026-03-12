import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ApiPermissionError } from '../../app/api/controlPlane.ts';
import { readDeepLinkParams } from '../../modules/console/deepLinks.ts';
import { useSyncedQuerySelection } from '../../modules/console/useSyncedQuerySelection.ts';
import { ResearchCollectionPanel } from '../../modules/research/ResearchCollectionPanel.tsx';
import { ResearchActionBar, ResearchActionButton } from '../../modules/research/ResearchActionBar.tsx';
import { ResearchAuditFeedRow } from '../../modules/research/ResearchAuditFeedRow.tsx';
import { ResearchDetailInspectionPanel } from '../../modules/research/ResearchDetailInspectionPanel.tsx';
import { ResearchExecutionPlanRow } from '../../modules/research/ResearchExecutionPlanRow.tsx';
import { ResearchEventInspectionPanel } from '../../modules/research/ResearchEventInspectionPanel.tsx';
import { ResearchRunSummaryRow } from '../../modules/research/ResearchRunSummaryRow.tsx';
import { ResearchTerminalPanel } from '../../modules/research/ResearchTerminalPanel.tsx';
import { ResearchTimelineEventRow } from '../../modules/research/ResearchTimelineEventRow.tsx';
import { ResearchVersionSnapshotRow } from '../../modules/research/ResearchVersionSnapshotRow.tsx';
import { StrategyCatalogRow } from '../../modules/research/StrategyCatalogRow.tsx';
import { getStrategyCollectionConfigs } from '../../modules/research/researchCollectionConfigs.ts';
import { getStrategyDetailInspectionConfig } from '../../modules/research/researchDetailConfigs.ts';
import { getStrategyTimelineActionLabel, getStrategyTimelineGuidance } from '../../modules/research/researchEventInspection.tsx';
import { getStrategyTimelineInspectionConfig } from '../../modules/research/researchInspectionConfigs.ts';
import { getStrategyTerminalConfigs } from '../../modules/research/researchTerminalConfigs.tsx';
import { useResearchNavigationContext } from '../../modules/research/useResearchNavigationContext.ts';
import { useResearchPollingPolicy } from '../../modules/research/useResearchPollingPolicy.ts';
import { ResearchStatusPanel } from '../../modules/research/ResearchStatusPanel.tsx';
import { saveStrategyCatalogItem } from '../../modules/research/research.service.ts';
import { useStrategyDetailPanels } from '../../modules/research/useStrategyDetailPanels.ts';
import { useStrategyDetail } from '../../modules/research/useStrategyDetail.ts';
import { useResearchWorkspaceData } from '../../modules/research/useResearchWorkspaceData.ts';
import { useTradingSystem } from '../../store/trading-system/TradingSystemProvider.tsx';
import { ChartCanvas, SectionHeader, TopMeta } from '../console/components/ConsoleChrome.tsx';
import { InspectionEmpty, InspectionListPanel, InspectionMetricsRow, InspectionPanel, InspectionSelectableRow, InspectionStatus } from '../console/components/InspectionPanels.tsx';
import { UniverseTable } from '../console/components/ConsoleTables.tsx';
import { onShortcutKeyDown, useSettingsNavigation } from '../console/hooks.ts';
import { copy, useLocale } from '../console/i18n.tsx';
import { translateMode, translateRuntimeText } from '../console/utils.ts';

const STRATEGY_STAGE_FLOW = ['draft', 'researching', 'candidate', 'paper', 'live'] as const;

function getNextStrategyStage(status: string) {
  const index = STRATEGY_STAGE_FLOW.indexOf(status as typeof STRATEGY_STAGE_FLOW[number]);
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
  const {
    requestRefresh,
  } = useResearchPollingPolicy({
    onRefresh: () => setRefreshKey((current) => current + 1),
  });
  const {
    data,
    loading,
    error,
    auditItems,
    auditLoading,
    executionEntries,
    workspaceLoading,
  } = useResearchWorkspaceData({ refreshKey });
  const buyCount = state.stockStates.filter((stock) => stock.signal === 'BUY').length;
  const sellCount = state.stockStates.filter((stock) => stock.signal === 'SELL').length;
  const canWriteStrategy = hasPermission('strategy:write');
  const promotedCount = data?.strategies.filter((item) => item.status === 'paper' || item.status === 'live').length || 0;
  const activeStrategies = data?.strategies.filter((item) => item.status !== 'archived') || [];
  const archivedStrategies = data?.strategies.filter((item) => item.status === 'archived') || [];
  const visibleActiveStrategies = registryFilter === 'archived' ? [] : activeStrategies;
  const visibleArchivedStrategies = registryFilter === 'active' ? [] : archivedStrategies;
  const visibleStrategyIds = [...visibleActiveStrategies, ...visibleArchivedStrategies].map((item) => item.id);
  const strategyAuditItems = auditItems
    .filter((item) => item.type === 'strategy-catalog.saved')
    .filter((item) => {
      const strategyId = typeof item.metadata?.strategyId === 'string' ? item.metadata.strategyId : '';
      return registryFilter === 'all' ? true : visibleStrategyIds.includes(strategyId);
    })
    .slice(0, 8);
  const { strategyId: requestedStrategyId, timelineId: requestedTimelineId } = readDeepLinkParams(searchParams);
  const {
    selectedId: selectedStrategyId,
    setSelectedId: setSelectedStrategyId,
  } = useSyncedQuerySelection({
    itemIds: [...visibleActiveStrategies, ...visibleArchivedStrategies].map((item) => item.id),
    queryKey: 'strategy',
    requestedId: requestedStrategyId,
    searchParams,
    setSearchParams,
  });
  const selectedStrategy = [...visibleActiveStrategies, ...visibleArchivedStrategies].find((item) => item.id === selectedStrategyId)
    || visibleActiveStrategies[0]
    || visibleArchivedStrategies[0]
    || null;
  const { data: strategyDetail, loading: strategyDetailLoading, error: strategyDetailError } = useStrategyDetail(selectedStrategy?.id || '', refreshKey);
  const {
    selectedId: selectedTimelineId,
    setSelectedId: setSelectedTimelineId,
  } = useSyncedQuerySelection({
    itemIds: (selectedStrategy
      ? [
        ...auditItems
          .filter((item) => item.type === 'strategy-catalog.saved')
          .filter((item) => {
            const strategyId = typeof item.metadata?.strategyId === 'string' ? item.metadata.strategyId : '';
            return strategyId === selectedStrategy.id;
          })
          .slice(0, 6)
          .map((item) => `audit-${item.id}`),
        ...(strategyDetail?.recentRuns?.slice(0, 6)
          || data?.runs.filter((item) => item.strategyId === selectedStrategy.id).slice(0, 6)
          || []
        ).map((run) => `run-${run.id}`),
        ...executionEntries
          .filter((entry) => entry.plan.strategyId === selectedStrategy.id)
          .slice(0, 6)
          .map((entry) => `execution-${entry.plan.id}`),
      ]
      : []),
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
  } = useStrategyDetailPanels({
    locale,
    selectedStrategy,
    strategyDetail,
    auditItems,
    executionEntries,
    allRuns: data?.runs || [],
    selectedTimelineId,
  });
  const selectedTimelineActionLabel = getStrategyTimelineActionLabel(locale, selectedTimelineItem?.eventType);
  const selectedTimelineInspection = getStrategyTimelineInspectionConfig(
    locale,
    selectedStrategy,
    selectedTimelineItem,
    formatDateTime,
  );
  const selectedStrategyDetailInspection = getStrategyDetailInspectionConfig(
    locale,
    selectedStrategy,
    selectedStrategySnapshot,
    strategyDetail,
  );
  const strategyCollectionConfigs = getStrategyCollectionConfigs(locale, Boolean(selectedStrategy), workspaceLoading, {
    runs: selectedStrategyRuns.length,
    execution: selectedStrategyExecutionEntries.length,
    audit: selectedStrategyAuditItems.length,
    versions: selectedStrategyVersionItems.length,
  });
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
          : `Strategy ${result.strategy?.name || form.name} was saved to the registry.`,
      );
      requestRefresh();
    } catch (requestError) {
      if (requestError instanceof ApiPermissionError) {
        setSaveError(
          locale === 'zh'
            ? `保存策略被拦截：当前会话缺少 ${requestError.missingPermission || 'strategy:write'} 权限。`
            : `Strategy save blocked: this session is missing ${requestError.missingPermission || 'strategy:write'} permission.`,
        );
      } else {
        setSaveError(
          locale === 'zh'
            ? `保存策略失败：${requestError instanceof Error ? requestError.message : 'unknown error'}`
            : `Failed to save strategy: ${requestError instanceof Error ? requestError.message : 'unknown error'}`,
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
        : `Loaded ${strategy.name} into the edit form.`,
    );
    setSaveError('');
  };

  const handlePromoteStrategy = async (strategy: NonNullable<typeof data>['strategies'][number]) => {
    const nextStatus = getNextStrategyStage(strategy.status);
    if (!nextStatus) return;

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
          ? `策略 ${result.strategy?.name || strategy.name} 已晋级到 ${nextStatus}。`
          : `Strategy ${result.strategy?.name || strategy.name} was promoted to ${nextStatus}.`,
      );
      requestRefresh();
    } catch (requestError) {
      if (requestError instanceof ApiPermissionError) {
        setSaveError(
          locale === 'zh'
            ? `策略晋级被拦截：当前会话缺少 ${requestError.missingPermission || 'strategy:write'} 权限。`
            : `Strategy promotion blocked: this session is missing ${requestError.missingPermission || 'strategy:write'} permission.`,
        );
      } else {
        setSaveError(
          locale === 'zh'
            ? `策略晋级失败：${requestError instanceof Error ? requestError.message : 'unknown error'}`
            : `Failed to promote strategy: ${requestError instanceof Error ? requestError.message : 'unknown error'}`,
        );
      }
    } finally {
      setPromotingId('');
    }
  };

  const handleArchiveStrategy = async (strategy: NonNullable<typeof data>['strategies'][number]) => {
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
          ? (nextStatus === 'archived'
              ? `策略 ${result.strategy?.name || strategy.name} 已归档。`
              : `策略 ${result.strategy?.name || strategy.name} 已恢复到 draft。`)
          : (nextStatus === 'archived'
              ? `Strategy ${result.strategy?.name || strategy.name} was archived.`
              : `Strategy ${result.strategy?.name || strategy.name} was restored to draft.`),
      );
      requestRefresh();
    } catch (requestError) {
      if (requestError instanceof ApiPermissionError) {
        setSaveError(
          locale === 'zh'
            ? `策略归档被拦截：当前会话缺少 ${requestError.missingPermission || 'strategy:write'} 权限。`
            : `Strategy archive blocked: this session is missing ${requestError.missingPermission || 'strategy:write'} permission.`,
        );
      } else {
        setSaveError(
          locale === 'zh'
            ? `策略状态更新失败：${requestError instanceof Error ? requestError.message : 'unknown error'}`
            : `Failed to update strategy lifecycle state: ${requestError instanceof Error ? requestError.message : 'unknown error'}`,
        );
      }
    } finally {
      setPromotingId('');
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
        <TopMeta items={[
          { label: copy[locale].labels.marketClock, value: state.marketClock },
          { label: copy[locale].terms.signalSummary, value: `${buyCount} / ${sellCount}` },
          { label: copy[locale].labels.mode, value: translateMode(locale, state.mode) },
        ]} />
      </header>

      <section className="hero-grid two-up">
        <div className="hero-card hero-card-primary">
          <div className="card-eyebrow">{locale === 'zh' ? 'Strategy Registry' : 'Strategy Registry'}</div>
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
          <div className="card-eyebrow">{locale === 'zh' ? 'Execution Plan' : 'Execution Plan'}</div>
          <div className="mini-metric">{translateMode(locale, state.mode)}</div>
          <div className="mini-copy">{translateRuntimeText(locale, state.routeCopy)}</div>
        </article>
      </section>

      <section className="panel-grid panel-grid-wide">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.signalDistribution}</div><div className="panel-copy">{locale === 'zh' ? '把买入、持有、卖出信号压缩到一个策略视图里。' : 'Compress buy, hold, and sell posture into one strategy view.'}</div></div><div className="panel-badge badge-warn">SIGNAL</div></div>
          <ChartCanvas kind="signal" />
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.universeScores}</div><div className="panel-copy">{locale === 'zh' ? '在策略工作台里直接复核股票池评分、方向和动作建议。' : 'Review universe scores, direction, and suggested action directly inside the workspace.'}</div></div><div className="panel-badge badge-info">{state.stockStates.length} SYMBOLS</div></div>
          <UniverseTable />
        </article>
      </section>

      <section className="panel-grid">
        <ResearchStatusPanel
          title={locale === 'zh' ? '策略研究入口' : 'Research Entry'}
          copy={locale === 'zh'
            ? '回测中心已经独立成页，这里保留策略注册、候选集和参数工作区。'
            : 'The backtest center now has its own route, while the strategy layer keeps registry, candidate sets, and parameter workflow.'}
          badge="RESEARCH"
          metrics={[
            { label: locale === 'zh' ? '策略总数' : 'Catalog size', value: data?.strategies.length ?? '--' },
            { label: locale === 'zh' ? '候选/晋级' : 'Candidate / promoted', value: data ? `${data.summary.candidateStrategies} / ${promotedCount}` : '-- / --' },
            { label: copy[locale].terms.executionRoute, value: translateMode(locale, state.mode) },
          ]}
          messages={[
            !canWriteStrategy
              ? (locale === 'zh'
                  ? '当前会话没有 strategy:write 权限，策略工作台处于只读态。'
                  : 'This session does not have strategy:write permission. The strategy workspace is read-only.')
              : null,
            loading ? (locale === 'zh' ? '正在同步策略注册表...' : 'Syncing strategy registry...') : null,
            error ? (locale === 'zh' ? `策略服务不可用：${error}` : `Strategy service unavailable: ${error}`) : null,
            locale === 'zh'
              ? '策略注册表已经切到后端事实源，运行时信号视图仅作为当下市场上下文。'
              : 'The strategy registry now comes from the backend source of truth, while runtime signals stay as contextual market state.',
          ]}
        />
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '注册新策略' : 'Register Strategy'}</div><div className="panel-copy">{locale === 'zh' ? '先提供最小策略元信息写路径，后续再补版本、参数和优化历史。' : 'Start with a minimal metadata write path, then add versioning, parameters, and optimization history later.'}</div></div><div className="panel-badge badge-warn">{canWriteStrategy ? 'WRITE' : 'READ ONLY'}</div></div>
          <div className="settings-form-grid">
            <label className="settings-field">
              <span>ID</span>
              <input disabled={!canWriteStrategy || saving} value={form.id} onChange={(event) => handleFormChange('id', event.target.value)} />
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '名称' : 'Name'}</span>
              <input disabled={!canWriteStrategy || saving} value={form.name} onChange={(event) => handleFormChange('name', event.target.value)} />
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '家族' : 'Family'}</span>
              <input disabled={!canWriteStrategy || saving} value={form.family} onChange={(event) => handleFormChange('family', event.target.value)} />
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '周期' : 'Timeframe'}</span>
              <input disabled={!canWriteStrategy || saving} value={form.timeframe} onChange={(event) => handleFormChange('timeframe', event.target.value)} />
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '标的池' : 'Universe'}</span>
              <input disabled={!canWriteStrategy || saving} value={form.universe} onChange={(event) => handleFormChange('universe', event.target.value)} />
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '阶段' : 'Stage'}</span>
              <select disabled={!canWriteStrategy || saving} value={form.status} onChange={(event) => handleFormChange('status', event.target.value)}>
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
              <input disabled={!canWriteStrategy || saving} value={form.score} onChange={(event) => handleFormChange('score', event.target.value)} />
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '预期收益' : 'Expected Return'}</span>
              <input disabled={!canWriteStrategy || saving} value={form.expectedReturnPct} onChange={(event) => handleFormChange('expectedReturnPct', event.target.value)} />
            </label>
            <label className="settings-field">
              <span>{locale === 'zh' ? '最大回撤' : 'Max Drawdown'}</span>
              <input disabled={!canWriteStrategy || saving} value={form.maxDrawdownPct} onChange={(event) => handleFormChange('maxDrawdownPct', event.target.value)} />
            </label>
            <label className="settings-field">
              <span>Sharpe</span>
              <input disabled={!canWriteStrategy || saving} value={form.sharpe} onChange={(event) => handleFormChange('sharpe', event.target.value)} />
            </label>
            <label className="settings-field settings-field-wide">
              <span>{locale === 'zh' ? '摘要' : 'Summary'}</span>
              <input disabled={!canWriteStrategy || saving} value={form.summary} onChange={(event) => handleFormChange('summary', event.target.value)} />
            </label>
          </div>
          <div className="settings-actions">
            <button type="button" className="settings-button" disabled={!canWriteStrategy || saving || !form.id || !form.name} onClick={handleSaveStrategy}>
              {saving ? (locale === 'zh' ? '保存中...' : 'Saving...') : (locale === 'zh' ? '写入策略注册表' : 'Save Strategy')}
            </button>
            <div className="status-copy">{saveMessage || saveError || (locale === 'zh' ? '写入后会自动刷新后端策略目录。' : 'The backend strategy registry refreshes automatically after save.')}</div>
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
            <div className="status-copy">{locale === 'zh' ? '已归档策略' : 'Archived strategies'}</div>
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
            const strategyId = typeof item.metadata?.strategyId === 'string' ? item.metadata.strategyId : '--';
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
        <InspectionListPanel
          title={locale === 'zh' ? '选中策略端到端时间线' : 'Selected Strategy End-to-End Timeline'}
          copy={locale === 'zh' ? '把策略注册、研究运行和执行承接按时间收敛到一条线，直接查看从研究到执行的推进轨迹。' : 'Collapse registry updates, research runs, and execution handoff into one chronological track for the selected strategy.'}
          badge={selectedStrategyTimelineItems.length}
          badgeClassName="badge-info"
          terminal
        >
          {!selectedStrategy ? <InspectionEmpty>{locale === 'zh' ? '先从策略注册表选择一条记录。' : 'Select a strategy from the registry first.'}</InspectionEmpty> : null}
          {selectedStrategy && workspaceLoading && auditLoading && loading ? <InspectionEmpty>{locale === 'zh' ? '正在汇总策略时间线...' : 'Assembling the strategy timeline...'}</InspectionEmpty> : null}
          {selectedStrategy && !selectedStrategyTimelineItems.length ? <InspectionEmpty>{locale === 'zh' ? '当前策略还没有可回放的端到端轨迹。' : 'No end-to-end activity is available for the selected strategy yet.'}</InspectionEmpty> : null}
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
                { label: locale === 'zh' ? '时间' : 'Time', value: formatDateTime(item.at, locale) },
                ...item.metrics,
              ]}
            />
          ))}
        </InspectionListPanel>
        <ResearchEventInspectionPanel
          title={locale === 'zh' ? '选中时间线事件' : 'Selected Timeline Event'}
          copy={locale === 'zh' ? '钻取当前时间线节点，查看它属于哪条链路、对应哪条记录，以及当前应该到哪里继续排查。' : 'Inspect the selected timeline node to see which lane it belongs to, which record it references, and where to continue investigation.'}
          badge={selectedTimelineItem?.lane || '--'}
          badgeClassName="badge-warn"
          emptyMessage={selectedTimelineInspection.emptyMessage}
          metrics={selectedTimelineInspection.metrics}
          detail={selectedTimelineInspection.detail}
          guidance={getStrategyTimelineGuidance(locale, selectedTimelineItem?.eventType)}
          actions={selectedTimelineItem && selectedTimelineActionLabel ? (
            <ResearchActionBar>
              <ResearchActionButton
                label={selectedTimelineActionLabel}
                priority="primary"
                onClick={() => {
                  if (selectedTimelineItem.eventType === 'run') {
                    researchNavigation.openBacktestDetail(selectedTimelineItem.reference, {
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
          ) : null}
        />
        <ResearchDetailInspectionPanel
          title={locale === 'zh' ? '选中策略详情' : 'Selected Strategy Detail'}
          copy={locale === 'zh' ? '聚合当前策略的阶段、收益预期、风险参数和研究摘要。' : 'Aggregate the selected strategy’s stage, expected return, risk profile, and research summary.'}
          badge={selectedStrategy?.status || '--'}
          emptyMessage={selectedStrategyDetailInspection.emptyMessage}
          metrics={selectedStrategyDetailInspection.metrics}
        >
          {strategyDetailLoading ? <InspectionStatus>{locale === 'zh' ? '正在同步策略详情...' : 'Syncing strategy detail...'}</InspectionStatus> : null}
          {strategyDetailError ? <InspectionStatus>{locale === 'zh' ? `策略详情加载失败：${strategyDetailError}` : `Failed to load strategy detail: ${strategyDetailError}`}</InspectionStatus> : null}
          <InspectionStatus>{selectedStrategyDetailInspection.summary}</InspectionStatus>
        </ResearchDetailInspectionPanel>
        <ResearchCollectionPanel {...strategyCollectionConfigs.runs}>
          {selectedStrategyRuns.map((run) => (
            <ResearchRunSummaryRow
              key={run.id}
              locale={locale}
              run={run}
            />
          ))}
        </ResearchCollectionPanel>
        <ResearchCollectionPanel {...strategyCollectionConfigs.execution}>
          {selectedStrategyExecutionEntries.map((entry) => (
            <ResearchExecutionPlanRow
              key={entry.plan.id}
              locale={locale}
              entry={entry}
            />
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
                metrics={[
                  { label: locale === 'zh' ? '状态' : 'Status', value: status },
                ]}
              />
            );
          })}
        </ResearchCollectionPanel>
        <ResearchCollectionPanel {...strategyCollectionConfigs.versions}>
          {selectedStrategyVersionItems.map((item) => {
            const score = typeof item.metadata?.score === 'number' ? item.metadata.score : null;
            const expectedReturnPct = typeof item.metadata?.expectedReturnPct === 'number' ? item.metadata.expectedReturnPct : null;
            const maxDrawdownPct = typeof item.metadata?.maxDrawdownPct === 'number' ? item.metadata.maxDrawdownPct : null;
            const sharpe = typeof item.metadata?.sharpe === 'number' ? item.metadata.sharpe : null;
            return (
              <ResearchVersionSnapshotRow
                key={item.id}
                leadTitle={formatDateTime(item.createdAt, locale)}
                leadCopy={item.detail}
                metrics={[
                  { label: locale === 'zh' ? '阶段' : 'Stage', value: typeof item.metadata?.status === 'string' ? item.metadata.status : '--' },
                  { label: locale === 'zh' ? '评分' : 'Score', value: score ?? '--' },
                  { label: locale === 'zh' ? '收益/回撤' : 'Return / Drawdown', value: expectedReturnPct !== null && maxDrawdownPct !== null ? `${expectedReturnPct.toFixed(1)}% / ${maxDrawdownPct.toFixed(1)}%` : '--' },
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
