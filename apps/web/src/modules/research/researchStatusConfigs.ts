import { formatPermissionReadOnly } from '../permissions/permissionCopy.ts';

export function getStrategyStatusConfig(options: {
  locale: 'zh' | 'en';
  catalogSize?: number;
  candidateStrategies?: number;
  promotedCount: number;
  executionRoute: string;
  canWriteStrategy: boolean;
  loading: boolean;
  error: string;
}) {
  const {
    locale,
    catalogSize,
    candidateStrategies,
    promotedCount,
    executionRoute,
    canWriteStrategy,
    loading,
    error,
  } = options;

  return {
    metrics: [
      { label: locale === 'zh' ? '策略总数' : 'Catalog size', value: catalogSize ?? '--' },
      {
        label: locale === 'zh' ? '候选/晋级' : 'Candidate / promoted',
        value:
          candidateStrategies !== undefined
            ? `${candidateStrategies} / ${promotedCount}`
            : '-- / --',
      },
      { label: locale === 'zh' ? '执行路线' : 'Execution route', value: executionRoute },
    ],
    messages: [
      !canWriteStrategy
        ? formatPermissionReadOnly(locale, 'strategy:write', '策略工作台', 'the strategy workspace')
        : null,
      loading ? (locale === 'zh' ? '正在同步策略注册表...' : 'Syncing strategy registry...') : null,
      error
        ? locale === 'zh'
          ? `策略服务不可用：${error}`
          : `Strategy service unavailable: ${error}`
        : null,
      locale === 'zh'
        ? '策略注册表已经切到后端事实源，运行时信号视图仅作为当下市场上下文。'
        : 'The strategy registry now comes from the backend source of truth, while runtime signals stay as contextual market state.',
    ],
  };
}

export function getBacktestStatusConfig(options: {
  locale: 'zh' | 'en';
  dataSourceBadge: string;
  buyCount: number;
  sellCount: number;
  portfolioReturn: string;
  researchMode: string;
  completedRuns?: number;
  reviewQueue?: number;
  decisionCopy: string;
  actionMessage: string;
  actionError: string;
  loading: boolean;
  error: string;
}) {
  const {
    locale,
    dataSourceBadge,
    buyCount,
    sellCount,
    portfolioReturn,
    researchMode,
    completedRuns,
    reviewQueue,
    decisionCopy,
    actionMessage,
    actionError,
    loading,
    error,
  } = options;

  return {
    badge: dataSourceBadge,
    metrics: [
      { label: locale === 'zh' ? '候选买入' : 'Candidate buys', value: buyCount },
      { label: locale === 'zh' ? '候选减仓' : 'Candidate trims', value: sellCount },
      { label: locale === 'zh' ? '组合收益' : 'Portfolio return', value: portfolioReturn },
      { label: locale === 'zh' ? '研究模式' : 'Research mode', value: researchMode },
      { label: locale === 'zh' ? '已完成回测' : 'Completed runs', value: completedRuns ?? '--' },
      { label: locale === 'zh' ? '待复核' : 'Review queue', value: reviewQueue ?? '--' },
    ],
    messages: [
      decisionCopy,
      actionMessage || null,
      actionError || null,
      loading ? (locale === 'zh' ? '正在同步研究服务...' : 'Syncing research service...') : null,
      error
        ? locale === 'zh'
          ? `研究服务不可用：${error}`
          : `Research service unavailable: ${error}`
        : null,
    ],
  };
}
