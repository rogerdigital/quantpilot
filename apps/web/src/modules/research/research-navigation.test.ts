import { describe, expect, it, vi } from 'vitest';
import { buildDeepLink, readDeepLinkParams } from '../console/deepLinks.ts';
import { useResearchNavigationContext } from './useResearchNavigationContext.ts';

describe('research navigation deep links', () => {
  it('builds deep links without empty params', () => {
    expect(
      buildDeepLink('/execution', {
        plan: 'plan-1',
        strategy: 'strategy-1',
        run: '',
        timeline: undefined,
        source: 'strategies',
      })
    ).toBe('/execution?plan=plan-1&strategy=strategy-1&source=strategies');
  });

  it('reads deep link params from search params', () => {
    const params = new URLSearchParams(
      'plan=plan-1&strategy=strategy-1&run=run-1&timeline=execution-plan-1&source=backtest&audit=audit-1&step=settlement_watch'
    );

    expect(readDeepLinkParams(params)).toEqual({
      planId: 'plan-1',
      strategyId: 'strategy-1',
      runId: 'run-1',
      timelineId: 'execution-plan-1',
      sourcePage: 'backtest',
      auditEventId: 'audit-1',
      workflowStepKey: 'settlement_watch',
    });
  });

  it('navigates from strategy timeline to backtest detail with source context', () => {
    const navigate = vi.fn();
    const navigation = useResearchNavigationContext(
      new URLSearchParams('strategy=strategy-1&timeline=run-run-1'),
      navigate
    );

    navigation.openBacktestDetail('run-1', {
      strategyId: 'strategy-1',
      timelineId: 'run-run-1',
      source: 'strategies',
    });

    expect(navigate).toHaveBeenCalledWith(
      '/backtest?run=run-1&strategy=strategy-1&timeline=run-run-1&source=strategies'
    );
  });

  it('returns from execution to strategy timeline using current context', () => {
    const navigate = vi.fn();
    const navigation = useResearchNavigationContext(
      new URLSearchParams(
        'plan=plan-1&strategy=strategy-1&timeline=execution-plan-1&source=strategies'
      ),
      navigate
    );

    navigation.returnToStrategyTimeline();

    expect(navigate).toHaveBeenCalledWith(
      '/strategies?strategy=strategy-1&timeline=execution-plan-1'
    );
  });

  it('navigates from backtest detail to execution detail with research context', () => {
    const navigate = vi.fn();
    const navigation = useResearchNavigationContext(
      new URLSearchParams('run=run-1&strategy=strategy-1&source=backtest'),
      navigate
    );

    navigation.openExecutionDetail('plan-1', {
      strategyId: 'strategy-1',
      runId: 'run-1',
      source: 'backtest',
    });

    expect(navigate).toHaveBeenCalledWith(
      '/execution?plan=plan-1&strategy=strategy-1&run=run-1&source=backtest'
    );
  });

  it('returns from execution to backtest detail using current context', () => {
    const navigate = vi.fn();
    const navigation = useResearchNavigationContext(
      new URLSearchParams('plan=plan-1&strategy=strategy-1&run=run-1&source=backtest'),
      navigate
    );

    navigation.returnToBacktestDetail();

    expect(navigate).toHaveBeenCalledWith('/backtest?run=run-1&strategy=strategy-1');
  });
});
