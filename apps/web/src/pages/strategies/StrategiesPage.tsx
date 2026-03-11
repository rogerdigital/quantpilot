import { useResearchHub } from '../../modules/research/useResearchHub.ts';
import { useTradingSystem } from '../../store/trading-system/TradingSystemProvider.tsx';
import { ChartCanvas, SectionHeader, TopMeta } from '../console/components/ConsoleChrome.tsx';
import { UniverseTable } from '../console/components/ConsoleTables.tsx';
import { onShortcutKeyDown, useSettingsNavigation } from '../console/hooks.ts';
import { copy, useLocale } from '../console/i18n.tsx';
import { translateMode, translateRuntimeText } from '../console/utils.ts';

function StrategiesPage() {
  const { state, hasPermission } = useTradingSystem();
  const { locale } = useLocale();
  const goToSettings = useSettingsNavigation();
  const { data, loading, error } = useResearchHub();
  const buyCount = state.stockStates.filter((stock) => stock.signal === 'BUY').length;
  const sellCount = state.stockStates.filter((stock) => stock.signal === 'SELL').length;
  const canWriteStrategy = hasPermission('strategy:write');
  const promotedCount = data?.strategies.filter((item) => item.status === 'paper' || item.status === 'live').length || 0;

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
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '后端策略注册表' : 'Backend Strategy Registry'}</div><div className="panel-copy">{locale === 'zh' ? '直接消费研究服务返回的策略目录，避免页面本地状态冒充注册表事实来源。' : 'Consume the backend strategy catalog directly instead of treating page-local runtime state as the registry source of truth.'}</div></div><div className="panel-badge badge-info">{data?.summary.dataSource ? 'SERVICE' : 'LOCAL'}</div></div>
          <div className="focus-list focus-list-terminal">
            {!loading && !data?.strategies.length ? <div className="empty-cell">{locale === 'zh' ? '暂无策略目录' : 'No strategies in the registry yet.'}</div> : null}
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
                  <span>{locale === 'zh' ? '预期收益' : 'Expected return'}</span>
                  <strong>{item.expectedReturnPct.toFixed(1)}%</strong>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}

export default StrategiesPage;
