import { useState } from 'react';
import { useTradingSystem } from '../../store/trading-system/TradingSystemProvider.tsx';
import { useLatestBrokerSnapshot } from '../../hooks/useLatestBrokerSnapshot.ts';
import { useMarketProviderStatus } from '../../hooks/useMarketProviderStatus.ts';
import { useMonitoringStatus } from '../../hooks/useMonitoringStatus.ts';
import { useNotificationsFeed } from '../../modules/notifications/useNotificationsFeed.ts';
import { useMonitoringAlertsFeed } from '../../modules/notifications/useMonitoringAlertsFeed.ts';
import { useMonitoringSnapshotsFeed } from '../../modules/notifications/useMonitoringSnapshotsFeed.ts';
import { useOperatorActionsFeed } from '../../modules/notifications/useOperatorActionsFeed.ts';
import { useSchedulerTicksFeed } from '../../modules/notifications/useSchedulerTicksFeed.ts';
import { SectionHeader, TopMeta } from '../console/components/ConsoleChrome.tsx';
import { ActivityLog } from '../console/components/ConsoleTables.tsx';
import { copy, useLocale } from '../console/i18n.tsx';
import { connectionLabel, fmtDateTime, monitoringTone, translateMonitoringStatus, translateProviderLabel } from '../console/utils.ts';

const MONITORING_TIME_WINDOWS = [
  { key: '1h', hours: 1 },
  { key: '24h', hours: 24 },
  { key: '7d', hours: 24 * 7 },
  { key: 'all', hours: null },
] as const;

function isWithinWindow(value: string, hours: number | null) {
  if (hours === null) return true;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return false;
  return Date.now() - timestamp <= hours * 60 * 60 * 1000;
}

