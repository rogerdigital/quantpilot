import type { NavigateFunction } from 'react-router-dom';
import { buildDeepLink, readDeepLinkParams } from '../console/deepLinks.ts';

type SearchParamsLike = URLSearchParams;

export function useResearchNavigationContext(
  searchParams: SearchParamsLike,
  navigate: NavigateFunction
) {
  const context = readDeepLinkParams(searchParams);

  return {
    context,
    openStrategyDetail(strategyId: string, options?: { timelineId?: string }) {
      navigate(
        buildDeepLink('/strategies', {
          strategy: strategyId,
          timeline: options?.timelineId,
        })
      );
    },
    returnToStrategyTimeline() {
      if (!context.strategyId) return;
      navigate(
        buildDeepLink('/strategies', {
          strategy: context.strategyId,
          timeline: context.timelineId,
        })
      );
    },
    openBacktestDetail(
      runId: string,
      options?: { strategyId?: string; timelineId?: string; source?: string }
    ) {
      navigate(
        buildDeepLink('/backtest', {
          run: runId,
          strategy: options?.strategyId,
          timeline: options?.timelineId,
          source: options?.source,
        })
      );
    },
    returnToBacktestDetail() {
      if (!context.runId) return;
      navigate(
        buildDeepLink('/backtest', {
          run: context.runId,
          strategy: context.strategyId,
        })
      );
    },
    openExecutionDetail(
      planId: string,
      options?: { strategyId?: string; runId?: string; timelineId?: string; source?: string }
    ) {
      navigate(
        buildDeepLink('/execution', {
          plan: planId,
          strategy: options?.strategyId,
          run: options?.runId,
          timeline: options?.timelineId,
          source: options?.source,
        })
      );
    },
  };
}
