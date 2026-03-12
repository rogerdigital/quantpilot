import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import StrategiesPage from './strategies/StrategiesPage.tsx';
import BacktestPage from './backtest/BacktestPage.tsx';

const mockUseResearchWorkspaceData = vi.fn();
const mockUseStrategyDetail = vi.fn();
const mockUseBacktestRunDetail = vi.fn();
const mockUseSummary = vi.fn();

vi.mock('../store/trading-system/TradingSystemProvider.tsx', () => ({
  useTradingSystem: () => ({
    state: {
      marketClock: '2026-03-13 10:00',
      mode: 'hybrid',
      decisionSummary: 'BUY bias',
      decisionCopy: 'Runtime state copy',
      routeCopy: 'Execution route copy',
      stockStates: [
        { symbol: 'AAPL', signal: 'BUY' },
        { symbol: 'MSFT', signal: 'SELL' },
      ],
    },
    session: {
      user: {
        id: 'operator-1',
        permissions: ['strategy:write', 'risk:review'],
      },
    },
    hasPermission: (permission: string) => permission === 'strategy:write' || permission === 'risk:review',
  }),
}));

vi.mock('../pages/console/i18n.tsx', async () => {
  const actual = await vi.importActual<typeof import('../pages/console/i18n.tsx')>('../pages/console/i18n.tsx');
  return {
    ...actual,
    useLocale: () => ({ locale: 'en' as const }),
  };
});

vi.mock('../pages/console/hooks.ts', async () => {
  const actual = await vi.importActual<typeof import('../pages/console/hooks.ts')>('../pages/console/hooks.ts');
  return {
    ...actual,
    useSettingsNavigation: () => () => undefined,
    useSummary: () => mockUseSummary(),
  };
});

vi.mock('../modules/research/useResearchWorkspaceData.ts', () => ({
  useResearchWorkspaceData: (...args: unknown[]) => mockUseResearchWorkspaceData(...args),
}));

vi.mock('../modules/research/useStrategyDetail.ts', () => ({
  useStrategyDetail: (...args: unknown[]) => mockUseStrategyDetail(...args),
}));

vi.mock('../modules/research/useBacktestRunDetail.ts', () => ({
  useBacktestRunDetail: (...args: unknown[]) => mockUseBacktestRunDetail(...args),
}));

vi.mock('../modules/research/useResearchPollingPolicy.ts', () => ({
  useResearchPollingPolicy: () => ({
    requestRefresh: () => undefined,
    pollingIntervalMs: 5000,
  }),
}));

vi.mock('../modules/console/useSyncedQuerySelection.ts', () => ({
  useSyncedQuerySelection: (options: { itemIds: string[]; requestedId: string }) => ({
    selectedId: options.requestedId && options.itemIds.includes(options.requestedId)
      ? options.requestedId
      : (options.itemIds[0] || ''),
    setSelectedId: () => undefined,
  }),
}));

vi.mock('../modules/research/useResearchNavigationContext.ts', () => ({
  useResearchNavigationContext: () => ({
    context: {},
    openStrategyDetail: () => undefined,
    returnToStrategyTimeline: () => undefined,
    openBacktestDetail: () => undefined,
    returnToBacktestDetail: () => undefined,
    openExecutionDetail: () => undefined,
  }),
}));

vi.mock('./console/components/ConsoleChrome.tsx', () => ({
  ChartCanvas: ({ kind }: { kind: string }) => <div>{kind}</div>,
  SectionHeader: ({ title, copy }: { title: string; copy: string }) => <div>{title}{copy}</div>,
  TopMeta: () => <div>TopMeta</div>,
}));

vi.mock('./console/components/ConsoleTables.tsx', () => ({
  UniverseTable: () => <div>UniverseTable</div>,
}));

