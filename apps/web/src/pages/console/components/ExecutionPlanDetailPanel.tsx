import type { AppLocale } from '@shared-types/trading.ts';
import { useState } from 'react';
import { InspectionPanel, InspectionStatus } from './InspectionPanels.tsx';

export type ExecutionPlanDetailPanelProps = {
  locale: AppLocale;
  selectedEntry: any;
  executionDetailInspection: {
    title: string;
    copy: string;
    emptyMessage: string;
    summary: string;
    runtimeMessage: string;
  };
  selectedLifecycleStatus: string;
  selectedSubmittedCount: number;
  selectedAcknowledgedCount: number;
  selectedFilledCount: number;
  selectedReconciliation: any;
  selectedCompensation: any;
  selectedExceptionPolicy: any;
  selectedRecovery: any;
  selectedBrokerEvents: any[];
  selectedLinkedIncidents: any[];
  canApproveExecution: boolean;
  sourcePage: string | undefined;
  requestedStrategyId: string | undefined;
  requestedRunId: string | undefined;
  onApproveExecutionPlan: (planId: string, params: Record<string, unknown>) => Promise<any>;
  onSyncExecutionPlan: (planId: string, params: Record<string, unknown>) => Promise<any>;
  onIngestBrokerExecutionEvent: (planId: string, params: any) => Promise<any>;
  onSettleExecutionPlan: (planId: string, params: Record<string, unknown>) => Promise<any>;
  onCancelExecutionPlan: (planId: string, params: Record<string, unknown>) => Promise<any>;
  onCompensateExecutionPlan: (planId: string, params: Record<string, unknown>) => Promise<any>;
  onReconcileExecutionPlan: (planId: string, params: Record<string, unknown>) => Promise<any>;
  onRecoverExecutionPlan: (planId: string, params: Record<string, unknown>) => Promise<any>;
  onOpenStrategyDetail: (strategyId: string) => void;
  onReturnToStrategyTimeline: () => void;
  onReturnToBacktestDetail: () => void;
  onRefresh: () => void;
};

