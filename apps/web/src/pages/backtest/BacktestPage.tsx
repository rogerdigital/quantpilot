import { useTradingSystem } from '../../store/trading-system/TradingSystemProvider.tsx';
import { ChartCanvas, SectionHeader, TopMeta } from '../console/components/ConsoleChrome.tsx';
import { useSummary } from '../console/hooks.ts';
import { copy, useLocale } from '../console/i18n.tsx';
import { fmtPct, translateMode, translateRiskLevel, translateRuntimeText } from '../console/utils.ts';

export default function BacktestPage() {
  const { state } = useTradingSystem();
  const { locale } = useLocale();
  const { totalPnlPct } = useSummary();
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
                  ? '当前先复用模拟账户权益曲线，作为回测中心的最小可视化入口。'
                  : 'The prototype reuses simulated account equity as the first visual surface for a future backtest center.'}
              </div>
            </div>
            <div className="panel-badge badge-info">BACKTEST</div>
          </div>
          <ChartCanvas kind="equity" />
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '研究摘要' : 'Research Summary'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '把策略层的候选信号、收益口径和运行模式压缩成一个研究概览。'
                  : 'Compress candidate signals, return posture, and execution mode into one research summary.'}
              </div>
            </div>
            <div className="panel-badge badge-warn">SUMMARY</div>
          </div>
          <div className="status-stack">
            <div className="status-row"><span>{locale === 'zh' ? '候选买入' : 'Candidate buys'}</span><strong>{buyCount}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '候选减仓' : 'Candidate trims'}</span><strong>{sellCount}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '组合收益' : 'Portfolio return'}</span><strong>{fmtPct(totalPnlPct)}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '研究模式' : 'Research mode'}</span><strong>{translateMode(locale, state.mode)}</strong></div>
            <div className="status-copy">{translateRuntimeText(locale, state.decisionCopy)}</div>
          </div>
        </article>
      </section>
    </>
  );
}
