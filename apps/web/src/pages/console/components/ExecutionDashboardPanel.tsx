import type { AppLocale } from '@shared-types/trading.ts';
import {
  type ExecutionQueueFocusKey,
  getExecutionQueueFocusOptions,
  mapExecutionNextActionToFocus,
} from '../../../modules/console/executionOperations.ts';

export type ExecutionDashboardPanelProps = {
  locale: AppLocale;
  workbenchSummary: any;
  workbenchOperations: any;
  planSummary: {
    awaitingApproval: number;
    routing: number;
    submitted: number;
    acknowledged: number;
    filled: number;
    blocked: number;
    cancelled: number;
    failed: number;
  };
  ledgerEntries: any[];
  runtimeEvents: any[];
  accountSnapshots: any[];
  executionDataLoading: boolean;
  executionDataError: string | null;
  queueFocus: ExecutionQueueFocusKey;
  onQueueFocusChange: (focus: ExecutionQueueFocusKey) => void;
};

export function ExecutionDashboardPanel({
  locale,
  workbenchSummary,
  workbenchOperations,
  planSummary,
  ledgerEntries,
  runtimeEvents,
  accountSnapshots,
  executionDataLoading,
  executionDataError,
  queueFocus,
  onQueueFocusChange,
}: ExecutionDashboardPanelProps) {
  const queueFocusOptions = getExecutionQueueFocusOptions(locale, workbenchOperations);

  return (
    <section className="panel-grid panel-grid-wide">
      <article className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">
              {locale === 'zh' ? '执行生命周期总览' : 'Execution Lifecycle Summary'}
            </div>
            <div className="panel-copy">
              {locale === 'zh'
                ? '把待审批、已提交、已成交和阻塞的执行计划压缩成一块执行中台总览。'
                : 'Compress awaiting approval, submitted, filled, and blocked plans into one execution-lifecycle overview.'}
            </div>
          </div>
          <div className="panel-badge badge-info">
            {workbenchSummary?.totalPlans ?? ledgerEntries.length}
          </div>
        </div>
        <div className="status-stack">
          <div className="status-row">
            <span>{locale === 'zh' ? '待审批' : 'Awaiting Approval'}</span>
            <strong>{workbenchSummary?.awaitingApproval ?? planSummary.awaitingApproval}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '路由中' : 'Routing'}</span>
            <strong>{workbenchSummary?.routing ?? planSummary.routing}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '已提交' : 'Submitted'}</span>
            <strong>{workbenchSummary?.submitted ?? planSummary.submitted}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '已受理' : 'Acknowledged'}</span>
            <strong>{workbenchSummary?.acknowledged ?? planSummary.acknowledged}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '已成交' : 'Filled'}</span>
            <strong>{workbenchSummary?.filled ?? planSummary.filled}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '已取消' : 'Cancelled'}</span>
            <strong>{workbenchSummary?.cancelled ?? planSummary.cancelled}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '阻塞 / 失败' : 'Blocked / Failed'}</span>
            <strong>
              {(workbenchSummary?.blocked ?? planSummary.blocked) +
                (workbenchSummary?.failed ?? planSummary.failed)}
            </strong>
          </div>
        </div>
      </article>
      <article className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">
              {locale === 'zh' ? '账户与持仓对账' : 'Account And Position Reconciliation'}
            </div>
            <div className="panel-copy">
              {locale === 'zh'
                ? '比较 execution order state、broker snapshot 和持仓数量，快速识别 drift。'
                : 'Compare execution order states, broker snapshots, and positions to quickly spot drift.'}
            </div>
          </div>
          <div className="panel-badge badge-info">
            {workbenchSummary
              ? workbenchSummary.aligned +
                workbenchSummary.attention +
                workbenchSummary.drift +
                workbenchSummary.missingSnapshot
              : ledgerEntries.length}
          </div>
        </div>
        <div className="status-stack">
          <div className="status-row">
            <span>{locale === 'zh' ? '对齐' : 'Aligned'}</span>
            <strong>{workbenchSummary?.aligned ?? 0}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '需关注' : 'Attention'}</span>
            <strong>{workbenchSummary?.attention ?? 0}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '已漂移' : 'Drift'}</span>
            <strong>{workbenchSummary?.drift ?? 0}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '缺少快照' : 'Missing Snapshot'}</span>
            <strong>{workbenchSummary?.missingSnapshot ?? 0}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '未完成订单' : 'Open Orders'}</span>
            <strong>{workbenchSummary?.totalOpenOrders ?? 0}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '已同步持仓' : 'Synced Positions'}</span>
            <strong>{workbenchSummary?.syncedPositions ?? 0}</strong>
          </div>
        </div>
      </article>
      <article className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">
              {locale === 'zh' ? '执行恢复工作台' : 'Execution Recovery Workbench'}
            </div>
            <div className="panel-copy">
              {locale === 'zh'
                ? '把 retry、失败、取消和对账异常压缩成统一恢复姿态，便于执行台做补偿与恢复。'
                : 'Compress retry, failed, cancelled, and reconciliation drift into one recovery posture for compensation and recovery actions.'}
            </div>
          </div>
          <div className="panel-badge badge-warn">{workbenchSummary?.recoverablePlans ?? 0}</div>
        </div>
        <div className="status-stack">
          <div className="status-row">
            <span>{locale === 'zh' ? '可恢复计划' : 'Recoverable Plans'}</span>
            <strong>{workbenchSummary?.recoverablePlans ?? 0}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '待释放重试' : 'Retry Scheduled'}</span>
            <strong>{workbenchSummary?.retryScheduledWorkflows ?? 0}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '需要人工介入' : 'Needs Intervention'}</span>
            <strong>{workbenchSummary?.interventionNeeded ?? 0}</strong>
          </div>
          <div className="status-copy">
            {locale === 'zh'
              ? '当 workflow 失败、plan 取消或 reconciliation 发生 drift 时，这里会直接给出恢复姿态。'
              : 'When a workflow fails, a plan is cancelled, or reconciliation drifts, this surface exposes the next recovery posture.'}
          </div>
        </div>
      </article>
      <article className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">
              {locale === 'zh' ? '执行异常与重试策略' : 'Execution Exception And Retry Policies'}
            </div>
            <div className="panel-copy">
              {locale === 'zh'
                ? '把 broker reject、取消、重试预算和 incident 升级压成统一异常姿态。'
                : 'Compress broker rejects, cancellations, retry budget, and incident escalation into one exception posture.'}
            </div>
          </div>
          <div className="panel-badge badge-warn">
            {(workbenchSummary?.retryEligiblePlans ?? 0) +
              (workbenchSummary?.compensationPlans ?? 0) +
              (workbenchSummary?.incidentLinkedPlans ?? 0)}
          </div>
        </div>
        <div className="status-stack">
          <div className="status-row">
            <span>{locale === 'zh' ? '可重试计划' : 'Retry Eligible'}</span>
            <strong>{workbenchSummary?.retryEligiblePlans ?? 0}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '补偿队列' : 'Compensation Queue'}</span>
            <strong>{workbenchSummary?.compensationPlans ?? 0}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '自动补偿' : 'Auto Compensation'}</span>
            <strong>{workbenchSummary?.compensationReadyPlans ?? 0}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '关联 Incident' : 'Linked Incidents'}</span>
            <strong>{workbenchSummary?.incidentLinkedPlans ?? 0}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '拒单计划' : 'Reject Plans'}</span>
            <strong>{workbenchSummary?.brokerRejectPlans ?? 0}</strong>
          </div>
          <div className="status-copy">
            {locale === 'zh'
              ? '这层策略会把 broker event 历史转成 retry、补偿和 incident 升级建议。'
              : 'This policy layer turns broker event history into retry, compensation, and incident escalation guidance.'}
          </div>
        </div>
      </article>
      <article className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">
              {locale === 'zh' ? '自动补偿工作台' : 'Compensation Automation'}
            </div>
            <div className="panel-copy">
              {locale === 'zh'
                ? '把可自动执行的补偿动作和已升级执行分开呈现，优先完成自动对账和 incident 同步。'
                : 'Surface auto-executable compensation separately from escalated follow-up so the desk can run reconciliation and incident sync first.'}
            </div>
          </div>
          <div className="panel-badge badge-info">
            {(workbenchSummary?.compensationReadyPlans ?? 0) +
              (workbenchSummary?.escalatedCompensationPlans ?? 0)}
          </div>
        </div>
        <div className="status-stack">
          <div className="status-row">
            <span>{locale === 'zh' ? '自动可执行' : 'Auto Ready'}</span>
            <strong>{workbenchSummary?.compensationReadyPlans ?? 0}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '已升级补偿' : 'Escalated'}</span>
            <strong>{workbenchSummary?.escalatedCompensationPlans ?? 0}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '自动化队列' : 'Automation Queue'}</span>
            <strong>{workbenchOperations?.queues.compensationAutomation.length ?? 0}</strong>
          </div>
          <div className="status-copy">
            {locale === 'zh'
              ? '这层会把对账刷新、incident 同步和 operator follow-up 拆成标准步骤。'
              : 'This layer breaks compensation into reconciliation refresh, incident sync, and operator follow-up.'}
          </div>
        </div>
      </article>
      <article className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">
              {locale === 'zh' ? '执行运营队列' : 'Execution Operations Console'}
            </div>
            <div className="panel-copy">
              {locale === 'zh'
                ? '把审批、重试、补偿、incident 和活跃路由统一成执行台的处置队列。'
                : 'Turn approvals, retries, compensation, incidents, and active routing into one execution-ops queue view.'}
            </div>
          </div>
          <div className="panel-badge badge-info">
            {(workbenchOperations?.queues.approvals.length ?? 0) +
              (workbenchOperations?.queues.retryEligible.length ?? 0) +
              (workbenchOperations?.queues.compensation.length ?? 0) +
              (workbenchOperations?.queues.incidents.length ?? 0)}
          </div>
        </div>
        <div className="focus-list">
          <div className="settings-actions">
            {queueFocusOptions.map((item) => (
              <button
                key={item.key}
                type="button"
                className="inline-action"
                disabled={queueFocus === item.key}
                onClick={() => onQueueFocusChange(item.key)}
              >
                {`${item.label}${item.count ? ` (${item.count})` : ''}`}
              </button>
            ))}
          </div>
          <div className="focus-row">
            <div className="focus-metric">
              <span>{locale === 'zh' ? '审批队列' : 'Approvals'}</span>
              <strong>{workbenchOperations?.queues.approvals.length ?? 0}</strong>
            </div>
            <div className="focus-metric">
              <span>{locale === 'zh' ? '可重试' : 'Retry Eligible'}</span>
              <strong>{workbenchOperations?.queues.retryEligible.length ?? 0}</strong>
            </div>
            <div className="focus-metric">
              <span>{locale === 'zh' ? '补偿队列' : 'Compensation'}</span>
              <strong>{workbenchOperations?.queues.compensation.length ?? 0}</strong>
            </div>
            <div className="focus-metric">
              <span>{locale === 'zh' ? '自动补偿' : 'Auto Comp'}</span>
              <strong>{workbenchOperations?.queues.compensationAutomation.length ?? 0}</strong>
            </div>
            <div className="focus-metric">
              <span>{locale === 'zh' ? '执行 Incident' : 'Incidents'}</span>
              <strong>{workbenchOperations?.queues.incidents.length ?? 0}</strong>
            </div>
          </div>
          {workbenchOperations?.nextActions.map((item: any) => (
            <div key={item.key} className="focus-row">
              <div className="focus-metric">
                <span>{item.priority}</span>
                <strong>{item.count}</strong>
              </div>
              <div className="status-copy">
                <strong>{item.title}</strong>
                {` - ${item.detail}`}
              </div>
              <button
                type="button"
                className="inline-action"
                onClick={() => onQueueFocusChange(mapExecutionNextActionToFocus(item.key))}
              >
                {locale === 'zh' ? '聚焦队列' : 'Focus Queue'}
              </button>
            </div>
          ))}
          {!workbenchOperations?.nextActions.length ? (
            <div className="status-copy">
              {locale === 'zh'
                ? '当前没有额外排队的执行运营动作。'
                : 'No extra execution operations actions are queued right now.'}
            </div>
          ) : null}
        </div>
      </article>
      <article className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">{locale === 'zh' ? 'Owner 负载' : 'Owner Load'}</div>
            <div className="panel-copy">
              {locale === 'zh'
                ? '按执行 owner 看审批、重试、补偿和 incident 压力。'
                : 'Review approval, retry, compensation, and incident pressure by execution owner.'}
            </div>
          </div>
          <div className="panel-badge badge-info">{workbenchOperations?.ownerLoad.length ?? 0}</div>
        </div>
        <div className="focus-list">
          {workbenchOperations?.ownerLoad.map((item: any) => (
            <div key={item.owner} className="focus-row">
              <div className="focus-metric">
                <span>{locale === 'zh' ? 'Owner' : 'Owner'}</span>
                <strong>{item.owner}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '总量' : 'Total'}</span>
                <strong>{item.total}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '审批' : 'Approvals'}</span>
                <strong>{item.approvals}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '重试' : 'Retry'}</span>
                <strong>{item.retryEligible}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '补偿/Incident' : 'Comp/Inc'}</span>
                <strong>{item.compensation + item.incidents}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '自动补偿' : 'Auto Comp'}</span>
                <strong>{item.compensationAutomation}</strong>
              </div>
            </div>
          ))}
          {!workbenchOperations?.ownerLoad.length ? (
            <div className="status-copy">
              {locale === 'zh'
                ? '当前没有 owner 负载数据。'
                : 'No owner load data is available yet.'}
            </div>
          ) : null}
        </div>
      </article>
      <article className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">
              {locale === 'zh' ? 'Broker 回报承接' : 'Broker Event Ingestion'}
            </div>
            <div className="panel-copy">
              {locale === 'zh'
                ? '把 broker ack、fill、reject 和 cancel 回报接成结构化事件，并驱动执行状态聚合。'
                : 'Turn broker ack, fill, reject, and cancel reports into structured events that drive execution state aggregation.'}
            </div>
          </div>
          <div className="panel-badge badge-info">{workbenchSummary?.brokerEvents ?? 0}</div>
        </div>
        <div className="status-stack">
          <div className="status-row">
            <span>{locale === 'zh' ? '已记录回报' : 'Recorded Events'}</span>
            <strong>{workbenchSummary?.brokerEvents ?? 0}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '成交回报' : 'Fill Events'}</span>
            <strong>{workbenchSummary?.fillEvents ?? 0}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '拒单回报' : 'Rejected Events'}</span>
            <strong>{workbenchSummary?.rejectedBrokerEvents ?? 0}</strong>
          </div>
          <div className="status-copy">
            {locale === 'zh'
              ? '这层事件历史会成为后续 retry policy、异常补偿和 execution incident 联动的稳定输入。'
              : 'This event trail becomes the stable input for later retry policies, exception compensation, and execution incident linkage.'}
          </div>
        </div>
      </article>
      <article className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">
              {locale === 'zh' ? '服务端执行记录' : 'Server Execution Runtime'}
            </div>
            <div className="panel-copy">
              {locale === 'zh'
                ? '来自后端持久化的 broker 执行摘要，不依赖当前页面内存状态。'
                : 'Backend-persisted broker execution summaries, independent of the current page runtime state.'}
            </div>
          </div>
          <div className="panel-badge badge-info">{runtimeEvents.length}</div>
        </div>
        <div className="focus-list">
          {executionDataError ? (
            <div className="status-copy">
              {locale === 'zh'
                ? `执行数据加载失败：${executionDataError}`
                : `Failed to load execution data: ${executionDataError}`}
            </div>
          ) : null}
          {runtimeEvents.slice(0, 6).map((event) => (
            <div key={event.id} className="focus-row">
              <div className="focus-metric">
                <span>{locale === 'zh' ? '周期' : 'Cycle'}</span>
                <strong>{event.cycle}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '已提交' : 'Submitted'}</span>
                <strong>{event.submittedOrderCount}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '持仓数' : 'Positions'}</span>
                <strong>{event.positionCount}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '权益' : 'Equity'}</span>
                <strong>{event.equity.toFixed(0)}</strong>
              </div>
            </div>
          ))}
          {!runtimeEvents.length ? (
            <div className="status-copy">
              {executionDataLoading
                ? locale === 'zh'
                  ? '正在同步执行数据...'
                  : 'Syncing execution data...'
                : locale === 'zh'
                  ? '尚无后端执行记录。执行一个周期后这里会出现服务端快照。'
                  : 'No backend execution records yet. Run a cycle to persist server-side snapshots.'}
            </div>
          ) : null}
        </div>
      </article>
      <article className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">
              {locale === 'zh' ? 'Broker 账户快照' : 'Broker Account Snapshots'}
            </div>
            <div className="panel-copy">
              {locale === 'zh'
                ? '查看最近一次后端同步回来的账户、订单和持仓规模。'
                : 'Inspect the latest backend-synced account, order, and position state.'}
            </div>
          </div>
          <div className="panel-badge badge-ok">{accountSnapshots.length}</div>
        </div>
        <div className="focus-list">
          {accountSnapshots.slice(0, 4).map((snapshot) => (
            <div key={snapshot.id} className="focus-row">
              <div className="focus-metric">
                <span>{locale === 'zh' ? '提供商' : 'Provider'}</span>
                <strong>{snapshot.provider}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '订单数' : 'Orders'}</span>
                <strong>{snapshot.orders.length}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '现金' : 'Cash'}</span>
                <strong>{Number(snapshot.account?.cash || 0).toFixed(0)}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '状态' : 'Status'}</span>
                <strong>{snapshot.connected ? 'connected' : 'disconnected'}</strong>
              </div>
            </div>
          ))}
          {!accountSnapshots.length ? (
            <div className="status-copy">
              {executionDataLoading
                ? locale === 'zh'
                  ? '正在同步 broker 快照...'
                  : 'Syncing broker snapshots...'
                : locale === 'zh'
                  ? '尚无 broker 账户快照。'
                  : 'No broker account snapshots yet.'}
            </div>
          ) : null}
        </div>
      </article>
    </section>
  );
}
