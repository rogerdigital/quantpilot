import type { AppLocale } from '@shared-types/trading.ts';
import { useState } from 'react';
import {
  bulkUpdateExecutionQueue,
  bulkUpdateIncidentQueue,
} from '../../../app/api/controlPlane.ts';
import type { ExecutionQueueFocusKey } from '../../../modules/console/executionOperations.ts';

export type BulkQueueActionsPanelProps = {
  locale: AppLocale;
  selectedPlanCount: number;
  approvalQueueIds: string[];
  retryQueueIds: string[];
  automationQueueIds: string[];
  compensationQueueIds: string[];
  incidentQueueIds: string[];
  selectedPlanIds: string[];
  selectedIncidentIds: string[];
  canApproveExecution: boolean;
  operator: string;
  onReplaceSelection: (ids: string[]) => void;
  onSetQueueFocus: (focus: ExecutionQueueFocusKey) => void;
  onClearSelection: () => void;
  onRefresh: () => void;
};

export function BulkQueueActionsPanel({
  locale,
  selectedPlanCount,
  approvalQueueIds,
  retryQueueIds,
  automationQueueIds,
  compensationQueueIds,
  incidentQueueIds,
  selectedPlanIds,
  selectedIncidentIds,
  canApproveExecution,
  operator,
  onReplaceSelection,
  onSetQueueFocus,
  onClearSelection,
  onRefresh,
}: BulkQueueActionsPanelProps) {
  const [planBusyAction, setPlanBusyAction] = useState('');
  const [planMessage, setPlanMessage] = useState('');
  const [incidentBusyAction, setIncidentBusyAction] = useState('');
  const [incidentMessage, setIncidentMessage] = useState('');

  async function runBulkIncidentAction(payload: Record<string, unknown>, successMessage: string) {
    if (!selectedIncidentIds.length) return;
    setIncidentBusyAction('bulk-incident');
    setIncidentMessage('');
    try {
      const result = await bulkUpdateIncidentQueue({
        incidentIds: selectedIncidentIds,
        actor: operator,
        ...payload,
      });
      setIncidentMessage(`${successMessage} (${result.updatedIds.length})`);
      onRefresh();
    } catch (error) {
      setIncidentMessage(error instanceof Error ? error.message : 'unknown error');
    } finally {
      setIncidentBusyAction('');
    }
  }

  async function runBulkPlanAction(
    action: 'approve' | 'reconcile' | 'compensate' | 'recover' | 'cancel',
    successLabelZh: string,
    successLabelEn: string
  ) {
    setPlanBusyAction(`bulk-${action}`);
    setPlanMessage('');
    try {
      const result = await bulkUpdateExecutionQueue({
        action,
        planIds: selectedPlanIds,
        actor: 'execution-desk',
      });
      setPlanMessage(
        locale === 'zh'
          ? `${successLabelZh} ${result.updatedIds.length} 条执行计划。`
          : `${successLabelEn} ${result.updatedIds.length} execution plans in bulk.`
      );
      onRefresh();
    } catch (error) {
      setPlanMessage(error instanceof Error ? error.message : 'unknown error');
    } finally {
      setPlanBusyAction('');
    }
  }

  return (
    <article className="panel">
      <div className="panel-head">
        <div>
          <div className="panel-title">
            {locale === 'zh' ? '批量处置工具栏' : 'Bulk Queue Actions'}
          </div>
          <div className="panel-copy">
            {locale === 'zh'
              ? '从审批、重试、补偿和 incident 队列一键选取执行计划，并批量执行处置动作。'
              : 'Select execution plans from approvals, retries, compensation, and incident queues, then run bulk actions from one toolbar.'}
          </div>
        </div>
        <div className="panel-badge badge-info">{selectedPlanCount}</div>
      </div>
      <div className="focus-list">
        <div className="focus-row">
          <div className="focus-metric">
            <span>{locale === 'zh' ? '已选计划' : 'Selected Plans'}</span>
            <strong>{selectedPlanCount}</strong>
          </div>
          <div className="focus-metric">
            <span>{locale === 'zh' ? '审批队列' : 'Approvals'}</span>
            <strong>{approvalQueueIds.length}</strong>
          </div>
          <div className="focus-metric">
            <span>{locale === 'zh' ? '重试队列' : 'Retry'}</span>
            <strong>{retryQueueIds.length}</strong>
          </div>
          <div className="focus-metric">
            <span>{locale === 'zh' ? '自动补偿' : 'Auto Comp'}</span>
            <strong>{automationQueueIds.length}</strong>
          </div>
          <div className="focus-metric">
            <span>{locale === 'zh' ? 'Incident' : 'Incident'}</span>
            <strong>{incidentQueueIds.length}</strong>
          </div>
        </div>
        <div className="settings-actions">
          <button
            type="button"
            className="inline-action"
            onClick={() => {
              onSetQueueFocus('approvals');
              onReplaceSelection(approvalQueueIds);
            }}
          >
            {locale === 'zh' ? '选中审批队列' : 'Select Approvals'}
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() => {
              onSetQueueFocus('retryEligible');
              onReplaceSelection(retryQueueIds);
            }}
          >
            {locale === 'zh' ? '选中重试队列' : 'Select Retry Queue'}
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() => {
              onSetQueueFocus('compensationAutomation');
              onReplaceSelection(automationQueueIds);
            }}
          >
            {locale === 'zh' ? '选中自动补偿' : 'Select Auto Comp'}
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() => {
              onSetQueueFocus('compensation');
              onReplaceSelection(compensationQueueIds);
            }}
          >
            {locale === 'zh' ? '选中补偿队列' : 'Select Compensation'}
          </button>
          <button
            type="button"
            className="inline-action"
            onClick={() => {
              onSetQueueFocus('incidents');
              onReplaceSelection(incidentQueueIds);
            }}
          >
            {locale === 'zh' ? '选中 Incident 队列' : 'Select Incidents'}
          </button>
          <button type="button" className="inline-action" onClick={onClearSelection}>
            {locale === 'zh' ? '清空选择' : 'Clear Selection'}
          </button>
        </div>
        <div className="settings-actions">
          <button
            type="button"
            className="inline-action inline-action-approve"
            disabled={
              !canApproveExecution || !selectedPlanCount || planBusyAction === 'bulk-approve'
            }
            onClick={() => runBulkPlanAction('approve', '已批量批准', 'Approved')}
          >
            {planBusyAction === 'bulk-approve'
              ? locale === 'zh'
                ? '处理中...'
                : 'Running...'
              : locale === 'zh'
                ? '批量批准'
                : 'Bulk Approve'}
          </button>
          <button
            type="button"
            className="inline-action"
            disabled={
              !canApproveExecution || !selectedPlanCount || planBusyAction === 'bulk-compensate'
            }
            onClick={() =>
              runBulkPlanAction('compensate', '已批量执行', 'Ran compensation automation for')
            }
          >
            {planBusyAction === 'bulk-compensate'
              ? locale === 'zh'
                ? '处理中...'
                : 'Running...'
              : locale === 'zh'
                ? '批量补偿'
                : 'Bulk Compensate'}
          </button>
          <button
            type="button"
            className="inline-action"
            disabled={
              !canApproveExecution || !selectedPlanCount || planBusyAction === 'bulk-reconcile'
            }
            onClick={() => runBulkPlanAction('reconcile', '已批量对账', 'Reconciled')}
          >
            {planBusyAction === 'bulk-reconcile'
              ? locale === 'zh'
                ? '处理中...'
                : 'Running...'
              : locale === 'zh'
                ? '批量对账'
                : 'Bulk Reconcile'}
          </button>
          <button
            type="button"
            className="inline-action"
            disabled={
              !canApproveExecution || !selectedPlanCount || planBusyAction === 'bulk-recover'
            }
            onClick={() => runBulkPlanAction('recover', '已批量恢复', 'Recovered')}
          >
            {planBusyAction === 'bulk-recover'
              ? locale === 'zh'
                ? '处理中...'
                : 'Running...'
              : locale === 'zh'
                ? '批量恢复'
                : 'Bulk Recover'}
          </button>
        </div>
        <div className="settings-actions">
          <button
            type="button"
            className="inline-action"
            disabled={
              !canApproveExecution ||
              !selectedIncidentIds.length ||
              incidentBusyAction === 'bulk-incident'
            }
            onClick={() =>
              runBulkIncidentAction(
                { owner: operator, status: 'investigating' },
                locale === 'zh'
                  ? '已批量认领并推进 Incident 到 investigating'
                  : 'Assigned selected incidents and moved them to investigating'
              )
            }
          >
            {incidentBusyAction === 'bulk-incident'
              ? locale === 'zh'
                ? '处理中...'
                : 'Running...'
              : locale === 'zh'
                ? '批量认领 Incident'
                : 'Assign Incidents'}
          </button>
          <button
            type="button"
            className="inline-action"
            disabled={
              !canApproveExecution ||
              !selectedIncidentIds.length ||
              incidentBusyAction === 'bulk-incident'
            }
            onClick={() =>
              runBulkIncidentAction(
                {
                  note:
                    locale === 'zh'
                      ? '由执行台批量同步异常处置。'
                      : 'Bulk synced from the execution desk.',
                },
                locale === 'zh'
                  ? '已批量同步 Incident 处置记录'
                  : 'Synced selected incident notes from the execution desk'
              )
            }
          >
            {locale === 'zh' ? '批量同步 Incident 备注' : 'Sync Incident Notes'}
          </button>
        </div>
        {planMessage ? <div className="status-copy">{planMessage}</div> : null}
        {incidentMessage ? <div className="status-copy">{incidentMessage}</div> : null}
      </div>
    </article>
  );
}