describe('research workspace pages', () => {
  beforeEach(() => {
    mockUseSummary.mockReturnValue({ totalPnlPct: 12.4 });
    mockUseResearchWorkspaceData.mockReset();
    mockUseStrategyDetail.mockReset();
    mockUseBacktestRunDetail.mockReset();
  });

  it('renders strategies page with deep-linked strategy and timeline detail', () => {
    mockUseResearchWorkspaceData.mockReturnValue({
      data: {
        strategies: [
          {
            id: 'strategy-1',
            name: 'Momentum',
            family: 'trend',
            timeframe: '1d',
            universe: 'NASDAQ 100',
            status: 'candidate',
            score: 81,
            expectedReturnPct: 14.2,
            maxDrawdownPct: 6.4,
            sharpe: 1.9,
            summary: 'Candidate momentum strategy',
          },
        ],
        runs: [
          {
            id: 'run-1',
            strategyId: 'strategy-1',
            strategyName: 'Momentum',
            status: 'completed',
            windowLabel: '30D',
            startedAt: '2026-03-13T10:00:00.000Z',
            completedAt: '2026-03-13T11:00:00.000Z',
            annualizedReturnPct: 10.5,
            maxDrawdownPct: 4.2,
            sharpe: 1.7,
            winRatePct: 54,
            turnoverPct: 18,
            summary: 'Latest run',
            workflowRunId: 'wf-1',
          },
        ],
        summary: {
          candidateStrategies: 1,
          dataSource: 'service',
        },
      },
      loading: false,
      error: '',
      auditItems: [
        {
          id: 'audit-1',
          type: 'strategy-catalog.saved',
          actor: 'research@desk',
          title: 'Strategy saved',
          detail: 'Strategy was updated.',
          createdAt: '2026-03-13T09:00:00.000Z',
          metadata: {
            strategyId: 'strategy-1',
            status: 'candidate',
            score: 81,
            expectedReturnPct: 14.2,
            maxDrawdownPct: 6.4,
            sharpe: 1.9,
          },
        },
      ],
      auditLoading: false,
      executionEntries: [
        {
          plan: {
            id: 'plan-1',
            workflowRunId: 'wf-exec-1',
            strategyId: 'strategy-1',
            strategyName: 'Momentum',
            mode: 'paper',
            status: 'ready',
            approvalState: 'pending',
            riskStatus: 'approved',
            summary: 'Paper plan',
            capital: 50000,
            orderCount: 3,
            orders: [],
            metadata: {},
            createdAt: '2026-03-13T11:30:00.000Z',
            updatedAt: '2026-03-13T11:35:00.000Z',
          },
          workflow: null,
          latestRuntime: null,
        },
      ],
      workflowRuns: [],
      workspaceLoading: false,
    });
    mockUseStrategyDetail.mockReturnValue({
      data: {
        ok: true,
        strategy: {
          id: 'strategy-1',
          name: 'Momentum',
          family: 'trend',
          timeframe: '1d',
          universe: 'NASDAQ 100',
          status: 'candidate',
          score: 81,
          expectedReturnPct: 14.2,
          maxDrawdownPct: 6.4,
          sharpe: 1.9,
          summary: 'Candidate momentum strategy',
        },
        latestRun: {
          id: 'run-1',
          strategyId: 'strategy-1',
          strategyName: 'Momentum',
          status: 'completed',
          windowLabel: '30D',
          startedAt: '2026-03-13T10:00:00.000Z',
          annualizedReturnPct: 10.5,
          maxDrawdownPct: 4.2,
          sharpe: 1.7,
          winRatePct: 54,
          turnoverPct: 18,
          summary: 'Latest run',
        },
        recentRuns: [
          {
            id: 'run-1',
            strategyId: 'strategy-1',
            strategyName: 'Momentum',
            status: 'completed',
            windowLabel: '30D',
            startedAt: '2026-03-13T10:00:00.000Z',
            completedAt: '2026-03-13T11:00:00.000Z',
            annualizedReturnPct: 10.5,
            maxDrawdownPct: 4.2,
            sharpe: 1.7,
            winRatePct: 54,
            turnoverPct: 18,
            summary: 'Latest run',
            workflowRunId: 'wf-1',
          },
        ],
      },
      loading: false,
      error: '',
    });

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/strategies?strategy=strategy-1&timeline=run-run-1']}>
        <Routes>
          <Route path="/strategies" element={<StrategiesPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(html).toContain('Selected Strategy Detail');
    expect(html).toContain('Momentum');
    expect(html).toContain('Selected Timeline Event');
    expect(html).toContain('Open Backtest Detail');
    expect(html).toContain('Selected Strategy Research Runs');
  });

  it('renders backtest page with deep-linked run, audit, and workflow step detail', () => {
    mockUseResearchWorkspaceData.mockReturnValue({
      data: {
        strategies: [
          {
            id: 'strategy-1',
            name: 'Momentum',
            family: 'trend',
            timeframe: '1d',
            universe: 'NASDAQ 100',
            status: 'candidate',
            score: 81,
            expectedReturnPct: 14.2,
            maxDrawdownPct: 6.4,
            sharpe: 1.9,
            summary: 'Candidate momentum strategy',
          },
        ],
        runs: [
          {
            id: 'run-1',
            strategyId: 'strategy-1',
            strategyName: 'Momentum',
            status: 'needs_review',
            windowLabel: '30D',
            startedAt: '2026-03-13T10:00:00.000Z',
            completedAt: '2026-03-13T11:00:00.000Z',
            annualizedReturnPct: 10.5,
            maxDrawdownPct: 4.2,
            sharpe: 1.7,
            winRatePct: 54,
            turnoverPct: 18,
            summary: 'Needs review',
            workflowRunId: 'wf-1',
          },
        ],
        summary: {
          completedRuns: 1,
          reviewQueue: 1,
          dataSource: 'service',
        },
      },
      loading: false,
      error: '',
      auditItems: [
        {
          id: 'audit-1',
          type: 'backtest-run.reviewed',
          actor: 'risk@desk',
          title: 'Review completed',
          detail: 'Manual review approved the run.',
          createdAt: '2026-03-13T11:05:00.000Z',
          metadata: {
            runId: 'run-1',
            status: 'needs_review',
            workflowRunId: 'wf-1',
            annualizedReturnPct: 10.5,
            maxDrawdownPct: 4.2,
            sharpe: 1.7,
            winRatePct: 54,
          },
        },
      ],
      auditLoading: false,
      executionEntries: [
        {
          plan: {
            id: 'plan-1',
            workflowRunId: 'wf-exec-1',
            strategyId: 'strategy-1',
            strategyName: 'Momentum',
            mode: 'paper',
            status: 'ready',
            approvalState: 'pending',
            riskStatus: 'approved',
            summary: 'Paper plan',
            capital: 50000,
            orderCount: 3,
            orders: [],
            metadata: {},
            createdAt: '2026-03-13T11:30:00.000Z',
            updatedAt: '2026-03-13T11:35:00.000Z',
          },
          workflow: null,
          latestRuntime: null,
        },
      ],
      workflowRuns: [
        {
          id: 'wf-1',
          workflowId: 'task-orchestrator.backtest-run',
          workflowType: 'backtest',
          status: 'running',
          actor: 'worker',
          trigger: 'queued',
          attempt: 1,
          maxAttempts: 3,
          nextRunAt: '',
          lockedBy: '',
          lockedAt: '',
          createdAt: '2026-03-13T10:00:00.000Z',
          updatedAt: '2026-03-13T11:10:00.000Z',
          startedAt: '2026-03-13T10:00:00.000Z',
          completedAt: '',
          failedAt: '',
          steps: [
            { key: 'risk_review', status: 'completed' },
            { key: 'publish', status: 'running' },
          ],
          payload: {},
          result: null,
          error: null,
          metadata: {},
        },
      ],
      workspaceLoading: false,
    });
    mockUseBacktestRunDetail.mockReturnValue({
      data: {
        ok: true,
        run: {
          id: 'run-1',
          strategyId: 'strategy-1',
          strategyName: 'Momentum',
          status: 'needs_review',
          windowLabel: '30D',
          startedAt: '2026-03-13T10:00:00.000Z',
          annualizedReturnPct: 10.5,
          maxDrawdownPct: 4.2,
          sharpe: 1.7,
          winRatePct: 54,
          turnoverPct: 18,
          summary: 'Needs review',
          workflowRunId: 'wf-1',
        },
        strategy: {
          id: 'strategy-1',
          name: 'Momentum',
          family: 'trend',
          timeframe: '1d',
          universe: 'NASDAQ 100',
          status: 'candidate',
          score: 81,
          expectedReturnPct: 14.2,
          maxDrawdownPct: 6.4,
          sharpe: 1.9,
          summary: 'Candidate momentum strategy',
        },
        workflow: {
          id: 'wf-1',
          workflowId: 'task-orchestrator.backtest-run',
          workflowType: 'backtest',
          status: 'running',
          actor: 'worker',
          trigger: 'queued',
          attempt: 1,
          maxAttempts: 3,
          nextRunAt: '',
          lockedBy: '',
          lockedAt: '',
          createdAt: '2026-03-13T10:00:00.000Z',
          updatedAt: '2026-03-13T11:10:00.000Z',
          startedAt: '2026-03-13T10:00:00.000Z',
          completedAt: '',
          failedAt: '',
          steps: [
            { key: 'risk_review', status: 'completed' },
            { key: 'publish', status: 'running' },
          ],
          payload: {},
          result: null,
          error: null,
          metadata: {},
        },
      },
      loading: false,
      error: '',
    });

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/backtest?run=run-1&audit=audit-1&step=risk_review']}>
        <Routes>
          <Route path="/backtest" element={<BacktestPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(html).toContain('Selected Backtest Detail');
    expect(html).toContain('Open Strategy Detail');
    expect(html).toContain('Selected Research Event');
    expect(html).toContain('Review completed');
    expect(html).toContain('Selected Workflow Step');
    expect(html).toContain('risk_review');
  });
});