export function ExecutionPlanDetailPanel({
  locale,
  selectedEntry,
  executionDetailInspection,
  selectedLifecycleStatus,
  selectedSubmittedCount,
  selectedAcknowledgedCount,
  selectedFilledCount,
  selectedReconciliation,
  selectedCompensation,
  selectedExceptionPolicy,
  selectedRecovery,
  selectedBrokerEvents,
  selectedLinkedIncidents,
  canApproveExecution,
  sourcePage,
  requestedStrategyId,
  requestedRunId,
  onApproveExecutionPlan,
  onSyncExecutionPlan,
  onIngestBrokerExecutionEvent,
  onSettleExecutionPlan,
  onCancelExecutionPlan,
  onCompensateExecutionPlan,
  onReconcileExecutionPlan,
  onRecoverExecutionPlan,
  onOpenStrategyDetail,
  onReturnToStrategyTimeline,
  onReturnToBacktestDetail,
  onRefresh,
}: ExecutionPlanDetailPanelProps) {
  const [planBusyAction, setPlanBusyAction] = useState('');
  const [planMessage, setPlanMessage] = useState('');

  return (
    <InspectionPanel
      title={executionDetailInspection.title}
      copy={executionDetailInspection.copy}
      badge={selectedLifecycleStatus}
    >
      {!selectedEntry ? (
        <InspectionStatus>{executionDetailInspection.emptyMessage}</InspectionStatus>
      ) : (
        <div className="status-stack">
          <div className="status-row">
            <span>{locale === 'zh' ? '策略' : 'Strategy'}</span>
            <strong>{selectedEntry.plan.strategyName}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '模式' : 'Mode'}</span>
            <strong>{selectedEntry.plan.mode}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '计划状态' : 'Plan status'}</span>
            <strong>{selectedEntry.plan.status}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '执行阶段' : 'Lifecycle'}</span>
            <strong>{selectedLifecycleStatus}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '审批状态' : 'Approval'}</span>
            <strong>{selectedEntry.plan.approvalState}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '订单数' : 'Order count'}</span>
            <strong>{selectedEntry.plan.orderCount}</strong>
          </div>
          <div className="status-row">
            <span>
              {locale === 'zh' ? '已提交 / 已受理 / 已成交' : 'Submitted / Acknowledged / Filled'}
            </span>
            <strong>
              {selectedSubmittedCount} / {selectedAcknowledgedCount} / {selectedFilledCount}
            </strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '资金规模' : 'Capital'}</span>
            <strong>{selectedEntry.plan.capital.toFixed(0)}</strong>
          </div>
          {selectedRecovery ? (
            <>
              <div className="status-row">
                <span>{locale === 'zh' ? '恢复姿态' : 'Recovery Posture'}</span>
                <strong>{selectedRecovery.status}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '推荐动作' : 'Recommended Action'}</span>
                <strong>{selectedRecovery.recommendedAction}</strong>
              </div>
            </>
          ) : null}
          {selectedExceptionPolicy ? (
            <>
              <div className="status-row">
                <span>{locale === 'zh' ? '异常姿态' : 'Exception Posture'}</span>
                <strong>{selectedExceptionPolicy.status}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '异常分类' : 'Exception Category'}</span>
                <strong>{selectedExceptionPolicy.category}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '重试预算' : 'Retry Budget'}</span>
                <strong>{`${selectedExceptionPolicy.remainingRetries}/${selectedExceptionPolicy.retryLimit}`}</strong>
              </div>
              <div className="status-row">
                <span>{locale === 'zh' ? '关联 Incident' : 'Linked Incident'}</span>
                <strong>{selectedExceptionPolicy.linkedIncidentId || '--'}</strong>
              </div>
            </>
          ) : null}
          <div className="settings-actions">
            <button
              type="button"
              className="inline-action inline-action-approve"
              onClick={() => onOpenStrategyDetail(selectedEntry.plan.strategyId)}
            >
              {locale === 'zh' ? '打开策略详情' : 'Open Strategy Detail'}
            </button>
            <button
              type="button"
              className="inline-action inline-action-approve"
              disabled={
                !canApproveExecution ||
                selectedLifecycleStatus !== 'awaiting_approval' ||
                planBusyAction === 'approve'
              }
              onClick={async () => {
                setPlanBusyAction('approve');
                setPlanMessage('');
                try {
                  await onApproveExecutionPlan(selectedEntry.plan.id, {
                    actor: 'execution-desk',
                  });
                  setPlanMessage(
                    locale === 'zh'
                      ? '已批准执行计划并开始提交订单。'
                      : 'Approved the execution plan and started order submission.'
                  );
                  onRefresh();
                } catch (error) {
                  setPlanMessage(error instanceof Error ? error.message : 'unknown error');
                } finally {
                  setPlanBusyAction('');
                }
              }}
            >
              {planBusyAction === 'approve'
                ? locale === 'zh'
                  ? '审批中...'
                  : 'Approving...'
                : locale === 'zh'
                  ? '批准路由'
                  : 'Approve Routing'}
            </button>
            <button
              type="button"
              className="inline-action"
              disabled={
                !canApproveExecution ||
                !['submitted', 'acknowledged', 'partial_fill'].includes(selectedLifecycleStatus) ||
                planBusyAction === 'sync'
              }
              onClick={async () => {
                setPlanBusyAction('sync');
                setPlanMessage('');
                try {
                  await onSyncExecutionPlan(selectedEntry.plan.id, {
                    actor: 'execution-desk',
                    scenario: selectedLifecycleStatus === 'submitted' ? 'acknowledge' : 'filled',
                  });
                  setPlanMessage(
                    selectedLifecycleStatus === 'submitted'
                      ? locale === 'zh'
                        ? '已同步 broker 受理状态。'
                        : 'Synced broker acknowledgement state.'
                      : locale === 'zh'
                        ? '已同步 broker 成交状态。'
                        : 'Synced broker fill state.'
                  );
                  onRefresh();
                } catch (error) {
                  setPlanMessage(error instanceof Error ? error.message : 'unknown error');
                } finally {
                  setPlanBusyAction('');
                }
              }}
            >
              {planBusyAction === 'sync'
                ? locale === 'zh'
                  ? '同步中...'
                  : 'Syncing...'
                : selectedLifecycleStatus === 'submitted' ||
                    selectedLifecycleStatus === 'awaiting_approval'
                  ? locale === 'zh'
                    ? '同步受理'
                    : 'Broker Sync'
                  : locale === 'zh'
                    ? '同步成交'
                    : 'Sync Fill'}
            </button>
            <button
              type="button"
              className="inline-action"
              disabled={!canApproveExecution || !selectedEntry || planBusyAction === 'broker-ack'}
              onClick={async () => {
                setPlanBusyAction('broker-ack');
                setPlanMessage('');
                try {
                  await onIngestBrokerExecutionEvent(selectedEntry.plan.id, {
                    actor: 'execution-desk',
                    source: 'broker-webhook',
                    eventType: 'acknowledged',
                    symbol: selectedEntry.orderStates[0]?.symbol,
                    brokerOrderId: selectedEntry.orderStates[0]?.brokerOrderId,
                    message:
                      locale === 'zh'
                        ? '已接收 broker acknowledged 回报。'
                        : 'Ingested broker acknowledged event.',
                  });
                  setPlanMessage(
                    locale === 'zh'
                      ? '已记录 broker 受理回报。'
                      : 'Recorded broker acknowledgement event.'
                  );
                  onRefresh();
                } catch (error) {
                  setPlanMessage(error instanceof Error ? error.message : 'unknown error');
                } finally {
                  setPlanBusyAction('');
                }
              }}
            >
              {planBusyAction === 'broker-ack'
                ? locale === 'zh'
                  ? '承接中...'
                  : 'Ingesting...'
                : locale === 'zh'
                  ? '接收 Ack 回报'
                  : 'Ingest Ack'}
            </button>
            <button
              type="button"
              className="inline-action"
              disabled={
                !canApproveExecution ||
                !['submitted', 'acknowledged'].includes(selectedLifecycleStatus) ||
                planBusyAction === 'partial-fill'
              }
              onClick={async () => {
                setPlanBusyAction('partial-fill');
                setPlanMessage('');
                try {
                  await onSyncExecutionPlan(selectedEntry.plan.id, {
                    actor: 'execution-desk',
                    scenario: 'partial_fill',
                  });
                  setPlanMessage(
                    locale === 'zh'
                      ? '已模拟部分成交并保留未完成订单。'
                      : 'Simulated a partial fill while keeping open orders active.'
                  );
                  onRefresh();
                } catch (error) {
                  setPlanMessage(error instanceof Error ? error.message : 'unknown error');
                } finally {
                  setPlanBusyAction('');
                }
              }}
            >
              {planBusyAction === 'partial-fill'
                ? locale === 'zh'
                  ? '处理中...'
                  : 'Processing...'
                : locale === 'zh'
                  ? '模拟部分成交'
                  : 'Simulate Partial Fill'}
            </button>
            <button
              type="button"
              className="inline-action"
              disabled={!canApproveExecution || !selectedEntry || planBusyAction === 'broker-fill'}
              onClick={async () => {
                setPlanBusyAction('broker-fill');
                setPlanMessage('');
                try {
                  const targetOrder = selectedEntry.orderStates[0];
                  await onIngestBrokerExecutionEvent(selectedEntry.plan.id, {
                    actor: 'execution-desk',
                    source: 'broker-webhook',
                    eventType: 'filled',
                    symbol: targetOrder?.symbol,
                    brokerOrderId: targetOrder?.brokerOrderId,
                    filledQty: targetOrder?.qty,
                    avgFillPrice: targetOrder?.avgFillPrice || 101.25,
                    message:
                      locale === 'zh' ? '已接收 broker fill 回报。' : 'Ingested broker fill event.',
                  });
                  setPlanMessage(
                    locale === 'zh' ? '已记录 broker 成交回报。' : 'Recorded broker fill event.'
                  );
                  onRefresh();
                } catch (error) {
                  setPlanMessage(error instanceof Error ? error.message : 'unknown error');
                } finally {
                  setPlanBusyAction('');
                }
              }}
            >
              {planBusyAction === 'broker-fill'
                ? locale === 'zh'
                  ? '承接中...'
                  : 'Ingesting...'
                : locale === 'zh'
                  ? '接收 Fill 回报'
                  : 'Ingest Fill'}
            </button>
            <button
              type="button"
              className="inline-action"
              disabled={
                !canApproveExecution ||
                !['submitted', 'acknowledged', 'partial_fill'].includes(selectedLifecycleStatus) ||
                planBusyAction === 'settle'
              }
              onClick={async () => {
                setPlanBusyAction('settle');
                setPlanMessage('');
                try {
                  await onSettleExecutionPlan(selectedEntry.plan.id, {
                    actor: 'execution-desk',
                    outcome: 'filled',
                  });
                  setPlanMessage(
                    locale === 'zh'
                      ? '已将执行计划推进到 filled。'
                      : 'Moved the execution plan into filled state.'
                  );
                  onRefresh();
                } catch (error) {
                  setPlanMessage(error instanceof Error ? error.message : 'unknown error');
                } finally {
                  setPlanBusyAction('');
                }
              }}
            >
              {planBusyAction === 'settle'
                ? locale === 'zh'
                  ? '结算中...'
                  : 'Settling...'
                : locale === 'zh'
                  ? '标记成交'
                  : 'Mark Filled'}
            </button>
            <button
              type="button"
              className="inline-action"
              disabled={
                !canApproveExecution ||
                !['awaiting_approval', 'submitted', 'acknowledged'].includes(
                  selectedLifecycleStatus
                ) ||
                planBusyAction === 'cancel'
              }
              onClick={async () => {
                setPlanBusyAction('cancel');
                setPlanMessage('');
                try {
                  await onCancelExecutionPlan(selectedEntry.plan.id, {
                    actor: 'execution-desk',
                    reason: 'operator_cancelled',
                  });
                  setPlanMessage(
                    locale === 'zh'
                      ? '已取消当前执行计划。'
                      : 'Cancelled the current execution plan.'
                  );
                  onRefresh();
                } catch (error) {
                  setPlanMessage(error instanceof Error ? error.message : 'unknown error');
                } finally {
                  setPlanBusyAction('');
                }
              }}
            >
              {planBusyAction === 'cancel'
                ? locale === 'zh'
                  ? '取消中...'
                  : 'Cancelling...'
                : locale === 'zh'
                  ? '取消计划'
                  : 'Cancel Plan'}
            </button>
            <button
              type="button"
              className="inline-action"
              disabled={
                !canApproveExecution || !selectedEntry || planBusyAction === 'broker-reject'
              }
              onClick={async () => {
                setPlanBusyAction('broker-reject');
                setPlanMessage('');
                try {
                  const targetOrder = selectedEntry.orderStates[0];
                  await onIngestBrokerExecutionEvent(selectedEntry.plan.id, {
                    actor: 'execution-desk',
                    source: 'broker-webhook',
                    eventType: 'rejected',
                    symbol: targetOrder?.symbol,
                    brokerOrderId: targetOrder?.brokerOrderId,
                    reason: 'broker_reported_rejection',
                    message:
                      locale === 'zh'
                        ? '已接收 broker reject 回报。'
                        : 'Ingested broker reject event.',
                  });
                  setPlanMessage(
                    locale === 'zh' ? '已记录 broker 拒单回报。' : 'Recorded broker reject event.'
                  );
                  onRefresh();
                } catch (error) {
                  setPlanMessage(error instanceof Error ? error.message : 'unknown error');
                } finally {
                  setPlanBusyAction('');
                }
              }}
            >
              {planBusyAction === 'broker-reject'
                ? locale === 'zh'
                  ? '承接中...'
                  : 'Ingesting...'
                : locale === 'zh'
                  ? '接收 Reject 回报'
                  : 'Ingest Reject'}
            </button>
            <button
              type="button"
              className="inline-action"
              disabled={
                !canApproveExecution ||
                !selectedEntry ||
                !selectedCompensation?.autoExecutable ||
                planBusyAction === 'compensate'
              }
              onClick={async () => {
                setPlanBusyAction('compensate');
                setPlanMessage('');
                try {
                  const result = await onCompensateExecutionPlan(selectedEntry.plan.id, {
                    actor: 'execution-desk',
                  });
                  setPlanMessage(
                    locale === 'zh'
                      ? `已执行自动补偿：${result.compensationAction || selectedCompensation?.mode || 'none'}。`
                      : `Executed compensation automation: ${result.compensationAction || selectedCompensation?.mode || 'none'}.`
                  );
                  onRefresh();
                } catch (error) {
                  setPlanMessage(error instanceof Error ? error.message : 'unknown error');
                } finally {
                  setPlanBusyAction('');
                }
              }}
            >
              {planBusyAction === 'compensate'
                ? locale === 'zh'
                  ? '补偿中...'
                  : 'Compensating...'
                : locale === 'zh'
                  ? '执行自动补偿'
                  : 'Run Compensation'}
            </button>
            <button
              type="button"
              className="inline-action"
              disabled={!canApproveExecution || !selectedEntry || planBusyAction === 'reconcile'}
              onClick={async () => {
                setPlanBusyAction('reconcile');
                setPlanMessage('');
                try {
                  await onReconcileExecutionPlan(selectedEntry.plan.id, {
                    actor: 'execution-desk',
                  });
                  setPlanMessage(
                    locale === 'zh'
                      ? '已记录最新执行对账结果。'
                      : 'Captured the latest execution reconciliation result.'
                  );
                  onRefresh();
                } catch (error) {
                  setPlanMessage(error instanceof Error ? error.message : 'unknown error');
                } finally {
                  setPlanBusyAction('');
                }
              }}
            >
              {planBusyAction === 'reconcile'
                ? locale === 'zh'
                  ? '对账中...'
                  : 'Reconciling...'
                : locale === 'zh'
                  ? '执行对账'
                  : 'Run Reconciliation'}
            </button>
            <button
              type="button"
              className="inline-action inline-action-approve"
              disabled={
                !canApproveExecution ||
                !selectedEntry ||
                !selectedRecovery ||
                selectedRecovery.recommendedAction === 'none' ||
                planBusyAction === 'recover'
              }
              onClick={async () => {
                setPlanBusyAction('recover');
                setPlanMessage('');
                try {
                  const result = await onRecoverExecutionPlan(selectedEntry.plan.id, {
                    actor: 'execution-desk',
                  });
                  setPlanMessage(
                    locale === 'zh'
                      ? `已执行恢复动作：${result.recoveryAction || selectedRecovery?.recommendedAction || ''}。`
                      : `Executed recovery action: ${result.recoveryAction || selectedRecovery?.recommendedAction || ''}.`
                  );
                  onRefresh();
                } catch (error) {
                  setPlanMessage(error instanceof Error ? error.message : 'unknown error');
                } finally {
                  setPlanBusyAction('');
                }
              }}
            >
              {planBusyAction === 'recover'
                ? locale === 'zh'
                  ? '恢复中...'
                  : 'Recovering...'
                : locale === 'zh'
                  ? '恢复计划'
                  : 'Recover Plan'}
            </button>
            {sourcePage === 'strategies' && requestedStrategyId ? (
              <button
                type="button"
                className="inline-action"
                onClick={() => onReturnToStrategyTimeline()}
              >
                {locale === 'zh' ? '返回策略时间线' : 'Return to Strategy Timeline'}
              </button>
            ) : null}
            {sourcePage === 'backtest' && requestedRunId ? (
              <button
                type="button"
                className="inline-action"
                onClick={() => onReturnToBacktestDetail()}
              >
                {locale === 'zh' ? '返回回测详情' : 'Return to Backtest Detail'}
              </button>
            ) : null}
          </div>
          {planMessage ? <InspectionStatus>{planMessage}</InspectionStatus> : null}
          {selectedExceptionPolicy ? (
            <InspectionStatus>{selectedExceptionPolicy.headline}</InspectionStatus>
          ) : null}
          {selectedExceptionPolicy?.reasons?.map((reason: string) => (
            <InspectionStatus key={`policy-${reason}`}>{reason}</InspectionStatus>
          ))}
          {selectedLinkedIncidents.map((incident: any) => (
            <InspectionStatus key={incident.id}>
              {locale === 'zh'
                ? `关联 Incident ${incident.id}: ${incident.status} / ${incident.title}`
                : `Linked incident ${incident.id}: ${incident.status} / ${incident.title}`}
            </InspectionStatus>
          ))}
          {selectedRecovery ? (
            <InspectionStatus>{selectedRecovery.headline}</InspectionStatus>
          ) : null}
          {selectedRecovery?.reasons?.map((reason: string) => (
            <InspectionStatus key={reason}>{reason}</InspectionStatus>
          ))}
          <InspectionStatus>{executionDetailInspection.summary}</InspectionStatus>
          <InspectionStatus>{executionDetailInspection.runtimeMessage}</InspectionStatus>
        </div>
      )}
    </InspectionPanel>
  );
}
