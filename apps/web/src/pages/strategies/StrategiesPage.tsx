import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { ExecutionLedgerEntry, StrategyCatalogDetailSnapshot } from '@shared-types/trading.ts';
import { ApiPermissionError, fetchExecutionLedger } from '../../app/api/controlPlane.ts';
import { useAuditFeed } from '../../modules/audit/useAuditFeed.ts';
import { fetchStrategyCatalogItem, saveStrategyCatalogItem } from '../../modules/research/research.service.ts';
import { useResearchHub } from '../../modules/research/useResearchHub.ts';
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
  const goToSettings = useSettingsNavigation();
  const [refreshKey, setRefreshKey] = useState(0);
  const [registryFilter, setRegistryFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [selectedStrategyId, setSelectedStrategyId] = useState('');
  const [selectedTimelineId, setSelectedTimelineId] = useState('');
  const [executionEntries, setExecutionEntries] = useState<ExecutionLedgerEntry[]>([]);
  const [executionLoading, setExecutionLoading] = useState(true);
  const [strategyDetail, setStrategyDetail] = useState<StrategyCatalogDetailSnapshot | null>(null);
  const [strategyDetailLoading, setStrategyDetailLoading] = useState(false);
  const [strategyDetailError, setStrategyDetailError] = useState('');
  const [saving, setSaving] = useState(false);
  const [promotingId, setPromotingId] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
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
  const { data, loading, error } = useResearchHub(refreshKey);
  const { items: auditItems, loading: auditLoading } = useAuditFeed(refreshKey);
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
  const selectedStrategy = [...visibleActiveStrategies, ...visibleArchivedStrategies].find((item) => item.id === selectedStrategyId)
    || visibleActiveStrategies[0]
    || visibleArchivedStrategies[0]
    || null;
  const selectedStrategySnapshot = strategyDetail?.strategy || selectedStrategy;
  const selectedStrategyRuns = strategyDetail?.recentRuns?.slice(0, 6) || data?.runs.filter((item) => item.strategyId === selectedStrategy?.id).slice(0, 6) || [];
  const selectedStrategyAuditItems = auditItems
    .filter((item) => item.type === 'strategy-catalog.saved')
    .filter((item) => {
      const strategyId = typeof item.metadata?.strategyId === 'string' ? item.metadata.strategyId : '';
      return selectedStrategy ? strategyId === selectedStrategy.id : false;
    })
    .slice(0, 6);
  const selectedStrategyVersionItems = selectedStrategyAuditItems.filter((item) => (
    typeof item.metadata?.score === 'number'
    || typeof item.metadata?.expectedReturnPct === 'number'
    || typeof item.metadata?.maxDrawdownPct === 'number'
    || typeof item.metadata?.sharpe === 'number'
  ));
  const selectedStrategyExecutionEntries = executionEntries
    .filter((entry) => entry.plan.strategyId === selectedStrategy?.id)
    .slice(0, 6);
  const selectedStrategyTimelineItems = [
    ...selectedStrategyAuditItems.map((item) => ({
      id: `audit-${item.id}`,
      eventType: 'audit',
      lane: locale === 'zh' ? '注册表' : 'Registry',
      title: item.title,
      detail: item.detail,
      at: item.createdAt,
      reference: typeof item.metadata?.strategyId === 'string' ? item.metadata.strategyId : '--',
      metrics: [
        { label: locale === 'zh' ? '状态' : 'Status', value: typeof item.metadata?.status === 'string' ? item.metadata.status : '--' },
        { label: locale === 'zh' ? '操作人' : 'Actor', value: item.actor },
      ],
    })),
    ...selectedStrategyRuns.map((run) => ({
      id: `run-${run.id}`,
      eventType: 'run',
      lane: locale === 'zh' ? '研究' : 'Research',
      title: `${run.windowLabel} · ${run.status}`,
      detail: run.summary,
      at: run.completedAt || run.reviewedAt || run.updatedAt || run.startedAt,
      reference: run.id,
      metrics: [
        { label: locale === 'zh' ? '收益' : 'Return', value: run.status === 'completed' || run.status === 'needs_review' ? `${run.annualizedReturnPct.toFixed(1)}%` : '--' },
        { label: 'Sharpe', value: run.status === 'completed' || run.status === 'needs_review' ? run.sharpe.toFixed(2) : '--' },
      ],
    })),
    ...selectedStrategyExecutionEntries.map((entry) => ({
      id: `execution-${entry.plan.id}`,
      eventType: 'execution',
      lane: locale === 'zh' ? '执行' : 'Execution',
      title: entry.plan.summary,
      detail: entry.latestRuntime?.message || `${entry.plan.orderCount} ${locale === 'zh' ? '笔订单候选' : 'candidate orders'}`,
      at: entry.latestRuntime?.createdAt || entry.plan.updatedAt || entry.plan.createdAt,
      reference: entry.plan.id,
      metrics: [
        { label: locale === 'zh' ? '计划状态' : 'Plan', value: entry.plan.status },
        { label: locale === 'zh' ? 'Workflow' : 'Workflow', value: entry.workflow?.status || '--' },
      ],
    })),
  ]
    .sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime())
    .slice(0, 10);
  const selectedTimelineItem = selectedStrategyTimelineItems.find((item) => item.id === selectedTimelineId) || selectedStrategyTimelineItems[0] || null;
  const requestedStrategyId = searchParams.get('strategy');
  const requestedTimelineId = searchParams.get('timeline');

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
      setRefreshKey((current) => current + 1);
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
      setRefreshKey((current) => current + 1);
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
      setRefreshKey((current) => current + 1);
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

  useEffect(() => {
    const visibleStrategies = [...visibleActiveStrategies, ...visibleArchivedStrategies];
    if (!visibleStrategies.length) {
      setSelectedStrategyId('');
      return;
    }
    if (requestedStrategyId && visibleStrategies.some((item) => item.id === requestedStrategyId) && selectedStrategyId !== requestedStrategyId) {
      setSelectedStrategyId(requestedStrategyId);
      return;
    }
    if (!selectedStrategyId || !visibleStrategies.some((item) => item.id === selectedStrategyId)) {
      setSelectedStrategyId(requestedStrategyId && visibleStrategies.some((item) => item.id === requestedStrategyId) ? requestedStrategyId : visibleStrategies[0].id);
    }
  }, [requestedStrategyId, selectedStrategyId, visibleActiveStrategies, visibleArchivedStrategies]);

  useEffect(() => {
    if (!selectedStrategyId) return;
    if (searchParams.get('strategy') === selectedStrategyId) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('strategy', selectedStrategyId);
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, selectedStrategyId, setSearchParams]);

  useEffect(() => {
    if (!selectedStrategyTimelineItems.length) {
      setSelectedTimelineId('');
      return;
    }
    if (requestedTimelineId && selectedStrategyTimelineItems.some((item) => item.id === requestedTimelineId) && selectedTimelineId !== requestedTimelineId) {
      setSelectedTimelineId(requestedTimelineId);
      return;
    }
    if (!selectedTimelineId || !selectedStrategyTimelineItems.some((item) => item.id === selectedTimelineId)) {
      setSelectedTimelineId(requestedTimelineId && selectedStrategyTimelineItems.some((item) => item.id === requestedTimelineId) ? requestedTimelineId : selectedStrategyTimelineItems[0].id);
    }
  }, [requestedTimelineId, selectedTimelineId, selectedStrategyTimelineItems]);

  useEffect(() => {
    if (!selectedTimelineId) return;
    if (searchParams.get('timeline') === selectedTimelineId) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('timeline', selectedTimelineId);
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, selectedTimelineId, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    setExecutionLoading(true);
    fetchExecutionLedger()
      .then((result) => {
        if (cancelled) return;
        setExecutionEntries(result.entries);
      })
      .catch(() => {
        if (cancelled) return;
        setExecutionEntries([]);
      })
      .finally(() => {
        if (cancelled) return;
        setExecutionLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!selectedStrategy?.id) {
      setStrategyDetail(null);
      setStrategyDetailError('');
      return;
    }

    let cancelled = false;
    setStrategyDetailLoading(true);
    setStrategyDetailError('');

    fetchStrategyCatalogItem(selectedStrategy.id)
      .then((result) => {
        if (cancelled) return;
        setStrategyDetail(result);
        setStrategyDetailError('');
      })
      .catch((requestError) => {
        if (cancelled) return;
        setStrategyDetail(null);
        setStrategyDetailError(requestError instanceof Error ? requestError.message : 'unknown error');
      })
      .finally(() => {
        if (cancelled) return;
        setStrategyDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey, selectedStrategy?.id]);

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
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '策略研究入口' : 'Research Entry'}</div><div className="panel-copy">{locale === 'zh' ? '回测中心已经独立成页，这里保留策略注册、候选集和参数工作区。' : 'The backtest center now has its own route, while the strategy layer keeps registry, candidate sets, and parameter workflow.'}</div></div><div className="panel-badge badge-muted">RESEARCH</div></div>
          <div className="status-stack">
            <div className="status-row"><span>{locale === 'zh' ? '策略总数' : 'Catalog size'}</span><strong>{data?.strategies.length ?? '--'}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '候选/晋级' : 'Candidate / promoted'}</span><strong>{data ? `${data.summary.candidateStrategies} / ${promotedCount}` : '-- / --'}</strong></div>
            <div className="status-row"><span>{copy[locale].terms.executionRoute}</span><strong>{translateMode(locale, state.mode)}</strong></div>
            {!canWriteStrategy ? <div className="status-copy">{locale === 'zh' ? '当前会话没有 strategy:write 权限，策略工作台处于只读态。' : 'This session does not have strategy:write permission. The strategy workspace is read-only.'}</div> : null}
            {loading ? <div className="status-copy">{locale === 'zh' ? '正在同步策略注册表...' : 'Syncing strategy registry...'}</div> : null}
            {error ? <div className="status-copy">{locale === 'zh' ? `策略服务不可用：${error}` : `Strategy service unavailable: ${error}`}</div> : null}
            <div className="status-copy">{locale === 'zh' ? '策略注册表已经切到后端事实源，运行时信号视图仅作为当下市场上下文。' : 'The strategy registry now comes from the backend source of truth, while runtime signals stay as contextual market state.'}</div>
          </div>
        </article>
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
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '后端策略注册表' : 'Backend Strategy Registry'}</div><div className="panel-copy">{locale === 'zh' ? '直接消费研究服务返回的策略目录，避免页面本地状态冒充注册表事实来源。' : 'Consume the backend strategy catalog directly instead of treating page-local runtime state as the registry source of truth.'}</div></div><div className="panel-badge badge-info">{data?.summary.dataSource ? 'SERVICE' : 'LOCAL'}</div></div>
          <div className="status-stack">
            <div className="status-row"><span>{locale === 'zh' ? '活跃策略' : 'Active strategies'}</span><strong>{activeStrategies.length}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '已归档策略' : 'Archived strategies'}</span><strong>{archivedStrategies.length}</strong></div>
            <div className="settings-actions">
              <button
                type="button"
                className="inline-action"
                disabled={registryFilter === 'active'}
                onClick={() => setRegistryFilter('active')}
              >
                {locale === 'zh' ? '仅看活跃' : 'Active only'}
              </button>
              <button
                type="button"
                className="inline-action"
                disabled={registryFilter === 'all'}
                onClick={() => setRegistryFilter('all')}
              >
                {locale === 'zh' ? '全部策略' : 'All strategies'}
              </button>
              <button
                type="button"
                className="inline-action"
                disabled={registryFilter === 'archived'}
                onClick={() => setRegistryFilter('archived')}
              >
                {locale === 'zh' ? '仅看归档' : 'Archived only'}
              </button>
            </div>
          </div>
          <div className="focus-list focus-list-terminal">
            {!loading && !visibleActiveStrategies.length && !visibleArchivedStrategies.length ? (
              <div className="empty-cell">{locale === 'zh' ? '当前筛选条件下没有策略。' : 'No strategies match the current filter.'}</div>
            ) : null}
            {visibleActiveStrategies.length ? (
              <div className="status-copy">{locale === 'zh' ? '活跃策略' : 'Active strategies'}</div>
            ) : null}
            {visibleActiveStrategies.map((item) => (
              <InspectionSelectableRow
                key={item.id}
                leadTitle={item.name}
                leadCopy={item.summary}
                metrics={[
                  { label: locale === 'zh' ? '阶段' : 'Stage', value: item.status },
                  { label: 'Sharpe', value: item.sharpe.toFixed(2) },
                  { label: locale === 'zh' ? '预期收益' : 'Expected return', value: `${item.expectedReturnPct.toFixed(1)}%` },
                ]}
                actions={(
                  <div className="action-group">
                    <button
                      type="button"
                      className="inline-action"
                      disabled={!canWriteStrategy || saving || promotingId === item.id}
                      onClick={() => handleEditStrategy(item)}
                    >
                      {locale === 'zh' ? '编辑' : 'Edit'}
                    </button>
                    {getNextStrategyStage(item.status) ? (
                      <button
                        type="button"
                        className="inline-action inline-action-approve"
                        disabled={!canWriteStrategy || saving || promotingId === item.id}
                        onClick={() => handlePromoteStrategy(item)}
                      >
                        {promotingId === item.id
                          ? (locale === 'zh' ? '晋级中...' : 'Promoting...')
                          : (locale === 'zh'
                              ? `晋级到 ${getNextStrategyStage(item.status)}`
                              : `Promote to ${getNextStrategyStage(item.status)}`)}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={item.status === 'archived' ? 'inline-action inline-action-approve' : 'inline-action'}
                      disabled={!canWriteStrategy || saving || promotingId === item.id}
                      onClick={() => handleArchiveStrategy(item)}
                    >
                      {promotingId === item.id
                        ? (item.status === 'archived'
                            ? (locale === 'zh' ? '恢复中...' : 'Restoring...')
                            : (locale === 'zh' ? '归档中...' : 'Archiving...'))
                        : (item.status === 'archived'
                            ? (locale === 'zh' ? '恢复到 draft' : 'Restore to draft')
                            : (locale === 'zh' ? '归档' : 'Archive'))}
                    </button>
                    <button
                      type="button"
                      className="inline-action"
                      disabled={selectedStrategyId === item.id}
                      onClick={() => setSelectedStrategyId(item.id)}
                    >
                      {selectedStrategyId === item.id
                        ? (locale === 'zh' ? '已选中' : 'Selected')
                        : (locale === 'zh' ? '查看' : 'Inspect')}
                    </button>
                  </div>
                )}
              />
            ))}
            {visibleArchivedStrategies.length ? (
              <div className="status-copy">{locale === 'zh' ? '已归档策略' : 'Archived strategies'}</div>
            ) : null}
            {visibleArchivedStrategies.map((item) => (
              <InspectionSelectableRow
                key={item.id}
                leadTitle={item.name}
                leadCopy={item.summary}
                metrics={[
                  { label: locale === 'zh' ? '阶段' : 'Stage', value: item.status },
                  { label: 'Sharpe', value: item.sharpe.toFixed(2) },
                  { label: locale === 'zh' ? '预期收益' : 'Expected return', value: `${item.expectedReturnPct.toFixed(1)}%` },
                ]}
                actions={(
                  <div className="action-group">
                    <button
                      type="button"
                      className="inline-action"
                      disabled={!canWriteStrategy || saving || promotingId === item.id}
                      onClick={() => handleEditStrategy(item)}
                    >
                      {locale === 'zh' ? '编辑' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      className="inline-action inline-action-approve"
                      disabled={!canWriteStrategy || saving || promotingId === item.id}
                      onClick={() => handleArchiveStrategy(item)}
                    >
                      {promotingId === item.id
                        ? (locale === 'zh' ? '恢复中...' : 'Restoring...')
                        : (locale === 'zh' ? '恢复到 draft' : 'Restore to draft')}
                    </button>
                    <button
                      type="button"
                      className="inline-action"
                      disabled={selectedStrategyId === item.id}
                      onClick={() => setSelectedStrategyId(item.id)}
                    >
                      {selectedStrategyId === item.id
                        ? (locale === 'zh' ? '已选中' : 'Selected')
                        : (locale === 'zh' ? '查看' : 'Inspect')}
                    </button>
                  </div>
                )}
              />
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '最近策略操作' : 'Recent Strategy Activity'}</div><div className="panel-copy">{locale === 'zh' ? '直接消费后端 audit records，查看策略注册、晋级、归档和恢复的最新留痕。' : 'Consume backend audit records directly to review recent registry saves, promotions, archives, and restores.'}</div></div><div className="panel-badge badge-warn">AUDIT</div></div>
          <div className="focus-list focus-list-terminal">
            {auditLoading ? <div className="empty-cell">{locale === 'zh' ? '正在加载策略操作历史...' : 'Loading strategy activity...'}</div> : null}
            {!auditLoading && !strategyAuditItems.length ? <div className="empty-cell">{locale === 'zh' ? '当前筛选条件下没有策略操作历史。' : 'No strategy activity for the current filter.'}</div> : null}
            {strategyAuditItems.map((item) => {
              const strategyId = typeof item.metadata?.strategyId === 'string' ? item.metadata.strategyId : '--';
              const status = typeof item.metadata?.status === 'string' ? item.metadata.status : '--';
              return (
                <div className="focus-row" key={item.id}>
                  <div className="symbol-cell">
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </div>
                  <div className="focus-metric">
                    <span>{locale === 'zh' ? '策略 ID' : 'Strategy ID'}</span>
                    <strong>{strategyId}</strong>
                  </div>
                  <div className="focus-metric">
                    <span>{locale === 'zh' ? '状态' : 'Status'}</span>
                    <strong>{status}</strong>
                  </div>
                  <div className="focus-metric">
                    <span>{locale === 'zh' ? '操作人' : 'Actor'}</span>
                    <strong>{item.actor}</strong>
                  </div>
                  <div className="focus-metric">
                    <span>{locale === 'zh' ? '时间' : 'Time'}</span>
                    <strong>{formatDateTime(item.createdAt, locale)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
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
          {selectedStrategy && executionLoading && auditLoading && loading ? <InspectionEmpty>{locale === 'zh' ? '正在汇总策略时间线...' : 'Assembling the strategy timeline...'}</InspectionEmpty> : null}
          {selectedStrategy && !selectedStrategyTimelineItems.length ? <InspectionEmpty>{locale === 'zh' ? '当前策略还没有可回放的端到端轨迹。' : 'No end-to-end activity is available for the selected strategy yet.'}</InspectionEmpty> : null}
          {selectedStrategyTimelineItems.map((item) => (
            <InspectionSelectableRow
              key={item.id}
              leadTitle={item.title}
              leadCopy={item.detail}
              metrics={[
                { label: locale === 'zh' ? '链路' : 'Lane', value: item.lane },
                { label: locale === 'zh' ? '时间' : 'Time', value: formatDateTime(item.at, locale) },
                ...item.metrics,
              ]}
              actions={(
                <button
                  type="button"
                  className="inline-action"
                  disabled={selectedTimelineId === item.id}
                  onClick={() => setSelectedTimelineId(item.id)}
                >
                  {selectedTimelineId === item.id
                    ? (locale === 'zh' ? '已选中' : 'Selected')
                    : (locale === 'zh' ? '查看' : 'Inspect')}
                </button>
              )}
            />
          ))}
        </InspectionListPanel>
        <InspectionPanel
          title={locale === 'zh' ? '选中时间线事件' : 'Selected Timeline Event'}
          copy={locale === 'zh' ? '钻取当前时间线节点，查看它属于哪条链路、对应哪条记录，以及当前应该到哪里继续排查。' : 'Inspect the selected timeline node to see which lane it belongs to, which record it references, and where to continue investigation.'}
          badge={selectedTimelineItem?.lane || '--'}
          badgeClassName="badge-warn"
        >
          {!selectedStrategy ? (
            <InspectionEmpty>{locale === 'zh' ? '先从策略注册表选择一条记录。' : 'Select a strategy from the registry first.'}</InspectionEmpty>
          ) : !selectedTimelineItem ? (
            <InspectionEmpty>{locale === 'zh' ? '当前还没有可钻取的时间线节点。' : 'No timeline node is available for inspection yet.'}</InspectionEmpty>
          ) : (
            <div className="status-stack">
              <div className="status-row"><span>{locale === 'zh' ? '事件' : 'Event'}</span><strong>{selectedTimelineItem.title}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '链路' : 'Lane'}</span><strong>{selectedTimelineItem.lane}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '时间' : 'Time'}</span><strong>{formatDateTime(selectedTimelineItem.at, locale)}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '关联记录' : 'Reference'}</span><strong>{selectedTimelineItem.reference}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '事件类型' : 'Event type'}</span><strong>{selectedTimelineItem.eventType}</strong></div>
              <InspectionStatus>{selectedTimelineItem.detail}</InspectionStatus>
              <InspectionStatus>
                {selectedTimelineItem.eventType === 'execution'
                  ? (locale === 'zh' ? '继续查看下方执行计划面板，确认 plan、risk、workflow 和 runtime 是否一致。' : 'Continue with the execution plan panel below to verify plan, risk, workflow, and runtime consistency.')
                  : selectedTimelineItem.eventType === 'run'
                    ? (locale === 'zh' ? '继续查看下方研究记录面板，确认回测结果、窗口参数和版本快照是否匹配。' : 'Continue with the research runs panel below to verify backtest results, window parameters, and version snapshots.')
                    : (locale === 'zh' ? '继续查看下方审计轨迹和版本轨迹，确认这次策略写入带来的状态变化。' : 'Continue with the audit trail and version history panels below to confirm the state change from this registry update.')}
              </InspectionStatus>
              {selectedTimelineItem.eventType === 'run' ? (
                <div className="settings-actions">
                  <button
                    type="button"
                    className="inline-action inline-action-approve"
                    onClick={() => navigate(`/backtest?run=${selectedTimelineItem.reference}&strategy=${selectedStrategy?.id || ''}&timeline=${selectedTimelineItem.id}&source=strategies`)}
                  >
                    {locale === 'zh' ? '打开回测详情' : 'Open Backtest Detail'}
                  </button>
                </div>
              ) : null}
              {selectedTimelineItem.eventType === 'execution' ? (
                <div className="settings-actions">
                  <button
                    type="button"
                    className="inline-action inline-action-approve"
                    onClick={() => navigate(`/execution?plan=${selectedTimelineItem.reference}&strategy=${selectedStrategy?.id || ''}&timeline=${selectedTimelineItem.id}&source=strategies`)}
                  >
                    {locale === 'zh' ? '打开执行详情' : 'Open Execution Detail'}
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </InspectionPanel>
        <InspectionPanel
          title={locale === 'zh' ? '选中策略详情' : 'Selected Strategy Detail'}
          copy={locale === 'zh' ? '聚合当前策略的阶段、收益预期、风险参数和研究摘要。' : 'Aggregate the selected strategy’s stage, expected return, risk profile, and research summary.'}
          badge={selectedStrategy?.status || '--'}
        >
          {!selectedStrategy ? (
            <InspectionEmpty>{locale === 'zh' ? '当前没有可查看的策略。' : 'No strategy is available for inspection.'}</InspectionEmpty>
          ) : (
            <div className="status-stack">
              <div className="status-row"><span>{locale === 'zh' ? '名称' : 'Name'}</span><strong>{selectedStrategySnapshot?.name || '--'}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '家族' : 'Family'}</span><strong>{selectedStrategySnapshot?.family || '--'}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '周期' : 'Timeframe'}</span><strong>{selectedStrategySnapshot?.timeframe || '--'}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '标的池' : 'Universe'}</span><strong>{selectedStrategySnapshot?.universe || '--'}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '预期收益' : 'Expected return'}</span><strong>{selectedStrategySnapshot ? `${selectedStrategySnapshot.expectedReturnPct.toFixed(1)}%` : '--'}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '最大回撤' : 'Max drawdown'}</span><strong>{selectedStrategySnapshot ? `${selectedStrategySnapshot.maxDrawdownPct.toFixed(1)}%` : '--'}</strong></div>
              <div className="status-row"><span>Sharpe</span><strong>{selectedStrategySnapshot ? selectedStrategySnapshot.sharpe.toFixed(2) : '--'}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '最近研究' : 'Latest research'}</span><strong>{strategyDetail?.latestRun?.windowLabel || '--'}</strong></div>
              {strategyDetailLoading ? <InspectionStatus>{locale === 'zh' ? '正在同步策略详情...' : 'Syncing strategy detail...'}</InspectionStatus> : null}
              {strategyDetailError ? <InspectionStatus>{locale === 'zh' ? `策略详情加载失败：${strategyDetailError}` : `Failed to load strategy detail: ${strategyDetailError}`}</InspectionStatus> : null}
              <InspectionStatus>{selectedStrategySnapshot?.summary || (locale === 'zh' ? '当前策略暂无摘要。' : 'No strategy summary is available yet.')}</InspectionStatus>
            </div>
          )}
        </InspectionPanel>
        <InspectionListPanel
          title={locale === 'zh' ? '选中策略研究记录' : 'Selected Strategy Research Runs'}
          copy={locale === 'zh' ? '查看当前策略关联的最近回测运行记录。' : 'Review the most recent backtest runs associated with the selected strategy.'}
          badge={selectedStrategyRuns.length}
          badgeClassName="badge-warn"
          terminal
        >
            {!selectedStrategy ? <InspectionEmpty>{locale === 'zh' ? '先从策略注册表选择一条记录。' : 'Select a strategy from the registry first.'}</InspectionEmpty> : null}
            {selectedStrategy && !selectedStrategyRuns.length ? <InspectionEmpty>{locale === 'zh' ? '当前策略还没有研究运行记录。' : 'No research runs exist for the selected strategy yet.'}</InspectionEmpty> : null}
            {selectedStrategyRuns.map((run) => (
              <div className="focus-row" key={run.id}>
                <div className="symbol-cell">
                  <strong>{run.windowLabel}</strong>
                  <span>{run.summary}</span>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '状态' : 'Status'}</span>
                  <strong>{run.status}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '收益' : 'Return'}</span>
                  <strong>{run.status === 'completed' || run.status === 'needs_review' ? `${run.annualizedReturnPct.toFixed(1)}%` : '--'}</strong>
                </div>
                <div className="focus-metric">
                  <span>Sharpe</span>
                  <strong>{run.status === 'completed' || run.status === 'needs_review' ? run.sharpe.toFixed(2) : '--'}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '工作流' : 'Workflow'}</span>
                  <strong>{run.workflowRunId || '--'}</strong>
                </div>
              </div>
            ))}
        </InspectionListPanel>
        <InspectionListPanel
          title={locale === 'zh' ? '选中策略执行计划' : 'Selected Strategy Execution Plans'}
          copy={locale === 'zh' ? '直接查看当前策略在执行侧的承接情况，包括计划状态、workflow 和最新 runtime。' : 'Inspect how the selected strategy is handed off downstream through execution plan status, workflow, and latest runtime.'}
          badge={selectedStrategyExecutionEntries.length}
          badgeClassName="badge-info"
          terminal
        >
          {!selectedStrategy ? <InspectionEmpty>{locale === 'zh' ? '先从策略注册表选择一条记录。' : 'Select a strategy from the registry first.'}</InspectionEmpty> : null}
          {selectedStrategy && executionLoading ? <InspectionEmpty>{locale === 'zh' ? '正在加载关联执行计划...' : 'Loading linked execution plans...'}</InspectionEmpty> : null}
          {selectedStrategy && !executionLoading && !selectedStrategyExecutionEntries.length ? <InspectionEmpty>{locale === 'zh' ? '当前策略还没有进入执行侧。' : 'The selected strategy has not produced downstream execution plans yet.'}</InspectionEmpty> : null}
          {selectedStrategyExecutionEntries.map((entry) => (
            <InspectionMetricsRow
              key={entry.plan.id}
              leadTitle={entry.plan.summary}
              leadCopy={entry.latestRuntime?.message || `${entry.plan.orderCount} ${locale === 'zh' ? '笔订单候选' : 'candidate orders'}`}
              metrics={[
                { label: locale === 'zh' ? '计划状态' : 'Plan status', value: entry.plan.status },
                { label: locale === 'zh' ? '风控' : 'Risk', value: entry.plan.riskStatus },
                { label: locale === 'zh' ? 'Workflow' : 'Workflow', value: entry.workflow?.status || '--' },
                { label: locale === 'zh' ? '运行时' : 'Runtime', value: entry.latestRuntime ? `${entry.latestRuntime.submittedOrderCount}/${entry.latestRuntime.openOrderCount}` : '--' },
              ]}
            />
          ))}
        </InspectionListPanel>
        <InspectionListPanel
          title={locale === 'zh' ? '选中策略审计轨迹' : 'Selected Strategy Audit Trail'}
          copy={locale === 'zh' ? '只展示当前策略的注册、晋级、归档与恢复留痕。' : 'Show only the selected strategy’s registry, promotion, archive, and restore audit trail.'}
          badge={selectedStrategyAuditItems.length}
          terminal
        >
            {!selectedStrategy ? <InspectionEmpty>{locale === 'zh' ? '先从策略注册表选择一条记录。' : 'Select a strategy from the registry first.'}</InspectionEmpty> : null}
            {selectedStrategy && !selectedStrategyAuditItems.length ? <InspectionEmpty>{locale === 'zh' ? '当前策略还没有审计轨迹。' : 'No audit trail exists for the selected strategy yet.'}</InspectionEmpty> : null}
            {selectedStrategyAuditItems.map((item) => {
              const status = typeof item.metadata?.status === 'string' ? item.metadata.status : '--';
              return (
                <InspectionMetricsRow
                  key={item.id}
                  leadTitle={item.title}
                  leadCopy={item.detail}
                  metrics={[
                    { label: locale === 'zh' ? '状态' : 'Status', value: status },
                    { label: locale === 'zh' ? '操作人' : 'Actor', value: item.actor },
                    { label: locale === 'zh' ? '时间' : 'Time', value: formatDateTime(item.createdAt, locale) },
                  ]}
                />
              );
            })}
        </InspectionListPanel>
        <InspectionListPanel
          title={locale === 'zh' ? '选中策略版本轨迹' : 'Selected Strategy Version History'}
          copy={locale === 'zh' ? '从 audit metadata 读取最近版本的评分和风险参数，观察策略快照如何变化。' : 'Read the latest score and risk parameter snapshots from audit metadata to track how the strategy evolved.'}
          badge={selectedStrategyVersionItems.length}
          badgeClassName="badge-warn"
          terminal
        >
            {!selectedStrategy ? <InspectionEmpty>{locale === 'zh' ? '先从策略注册表选择一条记录。' : 'Select a strategy from the registry first.'}</InspectionEmpty> : null}
            {selectedStrategy && !selectedStrategyVersionItems.length ? <InspectionEmpty>{locale === 'zh' ? '当前策略还没有可回放的版本快照。' : 'No version snapshots are available for the selected strategy yet.'}</InspectionEmpty> : null}
            {selectedStrategyVersionItems.map((item) => {
              const score = typeof item.metadata?.score === 'number' ? item.metadata.score : null;
              const expectedReturnPct = typeof item.metadata?.expectedReturnPct === 'number' ? item.metadata.expectedReturnPct : null;
              const maxDrawdownPct = typeof item.metadata?.maxDrawdownPct === 'number' ? item.metadata.maxDrawdownPct : null;
              const sharpe = typeof item.metadata?.sharpe === 'number' ? item.metadata.sharpe : null;
              return (
                <InspectionMetricsRow
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
        </InspectionListPanel>
      </section>
    </>
  );
}

export default StrategiesPage;
