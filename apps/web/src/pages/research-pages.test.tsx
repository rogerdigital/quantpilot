import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import StrategiesPage from './strategies/StrategiesPage.tsx';
import BacktestPage from './backtest/BacktestPage.tsx';
import { ExecutionPage } from './console/routes/ExecutionPage.tsx';

const mockUseResearchWorkspaceData = vi.fn();
const mockUseStrategyDetail = vi.fn();
const mockUseBacktestRunDetail = vi.fn();
const mockUseExecutionConsoleData = vi.fn();
const mockUseAuditFeed = vi.fn();
const mockUseSummary = vi.fn();

vi.mock('../store/trading-system/TradingSystemProvider.tsx', () => ({
  useTradingSystem: () => ({
    state: {
      marketClock: '2026-03-13 10:00',
      mode: 'hybrid',
      riskLevel: 'moderate',
      engineStatus: 'running',
      decisionSummary: 'BUY bias',
      decisionCopy: 'Runtime state copy',
      routeCopy: 'Execution route copy',
      controlPlane: {
        lastSyncAt: '2026-03-13T10:00:00.000Z',
      },
      integrationStatus: {
        broker: {
          connected: true,
          message: 'Broker connected',
        },
      },
      stockStates: [
        { symbol: 'AAPL', signal: 'BUY' },
        { symbol: 'MSFT', signal: 'SELL' },
      ],
      activityLog: [
        { id: 'activity-1', title: 'Synced' },
      ],
      approvalQueue: [],
    },
    session: {
      user: {
        id: 'operator-1',
        permissions: ['strategy:write', 'risk:review'],
      },
    },
    hasPermission: (permission: string) => permission === 'strategy:write' || permission === 'risk:review',
    approveLiveIntent: () => undefined,
    rejectLiveIntent: () => undefined,
    actionGuardNotice: null,
  }),
}));

vi.mock('../modules/console/console.i18n.tsx', async () => {
  const actual = await vi.importActual<typeof import('../modules/console/console.i18n.tsx')>('../modules/console/console.i18n.tsx');
  return {
    ...actual,
    useLocale: () => ({ locale: 'en' as const }),
  };
});

