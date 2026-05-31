import type { AppLocale } from '@shared-types/trading.ts';
import { useState } from 'react';
import { InspectionPanel, InspectionStatus } from './InspectionPanels.tsx';

export type IncidentTriagePanelProps = {
  locale: AppLocale;
  selectedEntry: any;
  selectedExecutionIncident: any;
  selectedLinkedIncidents: any[];
  selectedIncidentId: string;
  selectedIncidentDetail: any;
  canApproveExecution: boolean;
  operator: string;
  onSelectedIncidentIdChange: (id: string) => void;
  onUpdateIncident: (id: string, params: Record<string, unknown>) => Promise<any>;
  onAppendIncidentNote: (id: string, params: Record<string, unknown>) => Promise<any>;
  onRefresh: () => void;
  onNavigate: (path: string) => void;
};

export function IncidentTriagePanel({
  locale,
  selectedEntry,
  selectedExecutionIncident,
  selectedLinkedIncidents,
  selectedIncidentId,
  selectedIncidentDetail,
  canApproveExecution,
  operator,
  onSelectedIncidentIdChange,
  onUpdateIncident,
  onAppendIncidentNote,
  onRefresh,
  onNavigate,
}: IncidentTriagePanelProps) {
  const [incidentBusyAction, setIncidentBusyAction] = useState('');
  const [incidentMessage, setIncidentMessage] = useState('');
  const [incidentNoteDraft, setIncidentNoteDraft] = useState('');

  return (
    <InspectionPanel
      title={locale === 'zh' ? '执行 Incident 处置' : 'Execution Incident Triage'}
      copy={
        locale === 'zh'
          ? '在执行台直接认领、推进和记录异常 incident，不需要再跳去别的控制面。'
          : 'Claim, advance, and document execution incidents directly from the execution desk without leaving this console.'
      }
      badge={selectedExecutionIncident?.status || '--'}
    >
      {!selectedEntry ? (
        <InspectionStatus>
          {locale === 'zh'
            ? '先从账本中选择一个 execution plan。'
            : 'Select an execution plan from the ledger first.'}
        </InspectionStatus>
      ) : !selectedExecutionIncident ? (
        <InspectionStatus>
          {locale === 'zh'
            ? '当前 execution plan 还没有关联的未解决 incident。'
            : 'The selected execution plan does not have a linked unresolved incident yet.'}
        </InspectionStatus>
      ) : (
        <div className="status-stack">
          <div className="settings-actions">
            {selectedLinkedIncidents.map((incident) => (
              <button
                key={incident.id}
                type="button"
                className="inline-action"
                disabled={selectedIncidentId === incident.id}
                onClick={() => onSelectedIncidentIdChange(incident.id)}
              >
                {incident.id}
              </button>
            ))}
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '标题' : 'Title'}</span>
            <strong>{selectedExecutionIncident.title}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '状态' : 'Status'}</span>
            <strong>{selectedExecutionIncident.status}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '级别' : 'Severity'}</span>
            <strong>{selectedExecutionIncident.severity}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '负责人' : 'Owner'}</span>
            <strong>{selectedExecutionIncident.owner || '--'}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '来源' : 'Source'}</span>
            <strong>{selectedExecutionIncident.source || '--'}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '下一步' : 'Next Action'}</span>
            <strong>{selectedIncidentDetail?.operations?.nextAction?.label || '--'}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '阻塞任务' : 'Blocked Tasks'}</span>
            <strong>{selectedIncidentDetail?.operations?.blockedTasks ?? 0}</strong>
          </div>
          <div className="status-row">
            <span>{locale === 'zh' ? '证据条数' : 'Evidence'}</span>
            <strong>{selectedIncidentDetail?.evidence?.summary?.linked ?? 0}</strong>
          </div>
          <div className="settings-actions">
            <button
              type="button"
              className="inline-action"
              disabled={!canApproveExecution || incidentBusyAction === 'assign-incident'}
              onClick={async () => {
                setIncidentBusyAction('assign-incident');
                setIncidentMessage('');
                try {
                  await onUpdateIncident(selectedExecutionIncident.id, {
                    owner: operator,
                    status:
                      selectedExecutionIncident.status === 'open'
                        ? 'investigating'
                        : selectedExecutionIncident.status,
                    actor: operator,
                  });
                  setIncidentMessage(
                    locale === 'zh'
                      ? '已认领当前 Incident。'
                      : 'Assigned the current incident to the execution desk.'
                  );
                  onRefresh();
                } catch (error) {
                  setIncidentMessage(error instanceof Error ? error.message : 'unknown error');
                } finally {
                  setIncidentBusyAction('');
                }
              }}
            >
              {incidentBusyAction === 'assign-incident'
                ? locale === 'zh'
                  ? '处理中...'
                  : 'Running...'
                : locale === 'zh'
                  ? '认领 Incident'
                  : 'Assign Incident'}
            </button>
            <button
              type="button"
              className="inline-action"
              disabled={!canApproveExecution || incidentBusyAction === 'advance-incident'}
              onClick={async () => {
                setIncidentBusyAction('advance-incident');
                setIncidentMessage('');
                try {
                  await onUpdateIncident(selectedExecutionIncident.id, {
                    status:
                      selectedExecutionIncident.status === 'investigating'
                        ? 'mitigated'
                        : 'investigating',
                    actor: operator,
                  });
                  setIncidentMessage(
                    locale === 'zh'
                      ? '已推进当前 Incident 状态。'
                      : 'Advanced the current incident status.'
                  );
                  onRefresh();
                } catch (error) {
                  setIncidentMessage(error instanceof Error ? error.message : 'unknown error');
                } finally {
                  setIncidentBusyAction('');
                }
              }}
            >
              {locale === 'zh' ? '推进处置' : 'Advance Incident'}
            </button>
            <button
              type="button"
              className="inline-action"
              disabled={!canApproveExecution || incidentBusyAction === 'resolve-incident'}
              onClick={async () => {
                setIncidentBusyAction('resolve-incident');
                setIncidentMessage('');
                try {
                  await onUpdateIncident(selectedExecutionIncident.id, {
                    status: 'resolved',
                    actor: operator,
                  });
                  setIncidentMessage(
                    locale === 'zh' ? '已关闭当前 Incident。' : 'Resolved the current incident.'
                  );
                  onRefresh();
                } catch (error) {
                  setIncidentMessage(error instanceof Error ? error.message : 'unknown error');
                } finally {
                  setIncidentBusyAction('');
                }
              }}
            >
              {locale === 'zh' ? '关闭 Incident' : 'Resolve Incident'}
            </button>
          </div>
          <textarea
            value={incidentNoteDraft}
            onChange={(event) => setIncidentNoteDraft(event.target.value)}
            placeholder={
              locale === 'zh'
                ? '记录这次执行异常的处置说明…'
                : 'Record the execution-incident triage note...'
            }
            rows={3}
          />
          <div className="settings-actions">
            <button
              type="button"
              className="inline-action"
              disabled={
                !canApproveExecution ||
                !incidentNoteDraft.trim() ||
                incidentBusyAction === 'incident-note'
              }
              onClick={async () => {
                setIncidentBusyAction('incident-note');
                setIncidentMessage('');
                try {
                  await onAppendIncidentNote(selectedExecutionIncident.id, {
                    author: operator,
                    body: incidentNoteDraft.trim(),
                    metadata: {
                      source: 'execution-console',
                      planId: selectedEntry.plan.id,
                    },
                  });
                  setIncidentMessage(
                    locale === 'zh'
                      ? '已记录 Incident 处置备注。'
                      : 'Recorded an execution-incident note.'
                  );
                  setIncidentNoteDraft('');
                  onRefresh();
                } catch (error) {
                  setIncidentMessage(error instanceof Error ? error.message : 'unknown error');
                } finally {
                  setIncidentBusyAction('');
                }
              }}
            >
              {incidentBusyAction === 'incident-note'
                ? locale === 'zh'
                  ? '记录中...'
                  : 'Recording...'
                : locale === 'zh'
                  ? '记录处置备注'
                  : 'Add Triage Note'}
            </button>
          </div>
          {incidentMessage ? <InspectionStatus>{incidentMessage}</InspectionStatus> : null}
          {selectedIncidentDetail?.operations?.nextAction?.detail ? (
            <InspectionStatus>
              {selectedIncidentDetail.operations.nextAction.detail}
            </InspectionStatus>
          ) : null}
          {selectedIncidentDetail?.operations?.handoff?.summary ? (
            <InspectionStatus>{selectedIncidentDetail.operations.handoff.summary}</InspectionStatus>
          ) : null}
        </div>
      )}
    </InspectionPanel>
  );
}
