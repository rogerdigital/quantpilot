import type { WorkflowRunRecord, WorkflowStepRecord } from '@shared-types/trading.ts';

export function getStrategyTimelineInspectionConfig(
  locale: 'zh' | 'en',
  selectedStrategy: { id: string } | null,
  selectedTimelineItem: {
    title: string;
    lane: string;
    at: string;
    reference: string;
    eventType: string;
    detail: string;
  } | null,
  formatDateTime: (value: string, locale: 'zh' | 'en') => string
) {
  return {
    emptyMessage: !selectedStrategy
      ? locale === 'zh'
        ? '先从策略注册表选择一条记录。'
        : 'Select a strategy from the registry first.'
      : !selectedTimelineItem
        ? locale === 'zh'
          ? '当前还没有可钻取的时间线节点。'
          : 'No timeline node is available for inspection yet.'
        : null,
    metrics: [
      { label: locale === 'zh' ? '事件' : 'Event', value: selectedTimelineItem?.title || '--' },
      { label: locale === 'zh' ? '链路' : 'Lane', value: selectedTimelineItem?.lane || '--' },
      {
        label: locale === 'zh' ? '时间' : 'Time',
        value: selectedTimelineItem ? formatDateTime(selectedTimelineItem.at, locale) : '--',
      },
      {
        label: locale === 'zh' ? '关联记录' : 'Reference',
        value: selectedTimelineItem?.reference || '--',
      },
      {
        label: locale === 'zh' ? '事件类型' : 'Event type',
        value: selectedTimelineItem?.eventType || '--',
      },
    ],
    detail: selectedTimelineItem?.detail,
  };
}

export function getWorkflowInspectionConfig(
  locale: 'zh' | 'en',
  selectedRun: { id: string } | null,
  selectedWorkflow: WorkflowRunRecord | null,
  formatDateTime: (value: string, locale: 'zh' | 'en') => string
) {
  return {
    emptyMessage: !selectedRun
      ? locale === 'zh'
        ? '先从回测队列选择一条记录。'
        : 'Select a run from the queue first.'
      : !selectedWorkflow
        ? locale === 'zh'
          ? '当前 run 还没有可见的 workflow 详情。'
          : 'No workflow detail is available for the selected run yet.'
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
    guidance: selectedWorkflow
      ? locale === 'zh'
        ? `最近更新时间 ${formatDateTime(selectedWorkflow.updatedAt || selectedWorkflow.createdAt, locale)}`
        : `Last updated ${formatDateTime(selectedWorkflow.updatedAt || selectedWorkflow.createdAt, locale)}`
      : null,
  };
}

export function getWorkflowStepInspectionConfig(
  locale: 'zh' | 'en',
  selectedWorkflow: WorkflowRunRecord | null,
  selectedWorkflowStep: WorkflowStepRecord | null
) {
  return {
    emptyMessage: !selectedWorkflow
      ? locale === 'zh'
        ? '先从回测队列选择一条记录。'
        : 'Select a run from the queue first.'
      : !selectedWorkflowStep
        ? locale === 'zh'
          ? '当前工作流还没有可定位的步骤。'
          : 'No workflow step is available for inspection yet.'
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