vi.mock('../modules/console/console.hooks.ts', async () => {
  const actual = await vi.importActual<typeof import('../modules/console/console.hooks.ts')>('../modules/console/console.hooks.ts');
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

vi.mock('../modules/console/useExecutionConsoleData.ts', () => ({
  useExecutionConsoleData: (...args: unknown[]) => mockUseExecutionConsoleData(...args),
}));

vi.mock('../modules/audit/useAuditFeed.ts', () => ({
  useAuditFeed: (...args: unknown[]) => mockUseAuditFeed(...args),
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

vi.mock('../components/layout/ConsoleChrome.tsx', () => ({
  ChartCanvas: ({ kind }: { kind: string }) => <div>{kind}</div>,
  SectionHeader: ({ title, copy }: { title: string; copy: string }) => <div>{title}{copy}</div>,
  TopMeta: () => <div>TopMeta</div>,
}));

vi.mock('../components/business/ConsoleTables.tsx', () => ({
  UniverseTable: () => <div>UniverseTable</div>,
  ActivityLog: () => <div>ActivityLog</div>,
  ApprovalQueueTable: () => <div>ApprovalQueueTable</div>,
  OrdersTable: ({ accountKey }: { accountKey: string }) => <div>{accountKey} OrdersTable</div>,
}));

describe('research workspace pages', () => {
  beforeEach(() => {
    mockUseSummary.mockReturnValue({ totalPnlPct: 12.4 });
    mockUseResearchWorkspaceData.mockReset();
    mockUseStrategyDetail.mockReset();
    mockUseBacktestRunDetail.mockReset();
    mockUseExecutionConsoleData.mockReset();
    mockUseAuditFeed.mockReset();
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
        workbench: {
          ok: true,
          asOf: '2026-03-13T11:10:00.000Z',
          summary: {
            totalStrategies: 1,
            activeStrategies: 1,
            candidateStrategies: 1,
            readyToPromote: 1,
            readyForExecution: 0,
            waitingForReport: 0,
            needsEvaluation: 0,
            blocked: 0,
            staleStrategies: 0,
            baselines: 1,
            champions: 1,
          },
          comparisonSummary: {
            baselineStrategyId: 'strategy-1',
            baselineStrategyName: 'Momentum',
            championStrategyId: 'strategy-1',
            championStrategyName: 'Momentum',
            baselineUpdatedAt: '2026-03-13T11:08:00.000Z',
            championUpdatedAt: '2026-03-13T11:09:00.000Z',
            comparedStrategies: 1,
            outperformingBaseline: 0,
            nearChampion: 0,
            trailingBaseline: 0,
          },
          lanes: [],
          promotionQueue: [
            {
              strategyId: 'strategy-1',
              strategyName: 'Momentum',
              strategyStatus: 'candidate',
              baseline: true,
              champion: true,
              latestRunId: 'run-1',
              latestRunLabel: '30D',
              latestResultId: 'result-1',
              latestResultStage: 'reviewed',
              latestResultStatus: 'completed',
              evaluationVerdict: 'promote',
              reportVerdict: 'promote',
              readiness: 'paper',
              recommendedAction: 'promote_to_paper',
              reportStatus: 'ready',
              reportTaskStatus: 'completed',
              annualizedReturnPct: 10.5,
              maxDrawdownPct: 4.2,
              sharpe: 1.7,
              excessReturnPct: 4.4,
              updatedAt: '2026-03-13T11:10:00.000Z',
            },
          ],
          comparisons: [
            {
              strategyId: 'strategy-1',
              strategyName: 'Momentum',
              strategyStatus: 'candidate',
              baseline: true,
              champion: true,
              latestRunId: 'run-1',
              latestRunLabel: '30D',
              resultVersion: 3,
              resultStage: 'reviewed',
              resultStatus: 'completed',
              annualizedReturnPct: 10.5,
              maxDrawdownPct: 4.2,
              sharpe: 1.7,
              excessReturnPct: 4.4,
              baselineReturnGapPct: 0,
              baselineSharpeGap: 0,
              baselineDrawdownGapPct: 0,
              championReturnGapPct: 0,
              championSharpeGap: 0,
              championDrawdownGapPct: 0,
              comparisonBand: 'champion',
              evaluationVerdict: 'promote',
              reportVerdict: 'promote',
              promotionReadiness: 'ready-promote',
              recommendedAction: 'promote_to_paper',
              updatedAt: '2026-03-13T11:10:00.000Z',
            },
          ],
          comparisonInsights: [
            {
              strategyId: 'strategy-1',
              strategyName: 'Momentum',
              strategyStatus: 'candidate',
              comparisonBand: 'champion',
              headline: 'Momentum is the current champion.',
              detail: 'Use this strategy as the current promotion ceiling.',
              baselineReturnGapPct: 0,
              championReturnGapPct: 0,
              baselineSharpeGap: 0,
              championSharpeGap: 0,
              updatedAt: '2026-03-13T11:10:00.000Z',
            },
          ],
          coverage: [],
          actionSummary: {
            total: 1,
            promote: 1,
            refreshBacktests: 0,
            evaluate: 0,
            latestCreatedAt: '2026-03-13T11:20:00.000Z',
          },
          recentActions: [
            {
              id: 'governance-1',
              type: 'research-governance.promote-strategies',
              title: 'Research governance: promote-strategies',
              detail: 'Promoted 1 strategies from the governance workbench.',
              actor: 'operator-1',
              level: 'info',
              createdAt: '2026-03-13T11:20:00.000Z',
              metadata: {
                successCount: 1,
                failuresCount: 0,
              },
            },
          ],
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
        latestResult: {
          id: 'result-1',
          runId: 'run-1',
          strategyId: 'strategy-1',
          strategyName: 'Momentum',
          version: 3,
          stage: 'reviewed',
          status: 'published',
          annualizedReturnPct: 10.5,
          maxDrawdownPct: 4.2,
          sharpe: 1.7,
          excessReturnPct: 3.1,
          summary: 'Reviewed result is ready for promotion.',
          generatedAt: '2026-03-13T11:02:00.000Z',
          updatedAt: '2026-03-13T11:03:00.000Z',
          metadata: {},
        },
        recentResults: [
          {
            id: 'result-1',
            runId: 'run-1',
            strategyId: 'strategy-1',
            strategyName: 'Momentum',
            version: 3,
            stage: 'reviewed',
            status: 'published',
            annualizedReturnPct: 10.5,
            maxDrawdownPct: 4.2,
            sharpe: 1.7,
            excessReturnPct: 3.1,
            summary: 'Reviewed result is ready for promotion.',
            generatedAt: '2026-03-13T11:02:00.000Z',
            updatedAt: '2026-03-13T11:03:00.000Z',
            metadata: {},
          },
        ],
        latestEvaluation: {
          id: 'evaluation-1',
          runId: 'run-1',
          resultId: 'result-1',
          strategyId: 'strategy-1',
          strategyName: 'Momentum',
          verdict: 'promote',
          scoreBand: 'strong',
          readiness: 'paper',
          recommendedAction: 'promote_to_paper',
          summary: 'The reviewed result is ready for paper promotion.',
          actor: 'research-lead',
          createdAt: '2026-03-13T11:04:00.000Z',
          metadata: {},
        },
        recentEvaluations: [
          {
            id: 'evaluation-1',
            runId: 'run-1',
            resultId: 'result-1',
            strategyId: 'strategy-1',
            strategyName: 'Momentum',
            verdict: 'promote',
            scoreBand: 'strong',
            readiness: 'paper',
            recommendedAction: 'promote_to_paper',
            summary: 'The reviewed result is ready for paper promotion.',
            actor: 'research-lead',
            createdAt: '2026-03-13T11:04:00.000Z',
            metadata: {},
          },
        ],
        recentReports: [
          {
            id: 'report-1',
            evaluationId: 'evaluation-1',
            workflowRunId: 'wf-report-1',
            runId: 'run-1',
            resultId: 'result-1',
            strategyId: 'strategy-1',
            strategyName: 'Momentum',
            title: 'Momentum promotion memo',
            verdict: 'promote',
            readiness: 'paper',
            executiveSummary: 'Promotion memo is aligned.',
            promotionCall: 'Promote to paper.',
            executionPreparation: 'Paper execution is ready.',
            riskNotes: 'Risk checks passed.',
            createdAt: '2026-03-13T11:05:00.000Z',
            updatedAt: '2026-03-13T11:06:00.000Z',
            metadata: {},
          },
        ],
        researchTasks: [
          {
            id: 'task-1',
            taskType: 'backtest-run',
            status: 'completed',
            title: 'Backtest Momentum',
            summary: 'Backtest task completed.',
            strategyId: 'strategy-1',
            strategyName: 'Momentum',
            workflowRunId: 'wf-1',
            runId: 'run-1',
            windowLabel: '30D',
            requestedBy: 'operator-1',
            lastActor: 'worker',
            resultLabel: 'result-1',
            latestCheckpoint: 'completed',
            priority: 'normal',
            createdAt: '2026-03-13T10:00:00.000Z',
            updatedAt: '2026-03-13T11:00:00.000Z',
            startedAt: '2026-03-13T10:00:00.000Z',
            completedAt: '2026-03-13T11:00:00.000Z',
            metadata: {},
          },
        ],
        workflows: [
          {
            id: 'wf-1',
            workflowId: 'task-orchestrator.backtest',
            workflowType: 'research',
            actor: 'operator-1',
            status: 'completed',
            trigger: 'manual',
            attempt: 1,
            maxAttempts: 3,
            nextRunAt: '',
            lockedBy: '',
            lockedAt: '',
            createdAt: '2026-03-13T10:00:00.000Z',
            updatedAt: '2026-03-13T11:00:00.000Z',
            startedAt: '2026-03-13T10:00:00.000Z',
            completedAt: '2026-03-13T11:00:00.000Z',
            failedAt: '',
            metadata: {},
            payload: {},
            result: { message: 'completed' },
            error: null,
            steps: [],
          },
        ],
        governanceActions: [
          {
            id: 'gov-1',
            type: 'research-governance.set-baseline',
            title: 'Research governance: set-baseline',
            detail: 'Updated baseline for Momentum.',
            actor: 'operator-1',
            level: 'info',
            createdAt: '2026-03-13T11:07:00.000Z',
            metadata: {},
          },
        ],
        replaySummary: {
          totalEvents: 6,
          registryEvents: 1,
          researchEvents: 3,
          reviewEvents: 2,
          governanceEvents: 1,
          executionEvents: 0,
          latestAt: '2026-03-13T11:07:00.000Z',
          latestRunId: 'run-1',
          latestResultId: 'result-1',
          latestEvaluationId: 'evaluation-1',
          latestReportId: 'report-1',
        },
        replayTimeline: [
          {
            id: 'governance-gov-1',
            eventType: 'governance',
            lane: 'Governance',
            title: 'Research governance: set-baseline',
            detail: 'Updated baseline for Momentum.',
            at: '2026-03-13T11:07:00.000Z',
            reference: 'strategy-1',
            metrics: [
              { label: 'Level', value: 'info' },
              { label: 'Actor', value: 'operator-1' },
            ],
          },
          {
            id: 'report-report-1',
            eventType: 'report',
            lane: 'Report',
            title: 'Momentum promotion memo',
            detail: 'Promotion memo is aligned.',
            at: '2026-03-13T11:06:00.000Z',
            reference: 'run-1',
            linkedRunId: 'run-1',
            linkedWorkflowRunId: 'wf-report-1',
            linkedResultId: 'result-1',
            metrics: [
              { label: 'Verdict', value: 'promote' },
              { label: 'Readiness', value: 'paper' },
            ],
          },
          {
            id: 'evaluation-evaluation-1',
            eventType: 'evaluation',
            lane: 'Evaluation',
            title: 'promote · paper',
            detail: 'The reviewed result is ready for paper promotion.',
            at: '2026-03-13T11:04:00.000Z',
            reference: 'run-1',
            linkedRunId: 'run-1',
            linkedResultId: 'result-1',
            metrics: [
              { label: 'Band', value: 'strong' },
              { label: 'Action', value: 'promote_to_paper' },
            ],
          },
          {
            id: 'result-result-1',
            eventType: 'result',
            lane: 'Result',
            title: 'v3 · reviewed',
            detail: 'Reviewed result is ready for promotion.',
            at: '2026-03-13T11:03:00.000Z',
            reference: 'run-1',
            linkedRunId: 'run-1',
            linkedResultId: 'result-1',
            metrics: [
              { label: 'Status', value: 'published' },
              { label: 'Excess', value: '3.1%' },
            ],
          },
          {
            id: 'run-run-1',
            eventType: 'run',
            lane: 'Backtest',
            title: '30D · completed',
            detail: 'Latest run',
            at: '2026-03-13T11:00:00.000Z',
            reference: 'run-1',
            linkedRunId: 'run-1',
            linkedWorkflowRunId: 'wf-1',
            metrics: [
              { label: 'Return', value: '10.5%' },
              { label: 'Sharpe', value: '1.70' },
            ],
          },
        ],
        promotionReadiness: {
          level: 'ready',
          headline: 'Research package is ready for execution prep.',
          recommendedAction: 'prepare_execution',
          reasons: ['Latest reviewed result is available.', 'Strategy is already in candidate stage.'],
        },
        executionCandidatePreview: {
          mode: 'paper',
          capital: 50000,
          orderCount: 2,
          riskStatus: 'approved',
          approvalState: 'required',
          summary: 'Candidate basket is ready for paper execution review.',
          reasons: ['Risk assessment passed baseline checks.', 'Two candidate orders were generated.'],
          orders: [
            {
              symbol: 'AAPL',
              side: 'buy',
              quantity: 12,
              orderType: 'limit',
              timeInForce: 'day',
              broker: 'alpaca',
              price: 180,
              estimatedNotional: 2160,
            },
            {
              symbol: 'MSFT',
              side: 'buy',
              quantity: 8,
              orderType: 'limit',
              timeInForce: 'day',
              broker: 'alpaca',
              price: 410,
              estimatedNotional: 3280,
            },
          ],
        },
        latestExecutionHandoff: {
          id: 'handoff-1',
          strategyId: 'strategy-1',
          strategyName: 'Momentum',
          strategyStatus: 'candidate',
          runId: 'run-1',
          resultId: 'result-1',
          evaluationId: 'evaluation-1',
          reportId: 'report-1',
          mode: 'paper',
          capital: 50000,
          orderCount: 2,
          baseline: true,
          champion: false,
          readiness: 'paper',
          verdict: 'prepare_execution',
          riskStatus: 'approved',
          approvalState: 'not_required',
          handoffStatus: 'ready',
          owner: 'execution-desk',
          summary: 'Execution desk handoff is ready.',
          reasons: ['Latest evaluation supports execution prep.'],
          orders: [],
          createdAt: '2026-03-13T11:07:00.000Z',
          updatedAt: '2026-03-13T11:08:00.000Z',
          metadata: {},
        },
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
    expect(html).toContain('Research Replay Summary');
    expect(html).toContain('Selected Timeline Event');
    expect(html).toContain('Open Backtest Detail');
    expect(html).toContain('Selected Strategy Research Runs');
    expect(html).toContain('Latest Research Result');
    expect(html).toContain('Promotion And Execution Readiness');
    expect(html).toContain('Latest Execution Handoff');
    expect(html).toContain('Research Governance Overview');
    expect(html).toContain('Baseline And Champion Analysis');
    expect(html).toContain('Strategy Promotion Queue');
    expect(html).toContain('Research Governance Actions');
    expect(html).toContain('Strategy Comparison Board');
    expect(html).toContain('Comparison Insights');
    expect(html).toContain('Recent Governance Actions');
    expect(html).toContain('Set Baseline');
    expect(html).toContain('Set Champion');
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
        governanceSummary: {
          total: 1,
          promote: 1,
          refreshBacktests: 0,
          evaluate: 0,
          latestCreatedAt: '2026-03-13T11:20:00.000Z',
        },
        handoffSummary: {
          total: 1,
          ready: 1,
          queued: 0,
          blocked: 0,
          paper: 1,
          live: 0,
        },
        workbench: {
          ok: true,
          asOf: '2026-03-13T11:10:00.000Z',
          summary: {
            totalStrategies: 1,
            activeStrategies: 1,
            candidateStrategies: 1,
            readyToPromote: 1,
            readyForExecution: 0,
            waitingForReport: 0,
            needsEvaluation: 0,
            blocked: 0,
            staleStrategies: 0,
            baselines: 1,
            champions: 1,
          },
          comparisonSummary: {
            baselineStrategyId: 'strategy-1',
            baselineStrategyName: 'Momentum',
            championStrategyId: 'strategy-1',
            championStrategyName: 'Momentum',
            baselineUpdatedAt: '2026-03-13T11:08:00.000Z',
            championUpdatedAt: '2026-03-13T11:09:00.000Z',
            comparedStrategies: 1,
            outperformingBaseline: 0,
            nearChampion: 0,
            trailingBaseline: 0,
          },
          lanes: [
            {
              key: 'ready-promote',
              label: 'Ready For Promotion',
              count: 1,
              headline: '1 strategies are ready for lifecycle promotion.',
              strategyIds: ['strategy-1'],
            },
          ],
          promotionQueue: [
            {
              strategyId: 'strategy-1',
              strategyName: 'Momentum',
              strategyStatus: 'candidate',
              baseline: true,
              champion: true,
              latestRunId: 'run-1',
              latestRunLabel: '30D',
              latestResultId: 'result-1',
              latestResultStage: 'reviewed',
              latestResultStatus: 'completed',
              evaluationVerdict: 'promote',
              reportVerdict: 'promote',
              readiness: 'paper',
              recommendedAction: 'promote_to_paper',
              reportStatus: 'ready',
              reportTaskStatus: 'completed',
              annualizedReturnPct: 10.5,
              maxDrawdownPct: 4.2,
              sharpe: 1.7,
              excessReturnPct: 4.4,
              updatedAt: '2026-03-13T11:10:00.000Z',
            },
          ],
          comparisons: [
            {
              strategyId: 'strategy-1',
              strategyName: 'Momentum',
              strategyStatus: 'candidate',
              baseline: true,
              champion: true,
              latestRunId: 'run-1',
              latestRunLabel: '30D',
              resultVersion: 3,
              resultStage: 'reviewed',
              resultStatus: 'completed',
              annualizedReturnPct: 10.5,
              maxDrawdownPct: 4.2,
              sharpe: 1.7,
              excessReturnPct: 4.4,
              baselineReturnGapPct: 0,
              baselineSharpeGap: 0,
              baselineDrawdownGapPct: 0,
              championReturnGapPct: 0,
              championSharpeGap: 0,
              championDrawdownGapPct: 0,
              comparisonBand: 'champion',
              evaluationVerdict: 'promote',
              reportVerdict: 'promote',
              promotionReadiness: 'ready-promote',
              recommendedAction: 'promote_to_paper',
              updatedAt: '2026-03-13T11:10:00.000Z',
            },
          ],
          comparisonInsights: [
            {
              strategyId: 'strategy-1',
              strategyName: 'Momentum',
              strategyStatus: 'candidate',
              comparisonBand: 'champion',
              headline: 'Momentum is the current champion.',
              detail: 'Use this strategy as the current promotion ceiling.',
              baselineReturnGapPct: 0,
              championReturnGapPct: 0,
              baselineSharpeGap: 0,
              championSharpeGap: 0,
              updatedAt: '2026-03-13T11:10:00.000Z',
            },
          ],
          coverage: [],
          actionSummary: {
            total: 1,
            promote: 1,
            refreshBacktests: 0,
            evaluate: 0,
            latestCreatedAt: '2026-03-13T11:20:00.000Z',
          },
          recentActions: [],
        },
        governanceActions: [
          {
            id: 'governance-1',
            type: 'research-governance.promote-strategies',
            title: 'Research governance: promote-strategies',
            detail: 'Promoted 1 strategies from the governance workbench.',
            actor: 'operator-1',
            level: 'info',
            createdAt: '2026-03-13T11:20:00.000Z',
            metadata: {},
          },
        ],
        handoffs: [
          {
            id: 'handoff-1',
            strategyId: 'strategy-1',
            strategyName: 'Momentum',
            strategyStatus: 'candidate',
            runId: 'run-1',
            resultId: 'result-1',
            evaluationId: 'evaluation-1',
            reportId: 'report-1',
            mode: 'paper',
            capital: 50000,
            orderCount: 2,
            baseline: true,
            champion: false,
            readiness: 'paper',
            verdict: 'prepare_execution',
            riskStatus: 'approved',
            approvalState: 'not_required',
            handoffStatus: 'ready',
            owner: 'execution-desk',
            summary: 'Execution desk handoff is ready.',
            reasons: ['Latest evaluation supports execution prep.'],
            orders: [],
            createdAt: '2026-03-13T11:08:00.000Z',
            updatedAt: '2026-03-13T11:08:00.000Z',
            metadata: {},
          },
        ],
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
        latestEvaluation: {
          id: 'evaluation-1',
          runId: 'run-1',
          resultId: 'result-1',
          strategyId: 'strategy-1',
          strategyName: 'Momentum',
          verdict: 'promote',
          scoreBand: 'strong',
          readiness: 'paper',
          recommendedAction: 'promote_to_paper',
          summary: 'The reviewed result is ready for paper promotion.',
          actor: 'research-lead',
          createdAt: '2026-03-13T11:06:00.000Z',
          metadata: {},
        },
        evaluations: [
          {
            id: 'evaluation-1',
            runId: 'run-1',
            resultId: 'result-1',
            strategyId: 'strategy-1',
            strategyName: 'Momentum',
            verdict: 'promote',
            scoreBand: 'strong',
            readiness: 'paper',
            recommendedAction: 'promote_to_paper',
            summary: 'The reviewed result is ready for paper promotion.',
            actor: 'research-lead',
            createdAt: '2026-03-13T11:06:00.000Z',
            metadata: {},
          },
        ],
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
    expect(html).toContain('Research Task Backbone');
    expect(html).toContain('Open Strategy Detail');
    expect(html).toContain('Selected Research Event');
    expect(html).toContain('Review completed');
    expect(html).toContain('Selected Workflow Step');
    expect(html).toContain('risk_review');
    expect(html).toContain('Evaluation And Promotion Guidance');
    expect(html).toContain('Research Evaluations');
    expect(html).toContain('Research Operations Workbench');
    expect(html).toContain('Promotion Governance Queue');
    expect(html).toContain('Research Governance Trail');
    expect(html).toContain('Execution Handoff Queue');
  });

  it('renders backtest page with strategy source context and execution handoff actions', () => {
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
            summary: 'Completed run',
            workflowRunId: 'wf-1',
          },
        ],
        summary: {
          completedRuns: 1,
          reviewQueue: 0,
          dataSource: 'service',
        },
      },
      loading: false,
      error: '',
      auditItems: [],
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
    mockUseBacktestRunDetail.mockReturnValue({
      data: {
        ok: true,
        run: {
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
          summary: 'Completed run',
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
        workflow: null,
      },
      loading: false,
      error: '',
    });

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/backtest?run=run-1&strategy=strategy-1&source=strategies']}>
        <Routes>
          <Route path="/backtest" element={<BacktestPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(html).toContain('Selected Backtest Detail');
    expect(html).toContain('Return to Strategy Timeline');
    expect(html).toContain('Open Execution Detail');
  });

  it('renders execution page with backtest source context and workflow step deep link', () => {
    mockUseExecutionConsoleData.mockReturnValue({
      runtimeEvents: [
        {
          id: 'runtime-1',
          cycle: 'cycle-1',
          executionPlanId: 'plan-1',
          executionRunId: 'exec-run-1',
          submittedOrderCount: 2,
          openOrderCount: 1,
          positionCount: 3,
          equity: 102400,
        },
      ],
      accountSnapshots: [
        {
          id: 'snapshot-1',
          provider: 'paper-broker',
          cycle: 'cycle-1',
          executionPlanId: 'plan-1',
          executionRunId: 'exec-run-1',
          connected: true,
          account: { cash: 54000 },
          positions: [{ symbol: 'AAPL' }],
          orders: [{ id: 'order-1' }],
          message: 'Snapshot synced',
        },
      ],
      handoffs: [
        {
          id: 'handoff-1',
          strategyId: 'strategy-1',
          strategyName: 'Momentum',
          strategyStatus: 'candidate',
          runId: 'run-1',
          resultId: 'result-1',
          evaluationId: 'evaluation-1',
          reportId: 'report-1',
          mode: 'paper',
          capital: 50000,
          orderCount: 2,
          baseline: true,
          champion: false,
          readiness: 'paper',
          verdict: 'prepare_execution',
          riskStatus: 'approved',
          approvalState: 'not_required',
          handoffStatus: 'ready',
          owner: 'execution-desk',
          summary: 'Execution desk handoff is ready.',
          reasons: ['Latest evaluation supports execution prep.'],
          orders: [],
          createdAt: '2026-03-13T11:08:00.000Z',
          updatedAt: '2026-03-13T11:08:00.000Z',
          metadata: {},
        },
      ],
      workbench: {
        ok: true,
        asOf: '2026-03-13T11:40:00.000Z',
        summary: {
          totalPlans: 1,
          awaitingApproval: 1,
          routing: 0,
          submitted: 0,
          acknowledged: 0,
          filled: 0,
          blocked: 0,
          cancelled: 0,
          failed: 0,
          aligned: 0,
          attention: 0,
          drift: 0,
          missingSnapshot: 1,
          totalOpenOrders: 0,
          syncedPositions: 1,
        },
        entries: [],
      },
      ledgerEntries: [
        {
          plan: {
            id: 'plan-1',
            workflowRunId: 'wf-exec-1',
            handoffId: 'handoff-1',
            executionRunId: 'exec-run-1',
            strategyId: 'strategy-1',
            strategyName: 'Momentum',
            mode: 'paper',
            status: 'ready',
            lifecycleStatus: 'awaiting_approval',
            approvalState: 'pending',
            riskStatus: 'approved',
            summary: 'Paper execution plan',
            capital: 50000,
            orderCount: 2,
            orders: [
              { symbol: 'AAPL' },
              { symbol: 'MSFT' },
            ],
            metadata: {},
            createdAt: '2026-03-13T11:30:00.000Z',
            updatedAt: '2026-03-13T11:35:00.000Z',
          },
          executionRun: {
            id: 'exec-run-1',
            executionPlanId: 'plan-1',
            workflowRunId: 'wf-exec-1',
            strategyId: 'strategy-1',
            strategyName: 'Momentum',
            mode: 'paper',
            lifecycleStatus: 'awaiting_approval',
            summary: 'Awaiting approval before routing.',
            owner: 'execution-desk',
            orderCount: 2,
            submittedOrderCount: 0,
            filledOrderCount: 0,
            rejectedOrderCount: 0,
            createdAt: '2026-03-13T11:30:00.000Z',
            updatedAt: '2026-03-13T11:35:00.000Z',
            completedAt: '',
            metadata: {},
          },
          orderStates: [
            {
              id: 'order-state-1',
              executionPlanId: 'plan-1',
              executionRunId: 'exec-run-1',
              symbol: 'AAPL',
              side: 'BUY',
              qty: 10,
              weight: 0.5,
              lifecycleStatus: 'planned',
              brokerOrderId: '',
              avgFillPrice: null,
              filledQty: 0,
              summary: 'Awaiting approval.',
              createdAt: '2026-03-13T11:31:00.000Z',
              updatedAt: '2026-03-13T11:31:00.000Z',
              submittedAt: '',
              acknowledgedAt: '',
              filledAt: '',
              metadata: {},
            },
          ],
          workflow: {
            id: 'wf-exec-1',
            status: 'running',
          },
          latestRuntime: {
            id: 'runtime-1',
            cycle: 'cycle-1',
            executionPlanId: 'plan-1',
            executionRunId: 'exec-run-1',
            submittedOrderCount: 2,
            openOrderCount: 1,
            equity: 102400,
            createdAt: '2026-03-13T11:40:00.000Z',
          },
          latestSnapshot: {
            id: 'snapshot-1',
            provider: 'paper-broker',
            cycle: 'cycle-1',
            executionPlanId: 'plan-1',
            executionRunId: 'exec-run-1',
            connected: true,
            account: { cash: 54000 },
            positions: [{ symbol: 'AAPL', qty: 10 }],
            orders: [{ id: 'order-1', filledQty: 0 }],
            message: 'Snapshot synced',
          },
          reconciliation: {
            status: 'missing_snapshot',
            issueCount: 1,
            latestSnapshotAt: '',
            orderCountDelta: 1,
            filledQtyDelta: 0,
            positionDelta: 0,
            issues: [{
              id: 'missing-snapshot',
              kind: 'snapshot',
              severity: 'warn',
              title: 'Broker snapshot missing',
              detail: 'No broker account snapshot has been recorded for this execution plan yet.',
              expected: 'A broker account snapshot linked to the plan',
              actual: 'No linked snapshot found',
            }],
          },
          recovery: {
            status: 'monitor',
            recommendedAction: 'reconcile',
            headline: 'Execution needs reconciliation review.',
            reasons: ['Reconciliation status is missing_snapshot.'],
          },
          brokerEvents: [
            {
              id: 'broker-event-1',
              executionPlanId: 'plan-1',
              executionRunId: 'exec-run-1',
              brokerOrderId: 'broker-order-1',
              symbol: 'AAPL',
              eventType: 'acknowledged',
              status: 'acknowledged',
              filledQty: 0,
              avgFillPrice: null,
              source: 'broker-webhook',
              actor: 'broker-webhook',
              headline: 'Broker acknowledged AAPL.',
              message: 'Broker acknowledged AAPL.',
              metadata: {},
              createdAt: '2026-03-13T11:42:00.000Z',
            },
          ],
        },
      ],
      workflowRuns: [
        {
          id: 'wf-exec-1',
          workflowId: 'task-orchestrator.strategy-execution',
          status: 'running',
          trigger: 'approved',
          attempt: 1,
          maxAttempts: 3,
          steps: [
            { key: 'broker_submit', status: 'completed' },
            { key: 'settlement_watch', status: 'running' },
          ],
        },
      ],
      operatorActions: [
        {
          id: 'action-1',
          type: 'approve-intent',
          symbol: 'AAPL',
          actor: 'risk@desk',
          createdAt: '2026-03-13T11:45:00.000Z',
        },
      ],
      loading: false,
      error: '',
    });
    mockUseAuditFeed.mockReturnValue({
      items: [
        {
          id: 'audit-1',
          type: 'execution-plan',
          actor: 'risk@desk',
          title: 'Execution approved',
          detail: 'Plan is ready for broker submit.',
          createdAt: '2026-03-13T11:35:00.000Z',
          metadata: {
            strategyId: 'strategy-1',
            orderCount: 2,
            capital: 50000,
            riskStatus: 'approved',
            approvalState: 'pending',
          },
        },
      ],
      loading: false,
    });

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/execution?plan=plan-1&strategy=strategy-1&run=run-1&source=backtest&step=settlement_watch']}>
        <Routes>
          <Route path="/execution" element={<ExecutionPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(html).toContain('Selected Execution Detail');
    expect(html).toContain('Research Execution Handoffs');
    expect(html).toContain('Execution Lifecycle Summary');
    expect(html).toContain('Execution Recovery Workbench');
    expect(html).toContain('Broker Event Ingestion');
    expect(html).toContain('Open Strategy Detail');
    expect(html).toContain('Approve Routing');
    expect(html).toContain('Broker Sync');
    expect(html).toContain('Ingest Ack');
    expect(html).toContain('Ingest Fill');
    expect(html).toContain('Simulate Partial Fill');
    expect(html).toContain('Cancel Plan');
    expect(html).toContain('Ingest Reject');
    expect(html).toContain('Execution Reconciliation');
    expect(html).toContain('Run Reconciliation');
    expect(html).toContain('Recover Plan');
    expect(html).toContain('Broker Event Timeline');
    expect(html).toContain('Order Lifecycle');
    expect(html).toContain('Return to Backtest Detail');
    expect(html).toContain('Selected Execution Workflow Step');
    expect(html).toContain('settlement_watch');
  });

  it('renders execution page with strategy source context and return action', () => {
    mockUseExecutionConsoleData.mockReturnValue({
      runtimeEvents: [
        {
          id: 'runtime-1',
          cycle: 'cycle-1',
          executionPlanId: 'plan-1',
          executionRunId: 'exec-run-1',
          submittedOrderCount: 2,
          openOrderCount: 1,
          positionCount: 3,
          equity: 102400,
        },
      ],
      accountSnapshots: [
        {
          id: 'snapshot-1',
          provider: 'paper-broker',
          cycle: 'cycle-1',
          executionPlanId: 'plan-1',
          executionRunId: 'exec-run-1',
          connected: true,
          account: { cash: 54000 },
          positions: [{ symbol: 'AAPL' }],
          orders: [{ id: 'order-1' }],
          message: 'Snapshot synced',
        },
      ],
      handoffs: [
        {
          id: 'handoff-1',
          strategyId: 'strategy-1',
          strategyName: 'Momentum',
          strategyStatus: 'candidate',
          runId: 'run-1',
          resultId: 'result-1',
          evaluationId: 'evaluation-1',
          reportId: 'report-1',
          mode: 'paper',
          capital: 50000,
          orderCount: 2,
          baseline: true,
          champion: false,
          readiness: 'paper',
          verdict: 'prepare_execution',
          riskStatus: 'approved',
          approvalState: 'not_required',
          handoffStatus: 'ready',
          owner: 'execution-desk',
          summary: 'Execution desk handoff is ready.',
          reasons: ['Latest evaluation supports execution prep.'],
          orders: [],
          createdAt: '2026-03-13T11:08:00.000Z',
          updatedAt: '2026-03-13T11:08:00.000Z',
          metadata: {},
        },
      ],
      workbench: {
        ok: true,
        asOf: '2026-03-13T11:40:00.000Z',
        summary: {
          totalPlans: 1,
          awaitingApproval: 0,
          routing: 0,
          submitted: 1,
          acknowledged: 0,
          filled: 0,
          blocked: 0,
          cancelled: 0,
          failed: 0,
          aligned: 1,
          attention: 0,
          drift: 0,
          missingSnapshot: 0,
          totalOpenOrders: 1,
          syncedPositions: 1,
          recoverablePlans: 0,
          retryScheduledWorkflows: 0,
          interventionNeeded: 0,
          brokerEvents: 1,
          rejectedBrokerEvents: 0,
          fillEvents: 0,
        },
        entries: [],
      },
      ledgerEntries: [
        {
          plan: {
            id: 'plan-1',
            workflowRunId: 'wf-exec-1',
            handoffId: 'handoff-1',
            executionRunId: 'exec-run-1',
            strategyId: 'strategy-1',
            strategyName: 'Momentum',
            mode: 'paper',
            status: 'ready',
            lifecycleStatus: 'submitted',
            approvalState: 'pending',
            riskStatus: 'approved',
            summary: 'Paper execution plan',
            capital: 50000,
            orderCount: 2,
            orders: [
              { symbol: 'AAPL' },
              { symbol: 'MSFT' },
            ],
            metadata: {},
            createdAt: '2026-03-13T11:30:00.000Z',
            updatedAt: '2026-03-13T11:35:00.000Z',
          },
          executionRun: {
            id: 'exec-run-1',
            executionPlanId: 'plan-1',
            workflowRunId: 'wf-exec-1',
            strategyId: 'strategy-1',
            strategyName: 'Momentum',
            mode: 'paper',
            lifecycleStatus: 'submitted',
            summary: 'Submitted into broker route.',
            owner: 'execution-desk',
            orderCount: 2,
            submittedOrderCount: 2,
            filledOrderCount: 0,
            rejectedOrderCount: 0,
            createdAt: '2026-03-13T11:30:00.000Z',
            updatedAt: '2026-03-13T11:35:00.000Z',
            completedAt: '',
            metadata: {},
          },
          orderStates: [],
          workflow: {
            id: 'wf-exec-1',
            status: 'running',
          },
          latestRuntime: {
            id: 'runtime-1',
            cycle: 'cycle-1',
            executionPlanId: 'plan-1',
            executionRunId: 'exec-run-1',
            submittedOrderCount: 2,
            openOrderCount: 1,
            equity: 102400,
            createdAt: '2026-03-13T11:40:00.000Z',
          },
          latestSnapshot: {
            id: 'snapshot-1',
            provider: 'paper-broker',
            cycle: 'cycle-1',
            executionPlanId: 'plan-1',
            executionRunId: 'exec-run-1',
            connected: true,
            account: { cash: 54000 },
            positions: [{ symbol: 'AAPL', qty: 10 }],
            orders: [{ id: 'order-1', filledQty: 2 }],
            message: 'Snapshot synced',
          },
          reconciliation: {
            status: 'aligned',
            issueCount: 0,
            latestSnapshotAt: '2026-03-13T11:40:00.000Z',
            orderCountDelta: 0,
            filledQtyDelta: 0,
            positionDelta: 0,
            issues: [],
          },
          recovery: {
            status: 'monitor',
            recommendedAction: 'none',
            headline: 'Execution is inside the current recovery guardrails.',
            reasons: [],
          },
          brokerEvents: [
            {
              id: 'broker-event-2',
              executionPlanId: 'plan-1',
              executionRunId: 'exec-run-1',
              brokerOrderId: 'broker-order-2',
              symbol: 'AAPL',
              eventType: 'filled',
              status: 'filled',
              filledQty: 2,
              avgFillPrice: 181.5,
              source: 'broker-webhook',
              actor: 'broker-webhook',
              headline: 'Broker reported a full fill for AAPL.',
              message: 'filled event',
              metadata: {},
              createdAt: '2026-03-13T11:42:00.000Z',
            },
          ],
        },
      ],
      workflowRuns: [
        {
          id: 'wf-exec-1',
          workflowId: 'task-orchestrator.strategy-execution',
          status: 'running',
          trigger: 'approved',
          attempt: 1,
          maxAttempts: 3,
          steps: [
            { key: 'broker_submit', status: 'completed' },
            { key: 'settlement_watch', status: 'running' },
          ],
        },
      ],
      operatorActions: [],
      loading: false,
      error: '',
    });
    mockUseAuditFeed.mockReturnValue({
      items: [
        {
          id: 'audit-1',
          type: 'execution-plan',
          actor: 'risk@desk',
          title: 'Execution approved',
          detail: 'Plan is ready for broker submit.',
          createdAt: '2026-03-13T11:35:00.000Z',
          metadata: {
            strategyId: 'strategy-1',
            orderCount: 2,
            capital: 50000,
            riskStatus: 'approved',
            approvalState: 'pending',
          },
        },
      ],
      loading: false,
    });

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/execution?plan=plan-1&strategy=strategy-1&timeline=execution-plan-1&source=strategies']}>
        <Routes>
          <Route path="/execution" element={<ExecutionPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(html).toContain('Selected Execution Detail');
    expect(html).toContain('Research Execution Handoffs');
    expect(html).toContain('Open Strategy Detail');
    expect(html).toContain('Broker Sync');
    expect(html).toContain('Cancel Plan');
    expect(html).toContain('Execution Reconciliation');
    expect(html).toContain('Return to Strategy Timeline');
    expect(html).not.toContain('Return to Backtest Detail');
  });
});
