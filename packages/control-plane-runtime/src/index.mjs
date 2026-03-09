import { controlPlaneContext } from '../../control-plane-store/src/context.mjs';

export function createControlPlaneRuntime(context = controlPlaneContext) {
  return {
    listAuditRecords(limit = 50) {
      return context.audit.listAuditRecords(limit);
    },
    appendAuditRecord(record) {
      return context.audit.appendAuditRecord(record);
    },
    listCycleRecords(limit = 30) {
      return context.cycles.listCycleRecords(limit);
    },
    appendCycleRecord(payload) {
      return context.cycles.appendCycleRecord(payload);
    },
    listOperatorActions(limit = 50) {
      return context.operatorActions.listOperatorActions(limit);
    },
    appendOperatorAction(payload) {
      return context.operatorActions.appendOperatorAction(payload);
    },
    listNotifications(limit = 50) {
      return context.notifications.listNotifications(limit);
    },
    appendNotification(event) {
      return context.notifications.appendNotification(event);
    },
    enqueueNotification(event) {
      return context.notifications.enqueueNotification(event);
    },
    listNotificationJobs(limit = 50) {
      return context.notifications.listNotificationJobs(limit);
    },
    dispatchPendingNotifications(options = {}) {
      return context.notifications.dispatchPendingNotifications(options);
    },
    listRiskEvents(limit = 50) {
      return context.risk.listRiskEvents(limit);
    },
    appendRiskEvent(event) {
      return context.risk.appendRiskEvent(event);
    },
    enqueueRiskScan(payload) {
      return context.risk.enqueueRiskScan(payload);
    },
    listRiskScanJobs(limit = 50) {
      return context.risk.listRiskScanJobs(limit);
    },
    dispatchPendingRiskScans(options = {}) {
      return context.risk.dispatchPendingRiskScans(options);
    },
    listSchedulerTicks(limit = 50) {
      return context.scheduler.listSchedulerTicks(limit);
    },
    recordSchedulerTick(options = {}) {
      return context.scheduler.recordSchedulerTick(options);
    },
  };
}

export const controlPlaneRuntime = createControlPlaneRuntime();
