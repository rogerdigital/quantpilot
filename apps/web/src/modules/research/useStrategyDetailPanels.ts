import type { BacktestRunItem, ExecutionLedgerEntry, StrategyCatalogDetailSnapshot, StrategyCatalogItem } from '@shared-types/trading.ts';
import type { AuditFeedItem } from '../audit/useAuditFeed.ts';

type StrategyReplayTimelineItem = NonNullable<StrategyCatalogDetailSnapshot['replayTimeline']>[number];

export function useStrategyDetailPanels(options: {
  locale: 'zh' | 'en';
  selectedStrategy: StrategyCatalogItem | null;
  strategyDetail: StrategyCatalogDetailSnapshot | null;
  auditItems: AuditFeedItem[];
  executionEntries: ExecutionLedgerEntry[];
  allRuns: BacktestRunItem[];
  selectedTimelineId: string;
}) {
  const {
    locale,
    selectedStrategy,
    strategyDetail,
    auditItems,
    executionEntries,
    allRuns,
    selectedTimelineId,
  } = options;

  const selectedStrategySnapshot = strategyDetail?.strategy || selectedStrategy;
  const selectedStrategyRuns = strategyDetail?.recentRuns?.slice(0, 6)
    || allRuns.filter((item) => item.strategyId === selectedStrategy?.id).slice(0, 6)
    || [];
  const selectedStrategyAuditItems = auditItems
    .filter((item) => item.type === 'strategy-catalog.saved')
    .filter((item) => {
      const strategyId = typeof item.metadata?.strategyId === 'string' ? item.metadata.strategyId : '';
      return selectedStrategy ? strategyId === selectedStrategy.id : false;
    })
    .slice(0, 6);
  const selectedStrategyVersionItems = selectedStrategyAuditItems.filter((item) => (
    typeof item.metadata?.score === 'number'
    || typeof item.metadata?.expectedReturnPct === 'number'
    || typeof item.metadata?.maxDrawdownPct === 'number'
    || typeof item.metadata?.sharpe === 'number'
  ));
  const selectedStrategyExecutionEntries = executionEntries
    .filter((entry) => entry.plan.strategyId === selectedStrategy?.id)
    .slice(0, 6);
  const fallbackTimelineItems: StrategyReplayTimelineItem[] = [
    ...selectedStrategyAuditItems.map((item) => ({
      id: `audit-${item.id}`,
      eventType: 'audit' as const,
      lane: locale === 'zh' ? '注册表' : 'Registry',
      title: item.title,
      detail: item.detail,
      at: item.createdAt,
      reference: typeof item.metadata?.strategyId === 'string' ? item.metadata.strategyId : '--',
      metrics: [
        { label: locale === 'zh' ? '状态' : 'Status', value: typeof item.metadata?.status === 'string' ? item.metadata.status : '--' },
        { label: locale === 'zh' ? '操作人' : 'Actor', value: item.actor },
      ],
    })),
    ...selectedStrategyRuns.map((run) => ({
      id: `run-${run.id}`,
      eventType: 'run' as const,
      lane: locale === 'zh' ? '研究' : 'Research',
      title: `${run.windowLabel} · ${run.status}`,
      detail: run.summary,
      at: run.completedAt || run.reviewedAt || run.updatedAt || run.startedAt,
      reference: run.id,
      linkedRunId: run.id,
      linkedWorkflowRunId: run.workflowRunId || '',
      metrics: [
        { label: locale === 'zh' ? '收益' : 'Return', value: run.status === 'completed' || run.status === 'needs_review' ? `${run.annualizedReturnPct.toFixed(1)}%` : '--' },
        { label: 'Sharpe', value: run.status === 'completed' || run.status === 'needs_review' ? run.sharpe.toFixed(2) : '--' },
      ],
    })),
    ...(strategyDetail?.recentResults || []).slice(0, 6).map((result) => ({
      id: `result-${result.id}`,
      eventType: 'result' as const,
      lane: locale === 'zh' ? '结果' : 'Result',
      title: `v${result.version} · ${result.stage}`,
      detail: result.summary,
      at: result.generatedAt || result.updatedAt,
      reference: result.runId,
      linkedRunId: result.runId,
      linkedWorkflowRunId: result.workflowRunId || '',
      linkedResultId: result.id,
      metrics: [
        { label: locale === 'zh' ? '状态' : 'Status', value: result.status },
        { label: locale === 'zh' ? '超额收益' : 'Excess', value: `${result.excessReturnPct.toFixed(1)}%` },
      ],
    })),
    ...selectedStrategyExecutionEntries.map((entry) => ({
      id: `execution-${entry.plan.id}`,
      eventType: 'execution' as const,
      lane: locale === 'zh' ? '执行' : 'Execution',
      title: entry.plan.summary,
      detail: entry.latestRuntime?.message || `${entry.plan.orderCount} ${locale === 'zh' ? '笔订单候选' : 'candidate orders'}`,
      at: entry.latestRuntime?.createdAt || entry.plan.updatedAt || entry.plan.createdAt,
      reference: entry.plan.id,
      metrics: [
        { label: locale === 'zh' ? '计划状态' : 'Plan', value: entry.plan.status },
        { label: locale === 'zh' ? 'Workflow' : 'Workflow', value: entry.workflow?.status || '--' },
      ],
    })),
  ]
    .sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime())
    .slice(0, 10);
  const selectedStrategyTimelineItems = (strategyDetail?.replayTimeline?.length
    ? strategyDetail.replayTimeline
    : fallbackTimelineItems)
    .slice(0, 24);
  const selectedTimelineItem = selectedStrategyTimelineItems.find((item) => item.id === selectedTimelineId) || selectedStrategyTimelineItems[0] || null;

  return {
    selectedStrategySnapshot,
    selectedStrategyRuns,
    selectedStrategyAuditItems,
    selectedStrategyVersionItems,
    selectedStrategyExecutionEntries,
    selectedStrategyTimelineItems,
    selectedTimelineItem,
    replaySummary: strategyDetail?.replaySummary || null,
    latestResult: strategyDetail?.latestResult || null,
    latestReport: strategyDetail?.latestReport || null,
    latestExecutionHandoff: strategyDetail?.latestExecutionHandoff || null,
    promotionReadiness: strategyDetail?.promotionReadiness || null,
    executionCandidatePreview: strategyDetail?.executionCandidatePreview || null,
  };
}
