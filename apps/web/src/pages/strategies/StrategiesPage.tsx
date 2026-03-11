import { useEffect, useState } from 'react';
import { ApiPermissionError } from '../../app/api/controlPlane.ts';
import { useAuditFeed } from '../../modules/audit/useAuditFeed.ts';
import { saveStrategyCatalogItem } from '../../modules/research/research.service.ts';
import { useResearchHub } from '../../modules/research/useResearchHub.ts';
import { useTradingSystem } from '../../store/trading-system/TradingSystemProvider.tsx';
import { ChartCanvas, SectionHeader, TopMeta } from '../console/components/ConsoleChrome.tsx';
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

function StrategiesPage() {
  const { state, session, hasPermission } = useTradingSystem();
  const { locale } = useLocale();
  const goToSettings = useSettingsNavigation();
  const [refreshKey, setRefreshKey] = useState(0);
  const [registryFilter, setRegistryFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [selectedStrategyId, setSelectedStrategyId] = useState('');
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
  const selectedStrategyRuns = data?.runs.filter((item) => item.strategyId === selectedStrategy?.id).slice(0, 6) || [];
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
    if (!selectedStrategyId || !visibleStrategies.some((item) => item.id === selectedStrategyId)) {
      setSelectedStrategyId(visibleStrategies[0].id);
    }
  }, [selectedStrategyId, visibleActiveStrategies, visibleArchivedStrategies]);

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
                  <span>{locale === 'zh' ? '预期收益' : 'Expected return'}</span>
                  <strong>{item.expectedReturnPct.toFixed(1)}%</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '动作' : 'Actions'}</span>
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
                </div>
              </div>
            ))}
            {visibleArchivedStrategies.length ? (
              <div className="status-copy">{locale === 'zh' ? '已归档策略' : 'Archived strategies'}</div>
            ) : null}
            {visibleArchivedStrategies.map((item) => (
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
                  <span>{locale === 'zh' ? '预期收益' : 'Expected return'}</span>
                  <strong>{item.expectedReturnPct.toFixed(1)}%</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '动作' : 'Actions'}</span>
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
                </div>
              </div>
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
                    <strong>{new Date(item.createdAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '选中策略详情' : 'Selected Strategy Detail'}</div><div className="panel-copy">{locale === 'zh' ? '聚合当前策略的阶段、收益预期、风险参数和研究摘要。' : 'Aggregate the selected strategy’s stage, expected return, risk profile, and research summary.'}</div></div><div className="panel-badge badge-info">{selectedStrategy?.status || '--'}</div></div>
          {!selectedStrategy ? (
            <div className="empty-cell">{locale === 'zh' ? '当前没有可查看的策略。' : 'No strategy is available for inspection.'}</div>
          ) : (
            <div className="status-stack">
              <div className="status-row"><span>{locale === 'zh' ? '名称' : 'Name'}</span><strong>{selectedStrategy.name}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '家族' : 'Family'}</span><strong>{selectedStrategy.family}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '周期' : 'Timeframe'}</span><strong>{selectedStrategy.timeframe}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '标的池' : 'Universe'}</span><strong>{selectedStrategy.universe}</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '预期收益' : 'Expected return'}</span><strong>{selectedStrategy.expectedReturnPct.toFixed(1)}%</strong></div>
              <div className="status-row"><span>{locale === 'zh' ? '最大回撤' : 'Max drawdown'}</span><strong>{selectedStrategy.maxDrawdownPct.toFixed(1)}%</strong></div>
              <div className="status-row"><span>Sharpe</span><strong>{selectedStrategy.sharpe.toFixed(2)}</strong></div>
              <div className="status-copy">{selectedStrategy.summary}</div>
            </div>
          )}
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '选中策略研究记录' : 'Selected Strategy Research Runs'}</div><div className="panel-copy">{locale === 'zh' ? '查看当前策略关联的最近回测运行记录。' : 'Review the most recent backtest runs associated with the selected strategy.'}</div></div><div className="panel-badge badge-warn">{selectedStrategyRuns.length}</div></div>
          <div className="focus-list focus-list-terminal">
            {!selectedStrategy ? <div className="empty-cell">{locale === 'zh' ? '先从策略注册表选择一条记录。' : 'Select a strategy from the registry first.'}</div> : null}
            {selectedStrategy && !selectedStrategyRuns.length ? <div className="empty-cell">{locale === 'zh' ? '当前策略还没有研究运行记录。' : 'No research runs exist for the selected strategy yet.'}</div> : null}
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
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '选中策略审计轨迹' : 'Selected Strategy Audit Trail'}</div><div className="panel-copy">{locale === 'zh' ? '只展示当前策略的注册、晋级、归档与恢复留痕。' : 'Show only the selected strategy’s registry, promotion, archive, and restore audit trail.'}</div></div><div className="panel-badge badge-info">{selectedStrategyAuditItems.length}</div></div>
          <div className="focus-list focus-list-terminal">
            {!selectedStrategy ? <div className="empty-cell">{locale === 'zh' ? '先从策略注册表选择一条记录。' : 'Select a strategy from the registry first.'}</div> : null}
            {selectedStrategy && !selectedStrategyAuditItems.length ? <div className="empty-cell">{locale === 'zh' ? '当前策略还没有审计轨迹。' : 'No audit trail exists for the selected strategy yet.'}</div> : null}
            {selectedStrategyAuditItems.map((item) => {
              const status = typeof item.metadata?.status === 'string' ? item.metadata.status : '--';
              return (
                <div className="focus-row" key={item.id}>
                  <div className="symbol-cell">
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
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
                    <strong>{new Date(item.createdAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '选中策略版本轨迹' : 'Selected Strategy Version History'}</div><div className="panel-copy">{locale === 'zh' ? '从 audit metadata 读取最近版本的评分和风险参数，观察策略快照如何变化。' : 'Read the latest score and risk parameter snapshots from audit metadata to track how the strategy evolved.'}</div></div><div className="panel-badge badge-warn">{selectedStrategyVersionItems.length}</div></div>
          <div className="focus-list focus-list-terminal">
            {!selectedStrategy ? <div className="empty-cell">{locale === 'zh' ? '先从策略注册表选择一条记录。' : 'Select a strategy from the registry first.'}</div> : null}
            {selectedStrategy && !selectedStrategyVersionItems.length ? <div className="empty-cell">{locale === 'zh' ? '当前策略还没有可回放的版本快照。' : 'No version snapshots are available for the selected strategy yet.'}</div> : null}
            {selectedStrategyVersionItems.map((item) => {
              const score = typeof item.metadata?.score === 'number' ? item.metadata.score : null;
              const expectedReturnPct = typeof item.metadata?.expectedReturnPct === 'number' ? item.metadata.expectedReturnPct : null;
              const maxDrawdownPct = typeof item.metadata?.maxDrawdownPct === 'number' ? item.metadata.maxDrawdownPct : null;
              const sharpe = typeof item.metadata?.sharpe === 'number' ? item.metadata.sharpe : null;
              return (
                <div className="focus-row" key={item.id}>
                  <div className="symbol-cell">
                    <strong>{new Date(item.createdAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}</strong>
                    <span>{item.detail}</span>
                  </div>
                  <div className="focus-metric">
                    <span>{locale === 'zh' ? '阶段' : 'Stage'}</span>
                    <strong>{typeof item.metadata?.status === 'string' ? item.metadata.status : '--'}</strong>
                  </div>
                  <div className="focus-metric">
                    <span>{locale === 'zh' ? '评分' : 'Score'}</span>
                    <strong>{score ?? '--'}</strong>
                  </div>
                  <div className="focus-metric">
                    <span>{locale === 'zh' ? '收益/回撤' : 'Return / Drawdown'}</span>
                    <strong>{expectedReturnPct !== null && maxDrawdownPct !== null ? `${expectedReturnPct.toFixed(1)}% / ${maxDrawdownPct.toFixed(1)}%` : '--'}</strong>
                  </div>
                  <div className="focus-metric">
                    <span>Sharpe</span>
                    <strong>{sharpe !== null ? sharpe.toFixed(2) : '--'}</strong>
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

export default StrategiesPage;
