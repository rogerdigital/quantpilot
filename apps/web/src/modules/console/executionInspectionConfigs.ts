import type {
  BrokerAccountSnapshotRecord,
  ExecutionLedgerEntry,
  WorkflowRunRecord,
  WorkflowStepRecord,
} from '@shared-types/trading.ts';
import type { AuditFeedItem } from '../audit/useAuditFeed.ts';

export function getExecutionDetailInspectionConfig(
  locale: 'zh' | 'en',
  selectedEntry: ExecutionLedgerEntry | null
) {
  return {
    title: locale === 'zh' ? '选中执行计划详情' : 'Selected Execution Detail',
    copy:
      locale === 'zh'
        ? '聚合展示单条 execution plan 的模式、风控、订单规模和运行时结果。'
        : 'Aggregate one execution plan’s mode, risk state, order count, and runtime result in one place.',
    emptyMessage:
      locale === 'zh'
        ? '当前没有可查看的执行计划。'
        : 'No execution plan is available for inspection.',
    summary: selectedEntry?.plan.summary || '',
    runtimeMessage: selectedEntry?.latestRuntime
      ? locale === 'zh'
        ? `最新执行：提交 ${selectedEntry.latestRuntime.submittedOrderCount}，未成交 ${selectedEntry.latestRuntime.openOrderCount}，权益 ${selectedEntry.latestRuntime.equity.toFixed(0)}`
        : `Latest runtime: submitted ${selectedEntry.latestRuntime.submittedOrderCount}, open ${selectedEntry.latestRuntime.openOrderCount}, equity ${selectedEntry.latestRuntime.equity.toFixed(0)}`
      : locale === 'zh'
        ? '当前计划还没有服务端执行结果。'
        : 'No backend execution result is attached to this plan yet.',
  };
}

export function getExecutionAuditEventInspectionConfig(
  locale: 'zh' | 'en',
  selectedEntry: ExecutionLedgerEntry | null,
  selectedAuditEvent: AuditFeedItem | null
) {
  return {
    title: locale === 'zh' ? '选中执行审计事件' : 'Selected Execution Audit Event',
    copy:
      locale === 'zh'
        ? '钻取当前审计事件，便于对齐 execution plan、audit 和 workflow 三条线。'
        : 'Inspect the selected audit event so execution plan, audit, and workflow can be aligned to one node.',
    emptyMessage: !selectedEntry
      ? locale === 'zh'
        ? '先从执行计划账本选择一条记录。'
        : 'Select an execution plan from the ledger first.'
      : !selectedAuditEvent
        ? locale === 'zh'
          ? '当前执行计划还没有可钻取的审计事件。'
          : 'No execution audit event is available for inspection yet.'
        : null,
    metrics: [
      { label: locale === 'zh' ? '标题' : 'Title', value: selectedAuditEvent?.title || '--' },
      { label: locale === 'zh' ? '类型' : 'Type', value: selectedAuditEvent?.type || '--' },
      { label: locale === 'zh' ? '操作人' : 'Actor', value: selectedAuditEvent?.actor || '--' },
      {
        label: locale === 'zh' ? '时间' : 'Time',
        value: selectedAuditEvent
          ? new Date(selectedAuditEvent.createdAt).toLocaleString(
              locale === 'zh' ? 'zh-CN' : 'en-US'
            )
          : '--',
      },
    ],
    detail: selectedAuditEvent?.detail || '',
  };
}

export function getExecutionWorkflowInspectionConfig(
  locale: 'zh' | 'en',
  selectedEntry: ExecutionLedgerEntry | null,
  selectedWorkflow: WorkflowRunRecord | null,
  executionDataLoading: boolean
) {
  return {
    title: locale === 'zh' ? '选中执行工作流' : 'Selected Execution Workflow',
    copy:
      locale === 'zh'
        ? '查看 strategy-execution workflow 的状态、尝试次数和步骤进度。'
        : 'Inspect strategy-execution workflow status, attempts, and step progress.',
    loadingMessage: locale === 'zh' ? '正在加载执行工作流...' : 'Loading execution workflow...',
    emptyMessage: !selectedEntry
      ? locale === 'zh'
        ? '先从执行计划账本选择一条记录。'
        : 'Select an execution plan from the ledger first.'
      : executionDataLoading
        ? ''
        : !selectedWorkflow
          ? locale === 'zh'
            ? '当前执行计划还没有可见的 workflow 详情。'
            : 'No workflow detail is available for the selected execution plan yet.'
          : null,
    metrics: [
      { label: locale === 'zh' ? '工作流 ID' : 'Workflow ID', value: selectedWorkflow?.id || '--' },
      { label: locale === 'zh' ? '状态' : 'Status', value: selectedWorkflow?.status || '--' },
      {
        label: locale === 'zh' ? '尝试次数' : 'Attempts',
        value: selectedWorkflow
          ? `${selectedWorkflow.attempt}/${selectedWorkflow.maxAttempts}`
          : '--',
      },
      { label: locale === 'zh' ? '触发方式' : 'Trigger', value: selectedWorkflow?.trigger || '--' },
    ],
  };
}

export function getExecutionWorkflowStepInspectionConfig(
  locale: 'zh' | 'en',
  selectedEntry: ExecutionLedgerEntry | null,
  selectedWorkflowStep: WorkflowStepRecord | null
) {
  return {
    title: locale === 'zh' ? '选中执行工作流步骤' : 'Selected Execution Workflow Step',
    copy:
      locale === 'zh'
        ? '单独展开当前 workflow 节点，便于深链定位到具体执行步骤。'
        : 'Expand the current workflow node so deep links can target a specific execution step.',
    emptyMessage: !selectedEntry
      ? locale === 'zh'
        ? '先从执行计划账本选择一条记录。'
        : 'Select an execution plan from the ledger first.'
      : !selectedWorkflowStep
        ? locale === 'zh'
          ? '当前执行工作流还没有可定位的步骤。'
          : 'No execution workflow step is available for inspection yet.'
        : null,
    metrics: [
      { label: locale === 'zh' ? '步骤' : 'Step', value: selectedWorkflowStep?.key || '--' },
      { label: locale === 'zh' ? '状态' : 'Status', value: selectedWorkflowStep?.status || '--' },
    ],
    guidance: selectedWorkflowStep
      ? locale === 'zh'
        ? `当前深链已定位到步骤 ${selectedWorkflowStep.key}。`
        : `The current deep link is focused on step ${selectedWorkflowStep.key}.`
      : null,
  };
}

export function getExecutionSnapshotInspectionConfig(
  locale: 'zh' | 'en',
  selectedEntry: ExecutionLedgerEntry | null,
  selectedAccountSnapshot: BrokerAccountSnapshotRecord | null
) {
  return {
    title: locale === 'zh' ? '选中 Broker 快照' : 'Selected Broker Snapshot',
    copy:
      locale === 'zh'
        ? '优先关联当前 plan 最新 runtime 所在周期的 broker snapshot；若不存在则回退到最新快照。'
        : 'Prefer the broker snapshot from the selected plan’s latest runtime cycle, then fall back to the latest snapshot.',
    emptyMessage: !selectedEntry
      ? locale === 'zh'
        ? '先从执行计划账本选择一条记录。'
        : 'Select an execution plan from the ledger first.'
      : !selectedAccountSnapshot
        ? locale === 'zh'
          ? '当前没有可用的 broker 快照。'
          : 'No broker snapshot is available for the selected execution plan.'
        : null,
  };
}
