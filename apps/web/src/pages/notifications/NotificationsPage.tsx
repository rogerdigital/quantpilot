import { useTradingSystem } from '../../store/trading-system/TradingSystemProvider.tsx';
import { useNotificationsFeed } from '../../hooks/useNotificationsFeed.ts';
import { SectionHeader, TopMeta } from '../console/components/ConsoleChrome.tsx';
import { ActivityLog } from '../console/components/ConsoleTables.tsx';
import { copy, useLocale } from '../console/i18n.tsx';

export default function NotificationsPage() {
  const { state } = useTradingSystem();
  const { locale } = useLocale();
  const { items, loading } = useNotificationsFeed();
  const connectedCount = Number(state.integrationStatus.marketData.connected) + Number(state.integrationStatus.broker.connected);

  return (
    <>
      <SectionHeader routeKey="notifications" />
      <TopMeta items={[
        { label: locale === 'zh' ? '系统事件' : 'System Events', value: String(state.activityLog.length), accent: true },
        { label: copy[locale].terms.pendingApprovals, value: String(state.approvalQueue.length) },
        { label: locale === 'zh' ? '在线链路' : 'Connected Links', value: `${connectedCount}/2` },
        { label: locale === 'zh' ? '控制面状态' : 'Control Plane', value: state.controlPlane.lastStatus },
      ]} />

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '通知流' : 'Notification Stream'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '统一查看执行事件、风险拦截、审批动作和系统提示。'
                  : 'Review execution events, risk blocks, approval actions, and system notices in one stream.'}
              </div>
            </div>
            <div className="panel-badge badge-info">EVENTS</div>
          </div>
          <ActivityLog />
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '控制面通知' : 'Control Plane Notifications'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '来自后端任务编排、审计和告警模块的事件流。'
                  : 'Events emitted by backend task orchestration, audit, and alert modules.'}
              </div>
            </div>
            <div className="panel-badge badge-warn">{items.length}</div>
          </div>
          <div className="focus-list focus-list-terminal">
            {loading ? <div className="empty-cell">{locale === 'zh' ? '正在加载通知...' : 'Loading notifications...'}</div> : null}
            {!loading && !items.length ? <div className="empty-cell">{locale === 'zh' ? '暂无控制面通知' : 'No control-plane notifications yet.'}</div> : null}
            {!loading ? items.map((item) => (
              <div className="focus-row" key={item.id}>
                <div className="symbol-cell">
                  <strong>{item.title}</strong>
                  <span>{item.message}</span>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '来源' : 'Source'}</span>
                  <strong>{item.source}</strong>
                </div>
              </div>
            )) : null}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '控制面裁决' : 'Control Plane Resolution'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '这里展示后端对当前周期的最终控制面判断。'
                  : 'This summarizes the backend control-plane decision for the current cycle.'}
              </div>
            </div>
            <div className="panel-badge badge-info">{state.controlPlane.notificationCount}</div>
          </div>
          <div className="status-stack">
            <div className="status-row"><span>{locale === 'zh' ? '操作员' : 'Operator'}</span><strong>{state.controlPlane.operator}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '状态' : 'Status'}</span><strong>{state.controlPlane.lastStatus}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '审计记录' : 'Audit Records'}</span><strong>{state.controlPlane.auditCount}</strong></div>
            <div className="status-copy">{state.controlPlane.routeHint}</div>
          </div>
        </article>
      </section>
    </>
  );
}
