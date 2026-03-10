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
  const buyCount = state.stockStates.filter((stock) => stock.signal === 'BUY').length;
  const sellCount = state.stockStates.filter((stock) => stock.signal === 'SELL').length;
  const canWriteStrategy = hasPermission('strategy:write');

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
            <div className="status-row"><span>{locale === 'zh' ? '候选买入' : 'Candidate buys'}</span><strong>{buyCount}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '候选减仓' : 'Candidate trims'}</span><strong>{sellCount}</strong></div>
            <div className="status-row"><span>{copy[locale].terms.executionRoute}</span><strong>{translateMode(locale, state.mode)}</strong></div>
            {!canWriteStrategy ? <div className="status-copy">{locale === 'zh' ? '当前会话没有 strategy:write 权限，策略工作台处于只读态。' : 'This session does not have strategy:write permission. The strategy workspace is read-only.'}</div> : null}
            <div className="status-copy">{locale === 'zh' ? '后续可以把这里继续拆成 Strategy Registry / Backtest / Optimizer / Evaluator 四块。' : 'This can later split into Strategy Registry, Backtest, Optimizer, and Evaluator modules.'}</div>
          </div>
        </article>
      </section>
    </>
  );
}

export default StrategiesPage;
