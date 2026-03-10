import { useTradingSystem } from '../../store/trading-system/TradingSystemProvider.tsx';
import { useRiskEventsFeed } from '../../modules/risk/useRiskEventsFeed.ts';
import { SectionHeader, TopMeta } from '../console/components/ConsoleChrome.tsx';
import { ApprovalQueueTable, PositionsTable } from '../console/components/ConsoleTables.tsx';
import { useSummary } from '../console/hooks.ts';
import { copy, useLocale } from '../console/i18n.tsx';
import { fmtCurrency, integrationTone, riskTone, translateRiskLevel } from '../console/utils.ts';

function RiskPage() {
  const { state, approveLiveIntent, rejectLiveIntent } = useTradingSystem();
  const { locale } = useLocale();
  const { paper, live } = useSummary();
  const { items, loading } = useRiskEventsFeed();

  return (
    <>
      <SectionHeader routeKey="risk" />
      <TopMeta items={[
        { label: copy[locale].terms.riskLevel, value: translateRiskLevel(locale, state.riskLevel), accent: true },
        { label: copy[locale].labels.marketState, value: state.integrationStatus.marketData.connected ? copy[locale].labels.connected : copy[locale].labels.fallback },
        { label: copy[locale].terms.pendingApprovals, value: String(state.approvalQueue.length) },
      ]} />

      <section className="metrics-grid">
        <article className="metric-tile"><div className="tile-label">{locale === 'zh' ? '组合风险' : 'Portfolio Risk'}</div><div className={`tile-value tone-${riskTone(state.riskLevel)}`}>{translateRiskLevel(locale, state.riskLevel)}</div><div className="tile-sub">{locale === 'zh' ? '当前系统风控结论' : 'Current system risk posture'}</div></article>
        <article className="metric-tile"><div className="tile-label">{locale === 'zh' ? '模拟盘暴露' : 'Paper Exposure'}</div><div className="tile-value">{paper.exposure.toFixed(1)}%</div><div className="tile-sub">{fmtCurrency(paper.nav)}</div></article>
        <article className="metric-tile"><div className="tile-label">{locale === 'zh' ? '实盘暴露' : 'Live Exposure'}</div><div className="tile-value">{live.exposure.toFixed(1)}%</div><div className="tile-sub">{fmtCurrency(live.nav)}</div></article>
        <article className="metric-tile"><div className="tile-label">{locale === 'zh' ? '接入健康' : 'Connectivity'}</div><div className={`tile-value tone-${integrationTone(state.integrationStatus.broker.connected, false, true)}`}>{state.integrationStatus.broker.connected ? copy[locale].labels.connected : copy[locale].labels.localMirror}</div><div className="tile-sub">{locale === 'zh' ? '影响风控审批与执行闭环' : 'Affects approvals and execution closure'}</div></article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{copy[locale].terms.pendingApprovals}</div><div className="panel-copy">{locale === 'zh' ? '把所有需要人工确认的 live 动作集中到风险闸门。' : 'Keep all live actions that require confirmation behind one risk gate.'}</div></div><div className={`panel-badge ${state.approvalQueue.length ? 'badge-warn' : 'badge-muted'}`}>{state.approvalQueue.length}</div></div>
          <ApprovalQueueTable onApprove={approveLiveIntent} onReject={rejectLiveIntent} />
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '风险事件流' : 'Risk Event Stream'}</div><div className="panel-copy">{locale === 'zh' ? '后端 worker 生成的风险扫描事件会集中展示在这里。' : 'Risk scan events produced by the backend worker are aggregated here.'}</div></div><div className="panel-badge badge-info">{items.length}</div></div>
          <div className="focus-list focus-list-terminal">
            {loading ? <div className="empty-cell">{locale === 'zh' ? '正在加载风险事件...' : 'Loading risk events...'}</div> : null}
            {!loading && !items.length ? <div className="empty-cell">{locale === 'zh' ? '暂无风险事件' : 'No risk events yet.'}</div> : null}
            {!loading ? items.map((item) => (
              <div className="focus-row" key={item.id}>
                <div className="symbol-cell">
                  <strong>{item.title}</strong>
                  <span>{item.message}</span>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '状态' : 'Status'}</span>
                  <strong>{item.status}</strong>
                </div>
              </div>
            )) : null}
          </div>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '模拟盘持仓风险' : 'Paper Position Risk'}</div><div className="panel-copy">{locale === 'zh' ? '用现有持仓视图观察策略侧的仓位暴露。' : 'Use the existing holdings view to inspect strategy-side position exposure.'}</div></div><div className="panel-badge badge-muted">PAPER</div></div>
          <PositionsTable accountKey="paper" />
        </article>
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '实盘持仓风险' : 'Live Position Risk'}</div><div className="panel-copy">{locale === 'zh' ? '用同步回来的持仓观察真实执行面的风险状态。' : 'Inspect broker-synced holdings to understand live-side risk posture.'}</div></div><div className="panel-badge badge-ok">LIVE</div></div>
          <PositionsTable accountKey="live" />
        </article>
      </section>
    </>
  );
}

export default RiskPage;