function NotificationsPage() {
  const { state } = useTradingSystem();
  const { locale } = useLocale();
  const [monitoringSourceFilter, setMonitoringSourceFilter] = useState('all');
  const [monitoringLevelFilter, setMonitoringLevelFilter] = useState('all');
  const [selectedMonitoringSnapshotId, setSelectedMonitoringSnapshotId] = useState('');
  const [monitoringSnapshotStatusFilter, setMonitoringSnapshotStatusFilter] = useState('all');
  const [monitoringTimeWindow, setMonitoringTimeWindow] = useState<(typeof MONITORING_TIME_WINDOWS)[number]['key']>('24h');
  const { snapshot } = useLatestBrokerSnapshot(state.controlPlane.lastSyncAt);
  const { status: marketStatus } = useMarketProviderStatus(state.controlPlane.lastSyncAt);
  const { status: monitoringStatus, loading: monitoringLoading } = useMonitoringStatus(state.controlPlane.lastSyncAt);
  const { items: monitoringAlertItems, loading: monitoringAlertsLoading } = useMonitoringAlertsFeed();
  const { items: monitoringSnapshotItems, loading: monitoringSnapshotsLoading } = useMonitoringSnapshotsFeed();
  const { items, loading } = useNotificationsFeed();
  const { items: actionItems, loading: actionLoading } = useOperatorActionsFeed();
  const { items: schedulerItems, loading: schedulerLoading } = useSchedulerTicksFeed();
  const marketConnected = marketStatus?.connected ?? state.integrationStatus.marketData.connected;
  const marketFallback = marketStatus?.fallback ?? !marketConnected;
  const brokerConnected = Boolean(snapshot?.connected ?? state.integrationStatus.broker.connected);
  const connectedCount = Number(marketConnected) + Number(brokerConnected);
  const marketProviderLabel = translateProviderLabel(
    locale,
    marketStatus?.provider === 'alpaca'
      ? 'Alpaca Market Data via Gateway'
      : marketStatus?.provider === 'custom-http'
        ? 'HTTP 行情网关'
        : (state.integrationStatus.marketData.label || state.integrationStatus.marketData.provider),
  );
  const monitoringWorkflowBacklog = (monitoringStatus?.services.workflows.queued || 0)
    + (monitoringStatus?.services.workflows.running || 0)
    + (monitoringStatus?.services.workflows.retryScheduled || 0);
  const monitoringQueueBacklog = (monitoringStatus?.services.queues.pendingNotificationJobs || 0)
    + (monitoringStatus?.services.queues.pendingRiskScanJobs || 0)
    + (monitoringStatus?.services.queues.pendingAgentReviews || 0);
  const workerHeartbeatLag = monitoringStatus?.services.worker.lagSeconds;
  const activeTimeWindow = MONITORING_TIME_WINDOWS.find((item) => item.key === monitoringTimeWindow) || MONITORING_TIME_WINDOWS[1];
  const monitoringSources = ['all', ...new Set(monitoringAlertItems.map((item) => item.source).filter(Boolean))];
  const monitoringLevels = ['all', ...new Set(monitoringAlertItems.map((item) => item.level).filter(Boolean))];
  const monitoringSnapshotStatuses = ['all', ...new Set(monitoringSnapshotItems.map((item) => item.status).filter(Boolean))];
  const filteredMonitoringAlerts = monitoringAlertItems.filter((item) => {
    if (!isWithinWindow(item.createdAt, activeTimeWindow.hours)) return false;
    if (selectedMonitoringSnapshotId && item.snapshotId !== selectedMonitoringSnapshotId) return false;
    if (monitoringSourceFilter !== 'all' && item.source !== monitoringSourceFilter) return false;
    if (monitoringLevelFilter !== 'all' && item.level !== monitoringLevelFilter) return false;
    return true;
  });
  const filteredMonitoringSnapshots = monitoringSnapshotItems.filter((item) => (
    (monitoringSnapshotStatusFilter === 'all' || item.status === monitoringSnapshotStatusFilter)
    && isWithinWindow(item.generatedAt || item.createdAt, activeTimeWindow.hours)
  ));
  const selectedMonitoringSnapshot = monitoringSnapshotItems.find((item) => item.id === selectedMonitoringSnapshotId) || null;

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
              <div className="panel-title">{locale === 'zh' ? '运行态摘要' : 'Monitoring Summary'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '把 worker、workflow、风险和队列积压收敛成一个控制面健康摘要。'
                  : 'Collapse worker, workflow, risk, and queue backlog into one control-plane health summary.'}
              </div>
            </div>
            <div className={`panel-badge tone-${monitoringTone(monitoringStatus?.status)}`}>{monitoringLoading ? '...' : translateMonitoringStatus(locale, monitoringStatus?.status)}</div>
          </div>
          <div className="status-stack">
            <div className="status-row"><span>{locale === 'zh' ? '系统健康' : 'System health'}</span><strong>{monitoringLoading ? (locale === 'zh' ? '加载中' : 'Loading') : translateMonitoringStatus(locale, monitoringStatus?.status)}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? 'Worker 心跳' : 'Worker heartbeat'}</span><strong>{workerHeartbeatLag === null || workerHeartbeatLag === undefined ? '--' : `${workerHeartbeatLag}s`}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? 'Workflow 积压' : 'Workflow backlog'}</span><strong>{monitoringWorkflowBacklog}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '待处理队列' : 'Pending queues'}</span><strong>{monitoringQueueBacklog}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '风险阻断' : 'Risk-off events'}</span><strong>{monitoringStatus?.services.risk.riskOff || 0}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '人工复核' : 'Manual reviews'}</span><strong>{monitoringStatus?.services.queues.pendingAgentReviews || 0}</strong></div>
            <div className="status-copy">{monitoringStatus?.services.worker.message || (locale === 'zh' ? '监控摘要尚未返回。' : 'Monitoring summary has not returned yet.')}</div>
            <div className="status-copy">{monitoringStatus?.generatedAt ? `${locale === 'zh' ? '摘要时间' : 'Summary time'}: ${fmtDateTime(monitoringStatus.generatedAt, locale)}` : ''}</div>
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '监控告警' : 'Monitoring Alerts'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '直接查看 Monitoring 模块聚合出的当前告警来源和原因，并按快照、来源或级别快速聚焦。'
                  : 'Inspect monitoring alerts and quickly focus by snapshot, source, or severity.'}
              </div>
            </div>
            <div className="panel-badge badge-warn">{filteredMonitoringAlerts.length}</div>
          </div>
          <div className="settings-chip-row">
            {MONITORING_TIME_WINDOWS.map((window) => {
              const selected = monitoringTimeWindow === window.key;
              const label = window.key === '1h'
                ? (locale === 'zh' ? '最近 1 小时' : 'Last 1h')
                : window.key === '24h'
                  ? (locale === 'zh' ? '最近 24 小时' : 'Last 24h')
                  : window.key === '7d'
                    ? (locale === 'zh' ? '最近 7 天' : 'Last 7d')
                    : (locale === 'zh' ? '全部时间' : 'All Time');
              return (
                <button
                  key={window.key}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setMonitoringTimeWindow(window.key)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="settings-chip-row">
            <button
              type="button"
              className={`settings-chip${selectedMonitoringSnapshotId ? ' active' : ''}`}
              onClick={() => setSelectedMonitoringSnapshotId('')}
            >
              {selectedMonitoringSnapshot
                ? (locale === 'zh'
                  ? `快照 ${fmtDateTime(selectedMonitoringSnapshot.generatedAt || selectedMonitoringSnapshot.createdAt, locale)}`
                  : `Snapshot ${fmtDateTime(selectedMonitoringSnapshot.generatedAt || selectedMonitoringSnapshot.createdAt, locale)}`)
                : (locale === 'zh' ? '全部快照' : 'All Snapshots')}
            </button>
          </div>
          <div className="settings-chip-row">
            {monitoringSources.map((source) => {
              const selected = monitoringSourceFilter === source;
              const label = source === 'all' ? (locale === 'zh' ? '全部来源' : 'All Sources') : source;
              return (
                <button
                  key={source}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setMonitoringSourceFilter(source)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="settings-chip-row">
            {monitoringLevels.map((level) => {
              const selected = monitoringLevelFilter === level;
              const label = level === 'all' ? (locale === 'zh' ? '全部级别' : 'All Levels') : translateMonitoringStatus(locale, level);
              return (
                <button
                  key={level}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setMonitoringLevelFilter(level)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="focus-list focus-list-terminal">
            {monitoringAlertsLoading ? <div className="empty-cell">{locale === 'zh' ? '正在加载监控告警...' : 'Loading monitoring alerts...'}</div> : null}
            {!monitoringAlertsLoading && !filteredMonitoringAlerts.length ? <div className="empty-cell">{locale === 'zh' ? '当前筛选条件下没有监控告警' : 'No monitoring alerts match the current filters.'}</div> : null}
            {!monitoringAlertsLoading ? filteredMonitoringAlerts.map((item) => (
              <div className="focus-row" key={item.id}>
                <div className="symbol-cell">
                  <strong>{item.source}</strong>
                  <span>{item.message}</span>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '级别' : 'Level'}</span>
                  <strong>{translateMonitoringStatus(locale, item.level)}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '时间' : 'Time'}</span>
                  <strong>{fmtDateTime(item.createdAt, locale)}</strong>
                </div>
              </div>
            )) : null}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '监控快照' : 'Monitoring Snapshots'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '查看最近几次 monitoring snapshot 的状态演进、告警数量和采样时间。'
                  : 'Review recent monitoring snapshots to track status changes, alert count, and sampling time.'}
              </div>
            </div>
            <div className="panel-badge badge-info">{filteredMonitoringSnapshots.length}</div>
          </div>
          <div className="settings-chip-row">
            {MONITORING_TIME_WINDOWS.map((window) => {
              const selected = monitoringTimeWindow === window.key;
              const label = window.key === '1h'
                ? (locale === 'zh' ? '最近 1 小时' : 'Last 1h')
                : window.key === '24h'
                  ? (locale === 'zh' ? '最近 24 小时' : 'Last 24h')
                  : window.key === '7d'
                    ? (locale === 'zh' ? '最近 7 天' : 'Last 7d')
                    : (locale === 'zh' ? '全部时间' : 'All Time');
              return (
                <button
                  key={window.key}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setMonitoringTimeWindow(window.key)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="settings-chip-row">
            {monitoringSnapshotStatuses.map((status) => {
              const selected = monitoringSnapshotStatusFilter === status;
              const label = status === 'all' ? (locale === 'zh' ? '全部状态' : 'All Statuses') : translateMonitoringStatus(locale, status);
              return (
                <button
                  key={status}
                  type="button"
                  className={`settings-chip${selected ? ' active' : ''}`}
                  onClick={() => setMonitoringSnapshotStatusFilter(status)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="focus-list focus-list-terminal">
            {monitoringSnapshotsLoading ? <div className="empty-cell">{locale === 'zh' ? '正在加载监控快照...' : 'Loading monitoring snapshots...'}</div> : null}
            {!monitoringSnapshotsLoading && !filteredMonitoringSnapshots.length ? <div className="empty-cell">{locale === 'zh' ? '当前筛选条件下没有监控快照' : 'No monitoring snapshots match the current filters.'}</div> : null}
            {!monitoringSnapshotsLoading ? filteredMonitoringSnapshots.map((item) => (
              <button
                type="button"
                className="focus-row status-row-button"
                key={item.id}
                onClick={() => setSelectedMonitoringSnapshotId((current) => (current === item.id ? '' : item.id))}
              >
                <div className="symbol-cell">
                  <strong>{translateMonitoringStatus(locale, item.status)}</strong>
                  <span>
                    {selectedMonitoringSnapshotId === item.id
                      ? (locale === 'zh' ? `已选中 · 告警 ${item.alertCount} 条` : `Selected · ${item.alertCount} alerts`)
                      : (locale === 'zh' ? `告警 ${item.alertCount} 条` : `${item.alertCount} alerts`)}
                  </span>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '采样时间' : 'Captured'}</span>
                  <strong>{fmtDateTime(item.generatedAt || item.createdAt, locale)}</strong>
                </div>
              </button>
            )) : null}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '操作动作流' : 'Operator Actions'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '查看批准、拒绝、撤单等操作员动作的后端记录。'
                  : 'Review backend-recorded operator actions such as approvals, rejections, and cancellations.'}
              </div>
            </div>
            <div className="panel-badge badge-info">{actionItems.length}</div>
          </div>
          <div className="focus-list focus-list-terminal">
            {actionLoading ? <div className="empty-cell">{locale === 'zh' ? '正在加载操作动作...' : 'Loading operator actions...'}</div> : null}
            {!actionLoading && !actionItems.length ? <div className="empty-cell">{locale === 'zh' ? '暂无操作动作' : 'No operator actions yet.'}</div> : null}
            {!actionLoading ? actionItems.map((item) => (
              <div className="focus-row" key={item.id}>
                <div className="symbol-cell">
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '执行人' : 'Actor'}</span>
                  <strong>{item.actor}</strong>
                </div>
              </div>
            )) : null}
          </div>
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
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '后端链路健康' : 'Backend Connectivity'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '通知中心里的接入状态以 worker 和后端快照为准。'
                  : 'Connectivity inside the notifications center is derived from worker and backend snapshots.'}
              </div>
            </div>
            <div className="panel-badge badge-info">{connectedCount}/2</div>
          </div>
          <div className="status-stack">
            <div className="status-row"><span>{copy[locale].labels.marketData}</span><strong>{marketProviderLabel}</strong></div>
            <div className="status-row"><span>{copy[locale].labels.marketState}</span><strong>{connectionLabel(locale, marketConnected, marketFallback)}</strong></div>
            <div className="status-row"><span>{copy[locale].labels.brokerState}</span><strong>{connectionLabel(locale, brokerConnected, false, true)}</strong></div>
            <div className="status-row"><span>{locale === 'zh' ? '最近行情同步' : 'Last market sync'}</span><strong>{fmtDateTime(marketStatus?.asOf, locale)}</strong></div>
            <div className="status-copy">{marketStatus?.message || state.integrationStatus.marketData.message}</div>
            <div className="status-copy">{snapshot?.message || state.integrationStatus.broker.message}</div>
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">{locale === 'zh' ? '调度节拍' : 'Scheduler Ticks'}</div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '查看 worker 产生的盘前、盘中、盘后调度窗口节拍。'
                  : 'Inspect worker-produced pre-open, intraday, and post-close scheduler ticks.'}
              </div>
            </div>
            <div className="panel-badge badge-info">{schedulerItems.length}</div>
          </div>
          <div className="focus-list focus-list-terminal">
            {schedulerLoading ? <div className="empty-cell">{locale === 'zh' ? '正在加载调度节拍...' : 'Loading scheduler ticks...'}</div> : null}
            {!schedulerLoading && !schedulerItems.length ? <div className="empty-cell">{locale === 'zh' ? '暂无调度节拍' : 'No scheduler ticks yet.'}</div> : null}
            {!schedulerLoading ? schedulerItems.map((item) => (
              <div className="focus-row" key={item.id}>
                <div className="symbol-cell">
                  <strong>{item.title}</strong>
                  <span>{item.message}</span>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '窗口' : 'Phase'}</span>
                  <strong>{item.phase}</strong>
                </div>
              </div>
            )) : null}
          </div>
        </article>
      </section>
    </>
  );
}

export default NotificationsPage;
